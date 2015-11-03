define([
  "./ObjectPool"
],
function(
  ObjectPool
) {

  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  var handleItems = new ObjectPool(
    function() {
      this.isActive = true;
      this.callback = null;
    },
    function() {
      this.isActive = false;
      this.callback = null;
    }
  );

  var noop = function() {};
  
  var removeFn = function() {
    queueHandles.put(this);
  };

  var queueHandles = new ObjectPool(
    function() {
      this.remove = removeFn;
    },
    function nextTick_queueHandles_remove() {
      this.remove = noop;
      if (this.destructor) {
        this.destructor();
      }
      // mark the item as inactive
      // it will be disposed by executeTask
      this.item.isActive = false;
      this.item = null;
      this.destructor = null;
    }
  );

  var getQueueHandle = function getQueueHandle(item, destructor) {
    var hdl = queueHandles.get();
    hdl.item = item;
    hdl.destructor = destructor;
    return hdl;
  };

  var executeTask = function(item) {
    if (item.isActive) {
      // We switch it off.
      item.isActive = false;
      item.callback();
    }
    // if the item was reclaimed during the callback call.
    // then don't dispose it. 
    if (!item.isActive) {
      handleItems.put(item);
    }
  };

  var nextTick = (function() {
    var destructor;
    var enqueue;

    var canUsePostMessage = function() {
      if (window.postMessage && !window.importScripts) {
        var postMessageIsAsynchronous = true;
        var oldOnMessage = window.onmessage;
        window.onmessage = function() {
          postMessageIsAsynchronous = false;
        };
        window.postMessage("", "*");
        window.onmessage = oldOnMessage;
        return postMessageIsAsynchronous;
      }
    };
    
    var queue = [];

    // Investigate not using MutationObserver like dojo2 core
    if (MutationObserver) {
      var node = document.createElement("div");
      var observer = new MutationObserver(function () {
        while (queue.length > 0) {
          var item = queue.shift();
          executeTask(item);
        }
      });

      observer.observe(node, { attributes: true });

      enqueue = function (item) {
        queue.push(item);
        node.setAttribute("queueStatus", "1");
      };
    }
    else if (canUsePostMessage()) {
      window.addEventListener("message", function(event) {
        if (event.source == window && event.data == "esri-nexttick-message") {
          event.stopPropagation();
          while (queue.length) {
            executeTask(queue.shift());
          }
        }
      }, true);

      enqueue = function (item) {
        queue.push(item);
        window.postMessage("esri-nexttick-message", "*");
      };
    }
	else if (window.setImmediate) {
      destructor = window.clearImmediate;
      enqueue = function (item) {
        return window.setImmediate(executeTask.bind(null, item));
      };
	}
	else {
      destructor = window.clearTimeout;
      enqueue = function(item) {
        return window.setTimeout(executeTask.bind(null, item), 0);
      };
	}
	
	var queueTask = function queueTask(callback) {
      var item = handleItems.get();
      item.callback = callback;
      var id = enqueue(item);
      return getQueueHandle(item, destructor && function () {
        destructor(id);
      });
	};
	
	return queueTask;
  })();

  return nextTick;
  
});
