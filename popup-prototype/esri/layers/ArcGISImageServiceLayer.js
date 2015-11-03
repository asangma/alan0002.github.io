define(
[
  "../core/declare",
  "dojo/_base/lang",
  "../config",
  
  "./DynamicLayer",
  
  "./mixins/ImageServiceLayerMixin"
],
function(
  declare, lang, esriConfig,   
  DynamicLayer,
  ImageServiceLayerMixin
) {

  var ArcGISImageServiceLayer = declare([DynamicLayer, ImageServiceLayerMixin], {
    declaredClass: "esri.layers.ArcGISImageServiceLayer",
    
    constructor: function(url, options) {
      this._initialize(url, options);
      this.useMapImage = (options && options.useMapImage) || false;
    },
    
    /*****************
     * Public Methods
     *****************/

    refresh: function(/*Boolean?*/ _noCacheOverride) {
      if (_noCacheOverride) {
        this.inherited(arguments);
      }
      else {
        var dc = this.disableClientCaching;
        this.disableClientCaching = true;
        this.inherited(arguments);
        this.disableClientCaching = dc;
      }
    },
    
    exportMapImage: function(/*esri.layers.ImageServiceParameters?*/ params, /*Function?*/ callback) {
      // TODO
      // esriConfig.map has been removed. Fix code below.
      var m = esriConfig.defaults.map,
          p = lang.mixin({ size:m.width + "," + m.height }, this._params, params ? params.toJSON() : {}, { f:"json" });
      delete p._ts;
      
      // TODO 4.0
      return null; //this._exportMapImage(this._url.path + "/exportImage", p, callback);
    }
  });

  
  
  return ArcGISImageServiceLayer;  
});
