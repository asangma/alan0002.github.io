/**
 * Information about the range of values belonging to the domain. 
 * Range domains specify a valid range of values for a numeric attribute.
 * 
 * @module esri/layers/support/RangeDomain
 * @noconstructor
 * @since 4.0
 * @see [Domain Objects - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Domain_Objects/02r30000019r000000/)
 * @see module:esri/layers/support/Field
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../core/lang",
  
  "./Domain"
],
function(
  declare, lang,
  esriLang,
  Domain
) {

  /**
  * @extends module:esri/layers/support/Domain
  * @constructor module:esri/layers/support/RangeDomain
  */      
  var RangeDomain = declare([ Domain ], 
  /** @lends module:esri/layers/support/RangeDomain.prototype */                          
  {
    declaredClass: "esri.layers.support.RangeDomain",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.minValue = json.range[0];
        this.maxValue = json.range[1];
      }
    },
    
    /**
    * The maximum valid value.
    * 
    * @name maxValue
    * @instance
    * @type {number}
    */
      
    /**
    * The minimum valid value.
    * 
    * @name minValue
    * @instance
    * @type {number}
    */  
      
    /**
     * The domain type. This value is always `range`.
     * 
     * @name type
     * @instance
     * @type {string}
     */  

    toJSON: function() {
      var json = this.inherited(arguments);
      json.range = [ this.minValue, this.maxValue ];
      return esriLang.fixJson(json);
    }
  });
  
  return RangeDomain;  
});
