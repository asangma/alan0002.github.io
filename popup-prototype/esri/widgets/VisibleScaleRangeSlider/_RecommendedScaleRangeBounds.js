define([
  "./recommendedScales",

  "../../core/declare"
],
function(
  recommendedScales,
  declare
) {

    return declare(null, {

      declaredClass: "esri.dijit.VisibleScaleRangeSlider._RecommendedScaleRangeBounds",

      beyondMinScale: function(scale) {
        var firstRange = this.get("firstRange"),
            minScale = firstRange.minScale,
            maxScale = recommendedScales.getRecommendedScale(firstRange.id) ||
                       firstRange.maxScale;

        return scale <= minScale &&
               scale > maxScale;
      },

      beyondMaxScale: function(scale) {
        var lastRange = this.get("lastRange"),
            maxScale = lastRange.maxScale,
            minScale = recommendedScales.getRecommendedScale(lastRange.id) ||
                       lastRange.minScale;

        return scale < minScale &&
               scale >= maxScale;
      }

    });
});
