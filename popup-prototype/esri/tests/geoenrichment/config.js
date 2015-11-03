require(["esri/config", "esri/widgets/geoenrichment/config", "esri/IdentityManager"], function(config, geoenrichemntConfig, IdentityManager) {
    if (window.geServer) {
        geoenrichemntConfig.server = geServer;
        config.request.corsEnabledServers.push(geServer);
    }
    config.request.proxyUrl = "/proxy";
    IdentityManager.setProtocolErrorHandler(function(obj) {
        return true;
    });

});
