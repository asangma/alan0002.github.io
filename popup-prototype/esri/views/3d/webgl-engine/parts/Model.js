/* jshint forin:false */
define([
  "dojo/string",
  "../lib/Light",
  "../lib/ModelContentType",  
  "../lib/ModelDirtySet",
  "../lib/RenderGeometry",
  "../lib/Util",
  "../lib/gl-matrix"
], function (string, Light, ModelContentType, ModelDirtySet, RenderGeometry, Util, glMatrix){
  var assert = Util.assert;
  var verify = Util.verify;
  var vec3 = glMatrix.vec3;
  var mat4d = glMatrix.mat4d;
  var logWithBase = Util.logWithBase;

  var MIN_GRID_SIZE = 10000.0;
  var SCALE = 10.0;


var Model = function() {
  var dirtySet = new ModelDirtySet(this);

  var initContent = function() {
    var result = {};
    for (var type in ModelContentType) {
      result[ModelContentType[type]] = {};
    }
    return result;
  };
  var content = initContent();

  var ambientLight = new Light.AmbientLight([1.0, 1.0, 1.0], 0.3, true, 0.5, 5.0, 3, 16);
  var directionalLight = new Light.DirectionalLight([1.0, 1.0, 1.0], 0.7, vec3.normalize([1.0, 1.0, 1.0]), 0.5, true);
  
  var selection;
  var selectionFaceRange;

  var modelListeners = [];

  this.getAll = function(contentType) {
    var container = content[contentType];
    assert(container !== undefined);
    return container;
  };

  this.get = function(contentType, contentObjectName) {
    return this.getAll(contentType)[contentObjectName];
  };

  this.add = function(contentType, contentObject) {
    var container = content[contentType];
    assert(container !== undefined);
    var id = contentObject.getId();
    assert(container[id] === undefined, "Model/Stage already contains object to be added");
    container[id] = contentObject;

    if (contentType === ModelContentType.LAYER) {
      this.notifyDirty(contentType, contentObject, "layerAdded");
    }

    notifyModelListeners("contentAdded", contentType, contentObject);
  };
  
  this.remove = function(contentType, contentObjectId) {
    var container = content[contentType];
    assert(container !== undefined);
    var contentObject = container[contentObjectId];
    assert(contentObject !== undefined, "Model/Stage doesn't contain object to be removed");
    delete container[contentObjectId];

    if (contentType === ModelContentType.TEXTURE) {
      contentObject.unload();   // TODO: is there a better place for this?
    }

    if (contentType === ModelContentType.LAYER) {
      this.notifyDirty(contentType, contentObject, "layerRemoved");
    }

    notifyModelListeners("contentRemoved", contentType, contentObject);

    return contentObject;
  };
  
  this.getDirtySet = function() {
    return dirtySet;
  };

  this.notifyDirty = function(contentType, contentObject, dirtyType, subObject) {
    dirtySet.handleUpdate(contentObject, dirtyType, subObject);
  };

  this.getAmbientLight = function() {
    return ambientLight;
  };

  this.setAmbientLight = function(light) {
    ambientLight.set(light);
  };
    
  this.getDirectionalLight = function() {
    return directionalLight;
  };

  this.setDirectionalLight = function(light) {
    directionalLight.set(light);
  };
  
  this.getSelection = function() {
    return selection;
  };

  this.setSelection = function(object, fr) {
    selection = object;
    selectionFaceRange = fr;
  };

  this.getSelectionFaceRange = function() {
    return selectionFaceRange;
  };


  var uniqueName2idx = {};
  var uniqueIdx = 0;
  
  var id2origin = {};
  
  //anti wobble: get origin using implicit octree
  var getOrigin = function(center, radius, scale) {
    scale = scale || SCALE;
    var level = 0; //level 0 == MIN_GRID_SIZE km grid
    var numMinGrid = radius * scale / MIN_GRID_SIZE;
    if (numMinGrid > 1.0) {
      level = Math.ceil(logWithBase(numMinGrid, 2.0));
    }
      
    var gridSize = Math.pow(2.0, level) * MIN_GRID_SIZE;
    
    var i = Math.round(center[0] / gridSize);
    var j = Math.round(center[1] / gridSize);
    var k = Math.round(center[2] / gridSize);
    
    var id = level + "_" + i + "_" + j + "_" + k;
    
    var originAndId = id2origin[id]; 
    if (originAndId === undefined) {
      originAndId = { "vec3" : vec3.createFrom(i * gridSize, j * gridSize, k * gridSize), "id" : id };
      id2origin[id] = originAndId;
    }    
    return originAndId;
  };
  this.getOrigin = getOrigin;

  this.getGeometryRenderGeometries = function(object, geometryRecord, result, objTrafo) {
    var oId = object.getId();
    var geometry = geometryRecord.geometry;
    var data = geometry.getData();
    var singleUse = !!geometry.singleUse;

    var dataFaces = data.getFaces();
    var dataVertexAttr = data.getVertexAttr();
    var dataId = data.getId();

    var geomMaterials = geometryRecord.materials;
    var instanceParameters = geometryRecord.instanceParameters;

    var transf = object.getCombinedTransformation(geometryRecord);
    var scale = mat4d.maxScale(transf);

    var specifiedOrigin = geometryRecord.origin;

    var indexRanges = object.getVisibleIndexRanges(geometryRecord);

    for (var k = 0, num = geometry.getNumGroups(); k < num; ++k) {
      var boundingInfo = geometry.getBoundingInfo(k);
      var uniqueName = geometryRecord.getId() + "#" + k;

      // Note (discussed with Basil): uniqueName and idx are kind of redundant, as they match 1:1. The
      // reason they coexist at the moment is that uniqueName is good for debugging and idx is good for
      // efficient code.
      var idx = uniqueName2idx[uniqueName];
      if (idx === undefined) {
        idx = uniqueIdx++;
        uniqueName2idx[uniqueName] = idx;
      }

      var vertexAttr = {};
      for (var name in dataFaces[k].indices) {
        vertexAttr[name] = dataVertexAttr[name];
      }

      var data2 = { "faces" : dataFaces[k], "vertexAttr" : vertexAttr, "id" : dataId + "#" + k };

      var renderGeometry = new RenderGeometry(data2, boundingInfo, geomMaterials[k], transf, scale,
        object.getCastShadow(), singleUse, oId, uniqueName, idx, k);
      renderGeometry.origin = specifiedOrigin || getOrigin(renderGeometry.center, renderGeometry.radius);
      renderGeometry.displayedIndexRange = indexRanges ? indexRanges[k] : null;
      renderGeometry.instanceParameters = instanceParameters ? geometryRecord.instanceParameters[k] : null;
      result.push(renderGeometry);
    }
  };

  this.formatDebugInfo = function(asHTML) {
    var result = [];
    var typeKey, type;

    if (asHTML){
      result[0] = "<table>";
      for (typeKey in ModelContentType) {
        type =  ModelContentType[typeKey];
        result[0] += "<tr><td>" + type + "</td><td style=\"text-align: right\">" + Object.keys(this.getAll(type)).length + "</td></tr>";
      }

      result[0] += "</table>";
      result[1] = dirtySet.formatDebugInfo(true);
    } else {
      result[0] = "";
      for (typeKey in ModelContentType) {
        type =  ModelContentType[typeKey];
        result[0] += string.pad(String(Object.keys(this.getAll(type)).length), 6, " ") + " " + type + ", ";
      }
      result[1] = dirtySet.formatDebugInfo(false);
    }
    return result;
  };

  this.validateContent = function() {
    var objects = this.getAll(ModelContentType.OBJECT);
    var name;
    for (name in objects) {
      this.validateObject(objects[name]);
    }

    var layers = this.getAll(ModelContentType.LAYER);
    for (name in layers) {
      this.validateLayer(layers[name]);
    }

    var materials = this.getAll(ModelContentType.MATERIAL);
    for (name in materials) {
      this.validateMaterial(materials[name]);
    }
  };
  
  this.validateObject = function(object) {
    var geometryRecords = object.getGeometryRecords();

    for (var i = 0; i < geometryRecords.length; ++i) {
      var geometryRecord = geometryRecords[i];
      assert(this.get(ModelContentType.GEOMETRY, geometryRecord.geometry.getId()) != null);
      var numGroups = geometryRecord.geometry.getNumGroups();
      assert(numGroups <= geometryRecord.materials.length, "object materials do not match geometry groups");
      verify(numGroups == geometryRecord.materials.length, "object materials do not match geometry groups");
      for (var j = 0; j < numGroups; ++j) {
        assert(this.get(ModelContentType.MATERIAL, geometryRecord.materials[j].getId()) != null);
      }
    }
  };
  
  this.validateLayer = function(layer) {
    var layerObjects = layer.getObjects();
    for (var i = 0; i < layerObjects.length; ++i) {
      var object = this.get(ModelContentType.OBJECT, layerObjects[i].getId());
      assert(object != null);
    }    
  };
  
  this.validateMaterial = function(material) {
    var textureIds = material.getAllTextureIds();
    for (var i = 0; i < textureIds.length; ++i) {
      var texture = this.get(ModelContentType.TEXTURE, textureIds[i]);
      assert(texture != null);
    }    
  };

  this.addModelListener = function(listener){
    assert(modelListeners.indexOf(listener) === -1);
    modelListeners.push(listener);
  };

  this.removeModelListener = function(listener) {
    var idx = modelListeners.indexOf(listener);
    assert(idx !== -1);
    modelListeners.splice(idx, idx);
  };

  function notifyModelListeners(eventType, _args) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    modelListeners.forEach(function(listener){
      if (listener[eventType] !== undefined) {
        listener[eventType].apply(this, args);
      }
    });
  }
};
Model.ContentType = ModelContentType;
return Model;
});