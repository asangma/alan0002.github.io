/**
 * WebTiledLayer provides a simple way to add non-ArcGIS Server map tiles as a layer to a map. 
 * The constructor takes a URL template that usually follows a pattern of 
 * `http://some.domain.com/${level}/${col}/${row}/` where `level` corresponds to a zoom level, and 
 * `column` and `row` represent tile column and row, respectively. This pattern is not required, but 
 * is the most common one currently on the web. 
 *
 * The [subDomains](#subDomains) property can be used to specify subDomains where tiles are served to 
 * speed up tile retrieval (using subDomains gets around the browser limit of the max number of concurrent
 * requests to a domain). If subDomains are specified, the [urlTemplate](#urlTemplate) should include a `${subDomain}` place 
 * holder. The [copyright](#copyright) property can be used to define attribution information that will be displayed 
 * in the map's Attribution widget.
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 * 
 * @module esri/layers/WebTiledLayer
 * @since 4.0
 * @see [Sample - WebTiledLayer (2D)](../sample-code/2d/webtiled2d/)
 * @see [Sample - WebTiledLayer (3D)](../sample-code/3d/webtiled3d/)
 * @see module:esri/layers/ArcGISTiledLayer
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/url",
  "dojo/string",
  
  "../core/urlUtils",

  "../geometry/SpatialReference",
  "../geometry/Extent",
  "../geometry/Point",
  
  "./TiledLayer",
  
  "./support/TileInfo",
  "./support/LOD"
],
function(
  declare, lang, Url, string,
  urlUtils,
  SpatialReference, Extent, Point,
  TiledLayer,
  TileInfo, LOD
) {

  /**
  * @extends module:esri/layers/TiledLayer
  * @constructor module:esri/layers/WebTiledLayer
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */
  var WebTiledLayer = declare(TiledLayer, 
  /** @lends module:esri/layers/WebTiledLayer.prototype */                            
  {
    declaredClass: "esri.layers.WebTiledLayer",

    classMetadata: {
      computed: {        
        urlPath: ["urlTemplate"],
        tileServers: ["urlTemplate", "subDomains", "urlPath"],
        levelValues: ["tileInfo"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(urlTemplate, options) {
      if (typeof urlTemplate === "string") {
        return lang.mixin({
          urlTemplate: urlTemplate
        }, options || {});
      }
      return urlTemplate;
    },

    getDefaults: function(props) {
      var extent = new Extent(-20037508.342787, -20037508.342780, 20037508.342780, 20037508.342787, SpatialReference.WebMercator);

      return lang.mixin(this.inherited(arguments), {
        fullExtent: extent,
        initialExtent: extent,
        tileInfo: new TileInfo({
          rows: 256,
          cols: 256,
          dpi: 96,
          format: "PNG8",
          compressionQuality: 0,
          origin: new Point({
            x: -20037508.342787,
            y: 20037508.342787,
            spatialReference: SpatialReference.WebMercator
          }),
          spatialReference: SpatialReference.WebMercator,
          lods: [
            new LOD({ level: 0, scale: 591657527.591555, resolution: 156543.033928 }),
            new LOD({ level: 1, scale: 295828763.795777, resolution: 78271.5169639999 }),
            new LOD({ level: 2, scale: 147914381.897889, resolution: 39135.7584820001 }),
            new LOD({ level: 3, scale: 73957190.948944, resolution: 19567.8792409999 }),
            new LOD({ level: 4, scale: 36978595.474472, resolution: 9783.93962049996 }),
            new LOD({ level: 5, scale: 18489297.737236, resolution: 4891.96981024998 }),
            new LOD({ level: 6, scale: 9244648.868618, resolution: 2445.98490512499 }),
            new LOD({ level: 7, scale: 4622324.434309, resolution: 1222.99245256249 }),
            new LOD({ level: 8, scale: 2311162.217155, resolution: 611.49622628138 }),
            new LOD({ level: 9, scale: 1155581.108577, resolution: 305.748113140558 }),
            new LOD({ level: 10, scale: 577790.554289, resolution: 152.874056570411 }),
            new LOD({ level: 11, scale: 288895.277144, resolution: 76.4370282850732 }),
            new LOD({ level: 12, scale: 144447.638572, resolution: 38.2185141425366 }),
            new LOD({ level: 13, scale: 72223.819286, resolution: 19.1092570712683 }),
            new LOD({ level: 14, scale: 36111.909643, resolution: 9.55462853563415 }),
            new LOD({ level: 15, scale: 18055.954822, resolution: 4.77731426794937 }),
            new LOD({ level: 16, scale: 9027.977411, resolution: 2.38865713397468 }),
            new LOD({ level: 17, scale: 4513.988705, resolution: 1.19432856685505 }),
            new LOD({ level: 18, scale: 2256.994353, resolution: 0.597164283559817 }),
            new LOD({ level: 19, scale: 1128.497176, resolution: 0.298582141647617 })
          ]
        })
      });
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------.

    //----------------------------------
    //  copyright
    //----------------------------------

    /**
    * The attribution information for the layer.
    * 
    * @type {string[]}
    */
    copyright: "",

    //----------------------------------
    //  levelValues
    //----------------------------------

    /**
     * An array of numbers, each representing an LOD (level of detail) that determines which tiles
     * to load based on the zoom level. For example if you set `levelValues = [1,2,3,4,5]`, only the tiles in
     * LODs 1 - 5 will load when zoomed within those respective levels. If the user zooms beyond LOD 5, 
     * then the more detailed tiles in LODs 6 and above will not display.
     * 
     * @name levelValues
     * @instance
     * @type {number[]}
     * @private
     */
    _levelValuesGetter: function() {
      var tileInfo = this.tileInfo,
          levelValues = [];
      if (!tileInfo) {
        return null;
      }
      this.tileInfo.lods.forEach(function(lod){
        levelValues[lod.level] = lod.levelValue || lod.level;
      }, this);
      return levelValues;
    },

    //----------------------------------
    //  spatialReference
    //----------------------------------

    /**
     * The spatial reference of the layer.
     * 
     * @type {module:esri/geometry/SpatialReference}
     * @default Web Mercator Auxiliary Sphere (wkid: 3857)
     */
    spatialReference: SpatialReference.WebMercator,
      
    //----------------------------------
    //  subDomains
    //----------------------------------
      
    /**
    * A string of subDomain names where tiles are served to speed up tile retrieval. 
    * If subDomains are specified, the [urlTemplate](#urlTemplate) should include a 
    * `${subDomain}` place holder.
    * 
    * @type {string[]}
    * @example
    * new WebTiledLayer({
    *   urlTemplate: 'http://${subDomain}.tile.stamen.com/toner/${level}/${col}/${row}.png',
    *   subDomains: ['a', 'b', 'c', 'd']
    * });
    */
    subDomains: null,  

    //----------------------------------
    //  tileServers
    //----------------------------------

    /**
     * The tile server names for the layer.
     * 
     * @type {string[]}
     */
     tileServers: null,  
      
    _tileServersGetter: function() {
      var urlTemplate = this.urlTemplate,
          url = new Url(urlTemplate),
          urlScheme = url.scheme ? url.scheme + "://" : "//",
          tileServer = urlScheme + url.authority + "/",
          subDomains = this.subDomains, subDomainTileServer,
          tileServers = [];

      if (url.authority.indexOf("{subDomain}") === -1) {
        tileServers.push(tileServer);
      }

      if (subDomains && subDomains.length > 0 && url.authority.split(".").length > 1) {
        subDomains.forEach(function(subDomain, idx){
          if (url.authority.indexOf("${subDomain}") > -1) {
            subDomainTileServer = urlScheme + string.substitute(url.authority, {subDomain: subDomain}) + "/";
          }
          else if (url.authority.indexOf("{subDomain}") > -1) {
            subDomainTileServer = urlScheme + url.authority.replace(/\{subDomain\}/gi, subDomain) + "/";
          }        
          tileServers.push(subDomainTileServer);        
        }, this);
      }

      tileServers = tileServers.map(function(item){ 
        if (item.charAt(item.length - 1) !== "/") {
          item += "/";
        }
        return item;
      });

      return tileServers;
    },

    //----------------------------------
    //  urlPath
    //----------------------------------

    /**
     * @private
     */
    _urlPathGetter: function() {
      if (!this.urlTemplate) {
        return null;
      }
      var urlTemplate = this.urlTemplate,
          url = new Url(urlTemplate),
          tileServer = (url.scheme ? url.scheme + "://" : "//") + url.authority + "/";
      return urlTemplate.substring(tileServer.length);
    },
    
    //----------------------------------
    //  urlTemplate
    //----------------------------------
      
    /**
    * URL template for the hosted tiles. The `urlTemplate` should contain a `${subDomain}` place 
    * holder if [subDomains](#subDomains) are specified.
    * 
    * @type {string}
    * @example
    * urlTemplate: 'http://${subDomain}.tile.stamen.com/toner/${level}/${col}/${row}.png'
    */
    urlTemplate: null, 
      
    /**
    * @name url
    * @instance
    * @type {string}
    * @ignore 
    */  

    //--------------------------------------------------------------------------
    //
    //  Overridden Public Methods: TiledLayer
    //
    //--------------------------------------------------------------------------

    getTileUrl: function (level, row, col) {
      level = this.levelValues[level];

      var tileUrl = this.tileServers[row % this.tileServers.length] + 
                    string.substitute(
                      this.urlPath, 
                      {
                        level: level, 
                        col: col, 
                        row: row
                      }
                    );

      tileUrl = tileUrl.replace(/\{level\}/gi, level)
                       .replace(/\{row\}/gi, row)
                       .replace(/\{col\}/gi, col);

      // TODO
      // tileUrl = this.addTimestampToURL(tileUrl);

      return urlUtils.addProxy(tileUrl);
    }

  });


  return WebTiledLayer;  
});
