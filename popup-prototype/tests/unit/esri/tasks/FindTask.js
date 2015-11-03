define([
  'intern!object',
  'intern/chai!assert',

  'esri/tasks/FindTask',
  "esri/tasks/support/FindParameters",

  "esri/geometry/SpatialReference"
], function(
  registerSuite, assert,
  FindTask, FindParameters,
  SpatialReference
){

  var findTask, params,
    executeFindTask,
    expectedResult;

  registerSuite({
    name: "esri/tasks/FindTask",

    setup: function(){
      findTask = new FindTask("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/");

      executeFindTask = function(dfd, params, expected) {

        findTask.execute(params).then(
          dfd.callback(function(result) {
            assert.equal(result.length, expected.length, "should return the matching items");
            expected.forEach(function(expectedItem, idx){
              for(var prop in expectedItem){
                if(prop === "feature") {
                  var expAttributes = expectedItem[prop].attributes;
                  var resAttributes = result[idx][prop].attributes;
                  for(var property in expAttributes){
                    assert.equal(resAttributes[property], expAttributes[property], "should return the matching items");
                  }
                } else {
                  assert.equal(result[idx][prop], expectedItem[prop], "should return the matching items");
                }
              }
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
    "single field of a single layer": {

      setup: function () {
        expectedResult = [
          {
            value: "Kansas",
            foundFieldName: "STATE_NAME",
            feature: {
              attributes: {
                STATE_ABBR: "KS",
                STATE_FIPS: 20
              }
            }
          },
          {
            value: "Arkansas",
            foundFieldName: "STATE_NAME",
            feature: {
              attributes: {
                STATE_ABBR: "AR",
                STATE_FIPS: 05
              }
            }
          }

        ];
      },

      beforeEach: function () {
        params = new FindParameters();
        params.layerIds = [2];
        params.searchFields = ["STATE_NAME"];
        params.searchText = "Kansas";
      },

      "returnGeometry => true": function(){
        params.returnGeometry = true;
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "returnGeometry => false": function(){
        params.returnGeometry = false;
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "contains => true": function(){
        params.contains = true;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "contains => false": function(){
        params.contains = false;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, [expectedResult[0]]);
      },

      "layerDefinitions => POP1999 > 2647904": function(){
        params.layerDefinitions = [];
        params.layerDefinitions[2] = "POP1999 > 2647904";
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, [expectedResult[0]]);
      },

      "outSpatialReference => 4466": function(){
        params.outSpatialReference = new SpatialReference({
          wkid: 102100
        });
        params.maxAllowableOffset = 1;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      }

    },

    "many field of a single layer": {

      setup: function () {
        expectedResult = [
          {
            value: "St. Lawrence",
            foundFieldName: "SYSTEM",
            feature: {
              attributes: {
                NAME: "Niagara",
                SYSTEM: "St. Lawrence"
              }
            }
          },
          {
            value: "St. Lawrence",
            foundFieldName: "SYSTEM",
            feature: {
              attributes: {
                NAME: "Rainy",
                SYSTEM: "St. Lawrence"
              }
            }
          },
          {
            value: "St. Lawrence",
            foundFieldName: "SYSTEM",
            feature: {
              attributes: {
                NAME: "Richelieu",
                SYSTEM: "St. Lawrence"
              }
            }
          },
          {
            value: "St. Lawrence",
            foundFieldName: "SYSTEM",
            feature: {
              attributes: {
                NAME: "St. Clair",
                SYSTEM: "St. Lawrence"
              }
            }
          },
          {
            value: "St. John",
            foundFieldName: "NAME",
            feature: {
              attributes: {
                NAME: "St. John",
                SYSTEM: ""
              }
            }
          },
          {
            value: "St. Johns",
            foundFieldName: "NAME",
            feature: {
              attributes: {
                NAME: "St. Johns",
                SYSTEM: ""
              }
            }
          },
          {
            value: "St. Lawrence",
            foundFieldName: "SYSTEM",
            feature: {
              attributes: {
                NAME: "St. Lawrence",
                SYSTEM: "St. Lawrence"
              }
            }
          }
        ];
      },

      beforeEach: function () {
        params = new FindParameters();
        params.layerIds = [1];
        params.searchFields = ["NAME", "SYSTEM"];
        params.searchText = "St.";
      },

      "returnGeometry => true": function(){
        params.returnGeometry = true;
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "returnGeometry => false": function(){
        params.returnGeometry = false;
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "contains => true": function(){
        params.contains = true;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "contains => false": function(){
        params.contains = false;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, []);
      },

      "layerDefinitions => FID > 42": function(){
        params.layerDefinitions = [];
        params.layerDefinitions[1] = "FID > 42";
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, [expectedResult[6]]);
      },

      "outSpatialReference => 4466": function(){
        params.outSpatialReference = new SpatialReference(4466);
        params.maxAllowableOffset = 1;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      }

    },

    "many fields of a many layers": {

      setup: function () {
        expectedResult = [
          {
            value: "Hazelwood",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Hazel Park",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Kalamazoo",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Hazel Crest",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Hazleton",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Hazelwood",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Azusa",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Yazoo City",
            foundFieldName: "CITY_NAME"
          },
          {
            value: "Brazos",
            foundFieldName: "NAME"
          },
          {
            value: "AZ",
            foundFieldName: "STATE_ABBR"
          }
        ];
      },

      beforeEach: function () {
        params = new FindParameters();
        params.layerIds = [0, 1, 2];
        params.searchFields = ["CITY_NAME", "NAME", "STATE_ABBR"];
        params.searchText = "AZ";
      },

      "returnGeometry => true": function(){
        params.returnGeometry = true;
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "returnGeometry => false": function(){
        params.returnGeometry = false;
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "contains => true": function(){
        params.contains = true;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      },

      "contains => false": function(){
        params.contains = false;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, [expectedResult[9]]);
      },

      "layerDefinitions => POP1999 > 2647904": function(){
        params.layerDefinitions = [];
        params.layerDefinitions[0] = "POP1990 > 50000";
        params.layerDefinitions[1] = "FID > 3";
        params.layerDefinitions[2] = "POP1999 > 2647904";
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, [expectedResult[2], expectedResult[9]]);
      },

      "outSpatialReference => 4466": function(){
        params.outSpatialReference = new SpatialReference({
          wkid: 102100
        });
        params.maxAllowableOffset = 1;
        params.returnGeometry = true; //May be bug
        var dfd = this.async(10000);

        executeFindTask(dfd, params, expectedResult);
      }

    }

  });

});