/**
 * The result from {@link module:esri/tasks/ClosestFacilityTask}. 
 * 
 * ::: esri-md class="panel trailer-1"
 * ClosestFacilitySolveResult, and other closest facility related classes require a "closest facility" layer. 
 * A closest facility layer is a layer of type `esriNAServerClosestFacilityLayer`.
 * :::
 * 
 * @since 4.0
 * @module esri/tasks/support/ClosestFacilitySolveResult
 * @noconstructor
 * @see module:esri/tasks/ClosestFacilityTask
 * @see module:esri/tasks/support/ClosestFacilityParameters
 */
define(
[
  "dojo/_base/array",

  "../../Graphic",

  "../../core/JSONSupport",

  "../../geometry/SpatialReference",

  "./DirectionsFeatureSet",
  "./NAMessage"
],
function(
  array,
  Graphic,
  JSONSupport,
  SpatialReference,
  DirectionsFeatureSet, NAMessage
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/ClosestFacilitySolveResult
   */
  var CFResult = JSONSupport.createSubclass(
  /** @lends module:esri/tasks/support/ClosestFacilitySolveResult.prototype */
  {

    declaredClass: "esri.tasks.ClosestFacilitySolveResult",

    /**
    * An array of directions. A direction is an instance of 
    * {@link module:esri/tasks/support/DirectionsFeatureSet DirectionsFeatureSet}. Route directions are returned 
    * if `returnDirections = true` (default is false).
    * @type {module:esri/tasks/support/DirectionsFeatureSet}
    */
    directions: null,

    _directionsReader: function(value) {
      return value.map(function(dfs) {
        return DirectionsFeatureSet.fromJSON(dfs);
      });
    },

    /**
    * An array of points representing facilities. Only returned when `ClosestFacilityParameters.returnFacilities = true`.
    * @type {module:esri/geometry/Point[]}
    */
    facilities: null,

    _facilitiesReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * An array of points representing incidents. Only returned when `ClosestFacilityParameters.returnIncidents = true`.
    * @type {module:esri/geometry/Point[]}
    */
    incidents: null,

    _incidentsReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * Message received when the solve is complete. If a closest facility cannot be solved, the message returned 
    * by the server identifies the incident that could not be solved.
    * @type {module:esri/tasks/support/NAMessage[]}
    */
    messages: null,

    _messagesReader: function(value) {
      return value && array.map(value, function(message) {
          return NAMessage.fromJSON(message);
        });
    },

    /**
    * The point barriers are an array of points. They are returned only if `ClosestFacilityParameters.returnPointBarriers`
    * was set to `true` (which is not the default). If you send in the point barriers as a FeatureSet (instead of using
    * DataLayer), you already have the barriers and might not need to request them back from the server.
    * @type {module:esri/geometry/Point[]}
    */
    pointBarriers: null,

    _pointBarriersReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * The polyline barriers are an array of polylines. They are returned only if `ClosestFacilityParameters.returnPolylineBarriers`
    * was set to `true` (which is not the default). If you send in the polyline barriers as a FeatureSet (instead of using
    * DataLayer), you already have the barriers and might not need to request them back from the server.
    * @type {module:esri/geometry/Polyline[]}
    */
    polylineBarriers: null,

    _polylineBarriersReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * The polygon barriers are an array of polygons. They are returned only if `ClosestFacilityParameters.returnPolygonBarriers`
    * was set to `true` (which is not the default). If you send in the polygon barriers as a FeatureSet (instead of using
    * DataLayer), you already have the barriers and might not need to request them back from the server.
    * @type {module:esri/geometry/Polygon[]}
    */
    polygonBarriers: null,

    _polygonBarriersReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * The array of routes. Route graphics are returned if `returnRoutes = true` and `outputLines` does not equal
    * `esriNAOutputLineNone`. From version 2.0 to 2.5 the type is an array of Polylines. At version 2.6 the 
    * type is an array of Graphics.
    * @type {module:esri/Graphic[]}
    * @example
    * require([
    *   "esri/layers/GraphicsLayer", "esri/tasks/ClosestFacilityTask", "dojo/_base/array", ... 
    * ], function(GraphicsLayer, ClosestFacilityTask, array, ... ) {
    *   var routeGraphicLayer = new GraphicsLayer( ... );
    *   var closestFacilityTask = new ClosestFacilityTask();
    *   closestFacilityTask.solve(params).then(function(solveResult){
    *     array.forEach(solveResult.routes, function(route, index){
    *       routeGraphicLayer.add(route);
    *     });
    *     ...
    *   });
    * });
    */
    routes: null,

    _routesReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    _graphicsFromJson: function(json) {
      var sr = SpatialReference.fromJSON(json.spatialReference);

      return array.map(json.features, function(feature) {
        var graphic = Graphic.fromJSON(feature);
        graphic.geometry.set("spatialReference", sr);
        return graphic;
      });
    }

  });

  return CFResult;
});
