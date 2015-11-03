/* jshint newcap: false */
define(
[
  "require",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Deferred",
  "dojo/_base/url",
  "dojo/on",
  "dojo/dom-construct",

  "../kernel",
  "../config",
  "../core/lang",
  "../core/promiseList",
  "../request",
  "../geometry/SpatialReference",
  "../Map",
  "../core/urlUtils",

  "../geometry/ScreenPoint",
  "../geometry/Extent",
  "../geometry/support/webMercatorUtils",
  "../symbols/support/jsonUtils",
  "../renderers/support/jsonUtils",

  "../PopupTemplate",
  "../widgets/Popup",
  "../tasks/support/Query",
  "../tasks/GeometryService",

  "../layers/ArcGISTiledLayer",
  "../layers/FeatureLayer",

  "dojo/i18n!../nls/jsapi"
],
function(
  require, lang, array, Deferred, Url, on, domConstruct,
  esriKernel, esriConfig, esriLang, promiseList, esriRequest, SpatialReference, Map, urlUtils,
  ScreenPoint, Extent, webMercatorUtils, symJsonUtils, rndJsonUtils,
  PopupTemplate, Popup, Query, GeometryService,
  ArcGISTiledMapServiceLayer, FeatureLayer,
  jsapiBundle
) {

// NOTE
// Make sure you also include /esri/widgets/css/Popup.css in the application

  var arcgisUtils;

  // lazy-loaded constructors
  var ArcGISDynamicMapServiceLayer,
      ArcGISImageServiceLayer,
      ArcGISImageServiceVectorLayer,
      csv,
      CSVLayer,
      DynamicLayerInfo,
      GeoRSSLayer,
      ImageParameters,
      ImageServiceParameters,
      KMLLayer,
      LabelClass,
      LayerDrawingOptions,
      MosaicRule,
      OpenStreetMapLayer,
      RasterFunction,
      StreamLayer,
      TileInfo,
      VETiledLayer,
      WebTiledLayer,
      WMSLayer,
      WMSLayerInfo;
  // lazy-loaded modules
  var _ArcGISDynamicMapServiceLayerPath = "../layers/ArcGISDynamicLayer",
      _ArcGISImageServiceLayerPath = "../layers/ArcGISImageServiceLayer",
      _ArcGISImageServiceVectorLayerPath = "../layers/ArcGISImageServiceVectorLayer",
      _csvPath = "./csv",
      _CSVLayerPath = "../layers/CSVLayer",
      _DynamicLayerInfoPath = "../layers/support/DynamicLayerInfo",
      _GeoRSSLayerPath = "../layers/GeoRSSLayer",
      _ImageParametersPath = "../layers/support/ImageParameters",
      _ImageServiceParametersPath = "../layers/support/ImageServiceParameters",
      _KMLLayerPath = "../layers/KMLLayer",
      _LabelClassPath = "../layers/support/LabelClass",
      _LayerDrawingOptionsPath = "../layers/support/LayerDrawingOptions",
      _MosaicRulePath = "../layers/support/MosaicRule",
      _OpenStreetMapLayerPath = "../layers/OpenStreetMapLayer",
      _RasterFunctionPath = "../layers/support/RasterFunction",
      _StreamLayerPath = "../layers/StreamLayer",
      _TileInfoPath = "../layers/support/TileInfo",
      _VETiledLayerPath = "../virtualearth/VETiledLayer",
      _WebTiledLayerPath = "../layers/WebTiledLayer",
      _WMSLayerPath = "../layers/WMSLayer",
      _WMSLayerInfoPath = "../layers/support/WMSLayerInfo";
  var _lazyModules1 = [ // loaded 1st
    _ArcGISDynamicMapServiceLayerPath,
    _ArcGISImageServiceLayerPath,
    _ArcGISImageServiceVectorLayerPath,
    _CSVLayerPath,
    _GeoRSSLayerPath,
    _KMLLayerPath,
    _LabelClassPath,
    _OpenStreetMapLayerPath,
    _StreamLayerPath,
    _VETiledLayerPath,
    _WebTiledLayerPath,
    _WMSLayerPath
  ];
  var _lazyModules2 = [ // loaded 2nd
    _csvPath,
    _DynamicLayerInfoPath,
    _ImageParametersPath,
    _ImageServiceParametersPath,
    _LayerDrawingOptionsPath,
    _MosaicRulePath,
    _RasterFunctionPath,
    _TileInfoPath,
    _WMSLayerInfoPath
  ];

  /*******************
   * Internal methods
   *******************/

  function _strEndsWith(str, suffix) {
    return (str.match(suffix + "$") == suffix);
  }

  function _getItemData(operationalLayer) {

    var url = arcgisUtils.arcgisUrl + "/" + operationalLayer.itemId + "/data";

    var request = esriRequest({
      url: url,
      content: {
        f: "json"
      },
      callbackParamName: "callback"
    }, {
      disableIdentityLookup: true,
      _preLookup: true
    }); // ignore error; we won't have a popup then
    return request;
  }

  function _getBingKey(portalUrl, token) {
    var params = {f: "json"};
    /*
    if (esriKernel.id) {
      var credentials = esriKernel.id.findCredential(urlUtils.urlToObject(arcgisUtils.arcgisUrl).path);
      if (credentials) {
        params.token = credentials.token;
      }
    }
    */
    if (token) {
      params.token = token;
    }
    var request = esriRequest({
      url: portalUrl,
      content: params,
      callbackParamName: "callback"
    }, {
      "disableIdentityLookup": true
    });
    return request;
  }

  function _processFSItemProperties(layer){

    // layer object is not created yet
    if (layer.itemProperties.layerDefinition) {
      if (layer.layerDefinition) {
        if (!layer.layerDefinition.drawingInfo) {
          layer.layerDefinition.drawingInfo = layer.itemProperties.layerDefinition.drawingInfo;
        }
        if (!esriLang.isDefined(layer.layerDefinition.definitionExpression)) {
          layer.layerDefinition.definitionExpression = layer.itemProperties.layerDefinition.definitionExpression;
        }
        if (!esriLang.isDefined(layer.layerDefinition.minScale)) {
          layer.layerDefinition.minScale = layer.itemProperties.layerDefinition.minScale;
        }
        if (!esriLang.isDefined(layer.layerDefinition.maxScale)) {
          layer.layerDefinition.maxScale = layer.itemProperties.layerDefinition.maxScale;
        }
      } else {
        layer.layerDefinition = layer.itemProperties.layerDefinition;
      }
    }

    if (layer.itemProperties.popupInfo && !layer.popupInfo && !layer.disablePopup) {
      layer.popupInfo = layer.itemProperties.popupInfo;
    }

    if (esriLang.isDefined(layer.itemProperties.showLabels) && !esriLang.isDefined(layer.showLabels)) {
      layer.showLabels = layer.itemProperties.showLabels;
    }

    if (esriLang.isDefined(layer.itemProperties.showLegend) && !esriLang.isDefined(layer.showLegend)) {
      layer.showLegend = layer.itemProperties.showLegend;
    }

    if (esriLang.isDefined(layer.itemProperties.refreshInterval) && !esriLang.isDefined(layer.refreshInterval)) {
      layer.refreshInterval = layer.itemProperties.refreshInterval;
    }
  }

  function _processSSItemProperties(layer){
    //call _processFSItemProperties to set properties shared with Feature Layer
    _processFSItemProperties(layer);

    //set properties unique to Stream Layer
    if (layer.itemProperties.layerDefinition) {
      if (layer.layerDefinition) {
        if (!esriLang.isDefined(layer.layerDefinition.maximumTrackPoints) && esriLang.isDefined(layer.itemProperties.layerDefinition.maximumTrackPoints)) {
          layer.layerDefinition.maximumTrackPoints = layer.itemProperties.layerDefinition.maximumTrackPoints;
        }
        if (!layer.layerDefinition.definitionGeometry && layer.itemProperties.layerDefinition.definitionGeometry) {
          layer.layerDefinition.definitionGeometry = layer.itemProperties.layerDefinition.definitionGeometry;
        }
      }
    }

    if (layer.itemProperties.purgeOptions && !layer.purgeOptions) {
      layer.purgeOptions = layer.itemProperties.purgeOptions;
    }
  }

  // check if some of the map service items used in this webmap have item properties set
  function _getItemProps(createMapResponse, options){

    var deferred = new Deferred();

    var webMap = createMapResponse.itemData;
    var deferreds = [];
    var layers = [];

    // for feature service items we store layers (layers contains popupInfo, showLegend, definitionEditor, layerDefinition (layerDefinition contains minScale, maxScale, definitionExpression, drawingInfo))
    // for map service items we store minScale, maxScale, layers (layers contains popupInfo, layerUrl, showLegend, definitionEditor, layerDefinition (layerDefinition contains definitionExpression)
    //   (the service level also has a showLegend property that we do not store on the item, only in the web map)
    // for image service items we store minScale, maxScale
    // for stream service items we store popupInfo, showLegend, purgeOptions, layerDefinition (layerDefinition contains minScale, maxScale, definitionExpression, definitionGeometry, maximumTrackPoints, drawingInfo))

    array.forEach(webMap.operationalLayers, function(layer){
      // an empty layers list ([]) means that the user doesn't want item properties (pop-ups,renderer,scales) from the service item either
      if (layer.itemId && !layer.type) {
        var layerUrl = layer.url.toLowerCase();
        if (layerUrl.indexOf("/featureserver") > -1 || layerUrl.indexOf("/mapserver/") > -1) {
          layers.push(layer);
          deferreds.push(_getItemData(layer));
        } else if (layerUrl.indexOf("/mapserver") > -1 && layerUrl.indexOf("/mapserver/") === -1 && (!layer.layers || (!esriLang.isDefined(layer.minScale) && !esriLang.isDefined(layer.maxScale)))) {
          layers.push(layer);
          deferreds.push(_getItemData(layer));
        } else if (layerUrl.indexOf("/imageserver") > -1 && !esriLang.isDefined(layer.minScale) && !esriLang.isDefined(layer.maxScale)) {
          layers.push(layer);
          deferreds.push(_getItemData(layer));
        } else if (layerUrl.indexOf("/streamserver") > -1) {
          layers.push(layer);
          deferreds.push(_getItemData(layer));
        }
      }
      // type == "Feature Collection" is handled when we add the layer, because we need the data anyway, but
      //   relatedItemsData will not include the FC's itemData
    });

    if (webMap.baseMap && webMap.baseMap.baseMapLayers) {

      array.forEach(webMap.baseMap.baseMapLayers, function(layer){
        if (layer.itemId) {
          layers.push(layer);
          deferreds.push(_getItemData(layer));
        }
      });
    }

    if (deferreds.length > 0) {
      var relatedItemsData = {};
      promiseList(deferreds).then(function(response){
        array.forEach(layers, function(layer, i){
          var itemData = response[i][1]; // deferreds[i].ioArgs.json;
          if (itemData && !(itemData instanceof Error)) {
            relatedItemsData[layer.itemId] = itemData;
            if (!layer.type) {
              var layerUrl = layer.url.toLowerCase();
              if ((layerUrl.indexOf("/featureserver") > -1 || layerUrl.indexOf("/mapserver/") > -1) && itemData.layers) {
                array.forEach(itemData.layers, function(props){
                  if (_strEndsWith(layerUrl, "/featureserver/" + props.id) || _strEndsWith(layerUrl, "/mapserver/" + props.id)) {
                    layer.itemProperties = props;
                    _processFSItemProperties(layer);
                  }
                });
              } else if (layerUrl.indexOf("/streamserver") > -1){
                layer.itemProperties = itemData;
                _processSSItemProperties(layer);
              } else if (layerUrl.indexOf("/mapserver") > -1) {
                if (itemData.layers && !layer.layers) {
                  layer.layers = itemData.layers;
                }
                if (esriLang.isDefined(itemData.minScale) && !esriLang.isDefined(layer.minScale)) {
                  layer.minScale = itemData.minScale;
                }
                if (esriLang.isDefined(itemData.maxScale) && !esriLang.isDefined(layer.maxScale)) {
                  layer.maxScale = itemData.maxScale;
                }
                if (esriLang.isDefined(itemData.refreshInterval) && !esriLang.isDefined(layer.refreshInterval)) {
                  layer.refreshInterval = itemData.refreshInterval;
                }
                if (itemData.visibleLayers && !layer.visibleLayers) {
                  layer.visibleLayers = itemData.visibleLayers;
                }
              } else if (layerUrl.indexOf("/imageserver") > -1) {

                if (esriLang.isDefined(itemData.minScale) && !esriLang.isDefined(layer.minScale)) {
                  layer.minScale = itemData.minScale;
                }
                if (esriLang.isDefined(itemData.maxScale) && !esriLang.isDefined(layer.maxScale)) {
                  layer.maxScale = itemData.maxScale;
                }
                if (esriLang.isDefined(itemData.refreshInterval) && !esriLang.isDefined(layer.refreshInterval)) {
                  layer.refreshInterval = itemData.refreshInterval;
                }
                if (itemData.popupInfo && !layer.popupInfo && !layer.disablePopup) {
                  layer.popupInfo = itemData.popupInfo;
                }
                if (itemData.renderingRule && !layer.renderingRule) {
                  layer.renderingRule = itemData.renderingRule;
                  if (itemData.renderingRule.functionName) {
                    // for backward compatibility
                    layer.renderingRule.rasterFunction = itemData.renderingRule.functionName;
                  }
                }
                if (itemData.bandIds && !layer.bandIds) {
                  layer.bandIds = itemData.bandIds;
                }
                if (itemData.mosaicRule && !layer.mosaicRule) {
                  layer.mosaicRule = itemData.mosaicRule;
                }
                if (itemData.format && !layer.format) {
                  layer.format = itemData.format;
                }
                if (esriLang.isDefined(itemData.compressionQuality) && !esriLang.isDefined(layer.compressionQuality)) {
                  layer.compressionQuality = itemData.compressionQuality;
                }
                if (itemData.layerDefinition && itemData.layerDefinition.definitionExpression &&
                  (!esriLang.isDefined(layer.layerDefinition) || !esriLang.isDefined(layer.layerDefinition.definitionExpression))) {
                  layer.layerDefinition = layer.layerDefinition || {};
                  layer.layerDefinition.definitionExpression = itemData.layerDefinition.definitionExpression;
                }
              }
            }
          } // else ignore error
        });
        createMapResponse.relatedItemsData = relatedItemsData;
        deferred.callback(createMapResponse);
      });
    } else {
      deferred.callback(createMapResponse);
    }
    return deferred.promise;
  }

  function _checkBingKey(createMapResponse, options){
    // check for a valid Bing key before we process the web map
    // if map contains a Bing layer and there is no valid Bing key switch web map to use Esri layers

    var deferred = new Deferred();

    var webMap = createMapResponse.itemData;

    var firstBasemapLayer = webMap.baseMap.baseMapLayers[0];
    if (firstBasemapLayer.type === "BingMapsAerial" || firstBasemapLayer.type === "BingMapsRoad" || firstBasemapLayer.type === "BingMapsHybrid") {

      if (firstBasemapLayer.portalUrl && esriKernel.id) {

        // don't use Bing Key provided by createMap options; check portalUrl for the Bing Key
        delete options.bingMapsKey;

        esriKernel.id.checkSignInStatus(urlUtils.urlToObject(arcgisUtils.arcgisUrl).path).then(
          lang.hitch(null, function(createMapResponse, options, webMap, deferred, credential) {
            //user signed in
            _getBingKey(firstBasemapLayer.portalUrl, credential.token).then(
              lang.hitch(null, _portalUrlResponse, createMapResponse, options, webMap, deferred),
              lang.hitch(null, _portalUrlFailure, createMapResponse, options, webMap, deferred)
            );
          }, createMapResponse, options, webMap, deferred),
          lang.hitch(null, function(createMapResponse, options, webMap, deferred, error) {
            // user not signed in
            _getBingKey(firstBasemapLayer.portalUrl).then(
              lang.hitch(null, _portalUrlResponse, createMapResponse, options, webMap, deferred),
              lang.hitch(null, _portalUrlFailure, createMapResponse, options, webMap, deferred)
            );
          }, createMapResponse, options, webMap, deferred)
        );

      } else if (options.bingMapsKey) {

        // application passed in Bing key; make sure it's valid ...
        var layer = new VETiledLayer({
          bingMapsKey: options.bingMapsKey,
          mapStyle: VETiledLayer.MAP_STYLE_AERIAL
        });
        layer.on("load", lang.hitch(this, function() {
          // valid Bing key
          deferred.callback([createMapResponse, options]);
        }));
        layer.on("error", function(err) {
          // invalid Bing key
          delete options.bingMapsKey;
          createMapResponse.itemData = _switchBingToEsriBasemap(webMap);
          firstBasemapLayer = createMapResponse.itemData.baseMap.baseMapLayers[0];
          firstBasemapLayer.errors = [];
          var error = { message: "The owner of the application has not provided a valid Bing Key for the Bing Map it includes. Switching to Esri layers."};
          firstBasemapLayer.errors.push(error);
          deferred.callback([createMapResponse, options]);
        });

      } else {

        // no Bing key
        createMapResponse.itemData = _switchBingToEsriBasemap(webMap);
        firstBasemapLayer = createMapResponse.itemData.baseMap.baseMapLayers[0];
        firstBasemapLayer.errors = [];
        var error = { message: "The owner of the application has not provided a Bing Key for the Bing Map it includes. Switching to Esri layers."};
        firstBasemapLayer.errors.push(error);
        deferred.callback([createMapResponse, options]);
      }

    } else {
      // no Bing layer
      deferred.callback([createMapResponse, options]);
    }
    return deferred.promise;
  }

  function _portalUrlResponse(createMapResponse, options, webMap, deferred, response){

    if (response.bingKey) {
      // we got a Bing Key from the org
      options.bingMapsKey = response.bingKey;
      // make sure it's valid ...
      var layer = new VETiledLayer({
        bingMapsKey: options.bingMapsKey,
        mapStyle: VETiledLayer.MAP_STYLE_AERIAL
      });
      layer.on("load", lang.hitch(this, function() {
        // valid Bing key
        deferred.callback([createMapResponse, options]);
      }));
      layer.on("error", function(err) {
        // invalid Bing key
        delete options.bingMapsKey;
        createMapResponse.itemData = _switchBingToEsriBasemap(webMap);
        var firstBasemapLayer = createMapResponse.itemData.baseMap.baseMapLayers[0];
        firstBasemapLayer.errors = [];
        var error = { message: "The owner of the map has not provided a valid Bing Key for the Bing Map it includes. Switching to Esri layers."};
        firstBasemapLayer.errors.push(error);
        deferred.callback([createMapResponse, options]);
      });
    } else {
      _portalUrlFailure(createMapResponse, options, webMap, deferred);
    }
  }

  function _portalUrlFailure(createMapResponse, options, webMap, deferred) {

    // could not get Bing Key from org
    delete options.bingMapsKey;
    createMapResponse.itemData = _switchBingToEsriBasemap(webMap);
    var firstBasemapLayer = createMapResponse.itemData.baseMap.baseMapLayers[0];
    firstBasemapLayer.errors = [];
    var error = { message: "The owner of the map has not provided a Bing Key for the Bing Map it includes. Switching to Esri layers."};
    firstBasemapLayer.errors.push(error);
    deferred.callback([createMapResponse, options]);
  }

  function _switchBingToEsriBasemap(webMap) {

    // switch Bing map to Esri map
    if (webMap.baseMap.baseMapLayers[0].type === "BingMapsAerial") {
      webMap.baseMap = {
        "title":"Imagery",
        "baseMapLayers":[{
          "id":"World_Imagery_2017",
          "visibility":true,
          "opacity":1,
          "url":"http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
        }]
      };
    } else if (webMap.baseMap.baseMapLayers[0].type === "BingMapsRoad") {
      webMap.baseMap = {
        "title":"Streets",
        "baseMapLayers":[{
          "id":"World_Street_Map_8421",
          "opacity":1,
          "visibility":true,
          "url":"http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
        }]
      };
    } else { // type == "BingMapsHybrid"
      webMap.baseMap = {
        "title":"Imagery with Labels",
        "baseMapLayers":[{
          "id":"World_Imagery_6611",
          "opacity":1,
          "visibility":true,
          "url":"http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
        }, {
          "id":"World_Boundaries_and_Places_1145",
          "isReference":true,
          "opacity":1,
          "visibility":true,
          "url":"http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer"
        }]
      };
    }
    return webMap;
  }

  function _processPopups(layer, layerObject, clazz, options) {

    // Process popups defined for the map service
    var layerInfos = layer.dynamicLayerInfos || layer.layerInfos;
    var popupLayers = layerObject.layers;
    if (popupLayers && layerInfos) {
      if (!options.usePopupManager) {
        var popups = [], ids = [], urls = [], whereClauses = [], minScales = [], maxScales = [];

        array.forEach(layerInfos, function(layerInfo) {
          var id = layerInfo.id, i;
          if (!layerInfo.subLayerIds && array.indexOf(layer.visibleLayers, id) !== -1) {
            for (i = 0; i < popupLayers.length; i++) {
              var popupLayer = popupLayers[i];
              if (popupLayer.id === id) {
                ids.push(id);
                popups.push(popupLayer.popupInfo);
                urls.push(popupLayer.layerUrl || "");
                if (popupLayer.layerDefinition && popupLayer.layerDefinition.definitionExpression) {
                  whereClauses.push(popupLayer.layerDefinition.definitionExpression);
                } else {
                  whereClauses.push("");
                }
                minScales.push(esriLang.isDefined(popupLayer.minScale) ? popupLayer.minScale : null);
                maxScales.push(esriLang.isDefined(popupLayer.maxScale) ? popupLayer.maxScale : null);
                break;
              }
            }
          }
        });

        if (popups.length) {
          layer.__popups = popups;
          layer.__popupIds = ids;
          layer.__popupUrls = urls;
          layer.__popupWhereClauses = whereClauses;
          layer.__popupMinScales = minScales;
          layer.__popupMaxScales = maxScales;
          layer.__resourceInfo = layerObject.resourceInfo;
        }
      }
      else {
        var popupTemplates;
        array.forEach(layerInfos, function(layerInfo) {
          var id = layerInfo.id, i;
          if (!layerInfo.subLayerIds) {
            for (i = 0; i < popupLayers.length; i++) {
              var popupLayer = popupLayers[i];
              if (popupLayer.id === id && popupLayer.popupInfo) {
                if (!popupTemplates) {
                  popupTemplates = {};
                }
                popupTemplates[id] = {
                  popupTemplate: new clazz(popupLayer.popupInfo),
                  layerUrl: popupLayer.layerUrl
                };
                break;
              }
            }
          }
        });

        if (popupTemplates) {
          layer.setInfoTemplates(popupTemplates);
        }
      }
    }
  }

  function _isHostedService(url){
    if (!url) {
      return false;
    }
    // hosted service: http://services.arcgis.com/<id>/arcgis/rest/services/<title>/FeatureServer
    // uploaded KML service: http://www.arcgis.com/sharing/rest/content/items/<id>/data
    var arcgis = ".arcgis.com/";
    var sharing = (new Url(arcgisUtils.arcgisUrl)).authority;
    return (url.indexOf(arcgis) !== -1 || url.indexOf(sharing) !== -1);
  }

  function _isAgolService(url){
    if (!url) {
      return false;
    }
    return (url.indexOf("/services.arcgisonline.com/") !== -1 || url.indexOf("/server.arcgisonline.com/") !== -1);
  }

  function _checkUrl(url){
    if (location.protocol === "https:" && (_isHostedService(url) || _isAgolService(url))) {
      url = url.replace("http:", "https:");
    }
    return url;
  }

  function _loadAsCached(layerObject, clazz, options) {
    var serviceLods = [],
        exclusionAreas;

    if (!layerObject.displayLevels) {
      serviceLods = array.map(layerObject.resourceInfo.tileInfo.lods, function(lod){
        return lod.level;
      });
    }

    if (layerObject.exclusionAreas) {
      exclusionAreas = lang.clone(layerObject.exclusionAreas);
      exclusionAreas = array.map(exclusionAreas, function(exclusionArea) {
        // We might support other geometry type later.
        exclusionArea.geometry = new Extent(exclusionArea.geometry);
        return exclusionArea;
      });
    }

    var layer = new ArcGISTiledMapServiceLayer(_checkUrl(layerObject.url), {
      resourceInfo: layerObject.resourceInfo,
      opacity: layerObject.opacity,
      visible: layerObject.visibility,
      displayLevels: layerObject.displayLevels || serviceLods,
      id: layerObject.id,
      minScale: layerObject.minScale,
      maxScale: layerObject.maxScale,
      refreshInterval: layerObject.refreshInterval,
      exclusionAreas: exclusionAreas
    });

    if (!options.ignorePopups) {
      _processPopups(layer, layerObject, clazz, options);
    }

    return layer;
  }

  function _getVisibleFeatureLayers(layerInfos, visibleLayers){
    // don't list the group layers
    if (!layerInfos || !visibleLayers || visibleLayers.length === 0) {
      return [];
    }

    var tocLayers = "," + visibleLayers + ",";
    var realVisibleLayers = [];
    //var comma = "";
    var k, dontUseLayerIds = ",";
    for (k = 0; k < layerInfos.length; k++) {
      if (layerInfos[k].subLayerIds !== null) {
        if (tocLayers.indexOf("," + layerInfos[k].id + ",") === -1 || dontUseLayerIds.indexOf("," + layerInfos[k].id + ",") > -1) {
          // group layer is switched off or it's inside a group layer that's switched off
          dontUseLayerIds += layerInfos[k].subLayerIds.toString() + ",";
        }
        //else {
        // group layer is switched on and not inside a switched off group layer
        //}
      } else if (tocLayers.indexOf("," + layerInfos[k].id + ",") > -1 && dontUseLayerIds.indexOf("," + layerInfos[k].id + ",") === -1) {
        // layer is switched on and is not a group layer and not inside a switched off group layer
        realVisibleLayers.push(layerInfos[k].id);
        //comma = ",";
      } // else layer is switched off or is inside a switched off group layer
    }
    return realVisibleLayers;
  }

  function _loadAsDynamic(layerObject, clazz, options) {

    var imageParameters = new ImageParameters();
    imageParameters.format = "png24";
    if (layerObject.resourceInfo && layerObject.resourceInfo.supportedImageFormatTypes && layerObject.resourceInfo.supportedImageFormatTypes.indexOf("PNG32") > -1) {
      imageParameters.format = "png32";
    }

    var layer = new ArcGISDynamicMapServiceLayer(_checkUrl(layerObject.url), {
      resourceInfo: layerObject.resourceInfo,
      opacity: layerObject.opacity,
      visible: layerObject.visibility,
      id: layerObject.id,
      imageParameters: imageParameters,
      minScale: layerObject.minScale,
      maxScale: layerObject.maxScale,
      refreshInterval: layerObject.refreshInterval
    });

    // don't modify the original setting of visibleLayers,
    // it will be used for dynamic layers if needed.
    var visibleLayers = layerObject.visibleLayers;
    if (!layerObject.visibleLayers) {
      // get service default list
      var subIds = "";
      var layerInfos = layer.layerInfos;
      array.forEach(layerInfos, function(layerInfo){
        if (layerInfo.defaultVisibility) {
          subIds += (subIds.length > 0 ? "," : "") + layerInfo.id;
        }
      });
      visibleLayers = subIds;
    }

    if (layerObject.layers && layerObject.layers.length > 0) {
      var layerDefinitions = [],
          dynamicLayerInfos = [], dynamicLayerInfo,
          drawingOptionsArray = [], drawingOptions,
          source;

      array.forEach(layerObject.layers, function(layerInfo){
        if (layerInfo.layerDefinition && layerInfo.layerDefinition.definitionExpression) {
          layerDefinitions[layerInfo.id] = layerInfo.layerDefinition.definitionExpression;
        }
        if (layerInfo.layerDefinition && layerInfo.layerDefinition.source) {
          dynamicLayerInfo = null;
          source = layerInfo.layerDefinition.source;
          if (source.type === "mapLayer") {
            var metaLayerInfos = array.filter(layerObject.resourceInfo.layers, function(layer) {
              return layer.id === source.mapLayerId;
            });
            if (metaLayerInfos.length) {
              dynamicLayerInfo = lang.mixin(metaLayerInfos[0], layerInfo);
            }
          }
          else {
            dynamicLayerInfo = lang.mixin({}, layerInfo);
          }
          if (dynamicLayerInfo) {
            dynamicLayerInfo.source = source;
            delete dynamicLayerInfo.popupInfo;
            dynamicLayerInfo = new DynamicLayerInfo(dynamicLayerInfo);
            if (layerObject.visibleLayers) {
              var vis = ((typeof layerObject.visibleLayers) == "string") ? layerObject.visibleLayers.split(",") : layerObject.visibleLayers;
              if (array.indexOf(vis, layerInfo.id) > -1) {
                dynamicLayerInfo.defaultVisibility = true;
              }
              else {
                dynamicLayerInfo.defaultVisibility = false;
              }
            }
            dynamicLayerInfos.push(dynamicLayerInfo);
          }
        }
        if (layerInfo.layerDefinition && layerInfo.layerDefinition.source && layerInfo.layerDefinition.drawingInfo) {
          drawingOptions = new LayerDrawingOptions(layerInfo.layerDefinition.drawingInfo);
          drawingOptionsArray[layerInfo.id] = drawingOptions;
        }
      }, this);

      if (layerDefinitions.length > 0) {
        layer.setLayerDefinitions(layerDefinitions);
      }
      if (dynamicLayerInfos.length > 0) {
        layer.setDynamicLayerInfos(dynamicLayerInfos, true);
        if (drawingOptionsArray.length > 0) {
          layer.setLayerDrawingOptions(drawingOptionsArray, true);
        }
      } else {
        // don't list the group layers
        visibleLayers = _getVisibleFeatureLayers(layer.layerInfos, visibleLayers);
        layer.setVisibleLayers(visibleLayers);
      }
    } else {
      // don't list the group layers
      visibleLayers = _getVisibleFeatureLayers(layer.layerInfos, visibleLayers);
      layer.setVisibleLayers(visibleLayers);
    }

    if (!options.ignorePopups) {
      _processPopups(layer, layerObject, clazz, options);
    }

    return layer;
  }

  function _loadAsImage(layerObject, clazz, options) {
    //image service
    var imageServiceParameters = new ImageServiceParameters();
    imageServiceParameters.bandIds = layerObject.bandIds;
    if (layerObject.format != null) {
      imageServiceParameters.format = layerObject.format;
      if (layerObject.compressionQuality != null) {
        imageServiceParameters.compressionQuality = layerObject.compressionQuality;
      }
    }

    if (layerObject.renderingRule && layerObject.renderingRule.rasterFunction) {
      var rasterFunction = new RasterFunction(layerObject.renderingRule);
      imageServiceParameters.renderingRule = rasterFunction;
    }

    if (layerObject.mosaicRule) {
      var mosaicRule = new MosaicRule(layerObject.mosaicRule);
      imageServiceParameters.mosaicRule = mosaicRule;
    }

    if (esriLang.isDefined(layerObject.noData)) {
      imageServiceParameters.noData = layerObject.noData;
    }

    if (esriLang.isDefined(layerObject.noDataInterpretation)) {
      imageServiceParameters.noDataInterpretation = layerObject.noDataInterpretation;
    }

    if (esriLang.isDefined(layerObject.interpolation)) {
      imageServiceParameters.interpolation = layerObject.interpolation;
    }

    var layer;
    var addAsVectorLayer = layerObject.layerType ? layerObject.layerType === "ArcGISImageServiceVectorLayer" : false;
    if (!esriLang.isDefined(layerObject.layerType)) {
      addAsVectorLayer = layerObject.resourceInfo.hasMultidimensions &&
       (layerObject.resourceInfo.serviceDataType === "esriImageServiceDataTypeVector-UV" || layerObject.resourceInfo.serviceDataType === "esriImageServiceDataTypeVector-MagDir");
    }
    var layerParams = {
      resourceInfo: layerObject.resourceInfo,
      opacity: layerObject.opacity,
      visible: layerObject.visibility,
      id: layerObject.id,
      imageServiceParameters: imageServiceParameters,
      minScale: layerObject.minScale,
      maxScale: layerObject.maxScale,
      refreshInterval: layerObject.refreshInterval
    };
    if (addAsVectorLayer) {
      layer = new ArcGISImageServiceVectorLayer(_checkUrl(layerObject.url), layerParams);
    } else {
      layer = new ArcGISImageServiceLayer(_checkUrl(layerObject.url), layerParams);
    }

    if (layerObject.layerDefinition && layerObject.layerDefinition.definitionExpression) {
      layer.setDefinitionExpression(layerObject.layerDefinition.definitionExpression, true);
    }

    if (!options.ignorePopups && layerObject.popupInfo) {
      layer.popupTemplate = new clazz(layerObject.popupInfo);
    }

    return layer;
  }

  function _sameSpatialReferenceAsBasemap(layerObject, baseMapLayers, mapSR) {
    var mercator = [102113, 102100, 3857];

    // basemap layer
    var sp1 = mapSR || new SpatialReference(baseMapLayers[0].layerObject.fullExtent.spatialReference);

    // operational layer
    var sp2 = new SpatialReference(layerObject.resourceInfo.fullExtent.spatialReference);

    if (sp1.wkt == sp2.wkt &&
        (sp1.wkid == sp2.wkid ||
            (esriLang.isDefined(sp1.latestWkid) && sp1.latestWkid == sp2.wkid) ||
            (esriLang.isDefined(sp2.latestWkid) && sp1.wkid == sp2.latestWkid) ||
            (esriLang.isDefined(sp1.latestWkid) && sp1.latestWkid == sp2.latestWkid))) {
      return true;
    } else if (sp1.wkid && sp2.wkid &&
        array.some(mercator, function(wkid) {
          return wkid === sp2.wkid;
        }) &&
        array.some(mercator, function(wkid) {
          return wkid === sp1.wkid;
        })) {
      return true;
    }

    return false;
  }

  function _sameTilingSchemeAsBasemap(layerObject, baseMapLayers){
    // is basemap a cached service?
    if (!baseMapLayers[0].layerObject.tileInfo) {
      return false;
    }

    // get all basemap lod scales
    var basemapScales = [];
    array.forEach(baseMapLayers, function(layer){
      if (layer.baseMapLayer) {
        if (layer.layerObject.tileInfo) {
          basemapScales = basemapScales.concat(array.map(layer.layerObject.tileInfo.lods, function(lod){
            return lod.scale;
          }));
        }
      }
    });

    // if one scale value is the same we assume they fit
    var areEqual = array.some(layerObject.resourceInfo.tileInfo.lods, function(lod){
      return array.some(basemapScales, function(bScale){
        return bScale === lod.scale;
      });
    });

    //console.log(areEqual);
    return areEqual;
  }

  function _initLayer(layerObject, layers, options, mapSR, baseMapLayers){
    //console.log("initLayer " + (layerObject.url) ? layerObject.url : layerObject.type);
    var layer, clazz = options._clazz;

    if (layerObject.type === "OpenStreetMap") {

      layer = new OpenStreetMapLayer({
        id: layerObject.id,
        opacity: layerObject.opacity,
        visible: (layerObject.visibility !== null && layerObject.visibility !== undefined) ? layerObject.visibility : true
      });

    } else if (layerObject.type === "WMS") {

      // make all layers visible by default if not specified otherwise
      var visibleLayers = [];
      var layerInfos = [];
      array.forEach(layerObject.layers, function(layer){
        layerInfos.push(new WMSLayerInfo({
          name: layer.name,
          title: layer.title,
          legendURL: layer.legendURL
        }));
        visibleLayers.push(layer.name);
      }, this);

      if (layerObject.visibleLayers) {
        visibleLayers = layerObject.visibleLayers;
      }

      var gcsExtent = new Extent(layerObject.extent[0][0], layerObject.extent[0][1], layerObject.extent[1][0], layerObject.extent[1][1], new SpatialReference({
        wkid: 4326
      }));

      var resourceInfo = {
        extent: gcsExtent,
        layerInfos: layerInfos,
        version: layerObject.version,
        maxWidth: layerObject.maxWidth,
        maxHeight: layerObject.maxHeight,
        getMapURL: layerObject.mapUrl,
        spatialReferences: layerObject.spatialReferences,
        title: layerObject.title,
        copyright: layerObject.copyright,
        minScale: layerObject.minScale || 0,
        maxScale: layerObject.maxScale || 0,
        format: layerObject.format
      };

      layer = new WMSLayer(layerObject.url, {
        id: layerObject.id,
        visibleLayers: visibleLayers,
        format: "png",
        transparent: layerObject.baseMapLayer ? false : true,
        opacity: layerObject.opacity,
        visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        resourceInfo: resourceInfo,
        refreshInterval: layerObject.refreshInterval
      });

      // layer should be set to first id in spatial reference list
      layer.spatialReference.wkid = resourceInfo.spatialReferences[0];

    } else if (layerObject.type === "KML") {

      var url = layerObject.url;

      // we need to replace custom org URL from owner user's org if current user is from a different org,
      // otherwise the user token does not fit to the org domain
      if (esriKernel.id) {
        var credentials = esriKernel.id.findCredential(urlUtils.urlToObject(arcgisUtils.arcgisUrl).path);
        if (credentials) {
          var domain = arcgisUtils.arcgisUrl.substring(arcgisUtils.arcgisUrl.indexOf("//") + 2,
              arcgisUtils.arcgisUrl.indexOf("/", arcgisUtils.arcgisUrl.indexOf("//") + 3));
          var list = domain.split(".");
          var shortDomain = list[list.length - 2] + "." + list[list.length - 1];
          var pos = url.indexOf(shortDomain);
          if (pos > -1) {
            // always make an https call because the owner org might now have secure access but stored the URL earlier as http
            url = "https://" + domain + url.substring(pos + shortDomain.length);
            url += "?token=" + credentials.token;
          }
        }
      }

      layer = new KMLLayer(url, {
        id: layerObject.id,
        visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        outSR: mapSR,
        refreshInterval: layerObject.refreshInterval
      });

      layer.on("load", function() {
        if (layerObject.opacity || layerObject.opacity === 0) {
          layer.setOpacity(layerObject.opacity);
        }

        if (esriLang.isDefined(layerObject.minScale) && esriLang.isDefined(layerObject.maxScale)) {
          layer.setScaleRange(layerObject.minScale, layerObject.maxScale);
        }

        if (layerObject.visibleFolders) {
          array.forEach(layer.folders, function(folder) {
            if (array.indexOf(layerObject.visibleFolders, folder.id) > -1) {
              layer.setFolderVisibility(folder, true);
            }
            else {
              layer.setFolderVisibility(folder, false);
            }
          }, this);
        }
      });

    } else if (layerObject.type === "WebTiledLayer") {

      layer = new WebTiledLayer(layerObject.templateUrl, {
        id: layerObject.id,
        visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        opacity: layerObject.opacity,
        copyright: layerObject.copyright,
        fullExtent: layerObject.fullExtent && new Extent(layerObject.fullExtent),
        initialExtent: layerObject.fullExtent && new Extent(layerObject.fullExtent),
        subDomains: layerObject.subDomains,
        tileInfo: layerObject.tileInfo ? TileInfo.fromJSON(layerObject.tileInfo) : null,
        refreshInterval: layerObject.refreshInterval
      });

      layer.on("load", function(){

        // scale
        if (esriLang.isDefined(layerObject.minScale) || esriLang.isDefined(layerObject.maxScale)) {
          layer.setScaleRange(layerObject.minScale, layerObject.maxScale);
        }

      });

    } else if (layerObject.type === "GeoRSS") {

      layer = new GeoRSSLayer(layerObject.url, {
        id: layerObject.id,
        // visible: (layerObject.visibility !== null) ? layerObject.visibility : true, can't set this here
        opacity: layerObject.opacity,
        outSpatialReference: mapSR,
        refreshInterval: layerObject.refreshInterval
      });

      layer.on("load", function(){

        // can't set visibility in the constructor
        if (layerObject.visibility === false) {
          layer.hide();
        }

        if (esriLang.isDefined(layerObject.minScale) && esriLang.isDefined(layerObject.maxScale)){
          layer.setScaleRange(layerObject.minScale, layerObject.maxScale);
        }

        var subLayers = layer.getFeatureLayers();
        array.forEach(subLayers, function(subLayer) {
          // symbol
          if (layerObject.pointSymbol && subLayer.geometryType === "esriGeometryPoint") {
            subLayer.renderer.symbol = symJsonUtils.fromJSON(layerObject.pointSymbol);
            if (subLayers.length === 1) {
              // also update the renderer on the group layer; so it will stick on refreshInterval reload
              layer.pointSymbol = symJsonUtils.fromJSON(layerObject.pointSymbol);
            }
          } else if (layerObject.lineSymbol && subLayer.geometryType === "esriGeometryPolyline") {
            subLayer.renderer.symbol = symJsonUtils.fromJSON(layerObject.lineSymbol);
            if (subLayers.length === 1) {
              // also update the renderer on the group layer; so it will stick on refreshInterval reload
              layer.polylineSymbol = symJsonUtils.fromJSON(layerObject.lineSymbol);
            }
          } else if (layerObject.polygonSymbol && subLayer.geometryType === "esriGeometryPolygon") {
            subLayer.renderer.symbol = symJsonUtils.fromJSON(layerObject.polygonSymbol);
            if (subLayers.length === 1) {
              // also update the renderer on the group layer; so it will stick on refreshInterval reload
              layer.polygonSymbol = symJsonUtils.fromJSON(layerObject.polygonSymbol);
            }
          }
        });

      });

    } else if (layerObject.type == "CSV" && layerObject.url) {

      var csvOptions = {
        layerDefinition: layerObject.layerDefinition,
        columnDelimiter: layerObject.columnDelimiter,
        id: layerObject.id ? layerObject.id : null,
        visible: (layerObject.visibility !== null) ? layerObject.visibility : true,
        opacity: layerObject.opacity,
        refreshInterval: layerObject.refreshInterval
      };
      if (layerObject.locationInfo) {
        csvOptions.latitudeFieldName = layerObject.locationInfo.latitudeFieldName;
        csvOptions.longitudeFieldName = layerObject.locationInfo.longitudeFieldName;
      }
      if (!options.ignorePopups) {
        csvOptions.popupTemplate = new PopupTemplate(layerObject.popupInfo ?
            layerObject.popupInfo : csv.generateDefaultPopupInfo(layerObject));
      }
      layer = new CSVLayer(layerObject.url, csvOptions);

    // } else if (layerObject.type == "Feature Collection") { feature collection items are at this point simple feature collection layers
    } else if (layerObject.layerDefinition && !layerObject.url) { //feature layer from featureCollection

      var clonedLayerObject = JSON.parse(JSON.stringify(layerObject)); //clone to eliminate circular reference problems with _json property in featurelayer
      delete clonedLayerObject.id;
      delete clonedLayerObject.opacity;
      delete clonedLayerObject.visibility;

      layer = new FeatureLayer(clonedLayerObject, {
        id: layerObject.id,
        opacity: layerObject.opacity,
        visible: layerObject.visibility,
        outFields: ["*"],
        autoGeneralize: true
      });

      if (!options.ignorePopups && clonedLayerObject.popupInfo) {
        layer.popupTemplate = new clazz(clonedLayerObject.popupInfo);
      }

      _checkUnsupportedRendererType(layer);
    } else if ((layerObject.type === "BingMapsAerial" || layerObject.type === "BingMapsRoad" || layerObject.type === "BingMapsHybrid")){

      if (options.bingMapsKey) {
        var style = VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS; // type == "BingMapsHybrid"
        if (layerObject.type === "BingMapsAerial") {
          style = VETiledLayer.MAP_STYLE_AERIAL;
        } else if (layerObject.type === "BingMapsRoad") {
          style = VETiledLayer.MAP_STYLE_ROAD;
        }

        // load as Bing layer
        layer = new VETiledLayer({
          bingMapsKey: options.bingMapsKey,
          mapStyle: style,
          opacity: layerObject.opacity,
          id: layerObject.id
        });

        layer.on("error", lang.hitch(this, function(layerObject) {
          layerObject.errors = layerObject.errors || [];
          var error = { message: "This application does not have a valid Bing Key for the Bing layer that is included in this map. [type:" + layerObject.type + "]"};
          layerObject.errors.push(error);
        }, layerObject));
      } else {
        layerObject.errors = layerObject.errors || [];
        var error = { message: "This application does not provide a Bing Key for the Bing layer that is included in this map. [type:" + layerObject.type + "]"};
        layerObject.errors.push(error);
      }

    } else if (layerObject.resourceInfo && layerObject.resourceInfo.mapName) {

      //map service
      if (layerObject.resourceInfo.singleFusedMapCache === true &&
      (layerObject.baseMapLayer ||
      (_sameSpatialReferenceAsBasemap(layerObject, layers, mapSR) && _sameTilingSchemeAsBasemap(layerObject, baseMapLayers)))) {
        layer = _loadAsCached(layerObject, clazz, options);
      }
      else {
        layer = _loadAsDynamic(layerObject, clazz, options);
      }

    } else if (layerObject.resourceInfo && layerObject.resourceInfo.pixelSizeX) {

      //if the imageServiceLayer is cached, treat it as ArcGISTiledMapService
      //when the layer is a singleFusedMapCache, it must have "fullExtent" and "TileInfo" properties,
      //so that _sameSpatialReferenceAsBasemap and _sameTilingSchemeAsBasemap functions can work.
      if (layerObject.resourceInfo.singleFusedMapCache === true &&
      (layerObject.baseMapLayer ||
      (_sameSpatialReferenceAsBasemap(layerObject, layers, mapSR) && _sameTilingSchemeAsBasemap(layerObject, baseMapLayers)))) {
      //TODO: if (options.ignorePopups || !layerObject.popupInfo), it should create it as imageMapServiceLayer
        layer = _loadAsCached(layerObject, clazz, options);
      }
      else {
        layer = _loadAsImage(layerObject, clazz, options);
      }

    } else if (layerObject.resourceInfo && layerObject.resourceInfo.type === "Feature Layer") {

      // Feature layer
      if (layerObject.capabilities) {
        // webmap might set the layer to not be editable
        layerObject.resourceInfo.capabilities = layerObject.capabilities;
      }

      layer = new FeatureLayer(_checkUrl(layerObject.url), {
        resourceInfo: layerObject.resourceInfo,
        opacity: layerObject.opacity,
        visible: layerObject.visibility,
        id: layerObject.id,

        mode: _isHostedService(layerObject.url) ?
            FeatureLayer.MODE_AUTO
            : (esriLang.isDefined(layerObject.mode) ?
                layerObject.mode
                : FeatureLayer.MODE_ONDEMAND
            ),

        editable: options.editable === false ? false : undefined,
        outFields: ["*"],
        autoGeneralize: true,
        refreshInterval: layerObject.refreshInterval
      });

      if (!options.ignorePopups && layerObject.popupInfo) {
        layer.popupTemplate = new clazz(layerObject.popupInfo);
      }

      if (layerObject.layerDefinition) {

        // is there a renderer defined for the layer
        if (layerObject.layerDefinition.drawingInfo && layerObject.layerDefinition.drawingInfo.renderer) {
          var renderer = rndJsonUtils.fromJSON(layerObject.layerDefinition.drawingInfo.renderer);
          renderer.isMaxInclusive = true;
          layer.setRenderer(renderer);
        }

        // is there labelingInfo defined for the layer
        if (layerObject.layerDefinition.drawingInfo && layerObject.layerDefinition.drawingInfo.labelingInfo) {
          var labelingInfo = array.map(layerObject.layerDefinition.drawingInfo.labelingInfo, function(labelClass) {
            return new LabelClass(labelClass);
          });
          layer.setLabelingInfo(labelingInfo);
        }

        if (layerObject.layerDefinition.definitionExpression) {
          layer.setDefinitionExpression(layerObject.layerDefinition.definitionExpression);
        }

        if (esriLang.isDefined(layerObject.layerDefinition.minScale)) {
          layer.setMinScale(layerObject.layerDefinition.minScale);
        }
        if (esriLang.isDefined(layerObject.layerDefinition.maxScale)) {
          layer.setMaxScale(layerObject.layerDefinition.maxScale);
        }
      }

      _checkUnsupportedRendererType(layer);
    } else if (layerObject.resourceInfo && layerObject.resourceInfo.streamUrls) {
      //Stream Layer
      var layerOptions = {
          resourceInfo: layerObject.resourceInfo,
          opacity: layerObject.opacity,
          visible: layerObject.visibility,
          id: layerObject.id
        },
        filter,
        drawingInfo,
        jsonrenderer;

      //check if need filter and maximumTrackPoints
      if (layerObject.layerDefinition){
        drawingInfo = layerObject.layerDefinition.drawingInfo;
        if (layerObject.layerDefinition.definitionGeometry){
          filter = filter || {};
          filter.geometry = layerObject.layerDefinition.definitionGeometry;
        }
        if (esriLang.isDefined(layerObject.layerDefinition.definitionExpression)){
          filter = filter || {};
          filter.where = layerObject.layerDefinition.definitionExpression;
        }
        if (esriLang.isDefined(layerObject.layerDefinition.maximumTrackPoints)){
          layerOptions.maximumTrackPoints = layerObject.layerDefinition.maximumTrackPoints;
        }
      }
      if (filter){
        layerOptions.filter = filter;
      }

      //set purge options
      if (layerObject.purgeOptions){
        layerOptions.purgeOptions = layerObject.purgeOptions;
      }

      //create layer
      layer = new StreamLayer(_checkUrl(layerObject.url), layerOptions);

      //set renderer
      if (drawingInfo && drawingInfo.renderer) {
        jsonrenderer = drawingInfo.renderer;
        layer.setRenderer(rndJsonUtils.fromJSON(jsonrenderer));
      }

      //set popups
      if (!options.ignorePopups && layerObject.popupInfo) {
        layer.popupTemplate = new clazz(layerObject.popupInfo);
      }

      // set scale range
      if (layerObject.layerDefinition) {
        if (esriLang.isDefined(layerObject.layerDefinition.minScale)) {
          layer.setMinScale(layerObject.layerDefinition.minScale);
        }
        if (esriLang.isDefined(layerObject.layerDefinition.maxScale)) {
          layer.setMaxScale(layerObject.layerDefinition.maxScale);
        }
      }

      //trap errors - usually websocket connection problem
      on.once(layer, "error", function(e){
        layerObject.errors.push({message: "Error loading stream layer. Check websocket url"});
      });
    } // else layer is not accessible or of unknown type

    if (layer) {
      layer.arcgisProps = {
        title: layerObject.title
      };

      // so BasemapGallery widget knows what layers to remove on a switch ...
      if (layerObject.baseMapLayer) {
        if (layerObject.isReference) {
          layer._basemapGalleryLayerType = "reference";
        } else {
          layer._basemapGalleryLayerType = "basemap";
        }
      }
    }

    return layer;
  }

  function _buildLayerObjects(layers, options, mapSR, baseMapLayers){

    array.forEach(layers, function(layer, index) {
      if (layer.url && !layer.type) {
        // ArcGIS
        if (index === 0 || layers[0].layerObject) {
          layer.layerObject = _initLayer(layer, layers, options, mapSR, baseMapLayers);
        }
      }
      else {
        layer.layerObject = _initLayer(layer, layers, options, mapSR, baseMapLayers);
      }
    });

    var nonRefLayers = array.filter(layers, function(lyr){
      return !lyr.isReference;
    });
    var refLayers = array.filter(layers, function(lyr){
      return !!lyr.isReference;
    });
    layers = nonRefLayers.concat(refLayers);
    return layers;
  }

  function _getMapSR(layers){

    // first layer in map defines map spatial reference
    var mapSR = null;
    var layer = layers[0];
    if (layer.url && !layer.type) {
      // ArcGIS
      if (layer.resourceInfo.spatialReference) {
        mapSR = new SpatialReference();
        if (layer.resourceInfo.spatialReference.wkid) {
          mapSR.wkid = layer.resourceInfo.spatialReference.wkid;
        }
        if (layer.resourceInfo.spatialReference.wkt) {
          mapSR.wkt = layer.resourceInfo.spatialReference.wkt;
        }
      }
    } else if (layer.type.indexOf("BingMaps") > -1 || layer.type == "OpenStreetMap") {
      // BING, OSM
      mapSR = new SpatialReference({
        wkid: 102100
      });
    } else if (layer.type == "WMS") {
      // WMS
      mapSR = new SpatialReference({
        wkid: layer.spatialReferences[0]
      });
    }
    return mapSR;
  }

  function _preBuildLayerObjects(response, layers, options, deferreds, deferred, mapSR, baseMapLayers){

    array.forEach(layers, function(layer, index){
      if (layer.url && !layer.type) {
        // ArcGIS
        //if (deferreds[layer.deferredsPos] && deferreds[layer.deferredsPos].ioArgs) {
          layer.resourceInfo = response[layer.deferredsPos][1]; //deferreds[layer.deferredsPos].ioArgs.json;
          delete layer.deferredsPos;
        //}

      } // already done with type "Feature Collection"
    });

    // we need bottom most layer to get the spatial reference
    mapSR = mapSR || _getMapSR(layers);

    layers = _buildLayerObjects(layers, options, mapSR, baseMapLayers);
    deferred.callback(layers);

    return deferred.promise;
  }

  function _checkUnsupportedRendererType(featureLayer) {
    if (!window.CanvasRenderingContext2D &&
        featureLayer.renderer &&
        featureLayer.renderer.declaredClass === "esri.renderer.HeatmapRenderer") {
      var simpleRendererJson = {
        "type": "simple",
        "symbol": {
          "color": [77, 77, 77, 255],
          "size": 6,
          "angle": 0,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSCircle",
          "outline": {
            "color": [255, 255, 255, 255],
            "width": 0.75,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        }
      };
      featureLayer.setRenderer(rndJsonUtils.fromJSON(simpleRendererJson));
    }
  }

  function _getServiceInfo(url, errors){
    var url2 = _checkUrl(url);
    return esriRequest({
      url: url2,
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      error: function(error, io){
        if (error.message) {
          error.message += " [url:" + url2 + "]";
        } else {
          error.message = "[url:" + url2 + "]";
        }
        errors.push(error);
      }
    });
  }

  function _getFeatureCollectionItem(layer) {

    var url = arcgisUtils.arcgisUrl + "/" + layer.itemId + "/data";
    return esriRequest({
      url: url,
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      error: function(error, io){
        if (error.message) {
          error.message += " [url:" + url + "]";
        } else {
          error.message = "[url:" + url + "]";
        }
        layer.errors = layer.errors || [];
        layer.errors.push(error);
      }
    });
  }

  function _mergeFeatureCollectionItem(layer, mapSR, itemData) {

    var deferred = new Deferred();

    if (!(itemData.featureCollection && itemData.featureCollection.layers) && !itemData.layers) {
      // invalid feature collection
      console.log("Invalid Feature Collection item data [item id: " + layer.itemId + "]: ", itemData);
      layer.errors = layer.errors || [];
      var error = { message: "Invalid Feature Collection item data. [item id: " + layer.itemId + "]"};
      layer.errors.push(error);

      deferred.errback();
      return deferred.promise;
    }

    if (itemData.layers) {
      // change to the style we used to have
      itemData.featureCollection = {layers: itemData.layers};
      delete itemData.layers;
      if (esriLang.isDefined(itemData.showLegend)) {
        itemData.featureCollection.showLegend = itemData.showLegend;
        delete itemData.showLegend;
      }
    }

    _projectFeatureCollection(layer, itemData.featureCollection, mapSR).then(function(featureCollection) {

      // we only want the projected data
      itemData.featureCollection = featureCollection;

      if (layer.featureCollection && layer.featureCollection.layers) {

        array.forEach(itemData.featureCollection.layers, function(itemLayer, idx) {
          var webMapLayer = layer.featureCollection.layers[idx];
          if (!webMapLayer.poupInfo && !webMapLayer.layerDefinition) {
            webMapLayer.popupInfo = itemLayer.popupInfo;
            webMapLayer.layerDefinition = itemLayer.layerDefinition;
          } else {
            //  web map saved properties overwrite item saved properties
            if (webMapLayer.layerDefinition) {
              if (esriLang.isDefined(webMapLayer.layerDefinition.minScale) && esriLang.isDefined(webMapLayer.layerDefinition.maxScale) &&
                (webMapLayer.layerDefinition.minScale !== itemLayer.layerDefinition.minScale || webMapLayer.layerDefinition.maxScale !== itemLayer.layerDefinition.maxScale)) {
                delete itemLayer.layerDefinition.minscale;
                delete itemLayer.layerDefinition.maxScale;
              }
              if (webMapLayer.layerDefinition.drawingInfo &&
                JSON.stringify(webMapLayer.layerDefinition.drawingInfo) !== JSON.stringify(itemLayer.layerDefinition.drawingInfo)) {
                delete itemLayer.layerDefinition.drawingInfo;
              }
              if (webMapLayer.layerDefinition.showLegend !== itemLayer.layerDefinition.showLegend) {
                delete itemLayer.layerDefinition.showLegend;
              }
              webMapLayer.layerDefinition = lang.mixin(webMapLayer.layerDefinition, itemLayer.layerDefinition);
            } else {
              webMapLayer.layerDefinition = itemLayer.layerDefinition;
            }
          }
          webMapLayer.featureSet = itemLayer.featureSet;
          webMapLayer.nextObjectId = itemLayer.nextObjectId;
        });

      } else {
        // no layers in web map
        layer.featureCollection = layer.featureCollection || {};
        layer.featureCollection = lang.mixin(layer.featureCollection, itemData.featureCollection);
      }

      deferred.callback(layer);
    });

    return deferred.promise;
  }

  function _projectFeatureCollection(configLayer, featureCollection, mapSR) {

    var deferred = new Deferred();

    require(["./csv"], function(csv) {
      var deferreds2 = [];

      array.forEach(featureCollection.layers, function(layer) {
        if (layer.featureSet && layer.featureSet.features &&
            layer.featureSet.features.length &&
            layer.featureSet.features[0].geometry &&
            layer.featureSet.features[0].geometry.spatialReference) {
          layer.deferredsPos = deferreds2.length;
          var inSR = layer.featureSet.features[0].geometry.spatialReference;
          deferreds2.push(csv.projectFeatureCollection(layer, mapSR, inSR));
        }
      });

      promiseList(deferreds2).then(function() {
        array.forEach(featureCollection.layers, function(layer) {
          if (esriLang.isDefined(layer.deferredsPos)) {
            if (deferreds2[layer.deferredsPos].results && deferreds2[layer.deferredsPos].results.length) {
              layer = deferreds2[layer.deferredsPos].results[0];
            }
            else {
              // error during projection
              console.log("Errors projecting feature collection. [" + configLayer.title + " - " + layer.layerDefinition.name + "]");
              layer.errors = layer.errors || [];
              var error = { message: "Errors projecting feature collection. [" + configLayer.title + " - " + layer.layerDefinition.name + "]"};
              layer.errors.push(error);

              // feature geometries might be wrong now, but leave them in anyway
            }
            delete layer.deferredsPos;
          } // layer had no features
        });

        deferred.callback(featureCollection);
      });
    });

    return deferred.promise;
  }

  function _getLayers(webMap, options, mapSR, baseMapLayers) {

    // we don't know how many layers a feature collection item has
    // so get it first before we make a list of all layers

    var deferred = new Deferred();
    var localDef = new Deferred();
    var deferreds = [];

    array.forEach(webMap.operationalLayers, function(layer) { //look for feature collections and explode them out as individual feature layers
      if (layer.itemId && layer.type == "Feature Collection") {
        deferreds.push(
            _getFeatureCollectionItem(layer).then(lang.hitch(null, _mergeFeatureCollectionItem, layer, mapSR))
        );
      }
    });

    if (deferreds.length === 0) {
      _getLayers_AfterFeatureCollections(webMap, options, mapSR, baseMapLayers, localDef);
    }
    else {
      promiseList(deferreds).then(function(response) {
        _getLayers_AfterFeatureCollections(webMap, options, mapSR, baseMapLayers, localDef);
      });
    }

    localDef.then(function(layers) {
      // wait for the FeatureLayers to load
      deferreds = [];
      array.forEach(layers, function(layer) {
        layer = layer.layerObject;
        if (layer instanceof FeatureLayer && !layer.loaded && !layer.loadError) {
          var loadDef = new Deferred();
          on.once(layer, "load, error", function() {
            loadDef.callback(layer);
          });
          deferreds.push(loadDef);
        }
      });
      if (deferreds.length) {
        var def = new Deferred();
        promiseList(deferreds).then(function() {
          def.callback(layers);
        });
        return def.promise;
      }
      else {
        return layers;
      }
    }).then(function(layers) {
      // create LabelLayer if needed
      var labelFLyrs = [];
      array.forEach(layers, function(layer) {
        if (layer.layerObject instanceof FeatureLayer) {
          var fLyr = layer.layerObject;
          if (fLyr.loaded &&
              fLyr.labelingInfo &&
              (layer.showLabels || fLyr._collection)) {
            labelFLyrs.push(fLyr);
          }
        }
      });
      if (labelFLyrs.length) {
        require(["../layers/LabelLayer"], function(LabelLayer) {
          var labelLayer = new LabelLayer();
          array.forEach(labelFLyrs, function(fLyr) {
            labelLayer.addFeatureLayer(fLyr);
          });
          layers.push({ layerObject: labelLayer });
          deferred.callback(layers);
        });
      }
      else {
        deferred.callback(layers);
      }
    });

    return deferred.promise;
  }

  function _getLayers_AfterFeatureCollections(webMap, options, mapSR, baseMapLayers, deferred){

    var layers = [];
    var deferreds = [];
    var newOpLayers = [];

    array.forEach(webMap.operationalLayers, function(layer, index){ //look for feature collections and explode them out as individual feature layers
      if (layer.featureCollection) {
        array.forEach(layer.featureCollection.layers, function(fcLayer, idx){
          // operational layer must be visible and layer index must be in visibleLayers list for layer to be visible
          var layerVisible = true;
          if (layer.visibleLayers) {
            if (array.indexOf(layer.visibleLayers, idx) == -1) {
              layerVisible = false;
            }
          }
          fcLayer.visibility = (layer.visibility && layerVisible);
          fcLayer.opacity = layer.opacity;
          fcLayer.id = (layer.id || ("operational" + index)) + "_" + idx;
          newOpLayers.push(fcLayer);
        }, this);
      } else {
        newOpLayers.push(layer);
      }
    });

    // TODO
    // Find another way to pass "id" to _initLayer instead of
    // adding it as a member of the layer object. Also, other
    // properties like "baseMapLayer", "resourceInfo", "errors"
    // "deferredsPos", "layerObject"
    array.forEach(webMap.baseMap.baseMapLayers, function(layer, index){
      layer.baseMapLayer = true;
      layer.id = layer.id || ("base" + index);
      layers.push(layer);
    });
    array.forEach(newOpLayers, function(layer, index){
      layer.id = layer.id || ("operational" + index);
      layers.push(layer);
    });

    array.forEach(layers, function(layer){
     if (layer.url && !layer.type) {
        // ArcGIS
        layer.deferredsPos = deferreds.length;
        layer.errors = layer.errors || [];
        deferreds.push(_getServiceInfo(layer.url, layer.errors));
        // no mapSR yet
        //      } else {
        //        layer.layerObject = EAU._initLayer(layer, layers, options);

      } // already done with type "Feature Collection"
    });

    if (deferreds.length === 0) {
      // map contains no ArcGIS layers
      mapSR = mapSR || _getMapSR(layers);
      layers = _buildLayerObjects(layers, options, mapSR, baseMapLayers);
      deferred.callback(layers);
    } else {
      promiseList(deferreds).then(function(response){
        _preBuildLayerObjects(response, layers, options, deferreds, deferred, mapSR, baseMapLayers);
      });
    }

    return deferred.promise;
  }

  function _updateLayerScaleInfo(mapLayer, layers, layer, id){
    // for ArcGIS < v10.1 beta2 one must also consider parent layer scale info
    // and this works only for ArcGIS v10.01 where scale info gets returned for each layer in a service info request
    // nothing (reasonable) that can be done for ArcGIS <= v10.0
    var minScale = mapLayer.minScale;
    var maxScale = mapLayer.maxScale;
    var i;
    if (layer.version <= 10.1 && layers) {
      // layers are ordered by id
      for (i = layers.length - 1; i >= 0; i--) {
        if (layers[i].id == id) {
          // merge scales
          if (minScale == 0 && layers[i].minScale > 0) {
            minScale = layers[i].minScale;
          } else if (minScale > 0 && layers[i].minScale == 0) {
            minScale = layer.minScale;
          } else if (minScale > 0 && layers[i].minScale > 0) {
            minScale = Math.min(minScale, layers[i].minScale);
          }
          maxScale = Math.max(layer.maxScale || 0, layers[i].maxScale || 0);
          layer.setScaleRange(minScale, maxScale);
          // is this layer in a group layer?
          if (layers[i].parentLayerId > -1) {
            id = layers[i].parentLayerId;
          } else {
            break;
          }
        }
      }
    } else if (layer.version > 10.1) {
      // layer.layerInfo contains minScale and maxScale; dynamicLayerInfos does not contain scale info
      var layerInfos = mapLayer.layerInfos;
      array.forEach(layerInfos, function(layerInfo){
        if (layerInfo.id == id) {
          // merge services scales with sub layer scales
          if (minScale == 0 && layerInfo.minScale > 0) {
            minScale = layerInfo.minScale;
          } else if (minScale > 0 && layerInfo.minScale == 0) {
            // jshint noempty: false
            // minScale = minScale;
          } else if (minScale > 0 && layerInfo.minScale > 0) {
            minScale = Math.min(minScale, layerInfo.minScale);
          }
          maxScale = Math.max(maxScale || 0, layerInfo.maxScale || 0);
        }
      });
      layer.setScaleRange(minScale, maxScale);
    }
  }

  function _createSelectionFeatureLayers(mapLayer, layers, clazz, map){
    var url = mapLayer.url;
    var popups = mapLayer.__popups; // see _loadAsDynamic function
    var ids = mapLayer.__popupIds;
    var urls = mapLayer.__popupUrls;
    var whereClauses = mapLayer.__popupWhereClauses;
    var minScales = mapLayer.__popupMinScales;
    var maxScales = mapLayer.__popupMaxScales;
    var serviceResourceInfo = mapLayer.__resourceInfo;

    var selectionLayers = [];

    array.forEach(popups, function(popup, index){
      if (!popup) {
        return;
      }

      var featureLayer, outFields = [];
      array.forEach(popup.fieldInfos, function(item){
        if (item.fieldName.toLowerCase() !== "shape") {
          outFields.push(item.fieldName);
        }
      });

      if (mapLayer.dynamicLayerInfos && mapLayer.dynamicLayerInfos.length > 0) {
        var source = array.filter(mapLayer.dynamicLayerInfos, function(item){
                       return ids[index] == item.id;
                     })[0].source;
        featureLayer = new FeatureLayer(url + "/dynamicLayer", {
          id: mapLayer.id + "_" + ids[index],
          source: source,
          outFields: outFields,
          mode: FeatureLayer.MODE_SELECTION,
          popupTemplate: popup && new clazz(popup),
          drawMode: false,
          visible: mapLayer.visible,
          autoGeneralize: true
        });

        var finishLayerSettings = function(index, featureLayer) {
          if (whereClauses[index].length > 0) {
            featureLayer.setDefinitionExpression(whereClauses[index]);
          }

          if (!esriLang.isDefined(minScales[index]) && !esriLang.isDefined(maxScales[index])) {
            // merge scales from services with sub layers scales as set on server
            _updateLayerScaleInfo(mapLayer, layers || serviceResourceInfo.layers, featureLayer, ids[index]);
          } else if (esriLang.isDefined(mapLayer.minScale) || esriLang.isDefined(mapLayer.maxScale)) {
            // merge services scales with sub layer scales as set on item or web map
            var minScale = mapLayer.minScale;
            var maxScale = mapLayer.maxScale;
            if (minScale == 0 && minScales[index] > 0) {
              minScale = minScales[index];
            } else if (minScale > 0 && minScales[index] == 0) {
              // jshint noempty: false
              // minScale = minScale;
            } else if (minScale > 0 && minScales[index] > 0) {
              minScale = Math.min(minScale, minScales[index]);
            }
            maxScale = Math.max(maxScale || 0, maxScales[index] || 0);
            featureLayer.setScaleRange(minScale, maxScale);
          } else {
            // service has no scale settings so use sub layer scales as set on item or web map
            featureLayer.setScaleRange(minScales[index], maxScales[index]);
          }
        };

        if (featureLayer.loaded) {
          finishLayerSettings(index, featureLayer);
        } else {
          featureLayer.on("load", function(layer){
            finishLayerSettings(index, featureLayer);
          });
        }

      }
      else {

        var i, resourceInfo = null;

        var queryUrl = url + "/" + ids[index];
        if (urls[index].length) {
          // other feature layer setup as popup layer
          queryUrl = urls[index];
        } else {
          if (layers) {
            // re-use resourceInfo
            for (i = 0; i < layers.length; i++) {
              if (layers[i].id === ids[index]) {
                resourceInfo = layers[i];
                break;
              }
            }
          }
        }

        featureLayer = new FeatureLayer(_checkUrl(queryUrl), {
          id: mapLayer.id + "_" + ids[index],
          outFields: outFields,
          mode: FeatureLayer.MODE_SELECTION,
          popupTemplate: popup && new clazz(popup),
          drawMode: false,
          visible: mapLayer.visible,
          resourceInfo: resourceInfo,
          autoGeneralize: true
        });

        // query layer should get same scale as map service layer
        if (featureLayer.loaded) {
          if (whereClauses[index].length > 0) {
            featureLayer.setDefinitionExpression(whereClauses[index]);
          }
          // to fix group layer scale issue for servers <= 10.1; and merge sub layer scale with service scale
          _updateLayerScaleInfo(mapLayer, layers || serviceResourceInfo.layers, featureLayer, ids[index]);
        } else {
          featureLayer.on("load", function(layer){
            if (whereClauses[index].length > 0) {
              featureLayer.setDefinitionExpression(whereClauses[index]);
            }
            // to fix group layer scale issue for servers <= 10.1; and merge sub layer scale with service scale
            _updateLayerScaleInfo(mapLayer, layers || serviceResourceInfo.layers, layer, ids[index]);
          });
        }
      }

      selectionLayers.push(featureLayer);
    });

    if (selectionLayers.length > 0) {
      var onVisibilityChange = function(selectionLayers, visibility) {
        array.forEach(selectionLayers, function(layer) {
          if (visibility) {
            layer.show();
          } else {
            layer.hide();
          }
        });
      };
      mapLayer.on("visibility-change", lang.hitch(this, onVisibilityChange, selectionLayers));

      var onLayerRemove = function(mapLayer, selectionLayers, removedLayer) {
        if (mapLayer.id === removedLayer.id) {
          array.forEach(selectionLayers, function(layer){
            map.removeLayer(layer);
          });
        }
      };
      map.on("layer-remove", lang.hitch(this, onLayerRemove, mapLayer, selectionLayers));
    }

    delete mapLayer.__popups;
    delete mapLayer.__popupIds;
    delete mapLayer.__popupUrls;
    delete mapLayer.__popupWhereClauses;
    delete mapLayer.__popupMinScales;
    delete mapLayer.__popupMaxScales;
    delete mapLayer.__resourceInfo;

    return selectionLayers;
  }

  function _getLayersInfo(mapLayer){
    return esriRequest({
      url: _checkUrl(mapLayer.url + "/layers"),
      content: {
        f: "json"
      },
      callbackParamName: "callback",
      error: function(){
        // don't do anything
      }
    });
  }

  function _addSelectionLayers(mapLayers, map, clazz){
    // Add feature layers (in selection only mode) for map
    // service sublayers

    var deferreds = [];

    array.forEach(mapLayers, function(mapLayer){
      var popups = mapLayer.__popups; // see _loadAsDynamic function
      if (popups && popups.length > 1 && mapLayer.version >= 10) {
        mapLayer.__deferredsPos = deferreds.length;
        deferreds.push(_getLayersInfo(mapLayer));
      }
    });

    var selectionLayers = [];
    if (deferreds.length > 0) {
      promiseList(deferreds).then(function(response){
        array.forEach(mapLayers, function(mapLayer){
          if (mapLayer.__popups && mapLayer.__popups.length > 0) {
            if (mapLayer.__deferredsPos || mapLayer.__deferredsPos === 0) {
              var result = response[mapLayer.__deferredsPos][1]; //deferreds[mapLayer.__deferredsPos].ioArgs.json;
              selectionLayers = selectionLayers.concat(_createSelectionFeatureLayers(mapLayer, result.layers, clazz, map));
              delete mapLayer.__deferredsPos;
            } else {
              selectionLayers = selectionLayers.concat(_createSelectionFeatureLayers(mapLayer, null, clazz, map));
            }
          }
        });
        map.addLayers(selectionLayers);
      });
    } else {
      array.forEach(mapLayers, function(mapLayer){
        if (mapLayer.__popups && mapLayer.__popups.length > 0) {
          selectionLayers = selectionLayers.concat(_createSelectionFeatureLayers(mapLayer, null, clazz, map));
        }
      });
      map.addLayers(selectionLayers);
    }
  }

  function _onLayersAddResult(results){
    // add text symbols
    array.forEach(results, function(result){
      var layer = result.layer;
      if (layer.toJSON) {
        var json = layer.toJSON();
        if (json.featureSet && layer.name && layer.name.indexOf("Text") > -1) {
          // create text graphics
          array.forEach(json.featureSet.features, function(feature, idx){
            if (feature.attributes.TEXT) {
              // graphic is there, but symbol is not quite right
              var graphic = layer.graphics[idx];
              graphic.symbol.setText(feature.attributes.TEXT);
              if (feature.symbol.horizontalAlignment) {
                graphic.symbol.align = feature.symbol.horizontalAlignment;
              }
              graphic.setSymbol(graphic.symbol);
              graphic.setAttributes(feature.attributes);
            }
          }, this);
        }
      }
    });
  }

  function _calculateClickTolerance(featureLayers){
    // take a big symbol offset into consideration
    var tolerance = 6;
    array.forEach(featureLayers, function(layer){
      var renderer = layer.renderer;
      if (renderer) {
        if (renderer.declaredClass === "esri.renderer.SimpleRenderer") {
          var symbol = renderer.symbol;
          if (symbol && symbol.xoffset) {
            tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
          }
          if (symbol && symbol.yoffset) {
            tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
          }
        } else if (renderer.declaredClass === "esri.renderer.UniqueValueRenderer" || renderer.declaredClass === "esri.renderer.ClassBreaksRenderer") {
          array.forEach(renderer.infos, function(info){
            // kml servlet sometimes returns renderer.infos with no symbol at all
            var symbol = info.symbol;
            if (symbol && symbol.xoffset) {
              tolerance = Math.max(tolerance, Math.abs(symbol.xoffset));
            }
            if (symbol && symbol.yoffset) {
              tolerance = Math.max(tolerance, Math.abs(symbol.yoffset));
            }
          });
        }
      }
    });
    return tolerance;
  }

  function _showPopup(evt){
    //console.log("Map clicked");

    var map = this, popup = map.popup, clickedGraphic = evt.graphic;
    if (!map.loaded) {
      return;
    }

    popup.hide();
    popup.clearFeatures();

    // Get relevant feature layers from the map
    var popupLayers = [];
    array.forEach(map.graphicsLayerIds, function(layerId) {
      var layer = map.getLayer(layerId);

      if (layer && layer instanceof FeatureLayer && layer.loaded && layer.visible) {
        layer.clearSelection();

        if (layer.popupTemplate && !layer.suspended) {
          // layer is in scale ...
          popupLayers.push(layer);
        }
      }
    });

    array.forEach(map.layerIds, function (layerId) {
      var layer = map.getLayer(layerId);

      if (layer && layer.declaredClass.indexOf("ArcGISImageServiceLayer") !== -1 && layer.loaded && layer.visible && layer.popupTemplate) {
        popupLayers.push(layer);
      }
    });

    // Let's make sure this graphic is of interest to us.
    // Note: It's important that we're checking for this "here"
    // after any previous feature layer selection has been cleared above.
    clickedGraphic = (clickedGraphic && clickedGraphic.getEffectivePopupTemplate()) ? clickedGraphic : null;

    if (!popupLayers.length && !clickedGraphic) {
      //console.log("No valid feature layers");
      return;
    }

    var tolerance = _calculateClickTolerance(popupLayers);
    // Calculate the query extent
    var screenPoint = evt.screenPoint,
        bottomLeft = map.toMap(new ScreenPoint(screenPoint.x - tolerance, screenPoint.y + tolerance)),
        topRight = map.toMap(new ScreenPoint(screenPoint.x + tolerance, screenPoint.y - tolerance)),
        extent = new Extent(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y, map.spatialReference);

    // Create query parameters
    var query = new Query();
    query.geometry = extent;
    query.timeExtent = map.timeExtent;

    // Perform selection
    var closestFeatureFirst = true;
    var selectionDeferreds = array.map(popupLayers, function (layer) {
      var dfd;
      if (layer.declaredClass.indexOf("ArcGISImageServiceLayer") !== -1) {
        query.geometry = evt.mapPoint;
        closestFeatureFirst = false;
        var queryOptions = {};
        queryOptions.rasterAttributeTableFieldPrefix = "Raster.";
        queryOptions.returnDomainValues = true;
        dfd = layer.queryVisibleRasters(query, queryOptions);

        dfd.then(function () {
          var visibleRasters = layer.getVisibleRasters();
          // console.log("IS Selected features: ", visibleRasters.length, visibleRasters);
          return visibleRasters;
        });
      } else {
        dfd = layer.selectFeatures(query);

        dfd.then(function () {
          var selectedFeatures = layer.getSelectedFeatures();
          // Let's take care of the duplicate selections in
          // the Popup impl
          //console.log(" Selected features: ", selectedFeatures.length, selectedFeatures);

          // Make sure we return the array of features here because
          // Popup impl expects to receive an array of features.
          return selectedFeatures; // gets passed on to the popup impl
        });
      }
      return dfd.promise;
    });

    if (clickedGraphic) {
      var dfd = new Deferred();
      dfd.callback([clickedGraphic]);
      selectionDeferreds.splice(0, 0, dfd);
    }

    //console.log("Selection deferreds: ", selectionDeferreds);

    // Let's verify if all deferreds have been "fired". If so,
    // are there any features found?
    var pending = array.some(selectionDeferreds, function(dfd){
      return dfd.fired === -1;
    });

    if (!pending) {
      // All deferreds have been resolved
      var count = clickedGraphic ? 1 : 0;
      array.forEach(popupLayers, function(layer){
        if (layer.declaredClass.indexOf("ArcGISImageServiceLayer") !== -1) {
          count = count + layer.getVisibleRasters().length;
        } else {
          count = count + layer.getSelectedFeatures().length;
        }
      });

      if (!count) {
        // There are no selected features. Let's exit.
        //console.log("All deferreds resolved but no features.");
        return;
      }
    }

    popup.setFeatures(selectionDeferreds);
    popup.show(evt.mapPoint, {
      closestFirst: closestFeatureFirst
    });
  }

  function _firstTimeCreateMap(mapDiv, options) {
    var mapOptions = (options.mapOptions || {}), popup;

    if (!mapOptions.popup) {
      popup = new Popup({
        // Hide popup window when there are no features
        visibleWhenEmpty: false
      }, domConstruct.create("div"));

      mapOptions.popup = popup;
    }

    // Let's disable map's built-in behavior that
    // shows info window when a graphic is clicked
    if (!esriLang.isDefined(mapOptions.showInfoWindowOnClick) && !options.usePopupManager) {
      mapOptions.showInfoWindowOnClick = false;
    }
    var map = new Map(mapDiv, mapOptions);

    map.on("layers-add-result", _onLayersAddResult);

    return map;
  }

  function _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred){

    var map, handle, listener, errs;
    if (mapDiv.map) {
      //mapDiv is the deferred object actually if it has map property
      map = mapDiv.map;
      handle = mapDiv.clickEventHandle;
      listener = mapDiv.clickEventListener;
      errs = mapDiv.errors;
    }
    else {
      map = _firstTimeCreateMap(mapDiv, options);
      if (!(options.ignorePopups || options.disableClickBehavior || options.usePopupManager)) {
        // TODO
        // Do I have to add click behavior even when
        // webmap does not have any popup defined?
        // Probably not.
        // We need to make this decision after selection
        // layers have been identified and processed
        handle = map.on("click", _showPopup);
        listener = _showPopup;
      }
    }

    /*if (popup) {
     // Map would have finished creating its DOM structure
     // when the constructor above returns. Placing popup
     // inside the "root" eliminates the need to position map
     // container as "relative"
     dojo.place(popup.domNode, map.root);
     }*/

    map.addLayers(mapLayers);

    if (!options.ignorePopups && !options.usePopupManager) {
      // add these layers after the basemap is added
      _addSelectionLayers(mapLayers, map, options._clazz);
    }

    //aggregate the errors from previous _createMap method
    var errors = errs || [];
    array.forEach(layers, function(layer){
      if (layer.errors) {
        errors = errors.concat(layer.errors);
      }
    }, this);

    if (!map.loaded) {
      map.on("load", function(){
        deferred.callback({
          map: map,
          itemInfo: itemInfo,
          errors: errors,
          clickEventHandle: handle,
          clickEventListener: listener
        });
      });
    }
    else {
      deferred.callback({
        map: map,
        itemInfo: itemInfo,
        errors: errors,
        clickEventHandle: handle,
        clickEventListener: listener
      });
    }
  }

  function _preCreateMap(itemInfo, mapDiv, options, deferred, layers){

      //add other layers
      var mapLayers = [];
      array.forEach(layers, function(layer){
        if (lang.isArray(layer.layerObject)) {
          // e.g. KML
          array.forEach(layer.layerObject, function(l){
            mapLayers.push(l);
          });
        } else {
          mapLayers.push(layer.layerObject);
        }
      });

      // check Bing key if we have a Bing basemap
      if ((layers[0].type === "BingMapsAerial" || layers[0].type === "BingMapsRoad" || layers[0].type === "BingMapsHybrid")){
        // need to wait for Bing key validation
        var interval = setInterval(function() {
          if (layers[0].layerObject && layers[0].layerObject.loaded) {
            // all fine
            clearInterval(interval);
            _preCreateMapAfterBingCheck(itemInfo, mapDiv, options, deferred, layers, mapLayers);
          } else if (layers[0].errors) {
            // probably bad Bing key; we cannot load the web map
            clearInterval(interval);
            var msg = "";
            if (layers[0].errors && layers[0].errors.length) {
              msg = " ("+layers[0].errors[0].message+")";
            }
            deferred.errback(new Error(jsapiBundle.arcgis.utils.baseLayerError+msg));
          }
        }, 10);
      } else {
        // not a Bing basemap
        if (!mapLayers[0] && layers[0].baseMapLayer) {
          // basemap cause an error; we cannot load the web map
          var msg = "";
          if (layers[0].errors && layers[0].errors.length) {
            msg = " ("+layers[0].errors[0].message+")";
          }
          deferred.errback(new Error(jsapiBundle.arcgis.utils.baseLayerError+msg));
        } else {
          // we're at the 'second' web map containing only operational and reference layers
          _preCreateMapAfterBingCheck(itemInfo, mapDiv, options, deferred, layers, mapLayers);
        }
      }
  }

  function _preCreateMapAfterBingCheck(itemInfo, mapDiv, options, deferred, layers, mapLayers){

    try {

      var mapOptions = options.mapOptions || {};

      // mapOptions.extent is updated below. _createMap will not
      // see this extent unless we either do this here or add one more arg
      // to _createMap passing in "mapOptions" in addition to "options".
      options.mapOptions = mapOptions;

      var card = itemInfo.item;

      // lets not try to add layers that could not be loaded
      mapLayers = array.filter(mapLayers, esriLang.isDefined);

      if (card) {
        if (card.extent && card.extent.length) {
          if (!mapOptions.extent) {
            // convert the item card GCS extent into basemap spatial reference
            var extentGCS = new Extent(card.extent[0][0], card.extent[0][1], card.extent[1][0], card.extent[1][1], new SpatialReference({
              wkid: 4326
            }));
            var basemapSR = mapLayers[0].spatialReference;
            if (basemapSR.wkid === 4326) {
              mapOptions.extent = extentGCS;
              _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
            } else if (basemapSR.wkid === 102100 || basemapSR.wkid === 102113 || basemapSR.wkid === 3857) {
              // clip it, so it's not going to Infinity; otherwise the map doesn't load
              extentGCS.xmin = Math.max(extentGCS.xmin, -180);
              extentGCS.xmax = Math.min(extentGCS.xmax, 180);
              extentGCS.ymin = Math.max(extentGCS.ymin, -89.99);
              extentGCS.ymax = Math.min(extentGCS.ymax, 89.99);
              mapOptions.extent = webMercatorUtils.geographicToWebMercator(extentGCS);
              _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
            } else {
              if (options.geometryServiceURL || esriConfig.geometryService) {
                var gs;
                if (options.geometryServiceURL) {
                  gs = new GeometryService(options.geometryServiceURL);
                } else {
                  gs = esriConfig.geometryService;
                }
                gs.project([extentGCS], basemapSR, function(geometries){
                  var mapExtent = geometries[0];
                  mapOptions.extent = mapOptions.extent || mapExtent;
                  _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
                }, function(){
                  // project call failed
                  _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
                });
              } else {
                deferred.errback(new Error(jsapiBundle.arcgis.utils.geometryServiceError));
                //EAU._createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
              }
            }
          } else {
            _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
          }
        } else {
          _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
        }
      } else {
        _createMap(mapLayers, layers, itemInfo, mapDiv, options, deferred);
      }

    }
    catch (err) {
      deferred.errback(err);
    }
  }

  function _getLegendLayers(itemData) {

    var layerInfos = [];
    var layers = itemData.baseMap.baseMapLayers.concat(itemData.operationalLayers);
    array.forEach(layers, function(mapLayer) {
      var layerInfo = {};
      if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
        if (mapLayer.featureCollection.showLegend === true) {
          array.forEach(mapLayer.featureCollection.layers, function(fcMapLayer) {
            if (fcMapLayer.showLegend !== false) {
              // we only want to show the default symbol if it has a valid label
              layerInfo = {
                "layer": fcMapLayer.layerObject,
                "title": mapLayer.title,
                "defaultSymbol": (fcMapLayer.renderer && fcMapLayer.renderer.defaultSymbol && fcMapLayer.renderer.defaultLabel) ? true : false
              };
              if (mapLayer.featureCollection.layers.length > 1) {
                layerInfo.title += " - " + fcMapLayer.layerDefinition.name;
              }
              layerInfos.push(layerInfo);
            }
          });
        }
      }
      else if ((mapLayer.baseMapLayer && mapLayer.showLegend === true && mapLayer.layerObject) || 
        (!mapLayer.baseMapLayer && mapLayer.showLegend !== false && mapLayer.layerObject && !(mapLayer.layerObject instanceof esri.layers.FeatureLayer && mapLayer.layerObject.mode === esri.layers.FeatureLayer.MODE_SELECTION))) {
        // FL have a renderer, other layer types don't; for FL we only want to show the default symbol if it has a valid label
        // we always set showDefaultSymbol to true for MS but the legend widget will not show the default symbol if the label is not set or set to <all other values>
        var rend = mapLayer.layerObject.renderer;
        var declaredClass = mapLayer.layerObject.declaredClass;
        var showDefaultSymbol = (!rend || (rend && rend.defaultSymbol && rend.defaultLabel)) ? true : false;
        if ((mapLayer.layerObject.version < 10.1 && (declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" || declaredClass === "esri.layers.ArcGISTiledMapServiceLayer")) ||
            (declaredClass === "esri.layers.ArcGISImageServiceLayer")) {
          showDefaultSymbol = true;
        }
        layerInfo = {
          "layer": mapLayer.layerObject,
          "title": mapLayer.title,
          "defaultSymbol": showDefaultSymbol
        };
        //does it have layers too? If so check to see if showLegend is false
        if (mapLayer.layers) {
          var hideLayers = array.map(array.filter(mapLayer.layers, function(lyr) {
            return (lyr.showLegend === false);
          }), function(lyr) {
            return lyr.id;
          });
          if (hideLayers.length) {
            layerInfo.hideLayers = hideLayers;
          }
        }
        layerInfos.push(layerInfo);
      }
    });
    return layerInfos;
  }

  function _lazyLoadModules(itemInfo, options) {
    var deferred = new Deferred();

    var webMap = itemInfo.itemData;

    var layers = [];
    if (webMap.baseMap && webMap.baseMap.baseMapLayers) {
      layers = layers.concat(webMap.baseMap.baseMapLayers);
    }
    if (webMap.operationalLayers) {
      layers = layers.concat(webMap.operationalLayers);
    }

    var layerTypes = array.map(layers, function(layer) {
      return layer && layer.layerType;
    });

    var modules1 = [], // modules to be loaded 1st
        modules2 = []; // modules to be loaded 2nd

    var loadAllModules = false;
    for (var i = 0; i < layerTypes.length; i++) {
      var type = layerTypes[i];
      switch (type) {
        case "ArcGISFeatureLayer":
          // FeatureLayer is not lazy loaded
          if (array.indexOf(modules1, _LabelClassPath) === -1) {
            modules1.push(_LabelClassPath);
          }
          break;
        case "ArcGISImageServiceLayer":
        case "ArcGISTiledImageServiceLayer": // the tiled layer is not lazy loaded, but it may be loaded as a image layer
          if (array.indexOf(modules1, _ArcGISImageServiceLayerPath) === -1) {
            modules1.push(_ArcGISImageServiceLayerPath);
            modules2.push(_ImageServiceParametersPath);
            modules2.push(_MosaicRulePath);
            modules2.push(_RasterFunctionPath);
          }
          break;
        case "ArcGISImageServiceVectorLayer":
          if (array.indexOf(modules1, _ArcGISImageServiceVectorLayerPath) === -1) {
            modules1.push(_ArcGISImageServiceVectorLayerPath);
            modules2.push(_ImageServiceParametersPath);
            modules2.push(_MosaicRulePath);
            modules2.push(_RasterFunctionPath);
          }
          break;
        case "ArcGISMapServiceLayer":
        case "ArcGISTiledMapServiceLayer": // the tiled layer is not lazy loaded, but it may be loaded as a dynamic layer
          if (array.indexOf(modules1, _ArcGISDynamicMapServiceLayerPath) === -1) {
            modules1.push(_ArcGISDynamicMapServiceLayerPath);
            modules2.push(_DynamicLayerInfoPath);
            modules2.push(_ImageParametersPath);
            modules2.push(_LayerDrawingOptionsPath);
          }
          break;
        case "ArcGISStreamLayer":
          if (array.indexOf(modules1, _StreamLayerPath) === -1) {
            modules1.push(_StreamLayerPath);
          }
          break;
        case "BingMapsAerial":
        case "BingMapsHybrid":
        case "BingMapsRoad":
          if (array.indexOf(modules1, _VETiledLayerPath) === -1) {
            modules1.push(_VETiledLayerPath);
          }
          break;
        case "CSV":
          if (array.indexOf(modules1, _CSVLayerPath) === -1) {
            modules1.push(_CSVLayerPath);
            modules2.push(_csvPath);
          }
          break;
        case "GeoRSS":
          if (array.indexOf(modules1, _GeoRSSLayerPath) === -1) {
            modules1.push(_GeoRSSLayerPath);
          }
          break;
        case "KML":
          if (array.indexOf(modules1, _KMLLayerPath) === -1) {
            modules1.push(_KMLLayerPath);
          }
          break;
        case "OpenStreetMap":
          if (array.indexOf(modules1, _OpenStreetMapLayerPath) === -1) {
            modules1.push(_OpenStreetMapLayerPath);
          }
          break;
        case "WebTiledLayer":
          if (array.indexOf(modules1, _WebTiledLayerPath) === -1) {
            modules1.push(_WebTiledLayerPath);
            modules2.push(_TileInfoPath);
          }
          break;
        case "WMS":
          if (array.indexOf(modules1, _WMSLayerPath) === -1) {
            modules1.push(_WMSLayerPath);
            modules2.push(_WMSLayerInfoPath);
          }
          break;
        default:
          loadAllModules = true;
      }
      if (loadAllModules) {
        break;
      }
    }

    if (loadAllModules) {
      modules1 = _lazyModules1;
      modules2 = _lazyModules2;
    }

    if (modules1.length) {
      // load modules1
      require(modules1, function() {
        setClasses(modules1, arguments);
        if (modules2.length) {
          // load modules2
          require(modules2, function() {
            setClasses(modules2, arguments);
            deferred.resolve();
          });
        }
        else {
          deferred.resolve();
        }
      });
    }
    else {
      deferred.resolve();
    }

    function setClasses(modules, classes) {
      array.forEach(modules, function(module, idx) {
        switch (module) {
          case _ArcGISDynamicMapServiceLayerPath:
            ArcGISDynamicMapServiceLayer = classes[idx];
            break;
          case _ArcGISImageServiceLayerPath:
            ArcGISImageServiceLayer = classes[idx];
            break;
          case _ArcGISImageServiceVectorLayerPath:
            ArcGISImageServiceVectorLayer = classes[idx];
            break;
          case _csvPath:
            csv = classes[idx];
            break;
          case _CSVLayerPath:
            CSVLayer = classes[idx];
            break;
          case _DynamicLayerInfoPath:
            DynamicLayerInfo = classes[idx];
            break;
          case _GeoRSSLayerPath:
            GeoRSSLayer = classes[idx];
            break;
          case _ImageParametersPath:
            ImageParameters = classes[idx];
            break;
          case _ImageServiceParametersPath:
            ImageServiceParameters = classes[idx];
            break;
          case _KMLLayerPath:
            KMLLayer = classes[idx];
            break;
          case _LabelClassPath:
            LabelClass = classes[idx];
            break;
          case _LayerDrawingOptionsPath:
            LayerDrawingOptions = classes[idx];
            break;
          case _MosaicRulePath:
            MosaicRule = classes[idx];
            break;
          case _OpenStreetMapLayerPath:
            OpenStreetMapLayer = classes[idx];
            break;
          case _RasterFunctionPath:
            RasterFunction = classes[idx];
            break;
          case _StreamLayerPath:
            StreamLayer = classes[idx];
            break;
          case _TileInfoPath:
            TileInfo = classes[idx];
            break;
          case _VETiledLayerPath:
            VETiledLayer = classes[idx];
            break;
          case _WebTiledLayerPath:
            WebTiledLayer = classes[idx];
            break;
          case _WMSLayerPath:
            WMSLayer = classes[idx];
            break;
          case _WMSLayerInfoPath:
            WMSLayerInfo = classes[idx];
            break;
        }
      });
    }

    return deferred.promise;
  }

  function _loadWebMap(mapDiv, options, deferred, itemInfo) {

    _lazyLoadModules(itemInfo, options).then(function() {
      _checkBingKey(itemInfo, options).then(function(list) {
        var itemInfo = list[0];
        var options = list[1];

        if (!itemInfo.itemData.operationalLayers || itemInfo.itemData.operationalLayers.length === 0) {
          _getItemProps(itemInfo, options).then(function(response) {
            _getLayers(response.itemData, options).then(
                lang.hitch(null, _preCreateMap, response, mapDiv, options, deferred)
            );
          });
        }
        else {
          var baseMapDeferred = new Deferred();
          //create a webmap which only has the basemap layers
          //remove the basemap layers from the webmap, so that it has been split into two web maps
          var baseMapLayers = itemInfo.itemData.baseMap.baseMapLayers.slice();
          var nonRefBaseMapLayers = array.filter(itemInfo.itemData.baseMap.baseMapLayers, function(item) {
            return !item.isReference;
          });
          var baseMapOnlyWebMap = {
            item: itemInfo.item,
            itemData: {
              baseMap: {
                baseMapLayers: nonRefBaseMapLayers
              }
            }
          };

          //only leave those reference layers in the second web map.
          itemInfo.itemData.baseMap.baseMapLayers = array.filter(itemInfo.itemData.baseMap.baseMapLayers, function(item) {
            return item.isReference;
          });

          //create map just using the basemaponly webmap
          _getItemProps(baseMapOnlyWebMap, options).then(function(response) {
            _getLayers(response.itemData, options).then(
                lang.hitch(null, _preCreateMap, response, mapDiv, options, baseMapDeferred)
            );
          });
          //After the basemaponly webmap is resolved, fetch all the other layers in the second web map.
          baseMapDeferred.then(function(createMapResult) {
            _getItemProps(itemInfo, options).then(function(response) {
              _getLayers(response.itemData, options, createMapResult.map.spatialReference, nonRefBaseMapLayers).then(function(layers) {
                //add the basemaplayer to the result, so that deferred will include it
                response.itemData.baseMap.baseMapLayers = baseMapLayers;
                //using map, instead of mapDiv since map has already been created
                _preCreateMap(response, createMapResult, options, deferred, layers);
              });
            });
          }, lang.hitch(deferred, deferred.errback));
        }
      });
    });
  }

  /*****************
   * Public methods
   *****************/

  function getItem(/*String*/itemId){

    // for backward compatibility
    if (arcgisUtils._arcgisUrl && arcgisUtils._arcgisUrl.length > 0) {
      arcgisUtils.arcgisUrl = arcgisUtils._arcgisUrl;
    }

    var url = arcgisUtils.arcgisUrl + "/" + itemId;
    var retVal = {}, deferred = new Deferred();

    esriRequest({
      url: url,
      content: {
        f: "json"
      },
      callbackParamName: "callback",

      load: function(response){
        retVal.item = response;

        esriRequest({
          url: url + "/data",
          content: {
            f: "json"
          },
          callbackParamName: "callback",

          load: function(response){
            retVal.itemData = response;
            deferred.callback(retVal);
          },

          error: function(error){
            deferred.errback(error);
          }
        }); // end of inner request
      },

      error: function(error){
        deferred.errback(error);
      }
    }); // end of outer request
    return deferred.promise;
  }

  /**
   * Notes about the behavior:
   * Errback will be called under the following conditions:
   * - getItem failed
   * - the base map layer cannot be loaded
   */
  function createMap(/*itemId or {item, itemData}*/arg1, /*String or DOM Node*/ mapDiv, /*Object?*/ options){
    var deferred = new Deferred();
    options = options || {};

    // Determine the info template class
    var clazz = options.infoTemplateClass;
    options._clazz = (
      clazz && (lang.isObject(clazz) ? clazz : lang.getObject(clazz))
    ) || PopupTemplate;

    if (lang.isString(arg1)) {
      getItem(arg1).then(
        lang.hitch(null, _loadWebMap, mapDiv, options, deferred)
      ).then(null,
        lang.hitch(deferred, deferred.errback)
      );
    } else {
      _loadWebMap(mapDiv, options, deferred, arg1);
    }

    return deferred.promise;
  }

  /**
   * Can be used with esri.widgets.Legend to get the layers list to be passed into the constructor.
   * It will honor showLegend and will not include the basemap layers.
   */
  function getLegendLayers(createMapResponse) {
    if (createMapResponse && createMapResponse.itemInfo && createMapResponse.itemInfo.itemData) {
      return _getLegendLayers(createMapResponse.itemInfo.itemData);
    } else {
      return [];
    }
  }

  arcgisUtils = {
    arcgisUrl: location.protocol + "//www.arcgis.com/sharing/rest/content/items",
    getItem: getItem,
    createMap: createMap,
    getLegendLayers: getLegendLayers,

    _arcgisUrl: null,
    _getItemProps: _getItemProps,
    _getItemData: _getItemData,
    _getBingKey: _getBingKey,
    _portalUrlResponse: _portalUrlResponse,
    _portalUrlFailure: _portalUrlFailure,
    _processFSItemProperties: _processFSItemProperties,
    _processSSItemProperties: _processSSItemProperties,
    _getLayers: _getLayers,
    _preBuildLayerObjects: _preBuildLayerObjects,
    _buildLayerObjects: _buildLayerObjects,
    _preCreateMap: _preCreateMap,
    _getMapSR: _getMapSR,
    _createMap: _createMap,
    _addSelectionLayers: _addSelectionLayers,
    _createSelectionFeatureLayers: _createSelectionFeatureLayers,
    _getServiceInfo: _getServiceInfo,
    _getFeatureCollectionItem: _getFeatureCollectionItem,
    _mergeFeatureCollectionItem: _mergeFeatureCollectionItem,
    _projectFeatureCollection: _projectFeatureCollection,
    _getLayersInfo: _getLayersInfo,
    _initLayer: _initLayer,
    _loadAsCached: _loadAsCached,
    _loadAsDynamic: _loadAsDynamic,
    _processPopups: _processPopups,
    _onLayersAddResult: _onLayersAddResult,
    _sameSpatialReferenceAsBasemap: _sameSpatialReferenceAsBasemap,
    _sameTilingSchemeAsBasemap: _sameTilingSchemeAsBasemap,
    _showPopup: _showPopup,
    _calculateClickTolerance: _calculateClickTolerance,
    _getVisibleFeatureLayers: _getVisibleFeatureLayers,
    _updateLayerScaleInfo: _updateLayerScaleInfo,
    _checkUrl: _checkUrl,
    _isHostedService: _isHostedService,
    _isAgolService: _isAgolService,
    _getLegendLayers: _getLegendLayers
  };

  // TODO
  // We want a developer to be able to change "arcgisUrl" via AMD usage
  // and want that change exposed to IdentityManagerBase as well via
  // esri.arcgis.utils object. The unfortunate side effect is that esri.arcgis.utils
  // object will be available in legacy as well as AMD apps. Ideally
  // we want that to be created only in legacy apps.

  //if (has("extend-esri")) {
    lang.setObject("arcgis.utils", arcgisUtils, esriKernel);
  //}

  return arcgisUtils;
});
