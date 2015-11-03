/* jshint bitwise:false */
define([
  "../../../../core/declare",
  "../../lib/glMatrix",
  "../../support/mathUtils",
  "../NavigationConstants"
], function(
  declare,
  glMatrix,
  mathUtils,
  NavigationConstants
) {

  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpWorldUp = vec3d.create();
  var tmpViewDir = vec3d.create();
  var tmpRotCurPoint = vec2d.create();
  var tmpTransf = mat4d.create();
  var tmpAxis = vec3d.create();

  var INTERACTIVE_ROT_SCALE = [3.0, 1.5];

  var PivotPoint = NavigationConstants.Rotate.PivotPoint;

  var RotateMixin = declare([], {
    declaredClass: "esri.views.3d.navigation.mixins.RotateMixin",
    type: "rotate",

    constructor: function() {
      this._rotLastPoint = vec2d.create();
    },

    begin: function(point, pivot) {
      if (pivot === undefined) {
        pivot = PivotPoint.POI;
      }

      this.navigation.begin(this);
      this.active = true;
      this.emit("begin");

      this.setPoiAuto(point);
      this.normalizeCoordinate(point, this._rotLastPoint);
    },

    update: function(point, pivot) {
      if (pivot === undefined) {
        pivot = PivotPoint.POI;
      }

      var targetPos, pivotPos;

      switch (pivot) {
        case PivotPoint.EYE:
          targetPos = this.targetCamera.center;
          pivotPos = this.targetCamera.eye;
        break;
        default:
          // Default to POI, write error if invalid pivot specified
          targetPos = this.targetCamera.eye;
          pivotPos = this.targetCamera.center;
          
          if (pivot !== PivotPoint.POI) {
            console.error("[RotateMixin.update]: invalid pivot specified");
          }
        break;
      }

      this._applyRotation(point, pivot, targetPos, pivotPos);

      this.constrainTargetEyeByElevation();

      this.fixTargetUpVector();
      this.targetAndCurrentChanged();

      this.emit("update");
    },

    _applyRotation: function(point, pivot, targetPos, pivotPos) {
      this.renderCoordsHelper.worldUpAtPosition(pivotPos, tmpWorldUp);

      // compute desired rotation angles from screen coordinates
      this.normalizeCoordinate(point, tmpRotCurPoint);
      var tiltDelta = (tmpRotCurPoint[1] - this._rotLastPoint[1]) * INTERACTIVE_ROT_SCALE[pivot - 1];
      var headingDelta = (tmpRotCurPoint[0] - this._rotLastPoint[0]) * INTERACTIVE_ROT_SCALE[pivot - 1];

      // compute current elevation angle
      vec3d.subtract(targetPos, pivotPos, tmpViewDir);

      var viewDistance = vec3d.length(tmpViewDir);

      var currentTilt = mathUtils.acos(vec3d.dot(tmpViewDir, tmpWorldUp) / viewDistance);

      if (pivot === PivotPoint.POI) {
        // bound new tilt
        tiltDelta = this.limitTiltByConstraints(currentTilt + tiltDelta, pivotPos, viewDistance) - currentTilt;
      }
      else {
        tiltDelta *= -0.5;
        
        currentTilt = 0.5 * Math.PI - currentTilt;

        var lim = 0.5 * Math.PI * 0.99;
        tiltDelta = currentTilt - Math.max(-lim, Math.min(lim, currentTilt + tiltDelta));
      }

      // apply tilt change
      mat4d.identity(tmpTransf);
      vec3d.cross(this.targetCamera.up, tmpViewDir, tmpAxis);

      // apply heading change
      if (pivot == PivotPoint.POI) {
        headingDelta = -headingDelta;
      }
      mat4d.rotate(tmpTransf, headingDelta, tmpWorldUp);

      mat4d.rotate(tmpTransf, tiltDelta, tmpAxis);

      // transform target point
      mat4d.multiplyVec3(tmpTransf, tmpViewDir);
      vec3d.add(pivotPos, tmpViewDir, targetPos);
      mat4d.multiplyVec3(tmpTransf, this.targetCamera.up);

      vec2d.set(tmpRotCurPoint, this._rotLastPoint);
    },

    end: function(point) {
      this.active = false;

      this.emit("end");
      this.navigation.end(this);
    }
  });

  return RotateMixin;
});
