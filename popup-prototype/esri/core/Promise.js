/**
 * Promise mixin.
 *
 * @module esri/core/Promise
 * @mixin
 * @since 4.0
 */
define([
  "./declare",
  
  "dojo/promise/all",
  
  "dojo/aspect",
  "dojo/Deferred",

  "dojo/errors/create",

  "./Scheduler"
], 
function(
  declare,
  all,
  aspect, Deferred,
  create,
  Scheduler
) {

  var tryResolve = function(instance) {
    if (instance.isFulfilled()) {
      return;
    }

    var props = instance._promiseProps;
    var resolvingPromises = props.resolvingPromises;
    var i, pr;

    // cancel the previous allPromise
    // this will call the errback below but will be ignored as it's a cancellation
    if (props.allPromise) {
      props.allPromise.cancel();
    }

    // Create a temporary Deferred that will be resolved at the next tick
    var tmp = new Deferred();

    // - remove any cancelled resolving promises
    // - install a progress handler on the resolving
    for (i = resolvingPromises.length - 1; i >= 0; i--) {
      pr = resolvingPromises[i];
      if (pr.isCanceled && pr.isCanceled()) {
        resolvingPromises.splice(i, 1);
      }
      else {
        pr.then(null, null, props.resolver.progress);
      }
    }
    pr = null;

    var allPromise = props.allPromise = all(resolvingPromises.concat([tmp.promise]));

    allPromise.then(

      // Success
      // resolve the instance
      function() {
        props.resolver.resolve(instance);
        // clean up
        instance = props = tmp = props.allPromise = props.resolvingPromises = null;
      },

      // Failure
      // ignore cancellation of resolving promises
      // reject the instance on strict rejection
      function(error) {

        props.allPromise = null;

        // treat cancelation of one of the resolving promise
        if (!error || error.dojoType !== "cancel") {
          var errors = Array.prototype.slice.call(arguments, 0);

          props.resolver.reject({
            target: instance,
            error:  errors && errors[0],
            errors: errors
          });
          // clean up
          instance = props = tmp = props.allPromise = props.resolvingPromises = null;
        }
      }
    );

    // resolve async the temp promise
    if (tmp) {
      Scheduler.schedule(function() {
        if (tmp) {
          tmp.resolve();
        }
      });
    }
  };

  /**
   * Generic error.
   * Holds the Promise instance as a `target` property
   */
  var CancelError = create("CancelError", null, function(target){ this.target = target; });

  /**
   * Generic canceling function.
   * Creates a CancelError the Promise instance as a `target` property
   */
  var canceler = function() {
    return new CancelError(this.instance);
  };

  var PromiseProps = function PromiseProps(instance) {
    this.instance = instance;
    this.canceler = canceler.bind(this);
    this.resolver = new Deferred(/* the cancelling is done in Loadable */);
    this.initialized = false;
    this.resolvingPromises = [];
  };
  PromiseProps.prototype = {
    canceler: null,
    cancel: function(reason) {
      if (this.resolver.isFulfilled()) {
        return;
      }

      // not interested about the cancellation
      this.allPromise.cancel();
      
      // cancel each individual resolving promise
      for(var resolving = this.resolvingPromises.concat(), i = resolving.length - 1; i >= 0; i--) {
        resolving[i].cancel(reason);
      }

      // not anymore interested in the resolving promises fulfillment
      this.resolver.cancel(reason);
    }
  };
  
  var Promise = declare(null, 
  /** @lends module:esri/core/Promise */
  {

    declaredClass: "esri.core.Promise",

    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------

    constructor: function Promise() {
      this._promiseProps = new PromiseProps(this);

      var handle = aspect.after(this, "postscript", function(method, args){
        handle.remove();
        handle = null;
        tryResolve(this);
      }, true);
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * An instance of this class is a [Promise](../guide/working-with-promises/). Therefore `always()` may be used to
     * execute a function if the promise is rejected or resolved. The input function will always execute
     * no matter the response. For more information about promises, see the [Working with Promises](../guide/working-with-promises/) guide page.
     * 
     * @param {function} callbackOrErrback - The function to execute when the promise is rejected or resolved.
     *                                     
     * @example
     * //Although this example uses esri/Map, any class instance that is a promise may use always() in the same way
     * var map = new Map();
     * map.always(function(){
     *   //this function will always execute whether or not the promise is resolved or rejected
     * });
     * 
     * @return {Promise} Returns a new promise for the result of `callbackOrErrback`.
     */
    always: function(callbackOrErrback) {
      return this.then(callbackOrErrback, callbackOrErrback);
    },
      
    /**
    * An instance of this class is a [Promise](../guide/working-with-promises/); therefore
    * `then()` may be leveraged once an instance of the class is created. 
    * This method takes two input parameters: a `callback` function and an `errback` function. 
    * The `callback` executes when the promise resolves (when the instance of the class loads). The 
    * `errback` executes if the promise fails.
    * See the [Working with Promises](../guide/working-with-promises/) guide page for
    * additional details.
    * 
    * @method then
    * @memberof module:esri/core/Promise
    * 
    * @param {Function} callback - The function to call when the promise resolves. 
    * @param {Function} errback - The function to execute when the promise fails.
    * @return {Promise} Returns a new promise for the result of `callback` that may be used to 
    *                   [chain](../guide/working-with-promises/#chaining) additional functions.
    *                   
    * @example
    * //Although this example uses esri/Map, any class instance that is a promise may use then() in the same way
    * var map = new Map();
    * map.then(function(){
    *   //this function will execute once the promise is resolved
    * }, function(){
    *   //this function will execute if the promise is rejected
    * });                   
    */
    then: function(callback, errback, progback) {
      var dfd = new Deferred(this._promiseProps.canceler);
      var promise = dfd.then(callback, errback, progback);
      this._promiseProps.resolver.then(dfd.resolve, dfd.reject, dfd.progress);
      return promise;
    },

    /**
     * An instance of this class is a [Promise](../guide/working-with-promises/). Therefore `isResolved()` 
     * may be used to verify if the promise is resolved. If it is resolved, `true` will be returned. 
     * See the [Working with Promises](../guide/working-with-promises/) guide page for more information about promises.
     * 
     * @example
     * //Although this example uses esri/Map, any class instance that is a promise may use isResolved() in the same way
     * var map = new Map();
     * console.log(map.isResolved());  //Prints true if the promise is resolved
     * 
     * @return {boolean} Indicates whether the promise has been resolved.
     */
    isResolved: function(){
      return this._promiseProps.resolver.isResolved();
    },

    /**
     * An instance of this class is a [Promise](../guide/working-with-promises/). Therefore `isRejected()` 
     * may be used to verify if the promise is rejected. If it is rejected, `true` will be returned. 
     * See the [Working with Promises](../guide/working-with-promises/) guide page for more information about promises.
     * 
     * @example
     * //Although this example uses esri/Map, any class instance that is a promise may use isRejected() in the same way
     * var map = new Map();
     * console.log(map.isRejected());  //Prints true if the promise is rejected
     * 
     * @return {boolean} Indicates whether the promise has been rejected.
     */
    isRejected: function() {
      return this._promiseProps.resolver.isRejected();
    },

    /**
     * An instance of this class is a [Promise](../guide/working-with-promises/). Therefore `isFulfilled()` 
     * may be used to verify if the promise is fulfilled (either resolved or rejected). If it is fulfilled, `true` will be returned. 
     * See the [Working with Promises](../guide/working-with-promises/) guide page for more information about promises.
     * 
     * @example
     * //Although this example uses esri/Map, any class instance that is a promise may use isFulfilled() in the same way
     * var map = new Map();
     * console.log(map.isFulfilled());  //Prints true if the promise is fulfilled
     * 
     * @return {boolean} Indicates whether the promise has been fulfilled (either resolved or rejected).
     */
    isFulfilled: function() {
      return this._promiseProps.resolver.isFulfilled();
    },

    /**
     * An instance of this class is a [Promise](../guide/working-with-promises/). Use `otherwise()` to 
     * call a function once the promise is rejected.
     * 
     * @param {function} errback - The function to execute when the promise fails.
     *                           
     * @example
     * //Although this example uses esri/Map, any class instance that is a promise may use always() in the same way
     * var map = new Map();
     * map.otherwise(function(){
     *   //If rejected, this function will execute once the promise is rejected
     * });
     * 
     * @return {Promise} Returns a new promise for the result of `errback`.
     */
    otherwise: function(errback) {
      return this.then(null, errback);
    },
    

    //--------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    //--------------------------------------------------------------------------

    /**
     * @todo doc
     * @private
     */
    addResolvingPromise: function(promise) {
      if (!promise || this.isFulfilled()) {
        return;
      }
      // Sub-classes can call this method to make sure they finish loading external
      // resources before layer "load" event is emitted.
      // This is how sub-classes can participate in layer "load" activity.
      this._promiseProps.resolvingPromises.push(promise);
      tryResolve(this);
    }

  });

  return Promise;
  
});
