define(
  [
    "../../core/declare",
    "dojo/_base/lang"
  ],

  function (declare, lang) {

    var PixelBlock = declare([], {
      declaredClass: "esri.layers.support.PixelBlock",
      planes: null,
      width: null,
      height: null,
      pixelType: null,
      pixels: [],
      statistics: [],

      constructor: function (args) {
        if (!args) {
          return;
        }
        if (!args.width || Math.floor(args.width) !== args.width) {
          throw "PixelBlock: incorrect width";
        }
        if (!args.height || Math.floor(args.height) !== args.height) {
          throw "PixelBlock: incorrect height";
        }
        if (!args.pixels || !args.statistics) {
          throw "PixelBlock: pixel data or statistics not present";
        }
        this.width = args.width;
        this.height = args.height;
        this.pixels = args.pixels;
        this.pixelType = args.pixelType || null;
        this.statistics = args.statistics;
        this.mask = args.mask || null;
      },

      getPlaneCount: function () {
        if (this.pixels.length !== this.statistics.length) {
          return console.error("Inconsistent pixel data and statistics");
        }
        return this.statistics.length;
      },

      addData: function (planeData) {
        if (!planeData.pixels || !planeData.statistics) {
          throw "Pixel data or statistics are not present";
        }
        else if (planeData.pixels.length !== (this.width * this.height)) {
          throw "Inconsistent pixel data size";
        }
        this.statistics.push(planeData.statistics);
        this.pixels.push(planeData.pixels);
      },

      getAsRGBA: function () {
        var data = new ArrayBuffer(this.width * this.height * 4);
        switch (this.pixelType) {
          case "S8":
          case "S16":
          case "U16":
          case "S32":
          case "U32":
          case "F32":
          case "F64":
            this._fillFromNon8Bit(data);
            break;
          default:
            this._fillFrom8Bit(data);
            break;
        }

        return (new Uint8ClampedArray(data));
      },

      getAsRGBAFloat: function () {
        var data = new Float32Array(this.width * this.height * 4);
        this._fillFrom32Bit(data);
        return data;
      },

      clone: function () {
        var pixelBlock = new this.constructor();
        pixelBlock.width = this.width;
        pixelBlock.height = this.height;
        pixelBlock.pixelType = this.pixelType;

        if (this.mask) {
          pixelBlock.mask = new Uint8Array(this.mask);
        }

        var i;
        var numBands;
        if (this.pixels) {
          pixelBlock.pixels = [];
          numBands = this.pixels.length;
          for (i = 0; i < numBands; i++) {
            pixelBlock.pixels[i] = new Float32Array(this.pixels[i]);
          }
        }

        if (this.statistics) {
          pixelBlock.statistics = [];
          numBands = this.statistics.length;
          for (i = 0; i < numBands; i++) {
            pixelBlock.statistics[i] = lang.clone(this.statistics[i]);
          }
        }

        return pixelBlock;
      },

      /*******************
       * Internal Methods
       *******************/

      _fillFrom8Bit: function (data) {
        var pixels = this.pixels;
        var mask = this.mask;
        if (!data || !pixels || !pixels.length) {
          return console.error("Unable to convert to RGBA. The input pixel block is empty.");
        }

        var p1, p2, p3, i;
        p1 = p2 = p3 = pixels[0];
        if (pixels.length >= 3) {
          p2 = pixels[1];
          p3 = pixels[2];
        }

        var data32 = new Uint32Array(data);
        var n = this.width * this.height;
        if (p1.length !== n) {
          return console.error("Unable to convert to RGBA. The pixelblock is invalid.");
        }

        // This code is not re-factored for performance reasons
        if (mask && mask.length === n) {
          for (i = 0; i < n; i++) {
            if (mask[i]) {
              data32[i] = (255 << 24) | (p3[i] << 16) | (p2[i] << 8) | p1[i];
            }
          }
        } else {
          for (i = 0; i < n; i++) {
            data32[i] = (255 << 24) | (p3[i] << 16) | (p2[i] << 8) | p1[i];
          }
        }

        return;
      },

      _fillFromNon8Bit: function (data) {
        var pixels = this.pixels;
        var mask = this.mask;
        var statistics = this.statistics;
        if (!data || !pixels || !pixels.length) {
          return console.error("Unable to convert to RGBA. The input pixel block is empty.");
        }

        var factor = 1.0;
        var minVal = 0.0;
        if (statistics && statistics.length > 0) {
          minVal = statistics[0].minValue;
          factor = 255.0 / (statistics[0].maxValue - statistics[0].minValue);
        } else {
          var maxVal = 255.0;
          if (this.pixelType === "S8") {
            minVal = -128;
            maxVal = 127;
          }
          else if (this.pixelType === "U16") {
            maxVal = 65535.0;
          }
          else if (this.pixelType === "S16") {
            minVal = -32768.0;
            maxVal = 32767.0;
          }
          else if (this.pixelType === "U32") {
            maxVal = 4294967295.0;
          }
          else if (this.pixelType === "S32") {
            minVal = -2147483648.0;
            maxVal = 2147483647.0;
          }
          else if (this.pixelType === "F32") {
            minVal = -3.4 * 10e38;
            maxVal = 3.4 * 10e38;
          }
          else if (this.pixelType === "F64") {
            minVal = -Number.MAX_VALUE;
            maxVal = Number.MAX_VALUE;
          }

          factor = 255.0 / (maxVal - minVal);
        }

        var data32 = new Uint32Array(data);
        var n = this.width * this.height;
        var p1, p2, p3, i, value;
        p1 = pixels[0];

        if (p1.length !== n) {
          return console.error("Unable to convert to RGBA. The pixelblock is invalid.");
        }

        // This code is not re-factored for performance reasons
        if (pixels.length >= 3) {
          p2 = pixels[1];
          p3 = pixels[2];
          if (mask && mask.length === n) {
            for (i = 0; i < n; i++) {
              if (mask[i]) {
                data32[i] = (255 << 24) |
                            (((p3[i] - minVal) * factor) << 16) |
                            (((p2[i] - minVal) * factor) << 8) |
                            ((p1[i] - minVal) * factor);
              }
            }
          } else {
            for (i = 0; i < n; i++) {
              data32[i] = (255 << 24) |
                          (((p3[i] - minVal) * factor) << 16) |
                          (((p2[i] - minVal) * factor) << 8) |
                          ((p1[i] - minVal) * factor);
            }
          }
        } else { // uses the first band only
          if (mask && mask.length === n) {
            for (i = 0; i < n; i++) {
              value = (p1[i] - minVal) * factor;
              if (mask[i]) {
                data32[i] = (255 << 24) |
                            (value << 16) |
                            (value << 8) |
                            (value);
              }
            }
          } else {
            for (i = 0; i < n; i++) {
              value = (p1[i] - minVal) * factor;
              data32[i] = (255 << 24) |
                          (value << 16) |
                          (value << 8) |
                          (value);
            }
          }
        }

        return;
      },

      _fillFrom32Bit: function (data) {
        var pixels = this.pixels;
        var mask = this.mask;
        if (!data || !pixels || !pixels.length) {
          return console.error("Unable to convert to RGBA. The input pixel block is empty.");
        }

        var p1, p2, p3, i;
        p1 = p2 = p3 = pixels[0];
        if (pixels.length >= 3) {
          p2 = pixels[1];
          p3 = pixels[2];
        }

        var n = this.width * this.height;
        if (p1.length !== n) {
          return console.error("Unable to convert to RGBA. The pixelblock is invalid.");
        }

        var j = 0;
        // This code is not re-factored for performance reasons
        if (mask && mask.length === n) {
          for (i = 0; i < n; i++) {
            data[j++] = p1[i];
            data[j++] = p2[i];
            data[j++] = p3[i];
            data[j++] = mask[i];
          }
        } else {
          for (i = 0; i < n; i++) {
            data[j++] = p1[i];
            data[j++] = p2[i];
            data[j++] = p3[i];
            data[j++] = 255;
          }
        }

        return;
      }

    });

    return PixelBlock;
  });
