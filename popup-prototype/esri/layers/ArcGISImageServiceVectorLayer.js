define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/sniff",

  "../core/lang",

  "./GraphicsLayer",
  "../renderers/VectorFieldRenderer",

  "../geometry/Point",
  "../geometry/Extent",
  "../Graphic",
  "dojox/gfx",
  
  "./mixins/ImageServiceLayerMixin"
],
function(
  declare, lang, has,
  esriLang,
  GraphicsLayer, VectorFieldRenderer,
  Point, Extent, Graphic, gfx,
  ImageServiceLayerMixin
) {

    var ArcGISImageServiceVectorLayer = declare([GraphicsLayer, ImageServiceLayerMixin], {
      declaredClass: "esri.layers.ArcGISImageServiceVectorLayer",
    
    constructor: function (url, options) {
      this.symbolTileSize = (options && options.symbolTileSize) ? options.symbolTileSize : 50;
      this._minMag = null;
      this._maxMag = null;
      var rendererStyle = (options && options.rendererStyle) ? options.rendererStyle : VectorFieldRenderer.STYLE_SINGLE_ARROW;
      this.setVectorRendererStyle(rendererStyle);
      
      this.useMapTime = (options && options.hasOwnProperty("useMapTime")) ? 
                        (!!options.useMapTime) : 
                        true;

      var graphicLayerParams = lang.clone(this._params);
      delete graphicLayerParams.imageServiceParameters;
      delete graphicLayerParams.pixelFilter;
      delete graphicLayerParams.rendererStyle;
      delete graphicLayerParams.symbolTileSize;

      // this creates a new _params. So above we are saving on graphics layer specific params.
      this._initialize(url, options);
      this.geometryType = "esriGeometryPoint";
      this.symbolTileSizeUnits = "Pixels";

      // preserve the graphics layer parameters
      lang.mixin(this._params, graphicLayerParams);
    },

    /*****************
     * Public Methods
     *****************/
    getField: function (fieldName) {
      return this._getField(fieldName, true);
    },

    setVectorRendererStyle: function (style) {
      this.rendererStyle = style;
      this._updateVectorFieldRenderer();
      this.useDefaultRenderer = true;
    },

    setRenderer: function () {
      this.useDefaultRenderer = false;
      this.inherited(arguments);
      //this.onRendererChange();
    },
       
    getFlowRepresentation: function () {
      return this._vectorFlowRepresentation;
    },

    onRendererChange: function () { },

    /*******************
     * Internal Methods
     *******************/

    _refresh: function(redraw) {
      if (has("ie") < 10) {
        this.onError(new Error("Unable to refresh. This layer is not supported in the current browser."));
        return;
      }

      if (this.hasMultidimensions === false) { // Works with multidimensional services only...
        this.onError(new Error("Unable to refresh. This layer does not have multi-dimensional info."));
        return;
      }

      this.setImageFormat("LERC", true); // Force LERC for this type of layer
      // Adjust the extents to snap to a grid for the arrows to be consistent while panning
      
      var originX = this.fullExtent.xmin;
      var originY = this.fullExtent.ymax;

      var extent = lang.clone(this._map.extent);
      var width = this._map.width * (1 / this.symbolTileSize);
      width = width ? Math.ceil(width) : 50;
      var height = this._map.height * (1 / this.symbolTileSize);
      height = height ? Math.ceil(height) : Math.ceil(width * ((extent.ymax - extent.ymin) / (extent.xmax - extent.xmin)));

      var psX = (extent.xmax - extent.xmin) / width;
      var psY = (extent.ymax - extent.ymin) / height;

      extent.xmin = originX + (Math.floor((extent.xmin - originX) / psX) * psX);
      extent.xmax = originX + (Math.ceil((extent.xmax - originX) / psX) * psX);
      extent.ymin = originY + (Math.floor((extent.ymin - originY) / psY) * psY);
      extent.ymax = originY + (Math.ceil((extent.ymax - originY) / psY) * psY);

      this._requestData(extent, width, height);
    },

    _drawPixelData: function()
    {
      this.clear();

      if (!this.pixelData) {
        return;
      }

      var pixelBlock = this.pixelData.pixelBlock;
      var extent = this.pixelData.extent;
      var locations = this.pixelData.locations;
      var isMaskDefined = esriLang.isDefined(pixelBlock.mask) && pixelBlock.mask.length > 0;

      if (!pixelBlock || !extent || !locations) {
        return;
      }
     
      if (this.useDefaultRenderer && this.renderer && (!esriLang.isDefined(this._minMag) || !esriLang.isDefined(this._maxMag))) {
        // if service stats are available then use that, else use the stats derived from the first request.
        var serviceMinMax = this._getServiceMinMaxStats();
        if (serviceMinMax) {
          this._minMag = serviceMinMax.min;
          this._maxMag = serviceMinMax.max;
        }
        else {
          this._minMag = pixelBlock.statistics[0].minValue;
          this._maxMag = pixelBlock.statistics[0].maxValue;
        }

        var sizeInfoVar = {
          type: "sizeInfo",
          minSize: gfx.px2pt(0.2 * this.symbolTileSize), // default value of 20%
          maxSize: gfx.px2pt(0.8 * this.symbolTileSize), // default value of 80%
          minDataValue: this._minMag,
          maxDataValue: this._maxMag
        };

        var visualVariables = [];
        visualVariables.push(sizeInfoVar);
        visualVariables.push({ type: "colorInfo" });
        this.renderer.setVisualVariables(visualVariables);
      }

      var i = 0, j = 0, idx = 0;
      var location, point, graphic;
      var srInfo = extent.spatialReference ? extent.spatialReference._getInfo() : null;
      for (i = 0; i < pixelBlock.height; i++) {
        for (j = 0; j < pixelBlock.width; j++, idx++) {
          location = locations[idx];
          if ((!isMaskDefined || pixelBlock.mask[idx]) && location && location.length === 2) {
            point = new Point(location[0], location[1], extent.spatialReference);
            if (srInfo) {
              point.x = Extent.prototype._normalizeX(point.x, srInfo).x;
            }
            var attributes = {
              Magnitude: pixelBlock.pixels[0][idx],
              Direction: pixelBlock.pixels[1][idx],
              Location: JSON.stringify(point.toJSON())
            };
            graphic = new Graphic(point, null, attributes);
            this.add(graphic);
          }
        }
      }
    },

    _getServiceMinMaxStats: function() {
      if (!esriLang.isDefined(this.minValues) || !esriLang.isDefined(this.maxValues)
      || this.minValues.length < 2 || this.maxValues.length < 2) {
        return null;
      }

      var minMag = this.minValues[0];
      var maxMag = this.maxValues[0];
      var minDir = this.minValues[1];
      var maxDir = this.maxValues[1];

      // convert these values if pixelFilter is attached
      if (this.pixelFilter && minMag && maxMag && minDir && maxDir) {
        var pixels = [];
        pixels.push([minMag, maxMag]);
        pixels.push([minDir, maxDir]);
        var pixelData = this._createPixelData(pixels);
        this.pixelFilter(pixelData);
        if (pixelData && pixelData.pixelBlock && pixelData.pixelBlock.pixels && pixelData.pixelBlock.pixels.length > 0) {
          minMag = pixelData.pixelBlock.pixels[0][0];
          maxMag = pixelData.pixelBlock.pixels[0][1];
        }
      }

      return (minMag && maxMag) ? {min: minMag, max: maxMag} : null;
    },

    _updateVectorFieldRenderer: function () {
      var sizeInfoVar = {
        type: "sizeInfo",
        minSize: gfx.px2pt(0.2 * this.symbolTileSize), // default value of 20%
        maxSize: gfx.px2pt(0.8 * this.symbolTileSize), // default value of 80%
        minDataValue: this._minMag,
        maxDataValue: this._maxMag
      };

      var visualVariables = [];
      visualVariables.push(sizeInfoVar);

      var mRenderer = new VectorFieldRenderer({
        style: this.rendererStyle,
        visualVariables: visualVariables,
        flowRepresentation: this._vectorFlowRepresentation
      });

      this.setRenderer(mRenderer);
    },

    _getField: function(fieldName, ignoreCase) {
      // This function is required to generate legends...
      if (!esriLang.isDefined(fieldName)) {
        return;
      }

      if (ignoreCase) {
        fieldName = fieldName.toLowerCase();
      }

      if (fieldName !== "magnitude" && fieldName !== "direction") {
        return null;
      }

      var field = {
        name: fieldName,
        alias: fieldName,
        domain: null,
        editable: false,
        length: 50,
        type: "esriFieldTypeDouble"
      };
      return field;
    },

    _requestDataErrorHandler: function(error) {
      this.clear();
      this.onError(error);
    },

    _setFlowRepresentation: function (keyProperties) {
      if (keyProperties && this.renderer && esriLang.isDefined(keyProperties["FlowDirection"])) {
        this._vectorFlowRepresentation = (keyProperties["FlowDirection"].toLowerCase() === "oceanographic") ? this.renderer.FLOW_TO : this.renderer.FLOW_FROM;
      }
      if (this.renderer) {
        this.renderer.flowRepresentation = this._vectorFlowRepresentation;
      }
    },
    
     _toggleTime: function() {
      var map = this._map;
      
      // Listen for map timeextent change when all controlling factors are ON
      // Disconnect from map when one of the controlling factors is OFF
      // Note that this method should be called when the state of a  
      // controlling factor changes.
      
      if (this.timeInfo && this.useMapTime && map && !this.suspended) {
        if (!this._timeConnect) {
          this._timeConnect = map.on("time-extent-change", this._onTimeExtentChangeHandler.bind(this));
        }
        
        this._setTime(map.timeExtent);
      }
      else {
        this._timeConnect.remove();
        this._timeConnect = null;
        this._setTime(null);
      }
    },
    
    setUseMapTime: function(/*Boolean*/ use, /*Boolean?*/ doNotRefresh) {
      this.useMapTime = use;
      this._toggleTime();
      
      if (!doNotRefresh && this._map) {
        this._refresh(true);
      }
    },
    
    _setTime: function(timeExtent) {
      if (this._params) {
        this._params.time = timeExtent ? timeExtent.toJSON().join(",") : null;
      }
    },
    
    _onTimeExtentChangeHandler : function(timeExtent){
      if (this.suspended) {
        return;
      }
      
      this._setTime(timeExtent);
      this._refresh(true);            
    },
    
    onResume: function(){
      this.inherited(arguments);
      this._toggleTime();
    },
    
    onSuspend: function(){
      this.inherited(arguments);
      this._toggleTime();
    }

  });

  return ArcGISImageServiceVectorLayer;
});
