define(
[
  "../core/declare",

  "../config",
  "../request",
  
  "./mixins/FeatureCollectionLayer"
],
function(
  declare, esriConfig, esriRequest, FeatureCollectionLayer
) {

var GeoRSSLayer = declare([FeatureCollectionLayer], {
  declaredClass: "esri.layers.GeoRSSLayer",
  
  serviceUrl: location.protocol + "//utility.arcgis.com/sharing/rss",
  constructor: function (url, options) {
    if (esriConfig.geoRSSServiceUrl) {
      this.serviceUrl = esriConfig.geoRSSServiceUrl;
    }

    this._createLayer();
  },

  /*******************
   * Public Methods
   *******************/
  parse: function(){
    this._io = esriRequest({
      url: this.serviceUrl,
      content: {
        url: this.url,
        refresh: this.loaded ? true : undefined, // prompt the servlet to ignore its internal cache and fetch the file from its source
        outSR: this._outSR ? JSON.stringify(this._outSR.toJSON()) : undefined
      },
      callbackParamName: "callback"
    });
    
    return this._io;
  },

  /*******************
   * Internal Methods
   *******************/
  
  _initLayer: function (json) {
    this.inherited(arguments);

    if (!this.loaded) {
      this.loaded = true;
      this.onLoad(this);
    }
  }
});



return GeoRSSLayer;  
});
