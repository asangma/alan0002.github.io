/**
 * Represents an image map service resource as a layer.
 * 
 * @module esri/layers/support/ImageServiceParameters
 * @since 4.0
 * @see [Sample - Add ArcGISImageLayer to your Map](../sample-code/2d/image-layer/)
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/lang"
],
function(declare, lang, esriLang) {

  var ImageServiceParameters = declare(null, {
    declaredClass: "esri.layers.support.ImageServiceParameters",
    
    extent: null,
    width: null,
    height: null,
    imageSpatialReference: null,
    format: null,
    interpolation: null,
    compressionQuality: null,
    bandIds: null,
    timeExtent: null,
    mosaicRule:null,
    renderingRule:null,
    noData: null,
    compressionTolerance: null,
    adjustAspectRatio: null,

    toJson: function(doNormalize) {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON(doNormalize);
    },

    toJSON: function(doNormalize) {
      var ext = this.bbox || this.extent;
      ext = ext && doNormalize && ext._normalize(true);

      var wkid = ext ? (ext.spatialReference.wkid || JSON.stringify(ext.spatialReference.toJSON())) : null,
          imageSR = this.imageSpatialReference,
          jsonObj = {
                   bbox: ext ? (ext.xmin + "," + ext.ymin + "," + ext.xmax + "," + ext.ymax) : null,
                   bboxSR: wkid,
                   size: (this.width !== null && this.height !== null ? this.width + "," + this.height : null),
                   imageSR: (imageSR ? (imageSR.wkid || JSON.stringify(imageSR.toJSON())) : wkid),
                   format: this.format,
                   interpolation: this.interpolation,
                   compressionQuality: this.compressionQuality,
                   bandIds: this.bandIds ? this.bandIds.join(",") : null,                 
                   mosaicRule: this.mosaicRule ? JSON.stringify(this.mosaicRule.toJSON()) : null,
                   renderingRule: this.renderingRule ? JSON.stringify(this.renderingRule.toJSON()) : null,
                   noData: this.noData,
                   noDataInterpretation: this.noDataInterpretation,
                   compressionTolerance: this.compressionTolerance,
                   adjustAspectRatio: this.adjustAspectRatio
                 };

      var timeExtent = this.timeExtent;
      jsonObj.time = timeExtent ? timeExtent.toJSON().join(",") : null;

      return esriLang.filter(jsonObj, function(value) {
        if (value !== null && value !== undefined) {
          return true;
        }
      });
    }
  });
  
  lang.mixin(ImageServiceParameters, {
    INTERPOLATION_BILINEAR: "RSP_BilinearInterpolation", INTERPOLATION_CUBICCONVOLUTION: "RSP_CubicConvolution",
    INTERPOLATION_MAJORITY: "RSP_Majority", INTERPOLATION_NEARESTNEIGHBOR: "RSP_NearestNeighbor",
    NODATA_MATCH_ALL: "esriNoDataMatchAll", NODATA_MATCH_ANY: "esriNoDataMatchAny"
  });
  
  return ImageServiceParameters;  
});
