define([
  "intern!object",
  "intern/chai!assert",

  "../../../../../../dojo/_base/lang",

  "esri/layers/graphics/controllers/StreamController",
  "esri/geometry/Extent",
  "esri/geometry/Point"
], function(
  registerSuite, assert,
  lang,
  StreamController, Extent, Point
) {

  registerSuite({

    //main suite
    name: "esri/layers/graphics/controllers/StreamController",

    //----------------------------------------------------
    //
    // Tests for constructor options and internal methods
    //
    //----------------------------------------------------
    "constructor tests": {
      "default constructor": function() {
        var controller = new StreamController();
        assert.deepEqual(controller._filter, {
          geometry: null,
          where: null
        }, "_filter property with null geometry property and null where property should get created by default");
      }
    },

    "filter changed tests": {
      setup: function(){
        this.graphicsSource = {
          makeFilter: function (filter) {
            if(filter.hasOwnProperty("geometryDefinition")){
              filter.geometry = filter.geometryDefinition;
              delete filter.geometryDefinition;
            }
            if(filter.hasOwnProperty("definitionExpression")){
              filter.where = filter.definitionExpression;
              delete filter.definitionExpression;
            }
            return filter;
          }
        };

        this.geometry1 = new Extent({
          xmin: -10,
          ymin: -10,
          xmax: 10,
          ymax: 10
        });

        this.geometry2 = new Extent({
          xmin: -20,
          ymin: -20,
          xmax: 20,
          ymax: 20
        });

        this.filter1 = "Field1 = '2'";
        this.filter2 = "Field2 = '2'";
      },

      beforeEach: function(){
        this.controller = new StreamController();
        this.controller.graphicsSource = this.graphicsSource;
      },

      afterEach: function(){
        this.controller = null;
      },

      "null filter": function(){
        var changed = this.parent.controller._filterChanged(null);
        assert.equal(changed, false, "a null filter should be equal to a filter with all properties set to null");
      },

      "null geometries": {
        "null controller filter geometry": function(){
          var filter = {
            geometryDefinition: this.parent.parent.geometry1
          };
          var changed = this.parent.parent.controller._filterChanged(filter);
          assert.equal(changed, true, "a null controller filter geometry should not be equal to a non null test filter geometry");
        },

        "null test filter geometry": function(){
          this.parent.parent.controller._filter = {
            geometry: this.parent.parent.geometry1
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: null
          });
          assert.equal(changed, true, "a non null filter geometry should not be equal to a null test filter geometry")
        }
      },

      "geometries the same": {
        "only geometry properties set": function(){
          this.parent.parent.controller._filter = {
            geometry: this.parent.parent.geometry1
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: this.parent.parent.geometry1
          });
          assert.equal(changed, false, "filter with same geometry as controller should not register as changed");
        },

        "where properties are same": function(){
          this.parent.parent.controller._filter = {
            geometry: this.parent.parent.geometry1,
            where: this.parent.parent.filter1
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: this.parent.parent.geometry1,
            definitionExpression: this.parent.parent.filter1
          });
          assert.equal(changed, false, "filters with same geometry and same where should not register as changed");
        },

        "where properties are different": function(){
          this.parent.parent.controller._filter = {
            geometry: this.parent.parent.geometry1,
            where: this.parent.parent.filter1
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: this.parent.parent.geometry1,
            definitionExpression: this.parent.parent.filter2
          });
          assert.equal(changed, true, "filters with same geometry and different where should register as changed");
        },

        "null geometries": function(){
          this.parent.parent.controller._filter = {
            geometry: null
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: null
          });
          assert.equal(changed, false, "filters with null geometries should not register as changed");
        }
      },

      "geometries different": {
        "only geometries": function(){
          this.parent.parent.controller._filter = {
            geometry: this.parent.parent.geometry1
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: this.parent.parent.geometry2
          });
          assert.equal(changed, true, "filters with different geometry should register as changed");
        },

        "geometries and where": function(){
          this.parent.parent.controller._filter = {
            geometry: this.parent.parent.geometry1,
            where: this.parent.parent.filter1
          };
          var changed = this.parent.parent.controller._filterChanged({
            geometryDefinition: this.parent.parent.geometry2,
            definitionExpression: this.parent.parent.filter1
          });
          assert.equal(changed, true, "filters with different geometry and same where should register as changed");
        }
      }
    },

    "filter valid tests": {
      setup: function(){
        this.graphicsSource = {
          makeFilter: function (filter) {
            if(filter.hasOwnProperty("geometryDefinition")){
              filter.geometry = filter.geometryDefinition;
              delete filter.geometryDefinition;
            }
            if(filter.hasOwnProperty("definitionExpression")){
              filter.where = filter.definitionExpression;
              delete filter.definitionExpression;
            }
            return filter;
          }
        };
      },

      beforeEach: function(){
        this.controller = new StreamController();
        this.controller.graphicsSource = this.graphicsSource;
      },

      afterEach: function(){
        this.controller = null;
      },

      "geometries": {
        "valid geometry": function(){
          var filter = {
            geometryDefinition: new Extent({
              xmin: -10,
              ymin: -10,
              xmax: 10,
              ymax: 10
            })
          };

          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, true, "filter with an Extent geometry should be valid");
        },

        "invalid type of geometry": function(){
          var filter = {
            geometryDefinition: new Point({
              x: 10,
              y: 10
            })
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, false, "filter with a Point geometry should not be valid");
        },

        "non geometry for geometry": function(){
          var filter = {
            geometryDefinition: "b"
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, false, "filter with a geometry property set to a string should not be valid");
        },

        "null geometry": function(){
          var filter = {
            geometryDefinition: null
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, true, "filter with a null geometry property should be valid");
        }
      },

      "where clauses": {
        "null where clause": function(){
          var filter = {
            definitionExpression: null
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, true, "filter with a null where clause property should be valid");
        },

        "valid where clause": function(){
          var filter = {
            definitionExpression: "1=1"
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, true, "filter with a string where property should be valid");
        },

        "invalid where clause type": function(){
          var filter = {
            definitionExpression: 100
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, false, "filter with a numeric where property should not be valid");
        }
      },

      "where clause and geometry combos": {
        "valid geometry and where": function(){
          var filter = {
            geometryDefinition: new Extent({
              xmin: -10,
              ymin: -10,
              xmax: 10,
              ymax: 10
            }),
            definitionExpression: "1=1"
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, true, "filter with valid geometry and where property should be valid");
        },

        "valid geometry and invalid where": function(){
          var filter = {
            geometryDefinition: new Extent({
              xmin: -10,
              ymin: -10,
              xmax: 10,
              ymax: 10
            }),
            definitionExpression: {}
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, false, "filter with valid geometry and invalid where property should not be valid");
        },

        "invalid geometry and valid where": function(){
          var filter = {
            geometryDefinition: new Point({
              x: 10,
              y: 10
            }),
            definitionExpression: "1=1"
          };
          var valid = this.parent.parent.controller._filterValid(filter);
          assert.equal(valid, false, "filter with invalid geometry and valid where property should not be valid");
        }
      }
    },

    "handleFilterMessage tests": {
      setup: function(){
        this.graphicsSource = {
          makeFilter: function (filter) {
            if(filter.hasOwnProperty("geometryDefinition")){
              filter.geometry = filter.geometryDefinition;
              delete filter.geometryDefinition;
            }
            if(filter.hasOwnProperty("definitionExpression")){
              filter.where = filter.definitionExpression;
              delete filter.definitionExpression;
            }
            return filter;
          }
        };

        this.geometry1 = {
          xmin: -10,
          ymin: -10,
          xmax: 10,
          ymax: 10,
          spatialReference: {
            wkid: 4326
          }
        };

        this.geometry2 = {
          xmin: -1,
          ymin: -1,
          xmax: 1,
          ymax: 1,
          spatialReference: {
            wkid: 4326
          }
        };
      },

      beforeEach: function(){
        this.controller = new StreamController();
        this.controller.graphicsSource = this.graphicsSource;
      },

      afterEach: function(){
        this.controller = null;
      },

      "messages with geometry tests": {
        "geometry as string": function(){
          this.parent.parent.controller._filter = {
            geometry: new Extent(this.parent.parent.geometry1)
          };
          var strGeom = JSON.stringify(this.parent.parent.geometry2);
          var filter = {
            geometry: strGeom
          };
          this.parent.parent.controller._handleFilterMessage({
            filter: filter
          });
          assert.deepEqual(this.parent.parent.controller.geometryDefinition.toJson(), this.parent.parent.geometry2);
        },

        "geometry as object": function(){
          this.parent.parent.controller._filter = {
            geometry: new Extent(this.parent.parent.geometry1)
          };
          var geom = this.parent.parent.geometry2;
          var filter = {
            geometry: geom
          };
          this.parent.parent.controller._handleFilterMessage({
            filter: filter
          });
          assert.deepEqual(this.parent.parent.controller.geometryDefinition.toJson(), filter.geometry);
        }
      },

      "message with where test": function(){
        this.parent.controller._filter = {
          where: "a = b"
        }
        var filter = {
          where: "1=1"
        };
        this.parent.controller._handleFilterMessage({
          filter: filter
        });
        assert.equal(this.parent.controller.definitionExpression, filter.where);
      }
    }
  });
});
