define([
  "intern!tdd",
  "intern/chai!assert",
  "test-utils/assertFloat",
  "esri/geometry/Multipoint",
  "esri/geometry/Point",
  "esri/geometry/SpatialReference"
], function(tdd, assert, assertFloat, Multipoint, Point, SpatialReference) {
  tdd.suite("esri/geometry/Multipoint", function() {
    tdd.test("constructor", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      });

      assert.ok(multipoint.hasZ);
      assert.notOk(multipoint.hasM);

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);
    });

    tdd.test("constructor with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      }, sr);

      assert.ok(multipoint.hasZ);
      assert.notOk(multipoint.hasM);

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);

      assert.ok(multipoint.spatialReference.equals(sr));
    });

    tdd.test("constructor with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      }, sr);

      assert.ok(multipoint.hasZ);
      assert.notOk(multipoint.hasM);

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);

      assert.ok(multipoint.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("empty constructor with spatial reference", function() {
      var sr = SpatialReference.WebMercator;
      var multipoint = new Multipoint(sr);

      assert.notOk(multipoint.hasZ);
      assert.notOk(multipoint.hasM);

      assert(multipoint.points.length === 0);
      assert.ok(multipoint.spatialReference.equals(sr));
    });

    tdd.test("empty constructor with value spatial reference", function() {
      var sr = { wkid: 102100 };
      var multipoint = new Multipoint(sr);

      assert.notOk(multipoint.hasZ);
      assert.notOk(multipoint.hasM);

      assert(multipoint.points.length === 0);
      assert.ok(multipoint.spatialReference.equals(new SpatialReference(sr)));
    });

    tdd.test("constructor hasM", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ],
        hasM: true
      });

      assert.ok(multipoint.hasM, "hasM");
      assert.notOk(multipoint.hasZ, "!hasZ");

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);
    });

    tdd.test("array value constructor", function() {
      var multipoint = new Multipoint([
        [0, 1, 2],
        [3, 4, 5]
      ]);

      assert.ok(multipoint.hasZ);
      assert.notOk(multipoint.hasM);

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);
    });

    tdd.test("addPoint", function() {
      var multipoint = new Multipoint();

      multipoint.addPoint([0, 1, 2]);
      multipoint.addPoint(new Point({x: 3, y: 4, z: 5}));

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);
    });

    tdd.test("removePoint", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      });

      multipoint.removePoint(0);
      assertFloat.assert(multipoint.points[0], [3, 4, 5]);
    });

    tdd.test("getPoint", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2]
        ]
      });

      var p = multipoint.getPoint(0);

      assertFloat.assert([p.x, p.y, p.z], [0, 1, 2]);
    });

    tdd.test("extent", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      });

      var e = multipoint.extent;

      assertFloat.assert(e.xmin, 0);
      assertFloat.assert(e.ymin, 1);
      assertFloat.assert(e.zmin, 2);

      assertFloat.assert(e.xmax, 3);
      assertFloat.assert(e.ymax, 4);
      assertFloat.assert(e.zmax, 5);
    });

    tdd.test("toJSON", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      });

      assert.deepEqual({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ],
        hasZ: true,
        spatialReference: {
          wkid: 4326
        }
      }, multipoint.toJSON());
    });

    tdd.test("toJSON 2D", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1],
          [3, 4]
        ]
      });

      assert.deepEqual({
        points: [
          [0, 1],
          [3, 4]
        ],
        spatialReference: {
          wkid: 4326
        }
      }, multipoint.toJSON());
    });

    tdd.test("fromJSON", function() {
      var multipoint = Multipoint.fromJSON({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ],
        hasZ: true,
        spatialReference: {
          wkid: 4326
        }
      });

      assertFloat.assert(multipoint.points[0], [0, 1, 2]);
      assertFloat.assert(multipoint.points[1], [3, 4, 5]);
      assert.ok(multipoint.hasZ);
      assert.notOk(multipoint.hasM);
    });

    tdd.test("fromJSON without spatial reference", function() {
      var multipoint = Multipoint.fromJSON({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ]
      });

      assert.ok(multipoint.get("spatialReference").equals(SpatialReference.WGS84));
    });

    tdd.test("JSON roundtrip", function() {
      var multipoint = new Multipoint({
        points: [
          [0, 1, 2],
          [3, 4, 5]
        ],
        hasM: true
      });

      var other = Multipoint.fromJSON(multipoint.toJSON());

      assertFloat.assert(multipoint.points[0], other.points[0]);
      assertFloat.assert(multipoint.points[1], other.points[1]);
      assert.ok(multipoint.spatialReference.equals(other.spatialReference));
      assert.equal(multipoint.hasZ, other.hasZ);
      assert.equal(multipoint.hasM, other.hasM);
    });
  });
});
