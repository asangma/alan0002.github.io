define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "../../request",
  "./LocationProviderRemoteBase"
], function(
  declare,
  lang,
  array,
  esriRequest,
  LocationProviderRemoteBase
) {
  return declare("esri.tasks.locationproviders.LocatorLocationProvider", LocationProviderRemoteBase, {

    locator: null,

    addressFields: null,

    constructor: function() {
      // TODO .. infer this from the locator somehow
      this.geometryType = "esriGeometryPoint";
    },

    _getFieldMapping: function() {
      return this.addressFields;
    },

    _init: function() {
      if (this.locator) {
        var inherited = this.getInherited(arguments);
        return esriRequest({
          url: this.locator.url,
          content: {
            f: "json"
          },
          callbackParamName: "callback"
        }).then(lang.hitch(this, function(response) {
          this._batchSize = response.locatorProperties && response.locatorProperties.SuggestedBatchSize || 1;
          inherited.call(this);
        }));
      }
    },

    _batchWillOverflow: function(batch, item) {
      return batch.length + 1 > this._batchSize;
    },

    _locateBatch: function(batch, options) {
      var self = this,
        addrToLocationCallback = function(candidates) {
          var located = [];

          for (var j = 0; j < candidates.length; j++) {
            var candidate = candidates[j],
              index = self._batchSize === 1 ? 0 : candidate.attributes.ResultID,
              item = batch[index], // not sure if this is true for all geocoders
              features = item && item.features;

            if (features && candidate.score && candidate.location) {
              for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                feature.geometry = candidate.location;
                located.push(feature);
              }
              batch[index] = null;
            }
          }

          return located;
        };

      if (this._batchSize === 1) {
        return this.locator.addressToLocations({
          address: batch[0].expression,
          outFields: "" // We dont care about them
        }).then(addrToLocationCallback);
      } else {
        return this.locator.addressesToLocations({
          addresses: array.map(batch, function(item, index) {
            return lang.mixin(item.expression, {
              // Only used to have an Id for the features w.r.t to the addressesToLocations request.
              // batch unique-ness should suffice
              // matches with candidate.attributes.ResultID [see above]
              OBJECTID: index
            });
          }),
          outFields: "" // We dont care about them
        }).then(addrToLocationCallback);
      }
    },

    _createQueryExpression: function(feature) {
      var address = {};

      for (var i = 0; i < this._fields.length; i++) {
        var field = this._fields[i];
        address[field.outField] = feature.attributes[field.inField];
      }

      return address;
    }
  });
});
