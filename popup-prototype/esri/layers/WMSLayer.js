define(
[
  "require",
  "dojo/_base/kernel",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "../request",
  "../core/urlUtils",
  "../geometry/SpatialReference",
  "../geometry/Extent",
  
  "./DynamicLayer",
  
  "./support/WMSLayerInfo"
],
function(
  require, dojoNS, declare, lang, array,
  esriRequest, urlUtils, SpatialReference, Extent,
  DynamicLayer,
  WMSLayerInfo
) {

  var WMSLayer = declare([DynamicLayer], {
    declaredClass: "esri.layers.WMSLayer",
  
    _CRS_TO_EPSG: {
      84: 4326,
      83: 4269,
      27: 4267
    },
    _REVERSED_LAT_LONG_RANGES: [[4001, 4999], [2044, 2045], [2081, 2083], [2085, 2086], [2093, 2093], [2096, 2098], [2105, 2132], [2169, 2170], [2176, 2180], [2193, 2193], [2200, 2200], [2206, 2212], [2319, 2319], [2320, 2462], [2523, 2549], [2551, 2735], [2738, 2758], [2935, 2941], [2953, 2953], [3006, 3030], [3034, 3035], [3058, 3059], [3068, 3068], [3114, 3118], [3126, 3138], [3300, 3301], [3328, 3335], [3346, 3346], [3350, 3352], [3366, 3366], [3416, 3416], [20004, 20032], [20064, 20092], [21413, 21423], [21473, 21483], [21896, 21899], [22171, 22177], [22181, 22187], [22191, 22197], [25884, 25884], [27205, 27232], [27391, 27398], [27492, 27492], [28402, 28432], [28462, 28492], [30161, 30179], [30800, 30800], [31251, 31259], [31275, 31279], [31281, 31290], [31466, 31700]],
    
    _WEB_MERCATOR: [102100, 3857, 102113, 900913],
    _WORLD_MERCATOR: [3395, 54004],
    
    // stores all extents available in the capabilities response
    // position 0 contains the LatLonBoundingBox/EX_GeographicBoundingBox
    allExtents: [],
    
    version: null,
    
    constructor: function(url, options){
    
      var urlObj = urlUtils.urlToObject(url);
      if (urlObj.query && (urlObj.query.version || urlObj.query.Version || urlObj.query.VERSION)) {
        this.version = urlObj.query.version || urlObj.query.Version || urlObj.query.VERSION;
      }
      
      url = this._stripParameters(url, ["version", "service", "request", "bbox", "format", "height", "width", "layers", "srs", "crs", "styles", "transparent", "bgcolor", "exceptions", "time", "elevation", "sld", "wfs"]);
      this.url = url;
      this._url = urlUtils.urlToObject(url);
      this._getCapabilitiesURL = url;
      
      this._initLayer = lang.hitch(this, this._initLayer);
      this._parseCapabilities = lang.hitch(this, this._parseCapabilities);
      this._getCapabilitiesError = lang.hitch(this, this._getCapabilitiesError);
      
      if (options) {
        this.imageFormat = this._getImageFormat(options.format);
        this.imageTransparency = (options.transparent !== false);
        this.visibleLayers = options.visibleLayers ? options.visibleLayers : [];
        // option parameter overwrites URL parameter
        this.version = options.version || this.version;
        if (options.resourceInfo) {
          this._readResourceInfo(options.resourceInfo);
        } else {
          this._getCapabilities();
        }
      } else {
        this.imageFormat = "image/png";
        this.imageTransparency = true;
        this.visibleLayers = [];
        this._getCapabilities();
      }
      
      this._blankImageURL = require.toUrl("../images/pixel.png");
    },
    
    setVisibleLayers: function(visibleLayers){
    
      visibleLayers = this._checkVisibleLayersList(visibleLayers);
      this.visibleLayers = visibleLayers ? visibleLayers : [];
      this.refresh(true);
    },
    
    setImageFormat: function(format){
      this.imageFormat = this._getImageFormat(format);
      this.refresh(true);
    },
    
    setImageTransparency: function(transparent){
      this.imageTransparency = transparent;
      this.refresh(true);
    },
    
    getImageUrl: function(extent, width, height, callback){
    
      if (!this.visibleLayers || this.visibleLayers.length === 0) {
        callback(this._blankImageURL);
        return;
      }
      
      // check if spatial reference in extent matches one of the service supported spatial references in case of Web Mercator
      var wkid = extent.spatialReference.wkid;

      if (array.indexOf(this.spatialReferences, wkid) === -1 && extent.spatialReference.latestWkid) {
        // try latestWkid
        wkid = extent.spatialReference.latestWkid;
      }

      if (array.some(this._WEB_MERCATOR, function(el){
        return el == wkid;
      })) {
        // extent is in Web Mercator
        var common = array.filter(this.spatialReferences, function(el){
          return (array.some(this._WEB_MERCATOR, function(el2){
            return el2 == el;
          }));
        }, this);
        if (common.length === 0) {
          // try world mercator
          common = array.filter(this.spatialReferences, function(el){
            return (array.some(this._WORLD_MERCATOR, function(el2){
              return el2 == el;
            }));
          }, this);
        }
        if (common.length > 0) {
          // make sure we use a service supported id for Web/World Mercator
          wkid = common[0];
        } else {
          // extent is in none of the service supported ids; use the first Mercator id then and hope for the best
          wkid = this._WEB_MERCATOR[0];
        }
      } // else extent not in Web Mercator
      // move used wkid to first position in spatialReferences list
      var list = array.filter(this.spatialReferences, function(el){
        return el !== wkid;
      });
      this.spatialReferences = list;
      this.spatialReferences.unshift(wkid);
      // we don't want to modify the extent object
      var xmin = extent.xmin;
      var xmax = extent.xmax;
      var ymin = extent.ymin;
      var ymax = extent.ymax;
      
      var urlVariables = {};
      urlVariables.SERVICE = "WMS";
      urlVariables.REQUEST = "GetMap";
      urlVariables.FORMAT = this.imageFormat;
      urlVariables.TRANSPARENT = this.imageTransparency ? "TRUE" : "FALSE";
      urlVariables.STYLES = "";
      urlVariables.VERSION = this.version;
      urlVariables.LAYERS = this.visibleLayers ? this.visibleLayers.toString() : null;
      
      // map size
      urlVariables.WIDTH = width;
      urlVariables.HEIGHT = height;
      if (this.maxWidth < width) {
        // change image width and then stretch image
        urlVariables.WIDTH = this.maxWidth;
      }
      if (this.maxHeight < height) {
        // change image height and then stretch image
        urlVariables.HEIGHT = this.maxHeight;
      }
      
      // spatial reference
      var extentWKID = wkid ? wkid : NaN;
      if (!isNaN(extentWKID)) {
        if (this.version == "1.3.0") {
          urlVariables.CRS = "EPSG:" + extentWKID;
        } else {
          urlVariables.SRS = "EPSG:" + extentWKID;
        }
      }
      
      // extent
      if (this.version == "1.3.0" && this._useLatLong(extentWKID)) {
        urlVariables.BBOX = ymin + "," + xmin + "," + ymax + "," + xmax;
      } else {
        urlVariables.BBOX = xmin + "," + ymin + "," + xmax + "," + ymax;
      }
      
      var requestString = this.getMapURL, key;
      requestString += (requestString.indexOf("?") == -1) ? "?" : "";
      for (key in urlVariables) {
        if (urlVariables.hasOwnProperty(key)) {
          requestString += (requestString.substring(requestString.length - 1, requestString.length) == "?") ? "" : "&";
          requestString += key + "=" + urlVariables[key];
        }
      }
      callback(urlUtils.addProxy(requestString));
    },
    
    _initLayer: function(response, io){
    
      this.spatialReference = new SpatialReference(this.extent.spatialReference);
      this.initialExtent = Extent.fromJSON(this.extent);
      this.fullExtent = Extent.fromJSON(this.extent);
      
      this.visibleLayers = this._checkVisibleLayersList(this.visibleLayers);
      
      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },
    
    _readResourceInfo: function(resourceInfo){
    
      // required parameters
      if (!resourceInfo.extent) {
        this._errorHandler(new Error("esri.layers.WMSLayer: Unable to find the 'extent' property in resourceInfo."));
        return;
      }
      if (!resourceInfo.layerInfos) {
        this._errorHandler(new Error("esri.layers.WMSLayer: unable to find the 'layerInfos' property in resourceInfo"));
        return;
      }
      this.extent = resourceInfo.extent;
      this.allExtents[0] = resourceInfo.extent;
      this.layerInfos = resourceInfo.layerInfos;
      
      // optional parameters
      this.description = resourceInfo.description ? resourceInfo.description : "";
      this.copyright = resourceInfo.copyright ? resourceInfo.copyright : "";
      this.title = resourceInfo.title ? resourceInfo.title : "";
      this.getMapURL = resourceInfo.getMapURL ? resourceInfo.getMapURL : this._getCapabilitiesURL;
      this.version = resourceInfo.version ? resourceInfo.version : "1.3.0";
      this.maxWidth = resourceInfo.maxWidth ? resourceInfo.maxWidth : 5000;
      this.maxHeight = resourceInfo.maxHeight ? resourceInfo.maxHeight : 5000;
      this.spatialReferences = resourceInfo.spatialReferences ? resourceInfo.spatialReferences : [];
      this.imageFormat = this._getImageFormat(resourceInfo.format);
      this.setScaleRange(resourceInfo.minScale,resourceInfo.maxScale);
      
      this._initLayer();
    },
    
    _getCapabilities: function(){
      var params = this._url.query ? this._url.query : {};
      params.SERVICE = "WMS";
      params.REQUEST = "GetCapabilities";
      if (this.version) {
        params.VERSION = this.version;
      }
      // we need the params in the URL, otherwise it doesn't work
      var uri = this._url.path + "?", key;
      for (key in params) {
        if (params.hasOwnProperty(key)) {
          uri += (uri.substring(uri.length - 1, uri.length) == "?") ? "" : "&";
          uri += key + "=" + params[key];
        }
      }
      esriRequest({
        url: uri,
        handleAs: "xml",
        headers: { "Content-Type": null }, // otherwise it sends Content-Type:application/x-www-form-urlencoded and some WMS don't like that
        load: this._parseCapabilities,
        error: this._getCapabilitiesError
      }, {
        usePost: false
      });
    },
    
    _parseCapabilities: function(xml){
      if (!xml) {
        this._errorHandler(new Error("GetCapabilities request for " + this._getCapabilitiesURL + " failed. (Response is null.)"));
        return;
      }
      this.version = this._getAttributeValue("WMS_Capabilities", "version", xml, null);
      if (!this.version) {
        this.version = this._getAttributeValue("WMT_MS_Capabilities", "version", xml, "1.3.0");
      }
      var service = this._getTag("Service", xml);
      this.title = this._getTagValue("Title", service, "");
      if (!this.title) {
        this.title = this._getTagValue("Name", service, "");
      }
      this.copyright = this._getTagValue("AccessConstraints", service, "");
      this.description = this._getTagValue("Abstract", service, "");
      this.maxWidth = parseInt(this._getTagValue("MaxWidth", service, 5000), 10);
      this.maxHeight = parseInt(this._getTagValue("MaxHeight", service, 5000), 10);
      
      // get extent and list of layers
      var layerXML = this._getTag("Layer", xml);
      if (!layerXML) {
        this._errorHandler(new Error("esri.layers.WMSLayer: Response does not contain any layers."));
        return;
      }
      var rootLayerInfo = this._getLayerInfo(layerXML);
      
      // has the service more root layers? 
      var outerLayerCount = 0;
      var firstOuterLayerXML = null;
      var capabilityXML = this._getTag("Capability", xml);
      array.forEach(capabilityXML.childNodes, function(childNode){
        if (childNode.nodeName == "Layer") {
          if (outerLayerCount === 0) {
            // we have this layer already in rootLayerInfo
            firstOuterLayerXML = childNode;
          } else if (outerLayerCount === 1) {
            // we have more than 1 outer layer
            if (rootLayerInfo.name) {
              // we add this layer as a sub layer and just keep an outer layer without a name
              rootLayerInfo.name = "";
              rootLayerInfo.subLayers = [];
              rootLayerInfo.subLayers.push(this._getLayerInfo(firstOuterLayerXML));
            }
            rootLayerInfo.subLayers.push(this._getLayerInfo(childNode));
          } else {
            // we have more root layers
            rootLayerInfo.subLayers.push(this._getLayerInfo(childNode));
          }
          outerLayerCount++;
        }
      }, this);

      if (rootLayerInfo) {
        this.layerInfos = rootLayerInfo.subLayers;
        if (!this.layerInfos || this.layerInfos.length === 0) {
          // we only have the root layer
          this.layerInfos = [rootLayerInfo];
        }
        this.extent = rootLayerInfo.extent;
        if (!this.extent) {
          // use the first sub layer
          rootLayerInfo.extent = Extent.fromJSON(this.layerInfos[0].extent.toJSON());
          this.extent = rootLayerInfo.extent;
        }
        this.allExtents = rootLayerInfo.allExtents;
        if (!this.allExtents || !this.allExtents.length) {
          // use the first sub layer
          rootLayerInfo.allExtents = [];
          array.forEach(this.layerInfos[0].allExtents, function(ext, index) {
            if (ext) {
              rootLayerInfo.allExtents[index] = ext.clone();
            }
          });
          this.allExtents = rootLayerInfo.allExtents;
        }
        this.spatialReferences = rootLayerInfo.spatialReferences; 
        // maybe the root layer didn't have any spatial reference info
        if (!this.spatialReferences.length && this.layerInfos.length > 0) {
          // look at the sub layers
          var i;
          for (i = 0; i < this.layerInfos.length; i++) {
            var layerInfo = this.layerInfos[i];
            this.spatialReferences = this.layerInfos[0].spatialReferences;
            if (this.spatialReferences.length) {
              break;
            }
            // maybe there is another sub layer with spatial reference
            if (layerInfo.subLayers && layerInfo.subLayers.length > 0) {
              var k;
              for (k = 0; k < layerInfo.subLayers.length; k++) {
                var subLayer = layerInfo.subLayers[k];
                this.spatialReferences = subLayer.spatialReferences;
                if (this.spatialReferences.length) {
                  break;
                }
              }
            }
            if (this.spatialReferences.length) {
              break;
            }
          }
        } 
      }
      
      // get endpoint for GetMap requests
      this.getMapURL = this._getCapabilitiesURL;
      var dcpXML = dojoNS.query("DCPType", this._getTag("GetMap", xml));
      if (dcpXML && dcpXML.length > 0) {
        var httpXML = dojoNS.query("HTTP", dcpXML[0]);
        if (httpXML && httpXML.length > 0) {
          var getXML = dojoNS.query("Get", httpXML[0]);
          if (getXML && getXML.length > 0) {
            var getMapHREF = this._getAttributeValue("OnlineResource", "xlink:href", getXML[0], null);
            if (getMapHREF) {
              if (getMapHREF.indexOf("&") == (getMapHREF.length - 1)) {
                // remove trailing &
                getMapHREF = getMapHREF.substring(0, getMapHREF.length - 1);
              }
              this.getMapURL = this._stripParameters(getMapHREF, ["service", "request"]);
            }
          }
        }
      }
      
      // get supported GetMap formats
      this.getMapFormats = [];
      if (dojoNS.query("Operation", xml).length === 0){
        array.forEach(dojoNS.query("Format", this._getTag("GetMap", xml)), function(format){
          this.getMapFormats.push(format.text ? format.text : format.textContent);
        }, this);
      } else {
        array.forEach(dojoNS.query("Operation", xml), function(operation){
          if (operation.getAttribute("name") == "GetMap") {
            array.forEach(dojoNS.query("Format", operation), function(format){
              this.getMapFormats.push(format.text ? format.text : format.textContent);
            }, this);
          }
        }, this);
      }
      // make sure the format we want is supported; otherwise switch
      if (!array.some(this.getMapFormats, function(el){
        // also support: <Format>image/png; mode=24bit</Format>
        return el.indexOf(this.imageFormat) > -1;
      }, this)) {
        this.imageFormat = this.getMapFormats[0];
      }
      
      this._initLayer();
    },
    
    _getCapabilitiesError: function(response) {
      if (response && response.message) {
        response.message =  "GetCapabilities request for " + this._getCapabilitiesURL + " failed." + " (" + response.message + ")";  
      }
      this._errorHandler(response);
    },
    
    _getLayerInfo: function(layerXML){
    
      if (!layerXML) {
        return null;
      }
      
      var result = new WMSLayerInfo();
      result.name = "";
      result.title = "";
      result.description = "";
      result.allExtents = [];
      result.spatialReferences = [];
      result.subLayers = []; // not sure why this has to be done
      // all services have LatLonBoundingBox or EX_GeographicBoundingBox (might not be on the first layer ...)
      var latLonBoundingBox = this._getTag("LatLonBoundingBox", layerXML);
      if (latLonBoundingBox) {
        result.allExtents[0] = this._getExtent(latLonBoundingBox, 4326);
      }
      var geographicBoundingBox = this._getTag("EX_GeographicBoundingBox", layerXML);
      var extent;
      if (geographicBoundingBox) {
        extent = new Extent(0, 0, 0, 0, new SpatialReference({
          wkid: 4326
        }));
        extent.xmin = parseFloat(this._getTagValue("westBoundLongitude", geographicBoundingBox, 0));
        extent.ymin = parseFloat(this._getTagValue("southBoundLatitude", geographicBoundingBox, 0));
        extent.xmax = parseFloat(this._getTagValue("eastBoundLongitude", geographicBoundingBox, 0));
        extent.ymax = parseFloat(this._getTagValue("northBoundLatitude", geographicBoundingBox, 0));
        result.allExtents[0] = extent;
      }
      if (!latLonBoundingBox && !geographicBoundingBox) {
        // not according to spec
        extent = new Extent(-180, -90, 180, 90, new SpatialReference({
          wkid: 4326
        }));
        result.allExtents[0] = extent;
      }
      result.extent = result.allExtents[0];
      
      //var srAttrName = (this.version == "1.3.0") ? "CRS" : "SRS";
      var srAttrName = (array.indexOf(["1.0.0","1.1.0","1.1.1"],this.version) > -1) ? "SRS" : "CRS";
      array.forEach(layerXML.childNodes, function(childNode){
        if (childNode.nodeName == "Name") {
          // unique name
          result.name = (childNode.text ? childNode.text : childNode.textContent) || "";
        } else if (childNode.nodeName == "Title") {
          // title
          result.title = (childNode.text ? childNode.text : childNode.textContent) || "";
        } else if (childNode.nodeName == "Abstract") {
          //description
          result.description = (childNode.text ? childNode.text : childNode.textContent) || "";
          
        } else if (childNode.nodeName == "BoundingBox") {
          // other extents
          // <BoundingBox CRS="CRS:84" minx="-164.765831" miny="25.845557" maxx="-67.790980" maxy="70.409756"/>  
          // <BoundingBox CRS="EPSG:4326" minx="25.845557" miny="-164.765831" maxx="70.409756" maxy="-67.790980"/>  
          var srAttr = childNode.getAttribute(srAttrName), wkid;
          if (srAttr && srAttr.indexOf("EPSG:") === 0) {
            wkid = parseInt(srAttr.substring(5), 10);
            if (wkid !== 0 && !isNaN(wkid)) {
              var extent;
              if (this.version == "1.3.0") {
                extent = this._getExtent(childNode, wkid, this._useLatLong(wkid));
              } else {
                extent = this._getExtent(childNode, wkid);
              }
              result.allExtents[wkid] = extent;
              if (!result.extent) {
                result.extent = extent; // only first one
              }
            }
          } else if (srAttr && srAttr.indexOf("CRS:") === 0) {
            wkid = parseInt(srAttr.substring(4), 10);
            if (wkid !== 0 && !isNaN(wkid)) {
              if (this._CRS_TO_EPSG[wkid]) {
                wkid = this._CRS_TO_EPSG[wkid];
              }
              result.allExtents[wkid] = this._getExtent(childNode, wkid);
            }
          } else {
            wkid = parseInt(srAttr, 10);
            if (wkid !== 0 && !isNaN(wkid)) {
              result.allExtents[wkid] = this._getExtent(childNode, wkid);
            }
          }
          
        } else if (childNode.nodeName == srAttrName) {
          // supported spatial references
          // <SRS>EPSG:4326</SRS> or <SRS>EPSG:4326 EPSG:32624 EPSG:32661</SRS>
          var value = childNode.text ? childNode.text : childNode.textContent; // EPSG:102100
          var arr = value.split(" ");
          array.forEach(arr, function(val){
            if (val.indexOf(":") > -1) {
              val = parseInt(val.split(":")[1], 10);
            } else {
              val = parseInt(val, 10);
            }
            if (val !== 0 && !isNaN(val)) { // val !== 84 && 
              if (this._CRS_TO_EPSG[val]) {
                val = this._CRS_TO_EPSG[val];
              }
              if (array.indexOf(result.spatialReferences, val) == -1) {
                result.spatialReferences.push(val);
              }
            }
          }, this);
          
        } else if (childNode.nodeName == "Style") {
          // legend URL
          var legendXML = this._getTag("LegendURL", childNode);
          if (legendXML) {
            var onlineResourceXML = this._getTag("OnlineResource", legendXML);
            if (onlineResourceXML) {
              result.legendURL = onlineResourceXML.getAttribute("xlink:href");
            }
          }
          
        } else if (childNode.nodeName === "Layer") {
          // sub layers
          result.subLayers.push(this._getLayerInfo(childNode));
        }
      }, this);

      result.title = result.title || result.name; 
          
      return result;
    },
    
    _getImageFormat: function(format){
      // png | png8 | png24 | png32 | jpg | pdf | bmp | gif | svg 
      // http://www.w3schools.com/media/media_mimeref.asp 
      // image/bmp | image/cis-cod | image/gif | image/ief | image/jpeg | image/pipeg | image/png | image/svg+xml | image/tiff  
      var imageFormat = format ? format.toLowerCase() : "";
      switch (imageFormat) {
        case "jpg":
          return "image/jpeg";
        case "bmp":
          return "image/bmp";
        case "gif":
          return "image/gif";
        case "svg":
          return "image/svg+xml";
        default:
          return "image/png";
      }
    },
    
    getImageFormat: function(){
      // png | png8 | png24 | png32 | jpg | pdf | bmp | gif | svg 
      // http://www.w3schools.com/media/media_mimeref.asp 
      // image/bmp | image/cis-cod | image/gif | image/ief | image/jpeg | image/pipeg | image/png | image/svg+xml | image/tiff  
      var imageFormat = this.imageFormat ? this.imageFormat.toLowerCase() : "";
      switch (imageFormat) {
        case "image/jpeg":
          return "jpg";
        case "image/bmp":
          return "bmp";
        case "image/gif":
          return "gif";
        case "image/svg+xml":
          return "svg";
        default:
          return "png";
      }
    },
    
    _getExtent: function(boundsXML, wkid, coordsReversed){
      var result;
      
      if (boundsXML) {
        result = new Extent();
        
        var minx = parseFloat(boundsXML.getAttribute("minx"));
        var miny = parseFloat(boundsXML.getAttribute("miny"));
        var maxx = parseFloat(boundsXML.getAttribute("maxx"));
        var maxy = parseFloat(boundsXML.getAttribute("maxy"));
        
        if (coordsReversed) {
          result.xmin = isNaN(miny) ? ((-1)*Number.MAX_VALUE) : miny;
          result.ymin = isNaN(minx) ? ((-1)*Number.MAX_VALUE) : minx;
          result.xmax = isNaN(maxy) ? Number.MAX_VALUE : maxy;
          result.ymax = isNaN(maxx) ? Number.MAX_VALUE : maxx;
        } else {
          result.xmin = isNaN(minx) ? ((-1)*Number.MAX_VALUE) : minx;
          result.ymin = isNaN(miny) ? ((-1)*Number.MAX_VALUE) : miny;
          result.xmax = isNaN(maxx) ? Number.MAX_VALUE : maxx;
          result.ymax = isNaN(maxy) ? Number.MAX_VALUE : maxy;
        }
        
        result.spatialReference = new SpatialReference({
          wkid: wkid
        });
      }
      
      return result;
    },
    
    _useLatLong: function(wkid){
      var result, i;
      for (i = 0; i < this._REVERSED_LAT_LONG_RANGES.length; i++) {
        var range = this._REVERSED_LAT_LONG_RANGES[i];
        if (wkid >= range[0] && wkid <= range[1]) {
          result = true;
          break;
        }
      }
      return result;
    },
    
    _getTag: function(tagName, xml){
      var tags = dojoNS.query(tagName, xml);
      if (tags && tags.length > 0) {
        return tags[0];
      } else {
        return null;
      }
    },
    
    _getTagValue: function(tagName, xml, defaultValue){
      var value = dojoNS.query(tagName, xml);
      if (value && value.length > 0) {
        if (value[0].text) {
          return value[0].text;
        } else {
          return value[0].textContent;
        }
      } else {
        return defaultValue;
      }
    },
    
    _getAttributeValue: function(tagName, attrName, xml, defaultValue){
      var value = dojoNS.query(tagName, xml);
      if (value && value.length > 0) {
        return value[0].getAttribute(attrName);
      } else {
        return defaultValue;
      }
    },
    
    _checkVisibleLayersList: function(visibleLayers){
      // check to see if we got a list of layer positions or layer names
      // we must have this.layerInfos to do this
      if (visibleLayers && visibleLayers.length > 0 && this.layerInfos && this.layerInfos.length > 0) {
        if ((typeof visibleLayers[0]) == "number") {
          // positions
          var list = [];
          array.forEach(visibleLayers, function(pos){
            if (pos < this.layerInfos.length) {
              list.push(this.layerInfos[pos].name);
            }
          }, this);
          visibleLayers = list;
        }
      }
      return visibleLayers;
    },
    
    _stripParameters: function(url, params){
      var obj = urlUtils.urlToObject(url), prop,
          qs = [];

      for (prop in obj.query) {
        if (obj.query.hasOwnProperty(prop)) {
          if (array.indexOf(params, prop.toLowerCase()) === -1) {
            qs.push(prop + "=" + obj.query[prop]);
          }
        }
      }
      return obj.path + (qs.length ? ("?" + qs.join("&")) : "");
    }
  });

  
  
  return WMSLayer;  
});
