/**
 * The base processor class provides the generic api for processors and provides
 * an extension point from which developers can create and extend additional processors.
 *
 * @param {Object=} options - configuration options for the processor
 * @param {Array.<esri/layers/FeatureLayer>} options.layers - A FeatureLayer or
 *        array of FeatureLayers to process. (Ignored if `map` is provided)
 * @param {boolean} options.passFeatures - Should the processor pass the features through without modification
 *        or delay to the FeatureLayer. Default is _true_. See {@link esri/processors/Processor#passFeatures}.
 * @param {boolean} options.drawFeatures - Should the processor allow the feature layer to draw its features.
 *        See {@link #drawFeatures}.
 * @param {boolean} options.fetchWithWorker - Should the processor do the layer's I/O via a worker.
 *        See {@link #fetchWithWorker}.
 * @param {boolean} options.requireWorkerSupport - Does the processor require Workers to function properly.
 *        See {@link #requireWorkerSupport}.
 * @param {esri/Map} options.map - Uses all FeatureLayers associated with map in the processor. Remains in sync
 *        with the map's layers. Takes precedence over `layer` option.
 * @param {boolean} options.autostart - Start processing features immediately. Default is _true_.
 *
 * @module esri/processors/Processor
 */
define(["../core/sniff", "../core/declare",
        "dojo/_base/lang", "dojo/_base/array", "dojo/Evented", "../workers/RequestClient", "../layers/GraphicsLayer"],
  function(has, declare, lang, array, Evented, RequestClient, GraphicsLayer) {
    
    /**
     * @constructor module:esri/processors/Processor
     */
    var Processor = declare([Evented], 
    /** @lends module:esri/processors/Processor.prototype */
    {
      declaredClass: "esri.processors.Processor",
      /**
       * Layer(s) connected to the processor.
       * @type {Array.<esri/layers/FeatureLayer>}
       */
      layers: null,
      /**
       * The last results from the most recent process completed.
       * @type {Object}
       */
      results: null,

      /**
       * Pass features back to layer without delay, before processing.
       * @type {boolean}
       * @default
       */
      passFeatures: true,

      /**
       * Allow the feature layer to draw the features.
       * This interacts with the passFeatures option. If both are true, then the layer
       * will behave normally. If both are false, then the layer won't receive the features until
       * the processor is finished and then won't draw them. The other combinations will
       * either cause the features to be passed immediately, but not drawn; or passed only after
       * processing but then drawn as normal.
       * @type {boolean}
       * @default
       */
      drawFeatures: true,

      /**
       * Require support for Worker in order to use this processor.
       * The default is `true`. If this is the case and the client's browser does not support Workers
       * then this process won't attach or start and the feature layer will be unaffected by this process.
       * You should **only** modify this value to `false` with **VERY** careful consideration.
       * **USE false WITH EXTREME CAUTION**:
       * A value of `false` could cause significant slowdowns and even crashes on older browsers.
       * @type {boolean}
       * @default
       */
      requireWorkerSupport: true,
      
      /**
       * Should features be fetched through the Worker.
       * In OnDemandMode, it is almost always faster to fetch the features via the main thread
       * and then pass them to the process worker.
       * @type {boolean}
       * @default false
       */
      fetchWithWorker: false,

      /**
       * Require style string path to the post-request callback worker script.
       * Primarily used when `fetchWithWorker` is true.
       * See: {@link esri/workers/WorkerClient#addWorkerCallback}
       * @type {string}
       */
      workerCallback: null,

      /**
       * Either a require style string path to a valid worker script or an instance of {@link esri/workers/WorkerClient}.
       * See: {@link esri/workers/WorkerClient#setWorker}
       * @type {(string|esri/workers/WorkerClient)}
       */
      workerClient: null,

      /**
       * Is the processor started or stopped.
       * @type {boolean}
       * @private
       */
      _started: null,

      /**
       * Hash by layer id key of event listener handles.
       * @type {Object}
       * @private
       */
      _handlers: null,

      constructor: function(options){
        options = options || {};
        lang.mixin(this, options);

        if(!has("esri-workers") &&
           (this.requireWorkerSupport !== false || options.requireWorkerSupport !== false)){
          console.log("Browser doesn't support workers & worker support is required for this processor");
          //make this instance non-functional
          this.addLayer = this.setMap = this.start = this.runProcess = function(){};
          this._disabled = true;
          return;
        }

        this._handlers = {};

        //hitch handlers
        this._notifyProcessStart = lang.hitch(this, this._notifyProcessStart);
        this._sendFeaturesFromTask = lang.hitch(this, this._sendFeaturesFromTask);
        this._sendFeaturesFromLayer = lang.hitch(this, this._sendFeaturesFromLayer);

        if(options.autostart !== false){
          this.start();
        }
      },

      /**
       * Add layer to processor.
       * @param {esri/layers/FeatureLayer} layer
       */
      addLayer: function(layer, skipExisting) {
        var task = layer._task;
        var hnd = this._handlers[layer.id] = [];
        var event = "complete";
        //should we let the layer draw?
        if (this.drawFeatures === false) {
          layer._params.drawMode = false;
        }
        //if using worker for I/O then set it up
        if (this.fetchWithWorker) {
          if(!this.workerClient){
            this.workerClient = RequestClient.getClient(this.workerCallback);
          }
          task.requestOptions = {
            workerOptions: {
              worker: this.workerClient
            }
          };
          if (this.passFeatures) {
            hnd.push(task.on(event, lang.partial(this._notifyProcessStart, layer)));
          }
        } else {
          if (this.passFeatures) {
            event = (this.drawFeatures) ? "graphic-draw" : "graphic-add";
            hnd.push(layer.on(event, lang.partial(this._sendFeaturesFromLayer, layer)));
          } else {
            hnd.push(task.on(event, lang.partial(this._sendFeaturesFromTask, layer)));
          }
        }
        //process any existing graphics
        if(skipExisting !== true && layer.graphics){
          this.runProcess(layer.graphics, layer.id);
        }
      },

      /**
       * Remove layer from processor.
       * @param  {esri/layers/FeatureLayer} layer
       */
      removeLayer: function(layer){
        var hnd = this._handlers[layer.id];
        array.forEach(hnd, function(h){
          h.remove();
        });
        delete this._handlers[layer.id];
      },

      /**
       * Synchronize the layers the processor handles with the map's GraphicsLayer & GraphicsLayer subclasses (FeatureLayer etc).
       * @param {esri/Map} map - the map instance to synchronize layers with
       */
      setMap: function(map){
        if(this.map){
          if(map != this.map){
            this.unsetMap();
          } else {
            return;
          }
        }
        var that = this;
        //remove any layers currently in the processor
        array.forEach(this.layers, that.removeLayer);
        //add any graphics layers currently in the map
        array.forEach(map.graphicsLayerIds, function(id){
          that.addLayer(map.getLayer(id));
        });
        //listen for added or removed layers
        this._handlers.map = [
          map.on("layer-add", function(evt){
            var lyr = evt.layer;
            if(lyr.isInstanceOf(GraphicsLayer)){
              that.addLayer(lyr);
            }
          }),
          map.on("layer-remove", function(evt){
            var lyr = evt.layer;
            if(lyr.isInstanceOf(GraphicsLayer)){
              that.removeLayer(lyr);
            }
          })
        ];
        this.map = map;
      },

      unsetMap: function(){
        if(!this.map){
          return;
        } else {
          var that = this;
          array.forEach(this._handlers.map, function(h){
            h.remove();
          });
          delete this._handlers.map;
          array.forEach(this.layers, that.removeLayer);
          this.map = null;
        }
      },

      /**
       * Start the processor. Normally occurs automatically. Fires the `start` event.
       */
      start: function() {
        if (this.map) {
          this.setMap(this.map);
        } else if (this.layers) {
          if (!lang.isArray(this.layers)) {
            this.layers = [this.layers];
          }
          array.forEach(this.layers, this.addLayer);
        }
        this._started = true;
        this.emit("start", {
          processor: this
        });
        console.log("processor started");
      },

      /**
       * Stop the processor. Fires the `stop` event.
       */
      stop: function(){
        this._started=false;
        for (var hnd in this._handlers) {
          if (this._handlers.hasOwnProperty(hnd)) {
            this._handlers[hnd].remove();
            delete this._handlers[hnd];
          }
        }
        this.emit("stop", {processor:this});
        console.log("processor stopped");
      },

      runProcess: function(features, layerId){
        // to be implimented by subclasses
      },
      _sendFeaturesFromTask:function(){},
      _sendFeaturesFromLayer:function(){},
      _notifyProcessStart:function(){}
    });

    return Processor;
  });