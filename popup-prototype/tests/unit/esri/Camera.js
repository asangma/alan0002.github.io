define([
  "intern!tdd",
  "intern/chai!assert",
  "test-utils/assertFloat",
  "esri/Camera"
], function(tdd, assert, assertFloat, Camera) {

  tdd.suite("esri/Camera", function() {
    
    tdd.test("value constructor", function() {
      var c = new Camera([1, 2, 3], 40, 30, 55);

      assertFloat.assert(c.position.x, 1);
      assertFloat.assert(c.position.y, 2);
      assertFloat.assert(c.position.z, 3);

      assertFloat.assert(c.heading, 40);
      assertFloat.assert(c.tilt, 30);
      assertFloat.assert(c.fov, 55);
    });

    tdd.test("object constructor", function() {
      var c = new Camera({
        position: [1, 2, 3],
        heading: 40,
        tilt: 30,
        fov: 55
      });

      assertFloat.assert(c.position.x, 1);
      assertFloat.assert(c.position.y, 2);
      assertFloat.assert(c.position.z, 3);

      assertFloat.assert(c.heading, 40);
      assertFloat.assert(c.tilt, 30);
      assertFloat.assert(c.fov, 55);
    });

    tdd.test("object constructor partial", function() {
      var c = new Camera({
        heading: 40,
        tilt: 30
      });

      assertFloat.assert(c.position.x, 0);
      assertFloat.assert(c.position.y, 0);
      assertFloat.assert(c.position.z, 0);

      assertFloat.assert(c.heading, 40);
      assertFloat.assert(c.tilt, 30);
      assertFloat.assert(c.fov, 55);
    });

    tdd.test("fromJSON", function() {
      var c = Camera.fromJSON({
        position: {
          x: 1,
          y: 2,
          z: 3
        },
        heading: 40,
        tilt: 30,
        fov: 55
      });

      assertFloat.assert(c.position.x, 1);
      assertFloat.assert(c.position.y, 2);
      assertFloat.assert(c.position.z, 3);

      assertFloat.assert(c.heading, 40);
      assertFloat.assert(c.tilt, 30);
      assertFloat.assert(c.fov, 55);
    });

    tdd.test("toJSON", function() {
      var c = new Camera({
        position: [1, 2, 3],
        heading: 40,
        tilt: 30,
        fov: 55
      });

      var json = c.toJSON();

      assert.deepEqual(json, {
        position: {
          x: 1,
          y: 2,
          z: 3,
          spatialReference: {
            wkid: 4326
          }
        },
        heading: 40,
        tilt: 30
      });
    });
  });
});
