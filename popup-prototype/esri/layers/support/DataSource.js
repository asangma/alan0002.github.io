/**
 * Used to denote classes that may be used as a data source.
 * 
 * @module esri/layers/support/DataSource
 * @since 4.0
 * @see {@link module:esri/layers/support/LayerDataSource#dataSource LayerDataSource.dataSource}      
 * @see module:esri/layers/support/TableDataSource
 * @see module:esri/layers/support/QueryDataSource
 * @see module:esri/layers/support/JoinDataSource
 * @see module:esri/layers/support/RasterDataSource       
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang"
],
function(declare, lang) {

  /**
  * @constructor module:esri/layers/support/DataSource
  * @param {Object} json - Creates a new DataSource object from a JSON object
  *                      in the format of the ArcGIS platform.
  */    
  var DataSource = declare(null, 
  /** @lends module:esri/layers/support/DataSource.prototype */                         
  {
    declaredClass: "esri.layers.support.DataSource",
    
    constructor: function(json) {
      if (json) {
        lang.mixin(this, json);
      }             
    }
	
  });
  
  return DataSource;  
});
