/**
 * Input parameters for {@link module:esri/tasks/ServiceAreaTask|ServiceAreaTask}. 
 * 
 * ::: esri-md class="panel trailer-1"
 * ServiceAreaParameters, and other service area related classes, requires 
 * a service area layer. A service area layer is a layer of type `esriNAServerServiceAreaLayer`.
 * :::
 *
 * @module esri/tasks/support/ServiceAreaParameters
 * @since 4.0
 * @see module:esri/tasks/ServiceAreaTask
 * @see module:esri/tasks/support/ServiceAreaSolveResult
 * @see [Solve Service Area - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000pp000000)
 */
define(
[
  "../../core/declare",

  "../../core/Accessor",
  "../../core/lang",

  "../../geometry/support/graphicsUtils"
],
function(
  declare, Accessor, esriLang,
  graphicsUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/ServiceAreaParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ServiceAreaParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/ServiceAreaParameters.prototype */
  {

    declaredClass: "esri.tasks.ServiceAreaParameters",

    /**
    * The list of network attribute names to be accumulated with the analysis 
    * (i.e. which attributes should be returned as part of the response). The 
    * default is as defined in the specific routing network layer used in 
    * your {@link module:esri/tasks/RouteTask}. You can specify any attributes 
    * names listed in the Service Directory under 
    * `Network Dataset > Network Attributes` as `Usage Type: esriNAUTCost`.
    * 
    * @type {string[]}
    */  
    accumulateAttributes: null,

    /**
    * A set of attribute parameter values that can be parameterized to determine 
    * which network elements can be used by a vehicle. The parameter holding a vehicle 
    * characteristic is compared to a value coming from a descriptor attribute to 
    * determine whether or not a network element is traversable. For example, a 
    * parameterized restriction attribute can compare the height of your vehicle 
    * with a descriptor attribute that holds the clearance under overpasses
    * through tunnels. If the vehicle's height is greater than the clearance, 
    * the edge is restricted. 
    * 
    * Parameterized cost attributes that reference other 
    * cost attributes and scale them, can also be used. This is useful when inclement
    * weather like ice, fog or heavy rain, descends on the study area and hinders 
    * normal flow of traffic. By having a parameter already outfitted on a cost 
    * attribute, travel-time expectations and traversable network paths can be
    * adjusted with respect to changes in traffic speeds.
    * 
    * @type {Object[]}
    */   
    attributeParameterValues: null,

    /**
    * An array of numbers defining the breaks. The default value 
    * is defined in the network analysis layer.
    * 
    * @type {number[]}
    */   
    defaultBreaks: null,

    /**
    * When `true`, restricted network elements should be considered 
    * when finding network locations.
    * 
    * @type {boolean}
    * @default
    */  
    doNotLocateOnRestrictedElements: true,

    /**
    * An array of network source names to NOT use when generating polygons. 
    * This property specifies if certain network sources should be excluded 
    * from the service area polygon generation. A service area on a multi-modal 
    * network where only one mode is being used to compute the service area 
    * would get a more appropriate shape if other modes are excluded from the polygons.
    * 
    * @type {string[]}
    */   
    excludeSourcesFromPolygons: null,

    /**
    * The set of facilities loaded as network locations during analysis. 
    * At ArcGIS Server 10.1, an optional url property was added. Use this property 
    * to specify a REST query request to a Feature, Map or GP Service that returns
    * a JSON feature set. The url property can be specified using `DataFile`. Note 
    * that either the features or url property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */  
    facilities: null,

    /**
    * The network attribute name used as the impedance attribute in analysis. 
    * The default is as defined in the routing network layer used in your 
    * {@link module:esri/tasks/RouteTask}. You can specify any attribute 
    * names listed in the Service Directory under `Network Dataset > Network Attributes` 
    * as `Usage Type: esriNAUTCost`. You can also specify a value of `none` to indicate 
    * that no network attributes should be used for impedance. If you
    * specify an empty string, it will use the default of the service.
    * 
    * For example, set `impedanceAttribute = 'Time'` for quickest route and `impedanceAttribute = 'Length'` for 
    * shortest drive. Assuming the service has those two esriNAUTCost attributes.
    * 
    * View the [Understanding the network attribute](http://help.arcgis.com/en/arcgisdesktop/10.0/help/index.html#//00470000000M000000.htm) 
    * ArcGIS desktop help topic for more details.
    * 
    * @type {string}
    */   
    impedanceAttribute: null,

    /**
    * If `true`, similar ranges will be merged in the resulting polygons.
    * 
    * @type {boolean}
    * @default false
    */  
    mergeSimilarPolygonRanges: false,

    /**
    * The precision of the output geometry after generalization. If `0`, no 
    * generalization of output geometry is performed. If present and positive, 
    * it represents the `MaximumAllowableOffset` parameter and generalization 
    * is performed according to IPolycurve.Generalize.
    * 
    * @type {number}
    */   
    outputGeometryPrecision: null,

    /**
    * The units of the output geometry precision.
    * 
    * @type {string}
    */   
    outputGeometryPrecisionUnits: null,

    /**
    * The type of output lines to be generated in the result. The default is
    * defined in the specific routing network layer used in your 
    * {@link module:esri/tasks/ServiceAreaTask}. 
    * 
    * Possible Value | Description
    * ---------------|------------
    * esriNAOutputLineNone | No lines are returned
    * esriNAOutputLineStraight | Only returns straight lines
    * esriNAOutputLineTrueShape | Return the true shape of the lines
    * esriNAOutputLineTrueShapeWithMeasure | Return the true shape of the lines with their measurments
    * 
    * @type {string}
    */  
    outputLines: null,

    /**
    * The type of output polygons to be generated in the result.
    * The default is as defined in the specific routing 
    * network layer used in your {@link module:esri/tasks/ServiceAreaTask}.
    * 
    * **Possible Values:** esriNAOutputPolygonNone | esriNAOutputPolygonSimplified 
    * | esriNAOutputPolygonDetailed
    * 
    * @type {string}
    */   
    outputPolygons: null,

    /**
    * The well-known ID of the spatial reference for the geometries 
    * returned with the analysis results. If `outSpatialReference` is not specified, 
    * the geometries are returned in the spatial reference of the view.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */   
    outSpatialReference : null,

    /**
    * Indicates if the lines should overlap from multiple facilities. 
    * The default is defined by the network analysis layer in your 
    * {@link module:esri/tasks/ServiceAreaTask}.
    * 
    * @type {boolean}
    * @default false
    */  
    overlapLines: false,

    /**
    * Indicates if the polygons should overlap from multiple facilities. 
    * The default is defined by the network analysis layer in your 
    * {@link module:esri/tasks/ServiceAreaTask}.
    * 
    * @type {boolean}
    * @default false
    */   
    overlapPolygons: false,

    /**
    * The set of point barriers loaded as network locations during analysis. 
    * At ArcGIS Server 10.1, an optional url property was added. Use this 
    * property to specify a REST query request to a Feature, Map or GP Service that returns
    * a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile}. Note that either the features or url 
    * property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */   
    pointBarriers: null,

    /**
    * The set of polygon barriers loaded as network locations during analysis. 
    * At ArcGIS Server 10.1, an optional url property was added. Use this property 
    * to specify a REST query request to a Feature, Map or GP Service that returns
    * a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile}. Note that either the features or url 
    * property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */  
    polygonBarriers: null,

    /**
    * The set of polyline barriers loaded as network locations during analysis. 
    * At ArcGIS Server 10.1, an optional url property was added. Use this property 
    * to specify a REST query request to a Feature, Map or GP Service that returns
    * a JSON feature set. The url property can be specified using 
    * {@link module:esri/tasks/support/DataFile}. Note that either the features or url 
    * property should be specified.
    * 
    * @type {module:esri/tasks/support/DataLayer | module:esri/tasks/support/FeatureSet}
    */  
    polylineBarriers: null,

    /**
    * The list of network attribute names to be used as restrictions with the analysis. 
    * The default is as defined in the specific routing network layer used in your 
    * {@link module:esri/tasks/RouteTask}. You can specify any attributes names listed 
    * in the Service Directory under `Network Dataset > Network Attributes` as `Usage Type: esriNAUTCost`.
    * 
    * @type {string[]}
    */   
    restrictionAttributes: null,

    /**
    * Specifies how U-turns should be handled. The default is defined in the 
    * routing network layer used in your RouteTask.
    * 
    * Possible Value | Description
    * ---------------|------------
    * esriNFSBAllowBacktrack | Allows U-turns on everywhere
    * esriNFSBAtDeadEndsOnly | Only allows U-turns at dead ends
    * esriNFSBNoBacktrack | Restricts U-turns everywhere
    * esriNFSBAtDeadEndsAndIntersections | Only allows U-turns at dead ends and intersections
    * 
    * @type {string}
    */  
    restrictUTurns: null,

    /**
    * If `true`, facilities will be returned with the analysis results.
    * 
    * @type {boolean}
    * @default false
    */  
    returnFacilities: false,

    /**
    * If `true`, point barriers will be returned in the 
    * {@link module:esri/tasks/support/ServiceAreaSolveResult#pointBarriers pointBarriers} 
    * property of the analysis results.
    * 
    * @type {boolean}
    * @default false
    */   
    returnPointBarriers: false,

    /**
    * If `true`, polygon barriers will be returned in the 
    * {@link module:esri/tasks/support/ServiceAreaSolveResult#polygonBarriers polygonBarriers} 
    * property of the analysis results.
    * 
    * @type {boolean}
    * @default false
    */  
    returnPolygonBarriers: false,

    /**
    * If `true`, polyline barriers will be returned in the 
    * {@link module:esri/tasks/support/ServiceAreaSolveResult#polylineBarriers polylineBarriers} 
    * property of the analysis results.
    * 
    * @type {boolean}
    * @default false
    */  
    returnPolylineBarriers: false,

    /**
    * If `true`, lines will be split at breaks.
    * 
    * @type {boolean}
    * @default false
    */  
    splitLinesAtBreaks: false,

    /**
    * If `true`, polygons will be split at breaks.
    * 
    * @type {boolean}
    * @default false
    */  
    splitPolygonsAtBreaks: false,

    /**
    * Options for traveling to or from the facility. Default values are defined by the network layer.
    * 
    * Possible Value | Description
    * ---------------|------------
    * esriNATravelDirectionFromFacility | Sets travel direction from the facility
    * esriNATravelDirectionToFacility | Sets travel direction to the facility
    * 
    * @type {string}
    */  
    travelDirection: null,

    /**
    * If `true`, the outermost polygon (at the maximum break value) will be trimmed. 
    * The default is defined in the network analysis layer in your 
    * {@link module:esri/tasks/ServiceAreaTask}.
    * 
    * @type {boolean}
    * @default false
    */    
    trimOuterPolygon: false,

    /**
    * If polygons are being trimmed, provides the distance to trim. 
    * The default value is defined in the network analysis layer.
    * 
    * @type {number}
    */  
    trimPolygonDistance: null,

    /**
    * If polygons are being trimmed, specifies the units of 
    * [trimPolygonDistance](#trimPolygonDistance). The default is defined in the network
    * analysis layer.
    * 
    * @type {string}
    */  
    trimPolygonDistanceUnits: null,

    /**
    * When `true`, the hierarchy attributes for the network will be used in 
    * the analysis. The default value is defined in the network layer. 
    * `useHierarchy` cannot be used in conjunction with [outputLines](#outputLines). 
    * Requires an ArcGIS Server service version 10.1 or greater. 
    * 
    * @type {boolean}
    */  
    useHierarchy: null,

    /**
    * Local date and time at the facility. if `travelDirection = "esriNATravelDirectionToFacility"`, 
    * the `timeOfDay` value specifies arrival time at the facility. if `travelDirection = "esriNATravelDirectionFromFacility"`, 
    * `timeOfDay` specifies departure time from the facility. Requires ArcGIS Server service version 10.1 or greater. 
    * 
    * @type {Date}
    */  
    timeOfDay: null,

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
                    returnFacilities: this.returnFacilities,                    
                    returnBarriers: this.returnPointBarriers,
                    returnPolygonBarriers: this.returnPolygonBarriers,
                    returnPolylineBarriers: this.returnPolylineBarriers,
                    mergeSimilarPolygonRanges: this.mergeSimilarPolygonRanges,
                    overlapLines: this.overlapLines,
                    overlapPolygons: this.overlapPolygons,
                    splitLinesAtBreaks: this.splitLinesAtBreaks,
                    splitPolygonsAtBreaks: this.splitPolygonsAtBreaks,
                    trimOuterPolygon: this.trimOuterPolygon,                                                            
                    accumulateAttributeNames: this.accumulateAttributes ? this.accumulateAttributes.join(",") : null,                                                                                                   
                    attributeParameterValues: this.attributeParameterValues && JSON.stringify(this.attributeParameterValues),
                    defaultBreaks: this.defaultBreaks ? this.defaultBreaks.join(",") : null,
                    excludeSourcesFromPolygons: this.excludeSourcesFromPolygons ? this.excludeSourcesFromPolygons.join(",") : null,
                    impedanceAttributeName: this.impedanceAttribute,
                    outputGeometryPrecision: this.outputGeometryPrecision,
                    outputGeometryPrecisionUnits: this.outputGeometryPrecisionUnits,
                    outputLines: this.outputLines,
                    outputPolygons: this.outputPolygons,
                    outSR: this.outSpatialReference ? (this.outSpatialReference.wkid || JSON.stringify(this.outSpatialReference.toJSON()))  : null,
                    restrictionAttributeNames: this.restrictionAttributes ? this.restrictionAttributes.join(",") : null,
                    restrictUTurns: this.restrictUTurns,
                    travelDirection: this.travelDirection,
                    trimPolygonDistance: this.trimPolygonDistance,
                    trimPolygonDistanceUnits: this.trimPolygonDistanceUnits,
                    useHierarchy: this.useHierarchy,
                    timeOfDay: this.timeOfDay && this.timeOfDay.getTime()
                  };
                  
      
      
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

  return ServiceAreaParameters;
});
