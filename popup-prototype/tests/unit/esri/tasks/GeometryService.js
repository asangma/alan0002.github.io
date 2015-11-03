define([
  'intern!object',
  'intern/chai!assert',

  'esri/tasks/GeometryService',
  "esri/tasks/support/ProjectParameters",
  "esri/tasks/support/BufferParameters",
  "esri/tasks/support/AreasAndLengthsParameters",
  "esri/tasks/support/LengthsParameters",
  "esri/tasks/support/RelationParameters",
  "esri/tasks/support/TrimExtendParameters",
  "esri/tasks/support/DensifyParameters",
  "esri/tasks/support/GeneralizeParameters",
  "esri/tasks/support/OffsetParameters",
  "esri/tasks/support/DistanceParameters",

  "esri/geometry/Point",
  "esri/geometry/Multipoint",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/geometry/Extent",
  "esri/geometry/SpatialReference"
], function(
  registerSuite, assert,
  GeometryService, ProjectParameters, BufferParameters, AreasAndLengthsParameters, LengthsParameters, RelationParameters, TrimExtendParameters, DensifyParameters, GeneralizeParameters, OffsetParameters, DistanceParameters,
  Point, Multipoint, Polygon, Polyline, Extent, SpatialReference
){

  var geometryService, params,
    polygon1,polygon2,polygon3,polygon4,polygon5,
    polyline1,polyline2,polyline3,polyline4,
    point1,point2,point3,point4,point5,
    expectedResult;

  registerSuite({
    name: "esri/tasks/GeometryService",

    setup: function(){
      geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
    },

    teardown: function(){},

    beforeEach: function(){},

    afterEach: function(){},

    //test suites
    "project": {

      beforeEach: function(){
        params = new ProjectParameters();
      },

      "point": function() {

        var point = new Point(-140.21682693482441, 34.05828952743655, new SpatialReference({wkid: 4326}));

        params.geometries = [point];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = {
          x: 2183826.1705551315,
          y: -2785419.673120341,
          spatialReference: {
            wkid: 102726
          }
        };

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            var res = result[0];

            assert.equal(res.x, expectedResult.x, "value should be same");
            assert.equal(res.y, expectedResult.y, "value should be same");
            assert.equal(res.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "multiple points": function() {

        var point1 = new Point(-140.21682693482441, 34.05828952743655, new SpatialReference({wkid: 4326}));
        var point2 = new Point(-130.21682693482441, 32.05828952743655, new SpatialReference({wkid: 4326}));

        params.geometries = [point1, point2];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = [
          {
            x: 2183826.1705551315,
            y: -2785419.673120341,
            spatialReference: {
              wkid: 102726
            }
          },
          {
            x: 5124580.729898404,
            y: -4081303.4921720037,
            spatialReference: {
              wkid: 102726
            }
          }
        ];

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            expectedResult.forEach(function(exp, idx){
              assert.equal(result[idx].x, exp.x, "value should be same");
              assert.equal(result[idx].y, exp.y, "value should be same");
              assert.equal(result[idx].spatialReference.wkid, exp.spatialReference.wkid, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Multipoint": function() {
        var multipoint = new Multipoint(new SpatialReference({wkid:4326}));
        multipoint.points = [[-122.63,45.51],[-122.56,45.51],[-122.56,45.55]];

        params.geometries = [multipoint];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = {
          points: [
            [
              7656112.6041109925, 679227.070761249
            ],
            [
              7674051.468509868, 678761.7919154037
            ],
            [
              7674423.297155633, 693341.3555156629
            ]
          ],
          spatialReference: {
            wkid: 102726
          }
        };

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            var res = result[0];

            expectedResult.points.forEach(function(point, index) {
              assert.equal(res.points[index][0], point[0], "value should be same");
              assert.equal(res.points[index][1], point[1], "value should be same");
            });

            assert.equal(res.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Multiple Multipoint": function() {
        var multipoint1 = new Multipoint(new SpatialReference({wkid:4326}));
        multipoint1.points = [[-122.63,45.51],[-122.56,45.51],[-122.56,45.55]];

        var multipoint2 = new Multipoint(new SpatialReference({wkid:4326}));
        multipoint2.points = [[-121.63,42.51],[-112.51,45.51],[-123.56,42.55]];

        params.geometries = [multipoint1, multipoint2];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = [
          {
            points: [
              [
                7656112.6041109925, 679227.070761249
              ],
              [
                7674051.468509868, 678761.7919154037
              ],
              [
                7674423.297155633, 693341.3555156629
              ]
            ],
            spatialReference: {
              wkid: 102726
            }
          },
          {
            points: [
              [
                7897115.61008538, -419690.08413782745
              ],
              [
                10247031.53086495, 773231.8139542135
              ],
              [
                7376958.32153368, -391603.4308188765
              ]
            ],
            spatialReference: {
              wkid: 102726
            }
          }
        ];

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            var res = result[0];

            expectedResult.forEach(function(exp, idx){
              exp.points.forEach(function(point, index) {
                assert.equal(result[idx].points[index][0], point[0], "value should be same");
                assert.equal(result[idx].points[index][1], point[1], "value should be same");
              });

              assert.equal(result[idx].spatialReference.wkid, exp.spatialReference.wkid, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Polyline": function() {
        var polyline = new Polyline([
          [-111.30, 52.68],
          [-98, 49.5],
          [-93.94, 29.89]
        ], new SpatialReference({wkid:4326}));

        params.geometries = [polyline];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = {
          paths: [
            [
              [
                10257309.386700265, 3413133.8641671087
              ],
              [
                13495329.49249139, 2870697.227279103
              ],
              [
                16745423.863975342, -3661087.0105620488
              ]
            ]
          ],
          spatialReference: {
            wkid: 102726
          }
        };

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            var res = result[0];

            expectedResult.paths[0].forEach(function(path, index) {
              assert.equal(res.paths[0][index][0], path[0], "value should be same");
              assert.equal(res.paths[0][index][1], path[1], "value should be same");
            });

            assert.equal(res.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Multiple Polyline": function() {
        var polyline1 = new Polyline([
          [-111.30, 52.68],
          [-98, 49.5],
          [-93.94, 29.89]
        ], new SpatialReference({wkid:4326}));

        var polyline2 = new Polyline([
          [-141.30, 54.68],
          [-92, 41.5],
          [-91.95, 29.89]
        ], new SpatialReference({wkid:4326}));

        params.geometries = [polyline1,polyline2];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = [
          {
            paths: [
              [
                [
                  10257309.386700265, 3413133.8641671087
                ],
                [
                  13495329.49249139, 2870697.227279103
                ],
                [
                  16745423.863975342, -3661087.0105620488
                ]
              ]
            ],
            spatialReference: {
              wkid: 102726
            }
          },
          {
            paths: [
              [
                [
                  3784837.4681707737, 4606620.553115516
                ],
                [
                  15862888.140186436, 575015.0039515786
                ],
                [
                  17359648.79253672, -3443076.262653602
                ]
              ]
            ],
            spatialReference: {
              wkid: 102726
            }
          }
        ];

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            expectedResult.forEach(function(exp, idx) {
              exp.paths[0].forEach(function(path, index) {
                assert.equal(result[idx].paths[0][index][0], path[0], "value should be same");
                assert.equal(result[idx].paths[0][index][1], path[1], "value should be same");
              });
              assert.equal(result[idx].spatialReference.wkid, exp.spatialReference.wkid, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "polygon": function() {
        var polygon = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));

        params.geometries = [polygon];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = {
          rings: [
            [
              [
                2721310.3705926817, -645548.1869908021
              ],
              [
                2456032.523433674, -1712027.7323584955
              ],
              [
                1809990.9891049012, 1128152.520292406
              ],
              [
                2721310.3705926817, -645548.1869908021
              ]
            ]
          ],
          spatialReference: {
            wkid: 102726
          }
        };

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            var res = result[0];

            expectedResult.rings[0].forEach(function(ring, index) {
              assert.equal(res.rings[0][index][0], ring[0], "value should be same");
              assert.equal(res.rings[0][index][1], ring[1], "value should be same");
            });

            assert.equal(res.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Multiple polygons": function() {
        var polygon1 = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));

        var polygon2 = new Polygon([
          [-110.20061978149414, 31.06001021532272],
          [-125.19682693481445, 42.06020952545651],
          [-130.20082693482441, 43.05828952743655]
        ], new SpatialReference({wkid:4326}));

        params.geometries = [polygon1, polygon2];
        params.outSR = new SpatialReference({wkid: 102726});

        expectedResult = [
          {
            rings: [
              [
                [
                  2721310.3705926817, -645548.1869908021
                ],
                [
                  2456032.523433674, -1712027.7323584955
                ],
                [
                  1809990.9891049012, 1128152.520292406
                ],
                [
                  2721310.3705926817, -645548.1869908021
                ]
              ]
            ],
            spatialReference: {
              wkid: 102726
            }
          },
          {
            rings: [
              [
                [
                  6925615.968904296, -548812.7270597457
                ],
                [
                  11510527.855715765, -4428254.560210423
                ],
                [
                  5614123.968898468, -66282.38564993565
                ],
                [
                  6925615.968904296, -548812.7270597457
                ]
              ]
            ],
            spatialReference: {
              wkid: 102726
            }
          }
        ];

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            expectedResult.forEach(function (exp, idx) {
              exp.rings[0].forEach(function(ring, index) {
                assert.equal(result[idx].rings[0][index][0], ring[0], "value should be same");
                assert.equal(result[idx].rings[0][index][1], ring[1], "value should be same");
              });

              assert.equal(result[idx].spatialReference.wkid, exp.spatialReference.wkid, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "extent": function() {
        var extent = new Extent({
          xmin: -9177882.740387835,
          ymin: 4246761.27629837,
          xmax: -9176720.658692285,
          ymax: 4247967.548150893,
          spatialReference: 102100
        });

        params.geometries = [extent];
        params.outSR = new SpatialReference({wkid: 4326});

        expectedResult = {
          height: 0.008809539083983964,
          width: 0.01043915748506663,
          xmax: -82.43588425798643,
          xmin: -82.4463234154715,
          ymax: 35.616410053219425,
          ymin: 35.60760051413544,
          spatialReference: {
            wkid: 4326
          }
        };

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            var res = result[0];

            assert.equal(res.height, expectedResult.height, "value should be same");
            assert.equal(res.width, expectedResult.width, "value should be same");
            assert.equal(res.xmax, expectedResult.xmax, "value should be same");
            assert.equal(res.xmin, expectedResult.xmin, "value should be same");
            assert.equal(res.ymax, expectedResult.ymax, "value should be same");
            assert.equal(res.ymin, expectedResult.ymin, "value should be same");

            assert.equal(res.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "multiple Extents": function() {
        var extent1 = new Extent({
          xmin: -9177882.740387835,
          ymin: 4246761.27629837,
          xmax: -9176720.658692285,
          ymax: 4247967.548150893,
          spatialReference: 102100
        });
        var extent2 = new Extent({
          xmin: -8177882.740387835,
          ymin: 3246761.27629837,
          xmax: -8176720.658692285,
          ymax: 3247967.548150893,
          spatialReference: 102100
        });

        params.geometries = [extent1, extent2];
        params.outSR = new SpatialReference({wkid: 4326});

        expectedResult = [
          {
            height: 0.008809539083983964,
            width: 0.01043915748506663,
            xmax: -82.43588425798643,
            xmin: -82.4463234154715,
            ymax: 35.616410053219425,
            ymin: 35.60760051413544,
            spatialReference: {
              wkid: 4326
            }
          },
          {
            height: 0.009568863191084631,
            width: 0.010439157485080841,
            xmax: -73.45273141679121,
            xmin: -73.46317057427629,
            ymax: 27.992018545861733,
            ymin: 27.982449682670648,
            spatialReference: {
              wkid: 4326
            }
          }
        ];

        var dfd = this.async(10000);

        geometryService.project(params).then(
          dfd.callback(function(result) {
            expectedResult.forEach(function (exp, idx) {
              assert.equal(result[idx].height, exp.height, "value should be same");
              assert.equal(result[idx].width, exp.width, "value should be same");
              assert.equal(result[idx].xmax, exp.xmax, "value should be same");
              assert.equal(result[idx].xmin, exp.xmin, "value should be same");
              assert.equal(result[idx].ymax, exp.ymax, "value should be same");
              assert.equal(result[idx].ymin, exp.ymin, "value should be same");

              assert.equal(result[idx].spatialReference.wkid, exp.spatialReference.wkid, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    "simplify": function() {
      var polygon = new Polygon([
        [49.21875, 26.648438572883606],
        [31.9921875, -13.429686427116394],
        [-4.5703125, 15.398438572883606],
        [20.7421875, 45.632813572883606],
        [-6.6796875, -13.781248927116394],
        [-7.03125, -13.781248927116394],
        [49.21875, 26.648438572883606]
      ], new SpatialReference({wkid:4326}));

      var geometries = [polygon];

      expectedResult = {
        rings: [
          [
            [-6.5051708629999325, -13.403129547999981],
            [-6.679687499999943, -13.781248926999979],
            [-7.031249999999943, -13.781248926999979],
            [-6.5051708629999325, -13.403129547999981]
          ],
          [
            [13.61617823000006, 1.0590901130000248],
            [-6.5051708629999325, -13.403129547999981],
            [3.7573718820000295, 8.832379733000039],
            [13.61617823000006, 1.0590901130000248]
          ],
          [
            [13.61617823000006, 1.0590901130000248],
            [49.21875000000006, 26.648438573000078],
            [31.992187500000057, -13.429686426999979],
            [13.61617823000006, 1.0590901130000248]
          ],
          [
            [3.7573718820000295, 8.832379733000039],
            [-4.570312499999943, 15.398438573000021],
            [20.742187500000057, 45.63281357300008],
            [3.7573718820000295, 8.832379733000039]
          ]
        ],
        spatialReference: {
          wkid: 4326
        }
      };

      var dfd = this.async(10000);

      geometryService.simplify(geometries).then(
        dfd.callback(function(result) {
          var res = result[0];

          expectedResult.rings.forEach(function (ring, idx) {
            ring.forEach(function (point, index) {
              assert.equal(res.rings[idx][index][0], point[0], "values hsould be same");
              assert.equal(res.rings[idx][index][1], point[1], "values hsould be same");
            })
          });

          assert.equal(res.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "convexHull": {
      "point": function() {

        var point = new Point(-140.21682693482441, 34.05828952743655, new SpatialReference({wkid: 4326}));

        var geometries = [point];

        expectedResult = {
          x: -140.21682693482441,
          y: 34.05828952743655,
          spatialReference: {
            wkid: 4326
          }
        };

        var dfd = this.async(10000);

        geometryService.convexHull(geometries).then(
          dfd.callback(function(result) {
            assert.equal(result.x, expectedResult.x, "value should be same");
            assert.equal(result.y, expectedResult.y, "value should be same");
            assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Multipoint": function() {
        var multipoint = new Multipoint(new SpatialReference({wkid:4326}));
        multipoint.points = [[-122.63,45.51],[-122.56,45.51],[-122.56,45.55]];

        var geometries = [multipoint];

        expectedResult = {
          rings: [
            [
              [-122.63,45.51],
              [-122.56,45.55],
              [-122.56,45.51],
              [-122.63,45.51]
            ]
          ],
          spatialReference: {
            wkid: 4326
          }
        };

        var dfd = this.async(10000);

        geometryService.convexHull(geometries).then(
          dfd.callback(function(result) {
            expectedResult.rings.forEach(function(ring, idx) {
              ring.forEach(function (point, index) {
                assert.equal(result.rings[idx][index][0], point[0], "value should be same");
                assert.equal(result.rings[idx][index][1], point[1], "value should be same");
              })
            });

            assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "Polyline": function() {
        var polyline = new Polyline([
          [-111.30, 52.68],
          [-98, 49.5],
          [-93.94, 29.89]
        ], new SpatialReference({wkid:4326}));

        var geometries = [polyline];

        expectedResult = {
          rings: [
            [
              [-93.94, 29.89],
              [-111.30, 52.68],
              [-98, 49.5],
              [-93.94, 29.89]
            ]
          ],
          spatialReference: {
            wkid: 4326
          }
        };

        var dfd = this.async(10000);

        geometryService.convexHull(geometries).then(
          dfd.callback(function(result) {
            expectedResult.rings.forEach(function(ring, idx) {
              ring.forEach(function (point, index) {
                assert.equal(result.rings[idx][index][0], point[0], "value should be same");
                assert.equal(result.rings[idx][index][1], point[1], "value should be same");
              })
            });

            assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "polygon": function() {
        var polygon = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));

        var geometries = [polygon];

        expectedResult = {
          rings: [
            [
              [-140.20061978149414, 37.06001021532272],
              [-145.19682693481445, 44.06020952545651],
              [-140.20082693482441, 40.05828952743655],
              [-140.20061978149414, 37.06001021532272]
            ]
          ],
          spatialReference: {
            wkid: 4326
          }
        };

        var dfd = this.async(10000);

        geometryService.convexHull(geometries).then(
          dfd.callback(function(result) {
            expectedResult.rings.forEach(function(ring, idx) {
              ring.forEach(function (point, index) {
                assert.equal(result.rings[idx][index][0], point[0], "value should be same");
                assert.equal(result.rings[idx][index][1], point[1], "value should be same");
              })
            });

            assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    "union": function() {
      var polygon1 = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polygon2 = new Polygon([
        [-141.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-141.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var geometries = [polygon1, polygon2];

      expectedResult = {
        rings: [
          [
            [-140.20082693499995, 40.058289527000056],
            [-140.20061978099994, 37.060010215000034],
            [-141.20071659399997, 38.461248555000054],
            [-141.20061978099994, 37.060010215000034],
            [-145.19682693499996, 44.06020952500006],
            [-140.20082693499995, 40.058289527000056]
          ]
        ],
        spatialReference: {
          wkid: 4326
        }
      };

      var dfd = this.async(10000);

      geometryService.union(geometries).then(
        dfd.callback(function(result) {
          expectedResult.rings.forEach(function(ring, idx) {
            ring.forEach(function (point, index) {
              assert.equal(result.rings[idx][index][0], point[0], "value should be same");
              assert.equal(result.rings[idx][index][1], point[1], "value should be same");
            })
          });

          assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "autoComplete": function() {
      var polygon1 = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polygon2 = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-146.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polygons = [polygon1, polygon2];

      var polyline1 = new Polyline([
        [-140.20061978149414, 37.06001021532272],
        [-135.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polyline2 = new Polyline([
        [-135.20061978149414, 46.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polylines = [polyline1, polyline2];

      expectedResult = {
        rings: [
          [
            [-140.20061978099994, 37.060010215000034],
            [-140.20082693499995, 40.058289527000056],
            [-135.196826935, 44.06020952500006],
            [-140.20061978099994, 37.060010215000034]
          ]
        ],
        spatialReference: {
          wkid: 4326
        }
      };

      var dfd = this.async(10000);

      geometryService.autoComplete(polygons, polylines).then(
        dfd.callback(function(result) {
          result = result[0];

          expectedResult.rings.forEach(function(ring, idx) {
            ring.forEach(function (point, index) {
              assert.equal(result.rings[idx][index][0], point[0], "value should be same");
              assert.equal(result.rings[idx][index][1], point[1], "value should be same");
            })
          });

          assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "reshape": function() {
      var polygon = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polyline = new Polyline([
        [-140.20061978149414, 37.06001021532272],
        [-135.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      expectedResult = {
        rings: [
          [
            [-135.196826935, 44.06020952500006],
            [-140.20061978099994, 37.060010215000034],
            [-145.19682693499996, 44.06020952500006],
            [-140.20082693499995, 40.058289527000056],
            [-135.196826935, 44.06020952500006]
          ]
        ],
        spatialReference: {
          wkid: 4326
        }
      };

      var dfd = this.async(10000);

      geometryService.reshape(polygon, polyline).then(
        dfd.callback(function(result) {
          expectedResult.rings.forEach(function(ring, idx) {
            ring.forEach(function (point, index) {
              assert.equal(result.rings[idx][index][0], point[0], "value should be same");
              assert.equal(result.rings[idx][index][1], point[1], "value should be same");
            })
          });

          assert.equal(result.spatialReference.wkid, expectedResult.spatialReference.wkid, "value should be same");

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "cut": function() {
      var polygon = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polyline = new Polyline([
        [-145.20061978149414, 37.06001021532272],
        [-140.19682693481445, 44.06020952545651],
        [-145.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      expectedResult = {
        cutIndexes: [0,0,0],
        geometries: [
          {
            rings: [
              [
                [-142.01733502599996, 41.513357592000034],
                [-142.698723358, 40.560109870000076],
                [-143.37992589499999, 41.51454458000006],
                [-142.69882693499994, 42.05924952600003],
                [-142.01733502599996, 41.513357592000034]
              ]
            ]
          },
          {
            rings: [
              [
                [-142.69882693499994, 42.05924952600003],
                [-143.37992589499999, 41.51454458000006],
                [-145.19682693499996, 44.06020952500006],
                [-142.69882693499994, 42.05924952600003],
              ]
            ]
          },
          {
            rings: [
              [
                [-142.698723358, 40.560109870000076],
                [-142.01733502599996, 41.513357592000034],
                [-140.20082693499995, 40.058289527000056],
                [-140.20061978099994, 37.060010215000034],
                [-142.698723358, 40.560109870000076]
              ]
            ]
          }
        ]
      };

      var dfd = this.async(10000);

      geometryService.cut([polygon], polyline).then(
        dfd.callback(function(result) {
          expectedResult.geometries.forEach(function (geometry, i) {
            geometry.rings.forEach(function(ring, idx) {
              ring.forEach(function (point, index) {
                assert.equal(result.geometries[i].rings[idx][index][0], point[0], "value should be same");
                assert.equal(result.geometries[i].rings[idx][index][1], point[1], "value should be same");
              })
            });
          })
          assert.equal(result.cutIndexes.length, expectedResult.cutIndexes.length, "value should be same");

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "intersect": function() {
      var polygon1 = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polygon2 = new Polygon([
        [-145.20061978149414, 37.06001021532272],
        [-140.19682693481445, 44.06020952545651],
        [-145.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      expectedResult = {
        rings: [
          [
            [-142.01733502599996, 41.513357592000034],
            [-142.698723358, 40.560109870000076],
            [-143.37992589499999, 41.51454458000006],
            [-142.69882693499994, 42.05924952600003],
            [-142.01733502599996, 41.513357592000034]
          ]
        ]
      };

      var dfd = this.async(10000);

      geometryService.intersect([polygon1], polygon2).then(
        dfd.callback(function(result) {
          result = result[0];

          expectedResult.rings.forEach(function(ring, idx) {
            ring.forEach(function (point, index) {
              assert.equal(result.rings[idx][index][0], point[0], "value should be same");
              assert.equal(result.rings[idx][index][1], point[1], "value should be same");
            })
          });

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "difference": function() {
      var polygon1 = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      var polygon2 = new Polygon([
        [-145.20061978149414, 37.06001021532272],
        [-140.19682693481445, 44.06020952545651],
        [-145.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      expectedResult = {
        rings: [
          [
            [-142.69882693499994, 42.05924952600003],
            [-143.37992589499999, 41.51454458000006],
            [-145.19682693499996, 44.06020952500006],
            [-142.69882693499994, 42.05924952600003]
          ],
          [
            [-140.20082693499995, 40.058289527000056],
            [-140.20061978099994, 37.060010215000034],
            [-142.698723358, 40.560109870000076],
            [-142.01733502599996, 41.513357592000034],
            [-140.20082693499995, 40.058289527000056]
          ]
        ]
      };

      var dfd = this.async(10000);

      geometryService.difference([polygon1], polygon2).then(
        dfd.callback(function(result) {
          result = result[0];

          expectedResult.rings.forEach(function(ring, idx) {
            ring.forEach(function (point, index) {
              assert.equal(result.rings[idx][index][0], point[0], "value should be same");
              assert.equal(result.rings[idx][index][1], point[1], "value should be same");
            })
          });

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "buffer": {
      beforeEach: function(){
        var polygon1 = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));

        params = new BufferParameters();
        params.distances = [1,2];
        params.geometries = [polygon1];
        params.unit = BufferParameters.UNIT_KILOMETER;
      },

      "bufferSpatialReference": function() {
        params.bufferSpatialReference = new SpatialReference({wkid: 32662});

        expectedResult = [
          {
            rings: [
              [
                [],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
                [],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
                [],[],[],[],[],[],[],[],[],[],[],[],[],[],[]
              ]
            ]
          },
          {
            rings: [
              [
                [],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
                [],[],[],[],[],[],[],[],[],[],[],[],[]
              ]
            ]
          }
        ]

        var dfd = this.async(10000);

        geometryService.buffer(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },


      "unionResults": function() {
        params.unionResults = true;

        var dfd = this.async(10000);

        geometryService.buffer(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "geodesic": function() {
        params.bufferSpatialReference = new SpatialReference({wkid: 32662});
        params.geodesic = true;

        expectedResult = [
          {
            rings: [
              [
                [],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
                [],[],[],[],[],[],[],[],[],[],[],[]
              ]
            ]
          },
          {
            rings: [
              [
                [],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],
                [],[],[],[],[],[],[],[],[],[],[],[],[]
              ]
            ]
          }
        ]

        var dfd = this.async(10000);

        geometryService.buffer(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

    },

    "areasAndLengths": {

      beforeEach: function(){
        var polygon1 = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));

        params = new AreasAndLengthsParameters();
        params.areaUnit = GeometryService.UNIT_SQUARE_MILES;
        params.polygons = [polygon1];
        params.lengthUnit = GeometryService.UNIT_KILOMETER;
      },

      "calculationType": {
        "planar": function() {
          params.calculationType = "planar";

          expectedResult = {
            areas: [35752.97918812158],
            lengths: [2001.4814851891138]
          }

          var dfd = this.async(10000);

          geometryService.areasAndLengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.areas.length, expectedResult.areas.length, "value should be same");
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.areas.forEach(function(exp, idx) {
                assert.equal(result.areas[idx], exp, "value should be same");
              });

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "geodesic": function() {
          params.calculationType = "geodesic";

          expectedResult = {
            areas: [25774.831755130075],
            lengths: [1824.336186912627]
          }

          var dfd = this.async(10000);

          geometryService.areasAndLengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.areas.length, expectedResult.areas.length, "value should be same");
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.areas.forEach(function(exp, idx) {
                assert.equal(result.areas[idx], exp, "value should be same");
              });

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "preserveShape": function() {
          params.calculationType = "preserveShape";

          expectedResult = {
            areas: [27252.911302543645],
            lengths: [1824.9179621147139]
          }

          var dfd = this.async(10000);

          geometryService.areasAndLengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.areas.length, expectedResult.areas.length, "value should be same");
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.areas.forEach(function(exp, idx) {
                assert.equal(result.areas[idx], exp, "value should be same");
              });

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        }
      }

    },

    "lengths": {
      beforeEach: function(){
        var polyline1 = new Polyline([
          [-145.20061978149414, 37.06001021532272],
          [-140.19682693481445, 44.06020952545651],
          [-145.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));

        params = new LengthsParameters();
        params.polylines = [polyline1];
        params.lengthUnit = GeometryService.UNIT_KILOMETER;
      },

      "calculationType": {
        "planar": function() {
          params.calculationType = "planar";

          expectedResult = {
            lengths: [1669.2729575424223]
          }

          var dfd = this.async(10000);

          geometryService.lengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "geodesic": function() {
          params.calculationType = "geodesic";

          expectedResult = {
            lengths: [1492.2623837347803]
          }

          var dfd = this.async(10000);

          geometryService.lengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "preserveShape": function() {
          params.calculationType = "preserveShape";

          expectedResult = {
            lengths: [1492.8458010810405]
          }

          var dfd = this.async(10000);

          geometryService.lengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        }
      },

      "geodesic": {
        "true": function() {
          params.geodesic = true;

          expectedResult = {
            lengths: [1492.2623837347803]
          }

          var dfd = this.async(10000);

          geometryService.lengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "false": function() {
          params.geodesic = false;

          expectedResult = {
            lengths: [1669.2729575424223]
          }

          var dfd = this.async(10000);

          geometryService.lengths(params).then(
            dfd.callback(function(result) {
              assert.equal(result.lengths.length, expectedResult.lengths.length, "value should be same");

              expectedResult.lengths.forEach(function(exp, idx) {
                assert.equal(result.lengths[idx], exp, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        }
      }
    },

    "labelPoints": function() {
      var polygon1 = new Polygon([
        [-140.20061978149414, 37.06001021532272],
        [-145.19682693481445, 44.06020952545651],
        [-140.20082693482441, 40.05828952743655]
      ], new SpatialReference({wkid:4326}));

      expectedResult = [
        {
          x: -141.86609121699996,
          y: 40.39283642200007
        }
      ];

      var dfd = this.async(10000);

      geometryService.labelPoints([polygon1]).then(
        dfd.callback(function(result) {
          assert.equal(result.length, expectedResult.length, "value should be same");

          expectedResult.forEach(function(exp, idx) {
            assert.instanceOf(result[idx], Point, "value should be same");
            assert.equal(result[idx].x, exp.x, "value should be same");
            assert.equal(result[idx].y, exp.y, "value should be same");
          });

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "relation": {

      setup: function () {
        polygon1 = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));
        polygon2 = new Polygon([
          [-141.86609121699996, 40.39283642200007],
          [-140.86609121699996, 40.39283642200007],
          [-141.20082693482441, 40.05828952743655],
          [-141.86609121699996, 40.39283642200007],
        ], new SpatialReference({wkid:4326}));
        polygon3 = new Polygon([
          [-140.20061978149414, 37.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-146.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));
        polygon4 = new Polygon([
          [-145.20061978149414, 37.06001021532272],
          [-140.19682693481445, 44.06020952545651],
          [-145.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));
        polygon5 = new Polygon([
          [-145.20061978149414, 37.06001021532272],
          [-130.19682693481445, 44.06020952545651],
          [-135.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));



        point1 = new Point([
          -141.86609121699996, 40.39283642200007
        ], new SpatialReference({wkid:4326}));
        point2 = new Point([
          -146.86609121699996, 40.39283642200007
        ], new SpatialReference({wkid:4326}));
        point3 = new Point([
          -140.86609121699996, 40.39283642200007
        ], new SpatialReference({wkid:4326}));
        point4 = new Point([
          -142.86609121699996, 40.39283642200007
        ], new SpatialReference({wkid:4326}));
        point5 = new Point([
          -145.86609121699996, 40.39283642200007
        ], new SpatialReference({wkid:4326}));

        polyline1 = new Polyline([
          [-145.20061978149414, 37.06001021532272],
          [-140.19682693481445, 44.06020952545651],
          [-145.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));
        polyline2 = new Polyline([
          [-141.20061978149414, 37.06001021532272],
          [-146.19682693481445, 44.06020952545651]
        ], new SpatialReference({wkid:4326}));
        polyline3 = new Polyline([
          [-135.20061978149414, 46.06001021532272],
          [-145.19682693481445, 44.06020952545651],
          [-140.20082693482441, 40.05828952743655]
        ], new SpatialReference({wkid:4326}));
        polyline4 = new Polyline([
          [-144.15682693481445, 43.06020952545651],
          [-141.00082693482441, 39.00828952743655]
        ], new SpatialReference({wkid:4326}));
      },

      beforeEach: function(){
        params = new RelationParameters();
      },

      "esriGeometryRelationCross": function() {
        params.geometries1 = [polyline3, polyline1];
        params.geometries2 = [polyline2];
        params.relation = "esriGeometryRelationCross";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationDisjoint": function() {
        params.geometries1 = [polyline3];
        params.geometries2 = [polyline2];
        params.relation = "esriGeometryRelationDisjoint";

        expectedResult = [
          {
            geometry1Index: 0,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationIn": function() {
        params.geometries1 = [polygon2];
        params.geometries2 = [polygon3, polygon1];
        params.relation = "esriGeometryRelationIn";

        expectedResult = [
          {
            geometry1Index: 0,
            geometry2Index: 1
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationInteriorIntersection": function() {
        params.geometries1 = [polygon2, polygon3];
        params.geometries2 = [polygon1];
        params.relation = "esriGeometryRelationInteriorIntersection";

        expectedResult = [
          {
            geometry1Index: 0,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationIntersection": function() {
        params.geometries1 = [polygon2, polygon3];
        params.geometries2 = [polygon1];
        params.relation = "esriGeometryRelationIntersection";

        expectedResult = [
          {
            geometry1Index: 0,
            geometry2Index: 0
          },
          {
            geometry1Index: 1,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationLineCoincidence": function() {
        params.geometries1 = [polyline2, polyline3];
        params.geometries2 = [polygon1];
        params.relation = "esriGeometryRelationLineCoincidence";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationLineTouch": function() {
        params.geometries1 = [polygon2, polygon3];
        params.geometries2 = [polygon1];
        params.relation = "esriGeometryRelationLineTouch";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 0
          },
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationOverlap": function() {
        params.geometries1 = [polygon2, polygon4];
        params.geometries2 = [polygon1,polygon3];
        params.relation = "esriGeometryRelationOverlap";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 0
          },
          {
            geometry1Index: 1,
            geometry2Index: 1
          },
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationPointTouch": function() {
        params.geometries1 = [polygon2, polygon4];
        params.geometries2 = [polygon1,polygon3, polygon5];
        params.relation = "esriGeometryRelationPointTouch";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 2
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationTouch": function() {
        params.geometries1 = [polygon2, polygon4];
        params.geometries2 = [polygon1,polygon3, polygon5];
        params.relation = "esriGeometryRelationTouch";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 2
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationWithin": function() {
        params.geometries1 = [point1,point2,point3,point4,point5];
        params.geometries2 = [polygon1];
        params.relation = "esriGeometryRelationWithin";

        expectedResult = [
          {
            geometry1Index: 0,
            geometry2Index: 0
          },
          {
            geometry1Index: 2,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      },

      "esriGeometryRelationRelation": function() {
        params.geometries1 = [polygon2, polygon1];
        params.geometries2 = [polyline4];
        params.relation = "esriGeometryRelationRelation";
        params.relationParam = "RELATE(G1,G2,'TTTFFTFFT')";

        expectedResult = [
          {
            geometry1Index: 1,
            geometry2Index: 0
          }
        ];

        var dfd = this.async(10000);

        geometryService.relation(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expectedResult.length, "value should be same");

            expectedResult.forEach(function(exp, idx) {
              assert.equal(result[idx].geometry1Index, exp.geometry1Index, "value should be same");
              assert.equal(result[idx].geometry2Index, exp.geometry2Index, "value should be same");
            });

            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });
      }
    },

    "trimExtend": {
      "extendHow": {

        beforeEach: function () {
          params = new TrimExtendParameters();
          params.polylines = [polyline1];
          params.trimExtendTo = polyline2;
        },

        "DEFAULT_CURVE_EXTENSION": function(){
          params.extendHow = 0;

          expectedResult = [
            {
              paths: [
                [], []
              ]
            }
          ];

          var dfd = this.async(10000);

          geometryService.trimExtend(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "RELOCATE_ENDS": function(){
          params.extendHow = 1;

          var dfd = this.async(10000);

          geometryService.trimExtend(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "KEEP_END_ATTRIBUTES": function(){
          params.extendHow = 2;

          var dfd = this.async(10000);

          geometryService.trimExtend(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "NO_END_ATTRIBUTES": function(){
          params.extendHow = 4;

          var dfd = this.async(10000);

          geometryService.trimExtend(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "NO_EXTEND_AT_FROM": function(){
          params.extendHow = 8;

          var dfd = this.async(10000);

          geometryService.trimExtend(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "NO_EXTEND_AT_TO": function(){
          params.extendHow = 16;

          var dfd = this.async(10000);

          geometryService.trimExtend(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        }
      }
    },

    "densify": {

      "geodesic": {

        beforeEach: function() {
          params = new DensifyParameters();
          params.geometries = [polyline1, polyline2];
          params.lengthUnit = GeometryService.UNIT_KILOMETER;
          params.maxSegmentLength = 100;
        },

        "true": function(){
          params.geodesic = true;

          expectedResult = [
            {
              paths: [
                []
              ]
            },
            {
              paths: [
                []
              ]
            }
          ];

          var dfd = this.async(10000);

          geometryService.densify(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },

        "false": function(){
          params.geodesic = false;

          expectedResult = [
            {
              paths: [
                []
              ]
            },
            {
              paths: [
                []
              ]
            }
          ];

          var dfd = this.async(10000);

          geometryService.densify(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].paths.length, exp.paths.length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        }
      }

    },

    "generalize": function(){
      params = new GeneralizeParameters();
      params.geometries = [polygon1, polygon2];
      params.deviationUnit = GeometryService.UNIT_KILOMETER;
      params.maxDeviation = 100;

      expectedResult = [
        {
          rings: [
            [
              [],[],[],[]
            ]
          ]
        },
        {
          rings: [
            [
              [],[],[],[]
            ]
          ]
        }
      ];

      var dfd = this.async(10000);

      geometryService.generalize(params).then(
        dfd.callback(function(result) {
          assert.equal(result.length, expectedResult.length, "value should be same");

          expectedResult.forEach(function(exp, idx) {
            assert.equal(result[idx].rings.length, exp.rings.length, "value should be same");
            assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
          });

          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "offset": {

      "offsetHow": {

        beforeEach: function() {
          params = new OffsetParameters();
          params.bevelRatio = 3;
          params.geometries = [polygon1];
          params.offsetDistance = 10;
          params.offsetUnit = GeometryService.UNIT_KILOMETER;
        },


        "esriGeometryOffsetBevelled": function () {
          params.offsetHow = "esriGeometryOffsetBevelled";

          expectedResult = [
            {
              rings: [
                [
                  [],[],[],[],[],[],[],[],[],[],[],[],[]
                ]
              ]
            }
          ];

          var dfd = this.async(10000);

          geometryService.offset(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].rings.length, exp.rings.length, "value should be same");
                assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "esriGeometryOffsetMitered": function () {
          params.offsetHow = "esriGeometryOffsetMitered";

          expectedResult = [
            {
              rings: [
                [
                  [],[],[],[],[],[],[],[],[],[],[],[],[]
                ]
              ]
            }
          ];

          var dfd = this.async(10000);

          geometryService.offset(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].rings.length, exp.rings.length, "value should be same");
                assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "esriGeometryOffsetRounded": function () {
          params.offsetHow = "esriGeometryOffsetRounded";

          expectedResult = [
            {
              rings: [
                [
                  [],[],[],[],[],[],[]
                ]
              ]
            }
          ];

          var dfd = this.async(10000);

          geometryService.offset(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function(exp, idx) {
                assert.equal(result[idx].rings.length, exp.rings.length, "value should be same");
                assert.equal(result[idx].rings[0].length, exp.rings[0].length, "value should be same");
              });

              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        }
      }
    },

    "distance": function() {
      params = new DistanceParameters();
      params.geometry1 = polyline1;
      params.geometry2 = polyline2;
      params.distanceUnit = GeometryService.UNIT_KILOMETER;
      params.geodesic = true;

      expectedResult = 3.6484906670406176e-10;

      var dfd = this.async(10000);

      geometryService.distance(params).then(
        dfd.callback(function(result) {
          assert.equal(result, expectedResult, "value should be same");
          dfd.resolve();
        }), function(e) {
          dfd.reject(e);
        });
    },

    "toGeoCoordinateString": {
      "conversionType": {
        beforeEach: function() {
          params = {};
          params.sr = new SpatialReference({wkid: 102726});
          params.coordinates = [ [180,0] , [-117,34] , [0,52] ];
          params.numOfDigits = 8;
          params.rounding = true;
          params.addSpaces = true;
        },

        "MGRS": function() {
          params.conversionType = "MGRS";
          params.conversionMode = "mgrsNewWith180InZone01";

          expectedResult = ["05S QD 50155047 77006597", "05S QD 50067966 76981122", "05S QD 50098573 76999939"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "USNG": function() {
          params.conversionType = "USNG";

          expectedResult = ["05S QD 50155047 77006597", "05S QD 50067966 76981122", "05S QD 50098573 76999939"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "UTM": function() {
          params.conversionType = "UTM";

          expectedResult = ["05S 750155 4377006", "05S 750067 4376981", "05S 750098 4376999"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "GeoRef": function() {
          params.conversionType = "GeoRef";

          expectedResult = ["BJQK5457069330378216", "BJQK5450942330365981", "BJQK5453118030375607"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "GARS": function() {
          params.conversionType = "GARS";

          expectedResult = ["060LV48", "060LV48", "060LV48"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "DMS": function() {
          params.conversionType = "DMS";

          expectedResult = ["39 30 22.69294831N 150 05 25.75842234W", "39 30 21.95885806N 150 05 29.43462417W", "39 30 22.53640690N 150 05 28.12920933W"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "DDM": function() {
          params.conversionType = "DDM";

          expectedResult = ["39 30.37821581N 150 05.42930704W", "39 30.36598097N 150 05.49057707W", "39 30.37560678N 150 05.46882016W"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "DD": function() {
          params.conversionType = "DD";

          expectedResult = ["39.50630360N 150.09048845W", "39.50609968N 150.09150962W", "39.50626011N 150.09114700W"];

          var dfd = this.async(10000);

          geometryService.toGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx], exp, "value should be same");

              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
      }
    },

    "fromGeoCoordinateString": {
      "conversionType": {
        beforeEach: function() {
          params = {};
          params.sr = new SpatialReference({wkid: 102726});
        },

        "MGRS": function() {
          params.conversionType = "MGRS";
          params.conversionMode = "mgrsNewWith180InZone01";
          params.strings = ["05S QD 50155047 77006597", "05S QD 50067966 76981122", "05S QD 50098573 76999939"];

          expectedResult =  [ [179.99942114135598, 0.0007764366998647649] , [-117.00025959918779, 34.000148756716705] , [ 0.0008917594425535449, 51.99967728119343] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "USNG": function() {
          params.conversionType = "USNG";
          params.strings = ["05S QD 50155047 77006597", "05S QD 50067966 76981122", "05S QD 50098573 76999939"];

          expectedResult =  [ [179.99942114135598, 0.0007764366998647649] , [-117.00025959918779, 34.000148756716705] , [ 0.0008917594425535449, 51.99967728119343] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "UTM": function() {
          params.conversionType = "UTM";
          params.strings =["05S 750155 4377006", "05S 750067 4376981", "05S 750098 4376999"];

          expectedResult =  [ [179.09329225589985,-1.7519267876911906] , [-120.08954992500016,34.864967391875105] , [-2.9397829430643467,49.88110579370132] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "GeoRef": function() {
          params.conversionType = "GeoRef";
          params.strings = ["BJQK5457069330378216", "BJQK5450942330365981", "BJQK5453118030375607"];

          expectedResult =  [ [180.00059763346758, 0.0010439897406225402] , [-116.99962297975976, 34.00006674366149] , [0.0011625085511089612, 52.00098013714809] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "GARS": function() {
          params.conversionType = "GARS";
          params.strings = ["060LV48", "060LV48", "060LV48"];

          expectedResult =  [ [-20806.872207170316, 5590.153856225008] , [-20806.872207170316, 5590.153856225008] , [-20806.872207170316,5590.153856225008] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "DMS": function() {
          params.conversionType = "DMS";
          params.strings = ["39 30 22.69294831N 150 05 25.75842234W", "39 30 21.95885806N 150 05 29.43462417W", "39 30 22.53640690N 150 05 28.12920933W"];

          expectedResult =  [ [ 180.00000003601073, 5.011043200890223e-7] , [-117.00000019061999, 34.00000022511851] , [-3.3305104201038674e-7, 51.9999999557094] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "DDM": function() {
          params.conversionType = "DDM";
          params.strings =  ["39 30.37821581N 150 05.42930704W", "39 30.36598097N 150 05.49057707W", "39 30.37560678N 150 05.46882016W"];

          expectedResult =  [ [180.00000618217743, 0.000029714875078449644] , [-116.99999729857585, 34.00001435687144] , [-0.000023826899317403633,51.99999808573474] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
        "DD": function() {
          params.conversionType = "DD";
          params.strings = ["39.50630360N 150.09048845W", "39.50609968N 150.09150962W", "39.50626011N 150.09114700W"];

          expectedResult =  [ [180.00059763346758, 0.0010439897406225402] , [-117.00094208493866, 33.99926626923183] , [ 0.0002888041416493555, 51.99870235218356] ];

          var dfd = this.async(10000);

          geometryService.fromGeoCoordinateString(params).then(
            dfd.callback(function(result) {
              assert.equal(result.length, expectedResult.length, "value should be same");

              expectedResult.forEach(function (exp, idx) {
                assert.equal(result[idx][0], exp[0], "value should be same");
                assert.equal(result[idx][1], exp[1], "value should be same");
              })
              dfd.resolve();
            }), function(e) {
              dfd.reject(e);
            });
        },
      }
    }

  });

});