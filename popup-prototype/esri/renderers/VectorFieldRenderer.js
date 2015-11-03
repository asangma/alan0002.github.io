define(
[
  "require",

  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "../Color",

  "../core/lang",
  
  "../symbols/SimpleMarkerSymbol",
  "../symbols/PictureMarkerSymbol",
  "../symbols/SimpleLineSymbol",
  "../symbols/support/jsonUtils",

  "./Renderer",
  "./ClassBreaksRenderer"
],
function (
  require,
  declare, lang, array,
  Color,
  esriLang, 
  SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol, symUtils,
  Renderer, ClassBreaksRenderer
) {

    var eStyles = {
      STYLE_WIND_BARBS: "wind_speed",
      STYLE_SINGLE_ARROW: "single_arrow",
      STYLE_CLASSIFIED_ARROW: "classified_arrow",
      STYLE_BEAUFORT_KN: "beaufort_kn",
      STYLE_BEAUFORT_METER: "beaufort_m",
      STYLE_BEAUFORT_MILE: "beaufort_mi",
      STYLE_BEAUFORT_FEET: "beaufort_ft",
      STYLE_BEAUFORT_KM: "beaufort_km",
      STYLE_OCEAN_CURRENT_M: "ocean_current_m",
      STYLE_OCEAN_CURRENT_KN: "ocean_current_kn",
      STYLE_SCALAR: "simple_scalar"
    };

    var eFlowRepresentation = {
      FLOW_FROM: "flow_from",
      FLOW_TO: "flow_to"
    };

    var VectorFieldRenderer = declare(Renderer, {

      declaredClass: "esri.renderer.VectorFieldRenderer",
      iconFolderPath: "../images/symbol/sfs/",

      constructor: function (options) {
        if (!esriLang.isDefined(options)) {
          options = {};
        }

        options.attributeField = options.attributeField || "Magnitude";
        options.rotationInfo = options.rotationInfo || this._getRotationInfo(options);
        
        declare.safeMixin(this, options);
        this.style = this.style || VectorFieldRenderer.STYLE_SINGLE_ARROW;
        if (this.singleArrowSymbol) {
          this.singleArrowSymbol = this.singleArrowSymbol.declaredClass ? this.singleArrowSymbol : symUtils.fromJSON(this.singleArrowSymbol);
        }
        this.renderer = new ClassBreaksRenderer(this._getDefaultSymbol(), options.attributeField);
        this._updateRenderer(this.style);
        this.flowRepresentation = this.flowRepresentation || this.FLOW_FROM;
      },

      getSymbol: function (graphic) {
        return this.renderer && this.renderer.getSymbol(graphic);
      },

      setVisualVariables: function (variables) {
        // only sizeInfo is supported
        variables = array.filter(variables, function (variable) {
          if (variable.type === "sizeInfo") {
            return esriLang.isDefined(this._updateSizeInfo(variable));
          }
        }, this);

        this.inherited(arguments);
        return this;
      },

      setSizeInfo: function (info) {
        this._updateSizeInfo(info);
        this.inherited(arguments);
        return this;
      },

      setProportionalSymbolInfo: function (info) {
        this.setSizeInfo(info);
        return this;
      },

      setColorInfo: function(info) {
        // this is not supported
        return this;
      },

      _updateRenderer: function (style) {
        if (!esriLang.isDefined(this.renderer)) {
          return new Error("Invalid Renderer!");
        }
        if (style === VectorFieldRenderer.STYLE_SINGLE_ARROW) {
          return this._createSingleArrowRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_BEAUFORT_KN) {
          return this._createBeaufortKnotsRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_BEAUFORT_METER) {
          return this._createBeaufortMeterRenderer();
        } 
        else if (style === VectorFieldRenderer.STYLE_BEAUFORT_FEET) {
          return this._createBeaufortFeetRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_BEAUFORT_MILE) {
          return this._createBeaufortMilesRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_BEAUFORT_KM) {
          return this._createBeaufortKilometersRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_OCEAN_CURRENT_M) {
          return this._createCurrentMeterRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_OCEAN_CURRENT_KN) {
          return this._createCurrentKnotsRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_SCALAR) {
          return this._createSimpleScalarRenderer();
        }
        else if (style === VectorFieldRenderer.STYLE_WIND_BARBS) {
          return this._createWindBarbsRenderer();
        }

        return this._createClassifiedArrowRenderer();
      },

      _updateSizeInfo: function (info) {
        if (info && esriLang.isDefined(info.minSize) && esriLang.isDefined(info.maxSize)
        && esriLang.isDefined(info.minDataValue) && esriLang.isDefined(info.maxDataValue)) {
          if (this.style === VectorFieldRenderer.STYLE_WIND_BARBS) {
            info.minSize = info.maxSize;
          }

          info.field = info.field || "Magnitude";
          info.type = "sizeInfo";
          return info;
        }

        return null;
      },

      _createClassifiedArrowRenderer: function () {
        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([56, 168, 0]));

        var breakValues = [0, 0.000001, 3.5, 7, 10.5, 14];
        if (esriLang.isDefined(this.minDataValue) && esriLang.isDefined(this.maxDataValue)) {
          var bInterval = (this.maxDataValue - this.minDataValue) / 5;
          breakValues = [];

          var i, val;
          val = this.minDataValue;
          for (i = 0; i < 6; i++) {
            breakValues[i] = val;
            val += bInterval;
          }
        }

        var colors = [
          [56, 168, 0],
          [139, 309, 0],
          [255, 255, 0],
          [255, 128, 0],
          [255, 0, 0]
        ];

        this._addBreaks(breakValues, colors);
      },

      _createSingleArrowRenderer: function () {
        this.renderer.defaultSymbol = this.singleArrowSymbol || this._getDefaultSymbol();
      },

      _createBeaufortMeterRenderer: function () {
        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([214, 47, 39]));
        var breakValues = [0, 0.2, 1.8, 3.3, 5.4, 8.5, 11, 14.1, 17.2, 20.8, 24.4, 28.6, 32.7/*, Infinity*/];
        var colors = [
          [69, 117, 181],
          [101, 137, 184],
          [132, 158, 186],
          [162, 180, 189],
          [192, 204, 190],
          [222, 227, 191],
          [255, 255, 191],
          [255, 220, 161],
          [250, 185, 132],
          [245, 152, 105],
          [237, 117, 81],
          [232, 21, 21]
          /* [214, 47, 39] */
        ];
        this._addBreaks(breakValues, colors);
      },

      _createBeaufortKnotsRenderer: function () {

        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([214, 47, 39]));

        var breakValues = [0, 1, 3, 6, 10, 16, 21, 27, 33, 40, 47, 55, 63/*, Infinity*/],
          colors = [
            [40, 146, 199],
            [89, 162, 186],
            [129, 179, 171],
            [160, 194, 155],
            [191, 212, 138],
            [218, 230, 119],
            [250, 250, 100],
            [252, 213, 83],
            [252, 179, 102],
            [250, 141, 52],
            [247, 110, 42],
            [240, 71, 29]
           /* [214, 47, 39] */
          ];

        this._addBreaks(breakValues, colors);
      },
      
      _createBeaufortFeetRenderer: function(){
        var unitConvFactor = 3.28084; //converting breaks from m/s to feet/s
        var breakValues = [0, 0.2, 1.8, 3.3, 5.4, 8.5, 11, 14.1, 17.2, 20.8, 24.4, 28.6, 32.7/*, Infinity*/];
        array.forEach(breakValues, function(value, i){
          breakValues[i] *= unitConvFactor;
        });
        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([214, 47, 39]));
        
        var colors = [
          [69, 117, 181],
          [101, 137, 184],
          [132, 158, 186],
          [162, 180, 189],
          [192, 204, 190],
          [222, 227, 191],
          [255, 255, 191],
          [255, 220, 161],
          [250, 185, 132],
          [245, 152, 105],
          [237, 117, 81],
          [232, 21, 21]
          /* [214, 47, 39] */
        ];
        this._addBreaks(breakValues, colors);
      },
      
      _createBeaufortMilesRenderer: function(){
        var unitConvFactor = 2.23694; //converting breaks from m/s to mph
        var breakValues = [0, 0.2, 1.8, 3.3, 5.4, 8.5, 11, 14.1, 17.2, 20.8, 24.4, 28.6, 32.7/*, Infinity*/];
        array.forEach(breakValues, function(value, i){
          breakValues[i] *= unitConvFactor;
        });
        
        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([214, 47, 39]));
       
        var colors = [
          [69, 117, 181],
          [101, 137, 184],
          [132, 158, 186],
          [162, 180, 189],
          [192, 204, 190],
          [222, 227, 191],
          [255, 255, 191],
          [255, 220, 161],
          [250, 185, 132],
          [245, 152, 105],
          [237, 117, 81],
          [232, 21, 21]
          /* [214, 47, 39] */
        ];
        this._addBreaks(breakValues, colors);
      },
      
      _createBeaufortKilometersRenderer: function(){
        var unitConvFactor = 3.6; //converting breaks from m/s to km/h
        var breakValues = [0, 0.2, 1.8, 3.3, 5.4, 8.5, 11, 14.1, 17.2, 20.8, 24.4, 28.6, 32.7/*, Infinity*/];
        array.forEach(breakValues, function(value, i){
          breakValues[i] *= unitConvFactor;
        });
        
        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([214, 47, 39]));
       
        var colors = [
          [69, 117, 181],
          [101, 137, 184],
          [132, 158, 186],
          [162, 180, 189],
          [192, 204, 190],
          [222, 227, 191],
          [255, 255, 191],
          [255, 220, 161],
          [250, 185, 132],
          [245, 152, 105],
          [237, 117, 81],
          [232, 21, 21]
          /* [214, 47, 39] */
        ];
        this._addBreaks(breakValues, colors);
      },
      
      _createCurrentMeterRenderer: function () {

        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([177, 177, 177]));

        var breakValues = [0, 0.5, 1, 1.5, 2],
          colors = [
            [78, 26, 153],
            [179, 27, 26],
            [202, 128, 26],
            [177, 177, 177]
          ];
        this._addBreaks(breakValues, colors);
      },

      _createCurrentKnotsRenderer: function () {

        this.renderer.defaultSymbol = this._getDefaultSymbol(new Color([177, 177, 177]));

        var breakValues = [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4],
          colors = [
            [0, 0, 0],
            [0, 37, 100],
            [78, 26, 153],
            [151, 0, 100],
            [179, 27, 26],
            [177, 78, 26],
            [202, 128, 26],
            [177, 179, 52],
            [177, 177, 177]
          ];

        this._addBreaks(breakValues, colors);
      },

      _createSimpleScalarRenderer: function () {
        this.renderer.defaultSymbol = new PictureMarkerSymbol({
          "url": require.toUrl(this.iconFolderPath + "scalar.png"),
          "height": 20,
          "width": 20,
          "type": "esriPMS",
          "angle": 0
        });
      },

      _createWindBarbsRenderer: function () {
        var breaks = [], i, symbolPaths;
        for (i = 0; i <= 150; i += 5) {
          breaks.push(i);
        }
        symbolPaths = [
           /* 0-5 */ "M20 20 M5 20 A15 15 0 1 0 35 20 A15 15 0 1 0 5 20 M20 20 M10 20 A10 10 0 1 0 30 20 A10 10 0 1 0 10 20", //no fill
           /* 5-10 */ "M25 0 L25 40 M25 35 L17.5 37.5",
	         /* 10-15 */ "M25 0 L25 40 L10 45 L25 40",
	         /* 15-20 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L17.5 37.5",
	         /* 20-25 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L10 40",
	         /* 25-30 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L10 40 L25 35 M25 30 L17.5 32.5",
	         /* 30-35 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L10 40 L25 35 M25 30 L10 35",
	         /* 35-40 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L17.5 27.5",
           /* 40-45 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30",
	         /* 45-50 */ "M25 0 L25 40 L10 45 L25 40 M25 35 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30 L25 25 M25 20 L17.5 22.5",
	         /* 50-55 */ "M25 0 L25 40 L10 40 L25 35",
	         /* 55-60 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L17.5 32.5",
	         /* 60-65 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35",
	         /* 65-70 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L17.5 27.5",
	         /* 70-75 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30",
	         /* 75-80 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30 L25 25 M25 20 L17.5 22.5",
	         /* 80-85 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30 L25 25 M25 20 L10 25",
	         /* 85-90 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30 L25 25 M25 20 L10 25 L25 20 M25 15 L17.5 17.5",
           /* 90-95 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30 L25 25 M25 20 L10 25 L25 20 M25 15 L10 20",
	         /* 95-100 */ "M25 0 L25 40 L10 40 L25 35 M25 30 L10 35 L25 30 M25 25 L10 30 L25 25 M25 20 L10 25 L25 20 M25 15 L10 20 L25 15 M25 10 L17.5 12.5",
           /* 100-105 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30",
	         /* 105-110 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L17.5 27.5",
	         /* 110-115 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30",
	         /* 115-120 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L17.5 22.5",
	         /* 120-125 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L10 25",
	         /* 125-130 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L10 25 M25 20 M25 15 L17.5 17.5",
	         /* 130-135 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L10 25 M25 20 M25 15 L10 20",
	         /* 135-140 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L10 25 M25 20 M25 15 L10 20 M25 15 M25 10 L17.5 12.5",
	         /* 140-145 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L10 25 M25 20 M25 15 L10 20 M25 15 M25 10 L10 15",
           /* 145-150 */ "M25 0 L25 40 L10 40 L25 35 L10 35 L25 30 M25 25 L10 30 M25 25 M25 20 L10 25 M25 20 M25 15 L10 20 M25 15 M25 10 L10 15 M25 10 M25 5 L17.5 7.5"
        ];

        var defaultSymbol = new PictureMarkerSymbol({
          "url": require.toUrl(this.iconFolderPath + "windbarb.png"),
          "height": 20,
          "width": 20,
          "type": "esriPMS",
          "angle": 0
        });
        this.renderer.defaultSymbol = defaultSymbol;

        for (i = 0; i < (breaks.length - 1) ; i++) {
          if (i == 0) {
            this.renderer.addBreak({
              minValue: breaks[i],
              maxValue: breaks[i + 1],
              symbol: defaultSymbol
            });
          } else {
            this.renderer.addBreak({
              minValue: breaks[i],
              maxValue: breaks[i + 1],
              symbol: new SimpleMarkerSymbol().setPath(symbolPaths[i])
                .setOutline(new SimpleLineSymbol().setWidth(1.5))
                .setSize(20)
                .setColor(new Color([0, 0, 0, 255]))
            });
          }
        }

      },

      /*****************
       * Private Methods
       *****************/
      _getDefaultSymbol: function (color) {
        return new SimpleMarkerSymbol().setPath("M14,32 14,18 9,23 16,3 22,23 17,18 17,32 z")
          .setOutline(new SimpleLineSymbol().setWidth(0))
          .setSize(20)
          .setColor(color || new Color([0, 92, 230]));
      },

      _getRotationInfo: function (options) {
        var flowRepresentation = (options && options.flowRepresentation) || VectorFieldRenderer.FLOW_FROM;
        var rotationField = (options && options.rotationField) || "Direction";
        var flowFrom = VectorFieldRenderer.FLOW_FROM;
        return {
          field: function (graphic) {
            var dir = graphic.attributes[rotationField];
            return (flowRepresentation === flowFrom) ? dir : dir + 180;
          },
          type: "geographic"
        };
      },

      _addBreaks: function (breakValues, colors) {
        if (!esriLang.isDefined(this.renderer)) {
          return new Error("Invalid Renderer!");
        }
        if (!(breakValues && colors) || !(breakValues.length && colors.length) ||
          !(breakValues.length >= colors.length)) {
          return new Error("AddBreaks: Input arguments break values and colors not valid");
        }
        var i; 
        for (i = 0; i < colors.length ; i++) {
          this.renderer.addBreak({
            minValue: breakValues[i],
            maxValue: breakValues[i + 1],
            symbol: this._getDefaultSymbol(new Color(colors[i]))
          });
        }
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
            type: "vectorField",
            style: this.style,
            attributeField: this.attributeField,
            flowRepresentation: this.flowRepresentation
          });

        if (this.renderer && this.renderer.defaultSymbol && this.style === VectorFieldRenderer.STYLE_SINGLE_ARROW) {
          retVal.singleArrowSymbol = this.renderer.defaultSymbol.toJSON();
        }

        return esriLang.fixJson(retVal);
      }

    });

    lang.mixin(VectorFieldRenderer, eStyles, eFlowRepresentation);

    
    return VectorFieldRenderer;
  });
