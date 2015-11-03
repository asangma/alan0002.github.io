define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../core/lang",
  "../../Graphic"
],
function(declare, lang, esriLang, Graphic) {

  /******************************
   * esri.layers.FeatureTemplate
   ******************************/
  
  var FeatureTemplate = declare(null, {
    declaredClass: "esri.layers.support.FeatureTemplate",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.name = json.name;
        this.description = json.description;
        this.drawingTool = json.drawingTool;
        
        // prototypical feature
        var prototype = json.prototype;
        this.prototype = new Graphic(prototype.geometry, null, prototype.attributes);
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
      return esriLang.fixJson({
        name: this.name,
        description: this.description,
        drawingTool: this.drawingTool,
        prototype: this.prototype && this.prototype.toJSON()
      });
    }
  });
  
  // mixin enums for FeatureTemplate
  lang.mixin(FeatureTemplate, {
    TOOL_AUTO_COMPLETE_POLYGON: "esriFeatureEditToolAutoCompletePolygon",
    TOOL_CIRCLE: "esriFeatureEditToolCircle", // mapped to TOOL_POLYGON
    TOOL_ELLIPSE: "esriFeatureEditToolEllipse", // mapped to TOOL_POLYGON
    TOOL_FREEHAND: "esriFeatureEditToolFreehand",
    TOOL_LINE: "esriFeatureEditToolLine",
    TOOL_NONE: "esriFeatureEditToolNone", // for non-spatial tables; cannot be set for spatial data in ArcMap
    TOOL_POINT: "esriFeatureEditToolPoint",
    TOOL_POLYGON: "esriFeatureEditToolPolygon",
    TOOL_RECTANGLE: "esriFeatureEditToolRectangle",
    TOOL_ARROW: "esriFeatureEditToolArrow",
    TOOL_TRIANGLE: "esriFeatureEditToolTriangle",
    TOOL_LEFT_ARROW: "esriFeatureEditToolLeftArrow",
    TOOL_RIGHT_ARROW: "esriFeatureEditToolRightArrow",
    TOOL_UP_ARROW: "esriFeatureEditToolUpArrow",
    TOOL_DOWN_ARROW: "esriFeatureEditToolDownArrow"
  });
  
  return FeatureTemplate;  
});
