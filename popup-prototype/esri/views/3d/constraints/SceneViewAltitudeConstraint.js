define([
  "../../../core/declare",

  "../../../core/Accessor",

  "../support/earthUtils"
], function(
  declare,
  Accessor,
  earthUtils
) {
  var MIN_ALTITUDE_DEFAULT = -Infinity;
  var MAX_ALTITUDE_DEFAULT = 4 * earthUtils.earthRadius;

  var SceneViewAltitudeConstraint = declare([Accessor], {
    declaredClass: "esri.views.3d.constraints.SceneViewAltitudeConstraint",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._min = MIN_ALTITUDE_DEFAULT;
      this._max = MAX_ALTITUDE_DEFAULT;
    },

    mode: "auto",

    //--------------------------------------------------------------------------
    //
    //  Internal Methods
    //
    //--------------------------------------------------------------------------

    autoUpdate: function(min, max) {
      if (this.mode === "auto") {
        if (this._min !== min) {
          this._min = min;
          this.notifyChange("min");
        }

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
    _minSetter: function(value) {
      this.mode = "manual";

      this._min = value;

      if (this.max < value) {
        this.max = value;
      }
    },

    _minGetter: function() {
      return this._min;
    },

    _maxSetter: function(value) {
      this.mode = "manual";
      
      this._max = value;

      if (this.min > value) {
        this.min = value;
      }
    },

    _maxGetter: function() {
      return this._max;
    },

    scale: function(scale) {
      this._max *= scale;
      this.notifyChange("max");

      this._min *= scale;
      this.notifyChange("min");
    }
  });

  SceneViewAltitudeConstraint.MIN_DEFAULT = MIN_ALTITUDE_DEFAULT;
  SceneViewAltitudeConstraint.MAX_DEFAULT = MAX_ALTITUDE_DEFAULT;

  return SceneViewAltitudeConstraint;
});
