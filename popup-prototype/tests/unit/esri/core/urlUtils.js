define([
    "esri/core/urlUtils",

    "esri/kernel",

    "intern!object",

    "intern/chai!assert"
],
function(
  urlUtils,
  kernel,
  registerSuite,
  assert
) {

  var originalAppUrlScheme;

  registerSuite({

    name: "esri/core/urlUtils",

    beforeEach: function() {
      originalAppUrlScheme = kernel.appUrl.scheme;
    },

    afterEach: function() {
      kernel.appUrl.scheme = originalAppUrlScheme;
    },

    "fixUrl": {

      "add www to ArcGIS.com URLs": function() {
        var httpAgoUrl = "http://arcgis.com";
        var httpsAgoUrl = "https://arcgis.com";
        var protocolessAgoUrl = "//arcgis.com";

        urlUtils.fixUrl(httpAgoUrl, "http://www.arcgis.com");
        urlUtils.fixUrl(httpsAgoUrl, "http://www.arcgis.com");

        kernel.appUrl.scheme = "https";
        urlUtils.fixUrl(protocolessAgoUrl, "https://www.arcgis.com");

        kernel.appUrl.scheme = "http";
        urlUtils.fixUrl(protocolessAgoUrl, "http://www.arcgis.com");
      },

      "relative URLs should not be affected": function() {
        assert.equal(urlUtils.fixUrl("./test.html"), "./test.html");
      }

    },

    "URL normalization": {

      "when app protocol is https": {

        "ensures URL protocol": function() {
          var protocolessUrl = "//someserviceurl",
              httpUrl        = "http://someserviceurl",
              httpsUrl       = "https://someserviceurl";

          kernel.appUrl.scheme = "https";

          assert.equal(urlUtils.normalize(protocolessUrl), httpsUrl);
          assert.equal(urlUtils.normalize(httpUrl), httpUrl);
          assert.equal(urlUtils.normalize(httpsUrl), httpsUrl);
        },

        "ensures https for AGO URLs": function() {
          var agoDomain1 = "http://services.arcgis.com",
              agoDomain2 = "http://server.arcgisonline.com",
              agoDomain3 = "http://services.arcgisonline.com";

          kernel.appUrl.scheme = "https";

          assert.equal(urlUtils.normalize(agoDomain1), "https://services.arcgis.com");
          assert.equal(urlUtils.normalize(agoDomain2), "https://server.arcgisonline.com");
          assert.equal(urlUtils.normalize(agoDomain3), "https://services.arcgisonline.com");
        },

        "ignores protocol for AGO URLs with port": function() {
          var agoDomain1 = "http://services.arcgis.com:8080",
              agoDomain2 = "http://server.arcgisonline.com:8080",
              agoDomain3 = "http://services.arcgisonline.com:8080";

          kernel.appUrl.scheme = "https";

          assert.equal(urlUtils.normalize(agoDomain1), "http://services.arcgis.com:8080");
          assert.equal(urlUtils.normalize(agoDomain2), "http://server.arcgisonline.com:8080");
          assert.equal(urlUtils.normalize(agoDomain3), "http://services.arcgisonline.com:8080");
        }

      },

      "when app protocol is http": {

        "ensures URL protocol": function() {
          var protocolessUrl = "//someserviceurl",
              httpUrl        = "http://someserviceurl",
              httpsUrl       = "https://someserviceurl";

          kernel.appUrl.scheme = "http";

          assert.equal(urlUtils.normalize(protocolessUrl), httpUrl);
          assert.equal(urlUtils.normalize(httpUrl), httpUrl);
          assert.equal(urlUtils.normalize(httpsUrl), httpsUrl);
        },

        "ignores protocol for AGO URLs": function() {
          var agoUrl1 = "http://services.arcgis.com",
              agoUrl2 = "http://server.arcgisonline.com",
              agoUrl3 = "http://services.arcgisonline.com";

          kernel.appUrl.scheme = "http";

          assert.equal(urlUtils.normalize(agoUrl1), "http://services.arcgis.com");
          assert.equal(urlUtils.normalize(agoUrl2), "http://server.arcgisonline.com");
          assert.equal(urlUtils.normalize(agoUrl3), "http://services.arcgisonline.com");
        },

        "ignores protocol for non-AGO URLs": function() {
          var randomUrl = "http://random.domain.com";

          kernel.appUrl.scheme = "http";

          assert.equal(urlUtils.normalize(randomUrl), "http://random.domain.com");
        }
      },

      "when app protocol is file": {

        "ensures URL protocol": function() {
          var protocolessUrl = "//someserviceurl",
              httpUrl        = "http://someserviceurl",
              httpsUrl       = "https://someserviceurl";

          kernel.appUrl.scheme = "file";

          assert.equal(urlUtils.normalize(protocolessUrl), httpsUrl);
          assert.equal(urlUtils.normalize(httpUrl), httpUrl);
          assert.equal(urlUtils.normalize(httpsUrl), httpsUrl);
        }

      }

    }

  });

});
