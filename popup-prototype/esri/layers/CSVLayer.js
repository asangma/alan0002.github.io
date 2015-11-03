/**
 * CSVLayer creates a point layer based on a CSV file (.csv, .txt). CSV is a plain-text file
 * format used to represent tabular data, including geographic point features (latitude,
 * longitude).
 *
 * @module esri/layers/CSVLayer
 * @since 4.0
 */
define([
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",
  "../portal/csv",
  "./FeatureLayer",
  "../geometry/Extent",
  "../tasks/support/FeatureSet"
], function(array, declare, lang, csv, FeatureLayer, Extent, FeatureSet) {

  /**
   * @extends module:esri/layers/FeatureLayer
   * @constructor module:esri/layers/CSVLayer
   * @param {Object} properties - See individual properties below.
   */
  var CSVLayer = declare(FeatureLayer,
  /** @lends module:esri/layers/CSVLayer.prototype */
  {
    declaredClass: "esri.layers.CSVLayer",

    // prevent the FeatureLayer's constructor from calling _initFeatureLayer
    _preventInit: true,

    _fieldTypeMap: {
      Date: "esriFieldTypeDate",
      Number: "esriFieldTypeDouble",
      String: "esriFieldTypeString"
    },

    /**
     * options properties:
     *
     * columnDelimiter
     * latitudeFieldName
     * longitudeFieldName
     * fields: { name, alias, type }[]
     * outFields: String[]
     * copyright
     * @private
     */

    constructor: function(/*String*/ url, /*Object?*/ options) {
      this.url = url;

      options = lang.mixin({}, options);
      this.columnDelimiter = options.columnDelimiter;
      this.latitudeFieldName = options.latitudeFieldName;
      this.longitudeFieldName = options.longitudeFieldName;

      var layerDef = options.layerDefinition; // esri/arcgis/utils.createMap
      if (!layerDef) {
        layerDef = {
          fields: options.fields || [],
          geometryType: "esriGeometryPoint",
          copyrightText: options.copyright
        };
        if (options.fields) {
          // convert field.type and set field.alias if missing
          array.forEach(options.fields, function(field) {
            var type = field.type || "String";
            field.type = this._fieldTypeMap[type];
            if (!field.alias) {
              field.alias = field.name;
            }
          }, this);
        }
      }

      // set _buildCsvFcParam for csv.buildCSVFeatureCollection()
      this._buildCsvFcParam = {
        url: this.url,
        columnDelimiter: this.columnDelimiter,
        layerDefinition: layerDef,
        outFields: options.outFields
      };
      if (this.latitudeFieldName && this.longitudeFieldName) {
        this._buildCsvFcParam.locationInfo = {
          locationType: "coordinates",
          latitudeFieldName: this.latitudeFieldName,
          longitudeFieldName: this.longitudeFieldName
        };
      }

      this._projectFeatures = lang.hitch(this, this._projectFeatures);
      this._addFeatures = lang.hitch(this, this._addFeatures);

      this._initCSVLayer(options);
    },

    // override
    refresh: function() {
      this._fireUpdateStart();
      this.applyEdits(null, null, this.graphics); // remove existing features
      this._loadFeatures();
    },

    // extend
    _setMap: function(map) {
      var retVal = this.inherited(arguments);
      this._fireUpdateStart();
      this._projectFeatures(this._csvFC)
          .then(this._addFeatures)
          .otherwise(this._errorHandler);
      this._csvFC = null;
      return retVal;
    },

    _initCSVLayer: function(options) {
      var _this = this;
      csv.buildCSVFeatureCollection(this._buildCsvFcParam)
          .then(function(featureCollection) {
            _this._csvFC = featureCollection; // save for _setMap
            var layerDef = featureCollection.layerDefinition;
            layerDef.extent = _this._getFCExtent(featureCollection);
            if (!options.outFields) {
              options.outFields = ["*"];
            }
            _this._initFeatureLayer({ layerDefinition: layerDef }, options);
          })
          .otherwise(this._errorHandler);
    },

    _loadFeatures: function() {
      csv.buildCSVFeatureCollection(this._buildCsvFcParam)
          .then(this._projectFeatures)
          .then(this._addFeatures)
          .otherwise(this._errorHandler);
    },

    _projectFeatures: function(featureCollection) {
      return csv.projectFeatureCollection(featureCollection, this._map.spatialReference);
    },

    _addFeatures: function(featureCollection) {
      var fs = new FeatureSet(featureCollection.featureSet);
      this.applyEdits(fs.features, null, null);
      this._fireUpdateEnd();
    },

    _getFCExtent: function(featureCollection) {
      var extent;
      if (featureCollection &&
          featureCollection.featureSet &&
          featureCollection.featureSet.features) {
        var features = featureCollection.featureSet.features;
        var numFeatures = features.length;
        if (numFeatures > 1) {
          var pt = features[0].geometry;
          extent = new Extent(pt.x, pt.y, pt.x, pt.y);
          for (var i = numFeatures - 1; i > 0; i--) {
            pt = features[i].geometry;
            extent.xmin = Math.min(extent.xmin, pt.x);
            extent.ymin = Math.min(extent.ymin, pt.y);
            extent.xmax = Math.max(extent.xmax, pt.x);
            extent.ymax = Math.max(extent.ymax, pt.y);
          }
          if (extent.getWidth() <= 0 && extent.getHeight() <= 0) {
            extent = null;
          }
        }
      }
      return extent;
    }
  });

  

  return CSVLayer;
});
