define([
  'intern!object',
  'intern/chai!assert',
  'dojo/_base/array',
  'dojo/Deferred',
  'dojo/dom-construct',
  '../../Map',
  '../DataAdapterFeatureLayer',
  '../../geometry/Point',
  '../../geometry/Extent'
], function(
  registerSuite,
  assert,
  array,
  Deferred,
  domConstruct,
  Map,
  DataAdapterFeatureLayer,
  Point,
  Extent
) {
  registerSuite({
    name: 'DataAdapterFeatureLayer',

    'create (no async)': function() {
      var tables = {
          TableA: {
            info: {
              idField: 'id',
              fields: [{
                name: 'f1',
                alias: 'Field 1',
                type: 'esriFieldTypeString'
              }, {
                name: 'f2',
                alias: 'Field 2',
                type: 'esriFieldTypeString'
              }, {
                name: 'id',
                alias: 'My ID',
                type: 'esriFieldTypeInteger'
              }]
            },
            records: [{
              attributes: {
                f1: 'abc',
                f2: 'def',
                id: 123
              }
            }]
          }
        },
        dataAdapter = {
          getTableInfo: function(tableId) {
            return tables[tableId].info;
          },
          query: function(query) {
            return {
              features: tables[query.tableId].records
            };
          }
        },
        provider = {
          loaded: true,
          locate: function(features, options) {
            var dfd = new Deferred();

            array.forEach(features, function(feature) {
              feature.geometry = new Point(10, 10);
            });

            dfd.resolve({
              features: features
            });

            return dfd.promise;
          }
        },
        dataAdapterQuery = {
          tableId: 'TableA',
          outFields: ['f1', 'f2']
        };

      var map = new Map(domConstruct.create('div'), {
        extent: new Extent({
          xmin: -20098296,
          ymin: -2804413,
          xmax: 5920428,
          ymax: 15813776,
          spatialReference: {
            wkid: 54032
          }
        })
      });

      var layer = new DataAdapterFeatureLayer(dataAdapter, {
        locationProvider: provider,
        dataAdapterQuery: dataAdapterQuery
      });

      map.addLayer(layer);

      assert.ok(layer.loaded, 'layer is loaded');
      assert.equal(layer.dataAdapterQuery, dataAdapterQuery, 'layer has expected dataAdapterQuery property');
      assert.deepEqual(layer.graphics[0].toJSON(), {
        attributes: {
          f1: 'abc',
          f2: 'def',
          id: 123
        },
        geometry: {
          x: 10,
          y: 10,
          spatialReference: {
            wkid: 4326
          }
        }
      });
    },

    'create (async)': function() {
      var dfd = this.async();

      function async(object) {
        var dfd = new Deferred();
        setTimeout(function() {
          dfd.resolve(object);
        }, 100);
        return dfd.promise;
      }

      var tables = {
          TableA: {
            info: {
              idField: 'id',
              fields: [{
                name: 'f1',
                alias: 'Field 1',
                type: 'esriFieldTypeString'
              }, {
                name: 'f2',
                alias: 'Field 2',
                type: 'esriFieldTypeString'
              }, {
                name: 'id',
                alias: 'My ID',
                type: 'esriFieldTypeInteger'
              }]
            },
            records: [{
              attributes: {
                f1: 'abc',
                f2: 'def',
                id: 123
              }
            }]
          }
        },
        dataAdapter = {
          getTableInfo: function(tableId) {
            return async(tables[tableId].info);
          },
          query: function(query) {
            return async({
              features: tables[query.tableId].records
            });
          }
        },
        provider = {
          loaded: true,
          locate: function(features, options) {
            var dfd = new Deferred();

            setTimeout(function() {
              array.forEach(features, function(feature) {
                feature.geometry = new Point(10, 10);
              });

              dfd.resolve({
                features: features
              });
            }, 100);

            return dfd.promise;
          }
        },
        dataAdapterQuery = {
          tableId: 'TableA',
          outFields: ['f1', 'f2']
        };

      var map = new Map(domConstruct.create('div'), {
        extent: new Extent({
          xmin: -20098296,
          ymin: -2804413,
          xmax: 5920428,
          ymax: 15813776,
          spatialReference: {
            wkid: 54032
          }
        })
      });

      var layer = new DataAdapterFeatureLayer(dataAdapter, {
        locationProvider: provider,
        dataAdapterQuery: dataAdapterQuery
      });

      map.addLayer(layer);

      layer.on('update-end', dfd.callback(function() {
        assert.ok(layer.loaded, 'layer is loaded');
        assert.equal(layer.dataAdapterQuery, dataAdapterQuery, 'layer has expected dataAdapterQuery property');
        assert.deepEqual(layer.graphics[0].toJSON(), {
          attributes: {
            f1: 'abc',
            f2: 'def',
            id: 123
          },
          geometry: {
            x: 10,
            y: 10,
            spatialReference: {
              wkid: 4326
            }
          }
        });
      }), dfd.reject.bind(dfd));
    }
  });
});
