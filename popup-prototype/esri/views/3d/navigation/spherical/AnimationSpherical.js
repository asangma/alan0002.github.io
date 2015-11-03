define([
  "../mixins/AnimationMixin",
  "../../lib/glMatrix",
  "../../support/mathUtils"
], function(
  AnimationMixin,
  glMatrix,
  mathUtils
) {

  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var tmpPadding = vec4d.create();

  // less than 10cm difference when performing translation instead of
  // rotation along the earth surface
  var SMALL_ANGLE = 0.0001;

  function vec4ddist2(v1, v2) {
    var x = v2[0] - v1[0],
        y = v2[1] - v1[1],
        z = v2[2] - v1[2],
        w = v2[3] - v1[3];

    return x * x + y * y + z * z + w * w;
  }

  function vec4ddist(v1, v2) {
    return Math.sqrt(vec4ddist2(v1, v2));
  }

  var AnimationSpherical = AnimationMixin.createSubclass({
    declaredClass: "esri.views.3d.navigation.spherical.AnimationSpherical",
    
    constructor: function() {
      this.interpolationTypes = {
        linear: Linear,
        easeInOut: EaseInOut
      };
    }
  });

  function Linear(navigation) {
    this.interpolate = function(curCam, targetCam, dt) {
      var w = Math.min(9.0 * dt, 0.3); //tweak mousewheel zooming here

      mathUtils.slerpOrLerp(curCam.center, targetCam.center, w, curCam.center, SMALL_ANGLE);
      mathUtils.slerpOrLerp(curCam.eye, targetCam.eye, w, curCam.eye, SMALL_ANGLE);
      mathUtils.slerp(curCam.up, targetCam.up, w);

      curCam.fov = mathUtils.lerp(curCam.fov, targetCam.fov, w);
      curCam.padding = vec4d.lerp(curCam.padding, targetCam.padding, w, tmpPadding);

      curCam.computeUpOnSphere();
    };
  }

  function EaseInOut(navigation, targetSpeed, acceleration) {
    targetSpeed = targetSpeed || 250.0;
    acceleration = acceleration || targetSpeed;

    var speed = 0;
    var speedTarget = 0;
    //var speedUp = 0;
    var speedFov = 0;
    var speedPadding = 0;

    var interpLinear = function(position, target, dt, speed, cls) {
      return navigation.easeInOutInterpLinear(acceleration, targetSpeed, position, target, dt, speed, cls);
    };

    var interp = function(position, target, dt, speed) {
      var dist = vec3d.dist(position, target);

      if (dist < 0.1) {
        vec3d.set(target, position);
        return 0;
      }

      var maxSpeed = Math.min(Math.sqrt(dist * acceleration), targetSpeed);
      speed = Math.min(speed + acceleration * dt, maxSpeed);

      var w = Math.min(speed / dist * dt, 1.0);

      mathUtils.slerpOrLerp(position, target, w, position, SMALL_ANGLE);

      return speed;
    };

    this.interpolate = function(curCam, targetCam, dt) {
      speed = interp(curCam.eye, targetCam.eye, dt, speed);
      speedTarget = interp(curCam.center, targetCam.center, dt, speedTarget);

      speedPadding = interp(curCam.padding, targetCam.padding, dt, speedPadding, {
        dist: vec4ddist,

        lerp: function(from, to, w) {
          return vec4d.lerp(from, to, w, tmpPadding);
        },

        set: function(value) {
          curCam.padding = value;
        }
      });

      speedFov = interpLinear(curCam.fov, targetCam.fov, dt, speedFov, {
        dist: function(a, b) { return Math.abs(b - a); },

        lerp: mathUtils.lerp,

        set: function(value) {
          curCam.fov = value;
        }
      });

      curCam.computeUpOnSphere();
    };
  }

  return AnimationSpherical;
});
