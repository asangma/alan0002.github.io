/**
 * Define layer properties for the legend layers associated with a
 * {@link module:esri/tasks/support/PrintTemplate|PrintTemplate}.
 *
 * @module esri/tasks/support/LegendLayer
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
   * @constructor module:esri/tasks/support/LegendLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var LegendLayer = declare(Accessor,
  /** @lends module:esri/tasks/support/LegendLayer.prototype */
  {

    declaredClass: "esri.tasks.LegendLayer",
    
    /**
    * The id of the operational layer to include in the printout's legend.
    * @type {string}
    */
    layerId: null,

    /**
    * The ids of the sublayers to include in the printout's legend.
    * @type {string[]}
    */  
    subLayerIds: null

  });
  
  return LegendLayer;
});
