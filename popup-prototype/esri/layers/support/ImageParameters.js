/**
 * Represents the image parameter options used when calling 
 * {@link module:esri/tasks/Geoprocessor#getResultImage Geoprocessor.getResultImage()} 
 * and {@link module:esri/tasks/Geoprocessor#getResultImageLayer Geoprocessor.getResultImageLayer()}.
 * 
 * @module esri/layers/support/ImageParameters
 * @since 4.0
 * @todo @see {@link module:esri/layers/ArcGISDynamicLayer#exportMapImage ArcGISDynamicLayer.exportMapImage()}
 * @see {@link module:esri/tasks/Geoprocessor#getResultImage Geoprocessor.getResultImage()}
 * @see {@link module:esri/tasks/Geoprocessor#getResultImageLayer Geoprocessor.getResultImageLayer()}
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/lang",
  "./layerUtils"
],
function(
  declare, lang, esriLang, layerUtils
) {

  /**
  * @constructor module:esri/layers/support/ImageParameters
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */      
  var ImageParameters = declare(null, 
  /** @lends module:esri/layers/support/ImageParameters.prototype */                              
  {
    declaredClass: "esri.layers.support.ImageParameters",
    
    constructor: function() {
      this.layerDefinitions = [];
      //this._bundle = dojo.i18n.getLocalization("esri", "jsapi");
    },
  
    /**
    * Extent of map to be exported.
    * 
    * @type {module:esri/geometry/Extent}
    */
    extent: null,
      
    /**
    * Requested image width in pixels.
    * 
    * @type {number}
    */  
    width: null,
      
    /**
    * Requested image height in pixels.
    * 
    * @type {number}
    */  
    height: null,
      
    /**
    * Dots per inch setting for an {@link module:esri/layersArcGISDynamicLayer}.
    * 
    * @type {number}
    * @default 96
    */  
    dpi: null,
      
    /**
    * Map image format.
    * 
    * **Known values:** png | png8 | png24 | png32 | jpg | pdf | bmp | gif | svg
    * 
    * @type {string}
    * @default png8
    * 
    * @example 
    * var imageParams = new ImageParameters();
    * imageParams.format = "jpg";
    */  
    format: null,
      
    /**
    * Spatial reference of exported map.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */  
    imageSpatialReference: null,
      
    /**
    * The option for displaying or hiding the layer.
    * 
    * **Known values:** show | hide | include | exclude
    * 
    * @type {string}
    * 
    * @example 
    * var imageParams = new ImageParameters();
    * imageParams.layerOption = "show";
    */  
    layerOption: null,
      
    /**
    * A list of layer IDs, that represent which layers to include in the exported map. Use 
    * in combination with [layerOption](#layerOption) to specify how layer visibility is handled.
    * 
    * @type {number[]}
    * 
    * @example 
    * var imageParams = new ImageParameters();
    * imageParams.layerIds = [3,4,5];
    * imageParams.layerOption = "show";
    */  
    layerIds: null,
    
    /**
    * Indicates whether or not the background of the dynamic image is transparent.
    * 
    * @type {boolean}
    * @default true
    */  
    transparent: null,
      
    /**
    * The time extent for the map image.
    * 
    * @type {module:esri/TimeExtent}
    * @ignore
    */  
    timeExtent: null,
      
    /**
    * Array of LayerTimeOptions objects that allow you to override how a layer is exported in reference 
    * to the map's time extent. There is one object per sub-layer.
    * 
    * @type {module:esri/layers/support/LayerTimeOptions[]}
    * @ignore
    * 
    * @example 
    * var imageParams = new ImageParameters();
    * var timeOption1 = new LayerTimeOptions();
    * timeOption1.timeOffset = 4;
    * timeOption1.timeOffsetUnits = TimeInfo.UNIT_YEARS;
    * 
    * var options = [];
    * //array indices 2 and 5 are valid sub-layer IDs
    * options[2]= timeOption1;
    * options[5] = timeOption2;
    * imageParams.layerTimeOptions = options;
    */
    layerTimeOptions: null,
      
    /**
    * Array of layer definition expressions that allows you to filter the features of individual 
    * layers in the exported map image. Layer definitions with semicolons or colons are supported if 
    * using a map service published using ArcGIS Server 10 or later.
    * 
    * @name layerDefinitions
    * @instance
    * @type {string[]}
    * 
    * @example 
    * var imageParams = new ImageParameters();
    * var layerDefs = [];
    * layerDefs[5] = "STATE_NAME='Kansas'";
    * layerDefs[4] = "STATE_NAME='Kansas' and POP2007>25000";
    * layerDefs[3] = "STATE_NAME='Kansas' and POP2007>25000";
    * imageParams.layerDefinitions = layerDefs;
    */

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
      var bb = this.extent;
      bb = bb && bb._normalize(true);
      
      var layerOption = this.layerOption,
          wkid = bb ? (bb.spatialReference.wkid || JSON.stringify(bb.spatialReference.toJSON())) : null,
          imageSR = this.imageSpatialReference,
          jsonObj = {
            dpi: this.dpi,
            format: this.format,
            transparent: this.transparent,
            size: (this.width !== null && this.height !== null ? this.width + "," + this.height : null),
            bbox: (bb ? (bb.xmin + "," + bb.ymin + "," + bb.xmax + "," + bb.ymax) : null),
            bboxSR: wkid,
            layers: (layerOption ? layerOption + ":" + this.layerIds.join(",") : null),
            imageSR: (imageSR ? (imageSR.wkid || JSON.stringify(imageSR.toJSON())) : wkid)
          };
      
      jsonObj.layerDefs = layerUtils._serializeLayerDefinitions(this.layerDefinitions);
     
      var timeExtent = this.timeExtent;
      jsonObj.time = timeExtent ? timeExtent.toJSON().join(",") : null;
     
      jsonObj.layerTimeOptions = layerUtils._serializeTimeOptions(this.layerTimeOptions);
           
      return esriLang.filter(jsonObj, function(value) {
        if (value !== null) {
          return true;
        }
      });
    }
  });
  
  lang.mixin(ImageParameters, {
    LAYER_OPTION_SHOW: "show", 
    LAYER_OPTION_HIDE: "hide", 
    LAYER_OPTION_INCLUDE: "include", 
    LAYER_OPTION_EXCLUDE: "exclude"
  });
  
  return ImageParameters;  
});
