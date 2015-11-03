define([
  "dojo/_base/lang",

  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/query",

  "esri/views/ui/Component",
  "esri/views/ui/UI",

  "esri/views/View",

  "intern!bdd",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  lang,
  domClass, domConstruct, query,
  Component, UI,
  View,
  bdd,
  assert,
  sinon
) {

  // hijack View to not instantiate any widgets
  View = View.createSubclass({
    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        ui: {
          components: []
        }
      });
    }
  });

  bdd.describe("esri/views/ui/UI", function() {

    var ui,
        dummyContainer,
        dummyElement;

    function forceAccessorDispatch() {
      Array.prototype.slice.call(arguments).forEach(function(accessor) {
        accessor._accessorProps.dispatch();
      });
    }

    bdd.beforeEach(function() {
      ui = new UI();
      dummyElement = domConstruct.create("div");
      dummyContainer = domConstruct.create("div");
    });

    bdd.afterEach(function() {
      domConstruct.destroy(dummyContainer);
      domConstruct.destroy(dummyElement);
    });

    bdd.it("adds its CSS to its container", function() {
      ui.container = dummyContainer;

      assert.isTrue(domClass.contains(ui.container, "esri-ui"));
    });

    bdd.it("when given null as a view it ignores it", function() {
      ui.view = null;

      assert.isNull(ui.view);
    });

    bdd.it("adds corner containers", function() {
      ui.container = dummyContainer;

      var corners = query(".esri-ui-corner", ui.container);

      assert.lengthOf(corners, 4);

      assert.lengthOf(query(".esri-ui-top-left", ui.container), 1);
      assert.lengthOf(query(".esri-ui-top-right", ui.container), 1);
      assert.lengthOf(query(".esri-ui-bottom-left", ui.container), 1);
      assert.lengthOf(query(".esri-ui-bottom-right", ui.container), 1);
    });

    bdd.it("destroy resets container", function() {
      ui.container = dummyContainer;
      ui.resize(10, 20);

      ui.destroy();

      assert.lengthOf(query(".esri-ui", dummyContainer), 0);
      assert.isTrue(dummyContainer.style.top === "");
      assert.isTrue(dummyContainer.style.bottom === "");
      assert.isTrue(dummyContainer.style.left === "");
      assert.isTrue(dummyContainer.style.right === "");
    });

    bdd.it("destroys child components", function() {
      var component = new Component({
        node: dummyElement
      });

      sinon.spy(component, "destroy");
      ui.add(component, "top-left");

      ui.destroy();

      assert.isTrue(component.destroy.calledOnce);
    });

    bdd.it("calls resize when view resizes", function() {
      var dummyView = new View();

      ui.view = dummyView;

      sinon.spy(ui, "resize");

      dummyView.emit("resize", {
        width: 10,
        height: 20
      });

      assert.isTrue(ui.resize.calledOnce);
      assert.isTrue(ui.resize.calledWith(10, 20));
    });

    bdd.it("finds components by ID", function() {
      var component = new Component({
        id: "findMe",
        node: dummyElement
      });

      ui.add(component, "top-left");

      var match = ui.find("findMe");

      assert.equal(component, match);
    });

    bdd.it("has width and height", function() {
      var dummyView = new View();

      ui.view = dummyView;

      dummyView.emit("resize", {
        width: 10,
        height: 20
      });

      assert.equal(ui.width, 10);
      assert.equal(ui.height, 20);
    });

    bdd.describe("padding", function () {

      bdd.it("default padding is to inherit", function() {
        assert.deepEqual(ui.padding, {
          top: "inherit",
          bottom: "inherit",
          left: "inherit",
          right: "inherit"
        });
      });

      bdd.it("padding is guaranteed", function() {
        ui.padding = null;

        assert.deepEqual(ui.padding, {
          top: "inherit",
          bottom: "inherit",
          left: "inherit",
          right: "inherit"
        });
      });

      bdd.it("computed padding is read-only", function() {
        assert.throws(function() {
          ui.computedPadding = {};
        });
      });

      bdd.it("padding can be customized", function() {
        ui.padding = {
          top: "none",
          left: 10
        };

        assert.deepEqual(ui.padding, {
          top: "none",
          bottom: "inherit",
          left: 10,
          right: "inherit"
        })
      });

      bdd.it("supports shorthand options", function() {
        ui.padding = "none";

        assert.deepEqual(ui.padding, {
          top: "none",
          bottom: "none",
          left: "none",
          right: "none"
        })

        ui.padding = "inherit";

        assert.deepEqual(ui.padding, {
          top: "inherit",
          bottom: "inherit",
          left: "inherit",
          right: "inherit"
        })
      });

      bdd.it("customizing padding does not alter defaults", function() {
        ui.padding = {
          top: "none",
          left: 10,
        };

        assert.deepEqual(ui.padding, {
          top: "none",
          bottom: "inherit",
          left: 10,
          right: "inherit"
        });

        ui.padding = null;

        assert.deepEqual(ui.padding, {
          top: "inherit",
          bottom: "inherit",
          left: "inherit",
          right: "inherit"
        });
      });

      bdd.it("applies view's padding container", function() {
        ui.container = dummyContainer;

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "0px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "0px");
        assert.equal(dummyContainer.style.right, "0px");

        var dummyView = new View({
          padding: {
            top: 10,
            bottom: 0,
            left: 5,
            right: 0
          }
        });

        ui.view = dummyView;

        forceAccessorDispatch(dummyView, ui);

        assert.equal(dummyContainer.style.top, "10px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "5px");
        assert.equal(dummyContainer.style.right, "0px");
      });

      bdd.it("uses 'inherit' as its default padding", function() {
        var dummyView = new View({
          padding: {
            top: 10,
            bottom: 0,
            left: 5,
            right: 30
          }
        });

        ui.container = dummyContainer;
        ui.view = dummyView;

        ui.resize(10, 20);

        assert.equal(dummyContainer.style.top, "10px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "5px");
        assert.equal(dummyContainer.style.right, "30px");
      });

      bdd.it("can ignore padding", function() {
        var dummyView = new View({
          padding:{
            top: 10,
            bottom: 0,
            left: 5,
            right: 30
          }
        });

        ui.container = dummyContainer;
        ui.view = dummyView;
        ui.padding = {
          top: "none",
          bottom: "none",
          right: "none",
          left: "none"
        };

        ui.resize(10, 20);

        assert.equal(dummyContainer.style.top, "0px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "0px");
        assert.equal(dummyContainer.style.right, "0px");
      });

      bdd.it("computes padding", function() {
        ui.container = dummyContainer;

        ui.padding = {
          top: 20,
          right: "inherit",
          left: "none"
        };

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "20px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "0px");
        assert.equal(dummyContainer.style.right, "0px");

        var dummyView = new View({
          padding: {
            top: 10,
            bottom: 0,
            left: 5,
            right: 30
          }
        });

        ui.view = dummyView;

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "20px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "0px");
        assert.equal(dummyContainer.style.right, "30px");

      });

      bdd.it("container before view should compute padding", function() {
        var dummyView = new View({
          padding: {
            top: 10,
            bottom: 0,
            left: 5,
            right: 30
          }
        });

        ui.container = dummyContainer;
        ui.view = dummyView;

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "10px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "5px");
        assert.equal(dummyContainer.style.right, "30px");
      });

      bdd.it("recomputes padding when updated", function() {
        var dummyView = new View({
          padding: {
            top: 10,
            bottom: 0,
            left: 5,
            right: 30
          }
        });

        ui.view = dummyView;
        ui.container = dummyContainer;

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "10px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "5px");
        assert.equal(dummyContainer.style.right, "30px");

        ui.padding = {
          top: 20,
          right: "inherit",
          left: "none"
        };

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "20px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "0px");
        assert.equal(dummyContainer.style.right, "30px");
      });


      bdd.it("computes padding when view's padding is modified", function() {
        var dummyView = new View();

        ui.container = dummyContainer;
        ui.view = dummyView;

        forceAccessorDispatch(ui);

        assert.equal(dummyContainer.style.top, "0px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "0px");
        assert.equal(dummyContainer.style.right, "0px");

        dummyView.padding = {
          top: 10,
          bottom: 0,
          left: 5,
          right: 30
        };

        forceAccessorDispatch(dummyView, ui);

        assert.equal(dummyContainer.style.top, "10px");
        assert.equal(dummyContainer.style.bottom, "0px");
        assert.equal(dummyContainer.style.left, "5px");
        assert.equal(dummyContainer.style.right, "30px");

      });

      bdd.it("width and height reflect padding", function() {
        var dummyView = new View();

        dummyView.padding = {
          top: 100,
          bottom: 200,
          left: 100,
          right: 200
        };

        ui.view = dummyView;

        dummyView.emit("resize", {
          height: 400,
          width: 500
        });

        assert.equal(ui.height, 100);
        assert.equal(ui.width, 200);
      });

      bdd.it("has zero for width/height when padding causes container to overflow", function() {
        var dummyView = new View();

        dummyView.padding = {
          top: 100,
          bottom: 100,
          left: 100,
          right: 100
        };

        ui.view = dummyView;

        dummyView.emit("resize", {
          height: 100,
          width: 100
        });

        assert.equal(ui.height, 0);
        assert.equal(ui.width, 0);
      })

    });

    bdd.describe("adding components", function () {

      bdd.it("adding components require a position", function() {
        var component = new Component({
          node: dummyElement
        });

        ui.add(component);

        assert.isNull(dummyElement.parentNode);
      });

      bdd.it("ignores invalid positions", function() {
        var component = new Component({
          node: dummyElement
        });

        ui.add(component, "invalid-position");

        assert.isNull(dummyElement.parentNode);
      });

      bdd.it("accepts component instances", function() {
        var component = new Component({
          node: dummyElement
        });

        ui.container = dummyContainer;

        ui.add(component, "top-left");

        assert.lengthOf(query(".esri-component", ui.container), 1);
        assert.lengthOf(query(".esri-ui-top-left .esri-component", ui.container), 1);
      });

      bdd.it("accepts DOM nodes", function() {
        ui.container = dummyContainer;

        ui.add(dummyElement, "top-left");

        assert.lengthOf(query(".esri-component", ui.container), 1);
        assert.lengthOf(query(".esri-ui-top-left .esri-component", ui.container), 1);
      });

      bdd.it("accepts widgets", function() {
        var placeAtStub = domConstruct.place.bind(null, dummyElement);
        var fakeWidget = {
          domNode: dummyElement,
          placeAt: placeAtStub
        };

        ui.container = dummyContainer;

        ui.add(fakeWidget, "top-left");

        assert.lengthOf(query(".esri-component", ui.container), 1);
        assert.lengthOf(query(".esri-ui-top-left .esri-component", ui.container), 1);
      });

      bdd.it("adds to top-left", function() {
        ui.add(dummyElement, "top-left");

        assert.equal(dummyElement.parentNode, ui._topLeft);
      });

      bdd.it("adds to top-right", function() {
        ui.add(dummyElement, "top-right");

        assert.equal(dummyElement.parentNode, ui._topRight);
      });

      bdd.it("adds to bottom-left", function() {
        ui.add(dummyElement, "bottom-left");

        assert.equal(dummyElement.parentNode, ui._bottomLeft);
      });

      bdd.it("adds to bottom-right", function() {
        ui.add(dummyElement, "bottom-right");

        assert.equal(dummyElement.parentNode, ui._bottomRight);
      });

    });

    bdd.it("removes components", function() {
      var component = new Component({
        id: "test",
        node: dummyElement
      });

      ui.add(component, "top-left");

      ui.remove(component);

      assert.lengthOf(ui._components, 0);
    });

    bdd.it("finds components by ID", function() {
      var component = new Component({
        id: "test",
        node: dummyElement
      });

      ui.add(component, "top-left");

      assert.equal(ui.find("test"), component);
    });

    bdd.it("finds components by component", function() {
      var component = new Component({
        node: dummyElement
      });

      ui.add(component, "top-left");

      assert.equal(ui.find(component), component);
    });

    bdd.it("finds components by node", function() {
      var component = new Component({
        node: dummyElement
      });

      ui.add(component, "top-left");

      assert.equal(ui.find(dummyElement), component);
    });

    bdd.it("finds components by widget", function() {
      var placeAtStub = domConstruct.place.bind(null, dummyElement);
      var fakeWidget = {
        domNode: dummyElement,
        placeAt: placeAtStub
      };

      var component = new Component({
        node: fakeWidget
      });

      ui.add(component, "bottom-left");

      assert.equal(ui.find(fakeWidget), component);
    });

  });

});

