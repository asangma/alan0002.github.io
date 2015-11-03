/**
 * The GenerateRendererTask class creates a renderer based on a 
 * {@link module:esri/tasks/support/GenerateRendererParameters#classificationDefinition classification definition} and
 * optional {@link module:esri/tasks/support/GenerateRendererParameters#where where} clause. The classification 
 * definition is used to define the base symbol and 
 * color ramp for the renderer. The output renderer can be applied to graphics layers, feature
 * layers or dynamic layers. The GenerateRendererTask is available for map services or tables that
 * support the `generateDataClasses` operation.
 * 
 * @since 4.0 
 * @module esri/tasks/GenerateRendererTask
 * @see module:esri/tasks/support/GenerateRendererParameters
 */
define(
[
  "require",

  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/Deferred",
  "dojo/number",

  "../request",

  "../renderers/support/jsonUtils",

  "./QueryTask",
  "./Task",

  "./support/StatisticDefinition",
  "./support/Query"
],
function(
  require,
  array, declare, lang, Deferred, number,
  esriRequest,
  jsonUtils,
  QueryTask, Task,
  StatisticDefinition, Query
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/GenerateRendererTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var GenerateRendererTask = declare(Task,
  /** @lends module:esri/tasks/GenerateRendererTask.prototype */
  {

    declaredClass: "esri.tasks.GenerateRendererTask",

    constructor: function() {
      this._handler = lang.hitch(this, this._handler);

      this._handleExecuteResponse = this._handleExecuteResponse.bind(this);
    },

    normalizeCtorArgs: function(url, options) {
      if (lang.isObject(url) &&
          (url.declaredClass === "esri.layers.FeatureLayer" ||
           url.declaredClass === "esri.layers.CSVLayer")) {

        //imply it is a featurelayer
        var featureLayer = url,

            args = lang.mixin({
              featureLayer: featureLayer
            }, options);

        if (typeof featureLayer.url === "string" &&
            featureLayer.declaredClass !== "esri.layers.CSVLayer") {
          args.url = featureLayer.url;
        }

        return args;
      }

      return this.inherited(arguments);
    },

    _parsedUrlGetter: function(value) {
      var parsedUrl = this.inherited(arguments);
      parsedUrl.path += "/generateRenderer";
      return parsedUrl;
    },

    source: null,

    /**
    * The geodatabase version of the service.
    * 
    * @type {string}
    */
    gdbVersion: null,

    /**
    * Prior to ArcGIS Server 10.2, map services and feature services could only sample 
    * 1000 features to generate the renderer when using the *GenerateRenderer* operation. If there were more than 
    * 1000 features in the feature layer, some features may not have been categorized into any breaks/unique values. 
    * If setting `checkValueRange = true`, it will query the service and find the minimum and maximum values from all the features 
    * and assign it to the min/max of the renderer. *Beginning with ArcGIS Server 10.2, the limit is 100,000.*
    * 
    * @type {boolean}
    */        
    checkValueRange: null,

    _handleExecuteResponse: function(response) {
      var renderer;

      if (response.declaredClass === "esri.renderer.ClassBreaksRenderer" || response.declaredClass === "esri.renderer.UniqueValueRenderer") {
        renderer = response;
      }
      else {
        renderer = jsonUtils.fromJSON(response);
        if (response.type === "classBreaks") {
          renderer.setMaxInclusive(true);
        }
      }

      if (!this.checkValueRange) {
        return this._processRenderer(
                                      renderer,
                                      this._prefix,
                                      this._unitLabel,
                                      this._formatLabel,
                                      this._precision
                                    );
      }

      var queryTask = new QueryTask(this.url);

      var staticsticsMin = new StatisticDefinition({
        statisticType: "min",
        onStatisticField: this._field
      });

      var staticsticsMax = new StatisticDefinition({
        statisticType: "max",
        onStatisticField: this._field
      });

      var queryMinMaxValue = new Query({
        outStatistics: [staticsticsMin, staticsticsMax]
      });

      return queryTask.execute(queryMinMaxValue)
        .then(lang.hitch(this, function(result) {
          var minMaxValues = result.features[0].attributes;
          for (var value in minMaxValues) {
            if (value.toLowerCase().indexOf("min") === 0) {
              var minValue = minMaxValues[value];
            }
            else {
              var maxValue = minMaxValues[value];
            }
          }

          return this._processRenderer(
                                        renderer,
                                        this._prefix,
                                        this._unitLabel,
                                        this._formatLabel,
                                        this._precision,
                                        minValue,
                                        maxValue
                                      );
        }));
    },

    _processRenderer: function(renderer, prefix, unitLabel, formatLabel, precision, minValue, maxValue){
      if (renderer.declaredClass === "esri.renderer.ClassBreaksRenderer") {
        array.forEach(renderer.infos, function(item, idx) {
          if (idx === 0 && minValue !== undefined && minValue !== null) {
            item.minValue = minValue;
          }
          if (idx === renderer.infos.length - 1 && maxValue !== undefined && maxValue !== null) {
            item.classMaxValue = item.maxValue = maxValue;
          }

          if (precision) {
            item.classMaxValue = item.maxValue = Math.round(item.maxValue / precision) * precision;
            item.minValue = Math.round(item.minValue / precision) * precision;
          }

          if (formatLabel) {
            item.label = number.format(item.minValue) + " - " + number.format(item.maxValue);
          }

          if (prefix) {
            item.label = prefix + " " + item.label;
          }

          if (unitLabel) {
            item.label = item.label + " " + unitLabel;
          }
        });
      }
      else {
        array.forEach(renderer.infos, function(item, idx) {
          if (idx === 0 && minValue !== undefined && minValue !== null) {
            item.value = minValue;
          }
          if (idx === renderer.infos.length - 1 && maxValue !== undefined && maxValue !== null) {
            item.value = maxValue;
          }

          if (formatLabel) {
            item.label = number.format(item.value);
          }

          if (prefix) {
            item.label = prefix + " " + item.label;
          }

          if (unitLabel) {
            item.label = item.label + " " + unitLabel;
          }
        });
      }
      return renderer;
    },

    /**
    * Performs a classification on the layer or table resource and generates a 
    * {@link module:esri/renderer/Renderer}.
    *
    * @param {module:esri/tasks/support/GenerateRendererParameters} - Defines 
    * the classification definition and an optional where clause.
    * 
    * @return {Promise} When resolved, the result is a {@link module:esri/renderer/Renderer} object 
    * that can be applied to graphics layers, feature layers or dynamic layers.
    * 
    * @example 
    * require([
    *   "esri/tasks/GenerateRendererTask", "esri/tasks/support/GenerateRendererParameters", ... 
    * ], function(GenerateRendererTask, GenerateRendererParameters, ... ) {
    *   var generateRenderer = new GenerateRendererTask( ... );
    *   var params = new GenerateRendererParameters();
    *   params.classificationDefinition = classDef;
    *   params.where = layerDef; 
    * 
    *   generateRenderer.execute(params).then(function(renderer){
    *     //apply renderer to layer here
    *   });
    * });
    */
    execute: function(/*esri.tasks.GenerateRendererParameters*/ params) {
      var dfd,
          featureLayer = this.featureLayer;

      this._precision = params.precision;
      this._prefix = params.prefix;
      this._unitLabel = params.unitLabel;
      this._formatLabel = params.formatLabel;
      this._features = params.features || this._getCollectionFeatures();

      if (this._features) {
        dfd = new Deferred();
        var features = this._features;
        require(["./support/generateRenderer"], function(generateRenderer){
          var renderer;
          if (params.classificationDefinition.declaredClass === "esri.tasks.ClassBreaksDefinition") {
            renderer = generateRenderer.createClassBreaksRenderer({
              features: features,
              definition: params.classificationDefinition
            });
          }
          else if (params.classificationDefinition.declaredClass === "esri.tasks.UniqueValueDefinition"){
            renderer = generateRenderer.createUniqueValueRenderer({
              features: features,
              definition: params.classificationDefinition
            });
          }
          if (!renderer) {
            dfd.reject();
          }
          else {
            dfd.resolve(this._handleExecuteResponse(renderer));
          }
        });

        return dfd.promise;
      }

      //summary: Execute the task and fire onComplete event.
      // params: esri.tasks.ClassificationDefinition and where clause Parameters to pass to server to execute task
      var _params = lang.mixin(params.toJSON(), {f: "json"});

      if (params.classificationDefinition.declaredClass === "esri.tasks.ClassBreaksDefinition") {
        this._field = params.classificationDefinition.classificationField;
      }
      else {
        this._field = params.classificationDefinition.attributeField;
      }
      if (this.source) {
        var layer = {source: this.source.toJSON()};
        _params.layer = JSON.stringify(layer);
      }
      if (this.gdbVersion) {
        _params.gdbVersion = this.gdbVersion;
      }

      return esriRequest({
        url: this.parsedUrl.path,
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleExecuteResponse);
    },

    _getCollectionFeatures: function() {
      var fl = this.featureLayer;

      return fl &&
             fl.hasMemorySource &&
             fl.graphics;
    }

  });

return GenerateRendererTask;
});
