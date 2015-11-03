define([
  "../../../../core/declare",
  "../../lib/glMatrix"
], function(
  declare,
  glMatrix
) {

  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;

  var tmpPoi = vec3d.create();

  var MOUSE_POS_ZOOM_IN = true;
  var MOUSE_POS_ZOOM_OUT = false;

  var ZOOM_STEP_MOUSE_SCALE = 1 / 120; // tweak mousewheel zooming here
  var ZOOM_STEP_SCALE = 0.4; // tweak general zoom factor here

  var ZoomMixin = declare([], {
    declaredClass: "esri.views.3d.navigation.mixins.ZoomMixin",
    type: "zoom",

    constructor: function() {
      this.normalizedAnchorPoint = vec2d.create();
    },

    begin: function(point) {
      this.navigation.begin(this);

      vec2d.set(point, this._dragBeginPoint);
      this.normalizeCoordinate(point, this.normalizedAnchorPoint);

      var xy = this._toYDownCoord(this._dragBeginPoint);

      this.active = true;
      this.emit("begin", xy[0], xy[1]);
    },

    update: function(point) {
      // N/I: Mode dependent
    },

    end: function(point) {
      this.active = false;

      var xy = this._toYDownCoord(this._dragBeginPoint);
      this.emit("end", xy[0], xy[1]);

      this.navigation.end(this);
    },

    stepScreen: function(delta, point) {
      if (this.active) {
        return;
      }

      vec3d.set(this.currentCamera.center, tmpPoi);

      if (MOUSE_POS_ZOOM_IN && delta > 0 || MOUSE_POS_ZOOM_OUT && delta < 0) {
        // Pick the terrain or feature under the mouse cursor.
        // If that fails, choose a free-standing point along the ray through the cursor.
        if (!this.pickPointInScreen(point, tmpPoi)) {
          this.pickFreePointInScreen(point, tmpPoi);
        }
      }

      this.step(delta * ZOOM_STEP_MOUSE_SCALE, tmpPoi, point);
    },

    step: function(delta, poi, point) {
      if (this.active) {
        return;
      }

      this.navigation.begin(this);
      this.targetCamera.copyFrom(this.currentCamera);

      var poiChanged = vec3d.dist(poi, this.targetCamera.center) > 1e-6;
      delta *= ZOOM_STEP_SCALE;

      this.stepAtPoint(delta, poi, point, poiChanged);

      this.navigation.end(this);
    },

    stepAtPoint: function(delta, poi, point, poiChanged) {
      // N/I: Mode dependent
    },

    _toYDownCoord: function(point) {
      return [point[0], this.currentCamera.height - point[1]];
    }
  });

  return ZoomMixin;
});
