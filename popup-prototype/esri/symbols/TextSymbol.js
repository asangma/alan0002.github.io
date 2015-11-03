/**
 * Text symbols are used to add text on the graphics layer.
 * 
 * @module esri/symbols/TextSymbol
 * @since 4.0
 * @see module:esri/symbols/TextSymbol3DLayer
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../core/lang",
  "../core/screenUtils",

  "./Symbol",
  "./Font"
],
function(
  declare, lang,
  esriLang, screenUtils,
  Symbol, Font
) {
  
  var tsEnums = {
    ALIGN_START:  "start", 
    ALIGN_MIDDLE: "middle", 
    ALIGN_END:    "end",
    
    DECORATION_NONE:        "none", 
    DECORATION_UNDERLINE:   "underline", 
    DECORATION_OVERLINE:    "overline", 
    DECORATION_LINETHROUGH: "line-through"
  };
  
  var defaultProps = {
    x:       0,
    y:       0,
    text:    "",
    rotated: false,
    kerning: true,
    color:   [ 0, 0, 0, 1 ], 
    font:    {}, 
    angle:   0, 
    xoffset: 0, 
    yoffset: 0,
    horizontalAlignment: "center"
  };

  /**
   * @extends module:esri/symbols/Symbol
   * @constructor module:esri/symbols/TextSymbol
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var TextSymbol = declare(Symbol, 
  /** @lends module:esri/symbols/TextSymbol.prototype */                         
  {
    declaredClass: "esri.symbols.TextSymbol",
    
    classMetadata: {
      properties: {
        font: {
          type: Font
        }
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultProps);
    },

    normalizeCtorArgs: function(text, font, color) {
      if (text && typeof text !== "string") {
        return text;
      }
      var kwArgs = {};
      if (text) {
        kwArgs.text = text;
      }
      if (font) {
        kwArgs.font = font;
      }
      if (color) {
        kwArgs.color = color;
      }
      return kwArgs;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  color
    //----------------------------------  
      
    /**
    * The color of the text.
    * 
    * @name color
    * @instance
    * @type {module:esri/Color}
    */  
      
    //----------------------------------
    //  font
    //----------------------------------

    /**
    * Font for displaying text.
    * 
    * @name font
    * @instance
    * @type {module:esri/symbols/Font}
    */
      
    _fontReader: Font.fromJSON,
      
    //----------------------------------
    //  horizontalAlignment
    //----------------------------------  
      
    /**
    * Horizontal alignment of the text with respect to the graphic.
    * 
    * **Possible Values:** left | right | center | justify
    * 
    * @name horizontalAlignment
    * @instance
    * @type {string}
    * @default center
    */  
      
    //----------------------------------
    //  kerning
    //----------------------------------  
      
    /**
    * Determines whether to adjust the spacing between characters in the text string.
    * 
    * @name kerning
    * @instance
    * @type {boolean}
    * @default true
    */    
     
    //----------------------------------
    //  haloColor
    //---------------------------------- 
     
    /**
     * The color of the text symbol's halo. To include a halo in the TextSymbol, you
     * must also set the size of the halo in [haloSize](#haloSize). 
     * 
     * **Known limitations:**
     * * Not supported in IE 9 or below.
     * * Sub-pixel halo (i.e. fractional size such as 1.25px) renders inconsistently in various browsers.
     * 
     * @name haloColor
     * @instance
     * @type {module:esri/Color}
     */
     
     
    //----------------------------------
    //  haloSize
    //----------------------------------

    /**
     * The size (in pixels) of the text symbol's halo. To include a halo in the TextSymbol, you
     * must also set the color of the halo in [haloColor](#haloColor).
     * 
     * **Known limitations:**
     * * Not supported in IE 9 or below.
     * * Sub-pixel halo (i.e. fractional size such as 1.25px) renders inconsistently in various browsers.
     * 
     * @name haloSize
     * @instance
     * @type {Number}
     */
     
    //---------------------------------- 
    //  rotated
    //----------------------------------  
      
    /**
    * Determines whether every character in the text string is rotated.
    * 
    * @name rotated
    * @instance
    * @type {boolean}
    * @default false
    */  
      
    //----------------------------------
    //  text
    //----------------------------------  
    
    /**
    * Text string for display in the graphics layer.
    * 
    * @name text
    * @instance
    * @type {string}
    */  
      
    //----------------------------------
    //  type
    //----------------------------------
    
    /**
    * For TextSymbol, the type is always `textsymbol`.
    * 
    * @type {string}
    * @readonly
    */
    type: "textsymbol",
      
    //----------------------------------
    //  verticalAlignment
    //----------------------------------  
    
    /**
    * Vertical alignment of the text with respect to the graphic.
    * 
    * **Possible Values:** baseline | top | middle | bottom
    * 
    * @type {string}
    * @default baseline
    */
      
    //----------------------------------
    //  xoffset
    //----------------------------------
    
    /**
    * The offset on the x-axis in pixels from the point.
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
    * The offset on the y-axis in pixels from the point.
    * 
    * @type {number}
    * @default 0
    */
    yoffset: 0,
    
    _yoffsetReader: screenUtils.pt2px,

    //----------------------------------
    //  angle
    //----------------------------------

    /**
    * Text angle. `0` is horizontal and the angle moves clockwise.
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

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
  
    toJSON: function() {
      var xoff = screenUtils.px2pt(this.xoffset),
          yoff = screenUtils.px2pt(this.yoffset);
      
      xoff = isNaN(xoff) ? undefined : xoff;
      yoff = isNaN(yoff) ? undefined : yoff;
      
      // NOTE
      // We don't support backgroundColor and borderLineColor,
      // but we need to serialize them back to not
      // mess with other environments reading this serialized json.
      // See: http://nil/rest-docs/symbol.html
      
      return esriLang.fixJson(lang.mixin(
        this.inherited(arguments),
        { 
          type:                "esriTS", 
          backgroundColor:     this.backgroundColor,
          borderLineColor:     this.borderLineColor,
          borderLineSize:      this.borderLineSize,
          haloSize:            this.haloSize,
          haloColor:           this.haloColor,
          verticalAlignment:   this.verticalAlignment,
          horizontalAlignment: this.horizontalAlignment,
          rightToLeft:         this.rightToLeft,
          width:               this.width, // Not in REST model but Explorer online has it. Let's serialize it out.

          // ArcGIS Server REST API specifies angle in counter-clockwise direction.
          angle: this.angle && (-1 * this.angle),

          xoffset:             xoff, 
          yoffset:             yoff, 
          text:                this.text, 
          rotated:             this.rotated, 
          kerning:             this.kerning, 
          font:                this.font && this.font.toJSON()
        }
      ));
    }

  });

  lang.mixin(TextSymbol, tsEnums);
  TextSymbol.defaultProps = defaultProps;

  return TextSymbol;  
});
