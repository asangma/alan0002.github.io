define([
  "require",

  "dojo/_base/lang",

  "dojox/gfx/_base",

  "../../core/screenUtils"
], function(
  require,
  lang,
  gfxBase,
  screenUtils
) {

  var CARTOGRAPHIC_LINE_SYMBOL = "cartographiclinesymbol",
      PICTURE_FILL_SYMBOL = "picturefillsymbol",
      PICTURE_MARKER_SYMBOL = "picturemarkersymbol",
      SIMPLE_FILL_SYMBOL = "simplefillsymbol",
      SIMPLE_LINE_SYMBOL = "simplelinesymbol",
      SIMPLE_MARKER_SYMBOL = "simplemarkersymbol",
      TEXT_SYMBOL = "textsymbol",

      FILL_PATTERN_URL_PREFIX = require.toUrl("../../images/symbol/sfs/");

  var getFill = function getFill(symbol) {
    var fill = null,
        style = symbol.style;
    if (symbol) {
      var ctor = symbol.constructor;
      switch (symbol.type) {
        case SIMPLE_MARKER_SYMBOL:
          if (style !== ctor.STYLE_CROSS && style !== ctor.STYLE_X) {
            fill = symbol.color;
          }
          break;
        case SIMPLE_FILL_SYMBOL:
          if (style === ctor.STYLE_SOLID) {
            fill = symbol.color;
          }
          else if (style !== ctor.STYLE_NULL) {
            fill = lang.mixin(
              {},
              gfxBase.defaultPattern, 
              { 
                src:    FILL_PATTERN_URL_PREFIX + style + ".png",
                width:  10, 
                height: 10
              }
            );
          }
          break;
        case PICTURE_FILL_SYMBOL:
          fill = lang.mixin(
            {},
            gfxBase.defaultPattern,
            {
              src: symbol.url,
              width: (symbol.width * symbol.xscale),
              height: (symbol.height * symbol.yscale),
              x: symbol.xoffset,
              y: symbol.yoffset
            }
          );
          break;
      }
    }
    return fill;
  };

  var getStroke = function getStroke(symbol) {
    var stroke = null;
    if (symbol) {
      var ctor = symbol.constructor;
      switch (symbol.type) {
        case SIMPLE_FILL_SYMBOL:
        case PICTURE_FILL_SYMBOL:
        case SIMPLE_MARKER_SYMBOL:
          stroke = getStroke(symbol.get("outline"));
          break;
        case SIMPLE_LINE_SYMBOL:
          if (symbol.style !== ctor.STYLE_NULL && symbol.width !== 0) {
            stroke = {
              color: symbol.color,
              style: _dekebabify(symbol.style),
              width: symbol.width
            };
          }
          break;
        case CARTOGRAPHIC_LINE_SYMBOL:
          if (symbol.style !== ctor.STYLE_NULL && symbol.width !== 0) {
            stroke = {
              color: symbol.color,
              style: _dekebabify(symbol.style),
              width: symbol.width,
              cap:   symbol.cap,
              join:  (symbol.join === ctor.JOIN_MITER ? symbol.miterLimit : symbol.join)
            };
          }
          break;
        default:
          // PictureMarkerSymbol, TextSymbol
          stroke = null;
          break;
      }
    }
    return stroke;
  };

  var _dekebabify = (function() {
    var cache = {};

    return function(text) {
      if (cache[text]) {
        return cache[text];
      }

      var dekebabified = text.replace(/-/g, "");
      cache[text] = dekebabified;
      return dekebabified;
    };
  })();

  var getShapeDescriptors = function getShapeDescriptors(symbol) {
    if (!symbol) {
      return { defaultShape: null, fill: null, stroke: null };
    }
    var shapeDescriptors = {
          fill: getFill(symbol),
          stroke: getStroke(symbol)
        },
        ctor = symbol.constructor,
        defaultProps = ctor.defaultProps,
        defaultShape = null;
    switch (symbol.type) {
      case SIMPLE_MARKER_SYMBOL:

        var style = symbol.style,
            size = symbol.size || screenUtils.pt2px(defaultProps.size),
            half = size * 0.5,
            left = /*0*/ - half,
            right = /*0*/ + half,
            top = /*0*/ - half,
            bottom = /*0*/ + half;

        switch(style) {
          case ctor.STYLE_CIRCLE:
            defaultShape = {
              type: "circle",
              cx: 0,
              cy: 0,
              r: half
            };
            break;

          case ctor.STYLE_CROSS:
            defaultShape = {
              type: "path",
              path: "M " + left + ",0 L " + right + ",0 M 0," + top + " L 0," + bottom + " E"
            };
            break;

          case ctor.STYLE_DIAMOND:
            defaultShape = {
              type: "path",
              path: "M " + left + ",0 L 0," + top + " L " + right + ",0 L 0," + bottom + " L " + left + ",0 E"
            };
            break;

          case ctor.STYLE_SQUARE:
            defaultShape = {
              type: "path",
              path: "M " + left + "," + bottom + " L " + left + "," + top + " L " + right + "," + top + " L " + right + "," + bottom + " L " + left + "," + bottom + " E"
            };
            break;

          case ctor.STYLE_X:
            defaultShape = {
              type: "path",
              path: "M " + left + "," + bottom + " L " + right + "," + top + " M " + left + "," + top + " L " + right + "," + bottom + " E"
            };
            break;

          case ctor.STYLE_PATH:
            defaultShape = {
              type: "path",
              path: symbol.path || ""
            };
            break;
        }
        break;

      case SIMPLE_LINE_SYMBOL:
      case CARTOGRAPHIC_LINE_SYMBOL:
        defaultShape = {
          type: "path",
          path: "M -15,0 L 15,0 E"
        };
        break;

      case PICTURE_FILL_SYMBOL:
      case SIMPLE_FILL_SYMBOL:
        defaultShape = {
          type: "path",
          path: "M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 E"
        };
        break;

      case PICTURE_MARKER_SYMBOL:
        defaultShape = {
          type: "image", 
          x: /*0*/ - Math.round(symbol.width / 2), 
          y: /*0*/ - Math.round(symbol.height / 2), 
          width: symbol.width, 
          height: symbol.height, 
          src: (symbol.source && symbol.source.imageData) ?
            "data:" + symbol.source.contentType + ";base64," + symbol.source.imageData :
            symbol.url || ""
        };
        break;
      
      case TEXT_SYMBOL:
        var font = symbol.font;
        defaultShape = {
          type: "text",
          text: symbol.text,
          x:    0,
          // Align approx middle point of the text with the surface origin (0, 0)
          y: gfxBase.normalizedLength(font ? font.size : 0) * 0.25,
          
          align:      "middle", // horizontal alignment
          decoration: symbol.decoration || (font && font.decoration),
          rotated:    symbol.rotated,
          kerning:    symbol.kerning
        };
        shapeDescriptors.font = font && {
          size:       font.size, // in pixels
          style:      font.style,
          variant:    font.variant,
          decoration: font.decoration,
          weight:     font.weight,
          family:     font.family
        };
        break;
    }

    shapeDescriptors.defaultShape = defaultShape;
    return shapeDescriptors;
  };

  return {
    getFill: getFill,
    getStroke: getStroke,
    getShapeDescriptors: getShapeDescriptors
  };

});
