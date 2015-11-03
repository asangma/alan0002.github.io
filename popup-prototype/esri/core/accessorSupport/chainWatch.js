define([
  "dojo/has",

  "../lang",
  
  "./once"
], function(
  has,
  esriLang,
  once
) {

  var isDebug = has("dojo-debug-messages");

  //--------------------------------------------------------------------------
  //
  //  Watch
  //
  //--------------------------------------------------------------------------

  var Link = function(name, callback, next) {
    this._obj = null;
    this._hdl = null;

    this.name = name;
    this.callback = callback;
    this.next = next;
    this.handler = this.handler.bind(this);
  };

  Link.prototype = {
    handler: function(newValue, oldValue, name, target) {
      if (this.next) {
        this.next.obj = newValue;
      }
      if (this.name === name) {
        this.callback(newValue, oldValue, name, target);
      }
    },
    remove: function() {
      this.obj = null;
    }
  };

  Object.defineProperty(Link.prototype, "obj", {
    get: function() {
      return this._obj;
    },
    set: function(obj) {
      if (this._hdl) {
        this._hdl.remove();
        this._hdl = null;
      }
      this._obj = obj;
      if (obj) {
        // Accessor
        if (obj._accessorProps) {
          this._hdl = obj._accessorProps.watch(this.name, this.handler);
        }
        // _WidgetBase and Stateful
        else if (obj.watch) {
          this._hdl = obj.watch(this.name, function(name, oldValue, newValue) {
            this.handler(newValue, oldValue, this.name, this.obj);
          }.bind(this));
        }
        else {
          isDebug && console.warn("[watch()] unable to a watch property '%s' on object: \n%O", this.name, obj);
        }
      }
      if (this.next) {
        this.next.obj = obj == null ? obj : obj[this.name];
      }
    }
  });

  var _chainWatch = function(obj, chain, callback) {
    if (!Array.isArray(chain)) {
      chain = [chain];
    }
    if (chain.length > 0) {
      var root = new Link(chain[0], callback, _chainWatch(null, chain.slice(1), callback));
      root.obj = obj;
      return root;
    }
    else {
      return null;
    }
  };

  var _getProp = function(obj, chain, idx) {
    if (!obj) {
      return undefined;
    }

    var value = obj.get ? obj.get(chain[idx]) : obj[chain[idx]];

    return (idx === chain.length - 1) ? value : _getProp(value, chain, ++idx);
  };

  return function chainWatch(obj, name, callback) {
    var chain = name.split(".");
    var oldValue = _getProp(obj, chain, 0);
    var watcher = _chainWatch(obj, chain, function() {
      var newValue = _getProp(obj, chain, 0);
      if (!esriLang.equals(oldValue, newValue)) {
        callback.call(obj, newValue, oldValue, name, obj);
        oldValue = newValue;
      }
    });
    return {
      remove: once(function() {
        watcher.remove();
        watcher = null;
      })
    };
  };

});