/**
 * A class breaks renderer symbolizes each graphic based on the value of
 * a numeric attribute.
 * 
 * @module esri/renderers/ClassBreaksRenderer
 * @since 4.0
 */
define(
[
  "../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",
  "../core/lang",
  "../symbols/support/jsonUtils",
  "./Renderer"
],
function(declare, array, lang, esriLang, symUtils, Renderer) {

  /**
   * @extends module:esri/renderers/Renderer
   * @constructor module:esri/renderers/ClassBreaksRenderer
   * @param {module:esri/symbols/Symbol} defaultSymbol - Default symbol for the renderer. This symbol 
   *    is used for unmatched values. This parameter is required but can be `null` or an empty object.
   * @param {string | Function} attributeField - Specifies either the attribute field the renderer uses to 
   *  match values or a function that returns a value to be compared against class breaks. If a function 
   *  is specified the renderer will call this function once for every graphic drawn on the map. This can 
   *  be used in cases where you want class breaks to be compared against a computed value that is not 
   *  available via the attribute fields.  
   */
  var ClassBreaksRenderer = declare(Renderer, 
  /** @lends module:esri/renderers/ClassBreaksRenderer.prototype */                                  
  {
    declaredClass: "esri.renderer.ClassBreaksRenderer",
    
    constructor: function(sym, attr) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.ClassBreaksRenderer(<Object> json);
      this.breaks = [];
      this._symbols = {}; // symbol dictionary for fast lookup
      this.infos = [];
      this.isMaxInclusive = true;

      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        this.attributeField = json.field;

        sym = json.defaultSymbol;
        this.defaultSymbol = sym && (sym.declaredClass ? sym : symUtils.fromJSON(sym));
        
        // Applicable only to polygon features. If backgroundFillSymbol is 
        // defined, break symbols will be markers.
        // See: http://resources.arcgis.com/en/help/main/10.1/00s5/00s500000024000000.htm
        sym = json.backgroundFillSymbol;
        this.backgroundFillSymbol = sym && (sym.declaredClass ? sym : symUtils.fromJSON(sym));
        
        this._copy(
          [
            "defaultLabel", 
            "classificationMethod:rest", 
            "normalizationType:rest", 
            "normalizationField", 
            "normalizationTotal" 
          ], 
          json, this
        );
        
        //this.defaultLabel = json.defaultLabel;
        
        var min = json.minValue, infos = json.classBreakInfos;
        if (infos && infos[0] && esriLang.isDefined(infos[0].classMaxValue)) {
          array.forEach(infos, function(info) {
            var classMax = info.classMaxValue;
            info.minValue = min;
            info.maxValue = classMax;
            min = classMax;
          }, this);
        }
        
        array.forEach(infos, this._addBreakInfo, this);
      }
      else {
        this.defaultSymbol = sym;
        this.attributeField = attr;
      }
    },
    
    /*******************
     * Properties
     *******************/
    
    /**
    * The name of the attribute field the renderer uses to match values.
    * 
    * @type {string}
    */
    attributeField: null,
     
    /**
    * To symbolize polygon features with graduated symbols, use backgroundFillSymbol to specify a simple 
    * fill symbol to represent polygon features, and use marker symbols of varying sizes in class breaks to indicate the quantity.
    * 
    * @type {module:esri/symbols/FillSymbol}
    */  
    backgroundFillSymbol: null,
      
    /**
    * The classification method used to generate class breaks.
    * 
    * **Known Values:** equal-interval | geometrical-interval | natural-breaks | quantile | standard-deviation
    * 
    * @type {string}
    */  
    classificationMethod: null,
    
    /**
    * Default symbol used when a value or break cannot be matched.
    * 
    * @type {module:esri/symbols/Symbol}
    */  
    defaultSymbol: null,
     
    /**
    * Each element in the array is an object that provides information about a class break associated with the renderer. 
    * Each object has the following specification:
    * 
    * @property {number} minValue - The minimum value of the break.
    * @property {number} maxValue - The maximum value of the break.
    * @property {module:esri/symbols/Symbol} symbol - The symbol used to style features whose values are between
    * the `minValue` and `maxValue` of the break.
    * @property {string} label - Label for the symbol used to draw the value.
    * @property {string} description - Description for the symbol used to draw the value.
    * 
    * @type {Object[]}
    */
    infos: null,
      
    /**
    * Includes graphics with attribute values equal to the max value of a class in that class. This is usually `true`. 
    * Set this property to `false` if the desired behavior is to make a class include
    * values less than the max value but not equal to the max value. 
    * 
    * @type {boolean}
    * @default true
    */  
    isMaxInclusive: null,  
    
    /**
     * Adds a class break. You can provide the minimum, maximum and symbol values as individual arguments or using the info object. 
     * The range of the break is greater than or equal to the minimum value and less than the maximum value. After making changes, 
     * you must refresh the graphic.
     * 
     * @param {number | Object} min - Minimum value to use in the break. This can be a number or an info object as defined in [infos](#infos).
     * @param {number | Object} max - Maximum value to use in the break. This can be a number or an info object as defined in [infos](#infos).
     * @param {module:esri/symbols/Symbol} symbol - Symbol to use for the break.
     */
    addBreak: function(min, max, symbol) {
      // 2nd method signature added at v2.0:
      // addBreak(<Object> info); 
      var info = lang.isObject(min) ? min : { minValue: min, maxValue: max, symbol: symbol };
      this._addBreakInfo(info);
    },

    /**
     * Removes a break. After making changes, you must refresh the graphic.
     * 
     * @param {number} min - Minimum value in the break to remove
     * @param {number} max - Maximum value in the break to remove.
     */
    removeBreak: function(min, max) {
      var range, ranges = this.breaks,
          i, il = ranges.length,
          _syms = this._symbols;
          
      for (i=0; i<il; i++) {
        range = ranges[i];
        if (range[0] == min && range[1] == max) {
          ranges.splice(i, 1);
          delete _syms[min + "-" + max];
          this.infos.splice(i, 1);
          break;
        }
      }
    },
    
    /**
     * Removes all existing class breaks for the renderer.
     */
    clearBreaks: function() {
      this.breaks = [];
      this._symbols = {};
      this.infos = [];
    },

    /**
     * Returns the index at which rendering and legend information can be found in the break infos array for 
     * the given graphic. Returns `-1` if the renderer was unable to classify the graphic.
     * 
     * @param {module:esri/Graphic} graphic - The graphic whose rendering and legend information index in the break infos array will be returned.
     *                                      
     * @return {number} Returns the index of the break info object in [infos](#infos) associated with the input graphic.
     */
    getBreakIndex: function(graphic) {
      var attr = this.attributeField,
          attributes = graphic.attributes,
          val,
          rs = this.breaks,
          i, il = rs.length,
          range, incl = this.isMaxInclusive;
      
      if (lang.isFunction(attr)) {
        val = attr(graphic);
      }
      else {
        val = parseFloat(attributes[attr]);
        
        var normType = this.normalizationType,
            normTotal, normValue;

        if (normType) {
          normTotal = parseFloat(this.normalizationTotal);
          normValue = parseFloat(attributes[this.normalizationField]);

          // http://resources.esri.com/help/9.3/arcgisengine/java/api/arcobjects/com/esri/arcgis/carto/IDataNormalization.html#getNormalizationType%28%29          
          if (normType === "log") {
            // Base 10 logarithm
            val = Math.log(val) * Math.LOG10E; // or divide by Math.log(10)
          }
          else if (normType === "percent-of-total" && !isNaN(normTotal)) {
            val = (val / normTotal) * 100;
          }
          else if (normType === "field") {
            if (!isNaN(val) && !isNaN(normValue)) {
              // both attribute values are valid
              val = val / normValue;
            } else {
              // at least one attribute value is not valid; display with default symbol
              return -1;
            }
          }
        }
      }
      
      for (i = 0; i < il; i++) {
        range = rs[i];
        
        if (
          range[0] <= val && 
          (incl ? (val <= range[1]) : (val < range[1]))
        ) {
          return i;
        }
      }
      
      return -1;
    },
      
    /**
     * Returns rendering and legend information (as defined by the renderer) associated with the given graphic.
     * 
     * @param   {module:esri/Graphic} graphic - The graphic whose rendering and legend information will be returned.
     *                                        
     * @return {Object} Returns an object containing rendering and legend information for the break associated with the graphic.
     */
    getBreakInfo: function(graphic) {
      var index = this.getBreakIndex(graphic);
      return (index !== -1) ? this.infos[index] : null;
    },

    getSymbol: function(graphic) {
      var range = this.breaks[this.getBreakIndex(graphic)];

      return range ? 
              this._symbols[range[0] + "-" + range[1]] : 
              this.defaultSymbol;
    },
    
    setMaxInclusive: function(isInclusive) {
      this.isMaxInclusive = isInclusive;
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    // [ dev-type, restType ]
    _normalizationTypeEnums: [
      [ "field",            "esriNormalizeByField" ],
      [ "log",              "esriNormalizeByLog" ],
      [ "percent-of-total", "esriNormalizeByPercentOfTotal" ]
    ],
    
    // [ dev-type, restType ]
    _classificationMethodEnums: [
      [ "natural-breaks",       "esriClassifyNaturalBreaks" ],
      [ "equal-interval",       "esriClassifyEqualInterval" ],
      [ "quantile",             "esriClassifyQuantile" ],
      [ "standard-deviation",   "esriClassifyStandardDeviation" ],
      [ "geometrical-interval", "esriClassifyGeometricalInterval" ]
    ],
    
    _copy: function(keys, fromObj, toObj) {
      array.forEach(keys, function(key) {
        var command = key.split(":"),
            enumList, fromIndex, toIndex,
            value;
        
        // For Enum translation
        // "key" = "normalizationType:rest" or
        // "key" = "normalizationType:sdk"
        if (command.length > 1) {
          key = command[0];
          enumList = this["_" + key + "Enums"];
          
          if (command[1] === "rest") {
            fromIndex = "1";
            toIndex = "0";
          }
          else if (command[1] === "sdk") {
            fromIndex = "0";
            toIndex = "1";
          }
        }
        
        value = fromObj[key];
        
        if (value !== undefined) {
          // simple copy
          toObj[key] = value;
          
          // perform enum translation?
          if (enumList && fromIndex) {
            var i, len = enumList.length;
            
            for (i = 0; i < len; i++) {
              if (enumList[i][fromIndex] === value) {
                toObj[key] = enumList[i][toIndex];
                break;
              }
            }
          }
        }
      }, this);
    },
    
    _addBreakInfo: function(/*Object*/ info) {
      /*
       * info = {
       *   minValue: <Number>,
       *   maxValue: <Number>,
       *   symbol: <Symbol | json>,
       *   label: <String>,
       *   description: <String>
       * }
       */
      var min = info.minValue, max = info.maxValue;
      this.breaks.push([min, max]);
      this.infos.push(info);
      
      var symbol = info.symbol;
      if (symbol) {
        if (!symbol.declaredClass) { // symbol in its json form?
          info.symbol = symUtils.fromJSON(symbol);
        }
      }
      
      // TODO
      // This is a weird lookup pattern
      this._symbols[min + "-" + max] = info.symbol;
      
      //this._sort();
    },

    collectRequiredFields: function(fields) {
      this.inherited(arguments);

      [this.attributeField, this.normalizationField].forEach(function(field) {
        if (field) {
          fields[field] = true;
        }
      });
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
      var infos = this.infos || [], 
          sanitize = esriLang.fixJson,
          minValue = infos[0] && infos[0].minValue,
          bgFill = this.backgroundFillSymbol,
          
          json = lang.mixin(
            this.inherited(arguments),
            {
              type: "classBreaks",
              field: this.attributeField,
              defaultSymbol: this.defaultSymbol && this.defaultSymbol.toJSON(),
              backgroundFillSymbol: bgFill && bgFill.toJSON(),
              //defaultLabel: this.defaultLabel,
              
              minValue: (minValue === -Infinity) ? -Number.MAX_VALUE : minValue,
              classBreakInfos: array.map(infos, function(info) {
                info = lang.mixin({}, info);
                info.symbol = info.symbol && info.symbol.toJSON();
                info.classMaxValue = (info.maxValue === Infinity) ? Number.MAX_VALUE : info.maxValue;
                delete info.minValue;
                delete info.maxValue;
                return sanitize(info);
              })
            }
          );
    
      this._copy(
        [
          "defaultLabel", 
          "classificationMethod:sdk", 
          "normalizationType:sdk", 
          "normalizationField", 
          "normalizationTotal" 
        ], 
        this, json
      );
      
      // Remove normalizationType and classificationMethod properties from json 
      // if they have <null> values.
      // normalizationType = null has been known to crash native operations dashboard.
      // We *may* have similar problem for classificationMethod also. 
      if (json.hasOwnProperty("normalizationType") && !json.normalizationType) {
        delete json.normalizationType;
      }

      if (json.hasOwnProperty("classificationMethod") && !json.classificationMethod) {
        delete json.classificationMethod;
      }
    
      return sanitize(json);
    }
  });

   

  return ClassBreaksRenderer;
});
