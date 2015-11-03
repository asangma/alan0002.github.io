define(
[
  "../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",
  "dojo/date",
  "../core/lang",
  "../symbols/support/jsonUtils",
  "../Color",
  "./SymbolAger"
],
function(declare, array, lang, djDate, esriLang, symUtils, esriColor, SymbolAger) {

  var timeEnums = {
    UNIT_DAYS:         "day",         // default
    UNIT_HOURS:        "hour",
    UNIT_MILLISECONDS: "millisecond",
    UNIT_MINUTES:      "minute",
    UNIT_MONTHS:       "month",
    UNIT_SECONDS:      "second",
    UNIT_WEEKS:        "week",
    UNIT_YEARS:        "year"
  };

  var TimeClassBreaksAger = declare(SymbolAger, {
    declaredClass: "esri.renderer.TimeClassBreaksAger",

    constructor: function(/*Object[]*/ infos, /*String?*/ timeUnits) {
      /*
       * [
       *   {
       *     minAge: <Number>,
       *     maxAge: <Number>,
       *     color: <dojo.Color>,
       *     size: <Number>,
       *     alpha: <Number>
       *   }
       *   ,...
       * ]
       */
      this.infos = infos;
      this.timeUnits = timeUnits || "day"; // see constants mixin below

      // re-arrange infos in incremental order
      infos.sort(function(a, b) {
        if (a.minAge < b.minAge) {
          return -1;
        }
        if (a.minAge > b.minAge) {
          return 1;
        }
        return 0;
      });
    },

    // Uses internal feature layer members: _map, _startTimeField
    getAgedSymbol: function(symbol, graphic) {
      var featureLayer = graphic.getLayer(), attributes = graphic.attributes, isDef = esriLang.isDefined;
      symbol = symUtils.fromJSON(symbol.toJSON());

      // get map time
      var mapTimeExtent = featureLayer._map.timeExtent;
      var mapEndTime = mapTimeExtent.endTime;
      if (!mapEndTime) {
        return symbol;
      }

      // get timestamp of the graphic
      var featureStartTime = new Date(attributes[featureLayer._startTimeField]);

      // find the difference between the above
      var diff = djDate.difference(featureStartTime, mapEndTime, this.timeUnits);

      // modify symbol based on the class break that the difference falls between
      array.some(this.infos, function(info) {
        if (diff >= info.minAge && diff <= info.maxAge) {
          var color = info.color, size = info.size, alpha = info.alpha;

          if (color) {
            symbol.setColor(color);
          }

          if (isDef(size)) {
            //symbol.setSize(size);
            this._setSymbolSize(symbol, size);
          }

          if (isDef(alpha) && symbol.color) {
            symbol.color.a = alpha;
          }

          return true;
        } // diff
      }, this);

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
      var retVal = {
        agerClassBreakInfos: []
      },
        i,
        jsinfo,
        restinfo;
      retVal.timeUnits = this._getRestUnits(this.timeUnits);
      for(i = 0; i < this.infos.length; i += 1){
        jsinfo = this.infos[i];
        restinfo = {};
        restinfo.oldestAge = jsinfo.maxAge === Infinity ? null : jsinfo.maxAge;
        restinfo.size = jsinfo.size;
        if (jsinfo.color){
          restinfo.color = esriColor.toJSON(jsinfo.color);
        }
        if (jsinfo.alpha){
          restinfo.alpha = Math.round(jsinfo.alpha * 255);
        }
        retVal.agerClassBreakInfos[i] = restinfo;
      }
      return retVal;
    },

    _getRestUnits: function(jsUnits){
      var restUnits = "esriTimeUnitsDays";
      switch(jsUnits){
        case TimeClassBreaksAger.UNIT_SECONDS:
          restUnits = "esriTimeUnitsSeconds";
          break;
        case TimeClassBreaksAger.UNIT_MILLISECONDS:
          restUnits = "esriTimeUnitsMilliseconds";
          break;
        case TimeClassBreaksAger.UNIT_HOURS:
          restUnits = "esriTimeUnitsHours";
          break;
        case TimeClassBreaksAger.UNIT_MINUTES:
          restUnits = "esriTimeUnitsMinutes";
          break;
        case TimeClassBreaksAger.UNIT_MONTHS:
          restUnits = "esriTimeUnitsMonths";
          break;
        case TimeClassBreaksAger.UNIT_WEEKS:
          restUnits = "esriTimeUnitsWeeks";
          break;
        case TimeClassBreaksAger.UNIT_YEARS:
          restUnits = "esriTimeUnitsYears";
          break;
      }
      return restUnits;
    }
  });

  lang.mixin(TimeClassBreaksAger, timeEnums);

  

  return TimeClassBreaksAger;
});
