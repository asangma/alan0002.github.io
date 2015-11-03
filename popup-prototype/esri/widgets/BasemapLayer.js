define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/has", 
  "../kernel"
], function(
  declare, lang, has, esriKernel
) {
  var BML = declare(null, {
    declaredClass: "esri.widgets.BasemapLayer",
      constructor: function (params) {
      params = params || {};

      if (!params.url && !params.type) {
        console.error("esri.widgets.BasemapLayer: unable to find the 'url' or 'type' property in parameters");
      }
      
      this.url = params.url; // used for ArcGIS services
      this.type = params.type; // ["BingMapsAerial"|"BingMapsHybrid"|"BingMapsRoad"|"OpenStreetMap"|"WebTiledLayer"]
      this.isReference = (params.isReference === true) ? true : false;
      this.opacity = params.opacity; 

      // only for dynamic map services
      this.visibleLayers = params.visibleLayers; // e.g. [2,6,8] 

      // only for cached map services
      this.displayLevels = params.displayLevels; // e.g. [1,2,3,4,5,6,7,8,9] 
      this.exclusionAreas = params.exclusionAreas;

      // only for image services
      this.bandIds = params.bandIds; // e.g. [0,1,2] 

      // only for "WebTiledLayer"
      this.templateUrl = params.templateUrl;
      this.copyright = params.copyright;
      this.subDomains = params.subDomains; 
      this.fullExtent = params.fullExtent; 
      this.initialExtent = params.initialExtent; 
      this.tileInfo = params.tileInfo; 
      this.tileServers = params.tileServers; 
    }
  });

  

  return BML;
});
