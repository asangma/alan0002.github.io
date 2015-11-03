define([
  "./IdGen",
  "./Octree",
  "./PerformanceTimer",
  "./Util",
  "./gl-matrix",
  "../parts/Model"
  ], function (IdGen, Octree, PerformanceTimer, Util, glMatrix, Model) {

  var vec3d = glMatrix.vec3d;

  var __Layer_idGen = new IdGen();

  // params: group, state, interaction, translation, initialExtent, fullExtent, spatialAcceleration
  var Layer = function Layer(name, params, idHint) {
    var id = __Layer_idGen.gen(idHint);
    this.getId = function() { return id; };

    params = params || {};
    var group = params.group || "";
    var state = params.state || "VISIBLE";
    var interaction = params.interaction || "PICKABLE";
    var translation = params.translation || [0,0,0];
    var spatialAcceleration = params.spatialAcceleration || "octree";

    var extent = params.initialExtent || params.fullExtent || [0, 0, 1000, 1000];
    var extentDirty = !params.initialExtent;

    var parentStages = [];
    
    this.getParentStages = function() {
      return parentStages;
    };

    this.addParentStage = function(stage) {
      if (parentStages.indexOf(stage) == -1) {
        parentStages.push(stage);
      }
    };

    this.removeParentStage = function(stage) {
      var idx = parentStages.indexOf(stage);

      if (idx > -1) {
        parentStages.splice(idx, 1);
      }
    };

    var childObjects = [];

    this.getName = function() {
      return name;
    };
    
    this.getGroup = function() {
      return group;
    };
    
    this.getState = function() {
      return state;
    };
    
    this.getInteraction = function() {
      return interaction;
    };

    this.getTranslation = function() {
      return translation;
    };

    this.getObjectIds = function() {
      return childObjects.map(function(ele) {
        return ele.getId();
      });
    };

    this.getObjects = function() {
      return childObjects;
    };

    this.setState = function (_state) {
      state = _state;
    };

    this.getSpatialAcceleration = function () {
      return spatialAcceleration;
    };

    this.setSpatialAcceleration = function(v) {
      if (v != spatialAcceleration) {
        spatialAcceleration = v;
        this._spatialAccelerator = undefined;
      }
    };

    this.getExtent = function() {
      updateExtent();
      return extent;
    };

    this.getFullExtent = function() {
      return params.fullExtent || this.getExtent();
    };

    this.addObject = function(object3d) {
      childObjects.push(object3d);
      object3d.addParentLayer(this);
      this.notifyDirty("layObjectAdded", object3d);
      invalidateExtent();

      if (this._spatialAccelerator) {
        this._spatialAccelerator.addObject(object3d);
      }
    };

    this.hasObject = function(object3d) {
      return childObjects.indexOf(object3d) > -1;
    };

    this.removeObject = function(object3d) {
      var idx = childObjects.indexOf(object3d);

      if (idx > -1) {
        childObjects.splice(idx, 1);
        object3d.removeParentLayer(this);
        this.notifyDirty("layObjectRemoved", object3d);
        invalidateExtent();
        
        if (this._spatialAccelerator) {
          this._spatialAccelerator.removeObject(object3d);
        }

        return true;
      }
      return false;
    };

    this.replaceObject = function(oldObject3d, newObject3d) {
      var idx = childObjects.indexOf(oldObject3d);
      Util.assert(idx > -1, "Layer.replaceObject: layer doesn't contain specified object");
      childObjects[idx] = newObject3d;
      oldObject3d.removeParentLayer(this);
      newObject3d.addParentLayer(this);
      this.notifyDirty("layObjectReplaced", [oldObject3d, newObject3d]);
      invalidateExtent();

      if (this._spatialAccelerator) {
        this._spatialAccelerator.removeObject(oldObject3d);
        this._spatialAccelerator.addObject(newObject3d);
      }
    };

    this.notifyObjectBBChanged = function(object, oldBBData) {
      if (this._spatialAccelerator) {
        this._spatialAccelerator.updateObject(object, oldBBData);
      }
    };

    this.getCenter = function() {
      updateExtent();
      var result = vec3d.create();

      return vec3d.lerp(extent[0], extent[1], 0.5, result);
    };

    this.getBSRadiusApprox = function() {
      updateExtent();
      return vec3d.dist(extent[0], extent[1]) * 0.5;
    };

    this.getSpatialQueryAccelerator = function() {
      if (spatialAcceleration === "octree") {
        if (this._spatialAccelerator) {
          return this._spatialAccelerator;
        }
        else if (childObjects.length > 50) {
          createOctree(this);
          return this._spatialAccelerator;
        }
      }
      return undefined;
    };

    var createOctree = function(that) {
      var e = params.fullExtent || that.getExtent();
      var maxSize = 0;

      for (var j = 0; j < 3; j++) {
        maxSize = Math.max(maxSize, e[1][j]-e[0][j]);
      }

      var center = vec3d.create();
      vec3d.lerp(e[0], e[1], 0.5, center);

      var perf = new PerformanceTimer(1);
      perf.start();

      that._spatialAccelerator = new Octree(maxSize*1.2, center);

      for (var i = 0; i < childObjects.length; i++) {
        that._spatialAccelerator.addObject(childObjects[i]);
      }

      var time = perf.stop();
      console.log("Octree for layer " + that.getId() + " created in " + Math.round(time) + " ms");
    };

    var invalidateExtent = function() {
      extentDirty = true;
    };

    var updateExtent = function() {
      if (!extentDirty) {
        return;
      }

      if (childObjects.length === 0) {
        extent = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]];
        return;
      }

      var object0 = childObjects[0];
      extent = [vec3d.create(object0.getBBMin()), vec3d.create(object0.getBBMax())];

      for (var i = 0; i < childObjects.length; ++i) {
        var object = childObjects[i];
        var bbMin = object.getBBMin();
        var bbMax = object.getBBMax();
        for (var j = 0; j < 3; ++j) {
          extent[0][j] = Math.min(extent[0][j], bbMin[j]);
          extent[1][j] = Math.max(extent[1][j], bbMax[j]);
        }
      }

      extentDirty = false;
    };

    this.notifyDirty = function (dirtyType, subObject, contentType, otherObj) {
      contentType = contentType || Model.ContentType.LAYER;
      var obj = otherObj || this;
      for (var i = 0; i < parentStages.length; i++) {
        parentStages[i].notifyDirty(contentType, obj, dirtyType, subObject);
      }
    };

  };

  return Layer;
});