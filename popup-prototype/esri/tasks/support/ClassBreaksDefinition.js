/**
 * Defines a class breaks classification scheme used by the 
 * {@link module:esri/tasks/GenerateRendererTask} to generate classes. Class 
 * breaks renderers symbolize data based on the value of a numeric attribute. Data with similar 
 * values for the attribute use the same symbol. 
 *
 * @module esri/tasks/support/ClassBreaksDefinition
 * @since 4.0
 * @see module:esri/tasks/GenerateRendererTask
 * @see module:esri/tasks/support/UniqueValueDefinition
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
   * @constructor module:esri/tasks/support/ClassBreaksDefinition
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ClassBreaksDefinition = declare(ClassificationDefinition,
  /** @lends module:esri/tasks/support/ClassBreaksDefinition.prototype */
  {
       
    declaredClass: "esri.tasks.ClassBreaksDefinition",

    /**
    * The number of class breaks to create in the renderer.
    * 
    * @type {number}
    */
    breakCount: null,

    /**
    * The name of the field used to match values.
    * 
    * @type {string}
    */  
    classificationField: null,

    /**
    * The name of the classification method.
    * 
    * **Known values:** natural-breaks | equal-interval | quantile | standard-deviation | geometrical-interval
    * 
    * @type {string}
    */  
    classificationMethod: null,

    /**
    * The name of the field that contains the values used to normalize class breaks when `normalizationType = 'field'`.
    * 
    * @type {string}
    */  
    normalizationField: null,

    /**
    * The type of normalization used to normalize class breaks.
    * 
    * **Known Values:** field | log | percent-of-total
    * @type {string}
    */  
    normalizationType: null,

    /**
    * The standard deviation interval. When `standardDeviationInterval` is specified, [breakCount](#breakCount) is ignored. 
    * Only valid when `classificationMethod = 'standard-deviation'`.
    * 
    * **Known Values:** 1 | 0.5 | 0.33 | 0.25
    * 
    * @type {number}
    */  
    standardDeviationInterval: null,

    /**
    * The type of classification definition. This value is always `classBreaksDef`.
    * 
    * @type {string}
    */  
    type: "classBreaksDef",

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
      var json = this.inherited(arguments);
      var classificationMethod;
      switch (this.classificationMethod.toLowerCase()) {
      case "natural-breaks":
        classificationMethod = "esriClassifyNaturalBreaks";
        break;
      case "equal-interval":
        classificationMethod = "esriClassifyEqualInterval";
        break;
      case "quantile":
        classificationMethod = "esriClassifyQuantile";
        break;
      case "standard-deviation":
        classificationMethod = "esriClassifyStandardDeviation";
        break;
      case "geometrical-interval":
        classificationMethod = "esriClassifyGeometricalInterval";
        break;
      default:
        classificationMethod = this.classificationMethod;
      }    
      lang.mixin(json, {type: this.type, classificationField: this.classificationField, classificationMethod: classificationMethod, breakCount: this.breakCount});
      if (this.normalizationType) {
        var normalizationType;
        switch (this.normalizationType.toLowerCase()) {
        case "field":
          normalizationType = "esriNormalizeByField";
          break;
        case "log":
          normalizationType = "esriNormalizeByLog";
          break;
        case "percent-of-total":
          normalizationType = "esriNormalizeByPercentOfTotal";
          break;
        default:
          normalizationType = this.normalizationType;
        }
        lang.mixin(json, {normalizationType: normalizationType});
      }
      if (this.normalizationField) {
        lang.mixin(json, {normalizationField: this.normalizationField});
      }
      if (this.standardDeviationInterval) {
        lang.mixin(json, {standardDeviationInterval: this.standardDeviationInterval});
      }
      return json;
    }

  });

  return ClassBreaksDefinition;
});
