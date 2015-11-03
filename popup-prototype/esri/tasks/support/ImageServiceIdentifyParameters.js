/**
 * Input parameters for {@link module:esri/tasks/ImageServiceIdentifyTask}.
 *
 * @module esri/tasks/support/ImageServiceIdentifyParameters
 * @since 4.0
 * @see module:esri/tasks/ImageServiceIdentifyTask
 * @see module:esri/tasks/support/ImageServiceIdentifyResult
 */
define(
[
  "../../core/declare",

  "../../core/Accessor",
  "../../core/lang",

  "../../geometry/support/jsonUtils"
],
function(
  declare, Accessor, esriLang,
  jsonUtils
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/ImageServiceIdentifyParameters
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var parameters = declare(Accessor,
  /** @lends module:esri/tasks/support/ImageServiceIdentifyParameters.prototype */
  {

    declaredClass: "esri.tasks.ImageServiceIdentifyParameters",
          
    /**
    * Input geometry that defines the location to be identified. 
    * The location can be a point or a polygon.
    * 
    * @type {module:esri/geometry/Point | module:esri/geometry/Polygon}
    */
    geometry: null,

    /**
    * Specifies the mosaic rules defining the image sorting order. 
    * When a mosaic rule is not specified, `center` is used.
    * 
    * @type {module:esri/layers/support/MosaicRule}
    */  
    mosaicRule: null,
      
    /**
    * The pixel or RGB color value representing no information. It can be 
    * defined as a number `noData = 0` representing a pixel value or as a 
    * string `noData = "58,128,187"` representing an RGB color value. 
    * 
    * @type {string | number}
    */ 
    noData: null,

    /**
    * Specifies the rendering rule for how the requested image should be rendered.
    * 
    * @type {module:esri/layers/support/RasterFunction}
    */
    renderingRule: null,

    /**
    * The pixel level being identified (or the resolution being looked at) on the x-axis. 
    * If not specified, it will default to the base resolution of the dataset.
    * 
    * @type {number}
    */ 
    pixelSizeX: null,

    /**
    * The pixel level being identified (or the resolution being looked at) on the y-axis. 
    * If not specified, it will default to the base resolution of the dataset.
    * 
    * @type {number}
    */  
    pixelSizeY: null,

    /**
    * Specifies the pixel level being identified on the x and y axis. Defaults 
    * to the base resolution of the dataset when not specified.
    * 
    * @type {module:esri/symbols/Symbol}
    */  
    pixelSize: null,
      
    /**
    * When `true`, each feature in the catalog items includes the geometry. 
    * Set to `false` to not display the features on the map.
    * 
    * @type {boolean}
    * @default false
    */   
    returnGeometry: false,

    /**
    * If `true`, returns both geometry and attributes of the catalog items. 
    * Set to `false` when catalog items are not needed to significantly
    * improve identify operation's performance.
    * 
    * @type {boolean}
    * @default
    */  
    returnCatalogItems: true,

    /**
    * Specifies a time extent.
    * 
    * @type {module:esri/TimeExtent}
    * @ignore
    */  
    timeExtent:null,

    toJson: function(normalized) {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON(normalized);
    },

    toJSON: function(normalized) {
      var g = normalized && normalized["geometry"] || this.geometry,         
          json = { geometry:g, returnGeometry:this.returnGeometry, returnCatalogItems:this.returnCatalogItems,
                   mosaicRule: this.mosaicRule ? JSON.stringify(this.mosaicRule.toJSON()) : null,
                   renderingRule: this.renderingRule ? JSON.stringify(this.renderingRule.toJSON()) : null
                 };          
      
      if (g) {
        json.geometryType = jsonUtils.getJsonType(g);
      }    
      
      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJSON().join(",") : null;
      
      if (esriLang.isDefined(this.pixelSizeX) && esriLang.isDefined(this.pixelSizeY)){
          json.pixelSize = JSON.stringify({x: parseFloat(this.pixelSizeX), y: parseFloat(this.pixelSizeY)});
      } else if (this.pixelSize)
      {
          json.pixelSize = this.pixelSize ? JSON.stringify(this.pixelSize.toJSON()) : null;
      }
      
      return json;
    }

  });

  return parameters;
});
