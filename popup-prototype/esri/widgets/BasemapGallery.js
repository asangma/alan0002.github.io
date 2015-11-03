define(
[
  "require",

  "dojo/_base/array",
  "dojo/_base/lang",
  "dojo/_base/kernel",

  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/on",

  "dijit/_Widget",
  "dijit/_Templated",

  "../kernel",
  "../core/declare",
  "../core/promiseList",
  "../core/urlUtils",
  "../request",
  "../geometry/Extent",

  "../virtualearth/VETiledLayer",
  "../layers/OpenStreetMapLayer",

  "../layers/ArcGISTiledLayer",
  "../layers/ArcGISDynamicLayer",
  "../layers/WebTiledLayer",
  "../layers/support/TileInfo",

  "../layers/ArcGISImageServiceLayer",
  
  "../layers/support/ImageServiceParameters",

  "./Basemap",
  "./Widget",

  "dojo/text!./templates/BasemapGallery.html"
], function(
  require,
  array, lang, kernel,
  dom, domConstruct, domClass, on,
  _Widget, _Templated,
  esriKernel, declare, promiseList, urlUtils, esriRequest, Extent,
  VETiledLayer, OpenStreetMapLayer,
  ArcGISTiledLayer, ArcGISDynamicLayer, WebTiledLayer, TileInfo,
  ArcGISImageServiceLayer,
  ImageServiceParameters,
  Basemap, Widget,
  widgetTemplate
) {

  var BMG = declare([ Widget, _Widget, _Templated], {
    declaredClass: "esri.widgets.BasemapGallery",

    // Let the dijit framework know that the template for this dijit 
    // uses other dijits such as BorderContainer, StackContainer, Grid etc
    widgetsInTemplate: true,

    // Let the dijit framework know the location of the template file where
    // the UI for this dijit is defined 
    // templatePath: dojo.moduleUrl("esri.widgets", "templates/BasemapGallery.html"),
    // templatePath: require.toUrl("./templates/BasemapGallery.html"),
    templateString: widgetTemplate, 

    // Path to the folder containing the resources used by this dijit.
    // This can be used to refer to images in the template or other
    // resources
    // 
    // require.toUrl does the same thing as dojo.moduleUrl 
    // but doesn't add a trailing slash
    basePath: require.toUrl(".") + "/",

    /********************
     * Public properties
     ********************/

    // widget has loaded ArcGIS.com basemaps
    loaded: false,

    // list of all basemaps, for user to see
    basemaps: [],

    // user provided Bing Maps key
    bingMapsKey: null,

    // Implicit public properties: flowContainer
    flowContainer: null,

    /**********************
     * Internal Properties
     **********************/

    // build a UI or not
    _hasUI: false,

    // currently selected basemap
    _selectedBasemap: null,
    
    _selectBasemapInProgress: false,

    /********************
     * Overridden Methods
     ********************/

    constructor: function (params, srcNodeRef) {
      params = params || {};

      if (!params.map) {
        console.error("esri.widgets.BasemapGallery: Unable to find the 'map' property in parameters");
      }

      /**************************
       * Configurable Properties
       **************************/

      this.map = params.map; // REQUIRED
      this._hasUI = srcNodeRef ? true : false;
      this.bingMapsKey = (params.bingMapsKey && params.bingMapsKey.length > 0) ? params.bingMapsKey : null;
      this.showArcGISBasemaps = (params.showArcGISBasemaps === false) ? false : true;
      this.basemaps = params.basemaps || [];
      this.basemapIds = params.basemapIds;
      this.referenceIds = params.referenceIds;
      this.basemapsGroup = params.basemapsGroup;
      
      // arcgisUrl e.g. "http://www.arcgis.com"
      this.arcgisUrl = esriKernel.dijit._arcgisUrl;
      if (params.portalUrl) {
        this.arcgisUrl = params.portalUrl + "/sharing/rest";
      }
      if (this.arcgisUrl.indexOf("://") < 0) {
        this.arcgisUrl = window.location.protocol + "//" + this.arcgisUrl;
      } else if (window.location.protocol === "https:") {
        this.arcgisUrl = this.arcgisUrl.replace('http:', 'https:');
      }

      this.init();
    },

    init: function () {
      // overriding methods typically call their implementation up the inheritance chain
      this.inherited(arguments);

      // don't check here if Bing Maps Key is available for Bing Maps. 
      array.forEach(this.basemaps, function (basemap, i) {
        if (!basemap.id || basemap.id.length === 0) {
          basemap.id = this._getUniqueId();
        }
        array.forEach(basemap.layers, function (layer) {
          layer.opacity = (layer.opacity >= 0) ? layer.opacity : 1;
          layer.visibility = true;
        }, this);
      }, this);

      if (this.basemapIds && this.basemapIds.length > 0) {
        array.forEach(this.basemapIds, function (basemapId) {
          var layer = this.map.getLayer(basemapId);
          layer._basemapGalleryLayerType = "basemap";
        }, this);
      }
      if (this.referenceIds && this.referenceIds.length > 0) {
        array.forEach(this.referenceIds, function (referenceId) {
          var layer = this.map.getLayer(referenceId);
          layer._basemapGalleryLayerType = "reference";
        }, this);
      }

      if (this.basemapsGroup && ((this.basemapsGroup.owner && this.basemapsGroup.title) || this.basemapsGroup.id)) {
          this._findCustomBasemapsGroup(lang.hitch(this, "_handleArcGISBasemapsResponse"));
      } else {
        if (this.showArcGISBasemaps) {
          this._findArcGISBasemapsGroup(lang.hitch(this, "_handleArcGISBasemapsResponse"));
        } else {
          this._finishStartup();
        }
      }
    },

    /*****************
     * Public Methods
     *****************/

    startup: function () {
      this.inherited(arguments);

      if (this.loaded) {
        this._refreshUI();
      } else {
        this.on("load", lang.hitch(this, function () {
          this._refreshUI();
        }));
      }
    },

    select: function (id) {
      this._select(id);
    },

    getSelected: function () {
      return this._selectedBasemap;
    },

    get: function (id) {
      var i;
      for (i = 0; i < this.basemaps.length; i++) {
        if (this.basemaps[i].id == id) {
          return this.basemaps[i];
        }
      }
      return null;
    },

    add: function (basemap) {
      if (basemap && !basemap.id) {
        basemap.id = this._getUniqueId();
        this.basemaps.push(basemap);
        this._refreshUI();
        this.emitAdd(basemap);
        return true;
      } else if (basemap && this._isUniqueId(basemap.id)) {
        this.basemaps.push(basemap);
        this._refreshUI();
        this.emitAdd(basemap);
        return true;
      }
      return false;
    },

    remove: function (id) {
      var i;
      for (i = 0; i < this.basemaps.length; i++) {
        var basemap = this.basemaps[i];
        if (basemap.id === id) {
          if (this._selectedBasemap && this._selectedBasemap.id === basemap.id) {
            this._selectedBasemap = null;
          }
          this.basemaps.splice(i, 1);
          this._refreshUI();
          this.emit("remove", {
            basemap: basemap
          });
          return basemap;
        }
      }
      return null;
    },

    /*****************
     * Events
     *****************/

    emitAdd: function (basemap) {
      //summary: When new basemap is added to list
      this.emit("add", {
        basemap: basemap
      });
    },

    emitError: function (msg) {
      //summary: Error: Event fired whenever there is an error
      this.emit("error", {
        message: msg
      });
    },

    /*******************
     * Internal Methods
     *******************/

    _defaultBasemapGalleryGroupQuery: "title:\"ArcGIS Online Basemaps\" AND owner:esri",
    _basemapGalleryGroupQuery: null, 

    _finishStartup: function () {

      this.loaded = true;
      this.emit("load");

      // if map is empty add first basemap
      if (this.map.layerIds.length === 0 && this.basemaps.length > 0 && !this._selectBasemapInProgress) {
        this._select(this.basemaps[0].id);
      }
    },

    _findCustomBasemapsGroup: function (handler) {

      if (this.basemapsGroup && this.basemapsGroup.id) {
        this._findArcGISBasemaps(this.basemapsGroup.id, handler);
      } else {
        this._basemapGalleryGroupQuery = "title:\""+this.basemapsGroup.title+"\" AND owner:"+this.basemapsGroup.owner;
        this._findArcGISBasemapsGroup(handler);
      }
    },

    _findArcGISBasemapsGroup: function (handler) {
       
      if (!this._basemapGalleryGroupQuery) {
        // make self call to get group name and owner

        var url = this.arcgisUrl + "/accounts/self";
        var params = {};
        params.f = "json";
        params.culture = kernel.locale;
        esriRequest({
          url: url,
          content: params,
          callbackParamName: "callback",
          load: lang.hitch(this, function (response, args) {
            if (response && response.basemapGalleryGroupQuery) {
              this._basemapGalleryGroupQuery = response.basemapGalleryGroupQuery;
            } else {
              this._basemapGalleryGroupQuery = this._defaultBasemapGalleryGroupQuery;
            }
            this._findArcGISBasemapsGroupContent(handler);
          }),
          error: lang.hitch(this, function (response, args) {
            this._basemapGalleryGroupQuery = this._defaultBasemapGalleryGroupQuery;
          })
        });
      } else {
        this._findArcGISBasemapsGroupContent(handler);
      }
    },

    _findArcGISBasemapsGroupContent: function (handler) {
      // find group id from name+owner
      var findArcGISBasemaps = lang.hitch(this, "_findArcGISBasemaps");

      var url = this.arcgisUrl + "/community/groups";
      var params = {};
      params.q = this._basemapGalleryGroupQuery;
      params.f = "json";
      esriRequest({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: lang.hitch(this, function (response, args) {
          if (response.results.length > 0) {
            findArcGISBasemaps(response.results[0].id, handler);
          } else {
            var msg = "esri.widgets.BasemapGallery: could not find group for basemaps.";
            this.emitError(msg);
          }
        }),
        error: lang.hitch(this, function(error) {
          var msg = "esri.widgets.BasemapGallery: could not find group for basemaps.";
          this.emitError(msg);
        })
      });
    },

    _findArcGISBasemaps: function (groupId, handler) {
      // find web maps in group
      var url = this.arcgisUrl + "/search";
      var params = {};
      params.q = "group:" + groupId + " AND type:\"web map\"";
      params.sortField = "name";
      params.sortOrder = "desc";
      params.num = 50;
      params.f = "json";
      esriRequest({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: lang.hitch(this, function (response, args) {
          if (response.results.length > 0) {
            handler(response.results);
          } else {
            var msg = "esri.widgets.BasemapGallery: could not find group for basemaps.";
            this.emitError(msg);
          }
        }),
        error: lang.hitch(this, function (response, args) {
          var msg = "esri.widgets.BasemapGallery: could not find group for basemaps.";
          this.emitError(msg);
        })
      });
    },

    _handleArcGISBasemapsResponse: function (items) {

      if (items.length > 0) {
        // build basemaps list
        array.forEach(items, function (item, i) {
          // we don't want to get all web map configs to check if it's Bing. Just use the title.
          // only add Bing Maps if a Bing Maps Key is available
          if (this.bingMapsKey || (!this.bingMapsKey && item.title && item.title.indexOf("Bing Maps") == -1)) {
            var params = {};
            params.id = this._getUniqueId();
            params.title = item.title;
            // thumbnail
            params.thumbnailUrl = "";
            if (item.thumbnail && item.thumbnail.length) {
              params.thumbnailUrl = (this.arcgisUrl + "/content/items/" + item.id + "/info/" + item.thumbnail);
              if (esriKernel.id) {
                var credentials = esriKernel.id.findCredential(urlUtils.urlToObject(this.arcgisUrl).path);
                if (credentials) {
                  params.thumbnailUrl += "?token=" + credentials.token;
                }
              }
            }
            // we don't know the layers yet
            params.itemId = item.id;
            var basemap = new Basemap(params, this);
            // add ArcGIS.com basemaps in front of user basemaps
            this.basemaps.splice(0, 0, basemap);
          }
        }, this);

        this._finishStartup();
      }
    },

    _refreshUI: function () {
      if (this._hasUI) {
        domConstruct.empty(this.flowContainer);

        array.forEach(this.basemaps, function (basemap, i) {
          if (!basemap.id) {
            basemap.id = "basemap_" + i;
          }
          // we don't want to get all web map configs to check if it's Bing. Just use the title.
          this.flowContainer.appendChild(this._buildNodeLayout(basemap));
        }, this);

        domConstruct.create("br", {
          style: {
            clear: "both"
          }
        }, this.flowContainer);

        this._markSelected(this._selectedBasemap);
      }
    },

    _buildNodeLayout: function (basemap) {

      var nId = this.id + "_galleryNode_" + basemap.id;
      var n = domConstruct.create("div", {
        id: nId,
        "class": "esri-basemap-gallery-node"
      });

      var anchor = domConstruct.create("a", {
        href: "javascript:void(0);"
      }, n);
      on(anchor, "click", lang.hitch(this, "_onNodeClick", basemap));
      var labelText = basemap.title || "";
      if (basemap.thumbnailUrl) {
        domConstruct.create("img", {
          "class": "esri-basemap-gallery-thumbnail",
          src: basemap.thumbnailUrl,
          title: labelText,
          alt: labelText
        }, anchor);
      } else {
        domConstruct.create("img", {
          "class": "esri-basemap-gallery-thumbnail",
          src: this.basePath.toString() + "images/transparent.gif",
          title: labelText,
          alt: labelText
        }, anchor);
      }

      var label = domConstruct.create("div", {
        "class": "esri-basemap-gallery-label-container"
      }, n);
      domConstruct.create("span", {
        innerHTML: labelText,
        alt: labelText,
        title: labelText
      }, label);

      return n;
    },

    _onNodeClick: function (basemap, e) {
      e.preventDefault();

      this._markSelected(basemap);
      this.select(basemap.id);
    },

    _markSelected: function (basemap) {
      if (basemap) {
        // unselect all basemap gallery items
        array.forEach(kernel.query(".esri-basemap-gallery-selected-node", this.domNode), function (node) {
          domClass.remove(node, "esri-basemap-gallery-selected-node");
        });
        // select current basemap gallery item
        var basemapNode = dom.byId(this.id + "_galleryNode_" + basemap.id);
        if (basemapNode) {
          domClass.add(basemapNode, "esri-basemap-gallery-selected-node");
        }
      }
    },

    _select: function (id) {

      this._selectBasemapInProgress = true;
      var basemap = this.get(id);
      if (basemap) {
        if (basemap.layers) {
          this._getServiceInfos(basemap);
        } else {
          var returnValue = basemap.getLayers(this.arcgisUrl);
          if (lang.isArray(returnValue)) {
            this._getServiceInfos(basemap);
          } else { // returnValue instanceof dojo.Deferred
            returnValue.then(lang.hitch(this, function(layers){
              this._getServiceInfos(basemap);
            }));
          }
        }
        this._markSelected(basemap);
      } else {
        this._selectBasemapInProgress = false;
      }
    },

    _getServiceInfos: function (basemap) {

      if (location.protocol == "https:") {
        array.forEach(basemap.layers, function(layer){
          if (this._isAgolService(layer.url) || this._isHostedService(layer.url)) {
            layer.url = layer.url.replace('http:', 'https:');
          }
        }, this);
      }
      
      this._selectedBasemap = basemap;

      var deferreds = [];
      array.forEach(basemap.layers, function (baseMapLayer) {
        if (baseMapLayer.url && baseMapLayer.url.length > 0 && !baseMapLayer.isReference && !baseMapLayer.type) {
          // ArcGIS Server
          baseMapLayer.deferredsPos = deferreds.length;
          deferreds.push(this._getServiceInfo(baseMapLayer.url));
        }
      }, this);

      if (deferreds.length > 0) {
        promiseList(deferreds).then(lang.hitch(this, function (response) {
          // @javi5947
          // disable this code for hydra as setExtent function is not defined

/*
          var sumExtent = null;
          array.forEach(basemap.layers, function (baseMapLayer) {
            if (baseMapLayer.deferredsPos === 0 || baseMapLayer.deferredsPos) {
              baseMapLayer.serviceInfoResponse = response[baseMapLayer.deferredsPos][1];
              var ext = baseMapLayer.serviceInfoResponse.fullExtent;
              if (!ext) {
                ext = baseMapLayer.serviceInfoResponse.extent;
              }
              if (!sumExtent) {
                sumExtent = new Extent(ext);
              } else {
                sumExtent = sumExtent.union(new Extent(ext));
              }
            }
          }, this);

          if (this.map.extent) {
            var percent = this._getIntersectionPercent(sumExtent, this.map.extent);
            if (percent < 5) {
              this.map.setExtent(sumExtent, true);
            }
          } // else map is empty
*/

          this._switchBasemapLayers(basemap);
          this._updateReferenceLayer(basemap);
        }));
      } else {
        // no ArcGIS services as basemap layers
        this._switchBasemapLayers(basemap);
        this._updateReferenceLayer(basemap);
      }
    },

    _switchBasemapLayers: function (basemap) {
      // projections and tiles must fit, no check here
      var layers = basemap.layers;
      if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0 && (layers[0].type === "OpenStreetMap" || (layers[0].type && layers[0].type.indexOf("BingMaps") > -1) || layers[0].type === "WebTiledLayer")) {
        var msg = "esri.widgets.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
        this.emitError(msg);
        return;
      }

      // before removing current basemap make sure we have a key for bing maps
      array.forEach(layers, function (baseMapLayer) {
        if (!baseMapLayer.isReference && baseMapLayer.type && baseMapLayer.type.indexOf("BingMaps") > -1 && !this.bingMapsKey) {
          var msg = "esri.widgets.BasemapGallery: Invalid Bing Maps key.";
          this.emitError(msg);
          return;
        }
      }, this);

      this._removeBasemapLayers();

      var count = 0;
      array.forEach(layers, function (baseMapLayer) {

        if (!baseMapLayer.isReference) {
          var layer, msg;
          if (baseMapLayer.type === "OpenStreetMap") {
            // OpenStreetMap
            if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0) {
              msg = "esri.widgets.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
              this.emitError(msg);
              return;
            }

            layer = new OpenStreetMapLayer({
              id: "layer_osm",
              opacity: baseMapLayer.opacity
            });

          } else if (baseMapLayer.type && baseMapLayer.type.indexOf("BingMaps") > -1) {
            // Bing  
            if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0) {
              msg = "esri.widgets.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
              this.emitError(msg);
              return;
            }

            var style = VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS; // type == "BingMapsHybrid"
            if (baseMapLayer.type == "BingMapsAerial") {
              style = VETiledLayer.MAP_STYLE_AERIAL;
            } else if (baseMapLayer.type == "BingMapsRoad") {
              style = VETiledLayer.MAP_STYLE_ROAD;
            }

            // load as Bing layer
            layer = new VETiledLayer({
              id: "layer_bing",
              bingMapsKey: this.bingMapsKey,
              mapStyle: style,
              opacity: baseMapLayer.opacity
            });

          } else if (baseMapLayer.type == "WebTiledLayer") {
            // web tiled layer
            if (this.map.layerIds.length > 0 && this.map.getNumLevels() === 0) {
              msg = "esri.widgets.BasemapGallery: Unable to switch basemap because new basemap is a tiled service and cannot be loaded as a dynamic layer.";
              this.emitError(msg);
              return;
            }
            layer = new WebTiledLayer(baseMapLayer.templateUrl, {
              visible: baseMapLayer.visibility,
              opacity: baseMapLayer.opacity,
              copyright: baseMapLayer.copyright,
              fullExtent: baseMapLayer.fullExtent,
              initialExtent: baseMapLayer.initialExtent || baseMapLayer.fullExtent,
              subDomains: baseMapLayer.subDomains,
              tileInfo: baseMapLayer.tileInfo ? (new TileInfo(baseMapLayer.tileInfo)) : null,
              tileServers: baseMapLayer.tileServers
            });

          } else if (baseMapLayer.serviceInfoResponse && baseMapLayer.serviceInfoResponse.mapName) {
            // map service
            if ((this.map.layerIds.length === 0 || this.map.getNumLevels() > 0) && baseMapLayer.serviceInfoResponse.singleFusedMapCache === true) {
              // map is empty or has a zoom level slider
              layer = this._loadAsCached(baseMapLayer);
            } else {
              layer = this._loadAsDynamic(baseMapLayer);
            }

          } else if (baseMapLayer.serviceInfoResponse && baseMapLayer.serviceInfoResponse.pixelSizeX) {
            // image service
            var imageServiceParameters = new ImageServiceParameters();
            imageServiceParameters.bandIds = baseMapLayer.bandIds;
            if (!baseMapLayer.bandIds && baseMapLayer.serviceInfoResponse.bandCount && parseInt(baseMapLayer.serviceInfoResponse.bandCount) > 3) {
              imageServiceParameters.bandIds = [0, 1, 2];
            }
            layer = new ArcGISImageServiceLayer(baseMapLayer.url, {
              resourceInfo: baseMapLayer.serviceInfoResponse,
              opacity: baseMapLayer.opacity,
              visible: baseMapLayer.visibility,
              imageServiceParameters: imageServiceParameters
            });
          }

          if (layer) {
            layer._basemapGalleryLayerType = "basemap";
            this.map.addLayer(layer, count);
            count++;
          }
        }
      }, this);

      this._selectBasemapInProgress = false;
      this.emit("selection-change");
    },

    // remove all layers of type basemap
    _removeBasemapLayers: function () {
      // Feature Layer cannot be a Basemap
      var layerIds = this.map.layerIds;
      var removeList = [];
      array.forEach(layerIds, function (id) {
        var layer = this.map.getLayer(id);
        if (layer._basemapGalleryLayerType === "basemap") {
          removeList.push(layer);
        }
      }, this);
      if (removeList.length === 0 && layerIds.length > 0) {
        // no type specification on the layer; remove first layer in list
        removeList.push(this.map.getLayer(layerIds[0]));
      }

      if (removeList.length > 0) {
        array.forEach(removeList, function (layer) {
          this.map.removeLayer(layer);
        }, this);
      } // else map could have no layers
    },

    _updateReferenceLayer: function (basemap) {
      var i;
      this._removeReferenceLayer();

      for (i = 0; i < basemap.layers.length; i++) {
        if (basemap.layers[i].isReference === true) {
          this._addReferenceLayer(basemap.layers[i]);
        }
      }
    },

    _removeReferenceLayer: function () {
      var i;
      // only map services and image services supported
      for (i = this.map.layerIds.length-1; i >= 0; i--) {
        var id = this.map.layerIds[i];
        var layer = this.map.getLayer(id);
        if (layer._basemapGalleryLayerType === "reference") {
          this.map.removeLayer(layer);
        }
      }
    },

    _addReferenceLayer: function (baseMapLayer) {
      // only map services and image services supported as reference layers
      this._getServiceInfo(baseMapLayer.url, lang.hitch(this, "_handleReferenceServiceInfoResponse", baseMapLayer));
    },

    _handleReferenceServiceInfoResponse: function (baseMapLayer, serviceInfoResponse, args) {
      var layer;
      baseMapLayer.serviceInfoResponse = serviceInfoResponse;
      if (serviceInfoResponse && serviceInfoResponse.mapName) {
        // map service
        if (serviceInfoResponse.singleFusedMapCache === true) {
          layer = this._loadAsCached(baseMapLayer);
        } else {
          layer = this._loadAsDynamic(baseMapLayer);
        }

      } else if (serviceInfoResponse && serviceInfoResponse.pixelSizeX) {
        // image service
        var imageServiceParameters = new ImageServiceParameters();
        imageServiceParameters.bandIds = baseMapLayer.bandIds;
        if (!baseMapLayer.bandIds && serviceInfoResponse.bandCount && parseInt(serviceInfoResponse.bandCount) > 3) {
          imageServiceParameters.bandIds = [0, 1, 2];
        }
        layer = new ArcGISImageServiceLayer(baseMapLayer.url, {
          resourceInfo: serviceInfoResponse,
          opacity: baseMapLayer.opacity,
          visible: baseMapLayer.visibility,
          imageServiceParameters: imageServiceParameters
        });
      }

      if (layer) {
        layer._basemapGalleryLayerType = "reference";
        this.map.addLayer(layer);
      }

    },

    _getServiceInfo: function (url, handler) {

      var params = {};
      params.f = "json";
      var request = esriRequest({
        url: url,
        content: params,
        callbackParamName: "callback",
        load: function (response, args) {
          if (handler) {
            handler(response, args);
          }
        },
        error: lang.hitch(this, function(response, args) {
          var msg = "esri.widgets.BasemapGallery: service not accessible.";
          this.emitError(msg);
        })
      });
      return request;
    },

    _loadAsCached: function (baseMapLayer) {

      var serviceLods = [];
      if (!baseMapLayer.displayLevels) {
        serviceLods = array.map(baseMapLayer.serviceInfoResponse.tileInfo.lods, function (lod) {
          return lod.level;
        });
      }
      var exclusionAreas = null;
      if (baseMapLayer.exclusionAreas && baseMapLayer.exclusionAreas.length) {
        exclusionAreas = [];
        array.forEach(baseMapLayer.exclusionAreas, function(eArea){
          exclusionAreas.push({
            minZoom: eArea.minZoom,
            maxZoom: eArea.maxZoom,
            minScale: eArea.minScale,
            maxScale: eArea.maxScale,
            geometry: new Extent(eArea.geometry)
          });
        });
      }
      var layer = new ArcGISTiledLayer(baseMapLayer.url, {
        resourceInfo: baseMapLayer.serviceInfoResponse,
        opacity: baseMapLayer.opacity,
        visible: baseMapLayer.visibility,
        exclusionAreas: exclusionAreas,     
        displayLevels: baseMapLayer.displayLevels || serviceLods
      });
      return layer;
    },

    _loadAsDynamic: function (baseMapLayer) {

      var layer = new ArcGISDynamicLayer(baseMapLayer.url, {
        resourceInfo: baseMapLayer.serviceInfoResponse,
        opacity: baseMapLayer.opacity,
        visible: baseMapLayer.visibility
      });
      if (baseMapLayer.visibleLayers) {
        layer.setVisibleLayers(baseMapLayer.visibleLayers);
      }
      return layer;
    },

    // return percentage value on how much the new extent overlaps the map extent
    _getIntersectionPercent: function (newExtent, mapExtent) {
      // make sure defaultExtent is partially inside mapExtent
      var intersects = mapExtent.intersects(newExtent);
      if (intersects) {
        // new extent overlaps current map extent
        // if intersection covers only 5% or less of the current map extent zoom
        // otherwise don't zoom
        var areaIntersection = intersects.getWidth() * intersects.getHeight();
        var areaMapExtent = mapExtent.getWidth() * mapExtent.getHeight();
        return (areaIntersection / areaMapExtent) * 100;
      } else {
        return 0;
      }
    },

    _getIds: function () {
      var ids = [];
      array.forEach(this.basemaps, function (basemap) {
        ids.push(basemap.id);
      }, this);
      return ids;
    },

    _getUniqueId: function () {
      var usedIds = "," + this._getIds().toString() + ",";
      var count = 0;
      while (true) {
        if (usedIds.indexOf(",basemap_" + count + ",") > -1) {
          count++;
        } else {
          return "basemap_" + count;
        }
      }
    },

    _isUniqueId: function (id) {
      var usedIds = "," + this._getIds().toString() + ",";
      if (usedIds.indexOf("," + id + ",") === -1) {
        return true;
      }
      return false;
    },

    _isAgolService: function(url){
      if (!url) {
        return false;
      }

      var isAgolService = false;
      var esriGeowConfig;
      if(typeof window["esriGeowConfig"] === "undefined"){
        // Hardcode the main https domains for local use (portal param)
        esriGeowConfig = {
          httpsDomains: ["arcgis.com", "arcgisonline.com"]
        };
      }
      else {
        esriGeowConfig = window["esriGeowConfig"];
      }

      array.forEach(esriGeowConfig.httpsDomains, function (domain) {
        if (url.indexOf("." + domain + "/") > -1 || url.indexOf("/" + domain + "/") > -1) {
          isAgolService = true;
        }
      });
      return isAgolService;
      // Agol service: http://services.arcgisonline.com or http://server.arcgisonline.com
      //return (url.indexOf("/services.arcgisonline.com/") !== -1 || url.indexOf("/server.arcgisonline.com/") !== -1);
    },

    _isHostedService: function(url){
      if (!url) {
        return false;
      }
      return (url.indexOf(".arcgis.com/") !== -1);
    }
  });

  return BMG;
});
