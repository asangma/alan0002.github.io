define(
[
  "../../../core/declare",
  "dojo/_base/lang",

  "dojo/Deferred",

  "../../../core/Accessor",
  "../../../core/Promise",
  "../../../core/urlUtils",
  "../../support/WebSocketConnector",

  "../../../request",
  "../../../kernel"
],
function(
  declare, lang,
  Deferred,
  Accessor, Promise, urlUtils, WebSocketConnector,
  esriRequest, esriKernel
) {

  var StreamLayerSource = declare([Accessor, Promise], {

    classMetadata: {
      computed: {
        url: ["layerDefinition"],
        parsedUrl: ["url"],
        connectionInfo: ["layerDefinition"]
        //queryTask: ["relatedFeatures", "keepLatestArchive"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(properties) {
      var defaults = this.inherited(arguments);
      var layer = properties.layer;
      if (layer) {
        defaults = lang.mixin(defaults, {
          url: layer.url,
          connectionInfo: {
            direction: layer.socketDirection,
            socketUrl: layer.socketUrl
          },
          queryTask: null
        });
      }
      return defaults;
    },

    initialize: function() {
      this.addResolvingPromise(this._fetchLayer());
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  connectionInfo
    //----------------------------------

    /**
     * Get info needed to make web socket connection to Stream Service
     * @private
     */

    _connectionInfoGetter: function(){
      //if socketUrl set in constructor or if layer based on feature collection,
      // don't try to get socketUrls for service
      if(this.layer.hasMemorySource || this.layer.socketUrl){
        return {
          serviceSocketUrls: [this.layer.socketUrl]
        };
      }

      var connectionInfo = {},
        layerDef = this.layerDefinition,
        socketUrlsAllProtocols = [],
        wsUrls = [],
        wssUrls = [],
        socketUrls,
        n,
        k,
        temp;

      //get urls and token from stream url object that has transport = "ws"
      if (layerDef.streamUrls){
        layerDef.streamUrls.forEach(function(obj){
          if (obj.transport === "ws"){
            socketUrlsAllProtocols = obj.urls;
            connectionInfo.token = obj.token;
          }
        }, this);
      }

      //Split socket urls into ws and wss - this is because
      //a server configured for http and https will advertise ws and wss urls
      socketUrlsAllProtocols.forEach(function(url){
        if (url.lastIndexOf("wss", 0) === 0){
          wssUrls.push(url);
        }
        else{
          wsUrls.push(url);
        }
      });

       //Use ws urls if page is accessed by http, use wss if https or if url to service is https
       //Exception is if there are only wss urls, meaning the ArcGIS Server only supports https
      if (esriKernel.appUrl.scheme === "https" || this.url.lastIndexOf("https:", 0) === 0) {
        socketUrls = wssUrls;
      }
      else{
        socketUrls = (wsUrls.length === 0) ? wssUrls : wsUrls;
      }

      //sort the urls randomly so multi-machine configuration requests spread out
      if (socketUrls && socketUrls.length > 1){
        for (n = 0; n < socketUrls.length - 1; n++) {
          k = n + Math.floor(Math.random() * (socketUrls.length - n));

          temp = socketUrls[k];
          socketUrls[k] = socketUrls[n];
          socketUrls[n] = temp;
        }
      }
      connectionInfo.serviceSocketUrls = socketUrls;
      return connectionInfo;
    },

    //----------------------------------
    //  parsedUrl
    //----------------------------------

    _parsedUrlGetter: function() {
      return this.url ? urlUtils.urlToObject(this.url) : null;
    },

    //----------------------------------
    //  url
    //----------------------------------

    url: null,


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    // This should be called by controllers to set up a web socket connection for a view
    createWebSocketConnector: function(mapSR){
      //console.log("createWebSocketConnector - this: ", this);
      var self = this,
        dfd = new Deferred();

      self.then(function(){
        var connInfo = self.connectionInfo,
          filter,
          lyrSR = self.layer.spatialReference,
          qParams,
          socketUrls,
          constructorParams = {},
          wsConnector;

        try{
          filter = self.makeFilter();
        }
        catch(err){
          dfd.reject(err);
          return;
        }
        if(!connInfo){
          dfd.reject(new Error("No web socket urls found"));
        }
        else{
          if(connInfo.socketUrl){
            socketUrls = [connInfo.socketUrl];
          }
          else if(connInfo.serviceSocketUrls){
            socketUrls = connInfo.serviceSocketUrls.map(function(url){
              return url + "/" + self.layer.socketDirection;
            });
          }
          constructorParams.socketUrls = socketUrls;

          if((filter && (filter.where || filter.geometry || filter.outFields)) || connInfo.token){
            qParams = lang.mixin(qParams || {}, {
              where: filter.where,
              geometry: filter.geometry,
              outFields: filter.outFields,
              token: connInfo.token
            });
          }

          if(mapSR && lyrSR && (mapSR.wkid !== lyrSR.wkid)){
            qParams = lang.mixin(qParams || {}, {
              outSR: mapSR.wkid
            });
          }

          constructorParams.queryParams = qParams;
          constructorParams.layerSource = self;
          wsConnector = new WebSocketConnector(constructorParams);
          dfd.resolve(wsConnector);
        }
      });
      return dfd.promise;
    },

    /**
     * Gets a short-lived token to use for web socket connection requests.
     *   This is called by the WebSocketConnector when a StreamController first
     *   loses connection and attempts to reconnect using a token.
     * @returns {*} promise A promise that is resolved with the token value as the response.
     * @private
     */
    getWebSocketToken: function(){
      //fetch layer info
      return this._fetchLayer().then(function(){
        //get token
        var token = null;
        if (this.layerDefinition.streamUrls){
          this.layerDefinition.streamUrls.some(function(obj){
            if (obj.transport === "ws"){
              token = obj.token;
              return true;
            }
          }, this);
        }
        return token;
      }.bind(this));
    },

    /**
     * Make a filter object. This is called from the 'createWebSocketConnector' function. Also
     * called from the controller when the requestedDefinitionExpression/requestedGeometryDefinition
     * is changed on the layer or the controller.
     * @private
     * @param {Object} layerOverrides An object containing values that override the layer's property values. If
     *   missing or null, the values set on the layer are used. Outfields is not a valid property for layerOverrides
     *   since outFields can only be set when the layer is constructed
     * Used by the controller.
     * @returns {Object}
     */
    makeFilter: function(layerOverrides){
      //console.log("Making filter. Layer: ", this.layer);
      var layer = this.layer,
        geometry = null,
        fields = null,
        filter;

      //where clause
      if(!layerOverrides){
        if(layer.hasOwnProperty("definitionExpression") && layer.definitionExpression) {
          filter = lang.mixin(filter || {}, {
            where: layer.definitionExpression
          });
        }

        //geometry filter. Only extent is allowed.
        if(layer.hasOwnProperty("geometryDefinition") && layer.geometryDefinition){
          geometry = JSON.stringify(layer.geometryDefinition.toJSON());
          filter = lang.mixin(filter || {}, {
            geometry: geometry
          });
        }
      }
      else{
        //where clause
        if(layerOverrides.hasOwnProperty("definitionExpression")){
          filter = lang.mixin(filter || {}, {
            where: layerOverrides.definitionExpression
          });
        }

        //geometry filter. Only extent is allowed.
        if(layerOverrides.hasOwnProperty("geometryDefinition")){
          geometry = layerOverrides.geometryDefinition;
          if(geometry){
            geometry = geometry;
          }
          filter = lang.mixin(filter || {}, {
            geometry: geometry
          });
        }
      }

      //set outFields property to value stored in layer
      //out fields. If *, just use null.
      if(layer.hasOwnProperty("outFields")){
        if(layer.outFields && layer.outFields[0] !== "*"){
          fields = layer.outFields.join(",");
        }
        filter = lang.mixin(filter || {}, {
          outFields: fields
        });
      }
      return filter;
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _fetchLayer: function() {
      return esriRequest({
        url:               this.layer.parsedUrl.path,
        content:           lang.mixin({ f: "json" }, this.layer.parsedUrl.query),
        handleAs:          "json",
        callbackParamName: "callback"
      }).then(function(response) {
        // Update URL scheme if the response was obtained via HTTPS
        // See esri/request for context regarding "response._ssl"
        if (response._ssl) {
          delete response._ssl;
          this.url = this.url.replace(/^http:/i, "https:");
        }
        this.layerDefinition = response;
      }.bind(this));
    }
  });

  return StreamLayerSource;
});
