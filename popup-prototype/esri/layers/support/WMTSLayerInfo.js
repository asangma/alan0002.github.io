define([
  "../../core/declare"
], function(
  declare
)  {

  var WMTSLayerInfo = declare(null, {
    declaredClass: "esri.layers.support.WMTSLayerInfo",

    identifier: null,
    tileMatrixSet: null,
    format: null,
    style: null,
    tileInfo: null,
    title: null,
    fullExtent: null,
    initialExtent: null,
    description: null,
    dimension: null,

    constructor: function(params) {
      if (params) {
        this.title = params.title;
        this.tileMatrixSet = params.tileMatrixSet;
        this.format = params.format;
        this.style = params.style;
        this.tileInfo = params.tileInfo;
        this.fullExtent = params.fullExtent;
        this.initialExtent = params.initialExtent;
        this.identifier = params.identifier;
        this.description = params.description;
        this.dimension = params.dimension;
      }
    }
  });

  return WMTSLayerInfo;
});
