/**
 * The Zoom widget allows users to zoom in/out within a view.
 * 
 * To add the zoom widget to your application. Add a new `<div>` inside the view container and give 
 * it a unique ID. Set the CSS for the zoom `<div>` element, create the widget in JavaScript and 
 * add the desired view to the `view` property. See sample below:
 * 
 * ```
 * require(["esri/views/MapView", "esri/widgets/Zoom", ... ], 
 *   function(MapView, Zoom, ... ) {
 *   
 *   view = new MapView({
 *      container: "viewDiv",
 *      map: map
 *   });
 *    
 *   var zoom = new Zoom({
 *     view: view,
 *    }, "zoomDiv");
 *   zoom.startup();
 *    
 * });
 * ```
 *
 * @module esri/widgets/Zoom
 * @since 4.0
 * @see module:esri/views/MapView
 * @see module:esri/views/SceneView
 * @see [Zoom.css](css/source-code/esri/widgets/Zoom/css/Zoom.css)
 */
define([
  "../core/sniff",
  "../core/watchUtils",

  "./Widget",

  "dijit/_TemplatedMixin",
  "dijit/a11yclick",

  "dojo/_base/event",

  "dojo/dom",
  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/on",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./Zoom/templates/Zoom.html"
],
function (
  has, watchUtils,
  Widget,
  TemplatedMixin, a11yclick,
  event,
  dom, domClass, domAttr, on,
  nlsJsapi,
  template
) {

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Zoom
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string} srcNodeRef - Reference or id of the HTML element in which this widget renders.                               
   */
  var Zoom = Widget.createSubclass([TemplatedMixin],
  /** @lends module:esri/widgets/Zoom.prototype */
  {
    declaredClass: "esri.widgets.Zoom",

    baseClass: "esri-zoom",

    templateString: template,

    labels: nlsJsapi.widgets.zoom,

    /**
     * Hash of CSS classes used by this widget
     * @type {Object}
     * @private
     */
    css: {
      button: "esri-button",
      disabled: "esri-disabled",
      interactive: "esri-interactive",
      iconText: "esri-icon-font-fallback-text",
      zoomIn: "esri-zoom-in",
      zoomInIcon: "esri-icon-plus",
      zoomOut: "esri-zoom-out",
      zoomOutIcon: "esri-icon-minus"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._handleZoomInClick = this._handleZoomInClick.bind(this);
      this._handleZoomOutClick = this._handleZoomOutClick.bind(this);
      this._handleReadyChange = this._handleReadyChange.bind(this);
    },

    buildRendering: function() {
      this.inherited(arguments);

      if (!has("css-user-select")) {
        dom.setSelectable(this.domNode, false);
      }
    },

    startup: function() {
      this.inherited(arguments);

      this.own(
        on(this.dap_zoomIn, a11yclick, this._handleZoomInClick),
        on(this.dap_zoomOut, a11yclick, this._handleZoomOutClick)
      );
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _readyWatcher: null,

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  view
    //----------------------------------

    /**
     * The view from which the Zoom widget will operate.
     * @type {(module:esri/views/SceneView|module:esri/views/MapView)}
     */
    view: null,

    _setViewAttr: function(value) {
      if (this._readyWatcher) {
        this._readyWatcher.remove();
      }

      if (!value) {
        domClass.add(this.domNode, this.css.disabled);
      }
      else {
        this._readyWatcher = watchUtils.init(value, "ready", this._handleReadyChange);
        this.own(this._readyWatcher);
      }

      this._set("view", value);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _zoomOut: function() {
      this._zoomToFactor(2);
    },

    _zoomIn: function() {
      this._zoomToFactor(0.5);
    },

    _zoomToFactor: function(factor) {
      var view = this.view;
      if (!view || !view.ready) {
        return;
      }

      view.animateTo({
        scale: view.scale * factor
      });
    },

    //--------------------------------------------------------------------------
    //
    //  Event handlers
    //
    //--------------------------------------------------------------------------

    _handleReadyChange: function(ready) {
      if (ready) {
        domAttr.set(this.dap_zoomIn, "tabindex", 0);
        domAttr.set(this.dap_zoomOut, "tabindex", 0);

        domClass.add(this.dap_zoomIn, this.css.interactive);
        domClass.add(this.dap_zoomOut, this.css.interactive);
      }
      else {
        domAttr.remove(this.dap_zoomIn, "tabindex");
        domAttr.remove(this.dap_zoomOut, "tabindex");

        domClass.remove(this.dap_zoomIn, this.css.interactive);
        domClass.remove(this.dap_zoomOut, this.css.interactive);
      }

      domClass.toggle(this.domNode, this.css.disabled, !ready);
    },

    _handleZoomInClick: function(e) {
      event.stop(e);
      this._zoomIn();
    },

    _handleZoomOutClick: function(e) {
      event.stop(e);
      this._zoomOut();
    }

  });

  return Zoom;
});
