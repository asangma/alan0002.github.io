define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol"
], function(
  registerSuite, assert, sinon, 
  SimpleFillSymbol, SimpleLineSymbol
) {
  
  registerSuite({
    name: "esri/symbols/SimpleFillSymbol",

    "empty fromJSON": function() {
      var expected = new SimpleFillSymbol({
      });
      var result = SimpleFillSymbol.fromJSON({
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      var expected = new SimpleFillSymbol({
        style: SimpleFillSymbol.STYLE_SOLID,
        color: [115,76,0,255],
        outline: new SimpleLineSymbol({
          style: SimpleFillSymbol.STYLE_SOLID,
          color: [110,110,110],
          width: 1.3333333333333333
        })
      });
      var result = SimpleFillSymbol.fromJSON({
        "type": "esriSFS",
        "style": "esriSFSSolid",
        "color": [115,76,0,255],
        "outline": {
          "type": "esriSLS",
          "style": "esriSLSSolid",
          "color": [110,110,110,255],
          "width": 1
        }
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    }
  
  });
});
