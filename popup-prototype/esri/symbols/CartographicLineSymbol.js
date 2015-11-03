/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  
  "../core/lang",
  "../core/screenUtils",

  "./SimpleLineSymbol"
],
function(
  declare, lang,
  esriLang, screenUtils,
  SimpleLineSymbol
) {
  
  //BUG: STYLE_NULL doesn't do anything. It still draws it
  var clsStyles = {
    STYLE_SOLID: "solid", 
    STYLE_DASH: "dash", 
    STYLE_DOT: "dot", 
    STYLE_DASHDOT: "dash-dot", 
    STYLE_DASHDOTDOT: "long-dash-dot-dot", 
    STYLE_NULL: "none", 
    STYLE_INSIDE_FRAME: "inside-frame",

    // See:
    // dojox/gfx/svg.js
    // https://developer.mozilla.org/en-US/docs/SVG/Attribute/stroke-dasharray
    // http://msdn.microsoft.com/en-us/library/bb264085%28v=vs.85%29.aspx
    STYLE_SHORTDASH:       "short-dash",
    STYLE_SHORTDOT:        "short-dot",
    STYLE_SHORTDASHDOT:    "short-dash-dot",
    STYLE_SHORTDASHDOTDOT: "short-dash-dot-dot",
    STYLE_LONGDASH:        "long-dash",
    STYLE_LONGDASHDOT:     "long-dash-dot",
    
    CAP_BUTT: "butt", 
    CAP_ROUND: "round", 
    CAP_SQUARE: "square",
    JOIN_MITER: "miter", 
    JOIN_ROUND: "round", 
    JOIN_BEVEL: "bevel"
  };
  
  var defaultProps = { 
    color: [ 0, 0, 0, 1 ], 
    style: clsStyles.STYLE_SOLID, 
    width: 1, 
    cap: clsStyles.CAP_BUTT, 
    join: clsStyles.JOIN_MITER, 
    miterLimit: 10
  },
  
  CAPS  = { butt: "esriLCSButt", round: "esriLCSRound", square: "esriLCSSquare" },
  JOINS = { miter: "esriLJSMiter", round: "esriLJSRound", bevel: "esriLJSBevel" };

  /* {
   * style: "esriSLSSolid|esriSLSDash|esriSLSDot|esriSLSDashDot|esriSLSDashDotDot|esriSLSNull|esriSLSInsideFrame",
   * color: [r,g,b,a] (0-255),
   * width: 1-n (in points),
   * cap: "esriLCSButt|esriLCSRound|esriLCSSquare",
   * join: "esriLJSMiter|esriLJSRound|esriLJSBevel",
   * miterLimit: 1-n (in points)
   * }
   */
  var CLS = declare(SimpleLineSymbol, {
    declaredClass: "esri.symbols.CartographicLineSymbol",
    
    type: "cartographiclinesymbol",
    
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultProps);
    },

    normalizeCtorArgs: function(/*String*/ style, /*Color*/ color, /*Number*/ width, /*String*/ cap, /*String*/ join, /*Number*/ miterLimit) {
      if (style && typeof style !== "string") {
        // style is a kwArgs 
        return style;
      }
      var kwArgs = {};
      if (style) {
        kwArgs.style = style;
      }
      if (color) {
        kwArgs.color = color;
      }
      if (width != null) {
        kwArgs.width = width;
      }
      if (cap) {
        kwArgs.cap = cap;
      }
      if (join) {
        kwArgs.join = join;
      }
      if (miterLimit != null) {
        kwArgs.miterLimit = miterLimit;
      }
      return kwArgs;
    },
    
  
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  cap
    //----------------------------------
    
    _capReader: function(value) {
      return esriLang.valueOf(CAPS, value);
    },
    
    //----------------------------------
    //  join
    //----------------------------------
    
    _joinReader: function(value) {
      return esriLang.valueOf(JOINS, value);
    },
    
    //----------------------------------
    //  miterLimit
    //----------------------------------
    
    _miterLimitReader: screenUtils.pt2px,
        
  
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var miter = screenUtils.px2pt(this.miterLimit);
      miter = isNaN(miter) ? undefined : miter;
      
      return esriLang.fixJson(lang.mixin(
        this.inherited(arguments),
        { 
          type: "esriCLS", 
          cap: CAPS[this.cap], 
          join: JOINS[this.join], 
          miterLimit: miter 
        }
      ));
    }
    
  });

  lang.mixin(CLS, clsStyles);
  CLS.defaultProps = defaultProps;

  return CLS;  
});
