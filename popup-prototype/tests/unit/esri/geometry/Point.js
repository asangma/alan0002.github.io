define([
  "intern!tdd",
  "intern/chai!assert",
  "test-utils/assertFloat",
  "esri/geometry/Point",
  "esri/geometry/SpatialReference"
], function(tdd, assert, assertFloat, Point, SpatialReference) {
  tdd.suite("esri/geometry/Point", function() {
    tdd.test("value constructor 3D", function() {
      var point = new Point(0.2, 0.3, 0.4);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("value constructor 3D with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point(0.2, 0.3, 0.4, sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(sr));
    });

    tdd.test("value constructor 3D with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point(0.2, 0.3, 0.4, sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("value constructor 2D", function() {
      var point = new Point(0.2, 0.3);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("value constructor 2D with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point(0.2, 0.3, sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(sr));
    });

    tdd.test("value constructor 2D with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point(0.2, 0.3, sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("value constructor 4D", function() {
      var point = new Point(0.2, 0.3, 0.4, 0.5);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);
      assertFloat.assert(point.m, 0.5);

      assert.ok(point.hasZ);
      assert.ok(point.hasM);
    });

    tdd.test("value constructor 4D with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point(0.2, 0.3, 0.4, 0.5, sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);
      assertFloat.assert(point.m, 0.5);

      assert.ok(point.hasZ);
      assert.ok(point.hasM);

      assert.ok(point.spatialReference.equals(sr));
    });

    tdd.test("value constructor 4D with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point(0.2, 0.3, 0.4, 0.5, sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);
      assertFloat.assert(point.m, 0.5);

      assert.ok(point.hasZ);
      assert.ok(point.hasM);

      assert.ok(point.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("object constructor", function() {
      var point = new Point({ x: 0.2, y: 0.3, z: 0.4 });

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("object constructor 2D", function() {
      var point = new Point({ x: 0.2, y: 0.3 });

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("object constructor lon/lat", function() {
      var point = new Point({ longitude: 0.2, latitude: 0.3 });

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("object constructor lon/lat/alt", function() {
      var point = new Point({ longitude: 0.2, latitude: 0.3, altitude: 0.4 });

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("object constructor lon/lat project to spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point({ longitude: 90, latitude: 45, spatialReference: sr });

      assertFloat.assert(point.x, 10018754.171394452);
      assertFloat.assert(point.y, 5621521.486191948);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("object constructor lon/lat project to value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point({ longitude: 90, latitude: 45, spatialReference: sr });

      assertFloat.assert(point.x, 10018754.171394452);
      assertFloat.assert(point.y, 5621521.486191948);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("object constructor hasM", function() {
      var point = new Point({ x: 0.2, y: 0.3, m: 0.5 });

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.m, 0.5);

      assert.ok(point.hasM);
      assert.notOk(point.hasZ);
    });

    tdd.test("array constructor", function() {
      var point = new Point([0.2, 0.3, 0.4]);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("array constructor with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point([0.2, 0.3, 0.4], sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(sr));
    });

    tdd.test("array constructor with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point([0.2, 0.3, 0.4], sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("array constructor 2D", function() {
      var point = new Point([0.2, 0.3]);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      
      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);
    });

    tdd.test("array constructor 2D with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point([0.2, 0.3], sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(sr));
    });

    tdd.test("array constructor 2D with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point([0.2, 0.3], sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);

      assert.notOk(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(point.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("array constructor 4D with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var point = new Point([0.2, 0.3, 0.4, 0.5], sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);
      assertFloat.assert(point.m, 0.5);

      assert.ok(point.hasZ);
      assert.ok(point.hasM);

      assert.ok(point.spatialReference.equals(sr));
    });

    tdd.test("array constructor 4D with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var point = new Point([0.2, 0.3, 0.4, 0.5], sr);

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);
      assertFloat.assert(point.m, 0.5);

      assert.ok(point.hasZ);
      assert.ok(point.hasM);

      assert.ok(point.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("equals", function() {      
      var p1 = new Point(0.2, 0.3, 0.4);
      var p2 = new Point(0.2, 0.3, 0.4);
      var p3 = new Point(0.3, 0.3, 0.4);

      assert.ok(p1.equals(p2));
      assert.notOk(p1.equals(p3));
    });

    tdd.test("offset", function() {
      var point = new Point(0.2, 0.3, 0.4);
      point = point.offset(0.2, 0.3, 0.4);

      assertFloat.assert(point.x, 0.4);
      assertFloat.assert(point.y, 0.6);
      assertFloat.assert(point.z, 0.8);
    });

    tdd.test("set", function() {
      var point = new Point(0.2, 0.3, 0.4);
      point.set({x: 0.4, y: 0.5, z: 0.6});

      assertFloat.assert(point.x, 0.4);
      assertFloat.assert(point.y, 0.5);
      assertFloat.assert(point.z, 0.6);
    });

    tdd.test("toArray", function() {
      var point = new Point(0.2, 0.3, 0.4);
      var arr = point.toArray();

      assertFloat.assert(arr, [0.2, 0.3, 0.4]);
    });

    tdd.test("toArray 2D", function() {
      var point = new Point(0.2, 0.3);
      var arr = point.toArray();

      assertFloat.assert(arr, [0.2, 0.3]);
    });

    tdd.test("toArray hasM", function() {
      var point = new Point({ x: 0.2, y: 0.3, m: 0.4 });
      var arr = point.toArray();

      assertFloat.assert(arr, [0.2, 0.3, 0.4]);
    });

    tdd.test("toArray 4D", function() {
      var point = new Point(0.2, 0.3, 0.4, 0.5);
      var arr = point.toArray();

      assertFloat.assert(arr, [0.2, 0.3, 0.4, 0.5]);
    });

    tdd.test("toJSON", function() {
      var point = new Point(0.2, 0.3, 0.4);

      assert.deepEqual({
        x: 0.2,
        y: 0.3,
        z: 0.4,
        spatialReference: {
          wkid: 4326
        }
      }, point.toJSON());
    });

    tdd.test("toJSON 2D", function() {
      var point = new Point(0.2, 0.3);

      assert.deepEqual({
        x: 0.2,
        y: 0.3,
        spatialReference: {
          wkid: 4326
        }
      }, point.toJSON());
    });

    tdd.test("fromJSON", function() {
      var sr = SpatialReference.WebMercator;

      var point = Point.fromJSON({
        x: 0.2,
        y: 0.3,
        z: 0.4,
        spatialReference: {
          wkid: 3785
        }
      });

      assertFloat.assert(point.x, 0.2);
      assertFloat.assert(point.y, 0.3);
      assertFloat.assert(point.z, 0.4);

      assert.ok(point.hasZ);
      assert.notOk(point.hasM);

      assert.ok(sr.equals(point.spatialReference));
    });

    tdd.test("fromJSON without spatial reference", function() {
      var point = Point.fromJSON({
        x: 0.2,
        y: 0.3
      });

      assert.ok(point.get("spatialReference").equals(SpatialReference.WGS84));
    });

    tdd.test("json roundtrip", function() {
      var point = Point.fromJSON({
        x: 0.2,
        y: 0.3,
        z: 0.4,
        spatialReference: {
          wkid: 3785
        }
      });

      var other = Point.fromJSON(point.toJSON());

      assertFloat.assert(point.x, other.x);
      assertFloat.assert(point.y, other.y);
      assertFloat.assert(point.z, other.z);

      assert.equal(point.hasZ, other.hasZ);
      assert.equal(point.hasM, other.hasM);

      assert.ok(point.spatialReference.equals(other.spatialReference));
    });

    tdd.test("static copy (frozen SR)", function() {
      var p1 = new Point({x: 1, y: 2, z: 3, spatialReference: SpatialReference.WebMercator}),
        p2 = new Point({x: 0, y: 0, m: 0, spatialReference: SpatialReference.WGS84});
      Point.copy(p1, p2);
      assert.equal(p2.x, p1.x, "x");
      assert.equal(p2.y, p1.y, "y");
      assert.equal(p2.z, p1.z, "z");
      assert.notOk(p2.hasM);
      assert.ok(p2.spatialReference === p1.spatialReference, "spatialReference");
    });

    tdd.test("static copy (custom SR)", function() {
      var p1 = new Point({spatialReference: new SpatialReference({ wkid: 1234 })}),
        p2 = new Point({spatialReference: new SpatialReference({ wkid: 4321 })});
      Point.copy(p1, p2);
      assert.ok(p2.spatialReference.equals(p1.spatialReference), "spatialReference equals");
      assert.ok(p2.spatialReference !== p1.spatialReference, "spatialReference !==");
    });

    tdd.test("instance copy", function() {
      var p1 = new Point({x: 1, y: 2, z: 3, spatialReference: SpatialReference.WebMercator}),
        p2 = new Point({x: 0, y: 0, m: 0, spatialReference: SpatialReference.WGS84});
      p2.copy(p1);
      assert.equal(p2.x, p1.x, "x");
      assert.equal(p2.y, p1.y, "y");
      assert.equal(p2.z, p1.z, "z");
      assert.notOk(p2.hasM);
      assert.ok(p2.spatialReference === p1.spatialReference, "spatialReference");
    });

    tdd.test("static distance no z", function() {
      var p1 = new Point({x: 1, y: 1, z: 13}),
        p2 = new Point({x: 2, y: 3});
      assertFloat.assert(Point.distance(p1, p2), 2.23606797749979);
    });

    tdd.test("static distance z", function() {
      var p1 = new Point({x: 1, y: 1, z: 13}),
        p2 = new Point({x: 2, y: 3, z: 0});
      assertFloat.assert(Point.distance(p1, p2), 13.19090595827292);
    });

    tdd.test("instance distance", function() {
      var p1 = new Point({x: 1, y: 1, z: 13}),
        p2 = new Point({x: 2, y: 3, z: 0});
      assertFloat.assert(p1.distance(p2), 13.19090595827292);
    });
  });
});
