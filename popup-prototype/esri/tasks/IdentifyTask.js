/**
 * Performs an identify operation on the layers of a map service exposed by the ArcGIS 
 * Server REST API. Use {@link module:esri/tasks/support/IdentifyParameters} to set the parameters
 * for the identify operation and {@link module:esri/tasks/support/IdentifyResult} to work with
 * the results.
 * 
 * @since 4.0
 * @module esri/tasks/IdentifyTask
 * @see module:esri/tasks/support/IdentifyParameters
 * @see module:esri/tasks/support/IdentifyResult
 * @see [Identify - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r300000113000000)
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "../geometry/support/normalizeUtils",

  "./Task",

  "./support/IdentifyResult"
],
function(
  declare, lang,
  esriRequest,
  normalizeUtils,
  Task,
  IdentifyResult
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/IdentifyTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor. 
   */
  var IdentifyTask = declare(Task,
  /** @lends module:esri/tasks/IdentifyTask.prototype */
  {

    declaredClass: "esri.tasks.IdentifyTask",

    /**
    * Specifies the geodatabase version to display.
    * 
    * @type {string}
    */
    gdbVersion: null,
    
    /**
    * The service URL of a Feature Service Layer or Map Service Layer. 
    * 
    * @type {string}
    */
    url: null,

    _parsedUrlGetter: function(value) {
      var parsedUrl = this.inherited(arguments);
      parsedUrl.path += "/identify";
      return parsedUrl;
    },
    
    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "execute",
        c: 1, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { i: 0, p: [ "geometry" ] }
        ],
        e: 2
      }
    ],

    /**
     * Sends a request to the ArcGIS REST map service resource to identify features based on the 
     * {@link module:esri/tasks/support/IdentifyParameters} specified.
     * 
     * @param {module:esri/tasks/support/IdentifyParameters} params - Specifies the criteria used to identify the features.
     *                                                              
     * @return {Promise} When resolved, returns an array of 
     * {@link module:esri/tasks/support/IdentifyResult}, which contains the
     * results of the Identify operation.
     */
    execute: function(/*esri.tasks.IdentifyParameters*/ params, context) {
      //summary: Execute the task and fire onComplete event.
      // params: esri.tasks.IdentifyParameters: Parameters to pass to server to execute task

      var assembly = context.assembly,
          _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, params.toJSON(assembly && assembly[0])));

      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      return esriRequest({
        url: this.parsedUrl.path,
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleExecuteResponse);
    },

    _handleExecuteResponse: function(response) {
      var results = response.results || [];

      return results.map(function(result) {
        return IdentifyResult.fromJSON(result);
      });
    }

  });
  
  normalizeUtils._createWrappers(IdentifyTask);

  return IdentifyTask;
});
