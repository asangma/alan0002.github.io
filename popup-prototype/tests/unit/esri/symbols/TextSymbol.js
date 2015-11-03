define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/TextSymbol",
  "esri/symbols/Font"
], function(
  registerSuite, assert, sinon, 
  TextSymbol, Font
) {
  
  registerSuite({
    name: "esri/symbols/TextSymbol",

    "empty fromJSON": function() {
      var expected = new TextSymbol({
      });
      var result = TextSymbol.fromJSON({
      });
      assert.deepEqual(result.toJSON(), expected.toJSON());
    },

    "fromJSON": function() {
      var expected = new TextSymbol({
        color: [78,78,78,255],
        backgroundColor: [0,0,0,0],
        borderLineSize: 2,
        borderLineColor: [255,0,255,255],
        haloSize: 2,
        haloColor: [0,255,0,255],
        verticalAlignment: "bottom",
        horizontalAlignment: "left",
        rightToLeft: false,
        angle: 0,
        xoffset: 0,
        yoffset: 0,
        kerning: true,
        font: new Font({
          family: "Arial",
          size: 16,
          style: "normal",
          weight: "bold",
          decoration: "none"
        })
      });

      var result = TextSymbol.fromJSON({
        "type": "esriTS",
        "color": [78,78,78,255],
        "backgroundColor": [0,0,0,0],
        "borderLineSize": 2,
        "borderLineColor": [255,0,255,255],
        "haloSize": 2,
        "haloColor": [0,255,0,255],
        "verticalAlignment": "bottom",
        "horizontalAlignment": "left",
        "rightToLeft": false,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "kerning": true,
        "font": {
          "family": "Arial",
          "size": 12,
          "style": "normal",
          "weight": "bold",
          "decoration": "none"
        }
      });
      
      assert.deepEqual(result.toJSON(), expected.toJSON());
    }
  
  });
});
