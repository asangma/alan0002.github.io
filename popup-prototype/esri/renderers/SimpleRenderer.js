/**
 * A renderer that uses one symbol for all features.
 * 
 * @module esri/renderers/SimpleRenderer
 * @since 4.0
 * @see [Sample - 3D symbols for points](../sample-code/3d/points-3d/)
 * @see [Sample - SceneLayer](../sample-code/3d/scene-layer/)
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "../symbols/support/jsonUtils",
  "./Renderer"
],
function(declare, lang, esriLang, symUtils, Renderer) {

  /**
   * @extends module:esri/renderers/Renderer
   * @constructor module:esri/renderers/SimpleRenderer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */    
  var SimpleRenderer = declare(Renderer, 
  /** @lends module:esri/renderers/SimpleRenderer.prototype */                             
  {
    declaredClass: "esri.renderer.SimpleRenderer",
    
    constructor: function(sym) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.SimpleRenderer(<Object> json);

      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        
        sym = json.symbol;
        this.symbol = sym && (sym.declaredClass ? sym : symUtils.fromJSON(sym));
        
        this.label = json.label;
        this.description = json.description;
      }
      else {
        this.symbol = sym;
      }
    },

    /**
    * The description for the renderer.
    * 
    * @type {string}
    */
    description: null,   
      
    /**
    * The label for the renderer.
    * 
    * @type {string}
    */
    label: null, 
      
    /**
    * The symbol for the renderer.
    * 
    * @type {module:esri/symbols/Symbol}
    */
    symbol: null,  
      
    getSymbol: function(graphic) {
      return this.symbol;
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
      var retVal = lang.mixin(
        this.inherited(arguments),
        {
          type: "simple",
          label: this.label,
          description: this.description,
          symbol: this.symbol && this.symbol.toJSON()
        }
      );
      
      return esriLang.fixJson(retVal);
    }
  });

   

  return SimpleRenderer;
});
