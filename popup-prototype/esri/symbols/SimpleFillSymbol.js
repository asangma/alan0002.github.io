/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */

/**
 * Fill symbols are used to draw polygon features. SimpleFillSymbol is used for rendering 2D polygons. 
 * In addition, the symbol can have an optional outline, which is defined by a {@link module:esri/symbols/LineSymbol LineSymbol}.
 * 
 * @module esri/symbols/SimpleFillSymbol
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 * @see module:esri/symbols/PictureFillSymbol
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../core/lang",
  
  "./FillSymbol",
  "./SimpleLineSymbol"
],
function(
  declare, lang,
  esriLang,
  FillSymbol, SimpleLineSymbol
) {

  var sfsStyles = {
    STYLE_SOLID: "solid",
    STYLE_NULL: "none",
    STYLE_HORIZONTAL: "horizontal",
    STYLE_VERTICAL: "vertical",
    STYLE_FORWARD_DIAGONAL: "forward-diagonal",
    STYLE_BACKWARD_DIAGONAL: "backward-diagonal",
    STYLE_CROSS: "cross",
    STYLE_DIAGONAL_CROSS: "diagonal-cross"
  };

  var defaultProps = {
    style: "solid",
    outline: new SimpleLineSymbol(),
    color: [ 0, 0, 0, 0.25 ]
  };

     
     
  /* {
   * style: "esriSFSSolid|esriSFSNull|esriSFSHorizontal|esriSFSVertical|esriSFSForwardDiagonal|esriSFSBackwardDiagonal|esriSFSCross|esriSFSDiagonalCross",
   * color: [r,g,b,a] (0-255),
   * outline: JSON representation for SimpleLineSymbol
   * }
   */

  /**
  * @extends module:esri/symbols/FillSymbol
  * @constructor module:esri/symbols/SimpleFillSymbol
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */      
  var SFS = declare(FillSymbol, 
  /** @lends module:esri/symbols/SimpleFillSymbol.prototype */                  
  {
    declaredClass: "esri.symbols.SimpleFillSymbol",
    
    _styles: {
      "solid":             "esriSFSSolid", 
      "none":              "esriSFSNull", 
      "horizontal":        "esriSFSHorizontal", 
      "vertical":          "esriSFSVertical", 
      "forward-diagonal":  "esriSFSForwardDiagonal", 
      "backward-diagonal": "esriSFSBackwardDiagonal", 
      "cross":             "esriSFSCross", 
      "diagonal-cross":    "esriSFSDiagonalCross"
    },
    
    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultProps);
    },
     
    normalizeCtorArgs: function(style, outline, color) {
      if (style && typeof style !== "string") {
        return style;
      }
      var kwArgs = {};
      if (style) {
        kwArgs.style = style;
      }
      if (outline) {
        kwArgs.outline = outline;
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
    //  type
    //----------------------------------

    /**
     * For SimpleFillSymbol, the type is always `simplefillsymbol`.
     * 
     * @type {string}
     * @readOnly
     */
    type: "simplefillsymbol",
    
    //----------------------------------
    //  style
    //----------------------------------

    /**
     * The fill style.
     * The valid values are listed in the table below:
     *
     * Value | Description
     * ------|-------------
     * backward-diagonal | ![sfs-backward-diagonal](../assets/img/apiref/symbols/symbols-sfs-backward-diagonal.png)
     * cross | ![sfs-cross](../assets/img/apiref/symbols/symbols-sfs-cross.png)
     * diagonal-cross | ![sfs-diagonal-cross](../assets/img/apiref/symbols/symbols-sfs-diagonal-cross.png)
     * forward-diagonal | ![sfs-forward-diagonal](../assets/img/apiref/symbols/symbols-sfs-forward-diagonal.png)
     * horizontal | ![sfs-horizontal](../assets/img/apiref/symbols/symbols-sfs-horizontal.png)
     * none | The polygon has no fill.
     * solid | ![sfs-solid](../assets/img/apiref/symbols/symbols-sfs-solid.png)
     * vertical | ![sfs-vertical](../assets/img/apiref/symbols/symbols-sfs-vertical.png)
     *
     * @name style
     * @instance
     * @type {string}
     *
     * @default solid
     */
      
    _styleReader: function(value) {
      return esriLang.valueOf(this._styles, value);
    },
    

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      return esriLang.fixJson(lang.mixin(
        this.inherited(arguments),
        { 
          type:  "esriSFS", 
          style: this._styles[this.style]
        }
      ));
    }

  });

  lang.mixin(SFS, sfsStyles);
  SFS.defaultProps = defaultProps;
  
  return SFS;  
});
