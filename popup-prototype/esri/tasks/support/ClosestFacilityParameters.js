/**
 * Input parameters for {@link module:esri/tasks/ClosestFacilityTask}.
 * 
 * ::: esri-md class="panel trailer-1"
 * ClosestFacilityParameters, and other closest facility related classes require a "closest facility" layer. 
 * A closest facility layer is a layer of type `esriNAServerClosestFacilityLayer`.
 * :::
 * 
 * @since 4.0
 * @module esri/tasks/support/ClosestFacilityParameters
 * @see module:esri/tasks/ClosestFacilityTask
 * @see module:esri/tasks/support/ClosestFacilitySolveResult
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
   * @constructor module:esri/tasks/support/ClosestFacilityParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * 
   * @example
   * require([
   *   "esri/tasks/support/ClosestFacilityParameters", "esri/tasks/ClosestFacilityTask", ... 
   * ], function(ClosestFacilityParameters, ClosestFacilityTask, ... ) {
   *   var closestFacilityTask = new ClosestFacilityTask( ... );  //enter task url here
   *   var params = new ClosestFacilityParameters({
   *     defaultCutoff: 3.0,
   *     returnIncidents: false,
   *     returnRoutes: true,
   *     returnDirections: true
   *   });
   *   closestFacilityTask.solve(params).then(function(solveResult){
   *     //solveResult contains the result of the task
   *   });  
   * });
   */
  var CFParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/ClosestFacilityParameters.prototype */
  {

    declaredClass: "esri.tasks.ClosestFacilityParameters",
  
    /**
    * The list of network attribute names to be accumulated with the analysis, i.e., which attributes 
    * should be returned as part of the response.
    * @type {string[]}
    */
    accumulateAttributes: null,

    /**
    * An array of attribute parameter values that determine which network elements can be used by a vehicle. View
    * the object specifications below for properties of the individual objects in this array.
    * 
    * @property {string} attributeName - The name of the attribute.
    * @property {string} parameterName - The parameter name.
    * @property {string} value - The parameter value.
    *                       
    * @type {Object[]}
    */
    attributeParameterValues: null,

    /**
    * The cutoff value used to determine when to stop traversing.
    * @type {number}
    */
    defaultCutoff: null,

    /**
    * The number of facilities to find.
    * @type {number}
    */
    defaultTargetFacilityCount: null,

    /**
    * The language used when computing directions. If not specified the task will use the language defined 
    * in the network layer used by the RouteTask. The default language defined by the NAServer is `en_US`. The 
    * server administrator is responsible for adding additional languages.
    * @type {string}
    */
    directionsLanguage: null,

    /**
    * The length units used when computing directions. If not specified the task will use the value defined by 
    * the routing network layer is used.
    *
    * **Known Values:** esriFeet | esriKilometers | esriMeters | esriMiles | esriNauticalMiles | esriYards
    * @type {string}
    */
    directionsLengthUnits: null,

    /**
    * Defines the amount of direction information returned. The default value is standard.
    *
    * **Known Values:** complete | complete-no-events | instructions-only | standard | summary-only
    * @type {string}
    */
    directionsOutputType: null,

    /**
    * The style to be used when returning directions. The default will be as defined in the network layer. 
    * View the REST layer description for your network service to see a list of supported styles.  
    * @type {string}
    */
    directionsStyleName: null,

    /**
    * The name of the attribute field that contains the drive time values. If not specified, the task will use
    * the attribute field defined by the routing network layer.  
    * @type {string}
    */
    directionsTimeAttribute: null,

    /**
    * When `true`, restricted network elements should be considered when finding network locations.
    * @type {boolean}
    * @default
    */
    doNotLocateOnRestrictedElements: true,

    /**
    * The set of facilities loaded as network locations during analysis. These can be specified as either a
    * {@link module:esri/tasks/support/DataLayer DataLayer} or a {@link module:esri/tasks/support/FeatureSet FeatureSet}.
    *
    * At ArcGIS Server 10.1 an optional `url` property was added. Use this property to specify a REST query request to 
    * a Feature, Map or GP Service that returns a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile DataFile}. Either the features or url  property should be specified. 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    * @example
    * require([
    *   "esri/layers/GraphicsLayer", "esri/tasks/support/FeatureSet", "esri/tasks/suppot/DataFile", ... 
    * ], function(GraphicsLayer, FeatureSet, DataFile, ... ) {
    *   var facilitiesGraphicsLayer = new GraphicsLayer();
    * 
    *   //Specify facilities using a FeatureSet
    *   var facilities = new FeatureSet();
    *   facilities.features = facilitiesGraphicsLayer.graphics;
    * 
    *   //Requires ArcGIS Server 10.1 or greater
    *   var networkServiceUrl = 'http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/MapServer/';
    *   params.facilities = new DataFile({
    *     url: networkServiceUrl + "3/query?where=1%3D1&returnGeometry=true&outFields=*&f=json"
    *   });
    *   ...
    * });
    */
    facilities: null,

    /**
    * The network attribute field name used as the impedance attribute during analysis. If not specified 
    * the default value defined by the routing network layer.
    * 
    * Valid values include any attribute name listed in the Service Directory under Network Dataset > Network 
    * Attributes with a Usage Type of `esriNauTCost`. Specify none to indicate that no network attributes should 
    * be used for impedance. If you specify an empty string the default value defined by the service will be used. 
    * See the [Understanding the network attribute](http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=welcome)
    * help topic for more details.
    * 
    * @type {string}
    */
    impedanceAttribute: null,

    /**
    * The set of incidents loaded as network locations during analysis. Can be an instance of 
    * {@link module:esri/tasks/support/DataLayer DataLayer} or {@link module:esri/tasks/support/FeatureSet FeatureSet}.
    * At ArcGIS Server 10.1 an optional `url` property was added. Use this property to specify a REST query request to a
    * Feature, Map or GP Service that returns a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile DataFile}. Either the features or url property should be specified. 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */
    incidents: null,

    /**
    * The output geometry precision. When `0`, no generalization of the output geometry is performed. Positive 
    * values represent the `MaximumAllowableOffset` parameter used by generalize. 
    * @type {number}
    */
    outputGeometryPrecision: null,

    /**
    * The units of the output geometry precision.
    * @type {string}
    * @default esriUnknownUnits
    */
    outputGeometryPrecisionUnits: null,

    /**
    * The type of output lines to be generated in the result. The default is defined in the specific routing 
    * network layer used in your RouteTask. See {@link module:esri/tasks/support/NATypes NAOutputLine} for a list 
    * of valid values.
    * @type {string}
    */
    outputLines: null,

    /**
    * The well-known id of the spatial reference or the spatial reference object for the geometries returned 
    * with the analysis results. If `outSpatialReference` is not specified, the geometries are returned in 
    * the spatial reference of the map.  
    * @type {module:esri/geometry/SpatialReference | string}
    */
    outSpatialReference: null,

    /**
    * The set of point barriers loaded as network locations during analysis. Can be an instance of 
    * {@link module:esri/tasks/support/DataLayer DataLayer} or {@link module:esri/tasks/support/FeatureSet FeatureSet}.
    * At ArcGIS Server 10.1 an optional `url` property was added. Use this property to specify a REST query request to a
    * Feature, Map or GP Service that returns a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile DataFile}. Either the features or url property should be specified. 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */
    pointBarriers: null,

    /**
    * The set of polygon barriers loaded as network locations during analysis. Can be an instance of 
    * {@link module:esri/tasks/support/DataLayer DataLayer} or {@link module:esri/tasks/support/FeatureSet FeatureSet}.
    * At ArcGIS Server 10.1 an optional `url` property was added. Use this property to specify a REST query request to a
    * Feature, Map or GP Service that returns a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile DataFile}. Either the features or url property should be specified. 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */
    polygonBarriers: null,

    /**
    * The set of polyline barriers loaded as network locations during analysis. Can be an instance of 
    * {@link module:esri/tasks/support/DataLayer DataLayer} or {@link module:esri/tasks/support/FeatureSet FeatureSet}.
    * At ArcGIS Server 10.1 an optional `url` property was added. Use this property to specify a REST query request to a
    * Feature, Map or GP Service that returns a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile DataFile}. Either the features or url property should be specified. 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */
    polylineBarriers: null,

    /**
    * The list of network attribute names to be used as restrictions with the analysis. The default is as defined 
    * in the specific routing network layer used in your RouteTask. Possible values are listed in the Service Directory
    * under Network Dataset > Network Attributes. You can also specify a value of none to indicate that no network
    * attributes should be used as restrictions. If you specify an empty array, it will default to the default of the
    * service. Use `["none"]` to override the service defaults and specify that no restrictions should be used.
    * @type {string[]}
    */
    restrictionAttributes: null,

    /**
    * Specifies how U-Turns should be handled. The default is as defined in the specific routing network layer used 
    * in your RouteTask. See {@link module:esri/tasks/support/NATypes NAUTurn} for a list of valid values. 
    * @type {string}
    */
    restrictUTurns: null,

    /**
    * If `true`, directions will be generated and returned in the directions property of each 
    * {@link module:esri/tasks/support/RouteResult} and  
    * {@link module:esri/tasks/support/ClosestFacilitySolveResult}.
    * @type {boolean}
    * @default false
    */
    returnDirections: false,

    /**
    * If `true`, facilities will be returned with the analysis results.
    * @type {boolean}
    * @default false
    */
    returnFacilities: false,

    /**
    * If `true`, incidents will be returned with the analysis results.
    * @type {boolean}
    * @default false
    */
    returnIncidents: false,

    /**
    * If `true`, point barriers will be returned in the barriers property of the 
    * {@link module:esri/tasks/support/ClosestFacilitySolveResult}.
    * @type {boolean}
    * @default false
    */
    returnPointBarriers: false,

    /**
    * If `true`, polygon barriers will be returned in the barriers property of the 
    * {@link module:esri/tasks/support/ClosestFacilitySolveResult}.
    * @type {boolean}
    * @default false
    */
    returnPolylgonBarriers: false,

    /**
    * If `true`, polyline barriers will be returned in the barriers property of the 
    * {@link module:esri/tasks/support/ClosestFacilitySolveResult}.
    * @type {boolean}
    * @default false
    */
    returnPolylineBarriers: false,

    /**
    * When `true`, closest facility routes will be generated and returned in the route property of each
    * {@link module:esri/tasks/support/ClosestFacilitySolveResult}.
    * @type {boolean}
    * @default
    */
    returnRoutes: true,

    /**
    * Options for traveling to or from the facility. Default values are defined by the newtork layer. 
    * See {@link module:esri/tasks/support/NATypes NATravelDirection} for a list of valid values.
    * @type {string}
    */
    travelDirection: null,

    /**
    * If `true`, the hierarchy attribute for the network will be used in analysis. The default is defined in 
    * the routing network layer used by the {@link module:esri/tasks/ClosestFacilityTask}.
    * @type {boolean}
    * @default false
    */
    useHierarchy: false,

    /**
    * The arrival or departure date and time. For example, if the travelDirection is set to `TO_FACILITY` and
    * `timeOfDayUsage` is set to "end" and `timeOfDay` is set to 8:00 a.m., the returned route(s) will be setup to 
    * arrive at the facility at 8:00 a.m. local time. *Requires ArcGIS Server service version 10.1 or greater.*
    * @type {Date}
    */
    timeOfDay: null,

    /**
    * Defines the way the `timeOfDay` value is used. The default value is defined in the network layer. 
    * *Requires ArcGIS Server service version 10.1 or greater.*
    *
    * **Known Values:** start | end
    * @type {string}
    */
    timeOfDayUsage: null,

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
                    returnFacilities: this.returnFacilities,
                    returnIncidents: this.returnIncidents,
                    returnBarriers: this.returnPointBarriers,
                    returnPolygonBarriers: this.returnPolygonBarriers,
                    returnPolylineBarriers: this.returnPolylineBarriers,
                    returnCFRoutes: this.returnRoutes,
                    useHierarchy: this.useHierarchy,                                                                                                   
                    attributeParameterValues: this.attributeParameterValues && JSON.stringify(this.attributeParameterValues),
                    defaultCutoff: this.defaultCutoff,
                    defaultTargetFacilityCount: this.defaultTargetFacilityCount,
                    directionsLanguage: this.directionsLanguage,
                    directionsLengthUnits: NATypes.LengthUnit[this.directionsLengthUnits],
                    directionsTimeAttributeName: this.directionsTimeAttribute,                    
                    impedanceAttributeName: this.impedanceAttribute,                    
                    outputGeometryPrecision: this.outputGeometryPrecision,
                    outputGeometryPrecisionUnits: this.outputGeometryPrecisionUnits,  
                    outputLines: this.outputLines,                    
                    outSR: this.outSpatialReference ? (this.outSpatialReference.wkid || JSON.stringify(this.outSpatialReference.toJSON()))  : null,
                    restrictionAttributeNames: this.restrictionAttributes ? this.restrictionAttributes.join(",") : null,
                    restrictUTurns: this.restrictUTurns,
                    accumulateAttributeNames: this.accumulateAttributes ? this.accumulateAttributes.join(",") : null,                                                                                                
                    travelDirection: this.travelDirection,
                    timeOfDay: this.timeOfDay && this.timeOfDay.getTime(),
                    directionsStyleName: this.directionsStyleName
                  };      
      
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
      
      if (this.timeOfDayUsage) {
        var timeOfDayUsage;
        switch (this.timeOfDayUsage.toLowerCase()) {
          case "start":
            timeOfDayUsage = "esriNATimeOfDayUseAsStartTime";
            break;
          case "end":
            timeOfDayUsage = "esriNATimeOfDayUseAsEndTime";
            break;
          default:
            timeOfDayUsage = this.timeOfDayUsage;
        }
        json.timeOfDayUsage = timeOfDayUsage;
      }
      var incidents = this.incidents;
      if (incidents.declaredClass === "esri.tasks.FeatureSet" && incidents.features.length > 0) {
        json.incidents = JSON.stringify({
          type:"features", 
          features:graphicsUtils._encodeGraphics(incidents.features, normalized && normalized["incidents.features"]),
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      else if (incidents.declaredClass === "esri.tasks.DataLayer") {
        json.incidents = incidents;
      }
      else if (incidents.declaredClass === "esri.tasks.DataFile") {
        json.incidents = JSON.stringify({
          type: "features",
          url: incidents.url,
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      
      var facilities = this.facilities;
      if (facilities.declaredClass === "esri.tasks.FeatureSet" && facilities.features.length > 0) {
        json.facilities = JSON.stringify({
          type:"features", 
          features:graphicsUtils._encodeGraphics(facilities.features, normalized && normalized["facilities.features"]),
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
      }
      else if (facilities.declaredClass === "esri.tasks.DataLayer") {
        json.facilities = facilities;
      }
      else if (facilities.declaredClass === "esri.tasks.DataFile") {
        json.facilities = JSON.stringify({
          type: "features",
          url: facilities.url,
          doNotLocateOnRestrictedElements: this.doNotLocateOnRestrictedElements
        });
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
      
      if (this.pointBarriers) {
        json.barriers = barriersFunc(this.pointBarriers, "pointBarriers.features");
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

  return CFParameters;
});
