define([
  "../../../../core/declare",
  "dojo/on"
], function(
  declare,
  on
) {

  var AnimationMixin = declare([], {
    declaredClass: "esri.views.3d.navigation.mixins.AnimationMixin",

    classMetadata: {
      properties: {
        interpolation: {
          setter: function(interpolation) {
            if (typeof interpolation === "string") {
              var InterpClass = this.interpolationTypes[interpolation];

              if (!InterpClass) {
                console.error("[AnimationMixin] Invalid interpolation type " + interpolation);
                return this.interpolation;
              }

              return new InterpClass(this);
            } else {
              return interpolation;
            }
          }
        }
      }
    },

    getDefaults: function() {
      return {
        interpolation: "linear"
      };
    },

    easeInOutInterpLinear: function(acceleration, targetSpeed, position, target, dt, speed, cls) {
      var dist = cls.dist(position, target);

      var isCloseThreshold = 0.1 / this.mapUnitInMeters;

      if (dist < isCloseThreshold) {
        cls.set(target, position);
        return 0;
      }

      var maxSpeed = Math.min(Math.sqrt(dist * acceleration), targetSpeed);
      speed = Math.min(speed + acceleration * dt, maxSpeed);

      var w = Math.min(speed / dist * dt, 1.0);
      cls.set(cls.lerp(position, target, w), position);

      return speed;
    },

    step: function(dt) {
      this.inherited(arguments);

      if (!this.currentHasReachedTarget()) {
        if (!this.currentHasAlmostReachedTarget()) {
          this.interpolation.interpolate(this.cameras.current, this.cameras.target, dt);
        }

        if (!this.currentHasAlmostReachedTarget()) {
          this.currentChanged();
        }
        else {
          this.setCurrentToTarget(true);
        }
      } else {
        this.pan.updateContinuous(dt);
      }
    },

    animationStarted: function() {
      on.emit(this, "animationStarted");
    },

    stop: function() {
      if (this.pan && this.pan.continuous) {
        this.pan.continuous.stop();
      }

      if (!this.currentHasAlmostReachedTarget()) {
        this.setCurrentToTarget();
      } else {
        this.currentReachedTarget(true);
      }
    }
  });

  return AnimationMixin;
});
