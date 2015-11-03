/* jshint forin:false */
define([
  "../../../../core/declare",
  "dojo/_base/lang",
  "../../support/PromiseLightweight",
  "./ElevationInfo",
  "../../../../Color"
], function(declare, lang, PromiseLightweight, ElevationInfo, esriColor) {

  var tmpElevationInfo = new ElevationInfo();

  var Canvas3DSymbolBase = declare([PromiseLightweight.Promise], {
    constructor: function(symbol, context, ignoreDrivers) {
      this.symbol = symbol;
      this._context = context;
      this._symbolLayerOrder = context.layerOrder;
      this._elevationInfo = new ElevationInfo();

      // ignoreDrivers is a temporary measure to deal with backgroundFillSymbol, which should not be driven by
      // visualVariables. in the long term, we should implement visualVariables that target certain layers
      // specifically, in which case we don't need this anymore
      this._updateDrivenProperties(ignoreDrivers);

      this._updateElevationInfo();
      this._prepareResources();
    },

    _logWarning: function(message) {
      console.warn(message);
    },

    _prepareResources: function(sharedResources) {
      throw new Error("This is an abstract base class");
      // Subclasses should load all shareable resources (that don't depend on geometry) and then call this.resolve().
    },

    _defaultElevationInfoNoZ: {
      mode: ElevationInfo.MODES.ON_THE_GROUND,
      offset: 0
    },
    _defaultElevationInfoZ: {
      mode: ElevationInfo.MODES.ABSOLUTE_HEIGHT,
      offset: 0
    },

    _updateElevationInfo: function() {
      // keep _elevationInfo the same instance but overwrite all properties with default
      for (var key in this._elevationInfo) {
        this._elevationInfo[key] = undefined;
      }

      var layerElevationInfo = this._context.layer.get("elevationInfo");
      if (layerElevationInfo) {
        this._elevationInfo = lang.mixin(this._elevationInfo, layerElevationInfo);
      }

      var symbolElevationInfo = this.symbol.get("elevationInfo");
      if (symbolElevationInfo) {
        this._elevationInfo = lang.mixin(this._elevationInfo, this.symbol.elevationInfo);
      }
    },

    _getGraphicElevationInfo: function(graphic) {
      // pick default values based on whether the graphic has Z values or not
      var defaultElevationInfo = graphic.geometry.get("hasZ") ? this._defaultElevationInfoZ :
        this._defaultElevationInfoNoZ;

      tmpElevationInfo.mode = this._elevationInfo.mode || defaultElevationInfo.mode;
      tmpElevationInfo.offset = (this._elevationInfo.offset != null) ? this._elevationInfo.offset :
        defaultElevationInfo.offset;
      tmpElevationInfo.featureExpression = this._elevationInfo.featureExpression;

      tmpElevationInfo.offset = tmpElevationInfo.offset / this._context.mapCoordsHelper.mapUnitInMeters;

      return tmpElevationInfo;
    },

    /** The Z coordinate at which draped geometry should be generated */
    _getDrapedZ: function() {
      // The virtual camera of the texture renderer is at z===0 and has the near plane at 1.
      // Place draped geometry at z===-2 in order to move it behind the near plane.
      // Using z===-1 is not enough due to floating point errors.
      return -2;
    },

    _updateDrivenProperties: function(ignoreDrivers) {
      var result = {
        color: false,
        opacity: false,
        size: false
      };
      if (!ignoreDrivers) {
        var renderer = this._context.renderer;
        if (renderer) {
          result.color = !!renderer.colorInfo;
          result.size = !!renderer.sizeInfo;
          if (renderer.visualVariables) {
            renderer.visualVariables.forEach(function(variable) {
              switch (variable.type) {
                case "colorInfo":
                  var i, color;

                  result.color = true;

                  // Check if colors also drive opacity
                  if (variable.colors) {
                    for (i = 0; i < variable.colors.length; i++) {
                      color = variable.colors[i];

                      if (color && ((Array.isArray(color) && color.length > 3 && color[3] !== 255) || (color.a !== undefined && color.a !== 255))) {
                        result.opacity = true;
                      }
                    }
                  }

                  if (variable.stops) {
                    for (i = 0; i < variable.stops.length; i++) {
                      color = variable.stops[i].color;

                      if (color && ((Array.isArray(color) && color.length > 3 && color[3] !== 255) || (color.a !== undefined && color.a !== 255))) {
                        result.opacity = true;
                      }
                    }
                  }
                break;
                case "opacityInfo":
                case "transparencyInfo": result.opacity = true; break;
                case "sizeInfo": result.size = true; break;
              }
            });
          }
        }
      }
      this._drivenProperties = result;
    },

    _isPropertyDriven: function(propName) {
      return this._drivenProperties[propName];
    },

    _getLayerOpacity: function() {
      var layerOpacity = this._context.layer.get("opacity");
      if (layerOpacity != null) {
        return layerOpacity;
      } else {
        return 1;
      }
    },

    _getMaterialOpacity: function() {
      var result = 1;
      result *= this._getLayerOpacity();

      var symbolMaterial = this.symbol.material;
      if (symbolMaterial && !this._isPropertyDriven("opacity")) {
        result *= symbolMaterial.color.a;
      }

      return result;
    },

    _getMaterialOpacityAndColor: function() {
      var symbolMaterial = this.symbol.material;
      var opacity = this._getMaterialOpacity();
      var color = (this._isPropertyDriven("color") || !symbolMaterial) ? null :
        esriColor.toUnitRGB(symbolMaterial.color);
      return this._mixinColorAndOpacity(color, opacity);
    },

    _getVertexOpacityAndColor: function(renderingInfo, TypedArrayClass, scale) {
      var drivenColor = this._isPropertyDriven("color") ? renderingInfo.color : null,
        drivenOpacity = this._isPropertyDriven("opacity") ? renderingInfo.opacity : null,
        result = this._mixinColorAndOpacity(drivenColor, drivenOpacity);

      if (scale) {
        result[0] *= scale;
        result[1] *= scale;
        result[2] *= scale;
        result[3] *= scale;
      }

      return TypedArrayClass ? new TypedArrayClass(result) : result;
    },

    _mixinColorAndOpacity: function(color, opacity) {
      var result = [1, 1, 1, 1];
      if (color != null) {
        result[0] = color[0];
        result[1] = color[1];
        result[2] = color[2];
      }
      if (opacity != null) {
        result[3] = opacity;
      } else if (color != null && color.length > 3) {
        result[3] = color[3];
      }

      return result;
    },

    _getStageIdHint: function() {
      return this._context.layer.id + "_symbol";
    },

    setDrawOrder: function(drawOrder, dirtyMaterials) {
      if (this._material) {
        this._material.setRenderPriority(drawOrder);
        dirtyMaterials[this._material.getId()] = true;
      }
    },

    createCanvas3DGraphic: function(graphic, overrides) {
      throw new Error("This is an abstract base class");
    },

    destroy: function() {
      throw new Error("This is an abstract base class");
      // Subclasses should release all shared resources.
    }
  });

  return Canvas3DSymbolBase;
});
