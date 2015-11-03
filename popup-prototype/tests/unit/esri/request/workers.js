define([
    "esri/config",

    "./utils/assertRequest",
    "./utils/Intent"
  ],
  function(
    esriConfig,
    assertRequest, Intent
  ){

    var executeTest = assertRequest.executeTest,
      dataFormats = assertRequest.dataFormats;

    return{

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "someoriginurl" or "crossoriginurl",
       *  handleAs: "json"
       * }, {
       *  useWorkers: true
       * });
       *
       * esriRequest({
       *  url: "someoriginurl" or "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * }, {
       *  useWorkers: true
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json"
       * }, {
       *  useWorkers: false
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json"
       * }, {
       *  workerOptions: new Worker('workerClient')
       * });
       *
       */
      "config useWorkers on-request": {
        "options useWorker true": {
          "Same domain": {
            "get": function(){
              var dfd = this.async(5000);

              var expected = new Intent();
              expected.isRCGet = true;

              var intent = new Intent();

              var options = {
                useWorkers: true
              };

              executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
            },

            "post": function(){
              var dfd = this.async(5000);

              var expected = new Intent();
              expected.isRCPost = true;

              var intent = new Intent();
              var options = {
                useWorkers: true
              };

              executeTest(dfd, "POST", dataFormats["sameOrigin_json"], intent, expected, options);
            }
          },
          "Cross domain": {
            "get": function(){
              var dfd = this.async(5000);

              var expected = new Intent();
              expected.isProxy = true;
              expected.isRCGet = true;

              var intent = new Intent();

              var options = {
                useWorkers: true
              };

              executeTest(dfd, "GET", dataFormats["crossOrigin_json"], intent, expected, options);
            },

            "post": function(){
              var dfd = this.async(5000);

              var expected = new Intent();
              expected.isProxy = true;
              expected.isRCPost = true;

              var intent = new Intent();
              var options = {
                useWorkers: true
              };

              executeTest(dfd, "POST", dataFormats["crossOrigin_json"], intent, expected, options);
            }
          }
        },

        "options useWorker false": function(){
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();

          var options = {
            useWorkers: false
          };

          /**
           * This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2254
           * When you send an esri/request to fetch jsonp data with either of the following:
           * "useWorker: true" or "workerOptions" in options object of the request or "useWorker: true" in the config,
           * then, the worker logic in the code is replacing the value of the "dojo/_base/xhr" module local variable -
           * "xhr" with the "RequestClient" or user script from workerOptions based on the options object of the request.
           */
          console.log("****** This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2254 ******");

          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        },

        "options workerOptions": function(){
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isRCGet = true;

          var intent = new Intent();

          var options = {
            workerOptions: new Worker('esri/workers/WorkerClient')
          };

          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriConfig.request.useWorkers = false;
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json"
       * }, {
       *  useWorkers: true
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json"
       * }, {
       *  useWorkers: false
       * });
       *
       */
      "config useWorkers false": {
        "options useWorkers true": function(){
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();

          var options = {
            useWorkers: true
          };

          esriConfig.request.useWorkers = false;

          /**
           * This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2254
           * When you send an esri/request to fetch jsonp data with either of the following:
           * "useWorker: true" or "workerOptions" in options object of the request or "useWorker: true" in the config,
           * then, the worker logic in the code is replacing the value of the "dojo/_base/xhr" module local variable -
           * "xhr" with the "RequestClient" or user script from workerOptions based on the options object of the request.
           */
          console.log("****** This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2254 ******");

          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        },
        "options useWorkers false": function(){
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();

          var options = {
            useWorkers: false
          };

          esriConfig.request.useWorkers = false;

          /**
           * This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2254
           * When you send an esri/request to fetch jsonp data with either of the following:
           * "useWorker: true" or "workerOptions" in options object of the request or "useWorker: true" in the config,
           * then, the worker logic in the code is replacing the value of the "dojo/_base/xhr" module local variable -
           * "xhr" with the "RequestClient" or user script from workerOptions based on the options object of the request.
           */
          console.log("****** This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2254 ******");

          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriConfig.request.useWorkers = true;
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json"
       * }, {
       *  useWorkers: true
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json"
       * }, {
       *  useWorkers: false
       * });
       *
       */
      "config useWorkers true": {
        "options useWorkers true": function(){
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isRCGet = true;

          var intent = new Intent();

          var options = {
            useWorkers: true
          };

          esriConfig.request.useWorkers = true;

          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        },
        "options useWorkers false": function(){
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isRCGet = true;

          var intent = new Intent();

          var options = {
            useWorkers: false
          };

          esriConfig.request.useWorkers = true;

          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        }
      }
    }

  });