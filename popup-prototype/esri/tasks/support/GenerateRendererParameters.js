/**
 * Input parameters for {@link module:esri/tasks/GenerateRendererTask}.
 * 
 * @since 4.0
 * @module esri/tasks/support/GenerateRendererParameters
 * @see module:esri/tasks/GenerateRendererTask
 */
define(
[
  "../../core/declare",

  "../../core/Accessor"
],
function(
  declare, Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/GenerateRendererParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var GenerateRendererParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/GenerateRendererParameters.prototype */
  {

    declaredClass: "esri.tasks.GenerateRendererParameters",
    
    /**
    * A {@link module:esri/tasks/support/ClassBreaksDefinition} or 
    * {@link module:esri/tasks/support/UniqueValueDefinition} classification 
    * definition used to generate the data classes.
    * 
    * @type {module:esri/tasks/support/ClassificationDefinition}
    */
    classificationDefinition: null,

    /**
    * A where clause used to generate the data classes. Any legal SQL where clause operating 
    * on the fields in the layer/table is allowed.
    * 
    * @type {string}
    * @example 
    * params.where = "STATE_NAME = 'Washington'";
    */
    where: null,

    /**
    * Number of decimal places to round values for the renderer. Only applies to 
    * {@link module:esri/renderers/ClassBreaksRenderer}.
    * 
    * @type {number}
    */
    precision: null,

    /**
    * The label in the legend will have this prefix.
    * 
    * @type {string}
    */
    prefix: null,

    /**
    * The label in the legend will have this at the end of each label.
    * 
    * @type {string}
    */
    unitLabel: null,

    /**
    * Indicates if the label should be formatted
    * 
    * @type {boolean}
    */
    formatLabel: null,

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
      var json = {classificationDef: JSON.stringify(this.classificationDefinition.toJSON()), where: this.where};
      return json;
    }

  });

  return GenerateRendererParameters;
});
