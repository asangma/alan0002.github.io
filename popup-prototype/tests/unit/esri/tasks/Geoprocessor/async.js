define([
  'intern!object',
  'intern/chai!assert',

  "esri/Graphic",
  "esri/geometry/Point",

  'esri/tasks/Geoprocessor',
  "esri/tasks/support/ParameterValue",

  "esri/layers/support/ImageParameters",

  "esri/geometry/SpatialReference"
], function(
  registerSuite, assert,
  Graphic, Point,
  Geoprocessor, ParameterValue,
  ImageParameters,
  SpatialReference
){

  var geoprocessor, params,
    executeGeoprocessorTask,
    expectedResult, actualResult;

  registerSuite({
    name: "esri/tasks/Geoprocessor/async",

    setup: function(){

    },

    teardown: function(){},

    beforeEach: function(){},

    afterEach: function(){},

    //test suites
    "GPString": {
      "submitJob": function() {
        geoprocessor = new Geoprocessor("http://sampleserver6.arcgisonline.com/arcgis/rest/services/911CallsHotspot/GPServer/911%20Calls%20Hotspot");

        params = {
          Query: "(DATE > date '1998-01-01 00:00:00' AND DATE < date '1998-01-31 00:00:00') AND (Day = 'SUN' OR Day= 'SAT')"
        };

        expectedResult = {
          jobId: "ja28c165aadbe4381a3ff119bb0d9d33a",
          jobStatus: "esriJobSucceeded",
          messages: [],
          results: {
            Hotspot_Raster: {
              paramUrl: "results/Hotspot_Raster"
            },
            Output_Features: {
              paramUrl: "results/Output_Features"
            }

          }
        };

        var dfd = this.async(20000);
        geoprocessor.submitJob(params).then(
          dfd.callback(function(result) {
            actualResult = result;
            assert.property(result, "jobId","should have jobId property");
            assert.equal(result.jobStatus, expectedResult.jobStatus,"should have same value");
            assert.equal(result.results.Hotspot_Raster.paramUrl, expectedResult.results.Hotspot_Raster.paramUrl,"should have same value");
            assert.equal(result.results.Output_Features.paramUrl, expectedResult.results.Output_Features.paramUrl,"should have same value");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "checkJobStatus": function() {
        expectedResult = {
          jobStatus: "esriJobSucceeded"
        };

        var dfd = this.async(20000);
        geoprocessor.checkJobStatus(actualResult.jobId).then(
          dfd.callback(function(result) {
            assert.equal(result.jobStatus, expectedResult.jobStatus,"should have same value");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "getResultImageLayer": function() {

        var imageParameters = new ImageParameters();
        imageParameters.format = "jpeg";

        expectedResult = {
          dataType: "GPRasterDataLayer",
          paramName: "Hotspot_Raster",
          value: {
            mapImage: {
              height: 400,
              href: "http://sampleserver6.arcgisonline.com/arcgis/rest/directories/arcgisoutput/911CallsHotspot_GPServer/911CallsHotspot_MapServer/_ags_mape4a9244b994d4254b1c31dfa22000283.png",
              scale: 122256.20395753652,
              width: 400
            }
          }
        };

        var dfd = this.async(20000);
        geoprocessor.getResultImageLayer(actualResult.jobId, "Hotspot_Raster", imageParameters).then(
          dfd.callback(function(result) {
            assert.equal(result.dataType, expectedResult.dataType,"should have same value");
            assert.equal(result.paramName, expectedResult.paramName,"should have same value");
            assert.equal(result.value.mapImage.height, expectedResult.value.mapImage.height,"should have same value");
            assert.equal(result.value.mapImage.scale, expectedResult.value.mapImage.scale,"should have same value");
            assert.equal(result.value.mapImage.width, expectedResult.value.mapImage.width,"should have same value");
            assert.property(result.value.mapImage, "href","should have href property");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "getResultImage": function() {

        var imageParameters = new ImageParameters();
        imageParameters.format = "jpeg";

        expectedResult = {
          dataType: "GPRasterDataLayer",
          paramName: "Hotspot_Raster",
          value: {
            height: 400,
            href: "http://sampleserver6.arcgisonline.com/arcgis/rest/directories/arcgisoutput/911CallsHotspot_GPServer/911CallsHotspot_MapServer/_ags_mape4a9244b994d4254b1c31dfa22000283.png",
            scale: 122256.20395753652,
            width: 400
          }
        };

        var dfd = this.async(20000);
        geoprocessor.getResultImage(actualResult.jobId, "Hotspot_Raster", imageParameters).then(
          dfd.callback(function(result) {
            assert.equal(result.dataType, expectedResult.dataType,"should have same value");
            assert.equal(result.paramName, expectedResult.paramName,"should have same value");
            assert.equal(result.value.height, expectedResult.value.height,"should have same value");
            assert.equal(result.value.scale, expectedResult.value.scale,"should have same value");
            assert.equal(result.value.width, expectedResult.value.width,"should have same value");
            assert.property(result.value, "href","should have href property");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    "GPDouble & GPBoolean": {
      "submitJob": function() {
        geoprocessor = new Geoprocessor("http://sampleserver4.arcgisonline.com/ArcGIS/rest/services/Arcpy/ArcpyMapping/GPServer/SaveToPDF");

        params = {
          xMin: -118.47227956000316,
          yMin: 34.42667282134429,
          xMax: -118.25178808203981,
          yMax: 34.562435378250505,
          Spatial_Reference: "4326",
          Map_Scale: 2,
          Layout: "Portrait 8x11.mxd",
          Map_Title: "test",
          Include_Attributes: true
        };

        expectedResult = {
          jobId: "ja28c165aadbe4381a3ff119bb0d9d33a",
          jobStatus: "esriJobSucceeded",
          messages: [
            {
              description: "Submitted."
            },
            {
              description: "Executing..."
            },
            {
              description: "Succeeded."
            }
          ],
          results: {
            Output: {
              paramUrl: "results/Output"
            }
          }
        };

        var dfd = this.async(20000);
        geoprocessor.submitJob(params).then(
          dfd.callback(function(result) {
            actualResult = result;

            assert.property(result, "jobId","should have jobId property");
            assert.equal(result.jobStatus, expectedResult.jobStatus,"should have same value");
            assert.equal(result.results.Output.paramUrl, expectedResult.results.Output.paramUrl,"should have same value");

            expectedResult.messages.forEach(function (msg, idx) {
              assert.equal(result.messages[idx].description, msg.description,"should have same value");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "checkJobStatus": function() {
        expectedResult = {
          jobStatus: "esriJobSucceeded"
        };

        var dfd = this.async(20000);
        geoprocessor.checkJobStatus(actualResult.jobId).then(
          dfd.callback(function(result) {
            assert.equal(result.jobStatus, expectedResult.jobStatus,"should have same value");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "getResultData": function() {
        expectedResult = {
          dataType: "GPDataFile",
          paramName: "Output",
          value: {
            url: "http://sampleserver4.arcgisonline.com/arcgisjobs/arcpy/arcpymapping_gpserver/j6b86ec2679084d08907706227770277f/scratch/Output.pdf"
          }
        };

        var dfd = this.async(20000);
        geoprocessor.getResultData(actualResult.jobId, "Output").then(
          dfd.callback(function(result) {
            assert.instanceOf(result, ParameterValue, "should be an instance of ParameterValue");
            assert.equal(result.dataType, expectedResult.dataType, "should have same value");
            assert.equal(result.paramName, expectedResult.paramName, "should have same value");
            assert.property(result.value, "url","should have url property");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }

    }

  });

});