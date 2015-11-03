define([
  "dojo/dom-construct",

  "esri/views/SceneView",

  "intern!object",

  "intern/chai!assert"
],
function(
  domConstruct,
  SceneView,
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

    name: "esri/views/SceneView",

    beforeEach: function() {
      dummyContainer = domConstruct.create("div");
    },

    afterEach: function() {
      domConstruct.destroy(dummyContainer);
    },

    "UI": {

      "default components": function() {
        var view = new SceneView({
          container: dummyContainer
        });

        forceAccessorDispatch(view, view.ui, view.ui);

        var components = view.ui._components;
        var componentNames = components.map(function(component) {
          return component._widget.declaredClass;
        });

        assert.lengthOf(componentNames, 4);
        assert.includeMembers(componentNames, [
          "esri.widgets.Attribution",
          "esri.widgets.Compass",
          "esri.widgets.Logo",
          "esri.widgets.Zoom"
        ]);

        view.destroy();
      }
    }

  });

});
