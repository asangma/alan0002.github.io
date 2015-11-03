define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/sniff",
  "dojox/gfx/_base",
  "../core/lang",
  "../core/urlUtils",
  "./MarkerSymbol",
  "./Font"
],
function(declare, lang, has, gfxBase, esriLang, urlUtils, MarkerSymbol, Font) {

  var defaultSHD = {url:"", width:12, height:12, angle:0, xoffset:0, yoffset:0 };

  /* {
   * url: "http://...",
   * size: 0-n (in points),
   * angle: 0-360,
   * xoffset: 0-n (in points),
   * yoffset: 0-n (in points)
   * }
   */
  var SHD = declare(MarkerSymbol, {
    declaredClass: "esri.symbol.ShieldLabelSymbol",
    
    type: "shieldlabelsymbol",
    color: [ 255, 255, 255, 1 ],
    width: 32,
    height: 32,
    font: gfxBase.defaultFont,

    constructor: function(json, color, width, height, font) {
      if (json) {
        if (lang.isString(json)) {
          this.url = json;
          if (color) {
            this.color = color;
          }
          if (width) {
            this.width = width;
          }
          if (height) {
            this.height = height;
          }
          if (font !== undefined) {
            this.font = font;
          }
        }
        else {
          this.width = gfxBase.pt2px(json.width);
          this.height = gfxBase.pt2px(json.height);

          // see - http://en.wikipedia.org/wiki/Data_Uri
          // also - https://developer.mozilla.org/en/data_URIs
          // "IE 8 does not support data URIs for VML image elements": 
          // http://code.google.com/p/explorercanvas/issues/detail?id=60#c1
          var imageData = json.imageData;
          if ( (!(has("ie") < 9) /*|| (isIE && isIE >= 8 && imageData.length <= 32768)*/) && imageData ) {
            var temp = this.url;
            this.url = "data:" + (json.contentType || "image") + ";base64," + imageData;
            this.imageData = temp;
          }
        }
      } else {
        lang.mixin(this, defaultSHD);
      }
    },

    getStroke: function() {
      return null;
    },

    getFill: function() {
      return this.color;
    },

    setWidth: function(/*Number*/ width) {
      this.width = width;
      return this;
    },

    setHeight: function(/*Number*/ height) {
      this.height = height;
      return this;
    },

    setUrl: function(/*String*/ url) {
      if (url !== this.url) {
        delete this.imageData;
        delete this.contentType;
      }
      this.url = url;
      return this;
    },
    
    setFont: function(font) {
      this.font = font;
      return this;
    },

    setText: function(/*String*/ text) {
      this.text = text;
      return this;
    },
    
    getWidth: function() {
      return this.width;
    },
    
    getHeight: function() {
      return this.height;
    },    
    
    getShapeDescriptors: function() {
      var shape = { 
        type: "image", 
        x: /*0*/ - Math.round(this.width / 2), 
        y: /*0*/ - Math.round(this.height / 2), 
        width: this.width, 
        height: this.height, 
        src: this.url || ""
      };
      
      return { 
        defaultShape: shape, 
        fill: null, 
        stroke: null 
      };
    },

    toJSON: function() {
      // Swap url and imageData if necessary
      var url = this.url, imageData = this.imageData;
      if (url.indexOf("data:") === 0) {
        var temp = url;
        url = imageData;
        
        var index = temp.indexOf(";base64,") + 8;
        imageData = temp.substr(index);
      }
      url = urlUtils.getAbsoluteUrl(url);
      
      var width = gfxBase.px2pt(this.width);
      width = isNaN(width) ? undefined : width;
      
      var height = gfxBase.px2pt(this.height);
      height = isNaN(height) ? undefined : height;
      
      var retVal = esriLang.fixJson(lang.mixin(this.inherited(arguments), { 
        type: "esriSHD", 
        /*style: "esriSHD", */
        url: url, 
        imageData: imageData,
        contentType: this.contentType,
        width: width, 
        height: height
      }));

      if(this.font) {
        var fnt = new Font(this.font);
        retVal.font = fnt.toJSON();
      } else {
        retVal.font = null;
      }
      
      // http://nil/rest-docs/symbol.html#pms
//      delete retVal.color;
      delete retVal.size;
      if (!retVal.imageData) {
        delete retVal.imageData;
      }
      
      return retVal;
    }
  });
  
  SHD.defaultProps = defaultSHD;

  return SHD;  
});
