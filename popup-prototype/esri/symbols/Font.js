/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
/**
 * Font used for {@link module:esri/symbols/TextSymbol text symbols} added to the {@link module:esri/layers/GraphicsLayer graphics layer}.
 * 
 * @module esri/symbols/Font
 * @since 4.0
 * @see module:esri/symbols/TextSymbol
 */
define(
[
  "dojo/_base/lang",
  
  "../core/JSONSupport",
  "../core/lang",
  "../core/screenUtils"
],
function(
  lang,
  JSONSupport, esriLang, screenUtils
) {
  
  var fontEnums = {
    STYLE_NORMAL:  "normal", 
    STYLE_ITALIC:  "italic", 
    STYLE_OBLIQUE: "oblique",
    
    VARIANT_NORMAL:    "normal", 
    VARIANT_SMALLCAPS: "small-caps",
    
    WEIGHT_NORMAL:  "normal", 
    WEIGHT_BOLD:    "bold", 
    WEIGHT_BOLDER:  "bolder", 
    WEIGHT_LIGHTER: "lighter"
  };

  /** @alias module:esri/symbols/Font */      
  var defaultProps = {
      
     /**
     * Text style. 
     * 
     * **Possible Values:** normal | italic | oblique
     * 
     * @type {string}
     * @instance
     * @default
     * @see [MDN: font-style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style)
     */
    style: "normal",

    /**
     * Text variant. 
     * 
     * **Possible Values:** normal | small-caps
     * 
     * @type {string}
     * @instance
     * @default
     * @see [MDN: font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant)
     */
    variant: "normal",

    /**
     * Text weight. 
     * 
     * **Possible Values:** normal | bold | bolder | lighter
     * 
     * @type {string}
     * @instance
     * @default
     * @see [MDN: font-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight)
     */
    weight: "normal",

    /**
     * Font size in pixels. 
     * 
     * @type {number}
     * @instance
     * @default
     * @see [MDN: font-size](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)
     */  
    size: 12, // pixels

    /**
     * Font family. 
     * 
     * @type {string}
     * @instance
     * @default
     * @see [MDN: font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family)
     */  
    family: "serif",

    /**
     * Text decoration. 
     * 
     * **Possible Values:** underline | line-through | none
     * 
     * @type {string}
     * @instance
     * @default
     */
    decoration: "none"
  };

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/symbols/Font
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Font = JSONSupport.createSubclass(
  /** @lends module:esri/symbols/Font.prototype */                   
  {
    declaredClass: "esri.symbols.Font",
    

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      
      // "font" : {
      //   "family" : "<fontFamily>",
      //   "size" : <fontSize>,
      //   "style" : "<italic | normal | oblique>",
      //   "weight" : "<bold | bolder | lighter | normal>",
      //   "decoration" : "<line-through | underline | none>"
      // }

      return defaultProps;
    },

    normalizeCtorArgs: function(/*String*/ size, /*String*/ style, /*String*/ variant, /*String|Number*/ weight, /*String*/ family) {
      if (size && typeof size !== "string") {
        return size;
      }
      var kwArgs = {};
      if (size != null) {
        kwArgs.size = size;
      }
      if (style != null) {
        kwArgs.style = style;
      }
      if (variant != null) {
        kwArgs.variant = variant;
      }
      if (weight != null) {
        kwArgs.weight = weight;
      }
      if (family) {
        kwArgs.family = family;
      }
      return kwArgs;
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  size
    //----------------------------------
    
    _sizeReader: screenUtils.pt2px,
    
    _sizeSetter: function(value) {
      var floatValue = parseFloat(value),
          pxSize;
      //if it's a number, it implies it's in px
      if (floatValue == value) {
        pxSize = value;
      }
      else if (lang.isString(value)) {
        if (value.indexOf("pt") > -1) {
          pxSize = screenUtils.pt2px(floatValue);
        }
        else if (value.indexOf("px") > -1) {
          pxSize = floatValue;
        }
        else if (value.indexOf("em") > -1){
          pxSize = screenUtils.pt2px(floatValue * 12);
        }
        else if (value.indexOf("%") > -1){
          pxSize = screenUtils.pt2px(floatValue * 0.12);
        }
      }
      return pxSize;
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      return esriLang.fixJson({ 
        size:       screenUtils.px2pt(this.size), 
        style:      this.style, 
        variant:    this.variant,
        decoration: this.decoration, 
        weight:     this.weight, 
        family:     this.family 
      });
    }
    
  });

  Font.defaultProps = defaultProps;

  lang.mixin(Font, fontEnums);

  return Font;  
});
