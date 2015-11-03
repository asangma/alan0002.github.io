define([
  "dojo/dom-construct",

  "esri/views/ui/DefaultUI",

  "esri/views/View",

  "esri/widgets/Popup",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  domConstruct,
  DefaultUI,
  View,
  Popup,
  registerSuite,
  assert,
  sinon
) {

  var view,
      dummyContainer;

  function forceAccessorDispatch(accessor) {
    accessor._accessorProps.dispatch();
  }

  function destroyAccessorSafely(accessor) {
    if (accessor && accessor._accessorProps) {
      accessor.destroy();
    }
  }

  registerSuite({

    name: "esri/views/View",

    beforeEach: function() {
      dummyContainer = domConstruct.create("div");
    },

    afterEach: function() {
      destroyAccessorSafely(view);
      domConstruct.destroy(dummyContainer);
    },

    "popup": {

      "created by default": function() {
        view = new View({
          container: dummyContainer
        });

        assert.instanceOf(view.popup, Popup);
      },

      "can be set during initialization": function() {
        var popup = new Popup();
        popup.startup();

        view = new View({
          container: dummyContainer,
          popup: popup
        });

        assert.equal(view.popup, popup);
      },

      "started-up if needed": function() {
        var popup = new Popup();

        view = new View({
          container: dummyContainer,
          popup: popup
        });

        assert.isTrue(popup._started);
      },

      "placed in the root": function() {
        var popup = new Popup();

        view = new View({
          container: dummyContainer,
          popup: popup
        });

        assert.equal(popup.domNode.parentNode, view.root);
      },

      "orphan when view's container is null": function() {
        var popup = new Popup();
        var otherDummyContainer = domConstruct.create("div");

        view = new View({
          container: dummyContainer,
          popup: popup
        });
        forceAccessorDispatch(view);

        assert.equal(popup.domNode.parentNode, view.root);

        view.container = otherDummyContainer;
        forceAccessorDispatch(view);

        assert.equal(popup.domNode.parentNode, view.root);

        view.container = null;
        forceAccessorDispatch(view);

        assert.isNull(popup.domNode.parentNode);
      },

      "honors external DOM placement": function() {
        var externalParent = domConstruct.create("div");
        var anotherContainer = domConstruct.create("div");

        var popup = (new Popup()).placeAt(externalParent);
        var popupNode = popup.domNode;

        view = new View({
          container: dummyContainer,
          popup: popup
        });
        forceAccessorDispatch(view);

        assert.notEqual(popupNode.parentNode, dummyContainer);
        assert.equal(popupNode.parentNode, externalParent);

        view.container = anotherContainer;
        forceAccessorDispatch(view);

        assert.notEqual(popupNode.parentNode, dummyContainer);
        assert.notEqual(popupNode.parentNode, anotherContainer);
        assert.equal(popupNode.parentNode, externalParent);

        view.container = null;
        forceAccessorDispatch(view);

        assert.notEqual(popupNode.parentNode, dummyContainer);
        assert.notEqual(popupNode.parentNode, anotherContainer);
        assert.equal(popupNode.parentNode, externalParent);
      },

      "destroyed with the view": function() {
        var popup = new Popup();

        view = new View({
          container: dummyContainer,
          popup: popup
        });

        view.destroy();

        assert.isTrue(popup._destroyed);
      }

    },

    "UI": {

      "enabled by default": function() {
        view = new View({
          container: dummyContainer
        });

        forceAccessorDispatch(view.ui);

        assert.instanceOf(view.ui, DefaultUI);
        assert.equal(view.ui.view, view);
        assert.lengthOf(view.ui._components, 4);
      },

      "is destroyed along with the view": function() {
        view = new View({
          container: dummyContainer
        });

        forceAccessorDispatch(view.ui);

        var uiDestroySpy = sinon.spy(view.ui, "destroy");

        view.destroy();

        assert.isTrue(uiDestroySpy.calledOnce);
      },

      "components can be toggled": function() {
        view = new View({
          container: dummyContainer,
          ui: {
            components: ["zoom", "attribution"]
          }
        });

        forceAccessorDispatch(view.ui);

        assert.lengthOf(view.ui._components, 2);

        view.ui.components = [];

        forceAccessorDispatch(view.ui);

        assert.lengthOf(view.ui._components, 0);

        view.ui.components = ["zoom", "attribution", "logo", "compass"];

        forceAccessorDispatch(view.ui);

        assert.lengthOf(view.ui._components, 4);

        view.ui.components = ["attribution", "logo", "compass"];

        forceAccessorDispatch(view.ui);

        assert.lengthOf(view.ui._components, 3);

        view.ui.components = ["compass"];

        forceAccessorDispatch(view.ui);

        assert.lengthOf(view.ui._components, 1);
      },

      "can set padding": function() {
        view = new View({
          container: dummyContainer
        });

        view.ui.padding = "none";

        forceAccessorDispatch(view.ui);

        assert.deepEqual(view.ui.padding, {
          top: "none",
          bottom: "none",
          left: "none",
          right: "none"
        });

        view.ui.padding = "inherit";

        forceAccessorDispatch(view.ui);

        assert.deepEqual(view.ui.padding, {
          top: "inherit",
          bottom: "inherit",
          left: "inherit",
          right: "inherit"
        });

        view.ui.padding = {
          top: 10,
          bottom: 0,
          left: 5,
          right: 30
        };

        forceAccessorDispatch(view.ui);

        assert.deepEqual(view.ui.padding, {
          top: 10,
          bottom: 0,
          left: 5,
          right: 30
        });
      }
    },

    "CSS Traits": {

      "enabled by default": function() {
        view = new View();

        assert.isTrue(view.cssTraits.enabled);
      }
    }

  });

});

