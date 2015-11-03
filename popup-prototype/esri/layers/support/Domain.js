/**
 * Domains define constraints on a {@link module:esri/layers/Layer layer} 
 * {@link module:esri/layers/support/Field field}. There are two types of domains: coded values and range domains.
 * This class has no constructor.
 * 
 * @module esri/layers/support/Domain
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/support/Field
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "../../core/lang"
],
function(declare, lang, esriLang) {

  /**
  * @constructor module:esri/layers/support/Domain
  */
  var Domain = declare(null, 
  /** @lends module:esri/layers/support/Domain.prototype */                     
  {
    declaredClass: "esri.layers.support.Domain",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.name = json.name;
        this.type = json.type;
      }
    },
      
    /**
     * The domain name.
     * 
     * @name name
     * @type {string}
     * @instance
     */
      
    /**
     * The domain type.
     * 
     * **Possible Values:** range | codedValue
     * 
     * @name type
     * @type {string}
     * @instance
     */  

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
     * Converts an instance of this class to its ArcGIS Server JSON representation.
     * 
     * @return {Object} The ArcGIS Server JSON representation of an instance of this class.
     */
    toJSON: function() {
      return esriLang.fixJson({
        name: this.name,
        type: this.type
      });
    }
  });
  
  return Domain;  
});
