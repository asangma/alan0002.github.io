/**
 * Tiled layers are composed of images (e.g. such as satellite imagery), that are 
 * broken up into square "tiles" and displayed in columns and rows to give the
 * layer the appearance that it is one continuous image. These layers have several levels
 * of detail (LOD) that permit users to zoom in to any region of the map and load
 * additional tiles that depict features in higher resolution at larger map scales. 
 * 
 * There are several types of tiled layers including {@link module:esri/layers/ArcGISTiledLayer}, {@link module:esri/layers/WebTiledLayer}, {@link module:esri/layers/ArcGISElevationLayer}, and {@link module:esri/layers/OpenStreetMapLayer}. 
 * 
 * This is the base class for all tiled layers. To create a 
 * tiled layer, create an instance of one of the subclasses of TiledLayer listed above.
 * 
 *
 * @module esri/layers/TiledLayer
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/ArcGISTiledLayer
 * @see module:esri/layers/WebTiledLayer
 * @see module:esri/layers/ArcGISElevationLayer
 * @see module:esri/layers/OpenStreetMapLayer
 */
define(
[
  "../core/declare",

  "./Layer"
],
function(
  declare,
  Layer
) {
  /**
   * @extends module:esri/layers/Layer
   * @constructor module:esri/layers/TiledLayer
   */
  var TiledLayer = declare(Layer, 
  /** @lends module:esri/layers/TiledLayer.prototype */                           
  {

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
    * @property {string} 2d - Path to the 2D TiledLayerView
    * @property {string} 3d - Path to the 3D TiledLayerView
    * 
    * @type {Object}
    * @private
    */
    viewModulePaths: {
      "2d": "../views/2d/layers/TiledLayerView2D",
      "3d": "../views/3d/layers/TiledLayerView3D"
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * Method to implement when extending TiledMapServiceLayer. For more details, see 
     * [Creating custom layer types](https://developers.arcgis.com/javascript/jshelp/inside_custom_layers.html).
     * 
     * @param {number} level - The requested tile's level.
     * @param {number} row - The requested tile's row.
     * @param {number} col - The requested tile's column.
     *                     
     * @return {string} Returns the tile URL.                     
     */
    getTileUrl: function(level, row, col) {
      // This method must be implemented by sub-classes
    }

  });
  
  return TiledLayer;
});
