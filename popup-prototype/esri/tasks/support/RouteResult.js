/**
 * The result from {@link module:esri/tasks/RouteTask}. The RouteResult properties are
 * dependent on the {@link module:esri/tasks/support/RouteParameters} inputs. For example,
 * directions are only returned if 
 * {@link module:esri/tasks/support/RouteParameters#returnDirections RouteParameters.returnDirections}
 * is set to `true`.
 *
 * @module esri/tasks/support/RouteResult
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/RouteTask
 * @see module:esri/tasks/support/RouteParameters
 * @see https://developers.arcgis.com/en/features/directions/
 */
define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../Graphic",

  "../../core/JSONSupport",

  "./DirectionsFeatureSet"
],
function(
  declare, array,
  Graphic,
  JSONSupport,
  DirectionsFeatureSet
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/RouteResult
   */
  var RouteResult = declare(JSONSupport,
  /** @lends module:esri/tasks/support/RouteResult.prototype */
  {

    declaredClass: "esri.tasks.RouteResult",

    /**
    * Route directions are returned if `RouteParameters.returnDirections = true`.
    * 
    * @type {module:esri/tasks/support/DirectionsFeatureSet}
    * @see {@link module:esri/tasks/support/RouteParameters#returnDirections RouteParameters.returnDirections}
    */
    directions: null,

    _directionsReader: function(value) {
      return DirectionsFeatureSet.fromJSON(value);
    },

    /**
    * The Route graphic that is returned if `RouteParameters.returnRoutes = true`.
    * 
    * @type {module:esri/Graphic}
    * @see {@link module:esri/tasks/support/RouteParameters#returnRoutes RouteParameters.returnRoutes}
    */  
    route: null,

    _routeReader: function(value, source) {
      if (value.geometry) {
        value.geometry.spatialReference = source.spatialReference;
      }

      return Graphic.fromJSON(value);
    },

    /**
    * The name of the route.
    * 
    * @type {string}
    */  
    routeName: null,

    /**
    * Array of stops. Returned only if `RouteParameters.returnStops = true`.
    * 
    * @type {module:esri/Graphic[]}
    * @see {@link module:esri/tasks/support/RouteParameters#returnStops RouteParameters.returnStops}
    */   
    stops: null,

    _stopsReader: function(value, source) {
      var stops = [],
          sr = source.spatialReference;

      array.forEach(value, function(stop) {
        if (stop.geometry) {
          stop.geometry.spatialReference = sr;
        }

        stops[stop.attributes.Sequence - 1] = Graphic.fromJSON(stop);
      });

      return stops;
    }

  });

  return RouteResult;
});
