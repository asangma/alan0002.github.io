/**
 * ArcGISDynamicLayer allows you to display and analyze layers defined in a dynamic 
 * [map service](http://server.arcgis.com/en/server/latest/publish-services/windows/what-is-a-map-service.htm).
 * Map services generate images on the fly and are hosted on ArcGIS for Server. An instance of ArcGISDynamicLayer 
 * may contain multiple layers and sublayers that serve features, which may be queried or used for spatial analysis.
 * 
 * Map service layers may be cached in tiles for faster display on the client. To display 
 * tiled map service layers, see {@link module:esri/layers/ArcGISTiledLayer ArcGISTiledLayer}.
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 * 
 * @module esri/layers/ArcGISDynamicLayer
 * @since 4.0
 * @see module:esri/layers/ArcGISTiledLayer
 * @see module:esri/Map
 */
define(
[
  "dojo/_base/lang",
  "dojo/io-query",
  "dojo/Deferred",
  
  "../config",
  "../request",
  "../PopupTemplate",

  "../core/urlUtils",
  "../core/promiseUtils",
  
  "./DynamicLayer",
  
  "./mixins/ArcGISDynamicService"
],
function(
  lang, ioq, Deferred,
  esriConfig, esriRequest, PopupTemplate,
  urlUtils, promiseUtils,
  DynamicLayer,
  ArcGISDynamicService
) {

  /**
  * @extends module:esri/layers/DynamicLayer
  * @mixes module:esri/layers/mixins/ArcGISMapService
  * @mixes module:esri/layers/mixins/ArcGISDynamicService
  * @constructor module:esri/layers/ArcGISDynamicLayer
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */
  var ArcGISDynamicLayer = DynamicLayer.createSubclass([ArcGISDynamicService], 
  /** @lends module:esri/layers/ArcGISDynamicLayer.prototype  */                                 
  {
    
    declaredClass: "esri.layers.ArcGISDynamicMapServiceLayer",
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    normalizeCtorArgs: function(url, options) {
      if (typeof url === "string") {
        return lang.mixin({
          url: url
        }, options);
      }
      return url;
    },

    load: function() {
      this.addResolvingPromise(this._fetchService());
    },
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  alwaysRefetch
    //----------------------------------

    /**
     * @private
     */
    alwaysRefetch: false,

    //----------------------------------
    //  popupTemplates
    //----------------------------------

    /**
     * A dictionary from the layer id to the `popupTemplates` object. See the object specifications table below
     * for properties of the `popupTemplates` object. 
     * 
     * @property {module:esri/PopupTemplate} popupTemplate - The popup template for the layer.
     * @property {string} layerUrl - URL to the layer.
     * @property {Object} resourceInfo - Metadata of the layer.
     * 
     * @type {Object}
     */
    popupTemplates: null,

    _popupTemplatesSetter: function(value) {
      var layerIds = value && Object.getOwnPropertyNames(value);

      if (!layerIds || !layerIds.length) {
        return null;
      }

      layerIds.forEach(function(layerId) {
        var popupTemplate = value[layerId].popupTemplate;
        if (popupTemplate && !popupTemplate.declaredClass) {
          value[layerId].popupTemplate = new PopupTemplate(popupTemplate);
        }
      });

      return value;
    },

    
    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------
    
    getImageUrl: function(options, callback) {
      var exportUrl = this.parsedUrl.path + "/export";
      var query = lang.mixin(
        {}, 
        this.parsedUrl.query, 
        this.getExportImageParameters(options),
        {
          f:     "image",
          token: this.token,
          _ts:   this.alwaysRefetch ? (new Date()).getTime() : null
        }
      );
      var queryString = urlUtils.addProxy(exportUrl + "?" + ioq.objectToQuery(query));
      
      // Select response type: f=json or f=image based on the url length
      if (queryString.length > esriConfig.request.maxUrlLength) {
        query.f = "json";
        
        var self = this, 
            promise = esriRequest({
              url:               exportUrl,
              content:           query,
              handleAs:          "json",
              callbackParamName: "callback"
            });
        
        promise.then(
          function(response) {
            callback(
              urlUtils.addProxy(
                // 10.1 servers require token to access output directory URLs as well
                response.href + "?token=" + self.token
              )
            );
          }
        );
      }
      else {
        callback(queryString);
      }
    },

    fetchImage: function(options) {
      var cancelled = false;
      var img;

      var dfd = new Deferred(function() {
        cancelled = true;
        if (img) {
          img = img.onload = img.onerror = img.onabort = null;
        }
      });

      if (!this.supportsRotation) {
        delete options.rotation;
      }

      // get the image url and create an image of it.
      this.getImageUrl(options, function(url) {
        if (cancelled) {
          return;
        }

        img = document.createElement("img");
        img.setAttribute("alt", "");
        img.setAttribute("width", options.width);
        img.setAttribute("height", options.height);

        img.onload = function(event) {
          img.onload = img.onerror = img.onabort = null;
          dfd.resolve({
            options: options,
            img: img
          });
          img = null;
        };
        img.onerror = img.onabort = function(event) {
          img.onload = img.onerror = img.onabort = null;
          // TODO use error interface
          dfd.reject(new Error("Unable to load image: " + img.src));
          img = null;
        };
        
        img.src = url;
      });

      return dfd.promise;
    },
    
    /*
    exportMapImage: function(imageParameters) {
      var map = this.map,
          extent = map && map.extent,
          width = (map && map.width) || 400,
          height = (map && map.height) || 400,
          self = this,

          promise = esriRequest({
            url: this.parsedUrl.path + "/export",
            
            content: lang.mixin(
              {},
              
              this.parsedUrl.query, 
              
              // Capture current layer state
              this._getExportParameters(extent, width + "," + height),
              
              // Apply caller overrides
              imageParameters && imageParameters.toJSON(),
              
              {
                f:     "json",
                token: this.token,
                _ts:   this.alwaysRefetch ? (new Date()).getTime() : null
              }
            ),
            
            handleAs:          "json",
            callbackParamName: "callback"
          });
      
      promise.then(
        function(response) {
          self.emit("map-image-export", {
            mapImage: MapImage.fromJSON(response)
          });
        }
      );
      
      return promise;
    },
    */
    
    /*
    createDynamicLayerInfosFromLayerInfos: function () {
      var dynamicLayerInfos = [], info;
      
      array.forEach(this.layerInfos, function (layerInfo) {
        info = new DynamicLayerInfo(layerInfo.toJSON());
        info.source = new LayerMapSource({ mapLayerId: layerInfo.id });
             
        dynamicLayerInfos.push(info);
      });
      
      return dynamicLayerInfos;
    },
    */
    
    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    _fetchService: function() {
      return promiseUtils.resolve().then(
        function() {
          // return the already provided resourceInfo or fetch them
          return this.resourceInfo || esriRequest({
              url:               this.parsedUrl.path,
              content:           lang.mixin({ f: "json" }, this.parsedUrl.query),
              handleAs:          "json",
              callbackParamName: "callback"
            });
        }.bind(this)
      ).then(
        function(response) {
          // Update URL scheme if the response was obtained via HTTPS
          // See esri/request for context regarding "response._ssl"
          if (response._ssl) {
            delete response._ssl;
            this.url = this.url.replace(/^http:/i, "https:");
          }
          this.read(response);
        }.bind(this)
      );
    }

    // TODO 4.0: dynamicLayers can't be calculated here since it refers to map scale! 
    /*
    _updateDynamicLayers: function () {
      var dynamicLayerInfos = this.dynamicLayerInfos,
          drawingOptions = this.layerDrawingOptions,
          dynamicLayers = [];
      
      // Export operation needs dynamicLayers only when dynamicLayerInfos 
      // and/or layerDrawingOptions is defined by the user.
      if (
        (dynamicLayerInfos && dynamicLayerInfos.length) || 
        (drawingOptions && drawingOptions.length)
      ) {
        var layerId,
            visibleLayers = this.visibleLayers,
            layerDefs = this.layerDefinitions,
            timeOptions = this.layerTimeOptions,
            mapScale = this.map && scaleUtils.getScale(this.map),
            layersAtScale = mapScale 
              ? layerUtils._getLayersForScale(mapScale, dynamicLayerInfos) 
              : visibleLayers;

        array.forEach(dynamicLayerInfos, function (info) {
          // Skip group layers
          if (!info.subLayerIds) {
            layerId = info.id;
            
            // Layer must be visible and visible at the current map scale
            if (
              array.indexOf(visibleLayers, layerId) !== -1 && 
              array.indexOf(layersAtScale, layerId) !== -1
            ) {
              dynamicLayers.push({
                id:       layerId,
                source:   info.source && info.source.toJSON(),
                minScale: info.minScale || 0,
                maxScale: info.maxScale || 0,
                
                drawingInfo: 
                  (
                    drawingOptions && drawingOptions[layerId] && 
                    drawingOptions[layerId].toJSON()
                  ) || 
                  undefined,
                
                layerTimeOptions: 
                  (
                    timeOptions && timeOptions[layerId] && 
                    timeOptions[layerId].toJSON()
                  ) || 
                  undefined,
                
                definitionExpression: 
                  (layerDefs && layerDefs[layerId]) || undefined
              });
            }            
          }
        });
      }
      
      // TODO
      // Should we fire _onDynamicLayerChange event? Perhaps, the legend 
      // widget should use "dynamicLayerInfos-change" event instead?
      
      this._cachedParameters.dynamicLayers = dynamicLayers.length 
        ? JSON.stringify(dynamicLayers)
        : undefined;
    },
    */
   
    /*
    _updateTimeOptions: function() {
      var timeInfo = this.timeInfo,
          timeExtent = this.map && this.map.timeExtent,
          time = timeExtent ? timeExtent.toJSON().join(",") : null,
          timeOptions = this.layerTimeOptions,
          cached = this._cachedParameters;
    
      // Workaround for server version < 10.02 where "some" time-aware
      // layers do not return a valid image if "time" parameter is absent
      if (this.version < 10.02 && timeInfo) {
        if (time) {
          // Restore layer time options to user-defined value
          cached.layerTimeOptions = layerUtils._serializeTimeOptions(timeOptions);
        }
        else {
          // When there is no "time", go ahead and turn off time for all sub-layers
          var ids = [];
          
          // Get all the sub-layer ids
          array.forEach(this.layerInfos, function(info) {
            if (!info.subLayerIds) {
              ids.push(info.id);
            }
          });
              
          if (ids.length) {
            var dupOptions = timeOptions ? timeOptions.slice(0) : [],
                opt;

            // Let's make sure all sub-layers have a corresponding
            // layer time options object
            array.forEach(ids, function(id) {
              if (!dupOptions[id]) {
                opt = new LayerTimeOptions();
                opt.useTime = false;
                
                dupOptions[id] = opt;
              }
            });
            
            cached.layerTimeOptions = layerUtils._serializeTimeOptions(dupOptions, ids);
          }
        }
      }

      // Workaround for server version >= 10.02 where time=null,null
      // will give all the features
      if (this.version >= 10.02 && timeInfo) {
        if (!time && !timeInfo.hasLiveData) {
          cached.time = "null,null";
        }
        
        // From REST API Reference at 10.1:
        // hasLiveData returns a boolean value. If true, export and identify 
        // operations will default the value for time parameter to be 
        // [<current server time - defaultTimeWindow>, <current server time>]
        // http://nil/rest-docs/mapserver.html
      }
      
      // It is possible that we don't need this workaround beyond
      // 10.02 but not sure if this will be completely fixed at 10.1
    }
    */

  });
  
  return ArcGISDynamicLayer;  
});
