define([
  "../mixins/ConstraintsMixin",
  "../../support/mathUtils",
  "../../support/earthUtils",
  "../../lib/glMatrix",
  "../../constraints/SceneViewAltitudeConstraint",
  "../../constraints/SceneViewTiltConstraint",
  "../../webgl-engine/lib/Util"
], function(
  ConstraintsMixin,
  mathUtils, earthUtils,
  glMatrix,
  SceneViewAltitudeConstraint, SceneViewTiltConstraint,
  Util
) {
  var vec3d = glMatrix.vec3d;

  var tmpP = vec3d.create();

  var ConstraintsSpherical = ConstraintsMixin.createSubclass({
    declaredClass: "esri.views.3d.navigation.spherical.ConstraintsSpherical",

    defaultConstraints: {
      tilt: new ConstraintsMixin.Tilt({
        min: function() {
          // If this gets changed, please also update SceneViewTiltConstraint
          return mathUtils.deg2rad(SceneViewTiltConstraint.MAX_DEFAULT);
        },
        max: mathUtils.makePiecewiseLinearFunction([
            [4000, mathUtils.deg2rad(SceneViewTiltConstraint.MIN_DEFAULT)],
            [50000, mathUtils.deg2rad(88)],
            [6000000, mathUtils.deg2rad(88)],
            [20000000, mathUtils.deg2rad(SceneViewTiltConstraint.MAX_DEFAULT)]
          ]
        )
      }),
      altitude: new ConstraintsMixin.Altitude({
        min: function() {
          return SceneViewAltitudeConstraint.MIN_DEFAULT;
        },

        max: function() {
          return SceneViewAltitudeConstraint.MAX_DEFAULT;
        }
      }),
      collision: new ConstraintsMixin.Collision()
    },

    limitAltitude: function(poiDist, poi, ray, rayLength) {
      vec3d.scale(ray, poiDist / rayLength, tmpP);
      vec3d.subtract(poi, tmpP, tmpP);

      var altitude = this.renderCoordsHelper.getAltitude(tmpP);
      var newAltitude = this.constraints.altitude.apply(this, altitude);

      if (Math.abs(altitude - newAltitude) > 1e-6) {
        // Calculate the distance from poi along the ray for a given altitude
        var lc = vec3d.length(poi);
        var le = rayLength;

        var ne = newAltitude + earthUtils.earthRadius;

        var ceAng = vec3d.dot(ray, poi) / (lc * le);
        var b = -2 * lc * ceAng;
        var c = -(ne * ne) + lc * lc;
        var s2 = b * b - 4 * c;

        if (s2 < 0) {
          return this.minPoiDist;
        } else {
          var s = Math.sqrt(s2);

          if (s < b) {
            return (b - s) / 2;
          } else {
            return (s - b) / 2;
          }
        }
      } else {
        return poiDist;
      }
    },

    limitTiltByAltitudeConstraints: function(tilt, poi, distance, direction) {
      var lc = vec3d.length(poi);
      var lc2 = lc * lc;
      var d2 = distance * distance;

      var altitude = Math.sqrt(lc2 + d2 - 2 * lc * distance * Math.cos(Math.PI - tilt)) - earthUtils.earthRadius;

      var minAltitude = this.constraints.altitude.min();
      var maxAltitude = this.constraints.altitude.max();
      var newAltitude;

      if ((direction === undefined || direction > 0) && altitude < minAltitude) {
        newAltitude = minAltitude;
      } else if ((direction === undefined || direction < 0) && altitude > maxAltitude) {
        newAltitude = maxAltitude;
      }

      if (newAltitude !== undefined) {
        var le = newAltitude + earthUtils.earthRadius;
        var le2 = le * le;

        tilt = Math.PI - mathUtils.acos((-le2 + lc2 + d2) / (2 * lc * distance));
      }

      return tilt;
    },

    distanceToSilhouette: function(camera, sceneExtent, mapUnitInMeters, terrainElevationBelowCamera, retval) {
      if (!retval) {
        retval = {
          maxFarNearRatio: 0,
          distance: 0
        };
      }

      var eSqr = vec3d.dot(camera.eye, camera.eye);
      var rSqr = earthUtils.earthRadius * earthUtils.earthRadius;

      retval.maxFarNearRatio = this.maxFarNearRatio;

      if (eSqr > rSqr) {
        // automagically adjust max far/near ratio depending on the camera altitude. see
        // https://onedrive.live.com/redir?page=view&resid=570EB185C70CBD75!275&authkey=!ANJ7dB1XDQa9C-c for details.
        retval.maxFarNearRatio = mathUtils.clamp(20000 - (Math.log(Math.sqrt(eSqr) - earthUtils.earthRadius) - 7.983) / (16.994 - 7.983) * 19000, 1000, 20000);
        retval.distance = Math.sqrt(eSqr - rSqr);
      } else {
        retval.distance = this.maxFarNearRatio * this.minNearDistance;
      }

      retval.distance *= 1.2; // some slack to account for the fact that elevation is disregarded in the above computation

      return retval;
    },

    intersectManifold: function(p0, dir, elevation, outResult) {
      return Util.raySphereClosestPositive(p0, dir, earthUtils.earthRadius + elevation, outResult);
    },

    getCenterIntersectTerrainFallback: function(eye, retval) {
      var eSqr = vec3d.dot(eye, eye);
      var rSqr = earthUtils.earthRadius * earthUtils.earthRadius;

      var dist = (eSqr > rSqr) ? Math.sqrt(eSqr - rSqr) / 3 : 1;

      vec3d.scale(retval, dist / vec3d.length(retval), retval);
      vec3d.add(retval, eye);
    }
  });

  return ConstraintsSpherical;
});
