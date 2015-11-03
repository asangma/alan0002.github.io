define([
  'intern!object',
  'intern/chai!assert',
  'sinonFakeServer!createFakeServer',
  'esri/tasks/support/Query',
  'esri/tasks/QueryTask',
  'esri/tasks/support/FeatureSet',
  'esri/tasks/support/RelationshipQuery',
  'esri/geometry/Extent',
  'dojo/text!FeatureService/sampleQueryResponse.json',
  'dojo/text!FeatureService/relatedRecordsOnLayer.json'
], function(registerSuite, assert, createFakeServer, Query, QueryTask, FeatureSet, RelationshipQuery, Extent, sampleQueryResponse, relatedRecordsOnLayer){

  var server,
    query,
    featureLayerUrl,
    queryTask;

  registerSuite({
    name: 'esri/tasks/QueryTask',

    setup: function(){
      featureLayerUrl = '/arcgis-js-api-4.0/rest/services/Demographics/ESRI_Census_USA/MapServer/5';
    },

    beforeEach: function(){
      queryTask = new QueryTask(featureLayerUrl);
      query = new Query();
      server = createFakeServer();
    },

    afterEach: function(){
      server.restore();
    },

    teardown: function () {

    },

    execute: function(){

      query.text = 'California';
      query.returnGeometry = false;
      query.outFields = [
        "SQMI", "STATE_NAME", "STATE_FIPS"
      ];
      var queryOutFieldsLength = query.outFields.length;

      assert.isFunction(queryTask.execute, 'execute should be a function');

      var dfd = this.async(10000);

      server.respondWith("GET", featureLayerUrl + '/query?f=json&text=California&where=&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=SQMI%2CSTATE_NAME%2CSTATE_FIPS',
        [200, { "Content-Type": "application/json" },
          sampleQueryResponse]);

      queryTask.execute(query).then(
        dfd.callback(function(result) {

          assert.instanceOf(result, FeatureSet, 'result should be an instance of FeatureSet');

          assert.property(result, 'displayFieldName', 'result should have a property called displayFieldName');
          assert.property(result, 'fieldAliases', 'result should have a property called fieldAliases');
          assert.property(result, 'fields', 'result should have a property called fields');
          assert.property(result, 'features', 'result should have a property called features');

          assert.isArray(result.fields, 'fields is an array');
          assert.isArray(result.features, 'features is an array');

          assert.lengthOf(result.fields, queryOutFieldsLength, 'fields array should have a length same as query fields array');

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });

      server.respond();
    },

    executeForCount: function(){

      query.text = 'California';

      assert.isFunction(queryTask.executeForCount, 'execute should be a function');

      var dfd = this.async(10000);

      server.respondWith("GET", featureLayerUrl + '/query?f=json&returnIdsOnly=true&returnCountOnly=true&text=California&where=&returnGeometry=false&spatialRel=esriSpatialRelIntersects',
        [200, { "Content-Type": "application/json" },
          '{count: 1}']);

      queryTask.executeForCount(query).then(
        dfd.callback(function(result) {

          assert.equal(result, 1, 'Gets a count of the number of features that satisfy the input query');

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });

      server.respond();
    },

    executeForIds: function(){

      query.text = 'California';

      assert.isFunction(queryTask.executeForIds, 'execute should be a function');

      var dfd = this.async(10000);

      server.respondWith("GET", featureLayerUrl + '/query?f=json&returnIdsOnly=true&text=California&where=&returnGeometry=false&spatialRel=esriSpatialRelIntersects',
        [200, { "Content-Type": "application/json" },
          '{"objectIdFieldName":"ObjectID","objectIds":[24]}']);

      queryTask.executeForIds(query).then(
        dfd.callback(function(result) {

          assert.isArray(result, 'The result is an array of object IDs for features that satisfy the input query. ');
          assert.equal(result[0], 24, 'The first object ID in the array should be retrieved');

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });

      server.respond();
    },

    executeForExtent: function(){

      /*
      Example - http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/california_census_blocks/FeatureServer/0/query?where=OBJECTID%3C100&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Meter&outFields=&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=true&returnExtentOnly=true&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&f=html&token=
      Layer - http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/california_census_blocks/FeatureServer/0
       */

      query.where = "OBJECTID<100";

      assert.isFunction(queryTask.executeForExtent, 'execute should be a function');

      var dfd = this.async(60000);

      server.respondWith("GET", featureLayerUrl + '/query?f=json&returnExtentOnly=true&returnCountOnly=true&where=OBJECTID%3C100&returnGeometry=false&spatialRel=esriSpatialRelIntersects',
        [200, { "Content-Type": "application/json" },
          '{"count" : 99,"extent" : {"xmin" : -13472720.451269185, "ymin" : 4442099.293287592, "xmax" : -13306863.872090843, "ymax" : 4698376.1958611291, "spatialReference" : {"wkid" : 102100, "latestWkid" : 3857}}}']);

      queryTask.executeForExtent(query).then(
        dfd.callback(function(result) {

          assert.equal(result.count, 99, 'Gets the count of features that satisfy the input query');
          assert.instanceOf(result.extent, Extent, 'Gets the extent of the features that satisfy the input query');

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });

      server.respond();
    },

    executeRelationshipQuery: function(){
      // Example - http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#/Query_Related_Records_Map_Service_Layer/02ss00000004000000/
      //queryTask = new QueryTask('http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Petroleum/KSPetro/MapServer/0');
      var relatedQuery = new RelationshipQuery();
      relatedQuery.outFields = ["*"];
      relatedQuery.relationshipId = 2;
      relatedQuery.objectIds = [1,2,3,4,5];
      relatedQuery.returnGeometry = false;

      assert.isFunction(queryTask.executeRelationshipQuery, 'execute should be a function');

      var dfd = this.async(10000);

      server.respondWith("GET", featureLayerUrl + '/queryRelatedRecords?f=json&definitionExpression=&relationshipId=2&returnGeometry=false&objectIds=1%2C2%2C3%2C4%2C5&outFields=*',
        [200, { "Content-Type": "application/json" },
          relatedRecordsOnLayer]);

      queryTask.executeRelationshipQuery(relatedQuery).then(
        dfd.callback(function(result) {

          assert.instanceOf(result[1], FeatureSet, 'Executes a RelationshipQuery against an ArcGIS Server map layer an returns a FeatureSet');
          assert.instanceOf(result[2], FeatureSet, 'Executes a RelationshipQuery against an ArcGIS Server map layer an returns a FeatureSet');
          assert.instanceOf(result[3], FeatureSet, 'Executes a RelationshipQuery against an ArcGIS Server map layer an returns a FeatureSet');
          assert.equal(result[4], null, 'should be null as it is not related');
          assert.equal(result[5], null, 'should be null as it is not related');

          assert.isArray(result[1].features, 'features is an array');
          assert.isArray(result[2].features, 'features is an array');
          assert.isArray(result[3].features, 'features is an array');

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });

      server.respond();
    }

  });
});
