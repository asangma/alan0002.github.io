/* jshint forin:false */
define([
  "../../../../core/declare",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./Canvas3DSymbolCommonCode",

  "../../support/projectionUtils",
  "../../../../views/3d/lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Object3D",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryUtil",
  "../../webgl-engine/materials/Material",
  "../../webgl-engine/lib/Util"

], function(
  declare,
  Canvas3DSymbolBase, Canvas3DGraphic, Canvas3DSymbolCommonCode,
  projectionUtils, glMatrix,
  Stage, Object3D, Geometry, GeometryUtil, Material, Util
) {
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;
  var assert = Util.assert;
  
  var tmpVec3 = vec3d.create();
  var tmpPoint = {};

  var TUBE_SECTORS = 10;

  var Canvas3DPathSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var symbol = this.symbol;
      var idHint = "c3dsymbol" + symbol.id;

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

      // TODO: _createEngineGeometryFromPath() does not yet support polygon input (requires closing the path).
      // therefore only accepting polyline input for now
      if ((geometry.type !== "polyline")/* && (geometry.type !== "polygon")*/) {
        this._logWarning("unsupported geometry type for line symbol: " + geometry.type);
        return null;
      }
      var geometryType = (geometry.type === "polygon") ? "rings" : "paths";
      var idHint = "graphic"+graphic.id;

      var elevationInfo = this._getGraphicElevationInfo(graphic);

      return this._createAs3DShape(graphic, geometryType, renderingInfo, elevationInfo, idHint, graphic.id);
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
        var elevationProvider = this._context.elevationProvider,
          renderCoordsHelper = this._context.renderCoordsHelper;
        var ABSOLUTE_HEIGHT = Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT;
        for (var id in canvas3DGraphics) {
          var canvas3DGraphicSet = canvas3DGraphics[id];
          var canvas3DGraphic = canvas3DGraphicSet._graphics[symbolLayerIdx];
          if (canvas3DGraphic) {
            var graphic = canvas3DGraphicSet.graphic;
            var elevationInfo = this._getGraphicElevationInfo(graphic);
            canvas3DGraphic.elevationAligner = (elevationInfo.mode !== ABSOLUTE_HEIGHT) ? pathSymbolElevationAligner : null;
            canvas3DGraphic.elevationInfo.set(elevationInfo);
            pathSymbolElevationAligner(canvas3DGraphic, elevationProvider, renderCoordsHelper);
          }
        }
        return true;
      }
      return false;
    },

    _getPathSize: function(renderingInfo, symbol) {
      var size = renderingInfo.size && this._isPropertyDriven("size")
        ? Canvas3DSymbolCommonCode.getSingleSizeDriver(renderingInfo.size)
        : this.symbol.size || this.symbol.width || 1;
      // Convert meters to map units
      size /= this._context.mapCoordsHelper.mapUnitInMeters;
      return size;
    },

    _createAs3DShape: function(graphic, geometryType, renderingInfo, elevationInfo, idHint, graphicId) {
      var geometry = graphic.geometry;
      var paths = geometry[geometryType];
      var numPaths = paths.length;
      
      if (numPaths > 0) {
        var stageGeometries = [];
        var geoMaterials = [];
        var geoTrafos = [];
        var elevationProvider = this._context.elevationProvider;
        var spatialReference = geometry.spatialReference;
        var renderSR = this._context.renderSpatialReference;
        var elevationSR = elevationProvider.spatialReference;
        var c = vec3d.create();
        var sphericalGlobe = renderSR === projectionUtils.SphericalRenderSpatialReference;
        var elevationBB = new Array(6); // bounding box in elevation SR

        var size = this._getPathSize(renderingInfo, this.symbol);
        var color = this._getVertexOpacityAndColor(renderingInfo);

        // Copy input path data into a flat array of doubles
        var pathData = Canvas3DSymbolCommonCode.copyPathDataForTriangulation(paths, geometry.hasZ);
        var vertexData = pathData.vertexData;
        var vertexCount = vertexData.length / 3;

        // Transform original data into elevation SR
        var eleVertexData = new Float64Array(vertexData.length);
        if(!spatialReference.equals(elevationSR)) {
          projectionUtils.bufferToBuffer(vertexData, spatialReference, 0, eleVertexData, elevationSR, 0, vertexCount);
        } else {
          // Coordinate subtraction applied later to original data, need to copy
          Canvas3DSymbolCommonCode.copyVertices(vertexData, 0, eleVertexData, 0, vertexData.length);
        }

        // Adjust elevation
        Canvas3DSymbolCommonCode.applyElevation(elevationProvider, eleVertexData, 0, vertexData, 0, vertexCount, elevationInfo);

        // Transform original data into render SR
        if(!spatialReference.equals(renderSR)) {
          projectionUtils.bufferToBuffer(vertexData, elevationSR, 0, vertexData, renderSR, 0, vertexCount);
        }

        for (var o = 0; o < pathData.outlines.length; ++o) {
          var outline = pathData.outlines[o];
          var srcIndex = outline.index;
          var srcCount = outline.count;

          // Perform clipping
          var clippingExtent = this._context.clippingExtent;
          if (clippingExtent) {
            Canvas3DSymbolCommonCode.computeBoundingBox(eleVertexData, srcIndex, srcCount, elevationBB);
            if (!Canvas3DSymbolCommonCode.boxesIntersect2D(elevationBB, clippingExtent)) {
              continue;
            }
          }

          // Subtract origin
          Canvas3DSymbolCommonCode.chooseOrigin(vertexData, srcIndex, srcCount, c);
          Canvas3DSymbolCommonCode.subtractCoordinates(vertexData, srcIndex, srcCount, c);

          // Use buffer views for the actual geometry data.
          // Otherwise, the elevation provider will transform all of the vertices for each polygon
          var eleVertices = new Float64Array(eleVertexData.buffer, srcIndex * 3 * eleVertexData.BYTES_PER_ELEMENT, srcCount * 3);

          // Copy vertices into an old-school array of arrays, since GeometryUtil.createTubeGeometry requires that
          var vertices = Canvas3DSymbolCommonCode.flatArrayToArrayOfArrays(vertexData, srcIndex, srcCount);
          var geometryData = GeometryUtil.createTubeGeometry(vertices, 0.5*size, TUBE_SECTORS, sphericalGlobe, c);

          geometryData.getVertexAttr().mapPos = {
            size: 3,
            data: eleVertices
          };
          geometryData = GeometryUtil.addVertexColors(geometryData, color, true);

          var geo = new Geometry(geometryData, idHint+"path"+o);
          geo.singleUse = true;

          stageGeometries.push(geo);
          geoMaterials.push([this._material]);

          var trans = mat4d.identity();
          mat4d.translate(trans, c, trans);
          geoTrafos.push(trans);
        }

        var li = this._context.layer.get("id");
        var stageObject = new Object3D({
          geometries: stageGeometries,
          materials: geoMaterials,
          transformations: geoTrafos,
          castShadow: true,
          metadata: { layerId : li, graphicId: graphicId },
          idHint: idHint
        });
        
        
        var elevationAligner = null;
        if (elevationInfo.mode !== Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT) {
          elevationAligner = pathSymbolElevationAligner;
        }

        return new Canvas3DGraphic(this, stageObject, stageGeometries, null, null, elevationAligner, elevationInfo);
      } else {
        this._logWarning("no paths found for line symbol");
        return null;
      }
    }
  });

  var VertexAttrConstants = Util.VertexAttrConstants;
  var pathSymbolElevationAligner = function(canvas3DGraphic, elevationProvider, renderCoordsHelper) {
    var obj = canvas3DGraphic.stageObject;
    var elevationInfo = canvas3DGraphic.elevationInfo;

    var geoRecords = obj.getGeometryRecords();
    var numGeometries = geoRecords.length;
    
    for (var geoIdx = 0; geoIdx < numGeometries; geoIdx++) {    
      var geometry = geoRecords[geoIdx].geometry;
      var centroid = [geoRecords[geoIdx].transformation[12], geoRecords[geoIdx].transformation[13], geoRecords[geoIdx].transformation[14]];
      var va = geometry.getData().getVertexAttr();

      var vertices = va[VertexAttrConstants.POSITION].data;
      var zOffsets = va.zOffset.data;
      var mapSRPositions = va.mapPos.data;
      var numPoints = mapSRPositions.length/3;

      assert(vertices.length/3 === numPoints*TUBE_SECTORS + 2, "unexpected tube geometry");

      var vOffset = 0;
      var pOffset = 0;

      tmpPoint.spatialReference = elevationProvider.spatialReference;

      for (var pIdx = 0; pIdx < numPoints; pIdx++) {
        tmpPoint.x = mapSRPositions[pIdx*3];
        tmpPoint.y = mapSRPositions[pIdx*3+1];
        tmpPoint.z = mapSRPositions[pIdx*3+2];

        var elev = Canvas3DSymbolCommonCode.computeElevation(elevationProvider, tmpPoint, elevationInfo);

        var numVerts = TUBE_SECTORS;
        if ((pIdx === 0) || (pIdx === numPoints - 1)) {
          numVerts++; // one extra vertex at caps
        }
        
        for (var vIdx = 0; vIdx < numVerts; vIdx++) {
          tmpVec3[0] = vertices[vOffset]   + centroid[0];
          tmpVec3[1] = vertices[vOffset+1] + centroid[1];
          tmpVec3[2] = vertices[vOffset+2] + centroid[2];

          renderCoordsHelper.setAltitude(elev + zOffsets[pOffset], tmpVec3, 0);

          vertices[vOffset]   = tmpVec3[0] - centroid[0];
          vertices[vOffset+1] = tmpVec3[1] - centroid[1];
          vertices[vOffset+2] = tmpVec3[2] - centroid[2];    

          vOffset += 3;
          pOffset += 1;
        }
      }

      obj.geometryVertexAttrsUpdated(geoIdx);
    }
  };

  return Canvas3DPathSymbol;
});

