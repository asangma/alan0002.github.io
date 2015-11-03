define([
  "intern!object",
  "intern/chai!assert",
  "intern/chai!expect",
  "dojo/_base/json",
  "dojo/_base/lang",
  "esri/lang",
  "esri/widgets/analysis/AnalysisBase",
  "./utils/config"

], function (registerSuite, assert, expect, dojoJson, lang, esriNS, AnalysisBase, testConfig) {
  var aBase;
  registerSuite({
    name: "AnalysisBase",
    setup: function () {
      aBase = new AnalysisBase({
        portalUrl: testConfig.portalUrl,
        toolName: "CreateBuffers"
      });
    },

    /*"signin test via analysisServer": function () {
      var dfd = this.async(10000);
      aBase = new AnalysisBase({
        analysisGpServer: testConfig.analysisServer,
        toolName: "CreateBuffers"
      });
      
      this.parent.setFindTimeout(10000)
        .findById("dijit_form_ValidationTextBox_0")
        .click()
        .type("analytics")
        .end()
        .findById("dijit_form_ValidationTextBox_1")
        .click()
        .type("test")
        .end()
        .findById("dijit_form_Button_0")
        .findAllByTagName("input")
        .click()
        .findById("dijit_Dialog_0")
        .isDisplayed
        .then(function (value) {
          assert.strictEqual(value, "false", "signin successfull");
        });


      aBase.signInPromise.then(function (credential) {
        console.log(credential);
        assert.isDefined(credential, "credential is defined");
      }, dfd.reject.bind(dfd));
    },*/

    "signin test via portalUrl": function () {
      var timeout = 60000,
        dfd = this.async(timeout);
      var aBase2 = new AnalysisBase({
        portalUrl: testConfig.portalUrl
      });
      aBase2.signInPromise.then(dfd.callback(function (credential) {
        console.log(credential);
        assert.isDefined(credential, "credential is defined");
      }), dfd.reject.bind(dfd));
    },

    "get toolName": function () {
      aBase.set("toolName", "CreateBuffers");
      assert.strictEqual(aBase.get("toolName"), "CreateBuffers");
    },

    "get toolServiceUrl": function () {
      aBase.set("toolServiceUrl", testConfig.analysisServer + "/" + "CreateBuffers");
      console.log(aBase);
      assert.strictEqual(aBase._toolServiceUrl, testConfig.analysisServer + "/" + "CreateBuffers");
      assert.isDefined(aBase.gp, "Geoprocessor task is defined");
    },


    "get credits estimate test": function () {
      var timeout = 60000,
        dfd = this.async(timeout),
        params = {
          inputLayer: dojoJson.toJson({
            url: testConfig.pointHostedFSLayer
          }),
          distances: [1, 2, 3],
          units: "Miles" //optional
        };
      aBase.getCreditsEstimate("CreateBuffers", params).then(dfd.callback(function (response) {
        console.log(response);
        assert.isDefined(response.cost, "cost is defined");
        assert.isDefined(response.totalRecords, "totalRecords is defined");
        assert.strictEqual(response.cost, 0.018, "cost matches the expected value of 0.018");
        assert.strictEqual(response.totalRecords, 18, "totalRecords matches the expected value of 18");

      }), dfd.reject.bind(dfd));
    },

    "get credits estimate by extent test": function () {
      var timeout = 60000,
        dfd = this.async(timeout),
        params = {
          inputLayer: dojoJson.toJson({
            url: testConfig.pointHostedFSLayer
          }),
          distances: [1, 2, 3],
          units: "Miles", //optional
          context: dojoJson.toJson({
            extent: {
              xmin: -11126699.18650088,
              ymin: 5114048.647208094,
              xmax: -10675109.223392278,
              ymax: 5252858.290573907,
              spatialReference: {
                wkid: 102100
              }
            }
          })
        };
      aBase.getCreditsEstimate("CreateBuffers", params).then(dfd.callback(function (response) {
        console.log(response);
        assert.isDefined(response.cost, "cost is defined ");
        assert.isDefined(response.totalRecords, "totalRecords is defined ");
        assert.strictEqual(response.cost, 0.001, "cost matches the expected value of 0.001 ");
        assert.strictEqual(response.totalRecords, 1, "totalRecords matches the expected value of 1 ");
      }), dfd.reject.bind(dfd));
    },

    "get credits estimate test for NA based FindNearest": function () {
      var timeout = 60000,
        dfd = this.async(timeout),
        params = {
          nearLayer: dojoJson.toJson({
            url: "http://servicesdev.arcgis.com/f126c8da131543019b05e4bfab6fc6ac/arcgis/rest/services/KeystonePipeline_PlanData/FeatureServer/1"
          }),
          measurementType: "DrivingDistance",
          analysisLayer: dojoJson.toJson({
            url: "http://servicesdev.arcgis.com/f126c8da131543019b05e4bfab6fc6ac/arcgis/rest/services/KeystonePipeline_PlanData/FeatureServer/0"
          })
        };
      aBase.set("toolServiceUrl", testConfig.analysisServer + "/" + "FindNearest");
      aBase.getCreditsEstimate("FindNearest", params).then(dfd.callback(function (response) {
        console.log(response);
        assert.isDefined(response, "response is defined");
        assert.strictEqual(response.messageCode, "GPEXT_014", "message code matches the expected value of GPEXT_014");
        assert.isDefined(aBase.i18n[response.messageCode], "i18n bundle contains this messagecode");

      }), dfd.reject.bind(dfd));
    },

    "check start event": function () {
      var timeout = 600000,
        dfd = this.async(timeout),
        params = {
          inputLayer: dojoJson.toJson({
            url: testConfig.pointHostedFSLayer
          }),
          distances: [5],
          units: "Miles", //optional
          context: dojoJson.toJson({
            outSR: {
              wkid: 102100,
              latestWkid: 3857
            }
          }),
          returnFeatureCollection: true
        };

      aBase = new AnalysisBase({
        portalUrl: testConfig.portalUrl,
        toolName: "CreateBuffers",
        resultParameter: "bufferLayer"
      });

      dfd.then(dfd.callback(function (response) {
        assert.strictEqual(response.eventObj.units, [1, 2], "the params from start event are correct");
      }), dfd.reject.bind(dfd));

      aBase.on("start", lang.hitch(this, function (jobParams) {
        console.log(jobParams);
        dfd.resolve({
          event: "start",
          eventObj: jobParams
        });
      }));

      aBase.execute({
        jobParams: params
      });
    }

  });

});