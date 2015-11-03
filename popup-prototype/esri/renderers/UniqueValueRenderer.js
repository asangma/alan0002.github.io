/**
 * A unique value renderer symbolizes groups of graphics that have
 * matching attributes.
 * 
 * @module esri/renderers/UniqueValueRenderer
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
   * @constructor module:esri/renderers/UniqueValueRenderer
   * @param {module:esri/symbols/Symbol} defaultSymbol - Default symbol for the renderer. This symbol is 
   *    used for unmatched values. This parameter is required but can be `null` or an empty object.
   * @param {string | Function} attributeField - Specifies either the attribute field the renderer uses to 
   *    match values or a function that returns a value to be compared against unique 
   *    values. If a function is specified the renderer will call this function once for every graphic drawn on 
   *    the map. This can be used in cases where you want the unique values to be compared against a computed 
   *    value that is not available via the attribute fields.
   * @param {string=} attributeField2 - If needed, specify an additional attribute field the renderer uses to match values.
   * @param {string=} attributeField3 - If needed, specify an additional attribute field the renderer uses to match values.
   * @param {string=} fieldDelimeter - String inserted between the values of different fields. Applicable only 
   *                                 when more than one attribute field is specifed for the renderer.
   */
  var UniqueValueRenderer = declare(Renderer, 
  /** @lends module:esri/renderers/UniqueValueRenderer.prototype */                                  
  {
    declaredClass: "esri.renderer.UniqueValueRenderer",
    
    constructor: function(sym, attr, /*Optional*/ attr2, /*Optional*/ attr3, /*Optional*/ fieldDelimiter) {
      // 2nd constructor signature added at v2.0:
      // esri.renderer.UniqueValueRenderer(<Object> json);
      this.values = [];
      this._symbols = {}; // symbol dictionary for fast lookup
      this.infos = [];
      
      if (sym && !sym.declaredClass) {
        // REST JSON representation
        var json = sym;
        
        sym = json.defaultSymbol;
        this.defaultSymbol = sym && (sym.declaredClass ? sym : symUtils.fromJSON(sym));
        
        this.attributeField = json.field1;
        this.attributeField2 = json.field2;
        this.attributeField3 = json.field3;
        this.fieldDelimiter = json.fieldDelimiter;
        this.defaultLabel = json.defaultLabel;
        
        array.forEach(json.uniqueValueInfos, this._addValueInfo, this);
      }
      else {
        this.defaultSymbol = sym;
        this.attributeField = attr;
        this.attributeField2 = attr2;
        this.attributeField3 = attr3;
        this.fieldDelimiter = fieldDelimiter;
      }
      
      // Do we have more than one attribute fields?
      this._multiple = !!this.attributeField2;
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
    * If needed, specify the name of an additional attribute field the renderer will use to match values.
    *
    * @type {string}
    */  
    attributeField2: null,
     
    /**
    * If needed, specify the name of a third attribute field the renderer will use to match values.
    *
    * @type {string}
    */  
    attributeField3: null,
    
    /**
    * Label for the default symbol used to draw unspecified values.
    *
    * @type {string}
    */  
    defaultLabel: null,
      
    /**
    * Default symbol used when a value or break cannot be matched.
    *
    * @type {module:esri/symbols/Symbol}
    */  
    defaultSymbol: null,
     
    /**
    * String inserted between the values if multiple attribute fields are specified.
    *
    * @type {string}
    */  
    fieldDelimiter: null,
      
    /**
    * Each element in the array is an object that provides information about a unique value associated with the renderer. 
    * Each object has the following specification:
    * 
    * @property {string} value - The unique value used to classify features.
    * @property {module:esri/symbols/Symbol} symbol - The symbol used to style features whose value matches `value`.
    * @property {string} label - Label for the symbol used to draw the value.
    * @property {string} description - Description for the symbol used to draw the value.
    *
    * @type {Object[]}
    */  
    infos: null,  
      
    /**
     * Adds a unique value and symbol to the renderer. You can provide the value and its associated symbol as 
     * individual arguments or as an info object.
     * 
     * @param {string | Object} valueOrInfo - Value to match with. The value can be provided as an individual argument 
     *                                      or as an [info object](#infos).
     * @param {module:esri/symbols/Symbol} symbol - Symbol used for the value.
     */
    addValue: function(valueOrInfo, symbol) {
      // 2nd method signature added at v2.0:
      // addValue(<Object> info); 
      var info = lang.isObject(valueOrInfo) ? valueOrInfo : { 
                   value: valueOrInfo, 
                   symbol: symbol 
                 };
      
      this._addValueInfo(info);
    },
    
    /**
     * Removes a unique value. After making changes, you must refresh the graphic.
     * 
     * @param {string} value - Value to remove from [infos](#infos).
     */
    removeValue: function(value) {
      var i = array.indexOf(this.values, value);
      if (i === -1) {
        return;
      }
      
      this.values.splice(i, 1);
      delete this._symbols[value];
      this.infos.splice(i, 1);
    },
    
    /*update: function(value, symbolOrInfo) {
      var i = array.indexOf(this.values, value);
      if (i === -1) {
        return;
      }
      
      if (symbolOrInfo) {
        if (symbolOrInfo.declaredClass) { // Symbol
          this._symbols[value] = symbolOrInfo;
          this.infos[i].symbol = symbolOrInfo;
        }
        else { // Info
          // TODO
        }
      }
    },*/
   
   /**
    * Returns rendering and legend information (as defined by the renderer) associated with the given graphic.
    * 
    * @param   {module:esri/Graphic} graphic - The graphic whose rendering and legend information will be returned.
    *                                        
    * @return {Object} An object describing the rendering and legend information of the input graphic.
    */
   getUniqueValueInfo: function(graphic) {
      var field1 = this.attributeField,
          attributes = graphic.attributes,
          field2, field3, values, value;
      
      if (this._multiple) {
        field2 = this.attributeField2;
        field3 = this.attributeField3;
        values = [];
        
        if (field1) {
          values.push(attributes[field1]);
        }
        if (field2) {
          values.push(attributes[field2]);
        }
        if (field3) {
          values.push(attributes[field3]);
        }
        
        value = values.join(this.fieldDelimiter || "");
      }
      else {
        value = lang.isFunction(field1) ? field1(graphic) : attributes[field1];
      }
      
      return this._symbols[value];
   },
    
    getSymbol: function(graphic) {
      var info = this.getUniqueValueInfo(graphic);
      return (info && info.symbol) || this.defaultSymbol;
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _addValueInfo: function(/*Object*/ info) {
      /*
       * info = {
       *   value: <String>,
       *   symbol: <Symbol | json>,
       *   label: <String>,
       *   description: <String>
       * }
       */
      var value = info.value;
      this.values.push(value);
      this.infos.push(info);
      
      var symbol = info.symbol;
      if (symbol) {
        if (!symbol.declaredClass) { // symbol in its json form?
          info.symbol = symUtils.fromJSON(symbol);
        }
      }
      
      this._symbols[value] = info;
    },

    collectRequiredFields: function(fields) {
      this.inherited(arguments);

      [this.attributeField, this.attributeField2, this.attributeField3].forEach(function(field) {
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
      var sanitize = esriLang.fixJson,
          retVal = lang.mixin(
            this.inherited(arguments),
            {
              type: "uniqueValue",
              field1: this.attributeField,
              field2: this.attributeField2,
              field3: this.attributeField3,
              fieldDelimiter: this.fieldDelimiter,
              defaultSymbol: this.defaultSymbol && this.defaultSymbol.toJSON(),
              defaultLabel: this.defaultLabel,
              
              uniqueValueInfos: array.map(this.infos || [], function(info) {
                info = lang.mixin({}, info);
                info.symbol = info.symbol && info.symbol.toJSON();
                // http://stackoverflow.com/questions/5765398/whats-the-best-way-to-convert-a-number-to-a-string
                info.value = info.value + "";
                return sanitize(info);
              })
            }
          );
      
      return sanitize(retVal);
    }
  });

   

  return UniqueValueRenderer;
});
