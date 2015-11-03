define([
  "./ActionPlanar",
  "../../mixins/ZoomMixin",
  "../../../lib/glMatrix",
  "../../../webgl-engine/lib/Util"
], function(
  ActionPlanar,
  ZoomMixin,
  glMatrix,
  Util
) {

  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;

  var tmpP0 = vec3d.create();
  var tmpP1 = vec3d.create();
  var tmpRayDir = vec3d.create();
  var tmpN = vec3d.create();
  var tmpP = vec3d.create();
  var tmpPoi = vec3d.create();

  var ZoomPlanar = ActionPlanar.createSubclass([ZoomMixin], {
    declaredClass: "esri.views.3d.navigation.planar.actions.ZoomPlanar",

    begin: function(point) {
      this.inherited(arguments);

      // Pick the terrain or feature under the mouse cursor.
      // If that fails, choose a free-standing point along the ray through the cursor.
      if (!this.pickPointInScreen(point, tmpP)) {
        this.pickFreePointInScreen(point, tmpP);
      }

      vec3d.normalize(vec3d.subtract(this.targetCamera.eye, this.targetCamera.center, tmpN));

      if (tmpN[1] < 0) {
        vec3d.negate(tmpN);
      }

      this.updatePlane(tmpP, tmpN);
    },

    update: function(point) {
      vec3d.set(this.targetCamera.center, tmpPoi);

      var poiChanged = false;

      this.createPickRay(this._dragBeginPoint, this._dragBeginPoint, this.currentCamera.viewMatrix, tmpP0, tmpP1);
      vec3d.subtract(tmpP1, tmpP0);
      poiChanged = Util.rayPlane(tmpP0, tmpP1, this._plane, tmpPoi); // only fails if view is parallel to xy-this._plane

      this.normalizeCoordinate(point, tmpP0);
      var w = (this.normalizedAnchorPoint[1] - tmpP0[1])*4;
      vec2d.set(tmpP0, this.normalizedAnchorPoint);

      this._applyZoom(tmpPoi, w);

      var xy = this._toYDownCoord(this._dragLastPoint);
      this.emit("update", xy[0], xy[1]);
    },

    _applyZoom: function(poi, w) {
      vec3d.subtract(poi, this.targetCamera.eye, tmpRayDir);

      var oriPoiDist = vec3d.length(tmpRayDir);
      var newPoiDist = oriPoiDist * (1.0 - w);

      if ((w >= 0 && newPoiDist < this.minPoiDist)) {
        newPoiDist = this.minPoiDist;
      }

      newPoiDist = this.limitAltitude(newPoiDist, poi, tmpRayDir, oriPoiDist, w >= 0 ? -1 : 1);

      if (Math.abs(oriPoiDist - newPoiDist) < 1e-6) {
        return;
      }

      vec3d.scale(tmpRayDir, w);

      vec3d.add(this.targetCamera.eye, tmpRayDir);
      vec3d.lerp(this.targetCamera.center, poi, w);

      this.fixTargetUpVector();
      this.targetAndCurrentChanged();
    },

    stepAtPoint: function(delta, poi, point, poiChanged) {
      vec3d.set(poi, tmpPoi);
      vec3d.subtract(tmpPoi, this.targetCamera.eye, tmpRayDir);

      var oriPoiDist = vec3d.length(tmpRayDir);
      var newPoiDist = oriPoiDist * (1.0 - delta);

      if (delta >= 0 && newPoiDist < this.minPoiDist) {
        newPoiDist = this.minPoiDist;
      }

      newPoiDist = this.limitAltitude(newPoiDist, tmpPoi, tmpRayDir, oriPoiDist, delta >= 0 ? -1 : 1);

      // poi dist might have changed, adjust delta accordingly
      delta = -(newPoiDist / oriPoiDist - 1.0);

      if (Math.abs(oriPoiDist - newPoiDist) >= 1e-6) {
        vec3d.scale(tmpRayDir, newPoiDist / oriPoiDist);

        vec3d.subtract(tmpPoi, tmpRayDir, this.targetCamera.eye);
        vec3d.lerp(this.targetCamera.center, tmpPoi, delta);

        this.constrainTargetEyeByElevation();

        this.fixTargetUpVector();
        this.targetAnimatedChanged();
      }
    }
  });

  return ZoomPlanar;
});
