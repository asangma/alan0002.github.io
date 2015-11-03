define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "../../core/lang",
  "../../renderers/support/jsonUtils",
  
  "./LabelClass"
],
function(
  declare, lang, array,
  esriLang, jsonUtils,
  LabelClass
) {

  var LayerDrawingOptions = declare(null, {
    declaredClass: "esri.layers.support.LayerDrawingOptions",
    
    constructor: function(json) {
      if (json) {
        lang.mixin(this, json);
        if (json.renderer) {
          this.renderer = jsonUtils.fromJSON(json.renderer);
        }
        if (json.labelingInfo && json.labelingInfo.length > 0) {
          this.labelingInfo = [];
          var labelClass;
          array.forEach(json.labelingInfo, function(labelClassJson){
            labelClass = new LabelClass(labelClassJson);
            this.labelingInfo.push(labelClass);
          }, this);
        }
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
        renderer: this.renderer && this.renderer.toJSON(),
        transparency: this.transparency,
        scaleSymbols: this.scaleSymbols,
        showLabels: this.showLabels
      }; 
      
      if (this.labelingInfo && this.labelingInfo.length > 0) {
        json.labelingInfo = [];
        array.forEach(this.labelingInfo, function(labelClass){
          json.labelingInfo.push(labelClass.toJSON());
        });
      }
      return esriLang.fixJson(json);
    }
  });
  
  return LayerDrawingOptions;  
});
