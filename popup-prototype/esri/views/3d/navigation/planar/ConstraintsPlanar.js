define([
  "../mixins/ConstraintsMixin",
  "../../support/mathUtils",
  "../../support/earthUtils",
  "../../support/RenderCoordsHelper",
  "../../constraints/SceneViewTiltConstraint",
  "../../lib/glMatrix",
  "../../webgl-engine/lib/Util"
], function(
  ConstraintsMixin,
  mathUtils, earthUtils, RenderCoordsHelper,
  SceneViewTiltConstraint,
  glMatrix,
  Util
) {

  // Imports
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;

  // Constants
  var GLOBAL_ALTITUDE_FACTOR = 0.001,
    LOCAL_ALTITUDE_FACTOR = 0.0001;

  // Temp variables
  var tmpPlane = vec4d.create(),
    tmpVec = vec3d.create(),
    tmpViewDir = vec3d.create();

  var ConstraintsPlanar = ConstraintsMixin.createSubclass({
    declaredClass: "esri.views.3d.navigation.planar.ConstraintsPlanar",

    defaultConstraints: {
      tilt: new ConstraintsMixin.Tilt({
        min: function() {
          return mathUtils.deg2rad(SceneViewTiltConstraint.MAX_DEFAULT);
        },
        max: mathUtils.makePiecewiseLinearFunction([
            [4000, mathUtils.deg2rad(SceneViewTiltConstraint.MIN_DEFAULT)],
            [10000, mathUtils.deg2rad(88)],
            [6000000, mathUtils.deg2rad(88)]
          ]
        )
      }),
      altitude: new ConstraintsMixin.Altitude({
        min: function(navigation) {
          return navigation._autoAltitudeConstraints.min;
        },

        max: function(navigation) {
          return navigation._autoAltitudeConstraints.max;
        }
      }),
      collision: new ConstraintsMixin.Collision()
    },

    _updateAutoAltitudeConstraints: function(extent) {
      var maxDim = Math.max(extent.xmax - extent.xmin,
                            extent.ymax - extent.ymin);

      var mapUnitInMeters = (this.mapCoordsHelper ? this.mapCoordsHelper.mapUnitInMeters : 1);

      this._autoAltitudeConstraints.max = 1.5 * maxDim / Math.atan(this._targetCameraBeforeElevationUpdate._fov/2);
      this._autoAltitudeConstraints.min = -this._autoAltitudeConstraints.max;

      this._autoAltitudeConstraints.min *= mapUnitInMeters;
      this._autoAltitudeConstraints.max *= mapUnitInMeters;
    },

    limitAltitude: function(poiDist, poi, ray, rayLength) {
      return this.constraints.altitude.apply(this, poiDist);
    },

    limitTiltByAltitudeConstraints: function(tilt, poi, distance, direction) {
      return tilt;
    },

    distanceToSilhouette: function(camera, sceneExtent, mapUnitInMeters, terrainElevationBelowCamera, retval) {
      if (!retval) {
        retval = {
          maxFarNearRatio: 0,
          distance: 0
        };
      }

      retval.maxFarNearRatio = this.maxFarNearRatio;

      var altitude = RenderCoordsHelper.Planar.prototype.getAltitude(camera.eye);
      altitude *= mapUnitInMeters;

      // determine altitude for visible range based on elevation bounds
      var elevationBounds = this.elevationProvider ? this.elevationProvider.getElevationBounds() : null;
      if (elevationBounds) {
        var cameraAltitudeMSL = altitude; // Mean Sea Level
        var cameraAltitudeAGL = altitude - terrainElevationBelowCamera; // Above Ground Level

        if (cameraAltitudeAGL >= 0) {
          altitude = cameraAltitudeMSL - mapUnitInMeters * elevationBounds[0];
        } else {
          altitude = mapUnitInMeters * elevationBounds[1] - cameraAltitudeMSL;
        }
      }

      // find the maximum distance to the border of sceneExtent
      vec3d.subtract(camera.center, camera.eye, tmpViewDir);

      tmpVec[0] = tmpViewDir[0] > 0 ? sceneExtent.xmax : sceneExtent.xmin;
      tmpVec[1] = tmpViewDir[1] > 0 ? sceneExtent.ymax : sceneExtent.ymin;
      tmpVec[2] = tmpViewDir[2] > 0 ? sceneExtent.zmax : sceneExtent.zmin;

      vec3d.subtract(tmpVec, camera.eye);
      vec3d.normalize(tmpViewDir);

      var maxExtentDepth = vec3d.dot(tmpVec, tmpViewDir);
      maxExtentDepth *= 1.1; // slack

      var maxExtentDepthMeters = maxExtentDepth * mapUnitInMeters;

      // also compute distance to horizon, pretending we're on a sphere
      var d = altitude + earthUtils.earthRadius;
      var horizonDistance = Math.sqrt(d * d - earthUtils.earthRadius * earthUtils.earthRadius);

      var maxSceneDim = Math.max(sceneExtent.xmax - sceneExtent.xmin,
                                 sceneExtent.ymax - sceneExtent.ymin);

      var globalAltitude = maxSceneDim * GLOBAL_ALTITUDE_FACTOR * mapUnitInMeters;
      var localAltitude = maxSceneDim * LOCAL_ALTITUDE_FACTOR * mapUnitInMeters;

      // depending on altitude, use distance to border or horizon, or blend between them
      var blend = mathUtils.clamp((altitude - localAltitude) / (globalAltitude - localAltitude), 0, 1);
      blend *= blend*blend;
      retval.distance = mathUtils.lerp(horizonDistance, maxExtentDepthMeters, blend);

      return retval;
    },

    intersectManifold: function(p0, dir, elevation, outResult) {
      // untested! sorry if buggy.
      vec4d.set4(0, 0, 1, elevation, tmpPlane);
      return Util.rayPlane(p0, dir, tmpPlane, outResult);
    },

    getCenterIntersectTerrainFallback: function(eye, retval) {
      // no intersection with plane -> view direction horizontal -> project camera position to ground
      vec3d.set3(eye[0], eye[1], 0, retval);
    }
  });

  return ConstraintsPlanar;
});
