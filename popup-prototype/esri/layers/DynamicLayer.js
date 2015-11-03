/**
 * The base class for {@link module:esri/layers/ArcGISDynamicLayer ArcGISDynamicLayer}. 
 * To create a dynamic layer, use the constructor for
 * {@link module:esri/layers/ArcGISDynamicLayer ArcGISDynamicLayer}.
 *
 * @module esri/layers/DynamicLayer
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/ArcGISDynamicLayer
 */
define(
[  
  "./Layer"
],
function(  
  Layer
) {
  /**
   * @extends module:esri/layers/Layer
   * @constructor module:esri/layers/DynamicLayer
   */
  var DynamicLayer = Layer.createSubclass( 
  /** @lends module:esri/layers/DynamicLayer.prototype */
  {
    
    declaredClass: "esri.layers.mixins.DynamicLayer",

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  viewModulePaths
    //----------------------------------

    /**
    * Path to the 2D or 3D layer view.
    * 
    * @property {string} 2d - Path to the 2D DynamicLayerView
    * @property {string} 3d - Path to the 3D DynamicLayerView
    * 
    * @type {Object}
    * @private
    */
    viewModulePaths: {
      "2d": "../views/2d/layers/DynamicLayerView2D",
      "3d": "../views/3d/layers/DynamicLayerView3D"
    },
      
    /**
    * The URL of the REST endpoint of the layer. The URL may either point to a
    * resource on ArcGIS for Server, Portal for ArcGIS, or ArcGIS Online.
    * 
    * @name url
    * @instance
    * @type {string}
    * @example
    * //Layer from Map Service on ArcGIS Server
    * layer.url = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer";
    */


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * Method to call when extending DynamicLayer. For more details, see 
     * [Creating custom layer types](https://developers.arcgis.com/javascript/jshelp/inside_custom_layers.html).
     * 
     * @param {module:esri/geometry/Extent} extent - The current extent of the map.
     * @param {number} width - The current width of the map in pixels.
     * @param {number} height - The current height of the map in pixels.
     * @param {function} callback - The function to call when the method has completed.
     *                            
     * @return {string} Returns the image URL.                            
     */
    getImageUrl: function(options, callback) {
      // This method must be implemented by sub-classes
      // Implementors must invoke "callback" function with the image url.

      // This method will be called by layer views
    }

  });
  
  return DynamicLayer;  
});
