define(
[
  "../../core/declare",
  "dojo/_base/lang"
],
function(declare, lang) {

  /********************************
   * esri.layers.FeatureEditResult
   ********************************/
  
  var FeatureEditResult = declare(null, {
    declaredClass: "esri.layers.support.FeatureEditResult",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.objectId = json.objectId;
        this.success = json.success;
        if (!json.success) {
          var err = json.error;
          this.error = new Error();
          this.error.code = err.code;
          this.error.message = err.description;
        }
      }
    }
  });
  
  return FeatureEditResult;  
});
