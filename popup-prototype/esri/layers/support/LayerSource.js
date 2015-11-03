/**
 * Used to denote classes that may be used as a layer's source.
 * 
 * @module esri/layers/support/LayerSource
 * @since 4.0
 * @see module:esri/layers/support/LayerMapSource
 * @see module:esri/layers/support/LayerDataSource     
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang"
],
function(declare, lang) {

  /**
   * @constructor module:esri/layers/support/LayerSource
   * @param {Object} json - Creates a new LayerSource object from a JSON object
   *                      in the format of the ArcGIS platform.
   */
  var LayerSource = declare(null, 
  /** @lends module:esri/layers/support/LayerSource.prototype */                          
  {
    declaredClass: "esri.layers.support.LayerSource",
      
    /**
    * Used to describe the origin of the LayerSource.
    * 
    * @type {string}
    */            
    type: null,
	
    constructor: function(json) {
      if (json) {
        lang.mixin(this, json);
      }             
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
    }
  });
  
  return LayerSource;  
});
