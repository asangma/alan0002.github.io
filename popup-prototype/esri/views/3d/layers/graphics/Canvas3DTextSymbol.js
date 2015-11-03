/* jshint forin:false */
define([
  "../../../../core/declare",
  "../../../../Color",

  "./Canvas3DSymbolBase", "./Canvas3DGraphic", "./ElevationAligners", "./Canvas3DSymbolCommonCode", "./Canvas3DIconSymbol",

  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryUtil",
  "../../webgl-engine/lib/TextTexture",
  "../../webgl-engine/materials/HUDMaterial"

], function(
  declare, esriColor,
  Canvas3DSymbolBase, Canvas3DGraphic, ElevationAligners, Canvas3DSymbolCommonCode, Canvas3DIconSymbol,
  Geometry, GeometryUtil, TextTexture, HUDMaterial
) {

  var ONEONEONE = [1, 1, 1];
  var UP_DIR = [0, 0, 1];
  var perObjectElevationAligner = ElevationAligners.perObjectElevationAligner;

  var Canvas3DTextSymbol = declare([Canvas3DSymbolBase], {
    _prepareResources: function() {
      var symbol = this.symbol;
      this._anchor = (Canvas3DIconSymbol.VALID_ANCHOR_STRINGS.indexOf(symbol.anchor) > -1) ? symbol.anchor : "center";
      this.resolve();
    },

    destroy: function() {
    },

    createCanvas3DGraphic: function(graphic, overrides, hudMaterialCollection, textTextureManager) {
      var geometry = graphic.geometry;

      var useHigherPolyOffset = false;

      if (geometry.type === "polyline") {
        geometry = Canvas3DSymbolCommonCode.placePointOnPolyline(geometry);
        useHigherPolyOffset = true;
      }
      else if (geometry.type === "polygon") {
        geometry = Canvas3DSymbolCommonCode.placePointOnPolygon(geometry);
      }
      else if (geometry.type === "extent") {
        geometry = geometry.get("center");
      }
      else if (geometry.type !== "point") {
        this._logWarning("unsupported geometry type for label symbol: " + geometry.type);
        return null;
      }
      var idHint = this._context.layer.id + "_label_" + graphic.id;

      var text = overrides.text || this.symbol.text;
      if (!text || (text.length < 1)) {
        return null;
      }
      var elevationInfo = this._getGraphicElevationInfo(graphic);
      return this._createAs3DShape(this.symbol, geometry, text, elevationInfo, idHint, graphic.id, overrides,
        hudMaterialCollection, textTextureManager,useHigherPolyOffset);
    },

    layerPropertyChanged: function(name, canvas3DGraphics, symbolLayerIdx) {
      if (name === "opacity") {
        console.warn("layer opacity change not yet implemented in Canvas3DTextSymbol");
      }
      else if (name === "elevationInfo") {
        this._updateElevationInfo();

        if (canvas3DGraphics) {
          for (var id in canvas3DGraphics) {
            var canvas3DGraphicSet = canvas3DGraphics[id];
            var canvas3DGraphic = canvas3DGraphicSet._graphics[symbolLayerIdx];
            if (canvas3DGraphic) {
              this.updateGraphicElevationInfo(canvas3DGraphicSet.graphic, canvas3DGraphic);
            }
          }
        }
        return true;
      }
      return false;
    },

    updateGraphicElevationInfo: function(graphic, canvas3DGraphic) {
      var context = this._context;
      var elevationInfo = this._getGraphicElevationInfo(graphic);
      canvas3DGraphic.elevationAligner = (elevationInfo.mode !== Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT) ?
        perObjectElevationAligner : null;
      canvas3DGraphic.elevationInfo.set(elevationInfo);
      perObjectElevationAligner(canvas3DGraphic, context.elevationProvider, context.renderCoordsHelper, context.mapCoordsHelper);
    },

    // Elevation mode stunts: we never drape labels, but if mode is onTheGround, then
    // Canvas3DSymbolCommonCode.computeElevation() will ignore elevation offset, and in turn the labels will tend
    // to vanish in the ground. Therefore:
    // - we use the same defaults for elevation mode/offset as for Icon symbols
    // - we override elevation mode and offset if mode is onTheGround
    _defaultElevationInfoNoZ: {
      mode: Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND,
      offset: 0
    },
    _getGraphicElevationInfo: function(graphic) {
      var elevationInfo = this.inherited(arguments);

      if (elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.ON_THE_GROUND) {
        elevationInfo.mode = Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND;
        elevationInfo.offset = 1 / this._context.mapCoordsHelper.mapUnitInMeters;
        elevationInfo.featureExpression = {value: 0};
      }
      else if ((elevationInfo.mode === Canvas3DSymbolCommonCode.ELEV_MODES.RELATIVE_TO_GROUND) &&
        (elevationInfo.offset === 0) &&
        !graphic.geometry.get("hasZ"))
      {
        // to avoid flickering issues, lift icon 1m above the ground if there is no offset/z-value
        elevationInfo.offset = 1 / this._context.mapCoordsHelper.mapUnitInMeters;
      }
      return elevationInfo;
    },


    _createAs3DShape: function(symbol, geometry, text, elevationInfo, idHint, graphicId, overrides,
                               hudMaterialCollection, texTextureAtlas,useHigherPolyOffset) {
      var centerOffset = overrides.centerOffset || [0,0,0,0];
      var screenOffset = overrides.screenOffset || [0, 0];
      var translation = overrides.translation || [0,0,0,0];
      var anchor = overrides.anchor || this._anchor || "center";
      this._anchor = anchor;


      var symbolColor = symbol.material ? esriColor.toUnitRGB(symbol.material.color) : ONEONEONE;

      //perceived brighntess: http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
      var intensity = symbolColor[0]*0.299 + symbolColor[1]*0.587 + symbolColor[2]*0.114;
      
      var shadowColorString = intensity > 0.35 ? "black" : "white";
      var canvasStyle = {
        shadowColor: shadowColorString,
        shadowBlur: 1
      };

      var usedInAtlas = texTextureAtlas!=null;

      var texture = new TextTexture(text, {
          size: symbol.size || 12,
          color: symbolColor,
          font: {
            family: (symbol.font && symbol.font.family) ? symbol.font.family : "Arial",
            weight: (symbol.font && symbol.font.weight) ? symbol.font.weight : "normal",
            style: (symbol.font && symbol.font.style) ? symbol.font.style : "normal"
          },

          canvasStyle: canvasStyle
        }, idHint,usedInAtlas);

      var placement = usedInAtlas? texTextureAtlas.addTextTexture(texture):null;

      var opacity = this._getMaterialOpacity();
      var matParams = {
        textureId: usedInAtlas?placement.texture.getId():texture.getId(),
        texCoordScale: texture.getTexcoordScale(),
        occlusionTest: true,
        screenOffset: screenOffset,
        anchorPos: anchor,
        polygonOffset: true,
        color: [1, 1, 1, opacity],
        transparent: opacity < 1
      };

      if (useHigherPolyOffset) {
        matParams.shaderPolygonOffset = 1.e-4;
      }

      var hudMaterial = null;
      var paramsStringified = JSON.stringify(matParams);
      if (hudMaterialCollection!=null) {
        hudMaterial = hudMaterialCollection.getMaterial(paramsStringified);
        if (hudMaterial==null) {
          hudMaterial = new HUDMaterial(matParams, idHint);
          hudMaterialCollection.addMaterial(paramsStringified, hudMaterial);
        } else {
          if (usedInAtlas) {
            hudMaterial.setTextureDirty();
          }
        }
      } else {
        hudMaterial = new HUDMaterial(matParams, idHint);
      }

      var stageMaterials = [ hudMaterial ];

      var size = [texture.getTextWidth(), texture.getTextHeight()];

      var pointGeom = GeometryUtil.createPointGeometry(UP_DIR, translation, undefined, size, undefined, centerOffset, placement? placement.uvMinMax: null);
      var stageGeometries = [ new Geometry(pointGeom, idHint) ];

      var layerId = this._context.layer.get("id");
      var stageObject = Canvas3DSymbolCommonCode.createStageObjectForPoint.call(this,
        geometry, stageGeometries, [stageMaterials], null, null, elevationInfo, idHint, layerId, graphicId);

      var elevationAligner = null;   
      if (elevationInfo.mode !== Canvas3DSymbolCommonCode.ELEV_MODES.ABSOLUTE_HEIGHT) {
        elevationAligner = ElevationAligners.perObjectElevationAligner;
      } 

      var canvas3DGraphic = new Canvas3DGraphic(this, stageObject, stageGeometries,
        hudMaterialCollection == null ? stageMaterials : null,
        texTextureAtlas == null ? [texture] : null,
        elevationAligner, elevationInfo);

      Canvas3DSymbolCommonCode.extendPointGraphicElevationInfo(canvas3DGraphic, geometry, this._context.elevationProvider);

      return canvas3DGraphic;
    }
  });

  return Canvas3DTextSymbol;
});

