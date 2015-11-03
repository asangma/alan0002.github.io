/* jshint forin:false */
define([
  "../../../../core/declare",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./Canvas3DDrapedGraphic", "./ElevationAligners", "./Canvas3DSymbolCommonCode",

  "../../../../geometry/Polygon",
  "../../support/projectionUtils",
  "../../lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Object3D",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryData",
  "../../webgl-engine/lib/RenderGeometry",
  "../../webgl-engine/materials/ColorMaterial",  
  "../../webgl-engine/lib/Util",
  "./earcut/earcut"
], function(
  declare,
  Canvas3DSymbolBase, Canvas3DGraphic, Canvas3DDrapedGraphic, ElevationAligners, Canvas3DSymbolCommonCode,
  Polygon, projectionUtils, glMatrix,
  Stage, Object3D, Geometry, GeometryData, RenderGeometry, ColorMaterial, Util, earcut) {
  var VertexAttrConstants = Util.VertexAttrConstants;
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var Canvas3DFillSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var idHint = this._getStageIdHint();

      var color = this._getMaterialOpacityAndColor();
      var matParams = {
          color : color,
          transparent: (color[3] < 1) || this._isPropertyDriven("opacity"),
          polygonOffset : false,
          vertexColors : true
        };      

      this._material = new ColorMaterial(matParams, idHint + "_colormat");
      this._context.stage.add(Stage.ModelContentType.MATERIAL, this._material);
      this.resolve();
    },

    destroy: function() {
      this._context.stage.remove(Stage.ModelContentType.MATERIAL, this._material.getId());
    },

    createCanvas3DGraphic: function(graphic, renderingInfo) {
      var geometry = graphic.geometry;

      if ((geometry.type !== "polyline") && (geometry.type !== "polygon") && (geometry.type !== "extent")) {
        this._logWarning("unsupported geometry type for line symbol: " + geometry.type);
        return null;
      }
      var geometryType = (geometry.type === "polygon" || geometry.type === "extent") ? "rings" : "paths";
      var idHint = "graphic"+graphic.id;

      var drivenColor = this._getVertexOpacityAndColor(renderingInfo, Uint8Array, 255);

      var elevationInfo = this._getGraphicElevationInfo(graphic);

      if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.ON_THE_GROUND) {
        return this._createAsOverlay(graphic, geometryType, drivenColor, elevationInfo, idHint);
      } else {
        return this._createAs3DShape(graphic, geometryType, drivenColor, elevationInfo, idHint, graphic.id);
      }
    },

    layerPropertyChanged: function(name, canvas3DGraphics, symbolLayerIdx) {
      if (name === "opacity") {
        var col = this._material.getColor();
        col[3] = this._getMaterialOpacity();
        this._material.setColor(col);
        this._material.setTransparent(col[3] < 1);
        return true;
      }
      else if (name === "elevationInfo") {
        var prevMode = this._elevationInfo.mode;
        this._updateElevationInfo();
        var newMode = this._elevationInfo.mode;

        // in case the symbol/graphics switch between 3D and draped display, we need to recreate the symbol:

        if ((prevMode == null) || (newMode == null)) {
          // if one of the modes was not set, each graphics' geometry determines whether it gets draped or not. the
          // conservative solution is to recreate all graphics if that's the case.
          return false;
        }

        var MODES = Canvas3DSymbolCommonCode.ELEV_MODES;
        if ((prevMode === MODES.ON_THE_GROUND) && (newMode === MODES.ON_THE_GROUND)) {
          // if mode stays at onTheGround, no further actions are necessary (changes in offset/featureExpression
          // won't matter)
          return true;
        }
        if ((prevMode !== newMode) && ((prevMode === MODES.ON_THE_GROUND) || (newMode === MODES.ON_THE_GROUND))) {
          // if mode switches from or to onTheGround, symbol needs to be recreated
          return false;
        }

        // otherwise we can handle the change by setting the proper elevation aligner and recomputing the elevation
        var elevationAligner = (newMode === MODES.RELATIVE_TO_GROUND) ?
          ElevationAligners.perVertexElevationAligner : null;
        var elevationProvider = this._context.elevationProvider;
        var renderCoordsHelper = this._context.renderCoordsHelper;
        var mapCoordsHelper = this._context.mapCoordsHelper;
        for (var id in canvas3DGraphics) {
          var canvas3DGraphicSet = canvas3DGraphics[id];
          var canvas3DGraphic = canvas3DGraphicSet._graphics[symbolLayerIdx];
          if (canvas3DGraphic) {
            var graphic = canvas3DGraphicSet.graphic;
            canvas3DGraphic.elevationAligner = elevationAligner;
            canvas3DGraphic.elevationInfo.set(this._getGraphicElevationInfo(graphic));
            ElevationAligners.perVertexElevationAligner(canvas3DGraphic, elevationProvider, renderCoordsHelper, mapCoordsHelper);
          }
        }
        return true;
      }
      return false;
    },

    _getGeometry: function(graphic) {
      var geometry = graphic.geometry;
      if (geometry.type === "extent") {
        geometry = Polygon.fromExtent(geometry);
      }
      return geometry;
    },  

    _createAs3DShape: function(graphic, geometryType, color, elevationInfo, idHint, graphicId) {
      var geometry = this._getGeometry(graphic);
      var hasZ = geometry.hasZ;

      var paths = geometry[geometryType];
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

        // Adjust elevation (in elevation SR)
        Canvas3DSymbolCommonCode.applyElevation(elevationProvider, eleVertices, 0, vertexData, 0, vertexCount, elevationInfo);

        // Transform elevated data into render SR
        if(!spatialReference.equals(renderSR)) {
          projectionUtils.bufferToBuffer(vertexData, elevationSR, 0, vertexData, renderSR, 0, vertexCount);
        }

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

          var eleVerticesView = new Float64Array(eleVertices.buffer, srcIndex * 3 * eleVertices.BYTES_PER_ELEMENT, srcCount * 3);
          var verticesView    = new Float64Array(vertexData.buffer,  srcIndex * 3 * vertexData.BYTES_PER_ELEMENT,  srcCount * 3);

          // Triangulate polygon
          var earcutHoleIndices = polygon.holeIndices.map(function(i){return i-srcIndex;});
          var triangles = earcut(eleVerticesView, earcutHoleIndices, 3);

          if (triangles.length > 0) {

            // Subtract origin
            Canvas3DSymbolCommonCode.chooseOrigin(vertexData, srcIndex, srcCount, c);
            Canvas3DSymbolCommonCode.subtractCoordinates(vertexData, srcIndex, srcCount, c);

            // Use buffer views for the actual geometry data.
            // Otherwise, the elevation provider will transform all of the vertices for each polygon
            var geometryData = this._createFillGeometry(triangles, 0, verticesView, eleVerticesView, color, false);

            var g = new Geometry(geometryData, idHint);
            g.singleUse = true;

            stageGeometries.push(g);
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
            castShadow: false,
            metadata: { layerId : li, graphicId : graphicId},
            idHint: idHint
          });

          var elevationAligner = null;
          if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND) {
            elevationAligner = ElevationAligners.perVertexElevationAligner;
          }

          return new Canvas3DGraphic(this, stageObject, stageGeometries, null, null, elevationAligner, elevationInfo);
        }
        else {
          return null;
        }
      } else {
        this._logWarning("no paths found for line symbol");
        return null;
      }
    },

    _createAsOverlay: function(graphic, geometryType, color, elevationInfo, idHint) {
      var geometry = this._getGeometry(graphic);
      var paths = geometry[geometryType];
      this._material.setRenderPriority(this._symbolLayerOrder);

      if (paths.length > 0) {
        var geometrySR = geometry.spatialReference;
        var overlaySR = this._context.overlaySR;
        var drapedRGs = [];
        var c = vec3d.create();
        var renderBB = new Array(6); // bounding box in overlay SR

        // Copy input path data into a flat array of doubles
        var pathData = Canvas3DSymbolCommonCode.copyPathDataForTriangulation(paths, false);
        var vertexData = pathData.vertexData;
        var vertexCount = vertexData.length / 3;

        // Transform vertex data according to the destination SR
        if (!geometrySR.equals(overlaySR)) {
          projectionUtils.bufferToBuffer(vertexData, geometrySR, 0, vertexData, overlaySR, 0, vertexCount);
        }

        for (var p = 0; p < pathData.polygons.length; ++p) {
          var polygon = pathData.polygons[p];
          var srcCount = polygon.count;
          var srcIndex = polygon.index;

          var verticesView    = new Float64Array(vertexData.buffer,  srcIndex * 3 * vertexData.BYTES_PER_ELEMENT,  srcCount * 3);

          // Triangulate polygon
          var earcutHoleIndices = polygon.holeIndices.map(function(i){return i-srcIndex;});
          var triangles = earcut(verticesView, earcutHoleIndices, 3);

          if (triangles.length > 0) {

            // Compute bounding box
            Canvas3DSymbolCommonCode.computeBoundingBox(vertexData, srcIndex, srcCount, renderBB);

            // Perform clipping
            var clippingExtent = this._context.clippingExtent;
            if (clippingExtent && !Canvas3DSymbolCommonCode.boxesIntersect2D(renderBB, clippingExtent)) {
              continue;
            }

            // Choose an origin and subtract its coordinates
            Canvas3DSymbolCommonCode.chooseOrigin(vertexData, srcIndex, srcCount, c);
            Canvas3DSymbolCommonCode.subtractCoordinates(vertexData, srcIndex, srcCount, c);

            // Move the geometry behind the near plane (see TextureRenderer.draw)
            Canvas3DSymbolCommonCode.setZ(vertexData, srcIndex, srcCount, this._getDrapedZ());

            // Create render geometry
            var trans = mat4d.identity();
            mat4d.translate(trans, c, trans);

            var drapedGeoData = this._createFillGeometry(triangles, srcIndex, vertexData, null, color, true);

            var drapedRG = new RenderGeometry(drapedGeoData);
            drapedRG.material = this._material;
            drapedRG.center = [0.5*(renderBB[0] + renderBB[3]), 0.5*(renderBB[1] + renderBB[4]), 0];
            drapedRG.bsRadius = 0.5*Math.sqrt((renderBB[3] - renderBB[0])*(renderBB[3] - renderBB[0]) + (renderBB[4] - renderBB[1])*(renderBB[4] - renderBB[1]));
            drapedRG.transformation = trans;
            drapedRG.name = idHint;
            drapedRG.uniqueName = idHint + "#" + drapedGeoData.id;
            drapedRGs.push(drapedRG); 
          }
        }

        return (drapedRGs.length > 0) ? new Canvas3DDrapedGraphic(this, drapedRGs, null, null) : null;
      } else {
        return null;
      }
    },

    _createFillGeometry: function(indices, indexOffset, vertices, eleVertices, colors, renderGeometryStyle) {
      var numIndices = indices.length;

      var idxVerts = new Uint32Array(numIndices);
      var idxColors =  new Uint32Array(numIndices);

      for(var i=0; i<numIndices; i++) { 
          idxVerts[i] = indices[i] + indexOffset;
          idxColors[i] = 0;
      }

      var indices2 = {}, vertexAttr = {};
      indices2[VertexAttrConstants.POSITION] = idxVerts;
      indices2[VertexAttrConstants.COLOR] = idxColors;

      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data": vertices};
      vertexAttr[VertexAttrConstants.COLOR] = { "size" : 4, "data": colors};

      if (eleVertices) {
        vertexAttr["mapPos"] = { "size" : 3, "data": eleVertices};
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

  
  return Canvas3DFillSymbol;
});

