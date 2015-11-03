define([
  "../../../../geometry/Point",
  "./graphicUtils",
  "./ElevationInfo",
  "../../support/projectionUtils",
  "../../lib/glMatrix",
  "../../webgl-engine/lib/Object3D"
], function(Point, graphicUtils, ElevationInfo, projectionUtils, glMatrix, Object3D) {
  var mat4d = glMatrix.mat4d;

  var tmpVec3 = glMatrix.vec3d.create();
  var IDENTITYMAT4 = mat4d.identity();
  var applyElevationTmpPoint = {x:0, y:0, z:0, spatialReference:null};

  var Canvas3DSymbolCommonCode = {
    createStageObjectForPoint: function(inputGeometry, stageGeometries, stageMaterials, stageGeoTransformations,
                                        instanceParameters, elevationInfo, idHint, layerId, graphicId) {
      // must be called with proper this-pointer, Canvas3DSymbolCommonCode.createStageObjectForPoint.call(this, ...)

      var numGeos = stageGeometries ? stageGeometries.length : 0;

      // Perform clipping
      var clippingExtent = this._context.clippingExtent;
      projectionUtils.pointToVector(inputGeometry, tmpVec3, this._context.elevationProvider.spatialReference);
      if (clippingExtent && !Canvas3DSymbolCommonCode.pointInBox2D(tmpVec3, clippingExtent)) {
        return null;
      }

      // SR transformation
      projectionUtils.pointToVector(inputGeometry, tmpVec3, this._context.renderSpatialReference);
      var localOrigin = this._context.localOriginFactory.getOrigin(tmpVec3);

      var stageObject = new Object3D({
        castShadow: false,
        metadata: { layerId: layerId, graphicId: graphicId },
        idHint: idHint
      });

      for (var i = 0; i < numGeos; i++) {
        var transformation = stageGeoTransformations ? stageGeoTransformations[i] : IDENTITYMAT4;
        stageObject.addGeometry(stageGeometries[i], stageMaterials[i], transformation, instanceParameters, localOrigin);
      }

      Canvas3DSymbolCommonCode.setObjectElevation(stageObject, inputGeometry, elevationInfo,
        this._context.renderSpatialReference, this._context.elevationProvider);

      return stageObject;
    },

    extendPointGraphicElevationInfo: function(canvas3DGraphic, inputGeometry, elevationProvider) {
      var elevationInfo = canvas3DGraphic.elevationInfo,
          elevationSR = elevationProvider.spatialReference;
      projectionUtils.pointToVector(inputGeometry, tmpVec3, elevationSR);
      elevationInfo.centerPointInElevationSR = {
        x: tmpVec3[0],
        y: tmpVec3[1],
        z: inputGeometry.hasZ ? tmpVec3[2] : undefined,
        spatialReference: elevationSR
      };
    },

    placePointOnPolyline: function(inputGeometry) {
      var path = inputGeometry.paths[0];
      var pi = Math.floor(path.length/2);
      if (path[pi].length>=3) {
        return new Point(path[pi][0], path[pi][1], path[pi][2], inputGeometry.spatialReference);
      }
      return new Point(path[pi][0], path[pi][1], inputGeometry.spatialReference);
    },

    placePointOnPolygon: function(inputGeometry) {
      return graphicUtils.computeCentroid(inputGeometry);
    },

    computeElevation: function(elevationProvider, wmPoint, elevationInfo) {
      var z = 0;
      var zIn = wmPoint.z || 0;
      var zTerrain = 0;
      var mode = elevationInfo.mode;
      var offset = elevationInfo.offset || 0;

      if(mode === ElevationInfo.MODES.ON_THE_GROUND) {
        zTerrain = elevationProvider.getElevation(wmPoint) || 0;
        z = zTerrain;
      } else if(mode === ElevationInfo.MODES.RELATIVE_TO_GROUND){
        zTerrain = elevationProvider.getElevation(wmPoint) || 0;
        z = zTerrain + offset;
        if (elevationInfo.featureExpression == null) {
          z += zIn;
        }
      } else if(mode === ElevationInfo.MODES.ABSOLUTE_HEIGHT) {
        z = zIn + offset;
      }
      return z;
    },
    
    applyElevation: function(elevationProvider, srcData, srcIndex, destData, destIndex, count, elevationInfo) {
      var mode = elevationInfo.mode;
      var offset = elevationInfo.offset;
      var zTerrain = 0;
      var zPoint = 0;

      applyElevationTmpPoint.spatialReference = elevationProvider.spatialReference;

      srcIndex *= 3;
      destIndex *= 3;
      for(var i=0;i<count;++i) {
        applyElevationTmpPoint.x = srcData[srcIndex+0];
        applyElevationTmpPoint.y = srcData[srcIndex+1];
        applyElevationTmpPoint.z = srcData[srcIndex+2];

        if(mode === ElevationInfo.MODES.ON_THE_GROUND) {
          zTerrain = elevationProvider.getElevation(applyElevationTmpPoint) || 0;
          zPoint = zTerrain;
        } else if(mode === ElevationInfo.MODES.RELATIVE_TO_GROUND) {
          zTerrain = elevationProvider.getElevation(applyElevationTmpPoint) || 0;
          zPoint = zTerrain + offset;
          if (elevationInfo.featureExpression == null) {
            zPoint += applyElevationTmpPoint.z;
          }
        } else if(mode === ElevationInfo.MODES.ABSOLUTE_HEIGHT) {
          zPoint = applyElevationTmpPoint.z + offset;
        }

        destData[destIndex+0] = srcData[srcIndex+0];
        destData[destIndex+1] = srcData[srcIndex+1];
        destData[destIndex+2] = zPoint;

        srcIndex += 3;
        destIndex += 3;
      }
    },

    setObjectElevation: function(stageObject, inputGeometry, elevationInfo, renderSR, elevationProvider) {
      // must be called with proper this-pointer, Canvas3DSymbolCommonCode.setObjectElevation.call(this, ...)
      var elevation = Canvas3DSymbolCommonCode.computeElevation(elevationProvider, inputGeometry, elevationInfo);

      var objTrafo = stageObject.getObjectTransformation();
      tmpVec3[0] = inputGeometry.x;
      tmpVec3[1] = inputGeometry.y;
      tmpVec3[2] = elevation;
      if (projectionUtils.computeLinearTransformation(inputGeometry.spatialReference, tmpVec3, objTrafo, renderSR)) {
        stageObject.setObjectTransformation(objTrafo);
      }
      else {
        console.warn("Could not locate symbol object properly, it might be misplaced");
      }

    }, 

    getSingleSizeDriver: function(vectorSizeDriver) {
      if (isFinite(vectorSizeDriver[0])) {
        return vectorSizeDriver[0];
      }
      return null;
    },

    isCounterClockwise: function(inputPath) {
      var sum = 0;
      var count = inputPath.length-1;
      for(var i=0; i<count; i++) {
        sum += inputPath[i][0] * inputPath[i+1][1] - inputPath[i+1][0] * inputPath[i][1];
      }

      return sum>=0;
    },

    copyPointData: function(srcPoints, srcIndex, destData, destIndex, count, hasZ) {
      destIndex *= 3;
      for(var i=0; i<count; ++i) {
        var srcPoint = srcPoints[srcIndex++];
        destData[destIndex++] = srcPoint[0];
        destData[destIndex++] = srcPoint[1];
        destData[destIndex++] = hasZ ? srcPoint[2] : 0;
      }
      return destIndex / 3;
    },

    copyPathDataForTriangulation: function(paths, hasZ) {
      var numPaths = paths.length;
 
      var holes = new Array(numPaths);
      var polygons = new Array(numPaths);
      var outlines = new Array(numPaths);
      var numHoles = 0;
      var numPolygons = 0;
      var numOutlines = 0;

      var totalVertexCount = 0;
      for (var i=0; i<numPaths; ++i) {
        totalVertexCount += paths[i].length;
      }
      var data = new Float64Array(totalVertexCount*3);

      var destIndex = 0;
      for (var pathIdx = numPaths-1; pathIdx >= 0; pathIdx--) {
        var path = paths[pathIdx];

        if (!Canvas3DSymbolCommonCode.isCounterClockwise(path)) {

          // Count vertices (outline + holes)
          var polygonVertexCount = path.length;
          for(var i=0; i<numHoles; ++i) {
            polygonVertexCount += holes[i].length; 
          }

          // Polygon data
          var polygon = {
            index: destIndex,
            pathLengths: new Array(numHoles + 1),
            count: polygonVertexCount,
            holeIndices: new Array(numHoles)
          };
          polygon.pathLengths[0] = path.length;

          // Append outer outline vertex data
          if (path.length > 0) {
            outlines[numOutlines++] = {index: destIndex, count: path.length};
          }
          destIndex = Canvas3DSymbolCommonCode.copyPointData(path, 0, data, destIndex, path.length, hasZ);

          // Append inner outline (hole) vertex data
          for(var holeIdx=0; holeIdx < numHoles; ++holeIdx) {
            var hole = holes[holeIdx];
            polygon.holeIndices[holeIdx] = destIndex;
            polygon.pathLengths[holeIdx+1] = hole.length;
            if(hole.length > 0) {
              outlines[numOutlines++] = {index: destIndex, count: hole.length};
            }
            destIndex = Canvas3DSymbolCommonCode.copyPointData(hole, 0, data, destIndex, hole.length, hasZ);
          }
          numHoles = 0;

          if (polygon.count > 0) {
            polygons[numPolygons++] = polygon;
          }
        } else {

          // Found inner outline, defer it until the corresponding outer outline is encountered
          holes[numHoles++] = path;
        }
      }

      // At this point, the holes array may contain paths that represent holes without an outline.
      for(var holeIdx=0; holeIdx < numHoles; ++holeIdx) {
        var hole = holes[holeIdx];
        if (hole.length > 0) {
          outlines[numOutlines++] = {index: destIndex, count: hole.length};
        }
        destIndex = Canvas3DSymbolCommonCode.copyPointData(hole, 0, data, destIndex, hole.length, hasZ);
      }

      // Clean up arrays with too many pre-allocated elements
      if (numPolygons < numPaths) {
        polygons.length = numPolygons;
      }
      if (numOutlines < numPaths) {
        outlines.length = numOutlines;
      }

      return {
        vertexData: data,
        polygons: polygons,
        outlines: outlines
      };
    },

    copyVertices: function(srcData, srcIndex, destData, destIndex, count) {
      srcIndex *= 3;
      destIndex *= 3;
      for(var i=0; i<count; ++i) {
        destData[destIndex++] = srcData[srcIndex++];
        destData[destIndex++] = srcData[srcIndex++];
        destData[destIndex++] = srcData[srcIndex++];
      }
    },

    chooseOrigin: function(srcData, srcIndex, count, origin) {
      var cIdx = Math.floor(srcIndex + (count-1) / 2);
      origin[0] = srcData[3*cIdx+0];
      origin[1] = srcData[3*cIdx+1];
      origin[2] = srcData[3*cIdx+2];
    },

    subtractCoordinates: function(srcData, srcIndex, count, origin) {
      srcIndex *= 3;
      for(var i=0; i<count; ++i) {
        srcData[srcIndex++] -= origin[0];
        srcData[srcIndex++] -= origin[1];
        srcData[srcIndex++] -= origin[2];
      }
    },

    setZ: function(srcData, srcIndex, count, deltaZ) {
      srcIndex *= 3;
      for(var i=0; i<count; ++i) {
        srcData[srcIndex+2] = deltaZ;
        srcIndex += 3;
      }
    },

    offsetZ: function(srcData, srcIndex, count, deltaZ) {
      srcIndex *= 3;
      for(var i=0; i<count; ++i) {
        srcData[srcIndex+2] += deltaZ;
        srcIndex += 3;
      }
    },

    flatArrayToArrayOfArrays: function(srcData, srcIndex, count) {
      var result = [];
      srcIndex *= 3;
      for(var i=0; i<count; ++i) {
        result.push([
          srcData[srcIndex++],
          srcData[srcIndex++],
          srcData[srcIndex++]
          ]);
      }
      return result;
    },

    /**
     * Computes a bounding box
     */
    computeBoundingBox: function(srcData, srcIndex, count, box) {

      // Empty bounding box
      box[0] =  Number.MAX_VALUE; // TODO(robe8365): why not Infinity?
      box[1] =  Number.MAX_VALUE;
      box[2] =  Number.MAX_VALUE;
      box[3] = -Number.MAX_VALUE;
      box[4] = -Number.MAX_VALUE;
      box[5] = -Number.MAX_VALUE;

      srcIndex *= 3;
      for(var i=0; i<count; ++i) {
          var x = srcData[srcIndex++];
          var y = srcData[srcIndex++];
          var z = srcData[srcIndex++];
          
          if (x < box[0]) { box[0] = x; }
          if (y < box[1]) { box[1] = y; }
          if (z < box[2]) { box[2] = z; }
          
          if (x > box[3]) { box[3] = x; }
          if (y > box[4]) { box[4] = y; }
          if (z > box[5]) { box[5] = z; }
      }
      return box;
    },

    pointInBox2D: function(point, box) {
      return !(point[0] > box[3]
          || point[0] < box[0]
          || point[1] > box[4]
          || point[1] < box[1]);
    },

    boxesIntersect2D: function(box1, box2) {
      return !(box2[0] > box1[3]
          || box2[3] < box1[0]
          || box2[1] > box1[4]
          || box2[4] < box1[1]);
    },

    ELEV_MODES: ElevationInfo.MODES
  };

  return Canvas3DSymbolCommonCode;
});