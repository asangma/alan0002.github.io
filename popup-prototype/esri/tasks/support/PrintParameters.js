/**
 * Input parameters for {@link module:esri/tasks/PrintTask|PrintTask}.
 *
 * @module esri/tasks/support/PrintParameters
 * @since 4.0
 */
define(
[
  "../../core/declare",

  "../../core/Accessor"
],
function(
  declare,
  Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/PrintParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PrintParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/PrintParameters.prototype */
  {

    declaredClass: "esri.tasks.PrintParameters",
    
    /**
    * The map to print.
    * @type {module:esri/Map}
    */  
    map: null,

    /**
    * Defines the layout template used for the printed map.
    * @type {module:esri/tasks/support/PrintTemplate}
    */  
    template: null,

    /**
    * Specify the output spatial reference for the printout.
    * @type {module:esri/geometry/SpatialReference}
    */  
    outSpatialReference: null,

    /**
    * Additional parameters for the print service. When an arcpy script is published as a custom print service there may be additional parameters
    * associated with the print service. To determine the extra parameters visit the ArcGIS REST Services Directory page for the print service. 
    * @type {Object}
    */
    extraParameters: null

  });
  
  return PrintParameters;
});
