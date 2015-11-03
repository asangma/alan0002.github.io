define([
  "require",

  "../../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",

  "dojo/on",
  "dojo/Deferred",
  "dojo/promise/all",

  "dijit/registry",

  "../../layers/support/layerUtils",

  "../../geometry/Extent",

  "../../tasks/support/Query",

  "../../layers/GroupLayer",

  "../../core/Accessor"
], function(
  require,
  declare, array, lang,
  on, Deferred, all,
  registry,
  layerUtils,
  Extent,
  Query,
  GroupLayer,
  Accessor
) {

  var FeatureLayer; // lazy loaded FeatureLayer constructor

  var PopupManager = declare(Accessor, {

    declaredClass: "esri.views.PopupManager",

    classMetadata: {
      properties: {
        map: {
          dependsOn: ["view.map"],
          readOnly: true
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._featureLayersCache = {};
    },

    destroy: function() {
      this._featureLayersCache = {};
      this.view = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _clickHandle: null,

    _featureLayersCache: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  enabled
    //----------------------------------

    enabled: false,

    _enabledSetter: function(value) {
      if (this._clickHandle) {
        if (value) {
          this._clickHandle.resume();
        }
        else {
          this._clickHandle.pause();
        }
      }
      return value;
    },

    //----------------------------------
    //  map
    //----------------------------------

    /**
     * @todo doc
     * Read only
     * 
     */

    _mapGetter: function() {
      return this.get("view.map") || null;
    },

    //----------------------------------
    //  view
    //----------------------------------
    
    view: null,

    _viewSetter: function(value) {
      if (this._clickHandle) {
        this._clickHandle.remove();
        this._clickHandle = null;
      }
      if (value) {
        this._clickHandle = on.pausable(value, "click", this._clickHandler.bind(this));
        if (!this.enabled) {
          this._clickHandle.pause();
        }
      }
      return value;
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    getMapLayer: function(feature) {
      // Returns the layer on the map that defines info template (or popup) for the given feature.
      var layer;

      if (feature) {
        layer = feature.getLayer();
        if (layer) {
          var layerId = layer.id;
          if (this._featureLayersCache[layerId]) {
            var idx = layerId.lastIndexOf("_"); // see _getSubLayerFeatureLayers
            if (idx > -1) {
              layerId = layerId.substring(0, idx);
              layer = this.map.getLayer(layerId);
            }
          }
        }
      }

      return layer;
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    // Use when map.popup is esri.widgets.InfoWindow/InfoWindowLite
    _showInfoWindow: function(clickGraphic, clickPoint) {
      var popup = this.view.popup;
      var geometry = clickGraphic.geometry;
      var mapPoint = (geometry && geometry.type === "point") ? geometry : clickPoint;
      var content = clickGraphic.getContent();

      popup.setTitle(clickGraphic.getTitle());
      if (content && lang.isString(content.id)) {
        var widget = registry.byId(content.id);
        if (widget && widget.set &&
            /_PopupRenderer/.test(widget.declaredClass)) {
          widget.set("showTitle", false);
        }
      }

      popup.setContent(content);
      popup.show(mapPoint);
    },

    _showPopup: function(event) {
      var map = this.map;
      var view = this.view;
      var popup = view.popup;
      var _this = this;

      // relevant layers from the map
      // layer types: GraphicsLayer, FeatureLayer or ArcGISImageServiceLayer
      var popupLayers = [];

      function isValidPopupLayer(layer){
        if(layer == null){
          return false;
        }
        var layerView = view.getLayerView(layer);
        if(layerView == null){
          return false;
        }
        return layer.loaded && !layer.disablePopup && layer.popupTemplate && !layerView.suspended;
      }
      function isDrapedLayer(layer){
        return !layer.elevationInfo || layer.elevationInfo.mode === "onTheGround";
      }
      array.forEach(map.layers.getAll(), function(layer) {
        if (layer.isInstanceOf(GroupLayer)){
          array.forEach(layer.layers.getAll(), function(subLayer) {
            if (isValidPopupLayer(subLayer) && isDrapedLayer(subLayer)) {
              popupLayers.push(subLayer);
            }
          });
        }else if (isValidPopupLayer(layer) && isDrapedLayer(layer)) {
          popupLayers.push(layer);
        }
      });

//      var mapServiceLayers = [];
//       array.forEach(map.layerIds, function(layerId) {
//         var layer = map.getLayer(layerId);
//         if (layer && layer.loaded && !layer.suspended) {
//           if (layer.declaredClass === "esri.layers.ArcGISImageServiceLayer" && layer.popupTemplate) {
//             popupLayers.push(layer);
//           }
//           else if ((layer.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" ||
//               layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer") &&
//               layer.popupTemplates) {
//             mapServiceLayers.push(layer);
//           }
//         }
//       });

      //this._getSubLayerFeatureLayers(mapServiceLayers).then(function(subLayers) {
      //  popupLayers = popupLayers.concat(subLayers);

        // Let's make sure this graphic is of interest to us.
        var clickGraphic = null;
        if (event.graphic && (event.graphic.popupTemplate || isValidPopupLayer(event.graphic.layer))) {
          clickGraphic = event.graphic;
        }

        if (!popupLayers.length && !clickGraphic) {
          //console.log("No valid layers");
          return;
        }

        var deferredsArray = [];
        var closestFeatureFirst = true;
        var hasFeatures = !!clickGraphic;

        if(!clickGraphic){
          // Calculate the query extent
          var tolerance = _this._calculateClickTolerance(popupLayers);

          // WARNING: the following code assumes that it's only being used to find draped graphics in a Canvas3D
          // view. any other queries would require a different logic.
          var mapPoint = event.mapPoint;
          if (!mapPoint) {
            return;
          }
          var worldSize = tolerance * (view.basemapTerrain && view.basemapTerrain.overlayManager.overlayPixelSizeInMapUnits(mapPoint)),
              p1 = mapPoint.offset(-worldSize, -worldSize),
              p2 = mapPoint.offset(worldSize, worldSize);

          // when view is 3D and clicking on the sky, extent might be null
          if(p1 == null || p2 == null){
            return;
          }
          var extent = new Extent(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y),
            Math.max(p1.x, p2.x), Math.max(p1.y, p2.y), map.spatialReference);

          // Perform query
          var query = new Query();
          deferredsArray = array.map(popupLayers, function(layer) {
            var dfd;
            query.timeExtent = layer.useMapTime ? map.timeExtent : null;
            if (layer.declaredClass === "esri.layers.ArcGISImageServiceLayer") {
              query.geometry = event.mapPoint; //Identify with point for Image Services
              closestFeatureFirst = false;
              var queryOptions = {};
              queryOptions.rasterAttributeTableFieldPrefix = "Raster.";
              queryOptions.returnDomainValues = true;
              dfd = layer.queryVisibleRasters(query, queryOptions);
              dfd.then(function() {
                var visibleRasters = layer.getVisibleRasters();
                //console.log("IS Selected features: ", visibleRasters.length, visibleRasters);
                hasFeatures = hasFeatures || visibleRasters.length > 0;
                return visibleRasters;
              });
            }
            else if (layer.declaredClass === "esri.layers.SceneLayer") {
              // No operation
              dfd = new Deferred();
              dfd.resolve();
            }
            else if (_this._featureLayersCache[layer.id] ||
                (typeof layer.queryFeatures === "function" &&
                    (layer.currentMode === 0 || layer.currentMode === 1) /* MODE_SNAPHOT or MODE_ONDEMAND */)) {
              // is FeatureLayer
              query.geometry = extent;
              dfd = layer.queryFeatures(query);
              dfd.then(function(fSet) {
                var features = fSet.features;
                // Let's take care of the duplicate features in the Popup impl
                //console.log("Queried features: ", features.length, features);
                hasFeatures = hasFeatures || features.length > 0;
                // Make sure we return the array of features here because
                // Popup impl expects to receive an array of features.
                return features; // gets passed on to the popup impl
              });
            }
            else {
              dfd = new Deferred();
              var graphics = [];
              // Warning: 3D dragons be here! FeatureLayer doesn't use its public graphicsCollection anymore, so
              // we steal it from the layer view for now.
              // TODO: Needs to be changed in PopupManager rework.
              var layerView = view.getLayerView(layer);
              if (layerView && layerView._graphicsCollection) {
                var graphicsCollection = layerView._graphicsCollection;
                graphics = array.filter(graphicsCollection.getAll(), function(graphic) {
                  return graphic && extent.intersects(graphic.geometry);
                });
              }
              hasFeatures = hasFeatures || graphics.length > 0;
              dfd.resolve(graphics);
            }
            return dfd.promise;
          });
        }
        
        if (clickGraphic) {
          var dfd = new Deferred();
          deferredsArray.unshift(dfd.resolve([clickGraphic]));
        }

        // Let's verify if all deferreds have been "fired".
        var pending = array.some(deferredsArray, function(dfd) {
          return !dfd.isFulfilled();
        });

        if (!pending && !hasFeatures) {
          // All deferreds have been resolved.
          // There are no features. Let's exit.
          //console.log("All deferreds resolved but no features.");
          popup.hide();
          popup.clearFeatures();
          return;
        }

        popup.setFeatures(deferredsArray);
        popup.show(event.mapPoint, {
          closestFirst: closestFeatureFirst
        });
      //});
    },

    _getSubLayerFeatureLayers: function(mapServiceLayers, /* Deferred? */ dfd) {
      var deferred = dfd || new Deferred();
      var featureLayers = []; // feature layers to be searched
      var numMSLayers = mapServiceLayers.length;
      var maxOffset = Math.floor(this.map.extent.getWidth() / this.map.width);
      var mapScale = this.map.getScale();
      var needToLoadFL = false;
      var _this = this;

      msLayersLoop: for (var i = 0; i < numMSLayers; i++) {
        var msLayer = mapServiceLayers[i];
        var layerInfos = msLayer.dynamicLayerInfos || msLayer.layerInfos;
        if (!layerInfos) {
          continue;
        }
        var visibleLayers = null;
        if (msLayer._params &&
            (msLayer._params.layers || msLayer._params.dynamicLayers)) {
          // only use the msLayer's visibleLayers if they are currently in use
          visibleLayers = msLayer.visibleLayers;
        }
        visibleLayers = layerUtils._getVisibleLayers(layerInfos, visibleLayers);
        var layersInScale = layerUtils._getLayersForScale(mapScale, layerInfos);
        var numLayerInfos = layerInfos.length;
        for (var j = 0; j < numLayerInfos; j++) {
          var layerInfo = layerInfos[j];
          var layerId = layerInfo.id;
          var layerPopupTemplate = msLayer.popupTemplates[layerId];
          if (!layerInfo.subLayerIds && // skip group layers
              layerPopupTemplate && layerPopupTemplate.popupTemplate &&
              array.indexOf(visibleLayers, layerId) > -1 &&
              array.indexOf(layersInScale, layerId) > -1) {
            if (!FeatureLayer) {
              needToLoadFL = true;
              break msLayersLoop;
            }
            var cacheKey = msLayer.id + "_" + layerId;
            var featureLayer = this._featureLayersCache[cacheKey];
            if (featureLayer && featureLayer.loadError) {
              continue;
            }
            if (!featureLayer) {
              var layerUrl = layerPopupTemplate.layerUrl;
              if (!layerUrl) {
                if (layerInfo.source) {
                  layerUrl = this._getLayerUrl(msLayer.url, "/dynamicLayer");
                }
                else {
                  layerUrl = this._getLayerUrl(msLayer.url, layerId);
                }
              }
              featureLayer = new FeatureLayer(layerUrl, {
                id: cacheKey,
                drawMode: false,
                mode: FeatureLayer.MODE_SELECTION,
                outFields: this._getOutFields(layerPopupTemplate.popupTemplate),
                resourceInfo: layerPopupTemplate.resourceInfo,
                source: layerInfo.source
              });
              this._featureLayersCache[cacheKey] = featureLayer;
            }
            featureLayer.setDefinitionExpression(msLayer.layerDefinitions && msLayer.layerDefinitions[layerId]);
            featureLayer.setGDBVersion(msLayer.gdbVersion);
            featureLayer.popupTemplate = layerPopupTemplate.popupTemplate;
            featureLayer.setMaxAllowableOffset(maxOffset);
            featureLayer.setUseMapTime(!!msLayer.useMapTime);
            if (msLayer.layerDrawingOptions &&
                msLayer.layerDrawingOptions[layerId] &&
                msLayer.layerDrawingOptions[layerId].renderer) {
              featureLayer.setRenderer(msLayer.layerDrawingOptions[layerId].renderer);
            }
            featureLayers.push(featureLayer);
          }
        }
      }

      if (needToLoadFL) {
        var loadFLDef = new Deferred();
        require(["../layers/FeatureLayer"], function(FL) {
          FeatureLayer = FL;
          loadFLDef.resolve();
        });
        loadFLDef.then(function() {
          _this._getSubLayerFeatureLayers(mapServiceLayers, deferred);
        });
      }
      else {
        var promises = [];
        array.forEach(featureLayers, function(layer) {
          if (!layer.loaded) {
            var loadDef = new Deferred();
            on.once(layer, "load, error", function() {
              loadDef.resolve();
            });
            promises.push(loadDef.promise);
          }
        });
        if (promises.length) {
          all(promises).then(function() {
            featureLayers = array.filter(featureLayers, function(layer) {
              return !layer.loadError && layer.isVisibleAtScale(mapScale);
            });
            deferred.resolve(featureLayers);
          });
        }
        else {
          featureLayers = array.filter(featureLayers, function(layer) {
            return layer.isVisibleAtScale(mapScale);
          });
          deferred.resolve(featureLayers);
        }
      }

      return deferred.promise;
    },

    _getLayerUrl: function(serviceUrl, layerId) {
      var result;
      var iq = serviceUrl.indexOf("?");
      if (iq === -1) {
        // append /layerId
        result = serviceUrl + "/" + layerId;
      }
      else {
        // insert /layerId before ?
        result = serviceUrl.substring(0, iq) + "/" + layerId + serviceUrl.substring(iq);
      }
      return result;
    },

    _getOutFields: function(popupTemplate) {
      var result;
      if (popupTemplate.info && popupTemplate.declaredClass === "esri.widgets.PopupTemplate") {
        result = [];
        array.forEach(popupTemplate.info.fieldInfos, function(info) {
          var lcFieldName = info.fieldName && info.fieldName.toLowerCase();
          if (lcFieldName && lcFieldName !== "shape" && lcFieldName.indexOf("relationships/") !== 0) {
            result.push(info.fieldName);
          }
        });
      }
      else {
        result = [ "*" ];
      }
      return result;
    },

    _calculateClickTolerance: function(layers) {
      // take a big symbol offset into consideration
      var tolerance = 6;
      array.forEach(layers, function(layer) {
        var renderer = layer.renderer;
        if (renderer) {
          if (renderer.declaredClass === "esri.renderer.SimpleRenderer") {
            var symbol = renderer.symbol;
            if (symbol && symbol.xoffset) {
              tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
            }
            if (symbol && symbol.yoffset) {
              tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
            }
          }
          else if (renderer.declaredClass === "esri.renderer.UniqueValueRenderer" || renderer.declaredClass === "esri.renderer.ClassBreaksRenderer") {
            array.forEach(renderer.infos, function(info) {
              // kml servlet sometimes returns renderer.infos with no symbol at all
              var symbol = info.symbol;
              if (symbol && symbol.xoffset) {
                tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
              }
              if (symbol && symbol.yoffset) {
                tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
              }
            });
          }
        }
      });
      return tolerance;
    },
    
    //--------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    //--------------------------------------------------------------------------

    _clickHandler: function(event) {
      //console.log("PopupManager - click: graphic =", event.graphic);
      var popup = this.view.popup;
      var graphic = event.graphic;

      if (popup && this.map.loaded && this.view.ready) {
        if (popup.clearFeatures && popup.setFeatures) {
          this._showPopup(event);
        }
        else if (graphic && graphic.getEffectivePopupTemplate()) {
          this._showInfoWindow(graphic, event.mapPoint);
        }
      }
    }

  });
  
  return PopupManager;
});
