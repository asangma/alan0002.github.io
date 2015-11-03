define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom-construct",

  "../Color",

  "../core/lang",
  "../core/screenUtils",

  "../symbols/PictureFillSymbol",

  "../geometry/ScreenPoint",
  "../geometry/Point",
  
  "./Renderer"
], function(
  declare, lang, array, domConstruct,
  Color,
  esriLang, screenUtils,
  PictureFillSymbol,
  ScreenPoint, Point,
  Renderer
) {

  var DotDensityRenderer = declare(Renderer, {
    declaredClass: "esri.renderer.DotDensityRenderer",

    constructor: function(options) {
      this.dotSize = options.dotSize || 3;
      this.dotValue = options.dotValue;
      this.fields = options.fields;  //[{name:"foo", color:dojo.Color, label:"my label"}]
      this.outline = options.outline;
      this.backgroundColor = options.backgroundColor;
      this.exactCount = options.exactCount || true;
      this.dotShape = options.dotShape || "square";
      this.legendOptions = options.legendOptions;

      this._exactCountMinArea = 10000;
      this._canvas = null;
      this._map = null;
      this._currentMapScale = null;
      this._symbolMap = {};  //in memory cache of symbols by [scale][featureId]
      this._objectIdField = null;
      this._currentResolution = null;
      this._currentGraphic = null;
      this._supportsCanvas = (window.CanvasRenderingContext2D) ? true : false;

      if (!window.CanvasRenderingContext2D) {
        console.log("The DotDensityRenderer requires a Canvas enabled Browser.  IE8 and less does not support Canvas.");
      }
    },

    getSymbol: function(graphic) {
      var fields, pfs, imageShapeProps;
      this._currentGraphic = graphic;

      if (!this._supportsCanvas) {
        //no canvas for you!
        return null;
      }

      if (!this._map) {
        this._map = graphic.getLayer()._map;
        this._objectIdField = graphic.getLayer().objectIdField;
        this._currentMapScale = this._map.getScale();
        this._currentResolution = this._map.extent.getWidth() / this._map.width;
        this._map.on("zoom-end", lang.hitch(this, function(evt) {
          this._currentMapScale = this._map.getScale();
          this._currentResolution = evt.extent.getWidth() / this._map.width;
          //have to recalculate cache on level change until we figure out image offset after zoom.
          // if (!this._symbolMap[this._currentMapScale]) {
          //   this._symbolMap[this._currentMapScale] = {};
          // }
          this._symbolMap[this._currentMapScale] = {};
        }));
      }

      if (this._symbolMap[this._currentMapScale] && this._symbolMap[this._currentMapScale][graphic.attributes[this._objectIdField]]) {
        //symbol already in symbolMap
        pfs = this._symbolMap[this._currentMapScale][graphic.attributes[this._objectIdField]];
        imageShapeProps = this._getShapeProperties(graphic);
        pfs.setOffset(imageShapeProps.dx, imageShapeProps.dy);
        return pfs;
      }

      //add numPoints to each field object
      fields = this._generateFieldsCount(this.fields, graphic.attributes, this.dotValue);

      //calculate image screen properties with respect to current layer and image translations.
      imageShapeProps = this._getShapeProperties(graphic);

      pfs = new PictureFillSymbol(this._generateImageSrc(imageShapeProps.width, imageShapeProps.height, fields, imageShapeProps.minXY, imageShapeProps.maxXY), this.outline,
          imageShapeProps.width, imageShapeProps.height);
      pfs.setOffset(imageShapeProps.dx, imageShapeProps.dy);

      if (!this._symbolMap[this._currentMapScale]) {
        this._symbolMap[this._currentMapScale] = {};
        this._symbolMap[this._currentMapScale][graphic.attributes[this._objectIdField]] = pfs;
      }
      else {
        this._symbolMap[this._currentMapScale][graphic.attributes[this._objectIdField]] = pfs;
      }
      return pfs;
    },

    _generateFieldsCount: function(fields, attributes, dotValue) {
      var count, i;
      for (i = fields.length - 1; i >= 0; i--) {
        count = attributes[fields[i].name] / dotValue;
        fields[i].numPoints = Math.round(count);
      }
      return fields;
    },

    _getShapeProperties: function(graphic) {
      var extent, minXY, maxXY, dx, dy, ltx, width, height;
      extent = graphic.geometry.getExtent();
      //if map extent is completely contained by the graphic extent use the map extent for the image size
      if (extent.contains(this._map.extent)) {
        extent = this._map.extent;
      }

      width = Math.ceil(extent.getWidth() / this._currentResolution);
      height = Math.ceil(extent.getHeight() / this._currentResolution);
      minXY = this._map.toScreen(new Point(extent.xmin, extent.ymin, extent.spatialReference));
      maxXY = this._map.toScreen(new Point(extent.xmax, extent.ymax, extent.spatialReference));
      ltx = graphic.getLayer().getNode().getCTM();

      // dx = (minXY.x - (ltx.e - this._map.__visibleDelta.x)) % width;
      // dy = (maxXY.y - (ltx.f + this._map.__visibleDelta.y)) % height;
      dx = (minXY.x - ltx.e) % width;
      dy = (maxXY.y - ltx.f) % height;
      return { minXY: minXY, maxXY: maxXY, dx: dx, dy: dy, width: width, height: height };
    },

    _generateImageSrc: function(width, height, fields, minXY, maxXY, bgColor) {
      var size = this.dotSize, ctx, i, j, pt;

      if (!this._canvas) {
        this._canvas = this._initCanvas(width, height);
      }
      else {
        this._canvas.width = width;
        this._canvas.height = height;
      }

      ctx = this._canvas.getContext("2d");

      bgColor = bgColor || this.backgroundColor;

      if (bgColor) {
        ctx.fillStyle = bgColor.toCss(true);
        ctx.fillRect(0, 0, width, height);
        ctx.fill();
      }

      for (i = fields.length - 1; i >= 0; i--) {
        ctx.fillStyle = fields[i].color.toCss(true);
        for (j = fields[i].numPoints - 1; j >= 0; j--) {
          pt = this._getRandomPoint(width, height, minXY, maxXY);
          if (this.dotShape === "square") {
            //fill as rectangle.  Fast
            ctx.fillRect(pt.x, pt.y, size, size);
          }
          else if (this.dotShape === "circle") {
            //fill as circle.  Slower
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2, true);
          }
          ctx.fill();
        }
      }
      return this._canvas.toDataURL();
    },

    _initCanvas: function(width, height) {
      var canvas = domConstruct.create("canvas", {
        id: "canvas",
        width: width + "px",
        height: height + "px",
        style: "position: absolute; left: -10000px; top: 0px;"
      }, null);
      document.body.appendChild(canvas);
      return canvas;
    },

    _getRandomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },

    _getRandomPoint: function(width, height, minXY, maxXY) {
      var pt = {}, inShape, screenPoint,
          outllineWidth = (this.outline && this.outline.width) ? this.outline.width : 0;
      //check that point is within polygon if exact count is true and pixel area is greater than 10,000 (100 x 100) or 5625 (75 x 75)
      if (this.exactCount === true && (width * height > this._exactCountMinArea)) {
        inShape = false;
        do {
          pt.x = this._getRandomInt(minXY.x, maxXY.x);
          pt.y = this._getRandomInt(maxXY.y, minXY.y);
          screenPoint = new ScreenPoint(pt.x, pt.y);
          inShape = this._checkPointShapeBounds(screenPoint, this.dotSize + outllineWidth, this._currentGraphic.geometry);
          if (inShape === true) {
            pt.x = pt.x - minXY.x;
            pt.y = pt.y - maxXY.y;
          }
        }
        while (inShape === false);
      }
      else {
        pt.x = this._getRandomInt(0, width);
        pt.y = this._getRandomInt(0, height);
      }
      return pt;
    },

    _checkPointShapeBounds: function(screenPoint, outlinePlusDotSize, geometry) {
      var geoPoint = null,
          inShape = false,
          candidateInShape = true,
          pointIndex = 0;
      do {
        switch (pointIndex) {
          case 0:
            break;  //upper left
          case 1:
            screenPoint.x = screenPoint.x + outlinePlusDotSize;  //upper right
            break;
          case 2:
            screenPoint.y = screenPoint.y + outlinePlusDotSize; //lower right
            break;
          case 3:
            screenPoint.x = screenPoint.x - outlinePlusDotSize;  //lower left
            break;
        }
        geoPoint = this._map.toMap(screenPoint);
        inShape = geometry.contains(geoPoint);
        if (inShape === false) {
          candidateInShape = false;
        }
        pointIndex = pointIndex + 1;
      }
      while ((pointIndex <= 3) && (candidateInShape === true));
      return inShape;
    },

    setDotSize: function(size) {
      if (size > 0) {
        this.dotSize = size;
      }
    },

    setDotValue: function(value) {
      if (value > 0) {
        this.dotValue = value;
      }
    },

    setOutline: function(outline) {
      this.outline = outline;
    },

    setBackgroundColor: function(color) {
      this.backgroundColor = color;
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      var retVal = lang.mixin(this.inherited(arguments),
          {
            type: "dotDensity",
            backgroundColor: Color.toJSON(this.backgroundColor),
            dotShape: this.dotShape,
            dotSize: this.dotSize > 0 ? screenUtils.px2pt(this.dotSize) : 0,
            dotValue: this.dotValue,
            fields: array.map(this.fields, function(field) {
              return esriLang.fixJson({
                color: Color.toJSON(field.color),
                name: field.name
              });
            }),
            legendOptions: this.legendOptions && esriLang.fixJson({
              backgroundColor: Color.toJSON(this.legendOptions.backgroundColor),
              dotCoverage: this.legendOptions.dotCoverage,
              outline: this.legendOptions.outline && this.legendOptions.outline.toJSON(),
              valueUnit: this.legendOptions.valueUnit
            }),
            outline: this.outline && this.outline.toJSON()
          }
      );

      return esriLang.fixJson(retVal);
    }
  });

  

  return DotDensityRenderer;
});
