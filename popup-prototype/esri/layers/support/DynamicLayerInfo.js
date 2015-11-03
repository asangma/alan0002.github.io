/**
 * Information about each layer in a map service. This class extends the 
 * {@link module:esri/layers/supportLayerInfo} class with a new property 
 * source which can be either a {@link module:esri/layers/support/LayerMapSource}
 * or a {@link module:esri/layers/support/LayerDataSource}. 
 * 
 * @module esri/layers/support/DynamicLayerInfo
 * @since 4.0
 * @see module:esri/layers/support/LayerMapSource
 * @see module:esri/layers/support/LayerDataSource
 */
define(
[
  "../../core/declare",

  "../../core/lang",
  
  "./LayerInfo",
  "./LayerMapSource",
  "./LayerDataSource"
],
function(
  declare,
  esriLang, 
  LayerInfo, LayerMapSource, LayerDataSource
) {

  /**
  * @extends module:esri/layers/support/LayerInfo
  * @constructor module:esri/layers/support/DynamicLayerInfo
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */      
  var DynamicLayerInfo = declare(LayerInfo, 
  /** @lends module:esri/layers/support/DynamicLayerInfo.prototype */                               
  {
    declaredClass: "esri.layers.support.DynamicLayerInfo",
    
    /**
    * Default visibility of the layers in the map service.
    *
    * @type {boolean}
    * @default
    */
    defaultVisibility: true,
      
    /**
    * If the layer is part of a group layer it will include the parent ID of the group layer. 
    * Otherwise, the value is `-1`. If a layer is added or removed from the source map document, 
    * the ID values will shift accordingly.
    *
    * @type {number}
    * @default
    */  
    parentLayerId: -1,
      
    /**
    * The maximum visible scale for each layer in the map service. If the map is zoomed in beyond 
    * this scale the layer will not be visible. A value of `0` means that the layer does not have a 
    * maximum scale.
    *
    * @type {number}
    * @default 0
    * 
    * @example 
    * //Sets the maximum visible scale to 1:1,000
    * dynamicLayerInfo.minScale = 1000;
    * 
    * @example 
    * //Removes any visibility constraints on maximum visible scale
    * dynamicLayerInfo.minScale = 0;
    */  
    maxScale: 0,
      
    /**
    * The minimum visible scale for each layer in the map service. If the map is zoomed out beyond 
    * this scale the layer will not be visible. A value of `0` means that the layer does not have a 
    * minimum scale.
    *
    * @type {number}
    * @default 0
    * 
    * @example 
    * //Sets the minimum visible scale to 1:1,000,000
    * dynamicLayerInfo.minScale = 1000000;
    * 
    * @example 
    * //Removes any visibility constraints on minimum visible scale
    * dynamicLayerInfo.minScale = 0;
    */  
    minScale: 0,
    
    constructor: function(/*Object*/ json) {
      if (json) {
        var source;
        if (!json.source) {
          source = new LayerMapSource();
          source.mapLayerId = this.id;        
        }
        else {
          if (json.source.type === "mapLayer") {
            source = new LayerMapSource(json.source);
          }
          else {
            source = new LayerDataSource(json.source);
          }        
        }
        this.source = source;
      }
    },

    toJSON: function() {
      var json = this.inherited(arguments);
      json.source = this.source && this.source.toJSON();
      return esriLang.fixJson(json);
    }
  });
  
  return DynamicLayerInfo;  
});
