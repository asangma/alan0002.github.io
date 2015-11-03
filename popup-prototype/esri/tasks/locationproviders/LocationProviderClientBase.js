define([
  "../../core/declare",
  "dojo/Deferred",
  "dojo/promise/all",
  "./LocationProviderBase",
  "../../geometry/SpatialReference"
], function(
  declare,
  Deferred,
  all,
  LocationProviderBase,
  SpatialReference
) {

  var CHUNK_MAX_TIME = 100;
  var CHUNK_WAIT_TIME = 25;

  return declare("esri.tasks.locationproviders.LocationProviderClientBase", LocationProviderBase, {

    inSpatialReference: null,

    constructor: function(options) {
      if (!this.inSpatialReference) {
        this.inSpatialReference = SpatialReference.WGS84;
      }
    },

    _locate: function(features, options) {
      var projections = [],
        succeeded = [],
        dfd = new Deferred(),
        self = this,
        i = 0;

      function locate() {
        setTimeout(function() {
          // process the array with features in chunks limiting the time spend in the loop, this will prevent the 'A script running on this page is taking a loooong time to do its job' warning.
          var k = +new Date() + CHUNK_MAX_TIME,
            batch = [];

          while (k > +new Date() && i < features.length) {
            var feature = features[i],
              geometry = self.getGeometry(feature);

            feature.geometry = geometry;

            if (geometry) {
              batch.push(feature);
            }

            ++i;
          }

          if (options.outSpatialReference) {
            projections.push(self._project(batch, options.outSpatialReference).then(function() {
              succeeded = succeeded.concat(batch);
              dfd.progress(batch);
            }));
          } else {
            succeeded = succeeded.concat(batch);
            dfd.progress(batch);
          }

          if (i < features.length) {
            locate();
          } else {
            all(projections).then(function() {
              dfd.resolve(succeeded);
            });
          }
        }, CHUNK_WAIT_TIME);
      }

      locate();

      return dfd.promise;
    }
  });
});
