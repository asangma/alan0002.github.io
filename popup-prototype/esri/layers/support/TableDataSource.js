/**
 * Defines and provides information about a table, feature class, or raster that resides in a 
 * registered file geodatabase, SDE or Shapefile workspace. *Requires ArcGIS Server 10.1 or greater.* 
 * 
 * @module esri/layers/support/TableDataSource
 * @since 4.0
 * @see module:esri/layers/support/QueryDataSource
 * @see module:esri/layers/support/JoinDataSource
 * @see module:esri/layers/support/RasterDataSource       
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
  * @constructor module:esri/layers/support/TableDataSource
  * @param {Object} json - Creates a new TableDataSource object from a JSON object
  *                      in the format of the ArcGIS platform.
  */    
  var TableDataSource = declare(DataSource, 
  /** @lends module:esri/layers/support/TableDataSource.prototype */                               
  {
    declaredClass: "esri.layers.support.TableDataSource",

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
      /** @alias module:esri/layers/support/TableDataSource */
      var json = {
          
        /**
        * The type of data source. For TableDataSource this value is always `table`.
        * 
        * @type {string}
        * @instance                
        */                
        type: "table",
          
        /**
        * The workspace ID for the registered file geodatabase, SDE or Shapefile workspace.
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * tableDataSource.workspaceId = "d203";
        */   
        workspaceId: this.workspaceId,
          
        /**
        * The name of a table, feature class or raster that resides in the registered workspace.
        * 
        * @type {string}
        * @instance   
        * 
        * @example
        * tableDataSource.dataSourceName = "sde.SDE.states";
        */  
        dataSourceName: this.dataSourceName,
          
        /**
        * For versioned SDE workspaces, use this property to point to an alternate version. If a 
        * gdbVersion is not provided then the version specified when the SDE workspace was registered will be used.
        * 
        * @type {string}
        * @instance
        */   
        gdbVersion: this.gdbVersion
      };
      return esriLang.fixJson(json);
    }
  });
  
  return TableDataSource;  
});
