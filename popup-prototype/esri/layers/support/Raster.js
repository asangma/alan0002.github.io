define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/Deferred",
  "dojo/_base/array",
  "dojo/_base/config",
  "dojo/sniff",

  "../../core/Evented",
  "../../request",
  "../../geometry/Extent",
  "../../geometry/SpatialReference",
  "../../core/deferredUtils",

  "./PixelBlock",
  "./LercCodec"
],
function (
  declare, lang, Deferred, array, dojoConfig, has,
  esriEvented, esriRequest, Extent, SpatialReference, dfdUtils,
  PixelBlock, LercCodec
 ) {

  var Raster = declare(esriEvented, {
    declaredClass: "esri.layers.Raster",
    imageServiceUrl: null,
    validPixelTypes: ["U1", "U2", "U4", "U8", "U16", "U32", "S8", "S16", "S32", "F32"],
    validFormats: ["lerc"],

    _eventMap: {
      "raster-read-complete": ["pixelData", "params"]
    },

    constructor: function (isUrl) {
      if (!isUrl) {
        throw ("Image Service URL is not defined");
      }

      this.imageServiceUrl = isUrl;
    },

    /*****************
     * Public Methods
     *****************/
    read: function (options, callback, errback) {
      var _this = this,
          dfd = new Deferred(dfdUtils._dfdCanceller);

      if (has("ie") < 10) {
        throw ("This browser is not supported.");
      }

      if (!options.imageServiceParameters || !options.nBands) {
        throw "Insufficient parameters to read data";
      }

      var params = lang.clone(options.imageServiceParameters), nBands = options.nBands, pixelType = options.pixelType;
      if (!array.some(this.validPixelTypes, function (x) { return (x === pixelType); })) {
        params.pixelType = "F32";
      }

      if (!array.some(this.validFormats, function (x) { return (x.toLowerCase() === params.format.toLowerCase()); })) {
        params.format = "lerc";
      }

      this._prepareGetImageParameters(params);

      dfd._pendingDfd = esriRequest({
        url: this.imageServiceUrl + "/exportImage",
        handleAs: "arraybuffer",
        content: lang.mixin(params, { f: "image" }),
        load: function (encodedData) {
          if (params.format.toUpperCase() === "LERC") {
            var decodedPixelBlock = Raster._lercDecode(encodedData, {
              width: params.width,
              height: params.height,
              planes: nBands,
              pixelType: pixelType,
              noDataValue: params.noData
            });
            var pixelData = {
              pixelBlock: decodedPixelBlock,
              extent: params.extent
            };

            _this._resolve([pixelData, params], "onRasterReadComplete", callback, dfd);
          }
          else {
            var err = new Error("Format '" + params.format + "' is not supported.");
            err.log = dojoConfig.isDebug;
            _this._resolve([err], null, errback, dfd, true);
          }
        },
        error: function (err) {
          _this._resolve([err], null, errback, dfd, true);
        }
      });

      return dfd.promise;
    },

    /*********
     * Events
     *********/

    onRasterReadComplete: function () { },

    /*******************
     * Internal Methods
     *******************/

    _prepareGetImageParameters: function (params) {
      // Either give size and bbox or width,height and extent...
      if (params.size && params.bbox) {
        var dimensions = params.size.split(",");
        params.width = parseFloat(dimensions[0]);
        params.height = parseFloat(dimensions[1]);
        if (!params.extent) {
          var bbox = params.bbox.split(",");
          params.extent = new Extent(parseFloat(bbox[0]), parseFloat(bbox[1]), parseFloat(bbox[2]), parseFloat(bbox[3]), new SpatialReference(params.bboxSR));
        }
        return;
      }

      if (!params.width || Math.floor(params.width) !== params.width ||
        !params.height || Math.floor(params.height) !== params.height) {
        throw "Incorrect Image Dimensions";
      }
      if (!params.extent || params.extent.declaredClass !== "esri.geometry.Extent") {
        throw "Incorrect extent";
      }
        
      var extent = params.extent;
      var sr = extent.spatialReference.wkid || JSON.stringify(extent.spatialReference.toJSON());
      delete params._ts;

      lang.mixin(
        params,
        {
          bbox: extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax,
          imageSR: sr,
          bboxSR: sr,
          size: params.width + "," + params.height
        },
        params.disableClientCaching ? { _ts: new Date().getTime() } : {}
      );

    },

    _adjustExtent: function (extent, height, width) {
      var extentHeight = extent.ymax - extent.ymin, extentWidth = extent.xmax - extent.xmin;
      if (width >= height) {
        extentHeight = extentWidth * height / width;
        extent.ymax = extent.ymin + extentHeight;
      } else {
        extentWidth = extentHeight * width / height;
        extent.xmax = extent.xmin + extentWidth;
      }
      return extent;
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

  var pixelDataType = null, noDataValue = null;

  Raster._lercDecode = function (encodedData, params) {
    if (!params.planes || Math.floor(params.planes) !== params.planes) {
      throw ('Number of Bands not specified.');
    }
    if (!params.height || Math.floor(params.height) !== params.height) {
      throw ('Height not provided.');
    }
    if (!params.width || Math.floor(params.width) !== params.width) {
      throw ('Width not provided.');
    }

    noDataValue = params.noDataValue;
    params.pixelType = getpixelTypeAndNoData(params.pixelType);
    var iPlane = 0, encodedMaskData, inputOffset = 0, decodedPixelBlock, eof = encodedData.byteLength-10;
    while (inputOffset < eof) {
      var result = LercCodec.decode(encodedData, {
        inputOffset: inputOffset,
        encodedMaskData: encodedMaskData,
        returnMask: iPlane === 0 ? true : false,
        returnEncodedMask: iPlane === 0 ? true : false,
        returnFileInfo: true,
        pixelType: pixelDataType,
        noDataValue: noDataValue
      });

      inputOffset = result.fileInfo.eofOffset;
      if (iPlane === 0) {
        encodedMaskData = result.encodedMaskData;
        decodedPixelBlock = new PixelBlock({
          width: params.width,
          height: params.height,
          pixels: [],
          pixelType: params.pixelType,
          mask: result.maskData,
          statistics: []
        });
      }
      iPlane++;
      if (!verifyResult(result, params)) {
        throw "The decoded image dimensions are incorrect";
      }
      decodedPixelBlock.addData({
        pixels: result.pixelData,
        statistics: {
          minValue: result.minValue,
          maxValue: result.maxValue,
          noDataValue: result.noDataValue
        }
      });
    }
    return decodedPixelBlock;
  };

  var getpixelTypeAndNoData = function (pixelType) {
    if (pixelType === 'U1' ||
        pixelType === 'U2' ||
        pixelType === 'U4' ||
        pixelType === 'U8') {
      pixelType = 'U8';
      noDataValue = Math.pow(2, 8) - 1;
      pixelDataType = Uint8Array;
      return pixelType;
    }
    else if (pixelType === 'U16') {
      noDataValue = noDataValue || Math.pow(2, 16) - 1;
      pixelDataType = Uint16Array;
      return pixelType;
    }
    else if (pixelType === 'U32') {
      noDataValue = noDataValue || Math.pow(2, 32) - 1;
      pixelDataType = Uint32Array;
      return pixelType;
    }
    else if (pixelType === 'S8') {
      noDataValue = noDataValue || 0 - Math.pow(2, 7);
      pixelDataType = Int8Array;
      return pixelType;
    }
    else if (pixelType === 'S16') {
      noDataValue = noDataValue || 0 - Math.pow(2, 15);
      pixelDataType = Int16Array;
      return pixelType;
    }
    else if (pixelType === 'S32') {
      noDataValue = noDataValue || 0 - Math.pow(2, 31);
      pixelDataType = Int32Array;
      return pixelType;
    }
    else {
      //noDataValue = 0 - Math.pow(2, 31);
      pixelDataType = Float32Array;
      return pixelType;
    }
  };

  var verifyResult = function (result, params) {
    return (result.height !== params.height || result.width !== params.width) ? false : true;
  };

  return Raster;
});
