define([
  "../../../../core/declare",
  "../../../../core/Evented",
  "../../../../geometry/Point",
  "../../webgl-engine/lib/Camera",
  "../../support/earthUtils",
  "../../support/mathUtils",
  "../../lib/glMatrix",
  "dojo/on"
], function(
  declare, Evented,
  Point,
  Camera,
  earthUtils,
  mathUtils,
  glMatrix,
  on
) {

  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;

  var LARGE_AREA_FRAME = 100000; // 100km

  var tmpPoint = new Point();
  var tmpP = vec3d.create();
  var tmpViewDir = vec3d.create();
  var tmpWorldUp = vec3d.create();
  var tmpPadding = vec4d.create();

  var CamerasMixin = declare([Evented], {
    declaredClass: "esri.views.3d.navigation.mixins.CamerasMixin",

    classMetadata: {
      properties: {
        targetCamera: {
          getter: function() {
            return this.cameras.target;
          }
        },

        currentCamera: {
          getter: function() {
            return this.cameras.current;
          }
        },

        windowSize: {
          setter: function(size) {
            var width = size[0];
            var height = size[1];

            var update = false;

            var targetX = this.cameras.target.x - this.cameras.target.padding[3];
            var targetY = this.cameras.target.y - this.cameras.target.padding[2];

            if (this.cameras.target.width + targetX !== width ||
                this.cameras.target.height + targetY !== height) {
              this.cameras.target.width = width - targetX;
              this.cameras.target.height = height - targetY;

              this.targetChanged();
              update = true;
            }

            var curX = this.cameras.current.x - this.cameras.current.padding[3];
            var curY = this.cameras.current.y - this.cameras.current.padding[2];

            if (this.cameras.current.width + curX !== width ||
                this.cameras.current.height + curY !== height) {
              this.cameras.current.width = width - curX;
              this.cameras.current.height = height - curY;

              this.currentChanged();
              update = true;
            }

            if (update && this.currentHasReachedTarget()) {
              this.currentReachedTarget();
            }

            return size;
          }
        },

        padding: {
          setter: function(padding) {
            var targetChanged = false;
            var currentChanged = false;

            tmpPadding[0] = padding.top;
            tmpPadding[1] = padding.right;
            tmpPadding[2] = padding.bottom;
            tmpPadding[3] = padding.left;

            if (!mathUtils.vectorEquals(this.cameras.current.padding, tmpPadding)) {
              this.cameras.current.padding = tmpPadding;
              currentChanged = true;
            }

            if (!mathUtils.vectorEquals(this.cameras.target.padding, tmpPadding)) {
              this.cameras.target.padding = tmpPadding;
              targetChanged = true;
            }

            if (targetChanged) {
              this.targetChanged();
            }

            if (currentChanged) {
              this.currentChanged();
            }

            if (this.currentHasReachedTarget() && (targetChanged || currentChanged)) {
              this.currentReachedTarget();
            }
          }
        }
      }
    },

    initialize: function() {
      var camera = new Camera(vec3d.createFrom(earthUtils.earthRadius * 4, 0, 0),
                              vec3d.createFrom(earthUtils.earthRadius, 0, 0),
                              vec3d.createFrom(0, 0, 1));
      this.cameras = {
        current: camera,
        target: camera.copy()
      };
    },

    currentHasReachedTarget: function() {
      return this.cameras.current.equals(this.cameras.target);
    },

    currentHasAlmostReachedTarget: function() {
      return this.cameras.current.almostEquals(this.cameras.target, 0.0005 / this.mapUnitInMeters);
    },
    
    setCamera: function(camera, options) {
      // TODO: cleanup to not access stuff from ConstraintsMixin
      if (this.pan && this.pan.continuous) {
        this.pan.continuous.stop();
      }

      this.cameras.target.copyFrom(camera);

      var internalUpdate = options && options.internalUpdate;
      var trackElevationUpdate = !internalUpdate || !this._targetCameraChangedByElevationUpdate;

      var changed = this.constrainTargetEyeByElevation(trackElevationUpdate);
      changed = this.applyConstraints(this.cameras.target, true) || changed;

      this.fixTargetUpVector();

      if (this.currentHasReachedTarget()) {
        this.targetChanged();

        if (changed && trackElevationUpdate) {
          this._targetCameraChangedByElevationUpdate = true;
        }

        this.currentReachedTarget();
        return;
      }

      if (options !== undefined && options.animate !== undefined && !options.animate) {
        this.targetAndCurrentChanged();
      } else {
        this.targetAnimatedChanged();
      }

      if (changed && trackElevationUpdate) {
        this._targetCameraChangedByElevationUpdate = true;
      }

      this._autoUpdateTiltConstraint();
    },

    getTargetCamera: function() {
      console.warn("[Navigation.getTargetCamera()] deprecated; use .targetCamera instead");
      return this.targetCamera;
    },

    getCurrentCamera: function() {
      console.warn("[Navigation.getCurrentCamera()] deprecated; use .currentCamera instead");
      return this.currentCamera;
    },

    _cameraFromEyeCenterUp: function(eye, center, up) {
      var cam = this.cameras.target.copy();

      cam.eye = eye;
      cam.center = center;
      cam.up = up;

      return cam;
    },

    setCameraFromEyeAndCenter: function(eye, center, options) {
      this.setCamera(this._cameraFromEyeCenterUp(eye, center, this.cameras.target.up), options);
    },

    setCameraFromEyeCenterAndUp: function(eye, center, up, options) {
      this.setCamera(this._cameraFromEyeCenterUp(eye, center, up), options);
    },

    _frameAboveGround: function(ctr, radius) {
      var rcoords = this.renderCoordsHelper,
        mapSR = this.mapCoordsHelper.spatialReference;

      rcoords.fromRenderCoords(ctr, tmpPoint, mapSR);
      tmpPoint.z = Math.max(tmpPoint.z, this.elevationProvider.getElevation(tmpPoint) || 0);

      rcoords.toRenderCoords(tmpPoint, tmpP);
      return tmpP;
    },

    preserveHeadingTiltFrame: function(ctr) {
      // N/I: mode dependent
    },

    // TODO: replace with animateTo in view
    frame: function(ctr, distance) {
      ctr = this._frameAboveGround(ctr, distance);

      if (this.pan && this.pan.continuous) {
        this.pan.continuous.stop();
      }

      distance = Math.max(distance, this.minPoiDist);

      var largeAreaFrame = LARGE_AREA_FRAME / this.mapUnitInMeters;

      if (distance < largeAreaFrame) {
        this.preserveHeadingTiltFrame(ctr);

        vec3d.subtract(this.cameras.target.eye, this.cameras.target.center, tmpViewDir);
        vec3d.normalize(tmpViewDir);
        vec3d.scale(tmpViewDir, distance);
        vec3d.add(ctr, tmpViewDir, this.cameras.target.eye);
        vec3d.set(ctr, this.cameras.target.center);
      } else {
        this.renderCoordsHelper.worldUpAtPosition(ctr, tmpWorldUp);
        vec3d.scale(tmpWorldUp, distance, this.cameras.target.eye);
        vec3d.add(this.cameras.target.eye, ctr);
        vec3d.set(ctr, this.cameras.target.center);
      }

      this.fixTargetUpVector();
      this.targetAnimatedChanged();
    },

    frameStageObject: function(object) {
      // this method is intended for debug purpose only
      this.frame(object.getCenter(), this.cameras.target.computeDistanceFromRadius(object.getBSRadiusApprox(), 1.1));
    },

    _cameraEvents: {},

    _prepareCameraEvent: function(name, camera) {
      var ev = this._cameraEvents[name];

      if (!ev) {
        ev = {
          camera: new Camera()
        };

        this._cameraEvents[name] = ev;
      }

      ev.camera.copyFrom(camera);
      return ev;
    },

    emitWithCamera: function(name, camera) {
      on.emit(this, name, this._prepareCameraEvent(name, camera));
    },

    targetChanged: function(interruptedAnimation) {
      this.inherited(arguments);

      this.cameras.target.markViewDirty();

      var ev = this._prepareCameraEvent("targetViewChanged", this.cameras.target);
      ev.interruptedAnimation = !!interruptedAnimation;

      on.emit(this, "targetViewChanged", ev);
    },

    targetAnimatedChanged: function(interruptedAnimation) {
      this.targetChanged(interruptedAnimation);
      this.animationStarted();
    },

    targetAndCurrentChanged: function(interruptedAnimation) {
      this.targetChanged(interruptedAnimation);
      this.setCurrentToTarget();
    },

    currentChanged: function() {
      this.inherited(arguments);

      this.cameras.current.markViewDirty();
      this.emitWithCamera("currentViewChanged", this.cameras.current);
    },

    currentReachedTarget: function(finishedAnimation) {
      this.currentChanged();

      if (this.pan && this.pan.continuous && this.pan.continuous.active) {
        return;
      }

      var ev = this._prepareCameraEvent("currentViewReachedTarget", this.cameras.current);
      ev.finishedAnimation = !!finishedAnimation;

      on.emit(this, "currentViewReachedTarget", ev);
    },

    setCurrentToTarget: function(finishedAnimation) {
      this.cameras.current.copyFrom(this.cameras.target);
      this.currentReachedTarget(finishedAnimation);
    }
  });

  return CamerasMixin;
});
