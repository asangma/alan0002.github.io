define([
  'intern!object',
  'intern/chai!assert',

  "esri/Graphic",
  "esri/config",

  "esri/layers/GraphicsLayer",

  "esri/geometry/Point",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/geometry/SpatialReference",

  'esri/tasks/ClosestFacilityTask',

  "esri/tasks/support/ClosestFacilityParameters",
  "esri/tasks/support/ClosestFacilitySolveResult",
  "esri/tasks/support/FeatureSet"


], function(
  registerSuite, assert,
  Graphic, esriConfig,
  GraphicsLayer,
  Point, Polygon, Polyline, SpatialReference,
  ClosestFacilityTask,
  ClosestFacilityParameters, ClosestFacilitySolveResult, FeatureSet
){

  var closestFacilityTask, params,
    facilitiesGraphicsLayer, facilities, incidents,
    executeClosestFacilityTask,
    expectedResult;

  registerSuite({
    name: "esri/tasks/ClosestFacilityTask",

    setup: function(){

      // Get the urls from grunt-config.json
      var xmlhttp = new XMLHttpRequest();
      var url = "../../grunt-config.json";
      xmlhttp.open("GET", url, false);
      xmlhttp.send();

      var proxyUrl;
      if (xmlhttp.status === 200) {
        var response = JSON.parse(xmlhttp.responseText);
        proxyUrl = response.proxy;
      }

      esriConfig.request.proxyUrl = proxyUrl;

      closestFacilityTask = new ClosestFacilityTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Closest Facility");

      facilitiesGraphicsLayer = new GraphicsLayer();

      facilitiesGraphicsLayer.add(new Graphic(new Point(-13625960, 4549921, new SpatialReference({wkid: 102100}))));
      facilitiesGraphicsLayer.add(new Graphic(new Point(-13626184, 4549247, new SpatialReference({wkid: 102100}))));
      facilitiesGraphicsLayer.add(new Graphic(new Point(-13626477, 4549415, new SpatialReference({wkid: 102100}))));
      facilitiesGraphicsLayer.add(new Graphic(new Point(-13625385, 4549659, new SpatialReference({wkid: 102100}))));
      facilitiesGraphicsLayer.add(new Graphic(new Point(-13624374, 4548254, new SpatialReference({wkid: 102100}))));
      facilitiesGraphicsLayer.add(new Graphic(new Point(-13624891, 4548565, new SpatialReference({wkid: 102100}))));

      facilities = new FeatureSet();
      facilities.features = facilitiesGraphicsLayer.graphics.items;

      incidents = new FeatureSet();
      var customGraphic = new Graphic(new Point(-13626184.532082686, 4549246.050456947, new SpatialReference({wkid: 102100})));
      incidents.features = [customGraphic];

      executeClosestFacilityTask = function(dfd, params, expected) {

        closestFacilityTask.solve(params).then(
          dfd.callback(function(solveResult) {
            assert.instanceOf(solveResult, ClosestFacilitySolveResult, "should be an instance of ClosestFacilitySolveResult");

            for(var prop in expected) {

              if(prop === "facilities" && expected[prop]){
                assert.equal(solveResult[prop].length, 6, "must return the same number of facilites ");
              }
              else if(prop === "incidents" && expected[prop]){
                assert.equal(solveResult[prop].length, 1, "must return the same number of facilites ");
              }
              else if(prop === "routes" && expected[prop]) {
                assert.equal(solveResult[prop].length, expected[prop].length, "must return the same number of routes for " + prop);

                expected[prop].forEach(function(route, idx){

                  for(var property in route.attributes){
                    assert.equal(solveResult[prop][idx].attributes[property], route.attributes[property], "must return the same value for " + property);
                  }

                });
              }
              else if(prop === "barriers" && expected[prop]){
                var expFeatures = expected[prop].features;
                var actFeatures = solveResult[prop].features;

                assert.equal(actFeatures.length, expFeatures.length, "must return the same number of routes for " + prop);

                expFeatures.forEach(function(feature, idx){
                  for(var property in feature.attributes) {
                    assert.equal(actFeatures[idx].attributes[property], feature.attributes[property], "must return the same number of routes for " + property);
                  }

                  assert.equal(actFeatures[idx].geometry.x, feature.geometry.x, "must return the same number of routes for " + prop);
                  assert.equal(actFeatures[idx].geometry.y, feature.geometry.y, "must return the same number of routes for " + prop);
                });

              }
              else if(prop === "polygonBarriers" && expected[prop]){
                var expFeatures = expected[prop];
                var actFeatures = solveResult[prop];

                assert.equal(actFeatures.length, expFeatures.length, "must return the same number of routes for " + prop);

                expFeatures.forEach(function(feature, idx){
                  for(var property in feature.attributes) {
                    assert.equal(actFeatures[idx].attributes[property], feature.attributes[property], "must return the same number of routes for " + property);
                  }

                  assert.property(actFeatures[idx], "geometry", "must have geometry property");
                  assert.isAbove(actFeatures[idx].geometry.rings.length, 0, "must have geometry property");
                });

              }
              else if(prop === "polylineBarriers" && expected[prop]){
                var expFeatures = expected[prop];
                var actFeatures = solveResult[prop];

                assert.equal(actFeatures.length, expFeatures.length, "must return the same number of routes for " + prop);

                expFeatures.forEach(function(feature, idx){
                  for(var property in feature.attributes) {
                    assert.equal(actFeatures[idx].attributes[property], feature.attributes[property], "must return the same number of routes for " + property);
                  }

                  assert.property(actFeatures[idx], "geometry", "must have geometry property");
                  assert.isAbove(actFeatures[idx].geometry.paths.length, 0, "must have geometry property");
                });

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
      params = new ClosestFacilityParameters();
      params.facilities = facilities;
      params.incidents = incidents;
      params.outSpatialReference = new SpatialReference({wkid: 102100});
    },

    afterEach: function(){},

    //test suites
    "ClosestFacilityTask": {

      "accumulateAttributes": function() {
        params.accumulateAttributes = ["Length","Time"];

        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 866.943656027668,
                Total_Length: 0.42601716844365,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "attributeParameter": function() {
        params.attributeParameter = [
          {
            attributeName: "Time",
            parameterName: "20 MPH",
            value: "20"
          }
        ];

        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 866.943656027668,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "defaultTargetFacilityCount": {

        beforeEach: function(){
          params.defaultTargetFacilityCount = 3;
        },

        "without defaultCutoff":  function(){
          expectedResult = {
            routes: [
              {
                attributes: {
                  Shape_Length: 866.943656027668,
                  Total_Time: 0.800917081534863
                }
              },
              {
                attributes: {
                  Shape_Length: 849.585574876411,
                  Total_Time: 0.860742774792016
                }
              },
              {
                attributes: {
                  Shape_Length: 1201.23749444661,
                  Total_Time: 1.03522435668856
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },

        "with defaultCutoff":  function(){
          params.impedenceAttribute= "Miles";
          params.defaultCutoff= 0.85;

          expectedResult = {
            routes: [
              {
                attributes: {
                  Shape_Length: 866.943656027668,
                  Total_Time: 0.800917081534863
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        }
      },

      "directionsLanguage": function() {
        params.directionsLanguage = "en-US";

        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 866.943656027668,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "directionsLengthUnits": function() {
        params.directionsLengthUnits = "esriNAUMiles";

        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 866.943656027668,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "directionsOutputType": {
        "complete": function() {
          params.directionsOutputType = "complete";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "complete-no-events": function() {
          params.directionsOutputType = "complete-no-events";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "instructions-only": function() {
          params.directionsOutputType = "instructions-only";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "standard": function() {
          params.directionsOutputType = "standard";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "summary-only": function() {
          params.directionsOutputType = "summary-only";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        }
      },

      "directionsStyleName": {
        "NA Desktop":  function() {
          params.directionsStyleName = "NA Desktop";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "NA Navigation":  function() {
          params.directionsStyleName = "NA Navigation";
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        }
      },

      "directionsTimeAttribute":  function() {
        params.directionsTimeAttribute = "Time";
        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "doNotLocateOnRestrictedElements": {
        "true": function() {
          params.doNotLocateOnRestrictedElements = true;
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },

        "false": function() {
          params.doNotLocateOnRestrictedElements = false;
          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        }
      },

      "impedanceAttribute": function() {
        params.impedanceAttribute = "Length";
        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 849.585574876411,
                Total_Length: 0.417180877644569
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "outputGeometryPrecision": function() {
        params.outputGeometryPrecision = "1";
        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 855.222131859936,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "outputGeometryPrecisionUnits": function() {
        params.outputGeometryPrecision = "1";
        params.outputGeometryPrecisionUnits = "esriUnknownUnits";
        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "outputLines": function() {
        params.outputLines = "esriNAOutputLineStraight";
        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 337.759390811898,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "barriers": {
        "pointBarriers": {
          "FeatureSet": function() {
            var pointBarriers = new FeatureSet();
            var pbGraphic = new Graphic(new Point(-122.40769386291504,37.804856300354004, new SpatialReference({wkid: 102100})));
            pointBarriers.features = [pbGraphic];

            params.pointBarriers = pointBarriers;
            params.returnPointBarriers = true;

            expectedResult = {
              barriers: {
                features: [
                  {
                    attributes: {
                      Name: "Location 1"
                    },
                    geometry: {
                      x: -122.407699998468,
                      y: 37.8049000017345
                    }
                  }
                ]
              },
              routes: [
                {
                  attributes: {
                    Shape_Length: 866.943656027668,
                    Total_Time: 0.800917081534863
                  }
                }
              ]
            };

            var dfd = this.async(10000);
            executeClosestFacilityTask(dfd, params, expectedResult);
          }
        },

        "polygonBarriers": {
          "FeatureSet": function() {
            var polygonBarriers = new FeatureSet();
            var polygonJson = {
              "rings": [[[-122.41610527, 37.8055858610001], [-122.412457466, 37.803225517], [-122.416148186, 37.8033542630001], [-122.41610527, 37.8055858610001]]]
            };
            var pbGraphic = new Graphic(new Polygon(polygonJson));
            polygonBarriers.features = [pbGraphic];

            params.polygonBarriers = polygonBarriers;
            params.returnPolygonBarriers = true;

            expectedResult = {
              polygonBarriers: [
                {
                  attributes: {
                    Name: "Locations 1",
                    Shape_Area: 64631.5635148505,
                    Shape_Length: 1250.56596992602
                  }
                }
              ],
              routes: [
                {
                  attributes: {
                    Shape_Length: 866.943656027668,
                    Total_Time: 0.800917081534863
                  }
                }
              ]
            };

            var dfd = this.async(10000);
            executeClosestFacilityTask(dfd, params, expectedResult);
          }
        },

        "polylineBarriers": {
          "FeatureSet": function() {
            var polylineBarriers = new FeatureSet();
            var polylineJson = {
              "paths": [[[-122.417821884,37.804512978],[-122.41353035,37.801680565]]]
            };
            var pbGraphic = new Graphic(new Polyline(polylineJson));
            polylineBarriers.features = [pbGraphic];

            params.polylineBarriers = polylineBarriers;
            params.returnPolylineBarriers = true;

            expectedResult = {
              polyglineBarriers: [
                {
                  attributes: {
                    Name: "Locations 1",
                    Shape_Length: 622.473137030527
                  }
                }
              ],
              routes: [
                {
                  attributes: {
                    Shape_Length: 866.943656027668,
                    Total_Time: 0.800917081534863
                  }
                }
              ]
            };

            var dfd = this.async(10000);
            executeClosestFacilityTask(dfd, params, expectedResult);
          }
        }
      },

      "restrictionAttributes": {
        "TurnRestriction": function() {
          params.restrictionAttributes = ["OneWay"];

          expectedResult = {
            routes: [
              {
                attributes: {
                  Shape_Length: 866.943656027668,
                  Total_Time: 0.800917081534863
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "none": function() {
          params.restrictionAttributes = ["none"];

          expectedResult = {
            routes: [
              {
                attributes: {
                  Shape_Length: 0.783492717186611,
                  Total_Time: 0.000923900748603046
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        }
      },

      "restrictUTurns": {
        "esriNFSBNoBacktrack": function() {
          params.restrictUTurns = "esriNFSBNoBacktrack";

          expectedResult = {
            routes: [
              {
                attributes: {
                  Shape_Length: 866.943656027668,
                  Total_Time: 0.800917081534863
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        },
        "esriNFSBAllowBacktrack": function() {
          params.restrictUTurns = "esriNFSBAllowBacktrack";

          expectedResult = {
            routes: [
              {
                attributes: {
                  Shape_Length: 866.943656027668,
                  Total_Time: 0.800917081534863
                }
              }
            ]
          };

          var dfd = this.async(10000);
          executeClosestFacilityTask(dfd, params, expectedResult);
        }
      },

      "returnDirections": function() {
        params.returnDirections = true;
        params.returnRoutes = false;

        expectedResult = {
          directions: [
            {}
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "returnFacilities": function() {
        params.returnFacilities = true;
        params.returnRoutes = false;

        expectedResult = {
          facilities: [
            {},{},{},{},{},{}
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "returnIncidents": function() {
        params.returnIncidents = true;
        params.returnRoutes = false;

        expectedResult = {
          incidents: [
            {}
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "travelDirection": function() {
        params.travelDirection = "esriNATravelDirectionToFacility";
        params.timeOfDay = new Date();
        params.timeOfDayUsage = "end";

        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 866.943656027668,
                Total_Time: 0.800917081534863
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      },

      "useHierarchy": function() {
        params.useHierarchy = true;

        expectedResult = {
          routes: [
            {
              attributes: {
                Shape_Length: 866.943938872535,
                Total_Time: 0.799750819802284
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeClosestFacilityTask(dfd, params, expectedResult);
      }
    }

  });

});