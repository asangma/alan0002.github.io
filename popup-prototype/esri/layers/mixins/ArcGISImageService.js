/**
 * Mixin for {@link module:esri/layers/ArcGISImageLayer}.
 * 
 * @module esri/layers/mixins/ArcGISImageService
 * @mixin
 */
define(
[
  "esri/core/declare",
  "dojo/_base/lang",
  "dojo/Deferred",

  "../support/Field",
  "../support/Raster",
  "../support/PixelBlock",
  "../support/MosaicRule",
  "../support/RasterFunction",

  "../../geometry/Extent",
  "../../geometry/Point",
  "../../geometry/SpatialReference",

  "../../tasks/QueryTask",
  "../../tasks/ImageServiceIdentifyTask",
  "../../tasks/support/ImageServiceIdentifyParameters",

  "../../request",
  "../../Graphic",

  "../../core/lang",
  "../../core/Accessor",
  "../../core/JSONSupport",
  "../../core/promiseUtils"
],
function(
  declare, lang, Deferred,
  Field, Raster, PixelBlock, MosaicRule, RasterFunction,
  Extent, Point, SpatialReference,
  QueryTask, ImageServiceIdentifyTask, ImageServiceIdentifyParameters,
  esriRequest, Graphic,
  esriLang, Accessor, JSONSupport, promiseUtils
) {

  /**
   * @private
   */
  var ExportImageServiceParameters = declare(Accessor, {

    toJSON: function() {
      return {
        bandIds: this.layer.bandIds ? this.layer.bandIds.join(",") : null,
        format: this.layer.format,
        compressionQuality: this.layer.compressionQuality,
        compressionTolerance: this.layer.compressionTolerance,
        interpolation: this.layer.interpolation,
        noData: this.layer.noData,
        noDataInterpretation: this.layer.noDataInterpretation,
        mosaicRule: this.layer.mosaicRule ? JSON.stringify(this.layer.mosaicRule.toJSON()) : null,
        renderingRule: this.layer.renderingRule ? JSON.stringify(this.layer.renderingRule.toJSON()) : null,
        adjustAspectRatio: this.layer.adjustAspectRatio
      };
    }

    //lang.mixin(ExportImageServiceParameters, {
    //  INTERPOLATION_BILINEAR: "RSP_BilinearInterpolation", INTERPOLATION_CUBICCONVOLUTION: "RSP_CubicConvolution",
    //  INTERPOLATION_MAJORITY: "RSP_Majority", INTERPOLATION_NEARESTNEIGHBOR: "RSP_NearestNeighbor",
    //  NODATA_MATCH_ALL: "esriNoDataMatchAll", NODATA_MATCH_ANY: "esriNoDataMatchAny"
    //});
  });

  var ArcGISImageService = declare(JSONSupport,
  /** 
  * @mixes module:esri/core/JSONSupport 
  * @lends module:esri/layers/mixins/ArcGISImageService 
  */
  {
    declaredClass: "esri.layers.mixins.ArcGISImageService",

    classMetadata: {
      properties: {
        version: {
          readOnly: true
        },
        queryTask: {
          readOnly: true
        },
        rasterFields: {
          readOnly: true
        },
        defaultMosaicRule: {
          readOnly: true
        },
        defaultRenderingRule: {
          readOnly: true
        },
        pixelData: {}
      },
      computed: {
        parsedUrl: ["url"],
        queryTask: ["url"],
        rasterFields: ["fields", "rasterAttributeTable", "rasterAttributeTableFieldPrefix"],
        domainFields: ["fields"]
      },
      reader: {
        exclude: [
          "id",
          "copyrightText",
          "currentVersion",
          "extent",
          "defaultMosaicMethod"
        ],

        add: [
          "copyright",
          "defaultDefinitionExpression",
          "version",
          "initialExtent",
          "fullExtent",
          "spatialReference",
          "objectIdField",
          "defaultMosaicRule",
          "defaultRenderingRule",
          "mosaicRule",
          "renderingRule"
        ]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._exportImageServiceParameters = new ExportImageServiceParameters({
        layer: this
      });

    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    // exportImageServiceParameters
    //----------------------------------

    /**
     * Serialized parameters for the export image request.
     * @private
     */
    _exportImageServiceParameters: null,

    //----------------------------------
    // raster
    //----------------------------------

    /**
     * Object used to request images from an imageservice
     * @private
     */
    _raster: null,

    //----------------------------------
    //  rawPixelData
    //----------------------------------

    /**
     * Object holds the last requested raw pixels from an imageservice
     * @private
     */

    _rawPixelData: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  copyright
    //----------------------------------

    /**
     * The copyright text as defined by the image service.
     *
     * @type {string}
     */
    copyright: null,

    _copyrightReader: function(value, source) {
      // TODO, reader is defined in ArcGISMapService
      // We expose "copyrightText" as "copyright" in the SDK.
      return source.copyrightText;
    },

    //----------------------------------
    //  fields
    //----------------------------------

    /**
     * An array of fields in the layer. Each field represents an attribute
     * that may contain a value for each raster in the layer.
     * 
     * @type {module:esri/layers/support/Field[]}
     */
     fields: null,

    _fieldsReader: function(value) {
      return value.map(function(field) {
        return new Field(field);
      });
    },

    //----------------------------------
    //  fullExtent
    //----------------------------------

    /**
     * The full extent of the layer.
     * 
     * @type {module:esri/geometry/Extent}
     */
    fullExtent: null,

    _fullExtentReader: function(value, source) {
      return source.extent && Extent.fromJSON(source.extent);
    },

    //----------------------------------
    //  initialExtent
    //----------------------------------
      
    /**
     * The initial extent as defined by the image service.
     *
     * @readonly
     * 
     * @type {module:esri/geometry/Extent}
     *             
     * @example
     * layer.then(function(){
     *   //zooms to the intial extent of the layer
     *   view.animateTo(layer.initialExtent);
     * });
     */
     initialExtent: null,

    _initialExtentReader: function(value, source) {
      return source.extent && Extent.fromJSON(source.extent);
    },

    //----------------------------------
    //  defaultDefinitionExpression
    //----------------------------------

    _defaultDefinitionExpressionReader: function(value, source) {
      return source.definitionExpression;
    },

    //----------------------------------
    //  definitionExpression
    //----------------------------------

    _definitionExpressionReader: function(value, source) {
      return this._defaultDefinitionExpressionReader(value, source);
    },

    //----------------------------------
    //  version
    //----------------------------------
      
    /**
     * The version of ArcGIS Server in which the image service is published.
     * 
     * @readonly
     * 
     * @type {number}
     *             
     * @example
     * //prints the version number to the console, e.g. 9.3, 9.31, 10.
     * console.log(layer.version);
     */  
     version: null,

    _versionReader: function(value, source) {
      // REST API added currentVersion property to some resources at 10 SP1
      // However, we expose "currentVersion" as "version" in the SDK
      value = source.currentVersion;

      // Let's compute version number for servers that don't advertise it.
      if (!value) {
        if (
          source.hasOwnProperty("fields") ||
          source.hasOwnProperty("objectIdField") ||
          source.hasOwnProperty("timeInfo")
        ) {
          value = 10;
        }
        else {
          value = 9.3; // or it could be 9.3.1
        }
      }

      return value;
    },

    //----------------------------------
    //  objectIdField
    //----------------------------------    

    _objectIdFieldReader: function(value, source) {
      // Find OID field from "fields" if it is not explicitly defined.
      if (!value) {
        source.fields.some(function(field) {
          if (field.type === "esriFieldTypeOID") {
            value = field.name;
          }
          return !!value;
        });
      }
      return value;
    },

    //----------------------------------
    //  spatialReference
    //----------------------------------
      
    /**
     * The spatial reference of the image service. 
     * 
     * @readonly
     * 
     * @type {module:esri/geometry/SpatialReference}
     */
     spatialReference: null,

    _spatialReferenceReader: function(value, source) {
      value = source.extent && source.extent.spatialReference;
      return value && SpatialReference.fromJSON(value);
    },

    //----------------------------------
    //  popupTemplates
    //----------------------------------

    /**
     * A dictionary from the layer id to the `popupTemplates` object. See the object specifications table below
     * for properties of the `popupTemplates` object. 
     * 
     * @property {module:esri/PopupTemplate} popupTemplate - The popup template for the layer.
     * @property {string} layerUrl - URL to the layer.
     * @property {Object} resourceInfo - Metadata of the layer.
     * 
     * @type {Object}
     */
    popupTemplates: null,

    //----------------------------------
    //  imageFormat
    //----------------------------------

    /**
     * The output image type.
     * 
     * **Known Values:** png | png8 | png24 | png32 | jpg | bmp | gif | jpgpng | lerc
     * 
     * @type {string}
     * @default
     */
    format: "lerc",

    //----------------------------------
    //  compressionTolerance
    //----------------------------------

    /**
     * The output image compression tolerance value.
     * 
     * @type {number}
     * @default
     */

    compressionTolerance: 0.01,

    //----------------------------------
    // rasterAttributeTableFieldPrefix
    //----------------------------------

    /**
     * Prefix used to define the fields from the raster attribute table.
     * It's primarily used for {@link module:esri/widgets/Popup popups}
     * 
     * @type {string}
     * @default
     */
    rasterAttributeTableFieldPrefix: "Raster.",

    //----------------------------------
    // rasterAttributeTable
    //----------------------------------

    /**
     * The raster attribute table associated with the service.
     * 
     * @type {Object}
     * @default null
     */
    rasterAttributeTable: null,

    //----------------------------------
    //  rasterFields
    //----------------------------------

    /**
     * A complete list of fields that consists of fields from the layer, pixel value fields 
     * and the attribute table fields. 
     * 
     * @type {module:esri/layers/support/Field[]}
     */
      rasterFields: null,

    _rasterFieldsGetter: function() {
      var ratFieldPrefix = this.rasterAttributeTableFieldPrefix;
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

      var rFields = this.fields ? lang.clone(this.fields) : [];
      var index = rFields.length;
      rFields[index] = servicePixelValueField;
      // If MD only then item pixel value field
      if ((this.capabilities && this.capabilities.toLowerCase().indexOf("catalog") > -1) ||
          (this.fields && this.fields.length > 0)) {
        rFields[index + 1] = itemPixelValueField;
      }

      if (esriLang.isDefined(this.pixelFilter)
      && (this.serviceDataType === "esriImageServiceDataTypeVector-UV"
      || this.serviceDataType === "esriImageServiceDataTypeVector-MagDir")) {

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

        rFields[index + 2] = magnitudeField;
        rFields[index + 3] = directionField;
      }

      var fields = (this.rasterAttributeTable && this.rasterAttributeTable.fields) || null;
      if (fields && fields.length > 0) {
        // take out oid field
        var filteredFields = fields.filter(function(field) {
          return (field.type !== "esriFieldTypeOID" && field.name.toLowerCase() !== "value");
        });

        var ratFields = filteredFields.map(function(field) {
          var rField = lang.clone(field);
          rField.name = ratFieldPrefix + field.name;
          return rField;
        });

        rFields = rFields.concat(ratFields);
      }

      return rFields;
    },

    //----------------------------------
    //  domainFields
    //----------------------------------

    /**
     * An array of fields in the layer for which a {@link module:esri/layers/support/Domain} has been defined.
     * 
     * @type {module:esri/layers/support/Field[]}
     */
     domainFields: null,

    _domainFieldsGetter: function() {
      return (this.fields && this.fields.filter(function(field) {
        return (field.domain);
      })) || [];
    },

    //----------------------------------
    //  queryTask
    //----------------------------------

    /**
     * Sets the [url](#url) of the image service to a QueryTask instance. This may be used to query rasters
     * in the service. Use the [queryRasters()](#queryRasters) to execute this task.
     * 
     * @readonly
     * 
     * @type {module:esri/tasks/QueryTask}
     *             
     * @example
     * //You may execute a query where `layer` is an ArcGISImageLayer
     * //and `params` are the parameters defined in Query.
     * layer.queryRasters(params).then(function(response){
     *   //do something with the response here
     * });
     * @see [queryRasters()](#queryRasters)
     * @ignore          
     */
     queryTask: null,

    _queryTaskGetter: function() {
      return new QueryTask({
        url: this.url
      });
    },

    //----------------------------------
    //  defaultMosaicRule
    //----------------------------------

    /**
     * Defines the default mosaic properties published by the image service.
     * 
     * @type {module:esri/layers/support/MosaicRule}
     * @see [mosaicRule](#mosaicRule)             
     */
     defaultMosaicRule: null,

    _defaultMosaicRuleReader: function(value, source) {
      var mrJson = {};
      if (source.defaultMosaicMethod) {
        mrJson.method = source.defaultMosaicMethod;
        mrJson.operation = source.mosaicOperator;
        mrJson.sortField = source.sortField;
        mrJson.sortValue = source.sortValue;
      } else {
        mrJson.method = MosaicRule.METHOD_NONE;
      }

      value = new MosaicRule(mrJson);
      value.ascending = true;
      return value;
    },

    //----------------------------------
    //  defaultRenderingRule
    //----------------------------------

    /**
     * Defines the default [renderingRule](#renderingRule) published by the image service.
     * 
     * @type {module:esri/layers/support/RasterFunction}
     * @see [renderingRule](#renderingRule)             
     */
     defaultRenderingRule: null,  

    _defaultRenderingRuleReader: function(value, source) {
      var rFunctions = source.rasterFunctionInfos;
      if (rFunctions && rFunctions.length && rFunctions[0].name !== "None") {
        value = new RasterFunction();
        value.functionName = source.rasterFunctionInfos[0].name;
      }

      return value;
    },

    //----------------------------------
    //  mosaicRule
    //----------------------------------

    /**
     * Defines how individual images should be mosaicked.
     * 
     * @type {module:esri/layers/support/MosaicRule}
     */
    mosaicRule: null,

    _mosaicRuleReader: function(value, source) {
      return this._defaultMosaicRuleReader(value, source);
    },

    //----------------------------------
    //  renderingRule
    //----------------------------------

    /**
     * Specifies the rendering rule for how the requested image should be rendered.
     * 
     * @type {module:esri/layers/support/RasterFunction}
     * @see [Raster functions - ArcGIS REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Raster_Function_Objects/02r3000000rv000000/)             
     */
    renderingRule: null,

    _renderingRuleReader: function(value, source) {
      return this._defaultRenderingRuleReader(value, source);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Get key properties of an ImageService including information such as the 
     * band names associated with the imagery.
     * 
     * @return {Deferred} See {@link module:esri/request} for details on handling the response.
     */
    getKeyProperties: function() {
      return esriRequest({
        url: this.parsedUrl.path + "/keyProperties",
        content: lang.mixin({ f: "json" }),
        handleAs: "json",
        callbackParamName: "callback"
      });
    },

    getExportImageServiceParameters: function(options) {
      var extent = options.extent.shiftCentralMeridian();
      var width = options.width;
      var height = options.height;
      var spatialRef = extent && extent.spatialReference;

      spatialRef = spatialRef && (
        spatialRef.wkid || JSON.stringify(spatialRef.toJSON())
      );

      return lang.mixin(
        {
          bbox: extent && (
                         extent.xmin + "," + extent.ymin + "," +
                         extent.xmax + "," + extent.ymax
                       ),
          bboxSR: spatialRef,
          imageSR: spatialRef,
          size: width + "," + height
        },
        this._exportImageServiceParameters.toJSON()
      );
    },

    /**
     * Executes the query task defined in [queryTask](#queryTask).
     * 
     * @param   {module:esri/tasks/support/Query} query - The query parameters used in the query task.
     * @return {Promise} When resolved, a {@link module:esri/tasks/support/FeatureSet} containing an array
     *  of graphics is returned.
     *  
     * @example
     * var params = new Query({
     *   //define query parameters here
     * });
     * layer.queryRasters(params).then(function(response){
     *   //The response is a FeatureSet if results are found
     * });
     * 
     * @see [queryTask](#queryTask)
     * @ignore          
     */
    queryRasters: function(query) {
      return this.queryTask.execute(query);
    },

    /**
     * Returns the rasters that are visible in the area defined by the geometry 
     * (required to be point or polygon) in the query parameter. The `options` parameter 
     * is optional and can be used to describe the prefix to be used with the raster 
     * attribute table fields using the 'rasterAttributeTableFieldPrefix' property. 
     * 
     * @param {module:esri/tasks/support/Query} query - The query parameters.
     * @param {Object} options - Options for `query`. Use the `rasterAttributeTableFieldPrefix` 
     *                         property to describe the prefix to be used with the raster 
     *                         attribute table fields.
     * @return {Promise} When resolved, returns the visible rasters that satisfy the query.
     * @ignore                   
     */
    queryVisibleRasters: function(query, options) {
      this._visibleRasters = [];
      var returnCatalogItems = false,
          popupTemplate = this.popupTemplate;

      // if there are fields other than ServicePixelValue field then request for catalog items
      if (popupTemplate && popupTemplate.fieldInfos && popupTemplate.fieldInfos.length > 0) {
        returnCatalogItems = (popupTemplate.fieldInfos.length > 1 || popupTemplate.fieldInfos[0].toLowerCase() !== "raster.servicepixelvalue");
      }
      // if the title has a field other than ServicePixelValue field then request for catalog items
      if (!returnCatalogItems && this.rasterFields) {
        returnCatalogItems = this.rasterFields.some(function(field) {
          var fieldName = (field && field.name) ? field.name.toLowerCase() : null;
          return fieldName &&
                 fieldName !== "raster.servicepixelvalue" &&
                 ((popupTemplate.title && popupTemplate.title.toLowerCase().indexOf(fieldName) > -1) ||
                  (popupTemplate.content && popupTemplate.content.toLowerCase().indexOf(fieldName) > -1));
        });
      }

      var layerView = options.layerView;
      var state = (layerView && layerView.view && layerView.view.state) || null;
      var res = state && state.resolution * 0.5;
      var params = new ImageServiceIdentifyParameters({
        geometry: query.geometry, //accepts Point and Polygon geometries
        returnCatalogItems: returnCatalogItems,
        timeExtent: query.timeExtent,
        mosaicRule: (this.mosaicRule || null),
        renderingRule: (this.renderingRule || null),
        returnGeometry: state && state.spatialReference.equals(this.spatialReference), //return geometry only if layer SR equals view SR
        outSpatialReference: state && state.spatialReference.clone(),
        pixelSize: res && new Point(res, res, state.spatialReference)
      });

      var dfd = new Deferred();
      var identifyTask = new ImageServiceIdentifyTask({
        url: this.url
      });
      identifyTask.execute(params)
        .then(function (response) {
          dfd.resolve(this._queryVisibleRasters(response, options));
        }.bind(this),
        function (error) {
          throw new Error("Error querying for visible rasters");
        });

      return dfd;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _fetchService: function() {
      return promiseUtils.resolve().then(
        function() {
          // return the already provided resourceInfo or fetch them
          return this.resourceInfo || esriRequest({
              url: this.parsedUrl.path,
              content: lang.mixin({ f: "json" }, this.parsedUrl.query),
              handleAs: "json",
              callbackParamName: "callback"
            });
        }.bind(this)
      ).then(
        function(response) {
          // Update URL scheme if the response was obtained via HTTPS
          // See esri/request for context regarding "response._ssl"
          if (response._ssl) {
            delete response._ssl;
            this.url = this.url.replace(/^http:/i, "https:");
          }
          this.read(response);
          this._raster = new Raster(this.url);
        }.bind(this)
      ).then(
        function() {
          if (this.version > 10 && this.hasRasterAttributeTable) {
            return esriRequest({
              url: this.parsedUrl.path + "/rasterAttributeTable",
              content: { f: "json" },
              handleAs: "json"
            }).then(function(response) {
              if (response && response.features && response.fields) {
                this.read({
                  rasterAttributeTable: response
                });
              }
            }.bind(this));
          }
        }
      );
    },

    /**
     * Gets the parameters of the exported image to use when calling the 
     * [export REST operation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Image/02r3000000wm000000/).
     *
     * @param   {module:esri/geometry/Extent} extent - The extent of the exported image
     * @param   {number} width - The width of the exported image
     * @param   {number} height - The height of the exported image
     * @return {Object} The parameters of the exported image. Use this object to call the 
     * [export REST operation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Image/02r3000000wm000000/).
     * @private
     */
    _fetchImage: function(options) {
      if (!esriLang.isDefined(this._raster) || !esriLang.isDefined(options.extent) ||
          !esriLang.isDefined(options.width) || !esriLang.isDefined(options.height)) {
        var dfd = new Deferred();
        dfd.reject(new Error("Insufficient parameters for requesting an image. A valid extent, width and height values are required."));
        return dfd.promise;
      }

      var params = this.getExportImageServiceParameters(options);
      var readOptions = {
        imageServiceParameters: params,
        nBands: Math.min(this.bandCount, 3),
        pixelType: this.pixelType
      };

      return this._raster.read(readOptions, this._fetchImageHandler.bind(this), this._fetchImageErrorHandler.bind(this));
    },

    _fetchImageHandler: function(pixelData) {
      this._rawPixelData = pixelData;
      this._applyFilter(pixelData);
    },

    _fetchImageErrorHandler: function(error) {
      if (error.name === "CancelError") {
        return;
      }
      throw new Error("Error in requesting image. " + error);
      //this.clear();
      //this.onError(error);
    },

    _applyFilter: function(pixelData) {
      var clonedPixelData = this._clonePixelData(pixelData);
      // Apply filter
      if (this.pixelFilter) {
        this.pixelFilter(clonedPixelData);
      }
      this.pixelData = clonedPixelData;
    },

    _clonePixelData: function(orgPixelData) {
      if (orgPixelData === null || orgPixelData === undefined) {
        return orgPixelData;
      }

      var newPixelData = {};
      if (orgPixelData.extent) {
        newPixelData.extent = orgPixelData.extent.clone();
      }

      var orgPixelBlock = orgPixelData.pixelBlock;
      if (orgPixelBlock === null || orgPixelBlock === undefined) {
        return newPixelData;
      }

      newPixelData.pixelBlock = orgPixelBlock.clone();
      return newPixelData;
    },

    _queryVisibleRasters: function(response, options) {
      var pixelValue = response.value;
      var pixelValues, features, i = 0, j = 0, length, oidField = this.objectIdField, objectIds;
      if (response.catalogItems && response.catalogItems.features) { // its the result of an Identify task
        var dataIdx = 0, noDataIdx, idx, noDataValues = 0;
        length = response.catalogItems.features.length;
        features = [length];
        pixelValues = [length];
        objectIds = [length];
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

      var featureSet = [];
      if (!features) {
        return featureSet;
      }

      var returnDomainValues = (options && options.returnDomainValues) || false;

      // get raster attribute table field values
      var ratFieldPrefix = this.rasterAttributeTableFieldPrefix;
      var oid, itemPixelValue, pVal, pVals;

      // create a featureSet understandable by popups
      for (i = 0, length = features.length; i < length; i++) {
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

          this._updateFeatureWithMagDirValues(feature, itemPixelValue);
          this._updateFeatureWithRasterAttributeTableValues(feature, itemPixelValue);
        }

        // handle domain fields here
        if (returnDomainValues) {
          this._updateFeatureWithDomainValues(feature);
        }

        featureSet.push(feature);
      }

      return featureSet;
    },

    _updateFeatureWithRasterAttributeTableValues: function(layerFeature, pixelValue) {
      var features = this.rasterAttributeTable && this.rasterAttributeTable.features;
      if (!features || features.length < 1 || !this.rasterAttributeTableFieldPrefix) {
        return;
      }

      var rFeature = null;
      // get raster attribute table feature that matches the current pixel value
      features.forEach(function(feature) {
        if (feature && feature.attributes) {
          // Do not use === as the type may be different
          rFeature = feature.attributes.hasOwnProperty("Value") && feature.attributes.Value == pixelValue ? feature :
            feature.attributes.VALUE == pixelValue ? feature : null;
        }
      });

      if (!rFeature) {
        // no matching feature exists in the raster attribute table
        return;
      }

      // Append prefix to the RAT's matching feature we just found
      var newAttributes = {}, prop, newProp;
      for (prop in rFeature.attributes) {
        if (rFeature.attributes.hasOwnProperty(prop)) {
          newProp = this.rasterAttributeTableFieldPrefix + prop;
          newAttributes[newProp] = rFeature.attributes[prop];
        }
      }
      layerFeature.attributes = lang.mixin(layerFeature.attributes, rFeature.attributes);
    },

    _updateFeatureWithMagDirValues: function(layerFeature, pixelValue) {
      // Calculate magnitude and direction from Item pixel value
      if (!this.pixelFilter ||
         (this.serviceDataType !== "esriImageServiceDataTypeVector-UV" &&
          this.serviceDataType !== "esriImageServiceDataTypeVector-MagDir")) {
        return;
      }

      var pVals = pixelValue.replace(" ", "").split(",");
      var pixelBlock = new PixelBlock({
        height: 1,
        width: 1,
        pixelType: "F32",
        pixels: [],
        statistics: []
      });

      pVals.forEach(function(pVal) {
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
        extent: new Extent(0, 0, 0, 0, this.spatialReference)
      });

      layerFeature.attributes["Raster.Magnitude"] = pixelBlock.pixels[0][0];
      layerFeature.attributes["Raster.Direction"] = pixelBlock.pixels[1][0];
    },

    _updateFeatureWithDomainValues: function(layerFeature) {
      var domainFields = this.domainFields;
      if (!esriLang.isDefined(domainFields)) {
        return;
      }
      domainFields.forEach(function(field) {
        if (field) {
          var value = layerFeature.attributes[field.name];
          if (esriLang.isDefined(value)) {
            var domainValue = this._findMatchingDomainValue(field.domain, value);
            if (esriLang.isDefined(domainValue)) {
              layerFeature.attributes[field.name] = domainValue;
            }
          }
        }
      }, this);
    },

    _findMatchingDomainValue: function(domain, value) {
      var codedValues = domain && domain.codedValues;
      if (codedValues) {
        var domainName;

        codedValues.some(function(codedValue) {
          if (codedValue.code === value) {
            domainName = codedValue.name;
            return true;
          }
          return false;
        });

        return domainName;
      }
    }

  });

  return ArcGISImageService;
});
