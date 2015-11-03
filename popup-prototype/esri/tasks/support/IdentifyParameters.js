/**
 * Input parameters for the {@link module:esri/tasks/IdentifyTask}.
 * 
 * @since 4.0
 * @module esri/tasks/support/IdentifyParameters
 * @see module:esri/tasks/IdentifyTask
 * @see module:esri/tasks/support/IdentifyResult
 * @see [Identify - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r300000113000000)
 */
define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "../../core/Accessor",

  "../../layers/support/layerUtils",

  "../../geometry/support/jsonUtils",
  "../../geometry/support/scaleUtils"
], function(
  declare, lang, array, Accessor,
  layerUtils,
  jsonUtils, scaleUtils
) {

  var layerOptions = {
    LAYER_OPTION_TOP: "top",
    LAYER_OPTION_VISIBLE: "visible",
    LAYER_OPTION_ALL: "all"
  };

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/IdentifyParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor. 
   */
  var IdentifyParameters = declare(Accessor,
  /** @lends module:esri/tasks/support/IdentifyParameters.prototype */
  {

    declaredClass: "esri.tasks.IdentifyParameters",

    /**
    * The geometry used to select features during the Identify operation. 
    * The type of the geometry is specified by {@link module:esri/geometry/Geometry#type Geometry.type}. 
    * The most common geometry used with Identify is a {@link module:esri/geometry/Point}. 
    * 
    * @type {module:esri/geometry/Geometry} 
    */
    geometry: null,

    /**
    * Resolution of the current map view in dots per inch.
    * 
    * @type {number}
    * @default 
    */
    dpi: 96,

    /**
    * An array of DynamicLayerInfos used to change the layer ordering or redefine the map. When set,
    * the Identify operation will perform the identify against the dynamic layers. 
    * 
    * @type {module:esri/layers/support/DynamicLayerInfo[]} 
    */
    dynamicLayerInfos: null,

    /**
    * Height of the {module:esri/views/View} in pixels.
    * 
    * @type {number}
    * @default 
    */
    height: 400,

    /**
    * Array of layer definition expressions that allows you to filter the features of individual layers. 
    * Layer definitions with semicolons or colons are supported if using a map service published using ArcGIS Server 10
    * or later.
    * 
    * @type {string[]} 
    */
    layerDefinitions: null,

    /**
    * The layers on which to perform the identify operation. The layers are specified
    * as a comma-separated list of layer IDs.
    * 
    * @type {number[]} 
    */
    layerIds: null,

    /**
     * Specifies which layers to use when using Identify.
     * 
     * Possible values | Description
     * --------------- | -----------
     * top | Only the top-most visible layer is identified.
     * visible | All visible layers are identified.
     * all | All layers are identified, even if they are not visible. If your service has many layers, a request using this option will not perform well. A visible layer means you can see it in the map at the current extent.  If a layer is turned off or not in range based on its scale dependency settings, it cannot be identified.
     *
     * @type {string}
     * @default top
     */
    layerOption: layerOptions.LAYER_OPTION_TOP,

    /**
    * Array of LayerTimeOptions objects that allow you to define time options for the specified layers. 
    * There is one object per sub-layer.
    * 
    * @type {module:esri/layers/support/LayerTimeOptions[]}
    * @example 
    * require([
    *   "esri/layers/support/LayerTimeOptions", "esri/layers/support/TimeInfo", ... 
    * ], function(LayerTimeOptions, TimeInfo, ... ) {
    *   var timeOption1 = new LayerTimeOptions();
    *   timeOption1.timeOffset = 4;
    *   timeOption1.timeOffsetUnits = TimeInfo.UNIT_YEARS;
    *
    *   var options = [];
    *   options[2]= timeOption1;
    *   options[5] = timeOption2;
    *   identifyParameters.layerTimeOptions = options;
    *   ...
    * });
    * @ignore
    */
    layerTimeOptions: null,

    /**
    * The Extent or bounding box of the current map view. The `mapExtent` property is assumed to be in the spatial 
    * reference of the map unless [spatialReference](#spatialReference) has been specified.
    * 
    * The values for [mapExtent](#mapExtent), [height](#height), [width](#width), and [dpi](#dpi) are used 
    * to determine the current map scale. Once the scale is known, the map service can exclude layers based 
    * on their scale dependency settings. The map service is not performing a spatial intersection based on 
    * the provided extent. These properties are also used to calculate the search distance on the map based 
    * on the tolerance in screen pixels.
    * 
    * @type {module:esri/geometry/Extent} 
    */
    mapExtent: null,

    /**
    * Specify the number of decimal places for the geometries returned by the task.
    * @type {number} 
    */
    geometryPrecision: null,
    
    /**
    * The maximum allowable offset used for generalizing geometries returned by the identify operation. 
    * The offset is in the units of the [spatialReference](#spatialReference). If a 
    * [spatialReference](#spatialReference) is not defined the spatial reference of the view is used.
    * 
    * @type {number} 
    */
    maxAllowableOffset: null,
      
    /**
    * If `true`, the result set includes the geometry associated with each result.
    * 
    * @type {boolean} 
    * @default false
    */
    returnGeometry: false,

    /**
    * The spatial reference of the input and output geometries as well as of the [mapExtent](#mapExtent). 
    * If the spatial reference is not specified, the geometry and the extent are assumed to be in the 
    * spatial reference of the view, and the output geometries will also be in the spatial reference of the view.
    * 
    * @type {module:esri/geometry/SpatialReference} 
    */
    spatialReference: null,

    /**
    * Specify the time extent used by the identify task.
    * 
    * @type {module:esri/TimeExtent} 
    * @ignore
    */
    timeExtent: null,

    /**
    * The distance in screen pixels from the specified geometry within which the identify should be performed.
    * 
    * @type {number} 
    */
    tolerance: null,

    /**
    * Width of the current map view in pixels.
    * 
    * @type {number} 
    * @default
    */
    width: 400,

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
      var g = normalized && normalized.geometry || this.geometry,
          ext = this.mapExtent,
          sr = this.spatialReference,
          layerIds = this.layerIds,
          json = {
            tolerance: this.tolerance,
            returnGeometry: this.returnGeometry,
            imageDisplay: this.width + "," + this.height + "," + this.dpi,
            maxAllowableOffset: this.maxAllowableOffset,
            geometryPrecision: this.geometryPrecision
          };

      if (g) {
        var geomJson = g.toJSON();
        delete geomJson.spatialReference;
        json.geometry = JSON.stringify(geomJson);
        json.geometryType = jsonUtils.getJsonType(g);
      }

      if (sr) {
        json.sr = sr.wkid || JSON.stringify(sr.toJSON());
      }
      else if (g && g.spatialReference) {
        json.sr = g.spatialReference.wkid || JSON.stringify(g.spatialReference.toJSON());
      }
      else if (ext && ext.spatialReference) {
        json.sr = ext.spatialReference.wkid || JSON.stringify(ext.spatialReference.toJSON());
      }

      if (ext) {
        json.mapExtent = ext.xmin + "," + ext.ymin + "," + ext.xmax + "," + ext.ymax;
      }

      json.layers = this.layerOption;
      if (layerIds) {
        json.layers += ":" + layerIds.join(",");
      }

      json.layerDefs = layerUtils._serializeLayerDefinitions(this.layerDefinitions);

      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJSON().join(",") : null;

      json.layerTimeOptions = layerUtils._serializeTimeOptions(this.layerTimeOptions);

      if (this.dynamicLayerInfos && this.dynamicLayerInfos.length > 0) {
        var result,
            scaleParams = { extent: ext, width: this.width, spatialReference: ext.spatialReference },
		    // TODO 4.0: scaleUtils.getScale(map) can't work
            mapScale = scaleUtils.getScale(scaleParams),
            layersInScale = layerUtils._getLayersForScale(mapScale, this.dynamicLayerInfos),
            dynLayerObjs = [];

        array.forEach(this.dynamicLayerInfos, function(info) {
          if (!info.subLayerIds) {// skip group layers
            var layerId = info.id;
            // if visible and in scale
            if ((!this.layerIds || (this.layerIds && array.indexOf(this.layerIds, layerId) !== -1)) &&
                array.indexOf(layersInScale, layerId) !== -1) {
              var dynLayerObj = {
                id: layerId
              };
              dynLayerObj.source = info.source && info.source.toJSON();

              var definitionExpression;
              if (this.layerDefinitions && this.layerDefinitions[layerId]) {
                definitionExpression = this.layerDefinitions[layerId];
              }
              if (definitionExpression) {
                dynLayerObj.definitionExpression = definitionExpression;
              }
              var layerTimeOptions;
              if (this.layerTimeOptions && this.layerTimeOptions[layerId]) {
                layerTimeOptions = this.layerTimeOptions[layerId];
              }
              if (layerTimeOptions) {
                dynLayerObj.layerTimeOptions = layerTimeOptions.toJSON();
              }
              dynLayerObjs.push(dynLayerObj);
            }
          }
        }, this);

        result = JSON.stringify(dynLayerObjs);
        //Server side bug which draw the existing layers when dynamicLayers is "[]". By changing it to "[{}]", it draws
        //an empty map.
        if (result === "[]") {
          result = "[{}]";
        }
        json.dynamicLayers = result;
      }

      return json;
    }

  });

  lang.mixin(IdentifyParameters, layerOptions);

  return IdentifyParameters;
});
