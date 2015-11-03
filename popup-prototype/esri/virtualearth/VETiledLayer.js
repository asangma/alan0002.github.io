define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/config",
  "dojo/_base/Deferred",
  "dojo/string",
  
  "../core/urlUtils",

  "../geometry/SpatialReference", 
  "../layers/support/TileInfo",
  "../layers/TiledLayer",
  "../geometry/Extent",
  "../request"
],
function(
  declare, lang, array, config, Deferred, string,
  urlUtils,
  SpatialReference, TileInfo, TiledLayer, Extent, request
) {

  var VET = declare(TiledLayer, {
    declaredClass: "esri.virtualearth.VETiledLayer",

    constructor: function(options) {
      try {
        //options = dojo.mixin({ environment:"staging", tokenDuration:480, mapStyle:"road", culture:"en-US" }, options || {});
        //this.environment = options.environment;
        //this.tokenDuration = options.tokenDuration;

        options = lang.mixin({ bingMapsKey:null, culture:"en-US" }, options || {});
        var protocol = window.location.protocol;
        if (protocol === "file:") {
          protocol = "http:";
        }
        this.url = protocol + "//dev.virtualearth.net/REST/v1";
        this._url = urlUtils.urlToObject(this.url);
        
        //required layer properties
        this.spatialReference = new SpatialReference({ wkid:102100 });
        this.tileInfo = TileInfo.fromJSON({
          rows:256,
          cols:256,
          dpi:96,
          origin: {
            x:-20037508.342787,
            y:20037508.342787
          },
          spatialReference: {
            wkid:102100
          },
          lods : [
            // { level:0, resolution:156543.033928, scale:591657527.591555 },
            { level:1, resolution:78271.5169639999, scale:295828763.795777 },
            { level:2, resolution:39135.7584820001, scale:147914381.897889 },
            { level:3, resolution:19567.8792409999, scale:73957190.948944 },
            { level:4, resolution:9783.93962049996, scale:36978595.474472 },
            { level:5, resolution:4891.96981024998, scale:18489297.737236 },
            { level:6, resolution:2445.98490512499, scale:9244648.868618 },
            { level:7, resolution:1222.99245256249, scale:4622324.434309 },
            { level:8, resolution:611.49622628138, scale:2311162.217155 },
            { level:9, resolution:305.748113140558, scale:1155581.108577 },
            { level:10, resolution:152.874056570411, scale:577790.554289 },
            { level:11, resolution:76.4370282850732, scale:288895.277144 },
            { level:12, resolution:38.2185141425366, scale:144447.638572 },
            { level:13, resolution:19.1092570712683, scale:72223.819286 },
            { level:14, resolution:9.55462853563415, scale:36111.909643 },
            { level:15, resolution:4.77731426794937, scale:18055.954822 },
            { level:16, resolution:2.38865713397468, scale:9027.977411 },
            { level:17, resolution:1.19432856685505, scale:4513.988705 },
            { level:18, resolution:0.597164283559817, scale:2256.994353 },
            { level:19, resolution:0.298582141647617, scale:1128.497176 }
          ]
        });

        this.initialExtent = (this.fullExtent = new Extent(-20037508.342787, -20037508.342780, 20037508.342780, 20037508.342787, new SpatialReference({ wkid:102100 })));

        //layer properties
        lang.mixin(this, options);
        // this.bingMapsKey = options.bingMapsKey;      
        // this.clientToken = options.clientToken;
        // this.serverToken = options.serverToken;
        // this.tokenUrl = options.tokenUrl;
        // 
        // this.mapStyle = options.mapStyle;
        // this.culture = options.culture;
        
        this.hasAttributionData = this.showAttribution;
      
        //hitch event handlers
        this._initLayer = lang.hitch(this, this._initLayer);
        this._errorHandler = lang.hitch(this, this._errorHandler);
        this._getTileInfo = lang.hitch(this, this._getTileInfo);
        
        //this._updateTokens = dojo.hitch(this, this._updateTokens);
        //this._updateClientToken = dojo.hitch(this, this._updateClientToken);
        //this._updateServerToken = dojo.hitch(this, this._updateServerToken);
        
        //if (this.tokenUrl) {
        //  this._tokenUrl = esri.urlToObject(this.tokenUrl);
        //}
        
        //initialize layer
        //if (this.clientToken && this.serverToken) {
        if (this.bingMapsKey) {
          //if (this.tokenUrl) {
          //  this._updateTokenTimer = setTimeout(this._updateTokens, ((this.tokenDuration - 1) * 60 * 1000));
          //}

          this._getTileInfo();
        }
        //else if (this.tokenUrl) {
        //  this._updateTokens();
        //}
        else {
          //throw new Error(esri.bundle.virtualearth.vetiledlayer.tokensNotSpecified);
          throw new Error("BingMapsKey must be provided.");
        }
      }
      catch (e) {
        this.onError(e);
        throw e;
      }
    },
    
    _unsetMap: function(map, container) {
      //clearTimeout(this._updateTokenTimer);
      
      this.inherited("_unsetMap", arguments);
    },
    
    _getTileInfo: function() {
      if (!this.mapStyle) {
        return;
      }
      //metadata url document:
      //http://msdn.microsoft.com/en-us/library/ff701716.aspx
      var url = this._url.path + "/Imagery/Metadata/" + this.mapStyle;
          
      //if (this.serverToken && this.clientToken) {
      if (this.bingMapsKey) {
        var info = this.resourceInfo;
        if (!this.loaded && info) {
          this._initLayer(info);
        }
        else {
          request({
            url: url,
            //ss: When set to true, the HTTP Status returned is 200 OK for all responses, 
            //including when there are errors. 
            //The content of the response always contains the actual HTTP Status.
            //Here is the doc from MSDN: http://msdn.microsoft.com/en-us/library/ff701701.aspx
            content: lang.mixin({}, { 
              key: this.bingMapsKey, 
              ss: true, 
              c: this.culture,
              include: this.hasAttributionData ? "imageryProviders" : null
            }),
            callbackParamName: "jsonp",
            load: this._initLayer,
            error: this._errorHandler
          });
        }
      }
    },

    _initLayer: function(response, io) {
      //Information about the responded meta structure:
      //http://msdn.microsoft.com/en-us/library/ff701712.aspx
      //The adatpor has been abandoned. Here is the document of the changes: 
      //http://mediawikidev.esri.com/index.php/JSAPI/Bing_REST_API_for_VETiledLayer

      if (response.statusCode !== 200) {
        // key seems invalid
        var error = new Error();
        error.code = response.statusCode;
        error.message = response.statusDescription;
        error.details = response.errorDetails;
        error.authenticationResultCode = response.authenticationResultCode;
        this.onError(error);
        return;
      } 

      try {
        // See Layer::getResourceInfo (layer.js) for more context 
        this.resourceInfo = JSON.stringify(response);
        var resource = response.resourceSets[0].resources[0];
        //var urlObject = esri.urlToObject(response.imageUri);
        var dojoParameterizedUrl = resource.imageUrl.replace("{","${");

        this.tileServers = array.map(resource.imageUrlSubdomains, function(tileServer){
          var protocol = window.location.protocol;
          if (protocol === "file:") {
            protocol = "http:";
          }
          return string.substitute(dojoParameterizedUrl, { subdomain:tileServer }).replace("http:", protocol);
        });
      
        //fire onLoad for TileMapServiceLayer to process layer
        //custom properties for roundrobin/tileServers
        this._tsLength = this.tileServers.length;
        //this._tsIndex = 0;

        if (! this.loaded) {
          // TODO
          // Need to localize this copyright text (see arcgisonline.js)
          // Needs to be updated every January!
          this.copyright = this.copyright || 
                           "&copy; 2012 Microsoft Corporation and its data suppliers";

          this.loaded = true;
          this.onLoad(this);

          var callback = this.loadCallback;
          if (callback) {
            delete this.loadCallback;
            callback(this);
          }
        }
        else {
          this.refresh();
          this.onMapStyleChange();
        }
      }
      catch (e) {
        this.onError(e);
      }
    },
    
    getAttributionData: function() {
      var dfd = new Deferred(), resourceInfo = JSON.parse(this.resourceInfo),
          providers;
      
      if (this.hasAttributionData && resourceInfo) {
        providers = lang.getObject("resourceSets.0.resources.0.imageryProviders", false, resourceInfo);
      }
      
      if (providers) {
        dfd.callback({ contributors: providers });
      }
      else {
        var err = new Error("Layer does not have attribution data");
        err.log = config.isDebug;
        
        dfd.errback(err);
      }
      
      return dfd.promise;
    },

    getTileUrl: function(level, row, col) {
      return string.substitute(
        this.tileServers[row % this._tsLength].replace(/\{/g,"${"),
        {
          quadkey: this._getQuadKey(level, row, col),
          culture: this.culture,
          token:   this.bingMapsKey
        }
      );
    },

    _getQuadKey: function(level, row, col) {
      var quadKey = "",
          digit, mask, i;
          
      for (i=level; i>0; i--) {
        digit = '0';
        mask = 1 << (i - 1);

        if ((col & mask) != 0) {
          digit++;
        }
        if ((row & mask) != 0) {
          digit++;
          digit++;
        }
        quadKey = quadKey + digit;
      }
      return quadKey;
    },

    /*_updateTokens: function() {
      clearTimeout(this._updateTokenTimer);

      var tokenDur = this.tokenDuration,
          tokenUrl = this._tokenUrl.path,
          clientParams = dojo.mixin(this._tokenUrl.params, { iptype:"client", environment:this.environment, duration:tokenDur }),
          _updateClientToken = this._updateClientToken,
          serverParams = dojo.mixin(this._tokenUrl.params, { iptype:"server", environment:this.environment, duration:tokenDur })
          _updateServerToken = this._updateServerToken,
          _errorHandler = this._errorHandler;
    
      esri.request({
        url: tokenUrl,
        content: clientParams,
        callbackParamName: "callback",
        load: _updateClientToken,
        error: _errorHandler
      });
    
      esri.request({
        url: tokenUrl,
        content: serverParams,
        callbackParamName: "callback",
        load: _updateServerToken,
        error: _errorHandler
      });

      this._updateTokenTimer = setTimeout(this._updateTokens, ((tokenDur - 1) * 60 * 1000));
    },

    _updateClientToken: function(response, io) {
      this.setClientToken(response.token);
      if (! this.loaded) {
        this._getTileInfo();
      }
    },
    
    _updateServerToken: function(response, io) {
      this.setServerToken(response.token);
      if (! this.loaded) {
        this._getTileInfo();
      }
    },
    */
    
    setMapStyle: function(/*String*/ style) {
      this.mapStyle = style;
      this._getTileInfo();
    },
    
    setCulture: function(/*String*/ culture) {
      this.culture = culture;
      this._getTileInfo();
    },
    
    /*setClientToken: function(token) {
      this.clientToken = token;
    },
    
    setServerToken: function(token) {
      this.serverToken = token;
    }
    */
    setBingMapsKey: function(bingMapsKey){
        this.bingMapsKey = bingMapsKey;
    },
    
    onMapStyleChange: function() {}
  });

  lang.mixin(VET, {
    MAP_STYLE_AERIAL: "aerial", 
    MAP_STYLE_AERIAL_WITH_LABELS: "aerialWithLabels", 
    MAP_STYLE_ROAD: "road"
  });

  

  return VET;
});
