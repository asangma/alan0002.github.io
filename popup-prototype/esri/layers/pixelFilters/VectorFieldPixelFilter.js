define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/lang",
  "dojo/_base/array"
],
function (
  declare, lang,
  esriLang, array
) {
  var VectorFieldPixelFilter = declare(null, {
    declaredClass: "esri.layers.pixelFilters.VectorFieldPixelFilter",
    speedUnits: ["esriMetersPerSecond", "esriKilometersPerHour", "esriKnots", "esriFeetPerSecond", "esriMilesPerHour"],
    constructor: function (options) {

      lang.mixin(this, options);
      this.isDataUV = (options && options.isDataUV) ? options.isDataUV : false;
      this.computeMagnitudeAndDirection = lang.hitch(this, this.computeMagnitudeAndDirection);
      this.unitConversionFactor = 1;
      this._updateUnitConvFactor();
    },

    setUnits: function (inputUnit, outputUnit) {
      this.inputUnit = inputUnit;
      this.outputUnit = outputUnit;
      this.unitConversionFactor = 1;
      this._updateUnitConvFactor();
    },

    _updateUnitConvFactor: function () {
      var inputUnit_idx = array.indexOf(this.speedUnits, this.inputUnit);
      var outputUnit_idx = array.indexOf(this.speedUnits, this.outputUnit);
      //console.log([this.inputUnit, this.outputUnit, inputUnit_idx, outputUnit_idx]);
      if (this.inputUnit && this.outputUnit && inputUnit_idx >= 0 && outputUnit_idx >= 0) {
        var s = [1, 0.277778, 0.514444, 0.3048, 0.44704, 0];
        this.unitConversionFactor = s[inputUnit_idx] / s[outputUnit_idx];
        //console.log(this.unitConversionFactor);
      }
    },

    /*****************
     * Filters
     *****************/

    computeMagnitudeAndDirection: function (pixelData) {
      if (!esriLang.isDefined(pixelData)) {
        throw "Could not compute magnitude and direction. No pixel data is available.";
      }

      var pixelBlock = pixelData.pixelBlock;
      if (!esriLang.isDefined(pixelBlock) || pixelBlock.getPlaneCount() !== 2) {
        throw "Could not compute magnitude and direction. Pixel data does not contain two bands.";
      }

      var extent = pixelData.extent;
      var psX = (extent.xmax - extent.xmin) / pixelBlock.width;
      var psY = (extent.ymax - extent.ymin) / pixelBlock.height;
      var xStart = extent.xmin + psX / 2;
      var yStart = extent.ymax - psY / 2;

      pixelBlock.statistics[0].minValue = 0;
      pixelBlock.statistics[0].maxValue = 0;

      var degreesPerRadian = 180 / Math.PI;
      var locations = [];
      var i = 0, j = 0, idx = 0;
      var isMaskNotDefined = !esriLang.isDefined(pixelBlock.mask);
      var u, v, magnitude, direction;

      var magMin, magMax, dirMin, dirMax;
      magMin = dirMin = +Infinity;
      magMax = dirMax = -Infinity;

      for (i = 0; i < pixelBlock.height; i++) {
        for (j = 0; j < pixelBlock.width; j++, idx++) {
          locations.push([xStart + psX * j, yStart - psY * i]);

          if (isMaskNotDefined || pixelBlock.mask[idx]) {
            magnitude = u = pixelBlock.pixels[0][idx] * this.unitConversionFactor;
            direction = v = pixelBlock.pixels[1][idx];
            if (this.isDataUV) {
              magnitude = Math.sqrt(u * u + v * v);
              direction = 90 - degreesPerRadian * Math.atan2(v, u);
              pixelBlock.pixels[0][idx] = magnitude * this.unitConversionFactor;
              pixelBlock.pixels[1][idx] = direction;
            }

            if (magnitude > magMax) {
              magMax = magnitude;
            }

            if (magnitude < magMin) {
              magMin = magnitude;
            }

            if (direction > dirMax) {
              dirMax = direction;
            }

            if (direction < dirMin) {
              dirMin = direction;
            }
          }
        }
      }

      pixelBlock.statistics[0].maxValue = magMax;
      pixelBlock.statistics[0].minValue = magMin;
      pixelBlock.statistics[1].maxValue = dirMax;
      pixelBlock.statistics[1].minValue = dirMin;

      pixelData.locations = locations;
      return pixelData;
    }

  });

  

  return VectorFieldPixelFilter;
});
