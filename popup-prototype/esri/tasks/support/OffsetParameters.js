/**
 * Sets the offset distance, type and other parameters for the {@link module:esri/tasks/GeometryService#offset GeometryService.offset} operation.
 *
 * @module esri/tasks/support/OffsetParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#offset GeometryService.offset()}
 * @see [ArcGIS REST API - Offset](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Offset/02r3000000v6000000/)
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
   * @constructor module:esri/tasks/support/OffsetParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var OffsetParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/OffsetParameters.prototype */
  {

    declaredClass: "esri.tasks.OffsetParameters",

    /**
    * The `bevelRatio` is multiplied by the offset distance and the result determines how far a mitered offset intersection can be located 
    * before it is beveled. When mitered is specified, the value set for `bevelRatio` is ignored and `10` is used internally. If beveled is
    * specified, `1.1` will be used if no value is set for bevelRatio. The bevelRatio is ignored when `rounded` is specified.
    * @type {number}
    */
    bevelRatio: null,

    /**
    * The array of geometries to be offset.
    * @type {module:esri/geometry/Geometry[]}
    */  
    geometries: null,  // esri.geometry.Geometry[]

    /**
    * Specifies the distance for constructing an offset based on the input geometries. If the `offsetDistance` parameter is positive,
    * the constructed offset will be on the right side of the curve. Left side offsets are constructed with negative values.
    * @type {number}
    */  
    offsetDistance: null,

    /**
    * Options that determine how the ends intersect. Set to one of the following options:
    * 
    * Possible Value | Description
    * ---------------|-------------
    * esriGeometryOffsetBevelled | Squares off the corner after a given ratio distance.
    * esriGeometryOffsetMitered | Attempts to allow extended offsets to naturally intersect. If the intersection occurs too far from a corner, the corner will be beveled off at a fixed distance.
    * esriGeometryOffsetRounded | Rounds the corner between extended offsets.
    * 
    * @type {string}
    */  
    offsetHow:null,

    /**
    * The offset distance unit. For a list of valid units see [esriSRUnitType constants](http://resources.esri.com/help/9.3/ArcGISDesktop/ArcObjects/esriGeometry/esriSRUnitType.htm) or [esriSRUnit2Type constants](http://resources.esri.com/help/9.3/ArcGISDesktop/ArcObjects/esriGeometry/esriSRUnit2Type.htm).
    * @type {string}
    */  
    offsetUnit:null,

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
      var geoms = array.map(this.geometries, function(geom){
        return geom.toJSON();
      });
            
      var json = {};
          if (this.geometries && this.geometries.length > 0) {
              json.geometries = JSON.stringify({ geometryType:jsonUtils.getJsonType(this.geometries[0]), geometries:geoms });
              json.sr = JSON.stringify(this.geometries[0].spatialReference.toJSON());
          }
          
          if (this.bevelRatio) {
              json.bevelRatio = this.bevelRatio;
          }
          
          if (this.offsetDistance) {
              json.offsetDistance = this.offsetDistance;
          }    
          
          if (this.offsetHow) {
              json.offsetHow = this.offsetHow;
          }
          
          if (this.offsetUnit) {
              json.offsetUnit = this.offsetUnit;
          }  
      return json;
    }

  });
  
  lang.mixin(OffsetParameters, {
    OFFSET_BEVELLED: "esriGeometryOffsetBevelled", 
    OFFSET_MITERED: "esriGeometryOffsetMitered", 
    OFFSET_ROUNDED:"esriGeometryOffsetRounded"
  });
  
  return OffsetParameters;
});
