/**
 * Sets the length units and other parameters for the {@link module:esri/tasks/GeometryService#lengths GeometryService.lengths()} operation.
 *
 * @module esri/tasks/support/LengthsParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#lengths GeometryService.lengths()}
 * @see [ArcGIS REST API - Lengths](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Lengths/02r3000000qz000000/)
 */
define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../core/Accessor"
],
function(
  declare, array, Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/LengthsParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var LengthsParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/LengthsParameters.prototype */
  {

    declaredClass: "esri.tasks.LengthsParameters",

    /**
    * Defines the type of calculation for the geometry. The type can be one of the following:
    * 
    * Value | Description
    * ---------------|---------------
    * planar | Planar measurements use 2D Cartesian mathematics to calculate length. Use this type if the length needs to be calculated in the input spatial reference otherwise use `preserveShape`.
    * geodesic | Use this type to calculate an area or length using only the vertices of the polygon to define the lines connecting the vertices as geodesic segments independent of the actual shape of the polygon. **Note:** a geodesic segment is the shortest path between two points on an ellipsoid.
    * preserveShape | Calculate the area or length of the geometry on the surface of the Earth ellipsoid, for geometries defined in a projected or geographic coordinate system. This method preserves the shape of the geometry in its coordinate system which means the true area or length will be calculated for the geometry that is displayed on the map.
    * 
    * @type {string}
    */
    calculationType: null,

    /**
    * If polylines are in a geographic coordinate system, then geodesic needs to be set to `true` in order to calculate the ellipsoidal 
    * shortest path distance between each pair of the vertices in the polylines. If `lengthUnit` is not specified, the output is returned in meters.
    * 
    * @type {boolean}
    */  
    geodesic: null,

    /**
    * The length unit in which perimeters of polygons will be calculated. For a list of valid units, see [esriSRUnitType Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnitType_Constants/000w00000042000000/) and [esriSRUnit2Type Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnit2Type_Constants/000w00000041000000/).
    * 
    * @type {number | string}
    */  
    lengthUnit: null,

    /**
    * The array of polylines whose lengths are to be computed. The structure of 
    * each polyline in the array is same as the structure of the JSON polyline objects returned by the ArcGIS REST API.
    * 
    * @type {module:esri/geometry/Polyline[]}
    */
    polylines: null,  // esri.geometry.Polyline[]

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
      var geoms = array.map(this.polylines, function(geom){
        return geom.toJSON();
      });

      var json = {};
          json.polylines = JSON.stringify(geoms);
          var outSr = this.polylines[0].spatialReference;
          json.sr = outSr.wkid ? outSr.wkid : JSON.stringify(outSr.toJSON());
          
          if (this.lengthUnit) {
              json.lengthUnit = this.lengthUnit;
          }
          
          if (this.geodesic) {
              json.geodesic = this.geodesic;
          }
          
          if (this.calculationType) {
              json.calculationType = this.calculationType;
          }
      return json;
    }

  });
  
  return LengthsParameters;
});
