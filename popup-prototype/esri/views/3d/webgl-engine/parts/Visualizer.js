define([
  "../lib/Renderer",
  "../lib/SSAOHelperObscurance",
  "../lib/ShadowMap",
  "../lib/NearFarCalc",
  "../lib/Util",
  "../lib/gl-matrix"
  ], function (Renderer, SSAOHelper, ShadowMap, NearFarCalc, Util, glMatrix) {

  var vec3d = glMatrix.vec3d;
  var mat4 = glMatrix.mat4;
  var assert = Util.assert;

var Visualizer = function(programRep, vboRep, materialRep, textureRep, gl) {
  var renderer = new Renderer(programRep, vboRep, materialRep, textureRep, gl);

  var shadowMap = new ShadowMap(programRep, gl);
  var ssaoHelper = new SSAOHelper(programRep, textureRep, gl);
  var nearFarCalc = new NearFarCalc();

  var content = {};

  var drawShadowMapDebugQuad = false;
  var drawSSAOMapDebugQuad = false;
  var needsRender = true;

  this.getCombinedStats = function () {
    return renderer.getCombinedStats();
  };

  this.dispose = function() {
    renderer.dispose();
    if (shadowMap.getEnableState()) {
      shadowMap.disable();
    }
    if (ssaoHelper.getEnableState()) {
      ssaoHelper.disable();
    }
  };

  this.setLightingData = function(data) {
    renderer.setLightingData(data);
  };

  this.getLightingData = function() {
    return renderer.getLightingData();
  };

  this.getViewParams = function(req) {
    var res = req || {};

    if (!req || req.pixelRatio) {
      res.pixelRatio = renderer.getPixelRatio();
    }
    return res;
  };

  this.setViewParams = function(params) {
    if (params.pixelRatio != null) {
      renderer.setPixelRatio(params.pixelRatio);
    }
  };

  this.setRenderParams = function(data) {
    if (data.shadowMapResolution !== undefined && shadowMap.getEnableState() === false) {
      shadowMap.setTextureResolution(data.shadowMapResolution);
    }

    if (data.shadowMap !== undefined && data.shadowMap !== shadowMap.getEnableState()) {
      shadowMap.setEnableState(data.shadowMap);
    }

    if (data.shadowMapMaxCascades !== undefined) {
      shadowMap.setMaxNumCascades(data.shadowMapMaxCascades);
    }

    if (data.ssao !== undefined && data.ssao !== ssaoHelper.getEnableState()) {
      ssaoHelper.setEnableState(data.ssao);
    }

    if (data.ssaoAttenuation !== undefined) {
      ssaoHelper.setAttenuation(data.ssaoAttenuation);
    }
    if (data.ssaoRadius !== undefined) {
      ssaoHelper.setRadius(data.ssaoRadius);
    }
    if (data.ssaoFilterRadius !== undefined) {
      ssaoHelper.setFilterRadius(data.ssaoFilterRadius);
    }
    if (data.ssaoSamples !== undefined) {
      ssaoHelper.setSamples(data.ssaoSamples);
    }

    if (data.debugInstanceThreshold !== undefined) {
      renderer.setThreshold(data.debugInstanceThreshold);
    }

    if (data.drawShadowMapDebugQuad !== undefined) {
      drawShadowMapDebugQuad = data.drawShadowMapDebugQuad;
    }
    if (data.drawSSAODebugQuad !== undefined) {
      drawSSAOMapDebugQuad = data.drawSSAODebugQuad;
    }

    if(ssaoHelper.getEnableState()){
      renderer.ssaoEnabled = true;
    } else {
      renderer.ssaoEnabled = false;
    }

    needsRender = true;
  };

  this.getRenderParams = function() {
    var result = {};
    if (shadowMap.getIsSupported()) {
      result.shadowMap = shadowMap.getEnableState();
      result.shadowMapResolution = shadowMap.getTextureResolution();
      result.shadowMapMaxCascades = shadowMap.getMaxNumCascades();
    }
    if (ssaoHelper.getIsSupported()) {
      result.ssao = ssaoHelper.getEnableState();
      result.ssaoAttenuation = ssaoHelper.getAttenuation();
      result.ssaoRadius = ssaoHelper.getRadius();
      result.ssaoFilterRadius = ssaoHelper.getFilterRadius();
      result.ssaoSamples = ssaoHelper.getSamples();
    }
    return result;
  };

  this.modify = function(toAdd, toRemove, toUpdate, dirtyMaterials, idx) {
    renderer.modify(toAdd, toRemove, toUpdate, dirtyMaterials);

    var i, length;

    for (i = 0, length = toRemove.length; i < length; ++i) {
      delete content[toRemove[i].uniqueName];
    }

    for (i = 0, length = toAdd.length; i < length; ++i) {
      content[toAdd[i].uniqueName] = toAdd[i];
    }

    for (i = 0, length = toUpdate.length; i < length; ++i) {
      assert(content[toUpdate[i].renderGeometry.uniqueName] === toUpdate[i].renderGeometry);
    }

  };

  this.getContent = function() {
    return content;
  };

  this.getPickRay = function(point, pointBegin, camera, view, result0, result1) {
    vec3d.unproject(vec3d.createFrom(point[0], point[1], 0.0), view, camera.projectionMatrix, camera.fullViewport, result0);
    vec3d.unproject(vec3d.createFrom(point[0], point[1], 1.0), view, camera.projectionMatrix, camera.fullViewport, result1);
  };

  this.getSideIndexForPoint = function(point, viewport) {
    return 0;
  };

  this.getProjectionMatrix = function(viewport, fovX, near, far, result) {
    var fovY = Util.fovx2fovy(fovX, viewport[2], viewport[3]);
    mat4.perspective(fovY * 180.0 / Math.PI, viewport[2] / viewport[3], near, far, result);
  };

  this.setSelectionObject = function(objectName, faceRange) {
    renderer.setSelectionObject(objectName, faceRange);
  };

  this.setHighlightObjects = function(objectNames, params) {
    renderer.setHighlightObjects(objectNames, params);
  };

  this.addExternalRenderer = function(slot, externalRenderer) {
    return renderer.addExternalRenderer(slot, externalRenderer);
  };
  this.removeExternalRenderer = function(slot, externalRenderer) {
    return renderer.removeExternalRenderer(slot, externalRenderer);
  };
  this.getExternalRenderers = function() {
    return renderer.getExternalRenderers();
  };

  this.resetNeedsRender = function() {
    needsRender = false;
    renderer.resetNeedsRender();
  };

  this.needsRender = function() {
    return needsRender || renderer.needsRender();
  };

  this.render = function(camera, lightDir, visibleContent, fbo) {
    var viewport = camera.viewport;

    var sceneNearFar;
    if (shadowMap.getEnableState() || ssaoHelper.getEnableState()) {
      sceneNearFar = nearFarCalc.calculateSceneNearFar(camera, content, visibleContent);
    }

    if (shadowMap.getEnableState()) {
      shadowMap.prepare(camera, lightDir, content, visibleContent, sceneNearFar);

      var cascades = shadowMap.getCascades();

      for (var i = 0; i < cascades.length; ++i) {
        var cascade = cascades[i];
        cascade.camera.setGLViewport(gl);

        renderer.renderSimple(cascade.camera, visibleContent, "materialDepthShadowMap", cascade.camera.viewport);
      }

      shadowMap.finish(fbo);

      camera.setGLViewport(gl);
    }
    shadowMap.bindAll(programRep);

    renderer.renderAuxiliaryBuffers(camera, visibleContent, shadowMap, ssaoHelper, sceneNearFar, fbo);
    renderer.render(camera, visibleContent, shadowMap, ssaoHelper, fbo);

    var pr;

    if (drawShadowMapDebugQuad && shadowMap.getEnableState()) {
      pr = mat4.ortho(viewport[0], viewport[2], viewport[1], viewport[3], -1.0, 1.0);
      shadowMap.drawDebugQuad(pr);
    }

    if (drawSSAOMapDebugQuad && ssaoHelper.getEnableState()) {
      pr = mat4.ortho(viewport[0], viewport[2], viewport[1], viewport[3], -1.0, 1.0);
      ssaoHelper.drawQuad(pr);
    }
  };

  this._getModule = function(moduleName) {
    if (moduleName === "renderer") {
      return renderer;
    }

    Util.assert(false, "Unknown module: " + moduleName);
  };
};

return Visualizer;

});
