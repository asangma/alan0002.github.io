define([
  'intern!object',
  'intern/chai!assert',

  "esri/Graphic",

  "esri/geometry/Point",
  "esri/geometry/Multipoint",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/geometry/Extent",
  "esri/geometry/SpatialReference",

  'esri/tasks/RouteTask',
  "esri/tasks/support/RouteParameters",
  "esri/tasks/support/RouteResult",
  "esri/tasks/support/FeatureSet"
], function(
  registerSuite, assert,
  Graphic,
  Point, Multipoint, Polygon, Polyline, Extent, SpatialReference,
  RouteTask, RouteParameters, RouteResult, FeatureSet
){

  var routeTask, params,
    executeRouteTask,
    expectedResult;

  registerSuite({
    name: "esri/tasks/RouteTask",

    setup: function(){
      routeTask = new RouteTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route");

      executeRouteTask = function(dfd, params, expected) {
        routeTask.solve(params).then(
          dfd.callback(function(solveResult) {
            if(expected.barriers) {
              expected.barriers.forEach(function(barrier,idx) {
                for(var prop in barrier.attributes){
                  assert.equal(solveResult.barriers[idx].attributes[prop], barrier.attributes[prop], "props should be same");
                }
              })
            }

            if(expected.messages) {
              expected.messages.forEach(function(message,idx) {
                assert.equal(solveResult.messages[idx].description, message.description, "message should be same");
              })
            }

            if(expected.polygonBarriers) {
              expected.polygonBarriers.forEach(function(polygonBarrier,idx) {
                for(var prop in polygonBarrier.attributes){
                  assert.equal(solveResult.polygonBarriers[idx].attributes[prop], polygonBarrier.attributes[prop], "props should be same");
                }
              })
            }

            if(expected.polylineBarriers) {
              expected.polylineBarriers.forEach(function(polylineBarrier,idx) {
                for(var prop in polylineBarrier.attributes){
                  assert.equal(solveResult.polylineBarriers[idx].attributes[prop], polylineBarrier.attributes[prop], "props should be same");
                }
              })
            }

            if(expected.routeResults){
              expected.routeResults.forEach(function(routeResult, idx){
                assert.instanceOf(solveResult.routeResults[idx], RouteResult, "should be an instance of RouteResult");

                if(routeResult.directions){

                  for(var property in routeResult.directions){
                    assert.property(solveResult.routeResults[idx].directions, property, "should have the property");
                  }

                  if(routeResult.directions.totalDriveTime) {
                    assert.equal(solveResult.routeResults[idx].directions.totalDriveTime, routeResult.directions.totalDriveTime, "direction totalDriveTime should be same");
                  }

                  if(routeResult.directions.totalTime) {
                    assert.equal(solveResult.routeResults[idx].directions.totalTime, routeResult.directions.totalTime, "direction totalTime should be same");
                  }

                  if(routeResult.directions.totalLength) {
                    assert.equal(solveResult.routeResults[idx].directions.totalLength, routeResult.directions.totalLength, "direction totalLength should be same");
                  }

                  if(routeResult.directions.features){
                    for(var prpty in routeResult.directions.features){
                      assert.property(solveResult.routeResults[idx].directions.features, prpty, "should have the property");
                    }

                    routeResult.directions.features.forEach(function(feature,index){
                      assert.equal(solveResult.routeResults[idx].directions.features[index].attributes.text, feature.attributes.text, "direction text should be same");
                      if (feature.geometry && feature.geometry.paths){
                        assert.equal(solveResult.routeResults[idx].directions.features[index].geometry.paths[0].length, feature.geometry.paths[0].length, "direction geomtery paths should be same");
                      }
                    })
                  }
                }

                if(routeResult.routeName){
                  assert.equal(solveResult.routeResults[idx].routeName, routeResult.routeName, "route name should be same");
                }

                if(routeResult.spatialReference){
                  assert.equal(solveResult.routeResults[idx].spatialReference.wkid, routeResult.spatialReference.wkid, "wkid should be same");
                }

                if(routeResult.route){
                  if(routeResult.route.attributes){
                    for(var prop in routeResult.route.attributes){
                      assert.equal(solveResult.routeResults[idx].route.attributes[prop], routeResult.route.attributes[prop], "props should be same");
                    }
                  }
                  if(routeResult.route.geometry){
                    assert.equal(solveResult.routeResults[idx].route.geometry.paths[0].length, routeResult.route.geometry.paths[0].length, "paths length should be same");
                  }
                }
              });
            }

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    teardown: function(){},

    beforeEach: function(){
      params = new RouteParameters();

      var graphic1 = new Graphic(new Point(-117.21261978149414, 34.06301021532272, new SpatialReference({wkid: 4326})));
      var graphic2 = new Graphic(new Point(-117.19682693481445, 34.05828952745651, new SpatialReference({wkid: 4326})));

      params.stops = new FeatureSet();
      params.stops.features = [graphic1, graphic2];
    },

    afterEach: function(){},

    //test suites
    "accumulateAttributes": function() {
      params.accumulateAttributes = ["Length", "Time"];

      expectedResult = {
        routeResults: [
          {
            routeName: "Location 1 - Location 2",
            route: {
              attributes: {
                Total_Length: 1.03110852092505,
                Total_Time: 1.89101346116513
              }
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "attributeParameterValues": function() {
      params.attributeParameterValues = [
        {
          attributeName: "Time",
          parameterName: "65 MPH",
          value: 65
        }
      ];

      expectedResult = {
        routeResults: [
          {
            routeName: "Location 1 - Location 2",
            route: {
              attributes: {
                Total_Time: 1.89101346116513
              }
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "barriers": function() {
      var graphic = new Graphic(new Point(-117.20261978149414, 34.06001021532272, new SpatialReference({wkid: 4326})));

      params.barriers = new FeatureSet();
      params.barriers.features = [graphic];
      params.returnBarriers = true;

      expectedResult = {
        barriers:[
          {
            attributes: {
              Name: "Location 1",
              PosAlong: 0.415125323754319,
              SideOfEdge: 2
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "directions": {

      beforeEach: function(){
        params.returnDirections = true;
      },

      "directionsLanguage": function() {
        params.directionsLanguage = "en_US";

        expectedResult = {
          routeResults: [
            {
              directions: {
                features: [{
                  attributes: {
                    text: "Start at Location 1"
                  }
                },{
                  attributes: {
                    text: "Go east on W Redlands Blvd"
                  }
                },{
                  attributes: {
                    text: "At fork keep right on W Redlands Blvd"
                  }
                },{
                  attributes: {
                    text: "Turn right on Tennessee St"
                  }
                },{
                  attributes: {
                    text: "Turn left on W Park Ave"
                  }
                },{
                  attributes: {
                    text: "Finish at Location 2, on the right"
                  }
                }]
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },

      "directionsLengthUnits": function() {
        params.directionsLengthUnits ="esriMeters";

        expectedResult = {
          routeResults: [
            {
              directions: {
                totalLength: 1658.81641805537
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },

      "directionsOutputType": {
        "complete": function() {
          routeTask = new RouteTask("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/Route");

          var dparams = new RouteParameters();

          var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
          var graphic2 = new Graphic(new Point(-117.159593, 32.735677, new SpatialReference({wkid: 4326})));

          dparams.stops = new FeatureSet();
          dparams.stops.features = [graphic1, graphic2];
          dparams.returnDirections = true;
          dparams.directionsOutputType ="complete";

          expectedResult = {
            routeResults: [
              {
                directions: {
                  extent: {},
                  features: [{
                    attributes: {
                      text: "Start at Location 1"
                    },
                    events: [],
                    geometry: {
                      paths: [
                        [[], []]
                      ]
                    },
                    strings: []
                  }],
                  mergedGeometry: {},
                  routeId: 1,
                  routeName: "Location 1 - Location 2",
                  spatialReference: null,
                  strings: [],
                  totalDriveTime: 7.4533002286993595,
                  totalLength: 2.840223230093509,
                  totalTime: 7.453300229972228
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, dparams, expectedResult);
        },

        "complete-no-events": function() {
          var dparams = new RouteParameters();

          var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
          var graphic2 = new Graphic(new Point(-117.159593, 32.735677, new SpatialReference({wkid: 4326})));

          dparams.stops = new FeatureSet();
          dparams.stops.features = [graphic1, graphic2];
          dparams.returnDirections = true;
          dparams.directionsOutputType ="complete-no-events";
          var dfd = this.async(10000);
          executeRouteTask(dfd, dparams, expectedResult);
        },

        "standard": function() {
          var dparams = new RouteParameters();

          var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
          var graphic2 = new Graphic(new Point(-117.159593, 32.735677, new SpatialReference({wkid: 4326})));

          dparams.stops = new FeatureSet();
          dparams.stops.features = [graphic1, graphic2];
          dparams.returnDirections = true;
          dparams.directionsOutputType ="standard";
          var dfd = this.async(10000);
          executeRouteTask(dfd, dparams, expectedResult);
        },

        "instructions-only": function() {
          var dparams = new RouteParameters();

          var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
          var graphic2 = new Graphic(new Point(-117.159593, 32.735677, new SpatialReference({wkid: 4326})));

          dparams.stops = new FeatureSet();
          dparams.stops.features = [graphic1, graphic2];
          dparams.returnDirections = true;
          dparams.directionsOutputType ="instructions-only";

          expectedResult = {
            routeResults: [
              {
                directions: {
                  extent: {},
                  features: [{
                    attributes: {
                      text: "Start at Location 1"
                    },
                    events: [],
                    geometry: {
                      paths: [[]]
                    },
                    strings: []
                  }],
                  mergedGeometry: {},
                  routeId: 1,
                  routeName: "Location 1 - Location 2",
                  spatialReference: null,
                  strings: [],
                  totalDriveTime: 7.4533002286993595,
                  totalLength: 2.840223230093509,
                  totalTime: 7.453300229972228
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, dparams, expectedResult);
        },

        "summary-only": function() {
          var dparams = new RouteParameters();

          var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
          var graphic2 = new Graphic(new Point(-117.159593, 32.735677, new SpatialReference({wkid: 4326})));

          dparams.stops = new FeatureSet();
          dparams.stops.features = [graphic1, graphic2];
          dparams.returnDirections = true;
          dparams.directionsOutputType ="summary-only";

          expectedResult = {
            routeResults: [
              {
                directions: {
                  extent: {},
                  features: [],
                  mergedGeometry: {},
                  routeId: 1,
                  routeName: "Location 1 - Location 2",
                  spatialReference: null,
                  strings: [],
                  totalDriveTime: 7.4533002286993595,
                  totalLength: 2.840223230093509,
                  totalTime: 7.453300229972228
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, dparams, expectedResult);
        }
      },

      "directionsStyleName": {
        "NA Desktop": function() {
          routeTask = new RouteTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route");
          params.directionsStyleName ="NA Desktop";

          expectedResult = {
            routeResults: [
              {
                directions: {
                  features: [{
                    attributes: {
                      text: "Start at Location 1"
                    }
                  },{
                    attributes: {
                      text: "Go east on W Redlands Blvd"
                    }
                  },{
                    attributes: {
                      text: "At fork keep right on W Redlands Blvd"
                    }
                  },{
                    attributes: {
                      text: "Turn right on Tennessee St"
                    }
                  },{
                    attributes: {
                      text: "Turn left on W Park Ave"
                    }
                  },{
                    attributes: {
                      text: "Finish at Location 2, on the right"
                    }
                  }]
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        },
        "NA Navigation": function() {
          params.directionsStyleName ="NA Navigation";

          expectedResult = {
            routeResults: [
              {
                directions: {
                  features: [{
                    attributes: {
                      text: "Depart Location 1"
                    }
                  },{
                    attributes: {
                      text: "Go East on W Redlands Blvd"
                    }
                  },{
                    attributes: {
                      text: "At fork keep right on W Redlands Blvd"
                    }
                  },{
                    attributes: {
                      text: "Turn right on Tennessee St"
                    }
                  },{
                    attributes: {
                      text: "Turn left on W Park Ave"
                    }
                  },{
                    attributes: {
                      text: "Arrive at destination, on the right"
                    }
                  }]
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        }
      },

      "directionsTimeAttribute": function(){
        params.directionsTimeAttribute ="Time";

        expectedResult = {
          routeResults: [
            {
              directions: {
                totalDriveTime: 1.89101346116513,
                totalTime: 1.88333333333333
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      }
    },

    "findBestSequence": {

      beforeEach: function(){
        var graphic = new Graphic(new Point(-117.21682693482441, 34.05828952743655, new SpatialReference({wkid: 4326})));
        params.stops.features.push(graphic);

        params.findBestSequence = true;
        params.returnStops = true;
      },

      "preserveFirstStop": {
        "true": function() {
          params.preserveFirstStop = true;

          expectedResult = {
            routeResults: [
              {
                routeName: "Location 1 - Location 3",
                route: {
                  attributes: {
                    Total_Time: 4.89703096728772
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        },
        "false": function() {
          params.preserveFirstStop = false;

          expectedResult = {
            routeResults: [
              {
                routeName: "Location 2 - Location 3",
                route: {
                  attributes: {
                    Total_Time: 3.16523759998381
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        }
      },

      "preserveLastStop": {
        "true": function() {
          params.preserveLastStop = true;

          expectedResult = {
            routeResults: [
              {
                routeName: "Location 1 - Location 3",
                route: {
                  attributes: {
                    Total_Time: 4.89703096728772
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        },
        "false": function() {
          params.preserveLastStop = false;

          expectedResult = {
            routeResults: [
              {
                routeName: "Location 1 - Location 2",
                route: {
                  attributes: {
                    Total_Time: 4.26589448284358
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        }
      },

      "preserveFirstStop & preserveLastStop": {
        "true": function() {
          params.preserveFirstStop = true;
          params.preserveLastStop = true;

          expectedResult = {
            routeResults: [
              {
                routeName: "Location 1 - Location 3",
                route: {
                  attributes: {
                    Total_Time: 4.89703096728772
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        },
        "false": function() {
          params.preserveFirstStop = false;
          params.preserveLastStop = false;

          expectedResult = {
            routeResults: [
              {
                routeName: "Location 3 - Location 2",
                route: {
                  attributes: {
                    Total_Time: 3.13600484374911
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        }
      }
    },

    "ignoreInvalidLocations":{

      beforeEach: function(){
        var graphic = new Graphic(new Point(-120.21682693482441, 34.05828952743655, new SpatialReference({wkid: 4326})));
        params.stops.features.push(graphic);
      },

      "true": function(){
        params.ignoreInvalidLocations = true;

        expectedResult = {
          messages: [
            {
              description: 'Location "Location 3" in "Stops" is unlocated.'
            }
          ],
          routeResults: [
            {
              routeName: "Location 1 - Location 2",
              route: {
                attributes: {
                  Total_Time: 1.89101346116513
                }
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);

      },

      "false": function(){
        params.ignoreInvalidLocations = false;

        console.log("******This should return 'Unable to complete operation error'**********");

        var dfd = this.async(10000);

        routeTask.solve(params).then(
          dfd.callback(function(solveResult) {
            dfd.reject(e);
          }), function(e) {
            dfd.resolve();
          });
      }
    },

    "impedanceAttribute":  function(){
      params.impedanceAttribute = "Time";

      expectedResult = {
        routeResults: [
          {
            routeName: "Location 1 - Location 2",
            route: {
              attributes: {
                Total_Time: 1.89101346116513
              }
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "outputLines": {
      "esriNAOutputLineNone":  function(){
        params.outputLines = "esriNAOutputLineNone";

        expectedResult = {
          routeResults: [
            {
              routeName: "Location 1 - Location 2",
              route: {
                attributes: {
                  Total_Time: 1.89101346116513
                }
              }
            }
          ]
        };

        /********This test is failing because the geometry is null**********/
        console.log("This test is failing because the geometry is null");

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);

      },

      "esriNAOutputLineStraight":  function(){
        params.outputLines = "esriNAOutputLineStraight";

        expectedResult = {
          routeResults: [
            {
              routeName: "Location 1 - Location 2",
              route: {
                geometry: {
                  paths: [
                    [
                      [-117.212619781,34.063009262],
                      [-117.196826935,34.0582904820001]
                    ]
                  ]
                }
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);

      },

      "esriNAOutputLineTrueShape":  function(){
        params.outputLines = "esriNAOutputLineTrueShape";

        expectedResult = {
          routeResults: [
            {
              routeName: "Location 1 - Location 2",
              route: {
                geometry: {
                  paths: [
                    [
                      [],[],[],[],[],[],[],[],[],[],
                      [],[],[],[],[],[],[],[],[],[],
                      [],[],[],[],[],[],[]
                    ]
                  ]
                }
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);

      },

      "esriNAOutputLineTrueShapeWithMeasure":  function(){
        params.outputLines = "esriNAOutputLineTrueShapeWithMeasure";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      }
    },

    "outputGeometryPrecision": {
      "0": function(){
        params.outputGeometryPrecision = 0;

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },

      "0.5": function(){
        params.outputGeometryPrecision = 0.5;

        expectedResult = {
          routeResults: [
            {
              routeName: "Location 1 - Location 2",
              route: {
                geometry: {
                  paths: [
                    [
                      [],[],[],[],[],[],[],[],[],[],
                      [],[],[],[]
                    ]
                  ]
                }
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      }
    },

    "outputGeometryPrecisionUnits": {
      "esriUnknownUnits": function(){
        params.outputGeometryPrecisionUnits = "esriUnknownUnits";

        expectedResult = {
          routeResults: [
            {
              routeName: "Location 1 - Location 2",
              route: {
                geometry: {
                  paths: [
                    [
                      [],[],[],[],[],[],[],[],[],[],
                      [],[],[],[],[],[],[],[],[],[],
                      [],[],[],[],[],[],[]
                    ]
                  ]
                }
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriCentimeters": function(){
        params.outputGeometryPrecisionUnits = "esriCentimeters";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriDecimalDegrees": function(){
        params.outputGeometryPrecisionUnits = "esriDecimalDegrees";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriDecimeters": function(){
        params.outputGeometryPrecisionUnits = "esriDecimeters";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriFeet": function(){
        params.outputGeometryPrecisionUnits = "esriFeet";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriInches": function(){
        params.outputGeometryPrecisionUnits = "esriInches";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriKilometers": function(){
        params.outputGeometryPrecisionUnits = "esriKilometers";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriMeters": function(){
        params.outputGeometryPrecisionUnits = "esriMeters";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriMiles": function(){
        params.outputGeometryPrecisionUnits = "esriMiles";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriMillimeters": function(){
        params.outputGeometryPrecisionUnits = "esriMillimeters";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriNauticalMiles": function(){
        params.outputGeometryPrecisionUnits = "esriNauticalMiles";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriPoints": function(){
        params.outputGeometryPrecisionUnits = "esriPoints";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "esriYards": function(){
        params.outputGeometryPrecisionUnits = "esriYards";

        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      }
    },

    "outSpatialReference": function(){
      params.outSpatialReference = new SpatialReference({wkid: 32662});

      expectedResult = {
        routeResults: [
          {
            routeName: "Location 1 - Location 2",
            spatialReference: {
              wkid: 32662
            }
          }
        ]
      };


      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "polygonBarriers": function() {

      var polygon = new Polygon([
        [-117.20061978149414, 34.06001021532272],
        [-117.19682693481445, 34.06020952545651],
        [-117.20082693482441, 34.05828952743655]
      ]);

      var graphic = new Graphic({
        geometry: polygon
      });

      params.polygonBarriers = new FeatureSet();
      params.polygonBarriers.features = [graphic];
      params.returnPolygonBarriers = true;

      expectedResult = {
        polygonBarriers:[
          {
            attributes: {
              Name: "Locations 1",
              Shape_Area: 0.00000324250836706772,
              Shape_Length: 0.00996812696623102
            }
          }
        ],
        routeResults: [
          {
            route: {
              attributes: {
                Shape_Length: 0.0235577544878099,
                Total_Time: 2.66662636678666
              }
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "polylineBarriers": function() {

      var polyline = new Polyline([
        [-117.20061978149414, 34.06001021532272],
        [-117.19682693481445, 34.06020952545651],
        [-117.20082693482441, 34.05828952743655]
      ]);

      var graphic = new Graphic({
        geometry: polyline
      });

      params.polylineBarriers = new FeatureSet();
      params.polylineBarriers.features = [graphic];
      params.returnPolylineBarriers = true;

      expectedResult = {
        polylineBarriers:[
          {
            attributes: {
              Name: "Locations 1",
              Shape_Length: 0.00823501416754002
            }
          }
        ],
        routeResults: [
          {
            route: {
              attributes: {
                Shape_Length: 0.0237136011922162,
                Total_Time: 2.66163897514343
              }
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "restrictionAttributes": function() {
      params.restrictionAttributes =["OneWay", "TurnRestriction", "Non-routeable segments", "Avoid vehicular ferries"];

      expectedResult = {
        routeResults: [
          {
            route: {
              attributes: {
                Shape_Length: 0.0175455288197018,
                Total_Time: 1.89101346116513
              }
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeRouteTask(dfd, params, expectedResult);
    },

    "restrictUTurns": {
      "esriNFSBAllowBacktrack": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBAllowBacktrack";
            params.doNotLocateOnRestrictedElements = true;

            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBAllowBacktrack";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          }
        }
      },
      "esriNFSBAtDeadEndsOnly": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsOnly";
            params.doNotLocateOnRestrictedElements = true;
            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsOnly";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          }
        }
      },
      "esriNFSBNoBacktrack": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBNoBacktrack";
            params.doNotLocateOnRestrictedElements = true;
            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBNoBacktrack";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          }
        }
      },
      "esriNFSBAtDeadEndsAndIntersections": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsAndIntersections";
            params.doNotLocateOnRestrictedElements = true;
            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsAndIntersections";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeRouteTask(dfd, params, expectedResult);
          }
        }
      }

    },

    "startTime": {
      "startTimeIsUTC": {
        "true": function() {
          params.startTime = new Date(86400000);
          params.startTimeIsUTC = true;

          expectedResult = {
            routeResults: [
              {
                route: {
                  attributes: {
                    StartTime: 86400000
                  }
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        },
        "false": function() {
          params.startTime = new Date(86400000);
          params.startTimeIsUTC = false;

          var dfd = this.async(10000);
          executeRouteTask(dfd, params, expectedResult);
        }
      }
    },

    "useHierarchy": {
      "true": function() {
        params.useHierarchy = true;
        expectedResult = {
          routeResults: [
            {
              route: {
                attributes: {
                  Shape_Length: 0.0175455288197018,
                  StartTime: -2209161600000,
                  Total_Time: 1.89101346116513
                }
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "false": function() {
        params.useHierarchy = false;

        expectedResult = {
          routeResults: [
            {
              route: {
                attributes: {
                  Shape_Length: 0.0175455288197018,
                  StartTime: -2209161600000,
                  Total_Time: 1.89201586227864
                }
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
    },

    "useTimeWindows": {
      "true": function() {
        params.useTimeWindows = true;
        expectedResult = {
          routeResults: [
            {
              route: {
                attributes: {
                  Shape_Length: 0.0175455288197018,
                  StartTime: -2209161600000,
                  Total_Time: 1.89101346116513
                }
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
      "false": function() {
        params.useTimeWindows = false;
        expectedResult = {
          routeResults: [
            {
              route: {
                attributes: {
                  Shape_Length: 0.0175455288197018,
                  Total_Time: 1.89101346116513
                }
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeRouteTask(dfd, params, expectedResult);
      },
    }

  });

});