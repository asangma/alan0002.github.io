/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

/**
 * Line symbols are used to draw linear features on the layer. SimpleLineSymbol 
 * renders lines for linear features and outlines for point and polygon features in 2D.
 * 
 * @module esri/symbols/SimpleLineSymbol
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  
  "../core/lang",
  
  "./LineSymbol"
],
function(
  declare, lang,
  esriLang,
  LineSymbol
) {

  var slsStyles = {
    STYLE_SOLID:      "solid",
    STYLE_DASH:       "dash",
    STYLE_DOT:        "dot",
    STYLE_DASHDOT:    "dash-dot",
    STYLE_DASHDOTDOT: "long-dash-dot-dot",
    STYLE_NULL:       "none",

    // See:
    // dojox/gfx/svg.js
    // https://developer.mozilla.org/en-US/docs/SVG/Attribute/stroke-dasharray
    // http://msdn.microsoft.com/en-us/library/bb264085%28v=vs.85%29.aspx
    STYLE_SHORTDASH:       "short-dash",
    STYLE_SHORTDOT:        "short-dot",
    STYLE_SHORTDASHDOT:    "short-dash-dot",
    STYLE_SHORTDASHDOTDOT: "short-dash-dot-dot",
    STYLE_LONGDASH:        "long-dash",
    STYLE_LONGDASHDOT:     "long-dash-dot"
  };

  var defaultProps = {
    color: [ 0, 0, 0, 1 ], 
    style: "solid", 
    width: 1 
  };

 /**
  * @extends module:esri/symbols/LineSymbol
  * @constructor module:esri/symbols/SimpleLineSymbol
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */
  var SimpleLineSymbol = declare(LineSymbol, 
  /** @lends module:esri/symbols/SimpleLineSymbol.prototype */                               
  {
    declaredClass: "esri.symbols.SimpleLineSymbol",
    
    _jsonStyles: { 
      "solid":              "esriSLSSolid", 
      "dash":               "esriSLSDash", 
      "dot":                "esriSLSDot", 
      "dash-dot":           "esriSLSDashDot", 
      "long-dash-dot-dot":  "esriSLSDashDotDot", 
      "none":               "esriSLSNull", 
      "inside-frame":       "esriSLSInsideFrame",
      
      // See dojox/gfx/svg.js
      // These are not supported by ArcGIS Server as of 10.1
      "short-dash":         "esriSLSShortDash",
      "short-dot":          "esriSLSShortDot",
      "short-dash-dot":     "esriSLSShortDashDot",
      "short-dash-dot-dot": "esriSLSShortDashDotDot",
      "long-dash":          "esriSLSLongDash",
      "long-dash-dot":      "esriSLSLongDashDot"
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultProps);
    },

    normalizeCtorArgs: function(style, color, width) {
      if (style &&  typeof style !== "string") {
        return style;
      }
      var kwArgs = {};
      if (style != null) {
        kwArgs.style = style;
      }
      if (color != null) {
        kwArgs.color = color;
      }
      if (width != null) {
        kwArgs.width = width;
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
     * For SimpleLineSymbol, the type is always `simplelinesymbol`.
     * 
     * @type {string}
     * @readOnly
     */
    type: "simplelinesymbol",

    //----------------------------------
    //  style
    //----------------------------------

    /**
     * The line style. Valid values are listed in the table below:
     *
     * Value | Description
     * ------|-------------
     * dash | ![sls-dash](../assets/img/apiref/symbols/symbols-sls-dash.png)
     * dash-dot | ![sls-dash-dot](../assets/img/apiref/symbols/symbols-sls-dash-dot.png)
     * dash-dot-dot | ![sls-dash-dot-dot](../assets/img/apiref/symbols/symbols-sls-dash-dot-dot.png)
     * dot | ![sls-dot](../assets/img/apiref/symbols/symbols-sls-dot.png)
     * long-dash | ![sls-long-dash](../assets/img/apiref/symbols/symbols-sls-long-dash.png)
     * long-dash-dot | ![sls-long-dash-dot](../assets/img/apiref/symbols/symbols-sls-long-dash-dot.png)
     * none | The line has no symbol.
     * short-dash | ![sls-short-dash](../assets/img/apiref/symbols/symbols-sls-short-dash.png)
     * short-dash-dot | ![sls-short-dash-dot](../assets/img/apiref/symbols/symbols-sls-short-dash-dot.png)
     * short-dash-dot-dot | ![sls-short-dash-dot-dot](../assets/img/apiref/symbols/symbols-sls-short-dash-dot-dot.png)
     * short-dot | ![sls-short-dot](../assets/img/apiref/symbols/symbols-sls-short-dot.png)
     * solid | ![sls-solid](../assets/img/apiref/symbols/symbols-sls-solid.png)
     * 
     * @name style
     * @instance
     * @type {string}
     *
     * @default solid
     */
    _styleReader: function(value, source) {
      return esriLang.valueOf(this._jsonStyles, value) || "solid";
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
          type:"esriSLS",
          style: this._jsonStyles[this.style]
        }
      ));
    }

  });
  

  lang.mixin(SimpleLineSymbol, slsStyles);
  SimpleLineSymbol.defaultProps = defaultProps;

  return SimpleLineSymbol;  
});
