define([
  "intern!tdd",
  "intern/chai!assert",
  "test-utils/assertFloat",

  "esri/geometry/Point",
  "esri/geometry/Polyline",
  "esri/geometry/SpatialReference"
], function(tdd, assert, assertFloat, Point, Polyline, SpatialReference) {
  tdd.suite("esri/geometry/Polyline", function() {
    tdd.test("value constructor", function() {
      var poly = new Polyline([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("value multi-path constructor", function() {
      var poly = new Polyline([
        [
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]
      ]);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("value multi-path with spatial reference constructor", function() {
      var sr = SpatialReference.WebMercator;
      var poly = new Polyline([
        [
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]
      ], sr);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);

      assert.ok(poly.get("spatialReference").equals(sr));
    });

    tdd.test("value multi-path with value spatial reference constructor", function() {
      var sr = { wkid: 102100 };
      var poly = new Polyline([
        [
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]
      ], sr);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);

      assert.ok(poly.get("spatialReference").equals(new SpatialReference(sr)));
    });

    tdd.test("empty with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var poly = new Polyline(sr);

      assert.equal(poly.paths.length, 0);

      assert.notOk(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assert.ok(poly.get("spatialReference").equals(sr));
    });

    tdd.test("empty with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var poly = new Polyline(sr);

      assert.equal(poly.paths.length, 0);

      assert.notOk(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assert.ok(poly.get("spatialReference").equals(new SpatialReference(sr)));
    });

    tdd.test("object constructor", function() {
      var poly = new Polyline({
        paths: [
          [
            [0.2,  0.4, 0.6],
            [0.8,  0.4, 0.6],
            [0.8, -0.3, 2.0],
            [0.2, -0.3, 2.0],
            [0.2,  0.4, 0.6]
          ]
        ]
      });

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("object constructor with spatial reference", function() {
      var sr = SpatialReference.WebMercator;

      var poly = new Polyline({
        paths: [
          [
            [0.2,  0.4, 0.6],
            [0.8,  0.4, 0.6],
            [0.8, -0.3, 2.0],
            [0.2, -0.3, 2.0],
            [0.2,  0.4, 0.6]
          ]
        ],
        spatialReference: sr
      });

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);

      assert.ok(poly.get("spatialReference"), sr);
    });

    tdd.test("object constructor with spatial reference only", function() {
      var sr = SpatialReference.WebMercator;

      var poly = new Polyline({
        spatialReference: sr.wkid
      });

      assert.equal(sr.wkid, poly.spatialReference.wkid);
    });

    tdd.test("addPath", function() {
      var poly = new Polyline();

      poly.addPath([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("addPath point", function() {
      var poly = new Polyline();

      poly.addPath([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("getPoint", function() {
      var poly = new Polyline([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assertFloat.assert(poly.getPoint(0, 0).toArray(), [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.getPoint(0, 1).toArray(), [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.getPoint(0, 2).toArray(), [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.getPoint(0, 3).toArray(), [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.getPoint(0, 4).toArray(), [0.2,  0.4, 0.6]);
    });

    tdd.test("setPoint", function() {
      var poly = new Polyline([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      poly.setPoint(0, 0, [0.3, 0.4, 0.6]);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assertFloat.assert(poly.paths[0][0], [0.3,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("setPoint point", function() {
      var poly = new Polyline([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      poly.setPoint(0, 0, new Point([0.3, 0.4, 0.6]));

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assertFloat.assert(poly.paths[0][0], [0.3,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("removePoint", function() {
      var poly = new Polyline([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      poly.removePoint(0, 1);

      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 4);

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][2], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2,  0.4, 0.6]);
    });

    tdd.test("extent", function() {
      var poly = new Polyline([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      var extent = poly.get("extent");

      assertFloat.assert(extent.xmin,  0.2);
      assertFloat.assert(extent.ymin, -0.3);
      assertFloat.assert(extent.zmin,  0.6);

      assertFloat.assert(extent.xmax,  0.8);
      assertFloat.assert(extent.ymax,  0.4);
      assertFloat.assert(extent.zmax,  2.0);
    });

    tdd.test("toJSON", function() {
      var sr = SpatialReference.WebMercator;
      
      var poly = new Polyline([
        [0.2,  0.4, 2.0],
        [0.8,  0.4, 2.0],
        [0.8, -0.3, 0.6],
        [0.2, -0.3, 0.6],
        [0.2,  0.4, 2.0]
      ], sr);

      assert.deepEqual(poly.toJSON(), {
        paths: [[
          [0.2,  0.4, 2.0],
          [0.8,  0.4, 2.0],
          [0.8, -0.3, 0.6],
          [0.2, -0.3, 0.6],
          [0.2,  0.4, 2.0]
        ]],
        spatialReference: {
          wkid: 102100
        },
        hasZ: true
      });
    });

    tdd.test("toJSON 2D", function() {
      var sr = SpatialReference.WebMercator;
      
      var poly = new Polyline([
        [0.2,  0.4],
        [0.8,  0.4],
        [0.8, -0.3],
        [0.2, -0.3],
        [0.2,  0.4]
      ], sr);

      assert.deepEqual(poly.toJSON(), {
        paths: [[
          [0.2,  0.4],
          [0.8,  0.4],
          [0.8, -0.3],
          [0.2, -0.3],
          [0.2,  0.4]
        ]],
        spatialReference: {
          wkid: 102100
        }
      });
    });

    tdd.test("fromJSON", function() {
      var sr = SpatialReference.WebMercator;

      var poly = Polyline.fromJSON({
        paths: [[
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]],
        spatialReference: {
          wkid: 102100
        },
        hasZ: true
      });
      
      assert.equal(poly.paths.length, 1);
      assert.equal(poly.paths[0].length, 5);

      assert.ok(poly.get("hasZ"));
      assert.notOk(poly.get("hasM"));

      assertFloat.assert(poly.paths[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.paths[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.paths[0][4], [0.2,  0.4, 0.6]);

      assert.ok(sr.equals(poly.spatialReference));
    });

    tdd.test("fromJSON without spatial reference", function() {
      var poly = Polyline.fromJSON({
        paths: [[
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]]
      });

      assert.ok(poly.get("spatialReference").equals(SpatialReference.WGS84));
    });
  });
});
