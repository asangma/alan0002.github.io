define([
  'intern!object',
  'intern/chai!assert',
  'dojo/Deferred',
  '../../../geometry/Point',
  '../../../graphic',
  '../../../tasks/locator',
  '../LocatorLocationProvider',
  '../../../../tests/ags'
], function(registerSuite, assert, Deferred, Point, Graphic, Locator, LocatorLocationProvider) {
  var provider;

  registerSuite({
    name: 'LocatorLocationProvider',

    setup: function(a) {
      var dfd = new Deferred();

      var locator = new Locator('//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer');
      locator.countryCode = 'CA';
      provider = new LocatorLocationProvider({
        locator: locator,
        addressFields: {
          Region: 'STATE',
          City: 'MUNICIPATLITY'
        }
      });
      provider.on('load', dfd.resolve);

      return dfd.promise;
    },

    'locate': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        MUNICIPATLITY: 'Buffalo',
        STATE: 'New York'
      });

      var opts = {
        useExistingGeometries: false
      };

      provider.locate([graphic1], opts).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.deepEqual(result.features[0].toJson(), {
          'geometry': {
            'x': -78.87845675099965,
            'y': 42.88544307300049,
            'spatialReference': {
              'wkid': 4326,
              'latestWkid': 4326
            }
          },
          'attributes': {
            'MUNICIPATLITY': 'Buffalo',
            'STATE': 'New York'
          }
        });
      }), dfd.reject.bind(dfd));
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
        MUNICIPATLITY: 'Buffalo',
        STATE: 'New York'
      });

      var opts = {
        useExistingGeometries: true
      };

      provider.locate([graphic1], opts).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.deepEqual(result.features[0].toJson(), {
          'geometry': {
            x: 118.1825,
            y: 34.0547,
            'spatialReference': {
              'wkid': 4326
            }
          },
          'attributes': {
            'MUNICIPATLITY': 'Buffalo',
            'STATE': 'New York'
          }
        });
      }), dfd.reject.bind(dfd));
    },

    'locate (invalid attributes)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        MUNICIPATLITY: 'ASDASDASD',
        STATE: 'PRUSPDASD'
      });

      var opts = {
        useExistingGeometries: true
      };

      provider.locate([graphic1], opts).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');
      }), dfd.reject.bind(dfd));
    },

    'locate (null features)': function() {
      var dfd = this.async();

      provider.locate([null]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');
      }), dfd.reject.bind(dfd));
    },

    'locate (feature is not instance of Graphic)': function() {
      var dfd = this.async();

      var graphic1 = {
        attributes: {
          MUNICIPATLITY: 'Buffalo',
          STATE: 'New York'
        }
      };

      provider.locate([graphic1]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');
      }), dfd.reject.bind(dfd));
    },

    'locate (batching)': function() {
      var dfd = this.async();

      var features = [];

      // 200 should produce 2 request for 3 progress calls
      for (var i = 0; i < 200; i++) {
        features.push(new Graphic({
          attributes: {
            MUNICIPATLITY: 'Buffalo',
            STATE: 'New York'
          }
        }));
      }

      var processedBatches = 0;

      provider.locate(features).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 200, 'length of array with successfully located features is 200');
        assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
        assert.ok(processedBatches > 0, 'number of processed batches is greater than 0'); // this test could break when run on fast machine
      }), dfd.reject.bind(dfd), function(result) {
        processedBatches++;
      });
    },

    'locate pre 10.1': function() {
      var dfd = this.async();

      var locator = new Locator('//tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Address_NA/GeocodeServer');
      provider = new LocatorLocationProvider({
        locator: locator,
        addressFields: {
          City: 'f1',
          State: 'f2'
        }
      });
      provider.on('load', function() {
        var graphic1 = new Graphic(null, null, {
          f1: 'Redlands',
          f2: 'California',
          id: 1
        });

        var graphic2 = new Graphic(null, null, {
          f1: 'Riverside',
          f2: 'California',
          id: 2
        });

        provider.locate([graphic1, graphic2]).then(dfd.callback(function(result) {
          assert.lengthOf(result.features, 2, 'length of array with successfully located features is 2');
          assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');
          assert.ok(result.features[0].geometry);
          assert.ok(result.features[1].geometry);
        }), dfd.reject.bind(dfd));
      });
    }
  });
});
