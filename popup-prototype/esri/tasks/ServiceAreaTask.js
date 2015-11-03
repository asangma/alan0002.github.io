/**
 * ServiceAreaTask helps you find service areas around any location on a network. A network service area is a 
 * region that encompasses all accessible streets (streets that are within a specified 
 * impedance). For instance, the 5-minute service area for a point includes all the streets that 
 * can be reached within five minutes from that point. 
 * 
 * ::: esri-md class="panel trailer-1"
 * ServiceAreaTask, and other service area related classes, requires a service area layer. 
 * A service area layer is a layer of type `esriNAServerServiceAreaLayer`.
 * :::
 *
 * @module esri/tasks/ServiceAreaTask
 * @since 4.0
 * @see module:esri/tasks/support/ServiceAreaParameters
 * @see module:esri/tasks/support/ServiceAreaSolveResult
 * @see [Solve Service Area - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000pp000000)
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "../geometry/support/normalizeUtils",

  "./Task",

  "./support/ServiceAreaSolveResult"
],
function(
  declare, lang,
  esriRequest,
  normalizeUtils,
  Task,
  ServiceAreaSolveResult
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/ServiceAreaTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ServiceAreaTask = declare(Task,
  /** @lends module:esri/tasks/ServiceAreaTask.prototype */
  {

    declaredClass: "esri.tasks.ServiceAreaTask",

    _parsedUrlGetter: function(value) {
      var parsedUrl = this.inherited(arguments);
      parsedUrl.path += "/solveServiceArea";
      return parsedUrl;
    },

    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "solve",
        c: 1, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { 
            i: 0, 
            p: [ 
              "facilities.features", 
              "pointBarriers.features", 
              "polylineBarriers.features", 
              "polygonBarriers.features" 
            ]
          }
        ],
        e: 2
      }
    ],

    /**
     * Determines the service area based on a set of parameters.
     * 
     * @param   {module:esri/tasks/support/ServiceAreaParameters} params - The parameters needed to define the service area.
     *                                                                   
     * @return {Promise} When resolved, returns an instance of 
     * {@link module:esri/tasks/support/ServiceAreaSolveResult}.
     */
    solve: function(/*esri.tasks.ServiceAreaParameters*/ params, context) {
      var assembly = context.assembly,
          _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, params.toJSON(assembly && assembly[0])));

      return esriRequest({
        url: this.parsedUrl.path,
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleSolveResponse);
    },

    _handleSolveResponse: function(response) {
      return ServiceAreaSolveResult.fromJSON(response);
    }

  });

  normalizeUtils._createWrappers(ServiceAreaTask);

  return ServiceAreaTask;
});
