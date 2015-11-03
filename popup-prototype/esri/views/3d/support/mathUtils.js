define([
  "../lib/glMatrix"
], function(glMatrix) {
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var slerpAxis = vec3d.create();
  var slerpTrafo = mat4d.create();

  var mathUtils = {
    deg2rad: function(d) {
      return d*Math.PI/180.0;
    },

    rad2deg: function(r) {
      return 180.0*r/Math.PI;
    },

    // the value may be not in the scope [-1,1] because of the floating computation, e.g. 1.0000000000000002
    asin: function(value) {
      var v = (value>1)?1:((value<-1)?-1:value);
      return Math.asin(v);
    },

    acos: function(value) {
      var v = (value>1)?1:((value<-1)?-1:value);
      return Math.acos(v);
    },

    fovx2fovy: function(fovx, width, height) {
      return 2.0 * Math.atan(height * Math.tan(fovx * 0.5) / width);
    },

    fovy2fovx: function(fovy, width, height) {
      return 2.0 * Math.atan(width * Math.tan(fovy * 0.5) / height);
    },

    // linear interpolation
    lerp: function(number0, number1, w) {
      return number0 + (number1 - number0) * w;
    },

    // spherical interpolation
    slerp: function(v1, v2, t, dest) {
      if (!dest) {
        dest = v1;
      }

      var l1 = vec3d.length(v1);
      var l2 = vec3d.length(v2);
      var dot = vec3d.dot(v1, v2) / l1 / l2;

      if (dot < 0.999999999999) {
        vec3d.cross(v1, v2, slerpAxis);
        mat4d.identity(slerpTrafo);
        mat4d.rotate(slerpTrafo, t * Math.acos(dot), slerpAxis);
        mat4d.multiplyVec3(slerpTrafo, v1, dest);
      }

      var scaleFact = ((1 - t) * l1 + t * l2) / l1;
      vec3d.scale(dest, scaleFact);
    },

    // Similar to slerp() but performs linear interpolation if rotation angle is smaller than smallAngle
    slerpOrLerp: function(v1, v2, t, dest, smallAngle) {
      var l1 = vec3d.length(v1);
      var l2 = vec3d.length(v2);

      vec3d.cross(v1, v2, slerpAxis);

      if (vec3d.length(slerpAxis) / l1 / l2 > smallAngle) {
        var angle = Math.acos(vec3d.dot(v1, v2) / l1 / l2);

        mat4d.identity(slerpTrafo);
        mat4d.rotate(slerpTrafo, t * angle, slerpAxis);
        mat4d.multiplyVec3(slerpTrafo, v1, dest);

        var scaleFact = ((1 - t) * l1 + t * l2) / l1;
        vec3d.scale(dest, scaleFact);
      } else {
        vec3d.lerp(v1, v2, t, dest);
      }
    },

    // clamp number to [from, to]
    clamp: function(number, from, to) {
      if (number < from) {
        return from;
      }
      if (number > to) {
        return to;
      }
      return number;
    },

    // Usage: makePiecewiseLinearFunction([[x0, y0], [x1, y1], ...]);
    //    returns a function which takes one parameter x and returns the piecewise linear interpolation of f(xn) -> yn
    // Example:
    //    f = makePiecewiseLinearFunction([[1, 0], [2, 10], [3, 10], [4, 0]]);
    //    f(0)   // result: 0
    //    f(1)   // result: 0
    //    f(1.5) // result: 5
    //    f(2)   // result: 10
    //    f(2.5) // result: 10
    //    f(3.5) // result: 5
    //    f(4.5) // result: 0
    makePiecewiseLinearFunction: function(steps) {
      var numSteps = steps.length;
      return function(x) {
        var i = 0;
        if (x <= steps[0][0]) {
          return steps[0][1];
        }
        if (x >= steps[numSteps-1][0]) {
          return steps[numSteps-1][1];
        }
        while (x > steps[i][0]) {
          i++;
        }
        var x0 = steps[i-1][0],
          x1 = steps[i][0],
          t = (x1 - x) / (x1 - x0);
        return t*steps[i-1][1] + (1-t)*steps[i][1];
      };
    },

    vectorEquals: function(v0, v1) {
      if (v0 == null || v1 == null) {
        return v0 !== v1;
      }

      if (v0.length !== v1.length) {
        return false;
      }

      for (var i = 0; i < v0.length; i++) {
        if (v0[i] !== v1[i]) {
          return false;
        }
      }

      return true;
    },

    floatEqualRelative: function(p1, p2, epsilon) {
      if (epsilon === undefined) {
        epsilon = 1e-6;
      }

      if (isNaN(p1) || isNaN(p2)) {
        return false;
      }

      /* Implementation inspired by: http://floating-point-gui.de/errors/comparison/ */

      // Check exact equality first
      if (p1 === p2) {
        return true;
      }

      var diff = Math.abs(p1 - p2);
      var a1 = Math.abs(p1);
      var a2 = Math.abs(p2);

      if (p1 === 0 || p2 === 0 || (a1 < 1e-12 && a2 < 1e-12)) {
        // a or b is zero, or both are very close to it, using a relative
        // error doesn't make sense
        if (diff > 0.01 * epsilon) {
          return false;
        }
      } else {
        if (diff / (a1 + a2) > epsilon) {
          return false;
        }
      }

      return true;
    },

    floatEqualAbsolute: function(p1, p2, epsilon) {
      if (epsilon === undefined) {
        epsilon = 1e-6;
      }

      if (isNaN(p1) || isNaN(p2)) {
        return false;
      }

      var diff = p1 > p2 ? p1 - p2 : p2 - p1;

      return diff <= epsilon;
    },

    Cyclical: function(min, max) {
      this.min = min;
      this.max = max;
      this.range = max - min;

      this.ndiff = function(d, offset) {
        offset = offset || 0;

        return Math.ceil((d - offset) / this.range) * this.range + offset;
      };

      this._normalize = function(min, max, v, offset) {
        offset = offset || 0;

        v -= offset;

        if (v < min) {
          v += this.ndiff(min - v);
        } else if (v > max) {
          v -= this.ndiff(v - max);
        }

        return v + offset;
      };

      this.normalize = function(v, offset) {
        return this._normalize(this.min, this.max, v, offset);
      };

      this.clamp = function(v, offset) {
        offset = offset || 0;
        return mathUtils.clamp(v - offset, min, max) + offset;
      };

      this.monotonic = function(a, b, offset) {
        if (a < b) {
          return b;
        }

        return b + this.ndiff(a - b, offset);
      };

      this.minimalMonotonic = function(a, b, offset) {
        return this._normalize(a, a + this.range, b, offset);
      };

      this.center = function(from, to, offset) {
        to = this.monotonic(from, to, offset);
        return this.normalize((from + to) / 2, offset);
      };

      this.diff = function(from, to, offset) {
        return this.monotonic(from, to, offset) - from;
      };

      this.contains = function(min, max, value) {
        // Check if value lies within min/max
        max = this.minimalMonotonic(min, max);
        value = this.minimalMonotonic(min, value);

        return value > min && value < max;
      };
    }
  };

  mathUtils.cyclical2PI = new mathUtils.Cyclical(0, Math.PI * 2);
  mathUtils.cyclicalPI = new mathUtils.Cyclical(-Math.PI, Math.PI);
  mathUtils.cyclicalDeg = new mathUtils.Cyclical(0, 360);

  return mathUtils;
});
