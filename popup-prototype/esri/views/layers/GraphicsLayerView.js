/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../core/declare",
  
  "./LayerView"
],
function(
  declare,
  LayerView
) {

var GraphicsLayerView = declare(LayerView, {
  declaredClass: "esri.views.layers.GraphicsLayerView",

  //--------------------------------------------------------------------------
  //
  //  Constructor
  //
  //--------------------------------------------------------------------------
  
  constructor: function(properties) {
    //this._scaleChangeHandler    = lang.hitch(this, this._scaleChangeHandler);
    // this._viewChangeHandler     = lang.hitch(this, this._viewChangeHandler);
    //this._rendererChangeHandler = lang.hitch(this, this._rendererChangeHandler);
    
    //this.on("suspend", lang.hitch(this, this._suspendHandler));
    //this.on("resume", lang.hitch(this, this._resumeHandler));
  },
  

  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------
  
  getRenderer: function(graphic) {
    if (!graphic || graphic.symbol) {
      return null;
    }
    
    // Call this method to compute one of the following:
    // 1) scale appropriate top level renderer
    var effective = this._rndForScale || this.layer.get("renderer");

    // 2) the leaf renderer that can be queried for rotation and 
    //    proportional symbol information
    if (graphic && effective && effective.getObservationRenderer) {
      // TemporalRenderer
      effective = effective.getObservationRenderer(graphic);
    }

    return effective;
  },
  
  getSymbol: function(graphic) {
    if (graphic.symbol) {
      return graphic.symbol;
    }
    
    // Rotation angle and proportional symbol size should be mixed-in 
    // by the caller before drawing the feature.
    // Note that the returned symbol is already aged if:
    // - the layer has a TemporalRenderer with Ager or  
    // - the layer has a ScaleDependentRenderer with a constituent 
    //   TemporalRenderer with Ager
    var rnd = this.getRenderer(graphic);
    return rnd && rnd.getSymbol(graphic);
  },
  
  getRenderingInfo: function(graphic) {    
    var renderer = this.getRenderer(graphic),
        symbol = this.getSymbol(graphic),
        renderingInfo, size;
        
    if (!symbol) {
      return null;
    }
    
    renderingInfo = {
      renderer: renderer,
      symbol: symbol
    };
    
    if (renderer) {
      if (renderer.colorInfo) {
        // It is assumed that getColor *will* return a color.
        // If it doesn't, then we have a problem in renderer color implementation
        renderingInfo.color = renderer.getColor(graphic);
      }
      if (renderer.sizeInfo) {
        // Calculate proportional symbol size if defined by the renderer
        size = renderer.getSize(graphic);
        renderingInfo.size = [size, size, size];
      }
      if (renderer.visualVariables) {
        // Override renderingInfo.size and .color with visual variables (if present).
        // All sizeInfo definitions are collapsed into a single array with one component for each axis.
        var visualVariables = renderer.getVisualVariableValues(graphic);
        size = ["proportional", "proportional", "proportional"];
        for (var vvIdx = 0; vvIdx < visualVariables.length; vvIdx++) {
          var visualVariable = visualVariables[vvIdx];
          var type = visualVariable.variable.type;
          if (type === "colorInfo") {
            renderingInfo.color = visualVariable.value;
          }
          else if (type === "sizeInfo") {
            var axis = visualVariable.variable.axis;
            var value = visualVariable.variable.useSymbolValue ? "symbolValue" : visualVariable.value;
            if (axis === "width") {
              size[0] = value;
            } else if (axis === "depth") {
              size[1] = value;
            } else if (axis === "height") {
              size[2] = value;
            } else if (axis === "widthAndDepth") {
              size[0] = size[1] = value;
            } else { // includes axis === "all"
              size[0] = size[1] = size[2] = value;
            }
          }
          else if (type === "opacityInfo") {
            renderingInfo.opacity = visualVariable.value;
          }
        }
        if (isFinite(size[0]) || isFinite(size[1]) || isFinite(size[2])) {
          // sizeInfo is only relevant if at least one axis has been set to a concrete value
          renderingInfo.size = size;
        }
      }
    }
    
    return renderingInfo;
  },
  
  //--------------------------------------------------------------------------
  //
  //  Private functions
  //
  //--------------------------------------------------------------------------
  
  // TODO YCA
  _evalSDRenderer: function() {
    // Evaluates scale dependent renderer and extracts the renderer
    // appropriate for the map scale - at the time of this invocation.
    // This method should be called:
    // - when setRenderer is called to change the layer's renderer
    // - when map zoom level or map scale changes
    /*var state = this.state,
        renderer = this.layer.renderer,
        rndInfo;

    if (map && map.loaded && renderer && renderer.getRendererInfo) {
      // ScaleDependentRenderer
      rndInfo = renderer.rangeType === "zoom" ? 
                renderer.getRendererInfoByZoom(state.get("zoom")) :
                renderer.getRendererInfoByScale(state.get("scale"));
    }

    this._rndForScale = rndInfo && rndInfo.renderer;*/
  }
  

  //--------------------------------------------------------------------------
  //
  //  Event Handlers
  //
  //--------------------------------------------------------------------------
  
//   _scaleChangeHandler: function() {
    
//   },
  
//   _rendererChangeHandler: function() {
    
//   },
  
//   _resumeHandler: function() {
    
//   },
  
//   _suspendHandler: function() {
    
//   }
  
});

return GraphicsLayerView;

});
