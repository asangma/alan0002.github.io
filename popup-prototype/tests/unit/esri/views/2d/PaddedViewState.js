define([
  "intern!object", 
  "intern/chai!assert",

  "esri/geometry/Point",
  "esri/geometry/SpatialReference",

  "esri/Viewpoint",

  "esri/views/2d/viewpointUtils",
  "esri/views/2d/PaddedViewState"
], function(
  registerSuite, assert, 
  Point, SpatialReference,
  Viewpoint,
  utils, PaddedViewState
) {

  var createViewpointForResolution = function(x, y, res, rotation) {
    return new Viewpoint({
      targetGeometry: new Point(x, y, SpatialReference.WebMercator),
      scale: utils.getResolutionToScaleFactor(SpatialReference.WebMercator) * res,
      rotation: rotation
    });
  };

  registerSuite({
    name: "esri/views/2d/PaddedViewState",

    "clipRect - world exactly the size of the view": function() {
      // create a state with a size in pixel equals exactly the size of the world
      var wmInfo = SpatialReference.WebMercator._getInfo();
      var world = wmInfo.valid[1] - wmInfo.valid[0];
      var viewWidth = world;

      var state = new PaddedViewState({
        size: [viewWidth, 1],
        viewpoint: createViewpointForResolution(0, 0, 1, 0)
      });

      assert.isNull(state.clipRect, "clipRect should be null when the size of the world in pixel is bigger or equals the size of the view");
    },

    "clipRect - world smaller than the view": function() {
      // create a state with a size 1px bigger than the world.
      // the clip rect should be 1px smaller
      var wmInfo = SpatialReference.WebMercator._getInfo();
      var world = wmInfo.valid[1] - wmInfo.valid[0];
      var viewWidth = world + 1;

      var state = new PaddedViewState({
        size: [viewWidth, 1],
        viewpoint: createViewpointForResolution(0, 0, 1, 0)
      });

      assert.isDefined(state.clipRect, "clipRect should be defined when the size of the world in pixel is smaller than the size of the view");
      assert.equal(state.clipRect.right - state.clipRect.left, Math.round(world), "clipRect's width should be the size of 1 world");
    },

    "clipRect - with padding": function() {
      // create a state with a size 1px bigger than the world.
      // the clip rect should be 1px smaller
      var wmInfo = SpatialReference.WebMercator._getInfo();
      var world = wmInfo.valid[1] - wmInfo.valid[0];
      var viewWidth = world + 1;

      var state = new PaddedViewState({
        size: [viewWidth, 1],
        viewpoint: createViewpointForResolution(0, 0, 1, 0),
        padding: {
          left: 10,
          right: 5
        }
      });

      var offsetLeft = Math.round((10 - 5) / 2);
      var offsetRight = Math.round(world + offsetLeft);
      
      assert.equal(state.clipRect.left, offsetLeft, "clipRect's width should be the size of 1 world");
      assert.equal(state.clipRect.right, offsetRight, "clipRect's width should be the size of 1 world");
    }
  });

});