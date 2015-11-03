define([
  "dojo/dom-class",
  "dojo/dom-construct",

  "esri/views/ui/Component",

  "intern!bdd",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  domClass, domConstruct,
  Component,
  bdd,
  assert,
  sinon
) {

  bdd.describe("esri/views/ui/Component", function() {

    bdd.it("accepts DOM nodes", function() {
      var dummyElement = domConstruct.create("div");

      var component = new Component({
        node: dummyElement
      });

      assert.equal(component.node, dummyElement);
    });

    bdd.it("accepts widgets", function() {
      var dummyElement = domConstruct.create("div");
      var fakeWidget = {
        domNode: dummyElement
      };

      var component = new Component({
        node: fakeWidget
      });

      assert.equal(component.node, fakeWidget.domNode);
    });

    bdd.it("adds the component class to its node", function() {
      var dummyElement = domConstruct.create("div");
      var component = new Component({
        node: dummyElement
      });

      assert.isTrue(domClass.contains(component.node, "esri-component"));
    });

    bdd.it("removes the component class when node is changed", function() {
      var dummyElement1 = domConstruct.create("div");
      var dummyElement2 = domConstruct.create("div");
      var component = new Component({
        node: dummyElement1
      });

      component.node = dummyElement2;

      assert.isFalse(domClass.contains(dummyElement1, "esri-component"));
    });

    bdd.it("drops the associated widget when node is changed", function() {
      var dummyElement = domConstruct.create("div");
      var fakeWidget = {
        domNode: dummyElement
      };

      var component = new Component({
        node: fakeWidget
      });

      component.node = domConstruct.create("div");

      assert.isNull(component._widget);
    });

    bdd.it("can be destroyed", function() {
      var dummyElement = domConstruct.create("div");
      var component = new Component({
        node: dummyElement
      });

      component.destroy();

      assert.isFalse(domClass.contains(dummyElement, "esri-component"));
    });

    bdd.it("destroys associated widget when destroyed", function() {
      var dummyElement = domConstruct.create("div");
      var fakeWidget = {
        domNode: dummyElement,
        destroy: sinon.spy()
      };
      var component = new Component({
        node: fakeWidget
      });

      component.destroy();

      assert.isTrue(fakeWidget.destroy.calledOnce);
    });

  });

});

