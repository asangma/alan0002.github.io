/* jshint forin:false */
define([
  "../../../core/watchUtils",
  "dojo/on",
  "dojo/_base/lang"
], function(
  watchUtils,
  on,
  lang
) {
  function Handles() {
    this.handles = [];
    this.ids = {};
  }

  Handles.prototype.remove = function() {
    this.handles.forEach(function(handle) {
      handle.remove();
    });

    this.handles.length = 0;
    this.ids = {};
  };

  Handles.prototype.push = function() {
    if (arguments.length === 2 && typeof arguments[0] === "string") {
      this.handles.push(arguments[1]);
      this.ids[arguments[0]] = arguments[1];
    } else {
      this.handles.push.apply(this.handles, arguments);
    }
  };

  Handles.prototype.byId = function(id) {
    return this.ids[id];
  };

  function flatten(props) {
    var ret = {};

    for (var name in props) {
      var handler = props[name];

      if (typeof handler === "function") {
        ret[name] = handler;
      } else {
        for (var evname in handler) {
          ret[name + "." + evname] = handler[evname];
        }
      }
    }

    return ret;
  }

  function extract(props, thisObj) {
    var propEvents = {};

    for (var name in props) {
      var handler = props[name];
      var options = {};

      if (typeof handler === "object") {
        options = lang.mixin({}, handler);
        delete options.handler;
        handler = handler.handler;
      }

      if (thisObj) {
        handler = (function(handler) {
          return function() {
            handler.apply(thisObj, arguments);
          };
        })(handler);
      }

      var parts = name.split(".");
      var propName, eventName;

      if (parts.length === 1) {
        propName = "";
        eventName = name[0];
      } else {
        propName = parts.slice(0, parts.length - 1).join(".");
        eventName = parts[parts.length - 1];
      }

      if (!propEvents[propName]) {
        propEvents[propName] = [];
      }

      propEvents[propName].push({
        eventName: eventName,
        handler: handler,
        installer: options.pausable ? on.pausable : on
      });
    }

    return propEvents;
  }

  var eventUtils = {
    Handles: Handles,

    on: function(obj, props, thisObj, maybeThisObj) {
      var watchHandles = new Handles();
      var eventHandles = {};

      if (typeof props === "string") {
        var newprops = {};
        newprops[props] = thisObj;
        props = newprops;

        thisObj = maybeThisObj;
      }

      var propEvents = extract(flatten(props), thisObj);

      for (var propName in propEvents) {
        var eventHandle = new Handles();
        eventHandles[propName] = eventHandle;

        if (propName) {
          watchHandles.push(watchUtils.init(obj, propName, (function(handles, propName, evs) {
            return function(value) {
              handles.remove();

              if (value) {
                evs.forEach(function(ev) {
                  handles.push(propName + "." + ev.eventName, ev.installer(value, ev.eventName, ev.handler));
                });
              }
            };
          })(eventHandle, propName, propEvents[propName])));
        } else {
          propEvents[propName].forEach(function(ev) {
            eventHandle.push(propName + "." + ev.eventName, ev.installer(obj, ev.eventName, ev.handler));
          });
        }
      }

      var ret = new Handles();
      var origremove = ret.remove;

      ret.remove = function() {
        for (var k in eventHandles) {
          eventHandles[k].remove();
        }

        eventHandles = {};
        watchHandles.remove();

        origremove.call(ret);
      };

      ret.byId = function(id) {
        for (var k in eventHandles) {
          var evh = eventHandles[k];
          var handle = evh.byId(id);

          if (handle) {
            return handle;
          }
        }

        return null;
      };

      return ret;
    }
  };

  return eventUtils;
});
