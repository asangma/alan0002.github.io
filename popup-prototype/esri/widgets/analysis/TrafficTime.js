define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/event",
  "dojo/_base/kernel",
  "dojo/dom-attr",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/has",
  
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/form/CheckBox",
  "dijit/form/RadioButton",
  "dijit/form/TimeTextBox",
  "dijit/form/Select",
  "dijit/form/HorizontalSlider",
  "dijit/form/HorizontalRule",
  "dijit/form/HorizontalRuleLabels",
  "../../kernel",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/TrafficTime.html"
],

function(require, declare, lang, connection, event, kernel, domAttr, string, domStyle, domClass, has, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _OnDijitClickMixin, _FocusMixin, CheckBox, RadioButton, TimeTextBox, Select, HorizontalSlider, HorizontalRule,  HorizontalRuleLabels, esriKernel, jsapiBundle , template) {
 
  var TrafficTime = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _OnDijitClickMixin, _FocusMixin], {
    declaredClass: "esri.widgets.analysis.TrafficTime",
    i18n: null,
    basePath: require.toUrl("."),
    templateString: template,
    widgetsInTemplate: true,
    _liveOffset: 0,
    
    
    postMixInProperties: function() {
      //this.inherited(arguments);
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.driveTimes);
    },
    
    postCreate: function() {
      this.inherited(arguments);
      this._handleUseTrafficCheckChange(this._useTrafficCheck.get("value"));
    },
   
    _handleUseTrafficCheckChange: function(value) {
      this._typicalTrafficRadioBtn.set("disabled", !value);
      this._liveTrafficRadioBtn.set("disabled", !value);
      if(!value) {
        this._liveTimeSlider.set("disabled", !value);
        this._trafficTime.set("disabled", !value);
        this._trafficDay.set("disabled", !value);
      }
      else {
        this._handleLifeTrafficRadioChange(this._liveTrafficRadioBtn.get("value"));
      }
      if(value) {
        domClass.remove(this._liveTraficLabel, "esriAnalysisTextDisabled");
        domClass.remove(this._typicalTraficLabel, "esriAnalysisTextDisabled");
        domClass.remove(this._liveTimeRuleLabels, "esriAnalysisTextDisabled");
      }
      else {
        domClass.add(this._liveTraficLabel, "esriAnalysisTextDisabled");
        domClass.add(this._typicalTraficLabel, "esriAnalysisTextDisabled");
        domClass.add(this._liveTimeRuleLabels, "esriAnalysisTextDisabled");
      }
    },
    
    _handleLifeTrafficRadioChange: function(value) {
      this._liveTimeSlider.set("disabled", !value);
      this._trafficTime.set("disabled", value);
      this._trafficDay.set("disabled", value);
    },
    
    _setDisabledAttr: function(value) {
      this._useTrafficCheck.set("disabled", value);
    },
    
    _setResetAttr: function(value) {
      if(value) {
        this._useTrafficCheck.set("checked", false);
      }
    },
    
    _getCheckedAttr: function() {
      return this._useTrafficCheck.get("checked");
    }, 
    
    _setCheckedAttr: function(value) {
      this._useTrafficCheck.set("checked", value);
    },
   
    _getTimeOfDayAttr: function() {
      var timeMs, trafficDayDate;
      if(this._liveTrafficRadioBtn.get("value")) {
       timeMs = (new Date()).getTime() + this._liveOffset * 60 * 1000;
       //console.log("live", timeMs);
      }
      else {
        trafficDayDate = new Date(this._trafficDay.get("value"));
        timeMs = trafficDayDate.getTime() - (trafficDayDate.getTimezoneOffset() * 60 * 1000) + (this._trafficTime.get("value")).getTime() - ((this._trafficTime.get("value")).getTimezoneOffset() * 60 * 1000);
      }
      //console.log('day', this._trafficDay.get("value"));
      //console.log('time', this._trafficTime.get("value"));
      //console.log('day date', new Date(this._trafficDay.get("value")));
      //console.log("before just getTime", trafficDayDate.getTime());
      //console.log("time A", trafficDayDate.getTime() +  (this._trafficTime.get("value")).getTime());
      //console.log("time B new" , timeMs);
      //console.log("time C", (trafficDayDate.getTime() +  (this._trafficTime.get("value")).getTime()) - (trafficDayDate.getTimezoneOffset() * 60 * 1000));
      return timeMs;
    },
    
    _getTimeZoneForTimeOfDayAttr: function() {
      //GeoLocal is default but we dont pass this value
      return this._liveTrafficRadioBtn.get("value")? "UTC": "";
    }, 
    
    _handleLiveTimeSliderChange: function(value) {
      var totalMinutes, hours, minutes, timeLabel;
      totalMinutes = value * 60;
      hours = Math.floor(value);
      minutes = totalMinutes - (hours * 60);
      if(hours === 0 && minutes === 0) {
        timeLabel = this.i18n.liveTrafficLabel;
      }
      else if(hours === 0) {
        timeLabel = string.substitute(this.i18n.liveTimeMinutesLabel, {minute: minutes});
      }
      else if(hours === 1) {
        if(minutes === 0) {
          timeLabel = this.i18n.liveSingularHourTimeLabel;
        }
        else {
          timeLabel = string.substitute(this.i18n.liveSingularTimeLabel, {minute: minutes});
        }
      }
      else {
        if(minutes === 0) {
          timeLabel = string.substitute(this.i18n.liveTimeHoursLabel, {hour: hours, minute: minutes});
        }
        else {
          timeLabel = string.substitute(this.i18n.liveTimeLabel, {hour: hours, minute: minutes});  
        }
      }
      this._liveOffset = totalMinutes;
      domAttr.set(this._liveTraficLabel, "innerHTML", timeLabel);
    }
  });

  
  return TrafficTime;  
});
    