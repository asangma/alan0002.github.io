define([
  "intern!object",
  "intern/chai!assert",
  "intern/order!sinon",

  "dojo/Deferred",

  "esri/core/Scheduler",
  "esri/core/Promise",
  "esri/core/Accessor"
],
function(
  registerSuite, assert, sinon,
  
  Deferred,
  
  Scheduler, Promise, Accessor
) {

  // Force Scheduler dispatcher for sync execution
  // in Promise: force dispatching of the promise tmp
  var dispatch = function() {
    Scheduler.instance._boundDispatch();
  };

  registerSuite({

    name: "esri/core/Promise",

    "Promise subclass API": function() {
      var Sub = Promise.createSubclass();
      var obj = new Sub();

      assert.isDefined(obj.then);
      assert.isDefined(obj.always);
      assert.isDefined(obj.otherwise);
      assert.isUndefined(obj.cancel);
      assert.isUndefined(obj.isCanceled);
    },

    "Resolve a Promise instance": function() {
      var dfd = new Deferred();
      var Sub = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd.promise);
        }
      });

      var obj = new Sub();
      var suc = sinon.spy();
      var err = sinon.spy();
      var prom = obj.then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      dfd.resolve();

      assert.isTrue(obj.isFulfilled(), "resolving a Promise SHOULD mark it as fulfilled");
      assert.isTrue(obj.isResolved(), "resolving a Promise SHOULD mark it as resolved");
      assert.isFalse(obj.isRejected(), "resolving a Promise SHOULD NOT mark it as rejected");
      assert.isTrue(suc.calledOnce, "resolving a Promise SHOULD call the callbacks");
      assert.isFalse(err.called, "resolving a Promise SHOULD NOT call the errbacks");
    },

    "Prevent cancellation a Promise instance": function() {
      var dfd = new Deferred();
      var Sub = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd.promise);
        }
      });

      var obj = new Sub();
      var suc = sinon.spy();
      var err = sinon.spy();
      var prom = obj.then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      prom.cancel();

      assert.isFalse(obj.isRejected(), "cancelling a result promise SHOULD not reject the instance");
    },

    "Cancel a result Promise": function() {
      var dfd = new Deferred();

      var Sub = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd.promise);
        }
      });

      var obj = new Sub();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.then(suc, err).cancel();

      // force dispatching of the promise tmp
      dispatch();

      assert.isFalse(suc.called, "cancelling a result promise SHOULD NOT call the callback");
      assert.isTrue(err.calledOnce, "cancelling a result promise SHOULD call the errback");
      var error = err.firstCall.args[0];
      assert.isDefined(error.target, "the error SHOULD have a target property");
      assert.equal(error.target, obj, "the target SHOULD be the instance");
    },

    "Inheritance - resolving all mixins": function() {
      var dfd1 = new Deferred();
      var dfd2 = new Deferred();
      var dfd3 = new Deferred();

      var A = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = A.createSubclass(B);

      var obj = new C();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      dfd1.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");

      dfd2.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");
      
      dfd3.resolve();
      assert.isTrue(suc.calledOnce, "when all resolving promises are resolved, instance SHOULD be resolved");
      assert.isTrue(suc.calledWith(obj), "callback SHOULD be called with the instance as parameter");
      assert.isFalse(err.called, "when all resolving promises are resolved, instance SHOULD NOT be rejected");

      assert.isTrue(obj.isResolved(), "instance SHOULD be marked as resolved");
      assert.isTrue(obj.isFulfilled(), "instance SHOULD be marked as fulfilled");
      assert.isFalse(obj.isRejected(), "instance SHOULD NOT be marked as rejected");
    },

    "Inheritance - failing one mixin": function() {
      var dfd1 = new Deferred();
      var dfd2 = new Deferred();
      var dfd3 = new Deferred();

      var A = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Promise.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = A.createSubclass(B);

      var obj = new C();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      dfd1.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");

      dfd2.reject(new Error('failure'));
      assert.isFalse(suc.called, "callback SHOULD NOT be called on rejection");
      assert.isTrue(err.calledOnce, "all resolving promises must be resolved to resolve the instance");
      
      dfd3.resolve();
      assert.isFalse(suc.called, "instance SHOULD NOT be resolved on error");
      assert.isTrue(err.calledOnce, "errback SHOULD NOT be called multiple times");

      var error = err.firstCall.args[0];
      assert.isDefined(error.target, "the error SHOULD have a target property");
      assert.equal(error.target, obj, "the target SHOULD be the instance");
      
      assert.isFalse(obj.isResolved(), "instance SHOULD NOT be marked as resolved");
      assert.isTrue(obj.isFulfilled(), "instance SHOULD be marked as fulfilled");
      assert.isTrue(obj.isRejected(), "instance SHOULD be marked as rejected");
    },

    "Inheritance - Accessor": function() {
      var dfd1 = new Deferred();
      var dfd2 = new Deferred();
      var dfd3 = new Deferred();

      var A = Accessor.createSubclass(Promise, {
        initialize: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Accessor.createSubclass(Promise, {
        initialize: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = B.createSubclass(A);

      var obj = new C();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      dfd1.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");

      dfd2.reject(new Error('failure'));
      assert.isFalse(suc.called, "callback SHOULD NOT be called on rejection");
      assert.isTrue(err.calledOnce, "all resolving promises must be resolved to resolve the instance");
      
      dfd3.resolve();
      assert.isFalse(suc.called, "instance SHOULD NOT be resolved on error");
      assert.isTrue(err.calledOnce, "errback SHOULD NOT be called multiple times");

      var error = err.firstCall.args[0];
      assert.isDefined(error.target, "the error SHOULD have a target property");
      assert.equal(error.target, obj, "the target SHOULD be the instance");
    }

  });

});

