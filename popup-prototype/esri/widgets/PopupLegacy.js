/* jshint laxcomma: true */
/**
 * The popup widget allows you to view content from feature attributes inside a window created in 
 * the view. It is associated with feature(s) from layers and graphics and can manually read title
 * and content directly from the feature(s). 
 * 
 * Popups enhance web applications by providing users with a simple way to interact with and 
 * understand map features. They play an important role in relaying information to the user, which
 * improves the story-telling capabilities of the application.
 *
 * Popups can be used to display the results of asynchronous operations like the execution of a
 * query task or a feature layer query.
 *
 * @module esri/widgets/Popup
 * @since 4.0
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",

  "dojo/has",
  "dojo/on",
  "dojo/window", 
  "dojo/Stateful",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-geometry",
  "dojo/dom-style",

  "dijit/registry",

  "../core/lang",
  "../core/domUtils",
  "../geometry/Polyline",
  "../geometry/Polygon",

  "./PopupLegacy/InfoWindowBase",
  "./PopupLegacy/PopupBase",

  "dojo/i18n!./PopupLegacy/nls/PopupLegacy",

  "dojo/NodeList-dom" // NodeList.forEach
  
  // back-compat
  //>>excludeStart("pragmaA", kwArgs.buildType == "tiny")
  ,
  "dojo/has!extend-esri?./PopupTemplate",
  "dojo/has!extend-esri?./Popup/PopupRenderer"
  //>>excludeEnd("pragmaA")
], function(
  declare, lang, array, dojoNS,
  has, on, win, Stateful,
  dom, domAttr, domClass, domConstruct, domGeometry, domStyle,
  registry,
  esriLang, domUtils, Polyline, Polygon,
  InfoWindowBase, PopupBase,
  jsapiBundle
) {
  
  // TODO
  // Optimal max-height for the content pane could be
  // (map.height / 2) - (approx height of title pane + actions pane) - (approx height of the popup tail)
  // Removed @extends module:esri/widgets/WidgetBase from doc

  /**
   * @mixes module:esri/core/Promise
   * @constructor module:esri/widgets/Popup
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string} srcNodeRef - Reference or id of the HTML element in which this widget renders.                               
   */
  var Popup = declare([ InfoWindowBase, PopupBase, Stateful ],
  /** @lends module:esri/widgets/Popup.prototype */
  {
    declaredClass: "esri.widgets.Popup",

    /**
    * Specifies the X-offset in pixels when positioning the popup.
    *
    * @type {number}
    * @default
    */
    offsetX: 3,
      
    /**
    * Specifies the Y-offset in pixels when positioning the popup.
    *
    * @type {number}
    * @default
    */  
    offsetY: 3,
      
    /**
    * Defines the number of levels to zoom in when the 'Zoom to' link is clicked.
    *
    * @type {number}
    * @default
    */  
    zoomFactor: 4,
      
    /**
    * Specifies the margin (in pixels) to leave to the left of the popup window when it is maximized.
    *
    * @type {number}
    * @default
    */  
    marginLeft: 25,
      
    /**
    * Specifies the margin (in pixels) to leave at the top of the popup window when it is maximized.
    *
    * @type {number}
    * @default
    */  
    marginTop: 25,
      
    /**
    * Indicates whether the features described by the popup should be highlighted.
    *
    * @type {boolean}
    * @default
    */   
    highlight: true,
      
    /**
    * Indicates whether the popup should display previous and next buttons in the title bar. 
    * These buttons are normally displayed when the popup displays two or more features.
    *
    * @type {boolean}
    * @default
    */   
    pagingControls: true,
      
    /**
    * Indicates whether the popup should display the title bar text that contains the page
    * number and total number of available features.
    *
    * @type {boolean}
    * @default
    */  
    pagingInfo: true,
      
    /**
    * Indicates whether a feature should remain highlighted after the user closes the popup window.
    *
    * @type {boolean}
    * @default false
    */  
    keepHighlightOnHide: false,
      
    /**
    * Indicates whether the popup window should be displayed. When set to `false`, the popup will
    * still continue to fire events such as: onSetFeatures, onClearFeatures and onSelectionChange
    * where applicable.
    *
    * @type {boolean}
    * @default
    */   
    popupWindow: true,
      
    /**
    * Indicates whether the feature's title should display within the body of the popup window as
    * opposed to in the titlebar. This option is only valid for features that have a PopupTemplate
    * defined.
    *
    * @type {boolean}
    * @default
    * @private
    */  
    titleInBody: true,
      
    /**
    * Controls the placement of the popup window with respect to the geographic location. 
    * For a list of possible values, see the table below. 
    *
    * Value | Description
    * ------|------------
    * auto | Placement is automatically computed depending on the available screen space.
    * top | Popup window is placed on top of the geographic location.
    * right | Popup window is placed to the right of the feature.
    * bottom | Popup window is placed on below the geographic location.
    * left | Popup window is placed to the left of the feature.
    * top-left | Popup window is placed to the top-left of the feature.
    * top-right | Popup window is placed to the top-right of the feature.
    * bottom-left | Popup window is placed to the bottom-left of the feature.
    * bottom-right | Popup window is placed to the bottom-right of the feature.
    *
    * @type {string}
    * @default
    */  
    anchor: "auto",
    
    /**
    * Indicates whether the popup window remains visible when there are no features to be displayed.
    *
    * @type {boolean}
    * @default
    */  
    visibleWhenEmpty: true,
    
    /**
    * The number of milliseconds after which the popup window will be hidden when 
    * `visibleWhenEmpty = false` and there are no features to be displayed.
    *
    * @type {number}
    * @default
    */  
    hideDelay: 1000, // in milliseconds
    
    /**
    * The location the Popup points to.
    *
    * @type {module:esri/geometry/Point}
    */   
    location: null,
    
    constructor: function(parameters, srcNodeRef) {
      /**
       * Supported parameters:
       *   markerSymbol
       *   lineSymbol
       *   fillSymbol
       *   offsetX (in pixels)
       *   offsetY (in pixels)
       *   zoomFactor (number of levels to zoom in)
       *   marginLeft (in pixels)
       *   marginTop (in pixels)
       *   highlight [RW]
       *   pagingControls [RW]
       *   pagingInfo [RW]
       *   keepHighlightOnHide [RW]
       *   popupWindow [RW]
       *   titleInBody
       *    - affects features with PopupTemplate only
       *   anchor [RW]
       *    - auto, top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
       */
      
      this.initialize();
      lang.mixin(this, parameters);
      this.domNode = dom.byId(srcNodeRef);
      
      var nls = this._nls = lang.mixin({}, jsapiBundle.widgets.popup);

      var domNode = this.domNode;
      domClass.add(domNode, "esri-popup");
      
      this._isRTL = !domGeometry.isBodyLtr();
      
      if (this._isRTL) {
        domStyle.set(domNode, "direction", "rtl");
      }

      /***************************
       * Create the DOM structure
       ***************************/
      
      var structure = 
        "<div class='esri-popup-wrapper' style='position: absolute;'>" +
        "<div class='sizer'>" +
          "<div class='title-pane'>" +
            "<div class='spinner hidden' title='" + nls.NLS_searching + "...'></div>" +
            "<div class='title'></div>" +
            "<div class='title-button prev hidden' title='" + nls.NLS_prevFeature + "'></div>" +
            "<div class='title-button next hidden' title='" + nls.NLS_nextFeature + "'></div>" +
            "<div class='title-button maximize' title='" + nls.NLS_maximize + "'></div>" +
            "<div class='title-button close' title='" + nls.NLS_close + "'></div>" +
          "</div>" +
        "</div>" +
        
        "<div class='sizer content'>" +
          "<div class='content-pane'>" +
          "</div>" +
        "</div>" +
        
        "<div class='sizer'>" + 
          "<div class='actions-pane'>" +
            "<div class='action-list hidden'>" +
              "<a title="+ nls.NLS_zoomTo +" class='action zoom-to' href='javascript:void(0);'><span>" + nls.NLS_zoomTo + "</span></a>" +
            "</div>" +
          "</div>" +
        "</div>" +
        
        "<div class='pointer hidden'></div>" +
        "</div>" +
        "<div class='outer-pointer hidden'></div>";

      domAttr.set(domNode, "innerHTML", structure);
      
      // Get references to nodes for later use so that we don't 
      // have to perform DOM queries often
      this._sizers = dojoNS.query(".sizer", domNode);
      
      var titlePane = dojoNS.query(".title-pane", domNode)[0];
      dom.setSelectable(titlePane, false);
      
      this._title = dojoNS.query(".title", titlePane)[0];
      this._prevFeatureButton = dojoNS.query(".prev", titlePane)[0];
      this._nextFeatureButton = dojoNS.query(".next", titlePane)[0];
      this._maxButton = dojoNS.query(".maximize", titlePane)[0];
      this._spinner = dojoNS.query(".spinner", titlePane)[0];
      
      this._contentPane = dojoNS.query(".content-pane", domNode)[0];
      this._positioner = dojoNS.query(".esri-popup-wrapper", domNode)[0];
      this._pointer = dojoNS.query(".pointer", domNode)[0];
      this._outerPointer = dojoNS.query(".outer-pointer", domNode)[0];

      this._actionList = dojoNS.query(".actions-pane .action-list", domNode)[0];
      
      /***********************
       * Setup event handlers
       ***********************/
      
      this._eventConnections = [
        on(dojoNS.query(".close", titlePane)[0], "click", this.hide.bind(this)),
        on(this._prevFeatureButton, "click", this.selectPrevious.bind(this)),
        on(this._nextFeatureButton, "click", this.selectNext.bind(this)),
        on(this._maxButton, "click", this._toggleSize.bind(this)),
        on(dojoNS.query(".zoom-to", this._actionList)[0], "click", this._zoomToFeature.bind(this)),
        this.on("clear-features", this._featuresCleared.bind(this)),
        this.on("selection-change", this._featureSelected.bind(this)),
        this.on("dfd-complete", this._updateUI.bind(this))
      ];

      // iOS wants the user to do two-finger scrolling for overflowing elements 
      // inside the body. We want to let the users do this with one finger.
      // NOTE
      // We don't need this for pointer enabled devices because scrollable
      // elements respond to touch automatically
      if (has("esri-touch")) {
        var handles = domUtils.setScrollable(this._contentPane);
        this._eventConnections.push(handles[0], handles[1]);
      }

      // Hidden initially
      this._toggleVisibility(false);
    },
    
    getTitle: function(graphic) {
      // Returns computed popup title
      return this._readTemplate(graphic, "title", true);
    },

    getContent: function(graphic) {
      // Returns computed popup content
      return this._readTemplate(graphic, "content", true);
    },
    
    /*****************************************
     * Override and implement methods defined  
     * by the base class: InfoWindowBase
     *****************************************/
    
    _readTemplate: function(graphic, property, first) {
      var template = graphic.getEffectivePopupTemplate(),
          value = template && template[property],
          type = typeof value;

      if (type === "function") {
        value = value.call(template, graphic);
      }
      else if (type === "string") {
        var layer = graphic.layer,
            // TODO
            // Fix this magic
            func = layer && layer._getDateOpts; // feature layer

        value = esriLang.substitute(graphic.attributes, value, {
          // TODO
          // Get rid of first
          first: first,

          dateFormat: func && func.call(layer)
        });
      }

      return value;
    },
    
    /**
    * This method is called by the map when the object is set as its popup. 
    *
    * @param {module:esri/Map} map - The map object.
    */
    setMap: function(map) {
      // Run logic defined in the base class
      this.inherited(arguments);
      
      domConstruct.place(this.domNode, this.view.root);
     
      if (this.highlight) {
        this.enableHighlight(map);
      }
      
      this._maxHeight = domStyle.get(this._contentPane, "maxHeight");
    },
    
    /**
    * This method is called by the map when the object is no longer the map's popup. 
    *
    * @param {module:esri/Map} map - The map object.
    */  
    unsetMap: function() {
      this.disableHighlight(this.map);

      // Run logic defined in the base class
      this.inherited(arguments);
    },
    
    /**
    * Sets the Popup title.
    *
    * @param {string} title - The text for the title.
    */  
    setTitle: function(title) {
      if (!this.popupWindow) {
        return;
      }
      
      if (!esriLang.isDefined(title) || title === "") {
        title = "&nbsp;";
      }
      
      this.destroyDijits(this._title);
      this.place(title, this._title);
      
      if (this.isShowing) {
        this.startupDijits(this._title);
        this.reposition();
      }
    },
    
    /**
    * Sets the content in the Popup.
    *
    * @param {string} content - The content for the Popup.
    */  
    setContent: function(content) {
      if (!this.popupWindow) {
        return;
      }
      
      if (!esriLang.isDefined(content) || content === "") {
        content = "&nbsp;";
      }
      
      this.destroyDijits(this._contentPane);
      this.place(content, this._contentPane);
      
      if (this.isShowing) {
        this.startupDijits(this._contentPane);
        this.reposition();
      }
    },
    
    /**
    * Display the popup at the specified location.
    *
    * @param {module:esri/geometry/Point} location - Point that represents the geographic location
    * at which to display the popup.
    * @param {Object} options - See the object specification table below for structure 
    * of this object.
    * @param {boolean} options.closestFirst - Used when the [setFeatures](#setFeatures) method
    * displays multiple features in the popup. Enable this option to display the feature closest to
    * the specified location first.
    */   
    show: function(location, options) {
      if (!this.popupWindow) {
        return;
      }
      
      // Cancel any pending wait and hide. See _updateUI for
      // when this flag is set
      this._delayHide = false;
      
      if (!location) {
        this._toggleVisibility(true);
        return;
      }
      
      // Is location specified in map coordinates?
      var map = this.map,
          view = this.view || map.view,
          screenLocation;
      if (location.spatialReference) {
        this.location = location;
        screenLocation = view.toScreen(location);
      }
      else {
        this.location = view.toMap(location);
        screenLocation = location;
      }
      
      var mapFrameWidth = view._getFrameWidth ? view._getFrameWidth() : -1;
      if (mapFrameWidth !== -1) {
        screenLocation.x = screenLocation.x % mapFrameWidth;
        if (screenLocation.x < 0) {
          screenLocation.x += mapFrameWidth;
        }
        if (view.width > mapFrameWidth) {
          var margin = (view.width - mapFrameWidth)/2;
          while (screenLocation.x < margin) {
            screenLocation.x += mapFrameWidth;
          }
        }
      }

      if (this._maximized) {
        this.restore();
      }
      else {
        this._setPosition(screenLocation);
      }    
      
      if (options && options.closestFirst) {
        this.showClosestFirst(this.location);
      }
      
      // Display
      if (!this.isShowing) {
        this._toggleVisibility(true);
        this._followMap();
        this.startupDijits(this._title);
        this.startupDijits(this._contentPane);
        this.reposition();
        this.showHighlight();

        this.inherited(arguments);
      }
    },
    
    /**
    * Hides the Popup.
    */
    hide: function() {
      if (this.isShowing) {
        this._toggleVisibility(false);
        this._unfollowMap();
        if (!this.keepHighlightOnHide) {
          this.hideHighlight();
        }

        this.inherited(arguments);
      }
    },
    
    /**
    * Resizes the popup to the specified height (in pixels).
    * 
    * @param {number} width - The new width of the Popup in pixels.
    * @param {number} height - The new height of the Popup in pixels. This value 
    * is set to be the maximum allowable height, if the content doesn't fit within the specified
    * height a vertical scroll bar is displayed.
    */
    resize: function(width, height) {
      if (!this.popupWindow) {
        return;
      }
      
      this._sizers.style({
        width: width + "px"
      });
      
      domStyle.set(this._contentPane, "maxHeight", height + "px");
      this._maxHeight = height;
      
      if (this.isShowing) {
        this.reposition();
      }
    },
    
    /**
    * Re-calculates the popup's position with respect to the map location it is pointing to.
    * Typically, popup automatically takes care of this whenever the content is modified using the
    * [setTitle](#setTitle), [setContent](#setContent) or [setFeatures](#setFeatures) methods. If
    * you modify the popup's DOM in other ways, then you need to call this method to make sure it
    * points to the correct map location.
    */
    reposition: function() {
      if (!this.popupWindow) {
        return;
      }
      
      // NOP if the popup is maximized
      // NOP if the popup is not currently showing
      if (this.view && this.location && !this._maximized && this.isShowing) {
        this._setPosition(this.view.toScreen(this.location));
      }
    },
    
    /************************************
     * Defining some methods specific to
     * this popup info window
     ************************************/
    
    /**
    * Maximizes the Popup.
    */
    maximize: function() {
      var view = this.view;
      if (!view || this._maximized || !this.popupWindow) {
        return;
      }
      this._maximized = true;

      var max = this._maxButton;
      domClass.remove(max, "maximize");
      domClass.add(max, "restore");
      domAttr.set(max, "title", this._nls.NLS_restore);

      var marginLeft = this.marginLeft, marginTop = this.marginTop,
          width = view.width - (2 * marginLeft), height = view.height - (2 * marginTop),
          domNode = this.domNode;
      
      // New positioning
      domStyle.set(domNode, {
        left: this._isRTL ? null : (marginLeft + "px"),
        right: this._isRTL ? (marginLeft + "px") : null,
        top: marginTop + "px",
        bottom: null
      });
      
      domStyle.set(this._positioner, {
        left: null,
        right: null,
        top: null,
        bottom: null
      });

      // Save current size    
      this._savedWidth = domStyle.get(this._sizers[0], "width");
      this._savedHeight = domStyle.get(this._contentPane, "maxHeight");
      
      // New size
      //dojo.removeClass(domNode, "attached");
      
      this._sizers.style({
        width: width + "px"
      });
      
      // TODO
      // Instead of using magic# 65, obtain the current size
      // of title bar plus action bar
      domStyle.set(this._contentPane, {
        maxHeight: (height - 65) + "px",
        height: (height - 65) + "px"
      });
      
      // Hide all tails
      this._showPointer("");
      
      // Disconnect from map
      this._unfollowMap();
      domClass.add(this.domNode, "esri-popup-maximized");

      this.emit("maximize");
    },
    
    /**
    * Restores the popup to the pre-maximized state.
    */  
    restore: function() {
      var view = this.view;
      if (!view || !this._maximized || !this.popupWindow) {
        return;
      }
      
      this._maximized = false;

      var max = this._maxButton;
      domClass.remove(max, "restore");
      domClass.add(max, "maximize");
      domAttr.set(max, "title", this._nls.NLS_maximize);
     
      domStyle.set(this._contentPane, "height", null);
      
      //dojo.addClass(domNode, "attached");
      this.resize(this._savedWidth, this._savedHeight);
      this._savedWidth = this._savedHeight = null;

      this.show(this.location);
      
      // Re-connect to map
      this._followMap();
      domClass.remove(this.domNode, "esri-popup-maximized");

      this.emit("restore");
    },
    
    /**
    * Finalizes the creation of the Popup widget. Call startup() after creating the widget
    * when you are ready for user interaction.
    */
    startup: function() {},
    
    /**
    * Destroys the Popup widget. Call `destroy()` when the widget is no longer needed 
    * by the application.
    */  
    destroy: function() {
      if (this.map) {
        this.unsetMap();
      }
      this.cleanup();
      if (this.isShowing) {
        this.hide();
      }
      this.destroyDijits(this._title);
      this.destroyDijits(this._content);
      array.forEach(this._eventConnections, function(handle) {
        handle.remove();
      });
      domConstruct.destroy(this.domNode);
      
      this._sizers = this._contentPane = this._actionList =
      this._positioner = this._pointer = this._outerPointer = 
      this._title = this._prevFeatureButton = 
      this._nextFeatureButton = this._spinner = this._eventConnections = 
      this._pagerScope = this._targetLocation = this._nls = 
      this._maxButton = null;
    },
    
    selectNext: function() {
      this.select(this.selectedIndex + 1);
    },
    
    selectPrevious: function() {
      this.select(this.selectedIndex - 1);
    },
    
    /***********************************************
     * Overriding some methods defined in PopupBase
     ***********************************************/
   
    /**
    * Associate an array of features or an array of Promises that return features with the popup
    * The first feature in the array is automatically selected.
    * 
    * > When setFeatures is used the title area displays the number of features and the index of the 
    * currently selected feature and ignores the title defined in the info template. 
    * If you want to display title text you will need to specify it as part of the popup content.
    *
    * @param {module:esri/Graphic[] | Promise} features - An array of features or promises.
    */
    setFeatures: function() {
      this.inherited(arguments);
      
      // TODO
      // We want to do this only when promises are
      // passed as arguments. As far as I know there is no
      // harm in doing this for features
      this._updateUI();
    },
    
    /****************************
     * Custom Stateful Accessors 
     ****************************/
    
    // Override Stateful's impl that calls "set" for all constructor parameters
    // before the constructor returns.
    postscript: null,
    
    _highlightSetter: function(value) {
      //console.log("setter - highlight: ", value);
      var oldValue = this.highlight, map = this.map;
      
      // 1. Record the new value regardless of whether the value
      // can be applied
      this.highlight = value;
      
      // 2. Apply the new value
      if (
        // Pre-condition for this property's applicability (enabler)
        map && 
        // Apply only if value has changed
        value !== oldValue
      ) {
        if (value) {
          this.enableHighlight(map);
          
          // Display highlight for the selected feature (if any)
          var feature = this.features && this.features[this.selectedIndex];
          if (feature) {
            this.updateHighlight(map, feature);
            this.showHighlight();
          }
        }
        else {
          // Disabling removes the highlight as well
          this.disableHighlight(map);
        }
      }
    },
    
    _pagingControlsSetter: function(value) {
      //console.log("setter - pagingControls: ", value);
      var oldValue = this.pagingControls, map = this.map;
      
      this.pagingControls = value;
      
      if (
        map && 
        value !== oldValue
      ) {
        this._updatePagingControls();
      }
    },
    
    _pagingInfoSetter: function(value) {
      //console.log("setter - pagingInfo: ", value);
      var oldValue = this.pagingInfo, map = this.map;
      
      this.pagingInfo = value;
      
      if (
        map && 
        value !== oldValue &&
        this.features && this.features.length
      ) {
        this._updatePagingInfo();
      }
    },
    
    _popupWindowSetter: function(value) {
      //console.log("setter - popupWindow: ", value);
      var oldValue = this.popupWindow, map = this.map;
      
      this.popupWindow = value;
      
      if (
        map && 
        value !== oldValue
      ) {
        if (value) {
          this._updateUI();
          this._updateWindow();
          
          // TODO
          // Call "show" if map extent intersects the selected feature's
          // geometry
        }
        else {
          this.hide(); // may hide highlight
          this.showHighlight(); // if enabled
        }
      }
    },
    
    _anchorSetter: function(value) {
      //console.log("setter - _anchorSetter: ", value);
      var oldValue = this.anchor;
      
      this.anchor = value;
      
      if (
        this.map && 
        value !== oldValue
      ) {
        this.reposition();
      }
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _featuresCleared: function() {
      //console.log("_featuresCleared");

      this.setTitle("&nbsp;");
      this.setContent("&nbsp;");
      this._setPagerCallbacks(this);
      
      this._updateUI();
      this.hideHighlight();
    },
    
    _featureSelected: function() {
      //console.log("_featureSelected");
      
      this._updateUI();
      this._updateWindow();
    },
    
    _updateWindow: function() {
      var ptr = this.selectedIndex;
      
      if (ptr >= 0) {
        var content = this.getContent(this.features[ptr]),
            widget;
        // Hide title in content if titleInBody = false
        if (!this.titleInBody && content && lang.isString(content.id)) {
          widget = registry.byId(content.id);
          
          if (
            widget && widget.set &&
            /_PopupRenderer/.test(widget.declaredClass)
          ) {
            widget.set("showTitle", false);
          }
        }
        
        this.setContent(content);
        this.updateHighlight(this.map, this.features[ptr]);
        this.showHighlight();
      }
    },
    
    _toggleVisibility: function(visible) {
      this._setVisibility(visible);
      this.isShowing = visible;
    },
    
    _setVisibility: function(visible) {
      domStyle.set(this.domNode, "visibility", visible ? "visible" : "hidden");
      domClass.toggle(this.domNode, 'esri-popup-visible', visible);
    },
    
    _waitAndHide: function(delay) {
      // Hides the popup window after the given delay (milliseconds)
      var self = this;
      this._delayHide = true;
      
      setTimeout(function() {
        if (self._delayHide) {
          self._delayHide = false;
          self.hide();
        }
      }, delay);
    },
    
    _followMap: function() {
      this._unfollowMap();
      //console.log("register");
      
      // Setup handlers for map navigation events
      var view = this.view;
      this._handles = [
        view.watch("viewpoint", this._viewChangeHandler.bind(this))
      ];
    },
    
    _unfollowMap: function() {
      //console.log("UNregister");
      
      var handles = this._handles;
      if (handles) {
        array.forEach(handles, function(handle) {
          handle.remove();
        });
        this._handles = null;
      }
    },
    
    _viewChangeHandler: function(event) {
      this.show(this._targetLocation || this.location);
    },
    
    _onPanStart: function() {
      // Record the current position of my info window
      var style = this.domNode.style;
      this._panOrigin = { left: style.left, top: style.top, right: style.right, bottom: style.bottom };
    },
    
    _onPan: function(extent, delta) {
      var origin = this._panOrigin, dx = delta.x, dy = delta.y,
          left = origin.left, top = origin.top, 
          right = origin.right, bottom = origin.bottom;
      
      if (left) {
        left = (parseFloat(left) + dx) + "px";
      }
      if (top) {
        top = (parseFloat(top) + dy) + "px";
      }
      if (right) {
        right = (parseFloat(right) - dx) + "px";
      }
      if (bottom) {
        bottom = (parseFloat(bottom) - dy) + "px";
      }
      
      // Relocate the info window by the amount of pan delta
      domStyle.set(this.domNode, { left: left, top: top, right: right, bottom: bottom });
    },
    
    _onZoomStart: function() {
      // Temporarily hide the info window
      this._setVisibility(false);
    },
    
    _onExtentChange: function(extent, delta, levelChange) {
      if (levelChange) {
        this._setVisibility(true);
        this.show(this._targetLocation || this.location);
      }
      this._targetLocation = null;
    },
    
    _toggleSize: function() {
      if (this._maximized) {
        this.restore();
      }
      else {
        this.maximize();
      }
    },
    
    _setPosition: function(location) {
      var posX = location.x, posY = location.y, offX = this.offsetX || 0, offY = this.offsetY || 0, 
          pointerW = 0, pointerH = 0,
          mapBox = domGeometry.position(this.view.surface, true), width = mapBox.w, height = mapBox.h,
          classX = "left", classY = "bottom",
          popBox = domGeometry.getContentBox(this._positioner), halfPopW = popBox.w/2, halfPopH = popBox.h/2,
          maxH = domStyle.get(this._sizers[0], "height") + this._maxHeight + domStyle.get(this._sizers[2], "height"), 
          halfMaxH = maxH / 2,
          xmin = 0, ymin = 0, xmax = width, ymax = height,
          pageX = posX, pageY = posY,
          anchor = this.anchor.toLowerCase();

      if (anchor === "auto") {
        // Take into account the current view box. The bbox
        // for calculations below expands or shrinks based on 
        // the current dimensions of the doc view box
        var docBox = win.getBox; //lang.getObject("dojo.window.getBox");
        if (docBox) {
          docBox = docBox();
          xmin = Math.max(docBox.l, mapBox.x);
          xmax = Math.min(docBox.l + docBox.w, mapBox.x + mapBox.w);
          ymin = Math.max(docBox.t, mapBox.y);
          ymax = Math.min(docBox.t + docBox.h, mapBox.y + mapBox.h);
          pageX += mapBox.x;
          pageY += mapBox.y;
        }
        //console.log(xmin, xmax, ymin, ymax);
  
        // TODO
        // 1. Find the real maximum height (maxH) from all the sizers
        // 2. Call this method whenever popup renderer content changes
        // 3. Include pointer width/height in the comparison below
  
        //console.log("max allowed height = " + maxH);
        //console.log("popup content box = " + dojo.toJson(popBox));
        
        var halfNorth = ((pageY - ymin) > halfMaxH),
            halfSouth = ((ymax - pageY) >= halfMaxH),
            halfEast = ((xmax - pageX) >= halfPopW),
            halfWest = ((pageX - xmin) > halfPopW),
            fullNorth = ((pageY - ymin) >= maxH),
            fullSouth = ((ymax - pageY) >= maxH),
            fullEast = ((xmax - pageX) >= popBox.w),
            fullWest = ((pageX - xmin) >= popBox.w);
        
        // Check horizontal space first
        if (halfNorth && halfSouth) {
          if (fullEast) {
            classY  = "";
            classX = "left";
          }
          else if (fullWest) {
            classY  = "";
            classX = "right";
          }
        }
        
        // Check vertical space
        if (classX && classY) {
          if (halfWest && halfEast) {
            if (fullNorth) {
              classX  = "";
              classY = "bottom";
            }
            else if (fullSouth) {
              classX  = "";
              classY = "top";
            }
          }
        }
        
        // Check corners
        if (classX && classY) {
          if (fullEast && fullNorth) {
            classX = "left";
            classY = "bottom";
          }
          else if (fullEast && fullSouth) {
            classX = "left";
            classY = "top";
          }
          else if (fullWest && fullSouth) {
            classX = "right";
            classY = "top";
          }
          else if (fullWest && fullNorth) {
            classX = "right";
            classY = "bottom";
          }
          /*else {
            // Use default orientation for now.
            // TODO
            // Need a new strategy to handle this case - like maximize the popup?
          }*/
        }
      }
      else {
        classY = classX = "";
        
        if (anchor.indexOf("top") !== -1) {
          classY = "bottom";
        }
        else if (anchor.indexOf("bottom") !== -1) {
          classY = "top";
        }

        if (anchor.indexOf("left") !== -1) {
          classX = "right";
        }
        else if (anchor.indexOf("right") !== -1) {
          classX = "left";
        }
      }

      var className = classY && classX ?
                      classY + "-" + classX :
                      classY || classX;
      
      // Height of the pointers (from popup.css)
      switch(className) {
        case "top":
        case "bottom":
          pointerH = 14; // 26;
          break;
        case "left":
        case "right":
          pointerW = 13; // 25; 
          break;
        case "top-left":
        case "top-right":
        case "bottom-left":
        case "bottom-right":
          pointerH = 14;
          pointerW = -16; // additional 3 to center beak on associated point
          break;
      }

      // Place popup at the right position
      domStyle.set(this.domNode, {
        left: posX + "px",
        top: posY + "px",
        right: null,
        bottom: null
      });
      
      var styleVal = { left: null, right: null, top: null, bottom: null };
      
      if (classX) {
        styleVal[classX] = (pointerW + offX) + "px";
      }
      else {
        styleVal.left = (-halfPopW) + "px";
      }
      
      if (classY) {
        styleVal[classY] = (pointerH + offY) + "px";
      }
      else {
        styleVal.top = (-halfPopH) + "px";
      }

      domStyle.set(this._positioner, styleVal);

      // Display pointer
      this._showPointer(className);
    },
    
    _showPointer: function(className) {
      domClass.remove(this._pointer, [
        "top", "bottom", "right", "left",
        "top-left", "top-right", "bottom-right", "bottom-left",
        "hidden" 
      ]);

      domClass.remove(this._outerPointer, [
        "right", "left", "hidden"
      ]);

      if (className === "right" || className === "left") {
        className = className;
        domClass.add(this._outerPointer, className);
      }
      else {
        domClass.add(this._pointer, className);
      }
    },
    
    _setPagerCallbacks: function(scope, prevFunc, nextFunc) {
      if (!this.pagingControls) {
        return;
      }
      
      if (scope === this && (!this._pagerScope || this._pagerScope === this)) {
        //console.log("return 1");
        return;
      }
      
      if (scope === this._pagerScope) {
        //console.log("return 2");
        return;
      }
      
      this._pagerScope = scope;
      
      if (scope === this) {
        prevFunc = this.selectPrevious;
        nextFunc = this.selectNext;
      }
      
      var connections = this._eventConnections;
      connections[1].remove();
      connections[2].remove();
      
      if (prevFunc) {
        connections[1] = on(this._prevFeatureButton, "click", prevFunc.bind(scope));
      }
      if (nextFunc) {
        connections[2] = on(this._nextFeatureButton, "click", nextFunc.bind(scope));
      }
    },
    
    _getLocation: function(feature) {
      var map = this.view.map,
          view = this.view,
          point, extent, maxDelta = 0, maxEx, 
          geometry = feature && feature.geometry;
      
      if (geometry) {
        switch(geometry.type) {
          case "point":
            point = geometry;
            break;
            
          case "multipoint":
            point = geometry.getPoint(0);
            extent = geometry.getExtent();
            break;
            
          case "polyline":
            point = geometry.getPoint(0, 0);
            extent = geometry.getExtent();
//            
// edited by javi5947
// removed 'if' clause because map._getFrameWidth doesn't exist
// TODO: @yann / @dasa - do we need this function in hydra? 
//            if (map._getFrameWidth() !== -1) {
              //find the biggest geometry to zoom to.              
              array.forEach(geometry.paths, function(path) {
                var subPolylineJson = { "paths": [path, map.spatialReference] },
                    subPolyline = new Polyline(subPolylineJson),
                    subEx = subPolyline.getExtent(),
                    deltaY = Math.abs(subEx.ymax - subEx.ymin),
                    deltaX = Math.abs(subEx.xmax - subEx.xmin),
                    delta = (deltaX > deltaY) ? deltaX: deltaY;
                    
                if (delta > maxDelta) {
                  maxDelta = delta;
                  maxEx = subEx;
                }
              });
              
              maxEx.spatialReference = extent.spatialReference;
              extent = maxEx;
//            }
            break;
            
          case "polygon":
            point = geometry.getPoint(0, 0);
            extent = geometry.getExtent();
            //            
            // edited by javi5947
            // removed 'if' clause because map._getFrameWidth doesn't exist
            // TODO: @yann / @dasa - do we need this function in hydra? 
            //for wrap around case, find the smaller extent to fit the geometries with multi-parts.
            //if (view._getFrameWidth() !== -1) {
              //find the biggest geometry to zoom to.
              array.forEach(geometry.rings, function(ring) {
                var subPolygonJson = { "rings": [ring, map.spatialReference] },
                    subPolygon = new Polygon(subPolygonJson),
                    subEx = subPolygon.getExtent(),
                    deltaY = Math.abs(subEx.ymax - subEx.ymin),
                    deltaX = Math.abs(subEx.xmax - subEx.xmin),
                    delta = (deltaX > deltaY) ? deltaX: deltaY;
                
                if (delta > maxDelta) {
                  maxDelta = delta;
                  maxEx = subEx;
                }
              });
              
              maxEx.spatialReference = extent.spatialReference;
              extent = maxEx;
            //}
            break;
        }
      }
      
      return [point, extent];
    },
    
    _zoomToFeature: function(e) {
      // https://support.sitepen.com/issues/22494
      // https://bugs.dojotoolkit.org/ticket/17378
      e.preventDefault();  
      
      var features = this.features,
          ptr = this.selectedIndex,
          view = this.view, factor = this.zoomFactor || 4;
      
      if (features) {
        var location = this._getLocation(features[ptr]),
            point = location[0], extent = location[1];
        
        if (!point) {
          point = this.location;
        }

        // Got to make sure that popup is "show"ed "at" the feature 
        // after zooming in.
        if (!extent || !extent.intersects(this.location)) {
          //this._targetLocation = location[0];
          this.location = point;
        }
        
        if(view){
          if(extent && point){
            view.animateTo({
              target: extent
            }).then(function(){
              this.show(point);
            }.bind(this));
          }
          else if(point){
            view.animateTo({
              target: point,
              scale: view.scale / factor
            }).then(function(){
              this.show(point);
            }.bind(this));
          }
        }
        
      } // features
    },
    
    _updatePagingControls: function() {
      var prev = this._prevFeatureButton, next = this._nextFeatureButton,
          ptr = this.selectedIndex,
          count = this.features ? this.features.length : 0;
      
      if (this.pagingControls && count > 1) {
        if (ptr === 0) {
          domClass.add(prev, "hidden");
        }
        else {
          domClass.remove(prev, "hidden");
        }
        
        if (ptr === (count - 1)) {
          domClass.add(next, "hidden");
        }
        else {
          domClass.remove(next, "hidden");
        }
      }
      else {
        domClass.add(prev, "hidden");
        domClass.add(next, "hidden");
      }
    },
    
    _updatePagingInfo: function() {
      var count = this.features ? this.features.length : 0,
          nls = this._nls, title = "&nbsp;",
          feature, template, featureTitle;
      
      if (this.pagingInfo && count > 1 && nls.NLS_pagingInfo) {
        title = esriLang.substitute({
          index: this.selectedIndex + 1, 
          total: count
        }, nls.NLS_pagingInfo);
      }
      
      // Display title in titlebar in some cases.
      if (count) {
        feature = this.getSelectedFeature();
        template = feature.getEffectivePopupTemplate();
        featureTitle = this.getTitle(feature);
            
        if (
          (
            !template || 
            /esri\.InfoTemplate/.test(template.declaredClass) || 
            !this.titleInBody // PopupTemplate, but user wishes to display title in the titlebar
          ) &&
          featureTitle
        ) {
          title = featureTitle + ((title === "&nbsp;") ? "" : (" " + title));
        }
      }
      
      this.setTitle(title);
    },
    
    _updateUI: function() {
      // TODO
      // A state machine based manipulation of UI elements'
      // visibility would greatly simplify this process
      if (!this.popupWindow) {
        return;
      }
      
      var features = this.features, promises = this.promises,
          count = features ? features.length : 0,
          //prev = this._prevFeatureButton, next = this._nextFeatureButton,
          spinner = this._spinner, actionList = this._actionList,
          nls = this._nls;
      
      this._updatePagingControls();
      this._updatePagingInfo();
      
      if (count) {
        domClass.remove(actionList, "hidden");
      }
      else {
        domClass.add(actionList, "hidden");
      }
      
      if (promises && promises.length) {
        if (features) {
          domClass.remove(spinner, "hidden");
        }
        else {
          this.setContent("<div style='text-align: center;'>" + nls.NLS_searching + "...</div>");
        }
      }
      else {
        domClass.add(spinner, "hidden");
        if (!count) {
          this.setContent("<div style='text-align: center;'>" + nls.NLS_noInfo + ".</div>");
          
          if (!this.visibleWhenEmpty) {
            this._waitAndHide(this.hideDelay);
          }
        }
      }
    }
  });

  return Popup;
});
