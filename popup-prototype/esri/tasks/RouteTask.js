/**
 * Find routes between two or more locations and optionally get driving directions. The RouteTask
 * uses ArcGIS Server network analysis services to calculate routes. Network analysis services
 * allow you to solve simple routing problems as well as complex ones that take into account
 * multiple stops, barriers, and time windows.
 *
 * To work directly with the RouteTask, the basic pattern is:
 * 1. [Create the task](#constructors)
 * 2. {@link module:esri/tasks/support/RouteParameters Configure the parameters}
 * 3. [Solve the route](#solve) and then specify {@link module:esri/tasks/support/RouteResult what to do with its results} and handle any errors that may be returned.
 * 
 * @todo You can use the {@link module:esri/widgets/Directions} widget to easily add routing
 * capabilities to your application.
 *
 * @module esri/tasks/RouteTask
 * @since 4.0
 * @see module:esri/tasks/support/RouteParameters
 * @see module:esri/tasks/support/RouteResult
 * @see https://developers.arcgis.com/en/features/directions/
 */
define(
[
  "../geometry/support/normalizeUtils",

  "../Graphic",
  "../request",

  "./support/NAMessage",
  "./support/RouteResult",

  "./Task",

  "dojo/_base/array",
  "dojo/_base/lang"
],
function(
  normalizeUtils,
  Graphic, esriRequest,
  NAMessage, RouteResult,
  Task,
  array, lang
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/RouteTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var RouteTask = Task.createSubclass(
    /** @lends module:esri/tasks/RouteTask.prototype */
    {

      declaredClass: "esri.tasks.RouteTask",

      // Methods to be wrapped with normalize logic
      __msigns: [
        {
          n: "solve",
          c: 1, // number of arguments expected by the method before the normalize era
          a: [ // arguments or properties of arguments that need to be normalized
            {
              i: 0,
              p: [
                "stops.features",
                "barriers.features",
                "polylineBarriers.features",
                "polygonBarriers.features"
              ]
            }
          ],
          e: 2
        }
      ],

      //--------------------------------------------------------------------------
      //
      //  Public Properties
      //
      //--------------------------------------------------------------------------

      //----------------------------------
      //  parsedUrl
      //----------------------------------

      _parsedUrlGetter: function(value) {
        var parsedUrl = this.inherited(arguments);
        parsedUrl.path += "/solve";
        return parsedUrl;
      },

      //----------------------------------
      //  url
      //----------------------------------

      /**
       * URL to the ArcGIS Server REST resource that represents a network analysis service.
       * 
       * @type {string}
       */
      url: null,

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      /**
       * Solves the route against the route layer with the route parameters.
       * 
       * @param   {module:esri/tasks/support/RouteParameters} params - Route parameters used as input to generate the route.
       *                                                             
       * @return {Promise} When resolved, returns an instance of {@link module:esri/tasks/support/RouteResult}.
       */
      solve: function(/*esri.tasks.RouteParameters*/ params, context) {
        var assembly = context.assembly,
            _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, params.toJSON(assembly && assembly[0])));

        return esriRequest({
                             url: this.parsedUrl.path,
                             content: _params,
                             callbackParamName: "callback"
                           })
          .then(this._handleSolveResponse);
      },

      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      _handleSolveResponse: function(response) {
        var routeNames = [],
            // stopRouteNames = [],
            results = [],
            dirs = response.directions || [],
            routes = response.routes ? response.routes.features : [],
            stops = response.stops ? response.stops.features : [],
            barriers = response.barriers ? response.barriers.features : [],
            polygonBarriers = response.polygonBarriers ? response.polygonBarriers.features : [],
            polylineBarriers = response.polylineBarriers ? response.polylineBarriers.features : [],
            messages = response.messages,
            _nullRouteName = "esri.tasks.RouteTask.NULL_ROUTE_NAME",  //case where user did not specify a route name, only for stops
            forEach = array.forEach,
            indexOf = array.indexOf,
            allNullStops = true,
            routeName, stopAttr,
            sr = (
              (response.routes && response.routes.spatialReference) ||
              (response.stops && response.stops.spatialReference) ||
              (response.barriers && response.barriers.spatialReference) ||
              (response.polygonBarriers && response.polygonBarriers.spatialReference) ||
              (response.polylineBarriers && response.polylineBarriers.spatialReference)
            );

        //process directions
        forEach(dirs, function(dir) {
          routeNames.push(routeName = dir.routeName);
          results[routeName] = { directions:dir };
        });

        //process routes
        forEach(routes, function(route) {
          if (indexOf(routeNames, (routeName = route.attributes.Name)) === -1) {
            routeNames.push(routeName);
            results[routeName] = {};
          }
          results[routeName].route = route;
        });

        //process stops
        forEach(stops, function(stop) {
          stopAttr = stop.attributes;
          if (indexOf(routeNames, (routeName = stopAttr.RouteName || _nullRouteName)) === -1) {
            routeNames.push(routeName);
            results[routeName] = {};
          }
          if (routeName !== _nullRouteName) {
            allNullStops = false;
          }
          if (results[routeName].stops === undefined) {
            results[routeName].stops = [];
          }
          results[routeName].stops.push(stop);
        });

        if (stops.length > 0 && allNullStops === true) {
          results[routeNames[0]].stops = results[_nullRouteName].stops;
          delete results[_nullRouteName];
          routeNames.splice(array.indexOf(routeNames, _nullRouteName), 1);
        }

        //convert json results into RouteResult objects
        var routeResults = [];
        forEach(routeNames, function(routeName, i) {
          results[routeName].routeName = routeName === _nullRouteName ? null : routeName;
          results[routeName].spatialReference = sr;

          routeResults.push(RouteResult.fromJSON(results[routeName]));
        });

        //        //create barriers array
        //        forEach(barriers, function(barrier, i) {
        //          barriers[i] = new esri.Graphic(barrier);
        //        });

        // anonymous function to create barriers of all kind
        var barriersFunc = function(barrs) {
          forEach(barrs, function(barr, i) {
            if (barr.geometry) {
              barr.geometry.spatialReference = sr;
            }

            barrs[i] = Graphic.fromJSON(barr);
          });
          return barrs;
        };

        //create message array
        forEach(messages, function(message, i) {
          messages[i] = NAMessage.fromJSON(message);
        });

        return {
          routeResults: routeResults,
          barriers: barriersFunc(barriers),
          polygonBarriers: barriersFunc(polygonBarriers),
          polylineBarriers: barriersFunc(polylineBarriers),
          messages: messages
        };
      }

    });

  normalizeUtils._createWrappers(RouteTask);

  return RouteTask;

});
