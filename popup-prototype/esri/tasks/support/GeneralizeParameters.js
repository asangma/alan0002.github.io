/**
 * Sets the geometries, maximum deviation and units for the 
 * {@link module:esri/tasks/GeometryService#generalize|generalize} operation.
 *
 * @module esri/tasks/support/GeneralizeParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#generalize|GeometryService.generalize()}
 * @see [ArcGIS REST API - Generalize](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Generalize/02r30000010n000000/)
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
   * @constructor module:esri/tasks/support/GeneralizeParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */       
  var GeneralizeParameters = declare(Accessor, 
  /** @lends module:esri/tasks/support/GeneralizeParameters.prototype */
  {

    declaredClass: "esri.tasks.GeneralizeParameters",
    
    /**
    * The array of input geometries to generalize. All geometries in this array must be of the same
    * geometry type (e.g. `esriGeometryPolyline` or `esriGeometryPolygon`).
    * 
    * @type {module:esri/geometry/Geometry[]}
    */
    geometries: null,  // esri.geometry.Geometry[]

    /**
    * The maximum deviation unit. If the unit is not specified, units are derived from the 
    * spatial reference. For a list of valid units, see [esriSRUnitType Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnitType_Constants/000w00000042000000/) and [esriSRUnit2Type Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnit2Type_Constants/000w00000041000000/).
    * 
    * @type {number | string}
    */  
    deviationUnit: null,

    /**
    * The maximum deviation for constructing a generalized geometry based on the input geometries.
    * 
    * @type {number}
    */  
    maxDeviation: null,

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
          
          if (this.deviationUnit) {
              json.deviationUnit = this.deviationUnit;
          }
          
          if (this.maxDeviation) {
              json.maxDeviation = this.maxDeviation;
          }                      
      return json;
    }

  });
  
  return GeneralizeParameters;
});
