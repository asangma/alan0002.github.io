/**
 * Mixin for {@link module:esri/layers/ArcGISDynamicLayer ArcGISDynamicLayer}.
 * 
 * @module esri/layers/mixins/ArcGISDynamicService
 * @mixin
 * @since 4.0
 * @see module:esri/layers/ArcGISDynamicLayer
 */
define(
[
  "dojo/_base/lang",

  "./ArcGISMapService",

  "../support/layerUtils",
  
  "../../core/Accessor"
],
function(
  lang,
  ArcGISMapService,
  layerUtils,
  Accessor
) {
     
  var ArcGISDynamicService = ArcGISMapService.createSubclass( 
  /** 
  * @mixes module:esri/core/JSONSupport 
  * @lends module:esri/layers/mixins/ArcGISDynamicService 
  */             
  {

    declaredClass: "esri.layers.mixins.ArcGISDynamicService",

    classMetadata: {
      properties: {
        exportImageParameters: {
          readOnly: true
        },
        supportsRotation: {
          dependsOn: ["version"],
          readOnly: true
        },
        visibleLayers: {
          dependsOn: ["dynamicLayerInfos"]
        }
      },
      reader: {
        add: ["defaultVisibleLayers", "visibleLayers"]
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        exportImageParameters: new ExportImageParameters({
          layer: this
        })
      });
    },
    
    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  dpi
    //----------------------------------

    /**
     * The output dots per inch (DPI) of the dynamic layer.
     *
     * @type {number}
     * @default
     */
    dpi: 96,

    //----------------------------------
    //  defaultVisibleLayers
    //----------------------------------

    /**
     * Calculates the default visibilty of the sub-layers.
     * @memberof module:esri/layers/mixins/ArcGISDynamicService
     * @name defaultVisibleLayers
     * @private
     */
    _defaultVisibleLayersReader: function(value, source) {
      // Calculate sub-layers visible by default
      var defaults = [];
      source.layers && source.layers.forEach(function(info) {
        if (info.defaultVisibility) {
          defaults.push(info.id);
        }
      });
      return defaults;
    },
    
    //----------------------------------
    //  dynamicLayerInfos
    //----------------------------------
    
    /**
     * An array of DyanamicLayerInfo objects used to change the layer ordering or redefine the map.
     *
     * @type {module:esri/layers/support/DynamicLayerInfo[]}
     * @private
     */
    dynamicLayerInfos: null,

    /*
    _dynamicLayerInfosSetter: function(value) {
      // TODO yann6817: what should happen to visibleLayers when dynamicLayerInfos is defined?
      layerUtils._getDefaultVisibleLayers(value);
      return value;
    },
    */
    
    //----------------------------------
    //  exportImageParameters
    //----------------------------------

    /**
     * Serialized parameters for the image export query.
     * @private
     */
    exportImageParameters: null,

    //----------------------------------
    //  gdbVersion
    //----------------------------------

    /**
     * The version of the geodatabase where the dynamic service resides.
     * 
     * @type {string}
     */
    gdbVersion: null,

    //----------------------------------
    //  imageFormat
    //----------------------------------

    /**
     * The output image type.
     * 
     * **Known Values:** png | png8 | png24 | png32 | jpg | pdf | bmp | gif | svg
     * 
     * @type {string}
     * @default
     */
    imageFormat: "png8",

    //----------------------------------
    //  imageTransparency
    //----------------------------------

    /**
     * Indicates whether the background of the dynamic image is transparent.
     * 
     * @type {boolean}
     * @default
     */
    imageTransparency: true,
    
    //----------------------------------
    //  layerDefinitions
    //----------------------------------
    
    /**
     * Sets the layer definitions used to filter the features of individual layers in the map service. 
     * Layer definitions with semicolons or colons are supported if using a map service published using 
     * ArcGIS Server 10.0 or greater.
     * 
     * @type {string[]}
     */
    layerDefinitions: null,
    
    //----------------------------------
    //  layerDrawingOptions
    //----------------------------------
    
    /**
     * Array of LayerDrawingOptions used to override the way layers are drawn by default.
     * 
     * @type {module:esri/layers/support/LayerDrawingOptions[]}
     * @private
     */
    layerDrawingOptions: null,
    
    //----------------------------------
    //  layerTimeOptions
    //----------------------------------
    
    /**
     * Returns the current layer time options if applicable.
     * 
     * @type {module:esri/layers/support/LayerTimeOptions[]}
     * @private
     */
    layerTimeOptions: null,

    //----------------------------------
    //  supportsRotation
    //----------------------------------

    _supportsRotationGetter: function() {
      return this.version >= 10.3;
    },

    //----------------------------------
    //  visibleLayers
    //----------------------------------
    
    /**
     * An array of numbers, each representing a visible layer's index in the exported map.
     * 
     * @type {number[]}
     */
    visibleLayers: null,

    _visibleLayersReader: function(value, source) {
      return this._defaultVisibleLayersReader(value, source);
    },
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * Gets the parameters of the exported image to use when calling the 
     * [export REST operation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/).
     *
     * @param {Object} options - The parameter options is an object with the following properties.
     * @param {module:esri/geometry/Extent} options.extent - The extent of the exported image
     * @param {number} options.width - The width of the exported image
     * @param {number} options.height - The height of the exported image
     * @param {number=} options.rotation - The rotation in degrees of the exported image. Available since ArcGIS for Server 10.3.
     *
     * @return {Object} The parameters of the exported image. Use this object to call the 
     * [export REST operation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/).
     */
    getExportImageParameters: function(options) {
      var extent = this.version < 10 ? options.extent : options.extent.shiftCentralMeridian(); 
      var width = options.width;
      var height = options.height;
      var spatialRef = extent && extent.spatialReference;
      // rotation support server >= 10.3
      var rotationParam = (options.rotation == null || options.rotation === 0 || !this.supportsRotation) ?
          {} :
          { rotation: -options.rotation };
      
      spatialRef = spatialRef && (
        spatialRef.wkid || JSON.stringify(spatialRef.toJSON())
      );

      return lang.mixin(
        {
          bbox:        extent && (
                         extent.xmin + "," + extent.ymin + "," + 
                         extent.xmax + "," + extent.ymax
                       ),
          bboxSR:      spatialRef,
          imageSR:     spatialRef,
          size:        width + "," + height
        },
        rotationParam,
        this.exportImageParameters.toJSON()
      );
    }

  });

  /**
   * @private
   */
  var ExportImageParameters = Accessor.createSubclass({
    classMetadata: {
      computed: {
        layers: ["layer.defaultVisibleLayers", "layer.visibleLayers"],
        layerDefs: ["layer.layerDefinitions"],
        layerTimeOptions: ["layer.layerTimeOptions"],

        // special property that increments each time the parameters changes
        version: [
          "layers", "layerDefs", "layerTimeOptions",
          "layer.dpi", "layer.imageFormat", "layer.imageTransparency", "layer.gdbVersion"
        ]
      }
    },
    
    //----------------------------------
    //  layerDefs
    //----------------------------------

    _layerDefsGetter: function() {
      var layerDefs = this.layer.layerDefinitions;
      return layerDefs && layerUtils._serializeLayerDefinitions(layerDefs);
    },
    
    //----------------------------------
    //  layerTimeOptions
    //----------------------------------

    _layerTimeOptionsGetter: function() {
      var layerTimeOptions = this.layer.layerTimeOptions;
      return layerTimeOptions && layerUtils._serializeTimeOptions(layerTimeOptions);
    },
    
    //----------------------------------
    //  layers
    //----------------------------------

    _layersGetter: function() {
      var layer = this.layer;
      var visibleLayers = layer.visibleLayers;
      var defaultVisibleLayers = layer.defaultVisibleLayers;

      if (visibleLayers && visibleLayers !== defaultVisibleLayers) {
        if (!visibleLayers.length) {
          // show nothing
          return "show:-1";
        }
        else {
          // show the visible layers
          return "show:" + visibleLayers.join(",");
        }
      }
      // layers being null, the service will export with the defaults
      return null;
    },
    
    //----------------------------------
    //  version
    //----------------------------------

    version: 0,

    _versionGetter: function(oldValue) {
      return oldValue + 1;
    },
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var layer = this.layer;

      return {
        dpi:         layer.dpi,
        format:      layer.imageFormat,
        transparent: layer.imageTransparency,
        gdbVersion:  layer.gdbVersion || null,
        layerTimeOptions: this.layerTimeOptions,
        layers: this.layers,
        // .NET REST bug, layerDefs needs to be last query parameter
        layerDefs: this.layerDefs
      };
    }
  });
  
  return ArcGISDynamicService;  
});
