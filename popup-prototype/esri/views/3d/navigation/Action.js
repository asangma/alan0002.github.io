define([
  "../../../core/Accessor",
  "../../../core/Evented",
  "../webgl-engine/lib/Camera",
  "../lib/glMatrix",
  "dojo/on"
], function(
  Accessor, Evented,
  Camera,
  glMatrix,
  on
) {
  var vec3d = glMatrix.vec3d;
  var vec2d = glMatrix.vec2d;

  var Action = Accessor.createSubclass([Evented], {
    classMetadata: {
      properties: {
        type: {},

        picker: {
          getter: function() {
            return this.navigation.picker;
          },
          readOnly: true
        },

        currentCamera: {
          getter: function() {
            return this.navigation.currentCamera;
          }
        },

        targetCamera: {
          getter: function() {
            return this.navigation.targetCamera;
          }
        },

        constraints: {
          getter: function() {
            return this.navigation.constraints;
          },

          readOnly: true
        },

        renderCoordsHelper: {
          getter: function() {
            return this.navigation.renderCoordsHelper;
          },

          readOnly: true
        },

        minPoiDist: {
          getter: function() {
            return this.navigation.minPoiDist;
          },

          readOnly: true
        }
      }
    },

    constructor: function(navigation) {
      this._tmpEvent = {
        type: null,
        phase: null,
        x: undefined,
        y: undefined
      };

      this._mouseDownCamera = new Camera();
      this._navPickPoint = vec3d.create();
      this._dragLastPoint = vec2d.create();
      this._dragBeginPoint = vec2d.create();

      this.navigation = navigation;

      var bind = ["minPoiDist", "renderCoordsHelper", "constraints", "picker"];

      var action = this;

      bind.forEach(function(prop) {
        navigation.watch(prop, function() {
          action.notifyChange(prop);
        });
      });

      this.active = false;
    },

    emit: function(phase, x, y) {
      this._tmpEvent.type = this.type;
      this._tmpEvent.phase = phase;

      this._tmpEvent.x = x;
      this._tmpEvent.y = y;

      on.emit(this, phase, this._tmpEvent);
      on.emit(this.navigation, this.type, this._tmpEvent);
    },

    intersectManifold: function(p0, dir, elevation, outResult) {
      return this.navigation.intersectManifold(p0, dir, elevation, outResult);
    },

    fixTargetUpVector: function() {
      return this.navigation.fixTargetUpVector();
    },

    setPoiAuto: function(point, currentToTarget) {
      return this.navigation.setPoiAuto(point, currentToTarget);
    },

    normalizeCoordinate: function(point, result) {
      result[0] = point[0] / this.currentCamera.width;
      result[1] = point[1] / this.currentCamera.height;
    },

    worldUpAtPosition: function(pos, upOut) {
      return this.renderCoordsHelper.worldUpAtPosition(pos, upOut);
    },

    applyConstraints: function(cam, onlyMinTilt) {
      return this.navigation.applyConstraints(cam, onlyMinTilt);
    },

    constrainTargetEyeByElevation: function(restoreIfPossible) {
      return this.navigation.constrainTargetEyeByElevation(restoreIfPossible);
    },

    constrainTargetEyeByElevationAndMoveLookAt: function() {
      return this.navigation.constrainTargetEyeByElevationAndMoveLookAt();
    },

    targetAndCurrentChanged: function(interruptedAnimation) {
      return this.navigation.targetAndCurrentChanged(interruptedAnimation);
    },

    targetAnimatedChanged: function(interruptedAnimation) {
      return this.navigation.targetAnimatedChanged(interruptedAnimation);
    },

    currentReachedTarget: function(finishedAnimation) {
      return this.navigation.currentReachedTarget(finishedAnimation);
    },

    setCurrentToTarget: function() {
      return this.navigation.setCurrentToTarget();
    },

    animationStarted: function() {
      return this.navigation.animationStarted();
    },

    limitAltitude: function(poiDist, poi, ray, rayLength) {
      return this.navigation.limitAltitude(poiDist, poi, ray, rayLength);
    },

    limitTiltByConstraints: function(tilt, poi, distance, direction) {
      return this.navigation.limitTiltByConstraints(tilt, poi, distance, direction);
    },

    // Create a pick ray
    createPickRay: function(p0, p1, viewMatrix, outP0, outP1) {
      return this.picker.createPickRay(p0, p1, viewMatrix, outP0, outP1);
    },

    // Pick along a 3d ray and return the picking selector
    pickAlongRay: function(p0, p1, pScreen, pointOnSide, layerIds, objectIds, isSelection) {
      return this.picker.pickAlongRay(p0, p1, pScreen, pointOnSide, layerIds, objectIds, isSelection);
    },

    // Pick point in screen and return the resulting 3d point
    pickPointInScreen: function(point, outP) {
      return this.picker.pickPointInScreen(point, outP);
    },

    // Pick point in screen and return the resulting 3d point (ignoring any terrain or features)
    pickFreePointInScreen: function(point, outP) {
      return this.picker.pickFreePointInScreen(point, outP);
    },

    // Pick along ray from point into the screen and return the picking selector
    pickInScreen: function(point) {
      return this.picker.pickInScreen(point);
    }
  });

  return Action;
});
