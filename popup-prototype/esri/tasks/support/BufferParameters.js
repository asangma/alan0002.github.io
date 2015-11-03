/**
 * Sets the distances, units, and other parameters for the {@link module:esri/tasks/GeometryService#buffer buffer()} 
 * method in the Geometry Service.
 *
 * @module esri/tasks/support/BufferParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#buffer GeometryService.buffer()}
 * @see [ArcGIS REST API - Buffer](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000s5000000)
 */
define([
  "../../core/declare",
  "dojo/_base/array",

  "../../core/Accessor",

  "../../geometry/Polygon",
  "../../geometry/support/jsonUtils"
],
function(
  declare, array, Accessor,
  Polygon, jsonUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/BufferParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  var BufferParameters = declare(Accessor, 
  /** @lends module:esri/tasks/support/BufferParameters.prototype */                          
  {

    declaredClass: "esri.tasks.BufferParameters",

    // "esriSRUnitType" Constants
    // see http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriGeometry/esriSRUnitType.htm
    // and http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriGeometry/esriSRUnit2Type.htm 

    /**
    * The spatial reference in which the geometries are buffered.
    * 
    * If `bufferSpatialReference` is not specified, the geometries are buffered in the spatial
    * reference specified by `outSpatialReference`. If `outSpatialReference` is also not specified,
    * they are buffered in the spatial reference of the features.
    * @type {module:esri/geometry/SpatialReference}
    */
    bufferSpatialReference: null,

    /**
    * The distances the input features are buffered. The distance units are specified by `unit`.
    * @type {number[]}
    */  
    distances: null,

    /**
    * If the input geometries are in a geographic coordinate system, set geodesic to `true` to
    * generate a buffer polygon using a geodesic distance. The `bufferSpatialReference` property is
    * ignored when geodesic is set to `true`. Requires ArcGIS Server 10.1 or greater geometry service.
    * For more information, see the ArcGIS REST API documentation on the GeometryService buffer
    * operation and the geodesic property.
    * 
    * @type {boolean}
    */  
    geodesic: false,

    /**
    * The input geometries to buffer.
    * 
    * @type {module:esri/geometry/Geometry[]}
    */
    geometries: null,

    /**
    * The spatial reference for the returned geometries.
    * 
    * If `outSpatialReference` is not specified, the output geometries are in the spatial reference
    * specified by `bufferSpatialReference`. If `bufferSpatialReference` also is not specified, they
    * are in the spatial reference of the features.
    * @type {module:esri/geometry/SpatialReference}
    */  
    outSpatialReference: null,

    /**
    * If `true`, all geometries buffered at a given distance are unioned into a single (possibly
    * multipart) polygon, and the unioned geometry is placed in the output array.
    * 
    * @type {boolean}
    */  
    unionResults: false,

    /**
    * The units for calculating each buffer distance. If `unit` is not specified, the units are
    * derived from `bufferSpatialReference`. If `bufferSpatialReference` is not specified, 
    * the units are derived from the features. 
    * 
    * For a list of valid units, see [esriSRUnitType Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnitType_Constants/000w00000042000000/) and [esriSRUnit2Type Constants](http://resources.arcgis.com/en/help/arcobjects-cpp/componenthelp/index.html#/esriSRUnit2Type_Constants/000w00000041000000/).
    * 
    * @type {number}
    */  
    unit: null,

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
      var json = { unit: this.unit, unionResults: this.unionResults, geodesic: this.geodesic },
          dt = this.distances,
          outsr = this.outSpatialReference,
          bufsr = this.bufferSpatialReference;

      var geoms = array.map(this.geometries, function(geom) {
        geom = (geom.type === "extent") ? Polygon.fromExtent(geom) : geom;
        return geom.toJSON();
      }, this);

      var geometries = this.geometries;
      if (geometries && geometries.length > 0) {
        var geomType = geometries[0].type === "extent" ? "esriGeometryPolygon" : jsonUtils.getJsonType(geometries[0]);
        json.geometries = JSON.stringify({ geometryType: geomType, geometries: geoms });
        json.inSR = geometries[0].spatialReference.wkid ?
            geometries[0].spatialReference.wkid : JSON.stringify(geometries[0].spatialReference.toJSON());
      }

      if (dt) {
        json.distances = dt.join(",");
      }

      if (outsr) {
        json.outSR = outsr.wkid ? outsr.wkid : JSON.stringify(outsr.toJSON());
      }

      if (bufsr) {
        json.bufferSR = bufsr.wkid ? bufsr.wkid : JSON.stringify(bufsr.toJSON());
      }

      return json;
    }

  });

  return BufferParameters;
});
