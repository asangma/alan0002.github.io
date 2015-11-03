define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "../../core/lang"
],
function(declare, lang, esriLang) {

  var LayerTimeOptions = declare(null, {
    declaredClass: "esri.layers.support.LayerTimeOptions",
  
    constructor: function(json) {
     //timeDataCumulative:Boolean
     //timeOffset:Number
     //timeOffsetUnits:String
     //useTime:Boolean     
     if (json) {
         lang.mixin(this, json);
     }
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
     var json = {
         timeDataCumulative: this.timeDataCumulative,
         timeOffset: this.timeOffset,
         timeOffsetUnits: this.timeOffsetUnits,
         useTime: this.useTime                            
     };
     
     return esriLang.fixJson(json);                   
    }
  });
  
  return LayerTimeOptions;  
});
