define([
  "intern!tdd",
  "intern/chai!assert",
  "esri/renderers/UniqueValueRenderer"
], function(tdd, assert, UniqueValueRenderer) {
  tdd.suite("esri/renderers/UniqueValueRenderer", function () {
    tdd.test("getRequiredFields", function () {
      var renderer = new UniqueValueRenderer({
        field1: "f1"
      });

      var actual = renderer.getRequiredFields();
      assert.equal(actual.length, 1, "number of fields");
      assert.equal(actual[0], "f1", "field");
    });

    tdd.test("getRequiredFields - 3 fields", function () {
      var renderer = new UniqueValueRenderer({
        field1: "f3",
        field2: "f4",
        field3: "f5"
      });

      var actual = renderer.getRequiredFields(),
        expected = ["f3", "f4", "f5"];
      assert.equal(actual.length, expected.length, "number of fields");
      expected.forEach(function(f) {
        assert.isTrue(actual.indexOf(f) > -1, "field returned: " + f);
      });
    });

    tdd.test("getRequiredFields - fields are unique", function () {
      var renderer = new UniqueValueRenderer({
        visualVariables: [
          {
            type: "colorInfo",
            field: "f1"
          }
        ],
        rotationInfo: { field: "f2" },
        field1: "f1",
        field2: "f2",
        field3: "f3"
      });

      var actual = renderer.getRequiredFields(),
        expected = ["f1", "f2", "f3"];
      assert.equal(actual.length, expected.length, "number of fields");
      expected.forEach(function(f) {
        assert.isTrue(actual.indexOf(f) > -1, "field returned: " + f);
      });
    });
  });
});
