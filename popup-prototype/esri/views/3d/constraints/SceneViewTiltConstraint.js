define([
  "../../../core/declare",

  "../../../core/Accessor",

  "../support/mathUtils"
], function(
  declare,
  Accessor,
  mathUtils
) {
  var MAX_TILT_DEFAULT = 0.5;
  var MIN_TILT_DEFAULT = 179.5;

  var SceneViewTiltConstraint = declare([Accessor], {
    declaredClass: "esri.views.3d.constraints.SceneViewTiltConstraint",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    constructor: function() {
      this._max = MAX_TILT_DEFAULT;
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    max: MAX_TILT_DEFAULT,

    mode: "auto",

    //--------------------------------------------------------------------------
    //
    //  Internal Methods
    //
    //--------------------------------------------------------------------------

    autoUpdate: function(max) {
      if (this.mode === "auto") {
        if (this._max !== max) {
          this._max = max;
          this.notifyChange("max");
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _maxSetter: function(value) {
      this.mode = "manual";

      // If this gets changed, please also update Navigation
      this._max = mathUtils.clamp(value, MAX_TILT_DEFAULT, MIN_TILT_DEFAULT);
    },

    _maxGetter: function() {
      return this._max;
    },

    scale: function(scale) {
    }
  });

SceneViewTiltConstraint.MAX_DEFAULT = MAX_TILT_DEFAULT;
SceneViewTiltConstraint.MIN_DEFAULT = MIN_TILT_DEFAULT;

  return SceneViewTiltConstraint;
});
