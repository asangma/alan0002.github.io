/**
 * ArcGISElevationLayer is a tiled layer used for rendering elevations in {@link module:esri/views/SceneView SceneViews}.
 * A [world elevation layer](http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer) 
 * is used by default with all basemaps in 3D views.
 * 
 * Elevation layers may be set in the {@link module:esri/Basemap#elevationLayers elevationLayers} property of a
 * {@link module:esri/Map#basemap map's basemap} or directly added to a {@link module:esri/Map}. When directly added
 * to a Map instance, the elevation layer may be toggled on and off with the [visible](#visible) property.
 * 
 * ```js
 * var elevLyr = new ArcGISElevationLayer({
 *   //this elevation service is added to the basemap in a SceneView by default
 *   url: "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
 * });
 * //add elevation layer to the map's basemap.
 * map.basemap.elevationLayers.addItem(elevLyr);
 * 
 * //add elevationlayer directly to the map.
 * map.add(elevLyr);
 * ```
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 *
 * @module esri/layers/ArcGISElevationLayer
 * @since 4.0
 * @see [Sample - 3D Map with elevation services](../sample-code/3d/elevation-3d/)
 * @see module:esri/layers/ArcGISTiledLayer
 */
define(
[
  "../core/declare", 
  "dojo/_base/lang",

  "./TiledLayer", 
  
  "./mixins/ArcGISMapService", 
  "./mixins/ArcGISCachedService", 
  
  "../request",

  "../core/promiseUtils"
], function(
  declare, lang,
  TiledLayer,
  ArcGISMapService, ArcGISCachedService,
  esriRequest,
  promiseUtils
) {
  
  /**
   * @extends module:esri/layers/TiledLayer
   * @mixes module:esri/layers/mixins/ArcGISMapService
   * @mixes module:esri/layers/mixins/ArcGISCachedService 
   * @constructor module:esri/layers/ArcGISElevationLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  var ArcGISElevationLayer = declare([TiledLayer, ArcGISMapService, ArcGISCachedService], 
  /** @lends module:esri/layers/ArcGISElevationLayer.prototype */
  {
    declaredClass: "esri.layers.ArcGISElevationLayer",

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

    load: function() {
      this.addResolvingPromise(this._fetchImageService());
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  viewModulePaths
    //----------------------------------
    
    /**
    * @private
    */
    viewModulePaths: {
      "3d": "../views/3d/layers/ElevationLayerView3D"
    },

    //----------------------------------
    //  url
    //----------------------------------  
      
    /**
     * URL pointing to the Elevation layer resource on an ArcGIS Image Server.
     * 
     * @name url
     * @instance
     * @type {string}
     * 
     * @example
     * url: "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
     */
      
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /*    
    getElevationAtPosition: function(position, options) {
      throw new Error("Not yet implemented");
    },
    
    getElevationAlongPath: function(path, numSamples, options) {
      throw new Error("Not yet implemented");
    },
    
    prefetchExtent: function(extent, resolution) {
      throw new Error("Not yet implemented");
    },
    
    getTileData: function(level, row, column, options) {
      throw new Error("Not yet implemented");
    },
    
    getTileDataForExtent: function(extent, resolution, options) {
      throw new Error("Not yet implemented");
    },
    */


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    
    _fetchImageService: function() {
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
  
  });
  
  return ArcGISElevationLayer;
}
);
