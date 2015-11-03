/**
 * The stream layer extends the feature layer to add the ability to connect to a stream of data using HTML5 WebSockets.
 * It connects to a server that emits geographic features continuously. While the feature layer is used to map relatively
 * static data, the stream layer is suitable when you would like to map dynamic streams of data that are unbounded and
 * continuous. When a stream layer is added to a map, users are able to see any real-time updates pushed out by the server.
 *
 * A real-time-enabled data server is required to use this class.
 * [The ArcGIS GeoEvent Processor for Server](http://server.arcgis.com/en/geoevent-extension/latest/get-started/what-is-arcgis-geoevent-extension-for-server.htm)
 * is a tool you may use to set up and configure your data stream. In addition, version 10.3 of ArcGIS GeoEvent Extension
 * for Server exposes stream services. To learn more about this,
 * please see the [Stream Services documentation](http://server.arcgis.com/en/server/latest/publish-services/windows/stream-services.htm).
 *
 * You may also use your own web socket server, as long as it emits geographic features in
 * the [Esri JSON format](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Feature_object/02r3000000n8000000/).
 *
 * The number of features coming from a real-time feed can overload the browser and make the browser unresponsive.
 * Use the [purgeOptions](#purgeOptions) construction option to define rules that specify how to remove data
 * when new messages are received and the layer is refreshed.
 *
 * ::: esri-md class="panel trailer-1"
 * WebSockets are a feature of HTML5. Most browsers are supporting WebSockets in recent versions. However, they are
 * not supported by all versions of all browsers. To get more information about WebSockets and to test if a browser
 * supports WebSockets, visit [WebSocket.org](http://websocket.org).
 * :::
 *
 * The StreamLayer does not emit events. Events are emitted by the {@link module:esri/layers/graphics/controllers/StreamController}
 * that gets created when a Stream Layer is added to a Map or Scene View. To get a reference to the controller, use the
 * Stream Layer's `graphics-controller-create` event.
 * ```
 * var streamLayer = new StreamLayer('http://geoeventsample3.esri.com:6080/arcgis/rest/services/SeattleBus/StreamServer');
 * streamLayer.on('graphics-controller-create', function(evt){
 *  var controller = evt.graphicsController;
 *  controller.on('connect', processConnect);
 * });
 * ```
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 *
 * @module esri/layers/StreamLayer
 * @since 4.0
 * @see [Sample - Add StreamLayer to your Map](../sample-code/2d/stream-layer/)
 * @see module:esri/layers/FeatureLayer
 * @see @todo module:esri/layers/graphics/controllers/StreamController
 */

define(
[
  "require",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Deferred",

  "../core/sniff",
  "../geometry/SpatialReference",
  "../core/Collection",
  "./FeatureLayer"
],
function(
  require, declare, lang, array, Deferred, has,
  SpatialReference, Collection, FeatureLayer
) {

  /**
   * @extends module:esri/layers/FeatureLayer
   * @constructor module:esri/layers/StreamLayer
   * @param {string|Object} url If the source for the layer is a Stream Service, this is the url to the service.
   * If the source is a GeoEvent web socket output, then this is an object that defines a feature collection.
   * @param {Object=} options Optional configuration parameters. The options are:
   * * purgeOptions: See the purge options property for more information.
   * * socketUrl: The url to use to make a web socket connection. This is required if the
   * source for the layer is not a Stream Service.
   *
   * @example
   * var streamLayer = new StreamLayer('http://geoeventsample3.esri.com:6080/arcgis/rest/services/SeattleBus/StreamServer', {
   *   purgeOptions: {
   *     displayCount: 1000
   *   });
   */
  var StreamLayer = declare([FeatureLayer], /** @lends module:esri/layers/StreamLayer.prototype */ {
    declaredClass: "esri.layers.StreamLayer",

    classMetadata:{
      reader: {
        add: [
          "objectIdField"
        ]
      }
    },

    //-------------------------------------
    //
    // Lifecycle
    //
    //-------------------------------------

    /**
     * Creates the Stream Layer
     * @private
     * @param {Object|string} url Url to the Stream Service or a feature collection object
     * @param {object} options  optional configuration parameters
     */
    constructor: function(url, options){
      if(!("WebSocket" in window)){
        this.loadError = new Error("WebSocket is not supported in this browser");
        console.log("WebSocket is not supported in this browser. StreamLayer will not have real-time connection with the stream service.");
      }

      /*this.addComputed({
        filter: [ "definitionExpression", "geometryDefinition", "outFields" ]
      });*/

      /*this.reader({
        add: [
          "objectIdField"
        ]
      });*/
    },

    /**
     * Normalizes the constructor arguments
     * @private
     * @param {Object|string} url Either a url string to a stream service or an object
     * that is a Feature Collection
     * @param {Object} options Optional parameters
     * @returns {Object} Returns a single object containing the properties needed to create the Stream Layer
     */
    normalizeCtorArgs: function(url, options) {
      // StreamLayer by URL
      if (typeof url === "string") {
        return lang.mixin({}, {
          url: url
        }, options);
      }
      // StreamLayer by reference
      else if (url && url.layerDefinition) {
        return lang.mixin({}, {
          collectionLayer: url
        }, options);
      }
      return url;
    },

    /**
     * Sets default properties
     * @private
     * @param properties
     * @returns {*|Object}
     */
    getDefaults: function(properties) {
      var defaults = this.inherited(arguments),
        collectionLayer = properties.collectionLayer;

      return lang.mixin(defaults || {}, {
        maximumTrackPoints: 1,
        purgeOptions: {
          displayCount: 2000
        },
        maxReconnectAttempts: 10,
        socketDirection: "subscribe",
        outFields: ["*"],
        hasMemorySource: !!collectionLayer
      });
    },

    // TODO Add initialize function to StreamLayer when it no longer needs to inherit from FeatureLayer

    //-------------------------------------
    //
    // Graphics related
    //
    //-------------------------------------

    /**
     * Create the Stream Layer Source
     * @private
     * @returns {*} Returns a promise that resolves with the Stream Layer Source
     */
    //this is called by FeatureLayer.initialize()
    createGraphicsSource: function() {
      var dfd = new Deferred();

      require(
        [ "./graphics/sources/StreamLayerSource"],

        lang.hitch(this, function(SourceClass) {
          var source = new SourceClass({
            layer: this
          });

          source.then(
            lang.hitch(this, function() {
              this.emit("graphics-source-create", {
                graphicsSource: source
              });

              dfd.resolve(source);
            }),

            function(err) {
              dfd.reject(err);
            }
          );
        })
      );

      return dfd.promise;
    },

    /**
     * Create the Stream Controller
     * @private
     * @returns {*} Returns a promise that resolves with the Stream Controller
     */
    createGraphicsController: function(parameters) {
      var dfd = new Deferred(),
        modulePath = "./graphics/controllers/StreamController",
        layerView  = parameters.layerView,
        map        = layerView.view.map,
        collection = map.view === layerView.view ? this.graphicsCollection : new Collection(),
        controllerProps = lang.mixin(parameters.options || {}, {
          layer: this,
          layerView: layerView,
          graphicsCollection: collection
        });

      if (modulePath) {
        // Import and instantiate the controller of the desired type
        require(
          [ modulePath ],

          lang.hitch(this, function(ControllerClass) {
            var controller = new ControllerClass(controllerProps);

            controller.then(
              lang.hitch(this, function() {
                //this.set("graphicsController", controller);

                this.emit("graphics-controller-create", {
                  graphicsController: controller
                });

                dfd.resolve(controller);
              }),

              function(err) {
                dfd.reject(err);
              }
            );
          })
        );
      }
      else {
        dfd.reject(
          new Error("Module path not found for controller type: \"" + this.mode + "\"")
        );
      }

      return dfd.promise;
    },

    //-------------------------------------
    //
    // Properties
    //
    //-------------------------------------

    /**
     * Maximum number of features to show per trackId
     * @type {number}
     */
    maximumTrackPoints: 1,
    _maximumTrackPointsSetter: function(value, oldValue){
      //check for valid value
      if(typeof value !== "number" || (!value && value !== 0) || value < 0){
        this.emit("error", new Error("Invalid value for maximumTrackPoints: " + value + ". It must be a number >= 0"));
        return oldValue;
      }
      return value;
    },

    /**
     * Options for purging stale features. Use these options to avoid overloading the browser with graphics.
     *
     * Available options are:
     * * displayCount: The maximum number of features to display. Excess features are purged from the beginning of the graphics array.
     * @type {Object}
     */
    purgeOptions: null,
    _purgeOptionsSetter: function(value){
      var oldVal = this.purgeOptions,
        makechange;
      if(!value || (oldVal === value)){
        return;
      }
      //TODO Add check for valid age when implement purging by feature age
      makechange = value.displayCount && value.displayCount > 0;
      if(makechange){
        return value;
      }
    },

    /**
     * The where clause used to perform server-side filtering of features.
     * The value is not set on the layer until the definition is set on the Stream Service's
     * server. Listen to the filter-change event on the controller of layer views to see when the definition
     * is set on the layer. Setting the property at the layer level sets the property for all views
     * created from the layer. To change a definition Expression for an individual view, set the
     * property on the {@link module:esri/layers/graphics/controllers/StreamController}
     * of the Layer View.
     * @type {string}
     */
    definitionExpression: null,
    _definitionExpressionSetter: function(value){
      //If no graphics source yet, just set the property. Otherwise, set the requestedDefinition
      //property and the definitionExpression gets set after the expression is set on the server
      if(!this.graphicsSource){
        return value;
      }
      else{
        this.requestedDefinitionExpression = value;
      }
    },

    /**
     * The geometry used to perform server-side filtering. Only
     * {@link module:esri/geometry/Extent|Extent} is supported.
     * The value is not set on the layer until the geometry filter is set on the Stream Service's
     * server. Listen to the filter-change event to see when the geometryDefinition
     * is set on the layer. Setting the property at the layer level sets the property for all views
     * created from the layer. To change a definition Expression for an individual view, set the
     * property on the {@link module:esri/layers/graphics/controllers/StreamController|Stream Controller}
     * of the Layer View.
     * @type {module:esri/geometry/Extent}
     */
    geometryDefinition: null,
    _geometryDefinitionSetter: function(value){
      //If no graphics source yet, just set the property. Otherwise, set the requestedDefinition
      //property and the geometryDefinition gets set after the expression is set on the server
      //Only extent is allowed.
      if(value && value.type !== "extent"){
        this.emit("error", new TypeError("Invalid geometry. It must have an extent"));
      }
      else{
        if(!this.graphicsSource){
          return value;
        }
        else{
          this.requestedGeometryDefinition = value;
        }
      }
    },
      
    /**
     * The URL of the stream service. This is set in the `url` parameter of the [constructor](#constructors).
     *
     * @name url
     * @instance
     * @type {string}
     * @example
     * //URL points to a cached tiled map service hosted on ArcGIS Server
     * var layer = new ArcGISTiledLayer({
     *  url: "http://services.arcgisonline.com/arcgis/rest/services/World_Terrain_Base/MapServer"
     * });
     */

    //-------------------------------------
    //
    // Property Readers
    //
    //-------------------------------------

    _spatialReferenceReader: function(value, source) {
      // Make SR from the layer's spatialReference property
      value = source.spatialReference;
      return value && new SpatialReference(value);
    },

    _objectIdFieldReader: function(objectIdField, source){
      // Find OID field from "fields" if it is not explicitly defined.
      if (!objectIdField) {
        array.some(source.fields, function(field) {
          if (field.type === "esriFieldTypeOID") {
            objectIdField = field.name;
          }

          return !!objectIdField;
        });
      }

      //if no objectIdField found, set a new one
      var nameSuffix = 1,
        nameBase = "objectid",
        existingFields = [];

      if (!objectIdField) {
        //make sure we don't add a duplicate name
        existingFields = array.filter(source.fields, function(field){
          return field.name.split("_")[0] === nameBase;
        });
        if(existingFields.length){
          existingFields = array.map(existingFields, function(field){
            return field.name;
          });
          while (array.indexOf(existingFields, nameBase + "_" + nameSuffix) !== -1) {
            nameSuffix += 1;
          }
        }
        objectIdField = nameBase + "_" + nameSuffix;
      }
      return objectIdField;
    },

    //-------------------------------------
    //
    // Internal Methods
    //
    //-------------------------------------

    _initLayerProperties: function(graphicsSource) {
      this.graphicsSource = graphicsSource;

      // Read/set definition from source
      var layerDefinition = graphicsSource.layerDefinition;
      this.read(layerDefinition);

      // Update URL scheme if the response was obtained via HTTPS
      // See esri/request for context regarding "response._ssl"
      if (layerDefinition._ssl) {
        this.url = this.url.replace(this.reHttp, "https:");
      }

      this._verifyFields();
      this._fixSymbolUrls();

      this.useQueryTimestamp = (has("ie") || has("safari"));
    },

    _verifyFields: function() {
      var url = (this.parsedUrl && this.parsedUrl.path) || "undefined";

      if (!this.objectIdField) {
        console.log(
          "StreamLayer: 'objectIdField' property is not defined (url: " + url + ")"
        );
      }
    }
  });

  return StreamLayer;
});
