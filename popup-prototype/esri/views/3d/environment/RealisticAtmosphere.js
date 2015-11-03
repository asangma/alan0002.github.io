define([
  "dojo/text!./materials/RealisticAtmosphereMaterial.xml",
  "../../../core/watchUtils",

  "../support/ExternalRenderer",

  "../lib/glMatrix",

  "../webgl-engine/lib/GeometryRenderer",
  "../webgl-engine/lib/VertexBufferLayout",
  "../webgl-engine/lib/GLSLProgram",
  "../webgl-engine/lib/GeometryUtil",

  "../support/earthUtils"
], function(
  RealisticAtmosphereMaterialXML,
  watchUtils,
  ExternalRenderer,
  glMatrix, GeometryRenderer, VertexBufferLayout, GLSLProgram, GeometryUtil,
  earthUtils
) {
  var EARTH_RADIUS = earthUtils.earthRadius;
  var vec3d = glMatrix.vec3d;
  var vec2d = glMatrix.vec2d;
  var vec4d = glMatrix.vec4d;

  var RealisticAtmosphere = ExternalRenderer.createSubclass({
    declaredClass: "esri.views.3d.environment.RealisticAtmosphere",

    classMetadata: {
      properties: {
        view: {},

        planar: {
          value: false,

          setter: function(value) {
            value = !!value;

            if (value !== this.planar) {
              this._update(this.get("view.navigation.currentCamera"));
            }

            return value;
          }
        },

        needsDepthMap: {
          value: true
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._currentViewChangedHandle = null;
      this._hazeProgram = null;
      this._hazePlanarProgram = null;
      this._skyProgram = null;
      this._skyPlanarProgram = null;
      this._renderer = null;

      // Set up variables

      // Reighlay constant
      var fKr = 0.005;

      // Mie constant
      var fKm = 0.0010;

      var fKr4PI = fKr * 4.0 * Math.PI;
      var fKm4PI = fKm * 4.0 * Math.PI;

      // 650 nm for red
      // 570 nm for green
      // 475 nm for blue

      // 1 / pow(wavelength, 4) for the red, green, and blue channels
      var v3InvWavelength = vec3d.createFrom(1.0 / Math.pow(0.650, 4.0), 1.0 / Math.pow(0.570, 4.0), 1.0 / Math.pow(0.475, 4.0));
      var v3InvWavelengthScaled = vec3d.create(v3InvWavelength);

      vec3d.scale(v3InvWavelengthScaled, fKr4PI);
      vec3d.add(v3InvWavelengthScaled, vec3d.createFrom(fKm4PI, fKm4PI, fKm4PI));

      var fInnerRadius = EARTH_RADIUS;
      var fInnerRadius2 = fInnerRadius * fInnerRadius;

      // The outer (atmosphere) radius, based on O'Neill's 10 : 10.25 ratio
      var fOuterRadius = (fInnerRadius / 10.0) * 10.25;
      var fOuterRadius2 = fOuterRadius * fOuterRadius;

      var fScale = 1.0 / (fOuterRadius - fInnerRadius);

      // The scale depth (i.e. the altitude at which the atmosphere's average density is found) Rayleigh
      var fScaleDepth = 0.25;
      var fScaleDepthBlue = 0.05;

      var fScaleOverScaleDepth = fScale / fScaleDepth;
      var fScaleOverScaleDepthBlue = fScale / fScaleDepthBlue;

      var fOneOverScaleDepth = 1.0 / fScaleDepth;
      var fOneOverScaleDepthBlue = 1.0 / fScaleDepthBlue;

      // The Mie phase asymmetry factor, also fakes the sun
      var g = -0.99999;
      var g2 = g * g;
      var fMiePhaseCoefficients = 1.5 * ((1.0 - g2) / (2.0 + g2));
      var fLowerAlphaBlendBound = (fOuterRadius - fInnerRadius) * 0.3 + fInnerRadius;
      var fOneOverOuterRadiusMinusAlphaBlendBound = 1.0 / (fOuterRadius - fLowerAlphaBlendBound);

      this._renderData = {
        texDepth: vec2d.create(),
        v3CameraPos: vec3d.create(),
        v3CameraUp: vec3d.create(),
        v3CameraRight: vec3d.create(),
        v3CameraDir: vec3d.create(),
        v3CameraCenter: vec3d.create(),
        halfSizeNearPlane: vec2d.create(),
        v4Viewport: vec4d.create(),
        v4SphereComp: vec4d.create(),
        v4AtmosParams1: vec4d.createFrom(fScale, fScaleDepth, fScaleOverScaleDepth, fOneOverScaleDepth),
        v4AtmosParams2: vec4d.createFrom(g, fScaleDepthBlue, fScaleOverScaleDepthBlue, fOneOverScaleDepthBlue),
        v4AtmosParams3: vec4d.createFrom(g2, fMiePhaseCoefficients, fLowerAlphaBlendBound, fOneOverOuterRadiusMinusAlphaBlendBound),
        v3InvWavelength: v3InvWavelength,
        v3InvWavelengthScaled: v3InvWavelengthScaled,
        v4Radii: vec4d.createFrom(fInnerRadius, fInnerRadius2, fOuterRadius, fOuterRadius2),
        fScale: fScale,
        fScaleDepth: fScaleDepth,
        fLowerAlphaBlendBound: fLowerAlphaBlendBound,
        fScaleOverScaleDepth: fScaleOverScaleDepth,
        fOneOverScaleDepth: fOneOverScaleDepth,
        fScaleDepthBlue: fScaleDepthBlue,
        fOneOverScaleDepthBlue: fOneOverScaleDepthBlue,
        fScaleOverScaleDepthBlue: fScaleOverScaleDepthBlue,
        g: g,
        g2: g2,
        fMiePhaseCoefficients: fMiePhaseCoefficients,
        showTest: 0,
        nearFar: vec2d.create()
      };

      this._hazeSlot = 4;
      this._skySlot = 0;
    },

    destroy: function() {
      if (this._currentViewChangedHandle) {
        this._currentViewChangedHandle.remove();
        this._currentViewChangedHandle = null;
      }

      if (this._hazeProgram) {
        this._hazeProgram.dispose();
        this._hazeProgram = null;
      }

      if (this._hazePlanarProgram) {
        this._hazePlanarProgram.dispose();
        this._hazePlanarProgram = null;
      }

      if (this._skyProgram) {
        this._skyProgram.dispose();
        this._skyProgram = null;
      }

      if (this._skyPlanarProgram) {
        this._skyPlanarProgram.dispose();
        this._skyPlanarProgram = null;
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    setup: function(context) {
      var square = GeometryUtil.createSquareGeometry();

      var geometryData = {
        faces: square.getFaces()[0],
        vertexAttr: square.getVertexAttr()
      };

      this._renderer = new GeometryRenderer(geometryData, VertexBufferLayout.Defaults.PosTex, null, context.gl);

      this._currentViewChangedHandle = watchUtils.on(this, "view.navigation", "currentViewChanged", (function(ev) {
        this._update(ev.camera);
      }).bind(this), function() {
        this._update(this.get("view.navigation.currentCamera"));
      }.bind(this));

      if (!context.shaderSnippets.fsRealisticAtmosphere) {
        context.shaderSnippets._parse(RealisticAtmosphereMaterialXML);
      }

      this._hazeProgram = GLSLProgram.fromSnippets("vsRealisticAtmosphere", "fsRealisticAtmosphere", context.shaderSnippets, context.gl, ["HAZE"]);
      this._skyProgram = GLSLProgram.fromSnippets("vsRealisticAtmosphere", "fsRealisticAtmosphere", context.shaderSnippets, context.gl);

      this._hazePlanarProgram = GLSLProgram.fromSnippets("vsRealisticAtmosphere", "fsRealisticAtmosphere", context.shaderSnippets, context.gl, ["HAZE", "PLANAR"]);
      this._skyPlanarProgram = GLSLProgram.fromSnippets("vsRealisticAtmosphere", "fsRealisticAtmosphere", context.shaderSnippets, context.gl, ["PLANAR"]);
    },

    render: function(context) {
      if (!(context.slot == this._hazeSlot || context.slot == this._skySlot) || context.pass != "material") {
        return;
      }

      var program;
      var gl = this.renderContext.gl;

      if (context.slot == this._hazeSlot) {
        program = this.planar ? this._hazePlanarProgram : this._hazeProgram;
        program.use();

        // Rendered View
        program.uniform1i("tColor", 1);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, context.framebufferTex);

        // Depth texture
        if (context.depth !== undefined) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, context.depth.getTexture());
          program.uniform4fv("v4SphereComp", this._renderData.v4SphereComp);
        } else {
          // hack to not render in case of no depth texture
          var data = new Float32Array(4);

          data[2] = 0;
          program.uniform4fv("v4SphereComp", data);
        }
        program.uniform1i("tDepth", 0);

        // For semi-fix with anti-aliasing, please remove when screen-space
        // anti-aliasing is added (there is also code to be removed in
        // materials/RealisticAtmosphereMaterial.xml)
        program.uniform4fv("v4Viewport", this._renderData.v4Viewport);
      }

      if (context.slot == this._skySlot) {
        program = this.planar ? this._skyPlanarProgram : this._skyProgram;
        program.use();

        //Camera
        program.uniform4fv("v4SphereComp", this._renderData.v4SphereComp);

        //Atmosphere
        program.uniform4fv("v4AtmosParams3", this._renderData.v4AtmosParams3);
      }

      //Light
      program.uniform3fv("v3InvWavelength", this._renderData.v3InvWavelength);
      program.uniform3fv("v3InvWavelengthScaled", this._renderData.v3InvWavelengthScaled);
      program.uniform3fv("v3LightDir", context.lightingData.getLightDirection());

      //Camera
      program.uniform3fv("v3CameraPos", this._renderData.v3CameraPos);
      program.uniform3fv("v3CameraUp", this._renderData.v3CameraUp);
      program.uniform3fv("v3CameraRight", this._renderData.v3CameraRight);
      program.uniform3fv("v3CameraDir", this._renderData.v3CameraDir);
      program.uniform2fv("nearFar", this._renderData.nearFar);
      program.uniform2fv("halfSizeNearPlane", this._renderData.halfSizeNearPlane);

      //Radii
      program.uniform4fv("v4Radii", this._renderData.v4Radii);

      //Atmosphere
      program.uniform4fv("v4AtmosParams1", this._renderData.v4AtmosParams1);
      program.uniform4fv("v4AtmosParams2", this._renderData.v4AtmosParams2);
      program.uniform1f("showTest", this._renderData.showTest);

      gl.disable(gl.DEPTH_TEST);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      this._renderer.render(program);

      GLSLProgram.unuse(gl);

      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);

      return true;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setEnableTestImage: function(state) {
      if (state) {
        this._renderData.showTest = 1.0;
      } else {
        this._renderData.showTest = 0.0;
      }

      this.needsRender = true;
    },

    _update: function(camera) {
      if (!camera) {
        return;
      }

      if (!this.planar && vec3d.length(camera.eye) <= EARTH_RADIUS) {
        return;
      }

      var view = camera.viewMatrix;

      vec3d.set3(view[2], view[6], view[10], this._renderData.v3CameraDir);
      vec3d.normalize(this._renderData.v3CameraDir);

      if (this.planar) {
        this._renderData.fCameraHeight = this.view.renderCoordsHelper.getAltitude(camera.eye) / this.view.mapCoordsHelper.mapUnitInMeters + EARTH_RADIUS;
      } else {
        this._renderData.fCameraHeight = vec3d.length(camera.eye);
      }

      this._renderData.fCameraHeight2 = this._renderData.fCameraHeight * this._renderData.fCameraHeight;

      // Sphere precomputation
      // C = ||o-c||^2 - r^2

      // fOuterRadius2
      this._renderData.fC = this._renderData.fCameraHeight2 - this._renderData.v4Radii[3];

      // fInnerRadius2
      this._renderData.fCSur = this._renderData.fCameraHeight2 - this._renderData.v4Radii[1];

      this._renderData.v4SphereComp = vec4d.createFrom(this._renderData.fCameraHeight, this._renderData.fCameraHeight2, this._renderData.fC, this._renderData.fCSur);

      vec3d.set(camera.eye, this._renderData.v3CameraPos);
      vec3d.set(camera.center, this._renderData.v3CameraCenter);
      vec3d.set(camera.up, this._renderData.v3CameraUp);
      vec3d.normalize(this._renderData.v3CameraUp);
      vec3d.cross(camera.up, this._renderData.v3CameraDir, this._renderData.v3CameraRight);
      vec3d.normalize(this._renderData.v3CameraRight);
      vec2d.set2(Math.tan(camera.fovY / 2) * camera.aspect, Math.tan(camera.fovY / 2), this._renderData.halfSizeNearPlane);
      vec4d.set(camera.viewport, this._renderData.v4Viewport);

      this._renderData.nearFar = [camera.near, camera.far];

      this.needsRender = true;
    }
  });

  return RealisticAtmosphere;
});
