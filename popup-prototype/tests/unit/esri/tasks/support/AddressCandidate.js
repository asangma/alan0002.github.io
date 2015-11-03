define([
  "esri/geometry/Point",
  "esri/geometry/SpatialReference",
  "esri/tasks/support/AddressCandidate",

  "intern!object",

  "intern/chai!assert"
],
function(
  Point, SpatialReference, AddressCandidate,
  registerSuite,
  assert
) {

  var attributesSubset = {
    Loc_name: "CityState",
    Score: 100,
    X: -106.490969,
    Y: 31.763210000000015,
    City: "EL PASO",
    State: "TX",
    Match_addr: "EL PASO, TX"
  };

  var pointJson = {
    "x": 7667299.00009452,
    "y": 691389.937552854,
    "spatialReference": {
      "wkid": 102726
    }
  };

  var address = "4728 Loma de Plata";

  var score = 100;

  registerSuite({

    name: "esri/tasks/support/AddressCandidate",

    "new AddressCandidate()": function() {

      var ac = new AddressCandidate({
        address: address,
        location: Point.fromJSON(pointJson),
        score: score,
        attributes: attributesSubset
      });

      var expectedPoint = Point.fromJSON(pointJson);

      assert.equal(ac.address, address);

      assert.instanceOf(ac.location, Point);
      assert.propertyVal(ac.location, "x", expectedPoint.x);
      assert.propertyVal(ac.location, "y", expectedPoint.y);

      assert.instanceOf(ac.location.spatialReference, SpatialReference);
      assert.deepPropertyVal(ac.location, "spatialReference.wkid", expectedPoint.spatialReference.wkid);

      assert.equal(ac.score, score);

      assert.deepEqual(ac.attributes, attributesSubset);

    },

    "fromJSON()": function() {

      var ac = AddressCandidate.fromJSON({
        address: address,
        location: pointJson,
        score: score,
        attributes: attributesSubset
      });

      var expectedPoint = Point.fromJSON(pointJson);

      assert.equal(ac.address, address);

      assert.instanceOf(ac.location, Point);
      assert.propertyVal(ac.location, "x", expectedPoint.x);
      assert.propertyVal(ac.location, "y", expectedPoint.y);

      assert.instanceOf(ac.location.spatialReference, SpatialReference);
      assert.deepPropertyVal(ac.location, "spatialReference.wkid", expectedPoint.spatialReference.wkid);

      assert.equal(ac.score, score);

      assert.deepEqual(ac.attributes, attributesSubset);

    }

  });
});
