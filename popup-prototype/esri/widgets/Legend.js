define(
[
  "dojo/_base/kernel",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",

  "dojo/has",
  "dojo/number",
  "dojo/on",

  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-style",

  "dijit/_Widget",

  "dojox/gfx",
  "dojox/gfx/matrix",
  "dojox/html/entities",

  "../request",
  "../core/declare",
  "../core/lang",
  "../core/promiseList",
  "../core/screenUtils",

  "../renderers/SimpleRenderer",
  "../renderers/UniqueValueRenderer",
  "../renderers/ClassBreaksRenderer",
  "../renderers/ScaleDependentRenderer",

  "../renderers/DotDensityRenderer",
  "../renderers/TemporalRenderer",
  "../renderers/VectorFieldRenderer",
  "../renderers/HeatmapRenderer",

  "../symbols/PictureFillSymbol",
  "../symbols/support/jsonUtils",
  "../symbols/support/gfxUtils",

  "./Widget",

  "dojo/i18n!../nls/jsapi",
  "dojo/i18n!dojo/cldr/nls/number"
],
function(
  dojoNS, lang, array, Color,
  has, dojoNumber, on,
  dom, domConstruct, domStyle,
  _Widget,
  gfx , gfxMatrix, htmlEntities,
  esriRequest, declare, esriLang, promiseList, screenUtils,
  SimpleRenderer, UniqueValueRenderer, ClassBreaksRenderer, ScaleDependentRenderer,
  DotDensityRenderer, TemporalRenderer, VectorFieldRenderer, HeatmapRenderer,
  PictureFillSymbol, symbolUtils, gfxUtils,
  Widget,
  jsapiBundle, numberBundle
) {

  var Legend = declare([Widget, _Widget], {
    declaredClass: "esri.widgets.Legend",

    /********************
    * constants
    ********************/
    widgetsInTemplate: false,
    
    layers: null,
    alignRight: false,
    hoverLabelShowing: false,
    dotDensitySwatchSize: 26, // width and height of the swatches (in pixels)
    dotCoverage: 75, // percentage of the swatch area covered with dots
    gradientHeight: 30, // pixels
    
    // esriLegendColorRamp.width (= 24)
    // + esriLegendColorRamp.border-width * 2 (= 2)
    // + esriLegendColorRampTick.width * 2 (= 8)
    // Ref: Legend.css
    gradientWidth: 34, // pixels 
    
    colorRampBorder: "1px solid",
    
    // This regex matches "dot or comma + trailing zeros" in formatted numbers of this pattern:
    // 234,234.0000000 (lang=en)
    // 234.234,0000000 (lang=de)
    reZeros: new RegExp("\\" + numberBundle.decimal + "0+$", "g"),
    
    // This regex matches "last digit + trailing zeros" in formatted numbers of this pattern:
    // 234,234.23423400000 (lang=en)
    // 234.234,23423400000 (lang=de)
    reZerosFractional: new RegExp("(\\d)0*$", "g"),
      
    _specialChars: {
      // less-than
      lt: "\u003C",
      
      // greater-than
      gt: "\u003E"
    },
    
    _ieTimer: 100, // milliseconds
    _isRightToLeft: false,
    _align: null,
    _legendAlign: null,
    _viewWatch: null,
    
    /********************
     * Overriden Methods
     ********************/
    constructor: function(params, srcNodeRef){
      // Mixin i18n strings
      lang.mixin(this, jsapiBundle.widgets.legend);
      this._updateAllMapLayers = lang.hitch(this, this._updateAllMapLayers);
      this._refreshLayers = lang.hitch(this, this._refreshLayers);
      params = params || {};
      params.map = params.view.map;
      if (!params.map) {
        console.error("esri.widgets.Legend: unable to find the 'map' property in parameters");
        return;
      }
      
      if (!srcNodeRef) { // user has provided a DOM node that should be used as the container for legend
        console.error("esri.widgets.Legend: must specify a container for the legend");
        return;
      }

      this.basePath = require.toUrl("esri/widgets/");
      
      /**************************
       * Configurable Properties
       **************************/
      this.map = params.map; // REQUIRED
      this.layerInfos = params.layerInfos;
      this._respectCurrentMapScale = (params.respectCurrentMapScale === false) ? false : true;
      this.arrangement = (params.arrangement === Legend.ALIGN_RIGHT) ? Legend.ALIGN_RIGHT : Legend.ALIGN_LEFT;
      if (this.arrangement === Legend.ALIGN_RIGHT) {
        this.alignRight = true;
      }
      this.autoUpdate = (params.autoUpdate === false) ? false : true;
      
      this._surfaceItems = [];
      this._handles = [];
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);


      var rtlLocales = ["ar", "he"], i, rLocale;
      for(i = 0; i<rtlLocales.length; i=i+1) {
        rLocale = rtlLocales[i];
        if (dojoNS.locale && dojoNS.locale.indexOf(rLocale) !== -1) {
          if(dojoNS.locale.indexOf("-")!== -1) {
            if(dojoNS.locale.indexOf(rLocale + "-") !== -1) {
              this._isRightToLeft = true; 
            }
          }
          else {
            this._isRightToLeft = true; 
          }
        }
      }
      
      if (this._isRightToLeft) {
        this._align = (this.alignRight ? "left" : "right");
        this._legendAlign = (this.alignRight ? "esri-legend-left" : "esri-legend-right");
      } else {
        this._align = (this.alignRight ? "right" : "left");
        this._legendAlign = (this.alignRight ? "esri-legend-right" : "esri-legend-left");
      }
    },
  
    startup: function(){
      this.inherited(arguments);
      this.layers = null;
      if (!this.view){
        if (!this._viewWatch) {
          this._viewWatch = this.map.watch("view", function () {
            this._viewWatch.remove();
            this._initialize();
            if (has("ie") < 9) {
              this._repaintItems = lang.hitch(this, this._repaintItems);
              setTimeout(this._repaintItems, this._ieTimer);
            }
          }.bind(this));
        }
      }else {
        this._initialize();
        if (has("ie") < 9) {
          this._repaintItems = lang.hitch(this, this._repaintItems);
          setTimeout(this._repaintItems, this._ieTimer);
        }
      }
    },
    
    destroy: function(){
      this._deactivate();
      this._removeHoverHandlers();
      this.inherited(arguments);
    },
    
    /*****************
     * Public Methods
     *****************/
    /* 
     Refresh the legend with a new list of layers.
     Layers is optional, if set it replaces the layers set in the constructor.
     */
    refresh: function(layerInfos){
      var i;
    
      // a refresh is going on alredy
      if (!this.domNode) {
        return;
      }

      // if layerInfos is an empty list treat it as valid layerInfos object
      if (layerInfos) {
        this.layerInfos = layerInfos;
        this.layers = [];
        // save title of each layer in layer object
        array.forEach(this.layerInfos, function(layerInfo){
          if ((this._isSupportedLayerType(layerInfo.layer))&&(layerInfo.layer.showLegend)) {
            if (layerInfo.title) {
              layerInfo.layer._titleForLegend = layerInfo.title;
            }
            layerInfo.layer._hideDefaultSymbol = (layerInfo.defaultSymbol === false) ? true : false;
            if (layerInfo.hideLayers) {
              layerInfo.layer._hideLayersInLegend = layerInfo.hideLayers;
              this._addSubLayersToHide(layerInfo);
            } else {
              layerInfo.layer._hideLayersInLegend = [];
            }
            if (layerInfo.hoverLabel) {
              layerInfo.layer._hoverLabel = layerInfo.hoverLabel;
            }
            if (layerInfo.hoverLabels) {
              layerInfo.layer._hoverLabels = layerInfo.hoverLabels;
            }
            this.layers.push(layerInfo.layer);
          }
        }, this);
      } else if (this.useAllMapLayers) {
        // build a new list
        this.layerInfos = null;
        this.layers = null;
      }

      // destroy all children
      for (i = this.domNode.children.length - 1; i >= 0; i--) {
        domConstruct.destroy(this.domNode.children[i]);
      }
      this._removeHoverHandlers();
      
      this.startup();
    },
    
    /*******************
     * Internal Methods
     *******************/
    _legendUrl: "http://utility.arcgis.com/sharing/tools/legend",
    
    _initialize: function(){
      // if layerInfos is an empty list treat it as valid layerInfos object
      // save title of each layer in layer object
      if (this.layerInfos) {
        this.layers = [];
        array.forEach(this.layerInfos, function(layerInfo){
          if ((this._isSupportedLayerType(layerInfo.layer))&&(layerInfo.layer.showLegend)) {
            if (layerInfo.title) {
              layerInfo.layer._titleForLegend = layerInfo.title;
            }
            layerInfo.layer._hideDefaultSymbol = (layerInfo.defaultSymbol === false) ? true : false;
            if (layerInfo.hideLayers) {
              layerInfo.layer._hideLayersInLegend = layerInfo.hideLayers;
              this._addSubLayersToHide(layerInfo);
            } else {
              layerInfo.layer._hideLayersInLegend = [];
            }
            if (layerInfo.hoverLabel) {
              layerInfo.layer._hoverLabel = layerInfo.hoverLabel;
            }
            if (layerInfo.hoverLabels) {
              layerInfo.layer._hoverLabels = layerInfo.hoverLabels;
            }
            this.layers.push(layerInfo.layer);
          }
        }, this);
      }

      this.useAllMapLayers = false;
      if (!this.layers) {
        this.useAllMapLayers = true;
        this.layers = [];
        //var kmlLayerIds = [];
        //var geoRSSLayerIds = [];

        for (var i = 0; i < this.map.layers.get("length"); i++) {
          var layer = this.map.layers.getItemAt(i);
          if (!layer.showLegend){
            continue;
          }
          if (!layer.layers){
            this._initializeLayer(layer);
          }else{
            for (var j = 0; j < layer.layers.get("length"); j++){
              var sublayer = layer.layers.getItemAt(j);
              if (!sublayer.showLegend){
                continue;
              }
              this._initializeLayer(sublayer);
            }
          }
        }
        //array.forEach(this.map.graphicsLayerIds, function(layerId){
        //  var layer = this.map.getLayer(layerId);
        //  // don't list each KML sub layer separately
        //  if (array.indexOf(kmlLayerIds, layerId) == -1 && array.indexOf(geoRSSLayerIds, layerId) == -1) {
        //    // check drawMode so we don't include layers created for pop-ups
        //    if (this._isSupportedLayerType(layer) && layer._params && layer._params.drawMode) {
        //      if (layer.arcgisProps && layer.arcgisProps.title) {
        //        layer._titleForLegend = layer.arcgisProps.title;
        //      }
        //      this.layers.push(layer);
        //    }
        //  }
        //}, this);
      }
      
      this._createLegend();
    },

    _initializeLayer: function(layer){
      if (this._isSupportedLayerType(layer)) {
        if (layer.title) {
          layer._titleForLegend = layer.title;
        }
        this.layers.push(layer);
      }

      //if (layer.declaredClass == "esri.layers.KMLLayer") {
      //  subLayers = layer.getLayers();
      //  array.forEach(subLayers, function(iLayer){
      //    kmlLayerIds.push(iLayer.id);
      //  }, this);
      //}
      //if (layer.declaredClass == "esri.layers.GeoRSSLayer") {
      //  subLayers = layer.getFeatureLayers();
      //  array.forEach(subLayers, function(iLayer){
      //    geoRSSLayerIds.push(iLayer.id);
      //  }, this);
      //}
    },
    
    _activate: function(){
      
      if (!this.autoUpdate) {
        return;
      }
      
      if (this._respectCurrentMapScale) {
        this._ozeConnect = this.map.on("zoom-end", this._refreshLayers.bind(this));
      }

      if (this.useAllMapLayers) {
        this._handles.push(this.view.layerViewsFlat.on("change", this._updateAllMapLayers));
        this._handles.push(this.map.on("layer-add", this._updateAllMapLayers));
        this._handles.push(this.map.on("layer-remove", this._updateAllMapLayers));
        this._handles.push(this.map.on("layer-reorder", this._updateAllMapLayers));
        // TODO: this is still in development
        //this._handles.push(on(this.view, "extent-change", lang.hitch(this, function(){this._refreshLayers();})));
        for (var i = 0; i < this.map.layers.get("length"); i++) {
          var layer = this.map.layers.getItemAt(i);
          if (layer.layers){

            this._handles.push(on(layer, "layer-add", this._updateAllMapLayers));
            this._handles.push(on(layer, "layer-remove", this._updateAllMapLayers));
            this._handles.push(on(layer, "layer-reorder", this._updateAllMapLayers));
            for (var j = 0; j < layer.layers.get("length"); j++){
              var sublayer = layer.layers.getItemAt(j);
              sublayer.watch("scaleRange", this._refreshLayers);
              this._handles.push(sublayer.watch("renderer", this._refreshLayers));
              this._handles.push(sublayer.watch("title", this._refreshLayers));
              this._handles.push(sublayer.watch("showLegend", this._refreshLayers));
              this._handles.push(sublayer.watch("opacity", this._refreshLayers));
            }
          }
          //else{
            // TODO: include this when supported
            //if (layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" && layer.supportsDynamicLayers) {
            //  layer.odcConnect = connect.connect(layer, "_onDynamicLayersChange", lang.hitch(this, "_updateDynamicLayers", layer));
            //}
            //if (layer.declaredClass === "esri.layers.ArcGISImageServiceLayer") {
            //  layer.oirConnect = connect.connect(layer, "onRenderingChange", lang.partial(this._updateImageServiceLayers, this, layer));
            //}
          //}
          this._handles.push(layer.watch("renderer", this._refreshLayers));
          this._handles.push(layer.watch("title", this._refreshLayers));
          this._handles.push(layer.watch("showLegend", this._refreshLayers));
          this._handles.push(layer.watch("scaleRange", this._refreshLayers));
          this._handles.push(layer.watch("opacity", this._refreshLayers));
        }
      }
      
      array.forEach(this.layers, function(layer){
        //this._handles.push(on(layer, "visible-change", lang.hitch(this, function(){this._refreshLayers();})));
        //this._handles.push(on(layer, "scale-range-change", lang.hitch(this, "_refreshLayers")));
        //if (layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" && layer.supportsDynamicLayers) {
        //  layer.odcConnect = connect.connect(layer, "_onDynamicLayersChange", lang.hitch(this, "_updateDynamicLayers", layer));
        //}
        //if (layer.declaredClass === "esri.layers.ArcGISImageServiceLayer") {
        //  layer.oirConnect = connect.connect(layer, "onRenderingChange", lang.partial(this._updateImageServiceLayers, this, layer));
        //}
	//if (layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer") {
        //  layer.oivrConnect = connect.connect(layer, "onRendererChange", lang.hitch(this, "_refreshLayers"));
        //}
      }, this); 
    },
    
    _deactivate: function(){
      this._handles.forEach(function(handle) {
        handle.remove();
      });
      this._handles.length = 0;

      if (this._ozeConnect) {
        this._ozeConnect.remove();
      }

      array.forEach(this.layers, function(layer){
        if (layer.ovcConnect) {
          layer.ovcConnect.remove();
        }
        if (layer.oscConnect) {
          layer.oscConnect.remove();
        }
        if (layer.odcConnect) {
          layer.odcConnect.remove();
        }
        if (layer.oirConnect) {
          layer.oirConnect.remove();
        }
      }, this);

    },
    
    _updateDynamicLayers: function(layer){
      delete layer.legendResponse;
      this._refreshLayers();
    },

    _updateImageServiceLayers: function(self, layer){
      delete layer.legendResponse;
      self._refreshLayers();
    },
    
    _refreshLayers: function(){
      this.refresh();
    },

    _isLayerVisible: function(layer){
      var layerView =  this.view.getLayerView(layer);
      return !layerView.get("suspended");
    },
    
    _updateAllMapLayers: function(){

      this.layers = [];
      //TODO: use foreach once available
      for (var i = 0; i < this.map.layers.get("length"); i++) {
        var layer = this.map.layers.getItemAt(i);
        if (!layer.layers){
          this._initializeLayer(layer);
        }else{
          for (var j = 0; j < layer.layers.get("length"); j++){
            var sublayer = layer.layers.getItemAt(j);
            this._initializeLayer(sublayer);
          }
        }
      }
      //array.forEach(this.map.graphicsLayerIds, function(layerId){
      //  var layer = this.map.getLayer(layerId);
      //  // check drawMode so we don't include layers created for pop-ups
      //  if (this._isSupportedLayerType(layer) && layer._params && layer._params.drawMode) {
      //    this.layers.push(layer);
      //  }
      //}, this);
      this.refresh();
    },
    
    _createLegend: function(){
      this._deactivate();
      var hasWMSLayerLegend = false;
      // make sure the symbols scroll with the labels in IE
      domStyle.set(this.domNode, "position", "relative");

      domConstruct.create("div", {
        id: this.id + "_msg",
        className: "esri-legend-msg",
        innerHTML: this.layers.length === 0 ? "" : this.NLS_creatingLegend + "..."
      }, this.domNode);
      var legendLayers = [];
      array.forEach(this.layers, function(layer){
        if (layer.declaredClass == "esri.layers.KMLLayer" || layer.declaredClass == "esri.layers.GeoRSSLayer") {
          var subLayers;
          if (this.view.getLayerView(layer)) {
            this._addLayerViewSuspendWatch(layer);
            if (layer.declaredClass == "esri.layers.KMLLayer") {
              subLayers = layer.getLayers();
            } else if (layer.declaredClass == "esri.layers.GeoRSSLayer") {
              subLayers = layer.getFeatureLayers();
              if (layer._hideLayersInLegend) {
                subLayers = array.filter(subLayers, function(subLayer) {
                  return (array.indexOf(layer._hideLayersInLegend,subLayer.id) == -1);
                });
              }
            }
            array.forEach(subLayers, function(iLayer){
              if (iLayer.declaredClass == "esri.layers.FeatureLayer" && layer._titleForLegend) {
                iLayer._titleForLegend = layer._titleForLegend + " - ";
                if (iLayer.geometryType == "esriGeometryPoint") {
                  iLayer._titleForLegend += this.NLS_points;
                } else if (iLayer.geometryType == "esriGeometryPolyline") {
                  iLayer._titleForLegend += this.NLS_lines;
                } else if (iLayer.geometryType == "esriGeometryPolygon") {
                  iLayer._titleForLegend += this.NLS_polygons;
                }
                legendLayers.push(iLayer);
              }
            }, this);
          }
        } else if (layer.declaredClass === "esri.layers.WMSLayer") {
          if (this.view.getLayerView(layer)) {
            this._addLayerViewSuspendWatch(layer);
            if (this._isLayerVisible(layer) && layer.layerInfos.length > 0 && array.some(layer.layerInfos, function(layerInfo){return layerInfo.legendURL;})) {
              var hasTitle = false;
              array.forEach(layer.layerInfos, function(layerInfo){
                if (layerInfo.legendURL && array.indexOf(layer.visibleLayers, layerInfo.name) > -1) {
                  if (!hasTitle) {
                    var layerTitle = layer._titleForLegend || layer.name || layer.id;
                    domConstruct.create("div", {
                      innerHTML: "<span class='esri-legend-service-label'>" + layerTitle + "</span>"
                    }, this.domNode);
                    hasTitle = true;
                  }
                  domConstruct.create("div", {
                    innerHTML: "<img src='" + layerInfo.legendURL + "'/>"
                  }, this.domNode);
                  hasWMSLayerLegend = true;
                }
              }, this);
            }
          }
        } else {
          legendLayers.push(layer);
        }
      }, this);
      
      var deferreds = [];
      var oneOrMoreLegendsShown = false;
      array.forEach(legendLayers, function(layer){
        if (this.view.getLayerView(layer)) {
          this._addLayerViewSuspendWatch(layer);
          if (this._isLayerVisible(layer) === true && (layer.layerInfos || layer.renderer || layer.declaredClass == "esri.layers.ArcGISImageServiceLayer")) {

            // we create these divs here in order to keep the order of the layers in the legend
            // if one of these layers does not return a legend the div will stay hidden
            var d = domConstruct.create("div", {
              id: this.id + "_" + layer.id,
              style: {
                display: "none"
              },
              "class": "esri-legend-service"
            });
            domConstruct.create("span", {
              innerHTML: this._getServiceTitle(layer),
              "class": "esri-legend-service-label"
            }, domConstruct.create("td", {
              align: this._align
            }, domConstruct.create("tr", {}, domConstruct.create("tbody", {}, domConstruct.create("table", {
              width: "95%"
            }, d)))));
            domConstruct.place(d, this.id, "first");

            if (layer.legendResponse || layer.renderer) {
              // we already have the legend or it's a feature layer with renderer info
              this._createLegendForLayer(layer);
              oneOrMoreLegendsShown = true;
            } else {
              // when the legend has to be recreated from server, call this method.
              deferreds.push(this._legendRequest(layer));
            }
          }
        }
      }, this);
      if (oneOrMoreLegendsShown){
        this.emit("legend-change", {empty: false});
      }else{
        this.emit("legend-change", {empty: true});
      }
      if (deferreds.length === 0 && !hasWMSLayerLegend) {
        if (dom.byId(this.id + "_msg")){
          dom.byId(this.id + "_msg").innerHTML = "";
        }
        this._activate();
      } else {
        promiseList(deferreds).then(lang.hitch(this, function(response){
          // now all requests have returned
          // if any of the layers show any legend, this div is hidden
          if (!hasWMSLayerLegend) {
            dom.byId(this.id + "_msg").innerHTML = this.NLS_noLegend;
          }
          else {
            dom.byId(this.id + "_msg").innerHTML = this.NLS_noLegend;
          }

          this.emit("legend-change", {empty: response === null});
          this._activate();
        }));
      }
    },


    _addLayerViewSuspendWatch: function(layer){
      var layerView = this.view.getLayerView(layer);
      this._handles.push(on(layerView,"suspend", function(){
        this._refreshLayers();
      }.bind(this)));
      this._handles.push(on(layerView,"resume", function(){
        this._refreshLayers();
      }.bind(this)));
    },
    
    _createLegendForLayer: function(layer){
      if (layer.legendResponse || layer.renderer) {

        var foundOne = false;
        if (layer.legendResponse) {
          // it's a Map Service or Image Service
          var layerInfos = layer.dynamicLayerInfos || layer.layerInfos;
          if (layerInfos && layerInfos.length){
            array.forEach(layerInfos, function(layerInfo, i){
              if (!layer._hideLayersInLegend || array.indexOf(layer._hideLayersInLegend, layerInfo.id) == -1) {
                var f = this._buildLegendItems(layer, layerInfo, i);
                foundOne = foundOne || f;
              }
            }, this);
          } else if (layer.declaredClass == "esri.layers.ArcGISImageServiceLayer") {
            foundOne = this._buildLegendItems(layer, {
              id: 0,
              name: null,
              title: layer.name,
              subLayerIds: null,
              parentLayerId: -1
            }, 0);          
          }
        } else if (layer.renderer) {
          // it's a Feature Layer
          var id;
          if (!layer.url) {
            // feature collection
            id = "fc_" + layer.id;
          } else {
            id = layer.url.substring(layer.url.lastIndexOf("/") + 1, layer.url.length);
          }
          foundOne = this._buildLegendItems(layer, {
            id: id,
            name: null,
            subLayerIds: null,
            parentLayerId: -1
          }, 0);
        }
        
        if (foundOne) {
          domStyle.set(dom.byId(this.id + "_" + layer.id), "display", "block");
          domStyle.set(dom.byId(this.id + "_msg"), "display", "none");
        }
      }
    },
    
    _legendRequest: function(layer){
      if (this.view.getLayerView(layer)) {
        if (layer.version >= 10.01) {
          return this._legendRequestServer(layer);
        } else {
          return this._legendRequestTools(layer);
        }
      }
    },
    
    _legendRequestServer: function(layer){
      var url = layer.url;
      var pos = url.indexOf("?");
      if (pos > -1) {
        url = url.substring(0, pos) + "/legend" + url.substring(pos);
      } else {
        url += "/legend";
      }
      
      var token = layer.get("token");
      if (token) {
        url += "?token=" + token;
      }
      
      var processLegendResponse = lang.hitch(this, "_processLegendResponse");
      
      var params = {};
      params.f = "json";
      if (!layer._params){
        layer._params = {};
      }
      if (layer._params.dynamicLayers) {
        params.dynamicLayers = JSON.stringify(this._createDynamicLayers(layer));
        if (params.dynamicLayers === "[{}]") {
          params.dynamicLayers = "[]";
        }
      }
      
      if (layer._params.bandIds) {
        params.bandIds = layer._params.bandIds; //layer.bandIds.join(",");
      }      
      
      if (layer._params.renderingRule) {
        params.renderingRule = layer._params.renderingRule; //dojo.toJson(layer.renderingRule.toJSON());
      }
      
      var request = esriRequest({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: function(result, args){
          processLegendResponse(layer, result, args);
        }
      });
      return request;
    },
    
    _legendRequestTools: function(layer){
      var p = layer.url.toLowerCase().indexOf("/rest/");
      var soapURL = layer.url.substring(0, p) + layer.url.substring(p + 5, layer.url.length);
      // test error case
      //if (soapURL.indexOf('Gulf_Coast_Fishery_Closure') > -1) {
      //soapURL = soapURL.replace('Gulf_Coast_Fishery_Closure','xxx');                                            // "Unable to generate legends: HTTP status code {404 - Service Not Found or Not Started} received from server"   
      //soapURL = soapURL.replace('Gulf_Coast_Fishery_Closure','xxx/Gulf_Coast_Fishery_Closure');                 // "Unable to generate legends: HTTP status code {404 - Folder xxx is not found.} received from server"
      //soapURL = soapURL.replace('ArcGIS/services/Gulf_Coast_Fishery_Closure','xxx/Gulf_Coast_Fishery_Closure'); // "Unable to generate legends: HTTP status code {404 - Not Found} received from server"
      //soapURL = soapURL.replace('events.arcgisonline.com','xxx');                                               // "Unable to generate legends: xxx\nUnable to connect to Host: xxx Port: -1"
      //soapURL = soapURL.replace('events.arcgisonline.com','xxx.esri.com');                                      // "Unable to generate legends: xxx.esri.com\nUnable to connect to Host: xxx.esri.com Port: -1
      //}
      // legend request
      var url = this._legendUrl + "?soapUrl=" + window.escape(soapURL);
      // test error case
      //if (url.indexOf('Gulf_Coast_Fishery_Closure') > -1) {
      //  url = url.replace('www.arcgis.com','xxx');  // 
      //}
      if ( !has("ie") || has("ie") > 8) {
        url += "&returnbytes=true";
      }
      
      var processLegendResponse = lang.hitch(this, "_processLegendResponse");
      
      var params = {};
      params.f = "json";
      var request = esriRequest({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: function(result, args){
          processLegendResponse(layer, result, args);
        }
      });
      return request;
    },
    
    _processLegendResponse: function(layer, response){
      if (response && response.layers) {
        layer.legendResponse = response;
        //if multiple legend requests have been sent simultaneously, for example, if calling dynamicLayer.setDynamicLayInfos
        //and dynamicLayer.setLayerDrawingOptions to create a dynamic layer with data layer source and renderer,
        //the table for the layer will be generated twice. And when the responses come back, two legends will be filled into
        //the same table with the same div id. So the result is the second legend will be set as false.
        //So, the table needs to be cleaned up when the legend request complete to avoid conflicts.
        if (dom.byId(this.id + "_" + layer.id)) {
          domConstruct.empty(dom.byId(this.id + "_" + layer.id));
        }
        
        // now add the title back in
        domConstruct.create("span", {
          innerHTML: this._getServiceTitle(layer),
          "class": "esri-legend-service-label"
        }, domConstruct.create("td", {
          align: this._align
        }, domConstruct.create("tr", {}, domConstruct.create("tbody", {}, domConstruct.create("table", {
          width: "95%"
        }, dom.byId(this.id + "_" + layer.id))))));
        
        this._createLegendForLayer(layer);
      } else {
        // response is undefined if the legend tool is not available (1 min timeout)
        // if any error happens with the actual ArcGIS server legend call a response.error is returned
        console.log("Legend could not get generated for " + layer.url + ": " + JSON.stringify(response));
      }
    },

    _buildLegendItems: function(layer, layerInfo, pos){
      var foundOne = false;
      var mainNode = dom.byId(this.id + "_" + layer.id);
      var subLayerIds = layerInfo.subLayerIds;
      var parentLayerId = layerInfo.parentLayerId; // -1, or layer id
      if (subLayerIds) {
      
        // only display this group layer name if there is a legend somewhere inside
        var node = domConstruct.create("div", {
          id: this.id + "_" + layer.id + "_" + layerInfo.id + "_group",
          style: {
            display: "none"
          },
          "class": (parentLayerId == -1) ? ((pos > 0) ? "esri-legend-group-layer" : "") : this._legendAlign
        }, (parentLayerId == -1) ? mainNode : dom.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"));
        
        domConstruct.create("td", {
          // if we encode it then we loose stuff like this ">100 kg m <sub>-2</sub>"
          // innerHTML: layerInfo.name.replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;"),
          innerHTML: layerInfo.name,
          align: this._align
        }, domConstruct.create("tr", {}, domConstruct.create("tbody", {}, domConstruct.create("table", {
          width: "95%",
          "class": "esri-legend-layer-label"
        }, node))));
        
      } else {
      
        if (layer.visibleLayers && ("," + layer.visibleLayers + ",").indexOf("," + layerInfo.id + ",") == -1) {
          // layer is not visible in map
          return foundOne;
        }
        
        // only display this layer name if there is a legend
        // we have to create this div now, otherwise the gfx symbols won't draw
        var d = domConstruct.create("div", {
          id: this.id + "_" + layer.id + "_" + layerInfo.id,
          style: {
            display: "none"
          },
          "class": (parentLayerId > -1) ? this._legendAlign : ""
        }, (parentLayerId == -1) ? mainNode : dom.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"));
        
        domConstruct.create("td", {
          // if we encode it then we loose stuff like this ">100 kg m <sub>-2</sub>"
          // innerHTML: (layerInfo.name) ? layerInfo.name.replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;") : "",
          innerHTML: layerInfo.name || "",
          align: this._align
        }, domConstruct.create("tr", {}, domConstruct.create("tbody", {}, domConstruct.create("table", {
          width: "95%",
          "class": "esri-legend-layer-label"
        }, d))));
        
        if (layer.legendResponse) {
          foundOne = foundOne || this._buildLegendItems_Tools(layer, layerInfo, d);
        } else if (layer.renderer) {
          foundOne = foundOne || this._buildLegendItems_Renderer(layer, layerInfo, d);
        }
      }
      return foundOne;
    },
    
    _buildLegendItems_Tools: function(layer, layerInfo, node){
      // ArcGIS.com tools legend
      var parentLayerId = layerInfo.parentLayerId; // -1, or layer id
      var mapScale = this.map.get("scale"); 
      var foundOne = false;
      
      var getLegendResponseLayer = function(legendResponseLayers, layerInfo) {
        var i, k;
        
        for (i = 0; i < legendResponseLayers.length; i++) {
          if (layerInfo.dynamicLayerInfos) {
            for (k = 0; k < layerInfo.dynamicLayerInfos[k].length; k++) {
              if (layerInfo.dynamicLayerInfos[k].mapLayerId == legendResponseLayers[i].layerId) {
                return legendResponseLayers[i];
              }
            }
          } else {
            if (layerInfo.id == legendResponseLayers[i].layerId) {
              return legendResponseLayers[i];
            }
          }
        }        
        return {};
      };
      
      if (!this._respectCurrentMapScale || (this._respectCurrentMapScale && this._isLayerInScale(layer, layerInfo, mapScale))) {
        
        var inScale = true;
        if (layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" || layer.declaredClass === "esri.layers.ArcGISMapServiceLayer") {
          // check group layer scales too
          var obj = this._getEffectiveScale(layer, layerInfo);
          if ((obj.minScale && obj.minScale < mapScale) || obj.maxScale && obj.maxScale > mapScale) {
            // not in scale
            inScale = false;
          }
        }        
        
        if (inScale) {

          var legendResponseLayer = getLegendResponseLayer(layer.legendResponse.layers, layerInfo);
          var legendType = legendResponseLayer.legendType;
          var legend = legendResponseLayer.legend;
          if (!legend) {
            // maybe annotation layer
          }else{
  
            this._sanitizeLegendResponse(legendResponseLayer, layerInfo);
            
            var tableNode = domConstruct.create("table", {
              cellpadding: 0,
              cellspacing: 0,
              width: "95%",
              "class": "esri-legend-layer"
            }, node);
            var tableBody = domConstruct.create("tbody", {}, tableNode);
            
            if (layer._hoverLabel || layer._hoverLabels) {
              this._createHoverAction(tableNode, layer, layerInfo);
            }
            
            array.forEach(legend, function(legendItem){
              // try to figure out which one is the default symbol; they're not marked as such
              // single symbol has legend.length == 1
              // version 10.01+10.02: legendItem.values are never set
              // <all other values> is localized; so we don't catch all of those
              if (
                layer.version >= 10.1 && 
                !legendItem.values && 
                legend.length > 1 && 
                (
                  layer._hideDefaultSymbol || 
                  legendItem.label === "<all other values>" || 
                  !legendItem.label &&
                  !(layer.declaredClass === "esri.layers.ArcGISImageServiceLayer" && layer.version >= 10.3)
                )
              ) {
                // don't show default symbol for unique value and class break renderers
              } else {
                if ((legendItem.url && legendItem.url.indexOf("http") === 0) || (legendItem.imageData && legendItem.imageData.length > 0)) {
                  foundOne = true;
                  this._buildRow_Tools(legendItem, tableBody, layer, layerInfo.id, legendType);
                }
              }
            }, this);
          }
        }
      }
      
      if (foundOne) {
        // only display layer name and group layer name if there is at least one legend
        domStyle.set(dom.byId(this.id + "_" + layer.id + "_" + layerInfo.id), "display", "block");
        if (parentLayerId > -1) {
          domStyle.set(dom.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"), "display", "block");
          this._findParentGroup(layer.id, layer, parentLayerId);
        }
      }
      
      return foundOne;
    },
    
    _sanitizeLegendResponse: function(legendResponseLayer, layerInfo) {
      //console.log("legendResponseLayer = ", legendResponseLayer);
      //console.log("layerInfo = ", layerInfo);
  
      if (!legendResponseLayer._sanitized) {
        var renderer = lang.getObject("layerDefinition.drawingInfo.renderer", false, layerInfo),
            legendItems = legendResponseLayer.legend,
            defaultSymbolLegend, defaultLegendIndex;
  
        // Find the legend item corresponding to the renderer's default symbol.
        array.some(legendItems, function(item, idx) {
          if (!item.values) {
            defaultLegendIndex = idx;
            defaultSymbolLegend = item;
          }
          
          return !!defaultSymbolLegend;
        });
        
        //console.log("defaultSymbolLegend = ", defaultSymbolLegend);
        
        if (defaultSymbolLegend) {
          // Make sure the legend item for default symbol is at the end
          // for unique values and class breaks.
          if (renderer) {
            if (renderer.type === "uniqueValue") {
              //console.log("unique values legend...");
    
              // Remove default legend item from its original position and 
              // append it to the end.
              legendItems.splice(defaultLegendIndex, 1);
              legendItems.push(defaultSymbolLegend);
            }
            else if (renderer.type === "classBreaks") {
              //console.log("class breaks legend...");
              legendItems.splice(defaultLegendIndex, 1);
    
              // Reverse the array so that high values are displayed on top.
              legendItems.reverse();
    
              legendItems.push(defaultSymbolLegend);
            }
          }
          else {
            legendItems.splice(defaultLegendIndex, 1);
            legendItems.push(defaultSymbolLegend);
          }
        }
        
        legendResponseLayer._sanitized = true;
      }
    },
    
    _buildRow_Tools: function(legend, table, layer, subLayerId, legendType){
    
      var tr = domConstruct.create("tr", {}, table);
      
      var labelTD;
      var imageTD;
      if (this.alignRight) {
        labelTD = domConstruct.create("td", {
          align: this._isRightToLeft ? "left" : "right"
        }, tr);
        imageTD = domConstruct.create("td", {
          align: this._isRightToLeft ? "left" : "right",
          width: 35
        }, tr);
      } else {
        imageTD = domConstruct.create("td", {
          width: 35,
          align: "center"
        }, tr);
        labelTD = domConstruct.create("td", {}, tr);
      }
      
      var src = legend.url;
      
      if ((!has("ie") || has("ie") >= 9 || (has("ie") < 9 && layer.declaredClass === "esri.layers.ArcGISImageServiceLayer")) && legend.imageData && legend.imageData.length > 0) {
        // <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsA4u4ZIibnkFcAAAAASUVORK5CYII="/>
        src = "data:image/png;base64," + legend.imageData;
      } else if (legend.url.indexOf("http") !== 0) {
        // ArcGIS server legend
        src = layer.url + "/" + subLayerId + "/images/" + legend.url;
        var token = layer._getToken();
        if (token) {
          src += "?token=" + token;
        }
      } // else arcgis.com legend returns full URL to swatch
      var img = domConstruct.create("img", {
        src: src,
        alt: "",
        border: 0,
        style: "opacity:" + layer.opacity
      }, imageTD);

      var td = domConstruct.create("td", {
        // if we encode it then we loose stuff like this ">100 kg m <sub>-2</sub>"
        // innerHTML: legend.label.replace(/[\&]/g,"&amp;").replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;").replace(/^#/, ''),
        innerHTML: legend.label,
        align: this._align
      }, domConstruct.create("tr", {}, domConstruct.create("tbody", {}, domConstruct.create("table", {
        width: "95%",
        dir: "ltr"
      }, labelTD))));
      
      if (legendType && legendType === "Stretched" && layer.version >= 10.3 && layer.declaredClass === "esri.layers.ArcGISImageServiceLayer") {
        td.style.verticalAlign = "top";
        td.style.lineHeight = "1";
        img.style.marginBottom = "-1px"; //imageData contains extra right and bottom 1px margin
        img.style.display = "block";
        labelTD.style.verticalAlign = "top";
      }
      
      if ( has("ie") < 9 ) {
        // it seems we have to add this setting here, later 
        img.style.filter = "alpha(opacity=" + (layer.opacity * 100) + ")";
      }
    },
  
    _getVariable: function(renderer, type) {
      // Returns Renderer.<type> or a Renderer.visualVariables[type="<type>"]
      // "type" can be: sizeInfo, colorInfo or opacityInfo.
      return renderer ? (
          renderer[type] || 
          
          // Just use the first size variable defined in visual variables.
          array.filter(renderer.visualVariables, function(visVariable) {
            return (visVariable.type === type);
          })[0]
        ) 
        : null;
    },
    
    _buildLegendItems_Renderer: function(layer, layerInfo, node){
    
      var parentLayerId = layerInfo.parentLayerId, // -1, or layer id
          map = this.map,
          mapScale = this.view.get("scale"),
          foundOne = false;
      
      if (!this._respectCurrentMapScale || this._isLayerInScale(layer, layerInfo, mapScale)) {

        var tableBody, tableNode, renderer = (layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer") ? layer.renderer.renderer : layer.renderer,
            rendererInfo, medianColor, rampColor, colorRampField, sizeField,
            opacityField,
            field;
        
        if (renderer instanceof ScaleDependentRenderer) {
          rendererInfo = (renderer.rangeType === "zoom") ? 
                          renderer.getRendererInfoByZoom(map.getZoom()) :
                          renderer.getRendererInfoByScale(mapScale);
        
          renderer = rendererInfo && rendererInfo.renderer;
          
          if (!renderer) {
            return false;
          }
        }
        
        // Compute color ramp information
        // TODO
        // We'll use either colorInfo or opacityInfo - not both until final 
        // design is available.
        var colorInfo = this._getVariable(renderer, "colorInfo"),
            opacityInfo = this._getVariable(renderer, "opacityInfo"),
            sizeInfo = this._getVariable(renderer, "sizeInfo");
        
        if (colorInfo) {
          medianColor = this._getMedianColor(renderer, colorInfo);
          
          if (colorInfo.field) {
            colorRampField = lang.isFunction(colorInfo.field) ? null : layer._getField ? layer._getField(colorInfo.field, true) : colorInfo;
          } 
        }
        else if (opacityInfo) {
          opacityField = lang.isFunction(opacityInfo.field) ? null : layer._getField ? layer._getField(opacityInfo.field, true) : opacityInfo;
        }
        
        // sizeInfo may not have a field i.e. specify constant size via minSize
        if (sizeInfo && sizeInfo.field) {
          sizeField = lang.isFunction(sizeInfo.field) ? null : layer._getField ? layer._getField(sizeInfo.field, true) : sizeInfo;
        }
        
        if (renderer instanceof HeatmapRenderer) {
          foundOne = true;
          this._showHeatRamp(layer, layerInfo, renderer, node);
        }
        else if (renderer instanceof DotDensityRenderer) {
          foundOne = true;
          this._showDotDensityLegend(layer, layerInfo, renderer, node);
        }
        else if (renderer instanceof TemporalRenderer) {
          // used in stream layer
          foundOne = true;
          tableNode = domConstruct.create("table", {
            cellpadding: 0,
            cellspacing: 0,
            width: "95%",
            "class": "esri-legend-layer"
          }, node);
          tableBody = domConstruct.create("tbody", {}, tableNode);

          if (layer._hoverLabel || layer._hoverLabels) {
            this._createHoverAction(tableNode, layer, layerInfo);
          }
          
          if (renderer.latestObservationRenderer && renderer.latestObservationRenderer instanceof SimpleRenderer) {
            this._buildRow_Renderer(
              layer, 
              renderer.latestObservationRenderer.symbol, 
              medianColor, 
              renderer.latestObservationRenderer.label || this.NLS_currentObservations, 
              null, 
              tableBody
            );
          } // no support yet for other renderers
          if (renderer.observationRenderer && renderer.observationRenderer instanceof SimpleRenderer) {
            this._buildRow_Renderer(
              layer, 
              renderer.observationRenderer.symbol, 
              medianColor, 
              renderer.observationRenderer.label || this.NLS_previousObservations, 
              null, 
              tableBody
            );
          } // no support yet for other renderers
          // don't show track lines symbol
          
        }
        else if (renderer instanceof UniqueValueRenderer) {
          if (renderer.infos && renderer.infos.length > 0) {
            foundOne = true;
            tableNode = domConstruct.create("table", {
              cellpadding: 0,
              cellspacing: 0,
              width: "95%",
              "class": "esri-legend-layer"
            }, node);
            tableBody = domConstruct.create("tbody", {}, tableNode);

            if (layer._hoverLabel || layer._hoverLabels) {
              this._createHoverAction(tableNode, layer, layerInfo);
            }
          
            var uniqueLabels = [];
            array.forEach(renderer.infos, function(uniqueValue){
              var template = null;
              if (layer.editable && layer.types) {
                template = this._getTemplateFromTypes(layer.types, uniqueValue.value);
              }
              //console.log(template?template.drawingTool:"null");      
              var label = uniqueValue.label;
              if (label == null) {
                label = uniqueValue.value;
              } // empty string counts as label
              
              if (array.indexOf(uniqueLabels,label) === -1) {
                uniqueLabels.push(label);
                this._buildRow_Renderer(layer, uniqueValue.symbol, medianColor, label, template, tableBody);
              }
            }, this);
          }

        } else if (renderer instanceof ClassBreaksRenderer) {

          /*
           "infos":[
           {
           "minValue":1065335,
           "maxValue":15554934.6,
           "symbol":{"style":"solid","outline":{"width":1,"style":"solid","color":{"r":255,"g":0,"b":0,"a":0.5},"type":"simplelinesymbol","_styles":{"solid":"esriSLSSolid","dash":"esriSLSDash","dot":"esriSLSDot","dashdot":"esriSLSDashDot","longdashdotdot":"esriSLSDashDotDot","none":"esriSLSNull","insideframe":"esriSLSInsideFrame"},"declaredClass":"esri.symbol.SimpleLineSymbol","_stroke":null,"_fill":null},
           "color":{"r":255,"g":200,"b":0,"a":0.5},
           "type":"simplefillsymbol",
           "_styles":{"solid":"esriSFSSolid","none":"esriSFSNull","horizontal":"esriSFSHorizontal","vertical":"esriSFSVertical","forwarddiagonal":"esriSFSForwardDiagonal","backwarddiagonal":"esriSFSBackwardDiagonal","cross":"esriSFSCross","diagonalcross":"esriSFSDiagonalCross"},
           "declaredClass":"esri.symbol.SimpleFillSymbol","_stroke":null,"_fill":null}
           }
           ]
           */
          if (renderer.infos && renderer.infos.length > 0 || layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer") {
            foundOne = true;
            tableNode = domConstruct.create("table", {
              cellpadding: 0,
              cellspacing: 0,
              width: "95%",
              "class": "esri-legend-layer"
            }, node);
            tableBody = domConstruct.create("tbody", {}, tableNode);

            if (layer._hoverLabel || layer._hoverLabels) {
              this._createHoverAction(tableNode, layer, layerInfo);
            }
            
            // Reverse breaks so that max value is on top and min value is at 
            // the bottom.
            var reverseBreaksInfos = renderer.infos.slice(0).reverse();
          
            array.forEach(reverseBreaksInfos, function(classBreak){
              var label = classBreak.label;
              if (label == null) {
                label = classBreak.minValue + " - " + classBreak.maxValue;
              } // empty string counts as label
              this._buildRow_Renderer(layer, classBreak.symbol, medianColor, label, null, tableBody);
            }, this);
            
            if (layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer" && (layer.rendererStyle === VectorFieldRenderer.STYLE_SCALAR ||
              layer.rendererStyle === VectorFieldRenderer.STYLE_SINGLE_ARROW)) {
              this._buildRow_Renderer(layer, renderer.defaultSymbol, null, "", null, tableBody);
            }
          }
        } else if (renderer instanceof SimpleRenderer) {
          foundOne = true;
          tableNode = domConstruct.create("table", {
            cellpadding: 0,
            cellspacing: 0,
            width: "95%",
            "class": "esri-legend-layer"
          }, node);
          tableBody = domConstruct.create("tbody", {}, tableNode);

          if (layer._hoverLabel || layer._hoverLabels) {
            this._createHoverAction(tableNode, layer, layerInfo);
          }
          
          var template = null;
          if (layer.editable && layer.templates && layer.templates.length > 0) {
            template = layer.templates[0];
          }
        
          // Use color/size ramp label here only if one of them are 
          // defined. If both are defined, fallback to displaying their 
          // labels in their respective sections. 
          // If both color and opacity fields are available, color field 
          // will be used.
          field = ((colorRampField || opacityField) && sizeField) ? null : (colorRampField || opacityField || sizeField);
          
          this._buildRow_Renderer(
            layer, 
            renderer.symbol, 
            medianColor, 
            field ? (field.alias || field.name || field.field) : renderer.label,
            template, 
            tableBody
          );
          
          rampColor = renderer.symbol && renderer.symbol.color;
          
          // Do not show the field alias again in the color ramp / size ramp sections
          if (field) {
            colorRampField = opacityField = sizeField = null;
          }
        }
        
        // TODO
        // This needs to happen after the defaultSymbol display (see next if block)
        // Symbol scaling cannot exist on its own without simple/uv/class-breaks
        // definitions
        if (foundOne) {
          // TODO
          // Color ramp in legend will represent either colorInfo or opacityInfo, 
          // but not both at this time.
          if (colorInfo && colorInfo.field) {
            // Check if this is a special class breaks renderer we're using for 
            // SmartMaps. If so, the label for the color field would've already 
            // been displayed as part of class break swatches above. We don't 
            // have to display it again here.
            if (colorRampField && this._isSmartRenderer(renderer, colorRampField.name)) {
              colorRampField = null;
            }
            
            this._showColorRamp(layer, layerInfo, renderer, null, node, colorInfo, colorRampField);
          }
          else if (opacityInfo && rampColor) {
            this._showColorRamp(layer, layerInfo, renderer, rampColor, node, opacityInfo, opacityField);
          }

          // sizeInfo may not have a field i.e. specify constant size via minSize
          if (sizeInfo && sizeInfo.field) {
            // Check if this is a special class breaks renderer we're using for 
            // SmartMaps. If so, the label for the size field would've already 
            // been displayed as part of class break swatches above. We don't 
            // have to display it again here.
            if (sizeField && this._isSmartRenderer(renderer, sizeField.name)) {
              sizeField = null;
            }
            
            this._showSizeLegend(layer, layerInfo, renderer, sizeInfo, medianColor, node, sizeField);
          }
        }
        
        if (!layer._hideDefaultSymbol && renderer.defaultSymbol) {
          foundOne = true;
          
          tableNode = domConstruct.create("table", {
            cellpadding: 0,
            cellspacing: 0,
            width: "95%",
            "class": "esri-legend-layer"
          }, node);
          
          tableBody = domConstruct.create("tbody", {}, tableNode);
          
          this._buildRow_Renderer(layer, renderer.defaultSymbol, null, renderer.defaultLabel || "others", null, tableBody);
        }
      }
      
      if (foundOne) {
        // only display layer name and group layer name if there is at least one legend
        domStyle.set(dom.byId(this.id + "_" + layer.id + "_" + layerInfo.id), "display", "block");
        if (parentLayerId > -1) {
          domStyle.set(dom.byId(this.id + "_" + layer.id + "_" + parentLayerId + "_group"), "display", "block");
          this._findParentGroup(layer.id, parentLayerId);
        }
      }
      
      return foundOne;
    },
    
    _isSmartRenderer: function(renderer, visVariableField) {
      return (
        renderer instanceof ClassBreaksRenderer && 
        renderer.infos && 
        renderer.infos.length === 1 && 
        renderer.attributeField === visVariableField
      );
    },
    
    _showColorRamp: function(layer, layerInfo, renderer, rampColor, node, info, field) {
      // "info" can be colorInfo or opacityInfo
      var tableNode, tableBody, rampStops;

      tableNode = domConstruct.create("table", {
        cellpadding: 0,
        cellspacing: 0,
        width: "95%",
        "class": "esri-legend-layer"
      }, node);

      tableBody = domConstruct.create("tbody", {}, tableNode);

      if (layer._hoverLabel || layer._hoverLabels) {
        this._createHoverAction(tableNode, layer, layerInfo);
      }
      
      // (1) Display field alias/name as the section header
      if (field) {
        // field will be null for SimpleRenderer i.e. already displayed along 
        // with the regular symbol swatch
        this._addSubHeader(tableBody, field.alias || field.name);
      }

      // (2) Draw color ramp, ticks and labels
      rampStops = this._getRampStops(renderer, info, rampColor);
      if (rampStops.length) {
        this._drawColorRamp(tableBody, rampStops, true, layer, this._getRampBorderColor(renderer));
      }
    },
    
    _getMedianColor: function(renderer, colorInfo) {
      var minValue, maxValue;

      if (colorInfo.colors) {
        minValue = colorInfo.minDataValue;
        maxValue = colorInfo.maxDataValue;
      }
      else if (colorInfo.stops) {
        minValue = colorInfo.stops[0].value;
        maxValue = colorInfo.stops[colorInfo.stops.length - 1].value;
      }

      var medianValue = minValue + ((maxValue - minValue) / 2);

      //console.log("median = ", medianValue);
      return renderer.getColor(medianValue, {
        colorInfo: colorInfo
      });
    },
    
    _getRampStops: function(renderer, info, rampColor) {
      // "info" can be colorInfo or opacityInfo
      var dataValues, rampStops, range, val;
      var dataLabels, useDataLabels = false;
      
      // (1) Extract data values from colors or stops
      if (info.colors || info.opacityValues) {
        range = info.maxDataValue - info.minDataValue;
        
        dataValues = array.map([0, 0.25, 0.5, 0.75, 1], function(fraction) {
          val = info.minDataValue + (fraction * range);
          
          // minValue = 0 and maxValue = 0.2 yields 0.150000000002 as one of 
          // the data values. We want to avoid such outliers by controlling the  
          // decimal digits.
          // Another ex: minValue = -0.2 and maxValue = +0.2
          // But, why 6 digits? Seems reasonable.
          return Number(val.toFixed(6));
        });
        
        //console.log("Before: ", dataValues);
        this._checkPrecision(0, 4, dataValues);
        //console.log("After : ", dataValues);
      }
      else if (info.stops) {
        dataValues = array.map(info.stops, function(stop) {
          return stop.value;
        });
        useDataLabels = array.some(info.stops, function(stop) {
          return !!stop.label;
        });
        if (useDataLabels) {
          dataLabels = array.map(info.stops, function(stop) {
            return stop.label;
          });
        }
      }
      
      //console.log("dataValues = ", dataValues);

      // (2) Create gradient stops for GFX
      var minValue = dataValues[0], 
          maxValue = dataValues[dataValues.length - 1],
          color, alpha, labelPrefix;
      
      range = maxValue - minValue;
      
      rampStops = array.map(dataValues, function(value, dataIndex) {
        if (rampColor) {
          // Use the given rampColor but apply alpha.
          color = new Color(rampColor.toRgba());
          
          alpha = renderer.getOpacity(value, {
            opacityInfo: info
          });
          if (alpha != null) {
            color.a = alpha;
          }
        }
        else {
          color = renderer.getColor(value, {
            colorInfo: info
          });
        }
        
        // Add label prefix for the first and last stops:
        // Only when the user has not explicitly set labels.
        labelPrefix = "";
        
        if (dataIndex === 0) {
          // less-than sign
          labelPrefix = this._specialChars.lt + " ";
        }
        else if (dataIndex === (dataValues.length - 1)) {
          // greater-than sign
          labelPrefix = this._specialChars.gt + " ";
        }
        
        return {
          value: value,
          color: color,
          
          // Offset range expected by GFX in the range between 0 and 1.
          // Subtract from 1 so we can reverse the ramp order below
          offset: (1 - ((value - minValue) / range) ),

          label: useDataLabels ? dataLabels[dataIndex]
              : labelPrefix + 
                  dojoNumber
                  // Pad the fractional part to fill 20 places - due to a
                  // quirk in dojo.number.format that ends up reducing the
                  // precision. We don't want to reduce the precision.
                  .format(value, { places: 20, round: -1 })
                  // Remove insignificant trailing zeros
                  .replace(this.reZerosFractional, "$1")
                  .replace(this.reZeros, "")
        };
      }, this);
      
      //console.log("rampStops = ", rampStops);
      
      // Display maxValue first
      return rampStops.reverse();
    },
    
    _checkPrecision: function(start, end, dataValues) {
      // Remove precision from data values to avoid too much precision in  
      // color ramp labels
      var middle = start + ((end - start) / 2),
          startData = dataValues[start],
          middleData = dataValues[middle],
          endData = dataValues[end],
          startFloored = Math.floor(startData),
          middleFloored = Math.floor(middleData),
          endFloored = Math.floor(endData);
      
      if (
        // start and end are whole numbers...
        startFloored === startData && endFloored === endData && 
        // but middle number is not a whole number.
        middleFloored !== middleData && 
        
        // If the integer part of middle is different from
        // integer parts of start and middle,
        // then remove middle's precision.
        startFloored !== middleFloored && endFloored !== middleFloored
      ) {
        dataValues[middle] = middleFloored;
      }
      
      // Binary traversal of dataValues array.
      // (1) Traversal of first half
      if ( (start + 1) !== middle ) {
        this._checkPrecision(start, middle, dataValues);
      }
      
      // (2) Traversal of second half
      if ( (middle + 1) !== end ) {
        this._checkPrecision(middle, end, dataValues);
      }
    },
    
    _getRampBorderColor: function(renderer) {
      // Returns the outline color of the first symbol in the given renderer.
      var symbol, stroke, borderColor;
  
      // Pick a symbol from the layer's renderer
      if (renderer instanceof SimpleRenderer) {
        symbol = renderer.symbol;
      }
      else if (
        renderer instanceof UniqueValueRenderer ||
        renderer instanceof ClassBreaksRenderer
      ) {
        // Let's pick symbol from the first info.
        symbol = renderer.infos[0].symbol;
      }

      var stroke = null;
      if (symbol && symbol.type.indexOf("linesymbol") === -1) {
        if (symbol.type === "PolygonSymbol3D"){
          for (var i=0; i < symbol.symbolLayers.length; i++) {
            var symbolLayer = symbol.symbolLayers[i];
            if (symbolLayer.type === "Line") {
              stroke = this._getSymbolLayerStroke(symbolLayer,0);
            }
          }
        }else if ((symbol.type === "LineSymbol3D")||(symbol.type === "PointSymbol3D")) {
          stroke = this._getSymbolLayerStroke(symbol.symbolLayers[0],0);
        } else{
          stroke = symbol.get("stroke");
        }
      }
      
      borderColor = stroke && stroke.color;
      
      return borderColor;
    },
    
    _drawColorRamp: function(table, rampStops, equalIntervalStops, layer, borderColor) {
      // equalIntervalStops will be true for sizeInfo, false for heatmap.
      // Heatmaps tend to have lots of colors, we don't want a giant color ramp.
      // Hence equalIntervalStops = false.
      var tr = domConstruct.create("tr", {}, table),
          labelTD, imageTD, imageDiv, rampDiv, labelContainer,
          surface, source, rect,
          numGradients = rampStops.length - 1,
          rampWidth, rampHeight, top,
          vmlAdjust = 0;
      
      if (this.alignRight) {
        labelTD = domConstruct.create("td", {
          align: this._isRightToLeft ? "left" : "right"
        }, tr);
        
        imageTD = domConstruct.create("td", {
          align: this._isRightToLeft ? "left" : "right",
          width: this.gradientWidth
        }, tr);
      } 
      else {
        imageTD = domConstruct.create("td", {
          width: this.gradientWidth,
          align: "center"
        }, tr);
        
        labelTD = domConstruct.create("td", {}, tr);
      }
  
      // We display border for the color ramp based on the factors checked 
      // in the expression below.
      var hasBorder = (
        borderColor && 
        borderColor.a > 0 && 
          
        // We don't want border if we're drifting towards white.
        !(
          borderColor.r >= 240 &&
          borderColor.g >= 240 &&
          borderColor.b >= 240
        )
      );

      imageDiv = domConstruct.create("div", {
        "class": (hasBorder ? "" : "esri-legend-border-less-color-ramp"),
        style: "position: relative; width:" + this.gradientWidth + "px;"
      }, imageTD);
      
      // (1) Draw color ramp as GFX rectangle with linear gradient fill
      
      // IE quirk: rampDiv should have the same size as the GFX surface 
      // drawn inside it
      rampDiv = domConstruct.create("div", {
        "class": "esri-legend-color-ramp"
      }, imageDiv);
      
      rampWidth = domStyle.get(rampDiv, "width");
  
      // Add border for the color ramp.
      if (hasBorder) {
        if (has("ie") < 9) {
          // IE 8 does not support RGBa.
          borderColor = borderColor.toHex();
        }
        else {
          borderColor = ( "rgba(" + borderColor.toRgba().join(",") + ")" );
        }
  
        domStyle.set(rampDiv, "border", this.colorRampBorder + " " + borderColor);
      }
  
      if (equalIntervalStops) {
        rampHeight = this.gradientHeight * numGradients;
        domStyle.set(rampDiv, "height", rampHeight + "px");
      }
      else {
        rampHeight = domStyle.get(rampDiv, "height");
      }
      
      domStyle.set(imageDiv, "height", rampHeight + "px");
      
      surface = gfx.createSurface(rampDiv, rampWidth, rampHeight);
          
      if ( has("ie") < 9 ) {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell  
        source = surface.getEventSource();
        domStyle.set(source, "position", "relative");
        domStyle.set(source.parentNode, "position", "relative");
        
        // NOTE
        // This should not be necessary. GFX is supposed to do this.
        vmlAdjust = 1; // pixel
      }
      
      try {
        if (equalIntervalStops) {
          // Adjust the stop offsets so that we have stops at fixed/equal interval.
          array.forEach(rampStops, function(stop, index) {
            stop.offset = index / numGradients;
          });
        }
        
        // Display stops using a linear gradient.
        rect = surface.createRect({
          x:      -vmlAdjust,
          y:      -vmlAdjust,
          width:  rampWidth + vmlAdjust,
          height: rampHeight + vmlAdjust
        });

        // NOTE
        // VML does not support alpha channel for gradient fills.
        // http://dojotoolkit.org/reference-guide/1.9/dojox/gfx.html#implementation-details
        // Ex: stops that vary alpha from 0 to 1 will not work.
        rect
          .setFill({
            type: "linear",
            x1: 0, y1: 0,
            x2: 0, y2: rampHeight,
            colors: rampStops
          })
          .setStroke(null);
        
        // Another rectangle to apply layer's opacity on to the gradient 
        // rectangle. We're doing it in this fashion because of VML. 
        // The alternative is to inject layer opacity into each stop of the 
        // gradient - which is messy. 
        // Another alternative is to set opacity for the gradient rect shape 
        // explicitly - see GraphicsLayer._setIEOpacity - which is messy also.
        surface.createRect({
          width: rampWidth, 
          height: rampHeight 
        })
          .setFill(new Color([ 255, 255, 255, 1 - layer.opacity]))
          .setStroke(null);
        
        this._surfaceItems.push(surface);
      } 
      catch (e) {
        surface.clear();
        surface.destroy();
      }
  
      // (2) Display ramp ticks (absolute positioning)
      array.forEach(rampStops, function(stop, index) {
        if (stop.label) {
          top = "top:" + (stop.offset * 100) + "%;";
          
          var tickClass = "";
          
          if (index === 0) {
            tickClass += " esri-legend-color-ramp-tick-first";
          }
          if (index === (rampStops.length - 1)) {
            tickClass += " esri-legend-color-ramp-tick-last";
          }
  
          domConstruct.create("div", {
            "class": "esri-legend-color-ramp-tick" + tickClass,
            innerHTML: "&nbsp;",
            style: top
          }, imageDiv);
        }
      });
  
      labelContainer = domConstruct.create("div", {
        "class": "esri-legend-color-ramp-labels",
        style: {
          // Add gradientHeight which is the same as the height of one label:
          // This is required since we're relatively positioning.
          // This is required since we align the vertical center of each label 
          // to its corresponding tick. gradientHeight gives additional vertical 
          // space in the label container to accommodate the leaking top and 
          // bottom labels.
          height: (rampHeight + this.gradientHeight) + "px"
        }
      }, labelTD);
  
      // (3) Display labels beside the color ramp (relative positioning)
      // Absolute positioning is not ideal for labels because it fails to give "width" 
      // to their parent div. Without width for the parent div, the legend is 
      // only as wide as previous tables in the widget. If those tables are small 
      // labels may end up leaking outside the legend bounding box.
      if (equalIntervalStops) {
        // Labels for SizeInfo
        array.forEach(rampStops, function(stop) {
          domConstruct.create("div", {
            "class": "esri-legend-color-ramp-label",
            // Use empty divs for stops with no label
            // We need to do this since we're relatively positioning now.
            innerHTML: stop.label || "&nbsp;"
          }, labelContainer);
        });
      }
      else {
        // Labels for heatmap: "High" and "Low"
        domConstruct.create("div", {
          "class": "esri-legend-color-ramp-label",
          innerHTML: jsapiBundle.widgets.legend.high
        }, labelContainer);
  
        domConstruct.create("div", {
          "class": "esri-legend-color-ramp-label",
          innerHTML: jsapiBundle.widgets.legend.low,
          
          // top = distance from the previous label
          // Remember we're relatively positioned - calculations are different.
          style: "top: " + ((rampHeight + this.gradientHeight) - (2 * this.gradientHeight)) + "px;"
        }, labelContainer);
        
        // TODO
        // These are hard-coded labels and hence we'll be ignoring any (future) user-defined 
        // labels for heatmap stops. It would be hard to support user-defined labels 
        // with relative positioning.
      }

    },
    
    _showHeatRamp: function(layer, layerInfo, renderer, node) {
      var tableNode, tableBody, rampStops,
          field = renderer.field;

      tableNode = domConstruct.create("table", {
        cellpadding: 0,
        cellspacing: 0,
        width: "95%",
        "class": "esri-legend-layer"
      }, node);

      tableBody = domConstruct.create("tbody", {}, tableNode);

      if (layer._hoverLabel || layer._hoverLabels) {
        this._createHoverAction(tableNode, layer, layerInfo);
      }
      
      // (1) Display field alias/name as the section header
      field = field && layer.getField(field);
      
      if (field) {
        this._addSubHeader(tableBody, field.alias || field.name);
      }

      // (2) Draw heat intensity ramp
      rampStops = this._getHeatmapStops(renderer);
      if (rampStops.length) {
        this._drawColorRamp(tableBody, rampStops, false, layer);
      }
    },
    
    _getHeatmapStops: function(renderer) {
      var colorStops = renderer.colorStops,
          colors = renderer.colors,
          hasRatio, lastIdx, min, range, interval;
      
      if (colorStops && colorStops[0]) {
        lastIdx = colorStops.length - 1;
        hasRatio = (colorStops[0] && colorStops[0].ratio != null);
        
        // Calculate "ratio" if user has specified values for colorStops.
        if (!hasRatio) {
          min = colorStops[0].value;
          range = colorStops[lastIdx].value - min;
          
          colorStops = array.map(colorStops, function(stop) {
            return {
              color: stop.color,
              ratio: (stop.value - min) / range
            };
          });
        }
        else {
          // If the last ratio is not 1, legend looks quirky because the "High"
          // label is positioned below the top edge of the intensity ramp.
          // To avoid this, let's add another stop with the same color as the 
          // last stop but with ratio 1.
          var lastStop = colorStops[lastIdx];
          
          if (lastStop && lastStop.ratio !== 1) {
            colorStops = colorStops.slice(0);
            
            colorStops.push({
              ratio: 1,
              color: lastStop.color
            });
            
            lastIdx++;
          }
        }
      }
      else if (colors && colors[0]) {
        // If colorStops are not specified, let's calculate them explicitly.
        lastIdx = colors.length - 1;
        interval = 1 / (colors.length - 1);

        colorStops = array.map(colors, function(clr, idx) {
          return {
            color: clr,
            ratio: idx * interval
          };
        });
      }
      
      colorStops = array.map(colorStops, function(stop, idx) {
        var label = "";
        
        if (idx === 0) {
          label = "Low";
        }
        else if (idx === lastIdx) {
          label = "High";
        }
        
        return {
          color: stop.color,
          label: label,
          
          // Subtract ratio from 1 to reverse the ramp orientation: high to low or low to high.
          // This allows us to match the stops in the order expected by GFX.
          offset: 1 - stop.ratio
        };
      });
      
      return colorStops.reverse();
    },
  
    _showDotDensityLegend: function(layer, layerInfo, renderer, node) {
      // Displays legend swatches for dot density renderer
      
      var legendOptions = renderer.legendOptions, pictureFill,
          bgColor, outline, valueUnit, dotCoverage,
          tableNode, tableBody, numPoints,
          swatchSize = this.dotDensitySwatchSize, halfSwatch = Math.round(swatchSize / 2);
      
      if (legendOptions) {
        bgColor = legendOptions.backgroundColor;
        outline = legendOptions.outline;
        valueUnit = legendOptions.valueUnit;
        dotCoverage = legendOptions.dotCoverage;
      }
      
      // Default = 75% (this.dotCoverage)
      dotCoverage = (dotCoverage || this.dotCoverage) / 100;
      
      // max #points that can fit inside the swatch x coverage pct
      numPoints = Math.round( ((swatchSize * swatchSize) / Math.pow(renderer.dotSize, 2)) * dotCoverage);
      
      tableNode = domConstruct.create("table", {
        cellpadding: 0,
        cellspacing: 0,
        width: "95%",
        "class": "esri-legend-layer"
      }, node);

      tableBody = domConstruct.create("tbody", {}, tableNode);

      if (layer._hoverLabel || layer._hoverLabels) {
        this._createHoverAction(tableNode, layer, layerInfo);
      }
      
      // Add a table row for: "1 dot = 100 people"
      this._addSubHeader(
        tableBody,
        esriLang.substitute(
          { value: renderer.dotValue, unit: valueUnit || "" },
          this.NLS_dotValue
        )
      );
      
      // Add rows to show dot density pattern for each configured field
      array.forEach(renderer.fields, function(field) {
        // Clone to add numPoints. We cannot just mutate renderer's field objects
        field = lang.mixin({}, field);
        field.numPoints = numPoints;
        
        // TODO
        // Cache the DataURL so that the swatch doesn't flick when
        // map scale changes
        pictureFill = new PictureFillSymbol(
          // DataURL for the picture image
          renderer._generateImageSrc(
            swatchSize, swatchSize, 
            [ field ],
            { x: 0, y: 0 },
            { x: swatchSize, y: swatchSize },
            bgColor
          ), 
          
          outline || renderer.outline,
          
          // Picture image size
          swatchSize, swatchSize
        );
        
        field = layer._getField(field.name, true) || field;
        
        // field *can* now be an instance of esri/layers/Field, so be careful when
        // accessing its properties
        
        this._buildRow_Renderer(
          layer, pictureFill, null,
          field.alias || field.name, 
          null, tableBody,
          { 
            type: "path", 
            path: "M " + -halfSwatch + "," + -halfSwatch + 
                  " L " + halfSwatch + "," + -halfSwatch + 
                  " L " + halfSwatch + "," + halfSwatch + 
                  " L " + -halfSwatch + "," + halfSwatch + 
                  " L " + -halfSwatch + "," + -halfSwatch + 
                  " E" 
          }
        );
      }, this);
    },
    
    _showSizeLegend: function(layer, layerInfo, renderer, sizeInfo, medianColor, node, field) {
      // Displays legend swatches to visualize proportional symbol scaling
      
      var legendOptions = sizeInfo.legendOptions,
          customValues = legendOptions && legendOptions.customValues,
          tableNode, tableBody, dataValues,
          minDataValue = sizeInfo.minDataValue,
          maxDataValue = sizeInfo.maxDataValue,
          propSymbol = this._getSizeSymbol(renderer, medianColor);

      // Check if we have enough information to draw this legend
      if (
        sizeInfo.valueUnit !== "unknown" ||
        
        // No symbol, no legend
        !propSymbol ||
        
        // We can draw using customValues or we need both min and max data values
        // to auto generate the values ourselves
        (!customValues && (minDataValue == null || maxDataValue == null)) 
      ) {
        return;
      }

      tableNode = domConstruct.create("table", {
        cellpadding: 0,
        cellspacing: 0,
        width: "95%",
        "class": "esri-legend-layer"
      }, node);

      tableBody = domConstruct.create("tbody", {}, tableNode);

      if (layer._hoverLabel || layer._hoverLabels) {
        this._createHoverAction(tableNode, layer, layerInfo);
      }
      
      //field = layer._getField(props.field, true);
      
      // Display field alias or name in its own row
      if (field) {
        this._addSubHeader(tableBody, field.alias || field.name);
      }
      
      // User provided data values or auto generated
      dataValues = customValues || this._getDataValues(minDataValue, maxDataValue);
      
      // Display legend swatch for every data value
      array.forEach(dataValues, function(dataVal, index) {
        // Create the symbol
        propSymbol = symbolUtils.fromJSON(propSymbol.toJSON());
        this._applySize(propSymbol, renderer, sizeInfo, dataVal);
        
        // Format data value based on the current locale - especially to
        // add grouping (Ex: thousand) separator and decimal separator
        dataVal = dojoNumber
                    // Pad the fractional part to fill 20 places - due to a 
                    // quirk in dojo.number.format that ends up reducing the
                    // precision. We dont want to reduce the precision.
                    .format(dataVal, { places: 20, round: -1 })
                    // Remove insignificant trailing zeros
                    .replace(this.reZerosFractional, "$1")
                    .replace(this.reZeros, "");
  
        var label = "";
  
        // Add label prefix for the first and last swatches.
        if (index === 0) {
          // greater-than sign
          label = this._specialChars.gt + " ";
        }
        else if (index === (dataValues.length - 1)) {
          // less-than sign
          label = this._specialChars.lt + " ";
        }
        
        label = "<span class='esri-legend-size-ramp-label'>" + label + dataVal + "</span>";
  
        // Display the swatch
        this._buildRow_Renderer(layer, propSymbol, null, label, null, tableBody);
      }, this);
    },
    
    _getSizeSymbol: function(renderer, medianColor) {
      // Returns a prototypical symbol that can be used to draw
      // proportional symbol swatches 
      var symbol;
      
      // Pick a symbol from the layer's renderer
      if (renderer instanceof SimpleRenderer) {
        symbol = renderer.symbol;
      } else if (renderer instanceof VectorFieldRenderer) {
        symbol = renderer.defaultSymbol;
      } else if (
        renderer instanceof UniqueValueRenderer ||
        renderer instanceof ClassBreaksRenderer
      ) {
        // Let's pick symbol from the first info. What other
        // choice do we have? We cannot display all symbols as part of
        // proportional swatches
        symbol = renderer.infos[0].symbol;
      }
      
      // Exclude fill symbols
      symbol = (symbol.type.indexOf("fillsymbol") !== -1) ? null : symbol;
      
      if (symbol) {
        // Clone
        symbol = symbolUtils.fromJSON(symbol.toJSON());
        
        // Use medianColor if available. Else, use symbol as it is.
        if (medianColor) {
          symbol.set("color", new Color(medianColor.toRgba()));
        }

        //console.log("propSymbol = ", symbol.type, symbol.style, symbol);
      }
      
      return symbol;
    },
    
    _applySize: function(symbol, renderer, sizeInfo, dataVal) {
      // Calculate proportional symbol size and apply it to the 
      // appropriate dimension based on symbol type and style.
      // We're expecting only markers or line symbols here.
      var size, type = symbol.type, width, height,
          options = {
            sizeInfo: sizeInfo,
            
            shape: (type.indexOf("markersymbol") !== -1) ? symbol.style : null
          };
      
      size = renderer.getSize(dataVal, options);
      
      switch (type) {
        case "simplemarkersymbol":
          symbol.size = size;
          break;
        
        case "picturemarkersymbol":
          width = symbol.width;
          height = symbol.height;
          
          symbol.height = size;
          
          // Preserve aspect ratio of the image.
          symbol.width = size * (width / height);
          break;
        
        case "simplelinesymbol":
        case "cartographiclinesymbol":
          symbol.width = size;
          break;
  
        case "textsymbol":
          if (symbol.font) {
            symbol.font.size = size;
          }
          break;
      }
    },
    
    _getDataValues: function(minDataValue, maxDataValue) {
      // Returns data values appropriate to be displayed in legend swatches
      // for proportional symbol scaling.
      // Interpolation algorithm as described in this paper:
      // http://cartography.oregonstate.edu/pdf/2009_Jenny_Legends.pdf
      
      var dataValues = [ minDataValue, maxDataValue ],
          natLogOf10 = Math.LN10,
          logMin = Math.log(minDataValue),
          logMax = Math.log(maxDataValue),
          lower, upper, i, logBase, computed;
      
      array.forEach([ 1, 2.5, 5 ], function(baseValue) {
        logBase = Math.log(baseValue);
        
        lower = Math.ceil( (logMin - logBase) / natLogOf10 );
        upper = Math.floor( (logMax - logBase) / natLogOf10 );
        
        // TODO
        // Interim solution to avoid infinite loop below when minDataValue = 0
        if (Math.abs(lower) === Infinity || Math.abs(upper) === Infinity) {
          return;
        }
        
        for (i = lower; i < upper + 1; i++) {
          computed = baseValue * Math.pow(10, i);
          
          // Don't add duplicates
          if (array.indexOf(dataValues, computed) === -1) {
            dataValues.push(computed);
          }
        }
      });
      
      dataValues.sort(this._sorter);
      
      // Display maxDataValue first
      return dataValues.reverse();
    },
    
    _sorter: function(a, b) {
      // Produces numbers in ascending order.
      return a - b;
    },
    
    _buildRow_Renderer: function(layer, symbol, medianColor, label, template, table, pathShape){
      
      // TODO
      // If sizeInfo does not have "field", then it specifies a constant
      // size via "minSize". We need to apply that constant size to 
      // Simple, UV and CBr swatches.
    
      var tr = domConstruct.create("tr", {}, table);
      var labelTD;
      var imageTD;
      if (this.alignRight) {
        labelTD = domConstruct.create("td", {
          align: this._isRightToLeft ? "left" : "right"
        }, tr);
        imageTD = domConstruct.create("td", {
          align: this._isRightToLeft ? "left" : "right",
          width: 22
        }, tr);
      } else {
        imageTD = domConstruct.create("td", {
          width: 22,
          align: "center"
        }, tr);
        labelTD = domConstruct.create("td", {}, tr);
      }
      
      var width = 22;
      var height = 22;
      
      // show point symbols in their actual size
      if (symbol.type == "simplemarkersymbol") {
        // extra padding for the outline width
        width = Math.min(Math.max(width, symbol.size + 12), 125);
        height = Math.min(Math.max(height, symbol.size + 12), 125);
      } 
      else if (symbol.type == "picturemarkersymbol") {
        width = Math.min(Math.max(width, symbol.width), 125);
        height = Math.min(Math.max(symbol.height, height), 125);
      }
      else if (symbol.type == "textsymbol") {
        width = Math.min(Math.max(width, symbol.getWidth() + 12), 125);
        height = Math.min(Math.max(height, symbol.getHeight() + 12), 125);
      }
      
      var div = domConstruct.create("div", {
        style: "width:" + width + "px;height:" + height + "px;"
      }, imageTD);
      
      // esri.tasks.GenerateRenderer bug ...
      if (esriLang.isDefined(label) && typeof label === "number") {
        label = ""+label;
      }
      
      // TODO
      // Not sure why we're adding this additional table 
      domConstruct.create("td", {
        // if we encode it then we loose stuff like this ">100 kg m <sub>-2</sub>"
        // innerHTML: label ? label.replace(/[\&]/g,"&amp;").replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;").replace(/^#/, '') : "",
        innerHTML: label || "",
        align: this._align
      }, domConstruct.create("tr", {}, domConstruct.create("tbody", {}, domConstruct.create("table", {
        width: "95%"
      }, labelTD))));

      var surface = this._drawSymbol(div, symbol, medianColor, width, height, template, layer, pathShape);
      if (surface){
        this._surfaceItems.push(surface);
      }
    },

    _addSubHeader: function(table, text) {
      // This method replicates what _buildRow_Renderer does. Need to optimize
      // how UI is rendered in this widget in general
      var row = domConstruct.create("tr", {}, table),
          cell = domConstruct.create(
            "td", 
            { 
              align: this._align,
              // We want the dotValue label to occupy the entire row
              // since it doesn't have a symbol
              colspan: 2
            }, 
            row
          );
    
      // TODO
      // Not sure why we're adding this additional table 
      domConstruct.create(
        "td", 
        {
          // if we encode it then we loose stuff like this ">100 kg m <sub>-2</sub>"
          // innerHTML: text ? text.replace(/[\&]/g,"&amp;").replace(/[\<]/g, "&lt;").replace(/[\>]/g, "&gt;").replace(/^#/, '') : "",
          innerHTML: text || "",
          align: this._align
        }, 
        domConstruct.create(
          "tr", 
          {}, 
          domConstruct.create(
            "tbody", 
            {}, 
            domConstruct.create("table", {
              width: "95%"
            }, cell)
          )
        )
      );
    },
    
    _drawSymbol: function(node, sym, medianColor, sWidth, sHeight, template, layer, pathShape){
      // apply layer opacity, but don't change the original symbol
      var symbol = symbolUtils.fromJSON(sym.toJSON()),
          rgba,
          layerOpacity = layer.opacity;
      
      if (medianColor) {
        symbol.set("color", new Color(medianColor.toRgba()));
      }

      if (symbol.symbolLayers){

        if (medianColor) {
          for (var i = 0; i < symbol.symbolLayers.length; i++) {
            var symbolLayer = symbol.symbolLayers[i];
            if (symbolLayer.material) {
              symbolLayer.material.color = medianColor;
            }
            else {
             symbolLayer.material = {color: medianColor};
            }
          }
        }

        for (var i = 0; i < symbol.symbolLayers.length; i++) {
          var symbolLayer = symbol.symbolLayers[i];
          if (symbolLayer.material && symbolLayer.material.color) {
            symbolLayer.material.transparency = symbolLayer.material.transparency ? 1-((1-symbolLayer.material.transparency) * (layerOpacity)) : 1-layerOpacity;
          }
        }
      }

      
      if (symbol.type === "simplelinesymbol" || symbol.type === "cartographiclinesymbol" || symbol.type === "textsymbol") {
        if (!symbol.color) {
          return;
        }
        rgba = symbol.color.toRgba();
        rgba[3] = rgba[3] * layerOpacity;
        symbol.color.setColor(rgba);
      } else if (symbol.type === "simplemarkersymbol" || symbol.type === "simplefillsymbol") {
        if (symbol.color) {
          rgba = symbol.color.toRgba();
          rgba[3] = rgba[3] * layerOpacity;
          symbol.color.setColor(rgba);
        }

        if (symbol.outline && symbol.outline.color) {
          rgba = symbol.outline.color.toRgba();
          rgba[3] = rgba[3] * layerOpacity;
          symbol.outline.color.setColor(rgba);
        }
      } else if (symbol.type === "picturemarkersymbol") {
        node.style.opacity = layerOpacity;
        /* For IE8 and earlier */
        node.style.filter = "alpha(opacity=(" + layerOpacity * 100 + "))";
        //} else if (symbol.type === "picturefillsymbol") {
      } else if (symbol.type == "LineSymbol3D") {
        template = {drawingTool: "LineSymbol3D"};
      } else if (symbol.type == "PolygonSymbol3D"){
        template = {drawingTool: "PolygonSymbol3D"};
      } else if (symbol.type == "PointSymbol3D"){
        template = {drawingTool: "PointSymbol3D"};
      } else if (symbol.type == "MeshSymbol3D"){
        template = {drawingTool: "PolygonSymbol3D"};
      }
      
      var surface = gfx.createSurface(node, sWidth, sHeight),
          source;
          
      if ( has("ie") < 9 ) {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell  
        source = surface.getEventSource();
        domStyle.set(source, "position", "relative");
        domStyle.set(source.parentNode, "position", "relative");
      }

      var shapeDesc = this._getDrawingToolShape(symbol, template) || gfxUtils.getShapeDescriptors(symbol),
          gfxShape;
      if ((shapeDesc.defaultShapes)&&(shapeDesc.defaultShapes.length === 0)){
        surface.clear();
        surface.destroy();
        return;
      }
      try {
        var shapeGroup = surface.createGroup();
        if (pathShape) {
          gfxShape = shapeGroup.createShape(pathShape)
            .setFill(shapeDesc.fill)
            .setStroke(shapeDesc.stroke);
          if (shapeDesc.defaultShape.type === "text") {
            gfxShape.setFont(shapeDesc.font);
          }
        }else{

          if (shapeDesc.defaultShape){
            gfxShape = shapeGroup.createShape(shapeDesc.defaultShape)
              .setFill(shapeDesc.fill)
              .setStroke(shapeDesc.stroke);
            if (shapeDesc.defaultShape.type === "text") {
              gfxShape.setFont(shapeDesc.font);
            }
          }else {
            for (var i = 0; i < shapeDesc.defaultShapes.length; i++) {
              gfxShape = shapeGroup.createShape(shapeDesc.defaultShapes[i])
                .setFill(shapeDesc.fills[i] ? shapeDesc.fills[i] : {})
                .setStroke(shapeDesc.strokes[i] ? shapeDesc.strokes[i] : {width:0});
              if (shapeDesc.defaultShapes[i].type === "text") {
                gfxShape.setFont(shapeDesc.font);
              }
            }
          }
        }
      } 
      catch (e) {
        surface.clear();
        surface.destroy();
        return;
      }
      
      var bbox = shapeGroup.getBoundingBox(),
          width = bbox.width, 
          height = bbox.height,
          scaleMat,
          
          // Borrowed from GraphicsLayer.js:
          // Aligns the center of the path with surface's origin (0,0)
          // This logic is specifically required for SMS symbols
          // with STYLE_PATH style
          vectorDx = -(bbox.x + (width / 2)),
          vectorDy = -(bbox.y + (height / 2)),
          
          // Borrowed from TemplatePickerItem.js:
          // Aligns the center of the shape with the center of the surface 
          dim = surface.getDimensions(),
          transform = {
            dx: vectorDx + dim.width / 2,
            dy: vectorDy + dim.height / 2
          };
      
      if (symbol.type === "simplemarkersymbol" && symbol.style === "path") {
        // We need to scale-up or scale-down SMSPath based on its size.
        // The surface has already been enlarged in _buildRow_Renderer for this 
        // scaling to happen here
        scaleMat = layer._getScaleMatrix(bbox, symbol.size);

        shapeGroup.applyTransform(
          gfxMatrix.scaleAt(
            scaleMat.xx, scaleMat.yy, 
            { x: dim.width / 2, y: dim.height / 2 }
          )
        );
      }
      else if (width > sWidth || height > sHeight) {
        var test = (width/sWidth > height/sHeight);
        var actualSize = test ? width : height;
        var refSize = test ? sWidth : sHeight;
        var scaleBy = (refSize - 5) / actualSize;
        
        lang.mixin(transform, {
          xx: scaleBy,
          yy: scaleBy
        });
      }
      shapeGroup.applyTransform(transform);
      
      return surface;
    },
    
    _getDrawingToolShape: function(symbol, template){
      var drawingTool = template ? template.drawingTool || null : null;
      var shapes = [];
      var fills = [];
      var strokes = [];


      switch (drawingTool) {
        case "esriFeatureEditToolArrow":
          shapes.push({
            type: "path",
            path: "M 10,1 L 3,8 L 3,5 L -15,5 L -15,-2 L 3,-2 L 3,-5 L 10,1 E"
          });
          fills.push(symbol.getFill());
          strokes.push(symbol.get("stroke"));
          break;
        case "esriFeatureEditToolTriangle":
          shapes.push({
            type: "path",
            path: "M -10,14 L 2,-10 L 14,14 L -10,14 E"
          });
          fills.push(symbol.getFill());
          strokes.push(symbol.get("stroke"));
          break;
        case "esriFeatureEditToolRectangle":
          shapes.push({
            type: "path",
            path: "M -10,-10 L 10,-10 L 10,10 L -10,10 L -10,-10 E"
          });
          fills.push(symbol.getFill());
          strokes.push(symbol.get("stroke"));
          break;
        case "esriFeatureEditToolCircle":
          shapes.push({
            type: "circle",
            cx: 0,
            cy: 0,
            r: 10
          });
          fills.push(symbol.getFill());
          strokes.push(symbol.get("stroke"));
          break;
        case "esriFeatureEditToolEllipse":
          shapes.push({
            type: "ellipse",
            cx: 0,
            cy: 0,
            rx: 10,
            ry: 5
          });
          fills.push(symbol.getFill());
          strokes.push(symbol.get("stroke"));
          break;
        case "LineSymbol3D":
          return this._getDrawingToolShapeLine3D(symbol, template);
        case "PolygonSymbol3D":
          return this._getDrawingToolShapePolygon3D(symbol, template);
        case "PointSymbol3D":
          return this._getDrawingToolShapePoint3D(symbol, template);
        default:
          return null;
      }

      return {
        fills: fills,
        strokes: strokes,
        defaultShapes: shapes
      };
    },

    _getDrawingToolShapePoint3D: function(symbol, template) {

      if (symbol.symbolLayers.length === 0) return {};

      var shapes = [];
      var fills = [];
      var strokes = [];

      for (var i = 0; i < symbol.symbolLayers.length; i++){
        var symbolLayer = symbol.symbolLayers[i];
        if (symbolLayer.type === "Icon"){
          if (symbolLayer.resource) {
            if (symbolLayer.resource.primitive) {
              this._addResourcePrimitiveShapes(symbolLayer, shapes, fills, strokes);
            } else {
              var src = symbolLayer.resource.dataURI || symbolLayer.resource.href;
              //sizing not honoured yet screenUtils.px2pt(symbolLayer.size ? symbolLayer.size : 10)
              shapes.push({
                type: "image",
                src: src,
                width: 20,
                height: 20
              });
              fills.push({});
              strokes.push({});
            }
          }
        }else {

          if (symbolLayer.type === "Object") {
            if ((symbolLayer.resource)&&(symbolLayer.resource.href)) {
              shapes.push({
                type: "image",
                src: this.basePath+"/images/legend3dsymboldefault.png",
                width: 20,
                height: 20
              });
              fills.push({});
              strokes.push({});
            }else if ((symbolLayer.resource)&&(symbolLayer.resource.primitive)) {
              this._addResourcePrimitiveShapes(symbolLayer, shapes, fills, strokes);
            }
          }
        }
      }
      return {
        fills: fills,
        strokes: strokes,
        defaultShapes: shapes
      };
    },

    _addResourcePrimitiveShapes: function(symbolLayer, shapes, fills, strokes){
      var primitive = symbolLayer.resource.primitive;
      switch(primitive){
        case "circle":
          shapes.push({
            type: "circle", cx: 0, cy: 0, r: 10
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          break;
        case "square":
          shapes.push({
            type: "path",
            path: "M -10,-10 L 10,-10 L 10,10 L -10,10 L -10,-10 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          break;
        case "cross":
          shapes.push({
            type: "path",
            path: "M -10,0 L 10,0 E"
          });
          shapes.push({
            type: "path",
            path: "M 0,-10 L 0,10 E"
          });
          fills.push({});
          fills.push({});
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          break;
        case "x":
          shapes.push({
            type: "path",
            path: "M -10,-10 L 10,10 E"
          });
          shapes.push({
            type: "path",
            path: "M 10,-10 L -10,10 E"
          });
          fills.push({});
          fills.push({});
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          break;
        case "kite":
          shapes.push({
            type: "path",
            path: "M 0,-10 L 10,0 L 0,10 L -10 0 L 0,-10 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          strokes.push(this._getSymbolLayerOutline(symbolLayer));
          break;
        case "cone":
          shapes.push({
            type: "path",
            path: "M 0,-10 L -8,5 L -4,6.5 L 0,7 L 4,6.5 L 8,5 Z"
          });
          var fillColour = this._getSymbolLayerFill(symbolLayer,0);
          var fillColourDarker = this._getSymbolLayerFill(symbolLayer,-0.6);
          var  gradient = this._getGradientColor(fillColour,fillColourDarker);
          gradient.x1 = -5;
          gradient.y1 = 0;
          gradient.x2 = 5;
          gradient.y2 = 0;
          fills.push(gradient);
          strokes.push({width: 0});
          break;
        case "cube":
          shapes.push({
            type: "path",
            path: "M -10,-7 L 0,-12 L 10,-7 L 0,-2 L -10,-7 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          strokes.push({width: 0});
          shapes.push({
            type: "path",
            path: "M -10,-7 L 0,-2 L 0,12 L -10,7 L -10,-7 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,-0.3));
          strokes.push({width: 0});
          shapes.push({
            type: "path",
            path: "M 0,-2 L 10,-7 L 10,7 L 0,12 L 0,-2 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,-0.5));
          strokes.push({width: 0});
          break;
        case "cylinder":
          shapes.push({
            type: "path",
            path: "M -8,-9 L -8,7 L -4,8.5 L 0,9 L 4,8.5 L 8,7 L 8,-9 Z"
          });
          var fillColour = this._getSymbolLayerFill(symbolLayer,0);
          var fillColourDarker = this._getSymbolLayerFill(symbolLayer,-0.6);
          var  gradient = this._getGradientColor(fillColour,fillColourDarker);
          gradient.x1 = -5;
          gradient.y1 = 0;
          gradient.x2 = 5;
          gradient.y2 = 0;
          fills.push(gradient);
          strokes.push({width: 0});

          shapes.push({
            type: "ellipse", cx: 0, cy: -9, rx: 8, ry: 2
          });
          strokes.push({width: 0});
          fills.push(this._getSymbolLayerFill(symbolLayer, 0));
          break;
        case "diamond":
          shapes.push({
            type: "path",
            path: "M 0,-10 L 10,-1 L -1,1 L 0,-10 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer, -0.3));
          //strokes.push(this._getSymbolLayerStroke(symbolLayer, -0.3));
          shapes.push({
            type: "path",
            path: "M 0,-10 L -1,1 L -8,-1 L 0,-10 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          //strokes.push(this._getSymbolLayerStroke(symbolLayer, 0));
          shapes.push({
            type: "path",
            path: "M -1,1 L 0,10 L -8,-1 L -1,1 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,-0.3));
          //strokes.push(this._getSymbolLayerStroke(symbolLayer, -0.3));
          shapes.push({
            type: "path",
            path: "M -1,0 L 0,10 L 10,-1 L -1,1 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,-0.7));
          //strokes.push(this._getSymbolLayerStroke(symbolLayer, -0.6));
          break;
        case "sphere":
          shapes.push({
            type: "circle", cx: 0, cy: 0, r: 10
          });
          var fillColour = this._getSymbolLayerFill(symbolLayer,0);
          var fillColourDarker = this._getSymbolLayerFill(symbolLayer,-0.6);
          fills.push(this._getGradientColor(fillColour,fillColourDarker));
          strokes.push({width: 0});
          break;
        case "tetrahedron":
          shapes.push({
            type: "path",
            path: "M 0,-10 L 10,7 L 0,0 L 0,-10 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer, -0.3));
          strokes.push({width: 0});
          shapes.push({
            type: "path",
            path: "M 0,-10 L 0,0 L -8,7 L 0,-10 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          strokes.push({width: 0});
          shapes.push({
            type: "path",
            path: "M 10,7 L 0,0 L -8,7 L 10,7 Z"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,-0.6));
          strokes.push({width: 0});
          break;
      }

    },

    _getDrawingToolShapePolygon3D: function(symbol, template) {

      if (symbol.symbolLayers.length === 0) return {};

      var shapes = [];
      var fills = [];
      var strokes = [];

      for (var i = 0; i < symbol.symbolLayers.length; i++){
        var symbolLayer = symbol.symbolLayers[i];
        if (symbolLayer.type === "Fill"){
          shapes.push({
            type: "path",
            path: "M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 E"
          });
          fills.push(this._getSymbolLayerFill(symbolLayer,0));
          if (symbol.symbolLayers.length === 1){
            strokes.push({width:0});
          }
        }else if (symbolLayer.type === "Line"){
          strokes.push(this._getSymbolLayerStroke(symbolLayer,0));
          if (symbol.symbolLayers.length === 1){
            shapes.push({
              type: "path",
              path: "M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 E"
            });
            fills.push({});
          }
        }
        else if (symbolLayer.type === "Extrude"){
          var stroke = this._getSymbolLayerStroke(symbolLayer, 0);
          var strokeDarker = this._getSymbolLayerStroke(symbolLayer, -0.4);
          var fillColorArray = this._getSymbolLayerFill(symbolLayer,0);
          var fillLighterColorArray = this._getSymbolLayerFill(symbolLayer, 0.4);
          strokeDarker.width = 1;
          shapes.push({
            type: "path",
            path: "M -7,-5 L -2,0 L -2,7 L -7,3 L -7,-5Z"
          });
          fills.push(fillColorArray);
          strokes.push(strokeDarker);

          shapes.push({
            type: "path",
            path: "M -2,0 L -2,7 L 10,-3 L 10,-10 L -2,0 Z"
          });
          fills.push(fillColorArray);
          strokes.push(strokeDarker);

          shapes.push({
            type: "path",
            path: "M -7,-5 L -2,0 L 10,-10 L -2,-10 L -7,-5 Z"
          });
          fills.push(fillLighterColorArray);
          strokes.push(strokeDarker);
        }
      }
      return {
        fills: fills,
        strokes: strokes,
        defaultShapes: shapes
      };
    },

    _getDrawingToolShapeLine3D: function(symbol, template) {

      if (symbol.symbolLayers.length === 0) {
        return {};
      }
      var symbolLayer = symbol.symbolLayers[0];
      var shapes = [];
      var fills = [];
      var strokes = [];
      var stroke = this._getSymbolLayerStroke(symbolLayer, 0);
      var strokeDarker = this._getSymbolLayerStroke(symbolLayer, -0.4);
      if (symbolLayer.type === "Line") {
        shapes.push({
          type: "path",
          path: "M -2,5 L 12,5 E"
        });
        strokes.push(stroke);
        fills.push([]);
      }else{
        var fillColorArray = this._getSymbolLayerFill(symbolLayer,0);
        var fillLighterColorArray = this._getSymbolLayerFill(symbolLayer, 0.4);
        strokeDarker.width = 1;
        shapes.push({
          type: "path",
          path: "M 3,12 L 12,0 L 11,-2 L -4,5 L -1,5 L 1,7 L 3,10 L 3,12 Z"
        });
        fills.push(fillColorArray);
        strokes.push(strokeDarker);
        shapes.push({
          type: "circle",
          cx: -2,
          cy: 10,
          r: 5
        });
        //fillLighterColorArray[3] = fillLighterColorArray[3]*1.5;
        fills.push(fillLighterColorArray);
        strokes.push(strokeDarker);
      }
      return {
        fills: fills,
        strokes: strokes,
        defaultShapes: shapes
      };
    },

    _getSymbolLayerStroke: function(symbolLayer, Luminance){
      if (!symbolLayer.material){
        return {};
      }
      var colorArray = symbolLayer.material.color.toRgb();
      var strokeColorString = "rgba(";
      for (var i = 0; i < 3; i++){
        strokeColorString += this._getColorChangedLuminance(colorArray[i],Luminance)+",";
      }
      strokeColorString += symbolLayer.material.color.a + ");";
      return {color: strokeColorString, width:screenUtils.px2pt(symbolLayer.size ? symbolLayer.size : 1)};
    },

    _getSymbolLayerFill: function(symbolLayer, Luminance){
      if (!symbolLayer.material){
        var defaultColor = 255;
        var defaultColorLum = this._getColorChangedLuminance(defaultColor,Luminance);
        return [defaultColorLum, defaultColorLum, defaultColorLum, 100];
      }
      
      var fillColorArray = symbolLayer.material.color.toRgb();
      for (var j = 0; j < 3; j++){
        fillColorArray[j] = this._getColorChangedLuminance(fillColorArray[j],Luminance);
      }
      fillColorArray.push(symbolLayer.material.color.a);
      return fillColorArray;
    },

    _getSymbolLayerOutline: function(symbolLayer){
      if (!symbolLayer.outline){
        return {color:"rgba(0,0,0,1)", width:1.5};
      }
      var size = (symbolLayer.outline.size != null) ? symbolLayer.outline.size : 1.5,
        rgba = (symbolLayer.outline.color != null) ? symbolLayer.outline.color.toRgba() : "255,255,255,1";
      return {color:"rgba("+rgba+")", width:size};
    },

    _getGradientColor: function(color1, color2){
      var gradient = {type: "linear", x1: 0, y1: 0, x2: 4, y2: 4,
        colors: [
          {color:color1,offset:0},
          {color:color2,offset:1}]};
      return gradient;
    },

    _getColorChangedLuminance: function(colorvalue, luminance){
      var minColourValue = 20;
      return Math.min(Math.max((colorvalue + ((255-colorvalue + minColourValue) * luminance)),0),255);
    },
    
    _repaintItems: function(){
      array.forEach(this._surfaceItems, function(surface){
        this._repaint(surface);
      }, this);
    },
    
    _repaint: function(shape){
      if (!shape) {
        return;
      }
      if (shape.getStroke && shape.setStroke) {
        shape.setStroke(shape.getStroke());
      }
      
      try {
        if (shape.getFill && shape.setFill) {
          shape.setFill(shape.getFill());
        }
      } 
      catch (ignore) {
      }
      
      if (shape.children && lang.isArray(shape.children)) {
        array.forEach(shape.children, this._repaint, this);
      }
    },
    
    _createHoverAction: function(node, layer, layerInfo) {
          
      var hoverText = layer._hoverLabel || layer._hoverLabels[layerInfo.id];
      if (!hoverText) {
        return;
      }   
      
      layer.mouseMoveHandler = layer.mouseMoveHandler || {};
      layer.mouseMoveHandler[layerInfo.id] = on(node, "mousemove", lang.hitch(this, function(hoverText, evt){
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;        
  
        if (this.hoverLabelShowing) {
          this.hoverLabelShowing = false;
          domStyle.set(dom.byId(this.id + "_hoverLabel"),"display","none");
        }

        setTimeout(lang.hitch(this, function(startX, startY, hoverText) {
          if (startX == this.mouseX && startY == this.mouseY && !this.hoverLabelShowing) {
            // user didn't move mouse within the last seconds; show hoverLabel
            this.hoverLabelShowing = true;
            if (dom.byId(this.id + "_hoverLabel")) {
              var n = dom.byId(this.id + "_hoverLabel");
              n.innerHTML = "<span>" + hoverText + "</span>";
              domStyle.set(n, "top", startY + "px");
              domStyle.set(n, "left", (startX + 15) + "px");
              domStyle.set(n, "display", "");
            }
            else {
              domConstruct.create("div", {
                innerHTML: "<span>" + hoverText + "</span>",
                id: this.id + "_hoverLabel",
                "class": "esri-legend-hover-label",
                style: {
                  top: startY + "px",
                  left: (startX + 15) + "px"
                }
              }, document.body);
            }
          }
        }, evt.clientX, evt.clientY, hoverText), 500);  
      }, hoverText));
      
      layer.mouseOutHandler = layer.mouseOutHandler || {};
      layer.mouseOutHandler[layerInfo.id] = on(node, "mouseout", lang.hitch(this, function(evt){
        this.mouseX = -1;
        this.mouseY = -1;        
        if (this.hoverLabelShowing) {
          this.hoverLabelShowing = false;
          domStyle.set(dom.byId(this.id + "_hoverLabel"),"display","none");
        }
      }));
    },
    
    _removeHoverHandlers: function(){
      var key;
      
      array.forEach(this.layers, function(layer){
        if (layer.mouseMoveHandler) {
          for (key in layer.mouseMoveHandler) {
            layer.mouseMoveHandler[key].remove();
          }
        } 
        if (layer.mouseOutHandler) {
          for (key in layer.mouseOutHandler) {
            layer.mouseOutHandler[key].remove();
          }
        } 
      });
    },

    _createDynamicLayers: function(layer) {
      var dynLayerObjs = [],
          dynLayerObj,
          infos = layer.dynamicLayerInfos || layer.layerInfos;
      
      array.forEach(infos, function (info) {
          dynLayerObj = {id: info.id};
          dynLayerObj.source = info.source && info.source.toJSON();
          
          var definitionExpression;
          if (layer.layerDefinitions && layer.layerDefinitions[info.id]) {
            definitionExpression = layer.layerDefinitions[info.id];
          }
          if (definitionExpression) {
            dynLayerObj.definitionExpression = definitionExpression;
          }
          var layerDrawingOptions;
          if (layer.layerDrawingOptions && layer.layerDrawingOptions[info.id]) {
            layerDrawingOptions = layer.layerDrawingOptions[info.id];
          }
          if (layerDrawingOptions) {
            dynLayerObj.drawingInfo = layerDrawingOptions.toJSON();
          }            
          dynLayerObj.minScale = info.minScale || 0;
          dynLayerObj.maxScale = info.maxScale || 0;
          dynLayerObjs.push(dynLayerObj);
      });
  
      return dynLayerObjs;
    },
  
    _getTemplateFromTypes: function(types, value){
      var i;
      for (i = 0; i < types.length; i++) {
        if (types[i].id == value && types[i].templates && types[i].templates.length > 0) {
          return types[i].templates[0];
        }
      }
      return null;
    },
    
    _findParentGroup: function(serviceId, layer, parentLayerId){
      var k;
      var layerInfos = layer.dynamicLayerInfos || layer.layerInfos;
      for (k = 0; k < layerInfos.length; k++) {
        if (parentLayerId == layerInfos[k].id) {
        
          if (layerInfos[k].parentLayerId > -1) {
            domStyle.set(dom.byId(this.id + "_" + serviceId + "_" + layerInfos[k].parentLayerId + "_group"), "display", "block");
            this._findParentGroup(serviceId, layer, layerInfos[k].parentLayerId);
          }
          break;
        }
      }
    },
    
    _addSubLayersToHide: function(layerInfo){
      // add all sub layers of these layers into the list
      if (!layerInfo.layer.layerInfos) {
        return;
      }

      function addSubIds(id, list) {
        var layerInfos = layerInfo.layer.dynamicLayerInfos || layerInfo.layer.layerInfos,
            i, k;
        
        for (i = 0; i < layerInfos.length; i++) {
          if (layerInfos[i].id === id && layerInfos[i].subLayerIds) {
            for (k = 0; k < layerInfos[i].subLayerIds.length; k++){
              var subLayerId = layerInfos[i].subLayerIds[k];
              if (array.indexOf(list, subLayerId) === -1) {
                list.push(subLayerId);
                addSubIds(subLayerId,list);
              }
            }
          }
        }
      }

      array.forEach(layerInfo.layer._hideLayersInLegend, function(layerId){
        addSubIds(layerId, layerInfo.layer._hideLayersInLegend);
      });
    },
    
    _isLayerInScale: function(layer, layerInfo, mapScale){
      var i;
      var inScale = true;
      if (layer.legendResponse && layer.legendResponse.layers) {
        // ArcGIS.com tools legend
        for (i = 0; i < layer.legendResponse.layers.length; i++) {
          var legendResponse = layer.legendResponse.layers[i];
          if (layerInfo.id == legendResponse.layerId) {
            var minScale, maxScale;
            if ((!layer.minScale && layer.minScale !== 0) || (!layer.maxScale && layer.maxScale !== 0)) {
              // for tiled layers we have to also take into consideration the scale range of the layer
              if (legendResponse.minScale === 0 && layer.tileInfo) {
                minScale = layer.tileInfo.lods[0].scale;
              }
              if (legendResponse.maxScale === 0 && layer.tileInfo) {
                maxScale = layer.tileInfo.lods[layer.tileInfo.lods.length - 1].scale;
              }
            } else {
              // v10.1
              minScale = Math.min(layer.minScale, legendResponse.minScale) || layer.minScale || legendResponse.minScale;
              maxScale = Math.max(layer.maxScale, legendResponse.maxScale);
            }
            if ((minScale > 0 && minScale < mapScale) || maxScale > mapScale) {
              inScale = false;
            }
            break;
          }
        }
      } else if (layer.minScale || layer.maxScale) {
        // Feature Layer
        if ((layer.minScale && layer.minScale < mapScale) || layer.maxScale && layer.maxScale > mapScale) {
          inScale = false;
        }
      }
      return inScale;
    },
    
    _getServiceTitle: function(layer){
    
      // did user set a title?
      var serviceTitle = layer._titleForLegend;
      if (!serviceTitle) {
        // no, then use service name
        serviceTitle = layer.url;
        if (!layer.url) {
          // feature collection
          serviceTitle = "";
        } else if (layer.url.indexOf("/MapServer") > -1) {
          serviceTitle = layer.url.substring(0, layer.url.indexOf("/MapServer"));
          serviceTitle = serviceTitle.substring(serviceTitle.lastIndexOf("/") + 1, serviceTitle.length);
        } else if (layer.url.indexOf("/ImageServer") > -1) {
          serviceTitle = layer.url.substring(0, layer.url.indexOf("/ImageServer"));
          serviceTitle = serviceTitle.substring(serviceTitle.lastIndexOf("/") + 1, serviceTitle.length);
        } else if (layer.url.indexOf("/FeatureServer") > -1) {
          serviceTitle = layer.url.substring(0, layer.url.indexOf("/FeatureServer"));
          serviceTitle = serviceTitle.substring(serviceTitle.lastIndexOf("/") + 1, serviceTitle.length);
        }
        if (layer.name) {
          if (serviceTitle.length > 0) {
            serviceTitle += " - " + layer.name;
          } else {
            serviceTitle = layer.name;
          }
        }
      }
      if (layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer" && layer.vectorFieldPixelFilter) {
        var unit = layer.vectorFieldPixelFilter.outputUnit ? this["NLS_" + layer.vectorFieldPixelFilter.outputUnit] : this["NLS_" + layer.vectorFieldPixelFilter.inputUnit];
        if (esriLang.isDefined(unit)) {
          serviceTitle += " (" + unit + ")";
        }
      }
      // dojox.html.entities.encode so we see Umlauts
      return htmlEntities.encode(serviceTitle);
    },
    
    _getEffectiveScale: function(layer, layerInfo) {
      // this is only accessed for map services 
      
      // for ArcGIS < v10.1 beta2 one must also consider parent layer scale info (seems like dynamic layer 10.21 also needs group layer scale info)
      // and this works only for ArcGIS v10.01 where scale info gets returned for each layer in a service info request
      // nothing (reasonable) that can be done for ArcGIS <= v10.0
      var minScale = layerInfo.minScale; // layerInfo.effectiveMinScale for new servers only available if different
      var maxScale = layerInfo.maxScale;
      if (esriLang.isDefined(layerInfo.parentLayerId)) {
        var layerInfos = layer.layerInfos;
        var parentId = layerInfo.parentLayerId, i;
        // layers are ordered by id
        for (i = layerInfos.length - 1; i >= 0; i--) {
          if (layerInfos[i].id == parentId) {
  
            // merge scales
            if (minScale === 0 && layerInfos[i].minScale > 0) {
              minScale = layerInfos[i].minScale;
            } else if (minScale > 0 && layerInfos[i].minScale > 0) {
              minScale = Math.min(minScale, layerInfos[i].minScale);
            }
            maxScale = Math.max(maxScale || 0, layerInfos[i].maxScale || 0);
            // is this layer in a group layer?
            if (layerInfos[i].parentLayerId > -1) {
              parentId = layerInfos[i].parentLayerId;
            } else {
              break;
            }
          }
        }
      }
      return {minScale: minScale, maxScale: maxScale};
    },

    _isSupportedLayerType: function(layer) {

      if (layer &&
          (layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" ||
          (layer.declaredClass === "esri.layers.ArcGISImageServiceLayer" && layer.version >= 10.2) ||
          layer.declaredClass === "esri.layers.ArcGISImageServiceVectorLayer" ||
          layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer" ||
          layer.declaredClass === "esri.layers.ArcGISTiledLayer" ||
          layer.declaredClass === "esri.layers.FeatureLayer" ||
          layer.declaredClass === "esri.layers.StreamLayer" ||
          layer.declaredClass === "esri.layers.KMLLayer" ||
          layer.declaredClass === "esri.layers.GeoRSSLayer" ||
          layer.declaredClass === "esri.layers.WMSLayer" ||
          layer.declaredClass === "esri.layers.CSVLayer" ||
          layer.declaredClass === "esri.layers.SceneLayer")){
        return true;
      }
      return false;
    }
  });

  lang.mixin(Legend, {
    ALIGN_LEFT: 0,
    ALIGN_RIGHT: 1
  });

  return Legend;
});
