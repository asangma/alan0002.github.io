/**
 * The result from {@link module:esri/tasks/ServiceAreaTask}. 
 * 
 * ::: esri-md class="panel trailer-1"
 * ServiceAreaSolveResult, and other service area related classes, requires a service area layer. 
 * A service area layer is a layer of type `esriNAServerServiceAreaLayer`.
 * :::
 *
 * @module esri/tasks/support/ServiceAreaSolveResult
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/ServiceAreaTask
 * @see module:esri/tasks/support/ServiceAreaParameters
 * @see [Solve Service Area - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000pp000000)
 */
define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../Graphic",

  "../../core/JSONSupport",

  "../../geometry/SpatialReference",

  "./NAMessage"
],
function(
  declare, array,
  Graphic,
  JSONSupport,
  SpatialReference,
  NAMessage
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/ServiceAreaSolveResult
   */
  var ServiceAreaSolveResult = declare(JSONSupport,
  /** @lends module:esri/tasks/support/ServiceAreaSolveResult.prototype */
  {

    declaredClass: "esri.tasks.ServiceAreaSolveResult",

    classMetadata: {
      reader: {
        add: [
          "serviceAreaPolygons",
          "serviceAreaPolygons"
        ],
        exclude: [
          "saPolygons",
          "saPolylines"
        ]
      }
    },

    /**
    * Array of points only returned if `ServiceAreaParameters.returnFacilities = true`.
    * 
    * @type {module:esri/geometry/Point[]}
    * @see {@link module:esri/tasks/support/ServiceAreaParameters#returnFacilities ServiceAreaParameters.returnFacilities}
    */
    facilities: null,

    _facilitiesReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * Message received when solve is completed. If a service area cannot be solved, 
    * the message returned by the server identifies the incident that could not be solved.
    * 
    * @type {module:esri/tasks/support/NAMessage[]}
    */  
    messages:null,

    _messagesReader: function(value) {
      return value && array.map(value, function(message) {
          return NAMessage.fromJSON(message);
        });
    },

    /**
    * The point barriers are returned only if `ServiceAreaParameters.returnPointBarriers = true` 
    * (which is not the default). If you send in the point barriers as a 
    * {@link module:esri/tasks/support/FeatureSet} (instead of using
    * {@link module:esri/tasks/support/DataLayer}), you already have the barriers and might not need to 
    * request them back from the server.
    * 
    * @type {module:esri/geometry/Point[]}
    * @see {@link module:esri/tasks/support/ServiceAreaParameters#returnPointBarriers ServiceAreaParameters.returnPointBarriers}
    */   
    pointBarriers: null,

    _pointBarriersReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * The polyline barriers are returned only if `ServiceAreaParameters.returnPolylineBarriers = true` 
    * (which is not the default). If you send in the polyline barriers as a 
    * {@link module:esri/tasks/support/FeatureSet} (instead of using 
    * {@link module:esri/tasks/support/DataLayer}), you already have the barriers and might 
    * not need to request them back from the server.
    * 
    * @type {module:esri/geometry/Polyline[]}
    * @see {@link module:esri/tasks/support/ServiceAreaParameters#returnPolylineBarriers ServiceAreaParameters.returnPolylineBarriers}
    */  
    polylineBarriers: null,

    _polylineBarriersReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * The polygon barriers are returned only if `ServiceAreaParameters.returnPolygonBarriers = true` 
    * (which is not the default). If you send in the polygon barriers as a 
    * {@link module:esri/tasks/support/FeatureSet} (instead of using 
    * {@link module:esri/tasks/support/DataLayer}), you already have the barriers and might 
    * not need to request them back from the server.
    * 
    * @type {module:esri/geometry/Polygon[]}
    * @see {@link module:esri/tasks/support/ServiceAreaParameters#returnPolygonBarriers ServiceAreaParameters.returnPolygonBarriers}
    */   
    polygonBarriers: null,

    _polygonBarriersReader: function(value) {
      return value && this._graphicsFromJson(value);
    },

    /**
    * An array of service area polyline graphics.
    * 
    * @type {module:esri/Graphic[]}
    */  
    serviceAreaPolylines: null,

    _serviceAreaPolylinesReader: function(value, source) {
      return this._graphicsFromJson(source.saPolylines);
    },

    /**
    * An array of service area polygon graphics.
    * 
    * @type {module:esri/Graphic[]}
    */  
    serviceAreaPolygons: null,

    _serviceAreaPolygonsReader: function(value, source) {
      return this._graphicsFromJson(source.saPolygons);
    },

    _graphicsFromJson : function(json){
      if(!json) {
        return null;
      }
      var sr = SpatialReference.fromJSON(json.spatialReference),
          features = json.features;

      return array.map(features, function(feature) {
        var graphic = Graphic.fromJSON(feature);
        graphic.geometry.set("spatialReference", sr);
        return graphic;
      });
    }

  });

  return ServiceAreaSolveResult;
});
