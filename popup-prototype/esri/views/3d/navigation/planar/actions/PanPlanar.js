define([
  "./ActionPlanar",
  "../../mixins/PanMixin",
  "../../../lib/glMatrix",
  "../../../webgl-engine/lib/Util"
], function(
  ActionPlanar,
  PanMixin,
  glMatrix,
  Util
) {

  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;

  var tmpP = vec3d.create();
  var tmpN = vec3d.create();
  var tmpN1 = vec3d.create();
  var tmpP0 = vec3d.create();
  var tmpP1 = vec3d.create();
  var tmpWorldUp = vec3d.create();

  var ANGLE_0 = Math.PI / 9.0;
  var ANGLE_1 = ANGLE_0;

  var tmpIsect0 = vec3d.create();
  var tmpIsect1 = vec3d.create();

  var PanPlanar = ActionPlanar.createSubclass([PanMixin], {
    declaredClass: "esri.views.3d.navigation.planar.actions.PanPlanar",

    begin: function(point) {
      this.inherited(arguments);

      // Pick the terrain or feature under the mouse cursor.
      // If that fails, choose a free-standing point along the ray through the cursor.
      if (!this.pickPointInScreen(point, tmpP)) {
        this.pickFreePointInScreen(point, tmpP);
      }

      vec3d.normalize(vec3d.subtract(this.targetCamera.eye, this.targetCamera.center, tmpN));

      this.renderCoordsHelper.worldUpAtPosition(point, tmpWorldUp);

      var dot = vec3d.dot(tmpN, tmpWorldUp);

      if (dot < 0) {
        vec3d.negate(tmpN);
        dot = -dot;
      }

      var angle = Math.asin(dot); // this assumes that worldUp is axis-aligned!

      if (angle >= ANGLE_1) {
        // horizontal panning
        vec3d.set(tmpWorldUp, tmpN);
      }
      else {
        // vertical panning: make pan plane perpendicular to terrain surface
        vec3d.subtract(tmpN, vec3d.scale(tmpWorldUp, dot, tmpN1));
        vec3d.normalize(tmpN);
        if (angle > ANGLE_0) {
          // transitional region: blend between horizontal and vertical panning
          vec3d.lerp(tmpN, tmpWorldUp, (angle - ANGLE_0) / (ANGLE_1 - ANGLE_0));
          vec3d.normalize(tmpN);
        }
      }

      this.updatePlane(tmpP, tmpN);

      vec2d.set(point, this._dragLastPoint);
      vec2d.set(point, this._dragBeginPoint);
    },

    update: function(point) {
      if (!this._intersectPanPlane(this._dragLastPoint, this._dragBeginPoint, tmpIsect0)) {
        return;
      }
      if (!this._intersectPanPlane(point, this._dragBeginPoint, tmpIsect1)) {
        return;
      }

      vec3d.subtract(tmpIsect1, tmpIsect0);
      vec3d.subtract(this.targetCamera.eye, tmpIsect1);
      vec3d.subtract(this.targetCamera.center, tmpIsect1);

      vec2d.set(point, this._dragLastPoint);

      this.constrainTargetEyeByElevationAndMoveLookAt();
      this.targetAndCurrentChanged();
    },

    _intersectPanPlane: function(point1, point2, intersection) {
      this.createPickRay(point1, point2, this.currentCamera.viewMatrix, tmpP0, tmpP1);
      vec3d.subtract(tmpP1, tmpP0);
      return Util.rayPlane(tmpP0, tmpP1, this._plane, intersection);
    },

    end: function(point) {
      this.setPoiAuto(point, true);
      
      this._navSphereRadius = 0;
      this.inherited(arguments);
    }
  });

  return PanPlanar;
});
