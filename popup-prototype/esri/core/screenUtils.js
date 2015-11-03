define([], function() {

  var screenUtils = {
    /**
     * @private
     */
    DPI: 96,

    /**
     * Convert a number in point unit to its corresponding value in pixel, assuming a DPI of 96.
     *
     * @param {number} pt - The value in point to convert to pixel.
     * @return {number} The value of `pt` in pixel.
     */
    pt2px: function(pt) {
      return pt / 72 * screenUtils.DPI;
    },

    /**
     * Convert a number in pixel unit to its corresponding value in point, assuming a DPI of 96.
     *
     * @param {number} px - The value in pixel to convert to point.
     * @return {number} The value of `px` in point.
     */
    px2pt: function(px) {
      return px * 72 / screenUtils.DPI;
    }

  };

  return screenUtils;

});