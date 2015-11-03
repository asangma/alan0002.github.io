define([
  "dojo/_base/lang",

  "esri/views/View",

  "esri/views/ui/DefaultUI",

  "intern!bdd",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  lang,
  View,
  DefaultUI,
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

  function forceAccessorDispatch() {
    Array.prototype.slice.call(arguments).forEach(function(accessor) {
      accessor._accessorProps.dispatch();
    });
  }

  bdd.describe("esri/views/ui/DefaultUI", function() {

    var ui;

    bdd.afterEach(function() {
      ui.destroy();
    });

    bdd.it("creates default components", function() {
      ui = new DefaultUI({
        view: new View()
      });

      forceAccessorDispatch(ui);

      assert.lengthOf(ui._components, 4);
    });

    bdd.it("allows creating subset of components", function() {
      ui = new DefaultUI({
        components: [
          "zoom",
          "logo"
        ],
        view: new View()
      });

      assert.lengthOf(ui._components, 2);
    });

    bdd.it("allows toggling components", function() {
      ui = new DefaultUI({
        view: new View()
      });

      assert.lengthOf(ui._components, 4);

      ui.components = [
        "zoom",
        "logo"
      ];

      forceAccessorDispatch(ui);

      assert.lengthOf(ui._components, 2);

      ui.components = [
        "attribution",
        "zoom",
        "logo"
      ];

      forceAccessorDispatch(ui);

      assert.lengthOf(ui._components, 3);
    });

    bdd.it("allows creating no components", function() {
      ui = new DefaultUI({
        components: []
      });

      assert.lengthOf(ui._components, 0);
    });

    bdd.it("creates components until the view is available", function() {
      ui = new DefaultUI();
      forceAccessorDispatch(ui);

      assert.lengthOf(ui._components, 0);

      ui.view = new View();
      forceAccessorDispatch(ui);

      assert.lengthOf(ui._components, 4);
    });

    bdd.it("lays out default components when resized", function() {
      var dummyView = new View();

      ui = new DefaultUI({
        view: dummyView,
        components: []
      });

      sinon.spy(ui, "_layout");

      dummyView.emit("resize", {
        width: 10,
        height: 20
      });

      // TODO: improve test

      assert.isTrue(ui._layout.calledOnce);
    });

    bdd.it("updates the view for widget-components when set", function() {
      var dummyView = new View();
      var viewAwareComponents = ["zoom", "attribution", "compass"];

      ui = new DefaultUI({
        components: viewAwareComponents
      });

      ui._components.forEach(function(component) {
        assert.isUndefined(component._widget.view);
      });

      ui.view = dummyView;

      ui._components.forEach(function(component) {
        assert.equal(component._widget.view, dummyView);
        assert.isDefined(component._widget.view);
      });
    });

  });

});

