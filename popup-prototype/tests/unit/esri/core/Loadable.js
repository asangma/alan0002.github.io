define([
  "intern!object",
  "intern/chai!assert",
  "intern/order!sinon",

  "dojo/Deferred",

  "esri/core/Scheduler",
  "esri/core/Loadable",
  "esri/core/Promise",
  "esri/core/Accessor"
],
function(
  registerSuite, assert, sinon,
  
  Deferred,
  
  Scheduler, Loadable, Promise, Accessor
) {

  // Force Scheduler dispatcher for sync execution
  // in Promise: force dispatching of the promise tmp
  var dispatch = function() {
    Scheduler.instance._boundDispatch();
  };

  registerSuite({

    name: "esri/core/Loadable",

    "Loadable subclass API": function() {
      var Sub = Loadable.createSubclass();
      var obj = new Sub();

      assert.isDefined(obj.then);
      assert.isDefined(obj.always);
      assert.isDefined(obj.otherwise);
      assert.isDefined(obj.cancelLoad);
      assert.isDefined(obj.isCanceled);
    },

    "Resolve a Loadable instance": function() {
      var dfd = new Deferred();
      var Sub = Loadable.createSubclass({
        load: function() {
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

      assert.isFalse(obj.isFulfilled(), "a Loadable SHOULD NOT be marked as fulfilled until load() is called");
      assert.isFalse(obj.isResolved(), "a Loadable SHOULD NOT be marked as resolved until load() is called");
      assert.isFalse(obj.isRejected(), "a Loadable SHOULD NOT be marked as rejected until load() is called");
      assert.isFalse(suc.called, "callback SHOULD NOT be called until load() is called");
      assert.isFalse(err.called, "errback SHOULD NOT be called until load() is called");

      obj.load();
      // force dispatching of the promise tmp
      dispatch();

      assert.isTrue(obj.isFulfilled(), "resolving a Loadable SHOULD mark it as fulfilled");
      assert.isTrue(obj.isResolved(), "resolving a Loadable SHOULD mark it as resolved");
      assert.isFalse(obj.isRejected(), "resolving a Loadable SHOULD NOT mark it as rejected");
      assert.isTrue(suc.calledOnce, "resolving a Loadable SHOULD call the callbacks");
      assert.isFalse(err.called, "resolving a Loadable SHOULD NOT call the errbacks");
    },

    "Prevent cancellation a Loadable instance": function() {
      var dfd = new Deferred();
      var Sub = Loadable.createSubclass({
        load: function() {
          this.addResolvingPromise(dfd.promise);
        }
      });

      var obj = new Sub();
      var suc = sinon.spy();
      var err = sinon.spy();
      var prom = obj.load().then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      prom.cancel();

      assert.isFalse(obj.isRejected(), "cancelling a result promise SHOULD not reject the instance");
    },

    "Cancel a result Promise": function() {
      var dfd = new Deferred();

      var Sub = Loadable.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd.promise);
        }
      });

      var obj = new Sub();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.load().then(suc, err).cancel();

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

      var A = Loadable.createSubclass({
        constructor: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Loadable.createSubclass({
        load: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = A.createSubclass(B);

      var obj = new C();
      assert.equal(obj.loadStatus, "not-loaded", "instance's loadStatus SHOULD be 'not-loaded'");

      var suc = sinon.spy();
      var err = sinon.spy();
      obj.load().then(suc, err);

      // force dispatching of the promise tmp
      dispatch();

      assert.equal(obj.loadStatus, "loading", "instance's loadStatus SHOULD be 'loading'");

      dfd1.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");

      assert.equal(obj.loadStatus, "loading", "instance's loadStatus SHOULD be 'loading'");

      dfd2.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");
      
      assert.equal(obj.loadStatus, "loading", "instance's loadStatus SHOULD be 'loading'");
      
      dfd3.resolve();
      assert.isTrue(suc.calledOnce, "when all resolving promises are resolved, instance SHOULD be resolved");
      assert.isTrue(suc.calledWith(obj), "callback SHOULD be called with the instance as parameter");
      assert.isFalse(err.called, "when all resolving promises are resolved, instance SHOULD NOT be rejected");

      assert.isTrue(obj.isResolved(), "instance SHOULD be marked as resolved");
      assert.isTrue(obj.isFulfilled(), "instance SHOULD be marked as fulfilled");
      assert.isFalse(obj.isRejected(), "instance SHOULD NOT be marked as rejected");

      assert.equal(obj.loadStatus, "loaded", "instance's loadStatus SHOULD be 'loaded'");
    },

    "Inheritance - failing one mixin": function() {
      var dfd1 = new Deferred();
      var dfd2 = new Deferred();
      var dfd3 = new Deferred();

      var A = Loadable.createSubclass({
        load: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Loadable.createSubclass({
        load: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = A.createSubclass(B);

      var obj = new C();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.load().then(suc, err);

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

      assert.equal(obj.loadStatus, "failed", "instance's loadStatus SHOULD be 'failed'");
    },

    "Inheritance - Accessor": function() {
      var dfd1 = new Deferred();
      var dfd2 = new Deferred();
      var dfd3 = new Deferred();

      var A = Accessor.createSubclass(Loadable, {
        load: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Accessor.createSubclass(Loadable, {
        load: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = B.createSubclass(A);

      var obj = new C();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.then(suc, err);
      obj.load();

      // force dispatching of the promise tmp
      dispatch();

      assert.equal(obj.loadStatus, "loading", "instance's loadStatus SHOULD be 'loading'");

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

      assert.equal(obj.loadStatus, "failed", "instance's loadStatus SHOULD be 'failed'");
    },

    "cancelLoad": function() {
      var canceler1 = sinon.spy();
      var canceler2 = sinon.spy();
      var canceler3 = sinon.spy();

      var dfd1 = new Deferred(canceler1);
      var dfd2 = new Deferred(canceler2);
      var dfd3 = new Deferred(canceler2);

      var A = Accessor.createSubclass(Loadable, {
        load: function() {
          this.addResolvingPromise(dfd1.promise);
        }
      });

      var B = Accessor.createSubclass(Loadable, {
        load: function() {
          this.addResolvingPromise(dfd2.promise);
          this.addResolvingPromise(dfd3.promise);
        }
      });

      var C = B.createSubclass(A);

      var obj = new C();
      var suc = sinon.spy();
      var err = sinon.spy();
      obj.then(suc, err);
      obj.load();

      // force dispatching of the promise tmp
      dispatch();

      dfd1.resolve();
      assert.isFalse(suc.called, "all resolving promises MUST be resolved to fulfill the instance");
      assert.isFalse(err.called, "all resolving promises MUST be resolved to fulfill the instance");

      assert.equal(obj.loadStatus, "loading", "instance's loadStatus SHOULD be 'loading'");

      obj.cancelLoad();
      assert.isTrue(obj.isCanceled(), "cancelLoad() SHOULD mark the instance as cancelled");
      assert.isTrue(obj.isRejected(), "cancelLoad() SHOULD mark the instance as rejected");
      assert.isTrue(obj.isFulfilled(), "cancelLoad() SHOULD mark the instance as fulfilled");
      assert.isFalse(obj.isResolved(), "cancelLoad() SHOULD NOT mark the instance as resolved");
      assert.equal(obj.loadStatus, "failed", "instance's loadStatus SHOULD be 'failed'");
      assert.equal(obj.loadError.code, 0, "instance's loadError SHOULD have a code 0");

      assert.isFalse(suc.called, "callback SHOULD NOT be called on cancellation");
      assert.isTrue(err.calledOnce, "errback SHOULD be called on cancellation");
      
      dfd3.resolve();
      assert.isTrue(err.calledOnce, "errback SHOULD NOT be called multiple times");
    }

  });

});

