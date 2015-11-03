define([
  "../../core/declare",
  "dojo/_base/array",
  "dojo/Deferred",
  "dojo/promise/all",
  "./LocationProviderBase"
], function(
  declare,
  array,
  Deferred,
  all,
  LocationProviderBase
) {

  var CONCURRENCY = 4;

  function throttle(context, func) {
    // to throttle HTTP requests. If sending to many requests at once there's a chance some will 
    // timeout as a browser also throttle requests. This will also prevent blocking any other
    // requests to the same domain.
    var queue = [],
      pending = 0;

    function shift(dfd) {
      if (pending < CONCURRENCY) {
        var q = queue.shift();
        if (q) {
          go(q.args, q.dfd);
        }
      }
    }

    function push(args) {
      var dfd = new Deferred();
      queue.push({
        args: args,
        dfd: dfd
      });
      shift();
      return dfd.promise;
    }

    function go(args, dfd) {
      pending++;
      var promise = func.apply(context, args);
      promise.always(function() {
        pending--;
        shift();
      });
      promise.then(dfd.resolve, dfd.reject, dfd.progress);
    }

    return function() {
      return push(arguments);
    };
  }

  return declare("esri.tasks.locationproviders.LocationProviderRemoteBase", LocationProviderBase, {

    _fields: null,

    constructor: function() {
      var fieldMapping = this._getFieldMapping && this._getFieldMapping();

      this._fields = [];
      if (fieldMapping) {
        for (var outField in fieldMapping) {
          if (fieldMapping.hasOwnProperty(outField)) {
            this._fields.push({
              inField: fieldMapping[outField],
              outField: outField
            });
          }
        }
      }
    },

    _throttle: function(func) {
      return throttle(this, func);
    },

    _createFeatureLookup: function(features) {
      // groups features by their lookup key, e.g.:
      // {
      //   "California|||Redlands": [feature1, feature2, feature3],
      //   "California|||Riverside": [feature4, feature5]
      // }
      var featureLookup = {};

      for (var i = 0; i < features.length; i++) {
        var feature = features[i],
          key = this._createKey(feature);

        if (key) {
          var arr = featureLookup[key];
          if (!arr) {
            featureLookup[key] = [feature];
          } else {
            arr.push(feature);
          }
        }
      }

      return featureLookup;
    },

    _createKey: function(feature, keyFields) {
      // creates a key (e.g. "California|||Redlands") for a feature to populate a lookup hash and to keep 
      // track of unique lookups
      var arr = [],
        fields = keyFields || array.map(this._fields, function(f) {
          return f.inField;
        });
      for (var i = 0; i < fields.length; i++) {
        var value = feature.attributes[fields[i]];

        if (value !== undefined && value !== null) {
          arr.push(value);
        } else {
          return;
        }
      }

      return arr.join("|||");
    },

    _locate: function(features, options) {
      // called by LocationProvider.locate
      // only features that actually need to be located are passed in (i.e. when options.useExistingGeometries
      // is true any geometry that already has a geometry won't get located)
      var dfd = new Deferred(),
        self = this,
        located = [],
        promises = [],
        batch = [],
        featureLookup = this._createFeatureLookup(features), // create a hash with for each unique combination of lookup values an array of features
        batchLocate = function(batch) {
          // each LP has a different implementation for locating features
          return self._locateBatch(batch, options).then(function(features) {
            if (features) {
              located = located.concat(features);
            }
            dfd.progress(located);
          });
        };

      batchLocate = this._throttle(batchLocate);

      for (var key in featureLookup) {
        if (featureLookup.hasOwnProperty(key)) {
          // create expressions used by the LP implementation, e.g. for LP_QueryTask the expressions will be 
          // pieces of the WHERE clause, for LP_Locator it will be an address
          var featuresWithSameKey = featureLookup[key],
            expression = this._createQueryExpression(featuresWithSameKey[0]);

          if (expression) {
            // an item in the batch contains the unique key (e.g. "California|||Redlands"), the features
            // that have the same key and the expression to be used in the LP's _locateBatch function
            var item = {
              key: key,
              features: featuresWithSameKey,
              expression: expression
            };

            // LP impl will determine when a batch is 'full' (e.g. for LP_Locator the SuggestedBatchSize 
            // of the Geocode service will determine how many addresses can be send in one batch)
            if (this._batchWillOverflow(batch, item)) {
              promises.push(batchLocate(batch));
              batch = [];
            }

            batch.push(item);
          }
        }
      }

      if (batch.length) {
        promises.push(batchLocate(batch));
      }

      all(promises).then(function() {
        dfd.resolve(located);
      });

      return dfd.promise;
    }

    /*
    _getFieldMapping: function() {

    },

    _batchWillOverflow: function(batch, newItem) {
      // override in subclass
      // should return true when batch will exceed it's limit if newItem would've been added
    },

    _locateBatch: function(batch) {
      // locate all items in the batch. Batch structure:
      // [{
      //   key: "California|||Redlands",
      //   features: [f1, f2, f3],
      //   expression: {
      //     Region: "California",
      //     City: "Redlands"
      //   }
      // }, {
      //   key: "California|||Riverside",
      //   features: [f4, f5],
      //   expression: {
      //     Region: "California",
      //     City: "Riverside"
      //   }
      // }]
      // should return a promise that resolves into an array of successfully located features
    }
    */
  });
});
