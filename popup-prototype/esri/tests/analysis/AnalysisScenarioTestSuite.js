define([
  "intern!object",
  "intern/chai!assert",
  "esri/widgets/analysis/AnalysisBase",
  "./utils/AnalysisUtils",
  "./utils/config"


], function(registerSuite, assert, AnalysisBase, AnalysisUtils, testConfig) {
  var analysisTask,
    dfd;
  registerSuite({
    name: "AnalysisScenarioTestSuite",

    setup: function() {
      /*Initialize analysisbase*/
      analysisTask = new AnalysisBase({
        portalUrl: testConfig.portalUrl
      });
      AnalysisUtils.init(testConfig);
      AnalysisUtils.analysisTask = analysisTask;
    },
    
    "return Feature Collection test": function() {
      var timeout = 60000;
      dfd = this.async(timeout);
      analysisTask.signInPromise.then(function(credential) {
        //console.log(credential);
        AnalysisUtils.analyze("CreateBuffers").then(dfd.callback(function(response) {
          var result = response.result,
            time = response.time;
          assert.isDefined(result.value, "result defined");
          assert.isDefined(result.value.featureSet.features, "result returned as feature collections");
          assert.strictEqual(result.value.featureSet.features.length, 3, "Expected number of features for the result are equal");
        }), dfd.reject.bind(dfd));
      });
    },

    "create buffers test": function() {
      var timeout = 60000;
      dfd = this.async(timeout);
      analysisTask.signInPromise.then(function(credential) {
        //console.log(credential);
        AnalysisUtils.analyze("CreateBuffers").then(dfd.callback(function(response) {
          var result = response.result,
            time = response.time;
          console.log(response);
          assert.isDefined(result.value, "result defined");
          assert.strictEqual(result.value.featureSet.features.length, 3, "Expected number of features for the result are equal");
          assert.operator(time, "<", 15000);

        }), dfd.reject.bind(dfd));
      });
    },

    "create viewshed test": function() {
      var timeout = 60000;
      dfd = this.async(timeout);
      analysisTask.signInPromise.then(function(credential) {
        //console.log(credential);
        AnalysisUtils.analyze("CreateViewshed").then(dfd.callback(function(response) {
          var result = response.result,
            time = response.time;
          console.log(response);
          assert.isDefined(result.value, "result defined");
          assert.strictEqual(result.value.featureSet.features.length, 1, "Expected number of features for the result are equal");
          assert.operator(time, "<", 15000);

        }), dfd.reject.bind(dfd));
      });
    },

    "create drivetimeareas test": function() {
      var timeout = 60000;
      dfd = this.async(timeout);
      analysisTask.signInPromise.then(function(credential) {
        //console.log(credential);
        AnalysisUtils.analyze("CreateDriveTimeAreas").then(dfd.callback(function(response) {
          var result = response.result,
            time = response.time;
          console.log(response);
          assert.isDefined(result.value, "result defined");
          assert.strictEqual(result.value.featureSet.features.length, 3, "Expected number of features for the result are equal");
          assert.operator(time, "<", 15000);

        }), dfd.reject.bind(dfd));
      });
    },

    "create watersheds test": function() {
      var timeout = 60000;
      dfd = this.async(timeout);
      analysisTask.signInPromise.then(function(credential) {
        //console.log(credential);
        AnalysisUtils.analyze("CreateWatersheds").then(dfd.callback(function(response) {
          var result = response.result,
            time = response.time;
          console.log(response);
          assert.isDefined(result.value, "result defined");
          assert.strictEqual(result.value.featureSet.features.length, 1, "Expected number of features for the result are equal");
          assert.operator(time, "<", 15000);

        }), dfd.reject.bind(dfd));
      });
    },

    // after the suite is done
    teardown: function() {
      analysisTask = null;
    }


  });

});
