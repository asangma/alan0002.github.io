/**
 * Provides a simple button that animates the {@link module:esri/views/View} to its 
 * initial {@link module:esri/Viewpoint} or a previously defined [viewpoint](#viewpoint) when clicked. By default this 
 * button looks like the following: ![home-button](../assets/img/apiref/widgets/widgets-home.png)
 * 
 * @module esri/widgets/Home
 * @since 4.0
 *        
 * @example 
 * var homeBtn = new Home({
 *   view: view   //attaches the Home button to the view 
 * }, "homediv");  //references the DOM node used to place the widget
 * //startup() must be called to start the widget
 * homeBtn.startup(); 
 */
define(
[
  "./Widget",

  "dijit/_TemplatedMixin",
  "dijit/a11yclick",

  "dojo/dom-class",
  "dojo/on",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./Home/templates/Home.html"
],
function (
  Widget,
  _TemplatedMixin, a11yclick,
  domClass, on,
  i18n,
  template
) {

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Home
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string | Node} srcNodeRef - Reference or id of the HTML node in which this widget renders.                              
   */      
  var Home = Widget.createSubclass([_TemplatedMixin], 
  /** @lends module:esri/widgets/Home.prototype */                                 
  {

    declaredClass: "esri.widgets.Home",

    templateString: template,

    css: {
      root: "esri-home",
      text: "esri-icon-font-fallback-text",
      container: "esri-container",
      homeIcon: "esri-icon esri-icon-home",
      loadingIcon: "esri-rotating esri-icon-loading-indicator"
    },

    _i18n: i18n.widgets.home,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    postCreate: function() {
      this.inherited(arguments);

      this.own(
        on(this._homeNode, a11yclick, this.goHome.bind(this))
      );
    },
  
    startup: function() {
      this.inherited(arguments);

      this.set("loaded", true);
      this.emit("load");
    },

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  view
    //----------------------------------

    /**
    * The view associated with the widget.
    * 
    * @type {module:esri/views/MapView | module:esri/views/SceneView}
    */
    view: null,

    _setViewAttr: function(value) {
      this._set("view", value);

      this._initialViewpoint = null;

      if (value) {
        value.then(function() {
          this._initialViewpoint = value.viewpoint.clone();
        }.bind(this));
      }
    },

    //----------------------------------
    //  viewpoint
    //----------------------------------

    /**
     * The {module:esri/Viewpoint}, or point of view, to zoom to when 
     * the Home button is clicked.
     *
     * @type {module:esri/Viewpoint}
     * @default null
     *
     * @example
     * //Creates a viewpoint centered on the extent of a polygon geometry
     * var vp = new Viewpoint({
     *   targetGeometry: geom.extent;
     * });
     * 
     * //Sets the home widget's viewpoint to the Viewpoint based on a polygon geometry
     * home.set("viewpoint", vp);
     */
    viewpoint: null,

    _getViewpointAttr: function() {
      return this.viewpoint || this._initialViewpoint;
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _initialViewpoint: null,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Animates the view to the initial Viewpoint of the view or the value of [viewpoint](#viewpoint).
     */
    goHome: function() {
      if (!this.view) {
        return;
      }

      var viewpoint = this.get("viewpoint"),
          eventPayload = {
            viewpoint: viewpoint
          };

      this._showLoading();

      return this.view
        .animateTo(viewpoint)
        .then(function() {
            this.emit("home-set", eventPayload);
          }.bind(this),
          function(error) {
            eventPayload.error = error;
            this.emit("home-set", eventPayload);
          }.bind(this))
        .always(function() {
          this._hideLoading();
        }.bind(this));
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _showLoading: function() {
      domClass.add(this._homeIconNode, this.css.loadingIcon);
    },

    _hideLoading: function() {
      domClass.remove(this._homeIconNode, this.css.loadingIcon);
    }

  });

  return Home;

});
