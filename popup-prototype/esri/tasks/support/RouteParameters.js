/**
 * Input parameters for {@link module:esri/tasks/RouteTask}. Specifies details such as
 * stop locations, barrier locations, the impedance attribute, etc.
 *
 * @module esri/tasks/support/RouteParameters
 * @since 4.0
 * @see module:esri/tasks/RouteTask
 * @see module:esri/tasks/support/RouteResult
 * @see https://developers.arcgis.com/en/features/directions/
 */

/**
 * @typedef {Object} AttributeParamValue - An object describing the parameter values for the 
 * [attributeParameterValues](#attributeParameterValues) property of 
 * {@link module:esri/tasks/support/RouteParameters}.
 * 
 * @property {string} attributeName - The name of the attribute.
 * @property {string} parameterName - The name of the parameter.
 * @property {string} value - The parameter's value.
 */
define(
[
  "../../core/declare",

  "../../core/Accessor",
  "../../core/lang",

  "../../geometry/support/graphicsUtils",

  "./NATypes"
],
function(
  declare, Accessor, esriLang,
  graphicsUtils,
  NATypes
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/RouteParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var RouteParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/RouteParameters.prototype */
  {

    declaredClass: "esri.tasks.RouteParameters",
    
    /**
    * The list of network attribute names to be accumulated with the analysis (i.e. which attributes should be returned as part of the response). 
    * The default is as defined in the specific routing network layer used in your {@link module:esri/tasks/RouteTask}. You can specify 
    * any attribute names listed in the Service Directory under `Network Dataset -> Network Attributes` as `Usage Type: esriNAUTCost`. See also 
    * [Understanding the network attribute](http://resources.arcgis.com/en/help/main/10.2/index.html#//00470000000m000000).
    * 
    * @type {string[]}
    */
    accumulateAttributes: null,

    /**
    * Each element in the array is an object that describes the parameter values. 
    * 
    * @type {module:esri/tasks/support/RouteParameters~AttributeParamValue}
    */  
    attributeParameterValues: null,

    /**
    * The set of point barriers loaded as network locations during analysis. At ArcGIS Server 10.1 
    * an optional url property was added. Use this property to specify a REST query request to a Feature, 
    * Map or GP Service that returns a JSON feature set. The url property 
    * can be specified using {@link module:esri/tasks/support/DataFile}. 
    * Note that either the features or url property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */  
    barriers: null,

    /**
    * The language used when computing directions. The default is as defined in the 
    * specific routing network layer used in your {@link module:esri/tasks/RouteTask}. 
    * By default, NAServer gets installed with `en_US` only - it is up to the server administrator 
    * to add additional languages.
    * 
    * @type {string}
    */  
    directionsLanguage: null,

    /**
    * The length units to use when computing directions. The default is as defined in the specific 
    * routing network layer used in your {@link module:esri/tasks/RouteTask}.
    * 
    * **Known Values:** esriFeet | esriKilometers | esriMeters | esriMiles | esriNauticalMiles | esriYards
    * 
    * @type {string}
    */    
    directionsLengthUnits: null,

    /**
    * Defines the amount of direction information returned.
    * 
    * **Known Values:** complete | complete-no-events | instructions-only | standard | summary-only
    * 
    * @type {string}
    * @default standard
    */  
    directionsOutputType: null,
      
    /**
    * The style to be used when returning directions. The default will be as defined in the 
    * network layer. View the REST layer description for your network service to see a list 
    * of supported styles. 
    * 
    * @type {string}
    */ 
    directionsStyleName: null,

    /**
    * The name of network attribute to use for the drive time when computing directions. 
    * The default is as defined in the specific routing network layer used in your 
    * {@link module:esri/tasks/RouteTask}. 
    * 
    * @type {string}
    */   
    directionsTimeAttribute: null,

    /**
    * If `true`, avoids network elements restricted by barriers or restrictions 
    * specified in [restrictionAttributes](#restrictionAttributes).
    * 
    * @type {boolean}
    * @default
    */   
    doNotLocateOnRestrictedElements: true,

    /**
    * The {@link module:esri/tasks/RouteTask} can help you find the most efficient path for 
    * visiting a given list of stops. This is sometimes known as the "traveling salesperson" problem. 
    * When the `findBestSequence = true`, the route solver is solving the Traveling Salesperson 
    * problem by computing the optimal sequence to visit the stops. As this is a combinatorial 
    * problem, we employ heuristics to solve this in a reasonable time. The heuristics do not 
    * guarantee the optimal sequence (as there is no good/fast way to prove optimality for large
    * number of stops). It returns a solution that is close to optimal if not the optimal. 
    * The heuristic performs favorably when tested with known TSP benchmarks available in the OR 
    * research community. For these stops to be visited in the most efficient way, specify the 
    * following parameters:
    * ```
    * routeParams.findBestSequence = true;
    * routeParams.preserveFirstStop = false;
    * routeParams.preserveLastStop = false;
    * routeParams.returnStops = true;
    * ```
    * 
    * @type {boolean}
    */   
    findBestSequence: null,

    /**
    * In routes where a stop is not located on a network or a stop could not be reached, the results
    * will differ depending on the value of this property:
    * * When `false`, the solve operation will fail if at least one of the stops specified cannot be located or reached.
    * * When `true`, as long as there are at least two valid stops that have been connected by a route, a valid result is returned. 
    * If multiple routes are processed in a single request, as long as least one route is built, a valid result is returned.
    * 
    * @type {boolean}
    */   
    ignoreInvalidLocations: null,

    /**
    * The network attribute name to be used as the impedance attribute in the analysis. The 
    * default is as defined in the specific routing network layer used in your 
    * {@link module:esri/tasks/RouteTask}. You can specify any attribute names listed in the 
    * Service Directory under `Network Dataset -> Network Attributes` as `Usage Type: esriNAUTCost`. 
    * You can also specify a value of `none` to indicate that no network attributes should 
    * be used for impedance. If you specify an empty array, it will default to the default of the service. 
    * 
    * For example, set `impedanceAttribute = "Time"` for the quickest route and 
    * `impedanceAttribute = "Length"` for shortest drive, assuming the service has 
    * those two esriNAUTCost attributes. 
    * 
    * For more information, see [Understanding the network attribute](http://resources.arcgis.com/en/help/main/10.2/index.html#//00470000000m000000). 
    * 
    * @type {string}
    */  
    impedanceAttribute: null,

    /**
    * The type of output lines to be generated in the result. The default is as defined 
    * in the specific routing network layer used in your {@link module:esri/tasks/RouteTask}.
    * 
    * **Known Values:** esriNAOutputLineNone | esriNAOutputLineStraight | 
    * esriNAOutputLineTrueShape | esriNAOutputLineTrueShapeWithMeasure
    * 
    * @type {string}
    * @default
    */   
    outputLines: "esriNAOutputLineTrueShape",

    /**
    * The precision of the output geometry after generalization. If `0`, no generalization 
    * of output geometry is performed. If present and positive, it represents the `MaximumAllowableOffset` 
    * parameter and generalization is performed according to `IPolycurve.Generalize`.
    * 
    * @type {number}
    */   
    outputGeometryPrecision: null,

    /**
    * The units of the output geometry precision.
    * 
    * **Known values:** esriUnknownUnits | esriCentimeters | esriDecimalDegrees | esriDecimeters | esriFeet | esriInches | esriKilometers | 
    * esriMeters | esriMiles | esriMillimeters | esriNauticalMiles | esriPoints | esriYards
    * 
    * @type {string}
    * @default esriUnknownUnits
    */   
    outputGeometryPrecisionUnits: null,

    /**
    * The well-known ID of the spatial reference for the geometries returned with the analysis results. 
    * If not specified, the geometries are returned in the spatial reference of the map.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */   
    outSpatialReference: null,

    /**
    * The set of polygon barriers loaded as network locations during analysis. At ArcGIS Server 10.1, 
    * an optional `url` property was added. Use this property to specify a REST query request to a Feature,
    * Map or GP Service that returns a JSON feature set. The url property can be 
    * specified using {@link module:esri/tasks/support/DataFile}. Note that either the `features` or 
    * `url` property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */  
    polygonBarriers: null,

    /**
    * The set of polyline barriers loaded as network locations during analysis. At ArcGIS Server 10.1, 
    * an optional `url` property was added. Use this property to specify a REST query request to a Feature, 
    * Map or GP Service that returns a JSON feature set. The url property can be 
    * specified using {@link module:esri/tasks/support/DataFile}. Note that either the `features` or 
    * `url` property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */  
    polylineBarriers: null,

    /**
    * If `true`, keeps the first stop fixed in the sequence even when `findBestSequence = true`. 
    * Only applicable if `findBestSequence = true`. The default is as defined in the specific routing 
    * network layer used in your {@link module:esri/tasks/RouteTask}.
    * 
    * @type {boolean}
    */  
    preserveFirstStop: null,

    /**
    * If `true`, keeps the last stop fixed in the sequence even when `findBestSequence = true`. 
    * Only applicable if `findBestSequence = true`. The default is as defined in the specific 
    * routing network layer used in your {@link module:esri/tasks/RouteTask}.
    * 
    * @type {boolean}
    */   
    preserveLastStop: null,

    /**
    * The list of network attribute names to be used as restrictions with the analysis. 
    * The default is as defined in the specific routing network layer used in your 
    * {@link module:esri/tasks/RouteTask}. Possible values are listed in the Service Directory under 
    * `Network Dataset -> Network Attributes`. You can also specify a value of `none` to indicate that 
    * no network attributes should be used as restrictions. If you specify an empty array, 
    * it will default to the default of the service.
    * 
    * @type {string[]}
    */   
    restrictionAttributes: null,

    /**
    * Specifies how U-Turns should be handled. The default is as defined in the specific 
    * routing network layer used in your {@link module:esri/tasks/RouteTask}.
    * 
    * **Known Values:** esriNFSBAllowBacktrack | esriNFSBAtDeadEndsOnly | 
    * esriNFSBNoBacktrack | esriNFSBAtDeadEndsAndIntersections
    * 
    * @type {string}
    * @see [doNotLocateOnRestrictedElements](#doNotLocateOnRestrictedElements)
    */  
    restrictUTurns: null,

    /**
    * If `true`, barriers are returned with the {@link module:esri/tasks/support/RouteResult}.
    * 
    * @type {boolean}
    * @default false
    */   
    returnBarriers: false,

    /**
    * If `true`, barriers are returned in the {@link module:esri/tasks/support/RouteResult#directions directions property of each RouteResult}.
    * 
    * @type {boolean}
    * @default false
    */     
    returnDirections: false,

    /**
    * If `true`, polygon barriers are returned in the {@link module:esri/tasks/support/RouteResult}.
    * 
    * @type {boolean}
    * @default false
    */
    returnPolygonBarriers: false,

    /**
    * If `true`, polyline barriers are returned in the {@link module:esri/tasks/support/RouteResult}.
    * 
    * @type {boolean}
    * @default false
    */  
    returnPolylineBarriers: false,

    /**
    * If `true`, routes are generated and returned in the route property of each {@link module:esri/tasks/support/RouteResult}.
    * 
    * @type {boolean}
    * @default
    */  
    returnRoutes: true,

    /**
    * If `true`, stops are returned in the stops property of each {@link module:esri/tasks/support/RouteResult}.
    * 
    * @type {boolean}
    * @default false
    */  
    returnStops: false,

    /**
    * If `true`, `z` values are returned in the {@link module:esri/tasks/support/RouteResult}.
    * 
    * @type {boolean}
    * @default
    */  
    returnZ: true,

    /**
    * The time the route begins. If not specified, the default is the time specified in the route service.
    * 
    * @type {Date}
    */    
    startTime: null,

    /**
    * If `true`, the start time will be in UTC format.
    * 
    * @type {boolean}
    */   
    startTimeIsUTC: null,

    /**
    * The set of stops loaded as network locations during analysis. When `stops` takes a FeatureSet, 
    * each feature in the FeatureSet must have a defined spatial reference. If the feature contains 
    * `x` and `y` attributes, those values are used for the stop, even if the feature includes geometry.
    * 
    * At ArcGIS Server 10.1 an optional `url` property was added. Use this property to specify a REST 
    * query request to a Feature, Map or GP Service that returns a JSON feature set. The `url` property 
    * can be specified using DataFile Note that either the features or url property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */   
    stops: null,

    /**
    * If `true`, the hierarchy attribute for the network should be used in analysis. The default is 
    * as defined in the specific routing network layer used in your {@link module:esri/tasks/RouteTask}.
    * 
    * @type {boolean}
    */   
    useHierarchy: null,

    /**
    * A useful feature of the {@link module:esri/tasks/RouteTask} is the ability to constrain stop visits 
    * to certain times of day, or "time windows". If you were required to deliver orders to four homes and 
    * each customer was available during a limited time period during the day, the route task could help you 
    * find the most efficient path for making all the deliveries.
    * 
    * Time windows are treated as a "soft" constraint. This means that although the solver attempts to honor 
    * time windows, if necessary, it will violate the time windows of some stops in order to reach them. 
    * Remember, the stops will be visited in the order they were added unless you set `RouteParameters.findBestSequence = true`.
    * 
    * @type {boolean}
    */  
    useTimeWindows: null,

    travelMode: null,

    toJson: function(normalized) {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON(normalized);
    },

    toJSON: function(normalized) {
      var json = {
                    returnDirections: this.returnDirections,
                    returnRoutes: this.returnRoutes,
                    returnZ: this.returnZ,
                    returnStops: this.returnStops,
                    returnBarriers: this.returnBarriers,
                    returnPolygonBarriers: this.returnPolygonBarriers,
                    returnPolylineBarriers: this.returnPolylineBarriers,
                    attributeParameterValues: this.attributeParameterValues && JSON.stringify(this.attributeParameterValues),
                    outSR: this.outSpatialReference ? (this.outSpatialReference.wkid || JSON.stringify(this.outSpatialReference.toJSON()))  : null,
                    outputLines: this.outputLines,
                    findBestSequence: this.findBestSequence,
                    preserveFirstStop: this.preserveFirstStop,
                    preserveLastStop: this.preserveLastStop,
                    useTimeWindows: this.useTimeWindows,
                    startTime: this.startTime ? this.startTime.getTime() : null,
                    startTimeIsUTC: this.startTimeIsUTC,
                    accumulateAttributeNames: this.accumulateAttributes ? this.accumulateAttributes.join(",") : null,
                    ignoreInvalidLocations: this.ignoreInvalidLocations,
                    impedanceAttributeName: this.impedanceAttribute,
                    restrictionAttributeNames: this.restrictionAttributes ? this.restrictionAttributes.join(",") : null,
                    restrictUTurns: this.restrictUTurns,
                    useHierarchy: this.useHierarchy,
                    directionsLanguage: this.directionsLanguage,
                    outputGeometryPrecision: this.outputGeometryPrecision,
                    outputGeometryPrecisionUnits: this.outputGeometryPrecisionUnits,
                    directionsLengthUnits: NATypes.LengthUnit[this.directionsLengthUnits],
                    directionsTimeAttributeName: this.directionsTimeAttribute,
                    directionsStyleName: this.directionsStyleName,
                    travelMode: this.travelMode
                  },
          stops = this.stops;
      
      if (stops.declaredClass === "esri.tasks.FeatureSet" && stops.features.length > 0) {
        json.stops = JSON.stringify({
          type:"features", 
          features:graphicsUtils._encodeGraphics(stops.features, normalized && normalized["stops.features"]), 
          doNotLocateOnRestrictedElements:this.doNotLocateOnRestrictedElements 
        });
      }
      else if (stops.declaredClass === "esri.tasks.DataLayer") {
        json.stops = stops;
      }
      else if (stops.declaredClass === "esri.tasks.DataFile") {
        json.stops = JSON.stringify({
          type: "features",
          url: stops.url,
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      
      if (this.directionsOutputType) {
        switch (this.directionsOutputType.toLowerCase()) {
        case "complete":
          json.directionsOutputType = "esriDOTComplete";
          break;
        case "complete-no-events":
          json.directionsOutputType = "esriDOTCompleteNoEvents";
          break;
        case "instructions-only":
          json.directionsOutputType = "esriDOTInstructionsOnly";
          break;
        case "standard":
          json.directionsOutputType = "esriDOTStandard";
          break;
        case "summary-only":
          json.directionsOutputType = "esriDOTSummaryOnly";
          break;
        default:
          json.directionsOutputType = this.directionsOutputType;
        }
      }
      
      // anonymous function to process barriers of all kind
      var barriersFunc = function(barrs, paramName) {
        if (!barrs) {
          return null;
        }
        
        if (barrs.declaredClass === "esri.tasks.FeatureSet") {
          if (barrs.features.length > 0) {
            return JSON.stringify({
              type:"features", 
              features:graphicsUtils._encodeGraphics(barrs.features, normalized && normalized[paramName]) 
            });
          }
          else {
            return null;
          }
        }
        else if (barrs.declaredClass === "esri.tasks.DataLayer") {
          return barrs;
        }
        else if (barrs.declaredClass === "esri.tasks.DataFile") {
          return JSON.stringify({
            type: "features",
            url: barrs.url
          });
        }
        return JSON.stringify(barrs);
      };
      
      if (this.barriers) {
        json.barriers = barriersFunc(this.barriers, "barriers.features");
      }
      if (this.polygonBarriers) {
        json.polygonBarriers = barriersFunc(this.polygonBarriers, "polygonBarriers.features");
      }
      if (this.polylineBarriers) {
        json.polylineBarriers = barriersFunc(this.polylineBarriers, "polylineBarriers.features");
      }
      
      return esriLang.filter(json, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }

  });

  return RouteParameters;
});
