/**
 * The StreamController is the controller associated with a StreamLayer. It is created when a
 * StreamLayer is added to a MapView or SceneView. Events are emitted by the StreamController and not
 * by the StreamLayer. This is because a StreamLayer can get added to numerous Map or Scene Views,
 * and a controller is created for each view of the layer.
 *
 * @module esri/layers/graphics/controllers/StreamController
 * @since 4.0
 * @see module:esri/layers/StreamLayer
 */

/**
 * Fires when a connection with the web socket server is opened. See the example code to see how to access the controller and register event handlers.
 * @event module:esri/layers/graphics/controllers/StreamController#connect
 * @example
 * var streamLayer = new StreamLayer('http://geoeventsample3.esri.com:6080/arcgis/rest/services/SeattleBus/StreamServer');
 * streamLayer.on('graphics-controller-create', function(evt){
 *  var controller = evt.graphicsController;
 *  controller.on('connect', processConnect);
 * });
 */

/**
 * Fires when a connection with the web socket server is closed.
 * @event module:esri/layers/graphics/controllers/StreamController#disconnect
 */

/**
 * Fires when the controller receives a message. The message is a [](http://resources.arcgis.com/en/help/rest/apiref/feature.html).
 * @event module:esri/layers/graphics/controllers/StreamController#message
 * @property {Object=}  attributes The attributes of the feature.
 * @property {Object=}  geometry The geometry of the feature.
 */

/**
 * Fires when the server-side filter changes.
 * @event module:esri/layers/graphics/controllers/StreamController#filter-change
 * @property {Object=} filter  The properties of the server-side filter. Properties can include:
 * * outFields: the fields that are included in the attributes of features
 * * geometry: The extent used to filter. Corresponds to the `geometryDefinition` property on the layer.
 * * where: The where clause used for filtering. Corresponds to the `definitionExpression` property on the layer.
 * @property {Object=}  error The error that explains why a filter could not be set on the server.
 */

define([
  "../../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/promise/all",
  "dojo/_base/Deferred",

  "../../../core/Accessor",
  "../../../core/HandleRegistry",
  "../../../core/Promise",
  "../../../core/Evented",

  "../../support/StreamPurger",
  "../../../Graphic",
  "../../../geometry/support/jsonUtils"
],
function(
  declare, lang, array, all, Deferred,
  Accessor, HandleRegistry, Promise, Evented,
  StreamPurger, Graphic, geomJsonUtils
) {
  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/layers/graphics/controllers/StreamController
   */
  var StreamController = declare([Accessor, Promise, Evented], /** @lends module:esri/layers/graphics/controllers/StreamController.prototype */ {
    declaredClass: "esri.layers.graphics.controllers.StreamController",

    constructor: function (){
      this._addFeatures = lang.hitch(this, this._addFeatures);
      this._handleMessage = lang.hitch(this, this._handleMessage);
      //this._watchHandlers = [];
      this._handleRegistry = new HandleRegistry();
      this._nextId = 0;
      this._socketConnector = null;
      this._filter = {
        geometry: null,
        where: null
      };
    },

    initialize: function() {
      //console.log("initializing stream controller");
      var self = this,
        dfd = new Deferred(),
        loadPromise = all([this.layer, this.layerView]);

      loadPromise.then(
        function () {
          //set graphics source, and graphics collection
          self.graphicsSource = self.layer.graphicsSource;
          self.graphicsCollection = self.graphicsCollection || self.layer.graphicsCollection;

          //make new stream purger
          var purger = new StreamPurger(self);
          purger.then(function(){
            self.purger = purger;

            self._handleRegistry.add(self.watch("layer.requestedDefinitionExpression", function(expression){
              var filter = {
                where: expression
              };
              if(self._filterValid(filter) && self._filterChanged(filter)){
                self._setFilter(filter);
              }
            }));

            self._handleRegistry.add(self.watch("layer.requestedGeometryDefinition", function(geometry){
              var filter = {
                geometry: geometry
              };
              if(self._filterValid(filter) && self._filterChanged(filter)){
                self._setFilter(filter);
              }
            }));

            self._makeConnection();

            // TODO: add listener layer.on("graphicsCollection-change")
          }, function(err){
            self.addResolvingPromise(dfd.promise);
            dfd.reject(err);
          });
        }
      );

      return dfd.promise;
    },

    destroy: function() {
      //console.log("Controller destroyed");
      //disconnect from socket
      if(this._socketConnector){
        this._disconnect();
        this._socketConnector = null;
      }

      //destroy the purger
      if(this.purger){
        this.purger.destroy();
        this.purger = null;
      }

      //remove watch handlers
      if(this._handleRegistry){
        this._handleRegistry.destroy();
        this._handleRegistry = null;
      }
    },

    //-------------------------------------
    //
    // Property Accessors
    //
    //-------------------------------------

    //graphicsCollection
    graphicsCollection: null,
    _gfxColHdl: null,

    _graphicsCollectionSetter: function(value) {
      var oldValue = this.graphicsCollection;
      if (oldValue === value) {
        return oldValue;
      }
      if (this._gfxColHdl) {
        this._gfxColHdl.remove();
        this._gfxColHdl = null;
        oldValue.forEach(function(g) {
          g.layer = null;
        });
      }

      if (value) {
        value.forEach(function(g) {
          g.layer = this.layer;
        }, this);
        this._gfxColHdl = value.on("change", lang.hitch(this, function(event) {
          var i,g,arr;
          arr = event.added;
          for (i = 0; (g = arr[i]); i++) {
            g.layer = this.layer;
          }
          arr = event.removed;
          for (i = 0; (g = arr[i]); i++) {
            g.layer = null;
          }
        }));
      }
      return value;
    },

    /**
     * The expression used to filter messages sent by the stream service.
     *   Only valid when the StreamLayer data source is an ArcGIS Server Stream Service
     * @name definitionExpression
     * @instance
     * @type {string}
     */
    _definitionExpressionSetter: function(value){
      var oldValue = this._filter.where,
        filter = {
          definitionExpression: value
        };
      if(!this._filterValid(filter) || !this._filterChanged(filter)){
        return oldValue;
      }
      else{
        this._setFilter(filter);
      }
    },

    _definitionExpressionGetter: function(){
      return this._filter.where;
    },

    /**
     * The spatial extent used to filter messages sent by the stream service.
     *   Only valid when the StreamLayer data source is an ArcGIS Server Stream Service
     * @name geometryDefinition
     * @instance
     * @type {module:esri/geometry/Extent}
     */
    _geometryDefinitionSetter: function(value){
      var oldValue = this._filter.geometry,
        filter = {
          geometryDefinition: value
        };
      if(!this._filterValid(filter) || !this._filterChanged(filter)){
        return oldValue;
      }
      else{
        this._setFilter(filter);
      }
    },

    //currentSocketUrl - Url being used for socket connection
    currentSocketUrl: null,

    _geometryDefinitionGetter: function(){
      return this._filter.geometry;
    },

    //-------------------------------------
    //
    // Public Methods
    //
    //-------------------------------------

    /**
     * Open a web socket connection with the server and start receiving messages
     */
    connect: function(){
      this._connect();
    },

    /**
     * Close the web socket connection
     */
    disconnect: function(){
      this._disconnect();
    },

    //-------------------------------------
    //
    // Private Methods
    //
    //-------------------------------------

    //make WebSocketConnector and connect to Stream Service or socket server
    _makeConnection: function(){
      var self = this,
        mapSR;

      mapSR = this.layerView.view.map.spatialReference;
      this.graphicsSource.createWebSocketConnector(mapSR).then(function(wsconn){
        self._socketConnector = wsconn;
        self._handleRegistry.add(wsconn.on("connect", function(){
          self.emit("connect");
        }));
        self._handleRegistry.add(wsconn.on("disconnect", function(e){
          self.emit("disconnect", e);
        }));
        self._handleRegistry.add(wsconn.on("attempt-reconnect", function(e){
          self.emit("attempt-reconnect", e);
        }));
        self._handleRegistry.add(wsconn.on("message", function(msg){
          self._handleMessage(msg);
        }));
        self._handleRegistry.add(wsconn.watch("currentSocketUrl", function(value){
          self.currentSocketUrl = value;
        }));

        wsconn.connect();
      });
    },

    _connect: function(){
      if(this._socketConnector){
        this._socketConnector.connect();
      }
    },

    _disconnect: function(){
      if(this._socketConnector){
        this._socketConnector.disconnect();
      }
    },

    _handleMessage: function(msg){
      var jsonmsg = JSON.parse(msg),
        features;

      //emit message event for clients
      this.emit("message", jsonmsg);

      //handle filter message
      if(jsonmsg.hasOwnProperty("filter")){
        this._handleFilterMessage(jsonmsg);
      }
      else{
        features = jsonmsg instanceof Array ? jsonmsg : [jsonmsg];
        //right now assume that all features received are added.
        this._addFeatures(features);
      }
    },

    _addFeatures: function(features) {
      var oidField = this.layer.objectIdField,
        graphics = [];
      array.forEach(features, function(f){
        var graphic;
        if(!f.attributes || !(f.attributes[oidField] || f.attributes[oidField] === 0)){
          if (!f.geometry){
            //console.log("Not adding. No ObjectID and no geometry");
            return false;
          }
          //cover case where geometry set but not attributes
          f.attributes = f.attributes || {};
          f.attributes[oidField] = this._nextId++;
        }
        if (!f.declaredClass){
          graphic = Graphic.fromJSON(f);
        }
        else{
          graphic = f;
        }
        graphics.push(graphic);
      }, this);

      this.graphicsCollection.addItems(graphics);
      return features;
    },

    /**
     * Checks if the filterChanges object is different than the currently set filter
     * @param {Object} filterChanges
     * @returns {boolean}
     * @private
     */
    _filterChanged: function(filterChanges){
      var filter,
        geometryChanged = false,
        whereChanged = false;
      if(!filterChanges){
        filter = {
          geometry: null,
          where: null
        };
      }
      else{
        filter = this.graphicsSource.makeFilter(filterChanges);
      }

      //check if geometry changed
      if(filter.hasOwnProperty("geometry")){
        geometryChanged = filter.geometry ? !filter.geometry.equals(this._filter.geometry) : filter.geometry !== this._filter.geometry;
      }

      //check if where changed
      if(filter.hasOwnProperty("where")){
        whereChanged = filter.where !== this._filter.where;
      }
      return geometryChanged || whereChanged;
    },

    /**
     * Checks if the filter object contains valid values
     * @param {Object} filter
     * @returns {boolean}
     * @private
     */
    _filterValid: function(filter){
      var filterValid = true;

      if(filter){
        if(filter.hasOwnProperty("geometryDefinition") && filter.geometryDefinition){
          if(!filter.geometryDefinition.type || filter.geometryDefinition.type !== "extent"){
            filterValid = false;
          }
        }
        if(filterValid && filter.hasOwnProperty("definitionExpression") && filter.definitionExpression){
          if(typeof filter.definitionExpression !== "string"){
            filterValid = false;
          }
        }
      }
      return filterValid;
    },

     //Sends a message to the stream service to update the server-side filter. A null filter clears the filter on the server.
    _setFilter: function(filterChanges){
      var filter = this.graphicsSource.makeFilter(filterChanges);
      if(filter.geometry && typeof filter !== "string"){
        filter.geometry = JSON.stringify(filter.geometry.toJSON());
      }
      var filterMessage = {
          filter: filter || null
        };
      this._socketConnector.send(filterMessage);
    },

    _handleFilterMessage: function(msg){
      var filter,
        error,
        geometry;
      //fire error event if message has error
      if (msg.error){
        error = new Error(msg.error.join(","));
        this.emit("filter-change", {filter: msg.filter, error: error});
      }
      else{
        //Set layer properties to match filter if filter values equal layer's requested values
        filter = {
          where: msg.filter.where ? msg.filter.where : null,
          geometry: msg.filter.geometry ?  msg.filter.geometry : null,
          outFields:  msg.filter.outFields ?  msg.filter.outFields : null
        };
        geometry = filter.geometry;
        if (geometry){
          if(typeof geometry === "string"){
            geometry = JSON.parse(geometry);
          }
          geometry = geomJsonUtils.fromJSON(geometry);
        }

        this._filter.geometry = geometry;
        this._filter.where = filter.where;

        //notify change to clear cached values for definitions
        this.notifyChange("definitionExpression");
        this.notifyChange("geometryDefinition");

        //fire filter-change event
        this.emit("filter-change", {filter: this._filter});
      }
    }
  });

  return StreamController;
});
