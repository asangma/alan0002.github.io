define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/when",
  "./FeatureLayer",
  "../renderers/SimpleRenderer",
  "../symbols/SimpleFillSymbol",
  "../symbols/SimpleMarkerSymbol",
  "../symbols/SimpleLineSymbol"
], function(
  declare,
  lang,
  array,
  when,
  FeatureLayer,
  SimpleRenderer,
  SimpleFillSymbol,
  SimpleMarkerSymbol,
  SimpleLineSymbol
) {

  return declare("esri.layers.DataAdapterFeatureLayer", FeatureLayer, {
    locationProvider: null,

    dataAdapter: null,

    dataAdapterQuery: null,

    _preventInit: true,

    constructor: function(dataAdapter, options) {
      this.dataAdapterQuery = options && options.dataAdapterQuery;
      this.locationProvider = options && options.locationProvider;
      this.dataAdapter = dataAdapter;

      if (this.dataAdapter && this.locationProvider && this.dataAdapterQuery) {
        var init = lang.hitch(this, this._init, options);
        if (this.locationProvider.loaded) {
          this._queryDataAdapter().then(init);
        } else {
          this.locationProvider.on("load", lang.hitch(this, function() {
            this._queryDataAdapter().then(init);
          }));
        }
      }
    },

    _queryDataAdapter: function() {
      // TODO: some checks:
      //      - all dataAdapterQuery.outFields are actually present in the table
      //      - idField exists
      var self = this;

      function done(tableInfo, recordSet) {
        return {
          idField: tableInfo.idField,
          fields: array.filter(tableInfo.fields, function(field) {
            return array.indexOf(self.dataAdapterQuery.outFields, field.name) !== -1 || field.name === tableInfo.idField;
          }),
          recordSet: recordSet
        };
      }

      function doQuery(tableInfo) {
        return when(self.dataAdapter.query(self.dataAdapterQuery)).then(lang.partial(done, tableInfo));
      }

      return when(this.dataAdapter.getTableInfo(this.dataAdapterQuery.tableId)).then(doQuery);
    },

    _init: function(options, queryResult) {
      var defaultSymbol;
      switch (this.locationProvider.geometryType) {
        case "esriGeometryPoint":
        case "esriGeometryMultipoint":
          defaultSymbol = new SimpleMarkerSymbol();
          break;
        case "esriGeometryPolyline":
          defaultSymbol = new SimpleLineSymbol();
          break;
        case "esriGeometryPolygon":
          defaultSymbol = new SimpleFillSymbol();
          break;
      }

      var fc = {
        layerDefinition: {
          geometryType: this.locationProvider.geometryType,
          objectIdField: queryResult.idField,
          fields: queryResult.fields,
          drawingInfo: {
            renderer: new SimpleRenderer(defaultSymbol).toJSON() // when initializing a FL with a FC the FC needs to have a renderer
          }
        },
        featureSet: {
          features: queryResult.recordSet.features
        }
      };

      this.on("load", lang.hitch(this, this._locateFeatures));

      this._initFeatureLayer(fc, options);
    },

    _locateFeatures: function() {
      var self = this,
        map = this.getMap(),
        locate = function() {
          self.updating = true;
          self.locationProvider.locate(self.graphics, {
            outSpatialReference: map.spatialReference
          }).then(function() {
            self._fireUpdateEnd();
          });
        };

      if (map && !this._located) {
        this._located = true;

        if (this.locationProvider.loaded) {
          locate();
        } else {
          this.locationProvider.on("load", locate);
        }
      }
    },

    _setMap: function() {
      var div = this.inherited(arguments);

      this._locateFeatures();

      return div;
    }

  });
});
