define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/views/2d/ViewState",

  "esri/Viewpoint",

  "esri/geometry/Point"
], function(
  registerSuite, assert, sinon, 
  ViewState,
  Viewpoint,
  Point
) {

  registerSuite({
    name: "esri/views/2d/ViewState",

    beforeEach: function() {
      var state = new ViewState({
        viewpoint: new Viewpoint({
          targetGeometry: new Point()
        })
      });
    },

    "constructor": function() {}
  });

});