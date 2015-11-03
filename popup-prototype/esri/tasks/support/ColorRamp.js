/**
 * Used to denote classes that may be used as a color ramp.
 * 
 * @module esri/tasks/support/ColorRamp
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/support/ClassificationDefinition
 * @see module:esri/tasks/support/AlgorithmicColorRamp
 * @see module:esri/tasks/support/MultipartColorRamp
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
  * @constructor module:esri/tasks/support/ColorRamp
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */
  var ColorRamp = declare(Accessor, 
  /** @lends module:esri/tasks/support/ColorRamp.prototype */
  {

    declaredClass: "esri.tasks.ColorRamp",
    
    /**
    * A string value representing the color ramp type.
    * 
    * **Known Values:** algorithmic | multipart
    * 
    * @type {string}
    */
    type: null

  });

  return ColorRamp;
});
