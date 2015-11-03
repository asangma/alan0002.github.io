/**
 * Mixin for Portal and PortalItem.
 *
 * @module esri/core/Loadable
 * @mixin
 * @since 4.0
 */
define([
  "./Promise",
  
  "dojo/aspect",
  
  "dojo/Deferred",
  
  "./errors"
], 
function(
  Promise,
  aspect,
  Deferred,
  errors
) {

  var STATUS_NOT_LOADED = "not-loaded";
  var STATUS_LOADING = "loading";
  var STATUS_FAILED = "failed";
  var STATUS_LOADED = "loaded";
  
  var Loadable = Promise.createSubclass(
  /** 
  * @mixes module:esri/core/Promise
  * @lends module:esri/core/Loadable 
  */    
  {

    declaredClass: "esri.core.Loadable",

    "-chains-": {
      load: "after"
    },

    classMetadata: {
      properties: {
        loaded: {
          readOnly: true,
          dependsOn: ["loadStatus"]
        },
        loadStatus: {},
        loadError: {}
      }
    },


    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------

    constructor: function Loadable() {
      // Create a temporary Deferred that resolves when load is the first time called.
      var dfd = new Deferred();
      this.addResolvingPromise(dfd.promise);

      // When load is called, we call the subclasses load(), only the first time
      aspect.around(this, "load", function(originalLoad) {
        return function() {
          if (this.loadStatus === STATUS_NOT_LOADED) {
            this.loadStatus = STATUS_LOADING;
            originalLoad.apply(this);
            dfd.resolve();
            dfd = null;
          }
          return this;
        };
      });

      // Update the load 
      this.then(
        function(result) {
          this.loadStatus = STATUS_LOADED;
        }.bind(this),
        function(error) {
          this.loadStatus = STATUS_FAILED;
          this.loadError = error;
        }.bind(this)
      );
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  loaded
    //----------------------------------

    /**
     * Indicates whether the instance has loaded. When `true`,
     * the properties of the object can be accessed.
     * 
     * @type {boolean}
     * @default false
     * @readonly
     * @ignore - This property is documented differently for all the classes that
     *            mixin esri/core/Loadable                                                                        
     */
     loaded: null,  
      
    _loadedGetter: function() {
      return this.loadStatus === STATUS_LOADED;
    },
    
    //----------------------------------
    //  loadError
    //----------------------------------

    /**
     * The Error object returned if an error occurred while loading.
     *
     * @type {Error}
     * @default null
     * @readonly
     */
    loadError: null,
    
    //----------------------------------
    //  loadStatus
    //----------------------------------

    /**
     * Represents the status of a load operation when a class instance
     * attempts to load its resources from the server.
     *
     * Value | Description
     * ------|------------
     * not-loaded | The object's resources have not loaded.
     * loading | The object's resources are currently loading.
     * loaded | The object's resources have loaded without errors.
     * failed | The object's resources failed to load. See [loadError](#loadError) for more details.
     *
     * @type {string}
     * @default not-loaded
     * @readonly
     */
    loadStatus: STATUS_NOT_LOADED,


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Loads the resources referenced by this class and returns the class instance. This method automatically 
     * executes for a {@link module:esri/views/View} and all of the resources
     * it references in {@link module:esri/Map} if the view is constructed with 
     * a map instance.
     * 
     * This method must be called by the developer when accessing a resource that will not be
     * loaded in a {@link module:esri/views/View}.
     * 
     * @return {*} Returns the instance of the class that called this method.
     */
    load: function() {
      /* returns this */
    },

    /**
     * Cancels a [load()](#load) operation if it is already in progress.
     */
    cancelLoad: function() {
      if (this.isFulfilled()) {
        return this;
      }

      this.loadError = errors.Load.cancelled();

      this._promiseProps.cancel(this.loadError);

      return this;
    }

  });

  return Loadable;
  
});
