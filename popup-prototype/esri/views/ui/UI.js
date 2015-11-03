define([
  "../../core/Accessor",
  "../../core/HandleRegistry",

  "./Component",

  "dojo/_base/lang",

  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-style"
],
function(
  Accessor, HandleRegistry,
  Component,
  lang,
  domClass, domConstruct, domStyle
) {

  var DEFAULT_PADDING = {
    top: "inherit",
    bottom: "inherit",
    left: "inherit",
    right: "inherit"
  };

  return Accessor.createSubclass({

    classMetadata: {
      properties: {
        computedPadding: {
          readOnly: true,
          dependsOn: ["padding", "view.padding"]
        },

        height: {
          readOnly: true,
          dependsOn: ["_height", "computedPadding"]
        },

        width: {
          readOnly: true,
          dependsOn: ["_width", "computedPadding"]
        }
      }
    },

    declaredClass: "esri.views.ui.UI",

    /**
     * Hash of CSS classes used by this widget
     * @type {Object}
     * @private
     */
    css: {
      ui: "esri-ui",
      corner: "esri-ui-corner",
      topLeft: "esri-ui-top-left",
      topRight: "esri-ui-top-right",
      bottomLeft: "esri-ui-bottom-left",
      bottomRight: "esri-ui-bottom-right"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._components = [];

      this._handles = new HandleRegistry();

      this._handles.add([
        this.watch("padding, view, view.padding, container",
          this._paddingRelatedWatcher.bind(this))
      ]);

      this._initCorners();
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        padding: DEFAULT_PADDING
      });
    },

    destroy: function() {
      this.container = null;

      this._components.forEach(function(component) {
        component.destroy();
      });
      this._components.length = 0;

      this._handles.destroy();
    },

    //--------------------------------------------------------------------------
    //
    //  Private Properties
    //
    //--------------------------------------------------------------------------

    _topLeft: null,
    _topRight: null,
    _bottomLeft: null,
    _bottomRight: null,

    _cornerLookup: null,

    _components: null,

    _handles: null,

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  container
    //----------------------------------

    /**
     * UI container
     * @type {HTMLElement}
     * @private
     */
    container: null,

    _containerSetter: function (container, oldContainer) {
      if (container === oldContainer) {
        return container;
      }

      if (container) {
        domClass.add(container, this.css.ui);

        this._attachCorners(container);
        this._applyPadding();
      }

      if (oldContainer) {
        domClass.remove(oldContainer, this.css.ui);
        domStyle.set(oldContainer, {
          top: "",
          bottom: "",
          left: "",
          right: ""
        });
        domConstruct.empty(oldContainer);
      }

      return container;
    },

    //----------------------------------
    //  computedPadding
    //----------------------------------

    /**
     * The computed padding that is applied to the UI.
     * @readonly
     * @private
     */
    _computedPaddingGetter: function(cache) {
      var computedPadding = cache || {};

      var padding = this.padding,
          view    = this.view;

      computedPadding.top = this._getSidePadding("top", padding, view);
      computedPadding.bottom = this._getSidePadding("bottom", padding, view);
      computedPadding.left = this._getSidePadding("left", padding, view);
      computedPadding.right = this._getSidePadding("right", padding, view);

      return computedPadding;
    },

    //----------------------------------
    //  height
    //----------------------------------

    /**
     * The height of the UI container.
     * @returns {number}
     * @private
     */
    _heightGetter: function() {
      var height = this._height || 0;

      if (height === 0) {
        return height;
      }

      var computedPadding = this.computedPadding,
          verticalPadding = computedPadding.top + computedPadding.bottom;

      return Math.max(height - verticalPadding, 0);
    },

    //----------------------------------
    //  padding
    //----------------------------------

    /**
     * Sets the padding for the UI.
     *
     * Value | Description
     * ------|------------
     * inherit | Use the same padding as the view
     * none | Do not use padding.
     * object | Use the padding (pixels) from each specified side. Any side that is missing will use "inherit"
     *
     * Supported shorthand values: "inherit" | "none".
     *
     * @default { left: "inherit", top: "inherit", right: "inherit", bottom: "inherit" }
     *
     * @type {(string|object)}
     * @private
     */
    _paddingSetter: function(padding) {

      // fill out short hand notation
      if (padding === "inherit" || padding === "none") {
        return {
          bottom: padding,
          top: padding,
          right: padding,
          left: padding
        };
      }

      return lang.mixin({}, DEFAULT_PADDING, padding);
    },

    //----------------------------------
    //  view
    //----------------------------------

    /**
     * The view passed along to the widgets. (required)
     * @type {(module:esri/views/SceneView|module:esri/views/MapView)}
     * @private
     */
    _viewSetter: function(view, oldView) {
      if (view === oldView) {
        return view;
      }

      this._handles.remove("ui-view");

      if (view) {
        this._handles.add([
          view.on("resize", function(size) {
            this.resize(size.width, size.height);
          }.bind(this))
        ], "ui-view");
      }

      return view;
    },

    //----------------------------------
    //  width
    //----------------------------------

    /**
     * The width of the UI container.
     * @returns {number}
     * @private
     */
    _widthGetter: function() {
      var width = this._width || 0;

      if (width === 0) {
        return width;
      }

      var computedPadding = this.computedPadding,
          horizontalPadding = computedPadding.left + computedPadding.right;

      return Math.max(width - horizontalPadding, 0);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Adds a component to the UI.
     * @param component {(HTMLElement|_WidgetBase)} – The component. (required)
     * @param position {string – Valid positions are "top-left", "top-right", "bottom-left", "bottom-right". (required)
     * @private
     */
    add: function(component, position) {
      // TODO: handle re-adding components.
      if (!component || !this._isValidPosition(position)) {
        return;
      }

      if (!component.isInstanceOf || !component.isInstanceOf(Component)) {
        component = new Component({
          node: component
        });
      }

      // using floats for the bottom-right corner prevents aligning components to the bottom
      var placement = position === "bottom-right" ? "first" : "last";

      this._place(component, this._cornerLookup[position], placement);

      this._components.push(component);
    },

    /**
     * Removes a component from the UI.
     * @param component {(HTMLElement|_WidgetBase)} – The component. (required)
     * @private
     */
    remove: function(component) {
      if (!component) {
        return;
      }

      var removalIndex = this._components.indexOf(this.find(component));

      if (removalIndex > -1) {
        this._components.splice(removalIndex, 1);
      }
    },

    /**
     * Notify the UI that it should resize.
     * @param width {Number}
     * @param height {Number}
     * @private
     */
    resize: function(width, height) {
      this._width = width;
      this._height = height;

      this._applyPadding();
    },

    /**
     * Find a component.
     * @param component {(HTMLElement|string)}
     * @returns {Component} if found, null otherwise
     * @private
     */
    find: function(component) {
      if (!component) {
        return null;
      }

      if (component.isInstanceOf && component.isInstanceOf(Component)) {
        return this._findByComponent(component);
      }

      if (typeof component === "string") {
        return this._findById(component);
      }

      return this._findByNode(component.domNode || component);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _attachCorners: function(container) {
      domConstruct.place(this._topLeft, container);
      domConstruct.place(this._topRight, container);
      domConstruct.place(this._bottomLeft, container);
      domConstruct.place(this._bottomRight, container);
    },

    _initCorners: function() {
      // TODO: create corners on demand
      var topLeft, topRight, bottomLeft, bottomRight;

      topLeft = domConstruct.create("div", {
        className: this.css.topLeft + " " + this.css.corner
      });

      topRight = domConstruct.create("div", {
        className: this.css.topRight + " " + this.css.corner
      });

      bottomLeft = domConstruct.create("div", {
        className: this.css.bottomLeft + " " + this.css.corner
      });

      bottomRight = domConstruct.create("div", {
        className: this.css.bottomRight + " " + this.css.corner
      });

      this._topLeft = topLeft;
      this._topRight = topRight;
      this._bottomLeft = bottomLeft;
      this._bottomRight = bottomRight;

      this._cornerLookup = {
        "top-left": topLeft,
        "top-right": topRight,
        "bottom-left": bottomLeft,
        "bottom-right": bottomRight
      };
    },

    _isValidPosition: function (position) {
      return !!this._cornerLookup[position];
    },

    /**
     * Used to place component into a container.
     * @see http://dojotoolkit.org/reference-guide/1.10/dojo/dom-construct.html#place
     * @private
     */
    _place: function(component, container, position) {
      if (component._widget) {
        component._widget.placeAt(container, position);
        return;
      }

      domConstruct.place(component.node, container, position);
    },

    _paddingRelatedWatcher: function () {
      this._applyPadding();
    },

    _applyPadding: function() {
      var container = this.container,
          padding;

      if (!container) {
        return;
      }

      padding = this.computedPadding;

      domStyle.set(container, {
        top: this._toPxUnit(padding.top),
        bottom: this._toPxUnit(padding.bottom),
        left: this._toPxUnit(padding.left),
        right: this._toPxUnit(padding.right)
      });
    },

    _toPxUnit: function(value) {
      return value > 0 ? value + "px" : value;
    },

    _getSidePadding: function(side, uiPadding, view) {
      var viewSidePadding = (view && view.padding && view.padding[side]) || 0,
          uiSidePadding = uiPadding[side];

      return uiSidePadding === "inherit" ? viewSidePadding :
             uiSidePadding === 0 || uiSidePadding === "none" ? 0 :
             uiSidePadding;
    },

    /**
     * Find a component by reference.
     * @param component {Component}
     * @returns {Component} if found, null otherwise
     * @private
     */
    _findByComponent: function(component) {
      var match = null,
          found;

      this._components.some(function(comp) {
        found = comp === component;

        if (found) {
          match = comp;
        }

        return found;
      });

      return match;
    },

    /**
     * Find a component by ID.
     * @param id {string}
     * @returns {Component} if found, null otherwise
     * @private
     */
    _findById: function(id) {
      var match = null,
          found;

      this._components.some(function(component) {
        found = component.id === id;

        if (found) {
          match = component;
        }

        return found;
      });

      return match;
    },

    /**
     * Find a component by Node.
     * @param node {HTMLElement}
     * @returns {Component} if found, null otherwise
     * @private
     */
    _findByNode: function(node) {
      var match = null,
          found;

      this._components.some(function(component) {
        found = component.node === node;

        if (found) {
          match = component;
        }

        return found;
      });

      return match;
    }

  });

});
