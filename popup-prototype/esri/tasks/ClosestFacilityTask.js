/**
 * Helps you find closest facilities around any location (incident) on a network.
 *
 * When finding closest facilities, you can specify various {@link module:esri/tasks/support/ClosestFacilityParameters parameters} 
 * including how many to facilities to find and whether the direction of 
 * travel is toward or away from them. Once you've found the closest facilities, you can display 
 * the best route to or from them, return the travel cost for each route, and display directions 
 * to each facility using the {@link module:esri/tasks/support/ClosestFacilitySolveResult}. 
 * 
 * You can also specify a cutoff cost beyond which ArcGIS Network Analyst should not search for a 
 * facility. For instance, you can set up a closest facility problem to search for hospitals 
 * within a 15-minute drive time of the site of an accident. Any hospitals that take longer than 
 * 15 minutes to reach will not be included in the results. 
 * 
 * Parameters for this tasks must be defined using {@link module:esri/tasks/support/ClosestFacilityParameters}
 * and input to the [solve()](#solve) method.
 *
 * ::: esri-md class="panel trailer-1"
 * ClosestFacilityTask and other closest facility related classes require a "closest facility" layer. 
 * A closest facility layer is a layer of type `esriNAServerClosestFacilityLayer`.
 * :::
 * 
 * @since 4.0
 * @module esri/tasks/ClosestFacilityTask
 * @see module:esri/tasks/support/ClosestFacilityParameters
 * @see module:esri/tasks/support/ClosestFacilitySolveResult
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "../geometry/support/normalizeUtils",

  "./Task",

  "./support/ClosestFacilitySolveResult"
],
function(
  declare, lang,
  esriRequest,
  normalizeUtils,
  Task,
  CFResult
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/ClosestFacilityTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */      
  var CFTask = declare(Task,
  /** @lends module:esri/tasks/ClosestFacilityTask.prototype */
  {

    declaredClass: "esri.tasks.ClosestFacilityTask",

    _parsedUrlGetter: function(value) {
      var parsedUrl = this.inherited(arguments);
      parsedUrl.path += "/solveClosestFacility";
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
              "incidents.features", 
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
    * Solves the closest facility.
    *
    * @param {module:esri/tasks/support/ClosestFacilityParameters} params - Defines the parameters
    * of the closest facility analysis.
    *
    * @return {Promise} When resolved, returns an instance of 
    * {@link module:esri/tasks/support/ClosestFacilitySolveResult}
    *
    * @example
    * closestFacilityTask.solve(params).then(function(solveResult){
    *   //do something with the solveResults here
    * });
    */
    solve: function(/*esri.tasks.ClosestFacilityParameters*/ params, context) {
      
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
      return CFResult.fromJSON(response);
    }

  });
  
  normalizeUtils._createWrappers(CFTask);

  return CFTask;
});
