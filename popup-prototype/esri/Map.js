/**
 * The Map class contains properties and methods for storing, managing, and overlaying [layers](#layers)
 * common to both 2D and 3D viewing. 
 * Layers can be added and removed from the map, but are rendered via a
 * {@link module:esri/views/MapView MapView} (for viewing map and layer data in 2D) or a
 * {@link module:esri/views/SceneView SceneView} (for viewing map and layer data in 3D). 
 * 
 * A single map may be referenced by multiple views. [This sample](../sample-code/source-code/3d/views-2d-3d/index.html) 
 * for example, contains a single Map that is visible in two separate views - one in {@link module:esri/views/MapView  2D}
 * and the other in {@link module:esri/views/SceneView 3D}. Because one map may be accessed by multiple views 
 * in the same application, all user interaction with a map's layers is handled on the 
 * {@link module:esri/views/View}, not the Map. 
 * 
 * An instance of Map is an essential component of the {@link module:esri/views/MapView MapView}
 * and {@link module:esri/views/SceneView SceneView}. A Map object should be created prior to a
 * view so it can be passed into the `map` property of that view
 * (e.g. {@link module:esri/views/MapView#map MapView.map}, {@link module:esri/views/SceneView#map SceneView.map}).
 * 
 * ```js
 * //load the Map and MapView modules
 * require(["esri/Map", "esri/views/MapView", "dojo/domReady!"], function(Map, MapView) { 
 *   //create a Map instance
 *   var myMap = new Map({
 *     basemap: 'streets'
 *   });
 *   //create a MapView instance (for 2D viewing) and reference the map instance
 *   var view = new MapView({
 *     map: myMap
 *   });
 * });
 * ```
 * 
 * An instance of Map is also a [Promise](../guide/working-with-promises/#classes-as-promises). Call the `.then()`
 * method on your Map instance to execute processes that may only run after the map is [loaded](#loaded).
 * 
 * ```js
 * //Create the Map instance
 * var map = new Map({
 *   basemap: "streets",
 *   layers: [layer1, layer2]  //an array of layers
 * });
 * 
 * map.then(function(){
 *   //The map's resources have loaded. Now the layers and basemap can be accessed
 * }, function(error){
 *   //Use the errback function to handle when the map doesn't load properly
 *   console.log("The map's resources failed to load: ", error);
 * });
 * ```
 *
 * @module esri/Map
 * @since 4.0
 * 
 * @see [Sample - Basic map (2D)](../sample-code/2d/basic2d/)
 * @see [Sample - Basic map (3D)](../sample-code/3d/basic3d/)
 * @see module:esri/views/MapView
 * @see module:esri/views/SceneView
 */


/**
 * Fires after a layer has been added to the map using the [add()](#add) method.
 *
 * @event module:esri/Map#layer-add
 * @property {module:esri/layers/Layer} layer - The layer that was added to the map.
 * 
 * @see [add()](#add)
 */

/**
 * Fires after a layer has been removed from the map using the [remove()](#remove) method.
 *
 * @event module:esri/Map#layer-remove
 * @property {module:esri/layers/Layer} layer - The layer that was removed from the map.
 * 
 * @see [remove()](#remove)
 */

/**
 * Fires after a layer has been reordered using the [reorder()](#reorder) method.
 *
 * @event module:esri/Map#layer-reorder
 * @property {number} index - The index of the reordered layer.
 * @property {module:esri/layers/Layer} layer - The layer that was reordered.
 * 
 * @see [reorder()](#reorder)
 */

define([
  "./core/declare",
  "./core/watchUtils",

  "dojo/Deferred",
  
  "./geometry/Extent",
  "./geometry/SpatialReference",
  "./geometry/support/webMercatorUtils",
  
  "./core/Accessor",
  "./core/Evented",
  "./core/Loadable",
  "./LayersMixin",
  "./BasemapMixin"
],
function(
  declare, watchUtils,
  Deferred,
  Extent, SpatialReference, webMercatorUtils,
  Accessor, Evented, Loadable, LayersMixin, BasemapMixin
) {
  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/BasemapMixin
   * @mixes module:esri/LayersMixin
   * @mixes module:esri/core/Loadable
   * @constructor module:esri/Map
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Map = declare([ Accessor, Evented, Loadable, LayersMixin, BasemapMixin],
  /** @lends module:esri/Map.prototype */
  {
    declaredClass: "esri.Map",

    classMetadata: {
      properties: {
        initialExtent: {
          type: Extent
        },
        spatialReference: {
          type: SpatialReference
        }
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function(options) {
      this._loadPromises = {};
      this._loadHandler = this._loadHandler.bind(this);
      this._loadErrorHandler = this._loadErrorHandler.bind(this);
      this.watch("basemap", this._basemapWatcher.bind(this));
      
      var loadingPromise = new Deferred();
      this.addResolvingPromise(loadingPromise.promise);

      // When map.load() is called, the loadStatus is changed to loading. once the load is executed the loadStatus changes
      // to loaded. initialExtent may be set before or after map.load(). A map is said to be loaded when it has initialExtent.
      // So if initialExtent exists, the _loadingPromise can be resolved. intialExtent, may be set at some point of time
      // after calling map.load(). So a watcher is set on the initialExtent, so that whenever initialExtent is set, the promise
      // can be resolved.
      var loadWatcher = this.watch("loadStatus",
        function(status) {
          loadWatcher.remove();
          loadWatcher = null;

          watchUtils.whenOnce(this, "initialExtent", function() {
            watchUtils.whenOnce(this, "spatialReference", function() {
              loadingPromise.resolve(this);
              loadingPromise = null;
            });
          });
        }.bind(this)
      );
    },

    destroy: function() {
      for (var id in this._loadPromises) {
        this._loadPromises[id].cancel();
      }

      this.emit("destroy");
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    /**
     * Built-in collection of graphics.
     * TODO 
     * @private
     */
    //graphics:   new Collection(),
      
    //----------------------------------
    //  spatialReference
    //----------------------------------  
      
    /**
    * The spatial reference of the map. This defines the [Projected Coordinate System](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Projected_coordinate_systems/02r3000000vt000000/) or the 
    * [Geographic Coordinate System](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Geographic_coordinate_systems/02r300000105000000/) 
    * used to locate geographic features in the map.
    * 
    * The map's spatial reference is defined based on the following:
    * 1. If the map is initialized with a basemap, the map's spatial reference is equal to the basemap's spatial reference: `map.basemap.spatialReference`. When using an [Esri basemap](#basemap), the default spatial reference is Web Mercator Auxiliary Sphere (wkid: 3857).
    * 2. If the map is created without a basemap, then its spatial reference is equal to the spatial reference of the first layer added to the map.
    *
    * @name spatialReference
    * @type {module:esri/geometry/SpatialReference}
    * @instance
    */
      
    //----------------------------------
    //  initialExtent
    //----------------------------------  
      
    /**
    * The initial extent of the map. This is determined in the following order:
    * 
    * * If a {@link module:esri/Map#basemap basemap} is specified when constructing a 
    * {@link module:esri/Map}, then the `initialExtent` of the basemap is used.
    * * If an {@link module:esri/views/MapView#extent extent} or a combination of 
    * {@link module:esri/views/MapView#center center} and {@link module:esri/views/MapView#zoom zoom}
    * are set when constructing the {@link module:esri/views/View}, then the intitial value of
    * the view's extent is used.
    * * If the View is not initialized with an {@link module:esri/views/MapView#exent extent}, a 
    * combination of {@link module:esri/views/MapView#center center} and {@link module:esri/views/MapView#zoom zoom},
    * nor a {@link module:esri/Basemap}, but [operational layers](#layers) are added when constructing the map, then the 
    * {@link module:esri/layers/Layer#initialExtent initial extent} of the first layer added to the map is used.
    * 
    * @todo If loading a WebMap, it is the initialExtent of
    * the map as defined in the PortalItem.
    * 
    * @name initialExtent
    * @instance          
    * @type {module:esri/geometry/Extent}
    * 
    * @example
    * //In this case, map.initialExtent = l1.initialExtent
    * var map = new Map({
    *   layers: [l1, l2, l3]  //an array of layers added to the map
    * });
    * var view = new MapView({
    *   map: map
    * });
    * 
    * @example
    * //In this case, map.initialExtent is determined based
    * //on the intial center and zoom settings in the view
    * var map = new Map({
    *   layers: [l1, l2, l3]  //an array of layers added to the map
    * });
    * var view = new MapView({
    *   map: map,
    *   center: [-112, 45],
    *   zoom: 9
    * });
    */
      
    //----------------------------------
    //  loaded
    //----------------------------------

    /**
     * Indicates whether the map has loaded. This value is set to `true` 
     * once the map's [initialExtent](#initialExtent) is set. When `true`,
     * the properties of the object can be accessed.
     * 
     * @name loaded
     * @instance          
     * @type {boolean}
     * @default false
     * @readonly
     */  
    
    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------

    layerAdded: function(layer) {
      var loadPromises = this._loadPromises;
      var id = layer.id;

      var promise = layer.then(this._loadHandler).always(function() {
        delete loadPromises[id];
        id = null;
      });

      if (id !== null) {
        loadPromises[id] = promise;
      }
    },

    layerRemoved: function(layer) {
      var handle = this._loadPromises[layer.id];

      if (handle) {
        handle.cancel();
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private function
    //
    //--------------------------------------------------------------------------
    
    _computeInitialState: function() {
      var firstLayer = this.basemap || this.layers.getItemAt(0),
        layerExtent = firstLayer.initialExtent || firstLayer.fullExtent,
        initialExtent = this.initialExtent;

      if (!this.spatialReference) {
        var layerSR = firstLayer.spatialReference,
          extentSR = initialExtent && initialExtent.spatialReference,
          spatialReference;

        // 1. Map gets its "spatialReference" from the first layer, unless it already has a user-defined SR
        if (
          extentSR && !extentSR.equals(layerSR) &&
          (firstLayer.tileInfo || !firstLayer.url)
        ) {
          // The first layer is either a tiled layer or a by-value layer that
          // cannot re-project content on-the-fly.
          // We cannot accept SR of the extent as it conflicts with the first layer
          extentSR = null;
        }

        spatialReference = extentSR || layerSR;
        this.spatialReference = spatialReference && spatialReference.clone();
      }

      // 2. Map gets its initial "extent" from the first layer, unless it already 
      //    has a user-defined extent with SR compatible with the first layer.
      if (initialExtent) {
        initialExtent = this._projectGeometry(initialExtent, spatialReference);
      }

      initialExtent = initialExtent || (layerExtent && layerExtent.clone());
      
      if (!initialExtent) {
        // Will reject the Map.
        return "[Map] Unable to calculate initial extent";
      }

      this.initialExtent = initialExtent;
    },
    
    _projectGeometry: function(geometry, toSR) {
      var fromSR = geometry && geometry.spatialReference;
          
      if (toSR && fromSR && !toSR.equals(fromSR)) {
        if (toSR._canProject(fromSR)) {
          if (toSR.isWebMercator()) {
            geometry = webMercatorUtils.geographicToWebMercator(geometry);
          }
          else if (toSR.wkid === 4326) {
            geometry = webMercatorUtils.webMercatorToGeographic(geometry, true);
          }
        }
        else {
          console.log(
            "[Map] Cannot project geometry from spatial reference: \"${from}\" to: \"${to}\"",
            fromSR.wkid || fromSR.wkt,
            toSR.wkid || toSR.wkt
          );
          geometry = null;
        }
      }

      return geometry;
    },
    
    //--------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    //--------------------------------------------------------------------------

    _basemapWatcher: function(newValue, oldValue) {
      var loadPromises = this._loadPromises;

      if (oldValue && loadPromises[oldValue.id]) {
        loadPromises[oldValue.id].cancel();
      }

      if (newValue) {
        var id = newValue.id;

        var promise = newValue.load()
          .then(this._loadHandler, this._loadErrorHandler)
          .always(function() {
            delete loadPromises[id];
            id = null;
          });

        if (id !== null) {
          loadPromises[id] = promise;
        }
      }
    },

    _loadHandler: function(loaded) {
      if (!this.loaded &&
          (loaded === this.basemap || 
          (!this.basemap && this.layers.indexOf(loaded) === 0))) {
        var errMessage = this._computeInitialState();
        if (errMessage) {
          this.reject(new Error(errMessage));
        }
      }
    },

    _loadErrorHandler: function(error) {
      // TODO
      console.error(error);
    }
    
  });
  
  return Map;
});
