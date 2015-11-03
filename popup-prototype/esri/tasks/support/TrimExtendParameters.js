/**
 * Used to set the parameters for the the {@link module:esri/tasks/GeometryService#trimExtend GeometryService.trimExtend} operation.
 *
 * @module esri/tasks/support/TrimExtendParameters
 * @since 4.0
 * @see {@link module:esri/tasks/GeometryService#trimExtend GeometryService.trimExtend()}
 * @see [ArcGIS REST API - Trim/Extend](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Trim_Extend/02r30000010z000000/)
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
   * @constructor module:esri/tasks/support/TrimExtendParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var TrimExtendParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/TrimExtendParameters.prototype */
  {

      declaredClass: "esri.tasks.TrimExtendParameters",

      /**
      * A flag used with the `trimExtend` operation.
      * 
      * Possible Value | Description
      * ---------------|-------------
      * 0 | **Default**. (DEFAULT_CURVE_EXTENSION) The extension considers both ends of the path. The old ends remain and new points are added to the extended ends. The new points have attributes that are extrapolated from existing adjacent segments.
      * 1 | (RELOCATE_ENDS) When an extension is performed at an end, relocate the end point to the new position.
      * 2 | (KEEP_END_ATTRIBUTES) When an extension is performed at an end, do not extrapolate the end segments attributes for the new point. Instead, the attributes will be the same as the current end.
      * 4 | (NO_END_ATTRIBUTES) When an extension is performed at an end, do not extrapolate the end segments attributes for the new point. Instead the attributes will be empty.
      * 8 | (NO_EXTEND_AT_FROM) Do not extend the 'from' end of any path.
      * 16 | (NO_EXTEND_AT_TO) Do not extend the 'to' end of any path.
      *
      * @type {number}
      */
      extendHow: null,

      /**
      * The array of polylines to trim or extend. The structure of each geometry in the array is the same as the structure of the JSON polyline
      * objects returned by the ArcGIS REST API.
      * @type {module:esri/geometry/Polyline[]}
      */
      polylines: null,  // esri.geometry.Polyline[]

      /**
      * A polyline used as a guide for trimming or extending input polylines. The structure of the polyline is the same as the structure of the
      * JSON polyline object returned by the ArcGIS REST API.
      * @type {module:esri/geometry/Polyline}
      */
      trimExtendTo: null,  //esri.geometry.Polyline

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
          var geoms = array.map(this.polylines,function(geom){
            return geom.toJSON();
          });

          var json = {};
              json.polylines = JSON.stringify(geoms);
              json.trimExtendTo = JSON.stringify(this.trimExtendTo.toJSON());
              json.sr = JSON.stringify(this.polylines[0].spatialReference.toJSON());
              json.extendHow = this.extendHow||0;
          return json;
        }
      }

  );
  
  lang.mixin(TrimExtendParameters, {
    DEFAULT_CURVE_EXTENSION: 0, 
    RELOCATE_ENDS: 1, 
    KEEP_END_ATTRIBUTES: 2, 
    NO_END_ATTRIBUTES: 4, 
    NO_EXTEND_AT_FROM: 8, 
    NO_EXTEND_AT_TO: 16
  });
  
  return TrimExtendParameters;
});
