/* jshint forin: false */
define(["../../../core/declare",
        "../../../request",
        "../../../config",
        "../../../core/urlUtils",
        "./PromiseLightweight",
        "./AsyncQuotaRoundRobinQueue",
        "../webgl-engine/lib/Util" // for assert()
  ],
function(declare, esriRequest, esriConfig, urlUtils, promise, AsyncQuotaRoundRobinQueue, Util) {
  var assert = Util.assert;

  var dbg = false;

  var TaskStatus = {
    QUEUED: 1,
    DOWNLOADING: 2,
    CANCELLED: 4
  };

  var StreamDataLoader = declare(null, {
    constructor: function(downloadSlotsPerType) {
      this.alreadyLoading = {};
      this.loadQueue = new AsyncQuotaRoundRobinQueue(startLoading, this._doneLoadingCallback, this, downloadSlotsPerType);
    },

    destroy: function() {
      for (var url in this.alreadyLoading) {
        var task = this.alreadyLoading[url];
        for (var i = 0; i < task.clientPromises.length; i++) {
          var promise = task.clientPromises[i];
          if (!promise.isRejected()) {
            promise.reject(task.url, null, task.docType, task.clientMetadata[i]);
          }
        }
        this._cancelTask(task);
      }

      this.loadQueue.clear();
      this.loadQueue = null;

      this.alreadyLoading = null;
    },

    request: function(url, docType, clientType, options, addUrlTokenFunction) {
      if (dbg) { console.log("request "+ url); }
      options = options || {};

      var dfd = new promise.Promise();
      dfd.requestURL = url;
      var task = this.alreadyLoading[url];
      if (task) {
        task.clientPromises.push(dfd);
        task.clientMetadata.push(options.metadata);
      } else {
        task = {
          url: url,
          docType: docType,
          clientType: clientType,
          status: TaskStatus.QUEUED,
          clientMetadata: [options.metadata],
          clientPromises: [dfd],
          downloadObj: null,
          _cancelledInQueue: false      // optimization: this flag may be set by queue implementation. create it here for javascript engine optimization reasons
        };

        if (addUrlTokenFunction) {
          task.urlWithToken = addUrlTokenFunction(url);
        }

        this.alreadyLoading[url] = task;

        if (options.notQueueable) {
          startLoading(task, this._doneLoadingCallback.bind(this));
        } else {
          this.loadQueue.push(task);
        }
      }
      return dfd;
      
    },
    isRequested:function(url) {
      return this.alreadyLoading[url] !== undefined;
    },
    cancel:function(clientPromise) {
      var url = clientPromise.requestURL;
      if (dbg) { console.log("cancel "+ url); }
      var task = this.alreadyLoading[url];
      if (task) {
        this._removeRequestPromiseFromTask(task, clientPromise);
      }
    },
    getRequestedURLs:function(clientType) {
      var urls = {};
      for (var url in this.alreadyLoading) {
        if (this.alreadyLoading[url].clientType === clientType) {
          urls[url]=true;
        }
      }
      return urls;
    },
    cancelBulk:function(toCancel, clientType) {
      var url;
      var firstValue = Util.getFirstObjectValue(toCancel);
      if (firstValue instanceof promise.Promise) {
        for (url in toCancel) {
          this.cancel(toCancel[url]);
        }
      } else {
        var tasksToRemove = [];
        for (url in toCancel) {
          var task = this.alreadyLoading[url];
          if (task) {
            this._cancelTask(task);
            tasksToRemove.push(task);
          }
        }
        if (tasksToRemove.length > 0) {
          this.loadQueue.removeTasks(tasksToRemove, clientType);
        }
      }
    },

    hasPendingDownloads: function() {
      return !Util.objectEmpty(this.alreadyLoading);
    },

    _removeRequestPromiseFromTask: function(task, promise) {
      var numPromises = task.clientPromises.length;
      if (numPromises > 1) {
        var promiseIdx = task.clientPromises.indexOf(promise);
        assert(promiseIdx > -1, "request to be cancelled is already cancelled or invalid");
        task.clientPromises[promiseIdx] = task.clientPromises[numPromises-1];
        task.clientPromises.pop();
        task.clientMetadata[promiseIdx] = task.clientMetadata[numPromises-1];
        task.clientMetadata.pop();
      } else {
        assert(task.clientPromises[0] === promise, "request to be cancelled is already cancelled or invalid");
        this._cancelTask(task);
      }
    },

    _cancelTask: function(task) {
      if (task.status === TaskStatus.DOWNLOADING) {
        this.loadQueue.workerCancelled(task);
        if (task.docType === "image") {
          var img = task.downloadObj;
          img.removeAttribute("onload");
          img.removeAttribute("onerror");
          img.removeAttribute("src");
        } else {
          task.status = TaskStatus.CANCELLED; // needed because isCanceled() does not work properly on promises returned by esriRequest
          task.downloadObj.cancel();
        }
        task.downloadObj = null;
      }
      task.status = TaskStatus.CANCELLED;
      task.clientPromise = undefined;
      task.metadata = undefined;
      delete this.alreadyLoading[task.url];
    },

    _doneLoadingCallback: function(task, err) {
      var i;
      assert(task.status === TaskStatus.DOWNLOADING);
      delete this.alreadyLoading[task.url];
      if (err) {
        for (i = 0; i < task.clientPromises.length; i++) {
          if (!task.clientPromises[i].isRejected()) {
            task.clientPromises[i].reject(task.url, err, task.docType, task.clientMetadata[i]);
          }
        }
      } else {
        if (dbg) { console.log("done "+ task.url); }
        for (i = 0; i < task.clientPromises.length; i++) {
          task.clientPromises[i].done(task.url, task.result, task.docType, task.clientMetadata[i]);
        }
      }
    }
  });

    // this is the worker function of the loader queue (operated by AsyncQuotaRoundRobinQueue).
    // it creates an HTTP request either using XMLHttpRequest or Image.
    var startLoading = function(task, callback) {
      if (task.status === TaskStatus.CANCELLED) {
        return false;
      }

      var url = task.urlWithToken || task.url;

      if (url.indexOf("//") === 0) {
        url = window.location.protocol + url;
      }

      if (task.docType === "image") {
        var img = new Image();
        img.onload = function imgOnLoad() {
          // while the actions taken in this._cancelDownload() seem to keep onload from being called in Chrome,
          // it doesn't work in Firefox, hence we need to check if the download was cancelled:
          if (task.status !== TaskStatus.CANCELLED) {
            task.result = img;
            img.removeAttribute("onload");
            img.removeAttribute("onerror");
            callback(task);
          }
        };
        img.onerror = function imgOnError() {
          if (task.status !== TaskStatus.CANCELLED) {
            img.removeAttribute("onload");
            img.removeAttribute("onerror");
            callback(task, { status: 404 });
          }
        };

        var hasSameOrigin = urlUtils.hasSameOrigin(url, window.location.href);

        if (url.substring(0, 5) === "data:") {
          img.src = url;
        }
        else if (hasSameOrigin || urlUtils.canUseXhr(url)) {
          if (!hasSameOrigin) {
            img.crossOrigin = "anonymous";
          }

          img.src = url;
        }
        else {
          img.src = ((task.urlWithToken || !esriConfig.request.proxyUrl) ? "" : esriConfig.request.proxyUrl + "?") + url;
        }

        task.downloadObj = img;
      } else {
        var promise = esriRequest({
            url: url,
            handleAs: (task.docType === "binary") ? "arraybuffer" : "json",
            failOk: true
          });
        promise.then(function(data){
            task.duration = Util.performance.now()-task.startTime;
            task.size = 0;//task.docType!="binary"?data.text.length:data.data.length;
            task.result = data;
            callback(task);
          }, function(err){
            //if (!deferred.isCanceled()) { // TODO: once esriRequest is fixed s.t. isCanceled() works properly, use this line
            if (task.status !== TaskStatus.CANCELLED) {
              callback(task, err);
            }
            // In theory, we should re-throw the error if the promise was cancelled (for chained promises to be
            // handled correctly). That doesn't seem to be the case at the moment, so I'm omitting it for better debuggability.
          });
        task.downloadObj = promise;
      }

      //MUCH faster alternative to esrirequest. TODO: should we change esrirequest to this?
      /*  var xhr = new XMLHttpRequest();
        xhr.responseType = (task.docType === "binary") ? "arraybuffer" : "json";
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (xhr.status == 0) {
              if (task.status !== TaskStatus.CANCELLED) {
                callback(task, true);
              }
            }
            if (xhr.status == 200) {
               task.result = xhr.response;


              callback(task);
            }
          }
        };

        task.downloadObj = {cancel:function(){xhr.abort();}}
        var url = task.url.indexOf("amazon")>=0?task.url: esriConfig.request.proxyUrl + "?" +task.url;
        xhr.open('GET',  url, true);
        xhr.send(null);
      }*/


      task.status = TaskStatus.DOWNLOADING;
      return true;
    };

    StreamDataLoader.TaskStatus = TaskStatus;

    return StreamDataLoader;
});
  
