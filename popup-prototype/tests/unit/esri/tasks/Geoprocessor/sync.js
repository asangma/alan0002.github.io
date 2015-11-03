define([
  'intern!object',
  'intern/chai!assert',

  "esri/Graphic",
  "esri/geometry/Point",
  "esri/geometry/Polyline",
  "esri/geometry/Polygon",

  'esri/tasks/Geoprocessor',
  "esri/tasks/support/FeatureSet",
  "esri/tasks/support/LinearUnit",

  "esri/geometry/SpatialReference"
], function(
  registerSuite, assert,
  Graphic, Point, Polyline, Polygon,
  Geoprocessor, FeatureSet, LinearUnit,
  SpatialReference
){

  var geoprocessor, params,
    executeGeoprocessorTask,
    expectedResult;

  registerSuite({
    name: "esri/tasks/Geoprocessor/sync",

    setup: function(){

      executeGeoprocessorTask = function(dfd, params, expected) {

        geoprocessor.execute(params).then(
          dfd.callback(function(result) {
            expected.results.forEach(function (exp, idx) {
              assert.equal(result.results[idx].dataType, exp.dataType, "should have same value");
              assert.equal(result.results[idx].paramName, exp.paramName, "should have same value");

              exp.value.features.forEach(function (feature, index) {
                for(var prop in feature.attributes) {
                  assert.equal(result.results[idx].value.features[index].attributes[prop], feature.attributes[prop], "should have same value");
                }
              });
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    teardown: function(){},

    beforeEach: function(){},

    afterEach: function(){},

    //test suites
    "execute": {
      "GPFeatureRecordSetLayer": function() {

        geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/GPServer/PopulationSummary");

        var polygon = new Polygon([
          [-87.572, 33.329],
          [-86.572, 34.329],
          [-85.572, 32.329],
          [-87.572, 33.329]
        ], new SpatialReference({wkid: 4326}));

        var polygonGraphic = new Graphic({
          geometry: polygon
        });

        var featureSet = new FeatureSet();
        featureSet.features = [polygonGraphic];

        params = {"inputPoly": featureSet };

        expectedResult = {
          messages: [],
          results: [
            {
              dataType: "GPRecordSet",
              paramName: "StatsSummary",
              value: {
                features: [
                  {
                    attributes: {
                      AREA: 1.520833,
                      COUNT: 876,
                      MAX: 29688.7,
                      MEAN: 1310.195,
                      MIN: 77.76241,
                      RANGE: 29610.94,
                      STD: 2999.118,
                      SUM: 1147731
                    }
                  }
                ]
              }
            }
          ]
        };

        var dfd = this.async(20000);
        executeGeoprocessorTask(dfd, params, expectedResult);

      },

      "GPLinearUnit": function() {

        geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Elevation/ESRI_Elevation_World/GPServer/Viewshed");

        var point = new Point([-122.436, 37.73], new SpatialReference({wkid: 4326}));

        var pointGraphic = new Graphic({
          geometry: point
        });

        var featureSet = new FeatureSet();
        featureSet.features = [pointGraphic];

        var linearUnit = new LinearUnit();
        linearUnit.distance = 5;
        linearUnit.units = "esriMiles";

        params = {
          "Input_Observation_Point": featureSet,
          "Viewshed_Distance": linearUnit
        };

        expectedResult = {
          messages: [],
          results: [
            {
              dataType: "GPFeatureRecordSetLayer",
              paramName: "Viewshed_Result",
              value: {
                features: [
                  {
                    attributes: {
                      Shape_Area: 63095.99375910229,
                      Shape_Length: 1123.3520708866417
                    }
                  }
                ]
              }
            }
          ]
        };

        var dfd = this.async(20000);
        executeGeoprocessorTask(dfd, params, expectedResult);
      },

      "GPString": function() {

        geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Network/ESRI_DriveTime_US/GPServer/CreateDriveTimePolygonsDisks");

        var point = new Point([-122.436, 37.73], new SpatialReference({wkid: 4326}));

        var pointGraphic = new Graphic({
          geometry: point
        });

        var featureSet = new FeatureSet();
        featureSet.features = [pointGraphic];

        params = {
          "Input_Location": featureSet,
          "Drive_Times": "10 20 30"
        };

        expectedResult = {
          messages: [],
          results: [
            {
              dataType: "GPFeatureRecordSetLayer",
              paramName: "Output_Drive_Time_Polygons",
              value: {
                features: [
                  {
                    attributes: {
                      Name: "Location 1 : 0 - 10",
                      Shape_Area: 0.022710339721524954,
                      Shape_Length: 0.6680874534313284
                    }
                  }
                ]
              }
            }
          ]
        };

        var dfd = this.async(20000);
        executeGeoprocessorTask(dfd, params, expectedResult);
      },

      "GPDouble": function() {

        geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_Currents_World/GPServer/MessageInABottle");

        var point = new Point([-122.436, 37.73], new SpatialReference({wkid: 4326}));

        var pointGraphic = new Graphic({
          geometry: point
        });

        var featureSet = new FeatureSet();
        featureSet.features = [pointGraphic];

        params = {
          "Input_Point": featureSet,
          "Days": 125
        };

        expectedResult = {
          messages: [],
          results: [
            {
              dataType: "GPFeatureRecordSetLayer",
              paramName: "Output",
              value: {
                features: [
                  {
                    attributes: {
                      Shape_Length: 23.380360289362194
                    }
                  }
                ]
              }
            }
          ]
        };

        var dfd = this.async(20000);
        executeGeoprocessorTask(dfd, params, expectedResult);
      },

      "GPRecordSet": function() {

        geoprocessor = new Geoprocessor("http://sampleserver5.arcgisonline.com/arcgis/rest/services/GDBVersions/GPServer/ListVersions");

        var inputRecordSetJson = {
          "features": [
            {
              "attributes": {
                "ObjectID": 29,
                "name": "gdb.Test",
                "created": 1345987983000,
                "access": "Private",
                "description": "",
                "isowner": "True",
                "lastmodified": 1367235140000,
                "parentversionname": "sde.DEFAULT"
              }
            }
          ],
          "exceededTransferLimit": false
        };

        var featureSet = FeatureSet.fromJSON(inputRecordSetJson);

        params = {
          "Versions": featureSet
        };

        expectedResult = {
          messages: [],
          results: [
            {
              dataType: "GPRecordSet",
              paramName: "Versions",
              value: {
                features: [
                  {
                    attributes: {
                      ObjectID: 1,
                      access: "Public",
                      created: 1404360520000,
                      description: "",
                      isowner: "True",
                      lastmodified: 1404359609000,
                      name: "gdb.M146D97FBD8324CB8A5A68952612FD733",
                      parentversionname: "sde.DEFAULT"
                    }
                  }
                ]
              }
            }
          ]
        };

        var dfd = this.async(20000);
        executeGeoprocessorTask(dfd, params, expectedResult);
      }
    }

  });

});