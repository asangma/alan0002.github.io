define([
  "../../core/watchUtils",

  "../../widgets/Attribution",
  "../../widgets/Compass",
  "../../widgets/Logo",
  "../../widgets/Zoom",

  "./Component",
  "./UI",

  "dojo/_base/lang"
],
function(
  watchUtils,
  Attribution, Compass, Logo, Zoom,
  Component, UI,
  lang
) {

  return UI.createSubclass({

    declaredClass: "esri.views.ui.DefaultUI",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._addComponents = this._addComponents.bind(this);
      this._componentsWatcher = this._componentsWatcher.bind(this);
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        components: ["logo", "attribution", "zoom", "compass"]
      });
    },

    initialize: function() {
      this._handles.add([
        watchUtils.whenOnce(this, "view", function() {

          this._handles.add([
            watchUtils.init(this, "components", this._componentsWatcher)
          ]);

        }.bind(this))
      ]);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Properties
    //
    //--------------------------------------------------------------------------

    _defaultPositionLookup: {
      attribution: "bottom-right",
      logo: "bottom-right",
      compass: "top-left",
      zoom: "top-left"
    },

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  components
    //----------------------------------

    _removeComponents: function(components) {
      components.forEach(function(name) {
        var component = this.find(name);

        if (component) {
          this.remove(component);
          component.destroy();
        }
      }, this);
    },

    /**
     * The components to add to the UI.
     * @type {(module:esri/views/SceneView|module:esri/views/MapView)}
     * @private
     */
    _componentsSetter: function(value, oldValue) {
      return value || [];
    },

    _viewSetter: function(view, oldView) {
      if (view === oldView) {
        return view;
      }

      this._updateViewAwareWidgets(view);

      return this.inherited(arguments);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    resize: function(width, height) {
      this.inherited(arguments);

      this._layout(width, height);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _updateViewAwareWidgets: function(view) {
      this.components.forEach(function(name) {
        var component = this.find(name);

        if (component && component._widget.hasOwnProperty("view")) {
          component._widget.set("view", view);
        }
      }, this);
    },

    _layout: function(width, height) {
      var attribution = this.find("attribution");
      if (attribution) {
        attribution._widget.set("maxWidth", width * 0.45);
      }

      var logo = this.find("logo");
      if (logo) {
        var isSmall = (width * height) < 250000;

        logo._widget.set("size", isSmall ? "small" : "medium");
      }
    },

    _componentsWatcher: function (value, oldValue) {
      this._removeComponents(oldValue);
      this._addComponents(value);
    },

    _addComponents: function(components) {
      if (!this._accessorProps.initialized) {
        return;
      }

      components.forEach(function(name) {
        this.add(this._createComponent(name),
                 this._defaultPositionLookup[name]);
      }, this);
    },

    _createComponent: function(name) {
      var widget = this._createWidget(name);

      if (widget) {
        return new Component({
          id: name,
          node: widget
        });
      }
    },

    _createWidget: function(name) {
      if (name === "attribution") {
        return this._createAttribution();
      }

      if (name === "compass") {
        return this._createCompass();
      }

      if (name === "logo") {
        return this._createLogo();
      }

      if (name === "zoom") {
        return this._createZoom();
      }
    },

    _createAttribution: function() {
      var attribution = new Attribution({
        view: this.view
      });

      attribution.startup();

      return attribution;
    },

    _createCompass: function() {
      var compass = new Compass({
        view: this.view
      });

      compass.startup();

      return compass;
    },

    _createLogo: function() {
      var logo = new Logo();

      logo.startup();

      return logo;
    },

    _createZoom: function() {
      var zoom = new Zoom({
        view: this.view
      });

      zoom.startup();

      return zoom;
    }

  });

});
