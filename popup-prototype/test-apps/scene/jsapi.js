window.dojoConfig = {
  async: true,
  isDebug: true,
  packages: [{
    name: "debugUtils",
    location: "../../js-prototype-apps/utils"
  }, {
    name: "test-apps",
    location: "../test-apps/scene"
  }],
  paths: {
    esri: "../esri"
  },
  aliases: [
    [/^webgl-engine/, function() { return "esri/views/3d/webgl-engine"; } ],
    [/^engine/, function() { return "esri/views/3d/webgl-engine"; } ]
  ]
};

window.jsAPI = {
  setup: function(dependencies, cb) {
    if (cb === undefined) {
      cb = dependencies;
      dependencies = [];
    }

    require(["dojo/_base/lang", "esri/kernel", "esri/config", "dojo/domReady!"],
            function(lang, esriNS, esriConfig) {
      if (lang.isFunction(esriNS._css)) {
        esriNS._css = esriNS._css();
      }

      var corsEnabledServers = esriConfig.request.corsEnabledServers;
      corsEnabledServers.push("elevation3d.arcgis.com",
                              "elevation3ddev.arcgis.com",
                              "server.arcgisonline.com",
                              "services.arcgisonline.com",
                              "s3-eu-west-1.amazonaws.com",
                              "web3d.esri.com",
                              "web3d.esri.com:5080",
                              "zrh-arcgis-server-1:5080",
                              "54.229.240.181:5080",
                              "54.229.240.181",
                              "ec2-54-229-240-181.eu-west-1.compute.amazonaws.com:5080",
                              "ec2-54-229-240-181.eu-west-1.compute.amazonaws.com");

      esriConfig.request.proxyUrl = "/proxy.php";
      require(dependencies, cb);
    });
  }
};
