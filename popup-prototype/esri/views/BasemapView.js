define(
[
  "../core/Accessor",
  "../core/HandleRegistry",
  "../core/Collection"
],
function(
  Accessor, HandleRegistry, Collection
) {

  /**
   *
   */
  var BasemapView = Accessor.createSubclass({

    declaredClass: "esri.views.BasemapView",

    classMetadata: {
      properties: {
        view: {},
        suspended: {
          readOnly: true,
          dependsOn: ["view.suspended"]
        }
      },
      computed: {
        baseLayerViews: ["view.map.basemap.baseLayers"],
        referenceLayerViews: ["view.map.basemap.referenceLayers"],
        elevationLayerViews: ["view.map.basemap.elevationLayers"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._handles = new HandleRegistry();
      this._lyrColHandler = this._lyrColHandler.bind(this);
    },

    initialize: function() {
      var loadBasemapHandler = function() {
        var loadStatus = this.get("view.map.loadStatus");
        var basemap = this.get("view.map.basemap");

        if (basemap && basemap.loadStatus === "not-loaded" &&
          (loadStatus === "loading" || loadStatus === "loaded")) {
          basemap.load();
        }
      }.bind(this);

      loadBasemapHandler();
      this._handles.add(this.watch("view.map.loadStatus, view.map.basemap", loadBasemapHandler));
    },

    destroy: function() {
      this.view = null;
      this._handles.destroy();
      this._handles = null;
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    /**
     * BasemapView is the parent of the basemap layerviews.
     * Shouldn't be suspended.
     * @private
     */
    _suspendedGetter: function() {
      return this.view ? 
        this.view.suspended :
        true;
    },

    _baseLayerViewsGetter: function(oldValue) {
      return this._lyrsToLyrViews("baseLayers", oldValue);
    },
    _referenceLayerViewsGetter: function(oldValue) {
      return this._lyrsToLyrViews("referenceLayers", oldValue);
    },
    _elevationLayerViewsGetter: function(oldValue) {
      return this._lyrsToLyrViews("elevationLayers", oldValue);
    },
    
    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _lyrsToLyrViews: function(colName, layerViews) {
      if (!this._handles) {
        return null;
      }

      var layers = this.get("view.map.basemap." + colName);

      this._handles.remove(colName);
      this._clearViews(layerViews);

      if (!layerViews) {
        layerViews = new Collection();
      }

      if (layers) {
        this._addAll(layers);
        this._handles.add(layers.on("change", this._lyrColHandler), colName);
      }
      return layerViews;
    },

    _clearViews: function(layerViews) {
      layerViews && layerViews.drain(function(layerView) {
        layerView.view.factory.dispose(layerView);
        layerView.set("parent", null);
      }, this);
    },

    _addAll: function(layers) {
      layers.forEach(function(layer) {
        this._createLyrView(layers, layer);
      }, this);
    },

    _createLyrView: function(layersCol, layer) {
      var view = this.view;

      view.factory.create(layer).then(
        function(layerView) {
          if (!this.view) {
            return;
          }
          if (layersCol.indexOf(layer) > -1 && this._getViewsCol(layersCol).indexOf(layerView) === -1) {
            var index = this._getLyrViewIdxCandidate(layersCol, layer);
            layerView.set({
              parent: this,
              layer: layer
            });
            this._getViewsCol(layersCol).addItem(
              layerView,
              index
            );
          }
        }.bind(this),
        function(error) {
          // TODO handle or fail silently?
          error = !error ? {} : error.message ? error : error.error;
          if (error.message && error.message.indexOf("No LayerView module") === -1) {
            console.error(error);
          }
        }.bind(this)
      );
    },

    _removeLyrView: function(layersCol, layer) {
      var view = this.view,
          layerViews = this._getViewsCol(layersCol),
          index = layerViews.findIndex(function(layerView) {
            return layerView.layer === layer;
          });
      if (index > -1) {
        var layerView = layerViews.getItemAt(index);
        layerViews.removeItemAt(index);
        view.factory.dispose(layerView);
        layerView.set("parent", null);
      }
    },

    _reorderLyrView: function(layersCol, layer, index) {
      var layerViews = this._getViewsCol(layersCol),
          layerView = layerViews.find(function(layerView) {
            return layerView.layer === layer;
          });
      if (layerView) {
        layerViews.moveItem(layerView, index);
      }
    },

    /*
     * Compute the index where to insert the layerview.
     * As layerview are loaded/created asynchronously,
     * the layerview of a layer far in the collection
     * can be loaded before the preceding ones.
     */
    _getLyrViewIdxCandidate: function(layersCol, layer) {
      var layerViewsCol = this._getViewsCol(layersCol),
          index = layersCol.indexOf(layer);
      index = layerViewsCol.findIndex(function(layerview) {
        return layersCol.indexOf(layerview.layer) > index;
      });
      return index > -1 ? index : layerViewsCol.length;
    },

    _lyrColHandler: function(event) {
      var target = event.target;
      event.added.forEach(function(lyr) {
        this._createLyrView(target, lyr);
      }, this);
      event.removed.forEach(function(lyr) {
        this._removeLyrView(target, lyr);
      }, this);
      event.moved.forEach(function(lyr) {
        this._reorderLyrView(target, lyr, target.indexOf(lyr));
      }, this);
    },

    _getViewsCol: function(layersCol) {
      var basemap = this.get("view.map.basemap");
      if (layersCol === basemap.baseLayers) {
        return this.baseLayerViews;
      }
      if (layersCol === basemap.referenceLayers) {
        return this.referenceLayerViews;
      }
      if (layersCol === basemap.elevationLayers) {
        return this.elevationLayerViews;
      }
    }

  });

  return BasemapView;

});
