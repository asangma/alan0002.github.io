define([
    "esri/config",

    "./utils/assertRequest",
    "./utils/Intent"
  ],
  function(
    esriConfig,
    assertRequest, Intent
  ) {

    var executeTest = assertRequest.executeTest,
      dataFormats = assertRequest.dataFormats;

    return{

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * });
       */
      "get": {
        "json": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();

          executeTest(dfd, "GET", dataFormats["crossOrigin_json"], intent, expected);
        },

        "text": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();

          executeTest(dfd, "GET", dataFormats["crossOrigin_text"], intent, expected);
        },

        "xml": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_xml"], intent, expected);
        },

        "blob": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_blob"], intent, expected);
        },

        "arraybuffer": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_arraybuffer"], intent, expected);
        },

        "jsonp": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isScriptGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_jsonp"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * });
       */
      "auto switch to post": {

        "json": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_json"], intent, expected);
        },

        "text": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_text"], intent, expected);
        },

        "xml": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_xml"], intent, expected);
        },

        "blob": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_blob"], intent, expected);
        },

        "arraybuffer": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_arraybuffer"], intent, expected);
        },

        "jsonp": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_jsonp"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * }, {
       *   usePost: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * }, {
       *    usePost: true
       * });
       */
      "usePost": {

        "json": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_json"], intent, expected, options);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_text"], intent, expected, options);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_xml"], intent, expected, options);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_blob"], intent, expected, options);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_arraybuffer"], intent, expected, options);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_jsonp"], intent, expected, options);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * }, {
       *   useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * }, {
       *    useProxy: true
       * });
       */
      "useProxy (get)": {

        "json": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_json"], intent, expected, options);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_text"], intent, expected, options);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_xml"], intent, expected, options);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_blob"], intent, expected, options);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_arraybuffer"], intent, expected, options);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isScriptGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          /**
           * This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/1927
           * When you send an esri/request to fetch jsonp data with the following conditions:
           * must use proxy, no parameters in the content or the url of the service, no CORs
           * then, the request fails, as the callback is added as a parameter to the proxy instead of the service url
           */
          console.log("****** This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/1927 ******");
          executeTest(dfd, "GET", dataFormats["crossOrigin_jsonp"], intent, expected, options);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * }, {
       *   useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * }, {
       *    useProxy: true
       * });
       */
      "useProxy (auto switch to post)": {

        "json": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_json"], intent, expected, options);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_text"], intent, expected, options);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_xml"], intent, expected, options);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_blob"], intent, expected, options);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_arraybuffer"], intent, expected, options);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_jsonp"], intent, expected, options);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * }, {
       *   usePost: true,
       *   useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * }, {
       *    usePost: true,
       *    useProxy: true
       * });
       */
      "useProxy (usePost)": {

        "json": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_json"], intent, expected, options);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_text"], intent, expected, options);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_xml"], intent, expected, options);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_blob"], intent, expected, options);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_arraybuffer"], intent, expected, options);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_jsonp"], intent, expected, options);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * });
       *
       * esriConfig.request.forceProxy = true;
       */
      "forceProxy (get)": {

        "json": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_json"], intent, expected);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_text"], intent, expected);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_xml"], intent, expected);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_blob"], intent, expected);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_arraybuffer"], intent, expected);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isScriptGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          /**
           * This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/1927
           * When you send an esri/request to fetch jsonp data with the following conditions:
           * must use proxy, no parameters in the content or the url of the service, no CORs
           * then, the request fails, as the callback is added as a parameter to the proxy instead of the service url
           */
          console.log("****** This test fails due to the issue https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/1927 ******");
          executeTest(dfd, "GET", dataFormats["crossOrigin_jsonp"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * });
       *
       * esriConfig.request.forceProxy = true;
       */
      "forceProxy (auto switch to post )": {

        "json": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_json"], intent, expected);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_text"], intent, expected);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_xml"], intent, expected);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_blob"], intent, expected);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_arraybuffer"], intent, expected);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_jsonp"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  handleAs: "json"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  handleAs: "json"
       * }, {
       *    usePost: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  handleAs: "json"
       * }, {
       *    useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * }, {
       *    useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  handleAs: "json"
       * }, {
       *    usePost: true,
       *    useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  handleAs: "json"
       * });
       * esriConfig.request.forceProxy = true;
       *
       * esriRequest({
       *  url: "crossoriginurlwithcorsenabled",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * });
       * esriConfig.request.forceProxy = true;
       *
       */
      "cors (default list)": {

        "get": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;

          //cors are enabled on the server. so no need of proxy.

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected);
        },

        "auto switch to post": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          //cors are enabled on the server. so no need of proxy.

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_cors"], intent, expected);
        },

        "usePost": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          //cors are enabled on the server. so no need of proxy.

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "useProxy (get)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "useProxy (auto switch to post)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "useProxy (usePost)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "forceProxy (get)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected);
        },

        "forceProxy (auto switch to post)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;

          var intent = new Intent();
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_cors"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriConfig.request.corsEnabledServers = [];
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json"
       * }, {
       *    usePost: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json"
       * }, {
       *    useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * }, {
       *    useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json"
       * }, {
       *    usePost: true,
       *    useProxy: true
       * });
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  handleAs: "json"
       * });
       * esriConfig.request.forceProxy = true;
       *
       * esriRequest({
       *  url: "crossoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * });
       * esriConfig.request.forceProxy = true;
       *
       */
      "cors detection": {

        "get": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.corsDetection = true;

          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected);
        },

        "auto switch to post": function () {
          var dfd = this.async(2000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.corsDetection = true;

          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          executeTest(dfd, "POST", dataFormats["crossOrigin_cors"], intent, expected);
        },

        "usePost": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.corsDetection = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "useProxy (get)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;
          expected.corsDetection = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "useProxy (auto switch to post)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;
          expected.corsDetection = true;

          var options = {
            useProxy: true
          };
          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          executeTest(dfd, "POST", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "useProxy (usePost)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;
          expected.corsDetection = true;

          var options = {
            usePost: true,
            useProxy: true
          };
          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected, options);
        },

        "forceProxy (get)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.isProxy = true;
          expected.corsDetection = true;

          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "GET", dataFormats["crossOrigin_cors"], intent, expected);
        },

        "forceProxy (auto switch to post)": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;
          expected.isProxy = true;
          expected.corsDetection = true;

          var intent = new Intent();
          esriConfig.request.corsEnabledServers = [];
          esriConfig.request.forceProxy = true;
          executeTest(dfd, "POST", dataFormats["crossOrigin_cors"], intent, expected);
        }
      }
    }
  });
