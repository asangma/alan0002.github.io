define([
    "./utils/assertRequest",
    "./utils/Intent"
  ],
  function(
    assertRequest, Intent
  ){

    var executeTest = assertRequest.executeTest,
      dataFormats = assertRequest.dataFormats;

    return {

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "someoriginurl" or "crossoriginurl",
       *  form: formData
       *  handleAs: "json"
       * });
       *
       * esriRequest({
       *  url: "someoriginurl" or "crossoriginurl",
       *  form: formData
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * });
       *
       */
      "upload formData": {
        "Same domain": {
          "get": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isFormSent = true;

            var intent = new Intent();

            executeTest(dfd, "GET", dataFormats["sameOrigin_formData"], intent, expected);
          },

          "post": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isFormSent = true;

            var intent = new Intent();
            executeTest(dfd, "POST", dataFormats["sameOrigin_formData"], intent, expected);
          }
        },
        "Cross domain": {
          "get": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isProxy = true;
            expected.isFormSent = true;

            var intent = new Intent();
            executeTest(dfd, "GET", dataFormats["crossOrigin_formData"], intent, expected);
          },

          "post": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isProxy = true;
            expected.isFormSent = true;

            var intent = new Intent();
            executeTest(dfd, "POST", dataFormats["crossOrigin_formData"], intent, expected);
          }
        }
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "someoriginurl" or "crossoriginurl",
       *  form: formElement,
       *  handleAs: "json"
       * });
       *
       * esriRequest({
       *  url: "someoriginurl" or "crossoriginurl",
       *  form: formElement,
       *  content: { str: "some long string" },
       *  handleAs: "json"
       * });
       *
       */
      "upload form Element": {
        "Same domain ": {
          "get": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isFormSent = true;

            var intent = new Intent();

            executeTest(dfd, "GET", dataFormats["sameOrigin_formElement"], intent, expected);
          },

          "post": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isFormSent = true;

            var intent = new Intent();
            executeTest(dfd, "POST", dataFormats["sameOrigin_formElement"], intent, expected);
          }
        },
        "Cross domain": {
          "get": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isProxy = true;
            expected.isFormSent = true;

            var intent = new Intent();

            executeTest(dfd, "GET", dataFormats["crossOrigin_formElement"], intent, expected);
          },

          "post": function(){
            var dfd = this.async(5000);

            var expected = new Intent();
            expected.isXhrPost = true;
            expected.isProxy = true;
            expected.isFormSent = true;

            var intent = new Intent();
            executeTest(dfd, "POST", dataFormats["crossOrigin_formElement"], intent, expected);
          }
        }
      }
    }

  });