define([
  "dojo/dom-class",

  "esri/core/Accessor",
  "esri/widgets/Compass",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  domClass,
  Accessor, Compass,
  registerSuite,
  assert,
  sinon
) {

  var compass;

  function forceAccessorDispatch() {
    Array.prototype.slice.call(arguments).forEach(function(accessor) {
      accessor._accessorProps.dispatch();
    });
  }

  function createFakeView() {
    var watcherStub = sinon.stub().returns({
      remove: sinon.stub()
    });

    var cameraStub = {
      heading: 0,
      tilt: 0
    };

    return new Accessor({
      map: {
        watch: watcherStub,
        spatialReference: {
          isWebMercator: sinon.stub().returns(true)
        }
      },
      scale: 1,
      camera: cameraStub,
      animateTo: sinon.spy(),
      ready: true
    });
  }

  registerSuite({

    name: "esri/widgets/Compass",

    beforeEach: function() {
      compass = new Compass();
      compass.startup();
    },

    afterEach: function() {
      compass.destroy();
    },

    "style": {

      "compass if north supported": function() {
        var fakeView = createFakeView();

        fakeView.type = "2d";

        compass.set("view", fakeView);

        assert.isTrue(domClass.contains(compass.dap_indicator, compass.css.isWebMercator));

        fakeView.map.spatialReference.isWebMercator.returns(false);
        fakeView.map.spatialReference.wkid = 4326;

        compass.set("view", fakeView);

        assert.isTrue(domClass.contains(compass.dap_indicator, compass.css.isWebMercator));
      },

      "rotation indicator if non-web mercator": function() {
        var fakeView = createFakeView();

        fakeView.type = "2d";
        fakeView.map.spatialReference.isWebMercator.returns(false);

        compass.set("view", fakeView);

        assert.isFalse(domClass.contains(compass.dap_indicator, compass.css.isWebMercator));
      }

    },

    "2D": {

      "reflects initial rotation": function() {
        var applyRotationSpy = sinon.spy(compass, "_applyRotation");
        var fakeView = createFakeView();

        fakeView.type = "2d";
        fakeView.rotation = 90;

        compass.set("view", fakeView);

        assert.isTrue(applyRotationSpy.calledWith({
          z: 90
        }));
      },

      "resets rotation when clicked": function() {
        var fakeView = createFakeView();

        fakeView.type = "2d";

        compass.set("view", fakeView);

        compass._handleClick();

        assert.isTrue(fakeView.animateTo.calledOnce);
        assert.isTrue(fakeView.animateTo.calledWith({
          rotation: 0
        }));
      },

      "updates when the view's rotation changes": function() {
        var applyRotationSpy = sinon.spy(compass, "_applyRotation");
        var fakeView = createFakeView();

        fakeView.type = "2d";

        compass.set("view", fakeView);

        fakeView.rotation = 90;

        forceAccessorDispatch(fakeView);

        assert.isTrue(applyRotationSpy.calledWith({
          z: 90
        }));
      }

    },

    "3D": {

      "reflects initial rotation": function() {
        var applyRotationSpy = sinon.spy(compass, "_applyRotation");
        var fakeView = createFakeView();

        fakeView.type = "3d";
        fakeView.camera.heading = 90;

        compass.set("view", fakeView);

        assert.isTrue(applyRotationSpy.calledWith({
          y: 0,
          z: -90
        }));
      },

      "resets rotation and tilt when clicked": function() {
        var fakeView = createFakeView();

        fakeView.type = "3d";

        compass.set("view", fakeView);

        compass._handleClick();

        assert.isTrue(fakeView.animateTo.calledOnce);
        assert.isTrue(fakeView.animateTo.calledWith({
          heading: 0,
          tilt: 0
        }));
      },

      "updates when the view's rotation changes": function() {
        var applyRotationSpy = sinon.spy(compass, "_applyRotation");
        var fakeView = createFakeView();

        fakeView.type = "3d";

        compass.set("view", fakeView);

        fakeView.camera = {
          heading: 90
        };

        forceAccessorDispatch(fakeView);

        assert.isTrue(applyRotationSpy.calledWith({
          y: 0,
          z: -90
        }));
      }

    },

    "disabled when view is not ready": function() {
      var fakeView = createFakeView();

      fakeView.ready = false;
      compass.set("view", fakeView);

      assert.isTrue(domClass.contains(compass.domNode, "esri-disabled"));

      fakeView.ready = true;
      compass.set("view", fakeView);

      assert.isFalse(domClass.contains(compass.domNode, "esri-disabled"));
    }

  });

});
