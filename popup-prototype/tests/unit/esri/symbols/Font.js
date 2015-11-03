define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/Font"
], function(
  registerSuite, assert, sinon, 
  Font
) {
  
  registerSuite({
    name: "esri/symbols/Font",

    "empty fromJSON": function() {
      var expected = new Font({
      });
      var result = Font.fromJSON({
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      var expected = new Font({
        family: "Arial",
        size: 16,
        style: "normal",
        weight: "bold",
        decoration: "underline" // NO ENUM!
      });
      var result = Font.fromJSON({
        "family": "Arial",
        "size": 12,
        "style": "normal",
        "weight": "bold",
        "decoration": "underline"
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    }
  
  });
});
