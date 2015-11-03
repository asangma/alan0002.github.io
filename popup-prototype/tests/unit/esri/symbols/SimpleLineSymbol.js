define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/SimpleLineSymbol"
], function(
  registerSuite, assert, sinon, 
  SimpleLineSymbol
) {
  
  registerSuite({
    name: "esri/symbols/SimpleLineSymbol",

    "empty fromJSON": function() {
      var expected = new SimpleLineSymbol({
      });
      var result = SimpleLineSymbol.fromJSON({
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      var expected = new SimpleLineSymbol({
        style: "dot",
        color: [115,76,0,255],
        width: 1.3333333333333333
      });
      var result = SimpleLineSymbol.fromJSON({
        "type": "esriSLS",
        "style": "esriSLSDot",
        "color": [115,76,0,255],
        "width": 1
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    }
  
  });
});
