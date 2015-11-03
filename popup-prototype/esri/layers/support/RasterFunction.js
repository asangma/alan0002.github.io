/**
 * Specifies processing to be done to the image service. 
 * [Click here](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Raster_Function_Objects/02r3000000rv000000/) 
 * to view a full list of available raster funtions in the REST API documentation along 
 * with their valid [functionArguments](#functionArguments). 
 * 
 * Chaining raster functions is accomplished by setting the Raster argument in the 
 * [functionArguments](#functionArguments) property to another defined raster function. 
 * See example below on chaining a Remap raster function with a Colormap.
 * 
 * ```js
 * var remapRF = new RasterFunction();
 * remapRF.functionName = "Remap";  
 * remapRF.functionArguments = {  
 *   "InputRanges" : [-3,10,11,37], //remap pixels with values -3 to 10 to now have value of 1 
 *   "OutputValues" : [1,2],        //remap pixel values from 11 to 37 to have a value of 2
 *   "Raster" : "$$"  //apply Remap to the image service  
 * };
 * remapRF.outputPixelType = "U8";  
 * 
 * var colorRF = new RasterFunction();
 * colorRF.functionName = "Colormap";  
 * colorRF.functionArguments = { 
 *   "Colormap" : [  
 *     [1, 255, 0, 0],  //all pixels with value of 1 symbolized with red
 *     [2, 0, 255, 0]   //all pixels with value of 2 symbolized with green
 *   ],  
 * "Raster" : remapRF  //apply Colormap to output raster from the remap rasterFunction
 * };
 * 
 * imageLayer.renderingRule = colorRF; //set rendering rule to final raster function
 * ```
 * 
 * @module esri/layers/support/RasterFunction
 * @since 4.0
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../core/lang"
],
function (
  declare, lang,
  esriLang
) {

  /**
  * @constructor module:esri/layers/support/RasterFunction
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */      
  var RasterFunction = declare(null, 
  /** @lends module:esri/layers/support/RasterFunction.prototype */                             
  {
    declaredClass: "esri.layers.support.RasterFunction",

    /**
    * The raster function name.
    * [Click here](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Raster_Function_Objects/02r3000000rv000000/) 
    * to view a list of function names and their arguments.
    * 
    * @type {string}
    * @example
    * rasterFunction.functionArguments = {
    *   "Azimuth":215.0,
    *   "Altitude":75.0,
    *   "ZFactor":0.3
    * };
    */  
    functionName: null,
    "arguments": null,  // To be deprecated
      
    /**
    * The arguments for the raster function. The structure depends on the function specified.
    * [Click here](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Raster_Function_Objects/02r3000000rv000000/) 
    * for a list of functions and their arguments.
    * 
    * @type {Object}
    * @example
    * rasterFunction.functionArguments = {
    *   "Azimuth":215.0,
    *   "Altitude":75.0,
    *   "ZFactor":0.3
    * };
    */
    "functionArguments": null,
      
    /**
    * The variable name for the raster function.
    * 
    * @type {Object}
    * @example
    * rasterFunction.variableName = "DEM";
    */  
    variableName: null,
      
    /**
    * Defines the pixel type of the output image.
    * 
    * **Known values:** C128 | C64 | F32 | F64 | S16 | S32 | S8 | U1 | U16 
    * | U2 | U32 | U4 | U8 | UNKNOWN
    * 
    * @type {string}
    * @default UNKNOWN            
    *            
    * @example
    * rasterFunction.functionArguments = {
    *   "Azimuth":215.0,
    *   "Altitude":75.0,
    *   "ZFactor":0.3
    * };
    */  
    outputPixelType: null,

    constructor: function (/*Object*/ rFunction) {
      if (!lang.isObject(rFunction)) {
        return;
      }
      var i = 0, args;

      this.functionName = rFunction.rasterFunction;
      this.functionArguments = lang.clone(rFunction.rasterFunctionArguments || rFunction["arguments"]);

      lang.mixin(this, rFunction);

      args = this.functionArguments;

      if (args) {
        args.Raster = this._toRasterFunction(args.Raster);
        args.Raster2 = this._toRasterFunction(args.Raster2);
        args.DEM = this._toRasterFunction(args.DEM);
        args.FillRaster = this._toRasterFunction(args.FillRaster);
        if (args.Rasters && args.Rasters.length) {
          for (i = 0; i < args.Rasters.length; i++) {
            args.Rasters[i] = this._toRasterFunction(args.Rasters[i]);
          }
        }
      }
    },

    _toRasterFunction: function (rJson) {
      if (rJson && (rJson.rasterFunction || rJson.functionName)) {
        return new RasterFunction(rJson);
      }
      return rJson;
    },

    _rfToJson: function (rf) {
      if (rf && rf.declaredClass === "esri.layers.support.RasterFunction") {
        rf = rf.toJSON();
      }
      return rf;
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    /**
     * Converts an instance of this class to its ArcGIS Server JSON representation. 
     * 
     * @return {Object} The ArcGIS Server JSON representation of an instance of this class.
     */  
    toJSON: function() {
      var args = lang.clone(this.functionArguments || this["arguments"]);

      if (args) {
        args.Raster = this._rfToJson(args.Raster);
        args.Raster2 = this._rfToJson(args.Raster2);
        args.DEM = this._rfToJson(args.DEM);
        args.FillRaster = this._rfToJson(args.FillRaster);
        if (args.Rasters && args.Rasters.length) {
          var i, rastersJsonArray = [];
          for (i = 0; i < args.Rasters.length; i++) {
            rastersJsonArray.push(this._rfToJson(args.Rasters[i]));
          }
          args.Rasters = rastersJsonArray;
        }
      }

      var json = {
        rasterFunction: this.functionName,
        rasterFunctionArguments: args,
        variableName: this.variableName,
        outputPixelType: this.outputPixelType ? this.outputPixelType : null
      };

      return esriLang.filter(json, function (value) {
        if (value !== null && value !== undefined) {
          return true;
        }
      });
    }
  });

  return RasterFunction;
});
