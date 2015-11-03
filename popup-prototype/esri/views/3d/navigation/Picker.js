define([
  "../../../core/declare",
  "../lib/glMatrix",
  "../webgl-engine/lib/Selector"
], function(
  declare,
  glMatrix,
  Selector
) {
  var vec3d = glMatrix.vec3d;

  var tmpR0 = vec3d.create();
  var tmpR1 = vec3d.create();

  var Picker = declare([], {
    constructor: function(navigation, view) {
      this.navigation = navigation;

      this.pickAlongRay = view._pickRay.bind(view);
      this.createPickRay = view._pickRayWithBeginPoint.bind(view);

      this.selector = new Selector();
    },

    // Pick point in screen and return the resulting 3d point
    pickPointInScreen: function(point, outP) {
      return this.pickedIntersectionPoint(this.pickInScreen(point), outP);
    },

    // Pick a point in screen and return the resulting 3d point (ignoring any terrain or features)
    pickFreePointInScreen: function(point, outP) {
      this.createPickRay(point, undefined, this.navigation.currentCamera.viewMatrix, tmpR0, tmpR1);
      if (!outP) {
        outP = vec3d.create();
      }
      // try to pick a point of out thin air.
      // Heuristic: assume that "interesting" objects are located at half the
      // distance to the far plane, so set the .
      vec3d.subtract(tmpR1, tmpR0);
      vec3d.normalize(tmpR1);
      var distance = 0.5 * this.navigation.currentCamera.far;
      vec3d.scale(tmpR1, distance);
      vec3d.add(tmpR0, tmpR1, outP);
    },

    // Pick along ray from point into the screen and return the picking selector
    pickInScreen: function(point) {
      this.createPickRay(point, undefined, this.navigation.currentCamera.viewMatrix, tmpR0, tmpR1);
      return this.pickAlongRay(tmpR0, tmpR1, point, point, null, null, null, null, this.selector);
    },

    pickedIntersectionPoint: function(selector, outP) {
      if (!selector) {
        return false;
      }

      if (!outP) {
        outP = vec3d.create();
      }

      return selector.getMinResult().getIntersectionPoint(outP);
    }
  });

  return Picker;
});
