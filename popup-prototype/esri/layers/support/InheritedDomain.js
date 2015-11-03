/**
 * This is a subclass of {@link module:esri/layers/support/Domain}. 
 * It does not add any new properties or methods. 
 * 
 * @module esri/layers/support/InheritedDomain
 * @noconstructor
 * @since 4.0
 * @see [Domain Objects - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Domain_Objects/02r30000019r000000/)
 * @see module:esri/layers/support/CodedValueDomain
 * @see module:esri/layers/support/RangeDomain
 */
define(
[
  "../../core/declare",
  
  "./Domain"
],
function(declare, Domain) {

  /**
  * @extends module:esri/layers/support/Domain
  * @constructor module:esri/layers/support/InheritedDomain
  */
  var InheritedDomain = declare([ Domain ], 
  /** @lends module:esri/layers/support/InheritedDomain.prototype */                              
  {
    declaredClass: "esri.layers.support.InheritedDomain"
  });
  
  return InheritedDomain;  
});
