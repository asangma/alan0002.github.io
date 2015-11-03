/**
 * Builds and maintains a spatial index of feature geometry in one or more FeatureLayer.
 *
 * @param {Object=} options - configuration options for the processor
 * @param {string} options.indexType - The indexing system to use. One of `rtree`, `kdtree`, `quadtree`. kdtree is
 *        only used for points. **Default** : 'rtree'
 * @param {Object=} options.indexOptions - Index system specific options.
 *
 * @module esri/processors/SpatialIndex
 */
define(["../core/declare", "dojo/Deferred", "dojo/_base/lang",
        "./Processor", "../workers/WorkerClient", "../layers/FeatureLayer"],
  function(declare, Deferred, lang, Processor, WorkerClient, FeatureLayer) {

    /**
     * @extends module:esri/processors/Processor
     * @constructor module:esri/processors/SpatialIndex
     */
    var SpatialIndex = declare([Processor], 
    /** @lends module:esri/processors/SpatialIndex.prototype */
    {
      declaredClass: "esri.processors.SpatialIndex",
      
      index: null,

      indexType: "rtree",

      workerCallback: ["./scripts/helpers","./scripts/indexInterface","./indexWorker"],

      autostart: false,
      
      constructor: function(options){
        options = options ||{};
        var auto = options.autostart !== false;
        lang.mixin(this, options);
        
        if(!this.fetchWithWorker){
          var that = this;
          this.workerClient = new WorkerClient("./mutableWorker");
          this.workerCallback.push("./libs/" + this.indexType);
          this.workerClient.importScripts(this.workerCallback).then(function() {
            that._attachedSystem = true;
            auto && that.start();
          });
        }
        this._featCache={};
      },

      addLayer: function(layer, force) {
        if ((layer.graphics && layer.graphics.length) || force || layer.isInstanceOf(FeatureLayer)) {
          if (!this._attachedSystem) {
            var wc = this.workerClient,
              that = this;
            this.inherited(arguments, [layer, true]);
            wc.importScripts("./libs/" + this.indexType).then(function() {
              that.runProcess(layer.graphics, layer.id);
              that._attachedSystem = true;
            });
          } else {
            this.inherited(arguments, [layer]);
          }
        }
      },

      unsetMap: function(){
        //TODO - remove layers from index (don't go nuclear)
        //nuclear option ... BOOM!, goodbye, restart
        this.stop();
        this.workerClient.terminate();
        if(!this.fetchWithWorker){ //add layer will set workerClient if using workerIO
          this.workerClient = new WorkerClient(this.workerCallback);
        }
        this.inherited(arguments);
        this.start();
      },

      removeLayer: function(layer){
        //TODO - remove layers from index
        this.inherited(arguments);
      },

      runProcess: function(features, layerId){
        if(!features || !features.length){
          return;
        }
        var that = this,
            wc = this.workerClient,
            lyr = features[0]._graphicsLayer;
        if(!layerId && layerId !== 0){
          layerId = (lyr) ? lyr.id : "rawFeatures_" + Object.keys(this._featCache).length;
        }
        if(!this._featCache[layerId]){
          this._featCache[layerId] = {};
        }
        var id, feat, insert = [];
        var len = features.length;
        var oidField = lyr && lyr.objectIdField;
        while(len--){
          feat = features[len];
          id = (feat.attributes && oidField) ? feat.attributes[oidField] : feat.id;
          if(id == null || !this._featCache[layerId][id]){
            this._featCache[layerId][id] = 1;
            if(feat.declaredClass){ //we have a graphic, not an object literal
              insert.push({
                id: id,
                geometry: feat.geometry.toJSON(true),
                attributes: feat.attributes
              });
            } else {
              insert.push(feat);
            }
          }
        }
        wc.postMessage({
          insert: insert,
          system: this.indexType,
          options: this.indexOptions,
          idField: lyr && lyr.objectIdField,
          layerId: layerId
        }).then(function(msg){
          if (lyr) {
            lyr.emit("process-end", {
              processor: that,
              results: {
                insert: msg.insert
              }
            });
          }
        });
        if (lyr) {
          lyr.emit("process-start",{
            processor: this
          });
        }
      },
      _sendFeaturesFromLayer:function(layer, evt){
        //TODO handle zoom level changes
        //TODO handle removes
        var feature = evt.graphic,
        wc = this.workerClient,
        that = this,
        id = feature.attributes[layer.objectIdField];
        if(!this._featCache[layer.id]){
          this._featCache[layer.id] = {};
        }
        if(!this._featCache[layer.id][id]){
          this._featCache[layer.id][id] = 1;
          wc.postMessage({
            insert: [{
              attributes: feature.attributes,
              geometry: feature.geometry.toJSON(true)
            }],
            system: this.indexType,
            options: this.indexOptions,
            idField: layer.objectIdField,
            layerId: layer.id
          }).then(function(msg){
            layer.emit("process-end",{
              processor: that,
              results: {
                insert: msg.insert
              }
            });
          });
          layer.emit( "process-start",{
            processor: that
          });
        }
      },
      _notifyProcessStart:function(layer, evt){
      },
      _sendFeaturesFromTask:function(layer, evt){
        var features = evt.featureSet.features;
        var deduped = [];
        var wc = this.workerClient;
        var that = this;
        var len = features.length;
        var id, feat;
        if(!this._featCache[layer.id]){
          this._featCache[layer.id] = {};
        }
        while (len--) {
          feat = features[len];
          id = feat.attributes[layer.objectIdField];
          if (!this._featCache[layer.id][id]) {
            this._featCache[layer.id][id] = 1;
            deduped.push(feat);
          }
        }
        wc.postMessage({
          insert: deduped,
          system: this.indexType,
          options: this.indexOptions,
          idField: layer.objectIdField,
          layerId: layer.id
        }).then(function(msg){
          layer.emit("process-end",{
            processor: that,
            results: {
              insert: msg.insert
            }
          });
        });
        layer.emit("process-start",{
          processor: that
        });
      },

      get: function(){
        //TODO Impliment get in worker
      },
      /**
       * Searches index for items which intersect the test object. This is a bounding box search.
       * @param  {(esri/geometry/Point|esri/Graphic|esri/geometry/Extent|Array.<number>)} test - the point or area to intersect
       * @param {boolean} getRects - `true` to get the rectangle object with data in `leaf`, otherwise just get the id's. @default false
       * @return {Promise} Promise resolves with an array of matching ids or rtree rectangles, with the feature id in the leaf property
       */
      intersects: function(test, layerId, getRects, onlyIds){
        var dfd;
        if(this.indexType != "rtree"){
          var msg = "Index.intersects only works with rtree indexes";
          console.error(msg);
          dfd = new Deferred();
          dfd.reject({message: msg});
          return dfd.promise;
        }

        return this.workerClient.postMessage({
          search: test,
          layerId: layerId,
          returnNode: getRects,
          onlyIds: onlyIds
        });
      },

      /**
       * Searches index for items whose bounding box is completely contained **within** the test object's bounding box.
       * @param  {(esri/Graphic|esri/geometry/Extent|Array.<number>)} test - the area to search within
       * @param {boolean} getRects - `true` to get the rectangle objects with data in `leaf`, otherwise just get the id's. @default false
       * @return {Promise} Promise resolves with an array of matching ids or rtree rectangles, with the feature id in the leaf property
       */
      within: function(test, layerId, getRects){
        var dfd;
        if(this.indexType != "rtree"){
          var msg = "Index.within only works with rtree indexes";
          console.error(msg);
          dfd = new Deferred();
          dfd.reject({message: msg});
          return dfd.promise;
        }
        //TODO impliment within in worker where it can use rtree's RTree.Rectangle.contains_rectangle
      },

      /**
       * Searches for the nearest point(s) to the passed point within the specified criteria
       * @param  {{point, count: number, distance: number, filter}} criteria
       * @param {(esri/geometry/Point|Array.<number>|esri/Graphic)} criteria.point - the point to find nearest neighbors of
       * @param {number=} criteria.count - the maximum number of nearest points to return
       * @param {number=} criteria.distance - the maximum distance from the search point to return points for
       * @param {function(): boolean=} criteria.filter - a function which determines if the point should be included in the results
       * @return {Promise} Promise resolves with an array of matching points and their associated distances
       */
      nearest: function(criteria){
        var dfd;
        if(this.indexType != "kdtree"){
          var msg = "Index.nearest only works with kdtree indexes";
          console.error(msg);
          dfd = new Deferred();
          dfd.reject({message: msg});
          return dfd.promise;
        }

        return this.workerClient.postMessage({
          search: criteria
        });
      }

    });

    return SpatialIndex;
  });
