define([
    "esri/request",
    "intern/chai!assert"
  ],
  function(
    esriRequest, assert
  ) {

    var baseUrl, rootDir, dataFormats, executeTest;

    // Get urls from grunt-config.json
    var xmlhttp = new XMLHttpRequest();
    var url = "../../grunt-config.json";
    xmlhttp.open("GET", url, false);
    xmlhttp.send();

    if (xmlhttp.status === 200) {
      var response = JSON.parse(xmlhttp.responseText);
      baseUrl = response.base;
      rootDir = baseUrl.split('://')[1].split('/')[1];
    }

    // different types of urls that can be handled by esriRequest
    dataFormats = {
      "absolute_json": {
        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/?f=pjson',
        handleAs: "json"
      },
      "document-relative_json": {
        url: '../../tests/support/mocking/Samples/json.json',
        handleAs: "json"
      },
      "root-relative_json": {
        url: '/' + rootDir + '/tests/support/mocking/Samples/json.json',
        handleAs: "json"
      },
      "protocol-relative_json": {
        url: '//services.arcgisonline.com/ArcGIS/rest/services/?f=pjson',
        handleAs: "json"
      }
    };

    executeTest = function(dfd, test){

      var request = esriRequest(test);

      request.then(
        dfd.rejectOnError(function(result) {

          assert.equal(result.currentVersion, 10.3, "json currentVersion should be 10.3");

          dfd.resolve();
        }), dfd.reject);
    };


    return {
      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "http://absoluteurl.com/json",
       *  handleAs: "json"
       * });
       *
       */
      "absolute": function(){
        var dfd = this.async(1000);
        executeTest(dfd, dataFormats["absolute_json"])
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "../../documentrelativeurl/json",
       *  handleAs: "json"
       * });
       *
       */
      "document-relative": function(){
        var dfd = this.async(1000);
        executeTest(dfd, dataFormats["document-relative_json"])
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "/rootrelativeurl/json",
       *  handleAs: "json"
       * });
       *
       */
      "root-relative": function(){
        var dfd = this.async(1000);
        executeTest(dfd, dataFormats["root-relative_json"])
      },

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "//:protocolrelativeurl.com/json",
       *  handleAs: "json"
       * });
       *
       */
      "protocol-relative": function(){
        var dfd = this.async(1000);
        executeTest(dfd, dataFormats["protocol-relative_json"])
      }
    }
  });
