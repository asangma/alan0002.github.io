/**
 * Line symbols are used to draw linear features on the layer. This 
 * is the base symbol class for lines and has no constructor.
 *
 * @module esri/symbols/LineSymbol
 * @noconstructor
 * @since 4.0
 * @see module:esri/symbols/SimpleLineSymbol
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  
  "../core/screenUtils",
  
  "./Symbol"
],
function(
  declare, lang,
  screenUtils,
  Symbol
) {

  /**
   * @extends module:esri/symbols/Symbol
   * @constructor module:esri/symbols/LineSymbol
   */
  var LineSymbol = declare(Symbol,
  /** @lends module:esri/symbols/LineSymbol.prototype */
  {
    declaredClass: "esri.symbols.LineSymbol",
    
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
      * **Possible values:** simplelinesymbol
      * 
      * @type {string}
      * @readonly
      */
      type: null,
      
    //----------------------------------
    //  width
    //----------------------------------
    
    /**
     * The width of line symbol in pixels.
     *
     * @type {number}
     * @default
     */
    width: 1, 

    _widthReader: screenUtils.pt2px,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
      
    toJSON: function() {
      var width = screenUtils.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      return lang.mixin(
        this.inherited(arguments),
        { width: width }
      );
    }
    
  });

  return LineSymbol;  
});
