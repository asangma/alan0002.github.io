define([
  'intern!object',
  'intern/chai!assert',
  'dojo/Deferred',
  '../../../geometry/Point',
  '../../../graphic',
  '../../../geometry/SpatialReference',
  '../CoordinatesLocationProvider',
  '../../../../tests/ags'
], function(registerSuite, assert, Deferred, Point, Graphic, SpatialReference, CoordinatesLocationProvider) {
  var provider;

  registerSuite({
    name: 'CoordinatesLocationProvider',

    setup: function(a) {
      var dfd = new Deferred();

      provider = new CoordinatesLocationProvider({
        xField: 'lon',
        yField: 'lat'
      });

      provider.on('load', dfd.resolve);

      return dfd.promise;
    },

    'locate (useExistingGeometries=true)': function() {
      // when useExistingGeometries is true any features that already have a geometry should be left alone. 
      var dfd = this.async();

      var graphic1 = new Graphic(new Point({
        x: 118.1825,
        y: 34.0547,
        spatialReference: {
          wkid: 4326
        }
      }), null, {
        lat: 34.0547,
        lon: 117.1825
      });

      provider.locate([graphic1], {
        useExistingGeometries: true
      }).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.equal(result.features[0], graphic1); // should be same object by reference
        assert.deepEqual(result.features[0].toJson(), graphic1.toJson());
      }), dfd.reject.bind(dfd));
    },

    'locate (useExistingGeometries=true, projection)': function() {
      // when useExistingGeometries is true any features that already have a geometry should be left alone. 
      var dfd = this.async();

      var graphic1 = new Graphic(new Point({
        x: 155000,
        y: 465000,
        spatialReference: {
          wkid: 28992
        }
      }), null, {
        lat: 34.0547,
        lon: 117.1825
      });

      var result1 = {
        attributes: {
          lat: 34.0547,
          lon: 117.1825
        },
        geometry: {
          x: 5.38763888888889,
          y: 52.1741384899798,
          spatialReference: {
            wkid: 4326
          }
        }
      };

      provider.locate([graphic1], {
        useExistingGeometries: true,
        outSpatialReference: SpatialReference.WGS84
      }).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.deepEqual(result.features[0].toJson(), result1);
      }), dfd.reject.bind(dfd));
    },

    'locate (useExistingGeometries=false)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(new Point({
        x: 118.1825,
        y: 34.0547,
        spatialReference: {
          wkid: 4326
        }
      }), null, {
        lat: 34.0547,
        lon: 117.1825
      });

      provider.locate([graphic1], {
        useExistingGeometries: false
      }).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.equal(result.features[0], graphic1); // should be same object by reference
        assert.deepEqual(result.features[0].toJson(), {
          geometry: {
            x: 117.1825,
            y: 34.0547,
            spatialReference: {
              wkid: 4326
            }
          },
          attributes: {
            lat: 34.0547,
            lon: 117.1825
          }
        });
      }), dfd.reject.bind(dfd));
    },

    'locate (feature is not instance of Graphic)': function() {
      var dfd = this.async();

      var graphic1 = {
        attributes: {
          lat: 34.0547,
          lon: 117.1825
        }
      };

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.equal(result.failed[0], graphic1);
      }), dfd.reject.bind(dfd));
    },

    'locate (null feature)': function() {
      var dfd = this.async();

      provider.locate([null]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.isNull(result.failed[0]);
      }), dfd.reject.bind(dfd));
    },

    'locate (feature with bad coordinates, malformed string)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        lat: 'a34.0547',
        lon: 117.1825
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.equal(result.failed[0], graphic1);
      }), dfd.reject.bind(dfd));
    },

    'locate (feature with bad coordinates, empty string)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        lat: '',
        lon: 117.1825
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.equal(result.failed[0], graphic1);
      }), dfd.reject.bind(dfd));
    },

    'locate (feature with bad coordinates, null value)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        lat: null,
        lon: 117.1825
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.equal(result.failed[0], graphic1);
      }), dfd.reject.bind(dfd));
    },

    'locate (feature with bad coordinates, undefined value)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        lon: 117.1825
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.equal(result.failed[0], graphic1);
      }), dfd.reject.bind(dfd));
    },

    'locate (batching)': function() {
      var dfd = this.async();

      var features = [];
      for (var i = 0; i < 10000; i++) {
        features.push(new Graphic({
          attributes: {
            lat: 34.0547,
            lon: 117.1825
          }
        }));
      }

      var processedBatches = 0;

      provider.locate(features).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 10000, 'length of array with successfully located features is 10000');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.ok(processedBatches > 0, 'number of processed batches is greater than 0'); // this test could break when run on fast machine
      }), dfd.reject.bind(dfd), function(result) {
        processedBatches++;
      });
    }
  });
});
