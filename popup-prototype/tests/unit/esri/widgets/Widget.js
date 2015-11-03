define([
  "dojo/dom-class",

  "esri/widgets/Widget",

  "intern!object",

  "intern/chai!assert"
],
function(
  domClass,
  Widget,
  registerSuite,
  assert
) {

  var widget;

  registerSuite({

    name: "esri/widgets/Widget",

    beforeEach: function() {
      widget = new Widget();
    },

    afterEach: function() {
      widget.destroy();
    },

    "visible by default": function() {
      assert.isFalse(domClass.contains(widget.domNode, "esri-hidden"));
    },

    "can be hidden": function() {
      widget.set("visible", false);

      assert.isTrue(domClass.contains(widget.domNode, "esri-hidden"));
    }

  });

});
