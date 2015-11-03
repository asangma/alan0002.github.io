/**
 * Marker symbols are used to draw points and multipoints on the graphics layer or feature 
 * layer. MarkerSymbol is the base symbol class for 
 * {@link module:esri/symbols/SimpleMarkerSymbol SimpleMarkerSymbol} and 
 * {@link module:esri/symbols/PictureMarkerSymbol PictureMarkerSymbol} and has no constructor.
 *
 * @module esri/symbols/MarkerSymbol
 * @noconstructor
 * @since 4.0
 * @see module:esri/symbols/SimpleMarkerSymbol
 * @see module:esri/symbols/PictureMarkerSymbol
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
   * @constructor module:esri/symbols/MarkerSymbol
   */
  var MarkerSymbol = declare(Symbol, 
  /** @lends module:esri/symbols/MarkerSymbol.prototype */
  {
    declaredClass: "esri.symbols.MarkerSymbol",

   
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  angle
    //----------------------------------

    /**
     * Angle of the marker in degrees.
     *
     * @type {number}
     * @default 0
     */
    angle: 0,
    
    _angleReader: function(value) {
      // ArcGIS Server REST API specifies angle in counter-clockwise direction.
      // But JS impl and devs expect to handle it in clockwise direction.
      // We'll convert it back to REST notation in toJson
      return value && (-1 * value);
    },
    
    //----------------------------------
    //  type
    //----------------------------------  
      
    /**
    * The type of symbol.
    * 
    * **Possible values:** simplemarkersymbol | picturemarkersymbol
    * 
    * @type {string}
    * @readonly
    */
    type: null,
    
    //----------------------------------
    //  xoffset
    //----------------------------------
    
    /**
     * The offset on the x-axis in pixels.
     *
     * @type {number}
     * @default 0
     */
    xoffset: 0,
    
    _xoffsetReader: screenUtils.pt2px,
    
    //----------------------------------
    //  yoffset
    //----------------------------------
    
    /**
     * The offset on the y-axis in pixels.
     *
     * @type {number}
     * @default 0
     */
    yoffset: 0,
    
    _yoffsetReader: screenUtils.pt2px,
    
    //----------------------------------
    //  size
    //----------------------------------
    
    /**
     * Size of the marker in pixels.
     *
     * @type {number}
     * @default
     */
    size: 12,
    
    _sizeReader: function(value) {
      return (value === "auto") ? value : screenUtils.pt2px(value);
    },

    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var size = screenUtils.px2pt(this.size);
      size = isNaN(size) ? undefined : size;
      
      var xoff = screenUtils.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = screenUtils.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;
      
      return lang.mixin(
        this.inherited(arguments), 
        { 
          size: (this.size === "auto") ? this.size : size, 
          
          // ArcGIS Server REST API specifies angle in counter-clockwise direction.
          angle: this.angle && (-1 * this.angle),
           
          xoffset: xoff, 
          yoffset: yoff 
        }
      );
    }

  });

  return MarkerSymbol;
});
