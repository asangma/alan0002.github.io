// jshint bitwise:false

define([
], function(
) {

  var NavigationConstants = {
    Pan: {
      Direction: {
        LEFT:     1 << 0,
        RIGHT:    1 << 1,
        FORWARD:  1 << 2,
        BACKWARD: 1 << 3,
        UP:       1 << 4,
        DOWN:     1 << 5
      },

      Mode: {
        HORIZONTAL: 0,
        VERTICAL: 1
      },

      Momentum: {
        DURATION_SHORT: 1.0, // s
        DURATION_LONG: 3.0, // s
        DURATION_LONG_VEL: 8, // (normalized screen distance)/s
        INPUT_FILTER: 0.2,  // s
        BUFFER_SIZE: 5
      },

      Vertical: {
        ELEVATION_THRESHOLD: 30000,
        ANGLE_THRESHOLD: 8 / 180 * Math.PI
      }
    },

    Rotate: {
      PivotPoint: {
        POI: 1,
        EYE: 2
      }
    }
  };

  return NavigationConstants;
});
