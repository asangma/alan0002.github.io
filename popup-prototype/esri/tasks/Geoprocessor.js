/**
 * Represents a GP Task resource exposed by the ArcGIS REST API. A GP Task resource represents a 
 * single task in a GP service published using the ArcGIS Server and it supports one of the 
 * following operations dependent on how the service was set up:
 * * [execute](#execute) - for when the execution type is synchronous.
 * * [submitJob](#submitJob) - for when the execution type is asynchronous.
 *
 * @module esri/tasks/Geoprocessor
 * @since 4.0
 * @see module:esri/tasks/support/GPMessage
 * @see module:esri/tasks/support/ParameterValue
 * @see module:esri/tasks/support/JobInfo
 */
define(
[
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/Deferred",
  "dojo/io-query",

  "../request",

  "../geometry/support/normalizeUtils",

  "../layers/ArcGISDynamicLayer",

  "../layers/support/MapImage",

  "./Task",

  "./support/DataFile",
  "./support/Date",
  "./support/FeatureSet",
  "./support/GPMessage",
  "./support/GPResultImageLayer",

  "./support/JobInfo",
  "./support/LinearUnit",
  "./support/ParameterValue",
  "./support/RasterData"
],
function(
  array, declare, lang, Deferred, ioq, esriRequest,
  normalizeUtils,
  ArcGISDynamicLayer,
  MapImage,
  Task,
  DataFile, GPDate, FeatureSet, GPMessage, GPResultImageLayer, 
  JobInfo, LinearUnit, ParameterValue, RasterData
) {

/**
 * @extends module:esri/tasks/Task
 * @constructor module:esri/tasks/Geoprocessor
 * @param {Object} properties - See the [properties](#properties) for a list of all the properties
 *                              that may be passed into the constructor.
 */
var Geoprocessor = declare(Task,
/** @lends module:esri/tasks/Geoprocessor.prototype */
{

    declaredClass: "esri.tasks.Geoprocessor",
  
    constructor: function() {
      //summary: Execute Geoprocessing task
      this._updateTimers = [];

      this._handleExecuteResponse = this._handleExecuteResponse.bind(this);
      this._handleGetResultImageResponse = this._handleGetResultImageResponse.bind(this);
      this._handleGetResultDataResponse = this._handleGetResultDataResponse.bind(this);
    },

    /**
    * The time interval in milliseconds between each job status request sent to an asynchronous GP task.
    * 
    * @type {number}
    * @default
    */
    updateDelay: 1000,
    
    /**
    * The spatial reference that the model will use to perform geometry operations. If `processSpatialReference` is specified and
    * [outputSpatialReference](#outputSpatialReference) is not specified, the output geometries will be in the spatial reference of the process spatial reference.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */
    processSpatialReference: null,
    
    /**
    * The spatial reference of the output geometries. If not specified, the output geometries will be in the spatial reference of the input geometries.
    * If [processSpatialReference](#processSpatialReference) is specified and `outSpatialReference` is not specified, the output geometries 
    * will be in the spatial reference of the process spatial reference.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */
    outSpatialReference: null,

    // Methods to be wrapped with normalize logic
    __msigns: [
      {
        n: "execute",
        c: 1, // number of arguments expected by the method before the normalize era
        a: [ // arguments or properties of arguments that need to be normalized
          { i: 0, p: [ "*" ] }
        ],
        e: 2
      },
      {
        n: "submitJob",
        c: 1,
        a: [
          { i: 0, p: [ "*" ] }
        ],
        e: 3
      }
    ],
    
    _gpEncode: function(/*Object*/ params, doNotStringify, normalized) {
      var i;
      
      for (i in params) {
        var param = params[i];
        
        if (lang.isArray(param)) {
          params[i] = JSON.stringify(array.map(param, function(item) {
            return this._gpEncode({ item: item }, true).item;
          }, this));
        }
        else if (param instanceof Date) {
          params[i] = param.getTime();
        }
      }
      return this._encode(params, doNotStringify, normalized);
    },

    _decode: function(response) {
      var dataType = response.dataType, value,
          result = ParameterValue.fromJSON(response);

      if (array.indexOf(["GPBoolean", "GPDouble", "GPLong", "GPString"], dataType) !== -1) {
        return result;
      }
  
      if (dataType === "GPLinearUnit") {
        result.value = LinearUnit.fromJSON(result.value);
      }
      else if (dataType === "GPFeatureRecordSetLayer" || dataType === "GPRecordSet") {
        result.value = FeatureSet.fromJSON(result.value);
      }
      else if (dataType === "GPDataFile") {
        result.value = DataFile.fromJSON(result.value);
      }
      else if (dataType === "GPDate") {
        value = result.value;
        if (lang.isString(value)) {
          result.value = GPDate.fromJSON({ date: value });
        }
        else {
          result.value = Date.fromJSON(value);
        }
      }
      else if (dataType === "GPRasterData" || dataType === "GPRasterDataLayer") {
        var mapImage = response.value.mapImage;
        if (mapImage) {
          result.value = MapImage.fromJSON(mapImage);
        }
        else {
          result.value = RasterData.fromJSON(result.value);
        }
      }
      else if (dataType.indexOf("GPMultiValue:") !== -1) {
        var type = dataType.split(":")[1];
        value = result.value;
        
        result.value = array.map(value, function(item) {
          return this._decode({
            paramName: "_name",
            dataType: type,
            value: item
          }).value;
        }, this);
      }
      else {
        console.log(this.declaredClass + " : " + "GP Data type not handled." + " : " + result.dataType);
        result = null;
      }
      return result;
    },

    /**
     * Submits a job to the server for asynchronous processing by the GP task.
     * 
     * The task execution results can be retrieved using the [getResultData()](#getResultData), [getResultImage()](#getResultImage), 
     * or [getResultImageLayer()](#getResultImageLayer) methods.
     * 
     * @param {Object} params - specifies the input parameters accepted by the task and their corresponding values. These input parameters 
     *                          are listed in the parameters field of the associated GP Task resource. For example, assume that a GP Task 
     *                          resource has the following input parameters:
     * * `<GPFeatureRecordSetLayer>` Input_Points
     * * `<GPDouble>` Distance
     * 
     * The `params` argument would then be an Object of the form:
     * 
     * ```
     *{
     *  Input_Points: <FeatureSet>,
     *  Distance: <Number>
     *}
     *
     * ```
     * @return {Promise} When resolved, returns an object with the following properties:
     * ```
     * {
     *   messages: <GPMessage[]>,
     *   results: <ParameterValue[]>
     * }
     * ```
     * See the {@link module:esri/tasks/support/GPMessage} and {@link module:esri/tasks/support/ParameterValue} classes
     * for more information about the information in this object.
     */
    submitJob: function(/*Object*/ params, context) {
      var outSR = this.outSpatialReference;
      var assembly = context.assembly,
          _params = this._gpEncode(
                                 lang.mixin({},
                                            this.parsedUrl.query,
                                            { f: "json",
                                              "env:outSR": (outSR ? (outSR.wkid || JSON.stringify(outSR.toJSON())): null),
                                              "env:processSR": (this.processSpatialReference ? (this.processSpatialReference.wkid || JSON.stringify(this.processSpatialReference.toJSON()))  : null)
                                            },
                                            params
                                          ),
                                  null,
                                  assembly && assembly[0]
                                );

      var deferred = new Deferred();
      var jobUpdateHandler = this._jobUpdateHandler.bind(this);

      esriRequest({
        url: this.parsedUrl.path + "/submitJob",
        content: _params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          jobUpdateHandler(response, deferred);
        })
        .then(null, function(error) {
          deferred.reject(error);
        });

      return deferred.promise;
    },

    _jobUpdateHandler: function(response, deferred) {
      var jobId = response.jobId,
          jobInfo = JobInfo.fromJSON(response),
          getJobStatus,
          jobUpdateHandler;

      clearTimeout(this._updateTimers[jobId]);
      this._updateTimers[jobId] = null;

      deferred.progress(jobInfo);

      switch (response.jobStatus) {
        case JobInfo.STATUS_SUBMITTED:
        case JobInfo.STATUS_EXECUTING:
        case JobInfo.STATUS_WAITING:
        case JobInfo.STATUS_NEW:

          getJobStatus = this._getJobStatus.bind(this);
          jobUpdateHandler = this._jobUpdateHandler.bind(this);

          this._updateTimers[jobId] = setTimeout(function() {

            getJobStatus(jobId)
              .then(function(response) {
                jobUpdateHandler(response, deferred);
              });

          }, this.updateDelay);

          break;
        default:
          deferred.resolve(jobInfo);
      }
    },

    _getJobStatus: function(jobid) {
      return esriRequest({
        url: this.parsedUrl.path + "/jobs/" + jobid,
        content: lang.mixin({}, this.parsedUrl.query, { f: "json" }), //  { f:"json", token:this.parsedUrl.query ? this.parsedUrl.query.token : null },
        callbackParamName: "callback"
      });
    },

    /**
     * Sends a request to the GP Task to get the task result identified by `jobId` and `resultParameterName`.
     * 
     * @param   {string} jobId - The jobId returned from {@link module:esri/tasks/support/JobInfo}.
     * @param   {string} resultName - The name of the result parameter as defined in Services Directory.
     * @return {Promise} When resolved, returns an object with a property named `result` of type 
     *                    {@link module:esri/tasks/support/ParameterValue}, which contains the result 
     *                    parameters and the task execution messages.
     */
    getResultData: function(/*String*/ jobId, /*String*/ resultName) {
      return esriRequest({
        url: this.parsedUrl.path + "/jobs/" + jobId + "/results/" + resultName,
        content: lang.mixin({}, this.parsedUrl.query, { f:"json", returnType:"data" }),
        callbackParamName: "callback"
      })
        .then(this._handleGetResultDataResponse);
    },

    _handleGetResultDataResponse: function(response) {
      return this._decode(response);
    },

    /**
     * Sends a request to the GP Task for the current state of the job identified by `jobId`.
     * 
     * @param   {string} jobId - The jobId returned from {@link module:esri/tasks/support/JobInfo}.
     * @return {Promise} When resolved, returns the status of the job as a property of an Object.
     */
    checkJobStatus: function(/*String*/ jobId) {
      return esriRequest({
        url: this.parsedUrl.path + "/jobs/" + jobId,
        content: lang.mixin({}, this.parsedUrl.query, { f: "json" }),
        callbackParamName: "callback"
      })
        .then(this._handleCheckJobStatusResponse);
    },

    _handleCheckJobStatusResponse: function(response) {
      return JobInfo.fromJSON(response);
    },
    
    /**
     * Cancels an asynchronous geoprocessing job. Requires an ArcGIS Server 10.1 service or greater.
     * 
     * @param   {string} jobId - A string that uniquely identifies a job on the server. It is created when a job is submitted for 
     *                         execution and later used to check its status and retrieve the results.
     * @returns {Promise} When resolved, returns an object that includes the status and job ID.
     */
    cancelJob: function(/*String*/ jobId) {
      return esriRequest({
        url: this.parsedUrl.path + "/jobs/" + jobId + "/cancel",
        content: lang.mixin({}, this.parsedUrl.query, { f: "json" }),
        callbackParamName: "callback"
      });
    },

    /**
     * Sends a request to the server to execute a synchronous GP task.
     * 
     * @param   {Object} params - Specifies the input parameters accepted by the task and their corresponding values. These input parameters 
     *                          are listed in the parameters field of the associated GP Task resource. For example, assume that a GP Task 
     *                          resource has the following input parameters:
     * * `<GPFeatureRecordSetLayer>` Input_Points
     * * `<GPDouble>` Distance
     * 
     * The `params` argument would then be an Object of the form:
     * 
     * ```
     *{
     *  Input_Points: <FeatureSet>,
     *  Distance: <Number>
     *}
     *
     *```
     * @return {Promise} When resolved, returns an object with the following properties:
     * ```
     * {
     *   messages: <GPMessage[]>,
     *   results: <ParameterValue[]>
     * }
     * ```
     * See the {@link module:esri/tasks/support/GPMessage} and {@link module:esri/tasks/support/ParameterValue} classes
     * for more information about the information in this object.
     */
    execute: function(/*Object*/ params, context) {
      var outSR = this.outSpatialReference;
      var assembly = context.assembly,
          _params = this._gpEncode(
                                 lang.mixin({},
                                            this.parsedUrl.query,
                                            { f:"json",
                                              "env:outSR": (outSR ? (outSR.wkid || JSON.stringify(outSR.toJSON())): null),
                                              "env:processSR": (this.processSpatialReference ? (this.processSpatialReference.wkid || JSON.stringify(this.processSpatialReference.toJSON()))  : null)
                                            },
                                            params
                                           ),
                                  null,
                                  assembly && assembly[0]
                                );

      return esriRequest({
        url: this.parsedUrl.path + "/execute",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleExecuteResponse);
    },

    _handleExecuteResponse: function(response) {
      var results  = response.results || [],
          messages = response.messages || [];

      return {
        results: results.map(this._decode, this),
        messages: messages.map(GPMessage.fromJSON)
      };
    },

    /**
     * Sends a request to the GP Task to get the task result identified by `jobId` and `resultParameterName` as an image.
     * 
     * @param   {string} jobId - The jobId returned from {@link module:esri/tasks/support/JobInfo}.
     * @param   {string} resultName - The name of the result parameter as defined in the Services Directory.
     * @param   {module:esri/layers/support/ImageParameters} imageParams - Specifies the properties of the result image.
     *                                                                   
     * @return {Promise}  When resolved, returns an Object with a `mapImage` property of type {@link module:esri/layers/support/MapImage}
     */
    getResultImage: function(/*String*/ jobId, /*String*/ resultName, /*esri.layers.ImageParameters*/ imageParams) {
      var _params = this._gpEncode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, imageParams.toJSON()));

      return esriRequest({
        url: this.parsedUrl.path + "/jobs/" + jobId + "/results/" + resultName,
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleGetResultImageResponse);
    },

    _handleGetResultImageResponse: function(response) {
      return this._decode(response);
    },

    /**
     * Cancels the periodic job status updates automatically initiated when [submitJob()](#submitJob) is invoked for the job identified by `jobId`. 
     * You can still obtain the status of this job by calling the [checkJobStatus()](#checkJobStatus) method at your own discretion.
     * 
     * @param {string} jobId - A string that uniquely identifies the job for which the job updates are cancelled.
     */
    cancelJobStatusUpdates: function(/*String*/ jobId) {
      //summary: Cancels the timer object created to check job status.
      // Cancelling job timer, will cancel status & job complete callbacks.
      clearTimeout(this._updateTimers[jobId]);
      this._updateTimers[jobId] = null;
    },

    /**
     * Get the task result identified by `jobId` and `resultParameterName` as an 
     * {@link module:esri/layers/ArcGISDynamicLayer}.
     * 
     * @param   {string} jobId - The jobId returned from {@link module:esri/tasks/support/JobInfo}.
     * @param   {string} resultName - The name of the result parameter as defined in the Services Directory.
     * @param   {module:esri/layers/support/ImageParameters} imageParams - Specifies the properties of the result image.
     *                                                                   
     * @return {module:esri/layers/ArcGISDynamicLayer} Returns an instance of ArcGISDynamicLayer.
     */
    getResultImageLayer: function(/*String*/ jobId,
        /*String?*/ resultName,
        /*esri.layers.ImageParameters?*/ imageParams) {
      var url, layer;

      if (resultName == null) {
        var gpIndex = this.parsedUrl.path.indexOf("/GPServer/");
        url = this.parsedUrl.path.substring(0, gpIndex) + "/MapServer/jobs/" + jobId;
      } else {
        url = this.parsedUrl.path + "/jobs/" + jobId + "/results/" + resultName;
      }

      if (this.parsedUrl.query) {
        url += "?" + ioq.objectToQuery(this.parsedUrl.query);
      }

      if (resultName == null) {
        layer = new ArcGISDynamicLayer(url, { imageParameters: imageParams });
      } else {
        layer = new GPResultImageLayer(url, { imageParameters: imageParams });
      }

      return layer;
    }

  }
);

normalizeUtils._createWrappers(Geoprocessor);

return Geoprocessor;
});
