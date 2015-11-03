/**
 * @classdesc
 * Various utilities and convenience functions for watching
 * {@link module:esri/core/Accessor Accessor} properties.
 *
 * @module esri/core/watchUtils
 * @since 4.0
 * @see [Sample - Add 2D overview map in SceneView](../sample-code/3d/2d-overview-map/)
 * @see module:esri/core/Accessor
 */
define([
], function(
){
  function when(obj, prop, callback, validator) {
    var handle = obj.watch(prop, function(newValue, oldValue, prop, target) {
      if (validator(newValue)) {
        callback.call(obj, newValue, oldValue, prop, target);
      }
    });

    var val = obj.get(prop);

    if (validator(val)) {
      callback.call(obj, val, val, prop, obj);
    }

    return handle;
  }

  function whenOnce(obj, prop, callback, validator) {
    var called = false;

    var handle = when(obj, prop, function(newValue, oldValue, prop, target) {
      called = true;

      if (handle) {
        handle.remove();
      }

      callback.call(obj, newValue, oldValue, prop, target);
    }, validator);

    if (called) {
      handle.remove();
    }

    return handle;
  }

  function validateTruthy(value) {
    return !!value;
  }

  function validateFalsy(value) {
    return !value;
  }

  function validateTrue(value) {
    return value === true;
  }

  function validateFalse(value) {
    return value === false;
  }

  function validateDefined(value) {
    return value !== undefined;
  }

  function validateUndefined(value) {
    return value === undefined;
  }

  /** @alias module:esri/core/watchUtils */
  var watchUtils = {
    /**
     * Watches a property for changes and calls the callback with the initial value
     * of the property.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call with the initial value
     *                              of the property when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    init: function(obj, prop, callback) {
      var value = obj.get(prop);
      callback.call(obj, value, value, prop, obj);
      return watchUtils.watch(obj, prop, callback);
    },

    /**
     * Watches a property for changes. This is an alias for
     * {@link module:esri/core/Accessor#watch Accessor.watch()}, provided for completeness.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     * @see {@link module:esri/core/Accessor#watch Accessor.watch()}
     */
    watch: function(obj, prop, callback) {
      return obj.watch(prop, callback);
    },

    /**
     * Watches a property for changes once. The returned watch handle is removed
     * after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    once: function(obj, prop, callback) {
      if(!callback && typeof prop === "function") {
        callback = prop;
        prop = "*";
      }

      var handle = obj.watch(prop, function(newValue, oldValue, name, target) {
        handle.remove();
        callback.call(obj, newValue, oldValue, name, target);
      });

      return handle;
    },

    /**
     * Watches a property for becoming truthy. As with {@link module:esri/core/watchUtils#init}, the callback
     * is called initially if the property is initially truthy.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    when: function(obj, prop, callback) {
      return when(obj, prop, callback, validateTruthy);
    },

    /**
     * Watches a property for becoming truthy once. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially truthy. The returned watch
     * handle is removed after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenOnce: function(obj, prop, callback) {
      return whenOnce(obj, prop, callback, validateTruthy);
    },

    /**
     * Watches a property for becoming falsy. As with {@link module:esri/core/watchUtils#init}, the callback
     * is called initially if the property is initially falsy.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenNot: function(obj, prop, callback) {
      return when(obj, prop, callback, validateFalsy);
    },

    /**
     * Watches a property for becoming falsy once. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially falsy. The returned watch
     * handle is removed after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenNotOnce: function(obj, prop, callback) {
      return whenOnce(obj, prop, callback, validateFalsy);
    },

    /**
     * Watches a property for becoming `true`. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `true`.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenTrue: function(obj, prop, callback) {
      return when(obj, prop, callback, validateTrue);
    },

    /**
     * Watches a property for becoming `true` once. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `true`. The returned watch
     * handle is removed after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenTrueOnce: function(obj, prop, callback) {
      return whenOnce(obj, prop, callback, validateTrue);
    },

    /**
     * Watches a property for becoming `false`. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `false`.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenFalse: function(obj, prop, callback) {
      return when(obj, prop, callback, validateFalse);
    },

    /**
     * Watches a property for becoming `false` once. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `false`. The returned watch
     * handle is removed after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenFalseOnce: function(obj, prop, callback) {
      return whenOnce(obj, prop, callback, validateFalse);
    },

    /**
     * Watches a property for becoming `defined`. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially defined.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenDefined: function(obj, prop, callback) {
      return when(obj, prop, callback, validateDefined);
    },

    /**
     * Watches a property for becoming `defined` once. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `defined`. The returned watch
     * handle is removed after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenDefinedOnce: function(obj, prop, callback) {
      return whenOnce(obj, prop, callback, validateDefined);
    },

    /**
     * Watches a property for becoming `undefined`. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `undefined`.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenUndefined: function(obj, prop, callback) {
      return when(obj, prop, callback, validateUndefined);
    },

    /**
     * Watches a property for becoming `undefined` once. As with {@link module:esri/core/watchUtils#init init()}, the callback
     * is called if the property is initially `undefined`. The returned watch
     * handle is removed after the first time the callback has been invoked.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    whenUndefinedOnce: function(obj, prop, callback) {
      return whenOnce(obj, prop, callback, validateUndefined);
    },

    /**
     * Watches a property for changes. The returned handle can be paused (and resumed)
     * to temporarily prevent the callback from being called on property changes.
     *
     * @instance
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {module:esri/core/Accessor~watchCallback} callback - The function to call when the property changes.
     *
     * @return {module:esri/core/watchUtils~PausableWatchHandle} A pausable watch handle.
     */
    pausable: function(obj, prop, callback) {
      if(!callback && typeof prop === "function") {
        callback = prop;
        prop = "*";
      }

      var paused = false;

      var handle = obj.watch(prop, function(newValue, oldValue, name, target) {
        if (!paused) {
          callback.call(obj, newValue, oldValue, name, target);
        }
      });

      return {
        remove: handle.remove,

        pause: function() {
          paused = true;
        },

        resume: function() {
          paused = false;
        }
      };
    },

    /**
     * Watches a property for changes and automatically attaches and detatches
     * an event handler for a given event to the property value as needed.
     *
     * The attachedHandler and detachedHandler are optional and if provided
     * will be called whenever the event handler is attached and detached
     * respectively.
     *
     * @param {module:esri/core/Accessor} obj - The object containing the property to watch.
     * @param {string} prop - The name of the property to watch.
     * @param {string} eventName - The name of the event to attach the event handler for.
     * @param {Function} eventHandler - The event handler callback function.
     * @param {module:esri/core/watchUtils~EventAttachedCallback=} attachedHandler - Callback called each time the event handler is attached.
     * @param {module:esri/core/watchUtils~EventAttachedCallback=} detachedHandler - Callback called each time the event handler is detached.
     *
     * @instance
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    on: function(obj, prop, eventName, eventHandler, attachedHandler, detachedHandler) {
      var eventHandle = {
        target: null,
        handle: null
      };

      var removeEventHandle = function() {
        if (eventHandle.handle) {
          if (detachedHandler) {
            detachedHandler(eventHandle.target, obj, prop, eventName);
          }

          eventHandle.handle.remove();

          eventHandle.handle = null;
          eventHandle.target = null;
        }
      };

      var watchHandle = watchUtils.init(obj, prop, function(value) {
        removeEventHandle();

        if (value && value.on) {
          eventHandle.target = value;
          eventHandle.handle = value.on(eventName, eventHandler);

          if (attachedHandler) {
            attachedHandler(eventHandle.target, obj, prop, eventName);
          }
        }
      });

      return {
        remove: function() {
          watchHandle.remove();
          removeEventHandle();
        }
      };
    },
  };

  /**
   * Represents a watch created when an object invokes {@link module:esri/core/Accessor#watch watch()}.
   *
   * @typedef {Object} module:esri/core/watchUtils~PausableWatchHandle
   * @property {function} remove - Removes the watch handle.
   * @property {function} pause - Pauses the handle preventing changes to invoke
   *                              the associated callback.
   * @property {function} resume - Resumes a paused the handle.
   *
   * @example
   * var handle = map.watch('basemap', function(newVal){
   *   //Each time the value of map.basemap changes, it is logged in the console
   *   console.log("new basemap: ", newVal);
   * });
   *
   * //When pause() is called on the watch handle, the callback represented by the
   * //watch is no longer invoked, but is still available for later use
   * handle.pause();
   *
   * //When resume() is called on the watch handle, the callback resumes
   * //firing each time the watched property changes.
   * handle.resume();
   *
   * //When remove() is called on the watch handle, the map no longer watches for changes to basemap
   * handle.remove();
   */

  /**
   * Callback to be called when a event handler is either attached or detached.
   *
   * @callback module:esri/core/watchUtils~EventAttachedCallback
   * @param {*=} target - The target object where the event handle is attached to.
   * @param {string=} propName - The watched property.
   * @param {module:esri/core/Accessor=} obj - The watched object.
   * @param {string=} eventName - The event name.
   *
   */

  return watchUtils;
});
