/**
 * The ArcGISTiledLayer allows you work with a cached [map service](http://server.arcgis.com/en/server/latest/publish-services/windows/what-is-a-map-service.htm) exposed by the ArcGIS Server REST API and add it to 
 * a {@link module:esri/Map} as a tiled layer. 
 * A cached service accesses tiles from a cache instead of dynamically rendering images. 
 * Because they are cached, tiled layers render faster than dynamic layers. To create an 
 * instance of ArcGITSTiledLayer, you must reference the URL of the cached map service.
 * 
 * ```js
 * require(["esri/layers/ArcGISTiledLayer"], function(ArcGISTiledLayer) { 
 *   var layer = new ArcGISTiledLayer({
 *     url: "http://services.arcgisonline.com/arcgis/rest/services/World_Terrain_Base/MapServer";
 *   });
 *   //Add layer to map
 * });
 * ```
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 * 
 * To display a map service as a dynamic layer, see {@link module:esri/layers/ArcGISDynamicLayer ArcGISDynamicLayer}. 
 * To learn more about tiled layers in general, see {@link module:esri/layers/TiledLayer}.
 * 
 * @module esri/layers/ArcGISTiledLayer
 * @since 4.0
 * @see module:esri/layers/ArcGISDynamicLayer
 * @see module:esri/Map
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "dojo/io-query",

  "../request",
  
  "../core/urlUtils",
  "../core/promiseUtils",
  
  "../geometry/SpatialReference",
  
  "./TiledLayer",
  
  "./mixins/ArcGISMapService",
  "./mixins/ArcGISCachedService"
],
function(
  declare, lang,
  ioq,
  esriRequest,
  urlUtils, promiseUtils,
  SpatialReference,
  TiledLayer,
  ArcGISMapService, ArcGISCachedService
) {    
      
  /**
  * @extends module:esri/layers/TiledLayer
  * @mixes module:esri/layers/mixins/ArcGISMapService
  * @mixes module:esri/layers/mixins/ArcGISCachedService 
  * @constructor module:esri/layers/ArcGISTiledLayer
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */      
  var ArcGISTiledLayer = declare([ TiledLayer, ArcGISMapService, ArcGISCachedService ], 
  /** @lends module:esri/layers/ArcGISTiledLayer.prototype */                               
  {
    declaredClass: "esri.layers.ArcGISTiledLayer",

    classMetadata: {
      reader: {
        // Cached image services at 10.1 do not have response.spatialReference
        // Lets fake add a new SR property to force create it.
        add: ["spatialReference"]
      }
    },

    _mapsWithAttribution: [
      "Canvas/World_Dark_Gray_Base",
      "Canvas/World_Dark_Gray_Reference",
      "Canvas/World_Light_Gray_Base",
      "Canvas/World_Light_Gray_Reference",
      "Elevation/World_Hillshade",
      "Ocean/World_Ocean_Base",
      "Ocean/World_Ocean_Reference",
      "Ocean_Basemap",
      "Reference/World_Boundaries_and_Places",
      "Reference/World_Boundaries_and_Places_Alternate",
      "Reference/World_Transportation",
      "World_Imagery",
      "World_Street_Map",
      "World_Topo_Map"
    ],

    // TODO
    // Why is this here?
    _TILE_FORMATS: { 
      PNG:  "png", 
      PNG8: "png", 
      PNG24:"png", 
      PNG32:"png", 
      JPG:  "jpg", 
      JPEG: "jpg", 
      GIF:  "gif" 
    },

    // TODO
    // Why is this here?
    _attributionServices: [
      "services.arcgisonline.com/arcgis/rest/services",
      "servicesdev.arcgisonline.com/arcgis/rest/services",
      "servicesqa.arcgisonline.com/arcgis/rest/services"
    ],

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    normalizeCtorArgs: function(url, options) {
      if (typeof url === "string") {
        return lang.mixin({}, {
          url: url
        }, options);
      }
      return url;
    },
    
    getDefaults: function(kwArgs) {
      var url = kwArgs.url;

      // Only selected online services have default attribution and tileServers
      var attribution = null;
      var tileServers = [];
      if (url) {
        var parsedUrl = urlUtils.urlToObject(kwArgs.url);
        var path = parsedUrl.path.toLowerCase();
        attribution = this._getDefaultAttribution(this._getMapName(path));
        tileServers = this._getDefaultTileServers(path);
      }

      return lang.mixin(this.inherited(arguments), {
        tileServers:        tileServers,
        attributionDataUrl: attribution,
        hasAttributionData: !!attribution
      });
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
    
    //----------------------------------
    //  tileServers
    //----------------------------------

    /**
     * An array of tile servers used for changing map tiles.
     * 
     * @type {string[]}
     */
    tileServers: null,

    _tileServersSetter: function(value) {
      return Array.isArray(value) ?
        value.map(function(url) {
          return urlUtils.urlToObject(url).path;
        }) :
        null;
    },
    
    //----------------------------------
    //  spatialReference
    //----------------------------------
    
    // Cached image services at 10.1 do not have response.spatialReference
    // Let's use tileInfo.spatialReference
    // This issue is fixed at 10.1 SP 1

    _spatialReferenceReader: function(value, source) {
      value = value || (source.tileInfo && source.tileInfo.spatialReference);
      
      return value && new SpatialReference(value);
    },
      
    /**
     * The URL of the REST endpoint of the layer. The URL may either point to a
     * resource on ArcGIS for Server, Portal for ArcGIS, or ArcGIS Online.
     *
     * @name url
     * @instance
     * @type {string}
     * @example
     * //URL points to a cached tiled map service hosted on ArcGIS Server
     * var layer = new ArcGISTiledLayer({
     *  url: "http://services.arcgisonline.com/arcgis/rest/services/World_Terrain_Base/MapServer";
     * });
     */


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    getTileUrl: function(level, row, col) {
      // Using "Column ID" for tileServer selection may lead to relatively faster
      // exhaustion of a server's max connection limit - given that tiled.js or 
      // the implementation that calls this method does so in "column major"
      // order fashion i.e. outer loop iterating through columns and inner
      // loop iterating through rows. Consider this pattern for example:
      //   1  2  3  4  1  2
      //   1  2  3  4  1  2
      //   1  2  3  4  1* 2*
      //   1  2  3  4  1* 2*
      // Numbers 1 through 4 indicate the tileServer indices.
      // * indicates blocking request (assuming Firefox that has max connection
      // limit of 6)
      
      // Using "Row ID" on the other hand is better because the servers are
      // exhausted equally (relatively) with respect to each other.
      // For the example above, using row id will yield the following pattern:
      //   1  1  1  1  1  1
      //   2  2  2  2  2  2
      //   3  3  3  3  3  3
      //   4  4  4  4  4  4
      // Note that there is no blocking in this pattern.
      // But it under-utilizes the tileServers if the map height is such 
      // that it displays only 2 rows where we have a total of 4 tile servers. 
      // This is bound to happen when using "Col ID" as well.

      // Ideally we would want a selection algorithm that has the distribution
      // characteristics of using an ever incrementing counter but also maximizes
      // the cache hit ratio. Granted, it's hard to come up with an algorithm
      // that can satisfy these two factors equally for varying map control size,
      // browser connection limit and number of tileServers. Here are some thoughts
      // on measuring the overall efficiency:
      // - Distribution (number of requests served by a server over a period of time)
      // - Avg latency of individual tileServers over a period of time
      // - Max idle time (how long a server sits idle without handling a request)
      // - Total idle time
      // - Raw computational efficiency of the algorithm
      
      // The new algorithm based on "Row ID" will not necessarily load tiles 
      // faster than before but it certainly avoids trashing the browser's cache 
      // by mapping tiles to a certain tileServer consistently.

      // TODO
      // Some of the code here can be moved to TiledLayer.js
      
      var servers = this.tileServers,
      
          query = lang.mixin(
            {}, 
            this.parsedUrl.query, 
            {
              token:     this.token,
              blankTile: (this.resampling && !this.tileMap && this.supportsBlankTile) ? false : null,
              _ts:       this.refreshTimestamp
            }
          ),
          
          tileUrl = ((servers && servers.length) ? servers[row % servers.length] : this.parsedUrl.path) 
                    + "/tile/" + level 
                    + "/" + row 
                    + "/" + col;

      query = ioq.objectToQuery(query);
      tileUrl += (query ? ("?" + query) : "");
      
      return urlUtils.addProxy(tileUrl);
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //----------------------------------------------------------------------

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
    },
    
    _getMapName: function(url) {
      var match = url.match(/^https?\:\/\/(server|services)\.arcgisonline\.com\/arcgis\/rest\/services\/([^\/]+(\/[^\/]+)*)\/mapserver/i);
      return  match && match[2];
    },
    
    _getDefaultAttribution: function(mapName) {
      if (!mapName) {
        return;
      }

      var attributionMapName;

      mapName = mapName.toLowerCase();

      for (var i = 0, n = this._mapsWithAttribution.length; i < n; i++) {
        attributionMapName = this._mapsWithAttribution[i];

        if (attributionMapName.toLowerCase().indexOf(mapName) > -1) {
          return this._getProtocol() + "//static.arcgis.com/attribution/" + attributionMapName;
        }
      }
    },

    _getProtocol: function() {
      var protocol = window.location.protocol;

      return protocol === "file:" ? "http:" : protocol;
    },
    
    _getDefaultTileServers: function(url) {
      var isServer   = (url.search(/^https?\:\/\/server\.arcgisonline\.com/i) !== -1),
          isServices = (url.search(/^https?\:\/\/services\.arcgisonline\.com/i) !== -1);
      
      if (isServer || isServices) {
        return [
          url,
          url.replace(
            (isServer ? /server\.arcgisonline/i : /services\.arcgisonline/i),
            (isServer ? "services.arcgisonline" : "server.arcgisonline")
          )
        ];
      }

      return [];
    }
  });

  return ArcGISTiledLayer;
});
