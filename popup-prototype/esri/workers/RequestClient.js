define(["../core/declare", "dojo/_base/xhr", "../config", "./WorkerClient"],
  function(declare, dojoXhr, esriConfig, WorkerClient) {
    
    var RequestClient = declare([WorkerClient], 
      /**
       * @borrows esri/workers/WorkerClient#setWorkerCallback as esri/workers/RequestClient#setWorkerCallback
       * @borrows esri/workers/WorkerClient#importScripts as esri/workers/RequestClient#importScripts
       */
      /** 
       * @lends module:esri/workers/RequestClient.prototype
       */ 
    {
      declaredClass: "esri.workers.RequestClient",
      /**
       * @classdesc
       * A specialized {@link esri/workers/WorkerClient} that sends XHR requests through a specific worker.
       * Functional replacement for [dojo/_base/xhr](http://dojotoolkit.org/api/?qs=1.9/dojo/_base/xhr).
       * 
       * @requires esri/workers/WorkerClient
       * @constructs
       */
      constructor: function() {
        this.setWorker(["./mutableWorker","./requestWorker"]);
      },

      /**
       * Sends an XHR GET request
       * @param  {Object} options
       * @see [Dojo xhrGET](http://dojotoolkit.org/reference-guide/1.9/dojo/xhrGet.html)
       * @return {Promise} requestPromise - A promise whose callbacks get fired with the parameters indicated above
       * @property {function(response, request)} requestPromise.resolve - the success callback
       * @property {Object|string} requestPromise.resolve.response - the parsed XHR response
       * @property {XMLHttpRequest} requestPromise.resolve.request - a pseudo-XMLHttpRequest object reflecting the actual one in the Worker
       * @property {function(error)} requestPromise.reject - the error callback
       * @property {Error} requestPromise.reject.error - the error produced by a failed XHR
       * @property {function(prog)} requestPromise.progress - the progress callback
       * @property {ProgressEvent} requestPromise.progress.prog - the ProgressEvent properties from the Worker's XHR progress event
       */
      get: function(options) {
        return this._send("GET", options);
      },
      /**
       * Sends an XHR POST request
       * @param  {Object} options
       * @see  [Dojo xhrPOST](http://dojotoolkit.org/reference-guide/1.9/dojo/xhrPost.html)
       * @return {Promise} requestPromise - A promise whose callbacks get fired with the parameters as indicated in {@link esri/workers/RequestClient#get|get method}
       */
      post: function(options) {
        return this._send("POST", options);
      },
      /**
       * @private
       */
      _send: function(method, options) {
        var xhrDef = dojoXhr._ioSetArgs(options);
        xhrDef.xhr = null;
        var ioArgs = xhrDef.ioArgs;
        var url = ioArgs.url;
        delete ioArgs.url;
        delete ioArgs.args;
        this.postMessage({
          "method": method,
          "url": url,
          options: ioArgs
        }).then(this._getSuccessHandler(xhrDef), this._getErrorHandler(xhrDef), this._getProgressHandler(xhrDef));
        return xhrDef;
      },
      /**
       * @private
       */
      _addHeaderFunctions: function(obj) {
        obj.getResponseHeader = function(needle) {
          var val;
          var headers = obj.headers;
          Object.keys(headers).forEach(function(key) {
            if (key.toLowerCase() == needle.toLowerCase()) {
              val = headers[key];
              return false;
            }
          });
          return val;
        };
        obj.getAllResponseHeaders = function() {
          var resp = [];
          var headers = obj.headers;
          Object.keys(headers).forEach(function(key) {
            resp.push(key + ": " + headers[key]);
          });
          resp = resp.join("\n");
          return resp;
        };
        return obj;
      },
      /**
       * @private
       */
      _getSuccessHandler: function(def){
        var that = this;
        var options = def.ioArgs;
        return function(msg){
          def.xhr = that._addHeaderFunctions(msg);
          var contentType = def.xhr.getResponseHeader("content-type");
          //main thread parsing backup 
          if ((options.handleAs == "xml" || contentType.indexOf("xml") > -1) && (typeof def.xhr.response == "string")) {
            def.xhr.response = new DOMParser().parseFromString(def.xhr.response, "text/xml");
          }
          def.resolve(def.xhr.response, def.xhr);
        };
      },
      /**
       * @private
       */
      _getErrorHandler: function(def){
        return function(msg){
          def.reject(msg);
        };
      },
      /**
       * @private
       */
      _getProgressHandler: function(def){
        return function(msg){
          def.progress(msg);
        };
      }
    });

    /*** Static Methods ***/
    var clients = [],
        clientLimit = esriConfig.request.maxWorkers,
        defaultClient = new RequestClient();

    /**
     * Creates and returns a {@link esri/workers.RequestClient} with a callback set in the worker from the passed module path.
     * Calling this function without any arguments returns a RequestClient instance.
     * @alias getClient
     * @memberOf esri/workers/RequestClient
     * @param  {string=} callback - either a require path to a script file containing the callback function
     *  (See {@link esri/workers/WorkerClient#addWorkerCallback}) for more information.
     * @param {string=} name - the function name in the callback script to use as the callback function. @default main
     * @return {esri/workers/RequestClient}
     */ 
    RequestClient.getClient = function(path, fnName) {
      if (!path) {
        return defaultClient;
      } else {
        var client;
        clients.some(function(obj) {
          if (obj.id == (fnName ? (path + "::" + fnName) : path)){
            client = obj.client;
          }
          return true;
        });
        return client || _createClient(path, fnName);
      }
    };

    /**
     * Sets the limit of active concurent RequestClient worker threads
     * @alias setLimit
     * @memberOf esri/workers/RequestClient
     * @param {number} maxClients - maximum number of concurrent RequetClient threads
     */
    RequestClient.setLimit = function(maxClients){
      clientLimit = esriConfig.request.maxWorkers = maxClients;
    };

    /**
     * @private
     */
    function _createClient(path, fnName) {
      var client = new RequestClient();
      client.addWorkerCallback(path, fnName);
      clients.unshift({
        "id": (fnName) ? (path + "::" + fnName) : path,
        "client": client
      });
      if (clients.length > clientLimit) {
        var remove = clients.pop();
        remove.client.terminate();
      }
      return client;
    }

    return RequestClient;
  });