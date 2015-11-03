define([
  "../../../../core/declare",
  "../../../../core/watchUtils",
  "../../../../geometry/Point",
  "../../support/mathUtils",
  "../../lib/glMatrix",
  "../../constraints/SceneViewAltitudeConstraint",
  "../../webgl-engine/lib/Camera",
  "../../webgl-engine/lib/IntervalUtilities"
], function(
  declare, watchUtils,
  Point,
  mathUtils,
  glMatrix,
  SceneViewAltitudeConstraint,
  Camera, IntervalUtilities
) {

  var MIN_NEAR_DISTANCE_IN_METERS_DEFAULT = 2.0;
  var MIN_POI_DIST_IN_METERS_DEFAULT = 4.0;
  var CAMERA_ELEVATION_MARGIN_IN_METERS_DEFAULT = 5.0;

  // Indicates a threshold at which to retarget the camera center after an
  // elevation change in the area of eye->center ray. The threshold is a
  // minimum change of target distance (between current and corrected) as
  // a percentage of the current eye->center distance.
  var CAMERA_ELEVATION_CORRECTION_THRESHOLD = 0.02;

  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var tmpPoint = new Point();
  var tmpViewDir = vec3d.create();
  var tmpAxis = vec3d.create();
  var tmpTransf = mat4d.create();
  var tmpRayDir = vec3d.create();
  var tmpWorldUp = vec3d.create();
  var tmpP = vec3d.create();
  var tmpCam = new Camera();
  var tmpTargetCamera = new Camera();
  var tmpLookAtPos = vec3d.create();

  var tmpElevationAngle = {
    tilt: 0,
    distance: 0
  };

  var tmpSilhouette = {
    distance: 0,
    maxFarNearRatio: 0
  };

  var ConstraintsMixin = declare([], {
    declaredClass: "esri.views.3d.navigation.mixins.ConstraintsMixin",

    classMetadata: {
      properties: {
        userConstraints: {
          setter: function(constraints) {
            this._disconnectUserConstraints();
            this._connectUserConstraints(constraints);

            return constraints;
          }
        },
        elevationProvider: {
          value: null,
          setter: function(provider) {
            if (this._elevationChangeHandle !== null) {
              this._elevationChangeHandle.remove();
              this._elevationChangeHandle = null;
            }

            if (this._elevationChangeTileHandle !== null) {
              this._elevationChangeTileHandle.remove();
              this._elevationChangeTileHandle = null;
            }

            if (provider !== null) {
              this._elevationChangeHandle = provider.on("elevation-change", this._elevationChangeHandler.bind(this));
              this._elevationChangeTileHandle = provider.on("elevation-change-tile", this._elevationChangeTileHandler.bind(this));
            }

            return provider;
          }
        },
        minPoiDist: {
          getter: function() {
            return this._minPoiDistInMeters / this.mapUnitInMeters;
          },
          dependsOn: ["mapUnitInMeters"]
        },

        cameraElevationMargin: {
          getter: function() {
            return this._cameraElevationMarginInMeters / this.mapUnitInMeters;
          },
          dependsOn: ["mapUnitInMeters"]
        },

        minNearDistance: {
          getter: function() {
            return this._minNearDistanceInMeters / this.mapUnitInMeters;
          },
          dependsOn: ["mapUnitInMeters"]
        },

        constraintsEnabled: {
          value: true
        }
      }
    },

    constructor: function() {
      this._userConstraints = null;
      this._userConstraintsHandles = [];
      this._clipDistanceHandles = [];
      this._tiltHandles = [];
      this._altitudeHandles = [];

      this.constraints = {
        tilt: this.defaultConstraints.tilt,
        altitude: this.defaultConstraints.altitude,
        collision: this.defaultConstraints.collision
      };

      this._tiltModeHandler = this._tiltModeHandler.bind(this);
      this._tiltMaxHandler = this._tiltMaxHandler.bind(this);

      this._altitudeModeHandler = this._altitudeModeHandler.bind(this);
      this._altitudeMinMaxHandler = this._altitudeMinMaxHandler.bind(this);

      this._clipDistanceModeHandler = this._clipDistanceModeHandler.bind(this);
      this._clipDistanceNearFarHandler = this._clipDistanceNearFarHandler.bind(this);

      this._collisionEnabledHandler = this._collisionEnabledHandler.bind(this);

      this.enableElevationUpdates = true;
      this._recomputeTargetCenterForElevationChange = false;

      this._elevationChangeHandle = null;
      this._elevationChangeTileHandle = null;

      this._terrainElevationBelowCamera = null;
      this._terrainElevationAtCameraEye = null;

      this._autoAltitudeConstraints = {
        min: SceneViewAltitudeConstraint.MIN_DEFAULT,
        max: SceneViewAltitudeConstraint.MAX_DEFAULT
      };

      this.maxFarNearRatio = 20000.0;

      this._minNearDistanceInMeters = MIN_NEAR_DISTANCE_IN_METERS_DEFAULT;

      this._minPoiDistInMeters = MIN_POI_DIST_IN_METERS_DEFAULT;
      this._cameraElevationMarginInMeters = CAMERA_ELEVATION_MARGIN_IN_METERS_DEFAULT;
    },

    initialize: function() {
      this._targetCameraBeforeElevationUpdate = this.cameras.current.copy();

      this._sceneExtentChangeHandle = this.view.watch("fullExtent", function(extent) {
        this._updateAltitudeConstraintFromExtent(extent);

        this._reapplyConstraints();
        this._camerasChanged();
      }.bind(this));
    },

    _updateAutoAltitudeConstraints: function(extent) {
    },

    updateMapCoordsHelper: function(mapCoordsHelper, oldHelper) {
      this.inherited(arguments);

      // Scale default constraints
      if (!this._userConstraints || this._userConstraints.altitude.mode === "auto") {
        this.constraints.altitude = ConstraintsMixin.Altitude.scale(this.defaultConstraints.altitude, mapCoordsHelper.mapUnitInMeters);
      }
      if (!this._userConstraints || this._userConstraints.tilt.mode === "auto") {
        this.constraints.tilt = ConstraintsMixin.Tilt.scale(this.defaultConstraints.tilt, mapCoordsHelper.mapUnitInMeters);
      }

      this._updateAltitudeConstraintFromExtent(this.view.fullExtent);

      this._reapplyConstraints();
      this._camerasChanged();
    },

    _updateAltitudeConstraintFromExtent: function(extent) {
      if (extent.spatialReference.equals(this.mapCoordsHelper.spatialReference) && ((extent.xmax - extent.xmin) > 0))
      {
        this._updateAutoAltitudeConstraints(extent);
        if (!this._userConstraints || this._userConstraints.altitude.mode === "auto") {
          this._autoUpdateAltitudeConstraint();
        }
      }
    },

    destroy: function() {
      this._disconnectUserConstraints();
      this._sceneExtentChangeHandle.remove();
    },

    _updateTargetCenterForElevation: function() {
      if (this.enableElevationUpdates) {
        var camera = this.getCameraIntersectTerrain(this.cameras.target.eye,
                                                    this.cameras.target.center,
                                                    this.cameras.target.up,
                                                    CAMERA_ELEVATION_CORRECTION_THRESHOLD);

        if (camera) {
          this.setCamera(camera, {
            internalUpdate: true
          });
        }
      }
    },

    step: function(dt) {
      var isPanning = this.pan && this.pan.continuous && this.pan.continuous.active;
      var isInteractive = isPanning || this.pan.active || this.zoom.active || this.rotate.active;

      if (!isInteractive && this._recomputeTargetCenterForElevationChange) {
        var isTargetChangedByElevationUpdate = this._targetCameraChangedByElevationUpdate;
        this._updateTargetCenterForElevation();

        // Preserve target camera changed by elevation update
        if (isTargetChangedByElevationUpdate) {
          this._targetCameraChangedByElevationUpdate = true;
        }

        this._recomputeTargetCenterForElevationChange = false;
      }

      this.inherited(arguments);
    },

    applyConstraints: function(cam, onlyMinTilt) {
      if (!this.constraintsEnabled) {
        return false;
      }

      var elevationAngle = this._cameraElevationAngle(cam, tmpElevationAngle);

      var minTilt = this.constraints.tilt.min(elevationAngle.distance);
      var maxTilt = this.constraints.tilt.max(elevationAngle.distance);
      var delta = 0;

      if (!onlyMinTilt && elevationAngle.tilt > maxTilt) {
        delta = elevationAngle.tilt - maxTilt;
      }
      else if (elevationAngle.tilt < minTilt) {
        delta = elevationAngle.tilt - minTilt;
      }

      var changed = false;

      if (Math.abs(delta) > 0.01) {
        // rotation axis:
        vec3d.cross(tmpViewDir, cam.up, tmpAxis);

        // transformation:
        mat4d.identity(tmpTransf);
        mat4d.rotate(tmpTransf, delta, tmpAxis);

        mat4d.multiplyVec3(tmpTransf, tmpViewDir);
        vec3d.add(cam.center, tmpViewDir, cam.eye);
        mat4d.multiplyVec3(tmpTransf, cam.up);

        changed = true;

        // debug:
        //vec3d.subtract(cam.eye, cam.center, tmpViewDir);
        //viewDistance = vec3d.length(tmpViewDir);
        //tilt = Math.acos(vec3d.dot(tmpViewDir, tmpWorldUp);
        //viewDistance / vec3d.length(tmpWorldUp));
        //console.log("new tilt %f", tilt);
      }

      // Scale along eye->center to adjust for altitude constraints
      vec3d.subtract(cam.center, cam.eye, tmpRayDir);
      var distance = cam.distance;

      var newDistance = this.limitAltitude(distance, cam.center, tmpRayDir, distance);

      if (distance !== newDistance) {
        vec3d.scale(tmpRayDir, -newDistance / distance);
        vec3d.add(cam.center, tmpRayDir, cam.eye);
        changed = true;
      }

      this._autoUpdateTiltConstraint(maxTilt);
      return changed;
    },

    limitTiltByConstraints: function(tilt, poi, distance, direction) {
      if (!this.constraintsEnabled) {
        return tilt;
      }

      var min = this.constraints.tilt.min(distance),
        max = this.constraints.tilt.max(distance);

      if ((direction === undefined || direction > 0) && (tilt >= max)) {
        tilt = max;
      }
      else if ((direction === undefined || direction < 0) && (tilt <= min)) {
        tilt = min;
      }

      tilt = this.limitTiltByAltitudeConstraints(tilt, poi, distance, direction);
      this._autoUpdateTiltConstraint(max);

      return tilt;
    },

    _autoUpdateAltitudeConstraint: function() {
      var altitudeConstraint = this._userConstraints && this._userConstraints.altitude;

      if (altitudeConstraint && altitudeConstraint.mode === "auto") {
        altitudeConstraint.autoUpdate(this.constraints.altitude.min(this),
                                      this.constraints.altitude.max(this));
      }
    },

    _autoUpdateTiltConstraint: function(maxTilt) {
      var tiltConstraint = this._userConstraints && this._userConstraints.tilt;

      if (maxTilt === undefined) {
        maxTilt = this.constraints.tilt.max(this.cameras.target.distance);
       }

      if (tiltConstraint && tiltConstraint.mode === "auto") {
        tiltConstraint.autoUpdate(mathUtils.rad2deg(maxTilt));
      }
    },

    // User constraints
    _disconnectUserConstraints: function() {
      if (!this._userConstraints) {
        return;
      }

      this._userConstraintsHandles.forEach(function(handle) {
        handle.remove();
      });

      this._userConstraints = null;
      this._userConstraintsHandles.length = 0;

      var mapUnitInMeters = this.mapUnitInMeters;

      this.constraints.tilt = ConstraintsMixin.Tilt.scale(this.defaultConstraints.tilt, mapUnitInMeters);
      this.constraints.altitude = ConstraintsMixin.Altitude.scale(this.defaultConstraints.altitude, mapUnitInMeters);
    },

    _connectUserConstraints: function(constraints) {
      if (!constraints) {
        return;
      }

      this._userConstraints = constraints;

      this._userConstraintsHandles.push(
        watchUtils.init(constraints, "tilt.mode", this._tiltModeHandler),
        watchUtils.init(constraints, "clipDistance.mode", this._clipDistanceModeHandler),
        watchUtils.init(constraints, "altitude.mode", this._altitudeModeHandler),
        watchUtils.init(constraints, "collision.enabled", this._collisionEnabledHandler)
      );
    },

    _camerasChanged: function() {
      this.targetChanged();
      this.currentChanged();

      if (this.currentHasReachedTarget()) {
        this.currentReachedTarget();
      }
    },

    _reapplyConstraints: function() {
      var changed = false;

      if (this.applyConstraints(this.cameras.current)) {
        changed = true;
      }
      
      if (this.applyConstraints(this.cameras.target)) {
        changed = true;
      }

      if (changed) {
        this._camerasChanged();
      }
    },

    _userConstraintsChanged: function() {
      this._reapplyConstraints();
    },

    _altitudeMinMaxHandler: function(newValue, oldValue, name) {
      this._userConstraintsChanged();
    },

    _tiltMaxHandler: function(newValue, oldValue, name) {
      this._userConstraintsChanged();
    },

    _tiltModeHandler: function(mode) {
      this._tiltHandles.forEach(function(handle) {
        handle.remove();
      });

      this._tiltHandles.length = 0;

      if (mode === "auto") {
        this.constraints.tilt = ConstraintsMixin.Tilt.scale(this.defaultConstraints.tilt, this.mapUnitInMeters);
      } else {
        this._tiltHandles.push(
          this._userConstraints.watch("tilt.max", this._tiltMaxHandler)
        );

        this.constraints.tilt = userTiltConstraint(this._userConstraints);
      }

      this._tiltMaxHandler();
    },

    _altitudeModeHandler: function(mode) {
      this._altitudeHandles.forEach(function(handle) {
        handle.remove();
      });

      this._altitudeHandles.length = 0;

      if (mode === "auto") {
        this.constraints.altitude = ConstraintsMixin.Altitude.scale(this.defaultConstraints.altitude, this.mapUnitInMeters);
        this._autoUpdateAltitudeConstraint();
      } else {
        this._altitudeHandles.push(
          this._userConstraints.watch("altitude.min", this._altitudeMinMaxHandler),
          this._userConstraints.watch("altitude.max", this._altitudeMinMaxHandler)
        );

        this.constraints.altitude = userAltitudeConstraint(this._userConstraints);
      }

      this._altitudeMinMaxHandler();
    },

    _collisionEnabledHandler: function(newValue, oldValue, name) {
      this.constraints.collision = userCollisionConstraint(this._userConstraints);
      this._userConstraintsChanged();
    },

    _clipDistanceNearFarHandler: function(newValue, oldValue, name) {
      if (this._userConstraints.clipDistance.mode !== "auto") {
        this.cameras.target.near = this._userConstraints.clipDistance.near;
        this.cameras.target.far = this._userConstraints.clipDistance.far;

        this.cameras.current.near = this._userConstraints.clipDistance.near;
        this.cameras.current.far = this._userConstraints.clipDistance.far;
      }

      this._camerasChanged();
    },

    _clipDistanceModeHandler: function(mode) {
      this._clipDistanceHandles.forEach(function(handle) {
        handle.remove();
      });

      this._clipDistanceHandles.length = 0;

      if (mode !== "auto") {
        this._clipDistanceHandles.push(
          this._userConstraints.watch(["clipDistance.near", "clipDistance.far"], this._clipDistanceNearFarHandler)
        );
      }

      this._clipDistanceNearFarHandler();
    },

    _updateAutoNearFar: function(camera) {
      var clipDistanceConstraint = this._userConstraints && this._userConstraints.clipDistance;

      if (clipDistanceConstraint && clipDistanceConstraint.mode !== "auto") {
        return;
      }

      var mapUnitInMeters = this.mapUnitInMeters;
      var silhouette = this.distanceToSilhouette(camera, this.view.fullExtent, mapUnitInMeters, this._getTerrainElevationBelowCamera(camera), tmpSilhouette);

      camera.far = silhouette.distance / mapUnitInMeters;

      if (camera.far / silhouette.maxFarNearRatio > this.minNearDistance) {
        camera.near = camera.far / silhouette.maxFarNearRatio;
      }
      else {
        camera.near = this.minNearDistance;
        camera.far = camera.near * silhouette.maxFarNearRatio;
      }

      if (clipDistanceConstraint && camera === this.cameras.current) {
        clipDistanceConstraint.autoUpdate(camera.near, camera.far);
      }
    },

    /* Elevation constraints */
    constrainTargetEyeByElevation: function(restoreIfPossible) {
      if (!this.elevationProvider || !this.elevationProvider.spatialReference) {
        return false;
      }

      var camera = this.cameras.target;

      if (restoreIfPossible) {
        this._targetCameraBeforeElevationUpdate.copyFrom(camera);
      }

      var changed = this._applyTargetEyeElevationConstraint(camera.eye, this._getTerrainElevationBelowCamera(camera));

      return changed;
    },

    constrainTargetEyeByElevationAndMoveLookAt: function() {
      vec3d.set(this.cameras.target.eye, tmpP);

      if (this.constrainTargetEyeByElevation()) {
        vec3d.subtract(tmpP, this.cameras.target.eye);
        vec3d.subtract(this.cameras.target.center, tmpP);
      }
    },

    targetChanged: function(interruptedAnimation) {
      this.inherited(arguments);

      this._targetCameraChangedByElevationUpdate = false;
      this._updateAutoNearFar(this.cameras.target);
    },

    currentChanged: function() {
      // important: near/far needs to be updated before calling inherited(), because CamerasMixin::currentChange() is
      // in the inheritance chain and should send out the currentViewReachedTarget event with the updated near/far
      this._updateAutoNearFar(this.cameras.current);

      this.inherited(arguments);
    },

    _applyTargetEyeElevationConstraint: function(eye, terElev) {
      if (!this.constraintsEnabled) {
        return false;
      }

      var rcoords = this.renderCoordsHelper;
      var camElev = rcoords.getAltitude(eye);

      var collide = this.constraints.collision.enabled;

      if (collide && camElev - terElev < this.cameraElevationMargin) {
        // Note, this sets targetCam.eye directly
        rcoords.setAltitude(terElev + this.cameraElevationMargin, eye, 0);
        return true;
      }

      return false;
    },

    _cameraElevationAngle: function(cam, ret) {
      ret = ret || {
        tilt: 0,
        distance: 0
      };

      // compute world up vector at pivot position
      this.renderCoordsHelper.worldUpAtPosition(cam.center, tmpWorldUp);

      // compute current elevation angle
      vec3d.subtract(cam.eye, cam.center, tmpViewDir);
      var viewDistance = vec3d.length(tmpViewDir);

      var tilt = Math.acos(vec3d.dot(tmpViewDir, tmpWorldUp) /
        viewDistance / vec3d.length(tmpWorldUp));

      ret.tilt = tilt;
      ret.distance = viewDistance;

      return ret;
    },

    _elevationChangeTileHandler: function(event) {
      if (!this.enableElevationUpdates || !this._targetCameraChangedByElevationUpdate || !this.constraintsEnabled) {
        return;
      }

      var rcoords = this.renderCoordsHelper,
        mapSR = this.mapCoordsHelper.spatialReference;
      var targetChanged = false;
      var ext = event.tile.extent;

      // Check to pull the camera back down after having it pushed back up
      var eye = this._targetCameraBeforeElevationUpdate.eye;
      var camPosPoint = rcoords.fromRenderCoords(eye, mapSR);

      if ((ext[0] < camPosPoint.x) && (ext[1] < camPosPoint.y) &&
          (ext[2] > camPosPoint.x) && (ext[3] > camPosPoint.y)) {

        tmpCam.copyFrom(this.cameras.target);
        this.cameras.target.copyFrom(this._targetCameraBeforeElevationUpdate);

        this.constrainTargetEyeByElevation();

        targetChanged = !tmpTargetCamera.equals(this.cameras.target);

        targetChanged = this.applyConstraints(this.cameras.target) || targetChanged;
      }

      if (targetChanged) {
        this.targetChanged();
        this._targetCameraChangedByElevationUpdate = true;
      }
    },

    _elevationChangeHandler: function(event) {
      if (!this.enableElevationUpdates || !this.constraintsEnabled) {
        return;
      }

      var rcoords = this.renderCoordsHelper,
        mapSR = this.mapCoordsHelper.spatialReference;
      var eye = this.cameras.target.eye;
      var targetChanged = false;
      var ext = event.extent;

      var camPosPoint = rcoords.fromRenderCoords(eye, mapSR);

      // Check to bump up the camera to avoid falling under the terrain
      if ((ext[0] < camPosPoint.x) && (ext[1] < camPosPoint.y) &&
          (ext[2] > camPosPoint.x) && (ext[3] > camPosPoint.y)) {

        if (!this._targetCameraChangedByElevationUpdate) {
          this._targetCameraBeforeElevationUpdate.copyFrom(this.cameras.target);
        }

        targetChanged = this._applyTargetEyeElevationConstraint(eye, this._getTerrainElevationBelowCamera(this.cameras.target));
      }

      if (targetChanged) {
        this.targetChanged();
        this._targetCameraChangedByElevationUpdate = true;
      }

      if (!this._recomputeTargetCenterForElevationChange) {
        // any height changes between lookat point and camera position?
        var lookatPoint = rcoords.fromRenderCoords(this.cameras.target.center, mapSR);

        var maxX = Math.max(lookatPoint.x, camPosPoint.x);
        var minX = Math.min(lookatPoint.x, camPosPoint.x);
        var maxY = Math.max(lookatPoint.y, camPosPoint.y);
        var minY = Math.min(lookatPoint.y, camPosPoint.y);

        // CHECKME: this might be expensive just to check if it intersects
        var intX = IntervalUtilities.intersectIntervals([[minX, maxX]], [[ext[0], ext[2]]]);
        var intY = IntervalUtilities.intersectIntervals([[minY, maxY]], [[ext[1], ext[3]]]);

        if (intX.length > 0 && intY.length > 0) {
          // mark for recomputation of the camera center based on the elevation.
          // note that the recomputation is delayed until the next step of
          // the navigation (see .step).
          this._recomputeTargetCenterForElevationChange = true;
        }
      }
    },

    _getTerrainElevationBelowCamera: function(camera) {
      if (!this.elevationProvider || !this.elevationProvider.spatialReference) {
        this._terrainElevationBelowCamera = 0;
      }
      else if (this._terrainElevationBelowCamera === null || this._terrainElevationAtCameraEye !== camera.eye) {
        var mapSR = this.elevationProvider.spatialReference;
        var camPosPoint = this.renderCoordsHelper.fromRenderCoords(camera.eye, mapSR);
        this._terrainElevationBelowCamera = this.elevationProvider.getElevation(camPosPoint) || 0;
        this._terrainElevationAtCameraEye = camera.eye;
      }
      return this._terrainElevationBelowCamera;
    },

    getCenterIntersectTerrain: function(eye, center, retval) {
      if (!retval) {
        retval = vec3d.create();
      }

      vec3d.set(center, retval);

      var selector = this.picker.pickAlongRay(eye, retval);

      if (!this.picker.pickedIntersectionPoint(selector, retval)) {
        // no intersection with terrain, try to intersect with sea-level sphere/plane
        if (!this.getCenterIntersectManifold(eye, center, retval)) {
          // no intersection with manifold, set POI magically based on
          // distance to silhouette
          this.getCenterIntersectTerrainFallback(eye, retval);
        }
      }

      return retval;
    },

    getCenterIntersectManifold: function(eye, center, retval) {
      vec3d.subtract(center, eye, retval);
      return this.intersectManifold(eye, retval, 0, retval);
    },

    getCameraIntersectTerrain: function(eye, center, up, threshold) {
      var ret = this.cameras.current.copy();

      if (eye) {
        ret.eye = eye;
      }

      if (center) {
        ret.center = center;
      }

      if (up) {
        ret.up = up;
      }

      this.getCenterIntersectTerrain(ret.eye, ret.center, tmpLookAtPos);

      if (vec3d.dist2(ret.eye, tmpLookAtPos) < this.minPoiDist && this.constraintsEnabled) {
        // Move eye up so we don't get numerical issues
        vec3d.scale(ret.computeDirection(tmpViewDir), this.minPoiDist);
        vec3d.subtract(tmpLookAtPos, tmpViewDir, ret.eye);

        var rcoords = this.renderCoordsHelper;

        // Move both out to have minimal elevation
        var camElev = rcoords.getAltitude(ret.eye);

        var collide = this.constraints.collision.enabled;

        if (collide && camElev < this.cameraElevationMargin) {
          vec3d.subtract(tmpLookAtPos, ret.eye, tmpViewDir);

          rcoords.setAltitude(this.cameraElevationMargin, ret.eye);
          vec3d.add(ret.eye, tmpViewDir, tmpLookAtPos);
        }

        ret.markViewDirty();
      }

      if (threshold > 0) {
        var curDist = vec3d.dist(ret.eye, ret.center);
        var centerDelta = vec3d.dist(tmpLookAtPos, ret.center);

        if (centerDelta > curDist * threshold) {
          ret.center = tmpLookAtPos;
        }
      }
      else {
        ret.center = tmpLookAtPos;
      }

      return ret;
    }
  });

  ConstraintsMixin.Tilt = function(funcs) {
    this.min = funcs.min;
    this.max = funcs.max;
  };

  ConstraintsMixin.Tilt.scale = function(constraint, mapUnitInMeters) {
    if (mapUnitInMeters === 1) {
      return constraint;
    }

    return new ConstraintsMixin.Tilt({
      min: function(distance) {
        return constraint.min(distance * mapUnitInMeters);
      },

      max: function(distance) {
        return constraint.max(distance * mapUnitInMeters);
      }
    });
  };

  ConstraintsMixin.Tilt.prototype.apply = function(tilt, distance) {
    return mathUtils.clamp(tilt, this.min(distance), this.max(distance));
  };

  ConstraintsMixin.Altitude = function(funcs) {
    this.min = funcs.min;
    this.max = funcs.max;
  };

  ConstraintsMixin.Altitude.scale = function(constraint, mapUnitInMeters) {
    if (mapUnitInMeters === 1) {
      return constraint;
    }

    return new ConstraintsMixin.Altitude({
      min: function(navigation) {
        return constraint.min(navigation) / mapUnitInMeters;
      },
      max: function(navigation) {
        return constraint.max(navigation) / mapUnitInMeters;
      }
    });
  };

  ConstraintsMixin.Altitude.prototype.apply = function(navigation, altitude) {
    return mathUtils.clamp(altitude, this.min(navigation), this.max(navigation));
  };

  ConstraintsMixin.Collision = function(value) {
    this.enabled = (value != null) ? value : true;
  };

  function userTiltConstraint(constraints) {
    return new ConstraintsMixin.Tilt({
      min: function() {
        // If this gets changed, please also update SceneViewTiltConstraint
        return 0.01;
      },
      max: function() {
        return mathUtils.deg2rad(constraints.tilt.max);
      }
    });
  }

  function userAltitudeConstraint(constraints) {
    return new ConstraintsMixin.Altitude({
      min: function() {
        return constraints.altitude.min;
      },
      max: function() {
        return constraints.altitude.max;
      }
    });
  }

  function userCollisionConstraint(constraints) {
    return new ConstraintsMixin.Collision(constraints.collision.enabled);
  }

  return ConstraintsMixin;
});
