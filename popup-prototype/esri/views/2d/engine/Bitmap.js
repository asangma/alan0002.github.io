define(
[
  "./DisplayObject"
],
function(
  DisplayObject
) {

var Bitmap = DisplayObject.createSubclass({
  
  className: "esri-bitmap",
  
  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  source
  //----------------------------------
  
  source:  null,
  
  _sourceSetter: function(value, oldValue) {
    // TODO handle string values
    if (value === oldValue) {
      return oldValue;
    }      
    // TODO YCA: for now source is a ready-to-use image/canvas/video... element
    //           so it's directly set on the surface, and draw is requested.
    //           I plan to handle string values, so surface may or may not be ready.
    //           Prior to do that DisplayObject should advertize whenever the surface change,
    //           so that the parent/stage can make the change to the DOM
    value.className = this.className;
    this.surface = value;
    this.requestRender();
    return value;
  }
    
});

return Bitmap;

});