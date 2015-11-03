/**
 * SpatialRelationship
 *
 * @module esri/tasks/support/SpatialRelationship
 * @since 4.0
 * @mixin
 */
define([], function() {

  /** @alias module:esri/tasks/support/SpatialRelationship */
  var SpatialRelationship = {
    /**
     * Part of a feature from feature class 1 is contained in a feature from feature class 2.
     */
    SPATIAL_REL_INTERSECTS: "esriSpatialRelIntersects",
    /**
     * Part or all of a feature from feature class 1 is contained within a feature from feature class 2.
     */
    SPATIAL_REL_CONTAINS: "esriSpatialRelContains",
    /**
     * The feature from feature class 1 crosses a feature from feature class 2.
     */
    SPATIAL_REL_CROSSES: "esriSpatialRelCrosses",
    /**
     * The envelope of feature class 1 intersects with the envelope of feature class 2.
     */
    SPATIAL_REL_ENVELOPEINTERSECTS: "esriSpatialRelEnvelopeIntersects",
    /**
     * The envelope of the query feature class intersects the index entry for the target feature class.
     */
    SPATIAL_REL_INDEXINTERSECTS: "esriSpatialRelIndexIntersects",
    /**
     * Features from feature class 1 overlap features in feature class 2.
     */
    SPATIAL_REL_OVERLAPS: "esriSpatialRelOverlaps",
    /**
     * The feature from feature class 1 touches the border of a feature from feature class 2.
     */
    SPATIAL_REL_TOUCHES: "esriSpatialRelTouches",
    /**
     * The feature from feature class 1 is completely enclosed by the feature from feature class 2.
     */
    SPATIAL_REL_WITHIN: "esriSpatialRelWithin",
    /**
     * Allows specification of any relationship defined using the [Shape Comparison Language](http://resources.esri.com/help/9.3/arcgisengine/dotnet/concepts_start.htm#40de6491-9b2d-440d-848b-2609efcd46b1.htm).
     */
    SPATIAL_REL_RELATION: "esriSpatialRelRelation"
  };

  return SpatialRelationship;
});
