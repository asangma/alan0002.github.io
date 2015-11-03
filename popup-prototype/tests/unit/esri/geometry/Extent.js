define([
  "intern!tdd",
  "intern/chai!assert",
  "test-utils/assertFloat",
  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esri/geometry/SpatialReference"
], function(tdd, assert, assertFloat, Extent, Point, SpatialReference) {
  tdd.suite("esri/geometry/Extent", function() {
    function ex3d(xmin, ymin, zmin, xmax, ymax, zmax) {
      return new Extent({
        xmin: xmin,
        ymin: ymin,
        zmin: zmin,
        xmax: xmax,
        ymax: ymax,
        zmax: zmax 
      });
    }

    tdd.test("constructor 2D object", function() {
      var extent = new Extent({xmin: 0.2, ymin: 0.4, xmax: 0.8, ymax: 1.2});

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);
    });

    tdd.test("constructor 2D object with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var extent = new Extent({xmin: 0.2, ymin: 0.4, xmax: 0.8, ymax: 1.2, spatialReference: sr});

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);

      assert.ok(extent.spatialReference.equals(sr));
    });

    tdd.test("constructor 2D object with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var extent = new Extent({xmin: 0.2, ymin: 0.4, xmax: 0.8, ymax: 1.2, spatialReference: sr});

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);

      assert.ok(extent.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("constructor 2D value", function() {
      var extent = new Extent(0.2, 0.4, 0.8, 1.2);

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);
    });

    tdd.test("constructor 2D value with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var extent = new Extent(0.2, 0.4, 0.8, 1.2, sr);

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);

      assert.ok(extent.spatialReference.equals(sr));
    });

    tdd.test("constructor 2D value with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var extent = new Extent(0.2, 0.4, 0.8, 1.2, sr);

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);

      assert.ok(extent.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("constructor 3D object", function() {
      var extent = new Extent({xmin: 0.2, ymin: 0.4, zmin: 0.6, xmax: 0.8, ymax: 1.2, zmax: 2.0});

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.zmin, 0.6);

      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);
      assertFloat.assert(extent.zmax, 2.0);

      assert.ok(extent.hasZ);
      assert.notOk(extent.hasM);
    });

    tdd.test("constructor 3D object with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var extent = new Extent({xmin: 0.2, ymin: 0.4, zmin: 0.6, xmax: 0.8, ymax: 1.2, zmax: 2.0, spatialReference: sr});

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.zmin, 0.6);

      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);
      assertFloat.assert(extent.zmax, 2.0);

      assert.ok(extent.hasZ);
      assert.notOk(extent.hasM);
      assert.ok(extent.spatialReference.equals(sr));
    });

    tdd.test("constructor 3D object with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var extent = new Extent({xmin: 0.2, ymin: 0.4, zmin: 0.6, xmax: 0.8, ymax: 1.2, zmax: 2.0, spatialReference: sr});

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.zmin, 0.6);

      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);
      assertFloat.assert(extent.zmax, 2.0);

      assert.ok(extent.hasZ);
      assert.notOk(extent.hasM);
      assert.ok(extent.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("constructor empty with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var extent = new Extent(sr);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);
      assert.ok(extent.spatialReference.equals(sr));
    });

    tdd.test("constructor empty with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var extent = new Extent(sr);

      assert.notOk(extent.hasZ);
      assert.notOk(extent.hasM);
      assert.ok(extent.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("equals", function() {
      var e1 = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var e2 = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var e3 = ex3d(0.2, 0.2, 0.2, 0.8, 0.8, 0.8);

      assert.ok(e1.equals(e2));
      assert.notOk(e1.equals(e3));
    });

    tdd.test("width", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);

      assertFloat.assert(extent.width, 0.6);
    });

    tdd.test("height", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);

      assertFloat.assert(extent.height, 0.8);
    });

    tdd.test("center", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var center = extent.center;

      assertFloat.assert(center.x, 0.5);
      assertFloat.assert(center.y, 0.8);
      assertFloat.assert(center.z, 1.3);
    });

    tdd.test("offset", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      extent = extent.offset(0.4, 0.6, 0.8);

      assertFloat.assert(extent.xmin, 0.6);
      assertFloat.assert(extent.ymin, 1.0);
      assertFloat.assert(extent.zmin, 1.4);

      assertFloat.assert(extent.xmax, 1.2);
      assertFloat.assert(extent.ymax, 1.8);
      assertFloat.assert(extent.zmax, 2.8);
    });

    tdd.test("expand", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      extent = extent.expand(0.5);

      assertFloat.assert(extent.xmin, 0.35);
      assertFloat.assert(extent.ymin, 0.6);
      assertFloat.assert(extent.zmin, 0.95);

      assertFloat.assert(extent.xmax, 0.65);
      assertFloat.assert(extent.ymax, 1);
      assertFloat.assert(extent.zmax, 1.65);
    });

    tdd.test("contains point", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);

      assert.ok(extent.contains(new Point(0.4, 0.8, 0.6)));
      assert.notOk(extent.contains(new Point(0.1, 0.8, 0.6)));
    });

    tdd.test("contains extent", function() {
      var extent = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var inner = ex3d(0.3, 0.5, 0.7, 0.7, 1.2, 1.9);
      var outer = ex3d(0.2, 0.5, 0.6, 0.3, 1.2, 3.0);

      assert.ok(extent.contains(inner));
      assert.notOk(extent.contains(outer));
    });

    tdd.test("union", function() {
      var e1 = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var e2 = ex3d(0.3, 0.5, 0.7, 0.7, 1.2, 1.9);
      var e3 = ex3d(-0.2, -0.5, -0.6, 0, 0, 0);

      assert.ok(e1.equals(e1.union(e2)));

      var un = e2.union(e3);

      assertFloat.assert(un.xmin, -0.2);
      assertFloat.assert(un.ymin, -0.5);
      assertFloat.assert(un.zmin, -0.6);

      assertFloat.assert(un.xmax, 0.7);
      assertFloat.assert(un.ymax, 1.2);
      assertFloat.assert(un.zmax, 1.9);
    });

    tdd.test("clone", function() {
      var e1 = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var e2 = e1.clone();

      assert.ok(e1.equals(e2));
    });

    tdd.test("extent", function() {
      var e1 = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);
      var e2 = e1.extent;

      assert.ok(e1.equals(e2));
    });

    tdd.test("toJSON", function() {
      var e1 = ex3d(0.2, 0.4, 0.6, 0.8, 1.2, 2.0);

      assert.deepEqual({
        xmax: 0.8,
        xmin: 0.2,
        ymax: 1.2,
        ymin: 0.4,
        zmax: 2,
        zmin: 0.6,
        spatialReference: {
          wkid: 4326
        }
      }, e1.toJSON());
    });

    tdd.test("fromJSON", function() {
      var extent = Extent.fromJSON({
        xmin: 0.2,
        ymin: 0.4,
        zmin: 0.6,

        xmax: 0.8,
        ymax: 1.2,
        zmax: 2,

        spatialReference: {
          wkid: 4326
        }
      });

      assertFloat.assert(extent.xmin, 0.2);
      assertFloat.assert(extent.ymin, 0.4);
      assertFloat.assert(extent.zmin, 0.6);

      assertFloat.assert(extent.xmax, 0.8);
      assertFloat.assert(extent.ymax, 1.2);
      assertFloat.assert(extent.zmax, 2);

      assert.ok(extent.spatialReference.equals(SpatialReference.WGS84));
    });

    tdd.test("fromJSON without spatial reference", function() {
      var extent = Extent.fromJSON({
        xmin: 0.2,
        ymin: 0.4,
        zmin: 0.6,

        xmax: 0.8,
        ymax: 1.2,
        zmax: 2
      });

      assert.ok(extent.get("spatialReference").equals(SpatialReference.WGS84));
    });
  });
});
