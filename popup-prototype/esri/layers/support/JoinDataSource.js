/**
 * Defines and provides information about the result of a join operation. 
 * Nested joins are supported and are created by specifying either the 
 * [leftTableSource](#leftTableSource) or [rightTableSource](#rightTableSource) 
 * to be the joined table. 
 * 
 * The output type is determined by the [leftTableSource](#leftTableSource). 
 * If the [leftTableSource](#leftTableSource) is a table then the resulting join 
 * table is a table. If the [leftTableSource](#leftTableSource) is a layer then the 
 * join result will be a layer. 
 * 
 * For best performance, the left and right table sources should point to the 
 * same workspace and the table keys should be indexed. 
 * 
 * @module esri/layers/support/JoinDataSource
 * @since 4.0
 * @see module:esri/layers/support/TableDataSource
 * @see module:esri/layers/support/QueryDataSource
 * @see module:esri/layers/support/RasterDataSource       
 */
define(
[
  "../../core/declare",
  
  "../../core/lang",
  
  "./DataSource",
  "./LayerMapSource",
  "./TableDataSource",
  "./QueryDataSource",
  "./RasterDataSource"
],
function(
  declare,
  esriLang,
  DataSource, LayerMapSource, TableDataSource, QueryDataSource, RasterDataSource
) {

  /**
  * @extends module:esri/layers/support/DataSource
  * @constructor module:esri/layers/support/JoinDataSource
  * @param {Object} json - Creates a new JoinDataSource object from a JSON object
  *                      in the format of the ArcGIS platform.
  */      
  var JoinDataSource = declare(DataSource, 
  /** @lends module:esri/layers/support/JoinDataSource.prototype */                             
  {
    declaredClass: "esri.layers.support.JoinDataSource",
    
    constructor: function(json){
      if (json) {
        if (json.leftTableSource) {
          this.leftTableSource = this._createLayerSource(json.leftTableSource);
        }
        
        if (json.rightTableSource) {
          this.rightTableSource = this._createLayerSource(json.rightTableSource);
        }         
      }
    },
    
    _createLayerSource: function(source){
      var layerSource;
      if (source.type === "mapLayer") {
        layerSource = new LayerMapSource(source);
      }
      else {
        layerSource = {type: "dataLayer"};
        var dataSource;
        switch (source.dataSource.type) {
          case "table":
            dataSource = new TableDataSource(source.dataSource);
            break;
          case "queryTable":
            dataSource = new QueryDataSource(source.dataSource);
            break;
          case "joinTable":
            dataSource = new JoinDataSource(source.dataSource);
            break;
          case "raster":
            dataSource = new RasterDataSource(source.dataSource);
            break;
          default:
            dataSource = source.dataSource;
        }
        layerSource.dataSource = dataSource;
        layerSource.toJSON = function () {
          var json = {type: "dataLayer", dataSource: dataSource.toJSON()};
          return esriLang.fixJson(json);
        };
      }
      return layerSource;
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
      /** @alias module:esri/layers/support/JoinDataSource */  
      var json = {
          
        /**
        * The type of data source. For JoinDataSource this value is always `joinTable`.
        * 
        * @type {string}
        * @instance                
        */  
        type: "joinTable",
          
        /**
        * The data source to be used as the left table for the join operation. Determines the 
        * output join table type. If the `leftTableSource` is a table then the output is a table. 
        * If the `leftDataSource` is a layer then the resulting join table is a layer.
        * 
        * @type {module:esri/layers/support/LayerSource}
        * @instance
        * 
        * @example
        * var dataSource = new JoinDataSource();
        * 
        * var leftTableSource = new LayerDataSource();
        * leftTableSource.dataSource = new TableDataSource({
        *   workspaceId: "d203_db",
        *   dataSourceName: "sde.sde.states"
        * });
        * 
        * dataSource.leftTableSource = leftTableSource;
        */   
        leftTableSource: this.leftTableSource && this.leftTableSource.toJSON(),
          
        /**
        * The data source to be used as the right table for the join operation.
        * 
        * @type {module:esri/layers/support/LayerSource}
        * @instance
        * 
        * @example
        * var dataSource = new JoinDataSource();
        * 
        * var rightTableSource = new LayerDataSource();
        * rightTableSource.dataSource = new TableDataSource({
        *   workspaceId: "d203_db",
        *   dataSourceName: "sde.sde.statecapitals"
        * });
        * 
        * dataSource.rightTableSource = rightTableSource;
        */  
        rightTableSource: this.rightTableSource && this.rightTableSource.toJSON(),
          
        /**
        * The key field used for the left table source for the join.
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * joinDataSource.leftTableKey = "sde.sde.states.state_name";
        */  
        leftTableKey: this.leftTableKey,
          
        /**
        * The key field used for the right table source for the join.
        * 
        * @type {string}
        * @instance
        * 
        * @example
        * joinDataSource.rightTableKey = "sde.sde.statecapitals.state_name";
        */  
        rightTableKey: this.rightTableKey
      };
      var joinType;
      if (this.joinType.toLowerCase() === "left-outer-join") {
        joinType = "esriLeftOuterJoin";
      }
      else if (this.joinType.toLowerCase() === "left-inner-join") {
        joinType = "esriLeftInnerJoin";
      }
      else {
        joinType = this.joinType;
      }
        
      /**
      * The type of join that will be performed.
      * 
      * **Known Values:** left-outer | left-inner
      * 
      * @type {string}
      * @instance
      * 
      * @example 
      * joinDataSource.joinType = "left-inner";
      */    
      json.joinType = joinType;
      return esriLang.fixJson(json);
    }
  });
  
  return JoinDataSource;  
});
