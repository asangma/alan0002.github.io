/**
 * Tiled vector layer. TODO description
 *
 * **Limitations:** VectorTiledLayer is not supported in any version of Internet Explorer.
 *
 * @module esri/layers/VectorTileLayer
 * @since 4.0
 * @private
 */
define([
  "../core/declare",
  "dojo/_base/lang",

  "../core/urlUtils",

  "../core/JSONSupport",

  "../geometry/SpatialReference",
  "../geometry/Extent",
  "../geometry/Point",

  "./support/VectorTiledLayerLoader",
  "./TiledLayer",

  "./support/TileInfo",
  "./support/LOD"
],
function(
  declare, lang,
  urlUtils,
  JSONSupport,
  SpatialReference,
  Extent,
  Point,
  VectorTiledLayerLoader,
  TiledLayer,
  TileInfo,
  LOD
) {

  /**
  * @extends module:esri/layers/TiledLayer
  * @mixes module:esri/core/JSONSupport
  * @constructor module:esri/layers/VectorTileLayer
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */
  var VectorTiledLayer = declare([ TiledLayer, JSONSupport ], {
    /** @lends module:esri/layers/VectorTiledLayer.prototype */

    declaredClass: "esri.layers.VectorTiledLayer",

    classMetadata: {
      reader: {
        add: [
          "spatialReference",
          "tileInfo"
        ]
      }
    },

    viewModulePaths: {
      "2d": "../views/2d/layers/VectorTiledLayerView2D"
    },

    _mapsWithAttribution: [
      "World_Basemap"
    ],

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(url, options){
      if(typeof url === "string"){
        return lang.mixin({
          url: url
        }, options);
      }
      return url;
    },

    getDefaults: function(kwArgs){
      var url = kwArgs.url;

      // Get the default attribution for well known servers
      var attribution = null;
      if (url) {
        var parsedUrl = urlUtils.urlToObject(kwArgs.url);
        var path = parsedUrl.path.toLowerCase();
        attribution = this._getDefaultAttribution(this._getMapName(path));
      }

      var extent = new Extent(
        -20037508.342787,
        -20037508.342780,
        20037508.342780,
        20037508.342787,
        SpatialReference.WebMercator
      );

      return lang.mixin(this.inherited(arguments), {
        // Only selected online services have default attribution
        styles: [],
        attributionDataUrl: attribution,
        hasAttributionData: !!attribution,
        fullExtent: extent,
        initialExtent: extent,
        spatialReference: SpatialReference.WebMercator,
        tileInfo: new TileInfo({
          rows: 512,
          cols: 512,
          dpi: 96,
          format: "pbf",
          origin: new Point({
            x: -20037508.342787,
            y: 20037508.342787,
            spatialReference: SpatialReference.WebMercator
          }),
          spatialReference: SpatialReference.WebMercator,
          lods: [
            new LOD({ level: 0, resolution: 78271.51696399994, scale: 295828763.795777 }),
            new LOD({ level: 1, resolution: 39135.75848200009, scale: 147914381.897889 }),
            new LOD({ level: 2, resolution: 19567.87924099992, scale: 73957190.948944 }),
            new LOD({ level: 3, resolution: 9783.93962049996, scale: 36978595.474472 }),
            new LOD({ level: 4, resolution: 4891.96981024998, scale: 18489297.737236 }),
            new LOD({ level: 5, resolution: 2445.98490512499, scale: 9244648.868618 }),
            new LOD({ level: 6, resolution: 1222.992452562495, scale: 4622324.434309 }),
            new LOD({ level: 7, resolution: 611.4962262813797, scale: 2311162.217155 }),
            new LOD({ level: 8, resolution: 305.74811314055756, scale: 1155581.108577 }),
            new LOD({ level: 9, resolution: 152.87405657041106, scale: 577790.554289 }),
            new LOD({ level: 10, resolution: 76.43702828507324, scale: 288895.277144 }),
            new LOD({ level: 11, resolution: 38.21851414253662, scale: 144447.638572 }),
            new LOD({ level: 12, resolution: 19.10925707126831, scale: 72223.819286 }),
            new LOD({ level: 13, resolution: 9.554628535634155, scale: 36111.909643 }),
            new LOD({ level: 14, resolution: 4.77731426794937, scale: 18055.954822 }),
            new LOD({ level: 15, resolution: 2.388657133974685, scale: 9027.977411 }),
            new LOD({ level: 16, resolution: 1.1943285668550503, scale: 4513.988705 }),
            new LOD({ level: 17, resolution: 0.5971642835598172, scale: 2256.994353 }),
            new LOD({ level: 18, resolution: 0.29858214164761665, scale: 1128.497176 })
          ]
        })
      });
    },

    load: function(){
      if (this.serviceStyle) {
        //return this._setServiceStyle(this.serviceStyle);
        return;
      }

      //use loader to get layerDefinition and style
      var loader = new VectorTiledLayerLoader();
      var promise = loader.loadMetadata(this.url);

      this.addResolvingPromise(promise.then(
        function (res) {
          this.layerDefinition = res.layerDefinition;
          this.serviceStyle = res.style;
        }.bind(this)));
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  fullExtent
    //----------------------------------

    _fullExtentReader: Extent.fromJSON,

    //----------------------------------
    //  initialExtent
    //----------------------------------

    _initialExtentReader: Extent.fromJSON,

    //----------------------------------
    //  serviceStyle
    //----------------------------------

    /**
     * The style object of the service with fully qualified urls for glyphs and sprite
     * @type {Object}
     * @private
     */
    serviceStyle: null,

    //----------------------------------
    //  spatialReference
    //----------------------------------

    _spatialReferenceReader: function(value, source){
      value = (source.initialExtent && source.initialExtent.spatialReference)
        || (source.fullExtent && source.fullExtent.spatialReference);
      return value && SpatialReference.fromJSON(value);
    },

    //----------------------------------
    //  styles
    //----------------------------------

    /**
     * The current style classes applied to the layer
     * @type {string[]}
     */
    styles: null,

    _stylesSetter: function(value){
      if(!value){
        return [];
      }
      else if(typeof value === "string") {
        return [value];
      }
      else if(Array.isArray(value)) {
        return value;
      }
    },

    //----------------------------------
    //  styleUrl
    //----------------------------------

    /**
     * Url to the style data for the layer. If this property is set
     * when the layer is created, the style data referenced by the url is
     * used instead of the default style data. Changing this value after
     * the layer is created will cause the new style data to be downloaded and the
     * layer will be reinitialized using the new style.
     *
     * @type {string}
     */
    /*styleUrl: null,

    _styleUrlSetter: function(newValue, oldValue){
      if(newValue === oldValue){
        return oldValue;
      } else if (!oldValue) {
        return newValue;
      }

      if (this.loaded) {
        //get new style data and return new value
        var loader = new VectorTiledLayerLoader();
        loader.loadMetadata(newValue).then(function(response){
          this.serviceStyle = response.style;
        }.bind(this));
        /!*esriRequest({
          url: newValue,
          handleAs: "json"
        }).then(function(response){
          this._setServiceStyle(response);
        }.bind(this), function(err){
          this.emit("error", new Error(err));
        }.bind(this));*!/
      }

      return newValue;
    },*/

    //----------------------------------
    //  tileInfo
    //----------------------------------

    _tileInfoReader: function(value){
      return value && TileInfo.fromJSON(value);
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    setStyle: function(styleUrl){
      var loader = new VectorTiledLayerLoader();
      loader.loadMetadata(styleUrl).then(function(response){
        this.serviceStyle = response.style;
      }.bind(this));
    },

    /**
     * Adds a new style class to the layer.
     * @param {string} styleName
     */
    addStyle: function(styleName) {
      var styles = this.styles;
      if(styles.indexOf(styleName) === -1){
        this.styles = styles.concat([styleName]);
      }
    },

    /**
     * Removes a style class from the layer
     * @param {string} styleName
     */
    removeStyle: function(styleName) {
      var styles = this.styles;
      var index = styles.indexOf(styleName);
      if(index !== -1){
        styles.splice(index, 1);
        this.styles = styles.concat();
      }
    },

    /**
     * Returns `true` if styleName is currently active, false if it is not
     * @param {string} styleName
     * @returns {boolean}
     */
    hasStyle: function(styleName){
      return this.styles.indexOf(styleName) !== -1;
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _getMapName: function(url) {
      var match = url.match(/^https?\:\/\/(basemaps|basemapsbeta)\.arcgis\.com\/arcgis\/rest\/services\/([^\/]+(\/[^\/]+)*)\/vectortileserver/i);
      return  match && match[2];
    },

    _getDefaultAttribution: function(mapName) {
      if (!mapName) {
        return;
      }

      var attributionMapName;

      mapName = mapName.toLowerCase();

      for (var i = 0, n = this._mapsWithAttribution.length; i < n; i++) {
        attributionMapName = this._mapsWithAttribution[i];

        if (attributionMapName.toLowerCase().indexOf(mapName) > -1) {
          return this._getProtocol() + "//static.arcgis.com/attribution/Vector/" + attributionMapName;
        }
      }
    },

    _getProtocol: function() {
      var protocol = window.location.protocol;

      return protocol === "file:" ? "http:" : protocol;
    }
  });

  return VectorTiledLayer;
});
