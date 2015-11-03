/**
 * An {@link module:esri/layers/ArcGISTiledLayer ArcGISTiledLayer} has a number of LODs (Levels of Detail). 
 * Each LOD corresponds to a map at a given scale or resolution. LOD has no constructor.
 * 
 * @module esri/layers/support/LOD
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/ArcGISElevationLayer
 * @see module:esri/layers/ArcGISTiledLayer
 */
define(
[
  "../../core/lang",
  
  "../../core/JSONSupport"
],
function(
  esriLang,
  JSONSupport
) {

  /**
  * @extends module:esri/core/Accessor
  * @mixes module:esri/core/JSONSupport
  * @constructor module:esri/layers/support/LOD
  */
  var LOD = JSONSupport.createSubclass(
  /** @lends module:esri/layers/support/LOD.prototype */                  
  {
    declaredClass: "esri.layers.support.LOD",
      
   /**
    * ID for each level. The top most level is `0`.
    * 
    * @type {number}
    */
    level: null,
      
    /**
    * String to be used when constructing a URL to access a tile from this LOD. If `levelValue` is not defined, 
    * level will be used for the tile access URL. This property is useful when an LOD object represents a 
    * WMTS TileMatrix with non-numeric matrix identifiers.
    * 
    * @type {string}
    */
    levelValue: null,  
      
    /**
    * Resolution in map units of each pixel in a tile for each level.
    * 
    * @type {number}
    */
    resolution: null,  
      
    /**
    * Scale for each level.
    * 
    * @type {number}
    */
    scale: null,  
    
    clone: function() {
      return new LOD({
        level: this.level,
        levelValue: this.levelValue,
        resolution: this.resolution,
        scale: this.scale
      });
    },
    
    toJSON: function() {
      return esriLang.fixJson({
        level:      this.level,
        levelValue: this.levelValue,
        resolution: this.resolution,
        scale:      this.scale
      });
    }
  });
  
  return LOD;  
});
