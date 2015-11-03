/**
 * Defines a unique value classification scheme used by the 
 * {@link module:esri/tasks/GenerateRendererTask} to create a renderer that 
 * groups values based on a unique combination of one or more fields. Typically features are 
 * rendered based on the unique values of one attribute field. However up to three fields can be 
 * combined to generate a unique value.
 *
 * @module esri/tasks/support/UniqueValueDefinition
 * @since 4.0
 * @see module:esri/tasks/GenerateRendererTask
 * @see module:esri/tasks/support/ClassBreaksDefinition
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "./ClassificationDefinition"
],
function(
  declare, lang,
  ClassificationDefinition
) {

  /**
   * @extends module:esri/tasks/support/ClassificationDefinition
   * @constructor module:esri/tasks/support/UniqueValueDefinition
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var UniqueValueDefinition = declare(ClassificationDefinition,
  /** @lends module:esri/tasks/support/UniqueValueDefinition.prototype */
  {

    declaredClass: "esri.tasks.UniqueValueDefinition",

    /**
    * Attribute field name used to match values.
    * 
    * @type {string}
    */
    attributeField: null,

    /**
    * The name of the field that contains unique values when combined with the values 
    * specified by [attributeField](#attributeField).
    * @type {string}
    */  
    attributeField2: null,

    /**
    * The name of the field that contains unique values when combined with the values 
    * specified by [attributeField](#attributeField) and [attributeField2](#attributeField2).
    * 
    * @type {string}
    */  
    attributeField3: null,

    fieldDelimiter: null,

    /**
    * The type of classification definition. This value is always `uniqueValueDef`.
    * 
    * @type {string}
    */   
    type: "uniqueValueDef",

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    /**
     * Returns an easily serializable object representation of the unique value definition.
     * @returns {Object} Returns a JSON object representation of a unique value definition.
     * @private
     */
    toJSON: function() {
      var json = this.inherited(arguments);
      this.uniqueValueFields = [];
      if (this.attributeField) {
        this.uniqueValueFields.push(this.attributeField);
      }
      if (this.attributeField2) {
        this.uniqueValueFields.push(this.attributeField2);
      }
      if (this.attributeField3) {
        this.uniqueValueFields.push(this.attributeField3);
      }
      lang.mixin(json, {type: this.type, uniqueValueFields: this.uniqueValueFields});
      if (this.fieldDelimiter) {
        lang.mixin(json, {fieldDelimiter: this.fieldDelimiter});
      }
      return json;
    }

  });

  return UniqueValueDefinition;
});
