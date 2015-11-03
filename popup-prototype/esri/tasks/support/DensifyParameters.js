/**
 * Input parameters for the {@link module:esri/tasks/GeometryService#densify densify()} method on
 * the GeometryService.
 *
 * @module esri/tasks/support/DensifyParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#densify GeometryService.densify()}
 * @see [ArcGIS REST API - Densify](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Densify/02r3000000np000000/)
 */
define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../core/Accessor",

  "../../geometry/support/jsonUtils"
],
function(
  declare, array, Accessor,
  jsonUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/DensifyParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */      
  var DensifyParameters = declare(Accessor, 
  /** @lends module:esri/tasks/support/DensifyParameters.prototype */                                 
  {

    declaredClass: "esri.tasks.DensifyParameters",
    
    /**
    * The array of geometries to be densified.
    * 
    * @type {module:esri/geometry/Geometry[]}
    */
    geometries: null,  // esri.geometry.Geometry[]

    /**
    * If `true`, Geographic Coordinate System spatial references are used or 
    * densify geodesic will be performed.
    * 
    * @type {boolean}
    */  
    geodesic: null,

    /**
    * The length unit of `maxSegmentLength`. For a list of valid units, see [esriSRUnitType Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnitType_Constants/000w00000042000000/) and [esriSRUnit2Type Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnit2Type_Constants/000w00000041000000/).
    * 
    * @type {number | string}
    */   
    lengthUnit: null,

    /**
    * All segments longer than `maxSegmentLength` are replaced with sequences of lines 
    * no longer than `maxSegmentLength.`
    * 
    * @type {number}
    */  
    maxSegmentLength: null,

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
      var geoms = array.map(this.geometries, function(geom) {
        return geom.toJSON();
      });
            
      var json = {};
          
          if (this.geometries && this.geometries.length > 0) {
              json.geometries = JSON.stringify({ geometryType:jsonUtils.getJsonType(this.geometries[0]), geometries:geoms });
              json.sr = JSON.stringify(this.geometries[0].spatialReference.toJSON());
          }
          
          if (this.geodesic) {
              json.geodesic = this.geodesic;
          }
          
          if (this.lengthUnit) {
              json.lengthUnit = this.lengthUnit;
          }
          
          if (this.maxSegmentLength) {
              json.maxSegmentLength = this.maxSegmentLength;
          }
      return json;
    }

  });
  
  return DensifyParameters;
});
