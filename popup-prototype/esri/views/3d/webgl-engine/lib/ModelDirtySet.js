/* jshint forin:false, bitwise:false */
define(["./ModelContentType", "./ModelDirtyTypes", "./Util"], function (ModelContentType, ModelDirtyTypes, Util){
  var ModelDirtySet = function(model) {
    var objectEmpty = Util.objectEmpty;
    var assert = Util.assert;

    // residentGeomRecords structure: {layerId -> {objectId -> { geomRecordId -> [ GeometryRecord, [ RenderGeometry] ] } } },
    var residentGeomRecords = {};

    // dirtyGeomRecords structure: {layerId -> {objectId -> { geomRecordId -> [ GeometryRecord, ModelDirtyTypes.GeomDirtyType ] } } },
    var dirtyGeomRecords = {};

    var dirtyMaterials = {};

    this._getResidentGeometryRecords = function() {
      return residentGeomRecords;
    };
    this._getDirtyGeometryRecords = function() {
      return dirtyGeomRecords;
    };

    this.getDirtyMaterials = function() {
      return objectEmpty(dirtyMaterials) ? null : dirtyMaterials;
    };

    this.clearDirtyMaterials = function() {
      dirtyMaterials = {};
    };

    this.hasDirtyGeometryRecords = function() {
      for (var layerId in dirtyGeomRecords) {
        for (var objectId in dirtyGeomRecords[layerId]) {
          var objectDirtyRecords = dirtyGeomRecords[layerId][objectId];
          if (objectDirtyRecords && !objectEmpty(objectDirtyRecords)) {
            return true;
          }
        }
      }
      return false;
    };

    this.getDirtyLayers = function() {
      var result = {};
      for (var layerId in dirtyGeomRecords) {
        for (var objectId in dirtyGeomRecords[layerId]) {
          var objectDirtyRecords = dirtyGeomRecords[layerId][objectId];
          if (objectDirtyRecords && (objectDirtyRecords.length > 0)) {
            result[layerId] = model.get(ModelContentType.LAYER, layerId);
            break;
          }
        }
      }
      return result;
    };

    this.handleUpdate = function(contentObject, dirtyType, subObjects) {
      assert(this[dirtyType], "ModelDirtySet doesn't know how to process " + dirtyType);
      return this[dirtyType](contentObject, subObjects);
    };

    // Returns all RenderGeometries to be added and removed according to current dirty set.
    // Return type: [ [RenderGeometry to add], [RenderGeometry to remove] ]
    this.getAddRemoveUpdateList = function(commitChanges) {
      return this.getAddRemoveUpdateListFilteredByLayers(Object.keys(dirtyGeomRecords), commitChanges);
    };

    // Returns RenderGeometries to be added and removed according to current dirty set for the layer IDs
    // given in the array filterLayerIds. Return type: [ [RenderGeometry to add], [RenderGeometry to remove] ]
    this.getAddRemoveUpdateListFilteredByLayers = function(filterLayerIds, commitChanges) {
      var toAdd = [], toRemove = [], toUpdate=[];
      for (var li = 0; li < filterLayerIds.length; li++) {
        var layerId = filterLayerIds[li];
        if (layerId in dirtyGeomRecords) {
          for (var objectId in dirtyGeomRecords[layerId]) {
            var objectDirtyRecords = dirtyGeomRecords[layerId][objectId];
            if (objectDirtyRecords) {
              var objectResidentRecords = createObjectRecordObjIfNonexistent(residentGeomRecords, layerId, objectId);
              for (var dirtyGeomRecordId in objectDirtyRecords) {
                var dirtyTuple = objectDirtyRecords[dirtyGeomRecordId];
                var dirtyGeomRecord = dirtyTuple[0];
                var dirtyType = dirtyTuple[1];
                var dirtyTypeParameters = dirtyTuple[2];                
                var isReinsertUpdate = (dirtyType&ModelDirtyTypes.GeomDirtyType.UPDATE) && (dirtyTypeParameters&ModelDirtyTypes.UpdateTypes.REINSERT) ;
                var residentTuple, object;

                if ((dirtyType & ModelDirtyTypes.GeomDirtyType.REMOVE)||isReinsertUpdate) {
                  residentTuple = objectResidentRecords[dirtyGeomRecordId];
                  if (residentTuple) {
                    toRemove.push.apply(toRemove, residentTuple[1]);
                  }
                  else if (dirtyType === ModelDirtyTypes.GeomDirtyType.REMOVE) {
                    assert(false, "ModelDirtySet.getAddRemoveListFilteredByLayers: invalid remove");
                  }

                  if (commitChanges && residentTuple) {
                    delete objectResidentRecords[dirtyGeomRecordId];
                  }
                }

                if ((dirtyType & ModelDirtyTypes.GeomDirtyType.ADD)||isReinsertUpdate) {
                  var newResidentTuple = [dirtyGeomRecord, []];
                  object = model.get(ModelContentType.OBJECT, objectId);
                  model.getGeometryRenderGeometries(object, dirtyGeomRecord, newResidentTuple[1]);
                  toAdd.push.apply(toAdd, newResidentTuple[1]);
                  if (commitChanges) {
                    objectResidentRecords[dirtyGeomRecordId] = newResidentTuple;
                  }
                }
                
                if ((dirtyType&ModelDirtyTypes.GeomDirtyType.UPDATE) && !isReinsertUpdate) {
                  residentTuple = objectResidentRecords[dirtyGeomRecordId];
                  object = model.get(ModelContentType.OBJECT, objectId);
                  if (residentTuple) {
                    var renderGeometries = residentTuple[1],
                      numRenderGeometries = renderGeometries.length,
                      renderGeometryIdx, renderGeometry;


                    //update render geometry
                    //TODO this is not a good place for this. Move to separate function?
                    if (dirtyTypeParameters & ModelDirtyTypes.UpdateTypes.FACERANGE) {
                      var indexRanges = object.getVisibleIndexRanges(dirtyGeomRecord);
                      for (renderGeometryIdx = 0; renderGeometryIdx < numRenderGeometries; renderGeometryIdx++) {
                        renderGeometry = renderGeometries[renderGeometryIdx];
                        if (indexRanges) {
                          renderGeometry.displayedIndexRange = indexRanges[renderGeometry.componentIdx];
                        } else {
                          renderGeometry.displayedIndexRange = undefined;
                        }
                      }
                    }

                    if (dirtyTypeParameters & ModelDirtyTypes.UpdateTypes.TRANSFORMATION) {
                      for (renderGeometryIdx = 0; renderGeometryIdx < numRenderGeometries; renderGeometryIdx++) {
                        renderGeometry = renderGeometries[renderGeometryIdx];
                        object.getCombinedTransformation(dirtyGeomRecord, renderGeometry.transformation);
                        renderGeometry.updateTransformation(renderGeometry.transformation);
                      }
                    }

                    for (renderGeometryIdx = 0; renderGeometryIdx < numRenderGeometries; renderGeometryIdx++) {
                      renderGeometry = renderGeometries[renderGeometryIdx];
                      toUpdate.push({renderGeometry: renderGeometry, updateType: dirtyTypeParameters});
                    }
                  }
                  else {
                    assert(false, "ModelDirtySet.getAddRemoveListFilteredByLayers: invalid update");
                  }
                }
              }
            }
          }
        }
        if (commitChanges) {
          delete dirtyGeomRecords[layerId];
        }
      }

      return [toAdd, toRemove, toUpdate];
    };

    this.getResidentRenderGeometries = function() {
      return this.getResidentRenderGeometriesFilteredByLayers(Object.keys(residentGeomRecords));
    };

    this.getResidentRenderGeometriesFilteredByLayers = function(filterLayerIds) {
      var result = [];
      for (var li = 0; li < filterLayerIds.length; li++) {
        var layerId = filterLayerIds[li];
        if (layerId in residentGeomRecords) {
          for (var objectId in residentGeomRecords[layerId]) {
            var objectResidentRecords = residentGeomRecords[layerId][objectId];
            if (objectResidentRecords) {
              for (var residentGeomRecordId in objectResidentRecords) {
                result.push.apply(result, objectResidentRecords[residentGeomRecordId][1]);
              }
            }
          }
        }
      }
      return result;
    };

    // Implementation of dirty notifications
    this.hideFaceRange = function(object, geometryRecord, parentLayerId) {      
      parentLayerId = parentLayerId || getParentLayerId(object);

      updateOrCreateDirtyRecord(object, geometryRecord, parentLayerId, ModelDirtyTypes.GeomDirtyType.UPDATE, 0, 0,
        ModelDirtyTypes.GeomDirtyType.UPDATE, ModelDirtyTypes.GeomDirtyType.ADD | ModelDirtyTypes.GeomDirtyType.REMOVE,
        ModelDirtyTypes.UpdateTypes.FACERANGE);
    };
  
    this.unhideAllFaceRange = function(object, parentLayerId) {
      for (var i=0; i<object.getGeometryRecords().length; i++) {
        updateOrCreateDirtyRecord(object, object.getGeometryRecords()[i], parentLayerId, ModelDirtyTypes.GeomDirtyType.UPDATE, 0, 0,
          ModelDirtyTypes.GeomDirtyType.UPDATE, ModelDirtyTypes.GeomDirtyType.ADD | ModelDirtyTypes.GeomDirtyType.REMOVE,
          ModelDirtyTypes.UpdateTypes.FACERANGE);
      }
    };

    this.vertexAttrsUpdated = function(object, geometryRecord, parentLayerId) {
      updateOrCreateDirtyRecord(object, geometryRecord, parentLayerId, ModelDirtyTypes.GeomDirtyType.UPDATE, 0, 0,
        ModelDirtyTypes.GeomDirtyType.UPDATE, ModelDirtyTypes.GeomDirtyType.ADD | ModelDirtyTypes.GeomDirtyType.REMOVE,
        ModelDirtyTypes.UpdateTypes.VERTEXATTRS);
    };

    this.colorAttrsUpdated = function(object, geometryRecord, parentLayerId) {
      updateOrCreateDirtyRecord(object, geometryRecord, parentLayerId, ModelDirtyTypes.GeomDirtyType.UPDATE, 0, 0,
        ModelDirtyTypes.GeomDirtyType.UPDATE, ModelDirtyTypes.GeomDirtyType.ADD | ModelDirtyTypes.GeomDirtyType.REMOVE,
        ModelDirtyTypes.UpdateTypes.COLORATTRS);
    };

    this.matChanged = function(material) {
      dirtyMaterials[material.getId()] = true;
    };

    this.layerAdded = function(layer) {
      var objects = layer.getObjects();
      for (var i = 0; i <objects.length; i++) {
        this.layObjectAdded(layer, objects[i]);
      }
    };

    this.layerRemoved = function(layer) {
      var objects = layer.getObjects();
      for (var i = 0; i <objects.length; i++) {
        this.layObjectRemoved(layer, objects[i]);
      }
    };

    this.layObjectAdded = function(layer, object) {
      var layerId = layer.getId();
      var geoRecords = object.getGeometryRecords();
      for (var i = 0; i < geoRecords.length; i++) {
        this.objGeometryAdded(object, geoRecords[i], layerId);
      }
    };

    this.layObjectRemoved = function(layer, object) {
      var layerId = layer.getId();
      var geoRecords = object.getGeometryRecords();
      for (var i = 0; i < geoRecords.length; i++) {
        this.objGeometryRemoved(object, geoRecords[i], layerId);
      }
    };

    this.layObjectReplaced = function(layer, objects) {
      this.layObjectRemoved(layer, objects[0]);
      this.layObjectAdded(layer, objects[1]);
    };

    this.objDirty = function(object, parentLayerId) {
      parentLayerId = parentLayerId || getParentLayerId(object);
      var objectId = object.getId();

      var objectResidentRecords = createObjectRecordObjIfNonexistent(residentGeomRecords, parentLayerId, objectId);
      for (var geomRecordId in objectResidentRecords) {
        updateOrCreateDirtyRecord(object, objectResidentRecords[geomRecordId][0], parentLayerId,
          ModelDirtyTypes.GeomDirtyType.UPDATE, /* actionType */
          0, /* cancelTypes */
          ModelDirtyTypes.GeomDirtyType.UPDATE, /* overwriteTypes */
          0, /* updateTypes */
          ModelDirtyTypes.GeomDirtyType.ADD | ModelDirtyTypes.GeomDirtyType.REMOVE, /* yieldToTypes */
          ModelDirtyTypes.UpdateTypes.REINSERT);
      }
    };

    this.objTransformation = function(object, parentLayerId) {
      parentLayerId = parentLayerId || getParentLayerId(object);
      var objectId = object.getId();

      var objectResidentRecords = createObjectRecordObjIfNonexistent(residentGeomRecords, parentLayerId, objectId);
      for (var geomRecordId in objectResidentRecords) {
        updateOrCreateDirtyRecord(object, objectResidentRecords[geomRecordId][0], parentLayerId,
          ModelDirtyTypes.GeomDirtyType.UPDATE, /* actionType */
          0, /* cancelTypes */
          0, /* overwriteTypes */
          ModelDirtyTypes.GeomDirtyType.UPDATE, /* updateTypes */
          ModelDirtyTypes.GeomDirtyType.ADD | ModelDirtyTypes.GeomDirtyType.REMOVE, /* yieldToTypes */
          ModelDirtyTypes.UpdateTypes.TRANSFORMATION);
      }
    };

    this.objGeometryAdded = function(object, geomRecord, parentLayerId) {
      updateOrCreateDirtyRecord(object, geomRecord, parentLayerId, ModelDirtyTypes.GeomDirtyType.ADD,
        ModelDirtyTypes.GeomDirtyType.REMOVE, 0, 0, 0);
    };

    this.objGeometryRemoved = function(object, geomRecord, parentLayerId) {
      updateOrCreateDirtyRecord(object, geomRecord, parentLayerId,
        ModelDirtyTypes.GeomDirtyType.REMOVE,
        ModelDirtyTypes.GeomDirtyType.ADD,
        ModelDirtyTypes.GeomDirtyType.UPDATE,
        0, 0);
    };

    this.objGeometryReplaced = function(object, geomRecords) {
      this.objGeometryRemoved(object, geomRecords[0]);
      this.objGeometryAdded(object, geomRecords[1]);
    };

    this.objGeometryTransformation = function(object, geomRecords) {
      this.objGeometryReplaced(object, geomRecords);
    };

    // This function checks if dirtyGeomRecords already contains an entry of the given geomRecord.
    // If not, it creates one with the given actionType ( = ModelDirtyTypes.GeomDirtyType).
    // If yes, it updates the record according to the rules defined by cancelTypes, overwriteTypes, and yieldToTypes:
    // - it will delete the existing record if is of type cancelType (e.g. REMOVE after ADD)
    // - it will overwrite existing record of type overwriteTypes (e.g. REMOVE after UPDATE)
    // - it will do nothing if existing record is of type yieldToType (e.g. UPDATE after ADD)
    function updateOrCreateDirtyRecord(object, geomRecord, parentLayerId, actionType, cancelTypes, overwriteTypes,
                                       updateTypes, yieldToTypes, actionParameters) {
      parentLayerId = parentLayerId || getParentLayerId(object);
      var objectId = object.getId();
      var geomRecordId = geomRecord.getId();

      var records = createObjectRecordObjIfNonexistent(dirtyGeomRecords, parentLayerId, objectId);
      var dirtyTuple = records[geomRecordId];
      if (dirtyTuple) {
        var dirtyType = dirtyTuple[1];
        if (dirtyType & cancelTypes) {
          delete records[geomRecordId];
        }
        else if (dirtyType & overwriteTypes) {
          dirtyTuple[1] = actionType;
          dirtyTuple[2] = actionParameters;
        }
        else if (dirtyType & updateTypes) {
          dirtyTuple[2] |= actionParameters;
        } else if (!(dirtyType & yieldToTypes)) {
          assert("ModelDirtySet.objGeometryAdded: inconsistent state");
        }
      }
      else {
        records[geomRecordId] = [geomRecord, actionType, actionParameters];
      }
    }

    function createObjectRecordObjIfNonexistent(recordStruc, layerId, objectId) {
      if (!recordStruc[layerId]) {
        recordStruc[layerId] = {};
      }
      if (!recordStruc[layerId][objectId]) {
        recordStruc[layerId][objectId] = {};
      }
      return recordStruc[layerId][objectId];
    }

    function getParentLayerId(object) {
      return object.getParentLayer().getId();
    }

    this.formatDebugInfo = function(asHTML) {
      var dirtyTypeStrings = ["ADD", "UPD", undefined, "REM"];
      if (asHTML) {
        return "";
      } else {
        var result = "";
        for (var layerId in dirtyGeomRecords) {
          for (var objectId in dirtyGeomRecords[layerId]) {
            var objectDirtyRecords = dirtyGeomRecords[layerId][objectId];
            if (objectDirtyRecords) {
              if (result.length > 0) {
                result += "\n";
              }
              result += layerId+"."+objectId;
              var sortedByType = [];
              for (var geomRecordId in objectDirtyRecords) {
                var dirtyType = objectDirtyRecords[geomRecordId][1];
                if (!sortedByType[dirtyType]) {
                  sortedByType[dirtyType] = [];
                }
                sortedByType[dirtyType].push(objectDirtyRecords[geomRecordId][0].geometry.getId());
              }
              for (var ti = 0; ti < sortedByType.length; ti++) {
                if (sortedByType[ti]) {
                  result += " " + dirtyTypeStrings[ti-1] + ": ";
                  for (var di = 0; di < sortedByType[ti].length; di++) {
                    result += sortedByType[ti][di] + ", ";
                  }
                }
              }
            }
          }
        }
        return result;
      }
    };
  };
  return ModelDirtySet;
});