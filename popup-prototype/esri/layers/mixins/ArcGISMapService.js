/**
 * Mixin for {@link module:esri/layers/ArcGISDynamicLayer ArcGISDynamicLayer} and
 * {@link module:esri/layers/ArcGISTiledLayer ArcGISTiledLayer}.
 * 
 * @module esri/layers/mixins/ArcGISMapService
 * @mixin
 * @since 4.0
 * @see module:esri/layers/ArcGISDynamicLayer
 * @see module:esri/layers/ArcGISTiledLayer
 */
define(
[
  "../../core/declare",
  
  "../../core/JSONSupport",

  "../../geometry/SpatialReference",
  "../../geometry/Extent",
  
  "../support/LayerInfo",
  "../support/TimeInfo"
],
function(
  declare,
  JSONSupport,
  SpatialReference, Extent, 
  LayerInfo, TimeInfo
) {

  // TODO
  // For versions since 10.01 (10 SP 1), we can calculate scale values 
  // from sub-layers. Note that group layers have their own scale values 
  // as well
      
  var ArcGISMapService = declare(JSONSupport, 
  /** 
  * @mixes module:esri/core/JSONSupport 
  * @lends module:esri/layers/mixins/ArcGISMapService 
  */             
  {

    classMetadata: {
      reader: {
        exclude: [ "id", "copyrightText", "currentVersion", "layers" ],
        add:     [ "copyright", "version", "layerInfos" ]
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  copyright
    //----------------------------------
      
    /**
    * The copyright text as defined by the map service.
    *
    * @type {string}
    */
    copyright: null,  
    
    _copyrightReader: function(value, source) {
      // We expose "copyrightText" as "copyright" in the SDK.
      return source.copyrightText;
    },
    
    //----------------------------------
    //  fullExtent
    //----------------------------------
   
    /**
    * The full extent of the layer as defined by the map service.
    *
    * @type {module:esri/geometry/Extent}
    */  
    fullExtent: null,  
      
    _fullExtentReader: function(value) {
      return value && Extent.fromJSON(value);
    },
    
    //----------------------------------
    //  initialExtent
    //----------------------------------
   
    /**
    * The initial extent of the layer as defined by the map service.
    *
    * @type {module:esri/geometry/Extent}
    */  
    initialExtent: null,  
      
    _initialExtentReader: function(value) {
      return value && Extent.fromJSON(value);
    },
    
    //----------------------------------
    //  layerInfos
    //----------------------------------
    
    /**
    * Returns the available layers in the service along with information about them, including
    * their default visibility.
    *
    * @type {module:esri/layers/support/LayerInfo[]}
    * @private
    */  
    layerInfos: null,  
      
    _layerInfosReader: function(value, source) {
      return source.layers && source.layers.map(function(info) {
        return new LayerInfo(info);
      });
    },
    
    //----------------------------------
    //  spatialReference
    //----------------------------------
    
    // Layer.js assigns a default SR which does not make sense for map service
    // layer. We need to read it from map service description instead.
      
    /**
    * The spatial reference of the layer as defined by the map service.
    *
    * @type {module:esri/geometry/SpatialReference}
    */   
    spatialReference: null,
    
    _spatialReferenceReader: function(value) {
      return value && new SpatialReference(value);
    },
    
    //----------------------------------
    //  timeInfo
    //----------------------------------
    
    /**
    * Temporal information for the layer, such as time extent. If this property is 
    * `null` or not specified, then the layer does not support time-related operations.
    * 
    * **Will not be available in 4.0beta1**
    *
    * @type {module:esri/layers/support/TimeInfo}
    * @private
    */   
    timeInfo: null,   
      
    _timeInfoReader: function(value) {
      // TODO update TimeInfo to support fromJSON
      return value && new TimeInfo(value);
    },
    
    //----------------------------------
    //  version
    //----------------------------------
    
    /**
    * The version of ArcGIS Server where the map service is published.
    *
    * @type {number}
    */   
    version: null,  
      
    _versionReader: function(version, source) {
      // REST API added currentVersion property to some resources at 10 SP1
      // However, we expose "currentVersion" as "version" in the SDK
      version = source.currentVersion;
      
      // Let's compute version number for servers that don't advertise it.
      if (!version) {
        if (
          source.hasOwnProperty("capabilities") || 
          source.hasOwnProperty("tables")
        ) {
          version = 10;
        }
        else if (source.hasOwnProperty("supportedImageFormatTypes")) {
          version = 9.31;
        }
        else {
          version = 9.3;
        }
      }
      
      return version;
    }

  });
  
  return ArcGISMapService;  
});
