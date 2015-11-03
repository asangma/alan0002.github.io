define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "../core/Collection"
], function(
  declare, lang, array,
  Collection
) {

  var findView = function(lvo) {
        if (lvo.hasOwnProperty("layer")) {
          return lvo.view;
        }
        return lvo;
      },
      findLayers = function(lvo) {
        if (lvo.hasOwnProperty("layer")) {
          return lvo.layer ? lvo.layer.layers : null;
        }
        return lvo.map ? lvo.map.layers : null;
      };

  /**
   * LayerViewsOwner is a base mixin for View and GroupLayerView
   * It observe the collection of layers, of the map or the GroupLayer,
   * and manage the creation and removal of the LayerViews.
   */
  var LayerViewsOwner = declare(null, {

    classMetadata: {
      properties: {
        layerViews: {}
      }
    },

    constructor: function() {
      this._lvoHandles = [];
      this._lyrHdl = null;
      this._recreateHdler = lang.hitch(this, this._recreateHdler);
      this._lyrColHandler = lang.hitch(this, this._lyrColHandler);
      this.layerViews = new Collection();
    },

    destroy: function() {
      this.destroyLayerViews();

      this._lvoHandles = null;

      if (this._lyrHdl) {
        this._lyrHdl.remove();
        this._lyrHdl = null;
      }
    },

    destroyLayerViews: function() {
      array.forEach(this._lvoHandles, function(hdl) {
        hdl.remove();
      });

      var view = findView(this);

      this.layerViews.drain(function(layerView) {
        view.factory.dispose(layerView);
      }, this);
    },

    initialize: function() {
      var handles = this._lvoHandles;

      // GroupLayerView? else View
      if (this.hasOwnProperty("layer")) {
        handles.push(this.watch("view", this._recreateHdler));
        handles.push(this.watch("layer", this._recreateHdler));
      }
      else {
        handles.push(this.watch("ready", this._recreateHdler));
      }
      this._recreateHdler();
    },

    _recreateHdler: function(change) {
      var view = findView(this),
          layers = findLayers(this);

      if (this._lyrHdl) {
        this._lyrHdl.remove();
        this._lyrHdl = null;
      }

      // remove all the layers
      this.layerViews
        .map(function(lv) {return lv.layer;})
        .drain(this._lyrRemoved, this);

      // recreate all layers
      if (view && layers && view.ready) {
        layers.forEach(this._lyrAdded, this);

        // listen for further changes
        this._lyrHdl = layers.on("change", this._lyrColHandler);
      }
    },

    _lyrAdded: function(layer) {
      var view = findView(this);

      // get the layerview from the View.
      // Either that layerview is from its cache
      // or a newly created one.
      view.factory.create(layer).then(
        lang.hitch(this, function(layerView) {
          var layers = findLayers(this);
          // Check if the layer is still own by ourself
          // Would be false if the layer has being removed while the layerview was being created,
          // or if the layers collection has been swapped.
          if (view === findView(this) && layers && layers.indexOf(layer) > -1) {
            var index = this._getLyrViewIdxCandidate(layer);
            layerView.parent = this;
            this.layerViews.addItem(
              layerView,
              index
            );
            this.emit("layer-view-add", {
              layer: layer,
              layerView: layerView,
              index: index
            });
          }
        })
      );
    },

    _lyrRemoved: function(layer) {
      var view = findView(this),
          index = this.layerViews.findIndex(function(layerView) {
            return layerView.layer === layer;
          }),
          layerView = this.layerViews.getItemAt(index);
      this.layerViews.removeItemAt(index);
      if (index > -1) {
        view.factory.dispose(layerView);
        this.emit("layer-view-remove", {
          layer: layer,
          layerView: layerView,
          index: index
        });
      }
    },

    _lyrMoved: function(layer, index) {
      var layerView = this.layerViews.find(function(layerView) {
            return layerView.layer === layer;
          });
      this.layerViews.moveItem(layerView, index);
      this.emit("layer-view-reorder", {
        layer: layer,
        layerView: layerView,
        index: index
      });
    },

    /*
     * Compute the index where to insert the layerview.
     * As layerview are loaded/created asynchronously,
     * the layerview of a layer far in the collection
     * can be loaded before the preceding ones.
     */
    _getLyrViewIdxCandidate: function(layer) {
      var views = this.layerViews,
          layers = findLayers(this),
          index = layers.indexOf(layer);
      index = views.findIndex(function(layerview) {
        return layers.indexOf(layerview.layer) > index;
      });
      return index > -1 ? index : views.length;
    },

    _lyrColHandler: function(event) {
      array.forEach(event.added, function(lyr) {
        this._lyrAdded(lyr);
      }, this);
      array.forEach(event.removed, function(lyr) {
        this._lyrRemoved(lyr);
      }, this);
      array.forEach(event.moved, function(lyr) {
        this._lyrMoved(lyr, event.target.indexOf(lyr));
      }, this);
    }

  });

  return LayerViewsOwner;

});