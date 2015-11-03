define([
  "./scalePreviewUtil",

  "dojo/_base/array",
  "../../core/declare",
  "dojo/Stateful",

  "dojo/i18n!../../nls/jsapi"
], function (
  scalePreviewUtil,
  array, declare, Stateful,
  nlsJsapi
) {
  var ScaleRanges = declare(Stateful, {

    _scaleRangeStops: [
      { id: "room", minScale: 100 },
      { id: "rooms", minScale: 400 },
      { id: "smallBuilding", minScale: 800 },
      { id: "building", minScale: 1999 },
      { id: "buildings", minScale: 3999 },

      { id: "street", minScale: 7499 },
      { id: "streets", minScale: 14999 },
      { id: "neighborhood", minScale: 29999 },
      { id: "town", minScale: 59999 },
      { id: "city", minScale: 119999 },

      { id: "cities", minScale: 249999 },
      { id: "metropolitanArea", minScale: 499999 },
      { id: "county", minScale: 999999 },
      { id: "counties", minScale: 1999999 },
      { id: "state", minScale: 3999999 },

      { id: "states", minScale: 6999999 },
      { id: "country", minScale: 14999999 },
      { id: "countries", minScale: 34999999 },
      { id: "continent", minScale: 99999999 },
      { id: "world", minScale: 147914382 }
    ],

    _allRanges: null,

    _ranges: null,

    length: 0,

    constructor: function () {
      this._allRanges = this.getScaleRanges();
    },

    _scaleRangeBoundsSetter: function (bounds) {
      var scaleRanges = this.getScaleRanges(bounds.maxScale, bounds.minScale);
      this._ranges = scaleRanges;
      this.length = scaleRanges.length;
    },

    getScaleRanges: function (maxScale, minScale) {
      var scaleRangeStops = this._scaleRangeStops,
          totalScaleRangeStops = scaleRangeStops.length,
          current,
          scaleRanges,
          minScaleScale;

      maxScale = maxScale >= 0 ? maxScale : 0;
      minScale = minScale > 0 ? minScale : scaleRangeStops[totalScaleRangeStops - 1].minScale;
      current = maxScale;
      scaleRanges = [];

      for (var i = 0; i < totalScaleRangeStops; i++) {
        var scale = Math.min(scaleRangeStops[i].minScale, minScale);

        minScaleScale = Math.min(scale, minScale);

        if (maxScale <= scale && current < minScale) {
          scaleRanges.push({
            id: scaleRangeStops[i].id,
            maxScale: Math.max(current, maxScale),
            minScale: minScaleScale
          });
        }

        current = minScaleScale + 1;
      }

      //TODO: find better way of doing this - need to inverse logic and flip stops?
      scaleRanges.reverse();

      return scaleRanges;
    },

    getScalePreviewSpriteBackgroundPosition: function (index) {
      // map index from clipped scale range to full range
      // since sprite sheet is based on the full range.
      index = this._toFullRangeIndex(index);

      return scalePreviewUtil.getScalePreviewSpriteBackgroundPosition(index);
    },

    _toFullRangeIndex: function (index) {
      var scaleRange = this.findScaleRangeByIndex(Math.floor(index)),
          allScaleRanges = this._allRanges,
          totalRanges = allScaleRanges.length,
          fullRangeIndex = 0;

      for (var i = 0; i < totalRanges; i++) {
        if (allScaleRanges[i].id === scaleRange.id) {
          fullRangeIndex = i;
          break;
        }
      }

      return fullRangeIndex;
    },

    getScaleRangeLabel: function (index) {
      var scaleRange = this._ranges[this._clampScaleRangeIndex(index)];
      return nlsJsapi.widgets.visibleScaleRangeSlider.scaleRangeLabels[scaleRange.id];
    },

    findScaleRange: function (scale) {
      var scaleRanges = this._ranges,
          scaleRange,
          range;

      // clamp to range's max and min scale
      if (scale >= scaleRanges[0].maxScale) {
        return scaleRanges[0];
      }

      if (scale <= scaleRanges[scaleRanges.length - 1].minScale) {
        return scaleRanges[scaleRanges.length - 1];
      }

      for (var i = 0; i < scaleRanges.length; i++) {
        range = scaleRanges[i];

        if (scale >= range.maxScale &&
            scale <= range.minScale) {
          scaleRange = range;
          break;
        }
      }

      return scaleRange;
    },

    findScaleRangeByIndex: function (index) {
      index = this._clampScaleRangeIndex(index);
      return this._ranges[index];
    },

    clampScale: function (scale) {
      return Math.min(this.get("minScale"), Math.max(this.get("maxScale"), scale));
    },

    _minScaleGetter: function () {
      return this.get("firstRange").minScale;
    },

    _maxScaleGetter: function () {
      return this.get("lastRange").maxScale;
    },

    _firstRangeGetter: function () {
      return this._ranges[0];
    },

    _lastRangeGetter: function () {
      var ranges = this._ranges,
          lastRangeIndex = ranges.length - 1;

      return ranges[lastRangeIndex];
    },

    clampMinScale: function (scale) {
      if (scale === 0) {
        return this.get("minScale");
      }

      return this.clampScale(scale);
    },

    clampMaxScale: function (scale) {
      return this.clampScale(scale);
    },

    _clampScaleRangeIndex: function (index) {
      var lowerBound = 0;
      if (index <= lowerBound) {
        return lowerBound;
      }

      var upperBound = this._ranges.length - 1;
      if (index > upperBound) {
        return upperBound;
      }

      return Math.floor(index);
    },

    scaleToRangeIndex: function (scale) {
      return array.indexOf(this._ranges, this.findScaleRange(scale));
    },

    contains: function (scale) {
      var scaleRanges = this._ranges,
          withinRange = false,
          range;

      for (var i = 0; i < scaleRanges.length; i++) {
        range = scaleRanges[i];

        if (scale >= range.maxScale &&
            scale <= range.minScale) {
          withinRange = true;
          break;
        }
      }

      return withinRange;
    }
  });

  ScaleRanges.getScalePreviewSource = function (region) {
    return scalePreviewUtil.getScalePreviewSource(region);
  };

  return ScaleRanges;
});
