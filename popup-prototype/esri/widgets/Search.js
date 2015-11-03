/**
 * The Search widget provides a way to perform search capabilities based on {@link module:esri/tasks/Locator locator service(s)}
 * and/or {@link module:esri/layers/ArcGISDynamicLayer map}/{@link module:esri/layers/FeatureLayer feature} service feature layer(s).
 * These specified sources determine what is
 * searchable within the search box. If using a locator with a geocoding service, the
 * [findAddressCandidates](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm)
 * operation is used, whereas {@link module:esri/tasks/support/Query queries} are used on feature layers.
 *
 * __Note:__ When using a Map with a SpatialReference other than Web Mercator or Geographic, be
 * sure to set a default GeometryService. This will ensure that the user's position is returned
 * in the same SpatialReference as the Map.
 *
 * @module esri/widgets/Search
 * @since 4.0
 * @see [Search.css](css/source-code/esri/widgets/Search/css/Search.css)
 * @see [Sample - Search widget (2D)](../sample-code/2d/search2d/)
 * @see [Sample - Search widget (3D)](../sample-code/3d/search3d/)
 * @see module:esri/tasks/Locator
 * @see module:esri/layers/FeatureLayer
 */

/**
 * The following are properties that may only be set on {@link module:esri/tasks/Locator Locator} sources. The table in the
 * [sources documentation](#sources) contains additional properties that may be set on any source.
 *
 * @typedef {Object} locatorSource
 *
 * @property {string[]} categories - A string array which limits the results to one or more categories. For example "Populated Place" or
 *                                    "airport". Only applicable when using the World Geocode Service. View the
 * [World Geocoding Service documentation](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm) for more information.
 * @property {string} countryCode - Constricts search results to a specified country code. For example, `US` for United States or `SE` for Sweden.
 *                                      Only applies to the World Geocode Service. View the
 * [World Geocoding Service documentation](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm) for more information.
 * @property {Object} localSearchOptions - Sets the sources for local `distance` and `minScale` for searching. See the object specification table below for details.
 * @property {number} localSearchOptions.distance - The distance to search.
 * @property {number} localSearchOptions.minScale - The minimum scale used to search locally.
 * @property {number} locationToAddressDistance - When reverse geocoding a result, use this distance in meters. The default is `1500`.
 * @property {string} searchTemplate - A template string used to display multiple fields in a defined order when results are displayed, 
 * e.g. `"${Street}, ${City}, ${ZIP}"`.
 * @property {module:esri/tasks/Locator} locator - The locator task used to search. This is **required** and defaults to the
 * [World Geocoding Service](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm).
 * @property {string} singleLineFieldName - The field name of the Single Line Address Field in the REST services directory for the locator service.
 *                                          Common values are `SingleLine` and `SingleLineFieldName`.
 */

/**
 * The following are properties that may only be set on {@link module:esri/layers/FeatureLayer FeatureLayer sources}. The table in the
 * [sources documentation](#sources) contains additional properties that may be set on any source.
 *
 * @typedef {Object} featureLayerSource
 *
 * @property {string} displayField - The results are displayed using this field. Defaults to the layer's `displayField` or the first string field.
 * @property {boolean} exactMatch - Indicates to only return results that match the search value exactly. Default is `false`.
 * This property only applies to `string` field searches. `exactMatch` is always `true` when searching fields of type `number`.
 * @property {module:esri/layers/FeatureLayer} featureLayer - The feature layer queried in the search. This is **required**.
 * @property {string[]} searchFields - An array of string values representing the names of fields in the feature layer to search.
 * @property {Object} searchQueryParams - Defines the default options for a {@link module:esri/tasks/support/Query query} when searching feature layers. 
 * Some of these options may be overwritten by the search widget. These include:
 * * **[outSpatialReference](esri-tasks-support-Query.html#outSpatialReference)**
 * * **[returnGeometry](esri-tasks-support-Query.html#returnGeometry)**
 * * **[num](esri-tasks-support-Query.html#num)**
 * * **[outFields](esri-tasks-support-Query.html#outFields)**
 * * **[where](esri-tasks-support-Query.html#where)**
 * * **[maxAllowableOffset](esri-tasks-support-Query.html#maxAllowableOffset)**
 * * **[objectIds](esri-tasks-support-Query.html#objectIds)**
 * @property {Object} suggestQueryParams - Defines the default options for a {@link module:esri/tasks/support/Query query} when requesting suggests on
 * feature layers. Some of these options may be overwritten by the search widget. These include:
 * * **[outSpatialReference](esri-tasks-support-Query.html#outSpatialReference)**
 * * **[returnGeometry](esri-tasks-support-Query.html#returnGeometry)**
 * * **[num](esri-tasks-support-Query.html#num)**
 * * **[outFields](esri-tasks-support-Query.html#outFields)**
 * * **[where](esri-tasks-support-Query.html#where)**
 * @property {string} suggestionTemplate - A template string used to display multiple fields in a defined order 
 * when suggestions are displayed. This takes precedence over `displayField`. Field names in the template must have the following 
 * format: `${FieldName}`. An example suggestionTemplate could look something like: `Name: ${OWNER}, Parcel: ${PARCEL_ID}`.
 */

/**
 * Fires when the widget's text input loses focus.
 *
 * @event module:esri/widgets/Search#blur
 *
 * @example
 * var s = new Search();
 *
 * s.on("blur", function(evt){
 *   console.log("Focus removed from search input textbox.");
 * });
 */

/**
 * Fires when the widget's text input sets focus.
 *
 * @event module:esri/widgets/Search#focus
 *
 * @example
 * var s = new Search();
 *
 * s.on("focus", function(evt){
 *   console.log("Search input textbox is focused.");
 * });
 */

/**
 * Fires when a result is cleared from the input box or a new result is selected.
 *
 * @event module:esri/widgets/Search#clear-search
 *
 * @example
 * var s = new Search();
 *
 * s.on("clear-search", function(evt){
 *   console.log("Search input textbox was cleared.");
 * });
 */

/**
 * Fires when the widget has fully loaded.
 *
 * @event module:esri/widgets/Search#load
 *
 * @example
 * var s = new Search();
 *
 * s.on("load", function(evt){
 *   console.log("Search widget has loaded!");
 * });
 */

/**
 * Fires when the [search()](#search) method is called and returns its results.
 *
 * @event module:esri/widgets/Search#search-results
 * @property {number} activeSourceIndex - The [activeSourceIndex](#activeSourceIndex) of the search result.
 * @property {Error} errors - The error returned from the search results.
 * @property {number} numResults - The number of results from the search.
 * @property {Object[]} results - An array of objects representing the results of the search. See object specification
 * table below for more information about the result object.
 * @property {module:esri/geometry/Extent} results.extent - The extent of the result to zoom to.
 * @property {module:esri/Graphic} results.feature - The graphic feature to place at the location of the search result.
 * @property {string} results.name - The string name of the geocoded location.
 * @property {string} value - The string value used to search (the value of the text box).
 *
 * @example
 * var s = new Search();
 *
 * s.on("search-results", function(evt){
 *   //The results are stored in the evt Object[]
 *   console.log("Results of the search: ", evt);
 * });
 */

/**
 * Fires when a search result is selected.
 *
 * @event module:esri/widgets/Search#select-result
 * @property {Object} result - An object containing the results of the search.
 * @property {module:esri/geometry/Extent} result.extent - The extent of the result to zoom to.
 * @property {module:esri/Graphic} result.feature - The graphic feature to place at the location of the search result.
 * @property {string} result.name - The string name of the geocoded location.
 * @property {Object} source - The source of the selected result. Please see [sources](#sources) for
 * additional information on its properties.
 * @property {number} sourceIndex - The index of the source of the selected result.
 *
 * @example
 * var s = new Search();
 *
 * s.on("select-result", function(evt){
 *   console.log("The selected search result: ", evt);
 * });
 */

/**
 * Fires when the [suggest](#suggest) method is called and returns its results.
 *
 * @event module:esri/widgets/Search#suggest-results
 * @property {number} activeSourceIndex - The [activeSourceIndex](#activeSourceIndex) of the suggest result.
 * @property {Error} errors - The error returned from the suggest results.
 * @property {number} numResults - The number of suggest results.
 * @property {Object[]} results - An array of objects representing the results of suggest. See object specification
 * table below for more information about the result object.
 * @property {boolean} results.isCollection - Indicates if the result is a Collection.
 * @property {string} results.magicKey - The magic key related to the suggest result.
 * @property {string} results.text - The string name of the suggested location to geocode.
 * @property {string} value - The string value used to return suggestions (the value of the text box).
 *
 * @example
 * var s = new Search();
 *
 * s.on("suggest-results", function(evt){
 *   //The results are stored in the evt Object[]
 *   console.log("Results of suggest: ", evt);
 * });
 */

define([
  "require",

  "dojo/_base/lang",
  "dojo/_base/array",

  "dojo/Deferred",
  "dojo/keys",
  "dojo/on",
  "dojo/query",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-construct",

  "dojo/i18n!../nls/jsapi",
  "dojo/text!./Search/templates/Search.html",

  "dijit/_TemplatedMixin",
  "dijit/_FocusMixin",
  "dijit/a11yclick",
  "dijit/focus",

  "./Widget",

  "../core/lang",
  "./../PopupTemplate",
  "../geometry/SpatialReference",
  "../Graphic",
  "../core/promiseList",

  "../symbols/PictureMarkerSymbol",
  "../symbols/SimpleMarkerSymbol",
  "../symbols/SimpleLineSymbol",
  "../symbols/SimpleFillSymbol",
  "../symbols/TextSymbol",
  "../symbols/Font",

  "../geometry/Point",
  "../geometry/Extent",
  "../geometry/support/scaleUtils",

  "../tasks/Locator",
  "../tasks/support/Query",

  "../layers/GraphicsLayer",

  "../Color",

  "../styles/basic"
], function (
  require,
  lang, array,
  Deferred, keys, on, query,
  dom, domAttr, domClass, domConstruct,
  i18n, template,
  _TemplatedMixin, _FocusMixin, a11yclick, focusUtil,
  Widget, esriLang, PopupTemplate, SpatialReference, Graphic, promiseList,
  PictureMarkerSymbol, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, Font,
  Point, Extent, scaleUtils,
  Locator, Query,
  GraphicsLayer,
  Color,
  basicStyle
) {

  // create default symbol
  function createSymbol(scheme, color, geomType, size) {
    var symbol, outline;
    switch (geomType) {
    case "point":
      symbol = new SimpleMarkerSymbol();
      symbol.set("color", color);
      symbol.set("size", size !== null ? size : scheme.size);
      outline = new SimpleLineSymbol();
      outline.set("color", scheme.outline.color);
      outline.set("width", scheme.outline.width);
      symbol.set("outline", outline);
      break;
    case "line":
      symbol = new SimpleLineSymbol();
      symbol.set("color", color);
      symbol.set("width", size !== null ? size : scheme.width);
      break;
    case "polygon":
      symbol = new SimpleFillSymbol();
      symbol.set("color", color);
      outline = new SimpleLineSymbol();
      outline.set("color", scheme.outline.color);
      outline.set("width", scheme.outline.width);
      symbol.set("outline", outline);
      break;
    }
    return symbol;
  }

  var css = {
    root: "esri-search",
    searchGroup: "esri-container",
    searchInput: "esri-input",
    searchInputGroup: "esri-input-container",
    searchBtn: "esri-search-button",
    searchSubmit: "esri-submit",
    searchIcon: "esri-icon esri-icon-search",
    searchButtonText: "esri-icon-font-fallback-text",
    searchToggle: "esri-toggle",
    searchToggleIcon: "esri-icon esri-icon-down-arrow",
    searchMenu: "esri-menu",
    searchMenuHeader: "esri-header",
    searchClear: "esri-clear",
    searchClearIcon: "esri-icon esri-icon-close esri-close",
    searchSpinner: "esri-icon esri-icon-loading-indicator esri-rotating",
    searchSourceName: "esri-source-name",
    suggestionsMenu: "esri-suggest-menu",
    sourcesMenu: "esri-source-menu",
    activeSource: "esri-active",
    hasValue: "esri-has-value",
    hasButtonMode: "esri-has-button-mode",
    hasMultipleSources: "esri-has-multiple-sources",
    showSuggestions: "esri-show-suggestions",
    showSources: "esri-show-sources",
    showNoResults: "esri-show-no-results",
    searchLoading: "esri-search-loading",
    latLonHeader: "esri-lat-long-header",
    searchMoreResults: "esri-more-results",
    searchMoreResultsList: "esri-results-list",
    searchMoreResultsHeader: "esri-more-header",
    searchMoreResultsItem: "esri-more-item",
    searchMoreResultsListHeader: "esri-popup-header",
    searchShowMoreResults: "esri-show-more-results",
    searchNoResultsMenu: "esri-no-results-menu",
    searchNoResultsBody: "esri-no-results-body",
    searchNoResultsHeader: "esri-no-results-header",
    searchNoValueIcon: "esri-no-value-icon esri-icon-notice-triangle",
    searchNoValueText: "esri-no-value-text",
    searchNoResultsText: "esri-no-results-text",
    searchExpandContainer: "esri-expand-container",
    searchAnimateContainer: "esri-animate",
    searchExpanded: "esri-expanded",
    searchCollapsed: "esri-collapsed",
    searchClearFloat: "esri-clearfix"
  };

  var defaultSource = {
    locator: new Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
    singleLineFieldName: "SingleLine",
    outFields: ["Addr_type", "Match_addr", "StAddr", "City"],
    name: i18n.widgets.Search.esriLocatorName,
    localSearchOptions: {
      minScale: 300000,
      distance: 50000
    },
    placeholder: i18n.widgets.Search.placeholder,
    highlightSymbol: new PictureMarkerSymbol(require.toUrl("./Search/images/search-pointer.png"), 36, 36).set({
      xoffset: 9,
      yoffset: 18
    })
  };

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Search
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Search = Widget.createSubclass([_TemplatedMixin, _FocusMixin],
    /** @lends module:esri/widgets/Search.prototype */
    {

      declaredClass: "esri.widgets.Search",

      // Set template file HTML
      templateString: template,

      //--------------------------------------------------------------------------
      //
      //  Lifecycle
      //
      //--------------------------------------------------------------------------

      constructor: function () {
        // event arrays
        this._deferreds = [];
      },

      // post create widget function
      postCreate: function () {
        var _self = this;
        this.inherited(arguments);
        // results id
        this._moreResultsId = this.id + "_more_results";
        // submit button
        this.own(
          on(this.submitNode, a11yclick, this._searchButton.bind(this))
        );
        // sources menu
        this.own(
          on(this.sourcesBtnNode, a11yclick, this._toggleSourcesMenu.bind(this))
        );
        // input click
        this.own(
          on(this.inputNode, a11yclick, this._inputClick.bind(this))
        );
        // clear text
        this.own(
          on(this.clearNode, a11yclick, this._clearButton.bind(this))
        );
        // form
        this.own(on(this.formNode, "submit", function (e) {
          e.preventDefault();
          this._cancelSuggest();
          this.search();
        }.bind(this)));
        // input key down
        this.own(on(this.inputNode, "keyup", function (e) {
          this._inputKey(e);
        }.bind(this)));
        // source button key down
        this.own(on(this.sourcesBtnNode, "keyup", function (e) {
          this._sourceBtnKey(e);
        }.bind(this)));
        // suggestions
        this.own(on(this.suggestionsNode, "li:click, li:keyup", function (e) {
          _self._suggestionsEvent(e, this);
        }));
        // sources
        this.own(on(this.sourcesNode, "li:click, li:keyup", function (e) {
          _self._sourcesEvent(e, this);
        }));
        // input changed
        this.own(on(this.inputNode, "input, paste", function () {
          this._suggestDelay();
        }.bind(this)));
        // if view set
        if (this.view) {
          var pop = this.view.popup;
          // popup events
          if (pop && pop.domNode && this.enablePopup) {
            // show more results on popup
            this.own(on(pop.domNode, on.selector("#" + this._moreResultsId + "_show", a11yclick), function (e) {
              this._showMoreResultsClick(e);
            }.bind(this)));
            // more result clicked
            this.own(on(pop.domNode, on.selector("#" + this._moreResultsId + "_list li a", a11yclick), function (e) {
              this._moreResultsClick(e);
            }.bind(this)));
            // switch coordinates clicked
            this.own(on(pop.domNode, on.selector("#" + this._moreResultsId + " [data-switch-coordinates]", a11yclick), function (e) {
              this._switchCoordinatesClick(e);
            }.bind(this)));
          }
        }
      },

      destroy: function () {
        if (this._mapReadyPromise) {
          this._mapReadyPromise.cancel();
        }
        if (this.graphicsLayer) {
          var view = this.get("view");
          if (view) {
            var map = this.view.map;
            if (map) {
              map.remove(this.graphicsLayer);
            }
          }
        }
        // remove html
        domConstruct.empty(this.domNode);
        this.inherited(arguments);
      },

      //--------------------------------------------------------------------------
      //
      //  Variables
      //
      //--------------------------------------------------------------------------

      css: css,
      _allIndex: "all",
      _objectIdIdentifier: "_objectId",
      _reHostedFS: /https?:\/\/services.*\.arcgis\.com/i,
      _i18n: i18n.widgets.Search,
      _defaultSR: SpatialReference.WGS84,

      //--------------------------------------------------------------------------
      //
      //  Public Properties
      //
      //--------------------------------------------------------------------------

      //----------------------------------
      //  activeSource
      //----------------------------------

      /**
       * The [source](#sources) object currently selected. Can be either a
       * {@link module:esri/layers/FeatureLayer feature layer} or a {@link module:esri/tasks/Locator locator task}.
       *
       * @type {module:esri/layers/FeatureLayer | module:esri/tasks/Locator}
       * @readonly
       */
      activeSource: null,

      //----------------------------------
      //  activeSourceIndex
      //----------------------------------

      /**
       * The currently selected source. When [sources](#sources) is set(), activeSourceIndex will be set to `0`
       * if the sources length is 1. Otherwise, it will be set to "all".
       *
       * @type {number}
       * @default 0
       */
      activeSourceIndex: 0,

      _setActiveSourceIndexAttr: function (newVal) {
        this._set("activeSourceIndex", newVal);
        this._updateActiveSource();
        this._setPlaceholder(newVal);
        this._hideMenus();
        this._insertSources(this.sources);
      },

      //----------------------------------
      //  addLayersFromMap
      //----------------------------------

      /**
       * Indicates whether to automatically add all the feature layers from the map.
       *
       * @type {boolean}
       * @default false
       */
      addLayersFromMap: false,

      //----------------------------------
      //  allPlaceholder
      //----------------------------------

      /**
       * String value used as a hint for input text when searching on multiple sources. See
       * the image below to view the location and style of this text in the context of the widget.
       * 
       * ![search-allPlaceholder](../assets/img/apiref/widgets/search-allPlaceholder.png)
       *
       * @type {string}
       * @default
       * 
       */
      allPlaceholder: i18n.widgets.Search.allPlaceholder,

      _setAllPlaceholderAttr: function (newVal) {
        this._set("allPlaceholder", newVal);
        this._setPlaceholder(this.activeSourceIndex);
      },

      //----------------------------------
      //  autoNavigate
      //----------------------------------

      /**
       * Indicates whether to automatically navigate to the selected result.
       *
       * @type {boolean}
       * @default
       */

      autoNavigate: true,

      //----------------------------------
      //  autoSelect
      //----------------------------------

      /**
       * Indicates whether to automatically select and zoom to the first geocoded result. If `false`, the
       * [findAddressCandidates](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm)
       * operation will still geocode the input string, but the top result will not be selected. To work with the
       * geocoded results, you can set up a [search-results](#event:search-results) event handler and get the results
       * through the event object.
       *
       * @type {boolean}
       * @default
       */
      autoSelect: true,

      //----------------------------------
      //  enableButtonMode
      //----------------------------------

      /**
       * Indicates whether to enable an option to collapse/expand the search into a button.
       *
       * @type {boolean}
       * @default false
       */
      enableButtonMode: false,

      _setEnableButtonModeAttr: function (newVal) {
        this._set("enableButtonMode", newVal);
        this._updateButtonMode(newVal);
      },

      //----------------------------------
      //  enableHighlight
      //----------------------------------

      /**
       * Show the selected feature on the map using a default symbol determined by the source's geometry type.
       *
       * @type {boolean}
       * @default
       */
      enableHighlight: true,

      //----------------------------------
      //  enableLabel
      //----------------------------------

      /**
       * Indicates whether to enable showing a label for the geometry.
       *
       * @type {boolean}
       * @default false
       */
      enableLabel: false,

      //----------------------------------
      //  enablePopup
      //----------------------------------

      /**
       * Indicates whether to display the {@link module:esri/widgets/Popup Popup} on feature click. The graphic can
       * be clicked to display a {@link module:esri/widgets/Popup Popup}. This is not the same as using
       * [showPopupOnSelect](#showPopupOnSelect) which opens the {@link module:esri/widgets/Popup Popup} any time a
       * search is performed.
       *
       * > It is possible to have `showPopupOnSelect=false` but `enablePopup=true` so the {@link module:esri/widgets/Popup Popup}
       * can be opened by someone but it is not opened by default.
       *
       * @type {boolean}
       * @default
       */
      enablePopup: true,

      //----------------------------------
      //  enableSourcesMenu
      //----------------------------------

      /**
       * Indicates whether to enable the menu for selecting different sources.
       *
       * @type {boolean}
       * @default
       */
      enableSourcesMenu: true,

      _setEnableSourcesMenuAttr: function (newVal) {
        this._set("enableSourcesMenu", newVal);
        this._insertSources(this.sources);
      },

      //----------------------------------
      //  enableSearchingAll
      //----------------------------------

      /**
       * Indicates whether to display the option to search all sources. When `true`, the "All" option
       * is displayed by default:
       * 
       * ![search-enableSearchingAll-true](../assets/img/apiref/widgets/search-enableSearchingAll-true.png)
       * 
       * When `false`, no option to search all sources at once is available:
       * 
       * ![search-enableSearchingAll-false](../assets/img/apiref/widgets/search-enableSearchingAll-false.png)
       *
       * @type {boolean}
       * @default
       */
      enableSearchingAll: true,

      _setEnableSearchingAllAttr: function (newVal) {
        this._set("enableSearchingAll", newVal);
        this._setDefaultActiveSourceIndex();
        this._hideMenus();
        this._insertSources(this.sources);
      },

      //----------------------------------
      //  defaultSource
      //----------------------------------

      /**
       * The default source used for the Search widget.
       * 
       * @type {Object}
       * @default
       * @readonly
       */
      defaultSource: defaultSource,

      //----------------------------------
      //  enableSuggestions
      //----------------------------------

      /**
       * Enable suggestions for the widget.
       *
       * > This is only available if working with a 10.3 geocoding service that has suggest capability
       * loaded or a 10.3 feature layer that supports pagination, i.e. `supportsPagination = true`.
       *
       * @type {boolean}
       * @default
       */
      enableSuggestions: true,

      //----------------------------------
      //  enableSuggestionsMenu
      //----------------------------------

      /**
       * Indicates whether to display [suggest](#suggest) results.
       *
       * > Suggestions are only available if working with a 10.3 geocoding service that has suggest capability
       * loaded or a 10.3 feature layer that supports pagination, i.e. `supportsPagination = true`.
       *
       * @type {boolean}
       * @default
       */
      enableSuggestionsMenu: true,

      //----------------------------------
      //  expanded
      //----------------------------------

      /**
       * Indicates whether to set the state of the [enableButtonMode](#enableButtonMode) to expanded (`true`) or collapsed (`false`).
       *
       * @type {boolean}
       * @default false
       */
      expanded: false,

      _setExpandedAttr: function (newVal) {
        this._set("expanded", newVal);
        this._expanded();
      },

      //----------------------------------
      //  graphicsLayer
      //----------------------------------

      /**
       * This is the specified {@link module:esri/layers/GraphicsLayer GraphicsLayer} to use for the
       * [highlightGraphic](#highlightGraphic) and [labelGraphic](#labelGraphic).
       *
       * @type {module:esri/layers/GraphicsLayer}
       */
      graphicsLayer: null,

      //----------------------------------
      //  highlightGraphic
      //----------------------------------

      /**
       * Indicates the highlighted location graphic.
       *
       * @type {module:esri/Graphic}
       * @readonly
       */
      highlightGraphic: null,

      //----------------------------------
      //  labelGraphic
      //----------------------------------

      /**
       * Graphic property for the text label.
       *
       * @type {module:esri/Graphic}
       * @readonly
       */
      labelGraphic: null,

      //----------------------------------
      //  labelSymbol
      //----------------------------------

      /**
       * The text symbol for the label graphic.
       *
       * @type {module:esri/symbols/TextSymbol}
       */
      labelSymbol: new TextSymbol().set("color", new Color([181, 56, 46, 0.9])).set("font", new Font("14px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD, "Arial")),

      //----------------------------------
      //  loaded
      //----------------------------------

      /**
       * Indicates whether the widget is loaded.
       *
       * @type {boolean}
       * @readonly
       */
      loaded: null,

      //----------------------------------
      //  maxLength
      //----------------------------------

      /**
       * The maximum character length of the search text.
       *
       * @type {number}
       * @default
       */
      maxLength: 128,

      _setMaxLengthAttr: function (newVal) {
        this._set("maxLength", newVal);
        domAttr.set(this.inputNode, "maxLength", newVal);
      },

      //----------------------------------
      //  maxResults
      //----------------------------------

      /**
       * The maximum number of results returned by the widget if not specified by source.
       *
       * @type {number}
       * @default
       */
      maxResults: 6,

      //----------------------------------
      //  maxSuggestions
      //----------------------------------

      /**
       * The maximum number of suggestions returned by the widget if not specified by source.
       *
       * > If working with the default
       * [ArcGIS Online Geocoding service](https://developers.arcgis.com/rest/geocode/api-reference/overview-world-geocoding-service.htm),
       * the default remains at `5`.
       *
       * @type {number}
       * @default
       */
      maxSuggestions: 6,

      //----------------------------------
      //  minCharacters
      //----------------------------------

      /**
       * The minimum number of characters needed for the search if not specified by source.
       *
       * @type {number}
       * @default
       */
      minCharacters: 1,

      //----------------------------------
      //  popupTemplate
      //----------------------------------

      /**
       * A customized PopupTemplate for the selected feature. 
       * Do not specify a wildcard `{*}` for this PopupTemplate as it 
       * will return all fields in addition to search-specific fields.
       *
       * @type {module:esri/PopupTemplate}
       */
      popupTemplate: new PopupTemplate({
        title: i18n.widgets.Search.searchResult,
        content: "<div class=\"{searchTheme}\"><div id=\"{searchMoreResultsId}\" class=\"{searchMoreResults}\"><div class=\"{searchMoreResultsItem}\">{searchResult}</div><div>{searchMoreResultsHtml}</div></div></div>"
      }),

      //----------------------------------
      //  searchResults
      //----------------------------------

      /**
       * An array of current results from the search.
       *
       * @type {Object[]}
       */
      searchResults: null,

      //----------------------------------
      //  selectedResult
      //----------------------------------

      /**
       * An result selected from a search
       *
       * @type {Object[]}
       */
      selectedResult: null,

      //----------------------------------
      //  showPopupOnSelect
      //----------------------------------

      /**
       * Indicates whether to show the {@link module:esri/widgets/Popup Popup} when a result is selected.
       * Using showPopupOnSelect opens the {@link module:esri/widgets/Popup Popup} any time a search is performed.
       *
       * > It is possible to have `showPopupOnSelect=false` but `enablePopup=true` so the {@link module:esri/widgets/Popup Popup}
       * can be opened by someone but not opened by default.
       *
       * @type {boolean}
       * @default
       */
      showPopupOnSelect: true,

      //----------------------------------
      //  sources
      //----------------------------------

      /**
       * This property defines which services will be used for the search. It's an array of objects, each of which is called a `source` 
       * and may be configured using the object specifications below. Two types of sources may be searched:
       *
       * * {@link module:esri/layers/FeatureLayer **FeatureLayers**} - see the
       * {@link module:esri/widgets/Search~featureLayerSource FeatureLayer Source object specification table}
       * for more details on how to define FeatureLayer source objects.
       * * {@link module:esri/tasks/Locator **Locators**} - see the
       * {@link module:esri/widgets/Search~locatorSource Locator Source object specification table}
       * for more details on how to define Locator source objects.
       *
       * Any combination of one or more geocoding and feature layer sources may be used together in the same instance of the Search widget. The following 
       * properties may be set on either Locator or FeatureLayer source objects:
       *
       * @property {boolean} autoNavigate - Indicates whether to automatically navigate to the selected result once selected. The default is `true`.
       * @property {boolean} enableHighlight - Indicates whether to show a graphic on the map for the selected source using the [highlightSymbol](#highlightSymbol).
       *                                       The default value is `true`.
       * @property {boolean} enablePopup - Indicates whether to display a {@link module:esri/widgets/Popup Popup} when a selected result is clicked.
       *                                  The default is `true`.
       * @property {boolean} enableLabel - Indicates whether to show a text label on the map for the selected source using [labelSymbol](#labelSymbol).
       *                                  The default value is `false`.
       * @property {boolean} enableSuggestions - Indicates whether to display suggestions as the user enters input text in the widget. The default value is `true`.
       * @property {module:esri/widgets/Popup} popup - The Popup instance used for the selected result.
       * @property {module:esri/symbols/TextSymbol} labelSymbol - The TextSymbol used to label the selected result.
       * @property {number} maxResults - Indicates the maximum number of search results to return. The default value is `6`.
       * @property {number} maxSuggestions - Indicates the maximum number of suggestions to return for the widget's input. The default value is `6`.
       * @property {number} minCharacters - Indicates the minimum number of characters required before querying for a suggestion. The default value is `1`.
       * @property {string} name - The name of the source for display.
       * @property {string[]} outFields - Specifies the fields returned with the search results.
       * @property {string} placeholder - Used as a hint for the source input text.
       * @property {string} prefix - Specify this to prefix the input for the search text.
       * @property {module:esri/geometry/Extent[]} searchExtent - Set this to constrain the search results to an extent or array of Extents.
       * @property {boolean} showPopupOnSelect - Indicates whether to show the {@link module:esri/widgets/Popup Popup} when a result is selected.
       *                                          The default value is `true`.
       * @property {string} suffix - Specify this to suffix the input for the search text.
       * @property {boolean} useMapExtent - Indicates whether to constrain the search results to the map's extent.
       * @property {number} zoomScale - Applicable to the specified source. If the result does not have an associated extent, specify this number to use as the zoom scale for the result.
       * *
       * @type {Object[]}
       *
       * @example
       * //Default sources[] when sources is not specified
       * [
       *   {
       *     locator: new Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
       *     singleLineFieldName: "SingleLine",
       *     outFields: ["Addr_type"],
       *     name: i18n.widgets.Search.esriLocatorName,
       *     localSearchOptions: {
       *       minScale: 300000,
       *       distance: 50000
       *     },
       *     placeholder: i18n.widgets.Search.placeholder,
       *     highlightSymbol: new PictureMarkerSymbol(this.basePath + "/images/search-pointer.png", 36, 36).setOffset(9, 18)
       *   }
       * ]
       *
       * @example
       * //Example of multiple sources[]
       * var sources = [
       * {
       *   locator: ,
       *   singleLineFieldName: "SingleLine",
       *   name: "Custom Geocoding Service",
       *   localSearchOptions: {
       *     minScale: 300000,
       *     distance: 50000
       *   },
       *   placeholder: "Search Geocoder",
       *   maxResults: 3,
       *   maxSuggestions: 6,
       *   enableSuggestions: false,
       *   minCharacters: 0
       * }, {
       *   featureLayer: new FeatureLayer({
       *     url: "http://services.arcgis.com/DO4gTjwJVIJ7O9Ca/arcgis/rest/services/GeoForm_Survey_v11_live/FeatureServer/0",
       *     outFields: ["*"]
       *   }),
       *   searchFields: ["Email", "URL"],
       *   displayField: "Email",
       *   exactMatch: false,
       *   outFields: ["*"],
       *   name: "Point FS",
       *   labelSymbol: textSymbol,
       *   placeholder: "example: esri",
       *   maxResults: 6,
       *   maxSuggestions: 6,
       *   enableSuggestions: true,
       *   minCharacters: 0
       * },
       * {
       *   featureLayer: new FeatureLayer({
       *     outFields: ["*"]
       *   });
       *   placeholder: "esri",
       *   name: "A FeatureLayer",
       *   prefix: "",
       *   suffix: "",
       *   maxResults: 1,
       *   maxSuggestions: 6,
       *   searchExtent: null,
       *   exactMatch: false,
       *   searchFields: [], // defaults to FeatureLayer.displayField
       *   displayField: "", // defaults to FeatureLayer.displayField
       *   labelSymbol: new TextSymbol(),
       *   minCharacters: 0
       * }
       * ];
       *
       * @example
       * //Set source(s) on creation
       * var s = new Search({
       *   sources: []
       * });
       * s.startup();
       *
       * //Set source(s)
       * var s = new Search();
       * var sources = [{ ... }, { ... }, { ... }]; //array of sources
       * s.sources = sources;
       * s.startup();
       *
       * //Add to source(s)
       * var s = new Search();
       * s.sources.push({ ... });  //new source
       * s.startup();
       */
      sources: [defaultSource],

      _setSourcesAttr: function (newVal) {
        this._set("sources", newVal);
        this._setDefaultActiveSourceIndex();
        this._hideMenus();
        this._insertSources(newVal);
      },

      //----------------------------------
      //  suggestResults
      //----------------------------------

      /**
      /**
       * An array of current results from the [suggest method](#suggest).
       *
       * > This is available if working with a 10.3 geocoding service that has suggest capability loaded or a
       * 10.3 feature layer that supports pagination, i.e. `supportsPagination = true`.
       *
       * @type {Object[]}
       * @readonly
       */
      suggestResults: null,

      //----------------------------------
      //  suggestionDelay
      //----------------------------------

      /**
       * The millisecond delay after keyup and before making a [suggest](#suggest) network request.
       *
       * @type {number}
       * @default
       */
      suggestionDelay: 150,

      //----------------------------------
      //  value
      //----------------------------------

      /**
       * The current value of the search box input text string.
       *
       * @type {string}
       */
      value: "",

      _setValueAttr: function (newVal) {
        this.set("magicKey", null);
        this._set("value", newVal);
        // needed for keyup typing
        domAttr.set(this.inputNode, "value", newVal);
        // check input box's status
        this._checkStatus();
      },

      //----------------------------------
      //  view
      //----------------------------------

      /**
       * Reference to the {@link module:esri/views/MapView MapView} or {@link module:esri/views/Scene SceneView}
       * that contains the widget. Value is `null` if no view is specified.
       *
       * @type {module:esri/views/MapView | module:esri/views/SceneView}
       */
      view: null,

      _setViewAttr: function (newVal) {
        this._set("view", newVal);
        // set widget ready
        this.set("loaded", false);
        if (this.view) {
          var promises = [this.view];
          var map = this._getMap();
          if (map) {
            promises.push(map);
          }
          // if map is in options
          if (promises.length) {
            promiseList(promises).always(function () {
              this._init();
            }.bind(this));
          } else {
            // lets go
            this._init();
          }
        }
      },

      //----------------------------------
      //  zoomScale
      //----------------------------------

      /**
       * If the result does not have an associated extent, specify this number to use as the zoom scale for the result. This can be applied directly to the widget or individual sources.
       *
       * @type {number}
       * @default
       */
      zoomScale: 1000,

      //----------------------------------
      //  magicKey
      //----------------------------------

      magicKey: null,

      //----------------------------------
      //  locationToAddressDistance
      //----------------------------------

      locationToAddressDistance: 1500,

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      /**
       * Clears the current value, search results, suggest results, graphic, and/or graphics layer.
       * It also hides any open menus.
       */
      // clear the input box
      clear: function () {
        // remove highlight graphic
        this.clearGraphics();
        if (domAttr.get(this.inputNode, "value")) {
          // empty input value
          domAttr.set(this.inputNode, "value", "");
        }
        // set current text
        this._changeAttrValue("value", "");
        // empty results
        this.set("searchResults", null);
        this.set("suggestResults", null);
        this.set("selectedResult", null);
        this.set("magicKey", null);
        // get node of reset button and remove it's active class
        domClass.remove(this.containerNode, this.css.hasValue);
        domAttr.set(this.clearNode, "title", "");
        // remove active menus
        this._hideMenus();
        // close info window
        this._closePopup();
        // hide loading
        this._hideLoading();
        // clear event
        this.emit("clear-search");
      },

      /**
       * Depending on the sources specified, search() queries the feature layer(s) and/or performs
       * address matching using any specified {@link module:esri/tasks/Locator Locator(s)} and
       * returns any applicable results.
       *
       * @param {(string|module:esri/geometry/Geometry|Object|Array)=} value - This value can be
       *        a string, geometry, suggest candidate object, or an array of [latitude,longitude].
       *        If a geometry is supplied, then it will reverse geocode (locator) or
       *        findAddressCandidates with geometry instead of text (featurelayer).
       *
       * @return {Promise} When resolved, returns an object containing an array of search results.
       */
      search: function (e) {
        var def = new Deferred();
        this._mapLoaded().then(function () {
          this._searchDeferred(e).then(function (response) {
            // format results
            var results = response.results;
            // set results property
            this.set("searchResults", results);
            // no results found
            if (response.numResults === 0) {
              this._noResults(response.value);
              this._showNoResultsMenu();
            }
            // remove loading spinner
            this._hideLoading();
            // emit event
            this.emit("search-results", response);
            // select first result
            this._selectFirstResult(results, response.activeSourceIndex);
            def.resolve(results);
          }.bind(this), function (error) {
            def.reject(error);
          });
        }.bind(this));
        return def.promise;
      },

      /**
       * Performs a suggest() request on the active Locator. It also uses the current value of
       * the widget or one that is passed in.
       *
       * __Note:__ Suggestions are available if working with a 10.3 geocoding service that has
       * "suggest" capability loaded or a 10.3 feature layer that supports pagination, i.e.
       * supportsPagination = true.
       *
       * @param {string=} value - The string value used to suggest() on an active Locator. If
       *                         nothing is passed in, takes the current value of the widget.
       *
       * @return {Promise} When resolved, returns an object containing an array of suggestions.
       */
      suggest: function (value) {
        var def = new Deferred();
        this._mapLoaded().then(function () {
          this._suggestDeferred(value).then(function (response) {
            // if we got back a response for the event
            if (response) {
              // format results
              var results = response.results;
              // set suggestions property
              this.set("suggestResults", results);
              // show suggestion menu
              this._insertSuggestions(results, response.value);
              // emit event
              this.emit("suggest-results", response);
              def.resolve(results);
            }
          }.bind(this), function (error) {
            def.reject(error);
          });
        }.bind(this));
        return def.promise;
      },

      /**
       * Selects a result.
       *
       * @param {Object} value - The result object to select.
       */
      select: function (e) {
        var highlightSymbol = this._getDefaultSymbol(e);
        var labelSymbol = this.labelSymbol;
        var source;
        var sources = this.sources;
        var sourceIdx = this.activeSourceIndex;
        var enableHighlight = this.enableHighlight;
        var enableLabel = this.enableLabel;
        var autoNavigate = this.autoNavigate;
        var showPopupOnSelect = this.showPopupOnSelect;
        var enablePopup = this.enablePopup;
        var popupTemplate = this.popupTemplate;
        // note 4.0 graphic fromJson
        var clone = Graphic.fromJSON(e.feature.toJSON());
        // if all sources
        if (sourceIdx === this._allIndex) {
          // get source index of result
          var idx = this._getSourceIndexOfResult(e);
          if (idx !== null) {
            source = sources[idx];
            sourceIdx = idx;
          }
        } else {
          source = sources[sourceIdx];
        }
        // if we have a source
        if (source) {
          if (source.hasOwnProperty("highlightSymbol")) {
            // set symbols from source
            highlightSymbol = source.highlightSymbol;
          }
          if (source.hasOwnProperty("labelSymbol")) {
            labelSymbol = source.labelSymbol;
          }
          // if enableHighlight is set on source
          if (source.hasOwnProperty("enableHighlight")) {
            enableHighlight = source.enableHighlight;
          }
          // if enableLabel is set on source
          if (source.hasOwnProperty("enableLabel")) {
            enableLabel = source.enableLabel;
          }
          // if autoNavigate is set on source
          if (source.hasOwnProperty("autoNavigate")) {
            autoNavigate = source.autoNavigate;
          }
          // if showPopupOnSelect is set on source
          if (source.hasOwnProperty("showPopupOnSelect")) {
            showPopupOnSelect = source.showPopupOnSelect;
          }
          // if enablePopup is set on source
          if (source.hasOwnProperty("enablePopup")) {
            enablePopup = source.enablePopup;
          }
          // if popupTemplate is set on source
          if (source.hasOwnProperty("popupTemplate")) {
            popupTemplate = source.popupTemplate;
          } else if (source.featureLayer && source.featureLayer.popupTemplate) {
            popupTemplate = source.featureLayer.popupTemplate;
          }
        }
        // hide menus
        this._hideMenus();
        // hide loading spinner
        this._hideLoading();
        // has a graphic
        if (clone) {
          // get highlight graphic
          var hg = this.highlightGraphic,
            gl = this.graphicsLayer,
            lg = this.labelGraphic;
          // set attributes needed for styling/expanding more results
          var attributes = lang.mixin({}, clone.attributes, {
            searchTheme: this.css.root,
            searchResult: this._searchResultHTML(e),
            searchMoreResults: this.css.searchMoreResults,
            searchMoreResultsItem: this.css.searchMoreResultsItem,
            searchMoreResultsId: this._moreResultsId,
            searchMoreResultsHtml: this._moreResultsHTML(e)
          });
          // popup template
          var it = null;
          if (enablePopup) {
            it = popupTemplate;
          }
          // if label graphic on map
          if (lg && gl) {
            gl.remove(lg);
          }
          // create label graphic
          lg = new Graphic(clone.geometry, labelSymbol, attributes);
          // label graphic enabled
          if (enableLabel) {
            // add graphic to layer
            if (gl) {
              gl.add(lg);
            }
          }
          if (lg && lg.symbol && lg.symbol.type === "textsymbol") {
            // set new text
            lg.symbol.set("text", e.name);
          }
          // if graphic currently on map
          if (hg && gl) {
            gl.remove(hg);
          }
          hg = new Graphic(clone.geometry, highlightSymbol, attributes, it);
          // highlight enabled
          if (enableHighlight) {
            if (gl) {
              gl.add(hg);
            }
          }
          // if highlight graphic is a text symbol
          if (hg && hg.symbol && hg.symbol.type === "textsymbol") {
            // set new text
            hg.symbol.set("text", e.name);
          }
          var pop = null;
          // open popup if enabled
          if (this.view && this.view.popup && enablePopup && showPopupOnSelect) {
            pop = this.view.popup;
            // set popup features
            pop.set({
              visible: true,
              features: [hg],
              location: hg.geometry
            });
          }
          // has extent and autoNavigate
          if (this.view && autoNavigate && e && e.hasOwnProperty("extent")) {
            // note 4.0 animateTo
            this.view.animateTo(e.extent).then(function () {
              if (pop) {
                pop.set({
                  visible: true,
                  location: hg.geometry
                });
              }
            });
          }
          // set highlight graphic
          this.set("highlightGraphic", hg);
          this.set("labelGraphic", lg);
        }
        this.set("selectedResult", e);
        // event
        this.emit("select-result", {
          result: e,
          source: source,
          sourceIndex: sourceIdx
        });
      },

      /**
       * Brings focus to the widget's text input.
       */
      focus: function () {
        focusUtil.focus(this.inputNode);
      },

      /**
       * Unfocuses the widget's text input.
       */
      blur: function () {
        // remove focus from widget
        if (focusUtil.curNode) {
          focusUtil.curNode.blur();
        }
      },

      clearGraphics: function () {
        var hg = this.highlightGraphic,
          gl = this.graphicsLayer,
          lg = this.labelGraphic;
        // remove highlighted graphic
        if (hg) {
          if (gl) {
            gl.remove(hg);
          }
        }
        // remove label graphic
        if (lg) {
          if (gl) {
            gl.remove(lg);
          }
        }
        this.set("labelGraphic", null);
        this.set("highlightGraphic", null);
      },


      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      _init: function () {
        var gl = this.get("graphicsLayer");
        if (!gl) {
          gl = new GraphicsLayer();
          this.set("graphicsLayer", gl);
          var view = this.get("view");
          if (view) {
            var map = this.view.map;
            if (map) {
              map.add(gl);
            }
          }
        }
        // get map layers
        this._getMapLayers().then(function () {
          // set widget ready
          this.set("loaded", true);
          // loaded
          this.emit("load");
        }.bind(this));
      },

      _clearButton: function () {
        // reset stuff
        this.clear();
        // focus on input
        focusUtil.focus(this.inputNode);
      },

      _getMap: function () {
        return this.view && this.view.map;
      },

      _error: function (message) {
        return new Error(this.declaredClass + " " + message);
      },

      _searchDeferred: function (e) {
        var promise;
        var def = new Deferred();
        // current search value
        var value = this.value;
        var idx = this.activeSourceIndex;
        // if argument has index already
        if (e && e.hasOwnProperty("index")) {
          idx = e.index;
        }
        // cleanup stuff
        this._showLoading();
        this._hideMenus();
        this._closePopup();
        this.clearGraphics();
        var defaultSearch = {
          magicKey: this.magicKey,
          text: value
        };
        // argument exists
        if (e) {
          if (typeof e === "string") {
            defaultSearch.text = e;
            // search string
            promise = this._searchQueries(defaultSearch);
          } else if (typeof e === "object" && e.hasOwnProperty("magicKey")) {
            // suggest result
            promise = this._searchQueries(e);
          } else if (typeof e === "object" && e.hasOwnProperty("geometry")) {
            // geometry
            promise = this._searchQueries({
              geometry: e
            });
          } else if (typeof e === "object" && e.hasOwnProperty(this._objectIdIdentifier)) {
            // geometry
            promise = this._searchQueries(e);
          } else if (typeof e === "object" && e.type === "point") {
            // point
            promise = this._searchQueries({
              point: e
            });
          } else if (e instanceof Array && e.length === 2) {
            // array lat/lon
            promise = this._searchQueries({
              latlon: e
            });
          } else {
            // use value for search
            promise = this._searchQueries(defaultSearch);
          }
        } else {
          // use value for search
          promise = this._searchQueries(defaultSearch);
        }
        promise.always(function (response) {
          var formatted = this._formatResults(response, idx, value);
          // return result object
          def.resolve(formatted);
        }.bind(this));
        return def.promise;
      },

      _mapLoaded: function () {
        if (this._mapReadyPromise) {
          this._mapReadyPromise.cancel();
        }
        var def = new Deferred();
        if (this.view && this.view.map) {
          this._mapReadyPromise = this.view.map.always(function () {
            def.resolve();
          });
        } else {
          def.resolve();
        }
        return def.promise;
      },

      _suggestDeferred: function (value) {
        var s;
        var def = new Deferred();
        // store deferred
        this._deferreds.push(def);
        // if no value argument, use widget value
        if (!value) {
          value = this.value;
        }
        var idx = this.activeSourceIndex;
        // do suggestion
        s = this._suggestQueries({
          text: value
        });
        s.always(function (response) {
          // suggest occurred on at least one locator
          // we don't want to emit the suggest-results if no suggestions were performed
          var hasResponse;
          // if we got  aresponse
          if (response) {
            // go through responses
            for (var i = 0; i < response.length; i++) {
              // if we have a response, either error or success
              if (response[i]) {
                hasResponse = true;
              }
            }
          }
          // If a suggest was performed
          if (hasResponse) {
            var formatted = this._formatResults(response, idx, value);
            // resolve with object
            def.resolve(formatted);
          } else {
            // no suggest occurred, return nothing
            def.resolve();
          }
        }.bind(this));
        return def.promise;
      },

      _getDefaultSymbol: function (e) {
        var defaultSymbol, schemes, scheme, type, basemap, basemapid;
        var map = this._getMap();
        // if we have a map
        if (map) {
          // note 4.0 change get basemap
          basemap = map.get("basemap");
          if (basemap) {
            basemapid = basemap.id;
          }
        }
        // no basemap set
        if (!basemapid) {
          basemapid = "topo";
        }
        // if we have a feaure with geometry
        if (e && e.feature && e.feature.geometry) {
          type = e.feature.geometry.type;
        }
        // if we got a type
        if (type) {
          // get scheme
          schemes = basicStyle.getSchemes({
            theme: "default",
            basemap: basemapid,
            geometryType: type
          });
          // if we got schemes
          if (schemes) {
            scheme = schemes.primaryScheme;
          }
          // if we have a scheme
          if (scheme) {
            // add color opacity
            if (scheme.color && scheme.hasOwnProperty("opacity")) {
              scheme.color.a = scheme.opacity;
            }
            // get default symbol
            defaultSymbol = createSymbol(scheme, scheme.color, type, scheme.size);
          }
        }
        return defaultSymbol;
      },

      _selectFirstResult: function (results, idx) {
        // select result if enabled
        if (this.autoSelect && results) {
          var selectFeature;
          // get the first feature to select
          if (idx === this._allIndex) {
            selectFeature = this._getFirstResult(results);
          } else {
            // one source
            if (results[idx] && results[idx][0]) {
              selectFeature = results[idx][0];
            }
          }
          // if we got a feature
          if (selectFeature) {
            this.select(selectFeature);
          }
        }
      },

      _getSourceIndexOfResult: function (e) {
        var results = this.searchResults;
        if (results) {
          // for each source results
          for (var i in results) {
            // if we have results for the source
            if (results[i] && results[i].length) {
              for (var j = 0; j < results[i].length; j++) {
                // if e is within the sources results
                if (results[i][j] === e) {
                  // return the source index
                  return parseInt(i, 10);
                }
              }
            }
          }
        }
        return null;
      },

      _getFirstResult: function (results) {
        // do we have results
        if (results) {
          // for each source results
          for (var i in results) {
            // if we have results for the source
            if (results[i] && results[i][0]) {
              // return first result
              return results[i][0];
            }
          }
        }
        return false;
      },

      _onFocus: function () {
        this.emit("focus");
        this.inherited(arguments);
      },

      _onBlur: function () {
        // hide any menus
        this._hideMenus();
        if (this.enableButtonMode && this.loaded) {
          this.set("expanded", false);
        }
        this.emit("blur");
        this.inherited(arguments);
      },

      // get map layers
      // todo 4.0 test this
      _getMapLayers: function () {
        var def = new Deferred();
        var map = this._getMap();
        // add feature layers from map
        if (this.addLayersFromMap && map) {
          var promises = [];
          // feature and graphics layers
          promises = map.get("layers").getAll();
          if (promises && promises.length) {
            promiseList(promises).always(function (response) {
              var layers = response;
              var setSources;
              // get sources
              var sources = this.sources;
              // each layer
              for (var i = 0; i < layers.length; i++) {
                // make sure its a feature layer
                if (layers[i].loaded && layers[i].type && layers[i].type === "Feature Layer") {
                  // add layer to sources
                  sources.push({
                    featureLayer: layers[i],
                    enableSuggestions: true
                  });
                  setSources = true;
                }
              }
              // at least one layer to set
              if (setSources) {
                // set sources
                this.set("sources", sources);
              }
              // done adding layers
              def.resolve();
            }.bind(this));
          } else {
            // nothing to do
            def.resolve();
          }
        } else {
          // nothing to do
          def.resolve();
        }
        return def.promise;
      },

      _switchCoordinatesClick: function (e) {
        e.preventDefault();
        var target = e.target;
        var switched = domAttr.get(target, "data-switch-coordinates");
        // lat long string
        if (switched) {
          this._cancelSuggest();
          // research with lat/lon
          this.set("value", switched);
          this.search();
        }
      },

      _moreResultsClick: function (e) {
        e.preventDefault();
        var target = e.target;
        // source index
        var dataSourceIdx = parseInt(domAttr.get(target, "data-source-index"), 10);
        // result index
        var dataIdx = parseInt(domAttr.get(target, "data-index"), 10);
        var results = this.searchResults;
        if (results && results[dataSourceIdx]) {
          var selectFeature = results[dataSourceIdx][dataIdx];
          if (selectFeature) {
            this.select(selectFeature);
          }
        }
      },


      _showMoreResultsClick: function (e) {
        e.preventDefault();
        var node = dom.byId(this._moreResultsId);
        if (node) {
          // toggle class for showing more results
          domClass.toggle(node, this.css.searchShowMoreResults);
          // get node for more results text
          var node2 = dom.byId(this._moreResultsId + "_show");
          if (node2) {
            // set text
            if (domClass.contains(node, this.css.searchShowMoreResults)) {
              domAttr.set(node2, "textContent", i18n.widgets.Search.hideMoreResults);
            } else {
              domAttr.set(node2, "textContent", i18n.widgets.Search.showMoreResults);
            }
          }
        }
        // reposition popup
        if (this.view && this.view.popup) {
          this.view.popup.reposition();
        }
      },

      // note: calculate size of object for showing more results
      _getObjectSize: function (obj) {
        var size = 0,
          key;
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            size++;
          }
        }
        return size;
      },

      _sourcesEvent: function (e, target) {
        var dataIdx = domAttr.get(target, "data-index");
        var lists = query("li", this.sourcesNode);
        var idx = array.indexOf(lists, target);
        // not all sources
        if (dataIdx !== this._allIndex) {
          // parse as int
          dataIdx = parseInt(dataIdx, 10);
        }
        // next/previous index
        var newIndex;
        if (e.type === "click" || e.keyCode === keys.ENTER) {
          // set new source index
          this.set("activeSourceIndex", dataIdx);
          focusUtil.focus(this.inputNode);
          this._hideSourcesMenu();
        } else if (e.keyCode === keys.UP_ARROW) {
          e.stopPropagation();
          e.preventDefault();
          // go to previous item
          newIndex = idx - 1;
          if (newIndex < 0) {
            focusUtil.focus(this.sourcesBtnNode);
          } else {
            focusUtil.focus(lists[newIndex]);
          }
        } else if (e.keyCode === keys.DOWN_ARROW) {
          e.stopPropagation();
          e.preventDefault();
          // go to next item
          newIndex = idx + 1;
          if (newIndex >= lists.length) {
            focusUtil.focus(this.sourcesBtnNode);
          } else {
            focusUtil.focus(lists[newIndex]);
          }
        } else if (e.keyCode === keys.ESCAPE) { // esc key
          this._hideSourcesMenu();
          // focus on input
          focusUtil.focus(this.inputNode);
        }
      },

      _suggestionsEvent: function (e, target) {
        // source index
        var dataSourceIdx = domAttr.get(target, "data-source-index");
        // result index
        var dataIdx = parseInt(domAttr.get(target, "data-index"), 10);
        // liste items
        var lists = query("li", this.suggestionsNode);
        var sources = this.sources;
        // index of clicked
        var idx = array.indexOf(lists, target);
        // not all sources
        if (dataSourceIdx !== this._allIndex) {
          // convert to integer
          dataSourceIdx = parseInt(dataSourceIdx, 10);
        }
        var newIndex;
        // clear timeout for query
        this._clearQueryTimeout();
        // click
        if (e.type === "click" || e.keyCode === keys.ENTER) {
          var results = this.suggestResults;
          var result;
          // has result
          if (results && results[dataSourceIdx] && results[dataSourceIdx][dataIdx]) {
            result = results[dataSourceIdx][dataIdx];
          }
          if (result) {
            result.index = dataSourceIdx;
            // feature layer suggest
            if (sources[dataSourceIdx].featureLayer) {
              // get objectID field
              var objectField = sources[dataSourceIdx].featureLayer.objectIdField;
              // set result object id to get
              result[this._objectIdIdentifier] = result.feature.attributes[objectField];
            } else if (result.magicKey && result.text) {
              this.set("value", result.text);
              this.set("magicKey", result.magicKey);
            }
            // lets go
            this.search(result);
            // focus on input
            focusUtil.focus(this.inputNode);
          }
        } else if (e.keyCode === keys.BACKSPACE || e.keyCode === keys.DELETE) {
          focusUtil.focus(this.inputNode);
        } else if (e.keyCode === keys.UP_ARROW) {
          e.stopPropagation();
          e.preventDefault();
          // go to previous item
          newIndex = idx - 1;
          // if first item
          if (newIndex < 0) {
            // go back to input
            focusUtil.focus(this.inputNode);
          } else {
            // go to previous item
            focusUtil.focus(lists[newIndex]);
          }
        } else if (e.keyCode === keys.DOWN_ARROW) {
          e.stopPropagation();
          e.preventDefault();
          // go to next item
          newIndex = idx + 1;
          // if last item
          if (newIndex >= lists.length) {
            // go to input node
            focusUtil.focus(this.inputNode);
          } else {
            // go to next item
            focusUtil.focus(lists[newIndex]);
          }
        } else if (e.keyCode === keys.ESCAPE) { // esc key
          // hide menus
          this._hideMenus();
          // focus on input
          focusUtil.focus(this.inputNode);
        }
      },

      _getResultName: function (e) {
        var str;
        if (e.hasOwnProperty("name") && e.name !== null) {
          str = e.name.toString();
        }
        if (!str) {
          str = i18n.widgets.Search.untitledResult;
        }
        return str;
      },

      _getSuggestionName: function (e) {
        var str, name;
        if (e.hasOwnProperty("name")) {
          name = e.name.toString();
        }
        str = e.text || name;
        if (!str) {
          str = i18n.widgets.Search.untitledResult;
        }
        return str;
      },

      _searchResultHTML: function (e) {
        var html = "";
        if (e.feature && e.feature.attributes && e.feature.attributes.Addr_type && e.feature.attributes.Addr_type === "LatLong") {
          // lat/long split
          var split = e.name.split(" ");
          var lon, lat;
          // has 2
          if (split.length === 2) {
            lon = split[0];
            lat = split[1];
          }
          // has lat and lon
          if (lat && lon) {
            var pLon = parseFloat(lon);
            var pLat = parseFloat(lat);
            var result = pLon + ", " + pLat;
            var switched = pLat + ", " + pLon;
            html += "<div class=\"" + this.css.searchMoreResultsItem + "\">";
            html += "<div class=\"" + this.css.latLonHeader + "\">" + i18n.widgets.Search.lonlat + "</div>";
            html += result;
            html += "</div>";
            html += "<div class=\"" + this.css.searchMoreResultsItem + "\">";
            // if switched coordates are valid
            if (pLon !== pLat && !(pLon > 90 || pLon < -90 || pLat > 180 || pLat < -180)) {
              html += "<div class=\"" + this.css.latLonHeader + "\">" + i18n.widgets.Search.reverseLonLatHeader + "</div>";
              html += "<a data-switch-coordinates=\"" + switched + "\" tabindex=\"0\" href=\"#\">" + switched + "</a>";
              html += "</div>";
            }
          } else {
            html = e.name;
          }
        } else {
          html = e.name;
        }
        return html;
      },


      _moreResultsHTML: function (e) {
        var html = "";
        var list_html = "";
        var results = this.searchResults;
        var sources = this.sources;
        var count = 0;
        if (results) {
          list_html += "<div class=\"" + this.css.searchMoreResultsItem + "\">";
          list_html += "<a href=\"#\" id=\"" + this._moreResultsId + "_show" + "\">" + i18n.widgets.Search.showMoreResults + "</a>";
          list_html += "</div>";
          list_html += "<div class=\"" + this.css.searchMoreResultsList + "\">";
          list_html += "<div id=\"" + this._moreResultsId + "_list" + "\">";
          // each result array
          for (var i in results) {
            if (results[i]) {
              var resultsLen = results[i].length;
              // if results and result node
              if (resultsLen) {
                // if more than one result and if one result, the one result is not the selected one
                var oneResultSelected = (resultsLen === 1 && results[i][0] === e);
                if (this._getObjectSize(results) > 1 && !oneResultSelected) {
                  var sourceName = this._getSourceName(i);
                  list_html += "<div class=\"" + this.css.searchMoreResultsListHeader + "\">" + sourceName + "</div>";
                }
                if (resultsLen && !oneResultSelected) {
                  list_html += "<ul>";
                  // textbox value
                  var j;
                  // results to show
                  var maxResults = sources[i].maxResults || this.maxResults;
                  // for each result
                  for (j = 0; j < resultsLen && j < maxResults; ++j) {
                    if (results[i][j] !== e) {
                      // name of the result
                      var text = this._getResultName(results[i][j]);
                      // create list item
                      list_html += "<li><a tabindex=\"0\" data-index=\"" + j + "\" data-source-index=\"" + i + "\" href=\"#\">" + text + "</a></li>";
                      count++;
                    }
                  }
                  list_html += "</ul>";
                }
              }
            }
          }
          list_html += "</div>";
          list_html += "</div>";
        }
        // add html if a count exists
        if (count) {
          html += list_html;
        }
        return html;
      },


      _validField: function (featureLayer, field) {
        return featureLayer.getField(field);
      },

      _validFields: function (featureLayer, fields) {
        // if we have a feature layer and fields
        if (featureLayer && fields && fields.length) {
          // each field
          for (var i = 0; i < fields.length; i++) {
            // make sure field is valid
            var valid = this._validField(featureLayer, fields[i]);
            if (!valid) {
              return false;
            }
          }
          // all fields valid
          return true;
        }
        // no fields or layer
        return false;
      },

      _getCodedName: function (codedValues, codedValue) {
        if (codedValues && codedValues.length) {
          for (var i = 0, len = codedValues.length; i < len; i++) {
            var value = codedValues[i];
            if (value.code === codedValue) {
              return value.name;
            }
          }
        }
      },

      _getCodedValue: function (codedValues, name, exactMatch) {
        if (codedValues && codedValues.length) {
          for (var i = 0, len = codedValues.length; i < len; i++) {
            var value = codedValues[i];
            var name1 = value.name;
            var name2 = name;
            if (!exactMatch) {
              name1 = name1.toLowerCase();
              name2 = name2.toLowerCase();
            }
            if (name1 === name2) {
              return value.code;
            }
          }
        }
        return false;
      },

      _whereClause: function (searchTerm, layer, searchFields, exactMatch) {
        var where = null;
        if (searchTerm) {
          // Fix for non latin characters
          var nlc = "";
          // is hosted fs and has non latin char
          if (this._reHostedFS.test(layer.url) && this._containsNonLatinCharacter(searchTerm)) {
            nlc = "N";
          }
          if (searchFields && searchFields.length) {
            // each field
            for (var i = 0, len = searchFields.length; i < len; i++) {
              var sql = "";
              // current search term
              var currentTerm = searchTerm;
              var field = searchFields[i];
              var fieldInfo = layer.getField(field);
              // get field domain
              var domain = layer.getDomain(field);
              // field has a domain
              if (domain && domain.type === "codedValue") {
                currentTerm = this._getCodedValue(domain.codedValues, currentTerm, exactMatch);
              }
              // If we have a valid search term
              if (currentTerm) {
                var fieldType = fieldInfo.type;
                // string or date field
                if (fieldType === "esriFieldTypeString" || fieldType === "esriFieldTypeDate") {
                  if (exactMatch) {
                    // exact match
                    sql = field + " = " + nlc + "'" + currentTerm + "'";
                  } else {
                    // case insensitive match
                    sql = "UPPER(" + field + ") LIKE " + nlc + "'%" + currentTerm.toUpperCase() + "%'";
                  }
                }
                // number field
                else if (
                  fieldType === "esriFieldTypeSmallInteger" ||
                  fieldType === "esriFieldTypeInteger" ||
                  fieldType === "esriFieldTypeSingle" ||
                  fieldType === "esriFieldTypeDouble"
                ) {
                  // convert to number
                  var num = parseFloat(currentTerm);
                  if (isNaN(num)) {
                    // string can't be converted to number
                    sql = false;
                  } else {
                    // exact match number
                    sql = field + " = " + num;
                  }
                }
                // every other field
                else {
                  // exact match
                  sql = field + " = " + currentTerm;
                }
                // if we have a valid sql field
                if (sql) {
                  // where clause already has something
                  if (where) {
                    where += " or ";
                  } else {
                    where = "";
                  }
                  // add sql statement
                  where += sql;
                }
              }
            }
          }
        }
        return where;
      },

      _suggest: function (e) {
        if (!e) {
          e = {
            index: this.activeSourceIndex,
            text: this.value
          };
        }
        var def = new Deferred();
        var sources = this.sources;
        var idx = e.index;
        var source = sources[idx];
        var enableSuggestions = this.enableSuggestions;
        if (source.hasOwnProperty("enableSuggestions")) {
          enableSuggestions = source.enableSuggestions;
        }
        // length of value
        var qlength = 0;
        var qTrimmed;
        // if value
        if (e.hasOwnProperty("text") && e.text) {
          qTrimmed = lang.trim(e.text);
          // set length of value
          qlength = e.text.length;
        }
        // minimum characters needed
        var minCharacters = source.minCharacters || this.minCharacters;
        // allow suggest?
        if (enableSuggestions && qTrimmed && qlength >= minCharacters && this._supportsPagination(source)) {
          var singleLine = "";
          // query prefix
          if (source.prefix) {
            singleLine += source.prefix;
          }
          // query value
          singleLine += qTrimmed;
          // query suffix
          if (source.suffix) {
            singleLine += source.suffix;
          }
          // spatial ref output
          var outSpatialReference = this._defaultSR;
          var map = this._getMap();
          if (map) {
            outSpatialReference = map.spatialReference;
          }
          var params = {};
          if (source.locator) {
            // categories
            if (source.categories) {
              params.categories = source.categories;
            }
            // spatial ref output
            source.locator.outSpatialReference = outSpatialReference;
            // distance and point
            if (this.view && source.localSearchOptions && source.localSearchOptions.hasOwnProperty("distance") && source.localSearchOptions.hasOwnProperty("minScale")) {
              // current scale of map
              var scale = this._getScale();
              // location search will be performed when the map scale is less than minScale.
              if (!source.localSearchOptions.minScale || (scale && scale <= parseFloat(source.localSearchOptions.minScale))) {
                // note 4.0 change extent center
                params.location = this.view.extent.center;
                params.distance = source.localSearchOptions.distance;
              }
            }
            // text for suggestions
            params.text = singleLine;
            // Uses map's extent as the searchExtent
            if (source.useMapExtent && this.view && this.view.extent) {
              params.searchExtent = this.view.extent;
            }
            if (source.searchExtent) {
              params.searchExtent = source.searchExtent;
            }
            params.maxSuggestions = source.maxSuggestions || this.maxSuggestions;
            // Esri locator country
            if (source.sourceCountry) {
              params.countryCode = source.sourceCountry;
            }
            if (source.countryCode) {
              params.countryCode = source.countryCode;
            }
            // query for suggestions
            source.locator.suggestLocations(params).then(function (response) {
              def.resolve(response);
            }, function (error) {
              if (!error) {
                error = this._error("Locator suggestLocations could not be performed.");
              }
              def.reject(error);
            }.bind(this));
          } else if (source.featureLayer) {
            // make sure layer loaded
            source.featureLayer.then(function () {
              // default field to display
              var displayField = this._getDisplayField(source);
              // fields to search within
              var searchFields = source.searchFields || [displayField];
              // fields we need to display for suggestions
              var outFields = [];
              // source suggestion template
              if (source.suggestionTemplate) {
                // get all fields from string template
                source.suggestionTemplate.replace(/(?:\$\{([^}]+)\})/g, function () {
                  var key = arguments[1];
                  // add field to array
                  outFields.push(key);
                });
                // get index of objectIdField in outfields
                var hasObjectId = array.indexOf(outFields, source.featureLayer.objectIdField);
                // of objectIdField is not in the array
                if (hasObjectId === -1) {
                  // add objectIdField
                  outFields.push(source.featureLayer.objectIdField);
                }
              } else {
                // only display field and objectIdField
                outFields = [displayField, source.featureLayer.objectIdField];
              }
              // validate display field
              var validDisplayField = this._validField(source.featureLayer, displayField);
              // validate out fields
              var validOutFields = this._validFields(source.featureLayer, outFields);
              // validate search fields
              var validSearchFields = this._validFields(source.featureLayer, searchFields);
              // if we have an invalid field
              if (!validDisplayField || !validOutFields || !validSearchFields) {
                def.reject(this._error("Invalid FeatureLayer field"));
              } else {
                var q = new Query();
                if (source.hasOwnProperty("suggestQueryParams")) {
                  lang.mixin(q, source.suggestQueryParams);
                }
                // spatial ref
                q.outSpatialReference = outSpatialReference;
                q.returnGeometry = false;
                q.num = source.maxSuggestions || this.maxSuggestions;
                // only fields we need to show in suggestion list
                q.outFields = outFields;
                // Uses map's extent as the searchExtent
                if (source.useMapExtent && this.view && this.view.extent) {
                  q.geometry = this.view.extent;
                }
                if (source.searchExtent) {
                  q.geometry = source.searchExtent;
                }
                var doSearch;
                var where = this._whereClause(singleLine, source.featureLayer, searchFields, false);
                if (where) {
                  q.where = where;
                  doSearch = true;
                }
                if (doSearch) {
                  // todo 4.0 queryFeatures not working yet
                  source.featureLayer.queryFeatures(q, function (featureSet) {
                    var results;
                    var features = featureSet.features;
                    if (features) {
                      results = this._hydrateResults(features, idx, true);
                    }
                    def.resolve(results);
                  }.bind(this), function (error) {
                    if (!error) {
                      error = this._error("FeatureLayer queryFeatures errored with suggestions");
                    }
                    def.reject(error);
                  }.bind(this));
                } else {
                  def.resolve();
                }
              }
            }.bind(this));
          } else {
            def.reject(this._error("Invalid source"));
          }
        } else {
          // doesnt support suggestions or suggestions are disabled
          def.resolve();
        }
        return def.promise;
      },

      _supportsPagination: function (source) {
        // check if featurelayer supports pagination
        var supported;
        if (source.locator) {
          supported = true;
        } else if (source.featureLayer) {
          // supports pagination
          if (source.featureLayer.advancedQueryCapabilities && source.featureLayer.advancedQueryCapabilities.supportsPagination) {
            supported = true;
          }
        }
        return supported;
      },

      _suggestQueries: function (e) {
        // get all sources
        var sources = this.sources;
        // set index
        var idx = this.activeSourceIndex;
        // if "all"
        var defs = [],
          def;
        if (idx === this._allIndex) {
          // for each source
          for (var i = 0; i < sources.length; i++) {
            var e2 = e;
            // set source index
            e2.index = i;
            // suggest query
            def = this._suggest(e2);
            // add to array
            defs.push(def);
          }
        } else {
          var e1 = e;
          // set index of source
          e1.index = idx;
          def = this._suggest(e1);
          // add to array
          defs.push(def);
        }
        return promiseList(defs);
      },

      _expanded: function () {
        if (this.enableButtonMode) {
          if (this.expanded) {
            domClass.add(this.containerNode, this.css.searchExpanded);
            domClass.remove(this.containerNode, this.css.searchCollapsed);
          } else {
            domClass.remove(this.containerNode, this.css.searchExpanded);
            domClass.add(this.containerNode, this.css.searchCollapsed);
          }
        }
        this._hideMenus();
      },

      _getPointFromGeometry: function (geometry) {
        var pt;
        if (geometry) {
          // geometry
          switch (geometry.type) {
          case "extent":
            // get oint from center of extent
            pt = geometry.get("center");
            break;
          case "multipoint":
            // get extent from multipoint, then get center of that
            pt = geometry.get("extent").get("center");
            break;
          case "point":
            // use geometry as is
            pt = geometry;
            break;
          case "polygon":
            // get extent from polygon then get center
            pt = geometry.get("extent").get("center");
            break;
          case "polyline":
            // get extent from line, then get center
            pt = geometry.get("extent").get("center");
            break;
          }
        }
        return pt;
      },

      // handles whether to use one source or all
      _searchQueries: function (e) {
        if (!e.hasOwnProperty("index")) {
          e.index = this.activeSourceIndex;
        }
        var defs = [],
          def;
        if (e.index === this._allIndex) {
          var sources = this.sources;
          for (var i = 0; i < sources.length; i++) {
            var e2 = e;
            e2.index = i;
            def = this._search(e2);
            defs.push(def);
          }
        } else {
          var s = this._search(e);
          defs.push(s);
        }
        return promiseList(defs);
      },

      _searchButton: function () {
        if (this.enableButtonMode && !this.expanded) {
          this.set("expanded", true);
          focusUtil.focus(this.inputNode);
        } else {
          this._cancelSuggest();
          this.search();
        }
      },

      _search: function (e) {
        if (!e) {
          e = {
            text: this.value,
            magicKey: null,
            geometry: null,
            point: null,
            index: this.activeSourceIndex,
            latlon: null
          };
        }
        var point;
        var def = new Deferred();
        var idx = e.index;
        var source = this.sources[idx];
        var qTrimmed;
        if (e.hasOwnProperty("text") && e.text) {
          qTrimmed = lang.trim(e.text);
        }
        if (source) {
          var singleLine = "";
          // query prefix
          if (source.prefix && !e.magicKey) {
            singleLine += source.prefix;
          }
          // query value
          singleLine += qTrimmed;
          // query suffix
          if (source.suffix && !e.magicKey) {
            singleLine += source.suffix;
          }
          // spatial ref output
          var outSpatialReference = this._defaultSR;
          var map = this._getMap();
          if (map) {
            outSpatialReference = map.spatialReference;
          }
          if (source.locator) {
            // has text string
            if (e.hasOwnProperty("text") && qTrimmed) {
              var params = {};
              // categories
              if (source.categories) {
                params.categories = source.categories;
              }
              if (outSpatialReference) {
                // spatial ref output
                source.locator.outSpatialReference = outSpatialReference;
              }
              // distance and point
              if (this.view && source.localSearchOptions && source.localSearchOptions.hasOwnProperty("distance") && source.localSearchOptions.hasOwnProperty("minScale")) {
                // current scale of map
                var scale = this._getScale();
                // location search will be performed when the map scale is less than minScale.
                if (!source.localSearchOptions.minScale || (scale && scale <= parseFloat(source.localSearchOptions.minScale))) {
                  // note 4.0 change extent center
                  params.location = this.view.extent.center;
                  params.distance = source.localSearchOptions.distance;
                }
              }
              // address object
              params.address = {};
              // maximum results
              params.maxLocations = source.maxResults || this.maxResults;
              // Uses map's extent as the searchExtent
              if (source.useMapExtent && this.view && this.view.extent) {
                params.searchExtent = this.view.extent;
              }
              // within extent
              if (source.searchExtent) {
                params.searchExtent = source.searchExtent;
              }
              // Esri locator country
              if (source.sourceCountry) {
                params.countryCode = source.sourceCountry;
              }
              if (source.countryCode) {
                params.countryCode = source.countryCode;
              }
              if (e.magicKey) {
                params.magicKey = e.magicKey;
              }
              if (source.singleLineFieldName) {
                params.address[source.singleLineFieldName] = singleLine;
              } else {
                params.address["Single Line Input"] = singleLine;
              }
              // if outfields
              if (source.outFields) {
                params.outFields = source.outFields;
              }
              source.locator.addressToLocations(params).then(function (response) {
                var results = this._hydrateResults(response, idx, false);
                def.resolve(results);
              }.bind(this), function (error) {
                if (!error) {
                  error = this._error("Locator addressToLocations could not be performed");
                }
                def.reject(error);
              }.bind(this));
            } else if (e.geometry) {
              point = this._getPointFromGeometry(e.geometry.geometry);
              // if we now have a point
              if (point) {
                // reverse geocode point for address
                this._reverseGeocodePoint(idx, point).then(function (resp) {
                  // return response
                  def.resolve(resp);
                }, function (error) {
                  // return error
                  def.reject(error);
                });
              } else {
                def.reject(this._error("Invalid point to reverse geocode"));
              }
            } else if (e.point) {
              // point geometry
              this._reverseGeocodePoint(idx, e.point).then(function (resp) {
                def.resolve(resp);
              }, function (error) {
                def.reject(error);
              });
            } else if (e.latlon) {
              // long, lat
              var pt = new Point(e.latlon, this._defaultSR);
              // reverse geocode from lat/lon point
              this._reverseGeocodePoint(idx, pt).then(function (resp) {
                def.resolve(resp);
              }, function (error) {
                def.reject(error);
              });
            } else if (e.hasOwnProperty("text") && !qTrimmed) {
              // empty text value. just resolve with no results since we don't want to do a search with an empty string
              def.resolve([]);
            } else {
              // invalid
              def.reject(this._error("Invalid query type for Locator"));
            }
          } else if (source.featureLayer) {
            // make sure layer loaded
            source.featureLayer.then(function () {
              var displayField = this._getDisplayField(source);
              var searchFields = source.searchFields || [displayField];
              // validate display field
              var validDisplayField = this._validField(source.featureLayer, displayField);
              // validate search fields
              var validSearchFields = this._validFields(source.featureLayer, searchFields);
              if (!validDisplayField || !validSearchFields) {
                def.reject(this._error("Invalid FeatureLayer field"));
              } else {
                var q = new Query();
                if (source.hasOwnProperty("searchQueryParams")) {
                  lang.mixin(q, source.searchQueryParams);
                }
                if (outSpatialReference) {
                  // spatial ref
                  q.outSpatialReference = outSpatialReference;
                  // map units for maxAllowableOffset
                  var mapUnit = scaleUtils.getUnitValueForSR(outSpatialReference);
                  if (mapUnit) {
                    q.maxAllowableOffset = mapUnit;
                  }
                }
                q.returnGeometry = true;
                // outfields
                if (source.outFields) {
                  q.outFields = source.outFields;
                }
                var exactMatch;
                if (!e.hasOwnProperty(this._objectIdIdentifier)) {
                  if (this._supportsPagination(source)) {
                    q.num = source.maxResults || this.maxResults;
                  }
                  // Uses map's extent as the searchExtent
                  if (source.useMapExtent && this.view && this.view.extent) {
                    q.geometry = this.view.extent;
                  }
                  if (source.searchExtent) {
                    q.geometry = source.searchExtent;
                  }
                  exactMatch = source.exactMatch;
                }
                var doSearch;
                if (e.hasOwnProperty("text") && qTrimmed) {
                  var where = this._whereClause(singleLine, source.featureLayer, searchFields, exactMatch);
                  if (where) {
                    q.where = where;
                    doSearch = true;
                  } else {
                    doSearch = false;
                  }
                } else if (e.hasOwnProperty(this._objectIdIdentifier)) {
                  q.objectIds = [e[this._objectIdIdentifier]];
                  doSearch = true;
                } else if (e.geometry) {
                  q.geometry = e.geometry;
                  doSearch = true;
                } else if (e.point) {
                  q.geometry = e.point;
                  doSearch = true;
                } else if (e.latlon) {
                  point = new Point(e.latlon, this._defaultSR);
                  q.geometry = point;
                  doSearch = true;
                } else if (e.hasOwnProperty("text") && !qTrimmed) {
                  // empty string
                  def.resolve([]);
                  doSearch = false;
                } else {
                  // invalid
                  def.reject(this._error("Invalid query type for FeatureLayer"));
                  doSearch = false;
                }
                // if we have a search we can do
                if (doSearch) {
                  // todo 4.0 - not yet implemented (queryFeatures)
                  source.featureLayer.queryFeatures(q, function (featureSet) {
                    var features = featureSet.features;
                    var results;
                    if (features) {
                      results = this._hydrateResults(features, idx, false);
                    }
                    def.resolve(results);
                  }.bind(this), function (error) {
                    if (!error) {
                      error = this._error("FeatureLayer queryFeatures could not be performed");
                    }
                    def.reject(error);
                  }.bind(this));
                } else {
                  def.resolve();
                }
              }
            }.bind(this));
          } else {
            def.reject(this._error("Invalid source"));
          }
        } else {
          def.reject(this._error("Source is undefined"));
        }
        // return promise
        return def.promise;
      },

      // clear timeout for query
      _clearQueryTimeout: function () {
        // if timer exists
        if (this._queryTimer) {
          // remove timeout
          clearTimeout(this._queryTimer);
        }
      },

      _formatResults: function (results, idx, value) {
        // convert results to desired event emit format
        var converted = {
          activeSourceIndex: idx,
          value: value,
          numResults: 0,
          numErrors: 0,
          errors: null,
          results: null
        };
        var errors = {},
          formatted = {};
        // if we got results
        if (results) {
          // if all sources
          if (idx === this._allIndex) {
            // each source
            for (var i = 0; i < results.length; i++) {
              if (results[i]) {
                if (results[i] instanceof Error) {
                  errors[i] = results[i];
                  converted.numErrors++;
                } else {
                  formatted[i] = results[i];
                  converted.numResults += results[i].length;
                }
              }
            }
          } else {
            if (results[0]) {
              if (results[0] instanceof Error) {
                errors[idx] = results[0];
                converted.numErrors++;
              } else {
                formatted[idx] = results[0];
                converted.numResults += results[0].length;
              }
            }
          }
        }
        if (converted.numErrors) {
          converted.errors = errors;
        }
        if (converted.numResults) {
          converted.results = formatted;
        }
        return converted;
      },

      _reverseGeocodePoint: function (index, pt) {
        var def = new Deferred();
        var sources = this.sources;
        var source = sources[index];
        if (pt && source) {
          // default distance
          var distance = source.locationToAddressDistance || this.locationToAddressDistance;
          // spatial ref output
          source.locator.outSpatialReference = this._defaultSR;
          var map = this._getMap();
          if (map) {
            source.locator.outSpatialReference = map.spatialReference;
          }
          // reverse geocode
          source.locator.locationToAddress(pt, distance, function (response) {
            var results = this._hydrateResults([response], index, false);
            def.resolve(results);
          }.bind(this), function (error) {
            if (!error) {
              error = this._error("Locator locationToAddress could not be performed");
            }
            def.reject(error);
          }.bind(this));
        } else {
          def.reject(this._error("No point or source defined for reverse geocoding"));
        }
        return def.promise;
      },

      // note: stop existing queries for autocomplete upon search or new request. Only happens on key typing
      _cancelDeferreds: function () {
        // if we have deferreds
        if (this._deferreds && this._deferreds.length) {
          for (var i = 0; i < this._deferreds.length; i++) {
            // cancel deferred
            this._deferreds[i].cancel(this.declaredClass + " cancelling request");
          }
        }
        // remove deferreds
        this._deferreds = [];
      },

      _sourceBtnKey: function (e) {
        if (e) {
          var lists = query("li", this.sourcesNode);
          if (e.keyCode === keys.UP_ARROW) {
            e.stopPropagation();
            e.preventDefault();
            this._showSourcesMenu();
            // get list item length
            var listsLen = lists.length;
            // if not zero
            if (listsLen) {
              // go to previous list item
              focusUtil.focus(lists[listsLen - 1]);
            }
          } else if (e.keyCode === keys.DOWN_ARROW) {
            e.stopPropagation();
            e.preventDefault();
            this._showSourcesMenu();
            // if first item
            if (lists[0]) {
              // focus first item
              focusUtil.focus(lists[0]);
            }
          }
        }
      },

      // key down event on input box
      _inputKey: function (e) {
        if (e) {
          var lists = query("li", this.suggestionsNode);
          var suggestResults = this.suggestResults;
          if (e.keyCode === keys.TAB || e.keyCode === keys.ESCAPE) {
            // stop existing deferreds and reset timer
            this._cancelSuggest();
            // hide menus if opened
            this._hideMenus();
          } else if (e.keyCode === keys.UP_ARROW) {
            e.stopPropagation();
            e.preventDefault();
            // stop existing deferreds and reset timer
            this._cancelSuggest();
            // show existing suggestions
            if (suggestResults) {
              this._showSuggestionsMenu();
            }
            // get list item length
            var listsLen = lists.length;
            // if not zero
            if (listsLen) {
              // go to previous list item
              focusUtil.focus(lists[listsLen - 1]);
            }
          } else if (e.keyCode === keys.DOWN_ARROW) {
            e.stopPropagation();
            e.preventDefault();
            // stop existing deferreds and reset timer
            this._cancelSuggest();
            // show existing suggestions
            if (suggestResults) {
              this._showSuggestionsMenu();
            }
            // if first item
            if (lists[0]) {
              // focus first item
              focusUtil.focus(lists[0]);
            }
          }
          // ignored keys
          else if (e.ctrlKey || e.metaKey || e.keyCode === keys.copyKey || e.keyCode === keys.LEFT_ARROW || e.keyCode === keys.RIGHT_ARROW || e.keyCode === keys.ENTER) {
            // just return. don't do anything
            return e;
          } else {
            // perform suggest after delay
            this._suggestDelay();
          }
        }
      },

      _cancelSuggest: function () {
        // stop existing deferreds
        this._cancelDeferreds();
        // Reset timer between keys
        this._clearQueryTimeout();
      },

      _suggestDelay: function () {
        // stop existing deferreds and reset timer
        this._cancelSuggest();
        // update search value
        this._changeValue();
        // suggest
        this._queryTimer = setTimeout(function () {
          this.suggest();
        }.bind(this), this.suggestionDelay);
      },

      _changeValue: function () {
        this.set("magicKey", null);
        // update current text variable
        this._changeAttrValue("value", this.inputNode.value);
        // check status of search box
        this._checkStatus();
      },

      // input box clicked
      _inputClick: function () {
        // hide source switch
        this._hideSourcesMenu();
        this._hideNoResultsMenu();
      },

      _getSourceName: function (i) {
        var sources = this.sources;
        var name = sources[i].name;
        // name undefined and its a feature layer
        if (!name && sources[i].featureLayer) {
          name = sources[i].featureLayer.name;
        }
        // name still not set
        if (!name) {
          name = i18n.widgets.Search.untitledSource;
        }
        return name;
      },

      // called on AC Results
      _insertSuggestions: function (suggestions, value) {
        if (this.enableSuggestionsMenu && this.suggestionsNode) {
          // hide menu to toggle suggestions
          this._hideSourcesMenu();
          this._hideNoResultsMenu();
          // string to set
          var node;
          var sources = this.sources;
          if (suggestions) {
            // container for suggestion results
            node = domConstruct.create("div");
            for (var i in suggestions) {
              // if results and result node
              if (suggestions[i] && suggestions[i].length) {
                // source name
                var name = this._getSourceName(i);
                // multiple locators
                if (sources.length > 1 && this.activeSourceIndex === this._allIndex) {
                  // header div
                  domConstruct.create("div", {
                    className: this.css.searchMenuHeader,
                    textContent: name
                  }, node);
                }
                var ul = domConstruct.create("ul", {}, node);
                // suggestions to show
                var maxSuggestions = sources[i].maxSuggestions || this.maxSuggestions;
                // for each result
                for (var j = 0; j < suggestions[i].length && j < maxSuggestions; ++j) {
                  // create list item
                  var item = domConstruct.create("li", {
                    "data-index": j,
                    "data-source-index": i,
                    role: "menuitem",
                    tabindex: 0
                  }, ul);
                  var partialMatchExpression = new RegExp("(" + value + ")", "gi");
                  var text = this._getSuggestionName(suggestions[i][j]);
                  var splitString = text.replace(partialMatchExpression, "|$1|");
                  var parts = splitString.split("|");
                  var partsLength = parts.length;
                  for (var k = 0; k < partsLength; k++) {
                    var part = parts[k];
                    // if part matches value
                    if (part.toLowerCase() === value.toLowerCase()) {
                      // bold part
                      domConstruct.create("strong", {
                        textContent: part
                      }, item);
                    } else {
                      // use text node for part
                      var n = document.createTextNode(part);
                      domConstruct.place(n, item);
                    }
                  }
                }
              }
            }
          }
          if (node) {
            // insert
            domConstruct.place(node, this.suggestionsNode, "only");
            // show!
            this._showSuggestionsMenu();
          } else {
            domConstruct.empty(this.suggestionsNode);
            // hide menu
            this._hideSuggestionsMenu();
          }
        }
      },

      // create menu for changing active source
      _insertSources: function (sources) {
        if (this.enableSourcesMenu && sources && sources.length > 1) {
          var layerClass, i;
          var activeSourceIndex = this.activeSourceIndex;
          // list
          var ul = domConstruct.create("ul");
          if (this.enableSearchingAll) {
            var allActive = "";
            // all sources
            if (activeSourceIndex === this._allIndex) {
              allActive = "active";
            }
            // all item
            domConstruct.create("li", {
              "data-index": this._allIndex,
              role: "menuitem",
              className: allActive,
              tabIndex: 0,
              textContent: i18n.widgets.Search.all
            }, ul);
          }
          // sources
          for (i = 0; i < sources.length; i++) {
            layerClass = "";
            if (i === activeSourceIndex) {
              // currently selected source
              layerClass = this.css.activeSource;
            }
            // source name
            var name = this._getSourceName(i);
            // source item
            domConstruct.create("li", {
              "data-index": i,
              role: "menuitem",
              className: layerClass,
              tabIndex: 0,
              textContent: name
            }, ul);
          }
          // add class
          domClass.add(this.containerNode, this.css.hasMultipleSources);
          domConstruct.place(ul, this.sourcesNode, "only");
        } else {
          // remove class
          domClass.remove(this.containerNode, this.css.hasMultipleSources);
          domConstruct.empty(this.sourcesNode);
        }
      },

      // show loading spinner
      _showLoading: function () {
        domClass.add(this.containerNode, this.css.searchLoading);
      },

      // hide loading spinner
      _hideLoading: function () {
        domClass.remove(this.containerNode, this.css.searchLoading);
      },

      _checkStatus: function () {
        // if input value is not empty
        if (this.value) {
          // add class to dom
          domClass.add(this.containerNode, this.css.hasValue);
          // set class and title
          domAttr.set(this.clearNode, "title", i18n.widgets.Search.clearButtonTitle);
        } else {
          // clear address
          this.clear();
        }
      },

      _closePopup: function () {
        // close popup
        if (this.enablePopup && this.view && this.view.popup) {
          this.view.popup.set("visible", false);
        }
      },

      _noResults: function (value) {
        var trimValue;
        if (value) {
          trimValue = lang.trim(value);
        }
        // root node
        var rootNode = domConstruct.create("div", {
          className: this.css.searchNoResultsBody
        });
        if (value && trimValue) {
          // header
          domConstruct.create("div", {
            className: this.css.searchNoResultsHeader,
            textContent: i18n.widgets.Search.noResults
          }, rootNode);
          // no results text
          domConstruct.create("div", {
            className: this.css.searchNoResultsText,
            textContent: esriLang.substitute({
              value: "\"" + value + "\""
            }, i18n.widgets.Search.noResultsFound)
          }, rootNode);
        } else {
          // div container
          var container = domConstruct.create("div", {}, rootNode);
          // icon node
          domConstruct.create("span", {
            "aria-hidden": "true",
            className: this.css.searchNoValueIcon
          }, container);
          // text node
          domConstruct.create("span", {
            className: this.css.searchNoValueText,
            textContent: i18n.widgets.Search.emptyValue
          }, container);
        }
        // insert node
        domConstruct.place(rootNode, this.noResultsMenuNode, "only");
      },

      _hideMenus: function () {
        this._hideSourcesMenu();
        this._hideSuggestionsMenu();
        this._hideNoResultsMenu();
      },

      _hideNoResultsMenu: function () {
        // hide no results menu
        domClass.remove(this.containerNode, this.css.showNoResults);
      },

      _showNoResultsMenu: function () {
        this._hideSourcesMenu();
        this._hideSuggestionsMenu();
        // show no results menu
        domClass.add(this.containerNode, this.css.showNoResults);
      },

      _hideSourcesMenu: function () {
        // hide sources menu
        domClass.remove(this.containerNode, this.css.showSources);
      },

      _hideSuggestionsMenu: function () {
        // hide suggestions
        domClass.remove(this.containerNode, this.css.showSuggestions);
      },

      _showSourcesMenu: function () {
        this._hideSuggestionsMenu();
        this._hideNoResultsMenu();
        // show sources
        domClass.add(this.containerNode, this.css.showSources);
      },

      _showSuggestionsMenu: function () {
        this._hideSourcesMenu();
        this._hideNoResultsMenu();
        // show suggest
        domClass.add(this.containerNode, this.css.showSuggestions);
      },

      _toggleSourcesMenu: function () {
        this._hideSuggestionsMenu();
        this._hideNoResultsMenu();
        // toggle sources
        domClass.toggle(this.containerNode, this.css.showSources);
      },

      _getFirstStringField: function (fl) {
        if (fl) {
          var fields = fl.fields;
          if (fields && fields.length) {
            for (var i = 0; i < fields.length; i++) {
              var field = fields[i];
              // if field is a string
              if (field.type === "esriFieldTypeString") {
                return field.name;
              }
            }
          }
        }
        return "";
      },

      // note: Will get the display field or first string field
      _getDisplayField: function (source) {
        return source.displayField || source.featureLayer.displayField || this._getFirstStringField(source.featureLayer);
      },

      _validExtent: function (extent) {
        if (
          extent &&
          extent.xmin && extent.xmin !== "NaN" &&
          extent.ymin && extent.ymin !== "NaN" &&
          extent.xmax && extent.xmax !== "NaN" &&
          extent.ymax && extent.ymax !== "NaN"
        ) {
          return true;
        }
        return false;
      },

      _hydrateResult: function (e, idx, suggestions) {
        // result to add
        var newResult = {},
          sR = this._defaultSR,
          attributes, geometry;
        // source
        var sources = this.sources;
        var source = sources[idx];
        var map = this._getMap();
        // set default spatial reference
        if (map) {
          sR = map.spatialReference;
        }
        // suggest api result
        if (e.hasOwnProperty("text") && e.hasOwnProperty("magicKey")) {
          // don't do anything
          return e;
        }
        // already a feature
        if (e.hasOwnProperty("geometry")) {
          // note 4.0 change graphic fromJson
          var clone = Graphic.fromJSON(e.toJSON());
          newResult.feature = clone;
          geometry = newResult.feature.geometry;
          // fix goemetry SR
          if (geometry) {
            geometry.set("spatialReference", sR);
          }
        }
        // address candidates locator
        else if (e.hasOwnProperty("location")) {
          // create point
          var pt = new Point(e.location.x, e.location.y, sR);
          // create attributes
          attributes = {};
          // set attributes
          if (e.hasOwnProperty("attributes")) {
            attributes = e.attributes;
          }
          // set score
          if (e.hasOwnProperty("score")) {
            attributes.score = e.score;
          }
          // create graphic feature
          newResult.feature = new Graphic(pt, null, attributes, null);
        } else {
          newResult.feature = null;
        }
        // need extent
        if (e.hasOwnProperty("extent") && this._validExtent(e.extent)) {
          // set extent
          newResult.extent = new Extent(e.extent);
          // set spatial ref
          newResult.extent.set("spatialReference", sR);
        } else if (newResult.feature && newResult.feature.geometry) {
          // create extent from geometry
          switch (newResult.feature.geometry.type) {
          case "extent":
            // get oint from center of extent
            newResult.extent = newResult.feature.geometry;
            break;
          case "multipoint":
            // get extent from multipoint, then get center of that
            newResult.extent = newResult.feature.geometry.get("extent");
            break;
          case "polygon":
            // get extent from polygon then get center
            newResult.extent = newResult.feature.geometry.get("extent");
            break;
          case "polyline":
            // get extent from line, then get center
            newResult.extent = newResult.feature.geometry.get("extent");
            break;
          case "point":
            // use geometry as is
            if (map) {
              var zoomScale = this.zoomScale;
              // source zoomscale if appplicable
              if (source && source.zoomScale) {
                zoomScale = source.zoomScale;
              }
              // current map scale is greater than zoomScale
              if (this._getScale() > zoomScale) {
                // get extent for scale at zoom scale
                newResult.extent = scaleUtils.getExtentForScale(this.view, zoomScale).centerAt(newResult.feature.geometry);
              } else {
                // use centered extent at current scale
                // note 4.0 centerAt extent. Create extent from point and scale
                newResult.extent = this.view.extent.centerAt(newResult.feature.geometry);
              }
            } else {
              // create extent
              newResult.extent = new Extent({
                "xmin": newResult.feature.geometry.x - 0.25,
                "ymin": newResult.feature.geometry.y - 0.25,
                "xmax": newResult.feature.geometry.x + 0.25,
                "ymax": newResult.feature.geometry.y + 0.25,
                "spatialReference": this._defaultSR
              });
            }
            break;
          }
        } else {
          newResult.extent = null;
        }
        // default name is empty string
        newResult.name = "";
        // feature layer result
        if (source.featureLayer) {
          // has suggestionTemplate and is a suggest request
          if (source.suggestionTemplate && suggestions) {
            // create name to use
            newResult.name = esriLang.substitute(e.attributes, source.suggestionTemplate);
          } else if (source.searchTemplate) {
            newResult.name = esriLang.substitute(e.attributes, source.searchTemplate);
          } else {
            // use display field for name
            var displayField = this._getDisplayField(source);
            // get domain
            var domain = source.featureLayer.getDomain(displayField);
            // we have attributes
            if (displayField && e.hasOwnProperty("attributes") && e.attributes.hasOwnProperty(displayField)) {
              var dfValue = e.attributes[displayField];
              // field has domain
              if (domain && domain.type === "codedValue") {
                newResult.name = this._getCodedName(domain.codedValues, dfValue);
              } else {
                newResult.name = dfValue;
              }
            }
          }
        }
        // reverse geocode template
        else if (e.address && source.searchTemplate) {
          newResult.name = esriLang.substitute(e.address, source.searchTemplate);
        }
        // need name
        else if (e.hasOwnProperty("name")) {
          newResult.name = e.name;
        }
        // set name for match address
        else if (e.hasOwnProperty("attributes") && typeof e.attributes === "object" && e.attributes.Match_addr) {
          // use match address
          newResult.name = e.attributes.Match_addr;
          // append street and city if necessary.
          if (e.attributes.Addr_type && e.attributes.Addr_type === "POI" && e.attributes.StAddr && e.attributes.City) {
            newResult.name += " - " + e.attributes.StAddr + ", " + e.attributes.City;
          }
        }
        // set name for address
        else if (e.hasOwnProperty("address") && typeof e.address === "string") {
          newResult.name = e.address;
        }
        // set name for address 2
        else if (e.hasOwnProperty("address") && typeof e.address === "object" && e.address.hasOwnProperty("Address")) {
          newResult.name = e.address.Address;
        }
        // set name for x,y
        else if (newResult.feature && newResult.feature.geometry) {
          newResult.name = newResult.feature.geometry.x + "," + newResult.feature.geometry.y;
        }
        return newResult;
      },

      // Get scale from 4.0 map
      _getScale: function () {
        var scale;
        if (this.view) {
          scale = this.view.scale;
        }
        return scale;
      },

      // create Extent and Graphic objects from JSON
      _hydrateResults: function (e, idx, suggestions) {
        // return results array
        var results = [],
          i = 0;
        // if results
        if (e && e.length) {
          for (i; i < e.length; i++) {
            var newResult = this._hydrateResult(e[i], idx, suggestions);
            // add to return array
            results.push(newResult);
          }
        }
        return results;
      },

      // note: feature service helper for searches
      _containsNonLatinCharacter: function (s) {
        for (var i = 0; i < s.length; i++) {
          if (s.charCodeAt(i) > 255) {
            return true;
          }
        }
        return false;
      },

      _setPlaceholder: function (idx) {
        var placeholder = "";
        var sources = this.sources;
        var source = sources[idx];
        // if "all" sources
        if (idx === this._allIndex) {
          // use all text
          placeholder = this.allPlaceholder || i18n.widgets.Search.allPlaceholder;
        } else {
          // if source has placeholder
          if (source && source.placeholder) {
            placeholder = source.placeholder;
          }
        }
        // name next to dropdown (can be turned on with CSS)
        var name = i18n.widgets.Search.all;
        if (source) {
          name = this._getSourceName(idx);
        }
        domAttr.set(this.sourceNameNode, "textContent", name);
        // set placeholder on node
        domAttr.set(this.inputNode, "placeholder", placeholder);
        domAttr.set(this.inputNode, "title", placeholder);
      },

      _updateActiveSource: function () {
        var sources = this.sources;
        var idx = this.activeSourceIndex;
        var newSource;
        if (sources && sources[idx]) {
          newSource = sources[idx];
        }
        if (newSource) {
          this.set("activeSource", newSource);
        } else {
          this.set("activeSource", null);
        }
      },

      _updateButtonMode: function (newVal) {
        if (newVal) {
          // set expanded classes
          domClass.toggle(this.containerNode, this.css.searchExpanded, this.expanded);
          domClass.toggle(this.containerNode, this.css.searchCollapsed, !this.expanded);
          domClass.add(this.containerNode, this.css.hasButtonMode);
        } else {
          // remove expanded classes
          domClass.remove(this.containerNode, this.css.searchExpanded);
          domClass.remove(this.containerNode, this.css.searchCollapsed);
          domClass.remove(this.containerNode, this.css.hasButtonMode);
        }
      },

      _setDefaultActiveSourceIndex: function () {
        var sources = this.sources;
        if ((sources && sources.length === 1) || !this.enableSearchingAll) {
          this.set("activeSourceIndex", 0);
        } else {
          this.set("activeSourceIndex", this._allIndex);
        }
      }

    });
  return Search;
});
