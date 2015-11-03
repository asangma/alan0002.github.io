define([
  "../core/declare", 
  "dojo/_base/lang", 
  "dojo/_base/array", 
  "dojo/has",
  "../tasks/support/Query",
  "./FeatureLayerQueryResult", 
  "dojo/i18n!../nls/jsapi"
], function (
  declare, lang, array, has, Query, FeatureLayerQueryResult, esriKernel
) {
    
  var FeatureLayerQueryStore = declare(null, {

    queryUrl:"",
    idProperty:"id",
    data: [],

    constructor: function (options, srcRefNode) {
      declare.safeMixin(this, options);

      this.layer = options.layer;

      // null for server side paging
      this.objectIds = options.objectIds;         

      // required for server side paging
      this.where = options.where;     
      this.orderByFields = options.orderByFields; 

      this.totalCount = options.totalCount;
      this.batchCount = options.batchCount || 25;
      this.idProperty = this.layer.objectIdField;

    }, // End constructor

    get: function (id, options) {
      return this.data[id];
    },
    getIdentity: function (object) {
      return object[this.idProperty];
    },
    
    query: function (query, options) {

    var queryObj = new Query();
    var start = (options.start || 0);
    var count = /*options.count ||*/ this.batchCount;
    
    if (this.objectIds) {
    
      if (this.objectIds.length >= (start+this.batchCount)) {
        queryObj.objectIds = this.objectIds.slice(start, start+count);
      } else {
        queryObj.objectIds = this.objectIds.slice(start);
      }
      
    } else {
      // server supports paging
      queryObj.start = start;
      queryObj.num = count; // doesn't matter if there are not <num> features left
      queryObj.where = this.where;
      queryObj.orderByFields = this.orderByFields;
    }
    
    queryObj.returnGeometry = false;
    queryObj.outFields = ["*"];
    var totalCount = this.totalCount;

    var results = this.layer.queryFeatures(queryObj);
    results.total = results.then(lang.hitch(this, function(result){

      if (this.objectIds) {
        // sort the resulting features to the order of the objectIds sent in
        var objectIdFieldName = result.objectIdFieldName;
        if (!objectIdFieldName) {
          for (var i = 0; i < result.fields.length; i++){
            if (result.fields[i].type == "esriFieldTypeOID"){
              objectIdFieldName = result.fields[i].name;
              break;
            }
          }
        }
        
        var lookup = {};
        for(var i = 0; i < result.features.length; i++){
          lookup[result.features[i].attributes[objectIdFieldName]] = result.features[i];
        }
        
        result.features = array.map(queryObj.objectIds, function(objectId) {
        return lookup[objectId];
        });
      }

      // modify the JSON response to an array of objects containing the info for grid rows
      for (var i = 0; i < result.features.length; i++){
        result.features[i] = result.features[i].attributes;
        this.data[result.features[i][objectIdFieldName]] = result.features[i];
      }
      
      result = result.features;

      return totalCount;

    }), function(){
      console.log("FeatureLayerQueryStore queryFeatures failed.");			
      return 0;
    });

    return new FeatureLayerQueryResult(results);
  }
    
  });
  
  return FeatureLayerQueryStore;
});
