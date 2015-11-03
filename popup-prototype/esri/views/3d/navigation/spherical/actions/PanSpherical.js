/* jshint bitwise:false */
define([
  "./ActionSpherical",
  "../../mixins/PanMixin",
  "../../../lib/glMatrix",
  "../../../support/earthUtils",
  "../../../support/mathUtils",
  "../../../webgl-engine/lib/Util",
  "../../ContinuousAction",
  "../../NavigationConstants"
], function(
  ActionSpherical,
  PanMixin,
  glMatrix,
  earthUtils, mathUtils,
  Util,
  ContinuousAction, NavigationConstants
) {
  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var mat4d = glMatrix.mat4d;

  var tmpP0 = vec3d.create();
  var tmpP1 = vec3d.create();
  var tmpN = vec3d.create();
  var tmpIsect0 = vec3d.create();
  var tmpIsect1 = vec3d.create();
  var tmpAxis = vec3d.create();
  var tmpTransf = mat4d.create();

  var Mode = NavigationConstants.Pan.Mode;
  var Direction = NavigationConstants.Pan.Direction;
  var Vertical = NavigationConstants.Pan.Vertical;
  var Momentum = NavigationConstants.Pan.Momentum;

  var PanSpherical = ActionSpherical.createSubclass([PanMixin], {
    declaredClass: "esri.views.3d.navigation.spherical.actions.PanSpherical",

    constructor: function() {
      this._panMode = 0;
      this._lastPanActionPtr = 0;
      this._lastPanActions = [];
      this._plane = vec4d.create();

      this.continuous = new ContinuousAction();

      for (var i = 0; i < Momentum.BUFFER_SIZE; i++){
        this._lastPanActions[i] = {
          point: vec3d.create(),
          pointScreen: vec2d.create(),
          time: 0
        };
      }
    },

    begin: function(point, t) {
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

        if (!this.intersectManifold(this.currentCamera.eye, tmpP1, this._navSphereRadius - earthUtils.earthRadius, this._navPickPoint)) {
          // cursor outside of globe -> find closest silhouette point
          this.closestPointOnSphereSilhouette(this.currentCamera.eye, tmpP0, this._navSphereRadius, this._navPickPoint);
        }
      }

      var verticalPanning = false;
      var elevation = this.renderCoordsHelper.getAltitude(this.currentCamera.eye);

      if (elevation < Vertical.ELEVATION_THRESHOLD) {
        if (this._navSphereRadius > vec3d.length(this.currentCamera.eye)) {
          // picked point is higher than camera elevation
          verticalPanning = true;
        }
        else {
          // compute angle between camera, picked point, and up-vector at picked point
          vec3d.normalize(vec3d.subtract(this.targetCamera.eye, this._navPickPoint, tmpN));

          var angle = Math.abs(0.5 * Math.PI - Math.acos(vec3d.dot(this._navPickPoint, tmpN) / vec3d.length(this._navPickPoint)));
          verticalPanning = (angle < Vertical.ANGLE_THRESHOLD);
        }
      }

      if (verticalPanning) {
        // picked navigation point is above camera position
        this._panMode = Mode.VERTICAL; // do vertical (planar) panning
        vec3d.normalize(vec3d.subtract(this.targetCamera.eye, this.targetCamera.center, tmpN));
        this.updatePlane(this._navPickPoint, tmpN);
      } else {
        this._panMode = Mode.HORIZONTAL; // do horizontal (spherical) panning
        this._addToLastPanActions(t === undefined ? Util.performance.now() : t, this._navPickPoint, point);
      }

      vec2d.set(point, this._dragLastPoint);
      vec2d.set(point, this._dragBeginPoint);

      this._mouseDownCamera.copyFrom(this.targetCamera);
    },

    update: function(point, t) {
      if (this._panMode === Mode.HORIZONTAL) {
        // horizontal (spherical) panning
        if (this._navSphereRadius <= 0) {
          return;
        }

        this.createPickRay(point, this._dragBeginPoint, this._mouseDownCamera.viewMatrix, tmpP0, tmpP1);
        vec3d.subtract(tmpP1, this._mouseDownCamera.eye);

        if (!this.intersectManifold(this._mouseDownCamera.eye, tmpP1, this._navSphereRadius - earthUtils.earthRadius, this._targetOnSphere)) {
          // cursor outside of globe -> find closest silhouette point
          this.closestPointOnSphereSilhouette(this._mouseDownCamera.eye, tmpP0, this._navSphereRadius, this._targetOnSphere);
        }

        this.rotateCameraWithPointsOnSphere(this._navPickPoint, this._targetOnSphere, this._mouseDownCamera, this.targetCamera, this._navSphereRadius);
        this._addToLastPanActions(t === undefined ? Util.performance.now() : t, this._targetOnSphere, point);
      } else {
        // vertical (planar) panning
        this.createPickRay(this._dragLastPoint, this._dragBeginPoint, this.currentCamera.viewMatrix, tmpP0, tmpP1);
        vec3d.subtract(tmpP1, tmpP0);

        if (!Util.rayPlane(tmpP0, tmpP1, this._plane, tmpIsect0)) {
          return;
        }

        this.createPickRay(point, this._dragBeginPoint, this.currentCamera.viewMatrix, tmpP0, tmpP1);
        vec3d.subtract(tmpP1, tmpP0);

        if (!Util.rayPlane(tmpP0, tmpP1, this._plane, tmpIsect1)) {
          return;
        }

        vec3d.subtract(tmpIsect1, tmpIsect0);
        vec3d.subtract(this.targetCamera.eye, tmpIsect1);
        vec3d.subtract(this.targetCamera.center, tmpIsect1);

        vec2d.set(point, this._dragLastPoint);
      }

      this.constrainTargetEyeByElevationAndMoveLookAt();

      vec2d.set(point, this._dragLastPoint);
      this.fixTargetUpVector();
      this.targetAndCurrentChanged();

      this.inherited(arguments);
    },

    end: function(point, t) {
      if (this._panMode === Mode.HORIZONTAL) {
        this._initiateMomentumPanning(point, t);
      }
      
      this._navSphereRadius = 0;
      this.inherited(arguments);
    },

    _initiateMomentumPanning: function(point, t) {
      // check if user released mouse button while dragging -> momentum scrolling
      var ds = vec2d.dist(this._dragLastPoint, point);

      if ((ds > 0) && (this._navSphereRadius > 0)) {
        // perform last normal pan step
        this.update(point, t);

        // find window of recent pan actions which are no more than Momentum.INPUT_FILTER old
        var panActionWindowPtr = this._lastPanActionPtr;

        do {
          panActionWindowPtr = (panActionWindowPtr - 1 + Momentum.BUFFER_SIZE) % Momentum.BUFFER_SIZE;

          if (this._lastPanActions[this._lastPanActionPtr].time - this._lastPanActions[panActionWindowPtr].time > 1000*Momentum.INPUT_FILTER) {
            break;
          }
        } while (this._lastPanActionPtr !== panActionWindowPtr);

        panActionWindowPtr++;
        panActionWindowPtr %= Momentum.BUFFER_SIZE;

        if (panActionWindowPtr === this._lastPanActionPtr) {
          // last action is older than Momentum.INPUT_FILTER
          panActionWindowPtr = (this._lastPanActionPtr - 1 + Momentum.BUFFER_SIZE) % Momentum.BUFFER_SIZE;
        }

        // compute rotation between point at start and end of window
        var dt = 0.001 * (this._lastPanActions[this._lastPanActionPtr].time - this._lastPanActions[panActionWindowPtr].time);

        if (dt > 0) {
          var angle = this.rotationFromPointsOnSphere(this._lastPanActions[panActionWindowPtr].point,
                                                      this._lastPanActions[this._lastPanActionPtr].point,
                                                      this._navSphereRadius,
                                                      this.continuous.direction);

          this.continuous.velocity = angle / dt;

          // compute momentum scrolling duration from screen space velocity
          var p1 = vec2d.create(), p2 = vec2d.create();

          this.normalizeCoordinate(this._lastPanActions[panActionWindowPtr].pointScreen, p1);
          this.normalizeCoordinate(this._lastPanActions[this._lastPanActionPtr].pointScreen, p2);

          var fac = Math.min(vec2d.dist(p1, p2) / dt / Momentum.DURATION_LONG_VEL, 1.0);
          this.continuous.timer = Momentum.DURATION_SHORT + fac*(Momentum.DURATION_LONG - Momentum.DURATION_SHORT);

          this.animationStarted();
          return true;
        }
        else {
          this.currentReachedTarget();
        }
      } else {
        this.setPoiAuto(point, true);
      }

      return false;
    },

    beginContinuous: function(direction) {
      this.inherited(arguments);

      this.setCurrentToTarget();

      if (this.continuous.status === 0) {
        vec3d.set3(0, 0, 0, this.continuous.direction);
      }

      if (!(this.continuous.status & direction)) {
        this.continuous.status |= direction;

        if (direction & (Direction.LEFT | Direction.RIGHT | Direction.FORWARD | Direction.BACKWARD)) {
          this._computePanAxis(direction, tmpAxis);
          vec3d.add(this.continuous.direction, tmpAxis);
        } else {
          var updown = this.continuous.status & (Direction.UP | Direction.DOWN);

          if (updown === Direction.UP) {
            this.continuous.radiusChange = 1;
          } else if (updown === Direction.DOWN) {
            this.continuous.radiusChange = -1;
          } else {
            this.continuous.radiusChange = 0;
          }
        }

        this.continuous.velocity = this._computePanVelocity();
      }

      this.continuous.timer = 0;
    },

    updateContinuous: function(dt) {
      if (!this.continuous || !this.continuous.active) {
        return;
      }

      var angle = this.continuous.step(dt);
      var goingToPan = vec3d.dot(this.continuous.direction, this.continuous.direction) > 0.01;

      if (Math.abs(this.continuous.radiusChange) > 0) {
        var radScale = 1 + angle * this.continuous.radiusChange;

        vec3d.scale(this.targetCamera.center, radScale);
        vec3d.scale(this.targetCamera.eye, radScale);
        this.continuous.velocity = this._computePanVelocity();

        if (!goingToPan) {
          this.constrainTargetEyeByElevationAndMoveLookAt();
          this.targetAndCurrentChanged(true);
        }
      }

      if (goingToPan) {
        mat4d.identity(tmpTransf);
        mat4d.rotate(tmpTransf, angle, this.continuous.direction);
        mat4d.multiplyVec3(tmpTransf, this.targetCamera.eye);
        mat4d.multiplyVec3(tmpTransf, this.targetCamera.center);
        mat4d.multiplyVec3(tmpTransf, this.targetCamera.up);

        this.constrainTargetEyeByElevationAndMoveLookAt();
        this.fixTargetUpVector();
        this.targetAndCurrentChanged();
      }
    },

    endContinuous: function(direction) {
      this.continuous.status &= ~direction;

      if (this.continuous.status === 0) {
        this.continuous.stop();
        this.continuous.radiusChange = 0;
      } else {
        if (direction & (Direction.LEFT | Direction.RIGHT | Direction.FORWARD | Direction.BACKWARD)) {
          this._computePanAxis(direction, tmpAxis);
          vec3d.subtract(this.continuous.direction, tmpAxis);

          if (vec3d.length(this.continuous.direction) < 0.01) {
            vec3d.set3(0, 0, 0, this.continuous.direction);
          }
        } else {
          var updown = this.continuous.status & (Direction.UP | Direction.DOWN);

          if (updown == Direction.UP) {
            this.continuous.radiusChange = 1;
          } else if (updown == Direction.DOWN) {
            this.continuous.radiusChange = -1;
          } else {
            this.continuous.radiusChange = 0;
          }
        }
      }

      this.inherited(arguments);
    },

    _computePanAxis: function(direction, axis) {
      vec3d.subtract(this.targetCamera.center, this.targetCamera.eye, axis);
      vec3d.cross(axis, this.targetCamera.up); // axis points left

      if ((direction === Direction.LEFT) || (direction === Direction.RIGHT)) {
        vec3d.normalize(axis);
        vec3d.cross(axis, this.targetCamera.center); // axis points backward
      }

      if ((direction === Direction.RIGHT) || (direction === Direction.FORWARD)) {
        vec3d.negate(axis);
      }

      vec3d.normalize(axis);
    },

    _computePanVelocity: function() {
      var stepVel = 0.5 * Math.abs(vec3d.length(this.targetCamera.eye) - earthUtils.earthRadius);
      stepVel = mathUtils.clamp(stepVel, 1, 2 * earthUtils.earthRadius);

      return mathUtils.acos(1 - stepVel * stepVel / (2 * earthUtils.earthRadius * earthUtils.earthRadius));
    },

    _addToLastPanActions: function(time, point, pointScreen) {
      this._lastPanActionPtr = (this._lastPanActionPtr + 1) % 5;
      this._lastPanActions[this._lastPanActionPtr].time = time;
      vec3d.set(point, this._lastPanActions[this._lastPanActionPtr].point);
      vec2d.set(pointScreen, this._lastPanActions[this._lastPanActionPtr].pointScreen);
    },

    updatePlane: function(pos, normal) {
      vec4d.set4(normal[0], normal[1], normal[2],
                 -vec3d.dot(normal, pos), this._plane);
    }
  });

  return PanSpherical;
});
