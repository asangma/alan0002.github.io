define(
[
  "../core/declare",
  "dojo/_base/array",
  "dojo/sniff",

  "dojo/dom-construct",
  "dojo/dom-style",

  "../core/lang",
  "../core/domUtils",

  "./Layer",
  "./mixins/ImageServiceLayerMixin"
],
function (
  declare, arrayUtils, has,
  domConstruct, domStyle,
  esriLang, domUtils, 
  Layer, ImageServiceLayerMixin
) {

  var RasterLayer = declare([Layer, ImageServiceLayerMixin], {
    declaredClass: "esri.layers.RasterLayer",
    
    constructor: function (url, options) {
      this.drawMode = (options && options.drawMode !== undefined) ? options.drawMode : true;
      this.drawType = (options && options.drawType) ? options.drawType : "2d";
      this._initialize(url, options);
    },

    opacity: 1,
    
    /*****************
     * Public Methods
     *****************/

    setDrawMode: function (/*Boolean*/ value) {
      this.drawMode = value;
    },

    setOpacity: function(o) {
      if (this.opacity != o) {
        this.onOpacityChange(this.opacity = o);
      }
    },

    onOpacityChange: function () { },

    refresh: function() {
      if (!this._canDraw() || has("ie") < 10) {
        this.onError(new Error("Unable to refresh. This layer is not supported in the current browser."));
        return;
      }

      if (this._map) {
        this._extentChangeHandler(this._map.extent);
      }
    },
   
    clear: function() {
      if (!this._canDraw()) {
        return;
      }

      if (this.drawType === "2d") {
        this._context.clearRect(0, 0, this._mapWidth, this._mapHeight);
      }
    },

    getContext: function() {
      return this._context;
    },
       
    /*******************
     * Internal Methods
     *******************/

    _setMap: function (map, container) {
      this.inherited(arguments);

      var element = this._element = domConstruct.create("canvas", {
        id: "canvas",
        width: map.width + "px",
        height: map.height + "px",
        style: "position: absolute; left: 0px; top: 0px;"
      }, container);

      if (esriLang.isDefined(this.opacity)) {
        domStyle.set(element, "opacity", this.opacity);
      }

      this._context = element.getContext(this.drawType);
      if (!this._context) {
        console.error("Unable to create the context. This browser might not support <canvas> elements.");
      }

      this._mapWidth = map.width;
      this._mapHeight = map.height;

      // Event connections
      this._connects = [];
      this._connects.push(map.on("pan", this._panHandler.bind(this)));
      this._connects.push(map.on("zoom", this._onZoomHandler.bind(this)));
      this._connects.push(map.on("resize", this._onResizeHandler.bind(this)));
      this._connects.push(map.on("extent-change", this._extentChangeHandler.bind(this)));
      this._connects.push(this.on("visibility-change", this._visibilityChangeHandler.bind(this)));
      this._connects.push(this.on("opacity-change", this._opacityChangeHandler.bind(this)));
      this._connects.push(this.on("elevation-change", this._elevationChangeHandler.bind(this)));

      this._startRect = { left: 0, top: 0, width: map.width, height: map.height, zoom: 1 };

      // Initial rendering
      this.refresh();

      return element;
    },

    _unsetMap: function (map, container) {
      arrayUtils.forEach(this._connects, function(handle) {
        handle.remove();
      });
      if (this._element) {
        container.removeChild(this._element);
      }
      this._map = this._element = this._context = this.data = this._connects = null;

      this.inherited(arguments);
    },

    _canDraw: function() {
      return (this._map && this._element && this._context) ? true : false; 
    },
    
    _panHandler: function(extent, delta) {
      domStyle.set(this._element, { left: delta.x + "px", top: delta.y + "px" });
    },

    _onZoomHandler: function (extent, scale, anchor) {
      var start = this._startRect;
      targetWidth = start.width * scale;
      targetHeight = start.height * scale;

      domStyle.set(this._element, {
        left: (start.left - ((targetWidth - start.width) * (anchor.x - start.left) / start.width)) + "px",
        top: (start.top - ((targetHeight - start.height) * (anchor.y - start.top) / start.height)) + "px",
        width: targetWidth + "px",
        height: targetHeight + "px"
      });
    },

    _onResizeHandler: function (extent, width, height) {
      domStyle.set(this._element, { width: width + "px", height: height + "px" });
      this._startRect.width = this._element.width = width;
      this._startRect.height = this._element.height = height;
    },
       
    _extentChangeHandler: function (extent, delta, levelChange, lod) {
      this._fireUpdateStart();       
      this.setImageFormat("LERC", true); // Force LERC for this type of layer for now

      var map = this._map;
      this._requestData(map.extent, map.width, map.height);
    },

    _requestDataErrorHandler: function (error) {
      this.clear();
      this.onError(error);
    },

    _drawPixelData: function () {

      domStyle.set(this._element, { left: "0px", top: "0px", width: this._map.width + "px", height: this._map.height + "px" });

      // Dont display if the browser is not supported or if the user has set the drawMode to false
      if (!this._canDraw || !this.drawMode) {
        return;
      }

      
      if (!this.drawMode) {
        return;
      }

      if (!this.pixelData || !this.pixelData.pixelBlock) {
        this.clear();
        return;
      }

      var pixelBlock = this.pixelData.pixelBlock;
      var ctx = this._context;
      var imageData = ctx.createImageData(pixelBlock.width, pixelBlock.height);
      imageData.data.set(pixelBlock.getAsRGBA());
      ctx.putImageData(imageData, 0, 0);
      this._fireUpdateEnd();
    },
   
    /****************
     * Event Handlers
     ****************/

    _visibilityChangeHandler: function (visible) {
      if (visible) {
        domUtils.show(this._element);
      }
      else {
        domUtils.hide(this._element);
      }
    },

    _opacityChangeHandler: function(value) {
      domStyle.set(this._element, "opacity", value);
    }
  });

  return RasterLayer;
});
