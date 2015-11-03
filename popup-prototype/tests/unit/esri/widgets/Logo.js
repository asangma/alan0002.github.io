define([
  "dijit/registry",

  "dojo/dom-class",

  "esri/widgets/Logo",

  "intern!object",

  "intern/chai!assert"
],
function(
  registry,
  domClass,
  Logo,
  registerSuite,
  assert
) {

  var logo;

  registerSuite({

    name: "esri/widgets/Logo",

    beforeEach: function() {
      logo = new Logo();
      logo.startup();
    },

    afterEach: function() {
      logo.destroy();
    },

    "default size is medium": function() {
      assert.equal(logo.size, "medium");
    },

    "can change size": function() {
      logo.set("size", "small");
      assert.isTrue(domClass.contains(logo.domNode, "is-small"));


      logo.set("size", "medium");
      assert.isFalse(domClass.contains(logo.domNode, "is-small"));
    },

    "ignores irrelevant sizes": function() {
      logo.set("size", "wat?");

      assert.equal(logo.size, "medium");
    },

    "has a link to the Esri website": function() {
      assert.equal(logo._link, "http://www.esri.com");
    },

    "destroy": function() {
      var preDestructionWidgetCount = registry.toArray().length;

      logo.destroy();

      assert.lengthOf(registry.toArray(), preDestructionWidgetCount - 1);
    }

  });
});
