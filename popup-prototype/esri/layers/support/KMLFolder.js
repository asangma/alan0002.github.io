define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "../../core/lang"
],
function(declare, lang, esriLang) {

  var KMLFolder = declare(null, {
    declaredClass: "esri.layers.support.KMLFolder",
    
    constructor: function(json) {
      lang.mixin(this, json);
      
      // The initial visibility is based on the
      // "visibility" value
      if (esriLang.isDefined(this.visibility)) {
        this.visible = !!this.visibility;
      }
    }
  });
  
  return KMLFolder;  
});
