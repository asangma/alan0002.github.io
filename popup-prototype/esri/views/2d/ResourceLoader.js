/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array"
],
function(
  declare, lang, array
) {
  
var DefaultQueue = declare(null, {
  constructor: function() {
    this._requestIds = {};
    this._queue = [];
  },
  add: function(id, request) {
    if (this.contains(id)) {
      return;
    }
    this._requestIds[id] = request;
    this._queue.push(request);
  },
  contains: function(id) {
    return this._requestIds[id] != null;
  },
  get: function(num) {
    var requests    = [],
        req;
    while(!this.isEmpty() && requests.length < num) {
      req = this._queue.pop();
      delete this._requestIds[req.id];
      requests.push(req);
    }
    return requests; 
  },
  remove: function(id) {
    if (!this.contains(id)) {
      return null;
    }
    var req = this._requestIds[id];
    this._queue.splice(array.indexOf(this._queue, req), 1);
    delete this._requestIds[id];
    return req;
  },
  isEmpty: function() {
    return this._queue.length === 0;
  }
});
  
var ResourceLoader = declare(null, {
  
  //--------------------------------------------------------------------------
  //
  //  Constructor
  //
  //--------------------------------------------------------------------------
  
  constructor: function(properties) {
    // properties
    //   - queue
    
    properties = lang.mixin({
      loaders:           {},
      contentType:       "img",
      activeRequests:    {},
      numActiveRequests: 0,
      maxActiveRequests: 10
    }, properties || {});
    lang.mixin(this, properties);
    
    this._requestLoadHandler = this._requestLoadHandler.bind(this);
    this._requestErrorHandler = this._requestErrorHandler.bind(this);
    
    if (!this.queue) {
      this.queue = new DefaultQueue();
    }
  },
  
  
  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------
  
  paused: false,
  
  pause: function() {
    this.paused = true;
  },
  
  resume: function() {
    this.paused = false;
    this._next();
  },
  
  load: function(request) {
    // request
    //   - url
    //   - callback
    //   - errback
    
    var id  = request.id;
    
    // Queue the request if not already in the loader 
    if (!this.activeRequests[id] && !this.queue.contains(id)) {
      this.queue.add(id, request);
      this._next();
    }
    
    return id;
  },
  
  cancel: function(id) {
    var request;
    if (this.queue.contains(id)) {
      request = this.queue.remove(id);
      this._requestErrorHandler({
        request: request,
        canceled: true
      });
    }
    else if (this.activeRequests[id]) {
      this.activeRequests[id].cancel();
    }
  },
  
  dispose: function(request) {
    var contentType = request.contentType || this.contentType,
        loader = this.getLoader(contentType);
    if (loader && loader.dispose) {
      loader.dispose(request.data);
    }
  },
  
  registerLoader: function(contentType, callback) {
    if (lang.isArray(contentType)) {
      array.forEach(contentType, function(type) {
        this.registerLoader(type, callback);
      });
    } else {
      // console.log("[ResourceLoader] register type: " + contentType.toLowerCase());
      this.loaders[contentType.toLowerCase()] = callback;
    }
  },

  getLoader: function(contentType) {
    contentType = contentType.toLowerCase();
    var globalLoader = ResourceLoader.getLoader(contentType),
        localLoader = this.loaders[contentType];
        
    if (!localLoader && !globalLoader) {
      return null;
    }
    return localLoader || globalLoader;
  },
  
  //--------------------------------------------------------------------------
  //
  //  Private function
  //
  //--------------------------------------------------------------------------
  
  _next: function() {
    // console.log(this.numActiveRequests);
    if (!this.paused) {
      if (!this.queue.isEmpty()) {
        if (this.numActiveRequests < this.maxActiveRequests) {
          this._loadRequests(this.queue.get(this.maxActiveRequests - this.numActiveRequests));
        }
      } else if (this.numActiveRequests === 0) {
        this.running = false;
      }
    }
  },
  
  _loadRequests: function(requests) {
    var request,
        i, n = requests.length;
        
    for (i = 0; i < n; i++) {
      request = requests[i];
      this._loadRequest(request);
    }
  },
  
  _loadRequest: function(request) {
    var contentType = request.contentType || this.contentType,
        loader = this.getLoader(contentType),
        loaderResult;
    
    this.numActiveRequests++;    
    
    if (!contentType) {
      request.error = "contentType not set";
      this._requestErrorHandler({
        request: request
      });
    }
    else if (!loader){
      request.error = "No loader for contentType:" + contentType;
      this._requestErrorHandler({
        request: request
      });
    }
    else {
      loaderResult = loader.load(request, this._requestLoadHandler, this._requestErrorHandler);
      if (loaderResult) {
        this.activeRequests[request.id] = loaderResult;
      }
    }    
  },
  
  _requestLoadHandler: function(event) {
    /*if (!this.activeRequests[request.id]) {
      console.log(request.id);
    }*/
    this.numActiveRequests--;
    if (this.activeRequests[event.request.id]) {
      delete this.activeRequests[event.request.id];
    }
    if (!event.canceled) {
      event.request.loadCallback.call(this, event);
    }
    else {
      event.request.errorCallback.call(this, event);
    }
    this._next();
  },
  
  _requestErrorHandler: function(event) {
    if (this.activeRequests[event.request.id]) {
      this.numActiveRequests--;
      delete this.activeRequests[event.request.id];
    }
    event.request.errorCallback.call(null, event);
    this._next();
  }
  
});

ResourceLoader.loaders = {};

ResourceLoader.registerLoader = function(contentType, callback) {
  if (lang.isArray(contentType)) {
    array.forEach(contentType, function(type) {
      ResourceLoader.registerLoader(type, callback);
    });
  } else {
    // console.log("[ResourceLoader] registered contentType: " + contentType.toLowerCase());
    ResourceLoader.loaders[contentType.toLowerCase()] = callback;
  }
};

ResourceLoader.getLoader = function(contentType) {
  contentType = contentType.toLowerCase();
  if (ResourceLoader.loaders[contentType] === undefined) {
    return undefined;
  }
  return ResourceLoader.loaders[contentType];
};

var imageLoader = {
  load: function(request, loadCallback, errorCallback) {
    var img = document.createElement("img");
    
    img.setAttribute("alt", "");
    
    img.onload = function(event) {
      img.onload = img.onerror = null;
      if (!event.canceled) {
        loadCallback.call(this, {
          request: request,
          data: img
        });
      }
    };

    img.onerror = function(event) {
      img.onload = img.onerror = null;
      errorCallback.call(this, {
        request: request,
        error: event
      });
    };

    img.src = request.url;

    return {
      cancel: function() {
        img.onload = img.onerror = null;
        errorCallback.call(this, {
          request: request,
          canceled: true
        });
      }
    };
  }
};

ResourceLoader.registerLoader("img", imageLoader);

// ResourceLoader.registerLoader("mock", function(request, loadCallback, errorCallback) {
//   var timeoutID = setTimeout(function(request) {
//     clearTimeout(timeoutID);
//     loadCallback.call(self, job);
//   }, Math.random() * 1000, job);
// });

return ResourceLoader;

});
