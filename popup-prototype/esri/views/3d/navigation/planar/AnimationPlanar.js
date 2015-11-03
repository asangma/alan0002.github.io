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

  var AnimationPlanar = AnimationMixin.createSubclass({
    declaredClass: "esri.views.3d.navigation.planar.AnimationPlanar",

    constructor: function() {
      this.interpolationTypes = {
        linear: Linear,
        easeInOut: EaseInOut
      };
    }
  });

  function Linear(navigation) {
    this.interpolate = function(curCam, targetCam, dt) {
      var w = Math.min(5.0 * dt, 0.3);
      vec3d.lerp(curCam.eye, targetCam.eye, w);
      vec3d.lerp(curCam.center, targetCam.center, w);
      vec3d.lerp(curCam.up, targetCam.up, w);
      curCam.fov = mathUtils.lerp(curCam.fov, targetCam.fov, w);
      curCam.padding = vec4d.lerp(curCam.padding, targetCam.padding, w, tmpPadding);
    };
  }

  function EaseInOut(navigation, targetSpeed, acceleration) {
    targetSpeed = targetSpeed || 250.0;
    acceleration = acceleration || targetSpeed;

    var speed = 0;
    var speedTarget = 0;
    var speedUp = 0;
    var speedFov = 0;
    var speedPadding = 0;

    var interp = function(position, target, dt, speed, cls) {
      return navigation.easeInOutInterpLinear(acceleration, targetSpeed, position, target, dt, speed, cls);
    };

    this.interpolate = function(curCam, targetCam, dt) {
      speed = interp(curCam.eye, targetCam.eye, dt, speed, vec3d);
      speedTarget = interp(curCam.center, targetCam.center, dt, speedTarget, vec3d);
      speedUp = interp(curCam.up, targetCam.up, dt, speedUp, vec3d);

      speedPadding = interp(curCam.padding, targetCam.padding, dt, speedPadding, {
        dist: vec4ddist,
        lerp: function(from, to, w) {
          return vec4d.lerp(from, to, w, tmpPadding);
        },
        set: function(value) {
          curCam.padding = value;
        }
      });

      speedFov = interp(curCam.fov, targetCam.fov, dt, speedFov, {
        dist: function(a, b) { return Math.abs(b - a); },
        lerp: mathUtils.lerp,
        set: function(value) {
          curCam.fov = value;
        }
      });
    };
  }

  return AnimationPlanar;
});
