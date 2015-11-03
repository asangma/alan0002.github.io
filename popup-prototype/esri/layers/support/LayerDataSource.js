/**
 * Defines and provides information about a layer created on the fly from a data source.
 * 
 * @module esri/layers/support/LayerDataSource
 * @since 4.0
 * @see module:esri/layers/support/LayerMapSource     
 */
define(
[
  "../../core/declare",
  
  "../../core/lang",
  
  "./LayerSource",
  "./TableDataSource",
  "./QueryDataSource",
  "./JoinDataSource",
  "./RasterDataSource"
],
function(
  declare, esriLang, 
  LayerSource, TableDataSource, QueryDataSource, JoinDataSource, RasterDataSource
) {

  /**
   * @extends module:esri/layers/support/LayerSource
   * @constructor module:esri/layers/support/LayerDataSource
   * @param {Object} json - Creates a new LayerMapSource object from a JSON object
   *                      in the format of the ArcGIS platform.
   */      
  var LayerDataSource = declare(LayerSource, 
  /** @lends module:esri/layers/support/LayerDataSource.prototype */                              
  {
    declaredClass: "esri.layers.support.LayerDataSource",
    
    /**
    * Used to describe the origin of the LayerSource. For LayerDataSource, this value 
    * is always `dataLayer`.
    * 
    * @type {string}
    */   
    type: "dataLayer",
      
    constructor: function(json){
      if (json && json.dataSource) {
        var dataSource;
        switch (json.dataSource.type) {
          case "table":
            dataSource = new TableDataSource(json.dataSource);
            break;
          case "queryTable":
            dataSource = new QueryDataSource(json.dataSource);
            break;
          case "joinTable":
            dataSource = new JoinDataSource(json.dataSource);
            break;
          case "raster":
            dataSource = new RasterDataSource(json.dataSource);
            break;
          default:
            dataSource = json.dataSource;
        }
        this.dataSource = dataSource;
      }
    },

    toJSON: function() {
      /** @alias module:esri/layers/support/LayerDataSource */    
      var json = {
        type: "dataLayer", 
          
        /**
        * The data source used to create a dynamic data layer on the fly. The data source can be one of the following:
        * 
        * @type {module:esri/layers/support/DataSource}
        * @instance                
        */  
        dataSource: this.dataSource && this.dataSource.toJSON()
      };
      return esriLang.fixJson(json);
    }
  });
  
  return LayerDataSource;  
});
