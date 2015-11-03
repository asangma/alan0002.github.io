/* jshint forin:false */
define([
  "../../../../core/declare",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./Canvas3DSymbolCommonCode",

  "../../../../geometry/Polygon",
  "../../support/projectionUtils",
  "../../lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Object3D",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryData",
  "../../webgl-engine/materials/Material",
  "../../webgl-engine/lib/Util",
  "./earcut/earcut"
], function(
  declare,
  Canvas3DSymbolBase, Canvas3DGraphic, Canvas3DSymbolCommonCode,
  Polygon, projectionUtils, glMatrix,
  Stage, Object3D, Geometry, GeometryData, Material, Util, earcut) {
  var VertexAttrConstants = Util.VertexAttrConstants;
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpVec1 = vec3d.create(),
    tmpVec2 = vec3d.create(),
    tmpN = vec3d.create(),
    tmpT = vec3d.create();
  var ZEROTWOONE = [0, 2, 1];
  var ZEROONETWO = [0, 1, 2];
  var tmpPoint = {};

  var Canvas3DExtrudeSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var idHint = this._getStageIdHint();
      var rgba = this._getMaterialOpacityAndColor();
      var rgb = vec3d.create(rgba);
      var opacity = rgba[3];

      var matParams = {
        diffuse: rgb,
        ambient: rgb,
        opacity: opacity,
        transparent: (opacity < 1) || this._isPropertyDriven("opacity"),
        vertexColors : true
      };

      this._material = new Material(matParams, idHint + "_3dlinemat");

      this._context.stage.add(Stage.ModelContentType.MATERIAL, this._material);
      this.resolve();
    },

    destroy: function() {
      this._context.stage.remove(Stage.ModelContentType.MATERIAL, this._material.getId());
    },

    createCanvas3DGraphic: function(graphic, renderingInfo) {
      var geometry = graphic.geometry;

      if ((geometry.type !== "polygon") && (geometry.type !== "extent")) {
        this._logWarning("unsupported geometry type for line symbol: " + geometry.type);
        return null;
      }
      var geometryType = (geometry.type === "polygon" || geometry.type === "extent") ? "rings" : "paths";
      var idHint = "graphic"+graphic.id;

      var drivenColor = this._getVertexOpacityAndColor(renderingInfo, Float32Array, 255);

      var elevationInfo = this._getGraphicElevationInfo(graphic);

      return this._createAs3DShape(graphic, geometryType, renderingInfo, drivenColor, elevationInfo, idHint, graphic.id);
    },

    layerPropertyChanged: function(name, canvas3DGraphics, symbolLayerIdx) {
      if (name === "opacity") {
        var opacity = this._getMaterialOpacity();
        var requiresBlending = opacity < 1 || this._isPropertyDriven("opacity");
        this._material.setParameterValues({opacity: opacity, transparent: requiresBlending });
        return true;
      }
      else if (name === "elevationInfo") {
        this._updateElevationInfo();
        var elevationProvider = this._context.elevationProvider;
        var renderCoordsHelper = this._context.renderCoordsHelper;
        var mapCoordsHelper = this._context.mapCoordsHelper;
        var ABSOLUTE_HEIGHT = Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT;
        for (var id in canvas3DGraphics) {
          var canvas3DGraphicSet = canvas3DGraphics[id];
          var canvas3DGraphic = canvas3DGraphicSet._graphics[symbolLayerIdx];
          if (canvas3DGraphic) {
            var graphic = canvas3DGraphicSet.graphic;
            var elevationInfo = this._getGraphicElevationInfo(graphic);
            canvas3DGraphic.elevationAligner = (elevationInfo.mode !== ABSOLUTE_HEIGHT) ? extrudeSymbolElevationAligner : null;
            canvas3DGraphic.elevationInfo.set(elevationInfo);
            extrudeSymbolElevationAligner(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper);
          }
        }
        return true;
      }
      return false;
    },

    _getExtrusionSize: function(renderingInfo, symbol) {
      var size = renderingInfo.size && this._isPropertyDriven("size")
            ? Canvas3DSymbolCommonCode.getSingleSizeDriver(renderingInfo.size)
            : this.symbol.size || 1;
      // Convert meters to map units
      size /= this._context.mapCoordsHelper.mapUnitInMeters;
      return size;
    },

    _createAs3DShape: function(graphic, geometryType, renderingInfo, color, elevationInfo, idHint, graphicId) {
      var geometry = graphic.geometry;

      if (geometry.type === "extent") {
        geometry = Polygon.fromExtent(geometry);
      }

      var paths = geometry[geometryType];
      var hasZ = geometry.hasZ;
      var numPaths = paths.length;

      if (numPaths > 0) {
        var stageGeometries = [];
        var geoMaterials = [];
        var geoTrafos = [];
        
        var c = vec3d.create();
        var elevationProvider = this._context.elevationProvider;
        var renderSR = this._context.renderSpatialReference;
        var spatialReference = geometry.spatialReference;
        var elevationSR = elevationProvider.spatialReference;

        var spherical = this._context.renderSpatialReference === projectionUtils.SphericalRenderSpatialReference;
        var size = this._getExtrusionSize(renderingInfo, this.symbol.size);
        var worldUp = vec3d.create();
        if (!spherical) {
          this._context.renderCoordsHelper.worldUpAtPosition(null, worldUp);
        }
        var elevationBB = new Array(6); // bounding box in elevation SR

        // Copy input path data into a flat array of doubles
        var pathData = Canvas3DSymbolCommonCode.copyPathDataForTriangulation(paths, hasZ);
        var vertexData = pathData.vertexData;
        var vertexCount = vertexData.length / 3;

        // Transform original data into elevation SR
        var eleVertices = new Float64Array(vertexData.length);
        if(!spatialReference.equals(elevationSR)) {
          projectionUtils.bufferToBuffer(vertexData, spatialReference, 0, eleVertices, elevationSR, 0, vertexCount);
        } else {
          // Coordinate subtraction applied later to original data, need to copy
          Canvas3DSymbolCommonCode.copyVertices(vertexData, 0, eleVertices, 0, vertexData.length);
        }

        // Adjust elevation
        Canvas3DSymbolCommonCode.applyElevation(elevationProvider, eleVertices, 0, vertexData, 0, vertexCount, elevationInfo);

        // Transform original data into render SR
        if(!spatialReference.equals(renderSR)) {
          projectionUtils.bufferToBuffer(vertexData, elevationSR, 0, vertexData, renderSR, 0, vertexCount);
        }

        // Create buffers large enough to hold the extruded geometry for all polygons
        var extVertexData = new Float64Array(vertexCount*3*6);
        var extNormalData = new Float64Array(vertexCount*3*6);
        var extEleData    = new Float64Array(vertexCount*3*6);
        var extSizeData   = new Float64Array(vertexCount*1*6);

        var destVertexIndex = 0;
        for (var p = 0; p < pathData.polygons.length; ++p) {
          var polygon = pathData.polygons[p];
          var srcCount = polygon.count;
          var srcIndex = polygon.index;

          // Perform clipping
          var clippingExtent = this._context.clippingExtent;
          if (clippingExtent) {
            Canvas3DSymbolCommonCode.computeBoundingBox(eleVertices, srcIndex, srcCount, elevationBB);
            if (!Canvas3DSymbolCommonCode.boxesIntersect2D(elevationBB, clippingExtent)) {
              continue;
            }
          }

          // Triangulate polygon
          var eleDataV = new Float64Array(eleVertices.buffer, srcIndex * 3 * extVertexData.BYTES_PER_ELEMENT, srcCount * 3);
          var earcutHoleIndices = polygon.holeIndices.map(function(i){return i-srcIndex;});
          var triangles = earcut(eleDataV, earcutHoleIndices, 3);

          if (triangles.length > 0) {

            // Subtract origin
            Canvas3DSymbolCommonCode.chooseOrigin(vertexData, srcIndex, srcCount, c);

            var extIndexCount = srcCount*3*2 + triangles.length*2;
            var extIndexData = new Uint32Array(extIndexCount);
            var extVertexCount = srcCount*6;
            var extVertexDataV = new Float64Array(extVertexData.buffer, destVertexIndex * 3 * extVertexData.BYTES_PER_ELEMENT, extVertexCount * 3);
            var extNormalDataV = new Float64Array(extNormalData.buffer, destVertexIndex * 3 * extNormalData.BYTES_PER_ELEMENT, extVertexCount * 3);
            var extEleDataV    = new Float64Array(extEleData.buffer,    destVertexIndex * 3 * extEleData.BYTES_PER_ELEMENT,    extVertexCount * 3);
            var extSizeDataV   = new Float64Array(extSizeData.buffer,   destVertexIndex * 1 * extSizeData.BYTES_PER_ELEMENT,   extVertexCount * 1);
            extrudePolygon(vertexData, eleVertices, triangles, polygon, extVertexDataV, extEleDataV, extNormalDataV, extSizeDataV, 0/*destVertexIndex*/, 
              extIndexData, 0, size, worldUp, spherical);

            Canvas3DSymbolCommonCode.subtractCoordinates(extVertexDataV, 0, extVertexCount, c);

            destVertexIndex += srcCount * 6;

            var geometryData = this._createExtrudeGeometry(extIndexData, {positions:extVertexDataV, elevation:extEleDataV, normals:extNormalDataV, heights : extSizeDataV}, color, false);
            
            var geo = new Geometry(geometryData, idHint + "path" + p);
            geo.singleUse = true;
            
            stageGeometries.push(geo);
            geoMaterials.push([this._material]);

            var trans = mat4d.identity();
            mat4d.translate(trans, c, trans);
            geoTrafos.push(trans);
          }
        }

        if (stageGeometries.length > 0) {
          var li = this._context.layer.get("id");
          var stageObject = new Object3D({
            geometries: stageGeometries,
            materials: geoMaterials,
            transformations: geoTrafos,
            castShadow: true,
            metadata: { layerId : li, graphicId : graphicId},
            idHint: idHint
          });

          var elevationAligner = null;
          if (elevationInfo.mode !== Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT) {
            elevationAligner = extrudeSymbolElevationAligner;
          }

          return new Canvas3DGraphic(this, stageObject, stageGeometries, null, null, elevationAligner, elevationInfo);
        }
        else {
          return null;
        }
      } else {
        this._logWarning("no paths found for extrusion symbol");
        return null;
      }
    },

    _createExtrudeGeometry: function(indices, vertices, colors, renderGeometryStyle) {
      var numIndices = indices.length;

      var idxVerts = indices;
      var idxColors =  new Uint32Array(numIndices);

      for(var i=0; i<numIndices; i++) {
          idxColors[i] = 0;
      }

      var indices2 = {}, vertexAttr = {};
      indices2[VertexAttrConstants.POSITION] = idxVerts;
      indices2[VertexAttrConstants.NORMAL] = idxVerts;
      indices2[VertexAttrConstants.COLOR] = idxColors;
      
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data": vertices.positions};
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data": vertices.normals};
      vertexAttr[VertexAttrConstants.COLOR] = { "size" : 4, "data": colors};
      vertexAttr[VertexAttrConstants.SIZE] = { "size" : 1, "data": vertices.heights};

      if (vertices.elevation) {
        vertexAttr["mapPos"] = { "size" : 3, "data": vertices.elevation};
        indices2["mapPos"] = idxVerts;
      }

      var faces = [ { "type" : "triangle", "indices" : indices2, "positionKey" : VertexAttrConstants.POSITION } ];

      if (renderGeometryStyle) {
        return {
          "faces" : faces[0],
          "vertexAttr" : vertexAttr,
          "id" : GeometryData.getNewId().toString()  // toString()ing it to make it same type as with proper GeometryData (see Model.getGeometryRenderGeometries())
        };
      } else {
          return new GeometryData(faces, vertexAttr);
        }
    }
  });
  
  /**
   * Extrudes a polygon
   * 
   * Input: N vertices, M triangles
   * Output: 6N vertices, 2M+2N triangles
   * 
   * Source vertex buffer:
   * +---------+------+
   * | outline | hole |
   * +---------+------+
   * 
   * Destination vertex buffer:
   * +--------------+-----------+-------------+----------+--------------+-----------+
   * | outline base | hole base | outline top | hole top | outline side | hole side |
   * +--------------+-----------+-------------+----------+--------------+-----------+
   */
  function extrudePolygon(srcVertexData, srcEleData, srcIndexData, polygon, 
    destVertexData, destEleData, destNormalData, destSizeData, destVertexIndex,
    destIndexData, destIndexIndex, 
    height, worldUp, spherical){

    var triangleCount = srcIndexData.length / 3;
    var srcVertexIndex = 0;

    var sideFirst = true;
    if (sideFirst) {
      destIndexIndex += polygon.count * 2;
    }

    // Base and top
    extrudeTriangles(srcVertexData, srcEleData, polygon.index, polygon.count, 
      srcIndexData, 0, triangleCount, 
      destVertexData, destEleData, destNormalData, destSizeData, destVertexIndex,
      destIndexData, destIndexIndex, 
      height, worldUp, spherical);
    destVertexIndex += polygon.count * 2; // 2N vertices added
    destIndexIndex  += triangleCount * 2; // 2M triangles added
    
    if (sideFirst) {
      destIndexIndex -= polygon.count * 2 + triangleCount * 2;
    }

    // Outline side
    extrudeOutline(destVertexData, destEleData, destSizeData, destNormalData, srcVertexIndex,
      polygon.pathLengths[0], polygon.count, destVertexIndex, destIndexData, destIndexIndex,
      height);
    destVertexIndex += polygon.pathLengths[0] * 4; // 4N vertices added
    destIndexIndex  += polygon.pathLengths[0] * 2; // 2N triangles added
    srcVertexIndex  += polygon.pathLengths[0];
 
    // Hole sides
    for(var i=1; i<polygon.pathLengths.length; ++i) {
      extrudeOutline(destVertexData, destEleData, destSizeData, destNormalData, srcVertexIndex,
        polygon.pathLengths[i], polygon.count, destVertexIndex, destIndexData, destIndexIndex,
        height);
      destVertexIndex += polygon.pathLengths[i] * 4; // 4N vertices added
      destIndexIndex  += polygon.pathLengths[i] * 2; // 2N triangles added
      srcVertexIndex  += polygon.pathLengths[i];
    }
  }

  function extrudeTriangles(srcVertexData, srcEleData, srcVertexIndex, srcVertexCount, 
    srcIndexData, srcIndexIndex, srcIndexCount, 
    destVertexData, destEleData, destNormalData, destSizeData, destVertexIndex,
    destIndexData, destIndexIndex, 
    height, worldUp, spherical) {

    vec3d.set(worldUp, tmpN);

    var heightSign = (height > 0) ? +1 : -1;

    // Vertex data
    var iSrc3 = srcVertexIndex*3;
    var iDestBase = destVertexIndex;
    var iDestBase3 = iDestBase*3;
    var iDestTop = destVertexIndex + srcVertexCount;
    var iDestTop3 = iDestTop*3;
    for(var i=0; i<srcVertexCount; ++i) {

      // Compute normal
      if (spherical) {
        tmpN[0] = srcVertexData[iSrc3+0];
        tmpN[1] = srcVertexData[iSrc3+1];
        tmpN[2] = srcVertexData[iSrc3+2];

        vec3d.normalize(tmpN);
      }

      // Base vertex
      destVertexData[iDestBase3+0] = srcVertexData[iSrc3+0];
      destVertexData[iDestBase3+1] = srcVertexData[iSrc3+1];
      destVertexData[iDestBase3+2] = srcVertexData[iSrc3+2];

      destEleData[iDestBase3+0] = srcEleData[iSrc3+0];
      destEleData[iDestBase3+1] = srcEleData[iSrc3+1];
      destEleData[iDestBase3+2] = srcEleData[iSrc3+2];

      destNormalData[iDestBase3+0] = -heightSign * tmpN[0];
      destNormalData[iDestBase3+1] = -heightSign * tmpN[1];
      destNormalData[iDestBase3+2] = -heightSign * tmpN[2];

      destSizeData[iDestBase] = 0;

      // Top vertex
      destVertexData[iDestTop3+0] = srcVertexData[iSrc3+0] + height * tmpN[0];
      destVertexData[iDestTop3+1] = srcVertexData[iSrc3+1] + height * tmpN[1];
      destVertexData[iDestTop3+2] = srcVertexData[iSrc3+2] + height * tmpN[2];

      destEleData[iDestTop3+0] = srcEleData[iSrc3+0];
      destEleData[iDestTop3+1] = srcEleData[iSrc3+1];
      destEleData[iDestTop3+2] = srcEleData[iSrc3+2];

      destNormalData[iDestTop3+0] = heightSign * tmpN[0];
      destNormalData[iDestTop3+1] = heightSign * tmpN[1];
      destNormalData[iDestTop3+2] = heightSign * tmpN[2];

      destSizeData[iDestTop] = height;

      // Next input vertex
      iDestBase3 += 3;
      iDestTop3 += 3;
      iSrc3 += 3;
      iDestBase += 1;
      iDestTop += 1;
    }

    // Index data
    iSrc3 = srcIndexIndex*3;
    iDestBase3 = destIndexIndex*3;
    iDestTop3  = (destIndexIndex+srcIndexCount)*3;

    var topFirst = false;
    if (topFirst === false) {
      iDestBase3 = (destIndexIndex+srcIndexCount)*3;
      iDestTop3  = (destIndexIndex)*3;
    }

    // Reverse winding order of one side
    var baseTri = ZEROTWOONE;
    var topTri  = ZEROONETWO;
    if (height < 0) {
      baseTri = ZEROONETWO;
      topTri =  ZEROTWOONE;
    }

    for(var i=0; i<srcIndexCount; ++i) {
      destIndexData[iDestBase3+0] = srcIndexData[iSrc3+baseTri[0]];
      destIndexData[iDestBase3+1] = srcIndexData[iSrc3+baseTri[1]];
      destIndexData[iDestBase3+2] = srcIndexData[iSrc3+baseTri[2]];

      destIndexData[iDestTop3+0] = srcIndexData[iSrc3+topTri[0]] + srcVertexCount;
      destIndexData[iDestTop3+1] = srcIndexData[iSrc3+topTri[1]] + srcVertexCount;
      destIndexData[iDestTop3+2] = srcIndexData[iSrc3+topTri[2]] + srcVertexCount;

      iDestBase3 += 3;
      iDestTop3 += 3;
      iSrc3 += 3;
    }

  }

  function copyExtrudedVertex(vertexData, eleData, normalData, sizeData, normal, iDest, iSrc) {
    sizeData[iDest]   = sizeData[iSrc];

    iSrc *= 3;
    iDest *= 3;

    vertexData[iDest+0] = vertexData[iSrc+0];
    vertexData[iDest+1] = vertexData[iSrc+1];
    vertexData[iDest+2] = vertexData[iSrc+2];

    eleData[iDest+0]    = eleData[iSrc+0];
    eleData[iDest+1]    = eleData[iSrc+1];
    eleData[iDest+2]    = eleData[iSrc+2];

    normalData[iDest+0] = normal[0];
    normalData[iDest+1] = normal[1];
    normalData[iDest+2] = normal[2];
  }

  var extrudeOutline_normal = vec3d.create();
  /**
   * Given an outline with N vertices, appends 4*N vertices and 2*N triangles.
   */
  function extrudeOutline(vertexData, eleData, sizeData, normalData, srcVertexIndex, outlineVertexCount, polygonVertexCount,
    destVertexIndex, destIndexData, destIndexIndex, height) {

    // Front view:
    //  C -- D
    //  |  / |
    //  | /  |
    //  A -- B

    var iSrcA = srcVertexIndex;
    var iSrcB = srcVertexIndex+1;
    var iSrcC = srcVertexIndex+polygonVertexCount;
    var iSrcD = srcVertexIndex+polygonVertexCount+1;

    var iDestA = destVertexIndex;
    var iDestB = destVertexIndex+1;
    var iDestC = destVertexIndex+2*outlineVertexCount;
    var iDestD = destVertexIndex+2*outlineVertexCount+1;

    if (height < 0) {
      iSrcA = srcVertexIndex+polygonVertexCount+1;
      iSrcD = srcVertexIndex;
    }

    destIndexIndex *= 3;
    for(var i=0; i<outlineVertexCount; ++i) {

      if(i===outlineVertexCount-1) {
        if (height > 0) {
          iSrcB = srcVertexIndex;
          iSrcD = srcVertexIndex+polygonVertexCount;
        } else {
          iSrcB = srcVertexIndex;
          iSrcA = srcVertexIndex+polygonVertexCount
        }
      }

      // Compute a custom normal
      triangleNormal(vertexData, iSrcA, iSrcB, iSrcC, extrudeOutline_normal);

      // Copy vertex data
      copyExtrudedVertex(vertexData, eleData, normalData, sizeData, extrudeOutline_normal, iDestA, iSrcA);
      copyExtrudedVertex(vertexData, eleData, normalData, sizeData, extrudeOutline_normal, iDestB, iSrcB);
      copyExtrudedVertex(vertexData, eleData, normalData, sizeData, extrudeOutline_normal, iDestC, iSrcC);
      copyExtrudedVertex(vertexData, eleData, normalData, sizeData, extrudeOutline_normal, iDestD, iSrcD);

      // Append index data
      destIndexData[destIndexIndex++] = iDestA;
      destIndexData[destIndexIndex++] = iDestC;
      destIndexData[destIndexIndex++] = iDestD;

      destIndexData[destIndexIndex++] = iDestA;
      destIndexData[destIndexIndex++] = iDestD;
      destIndexData[destIndexIndex++] = iDestB;

      // Next vertex
      iSrcA++;  iSrcB++;  iSrcC++;  iSrcD++;
      iDestA+=2; iDestB+=2; iDestC+=2; iDestD+=2;
    }
  }

  var triangleNormal_tmpA  = vec3d.create();
  var triangleNormal_tmpB  = vec3d.create();
  var triangleNormal_tmpC  = vec3d.create();
  var triangleNormal_tmpAB = vec3d.create();
  var triangleNormal_tmpAC = vec3d.create();
  function triangleNormal(vertexData, indexA, indexB, indexC, normal) {
    indexA *= 3;
    indexB *= 3;
    indexC *= 3;

    vec3d.set3(vertexData[indexA++], vertexData[indexA++], vertexData[indexA++], triangleNormal_tmpA);
    vec3d.set3(vertexData[indexB++], vertexData[indexB++], vertexData[indexB++], triangleNormal_tmpB);
    vec3d.set3(vertexData[indexC++], vertexData[indexC++], vertexData[indexC++], triangleNormal_tmpC);

    vec3d.subtract(triangleNormal_tmpB, triangleNormal_tmpA, triangleNormal_tmpAB);
    vec3d.subtract(triangleNormal_tmpC, triangleNormal_tmpA, triangleNormal_tmpAC);
    vec3d.cross(triangleNormal_tmpAC, triangleNormal_tmpAB, normal);
    vec3d.normalize(normal, normal);
  }

  var tmpVertexBefore = vec3d.create();
  var tmpCentroid = vec3d.create();
  var extrudeSymbolElevationAligner = function(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper) {
    var obj = canvas3DGraphic.stageObject;    
    var elevationInfo = canvas3DGraphic.elevationInfo;
    var setAltitude = renderCoordsHelper.setAltitude;

    tmpPoint.spatialReference = elevationProvider.spatialReference;

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
      var heights = va[VertexAttrConstants.SIZE].data;

      var mapSRPositions = va.mapPos.data;
      var numVerts = vertices.length/3;
      var vOffset = 0, pOffset = 0;

      var update = false;
      for (var vIdx = 0; vIdx < numVerts; vIdx++) {
        tmpPoint.x = mapSRPositions[pOffset];
        tmpPoint.y = mapSRPositions[pOffset+1];
        tmpPoint.z = mapSRPositions[pOffset+2];

        tmpVertexBefore[0] = vertices[vOffset];
        tmpVertexBefore[1] = vertices[vOffset+1];
        tmpVertexBefore[2] = vertices[vOffset+2];

        var elev = Canvas3DSymbolCommonCode.computeElevation(elevationProvider, tmpPoint, elevationInfo);

        tmpVec1[0] = vertices[vOffset]   + tmpCentroid[0];
        tmpVec1[1] = vertices[vOffset+1] + tmpCentroid[1];
        tmpVec1[2] = vertices[vOffset+2] + tmpCentroid[2];

        //Add height for extruded vertices based on the heights buffer
        setAltitude(elev + heights[vOffset/3], tmpVec1, 0);

        vertices[vOffset]   = tmpVec1[0] - tmpCentroid[0];
        vertices[vOffset+1] = tmpVec1[1] - tmpCentroid[1];
        vertices[vOffset+2] = tmpVec1[2] - tmpCentroid[2];        

        //Only update when transformation changes
        var eps = 0.01 / mapCoordsHelper.mapUnitInMeters;
        if(  Math.abs(tmpVertexBefore[0] - vertices[vOffset]) > eps ||
          Math.abs(tmpVertexBefore[1]- vertices[vOffset+1]) > eps ||
          Math.abs(tmpVertexBefore[2]- vertices[vOffset+2]) > eps ) {
          update = true;
        }        

        pOffset += 3;
        vOffset += 3;
      }

      if(update) {
        obj.geometryVertexAttrsUpdated(geoIdx);
      }

    }
  };

  return Canvas3DExtrudeSymbol;
});

