/**
 * Represents a message generated during the execution of a {@link module:esri/tasks/Geoprocessor} task.
 * It includes information such as 
 * when the processing started, what parameter values are being used, the task progress, and 
 * warnings of potential problems and errors. It is composed of a message 
 * [type](#type) and [description](#description).  
 *
 * @module esri/tasks/support/GPMessage
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/Geoprocessor
 * @see module:esri/tasks/support/ParameterValue
 * @see module:esri/tasks/support/JobInfo
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/JSONSupport"
],
function(
  declare, lang,
  JSONSupport
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/GPMessage
   */
  var GPMessage = declare(JSONSupport,
  /** @lends module:esri/tasks/support/GPMessage.prototype */
  {

    declaredClass: "esri.tasks.GPMessage",

    /**
    * The geoprocessing message.
    * 
    * @type {string}
    */
    description: null,

    /**
    * The geoprocessing message type. 
    * 
    * **Known Values:** esriJobMessageTypeInformative | esriJobMessageTypeProcessDefinition | esriJobMessageTypeProcessStart | esriJobMessageTypeProcessStop 
    * | esriJobMessageTypeWarning | esriJobMessageTypeError | esriJobMessageTypeEmpty | esriJobMessageTypeAbort
    * 
    * @type {string}
    */  
    type: null

  });
  
  lang.mixin(GPMessage, {
    TYPE_INFORMATIVE: "esriJobMessageTypeInformative",
    TYPE_PROCESS_DEFINITION: "esriJobMessageTypeProcessDefinition", 
    TYPE_PROCESS_START: "esriJobMessageTypeProcessStart", 
    TYPE_PROCESS_STOP: "esriJobMessageTypeProcessStop",
    TYPE_WARNING: "esriJobMessageTypeWarning", 
    TYPE_ERROR: "esriJobMessageTypeError", 
    TYPE_EMPTY: "esriJobMessageTypeEmpty", 
    TYPE_ABORT: "esriJobMessageTypeAbort"
  });

  return GPMessage;
});
