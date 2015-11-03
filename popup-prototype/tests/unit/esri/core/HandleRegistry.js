define([
  "esri/core/HandleRegistry",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  HandleRegistry,
  registerSuite,
  assert,
  sinon
) {

  var handleRegistry;

  function createFakeHandle(sinonRemoveType) {
    return {
      remove: sinon[sinonRemoveType || "stub"]()
    };
  }

  registerSuite({

    name: "esri/core/HandleRegistry",

    beforeEach: function () {
      handleRegistry = new HandleRegistry();
    },

    "adding handles": {

      "basic": function() {
        handleRegistry.add(createFakeHandle());
        handleRegistry.add([createFakeHandle(), createFakeHandle()]);

        assert.equal(handleRegistry.size, 3);
      },

      "by group name": function() {
        var handle1 = createFakeHandle("spy");
        var handle2 = createFakeHandle("spy");
        var handle3 = createFakeHandle("spy");
        var handle4 = createFakeHandle("spy");

        handleRegistry.add(handle1, "group-1");
        handleRegistry.add(handle2, "group-1");

        assert.equal(handleRegistry.size, 2);

        handleRegistry.add([handle3, handle4], "group-2");

        assert.equal(handleRegistry.size, 4);
      },

      "ignoring empty": function() {
        assert.doesNotThrow(function() {
          handleRegistry.add([]);
        });

        assert.doesNotThrow(function() {
          handleRegistry.add([], "empty");
        });

        assert.equal(handleRegistry.size, 0);
      }

    },

    "removing handles": {

      "basic": function() {
        var handle1 = createFakeHandle("spy");
        var handle2 = createFakeHandle("spy");

        handleRegistry.add([handle1, handle2]);

        handleRegistry.remove();

        assert.equal(handleRegistry.size, 0);
        assert.isTrue(handle1.remove.calledOnce);
        assert.isTrue(handle2.remove.calledOnce);
      },

      "when empty": function() {
        handleRegistry.remove();

        assert.equal(handleRegistry.size, 0);
      },

      "by group name": function() {
        var handle1 = createFakeHandle("spy");
        var handle2 = createFakeHandle("spy");
        var handle3 = createFakeHandle("spy");

        handleRegistry.add(handle1, "group-1");
        handleRegistry.add(handle2, "group-1");
        handleRegistry.add([handle3], "group-2");

        handleRegistry.remove("group-1");

        assert.equal(handleRegistry.size, 1);

        handleRegistry.remove("group-2");

        assert.equal(handleRegistry.size, 0);
      },

      "by non-existent group name": function() {
        var handle1 = createFakeHandle("spy");
        var handle2 = createFakeHandle("spy");
        var handle3 = createFakeHandle("spy");

        handleRegistry.add([handle1, handle2, handle3], "group-1");

        handleRegistry.remove("group-wat");

        assert.equal(handleRegistry.size, 3);
      },

      "all": function() {
        var handle1 = createFakeHandle("spy");
        var handle2 = createFakeHandle("spy");

        handleRegistry.add(handle1);
        handleRegistry.add(handle2, "grouped");

        handleRegistry.removeAll();

        assert.isTrue(handle1.remove.calledOnce);
        assert.isTrue(handle2.remove.calledOnce);
        assert.equal(handleRegistry.size, 0);
        assert.lengthOf(Object.keys(handleRegistry._groups), 0);
      }

    },

    "destruction": {

      "basic": function() {
        handleRegistry.destroy();

        assert.isNull(handleRegistry._groups);
      },

      "all handles are removed": function() {
        var handle1 = createFakeHandle("spy");
        var handle2 = createFakeHandle("spy");

        handleRegistry.add(handle1);
        handleRegistry.add(handle2, "grouped");

        handleRegistry.destroy();

        assert.isTrue(handle1.remove.calledOnce);
        assert.isTrue(handle2.remove.calledOnce);
      }

    }

  });

});

