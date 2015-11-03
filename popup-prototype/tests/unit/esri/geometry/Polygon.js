define([
  "intern!tdd",
  "intern/chai!assert",
  "test-utils/assertFloat",

  "esri/geometry/Point",
  "esri/geometry/Extent",
  "esri/geometry/Polygon",
  "esri/geometry/SpatialReference"
], function(tdd, assert, assertFloat, Point, Extent, Polygon, SpatialReference) {

  tdd.suite("esri/geometry/Polygon", function() {
    tdd.test("value constructor", function() {
      var poly = new Polygon([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("value multi-ring constructor", function() {
      var poly = new Polygon([
        [
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]
      ]);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("value multi-ring constructor with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var poly = new Polygon([
        [
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]
      ], sr);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
      assert.ok(poly.spatialReference.equals(sr));
    });

    tdd.test("value multi-ring constructor with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var poly = new Polygon([
        [
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]
      ], sr);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
      assert.ok(poly.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("empty with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var poly = new Polygon(sr);

      assert.equal(poly.rings.length, 0);

      assert.notOk(poly.hasZ);
      assert.notOk(poly.hasM);

      assert.ok(poly.spatialReference.equals(sr));
    });

    tdd.test("empty with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var poly = new Polygon(sr);

      assert.equal(poly.rings.length, 0);

      assert.notOk(poly.hasZ);
      assert.notOk(poly.hasM);

      assert.ok(poly.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("object constructor", function() {
      var poly = new Polygon({
        rings: [
          [
            [0.2,  0.4, 0.6],
            [0.8,  0.4, 0.6],
            [0.8, -0.3, 2.0],
            [0.2, -0.3, 2.0],
            [0.2,  0.4, 0.6]
          ]
        ]
      });

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("object constructor with spatial reference", function() {
      var sr = SpatialReference.WebMercator;

      var poly = new Polygon({
        rings: [
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

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);

      assert.ok(poly.spatialReference.equals(sr));
    });

    tdd.test("object constructor with value spatial reference", function() {
      var sr = { wkid: 102100 };

      var poly = new Polygon({
        rings: [
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

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);

      assert.ok(poly.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("object constructor with spatial reference only", function() {
      var sr = SpatialReference.WebMercator;

      var poly = new Polygon({
        spatialReference: sr.wkid
      });

      assert.equal(sr.wkid, poly.spatialReference.wkid);
    });

    tdd.test("addRing", function() {
      var poly = new Polygon();

      poly.addRing([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("addRing point", function() {
      var poly = new Polygon();

      poly.addRing([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("getPoint", function() {
      var poly = new Polygon([
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
      var poly = new Polygon([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      poly.setPoint(0, 0, [0.3, 0.4, 0.6]);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assertFloat.assert(poly.rings[0][0], [0.3,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("setPoint point", function() {
      var poly = new Polygon([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      poly.setPoint(0, 0, new Point([0.3, 0.4, 0.6]));

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assertFloat.assert(poly.rings[0][0], [0.3,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);
    });

    tdd.test("removePoint", function() {
      var poly = new Polygon([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      poly.removePoint(0, 1);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 4);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][2], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2,  0.4, 0.6]);
    });

    tdd.test("extent", function() {
      var poly = new Polygon([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      var extent = poly.extent;

      assertFloat.assert(extent.xmin,  0.2);
      assertFloat.assert(extent.ymin, -0.3);
      assertFloat.assert(extent.zmin,  0.6);

      assertFloat.assert(extent.xmax,  0.8);
      assertFloat.assert(extent.ymax,  0.4);
      assertFloat.assert(extent.zmax,  2.0);
    });

    tdd.test("centroid", function() {
      var poly = new Polygon([
        [0.2,  0.4, 2.0],
        [0.8,  0.4, 2.0],
        [0.8, -0.3, 0.6],
        [0.2, -0.3, 0.6],
        [0.2,  0.4, 2.0]
      ]);

      var centroid = poly.centroid;
      assertFloat.assert(centroid.x, 0.5);
      assertFloat.assert(centroid.y, 0.05);
      assertFloat.assert(centroid.z, 1.3);
    });

    tdd.test("isClockwise", function() {
      var poly = new Polygon([
        [0.2,  0.4, 2.0],
        [0.8,  0.4, 2.0],
        [0.8, -0.3, 0.6],
        [0.2, -0.3, 0.6],
        [0.2,  0.4, 2.0]
      ]);

      assert.ok(poly.isClockwise(poly.rings[0]));
    });

    tdd.test("isClockwise (not)", function() {
      var poly = new Polygon([
        [0.2,  0.4, 0.6],
        [0.8,  0.4, 0.6],
        [0.8, -0.3, 2.0],
        [0.2, -0.3, 2.0],
        [0.2,  0.4, 0.6]
      ]);

      assert.notOk(poly.isClockwise(poly.rings[0]));
    });

    tdd.test("fromExtent 2D", function() {
      var sr = SpatialReference.WebMercator;

      var ex = new Extent({
        xmin: 0,
        ymin: 1,
        xmax: 3,
        ymax: 4,
        spatialReference: sr
      });

      var poly = Polygon.fromExtent(ex);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assertFloat.assert(poly.rings[0][0], [0,  1]);
      assertFloat.assert(poly.rings[0][1], [0,  4]);
      assertFloat.assert(poly.rings[0][2], [3,  4]);
      assertFloat.assert(poly.rings[0][3], [3,  1]);
      assertFloat.assert(poly.rings[0][4], [0,  1]);

      assert.ok(poly.spatialReference.equals(sr));
    });

    tdd.test("fromExtent", function() {
      var ex = new Extent({
        xmin: 0,
        ymin: 1,
        zmin: 2,
        xmax: 3,
        ymax: 4,
        zmax: 5
      });

      var poly = Polygon.fromExtent(ex);

      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assertFloat.assert(poly.rings[0][0], [0,  1, 3.5]);
      assertFloat.assert(poly.rings[0][1], [0,  4, 3.5]);
      assertFloat.assert(poly.rings[0][2], [3,  4, 3.5]);
      assertFloat.assert(poly.rings[0][3], [3,  1, 3.5]);
      assertFloat.assert(poly.rings[0][4], [0,  1, 3.5]);
    });

    tdd.test("toJSON", function() {
      var sr = SpatialReference.WebMercator;
      
      var poly = new Polygon([
        [0.2,  0.4, 2.0],
        [0.8,  0.4, 2.0],
        [0.8, -0.3, 0.6],
        [0.2, -0.3, 0.6],
        [0.2,  0.4, 2.0]
      ], sr);

      assert.deepEqual(poly.toJSON(), {
        rings: [[
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
      
      var poly = new Polygon([
        [0.2,  0.4],
        [0.8,  0.4],
        [0.8, -0.3],
        [0.2, -0.3],
        [0.2,  0.4]
      ], sr);

      assert.deepEqual(poly.toJSON(), {
        rings: [[
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

      var poly = Polygon.fromJSON({
        rings: [[
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
      
      assert.equal(poly.rings.length, 1);
      assert.equal(poly.rings[0].length, 5);

      assert.ok(poly.hasZ);
      assert.notOk(poly.hasM);

      assertFloat.assert(poly.rings[0][0], [0.2,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][1], [0.8,  0.4, 0.6]);
      assertFloat.assert(poly.rings[0][2], [0.8, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][3], [0.2, -0.3, 2.0]);
      assertFloat.assert(poly.rings[0][4], [0.2,  0.4, 0.6]);

      assert.ok(sr.equals(poly.spatialReference));
    });

    tdd.test("fromJSON without spatial reference", function() {
      var poly = Polygon.fromJSON({
        rings: [[
          [0.2,  0.4, 0.6],
          [0.8,  0.4, 0.6],
          [0.8, -0.3, 2.0],
          [0.2, -0.3, 2.0],
          [0.2,  0.4, 0.6]
        ]]
      });

      assert.ok(poly.spatialReference.equals(SpatialReference.WGS84));
    });
  });
});
