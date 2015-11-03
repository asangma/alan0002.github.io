/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */

/**
 * Fill symbols are used to draw polygon features. PictureFillSymbol uses an image in a repeating pattern. 
 * In addition, the symbol can have an optional outline, which is defined by a {@link module:esri/symbols/LineSymbol LineSymbol}.
 * 
 * PictureFillSymbol is not supported in {@link module:esri/views/SceneView SceneViews}. Only use it when
 * working inside a {@link module:esri/views/MapView MapView}.
 * 
 * @module esri/symbols/PictureFillSymbol
 * @since 4.0
 * @see module:esri/symbols/SimpleFillSymbol
 */
/*global define */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  
  "../core/lang",
  "../core/screenUtils",
  "../core/urlUtils",
  
  "./FillSymbol"
],
function(
  declare, lang,
  esriLang, screenUtils, urlUtils,
  FillSymbol
) {
  
  var defaultProps = {
    xscale:  1,
    yscale:  1,
    xoffset: 0,
    yoffset: 0,
    width:   16,
    height:  16
  };

  /* {
   * pictureUri: String,
   * xoffset: 0-n (in points),
   * yoffset: 0-n (in points),
   * xscale: 0-n,
   * yscale: 0-n,
   * color: [r,g,b,a] (0-255),
   * outline: JSON representation for SimpleLineSymbol,
   * angle: 0-n,
   * backgroundColor: [r,g,b,a] (0-255),
   * bitmapTransparencyColor: [r,g,b,a] (0-255),
   * xseparation: 0-n,
   * yseparation: 0-n
   * }
   */ 
  /**
  * @extends module:esri/symbols/FillSymbol
  * @constructor module:esri/symbols/PictureFillSymbol
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */      
  var PictureFillSymbol = declare(FillSymbol, {
     /** @lends module:esri/symbols/PictureFillSymbol.prototype */  
    declaredClass: "esri.symbols.PictureFillSymbol",
    
    //----------------------------------
    //  type
    //----------------------------------

    /**
     * For PictureFillSymbol, the type is always `picturefillsymbol`.
     * 
     * @type {string}
     * @readOnly
     * @instance
     */  
    type: "picturefillsymbol",
    
    classMetadata: {
      computed: {
        url: ["source"]
      },
      reader: {
        exclude: [
          "contentType",
          "imageData",
          "size",
          "url"
        ],
        add: [
          "source"
        ]
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), defaultProps);
    },
    
    normalizeCtorArgs: function(/*String|Object*/ url, /*SimpleLineSymbol*/ outline, /*Number*/ width, /*Number*/ height) {
      if (url && typeof url !== "string" && url.imageData == null) {
        // url is a kwArgs
        return url;
      }
      var kwArgs = {};
      if (url) {
        kwArgs.url = url;
      }
      if (outline) {
        kwArgs.outline = outline;
      }
      if (width != null) {
        kwArgs.width = width;
      }
      if (height != null) {
        kwArgs.height = height;
      }
      return kwArgs;
    },
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
     
    //----------------------------------
    //  xscale
    //----------------------------------
    
    /**
     * The scale factor in x direction of the symbol.
     *
     * @name xscale
     * @instance
     * @type {number}
     * @default 1
     */
     
    //----------------------------------
    //  yscale
    //----------------------------------
    
    /**
     * The scale factor in y direction of the symbol.
     *
     * @name yscale
     * @instance
     * @type {number}
     * @default 1
     */
      
    //----------------------------------
    //  width
    //----------------------------------  
      
    /**
     * Width of the image in pixels.
     * 
     * @name width
     * @instance
     * @type {number}
     * @default 16
     */
    
    _widthReader: screenUtils.pt2px,
    
    //----------------------------------
    //  height
    //----------------------------------
    
     /**
     * Height of the image in pixels.
     * 
     * @name height
     * @instance
     * @type {number}
     * @default 16
     */
     
    _heightReader: screenUtils.pt2px,
    
    //----------------------------------
    //  xoffset
    //----------------------------------
    
    /**
     * The offset on the x-axis in pixels.
     *
     * @type {number}
     * @default 0
     * @instance
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
     * @instance
     */
    yoffset: 0,
      
    _yoffsetReader: screenUtils.pt2px,
    
    //----------------------------------
    //  url
    //----------------------------------
        
    /**
     * The URL of the image.
     * 
     * @name url
     * @instance
     * @type {string}
     */
    
    _urlGetter: function() {
      return this.source ? this.source.url : undefined;
    },

    _urlSetter: function(value) {
      var contentType;
      if (value && value.indexOf("data:") === 0) {
        contentType = value.substring(5, value.indexOf(";"));
        // base64
        this.source = {
          value: value,
          contentType: contentType,
          // "data:;base64,".length = 13
          imageData: value.substring(13 + contentType.length)
        };
      }
      else {
        this.source = {
          url: value
        };
      }
      return value;
    },

    //----------------------------------
    //  source
    //----------------------------------

    /**
     * Reads the source from the json.
     * contains URL, base64 image data and contentType
     * @private
     */
    _sourceReader: function(value, source) {
      if (source.imageData) {
        return {
          url: source.url,
          contentType: source.contentType,
          imageData: source.imageData
        };
      }
      return {
        url: source.url
      };
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    toJSON: function() {
      var source = this.source,
          url = this.url,
          imageData = source && source.imageData,
          contentType = source && source.contentType;
          
      if (lang.isString(url) && (url.indexOf("/") === 0 ||
                                 url.indexOf("//") === 0 ||
                                 url.indexOf("./") === 0 ||
                                 url.indexOf("../") === 0)) {
        url = urlUtils.getAbsoluteUrl(url);
      }
      
      var width = screenUtils.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      var height = screenUtils.px2pt(this.height);
      height = isNaN(height) ? undefined : height;
      
      var xoff = screenUtils.px2pt(this.xoffset);
      xoff = isNaN(xoff) ? undefined : xoff;
      
      var yoff = screenUtils.px2pt(this.yoffset);
      yoff = isNaN(yoff) ? undefined : yoff;

      var json = esriLang.fixJson(lang.mixin(
        this.inherited(arguments),
        { 
          type: "esriPFS", 
          url: url, 
          imageData: imageData,
          contentType: contentType,
          width: width, 
          height: height, 
          xoffset: xoff, 
          yoffset: yoff, 
          xscale: this.xscale, 
          yscale: this.yscale 
        }
      ));
      return json;
    }
    
  });

  PictureFillSymbol.defaultProps = defaultProps;

  return PictureFillSymbol;  
});
