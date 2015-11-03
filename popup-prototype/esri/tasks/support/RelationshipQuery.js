/**
 * Define query parameters for the feature layer's `queryRelatedFeatures()` method.
 *
 * @module esri/tasks/support/RelationshipQuery
 * @since 4.0
 */
define(
[
  "../../core/declare",

  "../../core/Accessor"
],
function(
  declare, Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/RelationshipQuery
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var RelationshipQuery = declare(Accessor,
  /** @lends module:esri/tasks/support/RelationshipQuery.prototype */
  {

    declaredClass: "esri.tasks.RelationshipQuery",
    
    /**
    * The definition expression to be applied to the related table or layer. Only records that fit the definition expression 
    * and are in the list of `objectIds` will be returned.
    * @type {string}
    */
    definitionExpression: "",
      
    /**
    * Specify the number of decimal places for the geometries returned by the query operation.
    * @type {number}
    */  
    geometryPrecision: null,  
      
    /**
    * The maximum allowable offset used for generalizing geometries returned by the query operation. The offset is in the units 
    * of the `outSpatialReference`. If `outSpatialReference` is not defined, the spatial reference of the map is used.
    * @type {number}
    */  
    maxAllowableOffset: null,  

    /**
    * A comma delimited list of `ObjectIds` for the features in the layer/table that you want to query.
    * @type {number[]}
    */  
    objectIds: null,

    /**
    * Attribute fields to include in the {@link module:esri/tasks/support/FeatureSet FeatureSet}. Fields must exist in the map layer. 
    * You must list the actual field names rather than the alias names. Returned fields are also the actual field names. However, you 
    * are able to use the alias names when you display the results. You can set field alias names in the map document. 
    * 
    * When you specify the output fields, you should limit the fields to only those you expect to use in the query or the results. The 
    * fewer fields you include, the faster the response will be. 
    * 
    * Each query must have access to the Shape and ObjectId fields for a layer, but your list of fields does not need to include these two fields.
    * @type {string[]}
    */  
    outFields: null,

    /**
    * The spatial reference for the returned geometry. If not specified, 
    * the geometry is returned in the spatial reference of the map. 
    * 
    * @type {module:esri/geometry/SpatialReference}
    */  
    outSpatialReference: null,

    /**
    * The ID of the relationship to test. The ids for the relationships the table or layer participates in are listed in the 
    * ArcGIS Services directory.
    * @type {number}
    */  
    relationshipId: null,

    /**
    * If `true`, each feature in the {@link module:esri/tasks/support/FeatureSet FeatureSet} includes the geometry. Set to `false` (default)
    * if you do not plan to include highlighted features on a map since the geometry makes up a significant portion of the response.
    * @type {boolean}
    */  
    returnGeometry: false,

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
      var json = { definitionExpression:this.definitionExpression, relationshipId:this.relationshipId, returnGeometry:this.returnGeometry, maxAllowableOffset: this.maxAllowableOffset, geometryPrecision: this.geometryPrecision },
          objectIds = this.objectIds,
          outFields = this.outFields,
          outSR = this.outSpatialReference;

      if (objectIds) {
        json.objectIds = objectIds.join(",");
      }
      
      if (outFields) {
        json.outFields = outFields.join(",");
      }

      if (outSR) {
        json.outSR = outSR.wkid || JSON.stringify(outSR.toJSON());
      }
      
      // NOTE
      // Used by feature layer to set a timestamp under
      // certain conditions. See FeatureLayer.js for details
      json._ts = this._ts;

      return json;
    }

  });
  
  return RelationshipQuery;
});
