/**
 * The RasterDataSource class defines and provides information about a file-based raster that resides in a registered raster workspace. Requires ArcGIS Server 10.1 or greater 
 * 
 * @module esri/layers/support/RasterDataSource
 * @since 4.0
 * @see module:esri/layers/support/TableDataSource
 * @see module:esri/layers/support/QueryDataSource
 * @see module:esri/layers/support/JoinDataSource       
 */
define(
[
  "../../core/declare",
  
  "../../core/lang",
  
  "./DataSource"
],
function(declare, esriLang, DataSource) {

  /**
  * @extends module:esri/layers/support/DataSource
  * @constructor module:esri/layers/support/RasterDataSource
  * @param {Object} json - Creates a new RasterDataSource object from a JSON object
  *                      in the format of the ArcGIS platform.
  */    
  var RasterDataSource = declare(DataSource, 
  /** @lends module:esri/layers/support/RasterDataSource.prototype */                                
  {
    declaredClass: "esri.layers.support.RasterDataSource",

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
    * Converts an instance of this class to a JSON object in the format of the ArcGIS platform. 
    * 
    * @return {Object} A JSON object representing an instance of this class.
    */  
    toJSON: function() {
      /** @alias module:esri/layers/support/RasterDataSource */    
      var json = {
          
        /**
        * The type of data source. For RasterDataSource this value is always `raster`.
        * 
        * @type {string}
        * @instance                
        */  
        type: "raster",
          
        /**
        * The workspace ID for the registered file geodatabase, SDE or Shapefile workspace.
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * queryDataSource.workspaceId = "d203";
        */  
        workspaceId: this.workspaceId,
          
        /**
        * The name of a raster that resides in the registered workspace.
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * rasterDataSource.dataSourceName = "sde.SDE.usacatalog"
        */  
        dataSourceName: this.dataSourceName
      };
      return esriLang.fixJson(json);
    }
  });
  
  return RasterDataSource;  
});
