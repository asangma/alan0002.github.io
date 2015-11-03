define([
  "dojo/dom-construct",

  "esri/core/domUtils",

  "intern!object",

  "intern/chai!assert"
],
function(
  domConstruct,
  domUtils,
  registerSuite,
  assert
){

  var node;

  registerSuite({
    name: "esri/core/domUtils",

    beforeEach: function() {
      node = domConstruct.create("div");
    },

    show: function(){
      node.style.display = "none";

      domUtils.show(node);

      assert.equal(node.style.display, "block");
    },

    hide: function(){
      domUtils.hide(node);

      assert.equal(node.style.display, "none");
    },

    toggle: function(){
      domUtils.toggle(node);

      assert.equal(node.style.display, "none");

      domUtils.toggle(node);

      assert.equal(node.style.display, "block");
    },

    getNode: function(){
      var fakeWidget = {
        domNode: node
      };

      assert.equal(domUtils.getNode(node), node);
      assert.equal(domUtils.getNode(fakeWidget), node);
    },

    setScrollable: function(){
      this.skip("pending");
    }
  });
});
