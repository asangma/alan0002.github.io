/**
 * Represents the view for a single layer.
 *
 * @module esri/views/layers/LayerView
 * @since 4.0
 * @see {@link module:esri/views/View#getLayerView View.getLayerView()}
 * @see {@link module:esri/views/MapView#getLayerView MapView.getLayerView()}
 * @see {@link module:esri/views/SceneView#getLayerView SceneView.getLayerView()}
 */
define(
[
  "../../core/declare", 

  "../../core/Accessor", 
  "../../core/Evented", 
  "../../core/Promise"
], 
function(
  declare,
  Accessor, Evented, Promise
) {

  var numLayerViews = 0;

  /**
  * @extends module:esri/core/Accessor
  * @mixes module:esri/core/Promise
  * @constructor module:esri/views/layers/LayerView
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */
  var LayerView = declare([Accessor, Evented, Promise],
  /** @lends module:esri/views/layers/LayerView.prototype */
  {
    declaredClass: "esri.views.layers.LayerView",
    
    classMetadata: {
      properties: {
        refreshTimer: {
          readOnly: true,
          dependsOn: ["suspended", "layer.refreshInterval"]
        },
        suspended: {
          dependsOn: ["view", "visible", "layer.loaded", "layer.visible", "parent.suspended"],
          readOnly: true
        },
        updating: {
          dependsOn: ["suspended"]
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function() {
      this.id = Date.now().toString(16) + "-layerview-" + numLayerViews++;
      this._layerHandles = [];
      this.watch("suspended", this._suspendedWatcher.bind(this));
    },
    
    initialize: function() {      
      this.addResolvingPromise(this.layer);
    },
    
    destroy: function() {
      this.layer = this.parent = null;
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  layer
    //----------------------------------

    /**
     * The layer being viewed.
     * 
     * @type {module:esri/layers/Layer}
     */
    layer: null,
    
    _layerSetter: function(value) {
      var handles = this._layerHandles;
      handles.forEach(function(hdl) {
        hdl.remove();
      });
      handles.length = 0;
      if (value) {
        handles.push(value.on("refresh", this.refresh.bind(this)));
      }
      return value;
    },

    //----------------------------------
    //  parent
    //----------------------------------
    
    parent: null,

    //----------------------------------
    //  refreshTimer
    //----------------------------------

    _refreshTimerGetter: function(timer) {
      var suspended = this.suspended;
      var interval = this.get("layer.refreshInterval") || 0;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      // Set or clear refresh timer based on caller's choice
      if (!suspended && interval) {
        timer = setTimeout(this.refresh.bind(this), interval * 60 * 1000);
      } 
      return timer;
    },

    //----------------------------------
    //  suspended
    //----------------------------------

    // true if the layer is suspended i.e., layer will not draw/update itself
    // in response to map extent changes
    
    /**
     * Value is `true` if the layer is suspended (i.e., layer will not redraw or update
     * itself when the map's extent changes).
     * 
     * @type {boolean}
     * @default
     */
    suspended: true,

    _suspendedGetter: function() {
      return !this.canResume();
    },

    //----------------------------------
    //  updating
    //----------------------------------
    
    /**
     * Value is `true` when the layer is in the process of updating.
     * 
     * @name updating
     * @instance
     * 
     * @type {boolean}
     * @default false
     */
    _updating: false,
    
    _updatingGetter: function() {
      return !!(this._updating && !this.suspended);
    },
    
    _updatingSetter: function(updating) {
      this._updating = !!updating;
    },

    //----------------------------------
    //  visible
    //----------------------------------
    
    /**
     * When `true`, the layer is visible in the view. Set this property to `false`
     * to hide the layer from the view.
     * 
     * @type {boolean}
     * @default
     */
    visible: true,


    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------
    
    refresh: function() {
    },

    // Sub-classes can extend this method and add more conditions
    // to specify when a layer is suspended and when it is not
    canResume: function() {
      return (
        !this.get("parent.suspended") && 
        this.get("view.ready") &&
        this.get("layer.loaded") &&
        (this.hasOwnProperty("visible") ? this.visible : this.layer.visible)
      ) || false;
    },

    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    _suspendedWatcher: function(newValue) {
      if (newValue) {
        this.emit("suspend");
      }
      else {
        this.emit("resume");
      }
    }

  });
  
  return LayerView;

});
