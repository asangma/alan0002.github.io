/**
 * Defines the input parameters when calling 
 * {@link module:esri/tasks/GeometryService#distance|GeometryService.distance()}.
 *
 * @module esri/tasks/support/DistanceParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#distance|GeometryService.distance()}
 * @see [ArcGIS REST API - Distance](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Distance/02r3000000z3000000/)
 */
define(
[
  "../../core/declare",

  "../../core/Accessor",

  "../../geometry/support/jsonUtils"
],
function(
  declare, Accessor,
  jsonUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/DistanceParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */      
  var DistanceParameters = declare(Accessor, 
  /** @lends module:esri/tasks/support/DistanceParameters.prototype */                                 
  {

    declaredClass: "esri.tasks.DistanceParameters",
    
    /**
    * The geometry from which the distance is to be measured. The geometry can be 
    * a {@link module:esri/geometry/Point}, {@link module:esri/geometry/Polyline}, 
    * {@link module:esri/geometry/Polygon}, or a {@link module:esri/geometry/Multipoint}.
    * 
    * @type {module:esri/geometry/Geometry[]}
    */
    geometry1: null,  // esri.geometry.Geometry

    /**
    * The geometry to which the distance is to be measured. The geometry can be 
    * a {@link module:esri/geometry/Point}, {@link module:esri/geometry/Polyline}, 
    * {@link module:esri/geometry/Polygon}, or a {@link module:esri/geometry/Multipoint}.
    * 
    * @type {module:esri/geometry/Geometry[]}
    */  
    geometry2: null,  // esri.geometry.Geometry

    /**
    * Specifies the units for measuring distance between [geometry1](#geometry1) and [geometry2](#geometry2). If the unit 
    * is not specified the units are derived from the spatial reference. For a list of valid units, see [esriSRUnitType Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnitType_Constants/000w00000042000000/) and [esriSRUnit2Type Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnit2Type_Constants/000w00000041000000/).
    * 
    * @type {number | string}
    */  
    distanceUnit: null,

    /**
    * When `true`, the geodesic distance between [geometry1](#geometry1) and [geometry2](#geometry2) is measured.
    * 
    * @type {boolean}
    */  
    geodesic: null,

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
                 
      var json = {};
          
          var geometry1 = this.geometry1;
          if (geometry1) {
              json.geometry1 = JSON.stringify({ geometryType:jsonUtils.getJsonType(geometry1), geometry:geometry1 });
          }
          
         var geometry2 = this.geometry2;
          if (geometry2) {
              json.geometry2 = JSON.stringify({ geometryType:jsonUtils.getJsonType(geometry2), geometry:geometry2 });
          }
                    
          json.sr = JSON.stringify(this.geometry1.spatialReference.toJSON());
          
          if (this.distanceUnit) {
              json.distanceUnit = this.distanceUnit;
          }
          if (this.geodesic) {
              json.geodesic = this.geodesic;                       
          }
      return json;
    }

  });
  
  return DistanceParameters;
});
