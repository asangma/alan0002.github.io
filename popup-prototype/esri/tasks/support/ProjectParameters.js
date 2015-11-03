/**
 * Defines the projection parameters used when calling the
 * {@link module:esri/tasks/GeometryService#project|GeometryService.project()}.
 *
 * @module esri/tasks/support/ProjectParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#project GeometryService.project()}
 * @see [ArcGIS REST API - Project](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Project/02r3000000pv000000/)
 */
define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../core/Accessor",
  "../../core/lang",

  "../../geometry/support/jsonUtils"
],
function(
  declare, array, Accessor, esriLang,
  jsonUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/ProjectParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ProjectParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/ProjectParameters.prototype */
  {

    declaredClass: "esri.tasks.ProjectParameters",
    
    /**
    * The input geometries to project.
    * @type {module:esri/geometry/Geometry[]}
    */
    geometries: null,

    /**
    * The spatial reference to which you are projecting the geometries.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */  
    outSR: null,

    /**
    * The well-known id {wkid:number} or well-known text {wkt:string} of the datum 
    * transformation to be applied to the projected geometries. 
    * [Click here](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000r8000000)
    * for a list of valid datum transformations that may be used here.
    * 
    * If a transformation is specified, a value must also be specified in the [transformForward](#transformForward) 
    * property.
    * 
    * @type {Object}
    *            
    * @property {number} wkid - The well-known ID of the datum transformation to apply to the projection.
    *                 [Click here](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000r8000000)
    *                 for a list of valid IDs.
    */
    transformation: null,

    /**
    * Indicates whether to transform forward or not. The forward or reverse direction of transformation is implied in 
    * the name of the transformation.
    * @type {boolean}
    */  
    transformForward: null,

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
      json.outSR = this.outSR.wkid || JSON.stringify(this.outSR.toJSON());
      json.inSR = this.geometries[0].spatialReference.wkid || JSON.stringify(this.geometries[0].spatialReference.toJSON());
      json.geometries = JSON.stringify({ geometryType:jsonUtils.getJsonType(this.geometries[0]), geometries:geoms });
      if (this.transformation) {
        json.transformation = this.transformation.wkid || JSON.stringify(this.transformation);
      }
      if (esriLang.isDefined(this.transformForward)) {
        json.transformForward = this.transformForward;
      }
      return json;
    }

  });

  return ProjectParameters;
});
