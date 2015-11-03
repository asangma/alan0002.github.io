/**
 * SimpleMarkerSymbol is used to draw points and multipoints
 * using a simple shape. In addition, the symbol can have an
 * optional `outline`, which is defined by a 
 * {@link module:esri/symbols/LineSymbol LineSymbol}.
 *
 * @module esri/symbols/SimpleMarkerSymbol
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 * @see module:esri/symbols/PictureMarkerSymbol
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  
  "../core/lang",
  
  "./MarkerSymbol",
  "./SimpleLineSymbol"
],
function(
  declare, lang,
  esriLang,
  MarkerSymbol, SimpleLineSymbol
) {
  
  var smsStyles = {
    STYLE_CIRCLE:  "circle", 
    STYLE_SQUARE:  "square", 
    STYLE_CROSS:   "cross", 
    STYLE_X:       "x", 
    STYLE_DIAMOND: "diamond",
    STYLE_PATH:    "path",
    STYLE_TARGET:  "target"
    // TODO
    // STYLE_TARGET and _setDim is an intermediate solution until
    // we can support STYLE_PATH
  };
  
  var defaultProps = {
    style:   "circle",
    color:   [ 255, 255, 255, 0.25 ],
    outline: new SimpleLineSymbol(), 
    size:    16, // 16 pixels
    angle:   0, 
    xoffset: 0, 
    yoffset: 0 
  };

  /* {
   * style: "esriSMSCircle|esriSMSSquare|esriSMSCross|esriSMSX|esriSMSDiamond",
   * color: [r,g,b,a] (0-255),
   * outline: true|false,
   * outlineColor: { red:0-255, green:0-255, blue: 0-255, transparency: 0-255 },
   * outlineSize: 1-n (in points),
   * size: 0-n (in points),
   * angle: 0-360,
   * xoffset: 0-n (in points),
   * yoffset: 0-n (in points)
   * }
   */
  /**
   * @extends module:esri/symbols/MarkerSymbol
   * @constructor module:esri/symbols/SimpleMarkerSymbol
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var SMS = declare(MarkerSymbol,
  /** @lends module:esri/symbols/SimpleMarkerSymbol.prototype */
  {
    declaredClass: "esri.symbol.SimpleMarkerSymbol",
    
    classMetadata: {
      properties: {
        outline: {
          type: SimpleLineSymbol
        }
      }
    },
    
    _styles: {
      circle: "esriSMSCircle", 
      square: "esriSMSSquare", 
      cross:  "esriSMSCross", 
      x:      "esriSMSX", 
      diamond:"esriSMSDiamond",
      
      // This is not supported by ArcGIS Server as of 10.1
      path:   "esriSMSPath" 
    },

    
    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultProps);
    },

    normalizeCtorArgs: function(style, size, outline, color) {
      if (style && typeof style !== "string") {
        return style;
      }
      var kwArgs = {};
      if (style) {
        kwArgs.style = style;
      }
      if (size != null) {
        kwArgs.size = size;
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
     * For SimpleMarkerSymbol, the type is always `simplemarkersymbol`.
     * 
     * @type {string}
     * @readOnly
     */
    type: "simplemarkersymbol",
    
    //----------------------------------
    //  style
    //----------------------------------
    
    /**
    * The marker style. Possible values are in the table below.
    * 
    * Value | Description
    * ------|------------
     * circle | ![sms_circle](../assets/img/apiref/symbols/symbols-sms-circle.png)
     * cross | ![sms_cross](../assets/img/apiref/symbols/symbols-sms-cross.png)
     * diamond | ![sms_diamond](../assets/img/apiref/symbols/symbols-sms-diamond.png)
     * square | ![sms_square](../assets/img/apiref/symbols/symbols-sms-square.png)
     * x | ![sms_x](../assets/img/apiref/symbols/symbols-sms-x.png)
    * 
    * @name style
    * @instance
    * @type {string}
    * @default circle
    */
      
    _styleReader: function(value, source) {
      return esriLang.valueOf(this._styles, value);
    },
    
    //----------------------------------
    //  path
    //----------------------------------
    
    _pathSetter: function(value) {
      this.style = "path";
      return value;
    },
    
    //----------------------------------
    //  outline
    //----------------------------------
    
    /**
    * The outline of the marker symbol.
    * 
    * @name outline
    * @instance
    * @type {module:esri/symbols/SimpleLineSymbol}
    */
      
    _outlineReader: SimpleLineSymbol.fromJSON,
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var json = lang.mixin(
                  this.inherited(arguments), 
                  { type:"esriSMS", style:this._styles[this.style] }
                 ),
          outline = this.outline;
  
      if (outline) {
        json.outline = outline.toJSON();
      }

      json.path = this.path;      
  
      return esriLang.fixJson(json);
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Private function
    //
    //--------------------------------------------------------------------------
    
    // TODO remove
    // yann6817: What is that used for???
    _setDim: function(targetWidth, targetHeight, spikeSize) {
      this._targetWidth = targetWidth;
      this._targetHeight = targetHeight;
      this._spikeSize = spikeSize;
    }
    
    
  });
  
  lang.mixin(SMS, smsStyles);
  SMS.defaultProps = defaultProps;

  return SMS;  
});
