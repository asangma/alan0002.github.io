define([
  "../../Color",

  "dojo/_base/array",
  "dojo/_base/lang"
], function (
  Color,
  array, lang
) {

  var schemeUtil = {

    getColorRamps: function (schemes, numClasses) {
      var colorRampsAndSchemes = schemeUtil.getColorRampsWithSchemes(schemes,
        numClasses);

      return array.map(colorRampsAndSchemes, function (colorRampAndScheme) {
        return colorRampAndScheme.colors;
      });
    },

    getColorRampsWithSchemes: function (schemes, numClasses) {
      var allSchemes = schemeUtil._unify(schemes),
          colorRampsAndSchemes = [];

      array.forEach(allSchemes, function (scheme) {
        var isClassed = numClasses > 0,
            hasColorsForClassBreaks = !!scheme.colorsForClassBreaks,
            colors;

        if (isClassed) {
          colors = hasColorsForClassBreaks ?
                   schemeUtil._maxSupportedClassBreakColors(scheme.colorsForClassBreaks,
                     numClasses) :
                   scheme.colors;
        }
        else {
          colors = scheme.colors;
        }

        colorRampsAndSchemes.push({
          colors: colors,
          scheme: scheme
        });
      });

      return colorRampsAndSchemes;
    },

    _unify: function (schemes) {
      return [schemes.primaryScheme].concat(schemes.secondarySchemes);
    },

    _maxSupportedClassBreakColors: function (colorsForClassBreaks, numClasses) {
      var colors,
          totalColorsForClassBreaks = colorsForClassBreaks.length,
          colorForClassBreaks;

      for (var i = 0; i < totalColorsForClassBreaks; i++) {
        colorForClassBreaks = colorsForClassBreaks[i];
        if (numClasses < colorForClassBreaks.numClasses) {
          break;
        }

        colors = colorForClassBreaks.colors;
      }

      return colors;
    },

    getFillColors: function (schemes) {
      var allSchemes = schemeUtil._unify(schemes),
          fillColors = [],
          colorItem;

      array.forEach(allSchemes, function (scheme) {
        colorItem = scheme.marker || scheme;

        if (colorItem.colors) {
          fillColors = fillColors.concat(colorItem.colors);
        }
        else {
          fillColors.push(colorItem.color);
        }
      });

      return schemeUtil._removeDuplicates(fillColors);
    },

    _removeDuplicates: function (colors) {
      var usedHexColors = {},
          unusedColor;

      return array.filter(colors, function (color) {
        unusedColor = !usedHexColors[color.toHex()];

        if (unusedColor) {
          usedHexColors[color.toHex()] = 1;
        }

        return unusedColor;
      });
    },

    getOutlineColors: function (schemes) {
      var allSchemes = schemeUtil._unify(schemes),
          outlineColors = [],
          colorItem;

      array.forEach(allSchemes, function (scheme) {
        colorItem = scheme.marker || scheme;

        if (colorItem.outline) {
          outlineColors.push(colorItem.outline.color);
        }
        else if (colorItem.colors) {
          outlineColors = outlineColors.concat(colorItem.colors);
        }
        else {
          outlineColors.push(colorItem.color);
        }
      });

      return schemeUtil._removeDuplicates(outlineColors);
    },

    flipColors: function (scheme) {
      if (scheme.colors) {
        scheme.colors.reverse();
      }

      if (scheme.colorsForClassBreaks) {
        array.forEach(scheme.colorsForClassBreaks,
          function (classBreakColorInfo) {
            if (classBreakColorInfo.numClasses > 1) {
              classBreakColorInfo.colors.reverse();
            }
          });
      }
    },

    cloneScheme: function (scheme) {
      var clone;

      if (scheme) {
        clone = lang.mixin({}, scheme);

        // Replace object and array refs with copies.
        clone.colors = schemeUtil._createColors(clone.colors);

        clone.colorsForClassBreaks = array.map(clone.colorsForClassBreaks, function (breakInfo) {
          return {
            numClasses: breakInfo.numClasses,
            colors: schemeUtil._createColors(breakInfo.colors)
          };
        });

        if (clone.noDataColor) {
          clone.noDataColor = new Color(clone.noDataColor);
        }

        if (clone.outline) {
          clone.outline = {
            color: clone.outline.color && new Color(clone.outline.color),
            width: clone.outline.width
          };
        }
      }

      return clone;
    },

    _createColors: function (colors, fillOpacity) {
      return array.map(colors, function (colorValue) {
        var color = new Color(colorValue);

        if (fillOpacity != null) {
          color.a = fillOpacity;
        }

        return color;
      });
    }

  };

  return schemeUtil;
});
