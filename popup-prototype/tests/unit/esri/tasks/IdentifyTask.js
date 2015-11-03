define([
  'intern!object',
  'intern/chai!assert',

  "esri/geometry/Point",
  "esri/geometry/Multipoint",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/geometry/Extent",
  "esri/geometry/SpatialReference",

  'esri/tasks/IdentifyTask',
  "esri/tasks/support/IdentifyParameters"
], function(
  registerSuite, assert,
  Point, Multipoint, Polygon, Polyline, Extent, SpatialReference,
  IdentifyTask, IdentifyParameters
){

  var identifyTask, params,
    executeIdentifyTask, getGeometry,
    expectedResult;

  registerSuite({
    name: "esri/tasks/IdentifyTask",

    setup: function(){
      identifyTask = new IdentifyTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/BloomfieldHillsMichigan/Parcels/MapServer");

      executeIdentifyTask = function(dfd, params, expected) {

        identifyTask.execute(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expected.length, "should return the same array");

            expected.forEach(function(itemExp, idx){
              for(var prop in expected) {
                assert.equal(result[idx][prop], itemExp[prop], "must have the same value for "+prop);
              }
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      };

      getGeometry = function(type){
        var geo;
        if(type === "Point"){
          geo = new Point(-9270108.500731206, 5247176.618485742, new SpatialReference({wkid: 102100}));
        } else if(type === "Multipoint"){
          geo = new Multipoint(
            [[-9270108.500731206, 5247176.618485742],[-9270184.34059522, 5247221.405807009]],
            SpatialReference.WebMercator
          );
        } else if(type === "Polyline"){
          geo = new Polyline(
            [[[-9270108.500731206, 5247176.618485742],[-9270184.34059522, 5247221.405807009]]],
            SpatialReference.WebMercator
          );
        } else if(type === "Polygon"){
          geo = new Polygon(
            [[[-9270222.559109367, 5247198.11639995],[-9270250.625830693, 5247291.871192469],[-9270129.401481131, 5247257.235664022]]],
            SpatialReference.WebMercator
          );
        }

        return geo;
      }

    },

    teardown: function(){},

    beforeEach: function () {
      params = new IdentifyParameters();
      params.returnGeometry = true;
      params.tolerance = 1;
      params.mapExtent = new Extent(-9270362.892716004, 5246943.12725087, -9269898.298903393, 5247461.465849, new SpatialReference({ wkid: 102100 }));
    },

    afterEach: function(){},

    //test suites
    "layerOption": {
      "LAYER_OPTION_TOP": {
        "point": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
          params.geometry = getGeometry("Point");
          params.returnGeometry = false;

          expectedResult =[
            {
              layerId: 0,
              value: "1921201008"
            }
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Multipoint": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
          params.geometry = getGeometry("Multipoint");

          expectedResult.push(
            {
              layerId: 0,
              value: "1921201008"
            }
          );

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Polyline": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
          params.geometry = getGeometry("Polyline");

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Polygon": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
          params.geometry = getGeometry("Polygon");

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        }
      },

      "LAYER_OPTION_ALL": {
        "point": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
          params.geometry = getGeometry("Point");

          expectedResult =[
            {
              layerId: 0,
              value: "1921201008"
            },
            {
              layerId: 1,
              value: "NT1"
            },
            {
              layerId: 2,
              value: "1921201008"
            }
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Multipoint": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
          params.geometry = getGeometry("Multipoint");
          params.returnGeometry = false;

          expectedResult =[
            {
              layerId: 0,
              value: "1921201004"
            },
            {
              layerId: 0,
              value: "1921201008"
            },
            {
              layerId: 1,
              value: "NT1"
            },
            {
              layerId: 2,
              value: "1921201004"
            },
            {
              layerId: 2,
              value: "1921201008"
            }
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Polyline": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
          params.geometry = getGeometry("Polyline");

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Polygon": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
          params.geometry = getGeometry("Polygon");

          expectedResult =[
            {layerId: 0},{layerId: 0},{layerId: 1},{layerId: 1},{layerId: 2},{layerId: 2},{layerId:2},{layerId: 2},{layerId: 2}
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        }
      },

      "LAYER_OPTION_VISIBLE": {
        "point": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
          params.geometry = getGeometry("Point");

          expectedResult =[
            {
              layerId: 0,
              value: "1921201008"
            },
            {
              layerId: 1,
              value: "NT1"
            },
            {
              layerId: 2,
              value: "1921201008"
            }
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Multipoint": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
          params.geometry = getGeometry("Multipoint");

          expectedResult =[
            {
              layerId: 0,
              value: "1921201004"
            },
            {
              layerId: 0,
              value: "1921201008"
            },
            {
              layerId: 1,
              value: "NT1"
            },
            {
              layerId: 2,
              value: "1921201004"
            },
            {
              layerId: 2,
              value: "1921201008"
            }
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Polyline": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
          params.geometry = getGeometry("Polyline");
          params.returnGeometry = false;

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        },

        "Polygon": function() {
          params.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
          params.geometry = getGeometry("Polygon");

          expectedResult =[
            {layerId: 0},{layerId: 0},{layerId: 1},{layerId: 1},{layerId: 2},{layerId: 2},{layerId:2},{layerId: 2},{layerId: 2}
          ];

          var dfd = this.async(10000);
          executeIdentifyTask(dfd, params, expectedResult);
        }
      },
    },

    "layerIds": {
      "layer 0": function() {
        params.layerIds = [0]
        params.geometry = getGeometry("Point");
        params.returnGeometry = false;
        expectedResult =[
          {layerId: 0}
        ];

        var dfd = this.async(10000);
        executeIdentifyTask(dfd, params, expectedResult);
      },
      "layer 1": function() {
        params.layerIds = [1]
        params.geometry = getGeometry("Point");
        expectedResult =[
          {layerId: 1}
        ];

        var dfd = this.async(10000);
        executeIdentifyTask(dfd, params, expectedResult);
      }
    }

  });

});