define([
  "../Navigation",
  "./ConstraintsPlanar",
  "./AnimationPlanar",

  "./actions/PanPlanar",
  "./actions/RotatePlanar",
  "./actions/ZoomPlanar",

  "../../lib/glMatrix"
], function(
  Navigation,
  ConstraintsPlanar, AnimationPlanar,
  PanPlanar, RotatePlanar, ZoomPlanar,
  glMatrix
) {
  var vec3d = glMatrix.vec3d;

  var tmpPickMin = vec3d.create();
  var tmpPickMax = vec3d.create();
  var tmpNewTarget = vec3d.create();
  
  var tmpLookDir = vec3d.create();

  var NavigationPlanar = Navigation.createSubclass([ConstraintsPlanar, AnimationPlanar], {
    declaredClass: "esri.views.3d.navigation.planar.NavigationPlanar",

    initialize: function() {
      this.pan = new PanPlanar(this);
      this.zoom = new ZoomPlanar(this);
      this.rotate = new RotatePlanar(this);
    },

    fixTargetUpVector: function() {
      var worldUp = this.renderCoordsHelper.worldUp;
      var target = this.cameras.target;
      
      vec3d.direction(target.center, target.eye, tmpLookDir);
      
      // (lookDir * worldUp)
      var dot = vec3d.dot(tmpLookDir, worldUp);
      
      if (Math.abs(dot) > 0.9999)
      {
         // view direction almost perpendicular -> leave up vector untouched
      } else {
        // normal case: up = worldUp - tmpLookDir * (tmpLookDir * worldUp)
        vec3d.scale(tmpLookDir, dot, tmpLookDir);
        vec3d.subtract(worldUp, tmpLookDir, target.up);
        vec3d.normalize(target.up);
      }
    },

    setPoiAuto: function(point, currentToTarget) {
      var selector = this.picker.pickAlongRay(this.cameras.target.eye, this.cameras.target.center, null, point);

      if (!selector.getMinResult().getIntersectionPoint(tmpPickMin) ||
        !selector.getMaxResult().getIntersectionPoint(tmpPickMax)) {
        return;
      }

      var T = 5.0 / this.mapUnitInMeters;

      var minDist = selector.getMinResult().dist - T;
      var maxDist = selector.getMaxResult().dist + T;

      var poiDist = vec3d.dist(this.cameras.target.eye, this.cameras.target.center);

      if (poiDist <= minDist || poiDist >= maxDist) {
        if (selector.getMinResult().object) {
          selector.getMaxResult().dist = undefined;
          selector.intersectObject(selector.getMinResult().object);

          if (selector.getMaxResult().dist === undefined) {
            console.error("[NavigationPlanar.setPoiAuto] Did not obtain maximum intersection distance");
            return;
          } else {
            selector.getMaxResult().getIntersectionPoint(tmpPickMax);
            vec3d.lerp(tmpPickMin, tmpPickMax, 0.5, tmpNewTarget);
          }
        }
        else {
          vec3d.set(tmpPickMin, tmpNewTarget);
        }

        this.setCameraFromEyeAndCenter(this.cameras.target.eye, tmpNewTarget, { animate: false });
      }
    }
  });

  return NavigationPlanar;
});
