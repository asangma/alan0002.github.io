define(
[
  "../../core/declare",
  "dojo/_base/lang"
],
function(declare, lang) {

  var TimeReference = declare(null, {
    declaredClass: "esri.layers.support.TimeReference",
    
    constructor: function(json) {
      //respectsDaylightSaving : Boolean      
      //timeZone : String
      if (json) {
        lang.mixin(this, json);      
      }             
    }
  });
  
  return TimeReference;  
});
