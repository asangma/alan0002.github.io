/**
 * The Compass widget indicates where north is in relation to the current map rotation
 * or {@link module:esri/Camera#heading camera heading}. Additionally, it allows you
 * to quickly rotate the map view to the north. When using the Compass widget in 3D,
 * the compass image will tilt in relation to the approximate camera tilt of the view.
 * 
 * To set the current view to point to north, simply click anywhere on the widget and the view will
 * immediatly point to north. When working in a {@link module:esri/views/SceneView SceneView}
 * where tilt is considered, you may
 * click the bottom of the compass to reset the tilt to 90 degrees (staring straight down at 
 * the ground). This functionality is only avialable when the compass is already opinting to the north.
 * 
 * To add the compass widget to your application. Add a new `<div>` inside the view container and give 
 * it a unique ID. Set the CSS for the compass `<div>` element, create the widget in JavaScript and 
 * add the desired view to the `view` property. See sample below:
 * 
 * ```
 * require(["esri/views/SceneView", "esri/widgets/Compass", ... ], 
 *   function(SceneView, Compass, ... ) {
 *   
 *   view = new SceneView({
 *      container: "viewDiv",
 *      map: map
 *   });
 *    
 *   var compass = new Compass({
 *     view: view
 *   }, "compassDiv");
 *   compass.startup();
 *    
 * });
 * ```
 *
 * @module esri/widgets/Compass
 * @since 4.0
 * @see [Compass.css](css/source-code/esri/widgets/Compass/css/Compass.css)
 * @see [Sample - Adding the Compass widget to a MapView](../sample-code/2d/compass2d/)
 * @see module:esri/views/MapView
 * @see module:esri/views/SceneView
 * @see module:esri/Camera
 */
define(
[
  "../core/watchUtils",

  "./Widget",

  "dijit/_TemplatedMixin",
  "dijit/a11yclick",

  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-style",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./Compass/templates/Compass.html"
],
function(
  watchUtils,
  Widget,
  TemplatedMixin, a11yclick,
  domAttr, domClass, domStyle,
  i18n,
  template
) {

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Compass
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string} srcNodeRef - Reference or id of the HTML element in which this widget renders.                              
   */
  return Widget.createSubclass([TemplatedMixin],
  /** @lends module:esri/widgets/Compass.prototype */
  {

    declaredClass: "esri.widgets.Compass",

    baseClass: "esri-compass",

    templateString: template,

    /**
     * Hash of CSS classes used by this widget
     * @type {Object}
     * @private
     */
    css: {
      disabled: "esri-disabled",
      container: "esri-compass-container",
      interactive: "esri-interactive",
      isWebMercator: "esri-compass-is-web-mercator",
      rotationIcon: "esri-compass-icon-rotation",
      northIcon: "esri-compass-icon-north",
      compassIcon: "esri-compass-icon"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._handleClick = this._handleClick.bind(this);
      this._updateForCamera = this._updateForCamera.bind(this);
      this._updateForRotation = this._updateForRotation.bind(this);
      this._checkSpatialReference = this._checkSpatialReference.bind(this);
      this._handleReadyChange = this._handleReadyChange.bind(this);

      this._i18n = i18n.widgets.compass;
    },

    postCreate: function() {
      this.inherited(arguments);

      this.on(a11yclick, this._handleClick);
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _rotationWatcher: null,

    _srWatcher: null,

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  view
    //----------------------------------

    /**
     * The view from which the compass will get and display camera 
     * {@link module:esri/Camera#heading heading} and {@link module:esri/Camera#tilt tilt}.
     * 
     * @type {module:esri/views/SceneView | module:esri/views/MapView}
     */
    view: null,

    _setViewAttr: function(value) {
      this._set("view", value);
      this._wireUp(value);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _wireUp: function(view) {
      this._removeWatcher(
        this._srWatcher,
        this._rotationWatcher,
        this._readyWatcher
      );

      if (!view) {
        domClass.add(this.domNode, this.css.disabled);
        return;
      }

      this._srWatcher = watchUtils.init(view, "map.spatialReference", this._checkSpatialReference);

      if (view.type === "2d") {
        this._rotationWatcher = watchUtils.init(view, "rotation", this._updateForRotation);
      }
      else {
        this._rotationWatcher = watchUtils.init(view, "camera", this._updateForCamera);
      }

      this._readyWatcher = watchUtils.init(view, "ready", this._handleReadyChange);

      this.own(
        this._srWatcher,
        this._rotationWatcher,
        this._readyWatcher
      );
    },

    _removeWatcher: function() {
      var watchers = Array.prototype.slice.call(arguments);

      watchers.forEach(function(watcher) {
        if (watcher) {
          watcher.remove();
        }
      });
    },

    _checkSpatialReference: function(spatialReference) {
      var sr = spatialReference,
          canShowNorth = sr && (sr.isWebMercator() || sr.wkid === 4326);

      domClass.toggle(this.dap_container, this.css.isWebMercator, canShowNorth);
    },

    _applyRotation: function(axes) {
      var transform = "";

      if ("x" in axes) {
        transform += "rotateX(" + axes.x + "deg)";
      }

      if ("y" in axes) {
        transform += "rotateY(" + axes.y + "deg)";
      }

      if ("z" in axes) {
        transform += "rotateZ(" + axes.z + "deg)";
      }

      domStyle.set(this.dap_icon, {
        transform: transform,
        mozTransform: transform,
        webkitTransform: transform,
        oTransform: transform,
        msTransform: transform
      });
    },

    _updateForRotation: function(rotation) {
      if (rotation === undefined || rotation === null) {
        return;
      }

      this._applyRotation({
        z: rotation
      });
    },

    _updateForCamera: function(camera) {
      if (!camera) {
        return;
      }

      var heading = -camera.heading;

      this._applyRotation({
        y: 0,
        z: heading
      });
    },

    //--------------------------------------------------------------------------
    //
    //  Event handlers
    //
    //--------------------------------------------------------------------------

    _handleClick: function() {
      var view = this.view;

      if (!view || !view.ready) {
        return;
      }

      if (view.type === "2d") {
        view.animateTo({
          rotation: 0
        });
      }
      else {
        view.animateTo({
          heading: 0,
          tilt: 0
        });
      }
    },

    _handleReadyChange: function(ready) {
      domClass.toggle(this.domNode, this.css.disabled, !ready);
      domClass.toggle(this.domNode, this.css.interactive, ready);

      if (ready) {
        domAttr.set(this.domNode, "tabindex", 0);
      }
      else {
        domAttr.remove(this.domNode, "tabindex");
      }
    }

  });

});
