define([
  "dojo/dom-class",
  "dojo/keys",
  "dojo/on",

  "esri/widgets/Zoom",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  domClass, keys, on,
  Zoom,
  registerSuite,
  assert,
  sinon
) {

  var zoom;

  function createFakeView() {
    return {
      map: {},
      get: sinon.stub(),
      scale: 1,
      ready: true,
      animateTo: sinon.spy(),
      watch: function() {
        return {
          remove: function() {}
        };
      }
    };
  }

  /**
   * @see https://github.com/dojo/dijit/blob/master/a11yclick.js (keyup & keydown handlers)
   * @private
   */
  function simulateA11yclickKeyPress(zoom, node, key) {
    zoom.placeAt(document.body);  // placed on document for bubbling to work

    // a11yclick expects a keydown & keyup (on the document) before emitting a synthetic click event
    // we also rely on bubbling since emit does not allow us to override the target

    on.emit(node, "keydown", {
      bubbles: true,
      keyCode: key
    });

    on.emit(node, "keyup", {
      bubbles: true,
      keyCode: key
    });
  }

  registerSuite({

    name: "esri/widgets/Zoom",

    beforeEach: function() {
      zoom = new Zoom();
      zoom.startup();
    },

    afterEach: function() {
      zoom.destroy();
    },

    "zooming": {

      "in": function() {
        var fakeView = createFakeView();

        zoom.set("view", fakeView);

        zoom._zoomIn();

        assert.isTrue(fakeView.animateTo.calledOnce);
        assert.isTrue(fakeView.animateTo.calledWith({
          scale: 0.5
        }));
      },

      "out": function() {
        var fakeView = createFakeView();

        zoom.set("view", fakeView);

        zoom._zoomOut();

        assert.isTrue(fakeView.animateTo.calledOnce);
        assert.isTrue(fakeView.animateTo.calledWith({
          scale: 2
        }));
      }

    },

    "keyboard navigation": {

      "in": function() {
        var fakeView = createFakeView();

        zoom.set("view", fakeView);

        var zoomInSpy = sinon.spy(zoom, "_zoomIn");

        simulateA11yclickKeyPress(zoom, zoom.dap_zoomIn, keys.ENTER);
        simulateA11yclickKeyPress(zoom, zoom.dap_zoomIn, keys.SPACE);

        assert.isTrue(zoomInSpy.calledTwice);
      },

      "out": function() {
        var fakeView = createFakeView();

        zoom.set("view", fakeView);

        var zoomOutSpy = sinon.spy(zoom, "_zoomOut");

        simulateA11yclickKeyPress(zoom, zoom.dap_zoomOut, keys.ENTER);
        simulateA11yclickKeyPress(zoom, zoom.dap_zoomOut, keys.SPACE);

        assert.isTrue(zoomOutSpy.calledTwice);
      }

    },

    "disabled when view is not ready": function() {
      var fakeView = createFakeView();

      fakeView.get.withArgs("ready").returns(false);
      zoom.set("view", fakeView);

      assert.isTrue(domClass.contains(zoom.domNode, "esri-disabled"));

      fakeView.get.withArgs("ready").returns(true);
      zoom.set("view", fakeView);

      assert.isFalse(domClass.contains(zoom.domNode, "esri-disabled"));
    }

  });

});
