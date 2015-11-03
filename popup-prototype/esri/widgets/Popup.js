/**
 * The popup widget allows users to view content from feature attributes. Popups enhance web applications 
 * by providing users with a simple way to interact with and view attributes in a layer. 
 * They play an important role in relaying information to the user, which improves the story-telling capabilities of the application.
 * 
 * All {@link module:esri/views/View Views} contain a default popup. 
 * This popup can display generic content, which is set in its [title](#title) and [content](#content) properties. 
 * When  content is set directly on the Popup instance it is not tied to a specific feature or layer.
 * 
 * [![popup-basic-example](../assets/img/apiref/widgets/popup-basic.png)](../../sample-code/sandbox/sandbox.html?sample=sample-code/source-code/2d/popup-basic/)
 * 
 * In the image above, the text "Reverse Geocode: [-116.2, 43.601]" is the popup's `title`. The remaining text is
 * its `content`. A dock button ![popup-dock-btn](../assets/img/apiref/widgets/popup-dock.png) may also be available in the 
 * top right corner of the popup. This allows the user to dock the popup to one of the sides or corners of the view.
 * The options for docking may be set in the [dockOptions](#dockOptions) property.
 *  
 * Popups can also contain [actions](#actions) that act like buttons, which when clicked execute a function defined by the developer. 
 * By default, every popup has a "Zoom in" action ![popupTemplate-zoom-action](../assets/img/apiref/widgets/popupTemplate-zoom-action.png) 
 * that allows users to zoom to the selected feature. See the [actions](#actions) property for information about
 * adding custom actions to a popup.
 * 
 * In most cases this module will not need to be loaded into your custom application because the view contains a default instance of popup. 
 * 
 * All properties in this class may be set via the constructor or the `set(<property name>, <value>)`
 * method. For example, to set the popup's content, you would write:
 * 
 * ```js
 * view.popup.set("content", "This is the <b>content</b> of the popup.");
 * ```
 * 
 * {@link module:esri/PopupTemplate} is closely related to Popup, but is more specific to {@link module:esri/layers/Layer layers} 
 * and {@link module:esri/Graphic graphics}. It allows you to define custom title and content templates based on the source of the
 * [selected feature](#selectedFeature). When a layer or a graphic has a defined PopupTemplate, the popup will dispay the content
 * defined in the PopupTemplate when the feature is clicked. The content may contain field values from the attributes of the 
 * [selected feature](#selectedFeature).
 * 
 * Custom PopupTemplates may also be assigned directly to a popup by setting {@link module:esri/Graphic graphics} on the
 * [features](#features) property. For more information about Popup and how it relates to {@link module:esri/PopupTemplate} 
 * see the examples listed below.
 * 
 * @module esri/widgets/Popup
 * @since 4.0
 * @see module:esri/PopupTemplate
 * @see [Popup.css](css/source-code/esri/widgets/Popup/css/Popup.css)     
 * @see {@link module:esri/views/View#popup View.popup}    
 * @see [Sample - Basic popup](../sample-code/2d/popup-basic/)     
 * @see [Sample - Popup template](../sample-code/2d/popup-template/)     
 * @see [Sample - Dock popup](../sample-code/2d/popup-docking/)
 * @see [Sample - Popup actions](../sample-code/2d/popup-actions/)       
 */

/**
 * Fires after the user clicks on an [action](#actions) inside a popup. This
 * event may be used to define a custom function to execute when particular
 * actions are clicked. See the example below for details of how this works.
 *
 * @event module:esri/widgets/Popup#action-click
 * @property {Object} action - The action clicked by the user. For a description
 *                    of this object and a specification of its properties, 
 *                    see the [actions](#actions) property of this class.
 * 
 * @see [Popup.actions](#actions)
 * @example 
 * //Defines an action to zoom out from the selected feature
 * var zoomOutAction = {
 *   //This text is displayed as a tooltip
 *   title: "Zoom out",
 *   //The ID used to reference this action in the event handler
 *   id: "zoom-out",
 *   //Sets the icon font used to style the action button
 *   className: "esri-icon-zoom-out-magnifying-glass"
 * };
 * //Adds the custom action to the popup.
 * view.popup.actions.push(zoomOutAction);
 * 
 * //Fires each time an action is clicked
 * view.popup.on("action-click", function(evt){
 *   //If the zoom-out action is clicked, then execute the following code
 *   if(evt.action.id === "zoom-out"){
 *     //the view zooms out two LODs on each click
 *     view.animateTo({
 *       center: view.center,
 *       zoom: view.zoom - 2
 *     });
 *   }
 * });
 */
define([

  "./Widget",

  "../core/watchUtils",

  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",

  "dijit/a11yclick",
  "dijit/_TemplatedMixin",

  "dojo/on",

  "../views/2d/viewpointUtils",

  "../geometry/support/mathUtils",
  "../geometry/support/webMercatorUtils",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./Popup/templates/Popup.html",

  "dojo/string",

  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/dom-geometry",
  "dojo/dom-style",

  "dojo/fx/easing",

  "./Popup/PopupRenderer",

  "./Spinner",
  "./Message"
], function (
  Widget,
  watchUtils,
  lang, array, kernel,
  a11yclick, _TemplatedMixin,
  on,
  viewpointUtils,
  mathUtils, webMercatorUtils,
  i18n,
  dijitTemplate,
  string,
  domClass, domAttr, domConstruct, domGeometry, domStyle,
  easing,
  PopupRenderer,
  ViewSpinner, ViewMessage
) {

  //--------------------------------------------------------------------------
  //
  //  Todo: Pending
  //
  //--------------------------------------------------------------------------

  // todo: go through and see what is possible with 3x.

  // note: click offset bug: https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2730
  // note: resize issue: https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2632
  // note: view ui padding option: https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/2677

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  // Check for RTL
  var _RTL = ["ar", "he"].some(function (locale) {
    return kernel.locale.indexOf(locale) !== -1;
  });

  var dockOptionDefaults = {
    autoDock: true,
    dockButtonEnabled: true,
    position: {
      portrait: "bottom",
      landscape: _RTL ? "left" : "right"
    },
    dockAtSize: {
      width: 480,
      height: 480
    }
  };

  var css = {
    root: "esri-popup",
    container: "esri-container",
    invisible: "esri-invisible",
    showDock: "esri-show-dock",
    showDockButton: "esri-show-dock-button",
    docked: "esri-docked",
    dockedLeft: "esri-docked-left",
    dockedRight: "esri-docked-right",
    dockedTop: "esri-docked-top",
    dockedBottom: "esri-docked-bottom",
    menuOpen: "esri-menu-open",
    background: "esri-background",
    shadow: "esri-shadow",
    main: "esri-main",
    header: "esri-popup-header",
    headerButtons: "esri-popup-header-buttons",
    body: "esri-popup-body",
    bodyContent: "esri-popup-content",
    showContent: "esri-show-content",
    footer: "esri-footer",
    title: "esri-title",
    showTitle: "esri-show-title",
    btn: "esri-button",
    icon: "esri-popup-icon",
    iconText: "esri-icon-font-fallback-text",
    close: "esri-close",
    closeIcon: "esri-close-icon esri-icon-close",
    collapseIcon: "esri-down-icon esri-icon-down",
    dockBtn: "esri-dock",
    dockIcon: "esri-dock-icon",
    dockIconTop: "esri-icon-maximize",
    dockIconBottom: "esri-icon-dock-bottom",
    dockIconLeft: "esri-icon-dock-left",
    dockIconRight: "esri-icon-dock-right",
    dockIconText: "esri-dock-text",
    undockIcon: "esri-undock-icon esri-icon-minimize",
    undockIconText: "esri-undock-text",
    actions: "esri-actions",
    action: "esri-action",
    actionImage: "esri-action-image",
    actionText: "esri-action-text",
    pagination: "esri-pagination",
    showPagination: "esri-show-pagination",
    pointer: "esri-pointer",
    previous: "esri-previous",
    previousIconLTR: "esri-previous-icon-ltr esri-icon-left-triangle-arrow",
    previousIconRTL: "esri-previous-icon-rtl esri-icon-right-triangle-arrow",
    next: "esri-next",
    nextIconLTR: "esri-next-icon-ltr esri-icon-right-triangle-arrow",
    nextIconRTL: "esri-next-icon-rtl esri-icon-left-triangle-arrow",
    pageMenu: "esri-page-menu",
    pageMenuViewport: "esri-page-menu-viewport",
    pageMenuHeader: "esri-page-menu-header",
    pageMenuInfo: "esri-page-menu-info",
    pageMenuNote: "esri-page-menu-note",
    pageMenuActions: "esri-page-menu-actions",
    pageMenuPointer: "esri-page-menu-pointer",
    pageMenuSelected: "esri-selected",
    pageMenuBtn: "esri-page-menu-button",
    pageMenuIcon: "esri-page-menu-icon esri-icon-layer-list",
    pageMenuNumber: "esri-page-menu-num",
    pageMenuTitle: "esri-page-menu-title",
    pageMenuCheckMark: "esri-page-menu-check-mark esri-icon-check-mark",
    pageText: "esri-page-text",
    zoomIcon: "esri-icon-zoom-in-magnifying-glass",
    top: "esri-top",
    bottom: "esri-bottom",
    left: "esri-left",
    right: "esri-right",
    hasPopupRenderer: "esri-has-popup-renderer",
    loading: "esri-loading",
    loadingContainer: "esri-loading-container",
    loadingIcon: "esri-rotating esri-icon-loading-indicator",
    clearfix: "esri-clearfix"
  };

  var zoomToAction = {
    id: "zoom-to",
    title: i18n.widgets.popup.zoom,
    className: css.zoomIcon,
    image: null
  };

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Popup
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string | Node} srcNodeRef - Reference or id of the HTML node in which this widget renders.                          
   */
  var Popup = Widget.createSubclass([_TemplatedMixin], /** @lends module:esri/widgets/Popup.prototype */ {

    declaredClass: "esri.widgets.Popup",

    templateString: dijitTemplate,

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _i18n: i18n.widgets.popup,

    _popupTemplateAction: "_popupTemplateAction",

    _hideActionsTextNum: 3,

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
     * The view associated with the Popup instance.
     * 
     * @type {module:esri/views/MapView | module:esri/views/SceneView}
     */
    view: null,

    _setViewAttr: function (newVal) {
      this._set("view", newVal);
      this._viewChange();
    },

    //----------------------------------
    //  features
    //----------------------------------

    /**
     * An array of features associated with the popup. Each graphic in this array must
     * have a valid {@link module:esri/PopupTemplate} set. They may share the same 
     * {@link module:esri/PopupTemplate} or have unique
     * {@link module:esri/PopupTemplate PopupTemplates} depending on their attributes. 
     * The [content](#content) and [title](#title)
     * of the poup is set based on the `content` and `title` properties of each graphic's respective
     * {@link module:esri/PopupTemplate}. 
     * 
     * When more than one graphic exists in this array, the current content of the 
     * Popup is set based on the value of the [selected feature](#selectedFeature).
     * 
     * This value is `null` if no features are associated with the popup.
     * 
     * @type {module:esri/Graphic[]}
     * @see [Sample - IdentifyTask](../sample-code/2d/tasks-identify/)              
     *             
     * @example 
     * //When setting the features property, the graphics pushed to this property
     * //must have a PopupTemplate set.
     * var g1 = new Graphic();
     * g1.popupTemplate = new PopupTemplate({
     *   title: "Results title",
     *   content: "Results: {ATTRIBUTE_NAME}"
     * });
     * //Set the graphics as an array to the popup instance. The content and title of
     * //the popup will be set depending on the PopupTemplate of the graphics.
     * //Each graphic may share the same PopupTemplate or have a unique PopupTemplate
     * var graphics = [g1, g2, g3, g4, g5];
     * view.popup.set("features", graphics);
     */
    features: null,

    _setFeaturesAttr: function (newVal) {
      if (this.closestFirst && this.location) {
        newVal = this._showClosestFirst(newVal, this.location);
      }
      this._set("features", newVal);
      this._setFeaturesChange();
    },

    //----------------------------------
    //  promises
    //----------------------------------

    /**
     * An array of pending Promises. Value is `null` if there are not any pending promises. 
     * When the pending promises are resolved they are removed from the array and the 
     * features they return will be pushed into the [features](#features) array.
     * 
     * @type {Promise[]}
     */
    promises: [],

    _setPromisesAttr: function (newVal) {
      // cancel any existing old promises
      var oldPromises = this.promises;
      if (oldPromises) {
        oldPromises.forEach(function (promise) {
          promise.cancel();
        });
      }
      this.set({
        features: [],
        pendingPromisesCount: 0,
        visible: false
      });
      this._set("promises", newVal);
      if (newVal && newVal.length) {
        this.set("pendingPromisesCount", newVal.length);
        // When selecting features in a feature collection, where
        // query operation is performed on the client, _updateFeatures
        // executes within the call to addCallback which ends up 
        // modifying the promises array and causing confusion in the
        // loop below by corrupting the positional index of promises
        // in the array. Let's create a new array and avoid this problem.
        newVal = newVal.slice(0);
        newVal.forEach(function (promise) {
          promise.always(function (features) {
            // don't deal with any cancelled promises
            if (!promise.isCanceled()) {
              var newCount = this.pendingPromisesCount - 1;
              this.set("pendingPromisesCount", newCount);
              this._updateFeatures(promise, features);
            }
          }.bind(this));
        }.bind(this));
      }
      // update change for message widget
      this._pendingPromisesCountChange();
    },

    //----------------------------------
    //  actions
    //----------------------------------

    /**
     * Defines actions or functions that may be executed by clicking the icon
     * or image symbolizing them in the popup. By default, every popup has a `zoom-to`
     * action styled with a magnifying glass icon 
     * ![popupTemplate-zoom-action](../assets/img/apiref/widgets/popupTemplate-zoom-action.png). 
     * When this icon is clicked, the view zooms in four LODs and centers on the selected feature.
     * 
     * You may override this action by removing it from the actions array or by setting the
     * {@link module:esri/PopupTemplate#overwriteActions overwriteActions} property to `true` in a
     * {@link module:esri/PopupTemplate}. The order of each action in the popup is the order in which
     * they appear in the array.
     * 
     * The [action-click](#event:action-click) event fires each time an action in the popup is clicked. 
     * This event should be used to execute custom code for each action clicked. For example, if you would
     * like to add a `zoom-out` action to the popup that zooms the view out several LODs, you would 
     * define the zoom-out code in a separate function. Then you would call the custom `zoom-out` function 
     * in the [action-click](#event:action-click) event handler. See the sample code 
     * snippet below for more details on how this works.
     * 
     * Actions are defined with the properties listed below.
     * 
     * @type {Object[]}
     * @see [Sample - Popup actions](../sample-code/2d/popup-actions/)               
     *              
     * @property {string} className - Adds a CSS class to the action's node. Can be used in conjunction 
     *                          with the `image` property or by itself. Any icon font may be used in this property. 
     *                          The icon fonts [listed here](http://esri.github.io/calcite-web/icons/#icon-font)
     *                          are automatically made available via the ArcGIS API for JavaScript for you to 
     *                          use in styling custom actions. To 
     *                          use one of these provided icon fonts, you must prefix the class name with `esri-`.
     *                          For example, the default `zoom-to` action uses the font `esri-icon-zoom-in-magnifying-glass`.
     * @property {string} image - The URL to an image that will be used to represent the action in the 
     *                          popup. This property will be used as a background image for the node. 
     *                          It may be used in conjunction with the `className` property or by itself.
     * @property {string} id - The name of the ID assigned to this action. This is used for
     *                        differentiating actions when listening to the 
     *                        [action-click](#event:action-click) event.
     * @property {string} title - The title of the action. When there are fewer than three actions
     *                        defined in a popup, this text is displayed to the right of the icon or image
     *                        representing the action. If there are three or more actions in the popup, then 
     *                        this text is used as a tooltip on the action.
     * 
     * @example 
     * //Defines an action to zoom out from the selected feature
     * var zoomOutAction = {
     *   //This text is displayed as a tooltip
     *   title: "Zoom out",
     *   //The ID by which to reference the action in the event handler
     *   id: "zoom-out",
     *   //Sets the icon font used to style the action button
     *   className: "esri-icon-zoom-out-magnifying-glass"
     * };
     * //Adds the custom action to the popup.
     * view.popup.actions.push(zoomOutAction);
     * 
     * //The function to execute when the zoom-out action is clicked
     * function zoomOut() {
     *   //in this case the view zooms out two LODs on each click
     *   view.animateTo({
     *     center: view.center,
     *     zoom: view.zoom - 2
     *   });
     * }
     * 
     * //This event fires for each click on any action
     * view.popup.on("action-click", function(evt){
     *   //If the zoom-out action is clicked, fire the zoomOut() function
     *   if(evt.action.id === "zoom-out"){
     *     zoomOut();
     *   }
     * });
     */
    actions: [zoomToAction],

    _setActionsAttr: function (newVal) {
      this._set("actions", newVal);
      this._actionsChange();
    },

    //----------------------------------
    //  visible
    //----------------------------------

    /**
     * Displays the popup in the view. The popup will only display if the view's size
     * constraints in [dockOptions](#dockOptions) are met or the [location](#location)
     * property is set to a geometry.
     * 
     * @type {Boolean}
     * @default false
     * @see [Sample - Basic Popup](../sample-code/2d/popup-basic/)              
     *              
     * @example 
     * //Sets the location of the popup to the center of the view
     * view.popup.set("location", view.center);
     * //Displays the popup
     * view.popup.set("visible", true);
     * 
     * @example 
     * //Sets the location of the popup to the location of a click on the view
     * view.on("click", function(evt){
     *   view.popup.set("location", evt.mapPoint);
     *   //Displays the popup
     *   view.popup.set("visible", true);
     * });
     * 
     * @example 
     * //Hides the popup from the view
     * view.popup.set("visible", false);
     */
    visible: false,

    _setVisibleAttr: function (value) {
      if (this._pendingPromiseResult()) {
        console.warn("Setting visible with promises will be ignored");
      } else {
        this._set("visible", value);
        domClass.toggle(this.domNode, css.invisible, !value);
        this._visibleChangeContent();
        this._viewWatchChange();
      }
    },

    //----------------------------------
    //  selectedIndex
    //----------------------------------

    /**
     * Index of the feature that is [selected](#selectedFeature). When [features](#features) are set, 
     * the first index is automatically selected.
     * 
     * @type {Number}
     */
    selectedIndex: null,

    _setSelectedIndexAttr: function (newVal) {
      if (isNaN(newVal)) {
        newVal = null;
      }
      this._set("selectedIndex", newVal);
      this._selectedIndexChange();
    },

    //----------------------------------
    //  zoomFactor
    //----------------------------------

    /**
     * Number of levels of detail (LOD) to zoom in on the [selected feature](#selectedFeature).
     * 
     * @type {Number}
     * @default
     * @example 
     * //Restricts the zooming to two LODS when the zoom in action is clicked.
     * view.popup.set("zoomFactor", 2);
     */
    zoomFactor: 4,

    //----------------------------------
    //  paginationEnabled
    //----------------------------------

    /**
     * Shows pagination for the popup if available. This allows the user to 
     * scroll through various [selected features](#features) using either
     * arrows 
     * 
     * ![popup-pagination-arrows](../assets/img/apiref/widgets/popup-pagination-arrows.png)
     * 
     * or a menu.
     * 
     * ![popup-pagination-menu](../assets/img/apiref/widgets/popup-pagination-menu.png)
     * 
     * @type {Boolean}
     * @default
     * @see [Sample - IdentifyTask](../sample-code/2d/tasks-identify/) 
     */
    paginationEnabled: true,

    _setPaginationEnabledAttr: function (newVal) {
      this._set("paginationEnabled", newVal);
      this._paginationChange();
    },

    //----------------------------------
    //  alignment
    //----------------------------------

    /**
     * Position of the popup in relation to the selected feature.
     * 
     * Possible Value | Description
     * ---------------|------------
     * top | ![popup-pagination-menu](../assets/img/apiref/widgets/popup-alignment-top.png)
     * bottom | ![popup-pagination-menu](../assets/img/apiref/widgets/popup-alignment-bottom.png)
     * left | ![popup-pagination-menu](../assets/img/apiref/widgets/popup-alignment-left.png)
     * right | ![popup-pagination-menu](../assets/img/apiref/widgets/popup-alignment-right.png)
     * 
     * @type {String}
     * @default
     * @ignore
     * 
     * @example 
     * //The popup will display to the left of the feature
     * view.popup.set("alignment", "left");
     */
    alignment: "top",

    _setAlignmentAttr: function (newVal) {
      this._set("alignment", newVal);
      this._locationChange();
    },

    //----------------------------------
    //  animationOptions
    //----------------------------------

    /**
     * Animation easing options. This determines the way in which the view zooms
     * when zooming to a selected feature.
     * 
     * @type {Object}
     * @ignore             
     *             
     * @property {number} duration - Duration of the animation in milliseconds.
     * @property {function} easing - Easing method for animation.
     * @default 
     * { 
     *   duration: 300,
     *   easing: easing.quadInOut
     * }
     */
    animationOptions: {
      duration: 300,
      easing: easing.quadInOut
    },

    //----------------------------------
    //  autoRepositionEnabled
    //----------------------------------

    /**
     * Indicates whether to automatically reposition the popup when it opens outside
     * the bounds of the {@link module:esri/views/View}.
     * 
     * @type {Boolean}
     * @default
     */
    autoRepositionEnabled: true,

    //----------------------------------
    //  title
    //----------------------------------

    /**
     * The title of the popup. This can be set generically on the popup no 
     * matter the features that are selected. If the [selected feature](#selectedFeature)
     * has a {@link module:esri/PopupTemplate}, then the title set in the 
     * corresponding template is used here.
     * 
     * @type {String}
     *             
     * @example 
     * //This title will display in the popup unless a selected feature's
     * //PopupTemplate overrides it
     * view.popup.set("title", "Population by zip codes in Southern California");
     */
    title: null,

    _setTitleAttr: function (newVal) {
      this._set("title", newVal);
      this._titleChange();
    },

    //----------------------------------
    //  content
    //----------------------------------

    /**
     * The content of the popup. When set directly on the Popup, this content may 
     * only be static and cannot use fields to set content templates. To set a template
     * for the content based on field or attribute names, see 
     * {@link module:esri/PopupTemplate#content PopupTemplate.content}. 
     * 
     * @type {string | Node}
     * @see [Sample - Popup Docking](../sample-code/2d/popup-docking/) 
     * 
     * @example 
     * //This sets generic instructions in the popup that will always be displayed
     * //unless it is overridden by a PopupTemplate
     * view.popup.set("content", "Click a feature on the map to view its attributes");
     */
    content: null,

    _setContentAttr: function (newVal) {
      this._set("content", newVal);
      this._contentChange();
    },

    //----------------------------------
    //  location
    //----------------------------------

    /**
     * Geometry used to position the popup. This is automatically set when viewing the 
     * popup by selecting a feature. If using the Popup to display content not related 
     * to features in the map, such as the results from a task, then you must set this 
     * property before making the popup [visible](#visible) to the user.
     * 
     * @type {module:esri/geometry/Geometry}
     * @see [Sample - Basic Popup](../sample-code/2d/popup-basic/)
     * @see [Sample - Identify Task](../sample-code/2d/tasks-identify/)   
     *          
     * @example 
     * //Sets the location of the popup to the center of the view
     * view.popup.set("location", view.center);
     * //Displays the popup
     * view.popup.set("visible", true);
     * 
     * @example 
     * //Sets the location of the popup to the location of a click on the view
     * view.on("click", function(evt){
     *   view.popup.set("location", evt.mapPoint);
     *   //Displays the popup
     *   view.popup.set("visible", true);
     * });        
     */
    location: null,

    _setLocationAttr: function (newVal) {
      this._set("location", newVal);
      this._locationChange();
      this._pendingPromisesCountChange();
      this._viewWatchChange();
    },

    //----------------------------------
    //  updateLocationEnabled
    //----------------------------------

    /**
     * Indicates whether to update the [location](#location) when the [selectedIndex](#selectedIndex) changes.
     * 
     * @type {Boolean}
     * @default false
     */
    updateLocationEnabled: false,

    //----------------------------------
    //  closestFirst
    //----------------------------------

    /**
     * Indicates whether to show the closest features first.
     * 
     * @type {Boolean}
     * @default false
     */
    closestFirst: false,

    //----------------------------------
    //  docked
    //----------------------------------

    /**
     * Indicates whether to place the popup in the "docked" state by default.
     * 
     * Docking the popup allows for a better user experience, particularly when opening
     * popups in apps on mobile devices. When a popup is "docked" it means the popup no 
     * longer points to the [selected feature](#selectedFeature) or the [location](#location)
     * assigned to it. Rather it is placed in one of the corners of the view or to the top or bottom
     * of it. 
     * 
     * See [dockOptions](#dockOptions) to override default options related to docking the popup.
     * 
     * @type {Boolean}
     * @default false
     * @see [Sample - Popup docking](../sample-code/2d/popup-docking/)               
     *              
     * @example 
     * //The popup will automatically be docked when made visible
     * view.popup.set("docked", true);
     */
    docked: false,

    _setDockedAttr: function (newVal) {
      this._set("docked", newVal);
      this._dockedChange();
      this._viewWatchChange();
    },

    //----------------------------------
    //  dockOptions
    //----------------------------------

    /**
     * Docking the popup allows for a better user experience, particularly when opening
     * popups in apps on mobile devices. When a popup is "docked" it means the popup no 
     * longer points to the [selected feature](#selectedFeature) or the [location](#location)
     * assigned to it. Rather it is placed in one of the corners of the view or to the top or bottom
     * of it. This property allows the developer to set various options for docking the popup.
     * 
     * See the object specification table below to override default docking properties on the popup.
     * 
     * @type {Object}
     * @see [Sample - Popup docking](../sample-code/2d/popup-docking/)             
     *             
     * @property {boolean} autoDock - Indicates wheather to automatically dock the popup. 
     *                         <br><br><b>Default:</b> true
     * @property {boolean} dockButtonEnabled - Indicates whether to enable the dock button. 
     *                         <br><br><b>Default:</b> true
     * @property {Object} position - Defines how to position the popup when docked.
     * @property {string} position.portrait - Defines the location of the docked popup when the {@link module:esri/views/View} has a 
     * portrait orientation. 
     * <br><br><b>Known Values:</b> top | bottom
     * <br><b>Default:</b> bottom
     * @property {string} position.landscape - Defines the location of the docked popup when the {@link module:esri/views/View} has a 
     * landscape orientation.
     * <br><br><b>Known Values:</b> right | left
     * <br><b>Default:</b> right
     * @property {Object} dockAtSize - Defines the dimensions of the {@link module:esri/views/View} at which to dock the popup.
     * @property {number} dockAtSize.width - The maximum width of the {@link module:esri/views/View} required for docking the popup.
     *                        <br><br><b>Default:</b> 480
     * @property {number} dockAtSize.height - The maximum height of the {@link module:esri/views/View} required for docking the popup.
     *                        <br><br><b>Default:</b> 480
     *              
     * @example
     * view.popup.set("dockOptions", {
     *   autoDock: "true",
     *   //Disable the dock button so users cannot undock the popup
     *   dockButtonEnabled: false,
     *   //place the popup at the bottom of the view when it has a
     *   //portrait orientation and to the right of the view 
     *   //when it has a landscape orientation
     *   position: {
     *     portrait: "bottom",
     *     landscape: "right"
     *   },
     *   //Dock the popup when the size of the view is 600x1000 pixels
     *   dockAtSize: {
     *     width: 600,
     *     height: 1000
     *   }
     * });
     */
    dockOptions: dockOptionDefaults,

    _setDockOptionsAttr: function (newVal) {
      newVal = lang.mixin(dockOptionDefaults, newVal);
      this._set("dockOptions", newVal);
      this._dockOptionsChange();
    },

    //----------------------------------
    //  featureCount
    //----------------------------------

    /**
     * The number of selected [features](#features) accessed by the popup.
     * 
     * @type {Number}
     * @default 0
     * @readonly
     */
    featureCount: 0, // readonly

    //----------------------------------
    //  pendingPromisesCount
    //----------------------------------

    /**
     * The number of [promises](#promises) remaining to be resolved.
     * 
     * @type {Number}
     * @default 0
     * @readonly
     * @see [Popup.promises](#promises)
     */
    pendingPromisesCount: 0, // readonly

    _setPendingPromisesCount: function (newVal) {
      this._set("pendingPromisesCount", newVal);
      this._pendingPromisesCountChange();
    },

    //----------------------------------
    //  selectedFeature
    //----------------------------------

    /**
     * The selected feature accessed by the popup. The content of the Popup is
     * determined based on the {@link module:esri/PopupTemplate} assigned to
     * this feature.
     * 
     * @type {module:esri/Graphic}
     * @readonly
     */
    selectedFeature: null, // readonly

    //----------------------------------
    //  loaded
    //----------------------------------

    /**
     * Indicates if the popup widget is loaded.
     * 
     * @name loaded
     * @instance
     * @type {boolean}
     * @default false
     * @readonly
     */

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    // bind listener for button to action
    postCreate: function () {
      var _self = this;
      this.inherited(arguments);
      this.own(
        // dock a11yclick
        on(this._dockNode, a11yclick, this._toggleDock.bind(this)),
        // close a11yclick
        on(this._closeNode, a11yclick, this._close.bind(this)),
        // previous a11yclick
        on(this._previousNode, a11yclick, this.previous.bind(this)),
        // next a11yclick
        on(this._nextNode, a11yclick, this.next.bind(this)),
        // menu a11yclick
        on(this._pageMenuNode, a11yclick, this._togglePageMenu.bind(this)),
        // menu a11yclick
        on(this._pageMenuCloseNode, a11yclick, this._togglePageMenu.bind(this)),
        // menu item a11yclick
        on(this._pageMenuItemsNode, on.selector("tr:not(." + this.css.pageMenuSelected + ")", a11yclick), function () {
          _self._pageMenuItem(this);
        }),
        // action click
        on(this._actionsNode, on.selector("[data-action-index]", a11yclick), function (evt) {
          _self._actionEvent(this, evt);
        }),
        // action click listener for default actions
        on(this, "action-click", function (evt) {
          // zoom-to action
          if (evt.action && evt.action.id === zoomToAction.id) {
            this._zoomTo();
          }
        }.bind(this))
      );
    },

    startup: function () {
      this.inherited(arguments);
      // widget is now loaded
      this.set("loaded", true);
      this.emit("load");
    },

    destroy: function () {
      if (this._viewReady) {
        this._viewReady.cancel();
      }
      this.view = null;
      this.inherited(arguments);
    },

    reposition: function () {
      this._reposition();
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Selects the feature at the next index.
     * 
     * @see [Popup.selectedIndex](#selectedIndex)
     */
    next: function () {
      this.set("selectedIndex", this.selectedIndex + 1);
    },

    /**
     * Selects the feature at the previous index.
     * 
     * @see [Popup.selectedIndex](#selectedIndex)
     */
    previous: function () {
      this.set("selectedIndex", this.selectedIndex - 1);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _viewWatchChange: function () {
      if (this._viewPointEvent) {
        if (this.visible && this.location && !this.docked) {
          this._viewPointEvent.resume();
        } else {
          this._viewPointEvent.pause();
        }
      }
    },
    
    _toggleDock: function () {
      this.set("docked", !this.docked);
    },

    _close: function () {
      this.set("visible", false);
    },

    _getPoint: function (geometry) {
      var pt;
      if (geometry) {
        switch (geometry.type) {
        case "point":
          pt = geometry;
          break;
        case "multipoint":
        case "polyline":
        case "polygon":
          pt = geometry.getPoint(0, 0);
          break;
        }
      }
      return pt;
    },

    _navigateTo: function (pos) {
      if (this._navigateTimeout) {
        clearTimeout(this._navigateTimeout);
      }
      this._navigateTimeout = setTimeout(function () {
        var view = this.view;
        var extent = view && view.extent;
        // If it's not in the current view extent (padding taken into consideration)
        if (extent && !extent.contains(this.location)) {
          return;
        }
        // popup not docked, we have a position and not currently animating
        else if (!this.docked && pos && !this._animateVP && this.autoRepositionEnabled && pos.width < view.width && pos.height < view.height && this.view.type !== "3d") {
          // offsets
          var dx = 0;
          var dy = 0;
          // view box
          var viewBox = domGeometry.position(view.surface, true);
          var viewHeight = viewBox.h;
          var viewWidth = viewBox.w;
          var viewPadding = view.padding;
          var viewMargin = 10; // todo: Beta 3 - change to view ui margin
          if (pos.top < viewPadding.top) {
            // popup is above view
            dy = -(pos.top) + viewMargin + viewPadding.top;
          } else if (pos.bottom > (viewHeight - viewPadding.bottom)) {
            // popup is below view
            dy = -(pos.bottom - viewHeight + viewPadding.bottom) - viewMargin;
          }
          if (pos.left < viewPadding.left) {
            // popup is left of view
            dx = pos.left - viewMargin - viewPadding.left;
          } else if (pos.right > (viewWidth - viewPadding.right)) {
            // popup is right of view
            dx = (pos.right - viewWidth + viewPadding.right) + viewMargin;
          }
          // we have offsets to do
          if (dx || dy) {
            // get offset point
            this._animateVP = viewpointUtils.translateBy(
              viewpointUtils.create(),
              view.viewpoint, [dx, dy]
            );
            // animate to offset point
            view.animateTo(this._animateVP, this.animationOptions).then(function () {
              // reset view point
              this._animateVP = null;
            }.bind(this));
          }
        }
      }.bind(this), 150);
    },

    // sets popup position
    _setPosition: function (screenPoint) {
      var position;
      var popBox = domGeometry.getContentBox(this._containerNode);
      var pointerPos = domGeometry.position(this._pointerNode);
      var halfPointerSize = pointerPos.h / 2;
      // height of popup and tail
      var totalHeight = popBox.h;
      if (this.alignment === "top" || this.alignment === "bottom") {
        totalHeight = totalHeight + halfPointerSize;
      }
      var totalWidth = popBox.w;
      if (this.alignment === "left" || this.alignment === "right") {
        totalWidth = totalWidth + halfPointerSize;
      }
      var top, left, bottom, right;
      switch (this.alignment) {
      case "bottom":
        top = screenPoint.y + halfPointerSize;
        left = screenPoint.x - (totalWidth / 2);
        bottom = screenPoint.y + totalHeight;
        right = left + totalWidth;
        break;
      case "left":
        top = screenPoint.y - (totalHeight / 2);
        left = screenPoint.x - totalWidth;
        bottom = top + totalHeight;
        right = left + totalWidth;
        break;
      case "right":
        top = screenPoint.y - (totalHeight / 2);
        left = screenPoint.x + halfPointerSize;
        bottom = top + totalHeight;
        right = screenPoint.x + totalWidth;
        break;
      default:
        // screen screenPoint minus (popup height + pointer height)
        top = screenPoint.y - totalHeight;
        // screen screenPoint minus 1/2 popup width
        left = screenPoint.x - (totalWidth / 2);
        // top position plus height of popup
        bottom = top + totalHeight;
        // left position plus width of popup
        right = left + totalWidth;
      }
      var padding = this.view.padding;
      var css = this.css;
      // remove position classes
      domClass.remove(this._containerNode, [css.top, css.bottom, css.left, css.right]);
      // if popup is docked
      if (this.docked) {
        position = {
          left: "",
          top: "",
          right: "",
          bottom: ""
        };
        if (padding.left) {
          position.marginLeft = padding.left + "px";
        }
        if (padding.top) {
          position.marginTop = padding.top + "px";
        }
        if (padding.right) {
          position.marginRight = padding.right + "px";
        }
        if (padding.bottom) {
          position.marginBottom = padding.bottom + "px";
        }
        domStyle.set(this._containerNode, position);
      } else {
        position = {
          left: left + "px",
          top: top + "px",
          right: null,
          bottom: null,
          marginLeft: null,
          marginTop: null,
          marginRight: null,
          marginBottom: null
        };
        // add position class
        var alignmentClass;
        switch (this.alignment) {
        case "bottom":
          alignmentClass = css.bottom;
          break;
        case "right":
          alignmentClass = css.right;
          break;
        case "left":
          alignmentClass = css.left;
          break;
        default:
          alignmentClass = css.top;
        }
        domClass.add(this._containerNode, alignmentClass);
      }
      // Place popup at the right position
      domStyle.set(this._containerNode, position);
      // results
      return {
        height: totalHeight,
        width: totalWidth,
        top: top,
        left: left,
        bottom: bottom,
        right: right
      };
    },

    _zoomTo: function () {
      if (this.view && this.location) {
        var animateOptions = {
          target: this.location
        };
        if (this.location.type === "point") {
          animateOptions.scale = this.view.scale / this.zoomFactor;
        }
        this.view.animateTo(animateOptions, this.animationOptions);
      }
    },

    _togglePageMenu: function () {
      domClass.toggle(this._containerNode, this.css.menuOpen);
      if (!domClass.contains(this._containerNode, this.css.menuOpen)) {
        this._pageMenuNode.focus();
      }
    },

    _actionsChange: function () {
      if (this._actionsNode) {
        domConstruct.empty(this._actionsNode);
        var actions = this.actions;
        var actionsLen = actions && actions.length;
        if (actionsLen) {
          for (var i = 0; i < actionsLen; i++) {
            var action = actions[i];
            // create action button
            var actionNode = domConstruct.create("div", {
              tabindex: "0",
              "data-action-index": i,
              title: action.title,
              className: this.css.btn + " " + this.css.action + " " + this.css.clearfix
            });
            // icon
            var actionsIcon = {
              "aria-hidden": true,
              className: this.css.icon
            };
            if (action.className) {
              actionsIcon.className += " " + action.className;
            }
            if (action.image) {
              actionsIcon.className += " " + this.css.actionImage;
              actionsIcon.style = "background-image:url(" + action.image + ");";
            }
            domConstruct.create("span", actionsIcon, actionNode);
            // text
            var actionsText = {
              className: this.css.actionText,
              textContent: action.title
            };
            // hide action text if more than or equal to X actions are shown
            if (actionsLen >= this._hideActionsTextNum) {
              actionsText.className = this.css.iconText;
            }
            domConstruct.create("span", actionsText, actionNode);
            // place node
            domConstruct.place(actionNode, this._actionsNode);
          }
        }
      }
      this._reposition();
    },

    _actionEvent: function (node, evt) {
      var data = domAttr.get(node, "data-action-index");
      if (data) {
        var actionIndex = parseInt(data, 10);
        var action = this.actions[actionIndex];
        if (action) {
          evt.action = action;
          this.emit("action-click", evt);
        }
      }
    },

    _dockPositionChange: function () {
      var css = this.css;
      domClass.remove(this._containerNode, [css.dockedLeft, css.dockedRight, css.dockedTop, css.dockedBottom]);
      domClass.remove(this._dockIconNode, [css.dockIconTop, css.dockIconBottom, css.dockIconLeft, css.dockIconRight]);
      var position, positionClass, iconClass;
      if (this.view && this.view.cssTraits.active.orientation === "portrait") {
        position = this.dockOptions.position.portrait;
      } else {
        position = this.dockOptions.position.landscape;
      }
      switch (position) {
      case "top":
        positionClass = css.dockedTop;
        iconClass = css.dockIconTop;
        break;
      case "bottom":
        positionClass = css.dockedBottom;
        iconClass = css.dockIconBottom;
        break;
      case "left":
        positionClass = css.dockedLeft;
        iconClass = css.dockIconLeft;
        break;
      default:
        positionClass = css.dockedRight;
        iconClass = css.dockIconRight;
      }
      domClass.toggle(this._containerNode, this.css.showDockButton, this.dockOptions.dockButtonEnabled);
      domClass.add(this._dockIconNode, iconClass);
      if (this.docked) {
        domClass.add(this._containerNode, positionClass);
      }
    },

    _dockedChange: function () {
      domClass.toggle(this._containerNode, this.css.docked, this.docked);
      domAttr.set(this._dockNode, "title", this.docked ? this._i18n.undock : this._i18n.dock);
      this._dockPositionChange();
      this._locationChange();
      // popup is no longer docked
      if (!this.docked) {
        var extent = this.view && this.view.extent;
        // animate to the feature if it's not in the current view extent without padding
        if (this.location && extent && !extent.contains(this.location)) {
          // center at geometry
          this.view.animateTo(this.location, this.animationOptions);
        }
      }
    },

    _dockOptionsChange: function () {
      if (!this.dockOptions.dockButtonEnabled) {
        domClass.remove(this._containerNode, [this.css.docked, this.css.showDock]);
      } else {
        domClass.toggle(this._containerNode, this.css.docked, this.docked);
        domClass.add(this._containerNode, this.css.showDock);
      }
      this._dockPositionChange();
    },

    _pendingPromiseResult: function () {
      // we have promises pending and have received no features
      return this.pendingPromisesCount && !this.featureCount;
    },

    _locationChange: function () {
      if (this.visible) {
        var position = this._reposition();
        if (position) {
          // move map if popup is outside of view
          this._navigateTo(position);
        }
      }
    },

    _reposition: function () {
      if (this.location && this.visible) {
        // get feature location
        var point = this._getPoint(this.location);
        // if we have the info we need
        if (point && this.view && this.view.ready) {
          // get screen point
          var screenPoint = this.view.toScreen(point.x, point.y);
          if (screenPoint) {
            // set position of popup
            return this._setPosition(screenPoint);
          }
        }
      }
    },

    _addContent: function () {
      this._contentChange();
      this._titleChange();
      this._pageText();
    },

    _removeContent: function () {
      domAttr.set(this._bodyContentNode, "innerHTML", "");
      domAttr.set(this._titleNode, "innerHTML", "");
      domAttr.set(this._pageTextNode, "innerHTML", "");
      domClass.remove(this._containerNode, [this.css.showTitle, this.css.showContent]);
    },

    _titleChange: function () {
      var title = this.title || "";
      domAttr.set(this._titleNode, {
        textContent: title
      });
      domClass.toggle(this._containerNode, this.css.showTitle, title);
      this._reposition();
    },

    _contentChange: function () {
      var content = this.content;
      // content is a node
      if (content && content.nodeName) {
        domConstruct.place(content, this._bodyContentNode, "only");
      }
      // content is a html string
      else if (typeof content === "string") {
        domAttr.set(this._bodyContentNode, "innerHTML", content);
      }
      // scroll to top of div
      this._bodyContentNode.scrollTop = 0;
      var isPopupRenderer = this._popupRenderer && this._popupRenderer.content === content;
      domClass.toggle(this._containerNode, this.css.hasPopupRenderer, isPopupRenderer);
      domClass.toggle(this._containerNode, this.css.showContent, content);
      this._reposition();
    },

    _selectedFeatureActions: function () {
      // if we have actions that were overridden previously
      if (this._originalActions) {
        // resotre them
        this.actions = this._originalActions;
        this._originalActions = null;
      }
      // remove any popup template added actions
      var originalActions = array.filter(this.actions, function (item) {
        return !item[this._popupTemplateAction];
      }.bind(this));
      // by default, use original non popup template added actions
      var actions = originalActions;
      // get popup template
      var pt = this.selectedFeature.getEffectivePopupTemplate();
      // popup template has actions
      if (pt && pt.actions) {
        var newActions = pt.actions;
        for (var i = 0; i < newActions.length; i++) {
          // specify this is a popup template added action
          newActions[i][this._popupTemplateAction] = true;
        }
        if (pt.overwriteActions) {
          // save current actions
          this._originalActions = originalActions;
          // overwrite all actions
          actions = newActions;
        } else {
          // add on top of existing actions
          actions = originalActions.concat(newActions);
        }
      }
      // set actions
      this.set("actions", actions);
    },

    _selectedFeatureChange: function () {
      if (this.selectedFeature) {
        // set actions for selected feature
        this._selectedFeatureActions();
        // create popup renderer if it doesn't exist
        if (!this._popupRenderer) {
          this._popupRenderer = new PopupRenderer({
            showTitle: false,
            graphic: this.selectedFeature
          });
          // change popup title if popup renderer title changes
          this.own(this._popupRenderer.watch("title", function () {
            this.set("title", this._popupRenderer.title);
          }.bind(this)));
          // change popup content if popup renderer content changes
          this.own(this._popupRenderer.watch("content", function () {
            this.set("content", this._popupRenderer.content);
          }.bind(this)));
          // do it!
          this._popupRenderer.startup();
        }
        // set popup renderer graphic
        else {
          this._popupRenderer.set("graphic", this.selectedFeature);
        }
        // set initial title and content
        this.set("title", this._popupRenderer.title);
        this.set("content", this._popupRenderer.content);
        if (this.updateLocationEnabled) {
          this.set("location", this.selectedFeature.geometry);
        }
      }
    },

    _selectedIndexChange: function () {
      var feature = null;
      var features = this.features;
      if (features && features.length) {
        this.selectedIndex = (this.selectedIndex + this.features.length) % this.features.length;
        feature = features[this.selectedIndex];
      }
      this.set("selectedFeature", feature);
      this._selectedFeatureChange();
      this._pageText();
      this._pageMenuItems();
    },

    _setFeaturesChange: function () {
      if (!this.pendingPromisesCount) {
        this.set("selectedIndex", null);
      }
      var featureCount = 0;
      if (this.features && this.features.length) {
        if (!this.pendingPromisesCount) {
          this.set("selectedIndex", 0);
        }
        featureCount = this.features.length;
      }
      this.set("featureCount", featureCount);
      this._paginationChange();
      this._locationChange();
      this._pendingPromisesCountChange();
    },

    _pageMenuItem: function (target) {
      var index = null;
      var dataIndex = domAttr.get(target, "data-index");
      if (dataIndex) {
        index = parseInt(dataIndex, 10);
      }
      if (index !== null) {
        this.set("selectedIndex", index);
      }
      domClass.remove(this._containerNode, this.css.menuOpen);
      this._pageMenuNode.focus();
    },

    _pageMenuItems: function () {
      var features = this.features;
      if (features) {
        var len = features.length;
        if (this._pageMenuItemsNode) {
          domAttr.set(this._pageMenuItemsNode, "innerHTML", "");
        }
        if (features && len) {
          var infoText = string.substitute(this._i18n.selectedFeatures, {
            total: len
          });
          domAttr.set(this._pageMenuInfoNode, "textContent", infoText);
          for (var i = 0; i < len; i++) {
            var feature = features[i];
            var title = this._i18n.untitled;
            if (feature) {
              // create's popup renderer just to get the title of the graphic
              var pr = new PopupRenderer({
                showContent: false,
                graphic: feature
              });
              pr.startup();
              title = pr.title;
              // kill it, it's no longer needed.
              pr.destroy();
            }
            var domOptions = {};
            if (i === this.selectedIndex) {
              domOptions.className = this.css.pageMenuSelected;
            } else {
              domOptions.role = "menu-item";
              domOptions.tabindex = "0";
              domOptions["data-index"] = i;
            }
            var item = domConstruct.create("tr", domOptions, this._pageMenuItemsNode);
            // number
            domConstruct.create("th", {
              className: this.css.pageMenuNumber,
              textContent: (i + 1)
            }, item);
            // title
            var itemTitle = domConstruct.create("td", {
              className: this.css.pageMenuTitle,
              textContent: title
            }, item);
            if (i === this.selectedIndex) {
              domConstruct.create("span", {
                className: this.css.pageMenuCheckMark,
              }, itemTitle);
            }
          }
        }
      }
    },

    _pageText: function () {
      var pageString = "";
      if (this.paginationEnabled && this.features && this.features.length > 1) {
        pageString = string.substitute(this._i18n.pageText, {
          index: this.selectedIndex + 1,
          total: this.features.length
        });
      }
      if (this._pageTextNode) {
        domAttr.set(this._pageTextNode, {
          textContent: pageString
        });
      }
    },

    _paginationChange: function () {
      this._pageText();
      this._pageMenuItems();
      var enablePagination = this.paginationEnabled && this.features && this.features.length > 1;
      domClass.toggle(this._containerNode, this.css.showPagination, enablePagination);
      this._reposition();
    },

    _resized: function () {
      this._locationChange();
      this._dockPositionChange();
    },

    _viewSizeChange: function () {
      if (this.dockOptions.autoDock && this.dockOptions.dockAtSize) {
        var shouldDock = this.view.ui.width <= this.dockOptions.dockAtSize.width || this.view.ui.height <= this.dockOptions.dockAtSize.height;
        this.set("docked", shouldDock);
      }
    },

    _viewChange: function () {
      // view not defined
      if (!this.view) {
        console.log(this.declaredClass + "::view required");
      } else {
        if (this._viewReady) {
          this._viewReady.cancel();
        }
        this._viewReady = this.view.then(function () {
          // set docked status
          this._viewSizeChange();
          // update popup position when viewpoint changes
          if (this._viewPointEvent) {
            this._viewPointEvent.remove();
          }
          // note: viewPoint may change to use visible for 3D cc @yann
          var viewWatchProp = "viewpoint";
          if (this.view.type === "3d") {
            viewWatchProp = "camera";
          }
          this._viewPointEvent = watchUtils.pausable(this.view, viewWatchProp, this._reposition.bind(this));
          this._viewWatchChange();
          this.own(this._viewPointEvent);
          // view size change
          if (this._viewSizeEvent) {
            this._viewSizeEvent.remove();
          }
          this._viewSizeEvent = this.view.watch("size", this._viewSizeChange.bind(this));
          this.own(this._viewSizeEvent);
          // view has been resized
          if (this._viewResizingEvent) {
            this._viewResizingEvent.remove();
          }
          this._viewResizingEvent = watchUtils.whenFalse(this.view, "resizing", this._resized.bind(this));
          this.own(this._viewResizingEvent);
          // Message widget
          if (this._message) {
            this._message.destroy();
          }
          this._message = new ViewMessage({
            visible: false,
            text: this._i18n.noFeaturesFound,
            view: this.view
          });
          this._message.startup();
          domConstruct.place(this._message.domNode, this.view.root);
          // tap spinner
          if (this._spinner) {
            this._spinner.destroy();
          }
          this._spinner = new ViewSpinner({
            visible: false,
            view: this.view
          });
          this._spinner.startup();
          domConstruct.place(this._spinner.domNode, this.view.root);
          // dock state
          this._dockedChange();
          // insert actions
          this._actionsChange();
          // set features if they might be there
          this._setFeaturesChange();
        }.bind(this));
      }
    },

    _visibleChangeContent: function () {
      /*
        Only have the domNode in the document when the popup is visible.
        This will ensure that if a video is playing in the popup when closed, the video is removed and stopped, not just hidden.
      */
      if (!this.visible) {
        this._removeContent();
      } else {
        this._addContent();
      }
      this._locationChange();
    },

    _updateFeatures: function (promise, features) {
      if (promise && this.promises) {
        var res = this._validatePromise(promise);
        if (!res || (features instanceof Error)) {
          return;
        }
        if (features && features.length) {
          var setOptions = {};
          if (!this.features) {
            setOptions.features = features;
          } else {
            var filtered = features.filter(function (feature) {
              return this.features.indexOf(feature) === -1;
            }.bind(this));
            setOptions.features = this.features.concat(filtered);
          }
          if (this.selectedIndex === null) {
            setOptions.selectedIndex = 0;
          }
          if (!this.features || !this.features.length) {
            setOptions.visible = true;
          }
          this.set(setOptions);
        }
      }
      this._setFeaturesChange();
    },

    _pendingPromisesCountChange: function () {
      domClass.toggle(this._containerNode, this.css.loading, this.pendingPromisesCount);
      // get point from location
      var point = this._getPoint(this.location);
      if (this._message) {
        // hide message
        this._message.set({
          visible: false
        });
      }
      // we have promises happening and we have a location
      if (this._pendingPromiseResult()) {
        if (this._spinner) {
          // show loading spinner
          this._spinner.set({
            visible: true,
            point: point
          });
        }
      }
      // no promises happening
      else {
        if (this._spinner) {
          // hide loading spinner
          this._spinner.set({
            point: null
          });
        }
        // if we have no features and promises
        if (!this.featureCount && this.promises && this.promises.length) {
          if (this._message) {
            // show no features message
            this._message.set({
              visible: true,
              point: point
            });
          }
        }
      }
    },

    _validatePromise: function (promise) {
      var index = array.indexOf(this.promises, promise);
      if (index === -1) {
        return false;
      }
      return true;
    },

    _showClosestFirst: function (features, location) {
      if (features && features.length) {
        if (features.length > 1) {
          location = location.normalize();
          var minDistance = Infinity,
            closestIdx = -1,
            getLength = mathUtils.getLength,
            locSR = location.spatialReference,
            distance, geom, i, geomSR, target;
          for (i = features.length - 1; i >= 0; i--) {
            geom = features[i].geometry;
            if (!geom) {
              continue;
            }
            geomSR = geom.spatialReference;
            distance = 0;
            try {
              target = (geom.type === "point") ? geom : geom.extent.center;
              target = target.normalize();
              if (locSR && geomSR && !locSR.equals(geomSR) && locSR._canProject(geomSR)) {
                target = locSR.isWebMercator() ?
                  webMercatorUtils.geographicToWebMercator(target) :
                  webMercatorUtils.webMercatorToGeographic(target);
              }
              distance = getLength(location, target);
            } catch (ignore) {
              // We'll silently ignore this exceptions since "moveClosestToFront" 
              // is not a critical operation
            }
            if (distance > 0 && distance < minDistance) {
              minDistance = distance;
              closestIdx = i;
            }
          }
          if (closestIdx > 0) {
            features.splice(0, 0, features.splice(closestIdx, 1)[0]);
          }
        }
      }
      return features;
    }

  });

  return Popup;
});