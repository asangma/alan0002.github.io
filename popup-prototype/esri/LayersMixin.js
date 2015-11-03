/**
 * Mixin for {@link module:esri/Map Map}.
 *
 * @module esri/LayersMixin
 * @mixin
 * @since 4.0
 */
define(
[
  "./core/declare",
  "dojo/_base/lang",

  "./core/Accessor",
  "./core/Collection"
],
function(
  declare, lang,
  Accessor, Collection
) {

  var LayersMixin = declare(Accessor,
  /** @lends module:esri/LayersMixin */
  {

    declaredClass: "esri.LayersMixin",

    classMetadata: {
      properties: {
        layers: {
          type: Collection
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function(properties) {
      this._lyrChgHandler = this._lyrChgHandler.bind(this);

      var loadWatcher = this.watch("loadStatus",
        function(status) {
          if (status === "loading") {
            var basemap = this.basemap;
            
            if (basemap) {
              this._loadPromises[basemap.id] = basemap.load().then(this._loadHandler, this._loadErrorHandler);
            }
            else {
              var lyr = this.layers.getItemAt(0);
              if (lyr) {
                lyr.load();
              }
              else {
                var loadLayersHandle = this.layers.on("change", function() {
                  var lyr = this.layers.getItemAt(0);
                  if(lyr.loadStatus === "not-loaded" && !this.basemap) {
                    lyr.load();
                    loadLayersHandle.remove();
                    loadLayersHandle = null;
                  }
                }.bind(this));
              }
            }
          }
        }.bind(this)
      );

    },

    destroy: function() {
      this._layersHandle.remove();
      this._layersHandle = null;
      this.layers.drain(this._lyrRemove, this);
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  layers
    //----------------------------------

    /**
     * A collection of operational {@link module:esri/layers/Layer layers} in the map. This property only
     * contains interactive operational layers, such as {@link module:esri/layers/FeatureLayer FeatureLayers},
     * {@link module:esri/layers/WebTiledLayer WebTiledLayers} and {@link module:esri/layers/GraphicsLayer
     * GraphicsLayers}  that may be queried, assigned different renderers, analyzed, etc. It does not include
     * [basemaps](#basemap).
     *
     * A {@link module:esri/layers/Layer layer} is a collection of one or more features, or {@link module:esri/Graphic
     * graphics}, that represent real-world phenomena. Each feature contains a {@link module:esri/symbols/Symbol
     * symbol}  and {@link module:esri/geometry/Geometry geographic data} that allows it to be rendered on the map as a
     * graphic with spatial context. Features within the layer may also contain  data attributes that provide
     * additional information that may be viewed in {@link module:esri/widgets/Popup popup windows} and used for {@link
     * module:esri/renderers/Renderer rendering the layer}.
     * 
     * Layers may be added in the constructor of Map, with the [add()](#add) method, or directly to the layers
     * collection using {@link module:esri/core/Collection#addItem addItem()}.
     *
     * @memberof module:esri/LayersMixin
     * @name layers
     * @type {module:esri/core/Collection}
     * 
     * @example
     * //Add layers in the constructor of Map using an array
     * var fl = new FeatureLayer(url);
     * var gl = new GraphicsLayer();
     * var map = new Map({
     *   layers: [fl, gl]
     * });
     * 
     * //Add layers using add()
     * map.add([fl, gl]);
     * 
     * //Add layers using layers collection
     * map.layers.addItems([fl, gl]);
     */
    _layers: null,

    _layersGetter: function(oldValue) {
      if (!oldValue) {
        oldValue = new Collection();
        this._layersHandle = oldValue.on("change", this._lyrChgHandler);
      }
      return oldValue;
    },
    
    _layersSetter: function(value, oldValue) {
      // YCA: The layers setter removes and adds
      // the content of value, but not replace the layers
      // property. Could be in the future.
      if (oldValue) {
        this.remove(oldValue.getAll());
      }
      this.add(value.getAll());
      return oldValue;
    },
        
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * Returns a layer based on the given layer id.
     * 
     * @param   {string} layerId - The ID assigned to the layer.
     * @return {module:esri/layers/Layer} Returns the requested layer object.
     */
    getLayer: function(layerId) {
      var layer;
      var findLayer = function(lyr) {
        if (lyr.id === layerId) {
          layer = lyr;
          return true;
        }
        if (lyr.layers) {
          return lyr.layers.some(findLayer);
        }
        return false;
      };
      this.layers.some(findLayer);
      return layer;
    },

    /**
     * Adds a layer or an array of layers.
     * @param   {module:esri/layers/Layer | module:esri/layers/Layer[]} 
     * layers - Layer(s) to be added to the map.
     * @param   {number} index - A layer can be added at a specified index in the map. 
     *                         If no index is specified or the index specified is greater
     *                         than the current number of layers, the layer is automatically
     *                         appended to the list of layers in the map and the index is
     *                         normalized. 
     * @return {module:esri/layers/Layer[]} Returns the layer(s) that were added to the map.
     *                                      
     * @see [Event: layer-add](#event:layer-add)                                      
     */
    add: function(layers, index) {
      var col = this.layers,
          i, n, layer;

      // layers arg can be an array or a single
      layers = lang.isArray(layers) ? layers : [ layers ];
      // index cannot be greater that the number of layers
      index = col.getNextIndex(index);

      // Check for each layer, if his already in the collection.
      // And change to a move instead of an add.
      for (i = 0, n = layers.length; i < n; i++) {
        layer = layers[i];
        if (col.indexOf(layer) !== -1) {
          // - move the layer
          this.reorder(layer, index);
        }
        else {
          if (layer.parent) {
            layer.parent.remove(layer);
            layer.set("parent", this);
          }
          col.addItem(layer, index);
          index = index + 1;
        }
      }

      return this;
    },

    /**
     * Removes the specified layer or array of layers.
     * @param   {module:esri/layers/Layer | module:esri/layers/Layer[]} layers - 
     * The layer or array of layers to be removed from the map.
     * 
     * @return {module:esri/layers/Layer | module:esri/layers/Layer[]} Returns 
     * the layer(s) removed from the map.
     * 
     * @see [Event: layer-remove](#event:layer-remove)
     */
    remove: function(layers) {
      // layers arg can be an array or a single layer.
      layers = lang.isArray(layers) ? layers : [ layers ];
      layers = this.layers.removeItems(layers);
      layers.forEach(function(layer) {
        layer.parent = null;
      });
      return this;
    },

    /**
     * Removes all layers.
     */
    removeAll: function() {
      this.layers.clear();
      return this;
    },

    /**
     * Changes the layer order. The first layer added is always the base layer,
     * even if its order is changed.
     * 
     * @param   {module:esri/layers/Layer} layer - The layer to be moved.
     * @param   {number} index - The index location for placing the layer. The bottom-most
     *                         layer has an index of `0`.
     * @return {module:esri/layers/Layer} Returns the layer that was moved.
     *                                    
     * @see [Event: layer-reorder](#event:layer-reorder)                                    
     */
    reorder: function(layer, index) {
      this.layers.moveItem(layer, index);
      return this;
    },

    
    //--------------------------------------------------------------------------
    //
    //  Protected function
    //
    //--------------------------------------------------------------------------

    layerAdded: function(layer) {

    },

    layerRemoved: function(layer) {

    },

    layersChange: function(added, removed, moved) {

    },


    //--------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    //--------------------------------------------------------------------------

    _lyrChgHandler: function(event) {
      var added   = event.added,
          removed = event.removed,
          moved   = event.moved,
          i, n;
      this.layersChange(added, removed, moved);
      for(i = 0, n = added.length; i < n; i++) {
        this._lyrAdd(added[i]);
      }
      for(i = 0, n = removed.length; i < n; i++) {
        this._lyrRemove(removed[i]);
      }
      for(i = 0, n = moved.length; i < n; i++) {
        this._lyrMoveHandler(moved[i]);
      }
    },

    _lyrAdd: function(layer) {
      //console.log("ADD: " + layer.id + " in " + this.id);
      layer.parent = this;
      this.layerAdded(layer);
      this.emit("layer-add", {
        target: this,
        layer: layer
      });
    },

    _lyrRemove: function(layer) {
      //console.log("REMOVE: " + layer.id + " in " + this.id);
      if (layer.parent === this) {
        layer.parent = null;
      }
      this.layerRemoved(layer);
      this.emit("layer-remove", {
        target: this,
        layer: layer
      });
    },

    _lyrMoveHandler: function(layer) {
      this.emit("layer-reorder", {
        target: this,
        layer: layer
      });
    }

  });

  return LayersMixin;
});
