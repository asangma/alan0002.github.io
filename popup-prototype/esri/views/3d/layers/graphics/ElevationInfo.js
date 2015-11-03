define(["dojo/_base/lang"], function(lang) {

  var ElevationInfo = function(src) {
    if (src) {
      this.set(src);
    }
    else {
      this.mode = null;
      this.offset = 0;
      this.featureExpression = null;
    }
  };

  ElevationInfo.prototype.set = function(src) {
    this.mode = src.mode;
    this.offset = src.offset;
    this.featureExpression = src.featureExpression ? lang.clone(src.featureExpression) : null;
  };

  ElevationInfo.MODES = {
    ABSOLUTE_HEIGHT: "absoluteHeight",
    RELATIVE_TO_GROUND: "relativeToGround",
    ON_THE_GROUND: "onTheGround"
  };

  return ElevationInfo;
});
