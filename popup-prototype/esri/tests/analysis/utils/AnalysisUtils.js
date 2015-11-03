define(
 ["esri/layers/FeatureLayer",
  "dojo/_base/lang",
  "dojo/cookie",
  "dojo/Deferred"
 ], function (FeatureLayer, lang, cookie, Deferred) {

    var analysisUtils = {};
    lang.mixin(analysisUtils, {
      start: 0,
      end: 0,
      analysisTask: null,
      featureCollection: null,
      featureLayer: null,
      dfd: null,

      init: function (testConfig) {


        cookie("esri_auth", JSON.stringify(testConfig.auth));

        /* create a feature collection */
        this.featureCollection = {
          "layerDefinition": {
            "geometryType": "esriGeometryPoint",
            "objectIdField": "ObjectID",
            "fields": [{
              "name": "ObjectID",
              "alias": "ObjectID",
              "type": "esriFieldTypeOID"
              }, {
              "name": "description",
              "alias": "Description",
              "type": "esriFieldTypeString"
              }, {
              "name": "title",
              "alias": "Title",
              "type": "esriFieldTypeString"
              }]
          },
          "featureSet": {
            "features": [{
              "geometry": {
                "x": -13631968.71429867,
                "y": 4542390.447087175,
                "spatialReference": {
                  "wkid": 102100,
                  "latestWkid": 3857
                }
              },
              "attributes": {
                "ObjectID": 0
              },
              "symbol": {
                "color": [0, 255, 0, 64],
                "size": 10.5,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "outline": {
                  "color": [255, 0, 0, 255],
                  "width": 0.75,
                  "type": "esriSLS",
                  "style": "esriSLSSolid"
                }
              }
              }],
            "geometryType": "esriGeometryPoint"
          }
        };
        //create a feature layer based on the feature collection
        this.featureLayer = new FeatureLayer(this.featureCollection, {
          id: "analysisLayer"
        });



      },

      analyze: function (toolName, options) {
        //Define the job params for tool

        var params, resultParameter;
        this.dfd = new Deferred();


        if (toolName === "CreateViewshed") {
          //http: //developersdev.arcgis.com/rest/analysis/api-reference/create-viewshed.htm
          params = {
            inputLayer: this.featureLayer, //required
            demResolution: "FINEST", //optional
            returnFeatureCollection: true
          };
          resultParameter = "viewshedLayer";
        } else if (toolName === "CreateBuffers") {
          params = {
            inputLayer: this.featureLayer, //required
            distances: [1, 2, 3],
            units: "Miles", //optional
            returnFeatureCollection: true
          };
          lang.mixin(params, options);
          resultParameter = "bufferLayer";
        } else if (toolName === "CreateWatersheds") {
          params = {
            inputLayer: this.featureLayer, //required
            returnFeatureCollection: true
          };
          resultParameter = "watershedLayer";

        } else if (toolName === "CreateDriveTimeAreas") {
          params = {
            inputLayer: this.featureLayer, //required
            breakValues: [1, 5, 10],
            travelMode: "Walking", //optional default Driving
            units: "Minutes", //optional
            returnFeatureCollection: true
          };
          resultParameter = "driveTimeAreasLayer";
        }
        this.analysisTask.set({
          "toolName": toolName,
          "resultParameter": resultParameter
        });
        var contextObj = {
          outSR: {
            "wkid": 102100,
            "latestWkid": 3857
          }
        };
        params.context = JSON.stringify(contextObj);
        this.start = window.performance.now();
        this.analysisTask.execute({
          jobParams: params
        });

        //If any errors occur reset the widget (Not Working...troubleshoot)
        this.analysisTask.on("job-fail", lang.hitch(this, function (params) {
          console.log("error");
          this.reset();
          this.dfd.reject(params.message);
        }));
        this.analysisTask.on("job-status", lang.hitch(this, function (status) {
          if (status.jobStatus === "esriJobFailed") {
            console.log("Job Failed: " + status.messages[0].description);
            this.reset();
            this.dfd.reject(status.message);
          }
        }));
        this.analysisTask.on("job-result", lang.hitch(this, function (result) {
          this.end = window.performance.now();
          var time = this.end - this.start;
          console.log("Analysis Time : " + time + " milliseconds for " + this.analysisTask._toolServiceUrl);
          //expect(time).to.be.within(3000, 15000);
          //add the results to the map.
          this.reset();
          console.log(result);
          this.dfd.resolve({
            result: result,
            time: time
          });
        }));
        return this.dfd;
      },

      reset: function () {
        this.analysisTask.gp = null;
      }



    });
    return analysisUtils;

  });
