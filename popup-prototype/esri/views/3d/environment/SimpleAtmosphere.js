define([
  "dojo/text!./materials/SimpleAtmosphereMaterial.xml",

  "dojo/Deferred",

  "../../../core/watchUtils",

  "../support/ExternalRenderer",

  "../lib/glMatrix",

  "../webgl-engine/lib/GeometryRenderer",
  "../webgl-engine/lib/VertexBufferLayout",
  "../webgl-engine/lib/Texture",
  "../webgl-engine/lib/Util",
  "../webgl-engine/lib/GLSLProgram",
  "../webgl-engine/lib/GLTextureRep",

  "./resources/SimpleAtmosphereTexture",

  "../support/earthUtils"
], function(
  SimpleAtmosphereMaterialXML,
  Deferred,
  watchUtils,
  ExternalRenderer,
  glMatrix,
  GeometryRenderer, VertexBufferLayout, Texture, Util, GLSLProgram, GLTextureRep,
  SimpleAtmosphereTexture,
  earthUtils
) {

  var EARTH_RADIUS = earthUtils.earthRadius;
  var vec3d = glMatrix.vec3d;
  var vec2d = glMatrix.vec2d;
  var mat4d = glMatrix.mat4d;
  var VertexAttrConstants = Util.VertexAttrConstants;

  var ATMOSPHERE_RIM_SEGMENTS = 128;
  var ATMOSPHERE_RIM_INNER_WIDTH = 10000;
  var ATMOSPHERE_RIM_OUTER_WIDTH = 300000;

  var INNER_RIM_FACTOR = (EARTH_RADIUS - ATMOSPHERE_RIM_INNER_WIDTH) / EARTH_RADIUS;
  var OUTER_RIM_FACTOR = (EARTH_RADIUS + ATMOSPHERE_RIM_OUTER_WIDTH) / EARTH_RADIUS;

  var TEXV0 = -ATMOSPHERE_RIM_INNER_WIDTH / ATMOSPHERE_RIM_OUTER_WIDTH;
  var TEXV1 = 1;
  var TEXVSCALE = TEXV1 - TEXV0;

  var CONST_ELEVATION = 50;

  var ON_GROUND_VMIN_50 = 1 - 511 / 512;
  var ON_GROUND_VMAX_50 = 1 - 460 / 512;

  var ON_GROUND_VMIN_500 = 1 - 511 / 512;
  var ON_GROUND_VMAX_500 = 1 - 400 / 512;

  var ON_GROUND_VMIN_5000 = 1 - 511 / 512;
  var ON_GROUND_VMAX_5000 = 1 - 250 / 512;

  var ON_GROUND_VMIN_50000 = 1 - 511 / 512;
  var ON_GROUND_VMAX_50000 = 1 - 300 / 512;

  var HEIGHT_50 = 50.0;
  var HEIGHT_500 = 500.0;
  var HEIGHT_5000 = 5000.0;
  var HEIGHT_50000 = 50000.0;

  var SimpleAtmosphere = ExternalRenderer.createSubclass({
    declaredClass: "esri.views.3d.environment.SimpleAtmosphere",

    classMetadata: {
      properties: {
        view: {},

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
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._renderData = {
        texV: vec2d.create(),
        silCircleCenter: vec3d.create(),
        silCircleV1: vec3d.create(),
        silCircleV2: vec3d.create()
      };

      this._texture = null;
      this._textureRep = null;
    },

    initialize: function() {
      this._textureDfd = new Deferred();
      this.addResolvingPromise(this._textureDfd.promise);
    },

    destroy: function() {
      if (this._currentViewChangedHandle) {
        this._currentViewChangedHandle.remove();
        this._currentViewChangedHandle = null;
      }

      if (this._textureRep) {
        if (this._texture) {
          this._textureRep.release("SimpleAtmosphere");
          this._textureRep.getTexture("SimpleAtmosphere").unload();
        }

        this._textureRep = null;
      }

      if (this._program) {
        this._program.dispose();
        this._program = null;
      }

      if (this._textureDfd) {
        this._textureDfd.cancel();
        this._textureDfd = null;
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    initializeRenderContext: function(context) {
      this._textureRep = new GLTextureRep({
        SimpleAtmosphere: new Texture(SimpleAtmosphereTexture, "SimpleAtmosphere", {
          wrapClamp: true
        })
      }, context.programRep, function() {
        return this.view._stage.getCamera().viewport;
      }.bind(this), context.gl);

      this._texture = this._textureRep.aquire("SimpleAtmosphere", undefined, undefined, function() {
        this._textureDfd.resolve();
        this._textureDfd = null;
      }.bind(this));
    },

    setup: function(context) {
      var geometryData = this._createRibbonGeometryData();

      this._renderer = new GeometryRenderer(geometryData, VertexBufferLayout.Defaults.Pos, null, context.gl);

      this._currentViewChangedHandle = watchUtils.on(this, "view.navigation", "currentViewChanged", (function(ev) {
        this._update(ev.camera);
      }).bind(this), function() {
        this._update(this.get("view.navigation.currentCamera"));
      }.bind(this));

      if (!context.shaderSnippets.vsSimpleAtmosphere) {
        context.shaderSnippets._parse(SimpleAtmosphereMaterialXML);
      }

      this._program = GLSLProgram.fromSnippets("vsSimpleAtmosphere", "fsSimpleAtmosphere", context.shaderSnippets, context.gl);
    },

    render: function(context) {
      if (context.slot !== this.slot || context.pass !== "material") {
        return false;
      }

      var gl = this.renderContext.gl,
        program = this._program;

      program.use();
      program.uniform4f("color", 1.0, 1.0, 1.0, 1.0);

      program.uniformMatrix4fv("proj", context.camera.projectionMatrix);
      program.uniformMatrix4fv("view", context.camera.viewMatrix);

      program.uniform3fv("silCircleCenter", this._renderData.silCircleCenter);
      program.uniform3fv("silCircleV1", this._renderData.silCircleV1);
      program.uniform3fv("silCircleV2", this._renderData.silCircleV2);
      program.uniform2fv("texV", this._renderData.texV);

      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      program.uniform1i("tex", 0);

      program.uniform3fv("lightDirection", context.lightingData.getLightDirection());

      if (gl.web3DDefaultState.depthFunc !== gl.LEQUAL) {
        gl.depthFunc(gl.LEQUAL);
      }

      gl.depthMask(false);
      gl.enable(gl.BLEND);

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

    _update: function(camera) {
      if (vec3d.length(camera.eye) <= EARTH_RADIUS) {
        return;
      }

      var tmpV1 = vec3d.create(),
        tmpV2 = vec3d.create();
      var tmpEye = vec3d.create();
      var R = EARTH_RADIUS;
      var height = this.view.renderCoordsHelper.getAltitude(camera.eye);

      vec3d.scale(camera.eye, (R + CONST_ELEVATION) / vec3d.length(camera.eye), tmpEye);
      this._computeSilhouetteCircle(tmpEye, camera.center, camera.up, R);

      vec3d.add(this._renderData.silCircleCenter, this._renderData.silCircleV2, tmpV1);
      vec3d.scale(tmpV1, OUTER_RIM_FACTOR, tmpV2);
      var maxRimWidthOnScreen = this._computeScreenRimWidth(tmpEye, camera.up, tmpV1, tmpV2);

      var minGround = 0.0;
      var maxGround = 1.0;
      var scalar = 1.0;

      if (height < HEIGHT_50) {
        minGround = ON_GROUND_VMIN_50;
        maxGround = ON_GROUND_VMAX_50;
      } else if (height < HEIGHT_500) {
        scalar = (height - HEIGHT_50) / (HEIGHT_500 - HEIGHT_50);
        minGround = (1 - scalar) * ON_GROUND_VMIN_50 + scalar * ON_GROUND_VMIN_500;
        maxGround = (1 - scalar) * ON_GROUND_VMAX_50 + scalar * ON_GROUND_VMAX_500;
      } else if (height < HEIGHT_5000) {
        scalar = (height - HEIGHT_500) / (HEIGHT_5000 - HEIGHT_500);
        minGround = (1 - scalar) * ON_GROUND_VMIN_500 + scalar * ON_GROUND_VMIN_5000;
        maxGround = (1 - scalar) * ON_GROUND_VMAX_500 + scalar * ON_GROUND_VMAX_5000;
      } else if (height < HEIGHT_50000) {
        scalar = (height - HEIGHT_5000) / (HEIGHT_50000 - HEIGHT_5000);
        minGround = (1 - scalar) * ON_GROUND_VMIN_5000 + scalar * ON_GROUND_VMIN_50000;
        maxGround = (1 - scalar) * ON_GROUND_VMAX_5000 + scalar * ON_GROUND_VMAX_50000;
      }

      var v1 = TEXV0 + minGround * TEXVSCALE;
      var v2 = TEXV0 + maxRimWidthOnScreen * maxGround * TEXVSCALE;

      if (vec3d.length(camera.eye) - R > CONST_ELEVATION) {
        this._computeSilhouetteCircle(camera.eye, camera.center, camera.up, R);
        vec3d.add(this._renderData.silCircleCenter, this._renderData.silCircleV2, tmpV1);
        vec3d.scale(tmpV1, OUTER_RIM_FACTOR, tmpV2);

        var curRimWidthOnScreen = this._computeScreenRimWidth(camera.eye, camera.up, tmpV1, tmpV2);
        var texScaleFactor = Util.clamp((curRimWidthOnScreen - 1.5) / (maxRimWidthOnScreen - 1.5), 0, 1);

        v1 = TEXV0 + texScaleFactor * minGround * TEXVSCALE;
        v2 = TEXV0 + Util.lerp(TEXV1, maxRimWidthOnScreen * maxGround, texScaleFactor) * TEXVSCALE;
      }

      vec2d.set2(v1, v2, this._renderData.texV);

      this.needsRender = true;
    },

    // Ribbon Atmosphere
    _computeSilhouetteCircle: function(eye, lookAt, up, R) {
      // R: earth radius
      // E: distance from origin to eye
      // d: distance from eye to silhouette circle
      // r: silhouette circle radius
      // c: distance from origin to center of silhouette circle
      var E = vec3d.length(eye);
      var d = Math.sqrt(E * E - R * R);
      var r = R * d / E;
      var c = Math.sqrt(R * R - r * r);

      var e1 = this._renderData.silCircleV1;
      var e2 = this._renderData.silCircleV2;

      vec3d.scale(eye, c / E, this._renderData.silCircleCenter);
      vec3d.cross(eye, lookAt, e1);

      if (vec3d.length2(e1) < 1) {
        // if eye and lookAt are co-linear, use up vector to find vector pointing to the side
        vec3d.cross(eye, up, e1);
      }

      vec3d.scale(e1, r / vec3d.length(e1));
      vec3d.cross(e1, eye, e2);
      vec3d.scale(e2, r / vec3d.length(e2));

      return r;
    },

    _computeScreenRimWidth: function(eye, up, p1, p2) {
      var tmpView = mat4d.create();
      mat4d.lookAt(eye, p1, up, tmpView);

      var camera = this.view.navigation.currentCamera;

      Util.project(p1, tmpView, camera.projectionMatrix, camera.viewport);
      Util.project(p2, tmpView, camera.projectionMatrix, camera.viewport);

      return vec3d.dist(p1, p2) / camera.height;
    },

    _createRibbonGeometryData: function() {
      var verts = new Float32Array(ATMOSPHERE_RIM_SEGMENTS * 3 * 2);
      var vertexIndices = new Uint32Array(ATMOSPHERE_RIM_SEGMENTS * 3 * 2);

      for (var i = 0; i < ATMOSPHERE_RIM_SEGMENTS; i++) {
        var offs = i * 6;

        verts[offs + 0] = i;
        verts[offs + 1] = INNER_RIM_FACTOR;
        verts[offs + 2] = 0;
        verts[offs + 3] = i;
        verts[offs + 4] = OUTER_RIM_FACTOR;
        verts[offs + 5] = 1;

        var i2 = 2 * i;
        var i2next = (i === ATMOSPHERE_RIM_SEGMENTS - 1) ? 0 : i2 + 2;

        vertexIndices[offs + 0] = i2;
        vertexIndices[offs + 1] = i2 + 1;
        vertexIndices[offs + 2] = i2next + 1;
        vertexIndices[offs + 3] = i2next + 1;
        vertexIndices[offs + 4] = i2next;
        vertexIndices[offs + 5] = i2;
      }

      var indexObj = {};
      indexObj[VertexAttrConstants.POSITION] = vertexIndices;

      var vertexAttr = {};

      vertexAttr[VertexAttrConstants.POSITION] = {
        size: 3,
        data: verts
      };

      var faces = {
        type: "triangle",
        indices: indexObj,
        positionKey: VertexAttrConstants.POSITION
      };

      return {
        faces: faces,
        vertexAttr: vertexAttr
      };
    }
  });

  return SimpleAtmosphere;
});
