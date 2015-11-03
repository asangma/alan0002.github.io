/**
 * GroupLayer provides the ability to organize several sublayers into one common layer. Suppose there are 
 * several {@link module:esri/layers/FeatureLayer FeatureLayers} that all represent
 * water features in different dimensions. For example, wells (points), streams (lines), and lakes (polygons).
 * The GroupLayer provides the functionality to treat them as one layer called "Water Features" even though they 
 * are stored as separate feature layers. To accomplish this, create a new GroupLayer and use the [add()](#add)
 * method to add each of the water layers to the GroupLayer.
 * 
 * The visibilty of each layer is managed in the [listMode](#listMode) and [visibilityMode](#visibilityMode) 
 * properties. 
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 * 
 * @module esri/layers/GroupLayer
 * @since 4.0
 * @see module:esri/layers/FeatureLayer
 * @see module:esri/layers/ArcGISDynamicLayer
 * @see module:esri/layers/ArcGISTiledLayer
 */

/**
 * Fires after a layer has been added to the GroupLayer.
 *
 * @event module:esri/layers/GroupLayer#layer-add
 * @property {module:esri/layers/Layer} layer - The layer that was added to the GroupLayer.
 */

/**
 * Fires after a layer has been removed from the GroupLayer.
 *
 * @event module:esri/layers/GroupLayer#layer-remove
 * @property {module:esri/layers/Layer} layer - The layer that was removed from the GroupLayer.
 */

/**
 * Fires after a layer has been reordered.
 *
 * @event module:esri/layers/GroupLayer#layer-reorder
 * @property {number} index - The index of the reordered layer.
 * @property {module:esri/layers/Layer} layer - The layer that was reordered.
 */

define(
[
  "../core/declare",

  "dojo/Deferred",

  "../geometry/SpatialReference",
  "../geometry/Extent",
  "../geometry/support/webMercatorUtils",

  "./Layer",
  
  "../LayersMixin",

  "../core/JSONSupport"
],
function(
  declare, Deferred,
  SpatialReference, Extent, webMercatorUtils,
  Layer,
  LayersMixin,
  JSONSupport
) {

  /**
   * @extends module:esri/layers/Layer
   * @mixes module:esri/LayersMixin
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/layers/GroupLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */      
  var GroupLayer = declare([Layer, LayersMixin, JSONSupport], 
  /** @lends module:esri/layers/GroupLayer.prototype */                         
  {
    declaredClass: "esri.layers.GroupLayer",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function(properties) {
      this._lyrPromises = {};
      this._lyrResolveHandler = this._lyrResolveHandler.bind(this);
      this._lyrVisibleHandles = {};
      this._lyrVisibleWatcher = this._lyrVisibleWatcher.bind(this);
      
      this._lyrFullExtentHandles = {};
      this._lyrFullExtentWatcher = this._lyrFullExtentWatcher.bind(this);

      this._promise = new Deferred();
      this.addResolvingPromise(this._promise.promise);
    },
    
    initialize: function() {
      this._enforceVisibility(this.visibilityMode, this.visible);
      this.watch("visible", this._visibleWatcher);
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    viewModulePaths: {
      "2d": "../views/layers/GroupLayerView",
      "3d": "../views/layers/GroupLayerView"
    },
      
    /**
    * @name url
    * @instance
    * @type {string}
    * @ignore 
    */

    //----------------------------------
    //  visibilityMode
    //----------------------------------
    
    /**
     * Indicates how to manage the visibility of the children layers. Possible values
     * are described in the table below.
     * 
     * Value | Description
     * ------|------------
     * independent | Each child layer manages its visibility independent from other layers.
     * inherited | Each child layer's visibility matches the [GroupLayer’s visibility](#visible).
     * exclusive | Only one child layer is visible at a time.
     * 
     * @type {string}
     */
    visibilityMode: "independent",

    _visibilityModeSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._enforceVisibility(value, this.visible);
      return value;
    },

    //----------------------------------
    //  spatialReference
    //----------------------------------

    _spatialReferenceReader: function(value) {
      return value && new SpatialReference(value);
    },

    //----------------------------------
    //  initialExtent
    //----------------------------------

    _initialExtentReader: function(value) {
      return value && Extent.fromJSON(value);
    },

    //----------------------------------
    //  fullExtent
    //----------------------------------

    _fullExtentReader: function(value) {
      return value && Extent.fromJSON(value);
    },


    //--------------------------------------------------------------------------
    //
    //  Overridden Methods: LayersMixin
    //
    //--------------------------------------------------------------------------

    layerAdded: function(layer, layers) {
      if (!this.isFulfilled()) {
        this._lyrPromises[layer.id] = layer.then(this._lyrResolveHandler);
      }

      if (layer.visible && this.visibilityMode === "exclusive") {
        this._turnOffOtherLayers(layer);
      } else if (this.visibilityMode === "inherited") {
        layer.visible = this.visible;
      }

      this._lyrFullExtentHandles[layer.id] =
        layer.watch("fullExtent", this._lyrFullExtentWatcher);
      
      // Monitor layer's visibility to enforce group type.
      this._lyrVisibleHandles[layer.id] =
        layer.watch("visible", this._lyrVisibleWatcher);

      this._computeFullExtent();
    },

    layerRemoved: function(layer, layers) {
      var handle = this._lyrPromises[layer.id];
      if (handle) {
        handle.cancel();
        delete this._lyrPromises[layer.id];
      }
      handle = this._lyrFullExtentHandles[layer.id];
      if (handle) {
        handle.remove();
        delete this._lyrFullExtentHandles[layer.id];
      }
      handle = this._lyrVisibleHandles[layer.id];
      if (handle) {
        handle.remove();
        delete this._lyrVisibleHandles[layer.id];
      }
      
      // Make sure we have one layer visible
      this._enforceVisibility(this.visibilityMode, this.visible);
      this._computeFullExtent();
    },
	
    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    _turnOffOtherLayers: function(layer) {
      this.layers.forEach(function(otherLayer) {
        if (otherLayer !== layer) {
          otherLayer.visible = false;
        }
      });
    },

    _enforceVisibility: function(visibilityMode, visible) {
      if (!this._accessorProps.initialized) {
        // _enforceVisibility is called after initialization
        return;
      }
      var layers = this.layers;
      // Do we already have a visible layer?
      var visibleLayer = layers.find(function(lyr) {
        return lyr.visible;
      });
      
      switch (visibilityMode) {
        case "exclusive": 
          // All layers are not visible, pick the first one an turn it on.
          if (layers.length && !visibleLayer) {
            visibleLayer = layers.getItemAt(0);
            visibleLayer.visible = true;
          }
          this._turnOffOtherLayers(visibleLayer);
          break;
        case "inherited":
          layers.forEach(function(lyr) {
            lyr.visible = visible;
          }, this);
          break;
      }
    },

    /**
     * Compute the fullExtent of the GroupLayer based on the child layers
     * @private
     */
    _computeFullExtent: function() {
      var sr = this.spatialReference;
      if (!sr || !this.layers.length) {
        return;
      }
      var unionExtent = this.layers.map(function(layer) {
        if (!layer.loaded) {
          return null;
        }
        var ext = layer.fullExtent || layer.initialExtent;
        if (!sr.equals(ext.spatialReference) && webMercatorUtils.canProject(ext, sr)) {
          ext = webMercatorUtils.project(ext, sr);
        }
        if (sr.equals(ext.spatialReference)) {
          return ext;
        }
        return null;
      }).reduce(function(unionExtent, extent) {
        if (!unionExtent) {
          return extent;
        }
        if (!extent) {
          return unionExtent;
        }
        return unionExtent.union(extent);
      });
      this.fullExtent = unionExtent;
    },
    

    //--------------------------------------------------------------------------
    //
    //  Handlers
    //
    //--------------------------------------------------------------------------

    _visibleWatcher: function(visible){
      if (this.visibilityMode === "inherited") {
        this.layers.forEach(function(childLayer) {
          childLayer.visible = visible;
        });
      }
    },

    _lyrResolveHandler: function(layer) {
      var index = this.layers.indexOf(layer);
      delete this._lyrPromises[layer.id];
      // Historically, first layer added loads the map
      if (!this.isFulfilled() && index === 0) {
        this.read({
          fullExtent:       layer.fullExtent && layer.fullExtent.toJSON(),
          initialExtent:    layer.initialExtent && layer.initialExtent.toJSON(),
          spatialReference: layer.spatialReference && layer.spatialReference.toJSON()
        });
        this._promise.resolve();
      }
    },

    _lyrVisibleWatcher: function(newValue, oldValue, prop, target) {
      var layer = target, visible = newValue,
      someLayerVisible = this.layers.some(function(lyr) {
        return lyr.visible;
      });

      switch (this.visibilityMode) {
        case "exclusive":
          if (visible) {
            this._turnOffOtherLayers(layer);
          }
          else if (!someLayerVisible) {
            // Can't turn off the only visible
            layer.visible = true;
          }
          break;
        case "inherited":
          // Can't turn set the individual visibility of layers
          layer.visible = this.visible;
          break;
      }
    },

    _lyrFullExtentWatcher: function() {
      this._computeFullExtent();
    }

  });

  return GroupLayer;
});
