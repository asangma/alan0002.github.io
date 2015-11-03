define(
[
  "dojo/_base/array",
  "dojo/_base/lang",
  "../../Color",

  "../../core/screenUtils",

  "../../symbols/support/jsonUtils",

  "../SimpleRenderer",
  "../UniqueValueRenderer",
  "../ClassBreaksRenderer",
  "../VectorFieldRenderer",
  "../DotDensityRenderer",
  "../ScaleDependentRenderer",
  "../TimeClassBreaksAger",
  "../TimeRampAger",
  "../TemporalRenderer",
  "../HeatmapRenderer"
],
function(
  array, lang,
  esriColor,
  screenUtils,
  symUtils,
  SimpleRenderer, UniqueValueRenderer, ClassBreaksRenderer, VectorFieldRenderer,
  DotDensityRenderer, ScaleDependentRenderer,
  TimeClassBreaksAger, TimeRampAger, TemporalRenderer, HeatmapRenderer
) {

  var jsonUtils = {

    fromJson: function(json) {
      try {
        throw new Error("fromJson is deprecated, use fromJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return jsonUtils.fromJSON(json);
    },

    // Utility method to deserialize a renderer from json
    // returned by REST

    /*
     * Support for TemporalRenderer added at version 3.11.
     *   type property of temporal renderer is "temporal". Property names in JSON
     *    match property names of JS API TemporalRenderer. JSON spec for agers
     *    are defined in ExportWebMap spec
     *     (http://resources.arcgis.com/en/help/arcgis-rest-api/#/ExportWebMap_specification/02r3000001mz000000/)
     */
    fromJSON: function(json) {
      var type = json.type || "", renderer;

      switch (type) {
        case "simple":
          renderer = new SimpleRenderer(json);
          break;
        case "uniqueValue":
          renderer = new UniqueValueRenderer(json);
          break;
        case "classBreaks":
          renderer = new ClassBreaksRenderer(json);
          break;
        case "vectorField":
          renderer = new VectorFieldRenderer(json);
          break;
        case "scaleDependent":
          renderer = this._scaleDependentFromJson(json);
          break;
        case "dotDensity":
          renderer = this._dotDensityFromJson(json);
          break;
        case "temporal":
          renderer = this._temporalFromJson(json);
          break;
        case "heatmap":
          renderer = this._heatmapFromJson(json);
      }

      return renderer;
    },

    /**********************************************
     *
     * Internal Methods
     *
     **********************************************/

    _scaleDependentFromJson: function(json) {
      var params = {},
          min = json.minScale,
          jsonInfos = json.rendererInfos;

      params.rendererInfos = array.map(jsonInfos, function(jsonInfo) {
        var max = jsonInfo.maxScale;
        var info = {
          minScale: min,
          maxScale: max,
          renderer: jsonInfo.renderer && this.fromJSON(jsonInfo.renderer)
        };
        min = max;
        return info;
      }, this);

      return new ScaleDependentRenderer(params);
    },

    _dotDensityFromJson: function(json) {
      if (json.backgroundColor && lang.isArray(json.backgroundColor)) {
        json.backgroundColor = esriColor.fromJSON(json.backgroundColor);
      }
      if (json.dotSize > 0) {
        json.dotSize = screenUtils.pt2px(json.dotSize);
      }
      if (json.fields) {
        array.forEach(json.fields, function(field) {
          if (field && lang.isArray(field.color)) {
            field.color = esriColor.fromJSON(field.color);
          }
        });
      }
      if (json.legendOptions) {
        if (json.legendOptions.backgroundColor && lang.isArray(json.legendOptions.backgroundColor)) {
          json.legendOptions.backgroundColor = esriColor.fromJSON(json.legendOptions.backgroundColor);
        }
        if (json.legendOptions.outline) {
          json.legendOptions.outline = symUtils.fromJSON(json.legendOptions.outline);
        }
      }
      if (json.outline) {
        json.outline = symUtils.fromJSON(json.outline);
      }
      return new DotDensityRenderer(json);
    },

    //convert temporal renderer json objects to JS API
    //renderers and agers and pass to TemporalRenderer constructor
    _temporalFromJson: function(json){
      var observationRenderer,
        currentObsRenderer,
        trackRenderer,
        ager,
        temporalRenderer;

      json = json || {};
      observationRenderer = this.fromJSON(json.observationRenderer);
      currentObsRenderer = json.latestObservationRenderer ? this.fromJSON(json.latestObservationRenderer) : null;
      trackRenderer = json.trackRenderer ? this.fromJSON(json.trackRenderer) : null;
      ager = this._agerFromJson(json.observationAger);
      temporalRenderer = new TemporalRenderer(observationRenderer, currentObsRenderer, trackRenderer, ager);
      return temporalRenderer;
    },

    //convert SymbolAger json object to TimeClassBreaksAger or TimeRampAger
    _agerFromJson: function(json){
      var symbolAger;

      json = json || {};
      if (json.colorRange || json.sizeRange || json.alphaRange){
        symbolAger = this._timeRampFromJson(json);
      }
      else if (json.agerClassBreakInfos){
        symbolAger = this._timeClassBreaksFromJson(json);
      }
      return symbolAger;
    },

    _timeRampFromJson: function(json){
      var colorRange,
        sizeRange,
        alphaRange,
        jsAger;

      if (json.colorRange && json.colorRange.length > 1){
        colorRange = [esriColor.fromJSON(json.colorRange[0]), esriColor.fromJSON(json.colorRange[1])];
      }
      if (json.sizeRange && json.sizeRange.length > 1){
        sizeRange = [json.sizeRange[0], json.sizeRange[1]];
      }
      if (json.alphaRange && json.alphaRange.length > 1){
        alphaRange = [json.alphaRange[0]/255, json.alphaRange[1]/255];
      }
      jsAger = new TimeRampAger(colorRange, sizeRange, alphaRange);
      return jsAger;
    },

    _timeClassBreaksFromJson: function(json){
      var jsonBreaks = json.agerClassBreakInfos,
        jsonBreak,
        jsUnits,
        jsBreak,
        jsBreaks = [],
        count,
        jsAger;

      function getJSUnits(restUnits){
        var jsUnits = TimeClassBreaksAger.UNIT_DAYS;
        switch(restUnits){
          case "esriTimeUnitsSeconds":
            jsUnits = TimeClassBreaksAger.UNIT_SECONDS;
            break;
          case "esriTimeUnitsMilliseconds":
            jsUnits = TimeClassBreaksAger.UNIT_MILLISECONDS;
            break;
          case "esriTimeUnitsHours":
            jsUnits = TimeClassBreaksAger.UNIT_HOURS;
            break;
          case "esriTimeUnitsMinutes":
            jsUnits = TimeClassBreaksAger.UNIT_MINUTES;
            break;
          case "esriTimeUnitsMonths":
            jsUnits = TimeClassBreaksAger.UNIT_MONTHS;
            break;
          case "esriTimeUnitsWeeks":
            jsUnits = TimeClassBreaksAger.UNIT_WEEKS;
            break;
          case "esriTimeUnitsYears":
            jsUnits = TimeClassBreaksAger.UNIT_YEARS;
            break;
        }
        return jsUnits;
      }

      jsUnits = getJSUnits(json.timeUnits);

      //convert REST formatted break infos to JS API format
      //min age always 0. If maxAge is null, set it to infinity
      for (count = 0; count < jsonBreaks.length; count += 1){
        jsonBreak = jsonBreaks[count];
        jsBreak = {
          minAge: 0,
          maxAge: jsonBreak.oldestAge || Infinity
        };
        if (jsonBreak.color){
          jsBreak.color = esriColor.fromJSON(jsonBreak.color);
        }
        if (jsonBreak.alpha){
          jsBreak.alpha = jsonBreak.alpha / 255;
        }
        jsBreak.size = jsonBreak.size;
        jsBreaks[count] = jsBreak;
      }

      jsAger = new TimeClassBreaksAger(jsBreaks, jsUnits);
      return jsAger;
    },

    _heatmapFromJson: function(json){
      //convert colors or colorStops to dojo color
      var stops = json.colorStops;
      if(stops && stops instanceof Array){
        array.forEach(stops, function(s){
          s.color = esriColor.fromJSON(s.color);
        });
      }
      return new HeatmapRenderer(json);
    }
  };

  

  return jsonUtils;
});
