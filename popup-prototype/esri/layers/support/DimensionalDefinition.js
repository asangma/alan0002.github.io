/**
 * A dimensional definition defines a filter based on one variable and one dimension. 
 * There can be one or multiple dimensional slices filtered.
 * 
 * @module esri/layers/support/DimensionalDefinition
 * @since 4.0
 *        
 * @example
 * var dimDef = new DimensionalDefinition({
 *   "variableName" : "Salinity",
 *   "dimensionName" : "StdZ",
 *   "values" : [-10,10],
 *   "isSlice":false
 * });
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "../../core/lang"
],
function (declare, lang, esriLang) {

  /**
  * @constructor module:esri/layers/support/DimensionalDefinition
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */    
  var DimensionalDefinition = declare(null, 
  /** @lends module:esri/layers/support/DimensionalDefinition.prototype */                                    
  {
    declaredClass: "esri.layers.support.DimensionalDefinition",
      
    /**
    * The variable name by which to filter.
    * 
    * @type {string}
    */  
    variableName: null,     /// non-optional variable name by which to filter  
      
    /**
    * The dimension associated with the variable.
    * 
    * @type {string}
    */
    dimensionName: null,    /// optional dimension associated with the variable
      
    /**
    * An array of tuples [min, max] each defining a range of 
    * valid values along the specified dimension.
    * 
    * @type {Object[]}
    * @example           
    * //-10 is the minimum valid value and 10 is the maximum valid value
    * dimDef.values = [-10,10];             
    */  
    values: [],  /// an array of tuples (min, max) each defining a range of valid values along the specified dimension 
      
    /**
    * Indicates whether the values indicate slices (rather than ranges).
    * 
    * @type {boolean}
    * @default false            
    */  
    isSlice: false,         /// indicates whether the values indicate slices (rather than ranges)

    constructor: function (json) {
      if (!lang.isObject(json)) {
        return;
      }

      lang.mixin(this, json);
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

    /**
     * Returns a serialized JSON object representation of the dimensional definition in the format
     * of the ArcGIS Platform.
     * 
     * @return {Object} A JSON representation of an instance of this class in the format of 
     *                  the ArcGIS platform.
     */  
    toJSON: function() {
      var json = {
        variableName: this.variableName,
        dimensionName: this.dimensionName,
        values: this.values,
        isSlice: this.isSlice
      };

      return esriLang.filter(json, function (value) {
        return value !== null;
      });
    }
  });

  return DimensionalDefinition;
});
