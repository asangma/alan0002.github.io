define([
  'intern!object',
  'intern/chai!assert',
  'esri/core/screenUtils'
], function(registerSuite, assert, screenUtils){


  registerSuite({
    name: 'esri/core/screenUtils',

    afterEach: function() {
      screenUtils.DPI = 96;
    },

    "pt2px": function() {
      assert.equal(screenUtils.pt2px(6), 8, "pt2px should convert from point to pixel");
    },

    "px2pt": function() {
      assert.equal(screenUtils.px2pt(8), 6, "px2pt should convert from pixel to point");
    },

    "pt2pt with 300 DPI": function() {
      screenUtils.DPI = 300;
      assert.equal(screenUtils.pt2px(6), 25, "pt2px should convert from point to pixel honoring screenUtils.DPI");
    },

    "px2pt with 300 DPI": function() {
      screenUtils.DPI = 300;
      assert.equal(screenUtils.px2pt(25), 6, "px2pt should convert from pixel to point honoring screenUtils.DPI");
    }

  });
});