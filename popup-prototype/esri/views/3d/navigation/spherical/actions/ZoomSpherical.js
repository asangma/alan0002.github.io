define([
  "./ActionSpherical",
  "../../mixins/ZoomMixin",
  "../../../lib/glMatrix",
  "../../../support/earthUtils"
], function(
  ActionSpherical,
  ZoomMixin,
  glMatrix,
  earthUtils
) {
  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpP0 = vec3d.create();
  var tmpP1 = vec3d.create();
  var tmpRayDir = vec3d.create();
  var tmpTransf = mat4d.create();
  var tmpViewDir = vec3d.create();
  var tmpPoi = vec3d.create();

  var ZoomSpherical = ActionSpherical.createSubclass([ZoomMixin], {
    declaredClass: "esri.views.3d.navigation.spherical.actions.ZoomSpherical",

    constructor: function() {
    },

    begin: function(point) {
      this.inherited(arguments);

      if (this.pickPointInScreen(point, this._navPickPoint)) {
        this._navSphereRadius = vec3d.length(this._navPickPoint);
      } else {
        // if user hasn't clicked on any geometry, intersect ray with sphere defined by
        // POI or earth radius
        this._navSphereRadius = vec3d.length(this.targetCamera.center);

        if (this._navSphereRadius < 0.9 * earthUtils.earthRadius) {
          this._navSphereRadius = earthUtils.earthRadius;
        }

        this.createPickRay(point, point, this.currentCamera.viewMatrix, tmpP0, tmpP1);
        vec3d.subtract(tmpP1, this.currentCamera.eye);

        if (!this.intersectManifold(this.currentCamera.eye, tmpP1, this._navSphereRadius - earthUtils.earthUtils, this._navPickPoint)) {
          this._navSphereRadius = 0; // pan in centrally
        }
      }

      this._mouseDownCamera.copyFrom(this.targetCamera);
    },

    update: function(point) {
      var targetCam = this.targetCamera;

      targetCam.copyFrom(this._mouseDownCamera);

      vec3d.subtract(targetCam.center, targetCam.eye, tmpRayDir);
      var oriPoiDist = vec3d.length(tmpRayDir);

      this.normalizeCoordinate(point, tmpP0);
      var zoomScaling = (tmpP0[1] - this.normalizedAnchorPoint[1])*12;
      var newPoiDist = oriPoiDist * Math.pow(2, zoomScaling);

      if (zoomScaling < 0 && newPoiDist < this.navigation.minPoiDist) {
        newPoiDist = this.navigation.minPoiDist;
      }

      newPoiDist = this.limitAltitude(newPoiDist, targetCam.center, tmpRayDir, oriPoiDist, zoomScaling < 0 ? -1 : 1);

      if (Math.abs(oriPoiDist - newPoiDist) < 1e-6) {
        return;
      }

      if (this._navSphereRadius > 0 && newPoiDist < oriPoiDist) {
        // in spherical coordinates, interpolate radius between targetCam.center and this._navPickPoint
        var lookAtDistFact = 1 - (1 - (newPoiDist/oriPoiDist)) * (1 - this._navSphereRadius / vec3d.length(targetCam.center));
        vec3d.scale(targetCam.center, lookAtDistFact);
      }

      vec3d.scale(tmpRayDir, -newPoiDist / oriPoiDist);
      vec3d.add(targetCam.center, tmpRayDir, targetCam.eye);

      var anchorChanged = false;

      if (this._navSphereRadius > 0) {
        // find out where the point under the mouse cursor has to rotate to
        mat4d.lookAt(targetCam.eye, targetCam.center, targetCam.up, tmpTransf);
        this.createPickRay(this._dragBeginPoint, this._dragBeginPoint, tmpTransf, tmpP0, tmpP1);
        vec3d.normalize(vec3d.subtract(tmpP1, targetCam.eye));

        // don't use tmpP0 as ray origin! the near this._plane is not yet updated to the shifted
        // eye position, thus this.createPickRay may return a point which lies inside the sphere.
        // use targetPoint.eye instead.
        if (!this.intersectManifold(targetCam.eye, tmpP1, this._navSphereRadius - earthUtils.earthRadius, this._targetOnSphere)) {
          // user has zoomed out far -> use point on silhouette of sphere that is closest to ray
          this.closestPointOnSphereSilhouette(targetCam.eye, tmpP0, this._navSphereRadius, this._targetOnSphere);
          anchorChanged = true;
        }

        this.rotateCameraWithPointsOnSphere(this._navPickPoint, this._targetOnSphere, targetCam, targetCam, this._navSphereRadius);
        this.fixTargetUpVector();
      }

      this.applyConstraints(targetCam);
      this.constrainTargetEyeByElevation();
      this.targetAndCurrentChanged();

      vec2d.set(this._dragBeginPoint, this._dragLastPoint);

      if (anchorChanged) {
        mat4d.lookAt(targetCam.eye, targetCam.center, targetCam.up, tmpTransf);
        this._dragLastPoint = this.currentCamera.projectPoint(this._navPickPoint, tmpTransf);
      }

      var xy = this._toYDownCoord(this._dragLastPoint);
      this.emit("update", xy[0], xy[1]);
    },

    stepAtPoint: function(delta, poi, point, poiChanged) {
      vec3d.set(poi, tmpPoi);

      var r = vec3d.length(tmpPoi);

      vec3d.subtract(this.targetCamera.eye, this.targetCamera.center, tmpViewDir);

      if (delta < 0) {
        delta *= 1.7; //tweak for mouse wheel zoom to ensure zoom out is same stepsize as zoom in
      }

      var oriPoiDist = vec3d.length(tmpViewDir);
      var newPoiDist = oriPoiDist * (1.0 - delta);

      if (delta > 0 && newPoiDist < this.minPoiDist) {
        newPoiDist = this.minPoiDist;
      } else {
        newPoiDist = this.limitAltitude(newPoiDist, tmpPoi, tmpViewDir, -oriPoiDist, delta >= 0 ? -1 : 1);
      }

      // poi dist might have changed, adjust delta accordingly
      delta = -(newPoiDist / oriPoiDist - 1.0);

      if (Math.abs(oriPoiDist - newPoiDist) < 1e-6) {
        return;
      }

      if (poiChanged) {
        // in spherical coordinates, interpolate radius between this.targetCamera.center and tmpPoi
        var lookAtDistFact = 1 - delta * (1 - r / vec3d.length(this.targetCamera.center));
        vec3d.scale(this.targetCamera.center, lookAtDistFact);
      }

      vec3d.scale(tmpViewDir, (1.0 - delta));
      vec3d.add(this.targetCamera.center, tmpViewDir, this.targetCamera.eye);

      if (poiChanged && point) {
        // in spherical coordinates, interpolate phi and delta of this.targetCamera such that tmpPoi will remain
        // exactly under the mouse cursor
        mat4d.lookAt(this.targetCamera.eye, this.targetCamera.center, this.targetCamera.up, tmpTransf);
        this.createPickRay(point, point, tmpTransf, tmpP0, tmpP1);
        vec3d.normalize(vec3d.subtract(tmpP1, this.targetCamera.eye));
        // don't use tmpP0 as ray origin! the near this._plane is not yet updated to the shifted
        // eye position, thus this.createPickRay may return a point which lies inside the sphere.
        // use targetPoint.eye instead.

        //assert(r < vec3d.length(this.targetCamera.eye), "Navigation.zoomStepGlobe: eye is inside pan sphere");
        // TODO: fix the issue of r < vec3d.length(this.targetCamera.eye)
        if ((r < vec3d.length(this.targetCamera.eye)) &&
            this.intersectManifold(this.targetCamera.eye, tmpP1, r - earthUtils.earthRadius, this._targetOnSphere)) {
          this.rotateCameraWithPointsOnSphere(tmpPoi, this._targetOnSphere, this.targetCamera, this.targetCamera, r);
        } else {
          poiChanged = false;
        }
      }

      this.applyConstraints(this.targetCamera);
      this.constrainTargetEyeByElevation();

      if (poiChanged) {
        this.fixTargetUpVector();
      }

      if (!this.navigation.currentHasAlmostReachedTarget()) {
        this.targetAnimatedChanged();
      } else {
        this.targetAndCurrentChanged();
      }
    }
  });

  return ZoomSpherical;
});
