define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/Deferred",
  "dojo/_base/array",
  "dojo/_base/config",
  "dojo/io-query",

  "../../config",
  "../../core/lang",
  "../../request",
  "../../core/deferredUtils",
  "../../core/urlUtils",
  
  "../../geometry/Extent",
  "../../geometry/Point",
  "../../geometry/Polygon",

  "../support/MosaicRule",
  "../support/RasterFunction",
  "../support/DimensionalDefinition",
  "../support/Raster",
  "../support/PixelBlock",
  "../support/TimeInfo",
  "../support/Field",
  
  "../pixelFilters/VectorFieldPixelFilter",
  
  "../../Graphic",
  
  "../../tasks/ImageServiceIdentifyTask",
  "../../tasks/support/ImageServiceIdentifyParameters"
],
function(
  declare, lang, Deferred, array, dojoConfig, ioq, esriConfig, esriLang, esriRequest, dfdUtils, urlUtils,
  Extent, Point, Polygon,
  MosaicRule, RasterFunction, DimensionalDefinition, Raster, PixelBlock,
  TimeInfo, Field, 
  VectorFieldPixelFilter, 
  Graphic, 
  ImageServiceIdentifyTask, ImageServiceIdentifyParameters
) {
    var ImageServiceLayerMixin = declare(null, {
    declaredClass: "esri.layers.mixins.ImageServiceLayerMixin",
    
    _eventMap: {
        "rendering-change": true,
        "mosaic-rule-change": true
    },

    constructor: function (url, options) {
      // Nothing for now...
    },

    _initialize: function (url, options) {
      this._url = urlUtils.urlToObject(url);
      this.raster = new Raster(url);

      this.popupTemplate = options && options.popupTemplate;
      var imgParams = options && options.imageServiceParameters;
      this.format = imgParams && imgParams.format;
      this.compressionTolerance = (imgParams && imgParams.compressionTolerance) ? imgParams.compressionTolerance : 0.01;
      this.interpolation = imgParams ? imgParams.interpolation : null;
      this.compressionQuality = imgParams ? imgParams.compressionQuality : null;
      this.bandIds = imgParams ? imgParams.bandIds : null;
      this.mosaicRule = imgParams ? imgParams.mosaicRule : null;
      this.renderingRule = imgParams ? imgParams.renderingRule : null;
      this.useMapDimensionValue = (options && options.hasOwnProperty("useMapDimensionValue")) ? 
                        (!!options.useMapDimensionValue) : 
                        true;
      this.activeMapDimensions = options && options.activeMapDimensions;
      
      this._params = lang.mixin({},
                                this._url.query,
                                {
                                  f:"image",
                                  interpolation: this.interpolation,
                                  format: this.format,
                                  compressionQuality: this.compressionQuality,
                                  bandIds: this.bandIds ? this.bandIds.join(",") : null
                                },
                                imgParams ? imgParams.toJSON() : {});

      this.pixelFilter = options && options.pixelFilter;
      this.pixelData = null;
      this.originalPixelData = null;
      this.hasDataChanged = true;
      this._requestDataHandler = lang.hitch(this, this._requestDataHandler);
      this._requestDataErrorHandler = lang.hitch(this, this._requestDataErrorHandler);

      this._initLayer = lang.hitch(this, this._initLayer);
      this._queryVisibleRastersHandler = lang.hitch(this, this._queryVisibleRastersHandler);
      this._visibleRasters = [];

      this._rasterAttributeTableFields = [];
      this._rasterAttributeTableFeatures = [];

      this._loadCallback = options && options.loadCallback;
      var resourceInfo = options && options.resourceInfo;
      if (resourceInfo) {
        this._initLayer(resourceInfo);
      }
      else {
        esriRequest({
          url: this._url.path,
          content: lang.mixin({ f:"json" }, this._url.query),
          callbackParamName: "callback",
          load: this._initLayer,
          error: this._errorHandler
        });
      }
    },
    
    disableClientCaching: false,
    
    _initLayer: function (response, io) {
      if (response === null || response === undefined) {
          return;
      }

      this._findCredential();

      // See esri.request for context regarding "_ssl"
      var ssl = (this.credential && this.credential.ssl) || (response && response._ssl);
      if (ssl) {
        this._useSSL();
      }

      // TODO
      // Mixing in "this" with "response" wipes out user configured min and max
      // scale values. Let's preserve those values before mixing in and restore
      // after.
      // Mixin gives flexibility on one hand and causes pain on the other.
      var saveMin = this.minScale, saveMax = this.maxScale;
      lang.mixin(this, response);
      this.minScale = saveMin;
      this.maxScale = saveMax;
      
      this.initialExtent = (this.fullExtent = this.extent = (Extent.fromJSON(response.extent)));
      this.spatialReference = this.initialExtent.spatialReference;

      // this.pixelSize = { width:parseFloat(this.pixelSizeX), height:parseFloat(this.pixelSizeY) }; //new esri.geometry.Point(parseFloat(this.pixelSizeX), parseFloat(this.pixelSizeY));
      this.pixelSizeX = parseFloat(this.pixelSizeX);
      this.pixelSizeY = parseFloat(this.pixelSizeY);

      var i, il, mins = this.minValues,
          maxs = this.maxValues,
          means = this.meanValues,
          stdvs = this.stdvValues,
          bs = (this.bands = []);
      for (i=0, il=this.bandCount; i<il; i++) {
        bs[i] = { min:mins[i], max:maxs[i], mean:means[i], stddev:stdvs[i] };
      }

      // .NET REST has a bug at 10.0 SP1 where it returns timeInfo with null timeExtent,
      // for a layer that is not time-aware. We need to workaround it and set timeInfo
      // to null for that case.
      var timeInfo = this.timeInfo;
      this.timeInfo = (timeInfo && timeInfo.timeExtent) ? new TimeInfo(timeInfo) : null;

      var fieldObjs = this.fields = [];
      var fields = response.fields;
      if (fields) {
          for (i = 0; i < fields.length; i++) {
              fieldObjs.push(new Field(fields[i]));
          }
      }

      // REST added currentVersion property to some resources
      // at 10 SP1
      this.version = response.currentVersion;
      
      if (!this.version) {
        var ver;
        
        if (
          "fields" in response || "objectIdField" in response || 
          "timeInfo" in response 
        ) {
          ver = 10;
        }
        else {
          ver = 9.3; // or could be 9.3.1
        }
        
        this.version = ver;
      } // version
      
      // _hasMin and _hasMax are defined in layer.js and indicate user
      // overrides for respective values
      if (esriLang.isDefined(response.minScale) && !this._hasMin) {
        this.setMinScale(response.minScale);
      }
     
      if (esriLang.isDefined(response.maxScale) && !this._hasMax) {
        this.setMaxScale(response.maxScale);
      }
      
      // set default mosaic rule
      var mrJson = {};
      if (response.defaultMosaicMethod) {
        mrJson.method = response.defaultMosaicMethod;
        mrJson.operation = response.mosaicOperator;
        mrJson.sortField = response.sortField;
        mrJson.sortValue = response.sortValue;
      } else {
        mrJson.method = MosaicRule.METHOD_NONE;
      }
      
      this.defaultMosaicRule = new MosaicRule(mrJson);
      this.defaultMosaicRule.ascending = true;

      // set default RFT
      this._setDefaultRenderingRule(true);

      // set default multidimensional slice if there is no slice set
      if (this._isScientificData() && (!this.mosaicRule || (this.mosaicRule && !this.mosaicRule.multidimensionalDefinition))) {
        this._setDefaultMultidimensionalDefinition(true);
      }

      if (this.version > 10 && this.hasRasterAttributeTable) {
        var rastDfd = this.getRasterAttributeTable();
        rastDfd.then(lang.hitch(this, function (response) {
          if (response && response.features && response.features.length > 0) {
            this._rasterAttributeTableFeatures = lang.clone(response.features);
          }
          if (response && response.fields && response.fields.length > 0) {
            this._rasterAttributeTableFields = lang.clone(response.fields);
          }
        }));
      }

      // set default pixel filter if not defined by the user
      if (this._isVectorData() && !esriLang.isDefined(this.pixelFilter)) {
        this.vectorFieldPixelFilter = new VectorFieldPixelFilter();
        this.vectorFieldPixelFilter.isDataUV = (this.serviceDataType === "esriImageServiceDataTypeVector-UV");
        this.pixelFilter = this.vectorFieldPixelFilter.computeMagnitudeAndDirection;
        this.getKeyProperties().then(lang.hitch(this, this._setFlowRepresentation));
      }

      this.loaded = true;
      this.onLoad(this);
      
      var callback = this._loadCallback;
      if (callback) {
        delete this._loadCallback;
        callback(this);
      }
    },
    
    getKeyProperties: function() {
      var url = this._url.path + "/keyProperties",
          dfd = new Deferred(dfdUtils._dfdCanceller);
      
      if (this.version > 10) {        
        dfd._pendingDfd = esriRequest({
          url: url,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        });
        
        dfd._pendingDfd.then(
          function(response) {
            dfd.callback(response);
          },
          
          function(error) { 
            dfd.errback(error);
          }
        );
      }
      else {
        var err = new Error("Layer does not have key properties");
        err.log = dojoConfig.isDebug;
        
        dfd.errback(err);
      }

      return dfd;
    },

    getRasterAttributeTable: function () {
      var url = this._url.path + "/rasterAttributeTable",
          dfd = new Deferred(dfdUtils._dfdCanceller);

      if (this.version > 10 && this.hasRasterAttributeTable) {
        dfd._pendingDfd = esriRequest({
          url: url,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        });

        dfd._pendingDfd.then(
          function (response) {
            dfd.callback(response);
          },

          function (error) {
            dfd.errback(error);
          }
        );
      }
      else {
        var err = new Error("Layer does not support raster attribute table");
        err.log = dojoConfig.isDebug;

        dfd.errback(err);
      }

      return dfd;
    },

    _getRasterAttributeTableFeatures: function () {
      var dfd = new Deferred();
      if (this._rasterAttributeTableFeatures && this._rasterAttributeTableFeatures.length > 0) {
        dfd.resolve(this._rasterAttributeTableFeatures);
        return dfd;
      }

      if (this.version > 10 && this.hasRasterAttributeTable) {
        var rastDfd = this.getRasterAttributeTable();
        rastDfd.then(lang.hitch(this, function (response) {
          if (response && response.features && response.features.length > 0) {
            this._rasterAttributeTableFeatures = lang.clone(response.features);
          }
        }));

        return rastDfd;
      } else {
        dfd.resolve(this._rasterAttributeTableFeatures);
        return dfd;
      }
    },

    getCustomRasterFields: function (options) {
      var ratFieldPrefix = options ? options.rasterAttributeTableFieldPrefix : "";
      var itemPixelValueField = {
        name: "Raster.ItemPixelValue",
        alias: "Item Pixel Value",
        domain: null,
        editable: false,
        length: 50,
        type: "esriFieldTypeString"
      };

      var servicePixelValueField = {
        name: "Raster.ServicePixelValue",
        alias: "Service Pixel Value",
        domain: null,
        editable: false,
        length: 50,
        type: "esriFieldTypeString"
      };

      var customFields = this.fields ? lang.clone(this.fields) : [];
      var index = customFields.length;
      customFields[index] = servicePixelValueField;
      // If MD only then item pixel value field
      if ((this.capabilities && this.capabilities.toLowerCase().indexOf("catalog") > -1) || 
          (this.fields && this.fields.length>0)) {              
        customFields[index + 1] = itemPixelValueField;
      }
      
      if (esriLang.isDefined(this.pixelFilter)
      && (this.serviceDataType === "esriImageServiceDataTypeVector-UV" 
      || this.serviceDataType === "esriImageServiceDataTypeVector-MagDir")){

        var magnitudeField = {
          name: "Raster.Magnitude",
          alias: "Magnitude",
          domain: null,
          editable: false,
          type: "esriFieldTypeDouble"
        };
        
        var directionField = {
          name: "Raster.Direction",
          alias: "Direction",
          domain: null,
          editable: false,
          type: "esriFieldTypeDouble"
        };
        
        customFields[index + 2] = magnitudeField;
        customFields[index + 3] = directionField;
      }

      if (this._rasterAttributeTableFields && this._rasterAttributeTableFields.length > 0) {
        // take out oid field
        var filteredFields = array.filter(this._rasterAttributeTableFields, function (field) {
          return (field.type !== "esriFieldTypeOID" && field.name.toLowerCase() !== "value");
        });

        var ratFields = array.map(filteredFields, function (field) {
          var rField = lang.clone(field);
          rField.name = ratFieldPrefix + field.name;
          return rField;
        });

        customFields = customFields.concat(ratFields);
      }

      return customFields;
    },

    _prepareGetImageParameters: function (extent, width, height, params)
    {
      params = esriLang.isDefined(params) ? params : this._params;
      
      var sr = extent.spatialReference.wkid || JSON.stringify(extent.spatialReference.toJSON());
      delete params._ts;

      lang.mixin(
        params,
        {
          bbox: extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax, //dojo.toJson(extent.toJSON()),
          imageSR: sr,
          bboxSR: sr,
          size: width + "," + height
        },
        this.disableClientCaching ? { _ts: new Date().getTime() } : {}
      );

      delete params.compressionTolerance;
      if (params.format && params.format.toUpperCase() === "LERC") {
        params.compressionTolerance = this.compressionTolerance;
      }

      params.token = this._getToken();
    },

    getImageUrl: function (extent, width, height, callback, params) {
      
      params = esriLang.isDefined(params) ? params : this._params;

      this._prepareGetImageParameters(extent, width, height, params);

      // clone params before cleaning up the request parameters...
      var requestParams = lang.clone(params);
      this._cleanupRequestParams(requestParams);

      var path = this._url.path + "/exportImage?",
          requestString = urlUtils.addProxy(path + ioq.objectToQuery(lang.mixin(requestParams, { f: "image" })));
          
      var token = requestParams.token;
      if ((requestString.length > esriConfig.request.maxUrlLength) || this.useMapImage) {
        this._jsonRequest = esriRequest({
          url: path,
          content: lang.mixin(requestParams, { f: "json" }),
          callbackParamName: "callback",
          
          load: function(response, io) {
            var href = response.href;
            
            // 10.1 servers require token to access output directory URLs as well
            if (token) {
              href += (
                href.indexOf("?") === -1 ? 
                  ("?token=" + token) : 
                  ("&token=" + token)
              );
            }
            
            //console.log("token=" + token);
            callback(urlUtils.addProxy(href)); 
          },
          
          error: this._errorHandler
        });
      }
      else {
        callback(requestString);
      }
    },
    
    onRenderingChange: function () {},
    onMosaicRuleChange: function () {},
      
    // setFormat: function(/*String*/ format) {
    //   this.format = (this._params.format = format);
    //   this.refresh();
    // },

    setInterpolation: function(/*String*/ interpolation, /*Boolean?*/ doNotRefresh) {
      this.interpolation = (this._params.interpolation = interpolation);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setCompressionQuality: function(/*Number*/ compQual, /*Boolean?*/ doNotRefresh) {
      this.compressionQuality = (this._params.compressionQuality = compQual);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setCompressionTolerance: function (/*Number*/ compTolerance, /*Boolean?*/ doNotRefresh) {
      this.compressionTolerance = compTolerance;
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setBandIds: function(/*Number[]*/ ids, /*Boolean?*/ doNotRefresh) {
      var fireOnChange = false;
      if (this.bandIds !== ids) {
        fireOnChange = true;
      }      
      this.bandIds = ids;
      this._params.bandIds = ids.join(",");
      
      if (fireOnChange && !doNotRefresh) {
        this.onRenderingChange();
      }
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDefaultBandIds: function(/*Boolean?*/ doNotRefresh) {
      this.bandIds = (this._params.bandIds = null);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setDisableClientCaching: function(/*boolean*/ caching) {
      this.disableClientCaching = caching;
    },
    
    setMosaicRule : function(/*MosaicRule*/ mosaicRule, /*Boolean?*/ doNotRefresh){
      var fireOnChange = false;
      if (this.mosaicRule !== mosaicRule) {
        fireOnChange = true;
      }       
      this.mosaicRule = mosaicRule; 
      this._params.mosaicRule = JSON.stringify(mosaicRule.toJSON());
      
      if (fireOnChange && !doNotRefresh) {
        this.onMosaicRuleChange();
      }      
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setRenderingRule: function(/*RenderingRule*/ renderingRule, /*Boolean?*/ doNotRefresh){
      var fireOnChange = false;
      if (this.renderingRule !== renderingRule) {
        fireOnChange = true;
      }
      this.renderingRule = renderingRule; 
      this._params.renderingRule = renderingRule ? JSON.stringify(renderingRule.toJSON()) : null;
      
      if (fireOnChange && !doNotRefresh) {
        this.onRenderingChange();
      }
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },
    
    setImageFormat: function(/*String*/ format, /*Boolean?*/ doNotRefresh) {
      this.format = (this._params.format = format);
      if (!doNotRefresh) {
        this.refresh(true);
      }
    },

    setDefinitionExpression: function (/*String*/expr, /*Boolean?*/doNotRefresh) {
      var json = this.mosaicRule ? this.mosaicRule.toJSON() : {};
      if (!this.mosaicRule) {
        if (this.defaultMosaicRule) {
          json = this.defaultMosaicRule.toJSON();
        } else {
          json.method = MosaicRule.METHOD_NONE;
        }
      }
      
      json.where = expr;
      var newMosaicRule = new MosaicRule(json);
      this.setMosaicRule(newMosaicRule, doNotRefresh);
      return this;
    },
    
    getDefinitionExpression: function() {
      return this.mosaicRule ? this.mosaicRule.where : null;
    },

    setPixelFilter: function (pixelFilter) {
      this.pixelFilter = pixelFilter;
    },

    getPixelData: function (/* Boolean */ returnRaw) {
      if (returnRaw) {
        return this.originalPixelData;
      } else {
        return this.pixelData;
      }
    },

    redraw: function ()
    {
      this.hasDataChanged = false;
      this._setPixelData(this.originalPixelData);
    },
    
    queryVisibleRasters: function (/*esri.tasks.query*/ query, /*Object*/ options, /*Function?*/ callback, /*Function?*/ errback) {
      var map = this._map,
          dfd = dfdUtils._fixDfd(new Deferred(dfdUtils._dfdCanceller));

      this._visibleRasters = [];
      var i, field, returnCatalogItems = true, info;
      // if its only the service pixel value field then don't request for catalog items...
      if (this.popupTemplate && this.popupTemplate.info && this.popupTemplate.info.fieldInfos && this.popupTemplate.info.fieldInfos.length > 0) {
        returnCatalogItems = false;
        info = this.popupTemplate.info;
        for (i = 0; i < info.fieldInfos.length; i++) {
          field = info.fieldInfos[i];
          if (field && field.fieldName.toLowerCase() !== "raster.servicepixelvalue") {
            if (field.visible || info.title && info.title.toLowerCase().indexOf(field.fieldName.toLowerCase()) > -1) {
              returnCatalogItems = true;
              break; 
            }
          }
        }
      }
      
      var params = new ImageServiceIdentifyParameters();
      params.geometry = query.geometry; //accepts Point and Polygon geometries
      //if layer SR not equal to map SR, don't return geometry
      params.returnGeometry = this._map.spatialReference.equals(this.spatialReference);
      params.returnCatalogItems = returnCatalogItems;
      params.timeExtent = query.timeExtent;
      params.mosaicRule = (this.mosaicRule ? this.mosaicRule : null);
      params.renderingRule = (this.renderingRule ? this.renderingRule : null);
      if (map) {
        //params.outSpatialReference = new SpatialReference(map.spatialReference.toJSON());
        var psX = (map.extent.xmax - map.extent.xmin) / (map.width * 2);
        var psY = (map.extent.ymax - map.extent.ymin) / (map.height * 2);
        var psSR = map.extent.spatialReference;
        var pixelSize = new Point(psX, psY, psSR);
        params.pixelSize = pixelSize;
      }

      var self = this;
      var task = new ImageServiceIdentifyTask(this.url);
      var temp = dfd._pendingDfd = task.execute(params);
      temp.then(
        function (response) {
          self._queryVisibleRastersHandler(response, options, callback, errback, dfd);
        },
        function (err) {
          self._resolve([err], null, errback, dfd, true);
        }
      );

      return dfd;
    },

    _queryVisibleRastersHandler: function (response, options, callback, errback, dfd) {
      var pixelValue = response.value;
      var pixelValues, features, i = 0, j = 0, _this = this, oidField = this.objectIdField, objectIds;
      if (response.catalogItems) { // its the result of an Identify task
        var dataIdx = 0, noDataIdx, idx, length = response.catalogItems.features.length, noDataValues = 0;
        features = new Array(length); 
        pixelValues = new Array(length); 
        objectIds = new Array(length); 
        //show non-noData value results first
        for (i = 0; i < length; i++) {
          if (response.properties.Values[i].toLowerCase().indexOf("nodata") > -1) {
            noDataValues++;
          }
        }
        noDataIdx = length - noDataValues;
        for (i = 0; i < length; i++) {
          if (response.properties.Values[i].toLowerCase().indexOf("nodata") > -1) {
            idx = noDataIdx++;
          }
          else {
            idx = dataIdx++;
          }
          features[idx] = response.catalogItems.features[i];
          pixelValues[idx] = response.properties.Values[i];
          objectIds[idx] = features[idx].attributes[oidField];
        }
      }

      this._visibleRasters = [];
      var feature;
      var isNoData = pixelValue.toLowerCase().indexOf("nodata") > -1;
      
      if (pixelValue && !features && !isNoData) {
        oidField = "ObjectId";
        features = [];
        var attributes = {};
        attributes.ObjectId = 0;
        feature = new Graphic(new Extent(this.fullExtent), null, attributes);
        features.push(feature);
      }
      
      var retVal = [];
      if (!features) {
        this._resolve([retVal, null, null], null, callback, dfd);
        return;
      }
      
      function handleIdentifyResults() {
        var mFields = this.getCustomRasterFields(options);
        var domainFields = this._getDomainFields(mFields);
        var returnDomainValues = options ? options.returnDomainValues : false;

        // get raster attribute table field values
        var ratFieldPrefix = options && options.rasterAttributeTableFieldPrefix;
        var i, oid, itemPixelValue, pVal, ratFeatureArr, ratFeature, prop, newProp, newAttributes, pVals;
        var ratDfd = this._getRasterAttributeTableFeatures();
        ratDfd.then(lang.hitch(this, function(ratAttTableFeatures) {
          for ( i = 0; i < features.length; i++) {
            feature = features[i];
            oid = feature.attributes[oidField];
            feature.popupTemplate = this.popupTemplate; // important for displaying these in the popups
            feature._layer = this; // returned by Graphic.getLayer()

            if (pixelValue) {
              itemPixelValue = pixelValue;
              if (pixelValues && pixelValues.length >= i) {
                pVal = pixelValues[i];
                itemPixelValue = pVal.replace(/ /gi, ", ");
              }
              
              feature.attributes["Raster.ItemPixelValue"] = itemPixelValue;
              feature.attributes["Raster.ServicePixelValue"] = pixelValue;
              
              //Magnitude and direction calculated from Item pixel value
              if (this.pixelFilter){ 
                pVals = itemPixelValue.replace(" ", "").split(",");
                var pixelBlock = new PixelBlock({
                  height: 1,
                  width: 1,
                  pixelType: "F32",
                  pixels: [],
                  statistics: []
                });
                
                array.forEach(pVals, function(pVal){
                  pixelBlock.addData({
                    pixels: [pVal],
                    statistics: {
                      minValue: pVal,
                      maxValue: pVal,
                      noDataValue: null
                    }
                  });
                });
                
                this.pixelFilter({
                  pixelBlock: pixelBlock,
                  extent: new Extent(0,0,0,0, this._map.spatialReference)
                });

                if (this.serviceDataType === "esriImageServiceDataTypeVector-UV" || this.serviceDataType === "esriImageServiceDataTypeVector-MagDir") { 
                  feature.attributes["Raster.Magnitude"] = pixelBlock.pixels[0][0];
                  feature.attributes["Raster.Direction"] = pixelBlock.pixels[1][0];
                }
              }
            
            
              // get raster attribute table feature that matches the current pixel value
              if (ratAttTableFeatures && ratAttTableFeatures.length > 0) {
                ratFeatureArr = array.filter(ratAttTableFeatures, function(rFeature) {
                  if (rFeature && rFeature.attributes) {
                    if (rFeature.attributes.hasOwnProperty("Value")) {
                      return (rFeature.attributes.Value == itemPixelValue);
                      // Do not use === as the type may be different
                    } else {
                      return (rFeature.attributes.VALUE == itemPixelValue);
                      // Do not use === as the type may be different
                    }
                  }

                });

                if (ratFeatureArr.length > 0) {// It'll ideally contain only feature
                  ratFeature = lang.clone(ratFeatureArr[0]);
                  if (ratFieldPrefix && ratFeature) {
                    newAttributes = {};
                    for (prop in ratFeature.attributes) {
                      if (ratFeature.attributes.hasOwnProperty(prop)) {
                        newProp = ratFieldPrefix + prop;
                        newAttributes[newProp] = ratFeature.attributes[prop];
                      }
                    }
                    ratFeature.attributes = newAttributes;
                    feature.attributes = lang.mixin(feature.attributes, ratFeature.attributes);
                  }
                }
              }
            }

            // handle domain fields here
            if (returnDomainValues && domainFields && domainFields.length > 0) {
              array.forEach(domainFields, function(field) {
                if (field) {
                  var value = feature.attributes[field.name];
                  if (esriLang.isDefined(value)) {
                    var domainValue = this._getDomainValue(field.domain, value);
                    if (esriLang.isDefined(domainValue)) {
                      feature.attributes[field.name] = domainValue;
                    }
                  }
                }
              }, this);
            }

            retVal.push(feature);
            this._visibleRasters.push(feature);
          }

          this._resolve([retVal, null, true], null, callback, dfd);
        }));
      }

      
      //if layer SR not equal to map SR, querying the service for geometries of returned features
      if(
        !this._map.spatialReference.equals(this.spatialReference) && 
        objectIds && objectIds.length > 0
        )
      {
        esriRequest({
          url: this._url.path + "/query",
          content: {
            f: "json",
            objectIds: objectIds.join(","),
            returnGeometry: true,
            outSR: JSON.stringify(_this._map.spatialReference.toJSON()),
            outFields: oidField
          },
          handleAs: "json",
          callbackParamName: "callback",
          load: function (response) {
            if (response.features.length === 0) {
              _this._resolve([retVal, null, null], null, callback, dfd);
              return;
            }
            for (i = 0; i < response.features.length; i++) {
              for (j = 0;j < features.length; j++) {
                if (features[j].attributes[oidField] == response.features[i].attributes[oidField]) {
                  features[j].geometry = Polygon.fromJSON(response.features[i].geometry);
                  features[j].geometry.setSpatialReference(_this._map.spatialReference); 
                }
              }
            }
            handleIdentifyResults.call(_this);
          },
          error: function (err) {
            _this._resolve([retVal, null, null], null, callback, dfd);
          }
        });
      }else {
       handleIdentifyResults.call(this);
      }
      
    },

    getVisibleRasters: function () {
      var selected = this._visibleRasters, retVal = [], item;

      for (item in selected) {
        if (selected.hasOwnProperty(item)) {
          retVal.push(selected[item]);
        }
      }
      return retVal;
    },

    _getDomainFields: function(fields) {
      if (!fields) {
        return;
      }
      
      var domainFields = [];
      array.forEach(fields, function(field) {
        if (field.domain) {
          var dField = {};
          dField.name = field.name;
          dField.domain = field.domain;
          domainFields.push(dField);
        }
      });
      
      return domainFields;
    },
    
    _getDomainValue: function(domain, value) {
      if (domain && domain.codedValues) {
        var domainName;
        
        array.some(domain.codedValues, function(codedValue) {
          if (codedValue.code === value) {
            domainName = codedValue.name;
            return true;
          }
          return false;
        });
        
        return domainName;
      }      
    },
    
    _requestData: function (extent, width, height) {
      var mapExtent = lang.clone(extent);
      var normalizedExtent = mapExtent._normalize(true);
      this._prepareGetImageParameters(normalizedExtent, width, height);
      var params = lang.clone(this._params);
      this._cleanupRequestParams(params);
      params.extent = mapExtent; //This is the original extent before normalization. It has the wkid in SR that can be used for normalization later
      var readOptions = {
        imageServiceParameters: params,
        nBands: Math.min(this.bandCount, 3),
        pixelType: this.pixelType
      };

      this.raster.read(readOptions, this._requestDataHandler, this._requestDataErrorHandler);
    },

    _requestDataHandler: function(pixelData) {
      this.originalPixelData = pixelData;
      this.hasDataChanged = true;
      this._setPixelData(pixelData);
    },

    _setPixelData: function (pixelData) {
      var clonedPixelData = this._clonePixelData(pixelData);
      // Apply filter
      if (this.pixelFilter) {
        this.pixelFilter(clonedPixelData);
      }
      this.pixelData = clonedPixelData;
      this._drawPixelData();
    },

    _drawPixelData: function () {
      // To be overwritten by the layer
    },
    
    _requestDataErrorHandler: function (error) {
      // To be overwritten by the layers...
    },

    _clonePixelData: function (orgPixelData) {
      if (orgPixelData === null || orgPixelData === undefined) {
        return orgPixelData;
      }

      var newPixelData = {};
      if (orgPixelData.extent) {
        newPixelData.extent = lang.clone(orgPixelData.extent);
      }

      var orgPixelBlock = orgPixelData.pixelBlock;
      if (orgPixelBlock === null || orgPixelBlock === undefined) {
        return newPixelData;
      }

      newPixelData.pixelBlock = orgPixelBlock.clone();
      return newPixelData;
    },

    getMultidimensionalInfo: function () {
      var url = this._url.path + "/multiDimensionalInfo",
          dfd = new Deferred(dfdUtils._dfdCanceller);
  
      if (this._multidimensionalInfo) {
        dfd.resolve(this._multidimensionalInfo);
        return dfd;
      }

      if (this.version >= 10.3 && this.hasMultidimensions) {
        dfd._pendingDfd = esriRequest({
          url: url,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        });

        dfd._pendingDfd.then(lang.hitch(this,
          function (response) {
            this._multidimensionalInfo = response.multidimensionalInfo;
            dfd.callback(response.multidimensionalInfo);
          }),

          function (error) {
            dfd.errback(error);
          }
        );
      }
      else {
        var err = new Error("Layer does not support multidimensional info");
        err.log = dojoConfig.isDebug;

        dfd.errback(err);
      }

      return dfd;
    },
    
    getDefaultMultidimensionalDefinition: function () {
        var multidimensionalInfo,
                variableName,
                dimensions,
                index,
                mdDefinition = [],
                dfd = new Deferred(dfdUtils._dfdCanceller);

        if (this._defaultMultidimensionalDefinition) {
            dfd.resolve(this._defaultMultidimensionalDefinition);
            return dfd;
        }

        dfd._pendingDfd = this.getMultidimensionalInfo();

        dfd._pendingDfd.then(lang.hitch(this, function (result) {
            multidimensionalInfo = result;
            variableName = multidimensionalInfo.variables[0].name;
            dimensions = multidimensionalInfo.variables[0].dimensions;

            for (index in dimensions) {
                if (dimensions.hasOwnProperty(index)) {
                    if (dimensions[index].hasRanges && dimensions[index].hasRanges == true) {
                        mdDefinition.push(new DimensionalDefinition({
                            variableName: variableName,
                            dimensionName: dimensions[index].name,
                            isSlice: false,
                            values: [dimensions[index].values[0][0], dimensions[index].values[0][1]]
                        }));
                    } else {
                        mdDefinition.push(new DimensionalDefinition({
                            variableName: variableName,
                            dimensionName: dimensions[index].name,
                            isSlice: true,
                            values: [dimensions[index].extent[0]]
                        }));
                    }
                }
            }
            this._defaultMultidimensionalDefinition = mdDefinition;
            dfd.callback(mdDefinition);
        }), function (error) {
            dfd.errback(error);
        });
        return dfd;
    },
    
    _setDefaultMultidimensionalDefinition: function (/*Boolean?*/ doNotRefresh) {
        var defaultMdDefinition,
                mosaicRule = {};

        this.getDefaultMultidimensionalDefinition().then(lang.hitch(this, function (result) {
            defaultMdDefinition = result;
            if (defaultMdDefinition.length > 0) {

                if (this.mosaicRule) {
                    mosaicRule = lang.clone(this.mosaicRule);
                    mosaicRule.multidimensionalDefinition = defaultMdDefinition;
                } else if (this.defaultMosaicRule) {
                    mosaicRule = lang.clone(this.defaultMosaicRule);
                    mosaicRule.multidimensionalDefinition = defaultMdDefinition;
                } else {
                    mosaicRule = new MosaicRule({multidimensionalDefinition: defaultMdDefinition});
                }
                
                this.setMosaicRule(mosaicRule, doNotRefresh);
            }
        }));
    },

    _setDefaultRenderingRule: function (/*Boolean?*/ doNotRefresh) {
      var rfJson = {};
      if (!this.renderingRule && this.declaredClass !== "esri.layers.ArcGISImageServiceVectorLayer"
      && this.rasterFunctionInfos && this.rasterFunctionInfos.length && this.rasterFunctionInfos[0].name != "None" ) {
        rfJson.rasterFunction = this.rasterFunctionInfos[0].name;
      } else if (!this.renderingRule && this.declaredClass == "esri.layers.ArcGISImageServiceVectorLayer" && this.version > 10.3) {
        // set resampling type to VectorAverage for servers > 10.3
        var rsType = (this.serviceDataType === "esriImageServiceDataTypeVector-UV" ) ? 7 : 10;
        var resamplingServerFunction = new RasterFunction();
        rfJson.rasterFunction = "Resample";
        rfJson.rasterFunctionArguments = {
          ResamplingType: rsType,
          InputCellSize: {x: this.pixelSizeX, y: this.pixelSizeY}
        };
      }

      if (rfJson.hasOwnProperty("rasterFunction")) {
        this.defaultRenderingRule = new RasterFunction(rfJson);
        this.setRenderingRule(this.defaultRenderingRule, doNotRefresh);
      }
    },

    _cleanupRequestParams: function (imgParams) {
      if (!imgParams) {
        return imgParams;
      }

      // The time value set by the time slider takes precedence over time dimension
      if (imgParams.time && imgParams.mosaicRule) {
        var mosaicRule = new MosaicRule(JSON.parse(imgParams.mosaicRule));
        if (mosaicRule && mosaicRule.multidimensionalDefinition && mosaicRule.multidimensionalDefinition.length > 0) {

          // take time dimension out from the mosaicrule if there is time property set on the parameters...
          var filteredDimensions = array.filter(mosaicRule.multidimensionalDefinition, function (dimDef) {
            return (dimDef.dimensionName !== "StdTime");
          });

          mosaicRule.multidimensionalDefinition = filteredDimensions;
          imgParams.mosaicRule = JSON.stringify(mosaicRule.toJSON());
        }
      }

      // Take out other non-image request properties
      var filterProperties = ["displayOnPan", "drawMode", "styling", "id", "opacity", "visible", "resourceInfo", "useMapDimensionValue", "extent"];
      for (var imageParam in filterProperties) {
        if (imgParams.hasOwnProperty(filterProperties[imageParam])) {
          delete imgParams[filterProperties[imageParam]];
        }
      }

      return imgParams;
    },

    _isScientificData: function () {
      return (this.serviceDataType === "esriImageServiceDataTypeVector-UV"
           || this.serviceDataType === "esriImageServiceDataTypeVector-MagDir"
           || this.serviceDataType === "esriImageServiceDataTypeScientific ");
    },

    _isVectorData: function () {
      return (this.serviceDataType === "esriImageServiceDataTypeVector-UV"
           || this.serviceDataType === "esriImageServiceDataTypeVector-MagDir");
    },

    _createPixelData: function (pixels) {
      var pixelBlock = new PixelBlock({
        width: 2,
        height: 2,
        pixels: pixels,
        pixelType: this.pixelType,
        statistics: pixels
      });

      var centerPt = this.fullExtent.getCenter();
      var tempExtent = new Extent(centerPt.x, centerPt.y, centerPt.x + this.pixelSizeX, centerPt.y + this.pixelSizeY, this.spatialReference);
      var pixelData = {
        pixelBlock: pixelBlock,
        extent: tempExtent
      };

      return pixelData;
    },

    _resolve: function (args, eventName, callback, dfd, isError) {
      // Fire Event
      if (eventName) {
        this[eventName].apply(this, args);
      }

      // Invoke Callback
      if (callback) {
        callback.apply(null, args);
      }

      // Resolve Deferred
      if (dfd) {
        dfdUtils._resDfd(dfd, args, isError);
      }
    }
  });

  return ImageServiceLayerMixin;
});
