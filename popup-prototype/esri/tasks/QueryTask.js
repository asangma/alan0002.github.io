/**
 * Executes a {@link module:esri/tasks/support/Query Query} operation on a layer. The most common
 * method used in this class is [execute()](#execute), which executes the query as defined in the 
 * {@link module:esri/tasks/support/Query Query} object that is passed as a parameter to the function.
 * `QueryTask.execute()` returns a Promise that resolves to a 
 * {@link module:esri/tasks/support/FeatureSet FeatureSet}, which contains the features in the layer
 * that satisfy the {@link module:esri/tasks/support/Query Query}.
 * 
 * With QueryTask, you can also obtain the [number of features](#executeForCount) that satisfy the
 * query, the [extent](#executeForExtent) of the features, or the [featureIds](#executeForIds) 
 * of the features.
 * 
 * For example, when working with a feature layer of world cities, to obtain a 
 * {@link module:esri/tasks/support/FeatureSet FeatureSet} of cities with a population greater than
 * one million people, use the following code:
 * 
 * ```
 * require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function(QueryTask, Query){
 *   var citiesLayerUrl = " ... "; //represents the REST endpoint for a layer of cities.
 *   var queryTask = new QueryTask({
 *     url: citiesLayerUrl
 *   });
 *   var query = new Query();
 *   query.returnGeometry = true;
 *   query.outFields = ["*"];
 *   query.where = "POP &gt; 1000000";  //Return all cities with a population greater than 1 million
 *   
 *   //When resolved, returns features and graphics that satisfy the query.
 *   queryTask.execute(query).then(function(results){
 *     console.log(results.features);
 *   });
 *   
 *   //When resolved, returns a count of the features that satisfy the query.
 *   queryTask.executeForCount(query).then(function(results){
 *     console.log(results);
 *   });
 *   
 * });
 * ```
 * 
 * @module esri/tasks/QueryTask
 * 
 * @since 4.0
 * @see module:esri/tasks/support/Query
 * @see module:esri/tasks/support/FeatureSet
 */
define(
[
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "../geometry/Extent",
  "../geometry/support/normalizeUtils",

  "./Task",

  "./support/FeatureSet"
],
function(
  array, declare, lang, esriRequest,
  Extent, normalizeUtils,
  Task,
  FeatureSet
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/QueryTask
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var QueryTask = declare(Task,
  /** @lends module:esri/tasks/QueryTask.prototype */
  {

      declaredClass: "esri.tasks.QueryTask",
    
      source: null,

      /**
      * Specify the geodatabase version to display. Requires ArcGIS Server service 10.1 or greater.
      * @type {string}
      */
      gdbVersion: null,

      // Methods to be wrapped with normalize logic
      __msigns: [
        {
          n: "execute",
          c: 2, // number of arguments expected by the method before the normalize era
          a: [ // arguments or properties of arguments that need to be normalized
            { i: 0, p: [ "geometry"/*, "test1", "test2", "test3.features"*/ ] }
          ],
          e: 2
        },
        {
          n: "executeForIds",
          c: 1,
          a: [
            { i: 0, p: [ "geometry" ] }
          ],
          e: 2
        },
        {
          n: "executeForCount",
          c: 1,
          a: [
            { i: 0, p: [ "geometry" ] }
          ],
          e: 2
        },
        {
          n: "executeForExtent",
          c: 1,
          a: [
            { i: 0, p: [ "geometry" ] }
          ],
          e: 2
        }
      ],
      
      /*****************
       * Public Methods
       *****************/
  
      /**
      * Executes a Query against an ArcGIS Server map layer. The result is returned as a 
      * {@link module:esri/tasks/support/FeatureSet FeatureSet}, which can be accessed using the `.then()` method.
      * A {@link module:esri/tasks/support/FeatureSet FeatureSet} contains an array of {@link module:esri/Graphic Graphic} 
      * features, which can be added to the map. This array will not be populated if no results are found.
      *
      * @param {module:esri/tasks/support/Query} params - Specifies the attributes and spatial filter of the query.
      *
      * @example
      * require([
      *   "esri/tasks/support/Query", "esri/tasks/QueryTask", ... 
      * ], function(Query, QueryTask, ... ) {
      *   var query = new Query();
      *   var queryTask = new QueryTask( ... );
      *   query.where = "STATE_NAME = 'Washington'";
      *   query.outSpatialReference = {wkid:102100}; 
      *   query.returnGeometry = true;
      *   query.outFields = ["CITY_NAME"];
      *   queryTask.execute(query).then(function(results){
      *     //results.graphics contains the graphics returned from query
      *   });
      *   ...
      * });
      *
      * @return {Promise} When resolved, a {@link module:esri/tasks/support/FeatureSet FeatureSet} containing
      * an array of graphic features is returned.
      */
      execute: function(/*Object*/ params, callbackSuffix, context) {
        //summary: Execute the task and fire onComplete event.
        // params: Object: Parameters to pass to server to execute task

        var assembly = context.assembly,
            _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, params.toJSON(assembly && assembly[0])));

        if (this.source) {
          var layer = {source: this.source.toJSON()};
          _params.layer = JSON.stringify(layer);
        }
        if (this.gdbVersion) {
          _params.gdbVersion = this.gdbVersion;
        }

        return esriRequest({
          url: this.parsedUrl.path + "/query",
          content: _params,
          callbackParamName: "callback",
          callbackSuffix: callbackSuffix
        }, this.requestOptions)
          .then(this._handleExecuteResponse);
      },

      /**
      * Executes a {@link module:esri/tasks/support/RelationshipQuery RelationshipQuery} against an ArcGIS Server 
      * map layer (or table). If the query is successful, the result is returned as a 
      * {@link module:esri/tasks/support/FeatureSet FeatureSet}, which can be accessed using the `.then()` method.  
      *
      * @param {module:esri/tasks/support/RelationshipQuery} params - Specifies the attributes and spatial filter of the query.
      *
      * @return {Promise} When resolved, the results of this operation are 
      * {@link module:esri/tasks/support/FeatureSet FeatureSets} grouped by source layer (or table) object IDs. Each 
      * {@link module:esri/tasks/support/FeatureSet FeatureSet} contains an array of {@link module:esri/Graphic Graphic} 
      * features including the values for the fields requested by the user. This array will not be populated if no results are found.
      * 
      * @private
      */
      executeRelationshipQuery: function(/*Object*/ relationshipQuery) {
        //summary: Execute the task and fire onComplete event.
        // relationShipQuery: Object: Parameters to pass to server to execute task

        var _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json" }, relationshipQuery.toJSON()));

        if (this.gdbVersion) {
          _params.gdbVersion = this.gdbVersion;
        }

        return esriRequest({
          url: this.parsedUrl.path + "/queryRelatedRecords",
          content: _params,
          callbackParamName: "callback"
        }, this.requestOptions)
          .then(this._handleExecuteRelationshipQueryResponse);
      },
  
      /**
      * Executes a {@link module:esri/tasks/support/Query Query} against an ArcGIS Server map layer. 
      * The result is an array of object IDs for features that satisfy the input query. 
      *
      * @param {module:esri/tasks/support/Query} params - Specifies the attributes and spatial filter of the query.
      *
      * @example
      * require([
      *   "esri/tasks/support/Query", "esri/tasks/QueryTask", ... 
      * ], function(Query, QueryTask, ... ) {
      *   var query = new Query();
      *   var queryTask = new QueryTask( ... );
      *   query.where = "region = 'Southern California'"; 
      *   queryTask.executeForIds(query).then(function(results){
      *     console.log(results);  //contains array of object IDs
      *   });
      *   ...
      * });
      *
      * @return {Promise} When resolved, the result is an array of object IDs for 
      * features that satisfy the input query. 
      */
      executeForIds: function(/*Object*/ params, context) {
        //summary: Execute the task and fire onComplete event.
        // params: Object: Parameters to pass to server to execute task

        var assembly = context.assembly,
            _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json", returnIdsOnly:true }, params.toJSON(assembly && assembly[0])));

        if (this.source) {
          var layer = {source: this.source.toJSON()};
          _params.layer = JSON.stringify(layer);
        }
        if (this.gdbVersion) {
          _params.gdbVersion = this.gdbVersion;
        }

        return esriRequest({
          url: this.parsedUrl.path + "/query",
          content: _params,
          callbackParamName: "callback"
        }, this.requestOptions)
          .then(this._handleExecuteForIdsResponse);
      },
      
      /**
      * Get a count of the number of features that satisfy the input query. Valid only for layers published 
      * using ArcGIS Server 10 SP1 or greater. Layers published with earlier versions of ArcGIS Server 
      * return an error to the `errback` param of `.then()`.  
      *
      * @param {module:esri/tasks/support/Query} params - Specifies the attributes and spatial filter of the query.
      *
      * @example
      * require([
      *   "esri/tasks/support/Query", "esri/tasks/QueryTask", ... 
      * ], function(Query, QueryTask, ... ) {
      *   var query = new Query();
      *   var queryTask = new QueryTask( ... );
      *   query.where = "POP90_SQMI &lt; 100"; 
      *   queryTask.executeForCount(query).then(function(count){
      *     console.log(count, " features matched the input query");
      *   }, function(error){
      *        console.log(error);  //will print error in console if unsupported layers are used
      *      });
      * });
      *
      * @return {Promise} When resolved, the result is the number of features that satisfy the input query.
      */
      executeForCount: function(/*Object*/ query, context) {
        var assembly = context.assembly,
            _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json", returnIdsOnly:true, returnCountOnly:true }, query.toJSON(assembly && assembly[0])));

        if (this.source) {
          var layer = {source: this.source.toJSON()};
          _params.layer = JSON.stringify(layer);
        }
        if (this.gdbVersion) {
          _params.gdbVersion = this.gdbVersion;
        }
  
        return esriRequest({
          url: this.parsedUrl.path + "/query",
          content: _params,
          callbackParamName: "callback"
        }, this.requestOptions)
          .then(this._handleExecuteForCountResponse);
      },

      // Duplication of executeForCount(). 
      // Only difference is returnExtentOnly is true instead of returnIdsOnly.
      // Result from this method always contains feature count too.
      
      /**
      * Get the extent of the features that satisfy the input query. The count of features that 
      * satisfy the input query is returned upon resolution as well. Valid only for 
      * [hosted feature services](http://doc.arcgis.com/en/arcgis-online/share-maps/hosted-web-layers.htm) 
      * on [arcgis.com](http://arcgis.com) and for ArcGIS Server 10.3.1 and later. 
      *
      * @param {module:esri/tasks/support/Query} params - Specifies the attributes and spatial filter of the query.
      *
      * @return {Promise} When resolved, returns the extent and count of the features
      * that satisfy the input query.
      */
      executeForExtent: function(query, context) {
        var assembly = context.assembly,
            _params = this._encode(lang.mixin({}, this.parsedUrl.query, { f:"json", returnExtentOnly:true, returnCountOnly:true }, query.toJSON(assembly && assembly[0])));

        if (this.source) {
          var layer = {source: this.source.toJSON()};
          _params.layer = JSON.stringify(layer);
        }
        if (this.gdbVersion) {
          _params.gdbVersion = this.gdbVersion;
        }

        return esriRequest({
          url: this.parsedUrl.path + "/query",
          content: _params,
          callbackParamName: "callback"
        }, this.requestOptions)
          .then(this._handleExecuteForExtentResponse);
      },
      
      /*******************
       * Internal Methods
       *******************/

      _handleExecuteResponse: function(response) {
        return FeatureSet.fromJSON(response);
      },

      _handleExecuteRelationshipQueryResponse: function(response) {
        var gt = response.geometryType, sr = response.spatialReference, result={};
        array.forEach(response.relatedRecordGroups, function(gr) {
          var fsetJson = {};
          fsetJson.geometryType = gt;
          fsetJson.spatialReference = sr;
          fsetJson.features = gr.relatedRecords;
          var fset = FeatureSet.fromJSON(fsetJson);
          if(gr.objectId != null) {
            result[gr.objectId] = fset;
          }
          else {
            //the returned response may be OBJECTID, FID, or different key, assuming response is always {key: <value>, relatedRecords: []}
            // REST API for query related feaures says that the returned json is {objectId: <value>, relatedRecords[]}, server should fix this discrepancy
            for(var key in gr) {
              if(gr.hasOwnProperty(key)) {
                if(key !== "relatedRecords") {
                  result[gr[key]] = fset;
                }
              }
            }
          }
        });

        return result;
      },

      _handleExecuteForIdsResponse: function(response) {
        return response.objectIds;
      },

      _handleExecuteForCountResponse: function(response) {
        var returnValue, features = response.features, ids = response.objectIds;

        if (ids) {
          // 10.0 server
          // Query operation of this layer does not seem to support
          // 'returnCountOnly' parameter. Let's return the count
          // anyway.
          returnValue = ids.length;
        }
        else if (features) {
          // 9.3 or 9.3.1 server
          // Query responses containing feature set are subject to
          // limitation on the number of features returned and does
          // not reflect the exact count. Throw an error.
          throw new Error("Unable to perform query. Please check your parameters.");
        }
        else {
          // 10 SP1 server
          returnValue = response.count;
        }

        return returnValue;
      },

      _handleExecuteForExtentResponse: function(response) {
        if (response.extent) {
          response.extent = Extent.fromJSON(response.extent);
        }

        return response;
      }

    }

  );
  
  normalizeUtils._createWrappers(QueryTask);

  return QueryTask;
});
