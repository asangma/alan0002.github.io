/**
 * Use this widget to show a text string at a point on the view.
 * @module esri/widgets/Message
 */

define([
  "./Widget",
  "../core/watchUtils",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-style"
], function (
  Widget,
  watchUtils,
  domClass, domConstruct, domStyle
) {

  /**
   * Create the Message Widget
   * @constructor module:esri/widgets/Message
   * @param {Object} properties - properties for Message
   */

  var css = {
    message: "esri-message",
    visible: "esri-message-visible",
    text: "esri-message-text",
    messageStart: "esri-message-start"
  };

  return Widget.createSubclass({
    declaredClass: "esri.widgets.Message",

    baseClass: css.message,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function () {
      this._text = domConstruct.create("span", {
        className: css.text
      });
    },

    postCreate: function () {
      domConstruct.place(this._text, this.domNode);
    },

    destroy: function () {
      if (this._viewReady) {
        this._viewReady.cancel();
      }
      this.view = null;
      this.inherited(arguments);
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

    //----------------------------------
    //  text
    //----------------------------------

    /**
     * text.
     * Boolean
     * @type {String}
     * @default
     */
    text: "",

    _setTextAttr: {
      node: "_text",
      type: "innerText"
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
      domClass.remove(this.domNode, this.css.messageStart);
      if (this.visible && this.point) {
        if (this.view && this.view.ready) {
          this._positionNode(this.point);
          // timeout required to add class after removal is completed so animation can be triggered
          setTimeout(function () {
            domClass.add(this.domNode, this.css.messageStart);
          }.bind(this), 0);
        }
      } else {
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