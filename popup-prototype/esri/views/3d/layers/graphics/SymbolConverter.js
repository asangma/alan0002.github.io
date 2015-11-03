define([
  "dojo/_base/lang",
  "../../../../core/screenUtils",
  "../../../../symbols/Font",

  "../../../../symbols/SimpleLineSymbol",
  "../../../../symbols/SimpleMarkerSymbol",
  "../../../../symbols/PictureMarkerSymbol",
  "../../../../symbols/SimpleFillSymbol",
  "../../../../symbols/TextSymbol",
  "../../../../symbols/Symbol3D",
  "../../../../symbols/Symbol",

  "../../../../symbols/LineSymbol3D",
  "../../../../symbols/PointSymbol3D",
  "../../../../symbols/PolygonSymbol3D",
  "../../../../symbols/LabelSymbol3D",

  "../../../../renderers/support/jsonUtils"
], function(
  lang, screenUtils, Font,
  SimpleLineSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleFillSymbol, TextSymbol, Symbol3D, Symbol,
  LineSymbol3D, PointSymbol3D, PolygonSymbol3D, LabelSymbol3D,
  rendererJsonUtils
) {

  /*************************
   * Local helper functions
   *************************/
  function dojoColor2RGB255(dojoColor) {
    return dojoColor.toRgb().map(function(c) {
      return c;
    });
  }

  function dojoColorIsBlack(dojoColor) {
    return (dojoColor.r + dojoColor.g + dojoColor.b) === 0;
  }

  function dojoColor2Transparency100(dojoColor) {
    return Math.round((1 - dojoColor.a) * 100);
  }

  function isDataURI(uri) {
    return uri.substring(0, 5) === "data:";
  }

  function esriStyleToIconPrimitive(style) {
    var styleToPrim = {};
    styleToPrim[SimpleMarkerSymbol.STYLE_CIRCLE] = "circle";
    styleToPrim[SimpleMarkerSymbol.STYLE_CROSS] = "cross";
    styleToPrim[SimpleMarkerSymbol.STYLE_DIAMOND] = "kite";
    styleToPrim[SimpleMarkerSymbol.STYLE_SQUARE] = "square";
    styleToPrim[SimpleMarkerSymbol.STYLE_X] = "x";

    if (!(style in styleToPrim)) {
      console.log(style + " cannot be mapped to Icon symbol. Fallback to \"circle\"");
      return "circle";
    } else {
      return styleToPrim[style];
    }
  }

  /************************
   * Public static methods
   ************************/

  var toWeb3DSymbol = function(inSymbol, retainId) {
    var outSymbol;
    if (inSymbol instanceof SimpleLineSymbol) {
      outSymbol = LineSymbol3D.fromJSON({
        symbolLayers: [{
          type: "Line",
          enable: true,
          size: screenUtils.px2pt(inSymbol.width) || 1,
          material: {
            color: inSymbol.color ? dojoColor2RGB255(inSymbol.color) : [255, 255, 255],
            transparency: inSymbol.color ? dojoColor2Transparency100(inSymbol.color) : 100
          }
        }]
      });
    }
    else if ((inSymbol instanceof PictureMarkerSymbol) || (inSymbol instanceof SimpleMarkerSymbol)) {
      var color = inSymbol.color ? dojoColor2RGB255(inSymbol.color) : [255, 255, 255];
      var transparency = inSymbol.color == null ? 100 : dojoColor2Transparency100(inSymbol.color);
      var resource, size;
      if (inSymbol instanceof PictureMarkerSymbol) {
        if (inSymbol.color && dojoColorIsBlack(inSymbol.color)) {
          // PMS ignores the color, and sometimes we get black colors in PMS, which turns our Icons black, so we
          // patch these cases to be white
          // Note: if PMS ignores color, we should never even get to this place
          color = [255, 255, 255];
        }

        if (inSymbol.source.imageData && inSymbol.source.contentType) {
          resource = {
            dataURI: "data:" + inSymbol.source.contentType + ";base64," + inSymbol.source.imageData
          };
        }
        else {
          resource = isDataURI(inSymbol.url) ? { dataURI: inSymbol.url } : { href: inSymbol.url };
        }
        size = inSymbol.width;
      } else {
        resource = {
          "primitive": esriStyleToIconPrimitive(inSymbol.style)
        };
        size = inSymbol.size;
      }

      var symbolLayer = {
        type: "Icon",
        enable: true,
        size: screenUtils.px2pt(size),
        screenOffset: [inSymbol.xoffset, inSymbol.yoffset],
        resource: resource,
        material: {
          color: color,
          transparency: transparency
        }
      };

      if (inSymbol.outline) {
        symbolLayer.outline = {
          size: screenUtils.px2pt(inSymbol.outline.width),
          color: dojoColor2RGB255(inSymbol.outline.color),
          transparency: dojoColor2Transparency100(inSymbol.outline.color)
        };
      }

      outSymbol = PointSymbol3D.fromJSON({
        symbolLayers: [symbolLayer]
      });

    }
    else if (inSymbol instanceof SimpleFillSymbol) {
      var mat = {
        symbolLayers: [{
          type: "Fill",
          enable: true,
          material: {
            color: inSymbol.color ? dojoColor2RGB255(inSymbol.color) : [255, 255, 255],
            transparency: inSymbol.color ? dojoColor2Transparency100(inSymbol.color) : 100
          }
        }]
      };

      outSymbol = PolygonSymbol3D.fromJSON(mat);

      if (inSymbol.outline) {
        var lineSymbolLayer = toWeb3DSymbol(inSymbol.outline, false).symbolLayers[0];
        outSymbol.addLayer(lineSymbolLayer);
      }
    } else if (inSymbol instanceof TextSymbol) {
      var placement;
      switch (inSymbol.verticalAlignment) {
        case "top":
          placement = "top";
          break;
        case "middle":
          placement = "center";
          break;
        case "bottom":
          placement = "bottom";
          break;
        default:
          placement = "center";
      }
      switch (inSymbol.horizontalAlignment) {
        case "left":
          placement += "Left";
          break;
        case "center":
          placement += "Center";
          break;
        case "right":
          placement += "Right";
          break;
        default:
          placement += "Center";
      }

      var font = lang.clone(Font.defaultProps);
      if (inSymbol.font) {
        lang.mixin(font, inSymbol.font);
      }

      outSymbol = LabelSymbol3D.fromJSON({
        symbolLayers: [{
          type: "Text",
          enable: true,
          size: screenUtils.px2pt(font.size),
          font: {
            family: font.family,
            weight: font.weight,
            style: font.style
          },
          material: {
            color: dojoColor2RGB255(inSymbol.color)
          },
          placement: placement,
          screenOffset: [screenUtils.px2pt(inSymbol.xoffset), screenUtils.px2pt(inSymbol.yoffset)],
          text: inSymbol.text
        }]
      });
    }
    else if (inSymbol instanceof Symbol3D) {
      outSymbol = inSymbol;
    }
    else {
      console.warn("SymbolConverter: don't know how to convert symbol of type '%s'", inSymbol.type || inSymbol.declaredClass);
    }

    if (retainId && outSymbol) {
      outSymbol.id = inSymbol.id;
    }

    return outSymbol;
  };

  var toWeb3DRenderer = function(inRenderer) {
    // supports only SimpleRenderer, ClassBreaksRenderer, and UniqueValueRenderer at the moment
    var outRenderer = rendererJsonUtils.fromJSON(inRenderer.toJSON());

    function convertIfNecessary(inSymbol) {
      if ((inSymbol instanceof Symbol) && !(inSymbol instanceof Symbol3D)) {
        return toWeb3DSymbol(inSymbol, false);
      }
      return inSymbol;
    }

    // Renderer:
    outRenderer.defaultSymbol = convertIfNecessary(outRenderer.defaultSymbol);

    // SimpleRenderer:
    outRenderer.symbol = convertIfNecessary(outRenderer.symbol);

    // ClassBreaksRenderer and UniqueValueRenderer:
    if (Array.isArray(outRenderer.infos)) {
      outRenderer.infos.forEach(function(info) {
        info.symbol = convertIfNecessary(info.symbol);
      });
    }

    // explicitly copy the value of not serialized property
    if (typeof inRenderer.isMaxInclusive !== "undefined") {
      outRenderer.setMaxInclusive(inRenderer.isMaxInclusive);
    }
    return outRenderer;
  };

  return {
    toWeb3DSymbol: toWeb3DSymbol,
    toWeb3DRenderer: toWeb3DRenderer
  };
});
