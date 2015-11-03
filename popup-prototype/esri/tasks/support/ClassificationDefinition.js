/**
 * The super class for the classification definition objects used by the {@link module:esri/tasks/GenerateRendererTask} 
 * to generate data classes. This class should not be used to construct classification definitions.
 * Use {@link module:esri/tasks/support/ClassBreaksDefinition}
 * or {@link module:esri/tasks/support/UniqueValueDefinition} instead.
 * 
 * @module esri/tasks/support/ClassificationDefinition
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/support/ClassBreaksDefinition
 * @see module:esri/tasks/support/UniqueValueDefinition
 * @see module:esri/tasks/GenerateRendererTask
 */

define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/Accessor"
],
function(
  declare, lang,
  Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/ClassificationDefinition
   */
  var ClassificationDefinition = declare(Accessor, 
  /** @lends module:esri/tasks/support/ClassificationDefinition.prototype */
  {

    declaredClass: "esri.tasks.ClassificationDefinition",
    
    /**
    * Defines a default symbol for the classification. If `baseSymbol` is not defined then a default symbol is created based on 
    * the `geometryType` of the layer.
    * 
    * @type {module:esri/symbols/Symbol}
    */
    baseSymbol:null,

    /**
    * Defines a color ramp for the classification. If a `colorRamp` is not defined then a default color ramp will be used to 
    * assign a color to each class.
    * 
    * @type {module:esri/tasks/support/ColorRamp}
    */  
    colorRamp: null,

    /**
    * The type of classification definition.
    * 
    * **Known Values:** uniqueValueDef | classBreaksDef
    * @type {string}
    */  
    type: null,

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
      var json = {};
      if (this.baseSymbol) {
        lang.mixin(json, {baseSymbol: this.baseSymbol.toJSON()});
      }
      if (this.colorRamp && !lang.isString(this.colorRamp)) {
        lang.mixin(json, {colorRamp: this.colorRamp.toJSON()});
      }
      return json;
    }

  });

  return ClassificationDefinition;
});
