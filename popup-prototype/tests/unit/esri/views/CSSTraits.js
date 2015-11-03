define([
  "dojo/_base/lang",

  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/Evented",

  "esri/views/CSSTraits",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  lang,
  domClass, domConstruct, Evented,
  CSSTraits,
  registerSuite,
  assert,
  sinon
) {

  var DEFAULT_VIEW_SIZE = [100, 100],

      FakeView = CSSTraits.createSubclass([Evented]),
      traits,
      fakeView;

  function createFakeView(props) {
    props = lang.mixin({
      container: domConstruct.create("div"),
      size: DEFAULT_VIEW_SIZE
    }, props);

    return new FakeView(props);
  }

  function forceAccessorDispatch() {
    Array.prototype.slice.call(arguments).forEach(function(accessor) {
      accessor._accessorProps.dispatch();
    });
  }

  registerSuite({

    name: "esri/views/CSSTraits",

    beforeEach: function() {
      //styleUpdateSpy = sinon.spy(CSSTraits._definition.prototype, "_applyClassNameChanges");
      fakeView = createFakeView();
      traits = fakeView.cssTraits;
    },

    afterEach: function() {
      //styleUpdateSpy.restore();

      if (fakeView.cssTraits._accessorProps) {
        fakeView.cssTraits.destroy();
      }

      domConstruct.destroy(fakeView);
      fakeView = null;
    },

    "recomputes traits when view dimensions change": function() {
      forceAccessorDispatch(fakeView, traits);

      assert.equal(traits.active.width, "xsmall");
      assert.equal(traits.active.orientation, "portrait");

      fakeView.size = [1200, 500];

      forceAccessorDispatch(fakeView, traits);

      assert.equal(traits.active.width, "large");
      assert.equal(traits.active.orientation, "landscape");
    },

    "avoids unnecessary class name updates": function() {
      var styleUpdateSpy = sinon.spy(traits.constructor.prototype, "_applyClassNameChanges");

      var xSmallAndPortraitSize = [400, 400];
      var xSmallAndLandscapeSize = [500, 400];

      // initial updates have been applied at this point

      fakeView.size = DEFAULT_VIEW_SIZE;
      forceAccessorDispatch(fakeView, traits);
      assert.isTrue(styleUpdateSpy.notCalled);

      fakeView.size = xSmallAndPortraitSize;
      forceAccessorDispatch(fakeView, traits);
      assert.isTrue(styleUpdateSpy.notCalled);

      fakeView.size = xSmallAndLandscapeSize;
      forceAccessorDispatch(fakeView, traits);
      assert.isTrue(styleUpdateSpy.calledOnce);

      styleUpdateSpy.restore();
    },

    "enabled by default": function() {
      assert.isTrue(traits.enabled);
    },

    "can be disabled on startup": function() {
      var view = createFakeView({
        cssTraits: {
          enabled: false
        }
      });

      forceAccessorDispatch(view);

      assert.equal(view.container.className, "");
      assert.isUndefined(view.cssTraits.active.width);
      assert.isUndefined(view.cssTraits.active.orientation);

      view.destroy();
    },

    "can be destroyed": function() {
      forceAccessorDispatch(fakeView, traits);

      traits.destroy();

      assert.equal(fakeView.container.className, "");
    },

    "maxWidths": {

      "defaults are protected": function() {
        var defaultMaxWidths = traits.maxWidths;

        traits.maxWidths = {};
        assert.deepEqual(defaultMaxWidths, traits.maxWidths);

        defaultMaxWidths.xsmall = 100;
        defaultMaxWidths.small = 100;
        defaultMaxWidths.medium = 100;
        defaultMaxWidths.large = 100;
        defaultMaxWidths.xlarge = 100;

        traits.maxWidths = {};
        assert.notDeepEqual(defaultMaxWidths, traits.maxWidths);
      },

      "can be overridden": function() {
        var originalMaxWidths = traits.maxWidths;

        var customMaxWidths = {
          xsmall: 100,
          small: 110,
          medium: 120,
          large: 130,
          xlarge: 140
        };

        traits.maxWidths = customMaxWidths;

        assert.notDeepEqual(traits.maxWidths, originalMaxWidths);
        assert.deepEqual(traits.maxWidths, customMaxWidths);
      },

      "unordered maxWidths are ignored": function() {
        var originalMaxWidths = traits.maxWidths;

        var invalidMaxWidths = {
          xsmall: 500,
          small: 200,
          medium: 300,
          large: 400,
          xlarge: 100
        };

        traits.maxWidths = invalidMaxWidths;

        assert.deepEqual(traits.maxWidths, originalMaxWidths);
      }

    },

    "applies CSS trait classes": {

      "orientation": function() {
        var contains = domClass.contains.bind(null, fakeView.container);

        var equalHeightAndWidth = [100, 100];
        var heightGreaterThanWidth = [100, 200];
        var widthGreaterThanHeight = [200, 100];

        fakeView.size = equalHeightAndWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-orientation-portrait"));

        fakeView.size = heightGreaterThanWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-orientation-portrait"));

        fakeView.size = widthGreaterThanHeight;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-orientation-landscape"));
      },

      "width": function() {
        var contains = domClass.contains.bind(null, fakeView.container);

        // test upper bounds
        var xSmallWidth = [544, 100];
        var smallWidth = [768, 100];
        var mediumWidth = [992, 100];
        var largeWidth = [1200, 100];
        var xLargeWidth = [1201, 100];

        fakeView.size = xSmallWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-width-xsmall"));
        assert.isTrue(contains("esri-view-width-smaller-than-small"));
        assert.isTrue(contains("esri-view-width-smaller-than-medium"));
        assert.isTrue(contains("esri-view-width-smaller-than-large"));
        assert.isTrue(contains("esri-view-width-smaller-than-xlarge"));

        fakeView.size = smallWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-width-small"));
        assert.isTrue(contains("esri-view-width-larger-than-xsmall"));
        assert.isTrue(contains("esri-view-width-smaller-than-medium"));
        assert.isTrue(contains("esri-view-width-smaller-than-large"));
        assert.isTrue(contains("esri-view-width-smaller-than-xlarge"));

        fakeView.size = mediumWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-width-medium"));
        assert.isTrue(contains("esri-view-width-larger-than-xsmall"));
        assert.isTrue(contains("esri-view-width-larger-than-small"));
        assert.isTrue(contains("esri-view-width-smaller-than-large"));
        assert.isTrue(contains("esri-view-width-smaller-than-xlarge"));

        fakeView.size = largeWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-width-large"));
        assert.isTrue(contains("esri-view-width-larger-than-xsmall"));
        assert.isTrue(contains("esri-view-width-larger-than-small"));
        assert.isTrue(contains("esri-view-width-larger-than-medium"));
        assert.isTrue(contains("esri-view-width-smaller-than-xlarge"));

        fakeView.size = xLargeWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.isTrue(contains("esri-view-width-xlarge"));
        assert.isTrue(contains("esri-view-width-larger-than-xsmall"));
        assert.isTrue(contains("esri-view-width-larger-than-small"));
        assert.isTrue(contains("esri-view-width-larger-than-medium"));
        assert.isTrue(contains("esri-view-width-larger-than-large"));
      }
    },

    "default rules": {

      "orientation": function() {
        var equalHeightAndWidth = [100, 100];
        var heightGreaterThanWidth = [100, 200];
        var widthGreaterThanHeight = [200, 100];

        fakeView.size = equalHeightAndWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.orientation, "portrait");

        fakeView.size = heightGreaterThanWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.orientation, "portrait");

        fakeView.size = widthGreaterThanHeight;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.orientation, "landscape");
      },

      "width": function() {
        // test upper bounds
        var xSmallWidth = [544, 100];
        var smallWidth = [768, 100];
        var mediumWidth = [992, 100];
        var largeWidth = [1200, 100];
        var xLargeWidth = [1201, 100];

        fakeView.size = xSmallWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.width, "xsmall");

        fakeView.size = smallWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.width, "small");

        fakeView.size = mediumWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.width, "medium");

        fakeView.size = largeWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.width, "large");

        fakeView.size = xLargeWidth;
        forceAccessorDispatch(fakeView, traits);
        assert.equal(traits.active.width, "xlarge");
      }

    }

  });

});

