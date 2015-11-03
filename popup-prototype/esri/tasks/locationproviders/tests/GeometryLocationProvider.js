define([
  'intern!object',
  'intern/chai!assert',
  '../../../geometry/Point',
  '../../../graphic',
  '../GeometryLocationProvider',
  '../../../../tests/ags'
], function(registerSuite, assert, Point, Graphic, GeometryLocationProvider) {
  var provider;

  registerSuite({
    name: 'GeometryLocationProvider',

    setup: function(a) {
      provider = new GeometryLocationProvider({
        geometryField: 'shape',
        geometryType: 'esriGeometryPoint'
      });
    },

    'locate (keepExistingGeometry=true)': function() {
      // when keepExistingGeometry is true any features that already have a geometry should be left alone. 
      var dfd = this.async();

      var graphic1 = new Graphic(new Point({
        x: 118.1825,
        y: 34.0547,
        spatialReference: {
          wkid: 4326
        }
      }), null, {
        shape: '{"x":118.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
      });

      provider.locate([graphic1], {
        useExistingGeometries: true
      }).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.equal(result.features[0], graphic1); // should be same object by reference
        assert.deepEqual(result.features[0].toJson(), graphic1.toJson()); // ...but JSON should be same
      }), dfd.reject.bind(dfd));
    },

    'locate (keepExistingGeometry=false)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(new Point({
        x: 118.1825,
        y: 34.0547,
        spatialReference: {
          wkid: 4326
        }
      }), null, {
        shape: '{"x":117.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
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
            shape: '{"x":117.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
          }
        });
      }), dfd.reject.bind(dfd));
    },

    'locate (feature is not instance of Graphic)': function() {
      var dfd = this.async();

      var graphic1 = {
        attributes: {
          shape: '{"x":117.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
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

    'locate (from string)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        shape: '{"x":117.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');

        assert.deepEqual(result.features[0].toJson(), {
          geometry: {
            x: 117.1825,
            y: 34.0547,
            spatialReference: {
              wkid: 4326
            }
          },
          attributes: {
            shape: '{"x":117.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
          }
        });
      }), dfd.reject.bind(dfd));
    },
    'locate (from object)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        shape: {
          x: 117.1825,
          y: 34.0547,
          spatialReference: {
            wkid: 4326
          }
        }
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');

        assert.deepEqual(result.features[0].toJson(), {
          geometry: {
            x: 117.1825,
            y: 34.0547,
            spatialReference: {
              wkid: 4326
            }
          },
          attributes: {
            shape: {
              'x': 117.1825,
              'y': 34.0547,
              'spatialReference': {
                'wkid': 4326
              }
            }
          }
        });
      }), dfd.reject.bind(dfd));
    },

    'locate (feature with invalid json)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        shape: '{"x":,"y":34.0547,"spatialReference":{"wkid":4326}}'
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        assert.equal(result.failed[0], graphic1);
      }), dfd.reject.bind(dfd));
    },

    'locate (replace spatialReference)': function() {
      // The spatialReference should be popualed with the sr of the provider
      // The value of the attribute remains unchanged.
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        shape: '{"x":117.1825,"y":34.0547}'
      });

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');

        assert.deepEqual(result.features[0].toJson(), {
          geometry: {
            x: 117.1825,
            y: 34.0547,
            spatialReference: {
              wkid: 4326
            }
          },
          attributes: {
            shape: '{"x":117.1825,"y":34.0547}'
          }
        });
      }), dfd.reject.bind(dfd));
    },

    'locate (feature null geometryField)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        shape: null
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
      for (var i = 0; i < 100; i++) {
        features.push(new Graphic({
          attributes: {
            shape: '{"x":117.1825,"y":34.0547,"spatialReference":{"wkid":4326}}'
          }
        }));
      }

      var processedBatches = 0;
      provider.locate(features).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 100, 'length of array with successfully located features is 100');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.ok(processedBatches > 0, 'number of processed batches is greate than 0'); // this test could break when run on fast machine
      }), dfd.reject.bind(dfd), function(result) {
        processedBatches++;
      });
    }
  });
});
