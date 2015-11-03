/**
 * Input parameters for the {@link module:esri/tasks/GeometryService#areasAndLengths areasAndLengths()} 
 * method on the Geometry Service.
 *
 * @module esri/tasks/support/AreasAndLengthsParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#areasAndLengths GeometryService.areasAndLengths()}
 * @see [ArcGIS REST API - Areas and Lengths](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Areas_and_Lengths/02r3000000t4000000/)
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "../../core/Accessor"
],
function(
  declare, lang, array, Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/AreasAndLengthsParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */      
  var AreasAndLengthsParameters = declare(Accessor, 
  /** @lends module:esri/tasks/support/AreasAndLengthsParameters.prototype */
  {

    declaredClass: "esri.tasks.AreasAndLengthsParameters",
 
    /**
    * The area unit in which areas of polygons will be calculated. For a list of valid units, 
    * [click here](http://resources.arcgis.com/en/help/runtime-java/apiref/constant-values.html#com.esri.core.geometry.AreaUnit.Code.ACRE).
    * 
    * @type {string | number}
    */
    areaUnit: null,

    /**
    * Defines the type of calculation for the geometry. The type can be one of the following:
    * 
    * Value | Description
    * ------|------------
    * planar | Planar measurements use 2D Cartesian mathematics to calculate length. Use this type if the length needs to be calculated in the input spatial reference. Otherwise use `preserveShape`.
    * geodesic | Use this type to calculate an area or length using only the vertices of the polygon to define the lines connecting the vertices as geodesic segments independent of the actual shape of the polygon. **Note:** a geodesic segment is the shortest path between two points on an ellipsoid.
    * preserveShape | Calculate the area or length of the geometry on the surface of the Earth ellipsoid (for geometries defined in a projected or geographic coordinate system). This method preserves the shape of the geometry in its coordinate system, which means the true area or length will be calculated for the geometry that is displayed on the map.
    * 
    * @type {string}
    */  
    calculationType: null,

    /**
    * The length unit in which perimeters of polygons will be calculated. For a list of valid units, see [esriSRUnitType Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnitType_Constants/000w00000042000000/) and [esriSRUnit2Type Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnit2Type_Constants/000w00000041000000/).
    * 
    * @type {string | number}
    */  
    lengthUnit: null,

    /**
    * Polygon geometries for which to compute areas and lengths.
    * 
    * @type {module:esri/geometry/Polygon[]}
    */  
    polygons: null,  // esri.geometry.Polygon[]

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
      var geoms = array.map(this.polygons, function(geom){
        return geom.toJSON();
      });

      var json = {};
          json.polygons = JSON.stringify(geoms);
          var outSr = this.polygons[0].spatialReference;
          json.sr = outSr.wkid ? outSr.wkid : JSON.stringify(outSr.toJSON());
          
          if (this.lengthUnit) {
              json.lengthUnit = this.lengthUnit;
          }
          
          if (this.areaUnit) {
            if (lang.isString(this.areaUnit)) {
              json.areaUnit = JSON.stringify({"areaUnit":this.areaUnit});
            } else {
              json.areaUnit = this.areaUnit;
            }
          }
          
          if (this.calculationType) {
            json.calculationType = this.calculationType;
          }
      return json;
    }

  });
  
  return AreasAndLengthsParameters;
});
