/**
 * Represents an image service resource as a layer.
 * 
 * @module esri/layers/ArcGISImageLayer
 * @since 4.0
 * @see [Sample - Add ArcGISImageLayer to your Map](../sample-code/2d/image-layer/)
 * @see {@link module:esri/Map#layers Map.layers}
 */
define(
[
  "esri/core/declare",
  "dojo/_base/lang",

  "./Layer",

  "./mixins/ArcGISImageService"
],
function(
  declare, lang,
  Layer,
  ArcGISImageService
) {

  /**
  * @extends module:esri/layers/Layer
  * @mixes module:esri/layers/mixins/ArcGISImageService
  * @constructor module:esri/layers/ArcGISImageLayer
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */
  var ArcGISImageLayer = declare([Layer, ArcGISImageService],
  /** @lends module:esri/layers/ArcGISImageLayer.prototype */
  {
    declaredClass: "esri.layers.ArcGISImageLayer",

    //----------------------------------
    //  viewModulePaths
    //----------------------------------

    /**
    * Path to the 2D or 3D layer view.
    * 
    * @property {string} 2d - Path to the 2D ImageLayerView
    * 
    * @type {Object}
    * @private
    */
    viewModulePaths: {
      "2d": "../views/2d/layers/ImageLayerView2D"
    },

    // NIK: Should this be here?
    _DRAW_TYPE: {
      canvas2D: "2d",
      webGL: "webgl",
      expWebGL: "experimental-webgl",
      webGL2: "webgl2",
      expWebGL2: "experimental-webgl2"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(url, options) {
      if (typeof url === "string") {
        return lang.mixin({}, {
          url: url
        }, options);
      }
      return url;
    },

    getDefaults: function(properties) {
      var defaults = this.inherited(arguments);

      return lang.mixin(defaults, {
        drawType: this._DRAW_TYPE.canvas2D,
        drawMode: true
      });
    },

    load: function() {
      this.addResolvingPromise(this._fetchService());
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  drawType
    //----------------------------------

    /**
     * Enum defining the drawing context associated with the canvas.
     * 
     * @type {enum}
     * @default
     * @ignore
     */
    drawType: null,
      
    /**
     * The URL of the REST endpoint of the layer. The URL may either point 
     * to a resource on ArcGIS for Server, Portal for ArcGIS, or ArcGIS Online.
     * 
     * @name url
     * @instance
     * @type {string}
     *             
     * @example
     * //This url must point to an Image Service
     * var layer = new ArcGISImageLayer({
     *   url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer"
     * });
     */  

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    fetchImage: function(options) {
      return this._fetchImage(options);
    }

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------


  });

  return ArcGISImageLayer;
});
