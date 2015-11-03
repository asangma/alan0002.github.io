define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/CartographicLineSymbol"
], function(
  registerSuite, assert, sinon, 
  CartographicLineSymbol
) {
  
  registerSuite({
    name: "esri/symbols/CartographicLineSymbol",

    "empty fromJSON": function() {
      var expected = new CartographicLineSymbol({
      });
      var result = CartographicLineSymbol.fromJSON({
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      var expected = new CartographicLineSymbol({
        color: "red",
        style: CartographicLineSymbol.STYLE_DASHDOTDOT,
        caps: CartographicLineSymbol.CAP_ROUND,
        join: CartographicLineSymbol.JOIN_MITER,
        miterLimit: 16,
        width: 16
      });
      var result = CartographicLineSymbol.fromJSON({
        color: [255, 0, 0],
        style: "esriSLSDashDotDot",
        caps: "esriLCSRound",
        join: "esriLJSMiter",
        miterLimit: 12,
        width: 12
      });
      assert.deepEqual(result.toJSON(), expected.toJSON());
    }
  
  });
});
