/**
 * Represents information pertaining to the execution of an asynchronous
 * {@link module:esri/tasks/Geoprocessor} task on the server.
 *
 * @module esri/tasks/support/JobInfo
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/Geoprocessor
 * @see module:esri/tasks/support/GPMessage
 * @see module:esri/tasks/support/ParameterValue
 */
define(
[
  "dojo/_base/array",
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/JSONSupport",

  "./GPMessage"
],
function(
  array, declare, lang,
  JSONSupport,
  GPMessage
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/JobInfo
   */
  var JobInfo = declare(JSONSupport,
  /** @lends module:esri/tasks/support/JobInfo.prototype */
  {

    declaredClass: "esri.tasks.JobInfo",

    /**
    * The unique job ID assigned by ArcGIS Server.
    * 
    * @type {string}
    */
    jobId: "",

    /**
    * The job status.
    * 
    * **Known Values:** esriJobCancelled | esriJobCancelling | esriJobDeleted | esriJobDeleting | esriJobTimedOut | 
    * esriJobExecuting | esriJobFailed | esriJobNew | esriJobSubmitted | esriJobSucceeded | esriJobWaiting
    * 
    * @type {string}
    */  
    jobStatus: "",

    /**
    * An array of messages that include the message type and a description.
    * 
    * @type {module:esri/tasks/support/GPMessage[]}
    */  
    messages: [],

    _messagesReader: function(value) {
      return array.map(value, function(message) {
        return GPMessage.fromJSON(message);
      });
    }

  });

  lang.mixin(JobInfo, {
    STATUS_CANCELLED: "esriJobCancelled",
    STATUS_CANCELLING: "esriJobCancelling",
    STATUS_DELETED: "esriJobDeleted",
    STATUS_DELETING: "esriJobDeleting",
    STATUS_EXECUTING: "esriJobExecuting",
    STATUS_FAILED: "esriJobFailed",
    STATUS_NEW: "esriJobNew",
    STATUS_SUBMITTED: "esriJobSubmitted",
    STATUS_SUCCEEDED: "esriJobSucceeded",
    STATUS_TIMED_OUT: "esriJobTimedOut",
    STATUS_WAITING: "esriJobWaiting"
  });

  return JobInfo;
});
