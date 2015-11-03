/* jshint forin:false */
define([
  "../../../../core/declare",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./Canvas3DDrapedGraphic", "./ElevationAligners", "./Canvas3DSymbolCommonCode",

  "../../../../core/screenUtils",

  "../../../../geometry/Polygon",
  "../../support/projectionUtils",
  "../../lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Object3D",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryData",
  "../../webgl-engine/lib/RenderGeometry",
  "../../webgl-engine/materials/NativeLineMaterial",
  "../../webgl-engine/materials/RibbonLineMaterial",
  "../../webgl-engine/lib/Util"

], function(
  declare,
  Canvas3DSymbolBase, Canvas3DGraphic, Canvas3DDrapedGraphic, ElevationAligners, Canvas3DSymbolCommonCode,
  screenUtils,
  Polygon, projectionUtils, glMatrix,
  Stage, Object3D, Geometry, GeometryData, RenderGeometry, NativeLineMaterial, RibbonLineMaterial, Util
) {
  var VertexAttrConstants = Util.VertexAttrConstants;
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpVec3 = vec3d.create();
  var tmpPoint = {};

  var Canvas3DLineSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var symbol = this.symbol;
      var width = this._getWidth(symbol);
      var idHint = this._getStageIdHint();

      var hasSizeOverride = this._isPropertyDriven("size");

      this._isNativeLineMaterial = false;

      if(hasSizeOverride || width > 2) {

        if(hasSizeOverride) {
          width = 0;
        }

        var matParams = {
          width: width,
          color: this._getMaterialOpacityAndColor(),
          miterLimit: symbol.miterLimit
        };

        if ((symbol.join === "miter") || (symbol.join === "bevel")) {
          matParams.join = symbol.join;
        } else {
          matParams.join = "miter"; // default value
          if (symbol.join) {
            this._logWarning("unsupported join type for line symbol: " + symbol.join);
          }
        }
        matParams.polygonOffset = true;        
        this._material = new RibbonLineMaterial(matParams, idHint + "_ribbonlinemat");
      } else if (width > 0) {
        this._isNativeLineMaterial = true;
        this._material = new NativeLineMaterial(width, this._getMaterialOpacityAndColor(), idHint + "_nativelinemat");
      } else {
        this.reject();
        return;
      }

      this._context.stage.add(Stage.ModelContentType.MATERIAL, this._material);
      this.resolve();
    },

    _getWidth: function(symbol) {
      if (symbol.size != null) {
        return symbol.size;
      } else {
        return 1;
      }
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

      var drivenColor = this._getVertexOpacityAndColor(renderingInfo, Float32Array, 255);

      var drivenSize = 0;
      if (renderingInfo.size && this._isPropertyDriven("size")) {
        drivenSize = Canvas3DSymbolCommonCode.getSingleSizeDriver(renderingInfo.size);
        drivenSize = screenUtils.pt2px(drivenSize); // values from Renderer are in pt -> convert to px
      }

      var elevationInfo = this._getGraphicElevationInfo(graphic);

      if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.ON_THE_GROUND) {
         return this._createAsOverlay(graphic, geometryType, drivenColor, drivenSize, elevationInfo, idHint);
      } else {
         return this._createAs3DShape(graphic, geometryType, drivenColor, drivenSize, elevationInfo, idHint, graphic.id);
      }
    },

    layerPropertyChanged: function(name, canvas3DGraphics, symbolLayerIdx) {
      if (name === "opacity") {
        if (this._isNativeLineMaterial) {
          var color = this._material.getColor();
          color[3] = this._getMaterialOpacity();
          this._material.setColor(color);
        }
        else {
          var matParams = this._material.getParameterValues();
          matParams.color[3] = this._getMaterialOpacity();
          this._material.setParameterValues({color: matParams.color});
        }
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
    _getOutlineSegments: function(geometry, geometryData) {
      var numPaths = geometryData.length;
      if (geometry._outlineSegments!=null) {
        var geometryDataNew = [];
        for (var pathIdx = 0; pathIdx < numPaths; pathIdx++) {
          var path = geometryData[pathIdx];
          for (var segmentIdx = 0; segmentIdx < geometry._outlineSegments[pathIdx].length; segmentIdx++) {
            var segment = geometry._outlineSegments[pathIdx][segmentIdx];
            var pathNew = [];
            for (var pointIdx = segment[0]; pointIdx < segment[1]; pointIdx++) {
               pathNew.push(path[pointIdx]);
            }
            if (pathNew.length>0) {
              geometryDataNew.push(pathNew);
            }
          }
        }
        geometryData = geometryDataNew;
      }
      return geometryData;
    },

    _getGeometry: function(graphic) {
      var geometry = graphic.geometry;
      if (geometry.type === "extent") {
        geometry = Polygon.fromExtent(geometry);
      }
      return geometry;
    },

    _createAs3DShape: function(graphic, geometryType, color, size, elevationInfo, idHint, graphicId) {
      var geometry = this._getGeometry(graphic);

      var geometryData = geometry[geometryType];
      geometryData = this._getOutlineSegments(geometry, geometryData);

      // Copy input path data into a flat array of doubles
      var pathData = Canvas3DSymbolCommonCode.copyPathDataForTriangulation(geometryData, geometry.hasZ);
      var vertexData = pathData.vertexData;
      var vertexCount = vertexData.length / 3;

      if (pathData.outlines.length > 0) {
        var elevationProvider = this._context.elevationProvider;
        var renderSR = this._context.renderSpatialReference;
        var spatialReference = geometry.spatialReference;
        var elevationSR = elevationProvider.spatialReference;
        var stageGeometries = [];
        var geoMaterials = [];
        var geoTrafos = [];
        var c = vec3d.create();
        var elevationBB = new Array(6); // bounding box in elevation SR

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
          var vertices = new Float64Array(vertexData.buffer, srcIndex * 3 * vertexData.BYTES_PER_ELEMENT, srcCount * 3)
          var geoData = createPolylineGeometry(vertices, eleVertices, geometryType === "rings", color, size, false);

          var geo = new Geometry(geoData, idHint+"path"+o);
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
          castShadow: false,
          metadata: { layerId : li, graphicId: graphicId },
          idHint: idHint
        });

        var elevationAligner = null;
        if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND) {
          elevationAligner = ElevationAligners.perVertexElevationAligner;
        }

        return new Canvas3DGraphic(this, stageObject, stageGeometries, null, null, elevationAligner, elevationInfo);
      } else {
        this._logWarning("no paths found for line symbol");
        return null;
      }
    },

    _createAsOverlay: function(graphic, geometryType, color, size, elevationInfo, idHint) {
      var geometry = this._getGeometry(graphic);

      this._material.setRenderPriority(this._symbolLayerOrder);

      var geometrySR = geometry.spatialReference;
      var overlaySR = this._context.overlaySR;

      var geometryData = geometry[geometryType];
      geometryData = this._getOutlineSegments(geometry, geometryData);

      // Copy input path data into a flat array of doubles
      var pathData = Canvas3DSymbolCommonCode.copyPathDataForTriangulation(geometryData, false);
      var vertexData = pathData.vertexData;
      var vertexCount = vertexData.length / 3;

      if (pathData.outlines.length > 0) {
        var drapedRGs = [];
        var renderBB = new Array(6); // bounding box in overlay SR
        var c = vec3d.create();

        // Transform vertex data according to the destination SR
        if (!geometrySR.equals(overlaySR)) {
            projectionUtils.bufferToBuffer(vertexData, geometrySR, 0, vertexData, overlaySR, 0, vertexCount);
        }

        for (var o = 0; o < pathData.outlines.length; ++o) {
          var outline = pathData.outlines[o];
          var srcIndex = outline.index;
          var srcCount = outline.count;

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

          // Create a buffer view
          var vertices = new Float64Array(vertexData.buffer, srcIndex * 3 * vertexData.BYTES_PER_ELEMENT, srcCount * 3);

          var trans = mat4d.identity();
          mat4d.translate(trans, c, trans);

          var drapedGeoData = createPolylineGeometry(vertices, null, geometryType === "rings", color, size, true);
          var drapedRG = new RenderGeometry(drapedGeoData);
          drapedRG.material = this._material;
          drapedRG.center = [0.5*(renderBB[0] + renderBB[3]), 0.5*(renderBB[1] + renderBB[4]), 0];
          drapedRG.bsRadius = 0.5*Math.sqrt((renderBB[3] - renderBB[0])*(renderBB[3] - renderBB[0]) + (renderBB[4] - renderBB[1])*(renderBB[4] - renderBB[1]));
          drapedRG.transformation = trans;
          drapedRG.name = idHint;
          drapedRG.uniqueName = idHint + "#" + drapedGeoData.id;
          drapedRGs.push(drapedRG);
        }

        return new Canvas3DDrapedGraphic(this, drapedRGs, null, null);
      } else {
        return null;
      }
    }
  });

  /** Returns true if the list of vertices is closed (i.e., first vertex equals last vertex) */
  function isClosed(vertices) {
    var len = vertices.length;
    return (vertices[0] === vertices[len-3]
      && vertices[1] === vertices[len-2]
      && vertices[2] === vertices[len-1]);
  }

  var createPolylineGeometry = function(vertices, eleVertices, closeRing, color, size, renderGeometryStyle) {
    var numVertices;
    var newVertices;
    var idxVerts, idxColorsSizes;

    // Do not generate additional vertices if the polyline is already closed
    closeRing = closeRing && !isClosed(vertices);

    if(!closeRing){
      numVertices = vertices.length/3;
      idxVerts = new Uint32Array(2*(numVertices - 1));
      idxColorsSizes = new Uint32Array(2*(numVertices - 1));
      newVertices = vertices;
    }
    else{
      var tmpVertices = new Float32Array(vertices.length + 3);

      for(var i=0; i<vertices.length; i++) {
        tmpVertices[i] = vertices[i];
      }

      var s = tmpVertices.length;
      tmpVertices[s-3] = vertices[0];
      tmpVertices[s-2] = vertices[1];
      tmpVertices[s-1] = vertices[2];

      newVertices = tmpVertices;

      numVertices = vertices.length/3 + 1;
      idxVerts = new Uint32Array(2*(numVertices - 1));
      idxColorsSizes = new Uint32Array(2*(numVertices - 1));
    }

    var sizes = new Float32Array(1);
    sizes[0] = size;

    var ii = 0, ic = 0;
    for (var pi = 0; pi < numVertices - 1; pi++) {
      idxVerts[ii++] = pi;
      idxVerts[ii++] = pi+1;

      idxColorsSizes[ic++] = 0;
      idxColorsSizes[ic++] = 0;
    }

    var indices2 = {}, vertexAttr = {};
    indices2[VertexAttrConstants.POSITION] = idxVerts;
    indices2[VertexAttrConstants.COLOR] = idxColorsSizes;
    indices2[VertexAttrConstants.SIZE] = idxColorsSizes;

    vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data": newVertices};
    vertexAttr[VertexAttrConstants.COLOR] = { "size" : 4, "data": color};
    vertexAttr[VertexAttrConstants.SIZE] = { "size" : 1, "data": sizes};

    if (eleVertices) {
      indices2["mapPos"] = idxVerts;
      vertexAttr["mapPos"] = { "size" : 3, "data": eleVertices};
    }

    var faces = [ { "type" : "line", "indices" : indices2, "positionKey" : VertexAttrConstants.POSITION } ];

    if (renderGeometryStyle) {
      return {
        "faces" : faces[0],
        "vertexAttr" : vertexAttr,
        "id" : GeometryData.getNewId().toString()  // toString()ing it to make it same type as with proper GeometryData (see Model.getGeometryRenderGeometries())
      };
    } else {
      return new GeometryData(faces, vertexAttr);
    }
  };

  return Canvas3DLineSymbol;
});

