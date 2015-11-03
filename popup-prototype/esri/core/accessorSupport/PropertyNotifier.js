define([
  "dojo/has"
], 
function(has) {

  var isDebug = has("dojo-debug-messages");
  
  var warnNotBindable = function(declaredClass, bindingKey, notBindablePropertyParent, notBindableProperty) {
    isDebug && console.warn("[%s] won't detect changes of '%s' in the computing chain '%s' as '%s' isn't an Accessor.", declaredClass, notBindableProperty, bindingKey, notBindablePropertyParent);
  };
  
  var PropertyNotifier = function(key, deps) {
    this.key = key;
    this.chain = key.split(".");
    this.deps = deps;
  };
  
  PropertyNotifier.prototype = {
    install: function(obj) {
      return new Notifier(this, obj);
    }
  };
  
  var Notifier = function(binding, obj) {
    this.binding = binding;
    this.obj = obj;
    
    this._installs = [];
    this._props = obj._accessorProps;
    
    this._callback = this._callback.bind(this);
    this._install(obj, 0);
    this._notify();
  };
  
  Notifier.prototype = {
    remove: function() {
      this._installs.forEach(function(hdl) {
        hdl.remove();
      });
      this._installs = this._props = this.binding = this.obj = null;
    },
    
    _install: function(host, startIndex) {
      var chain = this.binding.chain;
      var installs = this._installs;
      var props;
      
      if (startIndex < installs.length) {
        installs.splice(startIndex).forEach(function(hdl) {
          hdl.remove();
        });
        this._notify();
      }
      
      if (startIndex === chain.length) {
        return;
      }
      
      if (host && (props = host._accessorProps)) {
        var name, i = startIndex;
        while ((name = chain[i]) && host && (props = host._accessorProps)) {
          installs[i] = props.bind(name, i, this._callback);
          host = host[chain[i++]];
        }
        if (isDebug && installs.length !== chain.length && host && host._accessorProps) {
          warnNotBindable(this.obj.declaredClass, this.binding.key, chain[i - 1], chain[i]);
        }
        this._notify();
      }
      else if (host) {
        warnNotBindable(this.obj.declaredClass, this.binding.key, chain[startIndex - 1], chain[startIndex]);
      }
    },
    
    _callback: function(key, value) {
      if (arguments.length === 1) {
        this._notify();
        return;
      }
      this._install(value, key + 1);
      this._notify();
    },
    
    _notify: function() {
      var deps = this.binding.deps;
      var props = this._props;
      for (var i = 0, n = deps.length; i < n; i++) {
        props._propertyWillChange(deps[i]);
      }
    }
  };
  
  return PropertyNotifier;
});
