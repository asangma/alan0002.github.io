/**
 * Mixin for {@link module:esri/layers/ArcGISTiledLayer ArcGISTiledLayer} and
 * {@link module:esri/layers/ArcGISElevationLayer ArcGISElevationLayer}.
 * 
 * @module esri/layers/mixins/ArcGISCachedService
 * @mixin
 * @since 4.0
 * @see module:esri/layers/ArcGISTiledLayer
 * @see module:esri/layers/ArcGISElevationLayer
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "dojo/io-query",
  
  "../../core/JSONSupport",
  "../../core/urlUtils",

  "../support/TileInfo",
  "../support/TileMap"
],
function(
  declare, lang,
  ioq,
  JSONSupport, urlUtils,
  TileInfo, TileMap
) {
  
  var ArcGISCachedService = declare(JSONSupport, 
  /** 
  * @mixes module:esri/core/JSONSupport       
  * @lends module:esri/layers/mixins/ArcGISCachedService 
  */                                  
  {
    
    declaredClass: "esri.layers.mixins.ArcGISCachedService",

    classMetadata: {
      computed: {
        supportsBlankTile: ["version"]
      },
      reader: {
        add: ["tileMap"],
        // min/maxScale are ignored.
        // They only indicate the bounds of the tileInfo's LOD.
        exclude: ["minScale", "maxScale"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  resampling
    //----------------------------------

    /**
     * When `true` resampling is enabled.
     * 
     * @type {boolean}
     * @default
     */
    resampling: true,

    //----------------------------------
    //  resamplingTolerance
    //----------------------------------

    /**
     * Number of levels beyond the last level where tiles are available. If not specified, resampling is 
     * enabled at all levels where tiles are not available.
     * 
     * @type {number}
     * @default
     */
    resamplingTolerance: 3,

    //----------------------------------
    //  supportsBlankTile
    //----------------------------------

    /**
     * When `true`, indicates that the service supports displaying blank tiles.
     * 
     * @type {boolean}
     * @default false
     */
    supportsBlankTile: false,

    _supportsBlankTileGetter: function() {
      return this.version >= 10.2;
    },

    //----------------------------------
    //  tileInfo
    //----------------------------------

    /**
     * Contains information about the tiling scheme for the layer.
     * 
     * @type {module:esri/layers/support/TileInfo}
     */
    tileInfo: null,
    
    _tileInfoReader: function(value, source) {
      var minScale = source.minScale ? source.minScale : +Infinity, 
      maxScale = source.maxScale ? source.maxScale : -Infinity;
      if (value) {
        // Filter all the LODs out of the service scale range.
        value.lods = value.lods.filter(function(lod) {
          return lod.scale <= minScale && lod.scale >= maxScale;
        });
        return TileInfo.fromJSON(value);
      }
      return null;
    },

    //----------------------------------
    //  tileMap
    //----------------------------------
    
    /**
     * @private
     */
    tileMap: null,
    
    _tileMapReader: function(value, source) {
      var supported = source.capabilities && source.capabilities.indexOf("Tilemap") > -1;
      if (supported) {
        return new TileMap({layer: this});
      }
      return null;
    },

    //----------------------------------
    //  refreshTimestamp
    //----------------------------------

    /**
     * Timestamp that's recorded each time [refresh()](#refresh) is called on the layer.
     * 
     * @type {number}
     * @see [Date.now()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)
     * @private
     */
    refreshTimestamp: null,


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    // See esri/layers/Layer
      
    /**
     * Refreshes the layers tiles.
     * @private
     */
    refresh: function() {
      // Record the timestamp so that future tile requests can use it
      // to beat browser cache, and make sure latest content is fetched
      // from the server
      this.refreshTimestamp = Date.now();
      this.inherited(arguments);
    },

    // See esri/layers/TiledLayer
    getTileUrl: function(level, row, col) {
      var useBlankTile = !this.tileMap && this.resampling && this.supportsBlankTile;
      var query = lang.mixin(
            {}, 
            this.parsedUrl.query, 
            {
              token:     this.token,
              blankTile: useBlankTile ? false : null,
              _ts:       this.refreshTimestamp
            }
          ),
          
          tileUrl = this.parsedUrl.path
                    + "/tile/" + level 
                    + "/" + row 
                    + "/" + col;

      query = ioq.objectToQuery(query);
      tileUrl += (query ? ("?" + query) : "");
      
      return urlUtils.addProxy(tileUrl);
    }

  });
  
  return ArcGISCachedService;  
});
