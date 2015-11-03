/**
 * Generates a printer-ready version of the map using an Export Web Map Task available with
 * ArGIS Server 10.1 and later. 
 *
 * The PrintTask class is used when you want more granular control of the user interface.
 * For example, if you want to provide users the ability to define what appears on the printed 
 * page. View the Print widget for an out-of-the-box widget that provides a simple user interface
 * for printing maps. The PrintTask requires an ArcGIS Server 10.1 Export Web Map Task.
 *
 * @module esri/tasks/PrintTask
 * @since 4.0
 */
define(
[
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",

  "dojo/dom-construct",
  "dojo/has",

  "dojox/gfx/canvas",
  "dojox/json/query",

  "../Color",

  "../core/lang",
  "../core/screenUtils",

  "../layers/support/layerUtils",

  "../geometry/Polygon",
  "../geometry/support/scaleUtils",

  "../renderers/SimpleRenderer",

  "./support/PrintTemplate",

  "./Geoprocessor",
  "./Task"
],
function(
  array, declare, lang,
  domConstruct, has, gfxCanvas, jsonQuery,
  Color,
  esriLang, screenUtils,
  layerUtils,
  Polygon, scaleUtils,
  SimpleRenderer,
  PrintTemplate,
  Geoprocessor, Task
) {

  /**
   * @constructor module:esri/tasks/PrintTask
   * @extends module:esri/tasks/Task
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PrintTask = declare(Task,
  /** @lends module:esri/tasks/PrintTask.prototype */
  {

    declaredClass: "esri.tasks.PrintTask",

    classMetadata: {
      computed: {
        printGp: ["url"]
      }
    },

    constructor: function() {
      this._handleExecuteResponse = this._handleExecuteResponse.bind(this);
    },

    /**
     * The url to the Export Web Map Task.
     * @type {string}
     */
    url: null,

    _printGpGetter: function() {
      return new Geoprocessor(this.url);
    },

    /**
     * Set to true if the print service is an asynchronous geoprocessing service.
     * @type {boolean}
     * @default
     */
    async: false,

    _colorEvaluator: jsonQuery("$..color"),

    /**
     * Sends a request to the print service resource to create a print page using the information specified in the `params` argument.
     * 
     * @param {module:esri/tasks/support/PrintParameters} params - An object that defines the printing options.
     *                                                           @returns {Promise} When resolved, prints a layout of the map.
     */
    execute: function(/*esri.tasks.PrintParameters*/ params) {
      var printTemplate = params.template || new PrintTemplate();
      if (!printTemplate.hasOwnProperty("showLabels")) {
        printTemplate.showLabels = true;
      }
      var exportOptionsInput = printTemplate.exportOptions;
      var exportOptions;
      if (exportOptionsInput) {
        var width = exportOptionsInput.width;
        var height = exportOptionsInput.height;
        var dpi = exportOptionsInput.dpi;
        exportOptions = {
          outputSize: [width, height],
          dpi: dpi
        };
      }

      var layoutOptionsInput = printTemplate.layoutOptions;
      var layoutOptions, legendIds = [];
      if (layoutOptionsInput) {
        this.legendAll = false;
        if (!layoutOptionsInput.legendLayers) {
          this.legendAll = true;
        }
        else {
          array.forEach(layoutOptionsInput.legendLayers, function(legendLayer) {
            var legendId = {};
            legendId.id = legendLayer.layerId;
            if (legendLayer.subLayerIds) {
              legendId.subLayerIds = legendLayer.subLayerIds;
            }
            legendIds.push(legendId);
          });
        }
        var scalebarMetricUnit, scalebarNonMetricUnit;
        if (layoutOptionsInput.scalebarUnit === "Miles" || layoutOptionsInput.scalebarUnit === "Kilometers") {
          scalebarMetricUnit = "esriKilometers";
          scalebarNonMetricUnit = "esriMiles";
        } else if (layoutOptionsInput.scalebarUnit === "Meters" || layoutOptionsInput.scalebarUnit === "Feet") {
          scalebarMetricUnit = "esriMeters";
          scalebarNonMetricUnit = "esriFeet";
        }
        var scalebarLabel = {
          esriMiles: "mi",
          esriKilometers: "km",
          esriFeet: "ft",
          esriMeters: "m"
        };
        layoutOptions = {
          titleText: layoutOptionsInput.titleText,
          authorText: layoutOptionsInput.authorText,
          copyrightText: layoutOptionsInput.copyrightText,
          customTextElements: layoutOptionsInput.customTextElements,
          scaleBarOptions: {
            metricUnit: scalebarMetricUnit,
            metricLabel: scalebarLabel[scalebarMetricUnit],
            nonMetricUnit: scalebarNonMetricUnit,
            nonMetricLabel: scalebarLabel[scalebarNonMetricUnit]
          },
          legendOptions: {
            operationalLayers: legendIds
          }
        };
      }

      var map = params.map;
      var webMapJson = this._getPrintDefinition(map, printTemplate);
      //users can change the SR of the printout
      if (params.outSpatialReference) {
        webMapJson.mapOptions.spatialReference = params.outSpatialReference.toJSON();
      }
      if (params.template && esriLang.isDefined(params.template.showAttribution)) {
        webMapJson.mapOptions.showAttribution = params.template.showAttribution;
      }
      lang.mixin(webMapJson, {
        exportOptions: exportOptions,
        layoutOptions: layoutOptions
      });
      if (this.allLayerslegend) {
        lang.mixin(webMapJson.layoutOptions, {
          legendOptions: {
            operationalLayers: this.allLayerslegend
          }
        });
      }
      var webMapJsonText = JSON.stringify(esriLang.fixJson(webMapJson));
      var format = printTemplate.format;
      var template = printTemplate.layout;
      var printParams = {
        Web_Map_as_JSON: webMapJsonText,
        Format: format,
        Layout_Template: template
      };
      // Publishing an arcpy script as a custom print service, you can have more parameters.
      if (params.extraParameters) {
        printParams = lang.mixin(printParams, params.extraParameters);
      }

      var printPromise;

      if (this.async) {
        printPromise = this.printGp.submitJob(printParams);
      }
      else {
        printPromise = this.printGp.execute(printParams);
      }

      return printPromise.then(this._handleExecuteResponse);
    },

    _handleExecuteResponse: function(response) {
      if (this.async && response.jobStatus === "esriJobSucceeded") {
        //If the name of the result is not the default one "Output_File", users should use the Print Service as a general GP service.
        return this.printGp.getResultData(response.jobId, "Output_File")
          .then(lang.hitch(this, function(output) {
            //If the result is not the default format as output.value, users should use the print service as a GP service.
            return output.value;
          }));
      }

      return response[0].value;
    },

    _createMultipointLayer: function() {
      return {
        layerDefinition: {
          name: "multipointLayer",
          geometryType: "esriGeometryMultipoint",
          drawingInfo: {
            renderer: null
          }
        },
        featureSet: {
          geometryType: "esriGeometryMultipoint",
          features: []
        }
      };
    },

    _createPolygonLayer: function() {
      return {
        layerDefinition: {
          name: "polygonLayer",
          geometryType: "esriGeometryPolygon",
          drawingInfo: {
            renderer: null
          }
        },
        featureSet: {
          geometryType: "esriGeometryPolygon",
          features: []
        }
      };
    },

    _createPointLayer: function() {
      return {
        layerDefinition: {
          name: "pointLayer",
          geometryType: "esriGeometryPoint",
          drawingInfo: {
            renderer: null
          }
        },
        featureSet: {
          geometryType: "esriGeometryPoint",
          features: []
        }
      };
    },

    _createPolylineLayer: function() {
      return {
        layerDefinition: {
          name: "polylineLayer",
          geometryType: "esriGeometryPolyline",
          drawingInfo: {
            renderer: null
          }
        },
        featureSet: {
          geometryType: "esriGeometryPolyline",
          features: []
        }
      };
    },

    _convertSvgSymbol: function(symbol){
      if (has("ie") <= 8 || !symbol.path) {
        //ie7 and 8 don't support SVG or there is no svg path
        return;
      }
      if (!this._canvasHolder) {
        this._canvasHolder = domConstruct.create("div");
        this._canSurface = gfxCanvas.createSurface(this._canvasHolder, 200, 200);
      }

      var path = this._canSurface.createObject(gfxCanvas.Path, symbol.path)
          .setFill(symbol.color)
          .setStroke(symbol.outline);
      if ("pendingRender" in this._canSurface) {
        this._canSurface._render(true); // force render even if they're pendingImages
      }
      var ctx = this._canSurface.rawNode.getContext("2d");
      var imageWidth = Math.ceil(path.getBoundingBox().width+path.getBoundingBox().x);
      var imageHeight = Math.ceil(path.getBoundingBox().height+path.getBoundingBox().y);
      var imgData = ctx.getImageData(path.getBoundingBox().x, path.getBoundingBox().y, imageWidth, imageHeight);
      ctx.canvas.width = imageWidth;
      ctx.canvas.height = imageHeight;
      ctx.putImageData(imgData, 0, 0);
      var pngData = ctx.canvas.toDataURL("image/png");
      var pictureSymbol = {
        type: "esriPMS",
        imageData: pngData.substr(22, pngData.length),
        angle: -symbol.angle,
        contentType: "image/png",
        height: symbol.size ? symbol.size : imageHeight - path.getBoundingBox().y,
        width: symbol.size ? symbol.size : imageWidth - path.getBoundingBox().x,
        xoffset: symbol.xoffset,
        yoffset: symbol.yoffset
      };

      return pictureSymbol;
    },

    _convertSvgRenderer: function(renderer) {
      if (renderer.type === "simple" && renderer.symbol && renderer.symbol.path) {
        renderer.symbol = this._convertSvgSymbol(renderer.symbol);
      }
      else if (renderer.type === "uniqueValue") {
        if (renderer.defaultSymbol && renderer.defaultSymbol.path) {
          renderer.defaultSymbol = this._convertSvgSymbol(renderer.defaultSymbol);
        }
        if (renderer.uniqueValueInfos) {
          array.forEach(renderer.uniqueValueInfos, function(uniqueValueInfo){
            if (uniqueValueInfo.symbol.path) {
              uniqueValueInfo.symbol = this._convertSvgSymbol(uniqueValueInfo.symbol);
            }
          }, this);
        }
      }
      else if (renderer.type === "classBreaks") {
        if (renderer.defaultSymbol && renderer.defaultSymbol.path) {
          renderer.defaultSymbol = this._convertSvgSymbol(renderer.defaultSymbol);
        }
        if (renderer.classBreakInfos) {
          array.forEach(renderer.classBreakInfos, function(classBreakInfo){
            if (classBreakInfo.symbol.path) {
              classBreakInfo.symbol = this._convertSvgSymbol(classBreakInfo.symbol);
            }
          }, this);
        }
      }
    },

    _createFeatureCollection: function(gLayer, map, renderer) {
      var polygonCollectionLayer = this._createPolygonLayer();
      var polylineCollectionLayer = this._createPolylineLayer();
      var pointCollectionLayer = this._createPointLayer();
      var multipointCollectionLayer = this._createMultipointLayer();

      var textCollectionLayer = this._createPointLayer();
      textCollectionLayer.layerDefinition.name = "textLayer";
      delete textCollectionLayer.layerDefinition.drawingInfo;

      if (gLayer.declaredClass === "esri.layers.FeatureLayer" || gLayer.declaredClass === "esri.layers.StreamLayer") {
        polygonCollectionLayer.layerDefinition.name =
            polylineCollectionLayer.layerDefinition.name =
                pointCollectionLayer.layerDefinition.name =
                    multipointCollectionLayer.layerDefinition.name =
                        lang.getObject("arcgisProps.title", false, gLayer) || gLayer.name || gLayer.id;
      }

      if (gLayer.renderer && !lang.isFunction(gLayer.renderer.attributeField)) {
        var rendererJson = gLayer.renderer.toJSON();

        //Change drawingInfo to match print service JSON format for temporal renderer
        //Also set timeInfo properties on layerDefinition
        if (rendererJson.type === "temporal"){
          var drawingInfo = {
            latestObservationRenderer: rendererJson.latestObservationRenderer,
            trackLinesRenderer: rendererJson.trackRenderer,
            observationAger: rendererJson.observationAger,
            renderer: rendererJson.observationRenderer
          },
            timeInfo = {};
          if (gLayer._trackIdField) {
            timeInfo.trackIdField = gLayer._trackIdField;
          }
          if (gLayer._startTimeField) {
            timeInfo.startTimeField = gLayer._startTimeField;
          }
          if (gLayer._endTimeField) {
            timeInfo.endTimeField = gLayer._endTimeField;
          }

          polygonCollectionLayer.layerDefinition.drawingInfo = drawingInfo;
          polygonCollectionLayer.layerDefinition.timeInfo = timeInfo;
          polylineCollectionLayer.layerDefinition.drawingInfo = drawingInfo;
          polylineCollectionLayer.layerDefinition.timeInfo = timeInfo;
          pointCollectionLayer.layerDefinition.drawingInfo = drawingInfo;
          pointCollectionLayer.layerDefinition.timeInfo = timeInfo;
          multipointCollectionLayer.layerDefinition.drawingInfo = drawingInfo;
          multipointCollectionLayer.layerDefinition.timeInfo = timeInfo;
        }
        else{
          polygonCollectionLayer.layerDefinition.drawingInfo.renderer = rendererJson;
          polylineCollectionLayer.layerDefinition.drawingInfo.renderer = rendererJson;
          pointCollectionLayer.layerDefinition.drawingInfo.renderer = rendererJson;
          multipointCollectionLayer.layerDefinition.drawingInfo.renderer = rendererJson;
        }
      }
      else {
        delete polygonCollectionLayer.layerDefinition.drawingInfo;
        delete polylineCollectionLayer.layerDefinition.drawingInfo;
        delete pointCollectionLayer.layerDefinition.drawingInfo;
        delete multipointCollectionLayer.layerDefinition.drawingInfo;
      }

      var fields = gLayer.fields;
      if (!fields && gLayer.renderer && !lang.isFunction(gLayer.renderer.attributeField)) {
        if (gLayer.renderer.declaredClass === "esri.renderer.ClassBreaksRenderer") {
          fields = [
            { "name": gLayer.renderer.attributeField, "type": "esriFieldTypeDouble" }
          ];
          if (gLayer.renderer.normalizationField) {
            fields.push({ "name": gLayer.renderer.normalizationField, "type": "esriFieldTypeDouble" });
          }
        }
        else if (gLayer.renderer.declaredClass === "esri.renderer.UniqueValueRenderer") {
          fields = [
            { "name": gLayer.renderer.attributeField, "type": "esriFieldTypeString" }
          ];
          if (gLayer.renderer.attributeField2) {
            fields.push({ "name": gLayer.renderer.attributeField2, "type": "esriFieldTypeString" });
          }
          if (gLayer.renderer.attributeField3) {
            fields.push({ "name": gLayer.renderer.attributeField3, "type": "esriFieldTypeString" });
          }
        }
      }
      if (fields) {
        polygonCollectionLayer.layerDefinition.fields = fields;
        polylineCollectionLayer.layerDefinition.fields = fields;
        pointCollectionLayer.layerDefinition.fields = fields;
        multipointCollectionLayer.layerDefinition.fields = fields;
      }

      var len = gLayer.graphics.length,
        gJson, i;
      for (i = 0; i < len; i++) {
        var g = gLayer.graphics[i];
        if (g.visible === false || !g.geometry) {
          continue;
        }
        gJson = g.toJSON();

        //print service doesn't recognize cartographicLineSymbol,
        //which is the point highlight symbol on arcgis.com.
        //this is a workaround.
        //https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/910
        if (gJson.symbol && gJson.symbol.outline && gJson.symbol.outline.type === "esriCLS") {
          continue;
        }

        //due to a bug on print service, it cannot print any feature with outline transparency.
        //the workaround is to replace the alpha value as 255 and send it to server.
        if (gJson.symbol && gJson.symbol.outline && gJson.symbol.outline.color && gJson.symbol.outline.color[3]) {
          gJson.symbol.outline.color[3] = 255;
        }

        //workaround for function renderer, proportional renderer, scaledependent renderer with proportional or dotdensity renderer
        //TODO: need to clean the logic in if(), when renderer present, the function _createFeatureCollection should use it
        if (gLayer.renderer && !gJson.symbol &&
            (lang.isFunction(gLayer.renderer.attributeField) ||
                gLayer.renderer.hasVisualVariables() ||
                gLayer.renderer.declaredClass === "esri.renderer.DotDensityRenderer" ||
                renderer)) {

          renderer = renderer || gLayer.renderer;
          var symbol = renderer.getSymbol(g);
          if (!symbol) {
            continue;
          }
          gJson.symbol = symbol.toJSON();

          if (renderer.hasVisualVariables()) {
            this._applyVisualVariables(gJson.symbol, {
              renderer: renderer,
              graphic: g,
              symbol: symbol,
              mapResolution: map && map.getResolutionInMeters()
            });
          }
        }

        if (gJson.symbol) {
          if (gJson.symbol.path) {
            //workaround for SVG SMS as print service doesn't support it
            gJson.symbol = this._convertSvgSymbol(gJson.symbol);
          }
          else if (gJson.symbol.text) {
            //don't send attributes for graphics using a TextSymbol
            delete gJson.attributes;
          }
        }

        switch (g.geometry.type) {
          case "polygon":
            polygonCollectionLayer.featureSet.features.push(gJson);
            break;
          case "polyline":
            polylineCollectionLayer.featureSet.features.push(gJson);
            break;
          case "point":
            if (gJson.symbol && gJson.symbol.text) {
              textCollectionLayer.featureSet.features.push(gJson);
            }
            else {
              pointCollectionLayer.featureSet.features.push(gJson);
            }
            break;
          case "multipoint":
            multipointCollectionLayer.featureSet.features.push(gJson);
            break;
          case "extent":
            gJson.geometry = Polygon.fromExtent(g.geometry).toJSON();
            polygonCollectionLayer.featureSet.features.push(gJson);
            break;
        }
      }

      var layers = [];
      if (polygonCollectionLayer.featureSet.features.length > 0) {
        layers.push(polygonCollectionLayer);
      }
      if (polylineCollectionLayer.featureSet.features.length > 0) {
        layers.push(polylineCollectionLayer);
      }
      if (multipointCollectionLayer.featureSet.features.length > 0) {
        layers.push(multipointCollectionLayer);
      }
      if (pointCollectionLayer.featureSet.features.length > 0) {
        layers.push(pointCollectionLayer);
      }
      if (textCollectionLayer.featureSet.features.length > 0) {
        layers.push(textCollectionLayer);
      }
      //if there are any svg symbols, convert it
      array.forEach(layers, function(layer) {
        if (layer.layerDefinition.drawingInfo && layer.layerDefinition.drawingInfo.renderer) {
          this._convertSvgRenderer(layer.layerDefinition.drawingInfo.renderer);
        }
      }, this);
      var featureCollectionLayers = {
        layers: layers
      };
      var featureCollection = {
        id: gLayer.id,
        opacity: gLayer.opacity,
        minScale: gLayer.minScale || 0,
        maxScale: gLayer.maxScale || 0,
        featureCollection: featureCollectionLayers
      };
      return featureCollection;
    },

    _getPrintDefinition: function(map, printTemplate) {
      var opLayers = this._createOperationalLayers(map, printTemplate);
      var operationalLayers = {
        operationalLayers: opLayers
      };

      var extent = map.extent, sr = map.spatialReference;
      if (map.spatialReference.isWrappable()) {
        extent = extent._normalize(true);
        sr = extent.spatialReference;
      }

      var mapOptions = {
        mapOptions: {
          showAttribution: map.showAttribution,
          extent: extent.toJSON(),
          spatialReference: sr.toJSON()
        }
      };
      if (printTemplate.preserveScale) {
        lang.mixin(mapOptions.mapOptions, {
          // TODO 4.0: scaleUtils.getScale(map) can't work
          scale: printTemplate.outScale || scaleUtils.getScale(map)
        });
      }
      if (map.timeExtent) {
        lang.mixin(mapOptions.mapOptions, {
          time: [map.timeExtent.startTime.getTime(), map.timeExtent.endTime.getTime()]
        });
      }

      var webMapJson = {};
      lang.mixin(webMapJson, mapOptions, operationalLayers);
      return webMapJson;
    },

    _createOperationalLayers: function(map, printTemplate) {
      var i, layer, layerType, opLayer, kmlRelatedLayerIds = [], opLayers = [];
      if (this.legendAll) {
        this.allLayerslegend = [];
      } else {
        this.allLayerslegend = null;
      }
      //JS API converts KML into multiple graphicsLayers and mapImageLayers. In order to avoid sending duplicated
      //layers to print service, it should exclude those converted layers. Only keep the KML itself.
      //Due to the issue that print service doesn't support KML folders, we cannot just send KML layer for printing.
      //Instead, we have to send the request as graphicsLayers or mapImageLayers as a workaround by now.
      //Will apply the fix below until print service fully supports KML folders.
      /*for (i = 0; i < map.layerIds.length; i++) {
        layer = map.getLayer(map.layerIds[i]);
        if (!layer.loaded) {
          continue;
        }
        if (layer.declaredClass === "esri.layers.KMLLayer") {
          dojo.forEach(layer.getLayers(), function(kmlRelatedLayer){
            kmlRelatedLayerIds.push(kmlRelatedLayer.id);
          });
        }
      }*/
      //dynamic, tile map service layer, wms, image, kml, mapImage
      var mapLayers = array.map(map.layerIds, map.getLayer, map);
      if (map._mapImageLyr) {
        mapLayers.push(map._mapImageLyr);
      }
      for (i = 0; i < mapLayers.length; i++) {
        layer = mapLayers[i];
        if (!layer.loaded || !layer.visible || array.indexOf(kmlRelatedLayerIds, layer.id) !== -1) {
          continue;
        }
        layerType = layer.declaredClass;

        opLayer = {
            id: layer.id,
            title: lang.getObject("arcgisProps.title", false, layer) || layer.id,
            opacity: layer.opacity,
            minScale: layer.minScale || 0,
            maxScale: layer.maxScale || 0
        };
        opLayer = lang.mixin(opLayer, this._getUrlAndToken(layer));
        switch (layerType) {
        case "esri.layers.ArcGISDynamicMapServiceLayer":
          var subLayers = [];
          var hasCustomVisibleLayers = !!layer._params.layers;
          if (layer._params.dynamicLayers) {
            var dynamicLayers = JSON.parse(layer._params.dynamicLayers);
            array.forEach(dynamicLayers, function(dynamicLayer) {
              subLayers.push({
                id: dynamicLayer.id,
                name: dynamicLayer.name,
                layerDefinition: dynamicLayer
              });
              // these properties don't belong in the layerDefinition
              delete dynamicLayer.id;
              delete dynamicLayer.name;
              delete dynamicLayer.maxScale;
              delete dynamicLayer.minScale;
            });
          }
          else if (layer.supportsDynamicLayers) {
            if (hasCustomVisibleLayers || layer.layerDefinitions || layer.layerTimeOptions) {
              var dynLayerInfos = layer.createDynamicLayerInfosFromLayerInfos();
              var visibleLayers = null;
              if (hasCustomVisibleLayers) {
                visibleLayers = layer.visibleLayers;
              }
              visibleLayers = layerUtils._getVisibleLayers(dynLayerInfos, visibleLayers);
              var layersInScale = layerUtils._getLayersForScale(printTemplate.outScale || map.getScale(), dynLayerInfos);
              array.forEach(dynLayerInfos, function(layerInfo) {
                if (!layerInfo.subLayerIds) { // skip group layers
                  var subLayerId = layerInfo.id;
                  // if visible and in scale
                  if (array.indexOf(visibleLayers, subLayerId) > -1 && array.indexOf(layersInScale, subLayerId) > -1) {
                    var layerDef = {
                      source: layerInfo.source.toJSON()
                    };
                    if (layer.layerDefinitions && layer.layerDefinitions[subLayerId]) {
                      layerDef.definitionExpression = layer.layerDefinitions[subLayerId];
                    }
                    if (layer.layerTimeOptions && layer.layerTimeOptions[subLayerId]) {
                      layerDef.layerTimeOptions = layer.layerTimeOptions[subLayerId].toJSON();
                    }
                    subLayers.push({ "id": subLayerId, "layerDefinition": layerDef });
                  }
                }
              });
              if (subLayers.length === 0) {
                opLayer.visibleLayers = [-1];
              }
            }
          }
          else {
            array.forEach(layer.layerInfos, function(layerInfo) {
              var subLayerInfo = {
                id: layerInfo.id,
                layerDefinition: {}
              };
              if (layer.layerDefinitions && layer.layerDefinitions[layerInfo.id]) {
                subLayerInfo.layerDefinition.definitionExpression = layer.layerDefinitions[layerInfo.id];
              }
              if (layer.layerTimeOptions && layer.layerTimeOptions[layerInfo.id]) {
                subLayerInfo.layerDefinition.layerTimeOptions = layer.layerTimeOptions[layerInfo.id].toJSON();
              }
              if (subLayerInfo.layerDefinition.definitionExpression || subLayerInfo.layerDefinition.layerTimeOptions) {
                subLayers.push(subLayerInfo);
              }
            });
            if (hasCustomVisibleLayers) {
              opLayer.visibleLayers = layer.visibleLayers;
            }
          }
          if (subLayers.length) {
            opLayer.layers = subLayers;
          }
          opLayers.push(opLayer);
          if (this.allLayerslegend) {
            this.allLayerslegend.push({
              id: layer.id,
              subLayerIds: layer.visibleLayers
            });
          }
          break;
        case "esri.layers.ArcGISImageServiceLayer":
          opLayer = lang.mixin(opLayer, {
            url: layer.url,
            bandIds: layer.bandIds,
            compressionQuality: layer.compressionQuality,
            format: layer.format,
            interpolation: layer.interpolation
          });
          if (layer.mosaicRule) {
            lang.mixin(opLayer, {
              mosaicRule: layer.mosaicRule.toJSON()
            });
          }
          if (layer.renderingRule) {
            lang.mixin(opLayer, {
              renderingRule: layer.renderingRule.toJSON()
            });
          }
          opLayers.push(opLayer);
          if (this.allLayerslegend) {
            this.allLayerslegend.push({
              id: layer.id
            });
          }
          break;
        case "esri.layers.WMSLayer":
          //It seems print service doesn't need format
          /*var format = layer.imageFormat.split("/")[1];
          if (format.toLowerCase() === "png") {
            format = "png24";
          }*/
          opLayer = lang.mixin(opLayer, {
            url: layer.url,
            title: layer.title,
            type: "wms",
            version: layer.version,
            transparentBackground: layer.imageTransparency,
            visibleLayers: layer.visibleLayers
          });
          opLayers.push(opLayer);
          if (this.allLayerslegend) {
            this.allLayerslegend.push({
              id: layer.id,
              subLayerIds: layer.visibleLayers
            });
          }
          break;
        case "esri.virtualearth.VETiledLayer":
          var mapStyle = layer.mapStyle;
          if (mapStyle === "aerialWithLabels") {
            mapStyle = "Hybrid";
          }
          opLayer = lang.mixin(opLayer, {
            visibility: layer.visible,
            type: "BingMaps" + mapStyle,
            culture: layer.culture,
            key: layer.bingMapsKey
          });
          opLayers.push(opLayer);
          break;
        case "esri.layers.OpenStreetMapLayer":
          opLayer = lang.mixin(opLayer, {
            type: "OpenStreetMap",
            url: layer.tileServers[0]
          });
          opLayers.push(opLayer);
          break;
        case "esri.layers.WMTSLayer":
          opLayer = lang.mixin(opLayer, {
            url: layer.url,
            type: "wmts",
            layer: layer._identifier,
            style: layer._style,
            format: layer.format,
            tileMatrixSet: layer._tileMatrixSetId
          });
          opLayers.push(opLayer);
          break;
        //workaround for the issue that print service doesn't support KML folders.
        //so, only send KML internal layers, and exclude the KML layer from the request.
        /*case "esri.layers.KMLLayer":
          opLayer = {
            id: layer.id,
            title: layer.id,
            type: "KML",
            url: layer.url,
            opacity: layer.opacity
          };
          opLayers.push(opLayer);
          if (this.allLayerslegend) {
            this.allLayerslegend.push({
              id: layer.id
            });
          }
          break;*/
        case "esri.layers.MapImageLayer":
          var images = layer.getImages();
          //server 10.1 beta2 only support one image for one layer, this is a workaround.
          array.forEach(images, function(image, idx) {
            if (image.href) {
              opLayer = {
                id: layer.id + "_image" + idx,
                type: "image",
                title: layer.id,
                minScale: layer.minScale || 0,
                maxScale: layer.maxScale || 0,
                opacity: layer.opacity * image.opacity,
                extent: image.extent.toJSON()
              };
              if (image.href.substr(0, 22) === "data:image/png;base64,") {
                opLayer.imageData = image.href.substr(22);
              }
              else {
                opLayer.url = image.href;
              }
              opLayers.push(opLayer);
            }
          });
          break;
        case "esri.layers.WebTiledLayer":
          //remove $ sign, when it's combined with '{'
          var urlTemplate = layer.url.replace(/\$\{/g, "{");
          opLayer = lang.mixin(opLayer, {
            type: "WebTiledLayer",
            urlTemplate: urlTemplate,
            credits: layer.copyright
          });
          if (layer.subDomains && layer.subDomains.length > 0) {
            opLayer.subDomains = layer.subDomains;
          }
          opLayers.push(opLayer);
          break;
        default:
          if (layer.getTileUrl || layer.getImageUrl) {
            opLayer = lang.mixin(opLayer, {
              url: layer.url
            });
            opLayers.push(opLayer);
          }
        }
      }
      for (i = 0; i < map.graphicsLayerIds.length; i++) {
        layer = map.getLayer(map.graphicsLayerIds[i]);
        if (!layer.loaded || !layer.visible || array.indexOf(kmlRelatedLayerIds, layer.id) !== -1) {
          continue;
        }
        layerType = layer.declaredClass;
        var renderer;
        switch (layerType) {
        case "esri.layers.FeatureLayer":
        case "esri.layers.LabelLayer":
        case "esri.layers.CSVLayer":
        case "esri.layers.StreamLayer":
          if ((layerType === "esri.layers.LabelLayer" && !printTemplate.showLabels) ||
              (layer.renderer && layer.renderer.declaredClass === "esri.renderer.HeatmapRenderer")) {
            continue; // skip this layer
          }

          renderer = null;
          if (layer.url && layer.renderer) {
            if (layer.renderer.declaredClass === "esri.renderer.ScaleDependentRenderer") {
              if (layer.renderer.rangeType === "scale") {
                renderer = layer.renderer.getRendererInfoByScale(map.getScale()) && layer.renderer.getRendererInfoByScale(map.getScale()).renderer;
              }
              else if (layer.renderer.rangeType === "zoom") {
                renderer = layer.renderer.getRendererInfoByZoom(map.getZoom()) && layer.renderer.getRendererInfoByZoom(map.getZoom()).renderer;
              }
            }
            else {
              renderer = layer.renderer;
            }
          }

          if (renderer &&
              (renderer.declaredClass === "esri.renderer.SimpleRenderer" ||
                  renderer.declaredClass === "esri.renderer.TemporalRenderer" ||
                  (lang.isString(renderer.attributeField) && layer._getField(renderer.attributeField, true))) &&
              !renderer.hasVisualVariables() &&
              renderer.declaredClass !== "esri.renderer.DotDensityRenderer" &&
              layer.declaredClass !== "esri.layers.CSVLayer" &&
              layer.declaredClass !== "esri.layers.StreamLayer") {
            //for those cases, serialize feature layer as featurecollection
            //1. user uses a field which is not part of the layer's fields as the renderer's attribute field
            //2. for proportional renderer, serialize it as featurecollection
            //3. for scaleDependentRenderer, if the current renderer is proportional symbol renderer
            //4. for CSVLayer
            //5. for StreamLayer

            opLayer = {
              id: layer.id,
              title: lang.getObject("arcgisProps.title", false, layer) || layer.id,
              opacity: layer.opacity,
              minScale: layer.minScale || 0,
              maxScale: layer.maxScale || 0,
              layerDefinition: {
                drawingInfo: {
                  renderer: renderer.toJSON()
                }
              }
            };
            opLayer = lang.mixin(opLayer, this._getUrlAndToken(layer));

            if (renderer.declaredClass === "esri.renderer.TemporalRenderer") {
              // fix drawingInfo
              var drawingInfo = opLayer.layerDefinition.drawingInfo;
              drawingInfo.latestObservationRenderer = drawingInfo.renderer.latestObservationRenderer;
              drawingInfo.trackLinesRenderer = drawingInfo.renderer.trackRenderer;
              drawingInfo.observationAger = drawingInfo.renderer.observationAger;
              drawingInfo.renderer = drawingInfo.renderer.observationRenderer;

              // set trackIdField
              if (layer._trackIdField) {
                opLayer.layerDefinition.timeInfo = { "trackIdField": layer._trackIdField };
              }
            }

            //workaround the svg symbol, which print service cannot handle
            this._convertSvgRenderer(opLayer.layerDefinition.drawingInfo.renderer);

            if (layer.opacity < 1 ||
                renderer.declaredClass === "esri.renderer.TemporalRenderer" ||
                this._updateLayerOpacity(opLayer)) {
              if (layer._params.source) {
                var source = layer._params.source.toJSON();
                lang.mixin(opLayer.layerDefinition, {source: source});
              }
              if (layer.getDefinitionExpression()) {
                lang.mixin(opLayer.layerDefinition, {
                  definitionExpression: layer.getDefinitionExpression()
                });
              }
              if (layer.mode !== 2) {
                if (layer.getSelectedFeatures().length > 0) {
                  var selectionObjectIds = array.map(layer.getSelectedFeatures(), function(selectedFeature) {
                    return selectedFeature.attributes[layer.objectIdField];
                  });
                  if (selectionObjectIds.length > 0 && layer.getSelectionSymbol()) {
                    lang.mixin(opLayer, {
                      selectionObjectIds: selectionObjectIds,
                      selectionSymbol: layer.getSelectionSymbol().toJSON()
                    });
                  }
                }
              }
              else {
                var objectIds = array.map(layer.getSelectedFeatures(), function(selectedFeature) {
                  return selectedFeature.attributes[layer.objectIdField];
                });
                if (objectIds.length === 0 || !layer._params.drawMode) {
                  break;
                }
                lang.mixin(opLayer.layerDefinition, {
                  objectIds: objectIds
                });
                var selectedRenderer = null;
                if (layer.getSelectionSymbol()) {
                  selectedRenderer = new SimpleRenderer(layer.getSelectionSymbol());
                }
                lang.mixin(opLayer.layerDefinition.drawingInfo, {
                  renderer: selectedRenderer && selectedRenderer.toJSON()
                });
              }
            }
            else {
              opLayer = this._createFeatureCollection(layer);
            }
          } else if (renderer && (renderer.hasVisualVariables() || renderer.declaredClass === "esri.renderer.DotDensityRenderer")) {
            opLayer = this._createFeatureCollection(layer, map, renderer);
          } else {
            opLayer = this._createFeatureCollection(layer);
          }
          opLayers.push(opLayer);
          if (this.allLayerslegend) {
            this.allLayerslegend.push({
              id: layer.id
            });
          }
          break;
        case "esri.layers.GraphicsLayer":
          opLayer = this._createFeatureCollection(layer);
          opLayers.push(opLayer);
          if (this.allLayerslegend) {
            this.allLayerslegend.push({
              id: layer.id
            });
          }
          break;
        default:
        }
      }

      if (map.graphics && map.graphics.graphics.length > 0) {
        opLayer = this._createFeatureCollection(map.graphics);
        opLayers.push(opLayer);
      }

      if (map._labels && printTemplate.showLabels) {
        opLayer = this._createFeatureCollection(map._labels);
        opLayers.push(opLayer);
      }

      return opLayers;
    },

    _getUrlAndToken: function(layer) {
      return {
        token: layer._getToken(),
        url: layer._url ? layer._url.path : null
      };
    },

    // If all the symbols have the same alpha value, move the alpha from the symbols to the layer.
    // Returns false if the layer is not updated due to the colors not having the same alpha values.
    _updateLayerOpacity: function(layer) {
      var colors = this._colorEvaluator(layer); // get all color values
      colors = array.filter(colors, function(color) {
        // make sure color values look like REST color arrays
        return lang.isArray(color) && color.length === 4;
      });

      var allAlphasEqual = true;
      if (colors.length) {
        var alpha = colors[0][3]; // 0 to 255
        var i;
        for (i = 1; i < colors.length; i++) {
          if (alpha !== colors[i][3]) {
            allAlphasEqual = false;
            break;
          }
        }
        if (allAlphasEqual) {
          // move alpha value to layer's opacity
          layer.opacity = alpha / 255; // 0 to 1
          for (i = 0; i < colors.length; i++) {
            colors[i][3] = 255;
          }
        }
      }

      return allAlphasEqual;
    },

    _applyVisualVariables: function(jsonSym, params) {
      var renderer = params.renderer,
          graphic = params.graphic,
          symbol = params.symbol,
          mapResolution = params.mapResolution;

      var symbolType = symbol.type;
      if (symbolType === "textsymbol" ||
          symbolType === "shieldlabelsymbol") {
        return; // visual vars can't be applied
      }

      var sizeInfos = renderer.getVisualVariablesForType("sizeInfo"),
          colorInfos = renderer.getVisualVariablesForType("colorInfo"),
          opacityInfos = renderer.getVisualVariablesForType("opacityInfo"),
          sizeInfo = sizeInfos && sizeInfos[0],
          colorInfo = colorInfos && colorInfos[0],
          opacityInfo = opacityInfos && opacityInfos[0];

      if (sizeInfo) {
        var size = renderer.getSize(graphic, {
          sizeInfo: sizeInfo,
          shape: symbolType === "simplemarkersymbol" ? symbol.style : null,
          resolution: mapResolution
        });

        if (size != null) {
          if (symbolType === "simplemarkersymbol") {
            jsonSym.size = screenUtils.px2pt(size);
          }
          else if (symbolType === "picturemarkersymbol") {
            jsonSym.width = screenUtils.px2pt(size);
            jsonSym.height = screenUtils.px2pt(size);
          }
          else if (symbolType === "simplelinesymbol") {
            jsonSym.width = screenUtils.px2pt(size);
          }
          else if (jsonSym.outline) {
            jsonSym.outline.width = screenUtils.px2pt(size);
          }
        }
      }

      if (colorInfo) {
        var color = renderer.getColor(graphic, {
          colorInfo: colorInfo
        });

        if (color) {
          if (symbolType === "simplemarkersymbol" ||
              symbolType === "simplelinesymbol" ||
              symbolType === "simplefillsymbol") {
            jsonSym.color = Color.toJSON(color);
          }
        }
      }

      if (opacityInfo) {
        var opacity = renderer.getOpacity(graphic, {
          opacityInfo: opacityInfo
        });

        if (opacity != null) {
          if (jsonSym.color) {
            jsonSym.color[3] = Math.round(opacity * 255);
          }
        }
      }
    }

  });

  return PrintTask;
});
