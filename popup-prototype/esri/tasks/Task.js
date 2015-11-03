/**
 * The base class for tasks.
 * This class has no constructor. 
 *
 * @module esri/tasks/Task
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/QueryTask
 * @see module:esri/tasks/GeometryService
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../core/Accessor",
  "../core/urlUtils"
],
function(
  declare, lang, Accessor, urlUtils
) {
/**
 * @extends module:esri/core/Accessor
 * @constructor module:esri/tasks/Task
 */
var Task = declare(Accessor, 
                   /** @lends module:esri/tasks/Task.prototype */ 
                   {

    declaredClass: "esri.tasks._Task",
    
    classMetadata: {
      properties: {
        parsedUrl:{
          readOnly: true,
          dependsOn: ["url"]
        }
      }
    },

    // url: String: Url to service/layer to use to execute task
    // options: Object: An object with task specific configuration options.
    //    Globally supporting a "requestOptions" member which passes these options on to calls to esriRequest in tasks which support it.
    normalizeCtorArgs: function(url, options) {
      if (typeof url !== "string") {
        return url;
      }

      var args = {};

      if (url) {
        args.url = url;
      }

      if (options) {
        lang.mixin(args, options);
      }

      return args;
    },

    /**
    * The ArcGIS Server REST service URL (usually of a Feature Service Layer or Map Service Layer) for use in a task.
    * 
    * @type {string}
    */
    url: null,

    parsedUrl: null,

    _parsedUrlGetter: function() {
      return this.url ? urlUtils.urlToObject(this.url) : null;
    },

    requestOptions: null,

    normalization: true,

    _useSSL: function() {
      var urlObject = this.parsedUrl, re = /^http:/i, rep = "https:";
      
      if (this.url) {
        this.set("url", this.url.replace(re, rep));
      }
      
      if (urlObject && urlObject.path) {
        urlObject.path = urlObject.path.replace(re, rep);
      }
    },

    _encode: function(/*Object*/ params, doNotStringify, normalized) {
      //summary: Method may be implemented by extending classes if additional encoding
      //         parameters/modifications are required. This method is called before the
      //         request is sent to the server for processing.
      // params: Object: Parameters to be sent to server. f:"json" is added by default
      // doNotStringify is used by "gp" module when handling GPMultiValued input parameters
      var param, type, result = {}, i, p, pl;
      for (i in params) {
        if (i === "declaredClass") {
          continue;
        }
        param = params[i];
        type = typeof param;
        if (param !== null && param !== undefined && type !== "function") {
          if (lang.isArray(param)) {
            result[i] = [];
            pl = param.length;
            
            for (p=0; p<pl; p++) {
              result[i][p] = this._encode(param[p]);
            }
          }
          else if (type === "object") {
            if (param.toJSON) {
              var json = param.toJSON(normalized && normalized[i]); // normalized geometries for gp feature set parameter
              if (param.declaredClass === "esri.tasks.FeatureSet"){
                //in order to workaround the issue in GP service 9.3, which doesn't take spatialReference as input featureset
                //replace spatialReference as sr.
                if (json.spatialReference){
                  json.sr = json.spatialReference;
                  delete json.spatialReference;
                }
              }
              result[i] = doNotStringify ? json : JSON.stringify(json);
            }
          }
          else {
            result[i] = param;
          }
        }
      }
      return result;
    }
  }

);

return Task;
});
