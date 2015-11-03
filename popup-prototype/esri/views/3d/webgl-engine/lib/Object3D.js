define([
  "./IdGen",
  "./Util",
  "./gl-matrix",
  "../parts/Model",
  "./IntervalUtilities"
],
//AMD TODO: actually use provided classes
function (IdGen, Util, glMatrix, Model, IntervalUtilities){

  var assert = Util.assert;
  var mat4d = glMatrix.mat4d;
  var vec3d = glMatrix.vec3d;
  var VertexAttrConstants = Util.VertexAttrConstants;
  
  var __Object3D_idGen = new IdGen();
  var __GeometryRecord_idGen = new IdGen();

  var GeometryRecord = function(geometry, materials, transformation, instanceParameters, origin) {
    var id = __GeometryRecord_idGen.gen(geometry.getId());
    this.getId = function() { return id; };

    this.geometry = geometry;
    this.materials = materials;
    this.transformation = transformation;
    this.instanceParameters = instanceParameters;
    this.origin = origin;
  };

  //parameters: name, geometries, materials, transformations, castShadow, metadata, idHint
  var Object3D = function(params) {
    var that = this;
    var id = __Object3D_idGen.gen(params.idHint);
    this.getId = function() { return id; };

    var name = params.name;
    var castShadow = (params.castShadow != null) ? params.castShadow : true;
    var metadata = params.metadata || {};

    var parentLayer;
    this.getParentLayer = function() { return parentLayer; };
    this.addParentLayer = function(layer) {
      assert(parentLayer === undefined, "Object3D can only be added to a single Layer");
      parentLayer = layer;
    };
    this.removeParentLayer = function(layer) {
      parentLayer = undefined;
    };

    var geometryRecords, geometries;
    if (Array.isArray(params.geometries)) {
      assert(params.materials.length === params.geometries.length, "Object3D: materials don't match geometries");
      assert(params.transformations.length === params.geometries.length, "Object3D: transformations don't match geometries");
      geometryRecords = new Array(params.geometries.length);
      geometries = params.geometries.slice();
      for (var i = 0; i < params.geometries.length; i++) {
        assert(params.materials[i] instanceof Array, "Object3D: materials parameter must be array of array");
        geometryRecords[i] = new GeometryRecord(params.geometries[i],
          params.materials[i].slice(),
          mat4d.create(params.transformations[i]),
          params.instanceParameters ? params.instanceParameters.slice() : undefined);
      }
    }
    else {
      geometryRecords = [];
      geometries = [];
    }

    var objectTransformation = mat4d.identity();

    var BBData = function() {
      this.min = vec3d.create();
      this.max = vec3d.create();
      this.center = vec3d.create();

      this.init = function() {
        vec3d.set3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this.min);
        vec3d.set3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this.max);
      };
    };

    var bbObjectSpace = new BBData();
    var bbWorldSpace = new BBData();
    var bbDirty = true;

    var bsRadius;
    var bsRadiusScaled;

    this.getNumGeometryRecords = function() {
      return geometryRecords.length;
    };

    this.getFirstGeometryIndex = function(geometry) {
      var index = geometries.indexOf(geometry);
      assert(index > -1, "Object3D.getFirstGeometryIndex: geometry not found");
      return index;
    };

    this.findGeometryRecords = function(geometry) {
      var result = [];
      for (var i = 0; i < geometries.length; i++) {
        if (geometries[i] === geometry) {
          result.push(geometryRecords[i]);
        }
      }
      return result;
    };

    this.getGeometryRecord = function(index) {
      assert((index >=0) && (index < geometryRecords.length), "Object3d.getGeometryDataByIndex: index out of range");
      return geometryRecords[index];
    };

    this.getGeometryRecords = function() {
      return geometryRecords;
    };


    this.addGeometry = function(geometry, materials, transformation,
                                instanceParameters /* optional */, localOrigin /* optional*/) {
      assert(materials instanceof Array, "Object3D.addGeometry: materials must be array");
      geometries.push(geometry);
      var record = new GeometryRecord(geometry, materials.slice(), mat4d.create(transformation),
        instanceParameters, localOrigin);
      geometryRecords.push(record);
      this.notifyDirty("objGeometryAdded", record);
      invalidateBoundingData();
      return record;
    };

    this.hasGeometry = function(geometry) {
      return geometries.indexOf(geometry) > -1;
    };

    this.removeGeometry = function(index) {
      var record = geometryRecords.splice(index, 1)[0];
      geometries.splice(index, 1);
      this.notifyDirty("objGeometryRemoved", record);
      invalidateBoundingData();
      return record;
    };

    this.replaceGeometry = function(index, newGeometry) {
      assert((index >=0) && (index < geometryRecords.length), "Object3d.replaceGeometry: index out of range");
      var oldRecord = geometryRecords[index];
      var newRecord = new GeometryRecord(newGeometry, oldRecord.materials, oldRecord.transformation);
      geometryRecords[index] = newRecord;
      geometries[index] = newGeometry;
      this.notifyDirty("objGeometryReplaced", [oldRecord, newRecord]);
      invalidateBoundingData();
      return oldRecord.geometry;
    };

    this.replaceGeometryMaterials = function(index, newMaterials) {
      assert((index >=0) && (index < geometryRecords.length), "Object3d.replaceGeometryMaterials: index out of range");
      var oldRecord = geometryRecords[index];
      var oldMaterials = oldRecord.materials;
      var newRecord = new GeometryRecord(oldRecord.geometry, newMaterials.slice(), oldRecord.transformation);
      geometryRecords[index] = newRecord;
      this.notifyDirty("objGeometryReplaced", [oldRecord, newRecord]);
      return oldMaterials;
    };

    this.geometryVertexAttrsUpdated = function(index) {
      var geometryRecord = geometryRecords[index];
      this.notifyDirty("vertexAttrsUpdated", geometryRecord);
      invalidateBoundingData();
    };

    this.geometryColorAttrsUpdated = function(index) {
      var geometryRecord = geometryRecords[index];
      this.notifyDirty("colorAttrsUpdated", geometryRecord);
    };

    var hiddenIndexRanges = {};
    var visibleIndexRanges = {};

    this.getHiddenIndexRanges = function(geometryRecord) {
      return hiddenIndexRanges[geometryRecord.getId()];
    };

    this.getVisibleIndexRanges = function(geometryRecord) {
       return visibleIndexRanges[geometryRecord.getId()];
    };

    this.isAllHidden = function() {

      for (var i=0; i<geometryRecords.length; i++) {
        var geomRec =  geometryRecords[i];

        var numComps = geomRec.geometry.getData().getFaces().length;
        var indexRanges = this.getVisibleIndexRanges(geomRec);
        if (!indexRanges) {
          return false;
        }

        for (var component = 0; component<numComps;component++) {
          var indexRangesComp = indexRanges[component];
          if (!indexRangesComp) {
            return false;
          }

          if (indexRangesComp.length>0) {
            return false;
          }
        }
      }

      return true;
    };

    this.setFacerangeColors = function(faceRangeColors, mode) {

      var geoRecords = this.getGeometryRecords();

      if (geoRecords.length!=1)
      {
        //todo extend to arbitrary geometries
        console.warn("face range colors currently support only one geometry record");
        return;
      }

      var geometry = geoRecords[0].geometry;
      var va = geometry.getData().getVertexAttr();

      if (geometry.backupColors==null) {
        var colorData = va[VertexAttrConstants.COLOR].data;
        geometry.backupColors = new Uint8Array(colorData,0,colorData.byteLength);
      }

      var data = va[VertexAttrConstants.COLOR].data;

      if (data==null) {
        return;
      }

      for (var frIdx=0; frIdx<faceRangeColors.length; frIdx++) {
        var fr = faceRangeColors[frIdx];
        var rangeStart = (fr.faceRanges==null?0:fr.faceRanges[0]*4*3);
        var rangeEnd = (fr.faceRanges==null?data.length:(fr.faceRanges[1]+1)*4*3);
        var i;
        var col0, col1, col2, col3;
        if (fr.color!=null) {
          if (mode === "blend") {
            col0 = fr.color[0];
            col1 = fr.color[1];
            col2 = fr.color[2];
            col3 = fr.color[3];
            for (i = rangeStart; i < rangeEnd; i += 4) {
              data[i + 0] = geometry.backupColors[i + 0] * col0;
              data[i + 1] = geometry.backupColors[i + 1] * col1;
              data[i + 2] = geometry.backupColors[i + 2] * col2;
              data[i + 3] = geometry.backupColors[i + 3] * col3;
            }
          } else { // mode === "replace"
            col0 = fr.color[0] * 255;
            col1 = fr.color[1] * 255;
            col2 = fr.color[2] * 255;
            col3 = fr.color[3] * 255;
            for (i = rangeStart; i < rangeEnd; i += 4) {
              data[i + 0] = col0;
              data[i + 1] = col1;
              data[i + 2] = col2;
              data[i + 3] = col3;
            }
          }
        } else {
          for (i = rangeStart; i < rangeEnd; i++) {
            data[i] =  geometry.backupColors[i];
          }
        }
      }

      this.geometryColorAttrsUpdated(0);
    };

    this.isPartiallyHidden = function() {

      for (var i=0; i<geometryRecords.length; i++) {
        var geomRec =  geometryRecords[i];

        var numComps = geomRec.geometry.getData().getFaces().length;
        var indexRanges = this.getHiddenIndexRanges(geomRec);
        if (!indexRanges) {
          continue;
        }

        for (var component = 0; component<numComps;component++) {
          var indexRangesComp = indexRanges[component];
          if (!indexRangesComp) {
            continue;
          }

          if (indexRangesComp.length>0) {
            return true;
          }
        }
      }
      return false;
    };

    /* faceRanges are specified as an array of intervals, where an interval is an array of two elements.
       see IntervalUtilites.js*/
    this.hideFaceRange = function(geometryRecord, faceRanges) {

      var geometryRecordId = geometryRecord.getId();

      if (hiddenIndexRanges[geometryRecordId]===undefined) {
        hiddenIndexRanges[geometryRecordId] = {};
        visibleIndexRanges[geometryRecordId] = {};
      }

      for (var component = 0; component<geometryRecord.geometry.getData().getFaces().length; component++) {

        if (hiddenIndexRanges[geometryRecordId][component]===undefined) {
          hiddenIndexRanges[geometryRecordId][component] = [];
          visibleIndexRanges[geometryRecordId][component] = [];
        }
        var cpy = IntervalUtilities.copyIntervals(faceRanges);
        IntervalUtilities.convertFaceToIndexRange(cpy,3);

        var componentRange = geometryRecord.geometry.getData().getFaces()[component].componentRange;

        cpy = IntervalUtilities.intersectIntervals(cpy, componentRange);
        cpy = IntervalUtilities.offsetIntervals(cpy, -componentRange[0]);




        hiddenIndexRanges[geometryRecordId][component] = hiddenIndexRanges[geometryRecordId][component].concat(cpy);
        hiddenIndexRanges[geometryRecordId][component] = IntervalUtilities.mergeIntervals(hiddenIndexRanges[geometryRecordId][component]);

        if (hiddenIndexRanges.length === 0) {
          delete visibleIndexRanges[geometryRecordId];
          delete hiddenIndexRanges[geometryRecordId];

        }
        else {
          var numVerts = geometryRecord.geometry.getData().getFaces()[component].indices.position.length;
          visibleIndexRanges[geometryRecordId][component] = IntervalUtilities.invertIntervals(hiddenIndexRanges[geometryRecordId][component],numVerts-1);

        }
      }

      this.notifyDirty("hideFaceRange",geometryRecord);
    };

    this.hideAllFaceRanges = function() {
      hiddenIndexRanges = {};
      visibleIndexRanges = {};

      for (var i=0; i<geometryRecords.length; i++) {
        var geometryRecord =  geometryRecords[i];
        var geometryRecordId = geometryRecord.getId();
        hiddenIndexRanges[geometryRecordId] = {};
        visibleIndexRanges[geometryRecordId] = {};

        var numComps = geometryRecord.geometry.getData().getFaces().length;

        for (var component = 0; component<numComps;component++) {
          var numVerts = geometryRecord.geometry.getData().getFaces()[component].indices.position.length;
          hiddenIndexRanges[geometryRecordId][component] = [0,  numVerts-1];
          visibleIndexRanges[geometryRecordId][component] = [];
        }

        this.notifyDirty("hideFaceRange",geometryRecord);
      }

      return true;
    };
    
    this.unhideAllFaceRange = function() {
      hiddenIndexRanges = {};
      visibleIndexRanges = {};
      this.notifyDirty("unhideAllFaceRange");
    };

    /* Determines the location of the triangle in the faceranges specified in the metadata. */
    this.getFaceRangeIndexFromTriangleNr = function(triangleNr) {
      var fr = metadata.faceRanges;
      var selFr;
      if (fr!=null && fr.length>1) {
        for (var i=0; i<fr.length; i++) {
          if (fr[i][0]<=triangleNr && fr[i][1]>=triangleNr) {
            selFr = i;
            break;
          }
        }
      }
      return selFr;
    };

    this.getFaceRangeFromTriangleNr = function(triangleNr) {
      var faceRangeIndex = this.getFaceRangeIndexFromTriangleNr(triangleNr);
      var fr = metadata.faceRanges;
      return faceRangeIndex ? [fr[faceRangeIndex]] : null;
    };

    this.setGeometryTransformation = function(index, newTrafo) {
      assert((index >=0) && (index < geometryRecords.length), "Object3d.setGeometryTransformation: index out of range");
      var oldRecord = geometryRecords[index];
      var newRecord = new GeometryRecord(oldRecord.geometry, oldRecord.materials, mat4d.create(newTrafo));
      geometryRecords[index] = newRecord;
      this.notifyDirty("objGeometryReplaced", [oldRecord, newRecord]);
      invalidateBoundingData();
    };

    this.getObjectTransformation = function() {
      return mat4d.create(objectTransformation);
    };

    this.setObjectTransformation = function(newTrafo) {
      mat4d.set(newTrafo, objectTransformation);
      invalidateBoundingData();
      this.notifyDirty("objTransformation");
    };

    this.getCombinedTransformation = function(geometryRecord, result) {
      result = result || mat4d.create();
      mat4d.multiply(objectTransformation, geometryRecord.transformation, result);
      return result;
    };


    this.getCastShadow = function() {
      return castShadow;
    };

    this.setCastShadow = function(enable) {
      castShadow = enable;
    };

    this.getMetadata = function() {
      return metadata;
    };

    this.getName = function() {
      return name;
    };

    this.getBBMin = function(objectSpace) {
      validateBoundingData();
      return objectSpace ? bbObjectSpace.min : bbWorldSpace.min;
    };

    this.getBBMax = function(objectSpace) {
      validateBoundingData();
      return objectSpace ? bbObjectSpace.max : bbWorldSpace.max;
    };

    this.getCenter = function(objectSpace) {
      validateBoundingData();
      return objectSpace ? bbObjectSpace.center : bbWorldSpace.center;
    };

    this.getBSRadiusApprox = function() {
      validateBoundingData();
      return bsRadius;
    };

    this.calcFacerangeBoundingSphere = function(triangleNr) {
      var fr = null;

      //faceranges assume only one geometry and group
      if (triangleNr!=null && geometries.length===1 && geometries[0].getNumGroups()===1){
        fr = this.getFaceRangeFromTriangleNr(triangleNr);
      }

      if (fr==null || fr.length!==1) {
        return {center:this.getCenter(), radiusScaled:this.getBSRadiusApproxScaled()};
      }
      else {
        var bi = geometries[0].calculateBoundingInfo(0, fr[0]);
        var center = bi.getCenter();
        mat4d.multiplyVec3(geometryRecords[0].transformation, center);
        mat4d.multiplyVec3(objectTransformation, center);
        return {center:center, radiusScaled:bi.getBSRadius()*getScaleFactor(geometryRecords[0].transformation)*getScaleFactor(objectTransformation)};
      }

    };

    this.getBSRadiusApproxScaled = function() {
      validateBoundingData();
      return bsRadiusScaled;
    };

    var validateBoundingData = function() {
      if (!bbDirty) {
        return;
      }

      bbObjectSpace.init();
      bbWorldSpace.init();
      var p0 = vec3d.create();
      var p1 = vec3d.create();
      for ( var i = 0; i < geometryRecords.length; ++i) {
        var geometry = geometries[i];
        for ( var j = 0, num = geometry.getNumGroups(); j < num; ++j) {
          var boundingInfo = geometry.getBoundingInfo(j);
          mat4d.multiplyVec3(geometryRecords[i].transformation, boundingInfo.getBBMin(), p0);
          mat4d.multiplyVec3(geometryRecords[i].transformation, boundingInfo.getBBMax(), p1);
          for (var k = 0; k < 3; ++k) {
            if (p0[k] > p1[k]) {
              // if the geometry transformation caused a negative scale in this axis, min and max will be swapped -> fix
              var tmp = p0[k];
              p0[k] = p1[k];
              p1[k] = tmp;
            }
            bbObjectSpace.min[k] = Math.min(bbObjectSpace.min[k], p0[k]);
            bbObjectSpace.max[k] = Math.max(bbObjectSpace.max[k], p1[k]);
          }
          mat4d.multiplyVec3(objectTransformation, p0);
          mat4d.multiplyVec3(objectTransformation, p1);
          for (k = 0; k < 3; ++k) {
            if (p0[k] > p1[k]) {
              tmp = p0[k];
              p0[k] = p1[k];
              p1[k] = tmp;
            }
            bbWorldSpace.min[k] = Math.min(bbWorldSpace.min[k], p0[k]);
            bbWorldSpace.max[k] = Math.max(bbWorldSpace.max[k], p1[k]);
          }
        }
      }

      vec3d.lerp(bbObjectSpace.min, bbObjectSpace.max, 0.5, bbObjectSpace.center);
      vec3d.lerp(bbWorldSpace.min, bbWorldSpace.max, 0.5, bbWorldSpace.center);

      bsRadius = 0.0;
      bsRadiusScaled = 0.0;
      for (i = 0; i < geometryRecords.length; ++i) {
        geometry = geometries[i];
        for (j = 0, num = geometry.getNumGroups(); j < num; ++j) {
          boundingInfo = geometry.getBoundingInfo(j);
          var transf = geometryRecords[i].transformation;
          mat4d.multiplyVec3(transf, boundingInfo.getCenter(), p0);
          bsRadius = Math.max(bsRadius, vec3d.dist(p0, bbObjectSpace.center) + boundingInfo.getBSRadius(j));


          var scale = getScaleFactor(transf);
          bsRadiusScaled = Math.max(bsRadiusScaled, bsRadius*scale);
        }
      }
      bbDirty = false;
    };

    var getScaleFactor = function(transf) {
      var sx = Math.sqrt(transf[0] * transf[0] + transf[4] * transf[4] + transf[8]  * transf[8]);
      var sy = Math.sqrt(transf[1] * transf[1] + transf[5] * transf[5] + transf[9]  * transf[9]);
      var sz = Math.sqrt(transf[2] * transf[2] + transf[6] * transf[6] + transf[10] * transf[10]);
      return Math.max(Math.max(sx, sy), sz);
    }

    var invalidateBoundingData = function() {
      bbDirty = true;
      var oldBBData = {
        bbMin: bbWorldSpace.min,
        bbMax: bbWorldSpace.max,
        center: bbWorldSpace.center,
        bsRadius: bsRadius
      };
      if (parentLayer) {
        parentLayer.notifyObjectBBChanged(that, oldBBData);
      }
    };

    this.notifyDirty = function (dirtyType, subObject, contentType, otherObj) {
      if (parentLayer) {
        contentType = contentType || Model.ContentType.OBJECT;
        var obj = otherObj || this;
        parentLayer.notifyDirty(dirtyType, subObject, contentType, obj);
      }
    };
  };
  Object3D.GeometryRecord = GeometryRecord;
  Object3D.paramsFromOldConstructor = function(name, childGeometries, geometryMaterials, geometryTransformations, castShadow, metadata, idHint) {
    return {
      name: name,
      geometries: childGeometries,
      materials: geometryMaterials,
      transformations: geometryTransformations,
      castShadow: castShadow,
      metadata: metadata,
      idHint: idHint
    };
  };
  return Object3D;
});