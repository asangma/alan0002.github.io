define([
  'intern!object',
  'intern/chai!assert',

  'esri/tasks/ImageServiceIdentifyTask',
  "esri/tasks/support/ImageServiceIdentifyParameters",
  "esri/tasks/support/ImageServiceIdentifyResult",

  "esri/geometry/Point",
  "esri/geometry/Multipoint",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/geometry/Extent",
  "esri/geometry/SpatialReference",

  "esri/layers/support/MosaicRule",
  "esri/layers/support/RasterFunction",

  "esri/symbols/SimpleMarkerSymbol"
], function(
  registerSuite, assert,
  ImageServiceIdentifyTask, ImageServiceIdentifyParameters, ImageServiceIdentifyResult,
  Point, Multipoint, Polygon, Polyline, Extent, SpatialReference,
  MosaicRule, RasterFunction,
  SimpleMarkerSymbol
){

  var imageServiceIdentifyTask, params,
    executeImageServiceIdentifyTask,
    point, polygon,
    expectedResult;

  registerSuite({
    name: "esri/tasks/ImageServiceIdentifyTask",

    setup: function(){
      imageServiceIdentifyTask = new ImageServiceIdentifyTask("http://sampleserver6.arcgisonline.com/arcgis/rest/services/ScientificData/SeaTemperature/ImageServer");

      point = new Point(-140.21682693482441, 34.05828952743655, new SpatialReference({wkid: 4326}));

      polygon = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ]);


      executeImageServiceIdentifyTask = function(dfd, params, expected) {

        imageServiceIdentifyTask.execute(params).then(
          dfd.callback(function(result) {
            assert.instanceOf(result, ImageServiceIdentifyResult, "should be an instance of ImageServiceIdentifyResult");

            for(var prop in expected) {
              if(prop === "name" || prop === "value"){
                assert.equal(result[prop], expected[prop], "property should be same");
              }
            }

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    teardown: function(){},

    beforeEach: function(){
      params = new ImageServiceIdentifyParameters();
    },

    afterEach: function(){},

    //test suites
    "geometry": {
      "point": function() {
        params.geometry = point;

        expectedResult = {
          value: "3.139"
        };

        var dfd = this.async(20000);
        executeImageServiceIdentifyTask(dfd, params, expectedResult);
      },

      "polygon": function() {
        params.geometry = polygon;

        expectedResult = {
          value: "2.893"
        };

        var dfd = this.async(20000);
        executeImageServiceIdentifyTask(dfd, params, expectedResult);
      }
    },

    "mosaicRule": function() {
      params.geometry = point;

      var mr  = new MosaicRule();
      mr.method = MosaicRule.METHOD_LOCKRASTER;

      params.mosaicRule = mr;
      expectedResult = {
        value: "5.956"
      };

      var dfd = this.async(20000);
      executeImageServiceIdentifyTask(dfd, params, expectedResult);
    },

    "noData": function() {
      params.geometry = point;
      params.noData = 0;

      expectedResult = {
        value: "3.139"
      };

      var dfd = this.async(20000);
      executeImageServiceIdentifyTask(dfd, params, expectedResult);
    },

    "renderingRule": function() {
      params.geometry = point;
      var rasterFunction = new RasterFunction();
      rasterFunction.functionName = "Hillshade";
      rasterFunction.functionArguments = {
        "Altitude":75.0,
        "ZFactor":0.3
      };
      rasterFunction.variableName = "DEM";

      params.renderingRule = rasterFunction;

      expectedResult = {
        value: "248"
      };

      var dfd = this.async(20000);
      executeImageServiceIdentifyTask(dfd, params, expectedResult);
    },

    "pixelSizeX": function(){
      params.geometry = point;
      params.pixelSizeX = 0.5;

      expectedResult = {
        value: "3.139"
      };

      var dfd = this.async(20000);
      executeImageServiceIdentifyTask(dfd, params, expectedResult);
    },

    "pixelSizeY": function(){
      params.geometry = point;
      params.pixelSizeY = 0.5;

      expectedResult = {
        value: "3.139"
      };

      var dfd = this.async(20000);
      executeImageServiceIdentifyTask(dfd, params, expectedResult);
    },

    "pixelSize": function(){
      params.geometry = point;
      params.pixelSize = new SimpleMarkerSymbol();

      expectedResult = {
        value: "3.139"
      };

      var dfd = this.async(20000);
      executeImageServiceIdentifyTask(dfd, params, expectedResult);
    }

  });

});