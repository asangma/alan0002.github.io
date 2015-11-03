define([
  "intern!object", 
  "intern/chai!assert",

  "esri/Viewpoint",
  "esri/geometry/Point",
  "esri/geometry/SpatialReference",
  "esri/views/2d/viewpointUtils"
], function(
  registerSuite, assert,
  Viewpoint,
  Point, SpatialReference,
  utils
) {

  var delta = 1e-10;

  var createViewpoint = function(x, y, scale, rotation) {
    return new Viewpoint({
      targetGeometry: new Point(x, y, SpatialReference.WebMercator),
      scale: scale,
      rotation: rotation
    });
  }

  var createViewpointForResolution = function(x, y, res, rotation) {
    return new Viewpoint({
      targetGeometry: new Point(x, y, SpatialReference.WebMercator),
      scale: utils.getResolutionToScaleFactor(SpatialReference.WebMercator) * res,
      rotation: rotation
    });
  }

  registerSuite({
    name: "esri/views/2d/viewpointUtils",

    "getTransformNoRotation()": function() {
      var viewpoint = createViewpointForResolution(-1, 0, 1, 45);
      var size = [2, 2];
      var result = [1, 0, 0, 1, 0, 0];
      
      utils.getTransformNoRotation(result, viewpoint, size);
      
      assert.equal(result[1], 0, "rotation shouldn't be applied to the unrotated matrix");
      assert.equal(result[2], 0, "rotation shouldn't be applied to the unrotated matrix");
    },

    "getAnchor() w/o padding": function() {
      var size = [1000, 1000];
      var anchor = [0, 0];
      var expected = [500, 500];
      
      utils.getAnchor(anchor, size);
      
      assert.deepEqual(anchor,expected, "anchor is not in the middle of the visible area when no padding");
    },
    
    "getAnchor() w/ padding": function() {
      var size = [1000, 1000];
      var anchor = [0, 0];
      var expected = [700, 400];
      var padding = {
        left: 500,
        right: 100,
        top: 100,
        bottom: 300
      };

      utils.getAnchor(anchor, size, padding);

      assert.deepEqual(anchor, expected, "anchor is not in the middle of the visible area");
    },

    "addPadding() preserves center": function() {
      var size = [1000, 1000];
      var padding = {
        left: 300,
        right: 200,
        top: 300,
        bottom: 200
      };
      var viewpoint = createViewpointForResolution(0, 0, 1, 0);
      var expected = createViewpointForResolution(-50, -50, 1, 0);

      utils.addPadding(viewpoint, viewpoint, size, padding, false);

      assert.closeTo(viewpoint.scale, expected.scale, delta);
      assert.closeTo(viewpoint.rotation, expected.rotation, delta);

      assert.closeTo(viewpoint.targetGeometry.x, expected.targetGeometry.x, delta);
      assert.closeTo(viewpoint.targetGeometry.y, expected.targetGeometry.y, delta);
      assert.deepEqual(viewpoint.targetGeometry.spatialReference, expected.targetGeometry.spatialReference);
    },

    "getPaddingScreenTranslation()": function() {
      var size = [1000, 1000];
      var padding = {
        left: 500,
        right: 100,
        top: 100,
        bottom: 300
      };
      var expected = [-200, 100];
      var translation = [0, 0];

      utils.getPaddingScreenTranslation(translation, size, padding);
      assert.deepEqual(translation, expected, "anchor is not in the middle of the visible area");
    },   

    "getPaddingMapTranslation()": function() {
      var size = [1000, 1000];
      var viewpoint = createViewpointForResolution(0, 0, 4, 0);
      var padding = {
        left: 500,
        right: 100,
        top: 100,
        bottom: 300
      };
      var expected = [-800, 400];
      var result = [0, 0];

      utils.getPaddingMapTranslation(result, viewpoint, size, padding);

      assert.closeTo(result[0], expected[0], delta);
      assert.closeTo(result[1], expected[1], delta);
    },

    "toMap": function() {
      var size = [500, 500];
      var viewpoint = createViewpointForResolution(0, 0, 4, 0);
      var expected = [-1000, 1000];

      // toMap(out, a, viewpoint, size)
      var result = utils.toMap([0, 0], [0, 0], viewpoint, size);

      assert.closeTo(result[0], expected[0], delta);
      assert.closeTo(result[1], expected[1], delta);
    },

    "toScreen": function() {
      var size = [500, 500];
      var viewpoint = createViewpointForResolution(0, 0, 4, 0);
      var expected = [0, 0];

      var result = utils.toScreen([0, 0], [-1000, 1000], viewpoint, size);

      assert.closeTo(result[0], expected[0], delta);
      assert.closeTo(result[1], expected[1], delta);
    }

  });

});
