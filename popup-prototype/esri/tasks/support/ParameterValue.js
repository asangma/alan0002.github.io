/**
 * Represents the output parameters of a {@link module:esri/tasks/Geoprocessor} task
 * and their properties and values.
 *
 * @module esri/tasks/support/ParameterValue
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/Geoprocessor
 * @see module:esri/tasks/support/GPMessage
 * @see module:esri/tasks/support/JobInfo
 */
define(
[
  "../../core/declare",

  "../../core/JSONSupport"
],
function(
  declare,
  JSONSupport
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/ParameterValue
   */
  var ParameterValue = declare(JSONSupport,
  /** @lends module:esri/tasks/support/ParameterValue.prototype */
  {

    declaredClass: "esri.tasks.ParameterValue",

    /**
    * Specifies the parameter's data type. 
    * 
    * **Possible Values:** GPString | GPDouble | GPLong | GPBoolean |
    * GPDate | GPLinearUnit | GPDataFile | GPRasterData | GPRecordSet | GPRasterDataLayer | GPFeatureRecordSetLayer | GPMultiValue
    * 
    * @type {string}
    */
    dataType: null,

    /**
    * The value of the parameter. The data structure of this value depends on the `dataType`.
    * 
    * Data Type | JavaScript Type
    * ----------|----------------
    * GPString | [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) 
    * GPDouble | [Number (float)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) 
    * GPLong | [Number (int)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) 
    * GPBoolean | [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) 
    * GPDate | {@link module:esri/tasks/support/Date}
    * GPLinearUnit | {@link module:esri/tasks/support/LinearUnit}
    * GPDataFile | {@link module:esri/tasks/support/DataFile}
    * GPRasterData | {@link module:esri/tasks/support/RasterData}
    * GPRecordSet | {@link module:esri/tasks/support/FeatureSet}
    * GPRasterDataLayer | {@link module:esri/tasks/support/RasterData}
    * GPFeatureRecordSetLayer | {@link module:esri/tasks/support/FeatureSet}
    * GPMultiValue | [String[]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
    * 
    * @type {Object}
    */  
    value: null

  });

  return ParameterValue;
});
