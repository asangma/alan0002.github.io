define([
  'intern!object',
  'intern/chai!assert',

  'esri/tasks/GenerateRendererTask',
  "esri/tasks/support/GenerateRendererParameters",
  "esri/tasks/support/ClassBreaksDefinition",
  "esri/tasks/support/UniqueValueDefinition",
  "esri/tasks/support/AlgorithmicColorRamp",

  "esri/symbols/SimpleFillSymbol",

  "esri/renderers/ClassBreaksRenderer",
  "esri/renderers/UniqueValueRenderer"
], function(
  registerSuite, assert,
  GenerateRendererTask, GenerateRendererParameters, ClassBreaksDefinition, UniqueValueDefinition, AlgorithmicColorRamp,
  SimpleFillSymbol,
  ClassBreaksRenderer, UniqueValueRenderer
){

  var generateRendererTask, params, classificationDefinition,
    executeGenerateRendererTask,
    expectedResult;

  registerSuite({
    name: "esri/tasks/GenerateRendererTask",

    setup: function(){
      generateRendererTask = new GenerateRendererTask("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/0");

      executeGenerateRendererTask = function(dfd, params, expected) {

        generateRendererTask.execute(params).then(
          dfd.callback(function(result) {
            if(expected.type === "ClassBreaksRenderer") {
              assert.instanceOf(result, ClassBreaksRenderer, "should be an instance of ClassBreaksRenderer");
              assert.property(result, "attributeField", "should have attributeField property");
            } else
            if(expected.type === "UniqueValueRenderer") {
              assert.instanceOf(result, UniqueValueRenderer, "should be an instance of UniqueValueRenderer");
            }

            for(var prop in expected.renderer) {
              if(prop === "infos"){
                assert.equal(result[prop].length, expected.renderer[prop].length);
                expected.renderer[prop].forEach(function (info, idx) {
                  for(var property in info) {
                    if(property === "symbol"){
                      assert.equal(result[prop][idx][property].type, info[property].type, property + " values should be same");
                    } else {
                      assert.property(result[prop][idx], property, property + " should exist");
                    }
                  }
                });

              }
              else if(prop === "values"){
                assert.equal(result[prop].length, expected.renderer[prop].length);
              }
              else{
                assert.property(result, prop, prop + " property should exist");
              }
            }
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

      beforeEach: function(){
        params = new GenerateRendererParameters();
      },

      "params classificationDefinition": {
        "ClassBreaksDefinition": {

          beforeEach: function(){
            classificationDefinition = new ClassBreaksDefinition();

            var colorRamp = new AlgorithmicColorRamp({
              algorithm: "hsv",
              fromColor: "#846AE3",
              toColor: "#AE51CD"
            });

            classificationDefinition.baseSymbol = new SimpleFillSymbol();
            classificationDefinition.breakCount = 3;
            classificationDefinition.classificationField = "eventtype";
            classificationDefinition.colorRamp = colorRamp;
          },

          "classificationMethod": {
            "natural-breaks": function(){
              classificationDefinition.classificationMethod = "natural-breaks";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "natural-breaks",
                  infos: [
                    {
                      classMaxValue: 8,
                      maxValue: 8,
                      minValue: 0,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 17,
                      maxValue: 17,
                      minValue: 8,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 26,
                      maxValue: 26,
                      minValue: 17,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    }
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            },

            "equal-interval": function(){
              classificationDefinition.classificationMethod = "equal-interval";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "equal-interval",
                  infos: [
                    {
                      classMaxValue: 8.666666666666666,
                      maxValue: 8.666666666666666,
                      minValue: 0,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 17.333333333333332,
                      maxValue: 17.333333333333332,
                      minValue: 8.666666666666666,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 26,
                      maxValue: 26,
                      minValue: 17.333333333333332,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    }
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            },
            "quantile": function(){
              classificationDefinition.classificationMethod = "quantile";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "quantile",
                  infos: [
                    {
                      classMaxValue: 8,
                      maxValue: 8,
                      minValue: 0,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 12,
                      maxValue: 12,
                      minValue: 8,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 26,
                      maxValue: 26,
                      minValue: 12,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    }
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            },
            "standard-deviation": function(){
              classificationDefinition.classificationMethod = "standard-deviation";
              classificationDefinition.standardDeviationInterval = 1;
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "standard-deviation",
                  infos: [
                    {}, {}, {}, {}, {}
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            },
            "geometrical-interval": function(){
              classificationDefinition.classificationMethod = "geometrical-interval";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "geometrical-interval",
                  infos: [
                    {
                      classMaxValue: 5.7951147047464895,
                      maxValue: 5.7951147047464895,
                      minValue: 0,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 14.099586922613273,
                      maxValue: 14.099586922613273,
                      minValue: 5.7951147047464895,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 26,
                      maxValue: 26,
                      minValue: 14.099586922613273,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    }
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            }
          },

          "normalizationType": {
            "field": function() {
              classificationDefinition.classificationMethod = "natural-breaks";
              classificationDefinition.normalizationType = "field";
              classificationDefinition.normalizationField = "eventtype";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "natural-breaks",
                  normalizationField: "eventtype",
                  normalizationType: "field",
                  infos: [
                    {
                      classMaxValue: 1,
                      maxValue: 1,
                      minValue: 1,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    }
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            },

            "log": function() {
              classificationDefinition.classificationMethod = "natural-breaks";
              classificationDefinition.normalizationType = "log";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "natural-breaks",
                  normalizationType: "log",
                  infos: [
                    {
                      classMaxValue: 0,
                      maxValue: 0,
                      minValue: 0,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 1,
                      maxValue: 1,
                      minValue: 0,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    },
                    {
                      classMaxValue: 1.414973347970818,
                      maxValue: 1.414973347970818,
                      minValue: 1,
                      symbol: {
                        type: "simplefillsymbol"
                      }
                    }
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            },
            "percent-of-total": function() {
              classificationDefinition.classificationMethod = "natural-breaks";
              classificationDefinition.normalizationType = "percent-of-total";
              params.classificationDefinition = classificationDefinition;

              expectedResult = {
                type: "ClassBreaksRenderer",
                renderer: {
                  attributeField: "eventtype",
                  classificationMethod: "natural-breaks",
                  normalizationTotal: 2945,
                  normalizationType: "percent-of-total",
                  infos: [
                    {}, {}, {}
                  ]
                }
              };

              var dfd = this.async(10000);
              executeGenerateRendererTask(dfd, params, expectedResult);
            }
          }
        },

        "UniqueValueDefinition": function(){
          classificationDefinition = new UniqueValueDefinition();

          var colorRamp = new AlgorithmicColorRamp({
            algorithm: "hsv",
            fromColor: "#846AE3",
            toColor: "#AE51CD"
          });

          classificationDefinition.baseSymbol = new SimpleFillSymbol();
          classificationDefinition.colorRamp = colorRamp;

          classificationDefinition.attributeField = "eventtype";
          classificationDefinition.attributeField2 = "eventdate";

          params.classificationDefinition = classificationDefinition;

          expectedResult = {
            type: "UniqueValueRenderer",
            renderer: {
              attributeField: "eventtype",
              attributeField2: "eventdate",
              attributeField3: "",
              fieldDelimiter: ",",
              infos: [
                {
                  count: 1,
                  label: "0,10/7/2015 4:00:00 PM",
                  value: "0,10/7/2015 4:00:00 PM",
                  symbol: {
                    type: "simplefillsymbol"
                  }
                }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},{}, {}, {}, {}, {},{}, {}, {}, {}
              ],
              values: [
                "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
              ]
            }
          };

          var dfd = this.async(10000);
          executeGenerateRendererTask(dfd, params, expectedResult);
        }
      },

      "params formatLabel": function(){
        classificationDefinition = new ClassBreaksDefinition();

        var colorRamp = new AlgorithmicColorRamp({
          algorithm: "hsv",
          fromColor: "#846AE3",
          toColor: "#AE51CD"
        });

        classificationDefinition.baseSymbol = new SimpleFillSymbol();
        classificationDefinition.breakCount = 3;
        classificationDefinition.classificationField = "eventtype";
        classificationDefinition.colorRamp = colorRamp;
        classificationDefinition.classificationMethod = "equal-interval";
        params.classificationDefinition = classificationDefinition;
        params.formatLabel = true;

        expectedResult = {
          type: "ClassBreaksRenderer",
          renderer: {
            attributeField: "eventtype",
            classificationMethod: "equal-interval",
            infos: [
              {
                label: "0 - 8.667"
              },
              {
                label: "8.667 - 17.333"
              },
              {
                label: "17.333 - 26"
              }
            ]
          }
        };

        var dfd = this.async(10000);
        executeGenerateRendererTask(dfd, params, expectedResult);
      },

      "params precision": function(){
        classificationDefinition = new ClassBreaksDefinition();

        var colorRamp = new AlgorithmicColorRamp({
          algorithm: "hsv",
          fromColor: "#846AE3",
          toColor: "#AE51CD"
        });

        classificationDefinition.baseSymbol = new SimpleFillSymbol();
        classificationDefinition.breakCount = 3;
        classificationDefinition.classificationField = "eventtype";
        classificationDefinition.colorRamp = colorRamp;
        classificationDefinition.classificationMethod = "equal-interval";
        params.classificationDefinition = classificationDefinition;
        params.precision = 2;

        expectedResult = {
          type: "ClassBreaksRenderer",
          renderer: {
            attributeField: "eventtype",
            classificationMethod: "equal-interval",
            infos: [
              {
                classMaxValue: 8,
                maxValue: 8,
                minValue: 0,
                symbol: {
                  type: "simplefillsymbol"
                }
              },
              {
                classMaxValue: 18,
                maxValue: 18,
                minValue: 8,
                symbol: {
                  type: "simplefillsymbol"
                }
              },
              {
                classMaxValue: 26,
                maxValue: 26,
                minValue: 18,
                symbol: {
                  type: "simplefillsymbol"
                }
              }
            ]
          }
        };

        var dfd = this.async(10000);
        executeGenerateRendererTask(dfd, params, expectedResult);
      },

      "params prefix": function(){
        classificationDefinition = new ClassBreaksDefinition();

        var colorRamp = new AlgorithmicColorRamp({
          algorithm: "hsv",
          fromColor: "#846AE3",
          toColor: "#AE51CD"
        });

        classificationDefinition.baseSymbol = new SimpleFillSymbol();
        classificationDefinition.breakCount = 3;
        classificationDefinition.classificationField = "eventtype";
        classificationDefinition.colorRamp = colorRamp;
        classificationDefinition.classificationMethod = "equal-interval";
        params.classificationDefinition = classificationDefinition;
        params.prefix = "testing:";

        expectedResult = {
          type: "ClassBreaksRenderer",
          renderer: {
            attributeField: "eventtype",
            classificationMethod: "equal-interval",
            infos: [
              {
                label: "testing: 0 - 9"
              },
              {
                label: "testing: 10 - 17"
              },
              {
                label: "testing: 18 - 26"
              }
            ]
          }
        };

        var dfd = this.async(10000);
        executeGenerateRendererTask(dfd, params, expectedResult);
      },

      "params unitLabel": function(){
        classificationDefinition = new ClassBreaksDefinition();

        var colorRamp = new AlgorithmicColorRamp({
          algorithm: "hsv",
          fromColor: "#846AE3",
          toColor: "#AE51CD"
        });

        classificationDefinition.baseSymbol = new SimpleFillSymbol();
        classificationDefinition.breakCount = 3;
        classificationDefinition.classificationField = "eventtype";
        classificationDefinition.colorRamp = colorRamp;
        classificationDefinition.classificationMethod = "equal-interval";
        params.classificationDefinition = classificationDefinition;
        params.unitLabel = ":testingLabel";

        expectedResult = {
          type: "ClassBreaksRenderer",
          renderer: {
            attributeField: "eventtype",
            classificationMethod: "equal-interval",
            infos: [
              {
                label: "0 - 9 :testingLabel"
              },
              {
                label: "10 - 17 :testingLabel"
              },
              {
                label: "18 - 26 :testingLabel"
              }
            ]
          }
        };

        var dfd = this.async(10000);
        executeGenerateRendererTask(dfd, params, expectedResult);
      },

      "params where": function(){
        classificationDefinition = new ClassBreaksDefinition();

        var colorRamp = new AlgorithmicColorRamp({
          algorithm: "hsv",
          fromColor: "#846AE3",
          toColor: "#AE51CD"
        });

        classificationDefinition.baseSymbol = new SimpleFillSymbol();
        classificationDefinition.breakCount = 3;
        classificationDefinition.classificationField = "eventtype";
        classificationDefinition.colorRamp = colorRamp;
        classificationDefinition.classificationMethod = "equal-interval";
        params.classificationDefinition = classificationDefinition;
        params.where = "eventtype > 1";

        expectedResult = {
          type: "ClassBreaksRenderer",
          renderer: {
            attributeField: "eventtype",
            classificationMethod: "equal-interval",
            infos: [
              {
                classMaxValue: 11.333333333333332,
                maxValue: 11.333333333333332,
                minValue: 4,
                symbol: {
                  type: "simplefillsymbol"
                }
              },
              {
                classMaxValue: 18.666666666666664,
                maxValue: 18.666666666666664,
                minValue: 11.333333333333332,
                symbol: {
                  type: "simplefillsymbol"
                }
              },
              {
                classMaxValue: 26,
                maxValue: 26,
                minValue: 18.666666666666664,
                symbol: {
                  type: "simplefillsymbol"
                }
              }
            ]
          }
        };

        var dfd = this.async(10000);
        executeGenerateRendererTask(dfd, params, expectedResult);
      },

    }


  });

});