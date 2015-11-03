define([
  "intern!tdd",
  "intern/chai!assert",
  "esri/renderers/ClassBreaksRenderer"
], function(tdd, assert, ClassBreaksRenderer) {
  tdd.suite("esri/renderers/ClassBreaksRenderer", function () {
    tdd.test("getRequiredFields", function () {
      var renderer = new ClassBreaksRenderer({
        field: "f1"
      });

      var actual = renderer.getRequiredFields();
      assert.equal(actual.length, 1, "number of fields");
      assert.equal(actual[0], "f1", "field");
    });

    tdd.test("getRequiredFields - normalizationField", function () {
      var renderer = new ClassBreaksRenderer({
        rotationInfo: { field: "f1" },
        field: "f1",
        normalizationField: "f1"
      });

      var actual = renderer.getRequiredFields();
      assert.equal(actual.length, 1, "number of fields");
      assert.equal(actual[0], "f1", "field");
    });

    tdd.test("getRequiredFields - fields are unique", function () {
      var renderer = new ClassBreaksRenderer({
        rotationInfo: { field: "f1" },
        field: "f1",
        normalizationField: "f1"
      });

      var actual = renderer.getRequiredFields();
      assert.equal(actual.length, 1, "number of fields");
      assert.equal(actual[0], "f1", "field");
    });
  });
});
