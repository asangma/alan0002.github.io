define([
  "dojo/Deferred",

  "esri/core/promiseList",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  Deferred,
  promiseList,
  registerSuite,
  assert,
  sinon
) {

  function createDeferred(resolutionType, resolutionValue) {
    var deferred = new Deferred();

    if (typeof resolutionType === "string") {
      deferred[resolutionType](resolutionValue);
    }

    return deferred;
  }

  registerSuite({

    name: "esri/core/promiseList",

    "creation": {

      "using Array": function() {
        var deferred1     = createDeferred("resolve", 1),
            deferred2     = createDeferred("resolve", "foo"),
            resolutionSpy = sinon.spy(function(results) {
              assert.equal(results[0], 1);
              assert.equal(results[1], "foo");
            });

        promiseList([deferred1, deferred2]).then(resolutionSpy);

        assert(resolutionSpy.calledOnce);
      },

      "from Object": function() {
        var deferred1     = createDeferred("resolve", 1),
            deferred2     = createDeferred("resolve", "foo"),
            resolutionSpy = sinon.spy(function(results) {
              assert.equal(results.number, 1);
              assert.equal(results.string, "foo");
            });

        promiseList({
          number: deferred1,
          string: deferred2
        })
          .then(resolutionSpy);

        assert(resolutionSpy.calledOnce);
      }

    },

    "always resolves": {

      "all resolved": function() {
        var deferred1     = createDeferred("resolve"),
            deferred2     = createDeferred("resolve"),
            deferred3     = createDeferred("resolve"),
            resolutionSpy = sinon.spy();

        promiseList([deferred1, deferred2, deferred3]).then(resolutionSpy);

        assert.isTrue(resolutionSpy.calledOnce);
      },

      "all rejected": function() {
        var deferred1     = createDeferred("reject"),
            deferred2     = createDeferred("reject"),
            deferred3     = createDeferred("reject"),
            resolutionSpy = sinon.spy();

        promiseList([deferred1, deferred2, deferred3]).then(resolutionSpy);

        assert.isTrue(resolutionSpy.calledOnce);
      },

      "mixed resolutions": function() {
        var deferred1     = createDeferred("resolve"),
            deferred2     = createDeferred("reject"),
            deferred3     = createDeferred("resolve"),
            resolutionSpy = sinon.spy();

        promiseList([deferred1, deferred2, deferred3]).then(resolutionSpy);

        assert.isTrue(resolutionSpy.calledOnce);
      },

      "immediately after all are resolved": function() {
        var deferred1     = createDeferred(),
            deferred2     = createDeferred(),
            deferred3     = createDeferred(),
            resolutionSpy = sinon.spy();

        promiseList([deferred1, deferred2, deferred3]).then(resolutionSpy);

        assert.isFalse(resolutionSpy.calledOnce);

        deferred1.resolve();
        assert.isFalse(resolutionSpy.calledOnce);

        deferred2.reject();
        assert.isFalse(resolutionSpy.calledOnce);

        deferred3.resolve();
        assert.isTrue(resolutionSpy.calledOnce);
      }

    }

  });

});

