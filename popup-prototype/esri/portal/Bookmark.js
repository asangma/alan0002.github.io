define(
[
  "../Viewpoint",

  "../core/lang",
  "../core/JSONSupport"
],
function(
  Viewpoint,
  coreLang, JSONSupport
) {
  
var Bookmark = JSONSupport.createSubclass({
  declaredClass: "esri.arcgis.Bookmark",

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------
  
  // title: String
  // description: String
  // thumbnailSource // url, {contentType, imageData}, <img>, <canvas>, <video>
  
  //----------------------------------
  //  viewpoint
  //----------------------------------
  
  _viewpointReader: function(value, source) {
    if (source.viewpoint) {
      return Viewpoint.fromJSON(source.viewpoint);
    }
  },

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------
  
  toJSON: function() {
    var json = {
      title: this.title,
      description: this.description,
      thumbnailSource: this.thumbnailSource,
      viewpoint: this.viewpoint ? this.viewpoint.toJSON() : undefined
    };
    return coreLang.fixJson(json);
  }
  
});

return Bookmark;

});
