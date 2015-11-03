define([
  "../../Action",
  "../../../support/mathUtils",
  "../../../lib/glMatrix"
], function(
  Action,
  mathUtils,
  glMatrix
) {
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpAxis = vec3d.create();
  var tmpTransf = mat4d.create();

  var ActionSpherical = Action.createSubclass({
    declaredClass: "esri.views.3d.navigation.spherical.actions.ActionSpherical",

    constructor: function() {
      this._targetOnSphere = vec3d.create();
      this._navSphereRadius = 0;
    },

    closestPointOnSphereSilhouette: function(eyePos, queryPos, radius, result) {
      vec3d.cross(eyePos, queryPos, tmpAxis);
      vec3d.cross(tmpAxis, eyePos, result);
      vec3d.scale(result, 1 / vec3d.length(result) * radius);

      var angle = -mathUtils.asin(radius / vec3d.length(eyePos));
      mat4d.identity(tmpTransf);
      mat4d.rotate(tmpTransf, angle, tmpAxis);
      mat4d.multiplyVec3(tmpTransf, result);
    },

    rotateCameraWithPointsOnSphere: function(srcPoint, targetPoint, srcCam, targetCam, radius) {
      return this.navigation.rotateCameraWithPointsOnSphere(srcPoint, targetPoint, srcCam, targetCam, radius);
    },

    rotationFromPointsOnSphere: function(srcPoint, targetPoint, radius, axis) {
      return this.navigation.rotationFromPointsOnSphere(srcPoint, targetPoint, radius, axis);
    }
  });

  return ActionSpherical;
});
