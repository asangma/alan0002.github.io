/**
 * Defines and provides information about an existing map service layer.
 * 
 * @module esri/layers/support/LayerMapSource
 * @since 4.0
 * @see module:esri/layers/support/LayerDataSource     
 */
define(
[
  "../../core/declare",
  
  "../../core/lang",
  
  "./LayerSource"
],
function(
  declare,
  esriLang,
  LayerSource
) {

  /**
   * @extends module:esri/layers/support/LayerSource
   * @constructor module:esri/layers/support/LayerMapSource
   * @param {Object} json - Creates a new LayerMapSource object from a JSON object
   *                      in the format of the ArcGIS platform.
   */      
  var LayerMapSource = declare(LayerSource, 
  /** @lends module:esri/layers/support/LayerMapSource.prototype */                               
  {
    declaredClass: "esri.layers.support.LayerMapSource",
      
    /**
    * Used to describe the origin of the LayerSource. For LayerMapSource, this value 
    * is always `mapLayer`.
    * 
    * @type {string}
    */  
    type: "mapLayer",

    toJSON: function() {
      /** @alias module:esri/layers/support/LayerMapSource */    
      var json = {
        type: this.type,
        
        /**
        * The layer id for a sub-layer in the current map service.
        * 
        * @instance
        * 
        * @type {number}
        */
        mapLayerId: this.mapLayerId,
          
        /**
        * When supported, specifies the version in an SDE workspace that the layer will use.
        * 
        * @instance
        * 
        * @type {string}
        */  
        gdbVersion: this.gdbVersion
      };
      return esriLang.fixJson(json);
    }
  });
  
  return LayerMapSource;  
});
