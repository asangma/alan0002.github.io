/**
 * Contains information about each layer in a map service.
 * 
 * @module esri/layers/support/LayerInfo
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/support/DynamicLayerInfo
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../core/lang"
],
function(declare, lang, esriLang) {

  /**
  * @constructor module:esri/layers/support/LayerInfo
  */     
  var LayerInfo = declare(null, 
  /** @lends module:esri/layers/support/LayerInfo.prototype */                        
  {
    declaredClass: "esri.layers.support.LayerInfo",
    
    constructor: function(/*Object*/ json) {
      lang.mixin(this, json);
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
      /** @alias module:esri/layers/support/LayerInfo */
      var json = {
        /**
        * Default visibility of the layers in the map service.
        *
        * @type {boolean}
        * @instance
        */
        defaultVisibility: this.defaultVisibility,
        
        /**
        * Layer ID assigned by ArcGIS Server for a layer. The topmost layer 
        * is `0`, and each layer follows sequentially. If a layer is added or 
        * removed from the source map document, the ID values will shift accordingly.
        *
        * @type {number}
        * @instance
        */  
        id: this.id,
          
        /**
        * The maximum visible scale for each layer in the map service. If the map is zoomed in beyond 
        * this scale the layer will not be visible. A value of `0` means that the layer does not have a 
        * maximum scale.
        *
        * @type {number}
        * @instance
        */  
        maxScale: this.maxScale,
          
        /**
        * The minimum visible scale for each layer in the map service. If the map is zoomed out beyond 
        * this scale the layer will not be visible. A value of `0` means that the layer does not have a 
        * minimum scale.
        *
        * @type {number}
        * @instance
        */  
        minScale: this.minScale,
          
        /**
        * Layer name as defined in the map service.
        *
        * @type {string}
        * @instance
        */  
        name: this.name,
          
        /**
        * If the layer is part of a group layer it will include the parent ID of the group layer. 
        * Otherwise, the value is `-1`. If a layer is added or removed from the source map document, 
        * the ID values will shift accordingly.
        *
        * @type {number}
        * @instance
        */  
        parentLayerId: this.parentLayerId,
          
        /**
        * If the layer is a parent layer, it will have one or more sub layers included in an array.
        * Otherwise, the value is `null`. If a layer is added or removed from the source map
        * document, the ID values will shift accordingly.
        *
        * @type {number[]}
        * @instance
        */  
        subLayerIds: this.subLayerIds
      };
      return esriLang.fixJson(json);
    }
  });
  
  return LayerInfo;  
});
