/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
define([
  "../core/declare",

  "../core/Collection"
],
function(
  declare,
  Collection
) {

  var FlatLayerViewsCollection = declare([Collection], {

    classMetadata: {
      properties: {
        view: {}
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._handles = new Collection();
      this._reset = this._reset.bind(this);
      this._watcher = this.watch([
        "view.factory.working",
        "view.layerViews",
        "view.basemapView.baseLayerViews",
        "view.basemapView.referenceLayerViews",
        "view.basemapView.elevationLayerViews"
      ], this._reset);
    },

    initialize: function() {
      this._reset();
    },

    destroy: function() {
      this._handles.drain(function(handle) {
        handle.remove();
      });
      this._handles = null;
      this._watcher.remove();
      this._watcher = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    view: null,

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _reset: function(event) {
      if (!this._accessorProps.initialized) {
        return;
      }
      
      if (this.get("view.factory.working")) {
        return;
      }

      var layerViews = this.get("view.layerViews");
      var baseLayerViews = this.get("view.basemapView.baseLayerViews");
      var referenceLayerViews = this.get("view.basemapView.referenceLayerViews");
      var elevationLayerViews = this.get("view.basemapView.elevationLayerViews");
      var removed, i, n, items, item, idx;

      
      this._handles.drain(function(handle) {
        handle.remove();
      });
      
      items = [];

      this._pushItem(items, elevationLayerViews);
      this._pushItem(items, baseLayerViews);
      this._pushItem(items, layerViews);
      this._pushItem(items, referenceLayerViews);

      // remove the layers not anymore in the hierarchy
      removed = this.filter(function(item) {
        return items.indexOf(item) === -1;
      });
      this.removeItems(removed);

      for (i = 0, n = items.length; i < n; i++) {
        item = items[i];
        if (this.getItemAt(i) !== item) {
          // 2 cases:
          //  - the item is somewhere else
          //  - item is not in the collection
          idx = this.indexOf(item);
          if (idx > -1) {
            this.moveItem(item, i);
          }
          else {
            this.addItem(item, i);
          }
        }
      }
    },

    _pushItem: function(items, item) {
      var children = this._getChildren(item);
      if (children) {
        children.forEach(function(item) {
          this._pushItem(items, item);
        }, this);
        this._handles.addItem(children.on("change", this._reset));
        return;
      }
      if (item) {
        items.push(item);
      }
    },

    _getChildren: function(item) {
      return item ? item.isInstanceOf(Collection) ? item : item.layerViews : null;
    }

    /*
     * return the first range of consecutive values in an array.
     * @returns an Array of 2 values. 1st value is the index, 2nd the count of consecutive values.
     * @usage
     *   var fn = function(a,b) {return b - a === 1};
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn)    // [0, 4]
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn, 4) // [4, 1]
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn, 5) // [5, 3]
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn, 8) // null
     */
    /*_getRange: function(arr, compareFn, fromIndex) {
      var idxStart, idxEnd,
          i;
      fromIndex = fromIndex == null ? 0 : fromIndex;
      if (fromIndex >= arr.length) {
        return null;
      }
      idxStart = idxEnd = i = fromIndex;      
      while (compareFn(arr[i], arr[i + 1])) {
        idxEnd = i + 1;
        i++;
      }
      return idxStart == idxEnd ? [idxStart, 1] : [idxStart, idxEnd - idxStart + 1];
    }*/

  });

  return FlatLayerViewsCollection;

});