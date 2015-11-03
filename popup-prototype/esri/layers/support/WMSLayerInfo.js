define([
  "../../core/declare",
  "dojo/_base/array"
], function(
  declare, array
) {

  var WMSLayerInfo = declare(null, {
    declaredClass: "esri.layers.support.WMSLayerInfo",

    // name of the layer. Used to set layer visibilities.
    name: null,
    // title of the layer.
    title: null,
    // Gets the abstract of the layer.
    description: null,
    // extent of the layer.
    extent: null,
    // url to legend image
    legendURL: null,
    // sub layers. These are also instances of WMSLayerInfo.
    subLayers: [],
    // all bounding boxes defined for this layer
    allExtents: [],
    // all spatial references defined for this layer
    spatialReferences: [],

    constructor: function(params) {
      if (params) {
        this.name = params.name;
        this.title = params.title;
        this.description = params.description;
        this.extent = params.extent;
        this.legendURL = params.legendURL;
        this.subLayers = params.subLayers ? params.subLayers : [];
        this.allExtents = params.allExtents ? params.allExtents : [];
        this.spatialReferences = params.spatialReferences ? params.spatialReferences : [];
      }
    },

    clone: function() {
      var info = {
        name: this.name,
        title: this.title,
        description: this.description,
        legendURL: this.legendURL
      }, wkid;

      if (this.extent) {
        info.extent = this.extent.getExtent();
      }
      info.subLayers = [];
      array.forEach(this.subLayers, function(layer) {
        info.subLayers.push(layer.clone());
      });
      info.allExtents = [];

      for (wkid in this.allExtents) {
        wkid = parseInt(wkid, 10);
        if (!isNaN(wkid)) {
          info.allExtents[wkid] = this.allExtents[wkid].getExtent();
        }
      }
      info.spatialReferences = [];
      array.forEach(this.spatialReferences, function(wkid) {
        info.spatialReferences.push(wkid);
      });
      return info;
    }
  });

  return WMSLayerInfo;
});
