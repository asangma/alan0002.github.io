/**
 * Input for properties of ClosestFacilityParameters,RouteParameters or ServiceAreaParameters. 
 * The DataLayer can be used to define the following for each paramater type:
 * 
 * * {@link module:esri/tasks/support/ClosestFacilityParameters}: define facilities, incidents and barriers.
 * * {@link module:esri/tasks/support/RouteParameters}: define barriers and stops.
 * * {@link module:esri/tasks/support/ServiceAreaParameters}: define facilities and barriers.
 * 
 * @module esri/tasks/support/DataLayer
 * @since 4.0
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/Accessor",
  "../../core/lang",

  "../../geometry/support/jsonUtils",

  "./SpatialRelationship"
],
function(
  declare, lang,
  Accessor, esriLang,
  jsonUtils,
  SpatialRelationship
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/DataLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */      
  var DataLayer = declare(Accessor, 
  /** @lends module:esri/tasks/support/DataLayer.prototype */                          
  {

      declaredClass: "esri.tasks.DataLayer",
    
      /**
      * The geometry to apply to the spatial filter. The spatial relationship as specified by 
      * [spatialRelationship](#spatialRelationship) is applied to this geometry while performing the query.
      * 
      * @type {module:esri/geometry/Geometry}
      * @example
      * var stops = new DataLayer();
      * stops.geometry = view.extent;
      */
      geometry: null,

      /**
      * The name of the data layer in the map service that is being referenced.
      * 
      * @type {string}
      * @example
      * var stops = new DataLayer();
      * stops.name = "Hospitals";
      */
      name: null,

      /**
      * The spatial relationship to be applied on the input geometry while 
      * performing the query.
      * 
      * Possible Value | Description
      * ---------------|------------
      * esriSpatialRelIntersects | Part of a feature from feature class 1 is contained in a feature from feature class 2.
      * esriSpatialRelContains | Part or all of a feature from feature class 1 is contained within a feature from feature class 2.
      * esriSpatialRelCrosses | The feature from feature class 1 crosses a feature from feature class 2.
      * esriSpatialRelEnvelopeIntersects | The envelope of feature class 1 intersects with the envelope of feature class 2.
      * esriSpatialRelIndexIntersects | The envelope of the query feature class intersects the index entry for the target feature class.
      * esriSpatialRelOverlaps | Features from feature class 1 overlap features in feature class 2.
      * esriSpatialRelTouches | The feature from feature class 1 touches the border of a feature from feature class 2.
      * esriSpatialRelWithin | The feature from feature class 1 is completely enclosed by the feature from feature class 2.
      * esriSpatialRelRelation | Allows specification of any relationship defined using the [Shape Comparison Language](http://resources.esri.com/help/9.3/arcgisengine/dotnet/concepts_start.htm#40de6491-9b2d-440d-848b-2609efcd46b1.htm).
      * 
      * @type {string}
      * @example
      * var stops = new DataLayer();
      * stops.spatialRelationship = "esriSpatialRelContains";
      */
      spatialRelationship: null,

      /**
      * A where clause for the query. Any legal SQL where clause operating on the 
      * fields in the layer is allowed.
      * 
      * @type {string}
      * @example
      * var stops = new DataLayer();
      * stops.where = "POP2000 > 350000";
      */
      where: null,

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
        var json = {
          type: "layer",
          layerName: this.name,
          where: this.where,
          spatialRel: this.spatialRelationship
        };
        
        var g = this.geometry;
        if (g) {
          json.geometryType = jsonUtils.getJsonType(g);
          json.geometry = g.toJSON();
        }
        
        return esriLang.filter(json, function(value) {
          if (value !== null) {
            return true;
          }
        });
      }
    }

  );
  
  lang.mixin(DataLayer, SpatialRelationship);

  return DataLayer;
});
