define([
    "intern!object",

    "esri/config",

    "./basic",
    "./cross-origin",
    "./upload",
    "./workers",
    "./identity",
    "./urls"
  ],
  function(
    registerSuite,
    esriConfig,
    basic, crossOrigin, upload, workers, identity, urls
  ) {

    var proxyUrl, nodeUrl,
      corsEnabledServers, configUseWorkers,
      beforeCORScount, afterCORScount;

    registerSuite({
      name: "esri/request",

      setup: function(){

        // Get urls from grunt-config.json
        var xmlhttp = new XMLHttpRequest();
        var url = "../../grunt-config.json";
        xmlhttp.open("GET", url, false); //Synchronous request
        xmlhttp.send();

        if (xmlhttp.status === 200) {
          var response = JSON.parse(xmlhttp.responseText);
          proxyUrl = response.proxy;
          nodeUrl = response.nodeServer;
        }

        // Store esriConfig data to reset them before every test
        corsEnabledServers = esriConfig.request.corsEnabledServers;
        configUseWorkers = esriConfig.request.useWorkers;
      },

      teardown: function(){

        // Stop the node server once these tests are executed
        var xmlhttp = new XMLHttpRequest();
        var url = nodeUrl + '/v1/api/stopServer';

        xmlhttp.onreadystatechange = function() {
          if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            console.log("Closing Node server............");
          }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
      },

      beforeEach: function(){
        // Reset esriConfig data before each test
        esriConfig.request.useWorkers = configUseWorkers;
        esriConfig.request.proxyUrl = proxyUrl;
        esriConfig.request.forceProxy = false;
        esriConfig.request.corsEnabledServers = corsEnabledServers;
        esriConfig.request.corsStatus = {};
        beforeCORScount = corsEnabledServers.length;

      },

      afterEach: function(){
        afterCORScount = corsEnabledServers.length;

        if(afterCORScount > beforeCORScount){
          for(var name in esriConfig.request.corsStatus){
            var index = corsEnabledServers.indexOf(name);
            if(index > -1){
              corsEnabledServers.splice(corsEnabledServers.indexOf(name), 1);
            }
          }
        }
      },

      //test suites
      "Basic": basic,
      "Cross Origin": crossOrigin,
      "Upload": upload,
      "Identity": identity,
      "Workers": workers,
      "Urls": urls
    });
  });
