/**
 * Represents the data object for the dynamically generated map. This is generated after the promise returned from 
 * the export operation on {@link module:esri/tasks/Geoprocessor#getResultImage Geoprocessor.getResultImage()}
 * resolves. The MapImage class can also be used to create a geo-referenced image file for use with the MapImageLayer.
 * 
 * @module esri/layers/support/MapImage
 * @since 4.0
 * @see module:esri/tasks/Geoprocessor#getResultImage
 * @todo @see module:esri/layers/ArcGISDynamicLayer#getMapImage
 */
define(
[
  "../../core/JSONSupport",
  
  "../../geometry/Extent"
],
function(
  JSONSupport,
  Extent
) {
   
  /**
  * @extends module:esri/core/Accessor
  * @mixes module:esri/core/JSONSupport
  * @constructor module:esri/layers/support/MapImage
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */       
  var MapImage = JSONSupport.createSubclass(
  /** @lends module:esri/layers/support/MapImage.prototype */    
  {

    declaredClass: "esri.layers.support.MapImage",

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  extent
    //----------------------------------

    /**
    * The extent of the exported map.
    *
    * @name extent
    * @instance
    * 
    * @type {module:esri/geometry/Extent}
    */  
      
    _extentReader: function (value) {
      return Extent.fromJSON(value);
    },

    //----------------------------------
    //  height
    //----------------------------------

    /**
    * The requested image height in pixels.
    *
    * @type {number}
    */
    height: null,

    //----------------------------------
    //  href
    //----------------------------------

    /**
    * URL to the returned image. The image format must be of a type supported by the HTML `<img>` tag.
    * 
    * **Known Values:** gif | jpg | png | bmp
    *
    * @type {number}
    */  
    href: null,

    //----------------------------------
    //  scale
    //----------------------------------

    /**
    * Scale of the requested dynamic map.
    *
    * @type {number}
    */  
    scale: null,

    //----------------------------------
    //  width
    //----------------------------------

    /**
    * The requested image width in pixels.
    *
    * @type {number}
    */  
    width: null,

    // ----------------------------------
    //  visible
    //----------------------------------

    /**
    * Indicates if the requested image is visible in the view.
    *
    * @type {boolean}
    * @default
    */  
    visible: true,

    // ----------------------------------
    //  opacity
    //----------------------------------

    /**
    * The opacity of the image. Value can be any number between `0` and `1` where `0` 
    * is 100% transparent, `0.5` is 50% transparent and `1` is fully opaque.
    *
    * @type {number}
    * @default
    */  
    opacity: 1
	
  });

  return MapImage;
});
