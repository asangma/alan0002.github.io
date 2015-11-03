define(
[
  "../core/declare",
  "dojo/_base/Color",
  "../symbols/support/jsonUtils",
  "../Color",
  "./SymbolAger"
],
function(declare, Color, symUtils, esriColor, SymbolAger) {

  var TimeRampAger = declare(SymbolAger, {
    declaredClass: "esri.renderer.TimeRampAger",

    constructor: function(/*dojo.Color[]?*/ colorRange, /*Number[]?*/ sizeRange, /*Number[]?*/ alphaRange) {
      this.colorRange = colorRange; // || [ new dojo.Color([0,0,0,0.1]), new dojo.Color([0,0,255,1]) ];
      this.sizeRange = sizeRange; // || [ 2, 10 ];
      this.alphaRange = alphaRange;
    },

    // Uses internal feature layer members: _map, _startTimeField
    getAgedSymbol: function(symbol, graphic) {
      var featureLayer = graphic.getLayer(), attributes = graphic.attributes;
      symbol = symUtils.fromJSON(symbol.toJSON());

      // get map time
      var mapTimeExtent = featureLayer._map.timeExtent;
      var mapStartTime = mapTimeExtent.startTime, mapEndTime = mapTimeExtent.endTime;
      if (!mapStartTime || !mapEndTime) {
        return symbol;
      }
      mapStartTime = mapStartTime.getTime();
      mapEndTime = mapEndTime.getTime();

      // get timestamp of the graphic
      var featureStartTime = new Date(attributes[featureLayer._startTimeField]);
      featureStartTime = featureStartTime.getTime();
      if (featureStartTime < mapStartTime) {
        featureStartTime = mapStartTime;
      }

      // find the ratio
      var ratio = (mapEndTime === mapStartTime) ?
                  1 :
                  (featureStartTime - mapStartTime) / (mapEndTime - mapStartTime);

      // set size
      var range = this.sizeRange, color, delta;
      if (range) {
        var from = range[0], to = range[1];
        delta = Math.abs(to - from) * ratio;

        //symbol.setSize( (from < to) ? (from + delta) : (from - delta) );
        this._setSymbolSize(symbol, (from < to) ? (from + delta) : (from - delta));
      }

      // set color
      range = this.colorRange;
      if (range) {
        var fromColor = range[0], toColor = range[1], round = Math.round;
        color = new Color();

        // R
        var fromR = fromColor.r, toR = toColor.r;
        delta = Math.abs(toR - fromR) * ratio;
        color.r = round((fromR < toR) ? (fromR + delta) : (fromR - delta));

        // G
        var fromG = fromColor.g, toG = toColor.g;
        delta = Math.abs(toG - fromG) * ratio;
        color.g = round((fromG < toG) ? (fromG + delta) : (fromG - delta));

        // B
        var fromB = fromColor.b, toB = toColor.b;
        delta = Math.abs(toB - fromB) * ratio;
        color.b = round((fromB < toB) ? (fromB + delta) : (fromB - delta));

        // A
        var fromA = fromColor.a, toA = toColor.a;
        delta = Math.abs(toA - fromA) * ratio;
        color.a = (fromA < toA) ? (fromA + delta) : (fromA - delta);

        symbol.setColor(color);
      }

      // set alpha for color if available
      color = symbol.color;
      range = this.alphaRange;
      if (range && color) {
        var fromAlpha = range[0], toAlpha = range[1];
        delta = Math.abs(toAlpha - fromAlpha) * ratio;

        color.a = (fromAlpha < toAlpha) ? (fromAlpha + delta) : (fromAlpha - delta);
      }

      return symbol;
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      var retVal = {};
      if (this.sizeRange){
        retVal.sizeRange = this.sizeRange;
      }
      if (this.colorRange){
        retVal.colorRange = [
          esriColor.toJSON(this.colorRange[0]),
          esriColor.toJSON(this.colorRange[1])
        ];
      }
      if (this.alphaRange){
        retVal.alphaRange = [
          Math.round(this.alphaRange[0] * 255),
          Math.round(this.alphaRange[1] * 255)
        ];
      }
      return retVal;
    }
  });

  

  return TimeRampAger;
});
