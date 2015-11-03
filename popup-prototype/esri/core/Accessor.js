/**
 * Accessor is a mixin for getting, setting, and watching class properties in a consistent way.
 * Accessor has no constructor.
 * @module esri/core/Accessor
 * @noconstructor
 * @since 4.0
 */
define([
  "./declare",

  "./accessorSupport/Properties"
], 
function(
  declare, 
  Properties
) {
  
  var getValue = function(obj, chain, idx) {
    var value = obj && obj.get ? obj.get(chain[idx]) : undefined;
    return (!value || idx === chain.length - 1) ? 
      value : getValue(value, chain, ++idx);
  };

  //--------------------------------------------------------------------------
  //
  //  Accessor
  //
  //--------------------------------------------------------------------------

  /**
   * @constructor module:esri/core/Accessor
   */
  var Accessor = declare(null, 
  /** @lends module:esri/core/Accessor.prototype */
  {
    declaredClass: "esri.core.Accessor",
    
    "-chains-": {
      postIntrospection: "after",
      initialize: "after",
      destroy: "before"
    },

    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function Accessor(kwArgs) {
      this._accessorProps = new Properties(this);
      // Support for multiple constructor signature.
      if (arguments.length > 0 && this.normalizeCtorArgs) {
        this._accessorProps.ctorArgs = this.normalizeCtorArgs.apply(this, Array.prototype.slice.call(arguments));
      }
    },
    
    // To be defined by subclasses
    // getDefaults: function getDefaults(properties) {
    //   return {};
    // },
    
    postscript: function postscript(kwArgs) {
      // 1. call getDefaults() on the subclasses.
      // 2. set the ctor properties.
      // 3. initialize the obj.
            
      var props = this._accessorProps;
      var ctorArgs = props.ctorArgs || kwArgs;
      var defaults;

      // Setting the defaults values.
      defaults = this.getDefaults ? (ctorArgs ? this.getDefaults(ctorArgs) : this.getDefaults({})) : null;

      defaults && Object.getOwnPropertyNames(defaults)
        .forEach(function(name) {
          props.setDefault(name, defaults[name]);
        }, this);

      // Setting the user defined properties.
      if (ctorArgs) {
        this.set(ctorArgs);
        props.ctorArgs = null;
      }

      // if a subclass listens for its property changes.
      props.initialize();

      // The subclass can proceed.
      this.initialize();
    },
    
    postIntrospection: function() {},
    
    initialize: function initialize() {},
    
    destroy: function destroy() {
      if (!this._accessorProps) {
        try {
          throw new Error("instance is already destroyed");
        }
        catch (e) {
          console.warn(e.stack);
        }
        return;
      }

      this._accessorProps.dispatch();

      this._accessorProps.destroy();
      this._accessorProps = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Gets the value of a property.
     *
     * @param {string} name - The property to get.
     * @return {*} The property's value.
     */
    get: function(name) {
      if (name.indexOf(".") > 0) {
        return getValue(this, name.split("."), 0);
      }
      return this[name];
    },

    /**
     * Sets the value of a property.
     * You can either set one property or multiple properties by using an object.
     *
     * 1. one property: call `.set(<property name>, <new value>)`
     * 2. multiple properties: call `.set(<object with key value pairs>)`
     *
     * @param {string} name - The property to set.
     * @param {*=} value - The new value to set on the property.
     */
    set: function set(name, value) {
      if (name && typeof name === "object") {
        if (name._accessorProps) {
          name.keys().forEach(function(prop) {
            this.set(prop, name[prop]);
          }, this);
        }
        else {
          Object.getOwnPropertyNames(name).forEach(function(prop) {
            this.set(prop, name[prop]);
          }, this);
        }
        return this;
      }

      // don't set privates variables.
      // eg: font = new Font(anotherFont);
      if (name[0] !== "_") {
        this[name] = value;
      }
      return this;
    },

    /**
     * Accessor automatically notifies watcher when properties change.
     * There are two ways to use the watch method.
     *
     * 1. one property. The callback is called with a change object as parameter containing name, oldValue, newValue and target which is the watched obj.
     * 2. all properties, by specifying only the callback. The callback is called with an Array[Change] as parameter.
     *
     * @param {string}   nameOrNames - The property or properties to watch. Multiple properties can be specified as a comma-separated list.
     * @param {module:esri/core/Accessor~watchCallback} callback - The callback to be called when the property value has changed.
     *
     * @return {module:esri/core/Accessor~WatchHandle} A watch handle.
     */
    watch: function(name, callback) {
      return this._accessorProps.watch(name, callback);
    },
    
    /**
     * Accessor's implementation of Object.prototype.hasOwnProperty.
     * Checks if the property is defined in the cache or the obj.
     *
     * @private
     */
    hasOwnProperty: function(name) {
      var props = this._accessorProps;
      return props && props.properties[name] ? 
        props.cache.has(name) || (props.defaults !== null && props.defaults.has(name))
        : Object.prototype.hasOwnProperty.call(this, name);
    },

    keys: function() {
      var props = this._accessorProps;

      return props.cache.keys();
    },

    /**
     * 
     * @private
     */
    notifyChange: function(name) {
      this._accessorProps.propertyWillChange(name);
    }
  
  });
  
  /**
   * Callback to be called when a watched property changes.
   *
   * @callback module:esri/core/Accessor~watchCallback
   * @param {*} newValue - The new value of the watched property.
   * @param {*} oldValue - The old value of the watched property.
   * @param {string} name - The property name.
   * @param {module:esri/core/Accessor} target - The object on which the property is being watched.
   *                                           
   * @return {module:esri/core/Accessor~WatchHandle} A handle representing the watch.
   */

  /**
   * Represents a watch created when an object invokes [watch()](#watch).
   *
   * @typedef {Object} module:esri/core/Accessor~WatchHandle
   * 
   * @property {function} remove - Removes the watch handle.
   * 
   * @example
   * var handle = map.watch('basemap', function(newVal){
   *   //Each time the value of map.basemap changes, it is logged in the console
   *   console.log("new basemap: ", newVal);
   * });
   * 
   * //When remove() is called on the watch handle, the map no longer watches for changes to basemap
   * handle.remove();
   */

  return Accessor;
});
