define([
  "../../../core/Accessor",
  "../lib/glMatrix"
], function(
  Accessor,
  glMatrix
) {
  var vec3d = glMatrix.vec3d;

  var ContinuousAction = Accessor.createSubclass({
    classMetadata: {
      properties: {
        active: {
          getter: function() {
            return this.velocity !== 0;
          },

          dependsOn: ["velocity"],
          readOnly: true
        }
      }
    },

    constructor: function() {
      this.direction = vec3d.create();

      // m/s or radians/s
      this.velocity = 0;

      // s
      this.timer = 0;
      this.status = 0;
    },

    stop: function() {
      this.status = this.velocity = this.timer = 0;
      vec3d.set3(0, 0, 0, this.direction);
    },

    step: function(dt) {
      var x;

      if (this.timer > 0) {
        dt = Math.min(dt, this.timer);

        // Linear deceleration: v(t) = v_0 * (1 - t/d), where v_0 = initial velocity, d = duration until v=0
        // Integration: \int\limits_a^bv_0(1-\frac{t}{d}) = v_0\left(b-a+\frac{(a^2-b^2)}{2d}\right)
        // Bounds: a = 0, b = this.timer
        x = this.velocity * dt * (1 - dt / (2 * this.timer));

        this.velocity *= 1 - dt / this.timer;
        this.timer -= dt;
      } else {
        x = this.velocity * dt;
      }

      return x;
    }
  });

  return ContinuousAction;
});
