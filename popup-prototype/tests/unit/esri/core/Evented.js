define([
  "esri/core/Evented",

  "intern!object",
  "intern/chai!assert"
],
function(
  Evented,
  registerSuite, assert
) {

  var evented;

  registerSuite({

    name: "esri/core/Evented",

    beforeEach: function() {
      evented = new Evented();
    },

    "hasEventListener()": function() {
      evented.on("some-event");

      assert.isTrue(evented.hasEventListener("some-event"), "should be true for registered listener");
      assert.isFalse(evented.hasEventListener("some-other-event"), "should be false for extraneous listener");

    },

    "emit()": {

      "event object is guaranteed": function() {
        var done = this.async(0);  // fails the test if handler is not triggered

        evented.on("assert", function(e) {
          assert.isObject(e);
          assert.isNotNull(e);
          done.resolve();
        });

        evented.emit("assert");
      },

      "event object properties are propagated": function() {
        var done = this.async(0);  // fails the test if handler is not triggered

        var expectedEventObject = {
          name: "bob",
          age: 44,
          target: evented
        };

        evented.on("assert", function(e) {
          assert.deepEqual(e, expectedEventObject);
          done.resolve();
        });

        evented.emit("assert", {
          name: "bob",
          age: 44
        });
      },

      "event object's target is the emitting instance": function() {
        var done = this.async(0);  // fails the test if handler is not triggered

        evented.on("assert", function(e) {
          assert.equal(e.target, evented);
          done.resolve();
        });

        evented.emit("assert");
      },

      "does not emit if it has no listeners": function() {
        var eventObject = {};

        evented.emit("assert", eventObject, "should return before setting the event's target");

        assert.isUndefined(eventObject.target);

        evented.on("assert", function() { });
        evented.emit("assert", eventObject);

        assert.equal(eventObject.target, evented, "should set the event's target");
      }
    }
  });
});
