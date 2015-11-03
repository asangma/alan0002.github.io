define(
  [
    "dojo/_base/url",

    "../../config",
    "../../core/declare",
    "../../core/urlUtils",
    "../../core/promiseUtils",

    "../../request"
  ],
  function(
    URL,
    esriConfig, declare, urlUtils, promiseUtils,
    esriRequest
  ) {
    var VectorTiledLayerLoader = declare([], {
      /**
       * Fetches all metadata needed to create a VectorTiledLayer.
       *   urlOrObject can be an ArcGIS Server vector tile service url,
       *   a url to a style file, or a style object
       * @param {string | Object} urlOrObject
       * @return {*} promise
       */
      loadMetadata: function(urlOrObject){
        var normalizedUrl;
        return promiseUtils.resolve(urlOrObject)
          .then(function() {
            if (typeof urlOrObject !== "string") {
              return urlOrObject;
            }
            else {
              //strip trailing slash from url so relative urls resolve correctly
              normalizedUrl = urlUtils.normalize(urlOrObject).replace(/\/*$/, "");
              this._corsify(normalizedUrl);
              return esriRequest({
                url: normalizedUrl,
                content: {f: "json"},
                handleAs: "json"
              });
            }
          }.bind(this))
          .then(function(metadata){
            return this._processMetadata(normalizedUrl, metadata);
          }.bind(this));
      },

      //---------------------------------
      // Private Methods
      //---------------------------------

      _configureStyle: function(options){
        var layerDefinition = options.layerDefinition,
          style = options.style,
          serviceUrl = options.serviceUrl,
          styleUrl = options.styleUrl;

        if(layerDefinition && style && style.sources.esri){
          //make source object with properties specific to esri source
          var tilejson = (layerDefinition.tilejson) || "2.0.0";
          var format = (layerDefinition.tileInfo && layerDefinition.tileInfo.format) || "pbf";
          var indexUrl = layerDefinition.tileMap ? this._getAbsolutePath(layerDefinition.tileMap, serviceUrl) : null;
          style.sources.esri = {
            type: "vector",
            scheme: "xyz",
            tilejson: tilejson,
            format: format,
            index: indexUrl,
            tiles: this._getTileServers(layerDefinition.tiles, serviceUrl),
            description: layerDefinition.description,
            name: layerDefinition.name
          };

          //set paths to sprite and glyphs
          style.glyphs = this._getAbsolutePath(style.glyphs, styleUrl);
          style.sprite = this._getAbsolutePath(style.sprite, styleUrl);

          this._corsify(style.glyphs);
          this._corsify(style.sprite);
        }
        return {
          style: style,
          layerDefinition: layerDefinition
        };
      },

      _corsify: function(url) {
        var corsEnabledServers = esriConfig.request.corsEnabledServers;
        url = new URL(url);
        url = (url.host + (url.port ? (":" + url.port) : "")).toLowerCase();
        if (!urlUtils.canUseXhr(url)) {
          if (corsEnabledServers.indexOf(url) === -1) {
            corsEnabledServers.push(url);
          }
        }
      },

      _getAbsolutePath: function(partialUrl, fullUrl){
        var  resolvedUrl;
        fullUrl = fullUrl || "";

        if (!/^https?:\/\//i.test(partialUrl)) {
          //check for schemeless url
          if (partialUrl.indexOf("//") === 0) {
            return location.protocol + partialUrl;
          }

          //strip filename from full url and make sure that url has trailing slash
          fullUrl = fullUrl.replace(/(\/+\w+\.\w+)$/, "");

          if(!/\/+$/.test(fullUrl)){
            fullUrl += "/";
          }
          //Check for single slash. ArcGIS Server metadata uses single slash to
          // specify relative path to root service url. For instance '/defaultStyles'
          if (partialUrl.indexOf("/") === 0) {
            partialUrl = partialUrl.substring(1);
            resolvedUrl = fullUrl + partialUrl;
          }
          else{
            //just tack partial onto fullUrl
            resolvedUrl = fullUrl + partialUrl;
          }

        }
        else {
          resolvedUrl = partialUrl;
        }

        //make sure not going from https page to http url
        var host = resolvedUrl.match(/^http/);
        if(host && location.protocol.indexOf("https") === 0){
          console.log(resolvedUrl.replace(/^http:/i), "https:");
          resolvedUrl = resolvedUrl.replace(/^http:/i, "https:");
        }
        return resolvedUrl;
      },

      //converts relative tile paths to absolute
      _getTileServers: function(tilesArray, serviceUrl) {
        tilesArray = tilesArray || [];

        var resolvedTileServers = [];
        for (var i = 0, n = tilesArray.length; i < n; i++) {
          var url = this._getAbsolutePath(tilesArray[i], serviceUrl);
          this._corsify(url);
          resolvedTileServers.push(this._getAbsolutePath(tilesArray[i], serviceUrl));
        }
        return resolvedTileServers;
      },

      _processMetadata: function(baseUrl, responseJson){
        var layerDefinition,
          style = {},
          serviceUrl,
          styleUrl;

        //currentVersion property is flag that the response is Vector Tile Service json
        if(responseJson.currentVersion) {
          layerDefinition = responseJson;
          serviceUrl = baseUrl;
          styleUrl = this._getAbsolutePath(responseJson.defaultStyles, serviceUrl);
          this._corsify(styleUrl);

          //get style json
          return esriRequest({
            url: styleUrl,
            content: {f: "json"},
            handleAs: "json"
          }).then(function (response) {
            style = response;
            return this._configureStyle({
              style: style,
              layerDefinition: layerDefinition,
              styleUrl: styleUrl,
              serviceUrl: serviceUrl
            });
          }.bind(this));
        }
        else {
          style = responseJson;
          styleUrl = baseUrl;

          //sources.esri property is flag that the source is an ArcGIS vector tile service
          //so need to get service metadata so can set tile urls and tile index
          if (responseJson.sources.esri && responseJson.sources.esri.url) {
            serviceUrl = this._getAbsolutePath(responseJson.sources.esri.url, styleUrl);
            this._corsify(serviceUrl);
            return esriRequest({
              url: serviceUrl,
              content: {f: "json"},
              handleAs: "json"
            }).then(function (response) {
              layerDefinition = response;
              return this._configureStyle({
                style: style,
                layerDefinition: layerDefinition,
                styleUrl: styleUrl,
                serviceUrl: serviceUrl
              });
            }.bind(this));
          }
          else {
            this._configureStyle({
              style: style
            });
          }
        }
      }
    });
    return VectorTiledLayerLoader;
  });
