define([
  "dojo/has",
  
  "../ObjectPool",
  "../ArrayPool",
  "../Scheduler",
  "../lang",
  
  "./Cache",
  "./OldValues",
  "./Property",
  "./once",
  "./introspect",
  "./chainWatch"
], function(
has,
ObjectPool, ArrayPool, Scheduler, esriLang,
Cache, OldValues, Property, once, introspect, chainWatch
) {
  var isDebug = has("dojo-debug-messages");

  var hasProp = Object.prototype.hasOwnProperty;
  
  var create = function(proto) {
    return Object.create(proto === undefined ? null : proto);
  };

  var CALLBACK_OBJECT_POOL = new ObjectPool(
    function CallbackObject() {
      this.fn = null;
      this.isExecuting = false;
      this.removed = false;
    },
    function() {
      this.fn = null;
    }
  );

  var STATE_POOL = new ObjectPool(
    function NotificationState() {
      this.oldValue = null;
      this.callbacks = null;
    },
    function() {
      this.oldValue = null;
      this.callbacks = ArrayPool.put(this.callbacks);
      this.callbacks = null;
    }
  );

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------
  
  var Properties = function(obj) {
    this.obj = obj;
    this.properties = Object.create(introspect.getProperties(obj));
    this.cache = new Cache();
    this.watchers = create();
    this.bindings = create();
    this.defaults = null;
    this.access = create();
    this._notificationsPool = new ObjectPool(function() {}, function() {});
    this.notifications = this._notificationsPool.get();
  };
  
  Properties.prototype = {
    obj: null,
    properties: null,
    notifyHdls: null,
    cache: null,
    watchers: null,
    bindings: null,
    initialized: false,
    notifications: null,
    ctorArgs: null,
    timer: null,
    _boundDispatch: null,
    
    initialize: function() {
      this.initialized = true;
      this.notifyHdls = introspect.installPropertyNotifiers(this.obj);
      this.dispatch();
    },
    
    destroy: function() {
      if (this.notifyHdls) {
        this.notifyHdls.forEach(function(hdl) {
          return hdl.remove();
        }, this);
      }
      if (this.timer) {
        this.timer.remove();
      }

      var watchers = this.watchers;
      Object.getOwnPropertyNames(watchers).forEach(function(name) {
        watchers[name].callbacks.forEach(function(cb) {
          cb.removed = true;
        });
      });

      this.cache.destroy();
      this.defaults && this.defaults.destroy();

      this.obj = null;
      this.timer = null;
      this.notifyHdls = null;
      this.properties = null;
      this.cache = null;
      this.watchers = null;
      this.bindings = null;
      this.notifications = null;
      this.defaults = null;
      this.access = null;
    },

    getFromCache: function(name) {
      var cache = this.cache;
      var defaults = this.defaults;
      var prop = this.properties[name];
      
      // Get from the cache
      if (cache.has(name)) {
        return cache.get(name);
      }
      if (defaults && defaults.has(name)) {
        return defaults.get(name);
      }
      return prop.value;
    },

    /**
     *
     */
    get: function(name, dontNotify) {
      var cache = this.cache;
      var defaults = this.defaults;

      // Get from the cache
      if (cache.has(name) && !cache.isDirty(name)) {
        return cache.get(name);
      }
      
      var obj = this.obj;
      var prop = this._defineProperty(name);
      var getter = prop.getter;
      var getterArity = prop.getterArity;
      var value;

      // Initialize the cache
      if (!cache.has(name)) {
        if (getter) {
          !dontNotify && this.propertyWillChange(name);
          if (getterArity) {
            value = getter.call(obj, prop.value);
          }
          else {
            value = getter.call(obj);
          }
          cache.set(name, value);
          this.propertyHasChanged(name, value);
        } 
        else {
          return (defaults && defaults.has(name)) ? defaults.get(name) : prop.value;
        }
      } 
      else {
        !dontNotify && this.propertyWillChange(name);
        // Update the cache
        value = cache.get(name);
        if (getter) {
          if (getterArity) {
            value = getter.call(obj, value);
          } 
          else {
            value = getter.call(obj);
          }
        }
        cache.set(name, value);
        this.propertyHasChanged(name, value);
      }
      
      return value;
    },

    /**
     *
     */
    set: function(name, value) {
      var prop = this._defineProperty(name);
      var getter = prop.getter;
      var setter = prop.setter;
      var setterArity = prop.setterArity;
      
      var obj = this.obj;
      var cache = this.cache;

      // Notify the other properties
      this.propertyWillChange(name);

      // convert to type if needed
      value = this._ensureType(prop, value);

      // set directly the value in the cache if no setter.
      if (!setter) {
        cache.set(name, value);
        this.propertyHasChanged(name, value);
      } 
      else {
        // call the setter
        if (setterArity === 2) {
          // value = setter.call(obj, value, cache.get(name));
          value = setter.call(obj, value, this.getFromCache(name));
        } 
        else {
          value = setter.call(obj, value);
        }

        // if there is a getter, leave the property dirty.
        if (value !== undefined || !getter) {
          cache.set(name, value);
          this.propertyHasChanged(name, value);
        }
      }
    },
    
    setDefault: function(name, value) {
      var defaults = this.defaults;
      if (!defaults) {
        this.defaults = defaults = new Cache();
      }
      
      var prop = this._defineProperty(name, true);
      var getter = prop.getter;
      var setter = prop.setter;
      var getterArity = prop.getterArity;
      var setterArity = prop.setterArity;
      
      var obj = this.obj;
      
      var isCached = this.cache.has(name);

      // convert to type if needed
      value = this._ensureType(prop, value);

      // Once the property is cached,
      // store only the value as is.
      // No need to notify.
      if (isCached) {
        defaults.set(name, value);
      }
      if (!isCached) {
        if (setter) {
          // call the setter
          if (setterArity === 2) {
            value = setter.call(obj, value, defaults.get(name));
          } 
          else {
            value = setter.call(obj, value);
          }
          
          if (getter) {
            value = getterArity ? 
              getter.call(obj, undefined) : getter.call(obj);
          }
        }
        
        // we shouldn't notify for defaults
        if (!this.initialized) {
          defaults.set(name, value);
        }

        this.propertyWillChange(name);
        defaults.set(name, value);
        this.propertyHasChanged(name, value);
      }
    },

    /**
     *
     * @private
     */
    hasBindings: function(name) {
      var bindings = this.bindings[name];
      return bindings != null && bindings.length > 0;
    },

    /**
     *
     * @private
     */
    hasWatchers: function(name) {
      var watchers = this.watchers[name];
      return watchers != null && watchers.callbacks.length > 0;
    },

    /**
     *
     * @private
     */
    bind: function(name, key, callback) {
      var bindings = this.bindings[name];
      var binding = {
        key: key,
        fn: callback
      };
      
      if (!bindings) {
        this._defineProperty(name, true);
        this.bindings[name] = bindings = [binding];
      } 
      else {
        bindings.push(binding);
      }
      
      return {
        remove: once(function() {
          binding.removed = true;
          // remove from future notifications
          bindings.splice(bindings.indexOf(binding), 1);
        })
      };
    },

    /**
     * Notify the property and its dependencies
     * that it will change.
     * @private
     */
    propertyWillChange: function(name) {
      var prop = this.properties[name];
      var chain = prop.chain;
      var i, n;
      
      if (chain) {
        // mark as invalid all dependencies
        for (i = 0, n = chain.length; i < n; i++) {
          // Mark the cached value as dirty
          this._propertyWillChange(chain[i]);
        }
      }

      this._propertyWillChange(name);
    },

    /**
     * 
     * @private
     */
    _propertyWillChange: function(name) { 
      var cache = this.cache;   
      var bindings = this.bindings[name];
      var watchers = this.watchers[name];
      var callbacks = watchers && watchers.callbacks;
      var oldValues = watchers && watchers.oldValues;
      var notifications = this.notifications[name];
      var notifier;

      var hasCallbacks = callbacks && callbacks.length > 0;
      var canNotify = this.initialized && !this.timer;
      var state = null;

      if (cache.has(name)) {
        if (Object.getNotifier && (notifier = Object.getNotifier(this.obj))) {
          notifier.notify({
            type: "update",
            name: name,
            oldValue: this.getFromCache(name)
          });
        }
      }
      
      // Notify the bindings
      // mark as invalid all dependencies
      if (bindings) {
        for (var i = 0, n = bindings.length; i < n; i++) {
          bindings[i].fn.call(this, bindings[i].key);
        }
      }

      // Create a notification for the user
      if (hasCallbacks) {
        if (!notifications) {
          notifications = this.notifications[name] = ArrayPool.get();
          watchers.isDirty = true;
        }

        // add a notification only if a new watcher, or no notifications
        // has been added before a previously scheduled notification
        if (watchers.isDirty) {
          watchers.isDirty = false;
          state = STATE_POOL.get();
          state.oldValue = this.get(name, true);
          state.callbacks = ArrayPool.getCopy(callbacks);
          notifications.push(state);
          if (oldValues) {
            cache.set(name, oldValues.add(this.obj[name]));
            cache.setDirty(name);
          }
        }
        
        if (canNotify) {
          if (!this._boundDispatch) {
            this._boundDispatch = this.dispatch.bind(this);
          }
          this.timer = Scheduler.schedule(this._boundDispatch);
        }
      }
      
      cache.setDirty(name);
    },

    /**
     * Notify the commit of a property's new value after been made dirty and recomputed.
     * @private
     */
    propertyHasChanged: function(name, value) {
      if (this.hasBindings(name)) {
        var bindings = this.bindings[name];
        // mark as invalid all dependencies		
        for (var i = 0, n = bindings.length; i < n; i++) {
          bindings[i].fn.call(this, bindings[i].key, value);
        }
      }
    },

    /**
     *
     * @private
     */
    watch: function(name, callback) {
      var obj = this.obj;
      var properties = this.properties;
      var watchers = this.watchers[name];
      var names;
      
      if (Array.isArray(name)) {
        names = name;
      } 
      else if (name.indexOf(",") > -1) {
        names = name.split(/\s*,\s*/);
      }
      
      if (names) {
        var handles = ArrayPool.get();
        var i = 0;
        while ((name = names[i++])) {
          handles.push(this.watch(name, callback));
        }
        return {
          handles: handles,
          remove: once(function() {
            for (var i = 0, n = handles.length; i < n; i++) {
              handles[i].remove();
            }
            ArrayPool.put(handles);
          })
        };
      }

      // chain watching
      if (name.indexOf(".") > -1) {
        return chainWatch(obj, name, callback);
      }

      var callbackObject = CALLBACK_OBJECT_POOL.get();
      callbackObject.fn = callback;
      
      if (!watchers) {
        // Define a property if it's not in the metadata of the class.
        this._defineProperty(name);

        // force initialization of the cache
        this.get(name, true);
        
        this.watchers[name] = watchers = {
          isDirty: true,
          callbacks: [callbackObject] // todo use ArrayPool
        };
        
        if (properties[name].copy) {
          watchers.oldValues = new OldValues(properties[name].copy);
        }
      } 
      else {
        watchers.isDirty = true;
        watchers.callbacks.push(callbackObject);
      }
      return {
        remove: once(function() {
          // remove from in-flight notifications
          callbackObject.removed = true;
          // remove from future notifications
          watchers.callbacks.splice(watchers.callbacks.indexOf(callbackObject), 1);
          CALLBACK_OBJECT_POOL.put(callbackObject);
        })
      };
    },

    /**
     * dispatch the notification to watchers if properties changed
     * @private
     */
    dispatch: function() {
      this.timer = null;
      
      var obj = this.obj;
      var notifications = this.notifications;
      var watchers = this.watchers;
      var callbackObject, name, state, notification, i, j, newValue, oldValues;

      // Grab the current notifications and immediately create a new hash
      // to start storing any notifications that might be generated this turn
      
      // TODO dispose the notifications properly
      this.notifications = this._notificationsPool.get();

      /*jshint -W089 */
      var called = ArrayPool.get();
      for (name in notifications) {
        notification = notifications[name];
        if (!notification) {
          continue;
        }
        notifications[name] = null;
        called.length = 0;
        newValue = this.get(name);
        oldValues = watchers[name].oldValues;
        for (i = 0; (state = notification[i]); i++) {
          if (!esriLang.equals(state.oldValue, newValue)) {
            for (j = 0; (callbackObject = state.callbacks[j]); j++) {
              // If a callback was removed after the notification was scheduled to
              // start, don't call it
              if (!callbackObject.isExecuting && !callbackObject.removed && called.indexOf(callbackObject) === -1) {
                called.push(callbackObject);
                callbackObject.isExecuting = true;
                callbackObject.fn.call(obj, newValue, state.oldValue, name, obj);
                callbackObject.isExecuting = false;
              }
            }
          }
          STATE_POOL.put(state);
        }
        oldValues && oldValues.reset();
        ArrayPool.put(notification);
      }
      this._notificationsPool.put(notifications);
      ArrayPool.put(called);
    },

    _defineProperty: function(name, global) {
      var obj = this.obj;
      var properties = this.properties;
      var prop = properties[name];
      var value, resetValue = false;

      if (prop) {
        return prop;
      }

      var owner = introspect.getPropertyOwner(obj, name);
      if (owner) {
        prop = introspect(owner).mixin.properties[name];
      }

      if (!prop) {
        if (hasProp.call(this.obj, name)) {
          value = this.obj[name];
          // delete the property from the instance.
          // after the property is defined, re-init the cache
          delete this.obj[name];
          resetValue = true;
        }
        if (global) {
          prop = introspect.defineProperty(this.obj, name);
        }
        else {
          isDebug && console.debug("[%s] defining dynamic property '%s'", obj.declaredClass, name);
          prop = new Property(name, {
            value: introspect.getPropertyOwnerValue(obj, name)
          });
          Object.defineProperty(obj, name, prop.getDescriptor());
        }
        if (resetValue) {
          this.cache.set(name, value);
        }
      }

      properties[name] = prop;

      return prop;
    },

    _ensureType: function(prop, value) {
      if (value && prop.type && !(value instanceof prop.type)) {
        if (value.constructor && value.constructor._meta !== undefined)  {
          isDebug && console.warn("Assigning an instance of '" + (value.declaredClass || "unknown") + "' which is not a subclass of '" + ((prop.type.prototype && prop.type.prototype.declaredClass) || "unknown") + "' to the property '" + prop.name + "' of '" + this.obj.declaredClass + "'");
        } else {
          var Ctor = prop.type;
          value = new Ctor(value);
        }
      }

      return value;
    }
  };
  
  return Properties;

});
