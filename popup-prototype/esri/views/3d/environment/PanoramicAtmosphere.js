define([
  "dojo/text!./materials/SimpleAtmosphereMaterial.xml",

  "dojo/Deferred",

  "../support/ExternalRenderer",

  "../lib/glMatrix",

  "../webgl-engine/lib/GeometryRenderer",
  "../webgl-engine/lib/GeometryUtil",
  "../webgl-engine/lib/VertexBufferLayout",
  "../webgl-engine/lib/Texture",
  "../webgl-engine/lib/Util",
  "../webgl-engine/lib/GLSLProgram",
  "../webgl-engine/lib/GLTextureRep",

  "./resources/SimpleAtmosphereTexture"
], function(
  SimpleAtmosphereMaterialXML,
  Deferred,
  ExternalRenderer,
  glMatrix,
  GeometryRenderer, GeometryUtil, VertexBufferLayout, Texture, Util, GLSLProgram, GLTextureRep,
  SimpleAtmosphereTexture
) {
  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var VertexAttrConstants = Util.VertexAttrConstants;

  var tmpViewRotation = mat4d.create();

  var PanoramicAtmosphere = ExternalRenderer.createSubclass({
    declaredClass: "esri.views.3d.environment.PanoramicAtmosphere",

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

      this.slot = 0;
    },

    initialize: function() {
      this._textureDfd = new Deferred();
      this.addResolvingPromise(this._textureDfd.promise);
    },

    destroy: function() {
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
      var geometryData = this._createGeometryData();

      this._renderer = new GeometryRenderer(geometryData, VertexBufferLayout.Defaults.Pos, null, context.gl);

      if (!context.shaderSnippets.vsSimpleAtmosphere) {
        context.shaderSnippets._parse(SimpleAtmosphereMaterialXML);
      }

      this._program = GLSLProgram.fromSnippets("vsSimpleAtmosphere", "fsSimpleAtmosphere", context.shaderSnippets, context.gl, ["PANORAMIC"]);
    },

    render: function(context) {
      if (context.slot !== this.slot || context.pass !== "material" || !this._textureRep.getIsLoaded("SimpleAtmosphere")) {
        return false;
      }

      var gl = this.renderContext.gl,
        program = this._program;

      program.use();


      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      program.uniform1i("tex", 0);

      program.uniformMatrix4fv("proj", context.camera.projectionMatrix);
      mat4d.toRotationMat(context.camera.viewMatrix, tmpViewRotation);
      program.uniformMatrix4fv("view", tmpViewRotation);
      program.uniform4f("color", 1.0, 1.0, 1.0, 1.0);
      program.uniform3fv("lightDirection", context.lightingData.getLightDirection());

      if (!gl.web3DDefaultState.cullEnabled) {
        gl.enable(gl.CULL_FACE);
      }

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

      if (!gl.web3DDefaultState.cullEnabled) {
        gl.disable(gl.CULL_FACE);
      }

      return true;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _createGeometryData: function() {
      var data = GeometryUtil.createPolySphereGeometry(1, 2);

      /* We are going to view the generated geometry from the inside, but it
       * has been generated as seen from the outside. Correct for triangle vertex
       * order by swapping indices, and flipping normals.
       */
      var faces = data.getFaces();
      var indices = faces[0].indices[VertexAttrConstants.POSITION];

      for (var i = 0; i < indices.length; i += 3) {
        var tmp = indices[i];
        indices[i] = indices[i + 2];
        indices[i + 2] = tmp;
      }

      var vertexAttr = data.getVertexAttr();
      var normals = vertexAttr[VertexAttrConstants.NORMAL].data;

      for (i = 0; i < normals.length; i++) {
        normals[i] = -normals[i];
      }

      return {
        faces: faces[0],
        vertexAttr: vertexAttr
      };
    }
  });

  return PanoramicAtmosphere;
});
