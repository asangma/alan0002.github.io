/**
 * PictureMarkerSymbol renders points and multipoints on the layer using an image.
 *
 * @module esri/symbols/PictureMarkerSymbol
 * @since 4.0
 * @see module:esri/symbols/SimpleMarkerSymbol
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  
  "../core/lang",
  "../core/screenUtils",
  "../core/urlUtils",
  
  "./MarkerSymbol"
],
function(
  declare, lang,
  esriLang, screenUtils, urlUtils,
  MarkerSymbol
) {

  var defaultProps = {
    width:   16,
    height:  16,
    angle:    0,
    xoffset:  0,
    yoffset:  0
  };

  /* {
   * url: "http://...",
   * size: 0-n (in points),
   * angle: 0-360,
   * xoffset: 0-n (in points),
   * yoffset: 0-n (in points)
   * }
   */
  /**
   * @extends module:esri/symbols/MarkerSymbol
   * @constructor module:esri/symbols/PictureMarkerSymbol
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PMS = declare(MarkerSymbol,
  /** @lends module:esri/symbols/PictureMarkerSymbol.prototype */
  {
    declaredClass: "esri.symbols.PictureMarkerSymbol",
    
    //----------------------------------
    //  type
    //----------------------------------

    /**
     * For PictureMarkerSymbol, the type is always `picturemarkersymbol`.
     * 
     * @type {string}
     * @readOnly
     */
    type: "picturemarkersymbol",

    classMetadata: {
      computed: {
        url: ["source"]
      },
      reader: {
        exclude: [
          "contentType",
          "imageData",
          "size",
          "url",
          "color"
        ],
        add: [
          "source"
        ]
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

    normalizeCtorArgs: function(/*String|Object*/ url, /*Number*/ width, /*Number*/ height) {
      if (url && typeof url !== "string" && url.imageData == null) {
        // url is a kwArgs
        return url;
      }
      var kwArgs = {};
      if (url) {
        kwArgs.url = url;
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

    _heightReader: function(value, source) {
      if (source.size) {
        return source.size;
      }
      return screenUtils.pt2px(value);
    },
    
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

    _widthReader: function(value, source) {
      if (source.size) {
        return source.size;
      }
      return screenUtils.pt2px(value);
    },
      
    //----------------------------------
    //  ignored properties
    //----------------------------------
      
     /**
     * @name color
     * @instance           
     * @type {module:esri/Color}
     * @ignore
     */
    
    
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

      var retVal = esriLang.fixJson(lang.mixin(this.inherited(arguments), { 
        type: "esriPMS", 
        url: url, 
        imageData: imageData,
        contentType: contentType,
        width: width, 
        height: height
      }));
      
      // http://nil/rest-docs/symbol.html#pms
      delete retVal.color;
      delete retVal.size;      
      return retVal;
    }

  });
  
  PMS.defaultProps = defaultProps;

  return PMS;  
});
