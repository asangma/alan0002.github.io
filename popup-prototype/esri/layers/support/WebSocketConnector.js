define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "dojo/io-query",
  "dojo/Deferred",

  "../../core/Accessor",
  "../../core/Evented",
  "../../core/Promise"
],
function(
  declare, lang,
  ioQuery, Deferred,
  Accessor, Evented, Promise
) {

  var STATUS = {
    STATUS_CONNECTED: 0,
    STATUS_DISCONNECTED: 1,
    STATUS_CONNECTING: 2,
    STATUS_RECONNECTING: 3,
    STATUS_DISCONNECTING: 4
  };

  var WebSocketConnector = declare([Accessor, Evented, Promise], {

    classMetadata: {
      properties: {
        connectionInfo: {
          dependsOn: ["socketUrls", "queryParams"],
          readOnly: true
        },
        status: {
          readOnly: true
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    /*
     Arguments for WebSocketConnector can be:
     string: The connection url to use,
     array: Array of urls to use,
     or object: {
          socketUrls: array of urls to use
          queryParams: parameters to add to socket url when connecting
          layerSource: A StreamLayerSource object that will be used to regenerate tokens if necessary
        }
     */
    constructor: function(properties){
      this.watch("maxReconnectAttempts", function(newValue) {
        if(newValue < this._reconnectAttempts){
          this.disconnect();
        }
      }.bind(this));
    },

    //Normalize so that constructor properties are an object with minimum of socketUrls property
    normalizeCtorArgs: function(properties){
      properties = properties || {};
      if(typeof properties === "string"){
        properties = {
          socketUrls: [properties]
        };
      }
      else if(Array.isArray(properties)){
        properties = {
          socketUrls: properties
        };
      }
      return properties;
    },

    getDefaults: function(properties){
      var defaults = this.inherited(arguments);
      return lang.mixin(defaults || {}, {
        socketUrls: []
      });
    },

    initialize: function(){
      var loadError = null;

      //set loadError if browser does not support web socket or if no socket urls provided
      if(!this.socketUrls.length){
        loadError = new Error("No urls passed to WebSocketConnector. No live connection possible");
      }
      if(!("WebSocket" in window)){
        loadError = new Error("The browser does not support Web Sockets. No live connection possible");
      }

      if (loadError) {
        var dfd = new Deferred();
        this.addResolvingPromise(dfd.promise);
        dfd.reject(loadError);
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _reconnectAttempts: 0,

    _reconnectTimeoutId: null,

    _socket: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  connectionInfo
    //----------------------------------
    _connectionInfoGetter: function(){
      return {
        socketUrls: this.socketUrls,
        queryParams: this.queryParams
      };
    },

    //----------------------------------
    //  maxReconnectAttempts
    //----------------------------------
    _maxReconnectAttemptsSetter: function(maxAttempts){
      return maxAttempts || 10;
    },

    //--------------------------------------------------------------
    //  currentSocketUrl - The current url used for the socket connection
    //--------------------------------------------------------------
    currentSocketUrl: null,

    //----------------------------------
    //  socketUrls
    //----------------------------------
    socketUrls: null,

    //----------------------------------
    //  status
    //----------------------------------
    _status: STATUS.STATUS_DISCONNECTED,
    _statusGetter: function() {
      return this._status;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    connect: function(){
      if(this._socket && this._status !== STATUS.STATUS_DISCONNECTED && this._status !== STATUS.STATUS_RECONNECTING){
        console.log("Already connected. No need to do anything");
        return;
      }
      //get current url to use and set currentSocketUrl property
      var url = this._makeCurrentUrl();

      //emit attempt-reconnect if the status is reconnecting
      if(this._status === STATUS.STATUS_RECONNECTING){
        this.emit("attempt-reconnect", {
          url: url,
          count: this._reconnectAttempts
        });
      }

      //make new web socket
      var lSocket = new WebSocket(url);

      //change status to connecting
      if(this._status === STATUS.STATUS_DISCONNECTED){
        this._status = STATUS.STATUS_CONNECTING;
        this.notifyChange("status");
      }

      //bind events
      lSocket.onopen = lang.hitch(this, this._handleSocketOpen);
      lSocket.onclose = lang.hitch(this, this._handleSocketClose);
      lSocket.onmessage = lang.hitch(this, this._handleSocketMessage);

      this._socket = lSocket;
    },

    disconnect: function(){
      //set _connected property to false and _socket property to null
      this._status = STATUS.STATUS_DISCONNECTED;
      this.notifyChange("status");

      //cancel _reconnectTimer
      clearTimeout(this._reconnectTimeoutId);

      //call disconnect on web socket if it exists
      if(this._socket){
        this._socket.close();
      }

      //emit disconnect event
      this.emit("disconnect", {
        willReconnect: false,
        message: "Connection closed from client"
      });
    },

    send: function(message){
      //send message using _socket.send(message)
      if(typeof message === "object"){
        message = JSON.stringify(message);
      }
      this._socket.send(message);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _attemptReconnect: function(){
      var self = this,
        url,
        timeout,
        interval;

      //clear out old reconnect timeout
      if(this._reconnectTimeoutId){
        clearTimeout(this._reconnectTimeoutId);
        this._reconnectTimeoutId = null;
      }

      //Get short lived token from service if needed for authorization
      if(this._status !== STATUS.STATUS_RECONNECTING && this.layerSource && this.connectionInfo.queryParams && this.connectionInfo.queryParams.token && this._reconnectAttempts === 1){
        this._status = STATUS.STATUS_RECONNECTING;
        this.notifyChange("status");
        this.layerSource.getWebSocketToken().then(function(response){
          this._attemptReconnect();
        }.bind(this), function(err){
          this._status = STATUS.STATUS_DISCONNECTED;
          this.notifyChange("status");
          this.emit("disconnect", {
            error: new Error("Could not get websocket token from service"),
            willReconnect: false
          });
        }.bind(this));
        return null;
      }

      //set status to be reconnecting
      this._socket = null;
      this._status = STATUS.STATUS_RECONNECTING;
      this.notifyChange("status");

      //calculate timeout interval
      interval = this._randomIntFromInterval(0, 1000);
      timeout = (this._reconnectAttempts * 1000) + interval;

      //set timeout to do reconnect
      this._reconnectTimeoutId = setTimeout(function(){
        this.connect();
      }.bind(this), timeout);
    },

    _makeCurrentUrl: function(){
      var queryParams = this.connectionInfo.queryParams,
          socketUrls = this.connectionInfo.socketUrls,
        urlIdx,
        nextIdx,
        baseUrl;
      //if just one socketUrl or currentSocketUrl property not set
      //  just return first url with queryParameters tacked on
      if(socketUrls.length === 1 || !this.currentSocketUrl){
        baseUrl = socketUrls[0];
      }
      else{
        //get index of current socketUrl and return next one
        urlIdx = socketUrls.indexOf(this.currentSocketUrl);
        nextIdx = urlIdx >= socketUrls.length - 1 ? 0 : urlIdx + 1;
        baseUrl = socketUrls[nextIdx];
      }
      this.currentSocketUrl = baseUrl;

      if(queryParams){
        baseUrl += "?" + ioQuery.objectToQuery(queryParams);
      }

      return baseUrl;
    },

    _handleSocketOpen: function(){
      //set status to connected
      this._status = STATUS.STATUS_CONNECTED;
      this.notifyChange("status");

      //set _reconnectAttempts property to 0
      this._reconnectAttempts = 0;

      //emit open event
      this.emit("connect");
    },

    _handleSocketClose: function(m){
      var errmsg,
        attemptreconnect = true,
        firedisconnect = this._status === STATUS.STATUS_CONNECTED,
        error = null;

      //Check if socket closed unexpectedly. The status would be CONNECTED, RECONNECTING, or CONNECTING
      if(firedisconnect || this._status === STATUS.STATUS_RECONNECTING || this._status === STATUS.STATUS_CONNECTING){
        /*
         * Check close code to see if should attempt to reconnect
         *   4400: Url parameters invalid. Probably filter components. No reconnect attempt.
         *           Use reason property as error message.
         *   4404: Stream Service does not exist. No reconnect attempt.
         *           Give generic service not found error message.
         *   4401: Invalid credentials.
         *   4403: User not authorized to view service.
         *      For 4401 and 4403 - No reconnect attempt. Give generic unauthorized error message.
         */
        if (m.code) {
          //console.log("Socket Closed: ", m.code);
          errmsg = "Connection failed: ";
          if (m.code === 4400) {
            errmsg += m.reason || "Invalid url parameters. Check filter properties.";
            attemptreconnect = false;
          }
          else if (m.code === 4404) {
            errmsg += "Service not found";
            attemptreconnect = false;
          }
          else if (m.code === 4401 || m.code === 4403) {
            errmsg += "Not authorized";
            attemptreconnect = false;
          }
        }

        /*
         * Check if reconnect attempts exceeds maximum. If so, do not
         *   try to reconnect. Also fire disconnect event.
         */
        if (attemptreconnect){
          this._reconnectAttempts += 1;
          if (this._reconnectAttempts > this.maxReconnectAttempts){
            errmsg = "Maximum reconnect attempts exceeded";
            attemptreconnect = false;
            firedisconnect = true;
          }
        }

        //set layer state to be disconnected
        this._status = STATUS.STATUS_DISCONNECTED;
        this.notifyChange("status");

        //fire disconnect event
        if (firedisconnect){
          if (errmsg){
            error = new Error(errmsg);
          }
          this.emit("disconnect", {
            error: error,
            willReconnect: attemptreconnect
          });
        }

        //attempt reconnection to web socket if needed.
        if (attemptreconnect){
          //console.log("would reconnect here");
          this._attemptReconnect();
        }
        else{
          this._socket = null;
        }
      }
      else{
        this._socket = null;
      }
    },

    _handleSocketMessage: function(m){
      this.emit("message", m.data);
    },

    //make random number between two values
    _randomIntFromInterval: function(min,max){
      return Math.floor(Math.random()*(max-min+1)+min);
    }
  });

  //--------------------------------------------------------------------------
  //
  //  Static Members
  //
  //--------------------------------------------------------------------------

  lang.mixin(WebSocketConnector, STATUS);

  return WebSocketConnector;
});
