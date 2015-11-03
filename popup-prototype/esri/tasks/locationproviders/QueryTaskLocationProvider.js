define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "../support/Query",
  "../../request",
  "../../geometry/SpatialReference",
  "./LocationProviderRemoteBase"
], function(
  declare,
  lang,
  array,
  Query,
  esriRequest,
  SpatialReference,
  LocationProviderRemoteBase
) {

  /* Notes:
   *  -problem when a query returns more than maxRecordCount features (not very likely but theoretically still possible)
   *  -when queryParameters.outFields contains a field with the same name as a field in the input features then the value
   *   in the input feature will be overwritten. maybe check for it? or make this the user's problem?
   */

  return declare("esri.tasks.locationproviders.QueryTaskLocationProvider", LocationProviderRemoteBase, {
    queryTask: null,
    queryParameters: null,
    whereFields: null,
    unicode: false,
    maxWhereLength: 2000,

    constructor: function() {
      if (!this.queryParameters) {
        this.queryParameters = {};
      }
    },

    _getFieldMapping: function() {
      return this.whereFields;
    },

    _init: function() {
      if (this.queryTask && this.queryTask.url) {
        var inherited = this.getInherited(arguments);

        esriRequest({
          url: this.queryTask.url,
          callbackParamName: "callback",
          content: {
            f: "json"
          }
        }).then(lang.hitch(this, function(response) {
          this.geometryType = response.geometryType;
          inherited.call(this);
        }));
      }
    },

    _batchWillOverflow: function(batch, item) {
      var expressions = array.map(batch, function(item) {
        return item.expression;
      }).concat(item.expression);

      var extraLength = this.queryParameters.where ? this.queryParameters.where.length + 7 : 0; // +7 because ' AND ()'

      if (expressions.join(" OR ").length + extraLength > this.maxWhereLength) {
        return true;
      }
    },

    _locateBatch: function(batch, options) {
      var where = array.map(batch, function(item) {
          return item.expression;
        }).join(" OR "),
        outFields = array.map(this._fields, function(f) {
          return f.outField;
        }),
        queryOutFields = this.queryParameters.outFields ? outFields.concat(array.filter(this.queryParameters.outFields, function(field) {
          return array.indexOf(outFields, field) === -1;
        })) : outFields,
        callback = lang.hitch(this, function(response) {
          if (response && response.features) {
            if (response.exceededTransferLimit) {
              // TODO: now what?
              console.warn("exceededTransferLimit");
            }

            return this._merge(batch, response.features, outFields);
          }
        });

      var q = new Query();
      q.where = this.queryParameters.where ? this.queryParameters.where + " AND (" + where + ")" : where;
      q.outFields = queryOutFields;
      q.outSpatialReference = options.outSpatialReference || SpatialReference.WGS84;
      q.geometry = this.queryParameters.geometry;
      q.returnGeometry = this.queryParameters.returnGeometry === false ? false : true;
      q.maxAllowableOffset = this.queryParameters.maxAllowableOffset;

      return this.queryTask.execute(q).then(callback);
    },

    _merge: function(batch, queryResultFeatures, outFields) {
      // for each feature in queryResultFeatures find the matching feature in featureLookup (which contains all features passed in to provider.locate)
      // and copy geometry and optionally attributes from fields defined in this.queryParameters.outFields

      var located = [];

      for (var i = 0; i < batch.length; i++) {
        var item = batch[i];

        for (var j = 0; j < queryResultFeatures.length; j++) {
          var remoteFeature = queryResultFeatures[j],
            key = this._createKey(remoteFeature, outFields);

          if (item.key === key) {
            for (var k = 0; k < item.features.length; k++) {
              var localFeature = item.features[k],
                geometry = remoteFeature.geometry;

              if (geometry) {
                localFeature.geometry = geometry;
              }
              array.forEach(this.queryParameters.outFields, function(field) {
                localFeature.attributes[field] = remoteFeature.attributes[field];
              });
              located.push(localFeature);
            }
            break;
          }
        }
      }
      return located;
    },

    _createQueryExpression: function(feature) {
      // creates a string like "FIPS=1234" or "(STATE='California' AND CITY='Redlands)"
      // if prefixWithN is true each value is prefixed with N (e.g. "STATE=N'California'"). This is required by some
      // databases (SQL Server) when querying unicode data
      var arr = [];
      for (var i = 0; i < this._fields.length; i++) {
        var field = this._fields[i],
          value = feature.attributes[field.inField];

        if (value !== undefined && value !== null) {
          arr.push(field.outField + (this.unicode ? "=N'" : "='") + this._escape(value) + "'");
        } else {
          return;
        }
      }

      if (arr.length > 1) {
        return "(" + arr.join(" AND ") + ")";
      }
      return arr[0];
    },

    _escape: function(str) {
      // escape single quotes in a string, e.g. "'s-Gravenhage" -> "''s-Gravenhage"
      // used in creating WHERE clause (e.g. "CITY='''s-Gravenhage'")
      if (typeof str === "string") {
        return str.replace(/'/g, "''");
      }
      return str;
    }
  });
});
