/**
 * Information about the coded values belonging to the domain. 
 * Coded value domains specify a set of valid values for an attribute. 
 * 
 * @module esri/layers/support/CodedValueDomain
 * @noconstructor
 * @since 4.0
 * @see [Domain Objects - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Domain_Objects/02r30000019r000000/)
 * @see module:esri/layers/support/Field
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "../../core/lang",
  "./Domain"
],
function(declare, lang, array, esriLang, Domain) {

  /**
  * @extends module:esri/layers/support/Domain
  * @constructor module:esri/layers/support/CodedValueDomain
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */    
  var CodedValueDomain = declare([ Domain ], 
  /** @lends module:esri/layers/support/CodedValueDomain */                               
  {
    declaredClass: "esri.layers.support.CodedValueDomain",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.codedValues = json.codedValues;
      }
    },
      
    /**
    * An array of the coded values in the domain. See the object specification table below for the 
    * properties each item in the array should contain.
    * 
    * @property {string} name - The name of the coded value.
    * @property {string | number} code - The value of the code.
    * 
    * @name codedValues
    * @instance
    * 
    * @type {Object[]}
    */ 
      
    /**
     * The domain type. This value is always `codedValue`.
     * 
     * @name type
     * @instance
     * @type {string}
     */    
    
    /**
     * Returns the name of the coded-value associated with the specified code.
     * 
     * @param   {string | number} code - The code associated with the desired name.
     *                                 
     * @return {string} The name of the coded value as specified in `code`.
     */
    getName: function(code) {
      var name;
      
      // Find name from the given code/value.
      array.some(this.codedValues, function(codedValue) {
        if (codedValue.code == code) {
          name = codedValue.name;
        }
        
        return !!name;
      });
      
      return name;
    },

    toJSON: function() {
      var json = this.inherited(arguments);
      json.codedValues = lang.clone(this.codedValues);
      return esriLang.fixJson(json);
    }
  });
  
  return CodedValueDomain;  
});
