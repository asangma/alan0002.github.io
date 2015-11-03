define([
    "dojo/_base/lang",
    "esri/Color"
  ],
  function (lang, Color) {
    var colorUtil = {
      equal: function (color1, color2) {
        return color1 && color2 &&
               color1.r === color2.r &&
               color1.g === color2.g &&
               color1.b === color2.b &&
               color1.a === color2.a;
      },

      normalizeHex: function (hex) {
        return "#" + lang.trim(hex)
          .replace(/#/g, "")
          .substr(0, 6);
      },

      normalizeColor: function (color) {
        return new Color(color);
      },

      isValidHex: function (hex) {
        return colorUtil.isShorthandHex(hex) ||
               colorUtil.isLonghandHex(hex);
      },

      _shortHandHex: /^#[0-9A-F]{3}$/i,

      isShorthandHex: function (hex) {
        return hex &&
               hex.length === 4 &&
               colorUtil._shortHandHex.test(hex);
      },

      _longhandHex: /^#[0-9A-F]{6}$/i,

      isLonghandHex: function (hex) {
        return hex &&
               hex.length === 7 &&
               colorUtil._longhandHex.test(hex);
      },

      getContrastingColor: function (color) {
        return colorUtil.isBright(color) ?
               this.darker(color) :
               this.brighter(color, 3);
      },

      isBright: function (color) {
        // see http://www.w3.org/TR/AERT#color-contrast
        var yiq = color.r * 0.299 +
                  color.g * 0.587 +
                  color.b * 0.114;

        return yiq >= 127;
      },

      darker: function (color, factor) {
        factor = factor ? factor : 1;

        var darknessFactor = Math.pow(0.7, factor);

        return new Color([
          Math.round(color.r * darknessFactor),
          Math.round(color.g * darknessFactor),
          Math.round(color.b * darknessFactor),
          color.a
        ]);
      },

      brighter: function (color, factor) {
        factor = factor ? factor : 1;

        var brightnessFactor = Math.pow(0.7, factor),
            r = color.r,
            g = color.g,
            b = color.b,
            i = 30;

        if (r < i) {
          r = i;
        }

        if (g < i) {
          g = i;
        }

        if (b < i) {
          b = i;
        }

        return new Color([
          Math.min(255, Math.round(r / brightnessFactor)),
          Math.min(255, Math.round(g / brightnessFactor)),
          Math.min(255, Math.round(b / brightnessFactor)),
          color.a
        ]);
      }
    };

    return colorUtil;
  });
