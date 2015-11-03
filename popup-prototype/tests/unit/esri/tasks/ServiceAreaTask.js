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

  'esri/tasks/ServiceAreaTask',
  "esri/tasks/support/ServiceAreaParameters",
  "esri/tasks/support/ServiceAreaSolveResult",
  "esri/tasks/support/FeatureSet"
], function(
  registerSuite, assert,
  Graphic,
  Point, Multipoint, Polygon, Polyline, Extent, SpatialReference,
  ServiceAreaTask, ServiceAreaParameters, ServiceAreaSolveResult, FeatureSet
){

  var serviceAreaTask, params,
    executeServiceAreaTask,
    expectedResult;

  registerSuite({
    name: "esri/tasks/ServiceAreaTask",

    setup: function(){
      serviceAreaTask = new ServiceAreaTask("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Service Area");

      executeServiceAreaTask = function(dfd, params, expected) {

        serviceAreaTask.solve(params).then(
          dfd.callback(function(result) {
            assert.instanceOf(result, ServiceAreaSolveResult, "should be an instance of ServiceAreaSolveResult");

            for(var prop in expected){
              if(prop === "barriers"){
                expected.barriers.features.forEach(function(feature,index) {
                  for(var property in feature.attributes){
                    assert.equal(result.barriers.features[index].attributes[property], feature.attributes[property], "props should be same");
                  }
                })
              }
              if(prop === "polygonBarriers"){
                expected.polygonBarriers.forEach(function(polygonBarrier,idx) {
                  for(var prop in polygonBarrier.attributes){
                    assert.equal(result.polygonBarriers[idx].attributes[prop], polygonBarrier.attributes[prop], "props should be same");
                  }
                })
              }
              if(expected.polylineBarriers) {
                expected.polylineBarriers.forEach(function(polylineBarrier,idx) {
                  for(var prop in polylineBarrier.attributes){
                    assert.equal(result.polylineBarriers[idx].attributes[prop], polylineBarrier.attributes[prop], "props should be same");
                  }
                })
              }
              if(prop === "serviceAreaPolygons"){
                expected.serviceAreaPolygons.forEach(function(polygon, idx) {
                  for(var property in polygon.attributes){
                    assert.equal(result.serviceAreaPolygons[idx].attributes[property], polygon.attributes[property], "property value should be same");
                  }

                })
              }
              if(prop === "messages"){
                expected.messages.forEach(function(message, idx) {
                  for(var property in message){
                    assert.equal(result.messages[idx][property], message[property], "property value should be same");
                  }

                })
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
      params = new ServiceAreaParameters();

      //add incidents
      var graphic1 = new Graphic(new Point(-117.21261978149414, 34.06301021532272, new SpatialReference({wkid: 4326})));
      var graphic2 = new Graphic(new Point(-117.19682693481445, 34.05828952745651, new SpatialReference({wkid: 4326})));

      var facilities = new FeatureSet();
      facilities.features = [graphic1, graphic2];

      params.facilities = facilities;
    },

    afterEach: function(){},

    //test suites
    "accumulateAttributes": function(){
      params.accumulateAttributes= ["Length","Time"];

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              FacilityID: 2,
              FromBreak: 0,
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00291207142504035,
              Shape_Length: 0.354245582359908,
              ToBreak: 5
            }
          },
          {
            attributes: {
              FacilityID: 1,
              FromBreak: 0,
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00256477359159572,
              Shape_Length: 0.330952126319621,
              ToBreak: 5
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "attributeParameterValues": function() {
      params.attributeParameterValues = [
        {
          attributeName: "Time",
          parameterName: "15 MPH",
          value: 15
        },
        {
          attributeName: "Time",
          parameterName: "20 MPH",
          value: 20
        }
      ];

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "defaultBreaks": function() {
      params.defaultBreaks = [1, 2];

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              FacilityID: 1,
              FromBreak: 0,
              Name: "Location 1 : 0 - 2",
              Shape_Area: 0.000435172461530484,
              Shape_Length: 0.115256397975487,
              ToBreak: 2
            }
          },
          {
            attributes: {
              FacilityID: 2,
              FromBreak: 0,
              Name: "Location 2 : 0 - 2",
              Shape_Area: 0.000400704657854041,
              Shape_Length: 0.109101656567584,
              ToBreak: 2
            }
          },
          {
            attributes: {
              FacilityID: 2,
              FromBreak: 0,
              Name: "Location 2 : 0 - 1",
              Shape_Area: 0.0000706126050487613,
              Shape_Length: 0.0511341393813811,
              ToBreak: 1
            }
          },
          {
            attributes: {
              FacilityID: 1,
              FromBreak: 0,
              Name: "Location 1 : 0 - 1",
              Shape_Area: 0.0000981908585368431,
              Shape_Length: 0.0586029503316377,
              ToBreak: 1
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "excludeSourcesFromPolygons": function(){
      params.excludeSourcesFromPolygons= ["SDC Junction Source"];

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              FacilityID: 2,
              FromBreak: 0,
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00291207142504035,
              Shape_Length: 0.354245582359908,
              ToBreak: 5
            }
          },
          {
            attributes: {
              FacilityID: 1,
              FromBreak: 0,
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00256477359159572,
              Shape_Length: 0.330952126319621,
              ToBreak: 5
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "impedanceAttribute": function() {
      params.impedanceAttribute= "Length";

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.0077178406278222,
              Shape_Length: 0.546399731835773
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00552978390618172,
              Shape_Length: 0.447847813146829
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "mergeSimilarPolygonRanges": {
      "true":  function() {
        params.mergeSimilarPolygonRanges= true;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "0 - 5",
                Shape_Area: 0.00555481043459814,
                Shape_Length: 0.363967641056586
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "false":  function() {
        params.mergeSimilarPolygonRanges= false;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00291207142504035,
                Shape_Length: 0.354245582359908
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00256477359159572,
                Shape_Length: 0.330952126319621
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "outputGeometryPrecision": {
      "0": function() {
        params.outputGeometryPrecision = 0;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00291207142504035,
                Shape_Length: 0.354245582359908
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00256477359159572,
                Shape_Length: 0.330952126319621
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },

      "0.5": function() {
        params.outputGeometryPrecision = 0.5;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00291207142504035,
                Shape_Length: 0.354245582359908
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00205838703270114,
                Shape_Length: 0.260576036568624
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "outputGeometryPrecisionUnits": function() {
      params.outputGeometryPrecisionUnits = "esriUnknownUnits";

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00291207142504035,
              Shape_Length: 0.354245582359908
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00256477359159572,
              Shape_Length: 0.330952126319621
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "outputLines": {
      "esriNAOutputLineNone": function() {
        params.outputLines = "esriNAOutputLineNone";

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "esriNAOutputLineStraight": function() {
        /************* The current service doesnt support esriNAOutputLineStraight **************/
        // TODO: use a service that supports this option.
        console.log("The current service doesnt support esriNAOutputLineStraight");
        /*params = new ServiceAreaParameters();

        //add incidents
        var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
        var graphic2 = new Graphic(new Point(-117.149593, 32.735687, new SpatialReference({wkid: 4326})));

        var facilities = new FeatureSet();
        facilities.features = [graphic1, graphic2];

        params.facilities = facilities;
        params.outputLines = "esriNAOutputLineStraight";

        var dfd = this.async(10000);

        serviceAreaTask = new ServiceAreaTask("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/ServiceArea");
        executeServiceAreaTask(dfd, params, expectedResult);*/
      },
      "esriNAOutputLineTrueShape": function() {
        params.outputLines = "esriNAOutputLineTrueShape";

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "esriNAOutputLineTrueShapeWithMeasure": function() {
        params.outputLines = "esriNAOutputLineTrueShapeWithMeasure";

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "outputPolygons": {
      "esriNAOutputPolygonNone": function() {
        params.outputPolygons = "esriNAOutputPolygonNone";

        expectedResult = {
          messages: [
            {
              description: "No polygon or line output options have been set on the service area solver."
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "esriNAOutputPolygonSimplified": function() {
        params.outputPolygons = "esriNAOutputPolygonSimplified";

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00291207142504035,
                Shape_Length: 0.354245582359908
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00256477359159572,
                Shape_Length: 0.330952126319621
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "esriNAOutputPolygonDetailed": function() {
        params.outputPolygons = "esriNAOutputPolygonDetailed";

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00227916451871612,
                Shape_Length: 0.659747521772231
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00212801493746097,
                Shape_Length: 0.596832667581168
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "outSpatialReference": function() {
      params.outSpatialReference = new SpatialReference({wkid: 32662});

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 36086473.7460728,
              Shape_Length: 39434.4369830091
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 31782749.1049569,
              Shape_Length: 36841.4205518832
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "overlapLines": {
      "true": function() {
        params.overlapLines = true;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00291207142504035,
                Shape_Length: 0.354245582359908
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00256477359159572,
                Shape_Length: 0.330952126319621
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "false": function() {
        params.overlapLines = false;

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "overlapPolygons": {
      "true": function() {
        params.overlapPolygons = true;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00445578858610946,
                Shape_Length: 0.321870145664779
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00470100732650847,
                Shape_Length: 0.351463840655899
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "false": function() {
        params.overlapPolygons = false;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00291207142504035,
                Shape_Length: 0.354245582359908
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00256477359159572,
                Shape_Length: 0.330952126319621
              }
            }
          ]
        };

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "pointBarriers": function() {
      var graphic = new Graphic(new Point(-117.20261978149414, 34.06001021532272, new SpatialReference({wkid: 4326})));

      params.pointBarriers = new FeatureSet();
      params.pointBarriers.features = [graphic];
      params.returnPointBarriers = true;

      expectedResult = {
        barriers: {
          features: [
            {
              attributes: {
                Name: "Location 1",
                PosAlong: 0.415125323754319,
                SourceOID: 5360772
              }
            }
          ]
        },
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00290146612927715,
              Shape_Length: 0.353382167058096
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00257546829986871,
              Shape_Length: 0.330326726430233
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
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
        polygonBarriers: [
          {
            attributes: {
              Shape_Area: 0.00000324250836706772,
              Shape_Length: 0.00996812696623102
            }
          }
        ],
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00213494662673672,
              Shape_Length: 0.295453299774835
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00303832373899273,
              Shape_Length: 0.351609648221299
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
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
        polylineBarriers: [
          {
            attributes: {
              Shape_Length: 0.00823501416754002
            }
          }
        ],
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00213142912002875,
              Shape_Length: 0.287029514815364
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00304043734770674,
              Shape_Length: 0.357524557599351
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "restrictionAttributes": function() {
      params.restrictionAttributes = ["OneWay", "TurnRestriction", "Non-routeable segments", "Avoid vehicular ferries"];

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00291207142504035,
              Shape_Length: 0.354245582359908
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00256477359159572,
              Shape_Length: 0.330952126319621
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "restrictUTurns": {
      "esriNFSBAllowBacktrack": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBAllowBacktrack";
            params.doNotLocateOnRestrictedElements = true;

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBAllowBacktrack";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          }
        }
      },
      "esriNFSBAtDeadEndsOnly": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsOnly";
            params.doNotLocateOnRestrictedElements = true;

            expectedResult = {
              serviceAreaPolygons: [
                {
                  attributes: {
                    Name: "Location 2 : 0 - 5",
                    Shape_Area: 0.00291143710677856,
                    Shape_Length: 0.35357310545468
                  }
                },
                {
                  attributes: {
                    Name: "Location 1 : 0 - 5",
                    Shape_Area: 0.00256626273260518,
                    Shape_Length: 0.34682161529669
                  }
                }
              ]
            };

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsOnly";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          }
        }
      },
      "esriNFSBNoBacktrack": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBNoBacktrack";
            params.doNotLocateOnRestrictedElements = true;

            expectedResult = {
              serviceAreaPolygons: [
                {
                  attributes: {
                    Name: "Location 2 : 0 - 5",
                    Shape_Area: 0.00291143942081714,
                    Shape_Length: 0.353573467624386
                  }
                },
                {
                  attributes: {
                    Name: "Location 1 : 0 - 5",
                    Shape_Area: 0.00256626041853963,
                    Shape_Length: 0.346821979409446
                  }
                }
              ]
            };

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBNoBacktrack";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          }
        }
      },
      "esriNFSBAtDeadEndsAndIntersections": {
        "doNotLocateOnRestrictedElements": {
          "true": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsAndIntersections";
            params.doNotLocateOnRestrictedElements = true;

            expectedResult = {
              serviceAreaPolygons: [
                {
                  attributes: {
                    Name: "Location 2 : 0 - 5",
                    Shape_Area: 0.00291141962214986,
                    Shape_Length: 0.353413195298187
                  }
                },
                {
                  attributes: {
                    Name: "Location 1 : 0 - 5",
                    Shape_Area: 0.00256628021723388,
                    Shape_Length: 0.346661705140198
                  }
                }
              ]
            };

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          },
          "false": function() {
            params.restrictUTurns ="esriNFSBAtDeadEndsAndIntersections";
            params.doNotLocateOnRestrictedElements = false;

            var dfd = this.async(10000);
            executeServiceAreaTask(dfd, params, expectedResult);
          }
        }
      }

    },

    "splitLinesAtBreaks": function(){
      params.splitLinesAtBreaks = true;

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00291207142504035,
              Shape_Length: 0.354245582359908
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00256477359159572,
              Shape_Length: 0.330952126319621
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "splitPolygonsAtBreaks": function(){
      params.splitPolygonsAtBreaks = true;

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "travelDirection": {
      "esriNATravelDirectionFromFacility": function(){
        params.travelDirection = "esriNATravelDirectionFromFacility";
        params.timeOfDay = new Date();

        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },
      "esriNATravelDirectionToFacility": function(){
        params.travelDirection = "esriNATravelDirectionToFacility";
        params.timeOfDay = new Date();
        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 2 : 0 - 5",
                Shape_Area: 0.00250908316937217,
                Shape_Length: 0.275701243870841
              }
            },
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.00280058299465834,
                Shape_Length: 0.331125501975801
              }
            }
          ]
        };
        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    },

    "trimOuterPolygon": function(){
      params.trimOuterPolygon = true;

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00238963660272686,
              Shape_Length: 0.412802279636247
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00208053783738733,
              Shape_Length: 0.456002650152501
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "trimPolygonDistance": function() {
      params.trimPolygonDistance = 150;

      expectedResult = {
        serviceAreaPolygons: [
          {
            attributes: {
              Name: "Location 2 : 0 - 5",
              Shape_Area: 0.00291207142504035,
              Shape_Length: 0.354245582359908
            }
          },
          {
            attributes: {
              Name: "Location 1 : 0 - 5",
              Shape_Area: 0.00256477359159572,
              Shape_Length: 0.330952126319621
            }
          }
        ]
      };

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "trimPolygonDistanceUnits": function() {
      params.trimPolygonDistanceUnits = "esriMiles";

      var dfd = this.async(10000);
      executeServiceAreaTask(dfd, params, expectedResult);
    },

    "useHierarchy": {
      "false": function() {
        params.useHierarchy = false;
        var dfd = this.async(10000);
        executeServiceAreaTask(dfd, params, expectedResult);
      },

      "true": function() {
        params = new ServiceAreaParameters();

        //add incidents
        var graphic1 = new Graphic(new Point(-117.149593, 32.735677, new SpatialReference({wkid: 4326})));
        var graphic2 = new Graphic(new Point(-117.149593, 32.735687, new SpatialReference({wkid: 4326})));

        var facilities = new FeatureSet();
        facilities.features = [graphic1, graphic2];

        params.facilities = facilities;
        params.useHierarchy = true;

        expectedResult = {
          serviceAreaPolygons: [
            {
              attributes: {
                Name: "Location 1 : 0 - 5",
                Shape_Area: 0.0006684575756250099,
                Shape_Length: 0.20065991802689945
              }
            },
            {
              attributes: {
                Name: "Location 2 : 0 - 2.97813623646675",
                Shape_Area: 4.384409513947559e-7,
                Shape_Length: 0.0028809492648755835
              }
            }
          ]
        };

        var dfd = this.async(10000);

        serviceAreaTask = new ServiceAreaTask("http://sampleserver6.arcgisonline.com/arcgis/rest/services/NetworkAnalysis/SanDiego/NAServer/ServiceArea");
        executeServiceAreaTask(dfd, params, expectedResult);
      }
    }

  });

});