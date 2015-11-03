define([
  "../../../core/declare",
  "dojo/_base/lang",

  "dojo/promise/all",
    
  "../../../core/Accessor",
  "../../../core/Promise",
  "../../../core/Evented",

  "../../../tasks/support/Query"
],
function(
  declare, lang,
  all, 
  Accessor, Promise, Evented,
  Query
) {

  var SnapshotController = declare([Accessor, Promise, Evented], {
    declaredClass: "esri.layers.graphics.controllers.SnapshotController",
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function() {
      this._addFeatures = this._addFeatures.bind(this);
      this._nextQuery = this._nextQuery.bind(this);
      this._queryError = this._queryError.bind(this);
      this._queryExtent = null;
      this._queryExtentHandle = null;
    },

    initialize: function() {
      var loadPromise = all([ this.layer, this.layerView ])
        .then(
          function() {
            this.graphicsSource = this.layer.graphicsSource;

            // graphicsCollection is passed as a constructor parameter
            this.graphicsCollection = this.graphicsCollection;
          }.bind(this)
        );
      
      this.addResolvingPromise(loadPromise);

      this.then(this._startQuerying.bind(this));
    },

    destroy: function() {
      this.graphicsCollection = null;
    },
    
    _startQuerying: function() {
      this._initializeExtent();
      this._queryAll();
    },

    
    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------
    
    _colChgHdl: null,

    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  graphicsCollection
    //----------------------------------

    _graphicsCollectionSetter: function(value, oldValue) {
      if (oldValue === value) {
        return oldValue;
      }

      if (oldValue) {
        this._colChgHdl.remove();
        this._colChgHdl = null;
        this.clear();
      }

      if (value) {
        value.forEach(function(g) {
          g.layer = this.layer;
        }, this);

        this._colChgHdl = value.on("change", 
          function(event) {
            var i, g, arr;
            arr = event.added;
            for (i = 0; (g = arr[i]); i++) {
              g.layer = this.layer;
            }
            arr = event.removed;
            for (i = 0; (g = arr[i]); i++) {
              g.layer = null;
            }
          }.bind(this)
        );
      }
      return value;
    },

    
    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    _initializeExtent: function() {
      if (this.extentAccessor) {
        // Copy the initial extent
        var extent = this.extentAccessor.get(this.extentProperty);
        this._queryExtent = extent && extent.clone();

        if (this._queryExtent) {
          // If the extent changes in any way, disable the extent
          // Reason: Once the extent changes, drop into an "edit mode" where the controller downloads all features 
          // and lets feature layers deal with the extent clipping.
          this._queryExtentHandle = this.extentAccessor.watch(this.extentProperty, function() {
            this._queryExtent = null;
            this._queryExtentHandle.remove();
            this._queryExtentHandle = null;
            if (this.isFulfilled()) {
              // Already started querying using previous extent, start new query.
              // Responses of already running queries are simply ignored.
              this.graphicsCollection.clear();
              this._queryAll();
            }
          }.bind(this));
        }
      }
      else {
        this._queryExtent = null;
        this._queryExtentHandle = null;
      }
    },

    _extentsEqual: function(e1, e2) {
      if (e1 == null && e2 == null) {
        return true;
      }
      else if (e1 == null || e2 == null) {
        return false;
      }
      else {
        return e1.equals(e2);
      }
    },

    _queryAll: function() {
      var layer = this.layer,
          layerView = this.layerView,
          capabilities = layer.advancedQueryCapabilities || {},
          pagination = !!(capabilities.supportsPagination);

      var query = new Query();
      query.where = layer.definitionExpression || "1=1";
      query.outFields = layer.outFields;
      query.returnGeometry = true;
      query.outSpatialReference = layerView.view.map.spatialReference;
      query.returnZ = (layer.hasZ && layer.returnZ) || null;
      query.returnM = (layer.hasM && layer.returnM) || null;
      query.geometry = this._queryExtent;

      if (pagination) {
        this.pageSize = this.maxPageSize == null ? layer.maxRecordCount : Math.min(layer.maxRecordCount, this.maxPageSize);
        query.num = this.pageSize;
      }

      // Pass the current (i.e., at the time the query started) extent
      this._query(query, pagination ? 0 : undefined, this._queryExtent);
    },
     
    _query: function(query, start, queryExtent) {
      var nextStart;

      if (start != null) {
        query.start = start;
        nextStart = start + this.pageSize;
      }

      this.graphicsSource
          .queryFeatures(query)
          // Let's first send a other query
          // before adding to the collection.
          .then(
            lang.hitch(this, this._nextQuery, query, nextStart, queryExtent)
          ).then(
            this._addFeatures,
            this._queryError
          );
    },

    _addFeatures: function(response) {
      this.graphicsCollection.addItems(response.features);
      return response;
    },

    _nextQuery: function(query, start, queryExtent, response) {
      var nextQueryStarted = false;

      // Stop starting new queries if the extent changed
      if (!this._extentsEqual(queryExtent, this._queryExtent)) {
        return;
      }

      if (response.exceededTransferLimit) {
        if (start !== undefined) {
          this._query(query, start, queryExtent);
          nextQueryStarted = true;
        }
        this.emit("query-limit-exceeded");
      }
      if (!nextQueryStarted) {
        this.emit("all-features-loaded");
      }
      return response;
    },

    _queryError: function() {
      // TODO
    }
  });

  return SnapshotController;
  
});
