define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol"
], function(
  registerSuite, assert, sinon, 
  SimpleMarkerSymbol, SimpleLineSymbol
) {
  
  registerSuite({
    name: "esri/symbols/SimpleMarkerSymbol",

    "empty fromJSON": function() {
      var expected = new SimpleMarkerSymbol({
      });
      var result = SimpleMarkerSymbol.fromJSON({
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      // http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Symbol_Objects/02r3000000n5000000/
      
      var expected = new SimpleMarkerSymbol({
        style: SimpleMarkerSymbol.STYLE_SQUARE,
        color: "rgb(76,115,0)",
        size: 10.666666666666666,
        angle: 30,
        xoffset: 0,
        yoffset: 0,
        outline: new SimpleLineSymbol({
          color: "rgb(152,230,0)",
          width: 1.3333333333333333
        })
      });
      var result = SimpleMarkerSymbol.fromJSON({
        "type": "esriSMS",
        "style": "esriSMSSquare",
        "color": [76,115,0,255],
        "size": 8,
        "angle": -30,
        "xoffset": 0,
        "yoffset": 0,
        "outline": {
          "color": [152,230,0,255],
          "width": 1
        }
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    }
  
  });
});
