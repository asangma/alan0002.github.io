define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../TimeExtent",
  
  "./TimeReference",
  "./LayerTimeOptions"
],
function(
  declare, lang,
  TimeExtent, TimeReference, LayerTimeOptions
) {

  var TimeInfo = declare(null, {
    declaredClass: "esri.layers.support.TimeInfo",
  
    constructor: function(json) {
      //timeInterval : Number
      //timeIntervalUnits : String    
      //endTimeField : String    
      //exportOptions : LayerTimeOptions  
      //startTimeField : String    
      //timeExtent : TimeExtent    
      //timeReference : TimeReference    
      //trackIdField : String      
      if (json !== null) {
          lang.mixin(this, json);
          if (json.exportOptions) {
              this.exportOptions = new LayerTimeOptions(json.exportOptions);
          }
          
          this.timeExtent = null;
          if (json.timeExtent && json.timeExtent.length === 2) {
            this.timeExtent = new TimeExtent(json.timeExtent);
          }
          this.timeReference = new TimeReference(json.timeReference);
      }      
    }
  });
  
  lang.mixin(TimeInfo, {
     UNIT_CENTURIES: "esriTimeUnitsCenturies", 
     UNIT_DAYS: "esriTimeUnitsDays", 
     UNIT_DECADES: "esriTimeUnitsDecades", 
     UNIT_HOURS: "esriTimeUnitsHours",
     UNIT_MILLISECONDS: "esriTimeUnitsMilliseconds",
     UNIT_MINUTES: "esriTimeUnitsMinutes",
     UNIT_MONTHS: "esriTimeUnitsMonths",
     UNIT_SECONDS: "esriTimeUnitsSeconds",
     UNIT_UNKNOWN: "esriTimeUnitsUnknown",
     UNIT_WEEKS: "esriTimeUnitsWeeks",
     UNIT_YEARS: "esriTimeUnitsYears"
  });
  
  return TimeInfo;  
});
