/**
 * Fill symbols are used to draw polygon features on the graphics layer or feature layer.
 * FillSymbol is the base symbol class for polygons. To create new fill symbols, use either 
 * {@link module:esri/symbols/SimpleFillSymbol} or {@link module:esri/symbols/PictureFillSymbol}.
 *
 * @module esri/symbols/FillSymbol
 * @noconstructor
 * @since 4.0
 * @see module:esri/symbols/SimpleFillSymbol
 * @see module:esri/symbols/PictureFillSymbol
 */
define(
[
  "../core/declare",

  "./Symbol",
  "./SimpleLineSymbol"
],
function(
  declare,
  Symbol,
  SimpleLineSymbol
) {

  /**
   * @extends module:esri/symbols/Symbol
   * @constructor module:esri/symbols/FillSymbol
   */
  var FillSymbol = declare(Symbol,
  /** @lends module:esri/symbols/FillSymbol.prototype */
  {
    declaredClass: "esri.symbols.FillSymbol",
    
    classMetadata: {
      properties: {
        outline: {
          type: SimpleLineSymbol
        }
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  type
    //----------------------------------  
      
      /**
      * The type of symbol.
      * 
      * **Possible values:** simplefillsymbol | picturefillsymbol
      * 
      * @type {string}
      * @readonly
      */ 
      type: null,
      
    //----------------------------------
    //  outline
    //----------------------------------
     
    /**
     * Outline of the polygon.
     *
     * @name outline
     * @instance
     * @type {module:esri/symbols/SimpleLineSymbol}
     */
    
    _outlineReader: SimpleLineSymbol.fromJSON,
    
    
    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------
    
    toJSON: function() {
      var json = this.inherited(arguments);
      if (this.outline) {
        json.outline = this.outline.toJSON();
      }
      return json;
    }
    
  });

  return FillSymbol;  
});
