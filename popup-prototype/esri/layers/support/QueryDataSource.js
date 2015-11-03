/**
 * Defines and provides information about a layer or table that is defined by a SQL query. 
 * The geometry storage format determines the capabilities of the QueryDataSource. If the 
 * data source stores the geometry in the database's native format the return value is a 
 * layer that supports all operations supported by a dynamic layer. If the data source 
 * stores geometry in a non-native format the result is a table that can be used to perform 
 * query operations. 
 * 
 * @module esri/layers/support/QueryDataSource
 * @since 4.0
 * @see module:esri/layers/support/TableDataSource
 * @see module:esri/layers/support/JoinDataSource
 * @see module:esri/layers/support/RasterDataSource       
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../core/lang",
  "../../geometry/SpatialReference",
  
  "./DataSource"
],
function(
  declare, lang,
  esriLang, SpatialReference,
  DataSource
) {

  /**
  * @extends module:esri/layers/support/DataSource
  * @constructor module:esri/layers/support/QueryDataSource
  * @param {Object} json - Creates a new QueryDataSource object from a JSON object
  *                      in the format of the ArcGIS platform.
  */      
  var QueryDataSource = declare(DataSource, 
  /** @lends module:esri/layers/support/QueryDataSource.prototype */                              
  {
    declaredClass: "esri.layers.support.QueryDataSource",
    
    constructor: function(json){
      if (json) {
        if (json.oidFields && lang.isString(json.oidFields)) {
          this.oidFields = json.oidFields.split(",");          
        }
        if (json.spatialReference) {
          this.spatialReference = new SpatialReference(json.spatialReference);
        }
      }
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
     * Converts an instance of this class to a JSON object in the format of the ArcGIS platform. 
     * 
     * @return {Object} A JSON object representing an instance of this class.
     */  
    toJSON: function() {
      /** @alias module:esri/layers/support/QueryDataSource */       
      var json = {
          
        /**
        * The type of data source. For QueryDataSource this value is always `queryTable`.
        * 
        * @type {string}
        * @instance                
        */  
        type: "queryTable",
          
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
        * The SQL query string that defines the data source output.
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * queryDataSource.query = "SELECT * FROM sde.sde.states_geom";
        */   
        query: this.query,
          
        /**
        * An array of field names that define a unique identifier for the feature. 
        * The combiniation of one or more fields will be used to generate a unique 
        * identifier for the feature.
        * 
        * @type {string[]}
        * @instance
        * 
        * @example
        * queryDataSource.oidFields = ["TaxLotId"];
        */  
        oidFields: this.oidFields && this.oidFields.join(),
          
        /**
        * The spatial reference for the data source. Required if the specified 
        * data source has a geometry column.
        * 
        * @type {module:esri/geometry/SpatialReference}
        * @instance
        */  
        spatialReference: this.spatialReference && this.spatialReference.toJSON()
      };
      if (this.geometryType) {
        var geometryType;
        if (this.geometryType.toLowerCase() === "point") {
          geometryType = "esriGeometryPoint";
        }
        else if (this.geometryType.toLowerCase() === "multipoint") {
          geometryType = "esriGeometryMultipoint";
        }
        else if (this.geometryType.toLowerCase() === "polyline") {
          geometryType = "esriGeometryPolyline";
        }
        else if (this.geometryType.toLowerCase() === "polygon") {
          geometryType = "esriGeometryPolygon";
        }
        else {
          geometryType = this.geometryType;
        }
        
        /**
        * The geometry type of the data source. Required if the specified data source has a geometry column.
        * 
        * **Known Values:** point | multipoint | line | polygon
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * queryDataSource.geometryType = "polygon";
        */  
        json.geometryType = geometryType;
      }
      return esriLang.fixJson(json);
    }
  });
  
  return QueryDataSource;  
});
