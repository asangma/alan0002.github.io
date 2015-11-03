define([
  "../../../../geometry/Point",
  "../../lib/glMatrix",
  "../../webgl-engine/lib/Util",
  "./Canvas3DSymbolCommonCode"
], function(
  Point, glMatrix, Util, Canvas3DSymbolCommonCode
) {
  var VertexAttrConstants = Util.VertexAttrConstants;
  var vec3d = glMatrix.vec3d;

  var tmpPoint = new Point();
  var tmpVec3 = vec3d.create();
  var tmpCentroid = vec3d.create();
  var tmpVertexBefore = vec3d.create();

  var perVertexElevationAligner = function(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper) {
    var obj = canvas3DGraphic.stageObject;    
    var elevationInfo = canvas3DGraphic.elevationInfo,
      elevationSR = elevationProvider.spatialReference;
    
    tmpPoint.spatialReference = elevationSR;

    var geoRecords = obj.getGeometryRecords();
    var numGeometries = geoRecords.length;
    for (var geoIdx = 0; geoIdx < numGeometries; geoIdx++) {
      var geometry = geoRecords[geoIdx].geometry,
        transformation = geoRecords[geoIdx].transformation;
      tmpCentroid[0] = transformation[12];
      tmpCentroid[1] = transformation[13];
      tmpCentroid[2] = transformation[14];

      geometry.invalidateBoundingInfo();
      
      var va = geometry.getData().getVertexAttr();
      var vertices = va[VertexAttrConstants.POSITION].data;
      var mapSRPositions = va.mapPos.data;
      var numVerts = vertices.length/2;
      var vOffset = 0, pOffset = 0;

      var update = false;
      for (var vIdx = 0; vIdx < numVerts; vIdx++) {
        tmpPoint.x = mapSRPositions[pOffset++];
        tmpPoint.y = mapSRPositions[pOffset++];
        tmpPoint.z = mapSRPositions[pOffset++];

        tmpVertexBefore[0] = vertices[vOffset];
        tmpVertexBefore[1] = vertices[vOffset+1];
        tmpVertexBefore[2] = vertices[vOffset+2];

        var elev = Canvas3DSymbolCommonCode.computeElevation(elevationProvider, tmpPoint, elevationInfo);

        tmpVec3[0] = vertices[vOffset]   + tmpCentroid[0];
        tmpVec3[1] = vertices[vOffset+1] + tmpCentroid[1];
        tmpVec3[2] = vertices[vOffset+2] + tmpCentroid[2];

        renderCoordsHelper.setAltitude(elev, tmpVec3, 0);

        vertices[vOffset]   = tmpVec3[0] - tmpCentroid[0];
        vertices[vOffset+1] = tmpVec3[1] - tmpCentroid[1];
        vertices[vOffset+2] = tmpVec3[2] - tmpCentroid[2];

        //Only update when transformation changes
        var eps = 0.01 / mapCoordsHelper.mapUnitInMeters;
        if(  Math.abs(tmpVertexBefore[0] - vertices[vOffset]) > eps ||
          Math.abs(tmpVertexBefore[1] - vertices[vOffset+1]) > eps ||
          Math.abs(tmpVertexBefore[2] - vertices[vOffset+2]) > eps ) {
          update = true;
        }        

        vOffset += 3;
      }

      // TODO: better way for updating a geometry's vertex positions
      //obj.replaceGeometry(geoIdx, geometry);
      if(update) {
        obj.geometryVertexAttrsUpdated(geoIdx);
      }
    }
  };

  var perObjectElevationAligner = function(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper) {
    var elevationInfo = canvas3DGraphic.elevationInfo;
    var point = elevationInfo.centerPointInElevationSR;

    var elev = Canvas3DSymbolCommonCode.computeElevation(elevationProvider, point, elevationInfo);

    var trafo = canvas3DGraphic.stageObject.getObjectTransformation();
    var translation = [trafo[12], trafo[13], trafo[14]];

    renderCoordsHelper.setAltitudeOfTransformation(elev, trafo);

    //Only update when new transformation changes
    var eps = 0.01 / mapCoordsHelper.mapUnitInMeters;
    if (Math.abs(trafo[12]-translation[0]) > eps ||
      Math.abs(trafo[13]-translation[1]) > eps || 
      Math.abs(trafo[14]-translation[2]) > eps ) {
      canvas3DGraphic.stageObject.setObjectTransformation(trafo);
    }
  };

  return {
    perVertexElevationAligner: perVertexElevationAligner,
    perObjectElevationAligner: perObjectElevationAligner
  };
});