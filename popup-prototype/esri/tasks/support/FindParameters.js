/**
 * Input parameters for {@link module:esri/tasks/FindTask}.
 * 
 * @since 4.0
 * @module esri/tasks/support/FindParameters
 * @see module:esri/tasks/FindTask
 * @see module:esri/tasks/support/FindResult
 */
define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../core/Accessor",

  "../../layers/support/layerUtils"
],
function(
  declare, array, Accessor,
  layerUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/FindParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var FindParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/FindParameters.prototype */
  {

    declaredClass: "esri.tasks.FindParameters",

    /**
    * Determines whether to look for an exact match of the search text or not. If `true`, searches for a value that contains 
    * the provided [searchText](#searchText). This is a case-insensitive search. If `false`, searches for an exact match of the [searchText](#searchText)
    * string. The exact match is case-sensitive.
    * 
    * @type {boolean}
    * @default
    */
    contains: true,

    /**
    * An array of {@link module:esri/layers/support/DynamicLayerInfo DynamicLayerInfos} used to change the layer ordering or 
    * redefine the map. When set, the find operation will perform the find against the dynamic layers.
    * 
    * @type {module:esri/layers/support/DynamicLayerInfo[]}
    */
    dynamicLayerInfos: null,

    /**
    * Array of layer definition expressions that allows you to filter the features of individual layers. Layer definitions 
    * with semicolons or colons are supported if using a map service published using ArcGIS Server 10.
    * 
    * @type {string[]}
    * @example
    * findParams.layerDefinitions[2] = "POP1999 > 75000";
    * @example
    * //The following syntax is supported when using a map service published with ArcGIS Server 10.
    * findParams.layerDefinitions[0] = "REQ_TIME like '07:%'";
    */  
    layerDefinitions: null,

    /**
    * The layers to perform the find operation on. The layers are specified as a comma-separated list of layer ids. 
    * The list of ids is returned in {@link module:esri/layers/ArcGISDynamicLayer} layerInfos.
    * 
    * @type {number[]}
    * @example
    * findParams.layerIds = [0];
    */
    layerIds: null,

    /**
    * Specify the number of decimal places for the geometries returned by the task.
    * @type {number} 
    */
    geometryPrecision: null,
    
    /**
    * The maximum allowable offset used for generalizing geometries returned by the find operation. The offset is 
    * in the units of [outSpatialReference](#outSpatialReference). If [outSpatialReference](#outSpatialReference) 
    * is not defined, the spatial reference of the map is used.
    * 
    * @type {number}
    */  
    maxAllowableOffset: null,

    /**
    * The spatial reference of the output geometries. If this is not specified, the output geometries are returned 
    * in the spatial reference of the map.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */
    outSpatialReference: null,

    /**
    * If `true`, the output will include the geometry associated with each result.
    * 
    * @type {boolean}
    * @default false
    */ 
    returnGeometry: false,

    /**
    * The names of the fields of a layer to search. The fields are specified as a comma-separated list of field names. 
    * If this parameter is not specified, all fields are searched by default.
    * 
    * @type {string[]}
    */   
    searchFields: null,

    /**
    * The text that is searched across the layers and the fields as specified in the `layers` and 
    * [searchFields](#searchFields) properties.
    * 
    * @type {string}
    */  
    searchText: null,

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      var json = { searchText:this.searchText, contains:this.contains, returnGeometry:this.returnGeometry, maxAllowableOffset: this.maxAllowableOffset, geometryPrecision: this.geometryPrecision },
          layerIds = this.layerIds,
          searchFields = this.searchFields,
          outSR = this.outSpatialReference;
          
      if (layerIds) {
        json.layers = layerIds.join(",");
      }

      if (searchFields) {
        json.searchFields = searchFields.join(",");
      }

      if (outSR) {
        json.sr = outSR.wkid || JSON.stringify(outSR.toJSON());
      }
      
      json.layerDefs = layerUtils._serializeLayerDefinitions(this.layerDefinitions);
      
      if (this.dynamicLayerInfos && this.dynamicLayerInfos.length > 0) {
        var result,
          dynLayerObjs = [];

        array.forEach(this.dynamicLayerInfos, function(info) {
          if (!info.subLayerIds) {// skip group layers
            var layerId = info.id;
            // layerIds is required for REST service of Find operation.
            if (this.layerIds && array.indexOf(this.layerIds, layerId) !== -1) {
              var dynLayerObj = {
                id: layerId
              };
              dynLayerObj.source = info.source && info.source.toJSON();
              
              var definitionExpression;
              if (this.layerDefinitions && this.layerDefinitions[layerId]) {
                definitionExpression = this.layerDefinitions[layerId];
              }
              if (definitionExpression) {
                dynLayerObj.definitionExpression = definitionExpression;
              }
              dynLayerObjs.push(dynLayerObj);
            }
          }
        }, this);

        result = JSON.stringify(dynLayerObjs);
        //Server side bug which draw the existing layers when dynamicLayers is "[]". By changing it to "[{}]", it draws
        //an empty map.
        if (result === "[]") {
          result = "[{}]";
        }      
        json.dynamicLayers = result;
      }

      return json;
    }

  });

  return FindParameters;
});
