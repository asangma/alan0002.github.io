define([
  "intern!tdd",
  "intern/chai!assert",
  "esri/renderers/SimpleRenderer"
], function(tdd, assert, SimpleRenderer) {
  tdd.suite("esri/renderers/SimpleRenderer", function () {
    tdd.test("getRequiredFields", function () {
      var renderer = new SimpleRenderer({
        visualVariables: [
          {
            type: "colorInfo",
            field: "f1"
          },
          {
            type: "sizeInfo",
            axis: "width",
            field: "f2"
          },
          {
            type: "sizeInfo",
            axis: "height",
            field: "f1"
          }
        ],
        colorInfo: { field: "f3" },
        sizeInfo: { field: "f4" },
        transparencyInfo: { field: "f5" },
        rotationInfo: { field: "f6" }
      });
      
      var actual = renderer.getRequiredFields(),
        expected = ["f1", "f2", "f3", "f4", "f5", "f6"];
      assert.equal(actual.length, expected.length, "number of fields");
      expected.forEach(function(f) {
        assert.isTrue(actual.indexOf(f) > -1, "field returned: " + f);
      });
    });
  });
});
