// jshint forin:false

define([
  "../lib/PerformanceTimer",
  "../lib/Camera",
  "../lib/Util",
  "../lib/bitset",
  "../lib/gl-matrix",
  "./Visualizer"
  ], 
  //AMD TODO: actually use provided classes
  function (PerformanceTimer, Camera, Util, BitSet, glMatrix, Visualizer) {

  var vec3 = glMatrix.vec3;
  var vec4d = glMatrix.vec4d;
  var mat4d = glMatrix.mat4d;

var Viewport = function(programRep, vboRep, materialRep, textureRep, gl) {
  var visualizer = new Visualizer(programRep, vboRep, materialRep, textureRep, gl);

  var camera = new Camera(vec3.createFrom(0, 100.0, -100.0), vec3.createFrom(0, 0, 0));

  var content = [];
  var visibleContent = new BitSet();
  var visibleContentAllVisible = { get: function() { return true; }}; // Fakes a BitSet where every bit is on
  var frustumCullingEnabled = true;
  var defaultMaxFarNearRatio = 20000.0;
  var maxFarNearRatio = defaultMaxFarNearRatio;

  var tmpTightNearFar = [0, 0];

  var renderGeometriesTotal = 0;
  var renderGeometriesVisible = 0;
  var visualizerRenderTimer = new PerformanceTimer(10);
  var viewportRenderTimer = new PerformanceTimer(10);
  var needsRender = true;

  this.getCombinedStats = function() {
    var stats = visualizer.getCombinedStats();
    stats.renderGeometriesTotal = renderGeometriesTotal;
    stats.renderGeometriesVisible = renderGeometriesVisible;
    stats.visualizerTotalRenderTime = visualizerRenderTimer.getTotal();
    stats.visualizerCurrentRenderTime = visualizerRenderTimer.getLastFiltered();
    stats.viewportTotalRenderTime = viewportRenderTimer.getTotal();
    stats.viewportCurrentRenderTime = viewportRenderTimer.getLastFiltered();
    stats.totalNumFramesRendered = viewportRenderTimer.getNumMeasurements();
    
    if (gl.getUsedTextureMemory !== undefined) {
      stats.textureMemory = gl.getUsedTextureMemory();
    }
    
    if (gl.getUsedRenderbufferMemory !== undefined) {
      stats.renderbufferMemory = gl.getUsedRenderbufferMemory();
    }
    
    if (gl.getUsedVBOMemory !== undefined) {
      stats.VBOMemory = gl.getUsedVBOMemory();
    }
      
    if (gl.getUsedTextureMemoryStats !== undefined) {
      var textureMemoryStats = gl.getUsedTextureMemoryStats();
      
      for (var i in textureMemoryStats) {
        stats["texMem type: "+i] = textureMemoryStats[i];
      }
    }
    
    return stats;
  };

  var tmpProj = mat4d.create();
  
  var tmpPlanes = new Array(6);
  for (var i = 0; i < 6; ++i) {
    tmpPlanes[i] = vec4d.create();
  }
  
  this.dispose = function() {
    visualizer.dispose();
    visualizer = null;
  };
  
  this.setLightingData = function(data) {
    visualizer.setLightingData(data);
  };
  
  this.getLightingData = function() {
    return visualizer.getLightingData();
  };

  this.getViewParams = function(req) {
    var result = visualizer.getViewParams(req);

    Util.assert(req !== undefined && req.eye === undefined, "getViewParams: getting the eye through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.center === undefined, "getViewParams: getting the center through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.up === undefined, "getViewParams: getting the up through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.viewMatrix === undefined, "getViewParams: getting the viewMatrix through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.angleOfElevation === undefined, "getViewParams: getting the angleOfElevation through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.direction === undefined, "getViewParams: getting the direction through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.fov === undefined, "getViewParams: getting the fov through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.fovX === undefined, "getViewParams: getting the fovX through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.viewport === undefined, "getViewParams: getting the viewport through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.projectionMatrix === undefined, "getViewParams: getting the projectionMatrix through getViewParams is deprecated, use the camera instead");
    Util.assert(req !== undefined && req.frustum === undefined, "getViewParams: getting the frustum through getViewParams is deprecated, use the camera instead");

    if (!req || req.viewMode) {
      result.viewMode = this.getMode();
    }
    if (!req || req.frustumCullingEnabled) {
      result.frustumCullingEnabled = frustumCullingEnabled;
    }
    if (!req || req.maxFarNearRatio) {
      result.maxFarNearRatio = maxFarNearRatio;
    }

    return result;
  };

  this.setViewParams = function(params) {
    Util.assert(params.eye === undefined, "setViewParams: can't set eye through setViewParams anymore, manipulate camera directly instead");
    Util.assert(params.center === undefined, "setViewParams: can't set center through setViewParams anymore, manipulate camera directly instead");
    Util.assert(params.direction === undefined, "setViewParams: can't set direction through setViewParams anymore, manipulate camera directly instead");
    Util.assert(params.distance === undefined, "setViewParams: can't set distance through setViewParams anymore, manipulate camera directly instead");

    if (params.viewMatrix !== undefined) {
      Util.assert(false, "setViewParams: can't set view matrix directly");
    }

    Util.assert(params.fovX === undefined, "setViewParams: can't set fovX through setViewParams anymore, manipulate camera directly instead");
    Util.assert(params.fov === undefined, "setViewParams: can't set fov through setViewParams anymore, manipulate camera directly instead");
    Util.assert(params.nearFar === undefined, "setViewParams: can't set nearFar through setViewParams anymore, manipulate camera directly instead");

    if (params.viewport !== undefined) {
      Util.assert(false, "setViewParams: can't set viewport rectangle directly");
    }
    if (params.frustum !== undefined) {
      Util.assert(false, "setViewParams: can't set frustum directly");
    }
    if (params.projectionMatrix !== undefined) {
      Util.assert(false, "setViewParams: can't set projection matrix directly");
    }
    if (params.viewMode !== undefined) {
      this.setMode(params.viewMode);
    }

    if (params.frustumCullingEnabled !== undefined) {
      frustumCullingEnabled = params.frustumCullingEnabled;
    }
    
    if (params.maxFarNearRatio !== undefined) {
      if (params.maxFarNearRatio === -1) {
        maxFarNearRatio = defaultMaxFarNearRatio;
      }
      else {
        maxFarNearRatio = params.maxFarNearRatio;
      }
    }

    visualizer.setViewParams(params);
    needsRender = true;
  };

  this.setRenderParams = function(data) {
    visualizer.setRenderParams(data);
  };
  
  this.getRenderParams = function() {
    return visualizer.getRenderParams();
  };

  this.getFrustumObjects = function() {
    var result = {};

    for (var i = 0; i < content.length; i++) {
      if (visibleContent.get(content[i].idx)) {
        result[content[i].name] = 1;    
      }
    }
    return result;
  };
  
  this.modify = function(toAdd, toRemove, toUpdate, dirtyMaterials, idx) {
    visualizer.modify(toAdd, toRemove, toUpdate, dirtyMaterials, idx);
    
    content = visualizer.getContent();
  };
  
  this.getContent = function() {
    return content;
  };
  
  this.setSelectionObject = function(objectName, faceRange) {
    visualizer.setSelectionObject(objectName, faceRange);
  };
  
  this.setHighlightObjects = function(objectNames, params) {
    visualizer.setHighlightObjects(objectNames, params);    
  };

  this.frame = function(center, distance) {
    camera.frame(center, distance);
    needsRender = true;
  };
  
  this.setCamera = function(cam) {
    camera.copyFrom(cam);
    computeVisibleContentAndUpdateNearFar();
    needsRender = true;
  };

  this.getCamera = function() {
    return camera;
  };
  
  this.getPickRay = function(point, result0, result1) {
    return this.pickRayWithBeginPoint(point, undefined, camera.viewMatrix, result0, result1);
  };

  this.pickRayWithBeginPoint = function(point, pointBegin, viewMatrix, result0, result1) { 
    return visualizer.getPickRay(point, pointBegin, camera, viewMatrix, result0, result1);
  };
  
  this.getSideIndexForPoint = function(point) {
    return visualizer.getSideIndexForPoint(point, camera.viewport);
  };

  this.addExternalRenderer = function(slot, renderer) {
    return visualizer.addExternalRenderer(slot, renderer);
  };
  this.removeExternalRenderer = function(slot, renderer) {
    return visualizer.removeExternalRenderer(slot, renderer);
  };
  this.getExternalRenderers = function() {
    return visualizer.getExternalRenderers();
  };

  this.render = function(lightDirection, fbo) {
    viewportRenderTimer.start();

    var theVisibleContent = computeVisibleContentAndUpdateNearFar();

    visualizerRenderTimer.start();
    visualizer.render(camera, lightDirection, theVisibleContent, fbo);
    visualizerRenderTimer.stop();
    viewportRenderTimer.stop();
  };
  
  this.resetNeedsRender = function() {
    needsRender = false;
    visualizer.resetNeedsRender();
  };

  this.needsRender = function() {
    return needsRender || visualizer.needsRender();
  };

  this._getModule = function(moduleName) {
    if (moduleName === "visualizer") {
      return visualizer;
    } else {
      return visualizer._getModule(moduleName);
    }
  };
  
  function computeVisibleContentAndUpdateNearFar() {
    var theVisibleContent = visibleContentAllVisible;

    if (frustumCullingEnabled || maxFarNearRatio > 0) {
      tmpTightNearFar[1] = 0;
      computeFrustumCullingAndNearFar(camera.eye, visibleContent, tmpTightNearFar);

      if (maxFarNearRatio > 0 && tmpTightNearFar[1] > 0) {
        camera.far = tmpTightNearFar[1];
        camera.near = Math.max(tmpTightNearFar[0], camera.far / maxFarNearRatio);
      }

      theVisibleContent = visibleContent;
    }

    return theVisibleContent;
  }

  function computeFrustumCullingAndNearFar(eye, newVisibleContent, newNearFar) {
    mat4d.perspective(camera.fovY, camera.aspect, 1.0, 10.0, tmpProj);
    Util.matrix2frustumPlanes(camera.viewMatrix, tmpProj, tmpPlanes);
    
    newVisibleContent.clearAll();

    renderGeometriesTotal = renderGeometriesVisible = 0;

    var maxDistFromNear = -Number.MAX_VALUE;
    var maxDistFromFar = -Number.MAX_VALUE;
    
    // THIS LOOP IS HEAVILY OPTIMIZED
    
    var plane0x = tmpPlanes[0][0];
    var plane0y = tmpPlanes[0][1];
    var plane0z = tmpPlanes[0][2];
    var plane0w = tmpPlanes[0][3];

    var plane1x = tmpPlanes[1][0];
    var plane1y = tmpPlanes[1][1];
    var plane1z = tmpPlanes[1][2];
    var plane1w = tmpPlanes[1][3];

    var plane2x = tmpPlanes[2][0];
    var plane2y = tmpPlanes[2][1];
    var plane2z = tmpPlanes[2][2];
    var plane2w = tmpPlanes[2][3];

    var plane3x = tmpPlanes[3][0];
    var plane3y = tmpPlanes[3][1];
    var plane3z = tmpPlanes[3][2];
    var plane3w = tmpPlanes[3][3];

    var plane4x = tmpPlanes[4][0];
    var plane4y = tmpPlanes[4][1];
    var plane4z = tmpPlanes[4][2];
    var plane4w = tmpPlanes[4][3];
    
    var plane5w = tmpPlanes[5][3];
    
    for (var i = 0; i < content.length; i++) {
      renderGeometriesTotal++;
      var renderGeo = content[i];

      // skip visibility test and near/far computation for backdrop geometry (like atmosphere)
      if (!renderGeo.material.isBackdrop) {
        var center = renderGeo.center;

        var cx = center[0];
        var cy = center[1];
        var cz = center[2];

        var radius = renderGeo.bsRadius;

        if (plane0x * cx + plane0y * cy + plane0z * cz  + plane0w > radius) {
          continue;
        }
        if (plane1x * cx + plane1y * cy + plane1z * cz  + plane1w > radius) {
          continue;
        }
        if (plane2x * cx + plane2y * cy + plane2z * cz  + plane2w > radius) {
          continue;
        }
        if (plane3x * cx + plane3y * cy + plane3z * cz  + plane3w > radius) {
          continue;
        }

        var nearDot = plane4x * cx + plane4y * cy + plane4z * cz;

        var distFromNear = nearDot + radius;
        var distFromFar = -nearDot + radius;

        if (distFromNear > maxDistFromNear) {
          maxDistFromNear = distFromNear;
        }
        if (distFromFar > maxDistFromFar) {
          maxDistFromFar = distFromFar;
        }
      }
      
      newVisibleContent.set(renderGeo.idx);

      renderGeometriesVisible++;
    }
    
    var nearFarSet =  maxDistFromNear !== -Number.MAX_VALUE;
    
    maxDistFromNear += plane4w;
    maxDistFromFar += plane5w;
    
    if (renderGeometriesVisible > 0 && nearFarSet) {
      newNearFar[0] = Math.max(1.0 - maxDistFromNear, 2.0) * 0.99;
      newNearFar[1] = Math.max(10.0 + maxDistFromFar, newNearFar[0] + 1.0) * 1.01;
    }
  }
  
};

return Viewport;
});