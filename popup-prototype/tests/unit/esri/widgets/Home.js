define([
  "dojo/Deferred",
  "dojo/keys",
  "dojo/on",

  "esri/widgets/Home",

  "intern!object",

  "intern/chai!assert",

  "intern/order!sinon"
],
function(
  Deferred, keys, on,
  Home,
  registerSuite,
  assert,
  sinon
) {

  var home,
      goHomeSpy;

  function createFakeView() {
    var def = new Deferred();
    def.resolve();

    return {
      ready: true,
      viewpoint: "fakeViewpoint",
      then: def.then,
      animateTo: def.then
    };
  }

  /**
   * @see https://github.com/dojo/dijit/blob/master/a11yclick.js (keyup & keydown handlers)
   * @private
   */
  function simulateA11yclickKeyPress(widget, node, key) {
    widget.placeAt(document.body);  // placed on document for bubbling to work

    // a11yclick expects a keydown & keyup (on the document) before emitting a synthetic click event
    // we also rely on bubbling since emit does not allow us to override the target

    on.emit(node, "keydown", {
      bubbles: true,
      keyCode: key
    });

    on.emit(node, "keyup", {
      bubbles: true,
      keyCode: key
    });
  }

  registerSuite({

    name: "esri/widgets/Home",

    beforeEach: function() {
      goHomeSpy = sinon.spy(Home.prototype, "goHome");

      home = new Home();
      home.startup();
    },

    afterEach: function() {
      goHomeSpy.restore();
      home.destroy();
    },

    "go home": {

      "when viewpoint specified": function() {
        var fakeView = createFakeView(),
            animationSpy = sinon.spy(fakeView, "animateTo"),
            eventSpy = sinon.spy(),
            firstCallArgs;

        home.set("view", fakeView);
        home.set("viewpoint", "anotherFakeViewpoint");
        home.on("home-set", eventSpy);

        home.goHome();

        assert.isTrue(animationSpy.calledOnce);
        assert.isTrue(animationSpy.calledWith("anotherFakeViewpoint"));

        firstCallArgs = eventSpy.args[0][0];

        assert.isTrue(eventSpy.calledOnce);
        assert.equal(firstCallArgs.viewpoint, "anotherFakeViewpoint");
      },

      "when extent not specified": function() {
        var fakeView = createFakeView(),
            animationSpy = sinon.spy(fakeView, "animateTo"),
            eventSpy = sinon.spy(),
            firstCallArgs;

        home.set("view", fakeView);
        home.on("home-set", eventSpy);

        home.goHome();

        assert.isTrue(animationSpy.calledOnce);
        assert.isTrue(animationSpy.calledWith("fakeViewpoint"));

        firstCallArgs = eventSpy.args[0][0];

        assert.isTrue(eventSpy.calledOnce);
        assert.equal(firstCallArgs.viewpoint, "fakeViewpoint");
      },

      "toggles loading animation": function() {
        var fakeView = createFakeView(),
            showLoaderSpy = sinon.spy(home, "_showLoading"),
            hideLoaderSpy = sinon.spy(home, "_hideLoading");

        home.set("view", fakeView);

        home.goHome();

        assert.isTrue(showLoaderSpy.calledOnce);
        assert.isTrue(hideLoaderSpy.calledOnce);
      },

      "when viewpoint cannot be set": function() {
        var fakeView = createFakeView(),
            animationDef = new Deferred(),
            eventSpy = sinon.spy(),
            firstCallArgs;

        animationDef.reject("oops!");
        fakeView.animateTo = animationDef.then;

        home.set("view", fakeView);
        home.on("home-set", eventSpy);

        home.goHome();

        firstCallArgs = eventSpy.args[0][0];

        assert.isTrue(eventSpy.calledOnce);
        assert.equal(firstCallArgs.viewpoint, "fakeViewpoint");
        assert.equal(firstCallArgs.error, "oops!");
      }

    },

    "keyboard navigation": function() {
      var fakeView = createFakeView();

      home.set("view", fakeView);

      simulateA11yclickKeyPress(home, home._homeNode, keys.ENTER);
      simulateA11yclickKeyPress(home, home._homeNode, keys.SPACE);

      assert.isTrue(goHomeSpy.calledTwice);
    },

    "disabled when view is not ready": function() {
      this.skip("pending");
    }

  });

});
