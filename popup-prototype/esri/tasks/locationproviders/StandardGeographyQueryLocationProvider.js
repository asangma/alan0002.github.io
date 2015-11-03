define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/string",
  "../../core/lang",
  "../../geometry/support/jsonUtils",
  "./LocationProviderRemoteBase"
], function(
  declare,
  lang,
  array,
  string,
  esriLang,
  geometryJsonUtils,
  LocationProviderRemoteBase
) {

  var BATCH_LIMIT = 100; // no known hard limit

  return declare("esri.tasks.locationproviders.StandardGeographyQueryLocationProvider", LocationProviderRemoteBase, {
    standardGeographyQueryTask: null,
    queryParameters: null,
    geographyQueryTemplate: null,
    geometryType: "esriGeometryPolygon",

    constructor: function() {
      if (!this.queryParameters) {
        this.queryParameters = {};
      }

      if (this.queryParameters.returnCentroids) {
        this.geometryType = "esriGeometryPoint";
      }
    },

    _batchWillOverflow: function(batch, item) {
      return batch.length + 1 > BATCH_LIMIT;
    },

    _locateBatch: function(batch) {
      var batchGeographyQuery = lang.mixin({}, this.queryParameters, {
        geographyQueries: array.map(batch, function(item, index) {
          var expr = item.expression;
          expr.OBJECTID = index;
          return expr;
        })
      });

      if (!esriLang.isDefined(batchGeographyQuery.generalizationLevel)) {
        batchGeographyQuery.generalizationLevel = 6;
      }

      batchGeographyQuery.returnGeometry = this.queryParameters.returnGeometry === false ? false : true;

      return this.standardGeographyQueryTask.execute(batchGeographyQuery).then(function(result) {
        var features = [];
        for (var j = 0; j < result.featureSet.features.length; j++) {
          var feature = result.featureSet.features[j];

          if (feature) {
            for (var k = 0; k < batch.length; k++) {
              var query = batch[k];
              if (query.expression.OBJECTID == feature.attributes.ResultID) {
                for (var i = 0; i < query.features.length; i++) {
                  var f = query.features[i];
                  if (feature.geometry) {
                    f.geometry = geometryJsonUtils.fromJson(feature.geometry);
                    features.push(f);
                  }
                }
                break;
              }
            }
          }
        }

        return features;
      });
    },

    _createKey: function(feature, keyFields) {
      return string.substitute(this.geographyQueryTemplate, feature.attributes);
    },

    _createQueryExpression: function(feature) {
      var query = string.substitute(this.geographyQueryTemplate, feature.attributes);

      return {
        QUERY: query
      };
    }
  });
});
