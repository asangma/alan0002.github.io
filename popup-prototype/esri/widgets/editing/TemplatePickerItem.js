define(
[
  "../../core/declare",
  "dojo/_base/lang", 
  "dojo/_base/array", 

  "dojo/has", 
  "dojo/sniff", 
  "dojo/dom-style", 

  "dijit/_Widget",
  "dijit/_Templated",

  "dojox/gfx",

  "../../symbols/support/jsonUtils",

  "../../kernel"
], function(
  declare, lang, array,
  has, sniff, domStyle,
  _Widget, _Templated,
  gfx,
  symbolJsonUtils,
  esriKernel
) {
  /***********************
   * Template Picker Item 
   ***********************/

  var TPI = declare([_Widget, _Templated], {
    declaredClass: "esri.widgets.editing.TemplatePickerItem",

    templateString: "<div class='item' style='text-align: center;'>" + 
                      "<div class='itemSymbol' dojoAttachPoint='_surfaceNode'></div>" + 
                      "<div class='itemLabel'>${label}</div>" + 
                    "</div>",

    startup: function(){
      if(this._started){
        return;
      }
      this.inherited(arguments);
      
      //try {
        this._surface = this._draw(this._surfaceNode, this.symbol, this.surfaceWidth, this.surfaceHeight, this.template);
      /*}
      catch (e) {
        //console.log(this.id);
        // TODO
        // Need to try catch here for IE.
        // In IE, sometimes createShape crashes because shape.rawNode has no
        // 'path' property yet (slow). This happens when IE is first opened 
        // with a page that has template picker. Everything is fine when the page
        // is refreshed. Instead of crashing, we can try catch here so that
        // atleast the label is displayed for the templates.
        // NOTE: This problem only happens for shapes of type 'path'
        // NOTE: registering 'whenLoaded' function does not solve this problem 
      }*/
    },
    
    _draw: function(node, symbol, sWidth, sHeight, template) {
      // Do not create GFX surface for text symbols. Display item "label" only 
      // i.e. "Text".
      // TODO
      // Not drawing the surface keeps the ux similar to AGOL 3.6.
      // But we can actually draw the surface and the text shape - based on 
      // Legend:_drawSymbol implementation.
      if (!symbol || symbol.type === "textsymbol") {
        return;
      }
      
      var surface = gfx.createSurface(node, sWidth, sHeight);
      if ( has("ie") < 9) {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell  
        var source = surface.getEventSource();
        domStyle.set(source, "position", "relative");
        domStyle.set(source.parentNode, "position", "relative");
      }
      var shapeDesc = (!this.legendOverride && this._getDrawingToolShape(symbol, template)) || 
                      symbolJsonUtils.getShapeDescriptors(symbol);
      
      var gfxShape;
      try {
        gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
      }
      catch (e) {
        surface.clear();
        surface.destroy();
        return;
      }
      
      var bbox = gfxShape.getBoundingBox(), 
          width = bbox.width, 
          height = bbox.height,
          
          // Borrowed from GraphicsLayer.js:
          // Aligns the center of the path with surface's origin (0,0)
          // This logic is specifically required for SMS symbols
          // with STYLE_PATH style
          vectorDx = -(bbox.x + (width / 2)),
          vectorDy = -(bbox.y + (height / 2)),
          
          // Aligns the center of the shape with the center of the surface 
          dim = surface.getDimensions(),
          transform = {
            dx: vectorDx + dim.width / 2,
            dy: vectorDy + dim.height / 2
          };

      if (width > sWidth || height > sHeight) {
        var test = (width/sWidth > height/sHeight);
        var actualSize = test ? width : height;
        var refSize = test ? sWidth : sHeight;
        var scaleBy = (refSize - 5) / actualSize;
        
        lang.mixin(transform, { 
          xx: scaleBy, 
          yy: scaleBy 
        });
      }

      gfxShape.applyTransform(transform);
      return surface;
    },
    
    _getDrawingToolShape : function(symbol, template){
        var shape, drawingTool = template ? template.drawingTool || null : null;
        switch(drawingTool){
          case "esriFeatureEditToolArrow" : 
            shape = { type: "path", path: "M 10,1 L 3,8 L 3,5 L -15,5 L -15,-2 L 3,-2 L 3,-5 L 10,1 E" };
            break;
          case "esriFeatureEditToolLeftArrow" : 
            shape = { type: "path", path: "M -15,1 L -8,8 L -8,5 L 10,5 L 10,-2 L -8,-2 L -8,-5 L -15,1 E" };
            break;
          case "esriFeatureEditToolRightArrow" : 
            shape = { type: "path", path: "M 10,1 L 3,8 L 3,5 L -15,5 L -15,-2 L 3,-2 L 3,-5 L 10,1 E" };
            break;
          case "esriFeatureEditToolUpArrow" : 
            shape = { type: "path", path: "M 1,-10 L 8,-3 L 5,-3 L 5,15 L -2,15 L -2,-3 L -5,-3 L 1,-10 E" };
            break;
          case "esriFeatureEditToolDownArrow" : 
            shape = { type: "path", path: "M 1,15 L 8,8 L 5,8 L 5,-10 L -2,-10 L -2,8 L -5,8 L 1,15 E" };
            break;
          case "esriFeatureEditToolTriangle" :
            shape = { type: "path", path: "M -10,14 L 2,-10 L 14,14 L -10,14 E" };
            break;
          case "esriFeatureEditToolRectangle" :
            shape = { type: "path", path: "M -10,-10 L 10,-10 L 10,10 L -10,10 L -10,-10 E" };
            break;
          case "esriFeatureEditToolCircle" :
            shape = { type: "circle", cx: 0, cy: 0, r: 10 };
            break;
          case "esriFeatureEditToolEllipse" :
            shape = { type: "ellipse", cx: 0, cy: 0, rx: 10, ry: 5 };
            break;
          case "esriFeatureEditToolFreehand" :          
            if (symbol.type === "simplelinesymbol" || symbol.type === "cartographiclinesymbol"){            
              shape = { type: "path", path: "m -11, -7c-1.5,-3.75 7.25,-9.25 12.5,-7c5.25,2.25 6.75,9.75 3.75,12.75c-3,3 -3.25,2.5 -9.75,5.25c-6.5,2.75 -7.25,14.25 2,15.25c9.25,1 11.75,-4 13.25,-6.75c1.5,-2.75 3.5,-11.75 12,-6.5" };
            }
            else {
              shape = { type: "path", path: "M 10,-13 c3.1,0.16667 4.42564,2.09743 2.76923,3.69231c-2.61025,2.87179 -5.61025,5.6718 -6.14358,6.20513c-0.66667,0.93333 -0.46667,1.2 -0.53333,1.93333c-0.00001,0.86666 0.6,1.66667 1.13334,2c1.03077,0.38462 2.8,0.93333 3.38974,1.70769c0.47693,0.42564 0.87693,0.75897 1.41026,1.75897c0.13333,1.06667 -0.46667,2.86667 -1.8,3.8c-0.73333,0.73333 -3.86667,2.66666 -4.86667,3.13333c-0.93333,0.8 -7.4,3.2 -7.6,3.06667c-1.06667,0.46667 -4.73333,1.13334 -5.2,1.26667c-1.6,0.33334 -4.6,0.4 -6.25128,0.05128c-1.41539,-0.18462 -2.34872,-2.31796 -1.41539,-4.45129c0.93333,-1.73333 1.86667,-3.13333 2.64615,-3.85641c1.28718,-1.47692 2.57437,-2.68204 3.88718,-3.54359c0.88718,-1.13845 1.8,-1.33333 2.26666,-2.45641c0.33334,-0.74359 0.37949,-1.7641 0.06667,-2.87692c-0.66666,-1.46666 -1.66666,-1.86666 -2.98975,-2.2c-1.27692,-0.26666 -2.12307,-0.64102 -3.27692,-1.46666c-0.66667,-1.00001 -1.01538,-3.01539 0.73333,-4.06667c1.73333,-1.2 3.6,-1.93333 4.93333,-2.2c1.33333,-0.46667 4.84104,-1.09743 5.84103,-1.23076c1.60001,-0.46667 6.02564,-0.50257 7.29231,-0.56924z" };
            }
            break;
          default: return null;
        }
        return { defaultShape: shape, fill: symbol.getFill(), stroke: symbol.getStroke() };
    },
    
    _repaint: function(shape) {
      // shape: is a surface or a shape
      if (!shape) {
        this._surface = this._draw(this._surfaceNode, this.symbol, this.surfaceWidth, this.surfaceHeight, this.template);
        return;
      }
      
      if(shape.getStroke && shape.setStroke){
        shape.setStroke(shape.getStroke());
      }
      if(shape.getFill && shape.setFill){
        shape.setFill(shape.getFill());
      }
      if(shape.children && lang.isArray(shape.children)){
        array.forEach(shape.children, this._repaint, this);
      }
    },
    
    destroy: function(){
      if(this._surface){
        this._surface.destroy();
        delete this._surface;
        //this._surface = null;
      }
      this.inherited(arguments);
    }
  });

  

  return TPI;
});
