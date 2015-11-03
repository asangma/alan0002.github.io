define(
[
  "../../core/declare",
  "../../core/lang",
  "./MapImage"
],
function(
  declare,
  esriLang,
  MapImage
) {

  var KMLGroundOverlay = declare([ MapImage ], {
    declaredClass: "esri.layers.support.KMLGroundOverlay",
    
    constructor: function(json) {
      // Superclass will mixin json with "this"
      
      // The initial visibility of a ground overlay is based on its
      // "visibility" property
      if (esriLang.isDefined(this.visibility)) {
        this.visible = !!this.visibility;
      }
    }
  });
  
  return KMLGroundOverlay;  
});
