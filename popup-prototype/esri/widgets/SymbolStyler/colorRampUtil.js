define([
  "dojo/_base/array",

  "dojox/gfx"
], function (
  array,
  gfx
) {

  var colorRampUtil = {

    createColorRamp: function (opts) {
      var node = opts.node,
          width = opts.width,
          height = opts.height,
          colorStops = colorRampUtil._stopsFromColors(opts),
          ramp = gfx.createSurface(node, width, height);

      ramp = ramp.createRect(ramp.getDimensions()).setFill({
        type: "linear",
        x1: 0,
        y1: 0,
        x2: 0,
        y2: height,
        colors: colorStops
      });

      return ramp;
    },

    updateColorRamp: function (opts) {
      var ramp = opts.ramp,
          newFill = ramp.getFill();

      newFill.colors = colorRampUtil._stopsFromColors(opts);

      ramp.setFill(newFill);

      return ramp;
    },

    _stopsFromColors: function (opts) {
      //TODO: support custom stops
      var colors = opts.colors,
          hasStops = opts.hasStops,
          totalColors = colors.length,
          colorOffset = hasStops ? 1 / totalColors : 1 / (totalColors - 1),
          colorStops = [],
          firstColor = colors[0],
          offset,
          color,
          nextOffset;

      // stops already defined?
      if (typeof firstColor === "object" &&
          firstColor.hasOwnProperty("offset") &&
          firstColor.hasOwnProperty("color")) {

        return colors;
      }

      for (var i = 0; i < totalColors; i++) {
        offset = (i * colorOffset);
        color = colors[totalColors - 1 - i];  // inverse color order

        colorStops.push({
          offset: offset,
          color: color
        });

        if (hasStops) {
          nextOffset = ((i + 1) * colorOffset);

          colorStops.push({
            offset: nextOffset,
            color: color
          });
        }
      }

      return colorStops;
    }};

  return colorRampUtil;
});
