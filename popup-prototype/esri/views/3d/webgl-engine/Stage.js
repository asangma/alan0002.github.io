/* jshint forin:false */
define(["./parts/Model",
    "./parts/View",
    "./lib/Selector",
    "./lib/Camera",
    "./lib/gl-matrix",
    "./lib/Util"],
    
function(Model, View, Selector, Camera, glMatrix, Util){

var assert = Util.assert;

var vec2d = glMatrix.vec2d;
var vec2 = glMatrix.vec2;
var vec3d = glMatrix.vec3d;

var Stage = function(containerDiv, options) {
  // public API //

  var needsRender = true;
  var intersectTolerance = Selector.DEFAULT_TOLERANCE;

  this.needsRender = function() {
    return needsRender;
  };

  this.setNeedsRender = function() {
    needsRender = true;
  };

  this.resetNeedsRender = function() {
    needsRender = false;
  };

  this.dispose = function() {
    view.dispose();
    view = null;

    model = null;
  };

  this.setSelectionObject = function (object, noFire, faceRange) {
    model.setSelection(object, faceRange);
    view.setSelectionObject(object !== undefined ? object.getId() : undefined, faceRange);
    if(!noFire) {
      //TODO: rework interface of this call to make compatible with old webviewer
      this.onSelectionChange(object, faceRange);
    }
  };
  
  this.getSelectionObject = function() {
    return model.getSelection();
  };

  // default params (total highlight time = 1.7sec)
  // set holdTime:-1 for holding highlighting indefinitely
  //
  // params = {
  //    [fadeInTime:0.2,] 
  //     [fadeOutTime:0.5,] 
  //    holdTime:1
  // }
  this.setHighlightObjects = function (objectIds, params) {
    view.setHighlightObjects(objectIds, params);
    if (params && (params.holdTime === -1)) {
      this.highlightedObjectIds = objectIds;
    } else {
      this.highlightedObjectIds = undefined;
    }
  };

  this.frame = function(object, padding) {
    var frame = Camera.frameCenterRadiusWithPadding(object.getCenter(), object.getBSRadiusApprox(), padding);

    var cam = this.getCamera();
    var dir = cam.computeDirection();
    var dist = 1.5*frame.radius/Math.tan(cam.fov);
    vec3d.scale(dir, -dist);

    vec3d.set(frame.center, cam.center);
    vec3d.add(frame.center, dir, cam.eye);

    // need to create a new Camera obj so the view matrix is recomputed
    cam = new Camera(cam.eye, cam.center, cam.up);
    this.setCamera(cam);
  };
  
  // api command skeleton
  
  this.beginMod = function() {
    if (Stage.DebugSettings.fineGrainedContentValidation) {
      model.validateContent();
    }
  };
  
  this.add = function(contentType, contentObject) {
    model.add(contentType, contentObject);
    if (typeof(contentObject.addParentStage) == "function") {
      contentObject.addParentStage(this);
    }
  };
  
  this.remove = function(contentType, contentObjectId) {
    var contentObject = model.remove(contentType, contentObjectId);
    if (typeof(contentObject.removeParentStage) == "function") {
      contentObject.removeParentStage(this);
    }
    return contentObject;
  };
  
  this.endMod = function(noValidate) {
    if (Stage.DebugSettings.fineGrainedContentValidation && !noValidate) {
      model.validateContent();
    }
  };

  this.notifyDirty = function(contentType, contentObject, dirtyType, subObject) {
    model.notifyDirty(contentType, contentObject, dirtyType, subObject);
  };

  this.processDirty = function() {
    var dirtySet = model.getDirtySet();
    var dirtyMaterials = dirtySet.getDirtyMaterials();
    if (!dirtySet.hasDirtyGeometryRecords() && !dirtyMaterials) {
      return;
    }

    if (Stage.DebugSettings.endFrameContentValidation) {
      model.validateContent();
    }

    if (Stage.DebugSettings.logDirtySet) {
      console.log("Dirty set: " + model.getDirtySet().formatDebugInfo(false));
    }

    assert(viewContent[1].length === 0, "Method not implemented for multiple visualizers");

    var addRemoveUpdate = dirtySet.getAddRemoveUpdateListFilteredByLayers(viewContent[0], true);
    var numChanges = addRemoveUpdate[0].length + addRemoveUpdate[1].length + addRemoveUpdate[2].length;

    if (numChanges > 0 || dirtyMaterials) {
      view.modify(addRemoveUpdate[0], addRemoveUpdate[1], addRemoveUpdate[2], dirtyMaterials, 0);
    }

    if (Stage.DebugSettings.logDirtySet) {
      console.log("RGs add: " + addRemoveUpdate[0].map(function (e) {return e.uniqueName; }));
      console.log("RGs remove: " + addRemoveUpdate[1].map(function (e) {return e.uniqueName; }));
    }


    this._updateViewExtent();

    dirtySet.clearDirtyMaterials();

    needsRender = true;
  };

  this.processDirtyLayer = function(layerId) {
    // process dirty list for given layer plus materials.
    assert(viewContent[1].length === 0, "Method not implemented for multiple visualizers");
    var dirtySet = model.getDirtySet();
    var dirtyMaterials = dirtySet.getDirtyMaterials();
    var addRemoveUpdate = dirtySet.getAddRemoveUpdateListFilteredByLayers([layerId], true);
    var numChanges = addRemoveUpdate[0].length + addRemoveUpdate[1].length + addRemoveUpdate[2].length;

    if (numChanges > 0 || dirtyMaterials) {
      view.modify(addRemoveUpdate[0], addRemoveUpdate[1], addRemoveUpdate[2], dirtyMaterials, 0);
    }

    dirtySet.clearDirtyMaterials();
  };

  this.get = function(contentType, contentObjectId) {
    return model.get(contentType, contentObjectId);
  };
  
  this.getAll = function(contentType) {
    return model.getAll(contentType);
  };

  this.addTextureListener = function(listener) {
    view.addTextureListener(listener);    
  };
  
  this.removeTextureListener = function(listener) {
    view.removeTextureListener(listener);    
  };
  
  this.getContainer = function() {
    return container;
  };

  this.getCamera = function() {
    return view.getCamera();
  };
  
  this.setCamera = function(camera) {
    view.setCamera(camera);
  };

  this.getViewParams = function(req) {
    return view.getViewParams(req);
  };

  this.setViewParams = function(params) {
    view.setViewParams(params);
    if (params.fovX !== undefined) {
      this._updateViewExtent();
    }
    if (params.viewMode !== undefined) {
      view.setLights(model.getAmbientLight(), model.getDirectionalLight());
      viewContent = [[] , []];
      renderGeometries =  [{}, {}];
    }
  };

  this.getLayers = function() {
    return model.getAll(Stage.ModelContentType.LAYER);
  };

  this.getAmbientLight = function() {
    return model.getAmbientLight();
  };
  
  this.getDirectionalLight = function() {
    return model.getDirectionalLight();
  };

  this.setAmbientLight = function(data) {
    model.setAmbientLight(data);
    view.setLights(model.getAmbientLight(), model.getDirectionalLight());      
  };
  
  this.setDirectionalLight = function(data) {
    model.setDirectionalLight(data);
    view.setLights(model.getAmbientLight(), model.getDirectionalLight());
  };

  this.getCanvas = function (){
    return view.getCanvas();
  };

  this.setRenderParams = function(data) {
    view.setRenderParams(data);
  };
  
  this.getRenderParams = function() {
    return view.getRenderParams();
  };

  this.has = function(parameter) {
    return view.has(parameter);
  };

  this.getViewContent = function(idx) {
    return viewContent[idx || 0].slice(0);
  };

  this.setViewContent = function(layerNames, idx) {
    if (!idx) {
      idx = 0;
    }
    assert((idx >= 0) && (idx < viewContent.length), "Stage.setViewContent: invalid index");
    var lastContent = Util.array2object(viewContent[idx]);
    var nextContent = Util.array2object(layerNames);

    var layerIdsToAdd = Util.subtractObjects(nextContent, lastContent);
    var layerIdsToRemove = Util.subtractObjects(lastContent, nextContent);

    this.processDirty();
    var dirtySet = model.getDirtySet();

    var renderGeosToAdd = dirtySet.getResidentRenderGeometriesFilteredByLayers(Util.object2array(layerIdsToAdd));
    var renderGeosToRemove = dirtySet.getResidentRenderGeometriesFilteredByLayers(Util.object2array(layerIdsToRemove));
    view.modify(renderGeosToAdd, renderGeosToRemove, {}, idx);

    viewContent[idx] = layerNames.slice(0);
  };

  this.addToViewContent = function(layerIds, idx) {
    if (!idx) {
      idx = 0;
    }
    assert((idx >= 0) && (idx < viewContent.length), "Stage.addToViewContent: invalid index");

    var cleanLayerIds = [];
    for (var i = 0; i < layerIds.length; i++) {
      if (viewContent[idx].indexOf(layerIds[i]) === -1) {
        cleanLayerIds.push(layerIds[i]);
      }
    }

    if (layerIds.length > 0) {
      this.processDirty();
      var dirtySet = model.getDirtySet();

      var renderGeosToAdd = dirtySet.getResidentRenderGeometriesFilteredByLayers(cleanLayerIds);
      view.modify(renderGeosToAdd, [], {}, idx);
      viewContent[idx].push.apply(viewContent[idx], cleanLayerIds);
    }
  };

  this.removeFromViewContent = function(layerIds, idx) {
    if (!idx) {
      idx = 0;
    }
    assert((idx >= 0) && (idx < viewContent.length), "Stage.RemoveFromViewContent: invalid index");

    this.processDirty();
    var dirtySet = model.getDirtySet();

    var vc = viewContent[idx];
    var cleanLayerIds = [];
    for (var i = 0; i < layerIds.length; i++) {
      var vi = vc.indexOf(layerIds[i]);
      if (vi > -1) {
        vc[vi] = vc[vc.length-1];
        vc.pop();
        cleanLayerIds.push(layerIds[i]);
      }
    }

    var renderGeosToRemove = dirtySet.getResidentRenderGeometriesFilteredByLayers(cleanLayerIds);
    view.modify([], renderGeosToRemove, {}, idx);
  };

  this.getViewFrustumObjects = function() {
    return view.getFrustumObjects();
  };

  this.getLocalOrigin = function(center, radius, scale) {
    return model.getOrigin(center, radius, scale);
  };

  this.resize = function() {
    return view.resize();
  };

  // can be implemented by "user" in main

  //onLoading:progressC,
  this.onReady = function() { };
  this.onRender = function() { };

  this.onSelectionChange = function() { };
  this.onGeometryPicked = function() { };

  this.onViewExtentUpdated = function() { };

  //
  // listener object should look like this:
  //     var modelListener = {
  //      contentAdded : function(type, obj){...},
  //      contentRemoved : function(type, obj){...},
  //    };
  // all functions are optional.
  //

  this.addModelListener = function(listener) {
    return model.addModelListener(listener);
  };
  this.removeModelListener = function(listener) {
    model.removeModelListener(listener);
  };

  this.addFPSListener = function(listener) {
    view.addFPSListener(listener);
  };
  
  this.removeFPSListener = function(listener) {
    view.removeFPSListener(listener);
  };
  
  this.renderScreenshots = function(width, height, views) {
    return view.renderScreenshots(width, height, views);
  };

  this.getFrameTask = function() {
    return view.getFrameTask();
  };

  this.requestScreenCapture = function(settings, callback) {
    view.requestScreenCapture(settings, callback);
  };
  
  this.getAllTexturesLoaded = function() {
    return view.getAllTexturesLoaded();
  };
  
  this.getTextureLoaded = function(name) {
    return view.getTextureLoaded(name);
  };

  this.addExternalRenderer = function(slot, renderer) {
    if (typeof renderer.intersect === "function") {
      externalIntersectionHandlers.push(renderer);
    }
    return view.addExternalRenderer(slot, renderer);
  };
  this.removeExternalRenderer = function(slot, renderer) {
    var selIdx = externalIntersectionHandlers.indexOf(renderer);
    if (selIdx > -1) {
      externalIntersectionHandlers[selIdx] = externalIntersectionHandlers[externalIntersectionHandlers.length-1];
      externalIntersectionHandlers.pop();
    }
    return view.removeExternalRenderer(slot, renderer);
  };

  this.getContentDebugStrings = function(asHTML) {
    return model.formatDebugInfo(asHTML);
  };

  this.getRenderStats = function() {
    return view.getCombinedStats();
  };

  this.getRenderStatString = function(asHTML) {
    var stats = this.getRenderStats();
    var result = "";
    if (asHTML)  {
      result += "<table>";
      for (var key in stats) {
        result += "<tr><td>" + key + "</td><td style=\"text-align: right\">" + Math.round(stats[key]) + "</td></tr>";
      }
      result += "</table>";
    } else {
      for (key in stats) {
        result += key + ": " + stats[key] + "\n";
      }
    }
    return result;
  };

  // TODO decide if these functions are public or private:

  this._pick = function(point, layerIds, objectIds, isSelection, selector) {
    var p0 = vec3d.create();
    var p1 = vec3d.create();
    view.getPickRay(point, p0, p1);

    return this.pickRay(p0, p1, point, point, layerIds, objectIds, isSelection, selector);
  }.bind(this);
  
  this.pickRayWithBeginPoint = function(point, pointBegin, viewMatrix, result0, result1) { 
    view.pickRayWithBeginPoint(point, pointBegin, viewMatrix, result0, result1);
  };

  var tmpPScreen = vec2d.create();
  var tmpNPScreen = vec2.create();
  var tmpNP1 = vec3d.create();
  var checkSelector = new Selector();

  this.pickRay = function(p0, p1, pScreen, pointOnSide, layerIds, objectIds, isSelection, selector) {
    var pickLayers, i;
    var sideIdx = pointOnSide ? view.getSideIndexForPoint(pointOnSide) : 0;
    var camera = view.getCamera();
    if (!pScreen) {
      pScreen = tmpPScreen;
      camera.projectPoint(p1, pScreen);
    }
    if (layerIds) {
      pickLayers = new Array(layerIds.length);
      for (i = 0; i < pickLayers.length; i++) {
        pickLayers[i] = model.get(Model.ContentType.LAYER, layerIds[i]);
      }
    } else {
      pickLayers = [];
      var pickLayerIds = this.getViewContent(sideIdx);
      var allLayers = model.getAll(Model.ContentType.LAYER);
      for (i = 0; i < pickLayerIds.length; i++) {
        var layer = allLayers[pickLayerIds[i]];
        if (layer && layer.getState() === "VISIBLE") {
          pickLayers.push(layer);
        }
      }
    }

    if (!selector) {
      selector = new Selector(pickLayers, objectIds, p0, p1, pScreen, camera, intersectTolerance, isSelection);
    } else {
      selector.init(pickLayers, objectIds, p0, p1, pScreen, camera, intersectTolerance, isSelection);
    }

    for (i = 0; i < externalIntersectionHandlers.length; i++) {
      externalIntersectionHandlers[i].intersect(selector, p0, p1, pScreen);
    }

    // Adapt picking if HUD materials are present
    if (selector.getHudResults().length) {
      var hudMaterials = selector.getHudResults();
      hudMaterials.sort(function(a, b) {
        return (b.dist - a.dist);
      });

      var pickedHudMaterial = hudMaterials[hudMaterials.length-1];

      // Create ray intersecting picked HUD material
      var npScreen = tmpNPScreen;
      camera.projectPoint(pickedHudMaterial.center, npScreen);
      npScreen[0] = Math.round(npScreen[0]);
      npScreen[1] = Math.round(npScreen[1]);
      var np1 = tmpNP1;
      view.getPickRay(npScreen, p0, np1);

      // Cast ray through all non HUD materials
      checkSelector.init(pickLayers, objectIds, p0, np1, npScreen, camera, intersectTolerance, false);

      for (i = 0; i < externalIntersectionHandlers.length; i++) {
        externalIntersectionHandlers[i].intersect(checkSelector, p0, np1, npScreen);
      }

      // Check if the HUD material should be visible, if so alter selector
      // (We found that when comparing the icon's center-point with it's originally picked-point distance,
      //  the max error is 0.1% and since the HUDmaterial intersect routine adds 2% offset it's safe to ignore it)
      if (checkSelector.getMinResult().dist==null || pickedHudMaterial.dist <= checkSelector.getMinResult().dist) {
        selector.getMinResult().set(pickedHudMaterial.object, pickedHudMaterial.name, pickedHudMaterial.dist, pickedHudMaterial.normal, pickedHudMaterial.priority);
        selector.getMinResult().setIntersector("stage");
      }
    }

    return selector;
  }.bind(this);

  var tmpSelector = new Selector();
  tmpSelector.mode = "select";

  this.getIntersectTolerance = function() {
    return intersectTolerance;
  };

  this.setIntersectTolerance = function(tolerance) {
    if (tolerance == null) {
      tolerance = 1e-5;
    }

    intersectTolerance = tolerance;
  };

  this._select = function(point) {
    var pickResult = this._pick(point, this.highlightedObjectIds, null, true, tmpSelector);
    var minResult = pickResult.getMinResult();
    var object = minResult.object;

    this.onGeometryPicked(object, point, minResult);

    if (object) {
      var parentLayer = object.getParentLayer();
      if ((object === model.getSelection()) || (parentLayer && parentLayer.getInteraction() !== "PICKABLE")) {
        var faceRange = object.getFaceRangeFromTriangleNr(minResult.triangleNr);
        if ((faceRange==null || (model.getSelectionFaceRange()!=null && JSON.stringify(faceRange) === JSON.stringify(model.getSelectionFaceRange())))) {
          object = undefined;
        }
      }
    }

    if(this.selectionState) {
      this.setSelectionObject(object, false, faceRange);
    }
  };
  
  this.getViewExtent = function() {
    var M_V = Number.MAX_VALUE;
    
    var ext = {
      min: vec3d.create([ M_V,  M_V,  M_V]),
      max: vec3d.create([-M_V, -M_V, -M_V])
    };

    var layers = model.getAll(Stage.ModelContentType.LAYER);
    
    for (var name in layers) {
      if (layers[name].getObjects().length > 0) {
        
        var e = layers[name].getFullExtent();
        
        if (e !== undefined) {
          for (var i = 0; i < 3; ++i) {
            ext.min[i] = Math.min(ext.min[i], e[0][i]);
            ext.max[i] = Math.max(ext.max[i], e[1][i]);
          }
        }
      }
    }

    return ext;
  };

  this._updateViewExtent = function() {
    var newext = null;

    this.onViewExtentUpdated((function() {
      if (newext === null) {
        newext = this.getViewExtent();
      }

      return newext;
    }).bind(this));
  };

  this.getTextureGraphicsRenderer = function() {
    return view.getTextureGraphicsRenderer();
  };

  // debug helpers: these functions are meant for debug and testing use only. don't use in production code!

  this._getModule = function(moduleName) {
    switch (moduleName) {
      case "model": return model;
      case "view": return view;
      default: return view._getModule(moduleName);
    }
  };

  // private //

  var container = containerDiv;
  var model = new Model();
  var view = new View(container, this, model.getDirtySet(), options);
  var viewContent = [[], []];
  var renderGeometries =  [{}, {}];

  var externalIntersectionHandlers = [];

  view.setLights(model.getAmbientLight(), model.getDirectionalLight());

  this._debugHideFaceRange = function(objectId, featureIdx) {
    var objTest = this.getAll("objects")[objectId];
    objTest.hideFaceRange(objTest.getGeometryRecords()[0],0,[objTest.getMetadata().faceRanges[featureIdx]]);
  };

  this._debugHideAllFaceRange = function(objectId) {
    var objTest = this.getAll("objects")[objectId];
    for (var faceRangeIdx in objTest.getMetadata().faceRanges) {
      objTest.hideFaceRange(objTest.getGeometryRecords()[0], 0, [objTest.getMetadata().faceRanges[faceRangeIdx]]);
    }
  };

  this._debugUnhideFaceRange = function(objectId, featureIdx) {
    var objTest = this.getAll("objects")[objectId];
    objTest.unhideAllFaceRange();
  };

  this.registerMaterial = function(materialClass){
    view.registerMaterial(materialClass);
  };
};

Stage.DebugSettings = {
  fineGrainedContentValidation: false,
  endFrameContentValidation: false,
  logDirtySet: false
};

Stage.ModelContentType = Model.ContentType;

return Stage;

});
