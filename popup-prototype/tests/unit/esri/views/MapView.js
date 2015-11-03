define([
  "dojo/dom-construct",

  "esri/views/MapView",

  "intern!object",

  "intern/chai!assert"
],
function(
  domConstruct,
  MapView,
  registerSuite,
  assert
) {

  var dummyContainer;

  function forceAccessorDispatch() {
    Array.prototype.slice.call(arguments).forEach(function(accessor) {
      accessor._accessorProps.dispatch();
    });
  }

  registerSuite({

    name: "esri/views/MapView",

    beforeEach: function() {
      dummyContainer = domConstruct.create("div");
    },

    afterEach: function() {
      domConstruct.destroy(dummyContainer);
    },

    "UI": {

      "default components": function() {
        var view = new MapView({
          container: dummyContainer
        });

        forceAccessorDispatch(view, view.ui, view.ui);

        var components = view.ui._components;
        var componentNames = components.map(function(component) {
          return component._widget.declaredClass;
        });

        assert.lengthOf(componentNames, 3);
        assert.includeMembers(componentNames, [
          "esri.widgets.Attribution",
          "esri.widgets.Logo",
          "esri.widgets.Zoom"
        ]);

        view.destroy();
      }
    }

  });

});
