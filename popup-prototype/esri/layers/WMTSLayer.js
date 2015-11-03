define(
[
  "dojo/_base/kernel",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/sniff",
  "dojox/xml/parser", // TODO: Eliminate this dependency
  
  "../core/lang",
  "../request",
  "../geometry/support/WKIDUnitConversion",
  "../geometry/SpatialReference",
  
  "../geometry/Point",
  "../geometry/Extent",
  "../geometry/support/webMercatorUtils",
  "./TiledLayer",
  "./support/TileInfo",
  "./support/WMTSLayerInfo",
  
  "dojo/query" // TODO: return value not used. we're using dojo.query
],
function(
  dojoNS, declare, lang, array, has, XMLParser,
  esriLang, esriRequest, WKIDUnitConversion, SpatialReference, 
  Point, Extent, webMercatorUtils, TiledLayer, TileInfo, WMTSLayerInfo,

  query_
) {

  var WMTSLayer = declare([TiledLayer], {
    declaredClass: "esri.layers.WMTSLayer",
    
    copyright: null,
    extent: null,
    tileUrl: null,
    spatialReference: null,
    tileInfo: null,
    constructor: function (url, options) {
      this.version = "1.0.0";
      this.tileUr = this._url = url;
      this.serviceMode = "RESTful";
      this._parseCapabilities = lang.hitch(this, this._parseCapabilities);
      this._getCapabilitiesError = lang.hitch(this, this._getCapabilitiesError);
      if (!options) {
        options = {};
      }
      if (options.serviceMode) {
        if (options.serviceMode === "KVP" || options.serviceMode === "RESTful") {
          this.serviceMode = options.serviceMode;
        } else {
          console.error("WMTS mode could only be 'KVP' or 'RESTful'");        
          return;
        }
      }
      
      this.layerInfo = new WMTSLayerInfo();
      if (options.layerInfo) {
        this.layerInfo = options.layerInfo;
        this._identifier = options.layerInfo.identifier;
        this._tileMatrixSetId = options.layerInfo.tileMatrixSet;
        if (options.layerInfo.format) {
          this.format = "image/" + options.layerInfo.format;
        }
        this._style = options.layerInfo.style;
        this.title = options.layerInfo.title;
        this._dimension = options.layerInfo.dimension;
      }
  
      if (options.resourceInfo) {
        this.version = options.resourceInfo.version;
        if (options.resourceInfo.getTileUrl) {
          this._url = this.tileUrl = options.resourceInfo.getTileUrl;
        }
        this.copyright = options.resourceInfo.copyright;
        this.layerInfos = options.resourceInfo.layerInfos;
        this._parseResourceInfo();
        this.loaded = true;
        this.onLoad(this);
      } else {
        this._getCapabilities();
      }
  
      this._formatDictionary = {
        "image/png": ".png",
        "image/png8": ".png",
        "image/png24": ".png",
        "image/png32": ".png",
        "image/jpg": ".jpg",
        "image/jpeg": ".jpeg",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/tiff": ".tif",
        "image/jpgpng": "", // no extension for jpgpng format
        "image/jpegpng": "",
        "image/unknown": ""
      };
    },
  
    setActiveLayer: function (layerInfo) {
      //keep setActiveLayer for backwards compatibility
      //new users should use setVisibleLayer.
      this.setVisibleLayer(layerInfo);
    },
    
    setVisibleLayer: function (layerInfo) {
      this._setActiveLayer(layerInfo);
      this.refresh(true);
    },
  
    getTileUrl: function (level, row, col) {
      level = this._levelToLevelValue[level];
      
      var tileUrl;
      if (this.resourceUrls && this.resourceUrls.length > 0) {      
        tileUrl = this.resourceUrls[row % this.resourceUrls.length]
                      .template
                      .replace(/\{Style\}/gi, this._style)
                      .replace(/\{TileMatrixSet\}/gi, this._tileMatrixSetId)
                      .replace(/\{TileMatrix\}/gi, level)
                      .replace(/\{TileRow\}/gi, row)
                      .replace(/\{TileCol\}/gi, col)
                      .replace(/\{dimensionValue\}/gi, this._dimension);
      }
      else {
        tileUrl = this.UrlTemplate.replace(/\{level\}/gi, level)
                                  .replace(/\{row\}/gi, row)
                                  .replace(/\{col\}/gi, col);
      }
      
      tileUrl = this.addTimestampToURL(tileUrl);
      
      return tileUrl;
    },
    
    getTileUrlTemplate: function(layerInfo){
      var currentLayerInfo,
          identifier = layerInfo.identifier,
          tileMatrixSet = layerInfo.tileMatrixSet,
          format = layerInfo.format,
          style = layerInfo.style,
          dimension = layerInfo.dimension;
      if (!identifier) {
        currentLayerInfo = this.layers[0];
        identifier = this.layers[0].identifier;
      }
      else {
        currentLayerInfo = array.filter(this.layers, function(item){return item.identifier === identifier;})[0];
      }
      if (!currentLayerInfo) {
        console.error("couldn't find the layer " + identifier);
        this.onError(new Error("couldn't find the layer " + identifier));
        return ;
      }
      
      if (!format) {
        format = currentLayerInfo.formats[0];
        if (format.indexOf("image/") === -1) {
          format = "image/" + format;
        }
      }
      else {
        if (format.indexOf("image/") === -1) {
          format = "image/" + format;
        }
        if (array.indexOf(currentLayerInfo.formats, format) === -1) {
          console.error("The layer doesn't support the format of " + format);
          this.onError(new Error("The layer doesn't support the format of " + format));
          return ;
        }      
      }
      
      if (!style) {
        style = currentLayerInfo.styles[0];
      }    
      else {
        if (array.indexOf(currentLayerInfo.styles, style) === -1) {
          console.error("The layer doesn't support the style of " + style);
          this.onError(new Error("The layer doesn't support the style of " + style));
          return ;
        }      
      }

      if (!dimension && currentLayerInfo.dimensions) {
        dimension = currentLayerInfo.dimensions[0];
      }
      else {
        if (array.indexOf(currentLayerInfo.dimensions, dimension) === -1) {
          console.error("The layer doesn't support the dimension of " + dimension);
          this.onError(new Error("The layer doesn't support the dimension of " + dimension));
          return ;
        }
      }
      
      var currentTileMatrixInfo;
      if (!tileMatrixSet) {
        //if user doesn't provide tileMatrixSetId, search for "GoogleMapsCompatible",
        //then, use the first one.  
        currentTileMatrixInfo = array.filter(currentLayerInfo.tileMatrixSetInfos, function(item){return item.tileMatrixSet === "GoogleMapsCompatible";})[0];
        if (!currentTileMatrixInfo) {
          currentTileMatrixInfo = currentLayerInfo.tileMatrixSetInfos[0];
        }
        tileMatrixSet = currentTileMatrixInfo.tileMatrixSet;
      } 
      else {
        currentTileMatrixInfo = array.filter(currentLayerInfo.tileMatrixSetInfos, function(item){return item.tileMatrixSet === tileMatrixSet;})[0];
        if (!currentTileMatrixInfo){
          console.error("The tileMatrixSetId " + tileMatrixSet + " is not supported by the layer of " + identifier);
          this.onError(new Error("The tileMatrixSetId " + tileMatrixSet + " is not supported by the layer of " + identifier));
          return ;
        }
      }
      
      return this._getTileUrlTemplate(identifier, tileMatrixSet, format, style, dimension);
    },
    
    _getTileUrlTemplate: function(identifier, tileMatrixSet, format, style, dimension){
      var template;
      if (!identifier) {
        identifier = this._identifier;
      }
      if (!tileMatrixSet) {
        tileMatrixSet = this._tileMatrixSetId;
      }
      if (!format) {
        format = this.format;
      }
      if (!style) {
        style = this._style;
      }
      
      if (this.resourceUrls && this.resourceUrls.length > 0) {
        template = this.resourceUrls[0].template;
        //for some specific services, it adds .xxx at the end. remove it.
        if (template.indexOf(".xxx") === template.length - 4) {
          template = template.slice(0, template.length - 4);
        }
        template = template.replace(/\{Style\}/gi, style);
        template = template.replace(/\{TileMatrixSet\}/gi, tileMatrixSet);
        template = template.replace(/\{TileMatrix\}/gi, "{level}");
        template = template.replace(/\{TileRow\}/gi, "{row}");
        template = template.replace(/\{TileCol\}/gi, "{col}");
        template = template.replace(/\{dimensionValue\}/gi, dimension);
        return template;
      }
      
      if (this.serviceMode === "KVP") {
        template = this._url + 
                   "SERVICE=WMTS&VERSION=" + this.version + 
                   "&REQUEST=GetTile" + 
                   "&LAYER=" + identifier + 
                   "&STYLE=" + style + 
                   "&FORMAT=" + format + 
                   "&TILEMATRIXSET=" + tileMatrixSet + 
                   "&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}";
      } else if (this.serviceMode === "RESTful") {
        var imagePostfix = "";
        if (this._formatDictionary[format.toLowerCase()]) {
          imagePostfix = this._formatDictionary[format.toLowerCase()];
        }
        template = this._url + identifier + "/" + style + "/" + tileMatrixSet + "/{level}/{row}/{col}" + imagePostfix;
      }
      
      return template;
    },
  
    _parseResourceInfo: function () {
      var layerInfos = this.layerInfos, i;
      if (this.serviceMode === "KVP") {
        this._url += (this._url.indexOf("?") > -1) ? "" : "?";
      }
      
      for (i = 0; i < layerInfos.length; i++) {
        if ((!this._identifier || layerInfos[i].identifier === this._identifier) && (!this.title || layerInfos[i].title === this.title) && (!this._tileMatrixSetId || layerInfos[i].tileMatrixSet === this._tileMatrixSetId) && (!this.format || "image/" + layerInfos[i].format === this.format) && (!this._style || layerInfos[i].style === this._style)) {
          lang.mixin(this, {"description": layerInfos[i].description, tileInfo: layerInfos[i].tileInfo, spatialReference: layerInfos[i].tileInfo.spatialReference, fullExtent: layerInfos[i].fullExtent, initialExtent: layerInfos[i].initialExtent, _identifier: layerInfos[i].identifier, _tileMatrixSetId: layerInfos[i].tileMatrixSet, format: "image/" + layerInfos[i].format, _style: layerInfos[i].style});
          break;
        }
      }
      
      this._setActiveLayer();
      //_setActiveLayer doesn't return the necessary values for the case where resourceInfo is provided.
      this.UrlTemplate = this._getTileUrlTemplate();
      this._levelToLevelValue = [];
      array.forEach(this.tileInfo.lods, function(item){
        this._levelToLevelValue[item.level] = item.levelValue? item.levelValue: item.level;
      }, this);
    },
  
    _getCapabilities: function () {
      var capabilitiesUrl;
      if (this.serviceMode === "KVP") {
        if (this._url.indexOf("?") > -1) {
          capabilitiesUrl = this._url + "&request=GetCapabilities&service=WMTS&version=" + this.version;
        }
        else {
          capabilitiesUrl = this._url + "?request=GetCapabilities&service=WMTS&version=" + this.version;
        }
      } else if (this.serviceMode === "RESTful") {
        capabilitiesUrl = this._url + "/" + this.version + "/WMTSCapabilities.xml";
      }
  
      esriRequest({
        url: capabilitiesUrl,
        handleAs: "text",
        load: this._parseCapabilities,
        error: this._getCapabilitiesError
      });
    },
  
    _parseCapabilities: function (xmlText) {
      xmlText = xmlText.replace(/ows:/gi, "");
      var xml = XMLParser.parse(xmlText);
      var contents = dojoNS.query("Contents", xml)[0];
      if (!contents) {
        console.error("The WMTS capabilities XML is not valid");
        this.onError(new Error("The WMTS capabilities XML is not valid"));
        return ;
      }
  
         //find the url for getTile operation
      var metaData = dojoNS.query("OperationsMetadata", xml)[0],
          getTile = dojoNS.query("[name='GetTile']", metaData)[0],
          tileUrl = this._url,
          tileUrlXMLs = dojoNS.query("Get", getTile),
          i;
         
      for (i=0; i < tileUrlXMLs.length; i++) {
        var constraintElement = dojoNS.query("Constraint", tileUrlXMLs[i])[0];
        if (!constraintElement || this._getTagWithChildTagValue("AllowedValues", "Value", this.serviceMode, constraintElement)) {
          tileUrl = tileUrlXMLs[i].attributes[0].nodeValue;
          break ;
        }
      }
      
      if (tileUrl.indexOf("/1.0.0/") === -1 && this.serviceMode === "RESTful") {
        tileUrl += "/";
      }
      if (this.serviceMode === "KVP") {
        tileUrl += (tileUrl.indexOf("?") > -1) ? "" : "?";
      }
      this._url = tileUrl;
      
      //find copyright info according to AccessConstraints
      this.copyright = this._getTagValues("Capabilities>ServiceIdentification>AccessConstraints", xml)[0];
  
      var layers = dojoNS.query("Layer", contents),
          identifier, identifiers = [];
          
      this.layers = [];
      array.forEach(layers, function(layer){
        identifier = this._getTagValues("Identifier", layer)[0];
        identifiers.push(identifier);
        this.layers.push(this._getWMTSLayerInfo(identifier, layer, contents));
      }, this);
  
      this._setActiveLayer();
  
      this.loaded = true;
      this.onLoad(this);
    },
    
    _setActiveLayer: function(layerInfo){
      if (!layerInfo) {
        layerInfo = {};
      }
      if (layerInfo.identifier) {
        this._identifier = layerInfo.identifier;
      }
      if (layerInfo.tileMatrixSet) {
        this._tileMatrixSetId = layerInfo.tileMatrixSet;
      }
      if (layerInfo.format) {
        this.format = layerInfo.format;
      }
      if (layerInfo.style) {
        this._style = layerInfo.style;
      }
      if (layerInfo.dimension) {
        this._dimension = layerInfo.dimension;        
      }
      
      if (!this.layers) {
        //the case when user provide the resourceInfo
        //so the it doesn't fetch the capabilities file.
        return ;
      }
      
      var currentLayerInfo;
      if (!this._identifier) {
        currentLayerInfo = this.layers[0];
        this._identifier = this.layers[0].identifier;
      }
      else {
        currentLayerInfo = array.filter(this.layers, function(item){return item.identifier === this._identifier;}, this)[0];
      }
      if (!currentLayerInfo) {
        console.error("couldn't find the layer " + this._identifier);
        this.onError(new Error("couldn't find the layer " + this._identifier));
        return ;
      }
      
      if (!this.format) {
        this.format = currentLayerInfo.formats[0];
        if (this.format.indexOf("image/") === -1) {
          this.format = "image/" + this.format;
        }
      }
      else {
        if (this.format.indexOf("image/") === -1) {
          this.format = "image/" + this.format;
        }
        if (array.indexOf(currentLayerInfo.formats, this.format) === -1) {
          console.error("The layer doesn't support the format of " + this.format);
          this.onError(new Error("The layer doesn't support the format of " + this.format));
          return ;
        }      
      }
      
      if (!this._style) {
        this._style = currentLayerInfo.styles[0];
      }    
      else {
        if (array.indexOf(currentLayerInfo.styles, this._style) === -1) {
          console.error("The layer doesn't support the style of " + this._style);
          this.onError(new Error("The layer doesn't support the style of " + this._style));
          return ;
        }      
      }

      if (!this._dimension && currentLayerInfo.dimensions) {
        this._dimension = currentLayerInfo.dimensions[0];
      }
      else {
        if (array.indexOf(currentLayerInfo.dimensions, this._dimension) === -1) {
          console.error("The layer doesn't support the dimension of " + this._dimension);
          this.onError(new Error("The layer doesn't support the dimension of " + this._dimension));
          return ;
        }
      }
      
      var currentTileMatrixInfo;
      if (!this._tileMatrixSetId) {
        //if user doesn't provide tileMatrixSetId, search for "GoogleMapsCompatible",
        //then, use the first one.  
        currentTileMatrixInfo = array.filter(currentLayerInfo.tileMatrixSetInfos, function(item){return item.tileMatrixSet === "GoogleMapsCompatible";})[0];
        if (!currentTileMatrixInfo) {
          currentTileMatrixInfo = currentLayerInfo.tileMatrixSetInfos[0];
        }
        this._tileMatrixSetId = currentTileMatrixInfo.tileMatrixSet;
      } 
      else {
        currentTileMatrixInfo = array.filter(currentLayerInfo.tileMatrixSetInfos, function(item){return item.tileMatrixSet === this._tileMatrixSetId;}, this)[0];
        if (!currentTileMatrixInfo){
          console.error("The tileMatrixSetId " + this._tileMatrixSetId + " is not supported by the layer of " + this._identifier);
          this.onError(new Error("The tileMatrixSetId " + this._tileMatrixSetId + " is not supported by the layer of " + this._identifier));
          return ;
        }
      }
      
      this.description = currentLayerInfo.description;
      this.title = currentLayerInfo.title;
      this.spatialReference = currentTileMatrixInfo.tileInfo.spatialReference;    
      this.tileInfo = currentTileMatrixInfo.tileInfo;
      this._levelToLevelValue = [];
      array.forEach(this.tileInfo.lods, function(item){
        this._levelToLevelValue[item.level] = item.levelValue? item.levelValue: item.level;
      }, this);
      
      if (this.spatialReference.wkid === 102100 || this.spatialReference.wkid === 102113) {
        this.fullExtent = this.initialExtent = webMercatorUtils.geographicToWebMercator(currentLayerInfo.gcsExtent);
      }
      else if (this.spatialReference.wkid === 4326) {
        this.fullExtent = this.initialExtent = currentLayerInfo.gcsExtent;
      }
      else {
        this.fullExtent = currentTileMatrixInfo.fullExtent;
        this.initialExtent = currentTileMatrixInfo.initialExtent;
      }
      
      this.resourceUrls = currentLayerInfo.resourceUrls;
      this.UrlTemplate = this._getTileUrlTemplate();
      
      this.layerInfo = {
        "identifier": this._identifier,
        "tileMatrixSet": this._tileMatrixSetId,
        "format": this.format,
        "style": this._style,
        "fullExtent": this.fullExtent,
        "initialExtent": this.initialExtent,
        "tileInfo": this.tileInfo,
        "title": this.title,
        "description": this.description
      };
    },
    
    _getWMTSLayerInfo: function(identifier, layer, contents){
      var description = this._getTagValues("Abstract", layer)[0],
          title = this._getTagValues("Title", layer)[0],
          WGS84BoundingBox = dojoNS.query("WGS84BoundingBox", layer)[0],
          lowerCorner = WGS84BoundingBox ? this._getTagValues("LowerCorner", WGS84BoundingBox)[0].split(" ") : ["-180", "-90"],
          upperCorner = WGS84BoundingBox ? this._getTagValues("UpperCorner", WGS84BoundingBox)[0].split(" ") : ["180", "90"],
          xmin = parseFloat(lowerCorner[0]),
          ymin = parseFloat(lowerCorner[1]),
          xmax = parseFloat(upperCorner[0]),
          ymax = parseFloat(upperCorner[1]),
          extent = new Extent(xmin, ymin, xmax, ymax, new SpatialReference({"wkid": 4326})),
          styles = this._getTagValues("Identifier", dojoNS.query("Style", layer)[0]),
          dimension = this._getTagValues("Identifier", dojoNS.query("Dimension", layer)[0]),
          dimensionValue = this._getTagValues("Value", dojoNS.query("Dimension", layer)[0]) || this._getTagValues("Default", dojoNS.query("Dimension", layer)[0]),
          formats = this._getTagValues("Format", layer),
          layerMatrixInfos = this._getLayerMatrixInfos(layer, contents),
          layerInfo = {
            "identifier": identifier,
            "tileMatrixSetInfos": layerMatrixInfos,
            "formats": formats,
            "styles": styles,
            "title": title,
            "description": description,
            "gcsExtent": extent,
            "dimensions": dimensionValue
          },
          resourceUrlsXML = dojoNS.query("ResourceURL", layer),
          resourceUrls = [],
          resourceUrlTemplate;
          
      array.forEach(resourceUrlsXML, function(resourceUrl){
        resourceUrlTemplate = resourceUrl.getAttribute("template");
        if (dimension && dimensionValue) {
          //user can decide what dimension it would be
          resourceUrlTemplate = resourceUrlTemplate.replace("{" + dimension + "}", "{dimensionValue}");
        }
        resourceUrls.push({"template": resourceUrlTemplate,
                           "format": resourceUrl.getAttribute("format"),
                           "resourceType": resourceUrl.getAttribute("resourceType")
                          });
      });
          
      if (resourceUrls && resourceUrls.length > 0) {
        layerInfo.resourceUrls = resourceUrls;
      }
      
      return layerInfo;
    },

    _getLayerMatrixInfos: function(layer, contents) {
      var i, layerMatrixInfos = [];
      if (!this._allMatrixInfos) {
        this._allMatrixInfos = [];
      }
      var layerMatrixSetIds = this._getTagValues("TileMatrixSet", layer);
      if (!layerMatrixSetIds || layerMatrixSetIds.length === 0) {
        return;
      }
      array.forEach(layerMatrixSetIds, function(tileMatrixSetId) {
        var layerMatrixInfo;
        if (this._allMatrixInfos.length > 0) {
          for (i = 0; i < this._allMatrixInfos.length; i++) {
            if (this._allMatrixInfos[i].tileMatrixSet == tileMatrixSetId) {
              layerMatrixInfo = this._allMatrixInfos[i];
              break;
            }
          }
        }
        if (!layerMatrixInfo) {
          layerMatrixInfo = this._getLayerMatrixInfo(tileMatrixSetId, layer, contents);
          this._allMatrixInfos.push(layerMatrixInfo);
        }
        layerMatrixInfos.push(layerMatrixInfo);
      }, this);

      return layerMatrixInfos;
    },
    
    _getLayerMatrixInfo: function(tileMatrixSetId, layer, contents){
        var wkid, rows, cols, i, origin, lod, lods = [];
        var matrixSetLink = this._getTagWithChildTagValue("TileMatrixSetLink", "TileMatrixSet", tileMatrixSetId, layer);
        var layerMatrixIds = this._getTagValues("TileMatrix", matrixSetLink);
        var tileMatrixSet = this._getTagWithChildTagValue("TileMatrixSet", "Identifier", tileMatrixSetId, contents);
        var crs = this._getTagValues("SupportedCRS", tileMatrixSet)[0];

        wkid = parseInt(crs.split(":").pop(), 10);
        if (wkid == 900913 || wkid == 3857) {
          wkid = 102100;
        }
        
        var isOGCCRS;
        
        if (crs.toLowerCase().indexOf("crs84") > -1 || crs.toLowerCase().indexOf("crs:84") > -1) {
          wkid = 4326;
          isOGCCRS = true;
        }
        else if (crs.toLowerCase().indexOf("crs83") > -1 || crs.toLowerCase().indexOf("crs:83") > -1) {
          wkid = 4269;
          isOGCCRS = true;
        }
        else if (crs.toLowerCase().indexOf("crs27") > -1 || crs.toLowerCase().indexOf("crs:27") > -1) {
          wkid = 4267;
          isOGCCRS = true;
        }

        var spatialReference = new SpatialReference({
          "wkid": wkid
        });
  
        var firstTileMatrix = dojoNS.query("TileMatrix", tileMatrixSet)[0];
        rows = parseInt(this._getTagValues("TileWidth", firstTileMatrix)[0], 10);
        cols = parseInt(this._getTagValues("TileHeight", firstTileMatrix)[0], 10);
        var topLeft = this._getTagValues("TopLeftCorner", firstTileMatrix)[0].split(" "),
          top = topLeft[0],
          left = topLeft[1];
        if (top.split("E").length > 1) {
          var topNumbers = top.split("E");
          top = topNumbers[0] * Math.pow(10, topNumbers[1]);
        }
        if (left.split("E").length > 1) {
          var leftNumbers = left.split("E");
          left = leftNumbers[0] * Math.pow(10, leftNumbers[1]);
        }
        
        top = parseFloat(top);
        left = parseFloat(left);
        
        // Check if we're looking at a OGC CRS with TopLeftCorner in the 
        // wrong order i.e. "Y X"
        var badCoordsOrder = (
          isOGCCRS && wkid === 4326 && 
          // Unfortunately "90.000 -180.000" is the one value that we can 
          // identify for sure.
          top === 90 && left === -180
        );
        
        //for those wkids in the _flippingAxisForWkids range,
        //it needs to flip the x,y order
        for (i = 0; i < this._flippingAxisForWkids.length; i++){
          if (
            (
              crs.split(":").pop() >= this._flippingAxisForWkids[i][0] && 
              crs.split(":").pop() <= this._flippingAxisForWkids[i][1]
            ) ||
            // We should parse these OGC CRSs in "Y X" order only if we know   
            // they are written in wrong order (see badCoordsOrder above):
            //  urn:ogc:def:crs:OGC:1.3:CRS84
            //  urn:ogc:def:crs:OGC:1.3:CRS83
            //  urn:ogc:def:crs:OGC:1.3:CRS27
            ( wkid === 4326 && (!isOGCCRS || badCoordsOrder) )
          ) {
            if (wkid === 4326 && top > 90) {
              top = "90";
            }
            origin = new Point(left, top, spatialReference);
            break ;
          }
        }
        
        if (i === this._flippingAxisForWkids.length) {
          // TopLeftCorner = "X Y"
          origin = new Point(top, left, spatialReference);
        }
        
        //find lod information, including level, scale and resolution for each level
        if (layerMatrixIds.length === 0) {
          var tileMatrixes = dojoNS.query("TileMatrix", tileMatrixSet);
          for (i = 0; i < tileMatrixes.length; i++) {
            lod = this._getLodFromTileMatrix(tileMatrixes[i], wkid, i);
            lods.push(lod);
          }
        } else {
          for (i = 0; i < layerMatrixIds.length; i++) {
            var tileMatrix = this._getTagWithChildTagValue("TileMatrix", "Identifier", layerMatrixIds[i], tileMatrixSet);
            lod = this._getLodFromTileMatrix(tileMatrix, wkid, i);
            lods.push(lod);
          }
        }
  
        var tileMatrixSetBoundingBox = dojoNS.query("BoundingBox", tileMatrixSet)[0], bboxLowerCorner, bboxUpperCorner,
            xmin, xmax, ymin, ymax, extent, fullExtent, initialExtent;
        if (tileMatrixSetBoundingBox) {
            bboxLowerCorner = this._getTagValues("LowerCorner", tileMatrixSetBoundingBox)[0].split(" ");
            bboxUpperCorner = this._getTagValues("UpperCorner", tileMatrixSetBoundingBox)[0].split(" ");
        }
        if (bboxLowerCorner && bboxLowerCorner.length > 1 && bboxUpperCorner && bboxUpperCorner.length > 1) {
            xmin = parseFloat(bboxLowerCorner[0]);
            ymin = parseFloat(bboxLowerCorner[1]);
            xmax = parseFloat(bboxUpperCorner[0]);
            ymax = parseFloat(bboxUpperCorner[1]);
        }
        else {
          var matrixWidth = this._getTagValues("MatrixWidth", firstTileMatrix)[0],
              matrixHeight = this._getTagValues("MatrixHeight", firstTileMatrix)[0];
          xmin = origin.x;
          ymax = origin.y;
          xmax = xmin + matrixWidth * cols * lods[0].resolution;
          ymin = ymax - matrixHeight * rows * lods[0].resolution;        
        }
        extent = new Extent(xmin, ymin, xmax, ymax, spatialReference);
        fullExtent = initialExtent = extent;
          
        var tileInfo = new TileInfo({
          "dpi": 90.71428571428571,
          "spatialReference": spatialReference,
          "format": this.format,
          "rows": rows,
          "cols": cols,
          "origin": origin,
          "lods": lods
        });
        var layerMatrixInfo = {
          "tileMatrixSet": tileMatrixSetId,
          "fullExtent": fullExtent,
          "initialExtent": initialExtent,
          "tileInfo": tileInfo
        };
        
        return layerMatrixInfo;
    },
    
    _getCapabilitiesError: function (err) {
      console.error("Failed to get capabilities xml");
      this.onError(err);    
    },
  
    _getLodFromTileMatrix: function (tileMatrix, wkid, level) {
      var id = this._getTagValues("Identifier", tileMatrix)[0];
      var matrixScale = this._getTagValues("ScaleDenominator", tileMatrix)[0];
      if (matrixScale.split("E").length > 1) {
        var scaleNumbers = matrixScale.split("E");
        matrixScale = scaleNumbers[0] * Math.pow(10, scaleNumbers[1]);
      } else {
        matrixScale = parseFloat(matrixScale);
      }
      var unitConversion;
      if (esriLang.isDefined(WKIDUnitConversion[wkid])) {
        unitConversion = WKIDUnitConversion.values[WKIDUnitConversion[wkid]];
      } else {
        //1 degree equals to a*2*PI/360 meters
        unitConversion = 111194.6519066546;
      }
      var resolution = matrixScale * 7 / 25000 / unitConversion;
      var lod = {
        "level": level,
        "levelValue": id,
        "scale": matrixScale,
        "resolution": resolution
      };
      return lod;
    },
  
    _getTag: function (tagName, xml) {
      var tags = dojoNS.query(tagName, xml);
      if (tags && tags.length > 0) {
        return tags[0];
      } else {
        return null;
      }
    },
  
    _getTagValues: function (tagTreeName, xml) {
      var tagValues = [],
          tagNames = tagTreeName.split(">"),
          tag, values, i;
          
      tag = dojoNS.query(tagNames[0], xml)[0];
      
      if (tagNames.length > 1) {
        for (i = 1; i < tagNames.length - 1; i++) {
          tag = dojoNS.query(tagNames[i], tag)[0];
        }
        values = dojoNS.query(tagNames[tagNames.length - 1], tag);
      } else {
        values = dojoNS.query(tagNames[0], xml);
      }
  
      if (values && values.length > 0) {
        array.forEach(values, function (value) {
          if (has("ie") < 9) {
            tagValues.push(value.childNodes.length ? value.childNodes[0].nodeValue : "");
          } else {
            tagValues.push(value.textContent);
          }
        });
      }
      return tagValues;
    },
  
    _getAttributeValues: function (tagName, attrName, xml) {
      var tags = dojoNS.query(tagName, xml), values = [];
      if (tags && tags.length > 0) {
        array.forEach(tags, function(tag){
          values.push(tag.getAttribute(attrName));
        });      
      }
      return values;
    },
  
    _getTagWithChildTagValue: function (parentTagName, childTagName, tagValue, xml) {
    
//      //work around for arcgis-portal-app issue 565
//      if (parentTagName === "TileMatrix") {
//
//      }
      //find the immediate children with the name of parentTagName
      var children = xml.childNodes,
          childTagValue, j;
          
      for (j = 0; j < children.length; j++) {
        if (children[j].nodeName.indexOf(parentTagName) > -1) {
          //tags.push(children[j]);
          if (has("ie") < 9) {
            if (esriLang.isDefined(dojoNS.query(childTagName, children[j])[0])) {
              childTagValue = dojoNS.query(childTagName, children[j])[0].childNodes[0].nodeValue;
            }
          } else {
            if (esriLang.isDefined(dojoNS.query(childTagName, children[j])[0])) {
              childTagValue = dojoNS.query(childTagName, children[j])[0].textContent;
            }
          }
          if (childTagValue === tagValue || (tagValue.split(":") && childTagValue === tagValue.split(":")[1])) {
            return children[j];
          }
        }
      }    
    },
    
    _flippingAxisForWkids: [
      // This is GCS range that includes GCS 2D/3D and Geocentric
      [3819, 3819], [3821, 3824], [3889, 3889], [3906, 3906],
      [4001, 4025], [4027, 4036], [4039, 4047], [4052, 4055],
      [4074, 4075], [4080, 4081], [4120, 4176], [4178, 4185], [4188, 4216],
      [4218, 4289], [4291, 4304], [4306, 4319], [4322, 4326], [4463, 4463], 
      [4470, 4470], [4475, 4475], [4483, 4483], [4490, 4490], 
      [4555, 4558], [4600, 4646], [4657, 4765], [4801, 4811], [4813, 4821],
      [4823, 4824], [4901, 4904], [5013, 5013], [5132, 5132], [5228, 5229],
      [5233, 5233], [5246, 5246], [5252, 5252], [5264, 5264], [5324, 5340], 
      [5354, 5354], [5360, 5360], [5365, 5365], [5370, 5373], 
      [5381, 5381], [5393, 5393], [5451, 5451], [5464, 5464], [5467, 5467], 
      [5489, 5489], [5524, 5524], [5527, 5527], [5546, 5546], 
      // These are the selected projected coordinate systems that 
      // do require a flip in the coordinate axis
      [2044, 2045], [2081, 2083], [2085, 2086], [2093, 2093],
      [2096, 2098], [2105, 2132], [2169, 2170], [2176, 2180],
      [2193, 2193], [2200, 2200], [2206, 2212], [2319, 2319],
      [2320, 2462], [2523, 2549], [2551, 2735], [2738, 2758],
      [2935, 2941], [2953, 2953], [3006, 3030], [3034, 3035], [3038, 3051], 
      [3058, 3059], [3068, 3068], [3114, 3118], [3126, 3138], [3150, 3151], 
      [3300, 3301], [3328, 3335], [3346, 3346], [3350, 3352],
      [3366, 3366], [3389, 3390], [3416, 3417], 
      [3833, 3841], [3844, 3850], [3854, 3854], [3873, 3885],
      [3907, 3910], [4026, 4026], [4037, 4038], [4417, 4417], [4434, 4434],
      [4491, 4554], [4839, 4839], [5048, 5048], [5105, 5130], [5253, 5259],
      [5269, 5275], [5343, 5349], [5479, 5482], [5518, 5519], [5520, 5520],
      [20004, 20032], [20064, 20092],
      [21413, 21423], [21473, 21483], [21896, 21899], [22171, 22177],
      [22181, 22187], [22191, 22197], [25884, 25884], [27205, 27232],
      [27391, 27398], [27492, 27492], [28402, 28432], [28462, 28492],
      [30161, 30179], [30800, 30800], [31251, 31259], [31275, 31279],
      [31281, 31290], [31466, 31700], [900913, 900913] ]
  });

  
  
  return WMTSLayer;  
});
