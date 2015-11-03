/**
 * Specifies the mosaic rule when defining how individual images should be mosaicked. 
 * It specifies selection, mosaic method, sort order, overlapping pixel resolution, etc. 
 * Mosaic rules are for mosaicking rasters in the mosaic dataset. A mosaic rule is used to define: 
 * 
 * * The selection of rasters that will participate in the mosaic (using where clause).
 * * The mosaic method, e.g. how the selected rasters are ordered.
 * * The mosaic operation, e.g. how overlapping pixels at the same location are resolved.
 * 
 * @module esri/layers/support/MosaicRule
 * @since 4.0
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "../../core/lang",
  "../../geometry/Point"
],
function (
  declare, lang,
  esriLang, Point
) {

  /**
  * @constructor module:esri/layers/support/MosaicRule
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                            that may be passed into the constructor.
  */      
  var MosaicRule = declare(null, 
  /** @lends module:esri/layers/support/MosaicRule.prototype */                         
  {
    declaredClass: "esri.layers.support.MosaicRule",

    /**
    * The mosaic method determines how the selected rasters are ordered. 
    * 
    * **Known Values:** esriMosaicNone | esriMosaicCenter | esriMosaicNadir | esriMosaicViewpoint 
    * | esriMosaicAttribute | esriMosaicLockRaster | esriMosaicNorthwest | esriMosaicSeamline
    * 
    * @type {string}
    * @example
    * var mr = new MosaicRule();
    * mr.method = "esriMosaicLockRaster";
    */  
    method: null,
      
    /**
    * The where clause determines which rasters will participate in the mosaic. 
    * This property applies to all mosaic methods.
    * 
    * @type {string}
    */  
    where: null,
      
    /**
    * The name of the attribute field that is used with a constant sortValue to define the mosaicking 
    * order when the mosaic [method](#method) is set to `esriMosaicAttribute`. The ordering is defined
    * by the absolute value of the difference between the specified sort field value and the sort base
    * value. For example, if the sort field is `Month` and the sort value is `7 (July)`, then the ordering
    * is defined by `ABS(Month -7)`.
    * 
    * @type {string}
    */  
    sortField: null,
      
    /**
    * A constant value defining a reference or base value for the sort field when the mosaic [method](#method)
    * is set to `esriMosaicAttribute`.
    * 
    * @type {string}
    */   
    sortValue: null,
      
    /**
    * Indicates whether the sort should be ascending. This property applies to all mosaic 
    * [methods](#method) where an ordering is defined except `esriMosaicSeamline`.
    * 
    * @type {boolean}
    * @default false            
    */
    ascending: false,
      
    /**
    * An array of raster Ids. All the rasters with the given list of raster Ids are 
    * selected to participate in the mosaic. The rasters will be visible at all pixel 
    * sizes regardless of the minimum and maximum pixel size range of the locked rasters.
    * 
    * @type {number[]}
    * @example
    * var mr = new MosaicRule();
    * mr.method = "esriMosaicLockRaster";
    * mr.lockRasterIds = [32,454,14];
    */  
    lockRasterIds: null,
      
    /**
    * Defines the viewpoint location on which the ordering is defined based on the 
    * distance from the viewpoint and the nadir of rasters.
    * 
    * @type {string}
    * @example
    * var mr = new MosaicRule();
    * mr.method = "esriMosaicViewpoint";
    * mr.viewpoint = inPoint;
    * layer.mosaicRule = mr;
    */  
    viewpoint: null,
      
    /**
    * Defines a selection using a set of ObjectIDs. This property applies to all mosaic methods.
    * 
    * @type {number[]}
    */  
    objectIds: null,

    /**
    * Defines the mosaic operation used to resolve overlapping pixels.
    * 
    * **Known Values:** MT_FIRST | MT_LAST | MT_MIN | MT_MAX | MT_MEAN | MT_BLEND
    * 
    * @type {string}
    */  
    operation: null,
    
    /**
    * A multiple dimensional service can have multiple variables and multiple dimensions. 
    * Multiple dimensional definitions are usually used to filter data.
    * 
    * @type {module:esri/layers/support/DimensionalDefinition[]}
    * @example
    * var mr = new MosaicRule();
    * mr.multidimensionalDefinition = [];
    * mr.multidimensionalDefinition.push(new DimensionalDefinition({
    *   variableName: "Salinity",
    *   dimensionName: "StdTime",
    *   values: [1259625600000]
    * }));
    */ 
    multidimensionalDefinition: [],

    constructor: function (/*Object*/ mosaicRule) {
      if (!lang.isObject(mosaicRule)) {
        return;
      }

      lang.mixin(this, mosaicRule);

      if (mosaicRule.mosaicMethod) {
        this.method = mosaicRule.mosaicMethod;
      }

      if (this.method && this.method.toLowerCase().substring(0, 4) !== "esri") {  // serviceinfo returns method without esri in the beginning...
        this.method = this._getMethodEnum(this.method);
      }

      if (mosaicRule.mosaicOperation) {
        this.operation = mosaicRule.mosaicOperation;
      }

      if (this.operation && this.operation.toUpperCase().substring(0, 3) !== "MT_") {   // serviceinfo returns operation without MT in the beginning...
        this.operation = this._getOperatorEnum(this.operation);
      }

      if (mosaicRule.fids) {
        this.objectIds = mosaicRule.fids;
      }

      if (mosaicRule.viewpoint) {
        this.viewpoint = new Point(mosaicRule.viewpoint);
      }
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
     * Returns a serialized JSON object representation of the mosaic rule in the format
     * of the ArcGIS Platform.
     * 
     * @return {Object} A JSON representation of an instance of this class in the format of 
     *                  the ArcGIS platform.
     */
    toJSON: function() {

      var dimDefs = null, nDefinitions = this.multidimensionalDefinition ? this.multidimensionalDefinition.length : 0;
      if (nDefinitions) {
        dimDefs = [];
        for (var i = 0; i < nDefinitions; i++) {
          dimDefs.push(this.multidimensionalDefinition[i].declaredClass === "esri.layers.support.DimensionalDefinition"
            ? this.multidimensionalDefinition[i].toJSON()
            : this.multidimensionalDefinition[i]);
        }
      }

      var json = {
        mosaicMethod: this.method,
        where: this.where,
        sortField: this.sortField,
        sortValue: this.sortValue,
        ascending: this.ascending,
        lockRasterIds: this.lockRasterIds,
        viewpoint: this.viewpoint ? this.viewpoint.toJSON() : null,
        fids: this.objectIds,
        mosaicOperation: this.operation,
        multidimensionalDefinition: dimDefs
      };

      return esriLang.filter(json, function (value) {
        if (value !== null) {
          return true;
        }
      });
    },

    _getMethodEnum: function (mosaicMethod) {
      if (!mosaicMethod) {
        return;
      }

      var methodEnum = MosaicRule.METHOD_NONE;
      switch (mosaicMethod.toLowerCase()) {
        case "byattribute":
          methodEnum = MosaicRule.METHOD_ATTRIBUTE;
          break;
        case "center":
          methodEnum = MosaicRule.METHOD_CENTER;
          break;
        case "lockraster":
          methodEnum = MosaicRule.METHOD_LOCKRASTER;
          break;
        case "nadir":
          methodEnum = MosaicRule.METHOD_NADIR;
          break;
        case "northwest":
          methodEnum = MosaicRule.METHOD_NORTHWEST;
          break;
        case "seamline":
          methodEnum = MosaicRule.METHOD_SEAMLINE;
          break;
        case "viewpoint":
          methodEnum = MosaicRule.METHOD_VIEWPOINT;
          break;
      }

      return methodEnum;
    },

    _getOperatorEnum: function (mosaicOperator) {
      if (!mosaicOperator) {
        return;
      }

      switch (mosaicOperator.toLowerCase()) {
        case "first":
          return MosaicRule.OPERATION_FIRST;
        case "last":
          return MosaicRule.OPERATION_LAST;
        case "max":
          return MosaicRule.OPERATION_MAX;
        case "min":
          return MosaicRule.OPERATION_MIN;
        case "blend":
          return MosaicRule.OPERATION_BLEND;
        case "mean":
          return MosaicRule.OPERATION_MEAN;
      }
    }
  });

  lang.mixin(MosaicRule, {
    METHOD_NONE: "esriMosaicNone",
    METHOD_CENTER: "esriMosaicCenter",
    METHOD_NADIR: "esriMosaicNadir",
    METHOD_VIEWPOINT: "esriMosaicViewpoint",
    METHOD_ATTRIBUTE: "esriMosaicAttribute",
    METHOD_LOCKRASTER: "esriMosaicLockRaster",
    METHOD_NORTHWEST: "esriMosaicNorthwest",
    METHOD_SEAMLINE: "esriMosaicSeamline",
    OPERATION_FIRST: "MT_FIRST",
    OPERATION_LAST: "MT_LAST",
    OPERATION_MIN: "MT_MIN",
    OPERATION_MAX: "MT_MAX",
    OPERATION_MEAN: "MT_MEAN",
    OPERATION_BLEND: "MT_BLEND"
  });
  
  return MosaicRule;
});
