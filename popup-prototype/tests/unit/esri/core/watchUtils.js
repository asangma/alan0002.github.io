define([
  "intern!object",
  "intern/chai!assert",
  "sinon/sinon",
  "esri/core/declare",
  "esri/core/Accessor",
  "esri/core/watchUtils"
], function(registerSuite, assert, sinon, declare, Accessor, watchUtils) {

  var o;

  var Clazz = declare([Accessor], {
    _propSetter: function(value) {
      this._prop = value;
    },
    _propGetter: function() {
      return this._prop;
    }
  });

  var setProp = function(o, value) {
    o.prop = value;
    o._accessorProps.dispatch();
  }

  registerSuite({
    name: "esri/core/watchUtils",

    beforeEach: function() {
      o = new Clazz({
        prop: false
      });
    },

    "init": function() {
      var f;

      watchUtils.init(o, "prop", f = sinon.spy(function(value) {
        assert.notOk(value);
      }));

      sinon.assert.called(f);
    },

    "watch": function() {
      var f;

      watchUtils.watch(o, "prop", f = sinon.spy(function(value) {
        assert.ok(value);
      }));

      setProp(o, true);

      sinon.assert.called(f);
    },

    "once": function() {
      var f;

      watchUtils.once(o, "prop", f = sinon.spy(function(value) {
        assert.ok(value);
      }));

      setProp(o, true);
      setProp(o, false);

      sinon.assert.calledOnce(f);
    },

    "once remove": function() {
      var f;

      var handle = watchUtils.once(o, "prop", f = sinon.spy(function(value) {
        assert.ok(value);
      }));

      handle.remove();

      setProp(o, true);

      sinon.assert.notCalled(f);
    },

    "when": function() {
      var f;

      watchUtils.when(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);

      sinon.assert.called(f);
    },

    "when init": function() {
      var f;

      setProp(o, true);

      watchUtils.when(o, "prop", f = sinon.spy(function(value) {
      }));

      sinon.assert.called(f);
    },

    "when again": function() {
      var f;

      setProp(o, true);

      watchUtils.when(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, false);
      setProp(o, true);

      sinon.assert.calledTwice(f);
    },

    "when truthy": function() {
      var f;

      watchUtils.when(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, {});

      sinon.assert.called(f);
    },

    "when remove": function() {
      var f;

      var handle = watchUtils.when(o, "prop", f = sinon.spy(function(value) {
      }));

      handle.remove();

      setProp(o, true);

      sinon.assert.notCalled(f);
    },

    "when true": function() {
      var f;

      watchUtils.whenTrue(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);

      sinon.assert.called(f);
    },

    "when true not called for truthy": function() {
      var f;

      watchUtils.whenTrue(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, {});
      sinon.assert.notCalled(f);
    },

    "when true once": function() {
      var f;

      watchUtils.whenTrueOnce(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);
      setProp(o, false);
      setProp(o, true);

      sinon.assert.calledOnce(f);
    },

    "when false": function() {
      var f;

      watchUtils.whenFalse(o, "prop", f = sinon.spy(function(value) {
      }));

      sinon.assert.called(f);
    },

    "when false not called for falsey": function() {
      var f;

      setProp(o, null);

      watchUtils.whenFalse(o, "prop", f = sinon.spy(function(value) {
      }));

      sinon.assert.notCalled(f);
    },

    "when false once": function() {
      var f;

      watchUtils.whenFalseOnce(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);
      setProp(o, false);

      sinon.assert.calledOnce(f);
    },

    "when defined": function() {
      var f;

      watchUtils.whenDefined(o, "prop", f = sinon.spy(function(value) {
      }));

      sinon.assert.called(f);
    },

    "when defined not called for undefined": function() {
      var f;

      watchUtils.whenDefined(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, undefined);
      sinon.assert.calledOnce(f);
    },

    "when defined once": function() {
      var f;

      watchUtils.whenDefinedOnce(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, undefined);
      setProp(o, true);

      sinon.assert.calledOnce(f);
    },

    "when undefined": function() {
      var f;

      watchUtils.whenUndefined(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, undefined);

      sinon.assert.called(f);
    },

    "when undefined not called for defined": function() {
      var f;

      watchUtils.whenUndefined(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);
      sinon.assert.notCalled(f);
    },

    "when undefined once": function() {
      var f;

      setProp(o, undefined);

      watchUtils.whenUndefinedOnce(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);
      setProp(o, undefined);

      sinon.assert.calledOnce(f);
    },

    "pausable": function() {
      var f;

      var handle = watchUtils.pausable(o, "prop", f = sinon.spy(function(value) {
      }));

      setProp(o, true);

      sinon.assert.calledOnce(f);
    },

    "pausable pause": function() {
      var f;

      var handle = watchUtils.pausable(o, "prop", f = sinon.spy(function(value) {
      }));

      handle.pause();

      setProp(o, true);

      sinon.assert.notCalled(f);
    },

    "pausable resume": function() {
      var f;

      var handle = watchUtils.pausable(o, "prop", f = sinon.spy(function(value) {
      }));

      handle.pause();

      setProp(o, true);

      handle.resume();

      setProp(o, false);

      sinon.assert.calledOnce(f);
    }
  });
});