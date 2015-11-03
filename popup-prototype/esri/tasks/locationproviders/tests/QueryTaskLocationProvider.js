define([
  'intern!object',
  'intern/chai!assert',
  'dojo/_base/array',
  'dojo/Deferred',
  '../../../graphic',
  '../QueryTaskLocationProvider',
  '../../QueryTask',
  '../../../../tests/ags'
], function(registerSuite, assert, array, Deferred, Graphic, QueryTaskLocationProvider, QueryTask) {
  var provider;

  registerSuite({
    name: 'QueryTaskLocationProvider',

    setup: function(a) {
      var dfd = new Deferred();

      provider = new QueryTaskLocationProvider({
        whereFields: {
          NAME: 'f1',
          STATE_NAME: 'f2'
        },
        queryTask: new QueryTask('//sampleserver5.arcgisonline.com/arcgis/rest/services/Census/MapServer/2'),
        queryParameters: {
          where: 'POP2000>35000',
          outFields: ['POP2000'],
          returnGeometry: false
        },
        maxWhereLength: 100
      });

      provider.on('load', dfd.resolve);

      return dfd.promise;
    },

    'locate (multiple)': function() {
      var dfd = this.async();

      var graphic1 = new Graphic(null, null, {
        f1: 'Alameda',
        f2: 'California'
      });

      var graphic2 = new Graphic(null, null, {
        f1: 'Alpine',
        f2: 'California'
      });

      var graphic3 = new Graphic(null, null, {
        f1: 'Amador',
        f2: 'California'
      });

      var result1 = new Graphic(null, null, {
        f1: 'Alameda',
        f2: 'California',
        POP2000: 1443741
      });

      var result2 = new Graphic(null, null, {
        f1: 'Amador',
        f2: 'California',
        POP2000: 35100
      });

      var processedBatches = 0;
      provider.locate([graphic1, graphic2, graphic3]).then(dfd.callback(function(result) {
        assert.lengthOf(result.features, 2, 'length of array with successfully located features is 2');
        assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');
        assert.ok(array.some(result.features, function(f) {
          try {
            assert.deepEqual(f.toJson(), result1.toJson());
            return true;
          } catch (ex) {}
        }));
        assert.ok(array.some(result.features, function(f) {
          try {
            assert.deepEqual(f.toJson(), result2.toJson());
            return true;
          } catch (ex) {}
        }));
        assert.equal(processedBatches, 3, 'number of processed batches is 3');
      }), dfd.reject.bind(dfd), function(result) {
        processedBatches++;
      });
    },

    'locate unicode data (unicode=false)': function(a) {
      var dfd = this.async();

      var provider = new QueryTaskLocationProvider({
        unicode: false,
        whereFields: {
          '都道府県': 'f1',
          '郡': 'f2'
        },
        queryTask: new QueryTask('//services.arcgis.com/wlVTGRSYTzAbjjiC/arcgis/rest/services/Japan_Locators/FeatureServer/1')
      });

      provider.on('load', function() {
        var graphic1 = new Graphic(null, null, {
          f1: '福島県',
          f2: '東白川郡'
        });

        provider.locate([graphic1]).then(dfd.callback(function(result) {
          assert.lengthOf(result.features, 0, 'length of array with successfully located features is 0');
          assert.lengthOf(result.failed, 1, 'length of array with unsuccessfully located features is 1');

        }), dfd.reject.bind(dfd));
      });
    },

    'locate unicode data (unicode=true)': function(a) {
      var dfd = this.async();

      var provider = new QueryTaskLocationProvider({
        unicode: true,
        whereFields: {
          '都道府県': 'f1',
          '郡': 'f2'
        },
        queryTask: new QueryTask('//services.arcgis.com/wlVTGRSYTzAbjjiC/arcgis/rest/services/Japan_Locators/FeatureServer/1')
      });

      provider.on('load', function() {
        var graphic1 = new Graphic(null, null, {
          f1: '福島県',
          f2: '東白川郡'
        });

        provider.locate([graphic1]).then(dfd.callback(function(result) {
          assert.lengthOf(result.features, 1, 'length of array with successfully located features is 1');
          assert.lengthOf(result.failed, 0, 'length of array with unsuccessfully located features is 0');

        }), dfd.reject.bind(dfd));
      });
    }
  });
});
