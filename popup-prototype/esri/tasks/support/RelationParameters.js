/**
 * Sets the relation and other parameters for the {@link module:esri/tasks/GeometryService#relation GeometryService.relation()} operation.
 *
 * @module esri/tasks/support/RelationParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#relation GeometryService.relation()}
 * @see [ArcGIS REST API - Relation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Relation/02r3000000wz000000/)
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "../../core/Accessor",

  "../../geometry/support/jsonUtils"
],
function(
  declare, lang, array, Accessor,
  jsonUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/RelationParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var RelationParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/RelationParameters.prototype */
  {

    declaredClass: "esri.tasks.RelationParameters",

    /**
    * The first array of geometries to compute the relation. The structure of each geometry in the array is same as the structure 
    * of the json geometry objects returned by the ArcGIS REST API.
    * @type {module:esri/geometry/Geometry[]}
    */
    geometries1: null,  // esri.geometry.Geometry[]

    /**
    * The second array of geometries to compute the relation. The structure of each geometry in the array is same as the structure 
    * of the json geometry objects returned by the ArcGIS REST API.
    * @type {module:esri/geometry/Geometry[]}
    */  
    geometries2: null,  // esri.geometry.Geometry[]

    /**
    * The spatial relationship to be tested between the two input geometry arrays. See table below for a list of possible values.
    * If the relation is specified as `esriGeometryRelationRelation`, the `relationParam` parameter describes the spatial 
    * relationship and must be specified.
    * 
    * Value | Description
    * ------|------------
    * esriGeometryRelationCross | Two polylines cross if they share only points in common, at least one of which is not an endpoint. A polyline and an polygon cross if they share a polyline in common on the interior of the polygon which is not equivalent to the entire polyline. Cross is a Clementini operator. If either one of the geometries is empty, the geometries do not cross.
    * esriGeometryRelationDisjoint | Two geometries are disjoint if their intersection is empty. Two geometries intersect if disjoint is "false".
    * esriGeometryRelationIn | The base geometry is within the comparison geometry if the base geometry is the intersection of the geometries and the intersection of their interiors is not empty. An empty geometry is within another geometry, unless the other geometry is empty.
    * esriGeometryRelationInteriorIntersection | Geometries intersect excluding boundary touch.
    * esriGeometryRelationIntersection | Geometry interiors intersect or boundaries touch, same as 'not disjoint'.
    * esriGeometryRelationLineCoincidence | The boundaries of the geometries must share an intersection, but the relationship between the interiors of the shapes is not considered (they could overlap, one could be contained in the other, or their interiors could be disjoint). This relation applies to polylines and polygons.
    * esriGeometryRelationLineTouch | Two geometries are said to touch when the intersection of the geometries is non-empty, but the intersection of their interiors is empty. This evaluates if the touch occurs along a boundary (not a point). Valid for polygons.
    * esriGeometryRelationOverlap | Two polylines share a common sub-line, or two polygons share a common sub-area. Two geometries do not overlap if either one is empty.
    * esriGeometryRelationPointTouch | Two geometries are said to touch when the intersection of the geometries is non-empty, but the intersection of their interiors is empty. This evaluates if the touch occurs at a point (not a boundary).
    * esriGeometryRelationTouch | The union of point touch and line touch. Two geometries are said to touch when the intersection of the geometries is non-empty, but the intersection of their interiors is empty. For example, a point touches a polyline only if the point is coincident with one of the polyline end points. If either one of the two geometries is empty, the geometries are not touched.
    * esriGeometryRelationWithin | Same as `esriGeometryRelationIn` but also allows polylines that are strictly on the boundaries of polygons to be considered in the polygon.
    * esriGeometryRelationRelation | Allows specification of any relationship defined using the Shape Comparison Language. If this value is used, a value for `relationParam` must be specified.
    * 
    * @type {string}
    */  
    relation: null,

    /**
    * The string describes the spatial relationship to be tested when `RelationParameters.relation = 'esriGeometryRelationRelation'`. 
    * The [Shape Comparison Language EDN](http://resources.arcgis.com/en/help/main/10.2/index.html#/Spatial_relationship_functions/006z0000001z000000/) topic has additional details.
    * An example of a valid string is: `FFFTTT**`. 
    * Also see the description of {@link module:esri/geometry/geometryEngine.relate geometryEngine.relate()} for 
    * additional examples of valid strings.
    * @type {string}
    */  
    relationParam: null,

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
      var geoms1 = array.map(this.geometries1, function(geom){
        return geom.toJSON();
      });
      
      var geoms2 = array.map(this.geometries2, function(geom){
        return geom.toJSON();
      });

      var json = {};
          
          var geometries1 = this.geometries1;
          if (geometries1 && geometries1.length > 0) {
              json.geometries1 = JSON.stringify({ geometryType:jsonUtils.getJsonType(geometries1[0]), geometries:geoms1 });
              var outSr = this.geometries1[0].spatialReference;
              json.sr = outSr.wkid ? outSr.wkid : JSON.stringify(outSr.toJSON());
          }
          
          var geometries2 = this.geometries2;
          if (geometries2 && geometries2.length > 0) {
              json.geometries2 = JSON.stringify({ geometryType:jsonUtils.getJsonType(geometries2[0]), geometries:geoms2 });
          }
                                                                  
          if (this.relation) {
              json.relation = this.relation;
          }
          
          if (this.relationParam) {
              json.relationParam = this.relationParam;
          }
      return json;
    }

  });

  lang.mixin(RelationParameters, {
    SPATIAL_REL_CROSS: "esriGeometryRelationCross", 
    SPATIAL_REL_DISJOINT: "esriGeometryRelationDisjoint", 
    SPATIAL_REL_IN: "esriGeometryRelationIn",
    SPATIAL_REL_INTERIORINTERSECTION: "esriGeometryRelationInteriorIntersection", 
    SPATIAL_REL_INTERSECTION: "esriGeometryRelationIntersection", 
    SPATIAL_REL_COINCIDENCE: "esriGeometryRelationLineCoincidence", 
    SPATIAL_REL_LINETOUCH: "esriGeometryRelationLineTouch", 
    SPATIAL_REL_OVERLAP: "esriGeometryRelationOverlap", 
    SPATIAL_REL_POINTTOUCH: "esriGeometryRelationPointTouch",
    SPATIAL_REL_TOUCH: "esriGeometryRelationTouch", 
    SPATIAL_REL_WITHIN: "esriGeometryRelationWithin", 
    SPATIAL_REL_RELATION: "esriGeometryRelationRelation"
  });
  
  return RelationParameters;
});
