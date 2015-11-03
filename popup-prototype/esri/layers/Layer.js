/**
 * The layer is the most fundamental component of a {@link module:esri/Map}. It is a collection of spatial data 
 * in the form of graphics or images that represent real-world phenomena. Layers may contain 
 * discrete features that store vector data or continuous cells/pixels that store raster data.
 * 
 * In the case of vector layers, such as {@link module:esri/layers/FeatureLayer} and 
 * {@link module:esri/layers/ArcGISDynamicLayer}, each feature 
 * contained in the layer has a {@link module:esri/geometry/Geometry} 
 * that allows it to be rendered as a {@link module:esri/Graphic} with spatial context on 
 * the {@link module:esri/views/View view}. 
 * Features within the layer also contain data {@link module:esri/Graphic#attributes attributes} that 
 * provide additional information, which may be viewed in {@link module:esri/widgets/Popup popup} windows 
 * and used for {@link module:esri/renderers/Renderer rendering} the layer.
 * 
 * There are various layer types, all of which inherit from Layer.
 * To create a layer you must use one of the sub-classes of Layer. A few examples 
 * of layers include the following:
 * 
 * * Wells may be depicted using point graphics in a {@link module:esri/layers/GraphicsLayer}
 * * Roads and highways may be represented using linear features in a {@link module:esri/layers/FeatureLayer}
 * * Land parcels can be displayed as polygons in a {@link module:esri/layers/ArcGISDynamicLayer}
 * * Satellite imagery may be accessed as tiled images in a {@link module:esri/layers/WebTiledLayer}
 * 
 * Multiple layers may be added to the same map and overlaid on top of one another for visualization 
 * and analytical purposes. See {@link module:esri/Map}, for additional information regarding how to 
 * {@link module:esri/Map#add add layers} to a map.
 * 
 * Layers are rendered in the {@link module:esri/views/View} with a {@link module:esri/views/layers/LayerView}.
 * 
 * An instance of any layer is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 *
 * @module esri/layers/Layer
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/FeatureLayer
 * @see module:esri/layers/ArcGISDynamicLayer
 * @see module:esri/layers/ArcGISTiledLayer
 * @see module:esri/layers/SceneLayer
 * @see module:esri/layers/ArcGISElevationLayer
 */

/**
 * Fires after the layer's {@link module:esri/views/layers/LayerView} is created and rendererd in a view.
 *
 * @event module:esri/layers/Layer#layer-view-create
 * @property {module:esri/views/View} view - The view in which the `layerView` was created.
 * @property {module:esri/views/layers/LayerView} layerView - The LayerView rendered
 *                                                in the view representing the layer in `layer`.
 *                                                
 * @see {@link module:esri/views/View#getLayerView View.getLayerView()}                                                
 * 
 * @example
 * //This function will fire each time a layer view is created for this
 * //particular view.
 * layer.on("layer-view-create", function(evt){
 *   //The LayerView for the layer that emitted this event
 *   evt.layerView;
 * });
 */

/**
 * Fires after the layer's {@link module:esri/views/layers/LayerView} is destroyed and no longer renders in a view.
 *
 * @event module:esri/layers/Layer#layer-view-destroy
 * @property {module:esri/views/View} view - The view in which the `layerView` was destroyed.
 * @property {module:esri/views/layers/LayerView} layerView - The destroyed LayerView representing the layer.
 */
define(
[
  "require",

  "../core/declare", 
  
  "dojo/Deferred", 
  
  "../core/Accessor", 
  "../core/Evented",
  "../core/Loadable",
  "../core/urlUtils", 
  
  "../kernel",
  "../request",

  "../geometry/SpatialReference", 
  "../geometry/Extent"
], 
function(
  require,
  declare,
  Deferred, 
  Accessor, Evented, Loadable, urlUtils,
  esriKernel, esriRequest,
  SpatialReference, Extent
) {
  
  var numLayers = 0;

  var SUPPORTED_BLEND_MODES = [
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity"
  ];

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/Loadable
   * @constructor module:esri/layers/Layer
   */
  var Layer = declare([Accessor, Evented, Loadable],
  /** @lends module:esri/layers/Layer.prototype */
  {
    declaredClass: "esri.layers.mixins.Layer",
    
    classMetadata: {
      properties: {
        hasAttributionData: {
          readOnly: true,
          dependsOn: ["attributionDataUrl"]
        },
        parsedUrl: {
          readOnly: true,
          dependsOn: ["url"]
        },
        credential: {
          readOnly: true,
          dependsOn: ["loaded", "parsedUrl"]
        },
        visible: {},
        fullExtent: {
          type: Extent
        },
        initialExtent: {
          type: Extent
        },
        spatialReference: {
          type: SpatialReference
        }
      },
      computed: {
        token: ["credential.token"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function() {
      this.id = Date.now().toString(16) + "-layer-" + numLayers++;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  title
    //----------------------------------

    /**
     * A title for the layer.
     *
     * @type {string}
     */
    title: null,

    //----------------------------------
    //  attributionDataUrl
    //----------------------------------

    /**
     * The URL that points to the location of the layer's attribution data.
     * 
     * @type {string}
     * @readonly             
     */
    attributionDataUrl: null,

    //----------------------------------
    //  blendMode
    //----------------------------------

    /**
     * This determines how colors in overlapping layers and graphics are blended together.
     * For additional information on this, please refer to [CanvasRenderingContext2D.globalCompositeOperation](https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode).
     *
     * **Possible values:** normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity
     * 
     * @type {string}
     * @default
     */
    blendMode: "normal",

    _blendModeSetter: function(value) {
      if (SUPPORTED_BLEND_MODES.indexOf(value) > -1) {
        return value;
      }
      return "normal";
    },

    //----------------------------------
    //  credential
    //----------------------------------

    /**
     * Provides credential information for the layer such as userid and token if the layer 
     * represents a resource that is secured with token-based authentication. This value 
     * is available after the layer has been loaded.
     * 
     * @type {module:esri/identity/Credential}
     * @private
     */
    credential: null,  
      
    _credentialGetter: function() {
      var cred = this.loaded 
        && this.parsedUrl 
        && esriKernel.id 
        && esriKernel.id.findCredential(this.parsedUrl.path) 
        || null;
      
      if (cred && cred.ssl) {
        this.url = this.url.replace(/^http:/i, "https:");
      }
      return cred;
    },

    //----------------------------------
    //  fullExtent
    //----------------------------------

    /**
     * The full extent of the layer. By default, this is worldwide. This property may be used
     * to set the extent of the view to match a layer's extent so that its features
     * appear to fill the view. See the sample snippet below.
     * 
     * @type {module:esri/geometry/Extent}
     * 
     * @example
     * //Once the layer loads, set the view's extent to the layer's fullextent
     * layer.then(function(){
     *   view.extent = layer.fullExtent;
     * });
     */
    fullExtent: new Extent(-180, -90, 180, 90, SpatialReference.WGS84),

    //----------------------------------
    //  hasAttributionData
    //----------------------------------

    /**
     * Indicates if the layer has attribution data.
     * 
     * @type {boolean}
     * @readonly
     */
    hasAttributionData: null,  
      
    _hasAttributionDataGetter: function() {
      return !!this.attributionDataUrl;
    },
      
    //----------------------------------
    //  id
    //----------------------------------
      
    /**
    * The unique ID assigned to the layer.
    * 
    * @name id
    * @instance
    * @type {string}
    */

    //----------------------------------
    //  initialExtent
    //----------------------------------

    /**
     * The initial extent of the layer. By default, the extent is worldwide.
     * 
     * @type {module:esri/geometry/Extent}
     */
    initialExtent: new Extent(-180, -90, 180, 90, SpatialReference.WGS84),
      
    //----------------------------------
    //  loaded
    //----------------------------------
      
    /**
    * Indicates wheather the layer's resources have loaded if applicable. When `true`,
    * all the properties of the object can be accessed.
    *
    * @name loaded
    * @instance
    * @type {boolean}
    * @default false
    * @readonly             
    */   

    //----------------------------------
    //  listMode
    //----------------------------------

    /**
     * Indicates how the layer should display in the table of contents. The known values are listed below.
     * 
     * Value | Description
     * ------|------------
     *  show | The layer is visible in the table of contents.
     *  hide | The layer is hidden in the table of contents.
     *  hide-children | If the layer is a {@link module:esri/layers/GroupLayer GroupLayer}, hide the children layers from the table of contents.
     *
     * @type {string}
     * @default
     */
    listMode: "show",

    //----------------------------------
    //  minScale
    //----------------------------------

    /**
     * Minimum scale at which the layer is visible in the view. If the map is zoomed out beyond
     * this scale, the layer will not be visible. A value of `0` means the
     * layer does not have a minimum scale.
     *
     * @type {number}
     * @default 0
     * 
     * @example
     * //The layer will not be visible when the view 
     * //is zoomed beyond a scale of 1:3,000,000
     * layer.minScale = 3000000;
     * 
     * @example
     * //The layer's visibility is not restricted to a minimum scale.
     * layer.minScale = 0;
     */
    minScale: 0,
    
    _minScaleSetter: function(value) {
      return value || 0;
    },

    //----------------------------------
    //  maxScale
    //----------------------------------

    /**
     * The maximum scale at which the layer is visible in the view. If the map is zoomed in beyond
     * this scale, the layer will not be visible. A value of `0` means the
     * layer does not have a maximum scale.
     *
     * @type {number}
     * @default 0
     * 
     * @example
     * //The layer will not be visible when the 
     * //view is zoomed beyond a scale of 1:1,000
     * layer.maxScale = 1000;
     * 
     * @example
     * //The layer's visibility is not restricted to a maximum scale.
     * layer.maxScale = 0;
     */
    maxScale: 0,
    
    _maxScaleSetter: function(value) {
      return value || 0;
    },

    //----------------------------------
    //  opacity
    //----------------------------------
    
    /**
    * The opacity of the layer. This value can range between `1` and `0`, where `0` is 100 percent
    * transparent and `1` is completely opaque.
    *
    * @type {number}
    * @default
    * 
    * @example
    * //Makes the layer 50% transparent
    * layer.opacity = 0.5;
    */
    opacity: 1,

    _opacitySetter: function(value) {
      return value < 0 ? 0 : value > 1 ? 1 : value;
    },

    //----------------------------------
    //  parsedUrl
    //----------------------------------
    
    _parsedUrlGetter: function() {
      return this.url ? urlUtils.urlToObject(this.url) : null;
    },

    //----------------------------------
    //  refreshInterval
    //----------------------------------

    /**
     * Refresh interval of the layer in minutes. Non-zero value indicates the layer will automatically refresh at the specified interval. 
     * Value of `0` indicates auto refresh is not enabled. 
     * 
     * @type {number}
     * @default 0
     * @ignore
     */
    refreshInterval: 0,

    //----------------------------------
    //  showAttribution
    //----------------------------------

    /**
     * When `true`, the layer's attribution will be displayed in the view.
     * 
     * @type {boolean}
     * @default
     */
    showAttribution: true,

    //----------------------------------
    //  showLegend
    //----------------------------------

    /**
     * When `true`, the layer will be included in the legend.
     * 
     * @type {boolean}
     * @default
     */
    showLegend: true,

    //----------------------------------
    //  spatialReference
    //----------------------------------

    /**
     * The spatial reference of the layer.
     * 
     * @type {module:esri/geometry/SpatialReference}
     * @default WGS84 (wkid: 4326)
     */
    spatialReference: SpatialReference.WGS84,

    //----------------------------------
    //  token
    //----------------------------------

    /**
     * User's token.
     *
     * @type {string}
     * @private
     */
    _userToken: null,
    
    _tokenGetter: function() {
      var userToken = this._userToken = this._userToken || this.get("parsedUrl.query.token");
      var credToken = this.get("credential.token");

      // TODO
      // If credential.token has expired, initiate token refresh

      // "token" parameter in user-defined URL takes priority.
      // Always access "token" directly from the credential to ensure 
      // token freshness.
      
      return userToken || credToken || null;
    },

    _tokenSetter: function(value) {
      this._userToken = value;
    },

    //----------------------------------
    //  visible
    //----------------------------------

    /**
     * Indicates if the layer is visible in the {@link module:esri/views/MapView} or 
     * {@link module:esri/views/SceneView}. When `false`, the layer may still be added to a {@link module:esri/Map}
     * instance that is referenced in a view, but its features will not be visible in the view.
     * 
     * @type {boolean}
     * @default
     * 
     * @example 
     * //The layer is no longer visible in the view
     * layer.visible = false;
     */
    visible: true,

    //----------------------------------
    //  url
    //----------------------------------
    
    /**
    * The URL of the REST endpoint of the layer. The URL may either point to a
    * resource on ArcGIS for Server, Portal for ArcGIS, or ArcGIS Online.
    *
    * @type {string}
    * 
    * @example
    * //Hosted Feature Service on ArcGIS Online
    * layer.url = "http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/origins/FeatureServer/0";
    * 
    * @example
    * //Layer from Map Service on ArcGIS Server
    * layer.url = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/2";
    * 
    */
    url: null,

    _urlSetter: function(value) {
      return urlUtils.normalize(value);
    },


    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------
    
    createLayerView: function(view) {
      var dfd = new Deferred(), 
      modulePath = this.viewModulePaths[view.type];
      
      if (modulePath) {
        // Import and instantiate the layer view of the desired type
        require(
          [modulePath], 
          function(LayerViewClass) {
            // TODO: layerview should be created with no arguments 
            var layerView = new LayerViewClass({
              layer: this,
              view: view
            });

            layerView.then(
              function(layerView) {
                dfd.resolve(layerView);
              }.bind(this), 
              function(err) {
                dfd.reject(err);
              }
            );

          }.bind(this)
        );
      } 
      else {
        dfd.reject(
          new Error("No LayerView module available for layer \"" + this.declaredClass + "\" and view type: \"" + view.type + "\"")
        );
      }
      
      return dfd.promise;
    },
    
    destroyLayerView: function(view, layerView) {
      layerView.destroy();
    },
    
    getAttributionData: function() {
      var url = this.attributionDataUrl, 
      promise;
      
      if (this.hasAttributionData && url) {
        promise = esriRequest({
          url: url,
          content: {f: "json"},
          handleAs: "json"
        });
      } 
      else {
        var dfd = new Deferred();
        dfd.reject(new Error("Layer does not have attribution data"));
        promise = dfd.promise;
      }
      return promise;
    },

    // TODO
    // For internal use at this point. Used by
    // overview map widget and intended for 
    // tiled and vetiled layers
    // Have to think about implications with
    // respect to toJson pattern. How it fits
    // in the presence of cache manager.
    /*getResourceInfo: function() {
      // It is the layer's responsibility to
      // set resourceInfo
      // See VETiledLayer.js::_initLayer and
      // agstiled.js::_initLayer
      var info = this.resourceInfo;
      return lang.isString(info) ? JSON.parse(info) : lang.clone(info);
    },*/
    
    refresh: function() {
      // Implemented by sub-classes
      this.emit("refresh");
    }
  
  });
  
  return Layer;
});
