define(
[
  "../core/declare",
  "dojo/_base/lang",

  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-style",
  "dojo/dnd/Moveable",

  "dijit/_Widget",
  "dijit/_Templated",

  "../Map",
  "../geometry/Point",
  "../geometry/ScreenPoint",

  "../layers/TiledLayer",

  "../layers/ArcGISTiledLayer",
  "../layers/ArcGISDynamicLayer",
  "../layers/ArcGISImageServiceLayer",

  "../layers/OpenStreetMapLayer",
  "../virtualearth/VETiledLayer",

  "../config",
  "../core/domUtils",

  "dojo/text!./templates/OverviewMap.html",
  "dojo/i18n!../nls/jsapi"
], function(
  declare, lang, domClass, domGeometry, domStyle, Moveable,
  _Widget, _Templated,
  Map, Point, ScreenPoint,
  TiledLayer, ArcGISTiledLayer, ArcGISDynamicLayer, ArcGISImageServiceLayer,
  OpenStreetMapLayer, VETiledLayer,
  esriConfig, domUtils,
  widgetTemplate,
  jsapiBundle
) {
  var OM = declare([ _Widget, _Templated ], {
    declaredClass: "esri.widgets.OverviewMap",

    widgetsInTemplate: true,
    // templatePath: dojo.moduleUrl("esri.widgets", "templates/OverviewMap.html"),
    // templatePath: require.toUrl("./templates/OverviewMap.html"),
    templateString: widgetTemplate,

    /********************
     * Overriden Methods
     ********************/
    
    constructor: function(params, srcNodeRef) {
      // Mixin i18n strings
      lang.mixin(this, jsapiBundle.widgets.overviewMap);
      
      params = params || {};
      if (!params.map) {
        console.error("esri.widgets.OverviewMap: " + this.NLS_noMap);
        return;
      }
      
      var coords = {};
      if (srcNodeRef) { // user has provided a DOM node that should be used as the container for overview map
        this._detached = true;
        coords = domGeometry.position(srcNodeRef, true);
      }

      /**************************
       * Configurable Properties
       **************************/
      
      this.map = params.map; // REQUIRED
      this.baseLayer = params.baseLayer;
      this.width = params.width || coords.w || this.map.width / 4;
      this.height = params.height || coords.h || this.map.height / 4;
      this.attachTo = params.attachTo || "top-right";
      this.expandFactor = params.expandFactor || 2;
      this.color = params.color || "#000000";
      this.opacity = params.opacity || 0.5;
      this.maximizeButton = !!params.maximizeButton;
      this.visible = !!params.visible;
      
      if (this.map.loaded) {
        this._initialSetup();
      }
      else {
        var loadHandle = this.map.on("load", function() {
          loadHandle.remove();
          loadHandle = null;
          this._initialSetup();
        }.bind(this));
      }
      
      // UI customization
      
      if (this._detached) {
        //this._xanchor = this._yanchor = this._border = this._padding = this._expandImg = this._maximizeImg = "";
        this.visible = true;
      }
      /*else {
        var anchor = this.attachTo.split("-");
        this._xanchor = anchor[1] + ": 0px;";
        this._yanchor = anchor[0] + ": 0px;";
        var anti_xanchor = (anchor[1] === "left" ? "right" : "left");
        var anti_yanchor = (anchor[0] === "top" ? "bottom" : "top");
        this._border = "border-" + anti_xanchor + ": 1px solid #000; border-" + anti_yanchor + ": 1px solid #000;";
        this._padding = "padding-" + anti_xanchor + ": 2px; padding-" + anti_yanchor + ": 2px;";
      }*/
      this._maximized = false;
    },
    
    startup: function() {
      this.inherited(arguments);
      
      // Add this dijit to the DOM if it is not added already
      if (!this.domNode.parentNode) {
        this.map.container.appendChild(this.domNode);
      }
      
      if (this._detached) { // we don't want the controller and maximizer
        domStyle.set(this._body, "display", "block");
        domStyle.set(this._controllerDiv, "display", "none");
        domStyle.set(this._maximizerDiv, "display", "none");
        if (this.map.loaded) {
          this._initialize();
        }
        else {
          this.map.on("load", this._initialize.bind(this));
        }
      }
      else {
        // the controller icon (arrow) should always be at the corner
        if (this.attachTo.split("-")[0] === "bottom") {
          this.domNode.insertBefore(this._maximizerDiv, this._controllerDiv);
        }
        
        if (!this.maximizeButton) {
          domClass.add(this._maximizerDiv, "ovwDisabledButton");
        }

        domClass.add(this.domNode, {
          "top-left": "ovwTL",
          "top-right": "ovwTR",
          "bottom-left": "ovwBL",
          "bottom-right": "ovwBR"
        }[this.attachTo]);
        
        domClass.add(this._controllerDiv, "ovwShow");
        domClass.add(this._maximizerDiv, "ovwMaximize");
        
        if (this.visible && this.map.loaded) {
          this.visible = false;
          this.show();          
        }
      }
      
      domStyle.set(this._focusDiv, "opacity", this.opacity);
    },
    
    destroy: function() {
      this._deactivate();
      if (this.overviewMap) {
        this.overviewMap.destroy();
      }
      this.overviewMap = this.baseLayer = null; // this.dynamicVersion = null;
      this.inherited(arguments);
    },
    
    /*****************
     * Public Methods
     *****************/
    
    resize: function(size) {
      //console.log("resize: ", size && size.w, size && size.h);
      if (!size || size.w <=0 || size.h <= 0) {
        return;
      }
      this._resize(size.w, size.h);
    },
    
    show: function() {
      if (!this.visible) {
        var div = this._controllerDiv;
        div.title = this.NLS_hide;
        domClass.remove(div, "ovwShow");
        domClass.add(div, "ovwHide");
        
        domUtils.show(this._body);
        domUtils.show(this._maximizerDiv);
        this._initialize();
        this.visible = true;
      }
    },
    
    hide: function() {
      if (this.visible) {
        var div = this._controllerDiv;
        div.title = this.NLS_show;
        domClass.remove(div, "ovwHide");
        domClass.add(div, "ovwShow");
        
        if (this._maximized) {
          this._maximizeHandler();
        }
        domUtils.hide(this._body);
        domUtils.hide(this._maximizerDiv);
        this._deactivate();
        this.visible = false;
      }
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    /*_calculateLods: function() {
      // find lods additionally required for the overview map
      var i, j, scale, lod, multiplier = (this.map.width / this.width) * this.expandFactor, lods = [];
      var mainMapLods = this._mainMapLayer.tileInfo.lods, mapSvcLods = this.baseLayer.tileInfo.lods;
      
      for (i = mainMapLods.length - 1; i >= 0; i--) {
        scale = mainMapLods[i].scale * multiplier;
        j = mapSvcLods.length - 1;
        while (j >= 0 && mapSvcLods[j].scale < scale) j--;
        if (j < 0 && (mapSvcLods[0].scale + 1 - scale) < 0) {
          lods.push({ resolution: mainMapLods[i].resolution * multiplier, scale: scale });
        }
      }
      lods.sort(function(a, b) {
        if (a.scale > b.scale) return -1;
        if (a.scale < b.scale) return 1;
        return 0;
      });
      //console.log(lods);

      for (i = 0; i < lods.length; i++) {
        lods[i].level = i;
      }
      this._levelCutoff = i;
      for (j = 0; j < mapSvcLods.length; j++) {
        lod = mapSvcLods[j];
        lods.push({ level: lod.level + i, resolution: lod.resolution, scale: lod.scale });
      }
      //console.log(lods);
      this._overviewLods = lods;
    },*/
    
    _initialSetup: function() {
      // Initial setup      
      this._mainMapLayer = this.map.getLayer(this.map.layerIds[0]);
      if (!this._mainMapLayer) {
        console.error("esri.widgets.OverviewMap: " + this.NLS_noLayer);
        return;
      }
      //var mainMapLayerType = this._mainMapLayer.declaredClass;
      
      var layer = this.baseLayer || this._mainMapLayer; //, layerType = layer.declaredClass;
      var mapSR = this.map.spatialReference, lyrSR = layer.spatialReference;
      if ((lyrSR.wkid !== mapSR.wkid) && (lyrSR.wkt !== mapSR.wkt)) {
        console.error("esri.widgets.OverviewMap: " + this.NLS_invalidSR);
        return;
      }
      
      var layerType = layer.declaredClass;
      if (layer instanceof TiledLayer) { // overview map will be tiled (with an exception)
        //if (this._mainMapLayer instanceof esri.layers.TiledLayer) { // main map is tiled at its base
          /*if (params.baseLayer) { // user defined overview map base layer
            this.baseLayer = params.baseLayer;
          }*/
          //else { // get the layer from main map
            if (layerType.indexOf("VETiledLayer") !== -1) {
              this.baseLayer = new VETiledLayer({ resourceInfo: layer.getResourceInfo(), culture: layer.culture, mapStyle: layer.mapStyle, bingMapsKey: layer.bingMapsKey });
            }
            else if (layerType.indexOf("OpenStreetMapLayer") !== -1) {
              this.baseLayer = new OpenStreetMapLayer({ tileServers: layer.tileServers });
            }
            else if (layerType.indexOf("WebTiledLayer") !== -1) {
              var initialExt = layer.initialExtent,
                  fullExt = layer.fullExtent,
                  tileInfo = layer.tileInfo;
              
              this.baseLayer = new layer.constructor(layer.urlTemplate, {
                initialExtent: initialExt && new initialExt.constructor(initialExt.toJSON()),
                fullExtent:    fullExt && new fullExt.constructor(fullExt.toJSON()),
                tileInfo:      tileInfo && new tileInfo.constructor(tileInfo.toJSON()),
                tileServers:   layer.tileServers && layer.tileServers.slice(0)
              });
            }
            else {
              this.baseLayer = new ArcGISTiledLayer(layer.url, { resourceInfo: layer.getResourceInfo() });
            }
          //}
        /*}
        else { // main map is dynamic at its base
          console.error("esri.widgets.OverviewMap: overview map with a tiled-layer is not supported for a map with a dynamic layer as its base layer");
          return;
        }*/
      }
      else if (layer instanceof ArcGISDynamicLayer) { // overview map will be dynamic
        /*if (params.baseLayer) {
          this.baseLayer = params.baseLayer;
        }*/
        //else {
          if (layerType.indexOf("ArcGISImageServiceLayer") !== -1) {
            this.baseLayer = new ArcGISImageServiceLayer(layer.url);
          }
          else {
            this.baseLayer = new ArcGISDynamicLayer(layer.url);
            this.baseLayer.setImageFormat("png24");
          }
        //}
      }
      else {
        console.error("esri.widgets.OverviewMap: " + this.NLS_invalidType);
        return;
      }
      
      /*switch (layerType) {
        case "esri.layers.ArcGISTiledMapServiceLayer": // overview map will be tiled (with an exception)
          if (mainMapLayerType === "esri.layers.ArcGISTiledMapServiceLayer") { // main map is tiled at its base
            this.baseLayer = params.baseLayer || new esri.layers.ArcGISTiledMapServiceLayer(layer.url);
            if (this.baseLayer.loaded) {
              this._calculateLods();
            }
            else {
              dojo.connect(this.baseLayer, "onLoad", this, this._calculateLods);
            }
            this.dynamicVersion = new esri.layers.ArcGISDynamicMapServiceLayer(layer.url);
            this.dynamicVersion.hide();
            this.dynamicVersion.setImageFormat("png24");
          }
          else { // main map is dynamic at its base
            console.error("esri.widgets.OverviewMap: overview map with a tiled-layer is not supported for a map with a dynamic layer as its base layer");
            return;
          }
          break;
        case "esri.layers.ArcGISDynamicMapServiceLayer": // overview map will be dynamic
          if (params.baseLayer) {
            this.baseLayer = params.baseLayer;
          }
          else {
            this.baseLayer = new esri.layers.ArcGISDynamicMapServiceLayer(layer.url);
            this.baseLayer.setImageFormat("png24");
          }
          break;
        default:
          console.error("esri.widgets.OverviewMap: unsupported layer type. valid types are 'ArcGISTiledMapServiceLayer' and 'ArcGISDynamicMapServiceLayer'");
          return;
      }*/
      if (!this._detached && this.visible && this._controllerDiv) {
          var showFunc = function() {
            this.visible = false;
            this.show();
          };
          
          if (this.baseLayer.loaded) {
            showFunc.call(this);
          }
          else {
            this.baseLayer.on("load", showFunc.bind(this));
          }
      }
    },
    
    _visibilityHandler: function() {
      if (this.visible) { // hide
        this.hide();
      }
      else { // show
        this.show();
      }
    },
    
    _maximizeHandler: function() {
      var div = this._maximizerDiv;
      if (this._maximized) { // minimize
        div.title = this.NLS_maximize;
        domClass.remove(div, "ovwRestore");
        domClass.add(div, "ovwMaximize");
        this._resize(this.width, this.height);
      }
      else { // maximize
        div.title = this.NLS_restore;
        domClass.remove(div, "ovwMaximize");
        domClass.add(div, "ovwRestore");
        this._resize(this.map.width, this.map.height);
      }
      this._maximized = ! this._maximized;
    },
    
    _resize: function(width, height) {
      // TODO
      // esriConfig.map has been removed. Fix code below.
      domStyle.set(this._body, { width: width + "px", height: height + "px" });
      var savedPanDuration = esriConfig.defaults.map.panDuration, ovMap = this.overviewMap; //, temp = false, dv = this.dynamicVersion;
      esriConfig.defaults.map.panDuration = 0;
      /*if (dv && dv.visible) {
        temp = true;
        dv.hide();
      }*/
      // if map has been initialized
      if(ovMap){
        ovMap.resize(true);
        ovMap.centerAt(this._focusExtent.getCenter());
      }
      /*if (temp) {
        dv.show();
      }*/
      esriConfig.defaults.map.panDuration = savedPanDuration;
    },
    
    _initialize: function() {
      if (!this.overviewMap) {
        var ovMap;
        ovMap = (this.overviewMap = new Map(this.id + "-map", { 
          slider: false, 
          showAttribution: false,
          logo: false,
          lods: this._overviewLods,
          wrapAround180: this.map.wrapAround180
        }));
        ovMap.on("load", function() {
          this._map_resize_override = lang.hitch(ovMap, this._map_resize_override);
          ovMap.disableMapNavigation();
          this._activate();
        }.bind(this));
        /*if (this.dynamicVersion) {
          ovMap.addLayer(this.dynamicVersion);
        }*/
        ovMap.addLayer(this.baseLayer);
      }
      else {
        this._activate();
      }
    },
    
    _activate: function() {
      var map = this.map, ovMap = this.overviewMap;
      this._moveableHandle = new Moveable(this._focusDiv);
      this._soeConnect = map.on("extent-change", this._syncOverviewMap.bind(this));
      this._ufoConnect = map.on("pan", this._updateFocus.bind(this));
      this._oecConnect = ovMap.on("extent-change", this._ovwExtentChangeHandler.bind(this));
      this._opaConnect = ovMap.on("pan", this._ovwPanHandler.bind(this));
      this._ozsConnect = ovMap.on("zoom-start", function() { domUtils.hide(this._focusDiv); }.bind(this));
      this._ozeConnect = ovMap.on("zoom-end", function() { domUtils.show(this._focusDiv); }.bind(this));
      this._omsConnect = this._moveableHandle.on("MoveStop", this._moveStopHandler.bind(this));
      this._syncOverviewMap(map.extent, null, null, null);
    },
    
    _deactivate: function() {
      this._soeConnect.remove();
      this._ufoConnect.remove();
      this._oecConnect.remove();
      this._opaConnect.remove();
      this._ozsConnect.remove();
      this._ozeConnect.remove();
      this._omsConnect.remove();
      if (this._moveableHandle) {
        this._moveableHandle.destroy();
      } 
    },
    
    _syncOverviewMap: function(ext, delta, levelChange, lod) {
      if (this._suspendPanHandling) {
        this._suspendPanHandling = false;
        return;
      }
      //this._updateFocus(ext);
      this._focusExtent = ext;
      
      /*if (this.dynamicVersion && (levelChange || firstTime)) {
        this._switchLayers = (this.map.getLevel() < this._levelCutoff) ? "D" : "T";
      }*/
      this.overviewMap.setExtent(ext.expand(this.expandFactor), true);
    },
    
    _updateFocus: function(ext) {
      if (this._suspendPanHandling) {
        return;
      } 
      this._focusExtent = ext;
      this._drawFocusDiv(ext);
    },
    
    _drawFocusDiv: function(ext, delta) {
      var ovMap = this.overviewMap;
      var tl = ovMap.toScreen(new Point(ext.xmin, ext.ymax, ovMap.spatialReference));
      var br = ovMap.toScreen(new Point(ext.xmax, ext.ymin, ovMap.spatialReference));
      //console.log(ovMap.width + ", " + ovMap.height + ", " + (br.x - tl.x) + " px, " + (br.y - tl.y) + " px");
      
      var width = br.x - tl.x, height = br.y - tl.y, enable = true;
      if ((width > this.overviewMap.width) && (height > this.overviewMap.height)) {
        enable = false;
      }
      
      domStyle.set(this._focusDiv, {
        left: tl.x + (delta ? delta.x : 0) + "px",
        top: tl.y + (delta ? delta.y : 0) + "px",
        width: width + "px",
        height: height + "px",
        display: enable ? "block" : "none"
      });
    },
    
    _moveStopHandler: function(evt) {
      var style = this._moveableHandle.node.style;
      var ext = this._focusExtent;
      var ovMap = this.overviewMap;

      var leftTop = ovMap.toMap(new ScreenPoint(parseInt(style.left, 10), parseInt(style.top, 10)));
      var prev = new Point(ext.xmin, ext.ymax, ovMap.spatialReference);
      
      this._focusExtent = ext.offset(leftTop.x - prev.x, leftTop.y - prev.y);
      if (this._maximized) {
        this._maximizeHandler();
      }
      else {
        ovMap.centerAt(this._focusExtent.getCenter());
      }

      this._suspendPanHandling = true;
      this.map.setExtent(this._focusExtent);
    },
    
    _ovwExtentChangeHandler: function() {
      /*if (this._switchLayers) {
        if (this._switchLayers === "D") { // switch to dynamic version of the cached map service layer
          //console.log("-dynamic-");
          this.dynamicVersion.show();
          this.baseLayer.hide();
        }
        else {
          //console.log("-CacheD-");
          this.baseLayer.show();
          this.dynamicVersion.hide();
        }
        this._switchLayers = null;
      }*/
      this._drawFocusDiv(this._focusExtent);
    },
    
    _ovwPanHandler: function(ext ,delta) {
      this._drawFocusDiv(this._focusExtent, delta);
    }
  });

  

  return OM;
});
