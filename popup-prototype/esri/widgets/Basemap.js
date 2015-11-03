define(
[
  "../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",

  "dojo/has", 

  "../kernel", // sets esri.widgets._arcgisUrl
  "../request",
  "./BasemapLayer"
], function(
  declare, array, lang, 
  has, 
  esriKernel, esriRequest, BasemapLayer
) {
  var BM = declare(null, {
    declaredClass: "esri.widgets.Basemap",

    id: null,
    title: "",
    thumbnailUrl: null,

    layers: null,
    itemId: null,
    
    basemapGallery: null,

    constructor: function (params, basemapGallery) {
      params = params || {};

      if (!params.layers && !params.itemId) {
        console.error("esri.widgets.Basemap: unable to find the 'layers' property in parameters");
      }

      this.id = params.id;
      this.itemId = params.itemId;
      this.layers = params.layers; // array of esri.widgets.BasemapLayer
      this.title = params.title || "";
      this.thumbnailUrl = params.thumbnailUrl;
      this.basemapGallery = basemapGallery;
    },

    getLayers: function (arcgisUrl) {
      /* usage
       var returnValue = basemap.getLayers();
       if (dojo.isArray(returnValue)) {
         alert("Basemap has "+returnValue.length+" layers.");
       } else if (returnValue instanceof dojo.Deferred) {
         returnValue.addCallback(function(layers) {
           alert("Basemap has "+layers.length+" layers.");
         });
       }
      */

      if (this.layers) {

        // one of the user supplied basemaps or one the user requested before
        return this.layers;

      } else if (this.itemId) {

        // get web map config
        var url = (arcgisUrl || esriKernel.dijit._arcgisUrl) + "/content/items/" + this.itemId + "/data";
        var params = {};
        params.f = "json";
        var request = esriRequest({
          url: url,
          content: params,
          callbackParamName: "callback",
          error: lang.hitch(this, function(response, args) {
            var msg = "esri.widgets.Basemap: could not access basemap item.";
            if (this.basemapGallery) {
              this.basemapGallery.emitError(msg);
            } else {
              console.error(msg);
            }
          })
        });

        request.then(lang.hitch(this, function (response, args) {

          if (response.baseMap) {
            
            this.layers = [];
            array.forEach(response.baseMap.baseMapLayers, function (baseMapLayer) {
              this.layers.push(new BasemapLayer(baseMapLayer));
            }, this);
    
            return this.layers;
          
          } else {
          
            var msg = "esri.widgets.Basemap: could not access basemap item.";
            if (this.basemapGallery) {
              this.basemapGallery.emitError(msg);
            } else {
              console.error(msg);
            }
            return [];
          
          }
        }));

        return request;
      }
    }
  });

  

  return BM;
});
