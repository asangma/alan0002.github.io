/**
 * Performs an identify operation on an image service resource. 
 * It identifies the content of an image service for the input location and mosaic rule.
 * Use {@link module:esri/tasks/support/ImageServiceIdentifyParameters} to
 * set the parameters of the task and {@link module:esri/tasks/support/ImageServiceIdentifyResult}
 * to work with the results.
 * 
 * @since 4.0
 * @module esri/tasks/ImageServiceIdentifyTask
 * @see module:esri/tasks/support/ImageServiceIdentifyParameters
 * @see module:esri/tasks/support/ImageServiceIdentifyResult
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "../geometry/support/normalizeUtils",

  "./Task",

  "./support/ImageServiceIdentifyResult"
],
function(
  declare, lang,
  esriRequest,
  normalizeUtils,
  Task,
  ImageServiceIdentifyResult
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/ImageServiceIdentifyTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ImageServiceIdentifyTask = declare(Task,
  /** @lends module:esri/tasks/ImageServiceIdentifyTask.prototype */
  {

    declaredClass: "esri.tasks.ImageServiceIdentifyTask",
      
    /**
    * URL to the ArcGIS Server REST resource that represents an image service.
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
     * Sends a request to the ArcGIS REST image service resource to identify content based on the 
     * {@link module:esri/tasks/support/ImageServiceIdentifyParameters}
     * specified in the `params` argument.
     * 
     * @param   {module:esri/tasks/support/ImageServiceIdentifyParameters} params - 
     * Specifies the criteria used to identify the features.
     *                                                                            
     * @return {Promise} When resolved, returns an instance of 
     * {@link module:esri/tasks/support/ImageServiceIdentifyResult}.
     */
    execute: function(/*esri.tasks.ImageServiceIdentifyParameters*/ params, context) {
      //summary: Execute the task and fire onComplete event.
      // params: esri.tasks.ImageServiceIdentifyParameters: Parameters to pass to server to execute task

      var assembly = context.assembly,
          _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, params.toJSON(assembly && assembly[0])));

      return esriRequest({
        url: this.parsedUrl.path,
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleExecuteResponse);
    },

    _handleExecuteResponse: function(response) {
      return ImageServiceIdentifyResult.fromJSON(response);
    }

  });
  
  normalizeUtils._createWrappers(ImageServiceIdentifyTask);

  return ImageServiceIdentifyTask;
});
