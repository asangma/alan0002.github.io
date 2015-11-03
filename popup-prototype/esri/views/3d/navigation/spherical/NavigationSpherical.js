define([
  "../Navigation",
  
  "./ConstraintsSpherical",
  "./AnimationSpherical",

  "./actions/PanSpherical",
  "./actions/ZoomSpherical",
  "./actions/RotateSpherical",

  "../../lib/glMatrix"
], function(
  Navigation,
  ConstraintsSpherical, AnimationSpherical,
  PanSpherical, ZoomSpherical, RotateSpherical,
  glMatrix
) {
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpPickMin = vec3d.create();
  var tmpP = vec3d.create();
  var tmpRotAxis = vec3d.create();
  var tmpTransf = mat4d.create();

  var NavigationSpherical = Navigation.createSubclass([ConstraintsSpherical, AnimationSpherical], {
    declaredClass: "esri.views.3d.navigation.spherical.NavigationSpherical",

    initialize: function() {
      this.pan = new PanSpherical(this);
      this.zoom = new ZoomSpherical(this);
      this.rotate = new RotateSpherical(this);
    },

    fixTargetUpVector: function() {
      this.cameras.target.computeUpOnSphere();
    },

    setPoiAuto: function(point, currentToTarget) {
      var selector = this.picker.pickAlongRay(this.cameras.target.eye, this.cameras.target.center, null, point);

      if (this.picker.pickedIntersectionPoint(selector, tmpPickMin)) {
        this.setCameraFromEyeAndCenter(this.cameras.target.eye, tmpPickMin);
        vec3d.set(this.cameras.target.center, this.cameras.current.center);

        if (currentToTarget) {
          this.setCurrentToTarget();
        }
      }
    },

    rotateCameraWithPointsOnSphere: function(srcPoint, targetPoint, srcCam, targetCam, radius) {
      var correctedRadius;

      if (radius == null) {
        radius = vec3d.length(srcPoint);
      }

      // slow?
      if (Math.abs(vec3d.length(srcPoint) - radius) >= 0.0001) {
        console.error("[NavigationSpherical.rotateCameraWithPointsOnSphere]: invalid radius for source point (got " + radius + ", but expected " + vec3d.length(srcPoint) + ", " + srcPoint + ")");
        correctedRadius = vec3d.length(srcPoint);
      }

      // slow?
      if (Math.abs(vec3d.length(targetPoint) - radius) >= 0.0001) {
        console.error("[NavigationSpherical.rotateCameraWithPointsOnSphere: invalid radius for target point (got " + radius + ", but expected " + vec3d.length(targetPoint) + ")");

        if (correctedRadius === undefined) {
          correctedRadius = vec3d.length(targetPoint);
        }
      }

      if (correctedRadius !== undefined) {
        radius = correctedRadius;
      }

      var angle = this.rotationFromPointsOnSphere(srcPoint, targetPoint, radius, tmpRotAxis);

      mat4d.identity(tmpTransf);
      mat4d.rotate(tmpTransf, angle, tmpRotAxis);
      mat4d.multiplyVec3(tmpTransf, srcCam.eye, targetCam.eye);
      mat4d.multiplyVec3(tmpTransf, srcCam.center, targetCam.center);
      mat4d.multiplyVec3(tmpTransf, srcCam.up, targetCam.up);
    },

    rotationFromPointsOnSphere: function(srcPoint, targetPoint, radius, axis) {
      vec3d.cross(srcPoint, targetPoint, axis);
      return -Math.acos(1 - vec3d.dist2(srcPoint, targetPoint) / (2 * radius * radius)); // angle
    },

    preserveHeadingTiltFrame: function(ctr) {
      var curCamLookAtLen = vec3d.length(this.cameras.current.center);

      vec3d.scale(ctr, curCamLookAtLen / vec3d.length(ctr), tmpP);
      this.rotateCameraWithPointsOnSphere(tmpP, this.cameras.current.center, this.cameras.current, this.cameras.target, curCamLookAtLen);
    }
  });

  return NavigationSpherical;
});
