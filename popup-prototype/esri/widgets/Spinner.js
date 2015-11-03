/**
 * A loading spinner that will attach and anchor to a map. Use this to show a loading animation at a specified map location.
 * @module esri/widgets/Spinner
 */

define([
  "./Widget",
  "../core/watchUtils",
  "dojo/i18n!../nls/jsapi",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-style"
], function (
  Widget,
  watchUtils,
  i18n,
  domClass, domConstruct, domStyle
) {

  /**
   * Create the Spinner Widget
   * @constructor module:esri/widgets/Spinner
   * @param {Object} properties - properties for Spinner
   */

  var css = {
    spinner: "esri-spinner",
    text: "esri-spinner-text",
    visible: "esri-spinner-visible",
    spinnerStart: "esri-spinner-start",
    spinnerFinish: "esri-spinner-finish"
  };

  return Widget.createSubclass([], {

    declaredClass: "esri.widgets.Spinner",

    baseClass: css.spinner,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    destroy: function () {
      if (this._viewReady) {
        this._viewReady.cancel();
      }
      this.view = null;
      this.inherited(arguments);
    },

    postCreate: function () {
      domConstruct.create("div", {
        className: css.text,
        innerHTML: i18n.widgets.spinner.searching
      }, this.domNode);
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    css: css,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  view
    //----------------------------------

    /**
     * view.
     * View
     * @type {View}
     * @default
     */
    view: null,

    _setViewAttr: function (newVal) {
      this._set("view", newVal);
      this._viewChange();
    },

    //----------------------------------
    //  point
    //----------------------------------

    /**
     * point.
     * Point
     * @type {Point}
     * @default
     */
    point: null,

    _setPointAttr: function (newVal) {
      this._set("point", newVal);
      this._pointChange();
      this._viewWatchChange();
    },

    //----------------------------------
    //  visible
    //----------------------------------

    /**
     * visible.
     * Boolean
     * @type {Boolean}
     * @default
     */
    visible: false,

    _setVisibleAttr: function (newVal) {
      this._set("visible", newVal);
      this._visibleChange();
      this._viewWatchChange();
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _visibleChange: function () {
      domClass.toggle(this.domNode, this.css.visible, this.visible);
    },

    _viewWatchChange: function () {
      if (this._viewWatch) {
        if (this.visible && this.point) {
          this._viewWatch.resume();
        } else {
          this._viewWatch.pause();
        }
      }
    },

    _pointChange: function () {
      if (this.visible && this.point) {
        domClass.remove(this.domNode, this.css.spinnerStart);
        domClass.remove(this.domNode, this.css.spinnerFinish);
        if (this.view && this.view.ready) {
          this._positionNode(this.point);
          // timeout required to add class after removal is completed so animation can be triggered
          setTimeout(function () {
            domClass.add(this.domNode, this.css.spinnerStart);
          }.bind(this), 0);
        }
        // noop. Don't do anything if the point is not the mapPoint
      } else if (this.visible && !this.point) {
        domClass.add(this.domNode, this.css.spinnerFinish);
      } else {
        domClass.remove(this.domNode, this.css.spinnerStart);
        domClass.remove(this.domNode, this.css.spinnerFinish);
        this._unpositionNode();
      }
    },

    _viewMoved: function () {
      var point = this.point;
      if (point) {
        this._positionNode(point);
      }
    },

    _positionNode: function (point) {
      var screenPoint = this.view.toScreen(point.x, point.y);
      if (screenPoint) {
        domStyle.set(this.domNode, {
          left: screenPoint.x + "px",
          top: screenPoint.y + "px"
        });
      }
    },

    _unpositionNode: function () {
      domStyle.set(this.domNode, {
        left: "",
        top: ""
      });
    },

    _viewChange: function () {
      if (this._viewWatch) {
        this._viewWatch.remove();
      }
      if (this._viewReady) {
        this._viewReady.cancel();
      }
      if (this.view) {
        this._viewReady = this.view.then(function () {
          var viewWatchProp = "viewpoint";
          if (this.view.type === "3d") {
            viewWatchProp = "camera";
          }
          this._viewWatch = watchUtils.pausable(this.view, viewWatchProp, this._viewMoved.bind(this));
          this._viewWatchChange();
          this.own(this._viewWatch);
        }.bind(this));
      }
    }

  });
});