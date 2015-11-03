/**
 * Image layer result from Geoprocessing task.
 * 
 * @module esri/tasks/support/GPResultImageLayer
 * @noconstructor
 * @since 4.0
 */
define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/io-query",

  "../../layers/ArcGISDynamicLayer"
],
function(
  declare, lang, ioq, ArcGISDynamicLayer
) {

  /**
   * @mixes module:esri/layers/ArcGISDynamicLayer
   * @constructor module:esri/tasks/support/GPResultImageLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */    
  var ResultLayer = declare(ArcGISDynamicLayer, 
  /** @lends module:esri/tasks/support/GPResultImageLayer.prototype */                          
  {

    declaredClass: "esri.tasks._GPResultImageLayer",

    constructor: function() {
      this.getImageUrl = lang.hitch(this, this.getImageUrl);
    },

    // overridden methods
    getImageUrl: function(extent, width, height, callback) {
      var path = this.parsedUrl.path + "?",
          _p = this._params,
          sr = extent.spatialReference.wkid;

      callback(path + ioq.objectToQuery(lang.mixin(_p,
        {
          f: "image",
          bbox: JSON.stringify(extent.toJSON()),
          bboxSR: sr,
          imageSR: sr,
          size: width + "," + height
        }
      )));
    }

  });

  return ResultLayer;
});
