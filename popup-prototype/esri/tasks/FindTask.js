/**
 * Search a map service exposed by the ArcGIS Server REST API based on a string value. The search 
 * can be conducted on a single field of a single layer, on many fields of a layer, or on many
 * fields of many layers. 
 * 
 * Use {@link module:esri/tasks/support/FindParameters} to set the parameters of the task. 
 * The result will be an instance of {@link module:esri/tasks/support/FindResult}.
 * 
 * @since 4.0
 * @module esri/tasks/FindTask
 * @see module:esri/tasks/support/FindParameters
 * @see module:esri/tasks/support/FindResult
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "./Task",

  "./support/FindResult"
],
function(
  declare, lang,
  esriRequest,
  Task,
  FindResult
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/FindTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var FindTask = declare(Task,
  /** @lends module:esri/tasks/FindTask.prototype */
  {

    declaredClass: "esri.tasks.FindTask",

    /**
    * The geodatabase version.
    * 
    * @type {string}
    */
    gdbVersion: null,

    _parsedUrlGetter: function(value) {
      var parsedUrl = this.inherited(arguments);
      parsedUrl.path += "/find";
      return parsedUrl;
    },

    /**
    * Sends a request to the ArcGIS REST map service resource to perform a search based on the input
    * {@link module:esri/tasks/support/FindParameters params}.
    *
    * @param {module:esri/tasks/support/FindParameters} params - Specifies the layers and fields that are used for the search.
    *
    * @return {Promise} When resolved, the result is an array of objects of type
    * {@link module:esri/tasks/support/FindResult}.
    */
    execute: function(/*esri.tasks.FindParameters*/ params) {
      //summary: Execute the task and fire onComplete event.
      // params: esri.tasks.FindParameters: Parameters to pass to server to execute task

      var _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, params.toJSON()));

      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }
      
      return esriRequest({
        url: this.parsedUrl.path,
        content: _params,
        callbackParamName: "callback"
      }).then(this._handleExecuteResponse);
    },

    _handleExecuteResponse: function(response) {
      var results = response.results || [];

      return results.map(function(result) {
        return FindResult.fromJSON(result);
      });
    }

  });

  return FindTask;
});
