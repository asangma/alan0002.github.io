define([
    "./utils/assertRequest",
    "./utils/Intent"
  ],
  function(
    assertRequest, Intent
  ) {

    var executeTest = assertRequest.executeTest,
      dataFormats = assertRequest.dataFormats;

    return {

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "jsonp",
       *  callbackParamName: "callback"
       * });
       */

      "get": {
        "json": function () {
          var dfd = this.async(5000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected);
        },
        "text": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_text"], intent, expected);
        },
        "xml": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_xml"], intent, expected);
        },

        "blob": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_blob"], intent, expected);
        },

        "arraybuffer": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_arraybuffer"], intent, expected);
        },

        "jsonp": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrGet = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_jsonp"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  content: { str: "some long string" },
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
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

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["sameOrigin_json"], intent, expected);
        },

        "text": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["sameOrigin_text"], intent, expected);
        },

        "xml": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["sameOrigin_xml"], intent, expected);
        },

        "blob": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["sameOrigin_blob"], intent, expected);
        },

        "arraybuffer": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["sameOrigin_arraybuffer"], intent, expected);
        },

        "jsonp": function () {
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var intent = new Intent();
          executeTest(dfd, "POST", dataFormats["sameOrigin_jsonp"], intent, expected);
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "someoriginurl",
       *  handleAs: "json" or "xml" or "text" or "blob" or "arraybuffer"
       * }, {
       *   usePost: true
       * });
       *
       * esriRequest({
       *  url: "someoriginurl",
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

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_json"], intent, expected, options);
        },

        "text": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_text"], intent, expected, options);
        },

        "xml": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_xml"], intent, expected, options);
        },

        "blob": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_blob"], intent, expected, options);
        },

        "arraybuffer": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_arraybuffer"], intent, expected, options);
        },

        "jsonp": function(){
          var dfd = this.async(1000);

          var expected = new Intent();
          expected.isXhrPost = true;

          var options = {
            usePost: true
          };
          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["sameOrigin_jsonp"], intent,  expected, options);
        }
      }
    }
  });
