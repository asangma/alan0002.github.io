define([
  "../../symbols/support/jsonUtils",
  "../../symbols/SimpleLineSymbol",

  "dojo/Deferred",
  "dojo/dom-construct",
  "dojo/on",

  "dojox/gfx"
], function (
  symbolsJsonUtils,
  SimpleLineSymbol,
  Deferred, domConstruct, on,
  gfx
) {

  var symbolUtil = {

    _pureOutlineStyles: "x,cross",

    isPoint: function (symbol) {
      return symbolUtil.isType(symbol, "marker");
    },

    isType: function (symbol, type) {
      return symbol && symbol.type.indexOf(type + "symbol") > -1;
    },

    isLine: function (symbol) {
      return symbolUtil.isType(symbol, "line");
    },

    isPolygon: function (symbol) {
      return symbolUtil.isType(symbol, "fill");
    },

    hasPureOutlineStyle: function (symbol) {
      return symbol && symbolUtil._pureOutlineStyles.indexOf(symbol.style) > -1;
    },

    getOutline: function (symbol) {
      if (symbol.type === "simplelinesymbol" ||
          symbol.type === "cartographiclinesymbol") {
        return symbol;
      }

      return symbol.outline;
    },

    cloneSymbol: function (symbol) {
      return symbolsJsonUtils.fromJSON(symbol.toJSON());
    },

    setOutlineWidth: function (symbol, width) {
      if (isNaN(width) || !symbol) {
        return;
      }

      symbolUtil.getOutline(symbol).setWidth(width);
    },

    setOutlineStyle: function (symbol, style) {
      if (!style || !symbol) {
        return;
      }

      var outline = symbolUtil.getOutline(symbol);

      style = outline.color ? style  : SimpleLineSymbol.STYLE_NULL;

      outline.setStyle(style);
    },

    setSize: function (symbol, size) {
      if (!symbol || isNaN(size)) {
        return;
      }

      var oldSize = symbol.width,
          newSize = size,
          symbolUrl;

      if (oldSize == newSize) {
        return;
      }

      if (symbol.type === "picturemarkersymbol") {
        symbolUrl = symbol.url;
        // keep aspect ratio
        symbol.setHeight((symbol.height / symbol.width) * newSize);
        symbol.setWidth(newSize);

        if (!symbolUrl || symbolUrl === "http://" ||
            (symbolUrl.indexOf("http://") === -1 &&
             symbolUrl.indexOf("data:") === -1)) {
          // bad URL
          return;
        }

        // increase/decrease offset
        if (symbol.xoffset || symbol.yoffset) {
          newSize = symbol.width;
          var val = newSize / oldSize;
          symbol.setOffset(Math.round(symbol.xoffset * val),
            Math.round(symbol.yoffset * val));
        }
      }
      else {
        symbol.setSize(newSize);
      }
    },

    getMarkerLength: function(markerSymbol) {
      return isNaN(markerSymbol.width) ?
             markerSymbol.size :
             Math.max(markerSymbol.width, markerSymbol.height);
    },

    hasColor: function (symbol) {
      return symbol && symbol.color;
    },

    setFillColor: function (symbol, color) {
      symbol.setColor(color);
    },

    setOutlineColor: function (symbol, color) {
      symbolUtil.getOutline(symbol).setColor(color);
    },

    renderOnSurface: function (symbol, surfaceNode) {
      if (!symbol) {
        return;
      }

      var surfaceWidth = 80,
          surfaceHeight = 30,
          isLine = symbolUtil.isLine(symbol),
          hasOutline = !!symbol.outline,
          previewPadding = hasOutline ? symbol.outline.width * 1.5 : 1,
          surface,
          shapeDesc,
          gfxShape,
          dimensions,
          centerShapeTransform;

      if (isLine) {
        surfaceWidth = 190;
        surfaceHeight = 20;
      }
      else if (symbol.type === "simplemarkersymbol") {
        surfaceWidth = symbol.size;
        surfaceHeight = surfaceWidth;
      }
      else if (symbol.type === "picturemarkersymbol") {
        if (!symbol.url || symbol.url === "http://" ||
            (symbol.url.indexOf("http://") === -1 &&
             symbol.url.indexOf("https://") === -1 &&
             symbol.url.indexOf("data:") === -1)) {
          // bad URL
          return;
        }

        surfaceWidth = Math.max(symbol.width, symbol.height);
        surfaceHeight = surfaceWidth;
      }

      surfaceWidth += previewPadding;
      surfaceHeight += previewPadding;

      surface = gfx.createSurface(surfaceNode, surfaceWidth, surfaceHeight);
      shapeDesc = symbolsJsonUtils.getShapeDescriptors(symbol);

      if (isLine) {
        shapeDesc.defaultShape.path = "M -90,0 L 90,0 E";  //TODO: find cleaner solution
      }

      gfxShape = surface.createShape(shapeDesc.defaultShape)
        .setFill(shapeDesc.fill)
        .setStroke(shapeDesc.stroke);

      dimensions = surface.getDimensions();

      centerShapeTransform = {
        dx: dimensions.width * 0.5,
        dy: dimensions.height * 0.5
      };

      gfxShape.applyTransform(centerShapeTransform);

      return surface;
    },

    toFullLineStyle: function (shortStyle) {
      var fullStyle;
      
      switch (shortStyle) {
        case "dot":
          fullStyle = SimpleLineSymbol.STYLE_DOT;
          break;
        case "dash":
          fullStyle = SimpleLineSymbol.STYLE_DASH;
          break;
        case "dashdot":
          fullStyle = SimpleLineSymbol.STYLE_DASHDOT;
          break;
        case "dashdotdot":
          fullStyle = SimpleLineSymbol.STYLE_DASHDOTDOT;
          break;
        default:
          fullStyle = SimpleLineSymbol.STYLE_SOLID;
      }

      return fullStyle;
    },

    testImageUrl: function (url) {
      var deferred = new Deferred(),
          promise = deferred.promise,
          image = domConstruct.create("img"),
          loadHandler,
          errorHandler;

      loadHandler = on(image, "load", function () {
        if (image.width === 0 && image.height === 0) {
          deferred.reject();
        }
        else {
          deferred.resolve();
        }
      });

      errorHandler = on(image, "error", function () {
        deferred.reject();
      });

      image.src = url;

      promise.always(function () {
        loadHandler.remove();
        errorHandler.remove();
        domConstruct.destroy(image);
      });

      return promise;
    }

  };

  return symbolUtil;
});
