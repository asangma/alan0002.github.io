define(["dojo/Evented", "../core/declare", "dojo/Deferred", "dojo/_base/lang", "dojo/request",
        "../core/sniff", "../core/urlUtils", "require"],
  function(Evented, declare, Deferred, lang, request, has, urlUtils, require) {
    // Cross-browser Blob & URL references
    var Blob = window.Blob || window.webkitBlob || window.mozBlob;
    var URL = window.URL || window.webkitURL || window.mozURL;
    
    var WorkerClient = declare([Evented], /** @lends esri/workers/WorkerClient.prototype */{
      declaredClass: "esri.workers.WorkerClient",
      /**
       * Reference to the actual HTML5 Worker instance
       * @type {Worker}
       */
      worker: null,
      /**
       * internal queue of deferreds
       * @private
       * @type {Object}
       */
      _queue: null,
      /**
       * @classdesc The WorkerClient is the primary entry point for interfacing with background Workers. You can use any valid and
       * accessible (subject to browser-specific `same-origin` policy) worker script file.
       * If you want the `addWorkerCallback` or `importScripts` functions to work, then workers used
       * here should either import "mutableWorker.js" or use "esri/workers/mutableWorker" as the worker and build it up via
       * this class' methods.
       * @desc Construct a new WorkerClient
       * @param  {string} path - A require style string path to the worker script. Defaults to the base mutable worker.
       * @constructs
       */
      constructor: function( /*String*/ path) {
        this._isIE = has("ie");
        this._queue = {};

        this._acceptMessage = lang.hitch(this,this._acceptMessage);
        this._errorMessage = lang.hitch(this,this._errorMessage);
        
        if(path){ 
          this.worker = this.setWorker(path);
        }
      },
      
      /**
       * Sets the worker that is used the Worker Client
       * @param {string} path - A require style string path to the worker script
       */
      setWorker: function(path){
        if(path instanceof Array){
          var imports = path;
          path = imports.shift();
        }
        var workerPath = this._getUrl(path);
        var isXdPath = !urlUtils.hasSameOrigin(urlUtils.getAbsoluteUrl(workerPath), location.href);
        var worker;
        if (workerPath === false) {
          console.log("Can not resolve worker path");
          return false;
        }
        //remove old event handlers
        if(this.worker){
          worker = this.worker;
          worker.removeEventListener("message", this._acceptMessage, false);
          worker.removeEventListener("error", this._errorMessage, false);
          worker.terminate();
          worker = null;
        }
        //check for x-domain worker source
        if(isXdPath){
          var mutWorkerPath = this._getUrl("./mutableWorker", true);
          try {
            //var text = require.getText(mutWorkerPath, true);
            var text = this._getRemoteText(mutWorkerPath, true);
            worker = new Worker(URL.createObjectURL(new Blob([text], {
              type: "text/javascript"
            })));
          } catch (e) {
            try {
              mutWorkerPath = urlUtils.getProxyUrl(mutWorkerPath).path + "?" + encodeURI(mutWorkerPath);
              worker = new Worker(mutWorkerPath);
              this._useProxy=true;
            } catch (err) {
              console.log("Can not create worker");
              return false;
            }
          }
        } else {
          worker = new Worker(workerPath);
        }
        worker.addEventListener("message", this._acceptMessage, false);
        worker.addEventListener("error", this._errorMessage, false);
        
        this.worker = worker;
        
        if(isXdPath){
          this.importScripts(workerPath);
        }

        if(imports){
          this.importScripts(imports);
        }
        return worker;
      },

      /**
       * Post a message to the worker
       * @param  {(Object|Array)} msg - The data to post to the worker. If it is an array or a primitive,
       *  it will be put in an object as the 'data' member before being posted to the worker.
       * @param  {Array=} [transfers] - An optional array of transferable objects
       * @return {Promise}
       */
      postMessage: function(msg, transfers) {
        //TODO inspect data object and transfer any transferable objects
        //Ensure that the data is an object
        if (msg instanceof Array || (typeof msg != "object")) {
          msg = {
            data: msg
          };
        }
        //Add id to data object and put id in message stack
        var id = Math.floor((Math.random() * 64e9)).toString(36);
        //this gives you a better random than any time based one. 
        //A 7 digit base36 value converted from a random 64 billion value.
        msg.msgId = id;
        var dfd = this._queue[id] = new Deferred();
        //make sure we are ready
        if (!this.worker) {
          dfd.reject({
            message: "No worker was set."
          });
        } // worker set and ready. send message.
        else {
          // Stupid IE can't handle a undefined or null argument for transfers
          (transfers) ? this.worker.postMessage(msg, transfers) : this.worker.postMessage(msg);
          
          this.emit("start-message", {
            target: this,
            message: msg
          });
        }

        return dfd.promise;
      },

      /**
       * Terminates the worker and cancels all unresolved messages
       */
      terminate: function() {
        var ids = Object.keys(this._queue); 
        if(this.worker){
          this.worker.terminate();
        }
        for (var i = ids.length - 1; i >= 0; i--) {
          this._queue[ids[i]].cancel("terminated");
          delete this._queue[ids[i]];
        }
      },
      /**
       * Adds a function to the worker that takes the worker's internal calls to `postMessage` and calls this function before
       * sending the original message back to the main thread. The function takes the same inputs as 
       * {@link esri/workers/WorkerClient#postMessage}. The function should act on these inputs. This obviously assumes some
       * familiarity with the type of messages that a worker is passing. The function should be able to correctly interrogate
       * the message to determine if it is an appropriate message to act on. Additional calls to `addWorkerCallback` can be used
       * to chain functions together in a "last in, first executed" fashion.
       *
       * The script file whose path is passed in will be imported into the worker directly. It will not pass through the main
       * thread and can not expect to have access to any objects in the main thread. This script is not required to have a
       * `message` event handler or even `postMessage` calls back to the main thread. However, it must conform to the same
       * limitations listed for {@link esri/workers/WorkerClient#importScripts}. By default, the script should provide a function
       * named `main`. If not then you must indicate the function via the `name` parameter. This function will be executed each
       * time that the worker attempts to `postMessage` back to the main thread.
       * 
       * **NOTE** If a callback or any callback in a series of chained callbacks returns `false` then `postMessage` is **_never_**
       * executed, thus **preventing the main UI thread from receiving the message.**
       * 
       * @param {string} module - a require path to a worker-compatible script containing the callback function.
       * @param {string=} [name] - the name of the callback function. Defaults to "main". Does not need to be unique as it
       *   will be enclosured.
       * @return {Promise} Promise resolves if addition was successful and rejects with error 
       */
      addWorkerCallback: function(module, name){
        var dfd;
        var url = this._getUrl(module, true);
        if(url === false){
          dfd = new Deferred();
          dfd.reject({message: "Could not load text from " + module});
          return dfd.promise;
        } else {
          return this.postMessage({
            "action": "add-callback",
            "url": url,
            "cbName": name || "main"
          })
            .then(lang.hitch(this, function(msg) {
                    msg.target = this;
                    this.emit("callback-added", msg);
                  }));
        }
      },

      /**
       * Import any script or function into the worker. Please note the following conditions:
       *   
       *   - Script(s) / function(s) can ONLY include objects, classes, or methods available to 
       *      [Workers](https://developer.mozilla.org/En/DOM/Worker/Functions_available_to_workers), plus whatever else
       *      has already been imported.
       *   - The imported items will be executed immediately and in the same order they are specified
       *   - The imported script won't be able to share or directly access any objects in the main thread or other workers
       *   - The worker can't access the DOM and thus can't use libraries which assume a browser environment
       * @param  {(Array.<string>|string)} paths - An AMD `require` path to a script file to import or a function to
       *    directly import to the worker. Alternatively, multiple items may be passed in an Array.
       * @return {Promise}  The promise resolves if the import was successful and rejects if an error was encountered.
       */
      importScripts: function(paths){
        if(!Array.isArray(paths)){
          paths = [paths];
        }
        var scripts = paths.map(function(script){
          var url = this._getUrl(script, true);
          if(this._useProxy && !urlUtils.hasSameOrigin(url, location.href)){
            url = urlUtils.getProxyUrl(url).path + "?" + encodeURI(url);
          }
          return url;
        }, this);

        return this.postMessage({
          "action": "import-script",
          "url": scripts
        })
          .then(lang.hitch(this, function(msg) {
                  msg.target = this;
                  this.emit("scripts-imported", msg);
                }));
      },

      /**
       * Handler for all messages from the worker initiated by this class
       * @private
       */
      _acceptMessage: function(evt) {
        var msg = evt.data;
        var id = msg.msgId;
        if(msg.status && msg.status == "debug"){
          var method = msg.showAs || "debug";
          console[method](msg);
        }
        else if (id && id in this._queue) {
          var def = this._queue[id];
          if (msg.status == "progress") {
            def.progress(evt.data);
          } else if (msg.status == "error") {
            def.reject(evt.data);
            delete this._queue[id];
          } else {
            def.resolve(evt.data);
            delete this._queue[id];
          }
        }
        this.emit("message", {
          message: evt.data,
          event: evt,
          target: this
        });
      },

      /**
       * Handler for all errors thrown by the worker
       * @private
       */
      _errorMessage: function(err) {
        if (this.onerror || this.onError) {
          this.onerror ? this.onerror(err) : this.onError(err);
        } else {
          //worker errors don't bubble up to the main thread, but we are logging them
          //TODO handle errors better
          console.log("Worker Error: " + err.message + "\nIn " + err.filename + " on " + err.lineno);
        }
      },

      /**
       * Uses require to resolve paths to full urls
       * @private
       * @param  {string} path - require style path to resource
       * @return {string} the full url to the resource
       */
      _getUrl: function(path, abs) {
        if (!path) {
          console.error("can not resolve empty path");
          return false;
        }

        if (!path.match(/\.js$/)) {
          path += ".js";
        }

        var url = require.toUrl(path);

        return abs ? urlUtils.getAbsoluteUrl(url) : url;
      },

      /**
       * Fetches remote script sources. Uses CORS for x-domain requests & will
       * fail if the remote server doesn't support CORS.
       * @param  {string} url
       * @param  {boolean=} [wait] - Use sync request method. Waits for request to complete before proceeding
       * @return {string}  The text contents of the returned response
       * @private
       */
      _getRemoteText: function(url, wait){
        var text = "";
        url = this._getUrl(url);
        if(url){
          request.get(url, {
            sync: wait,
            handleAs: "text",
            headers: {
              "X-Requested-With": "",
              "Content-Type": "text/plain"
            }
          }).then(function(resp){
            text = resp;
          });
        }
        return text;
      },

      /**
       * Creates a Worker instance from a self generated Blob source
       * @return {Worker} the HMTL5 Worker instance
       * @private
       */
      _startBlobWorker: function(){
        var xdSource = this._xdSource;
        if(!xdSource){
          var mutWorkerPath = this._getUrl("./mutableWorker");
          var blb = new Blob(["if(!self._mutable){importScripts('"+mutWorkerPath+"');}"],{
            type: "text/javascript"
          });
          xdSource = this._xdSource = URL.createObjectURL(blb);
        }
        try{
          var worker = new Worker(xdSource);
          return worker;
        }
        catch(e){
          console.log(e.message);
          return false; 
        }
      }
    });

    return WorkerClient;
  });
