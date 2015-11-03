define([
  "dojo/text!./materials/StarMaterial.xml",
  "require",

  "../../../request",

  "../../../core/watchUtils",
  "../../../core/promiseUtils",

  "../lib/glMatrix",
  "../support/ExternalRenderer",

  "../webgl-engine/lib/GeometryRenderer",
  "../webgl-engine/lib/Util",
  "../webgl-engine/lib/VertexBufferLayout",
  "../webgl-engine/materials/internal/MaterialUtil",
  "../webgl-engine/lib/GLSLProgram",
  "../webgl-engine/lib/webglConstants"
], function(
  StarMaterialXML, require,
  esriRequest,
  watchUtils, promiseUtils,
  glMatrix,
  ExternalRenderer,
  GeometryRenderer, Util, VertexBufferLayout, MaterialUtil, GLSLProgram, webglConstants
) {
  var mat4d = glMatrix.mat4d;
  var mat3d = glMatrix.mat3d;

  var VertexAttrConstants = Util.VertexAttrConstants;

  // Coloration based on http://tonightsky.free.fr/all-sky-map/ authored by Thomas Boch
  // Number of Colors is halfed to reduce data
  var STAR_COLOR_VALUES = [
    "9bb2ff", "9eb5ff", "aabfff", "bbccff", "ccd8ff ", "dae2ff", "e4e9ff",
    "eeefff", "f8f6ff", "fff9fb", "fff5ef", "fff1e5", "ffeddb", "ffe9d2",
    "ffe6ca", "ffe3c3", "ffe0bb", "ffddb4", "ffdaad", "ffd6a5", "ffd29c",
    "ffcc8f", "ffc178", "ffa94b", "ff7b00"
  ];

  /* static matrices
   * cos(obliquity=23.44°) = 0.91747714052
   * sin(obliquity=23.44°) = 0.39778850739
   * matrices are with e=opliquity and a switch sign depending on the direction of the transformation
   * based on https://en.wikipedia.org/wiki/Ecliptic_coordinate_system
   *
   * | 1       0        0  0 |
   * | 0   cos(e) +-sin(e) 0 |
   * | 0 -+sin(e)   cos(e) 0 |
   * | 0       0        0  1 |
   *
   */
  var ec2eq = mat3d.toMat4(mat3d.createFrom(1, 0, 0,
    0, 0.9174771405229186, 0.39778850739794974,
    0, -0.39778850739794974, 0.9174771405229186));

  var eq2ec = mat3d.toMat4(mat3d.createFrom(1, 0, 0,
    0, 0.9174771405229186, -0.39778850739794974,
    0, 0.39778850739794974, 0.9174771405229186));

  var cachedStarData = null;

  var Stars = ExternalRenderer.createSubclass({
    classMetadata: {
      properties: {
        view: {},

        numBinaryFloats: {
          value: 2
        },

        numBinaryUInt8: {
          value: 1
        },

        bytesPerStar: {
          value: 9 // FLOAT, FLOAT, BYTE
        },

        slot: {
          value: 0,

          setter: function(v) {
            this.needsRender = true;
            return v;
          }
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._renderData = {
        model: mat4d.identity()
      };

      this.slot = 0;

      this._vertexBufferLayout = new VertexBufferLayout(
        [VertexAttrConstants.POSITION, VertexAttrConstants.COLOR, VertexAttrConstants.SIZE],
        [3, 4, 1],
        [webglConstants.FLOAT, webglConstants.UNSIGNED_BYTE, webglConstants.FLOAT]
      );
    },

    initialize: function() {
      this._loadDataPromise = this._loadBrightStarCatalogue();
      this.addResolvingPromise(this._loadDataPromise);
    },

    destroy: function() {
      if (!this._loadDataPromise.isFulfilled()) {
        this._loadDataPromise.cancel("Atmosphere has been removed.");
      }

      if (this._dateHandle) {
        this._dateHandle.remove();
        this._dateHandle = null;
      }

      if (this._program) {
        this._program.dispose();
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    setup: function(context) {
      this._numStars = this._starData.byteLength / this.bytesPerStar;

      var starsPosArray = new Float32Array(this._starData, 0, this._numStars * this.numBinaryFloats);
      var starsAttrArray = new Uint8Array(this._starData, this._numStars * this.numBinaryFloats * 4, this._numStars * this.numBinaryUInt8);

      var geometryData = this._createStarGeometryData(starsPosArray, starsAttrArray);

      this._renderer = new GeometryRenderer(geometryData, this._vertexBufferLayout, this._fillInterleaved, context.gl);
      this._renderer.enablePointRendering(true);

      this._dateHandle = watchUtils.init(this, "view.environment.lighting.data", this._update.bind(this));

      if (!context.shaderSnippets.vertexShaderStar) {
        context.shaderSnippets._parse(StarMaterialXML);
      }

      this._program = GLSLProgram.fromSnippets("vertexShaderStar", "fragmentShaderStar", context.shaderSnippets, context.gl);
    },

    render: function(context) {
      if (context.slot !== this.slot || context.pass !== "material") {
        return false;
      }

      var gl = this.renderContext.gl,
        program = this._program;

      program.use();
      program.uniformMatrix4fv("view", context.camera.viewMatrix);
      program.uniformMatrix4fv("proj", context.camera.projectionMatrix);
      program.uniform4fv("viewport", context.camera.viewport);
      program.uniformMatrix4fv("model", this._renderData.model);

      if (gl.web3DDefaultState.depthFunc !== gl.LEQUAL) {
        gl.depthFunc(gl.LEQUAL);
      }

      gl.enable(gl.BLEND);
      gl.depthMask(false);

      this._renderer.render(this._program);

      GLSLProgram.unuse(gl);

      gl.depthMask(true);
      gl.disable(gl.BLEND);

      if (gl.web3DDefaultState.depthFunc !== gl.LEQUAL) {
        gl.depthFunc(gl.web3DDefaultState.depthFunc);
      }

      return true;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _fillInterleaved: function(geomData, transformation, invTranspTransformation, instanceParams, vertexBufferLayout, dst, offset) {
      // this function is executed in the context of GeometryRenderer
      var stride = vertexBufferLayout.getStride();
      var stride4 = stride * 4;

      var fill = MaterialUtil.fill;

      var vboAttrs = vertexBufferLayout.getAttributes();

      var indPos = geomData.faces.indices[VertexAttrConstants.POSITION];
      var pos = geomData.vertexAttr[VertexAttrConstants.POSITION].data;
      var offs = offset + vboAttrs[VertexAttrConstants.POSITION].offset;

      for (var j = 0; j < indPos.length; ++j) {
        var j3 = 3 * indPos[j];

        fill(pos, j3, dst, offs, transformation, 3);
        offs += stride;
      }

      var indColor = geomData.faces.indices[VertexAttrConstants.COLOR];
      var color = geomData.vertexAttr[VertexAttrConstants.COLOR].data;

      offs = (offset + vboAttrs[VertexAttrConstants.COLOR].offset) * 4;

      var dstByteBuffer = new Uint8Array(dst.buffer);

      for (j = 0; j < indColor.length; ++j) {
        j3 = 4 * indColor[j];

        fill(color, j3, dstByteBuffer, offs, null, 4);

        offs += stride4;
      }

      var indSize = geomData.faces.indices[VertexAttrConstants.SIZE];
      var size = geomData.vertexAttr[VertexAttrConstants.SIZE].data;

      offs = offset + vboAttrs[VertexAttrConstants.SIZE].offset;

      for (j = 0; j < indSize.length; ++j) {
        var sx = size[indSize[j]];

        dst[offs] = sx;
        offs += stride;
      }
    },

    _computeDayDuration: function(date) {
      var current = date;

      // date of record of stars
      var start = new Date(date.getFullYear(), 0, 1, 11, 58, 56);

      // exactly one year later up to precision
      var end = new Date(date.getFullYear() + 1, 0, 1, 11, 58, 55);

      return (current - start) / (end - start);
    },

    _update: function(date) {
      if (!date) {
        return;
      }

      // scale to  [0,2] as rotation matrix coeffcient
      var hours = date.getHours() / 12;
      var minutes = (date.getMinutes() / 60) * (2 / 24);
      var seconds = (date.getSeconds() / 60) * (2 / (24 * 60));

      // 11:58:56 in a scale from [0,2] for a day, time of collection of the star positions
      var startOffset = 0.9972222;

      var dailyRotCoeff = (hours + minutes + seconds - startOffset) % 2.0;

      // scale to [0, 2]
      var yearlyRotCoeff = 2.0 * this._computeDayDuration(date);

      var rotation = mat4d.create(eq2ec);

      mat4d.rotateZ(rotation, -yearlyRotCoeff * Math.PI);
      mat4d.multiply(ec2eq, rotation, rotation);
      mat4d.rotateZ(rotation, -dailyRotCoeff * Math.PI);

      this._renderData.model = rotation;
      this.needsRender = true;
    },

    _hexToRGB: function(h) {
      return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16)
      ];
    },

    _unpackUint8Attributes: function(packed) {
      // if (packed >= 224) { return [2.9, packed - 224]; } unused bit position

      if (packed >= 192) {
        return [2.9, packed - 192];
      }
      if (packed >= 160) {
        return [2.5, packed - 160];
      }
      if (packed >= 128) {
        return [2.0, packed - 128];
      }
      if (packed >= 96) {
        return [1.5, packed - 96];
      }
      if (packed >= 64) {
        return [1.0, packed - 64];
      }
      if (packed >= 32) {
        return [0.7, packed - 32];
      }

      return [0.4, packed];
    },

    _createStarGeometryData: function(starPosArray, starAttrArray) {
      // based on GeometryUtil.createPointGeometry
      var vertices = new Float32Array(this._numStars * 3);
      var colors = new Uint8Array(this._numStars * 4);
      var sizes = new Float32Array(this._numStars);
      var indices2 = new Uint32Array(this._numStars);

      for (var i = 0; i < this._numStars; i++) {
        var offs2 = i * 2;
        var offs3 = i * 3;
        var offs4 = i * 4;

        var ra = starPosArray[offs2 + 0];
        var dec = starPosArray[offs2 + 1];

        vertices[offs3 + 0] = -Math.cos(ra) * Math.sin(dec);
        vertices[offs3 + 1] = -Math.sin(ra) * Math.sin(dec);
        vertices[offs3 + 2] = -Math.cos(dec);

        var unpackedVals = this._unpackUint8Attributes(starAttrArray[i]);

        var unpackedColor = this._hexToRGB(STAR_COLOR_VALUES[unpackedVals[1]]);

        colors[offs4 + 0] = unpackedColor[0] * 255.0;
        colors[offs4 + 1] = unpackedColor[1] * 255.0;
        colors[offs4 + 2] = unpackedColor[2] * 255.0;
        colors[offs4 + 3] = 255.0;

        sizes[i] = unpackedVals[0];
        indices2[i] = i;
      }

      var indices3 = {};

      indices3[VertexAttrConstants.POSITION] = indices2;
      indices3[VertexAttrConstants.NORMAL] = indices2;
      indices3[VertexAttrConstants.UV0] = indices2;
      indices3[VertexAttrConstants.COLOR] = indices2;
      indices3[VertexAttrConstants.SIZE] = indices2;

      var vertexAttr = {};

      vertexAttr[VertexAttrConstants.POSITION] = {
        size: 3,
        data: vertices
      };

      vertexAttr[VertexAttrConstants.COLOR] = {
        size: 4,
        data: colors
      };

      vertexAttr[VertexAttrConstants.SIZE] = {
        size: 1,
        data: sizes
      };

      var faces = {
        type: "point",
        indices: indices3,
        positionKey: VertexAttrConstants.POSITION
      };

      return {
        faces: faces,
        vertexAttr: vertexAttr
      };
    },

    _loadBrightStarCatalogue: function() {
      if (cachedStarData) {
        this._starData = cachedStarData;
        return promiseUtils.resolve();
      }

      return esriRequest({
        url: require.toUrl("./resources/stars.wsv"),
        handleAs: "arraybuffer",
        failOk: true
      })
        .then(function(data) {
          if (data) {
            cachedStarData = data;
            this._starData = data;
          } else {
            throw new Error("no data received");
          }
        }.bind(this))
        .otherwise(function(err) {
          console.error("Failed to load star data:", err);
          throw err;
        });
    }
  });

  return Stars;
});
