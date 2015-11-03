/**
 * BasemapToggle provides a simple button to toggle between two basemaps.
 *
 * @module esri/widgets/BasemapToggle
 * @since 4.0
 * @see [BasemapToggle.css](css/source-code/esri/widgets/BasemapToggle/css/BasemapToggle.css)
 * @see [Sample - BasemapToggle widget (2D)](../sample-code/2d/basemaptoggle2d/)
 * @see [Sample - BasemapToggle widget (3D)](../sample-code/3d/basemaptoggle3d/)
 */
define([
  "../basemaps",
  "../Basemap",

  "./Widget",

  "dijit/_TemplatedMixin",
  "dijit/a11yclick",

  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/on",

  "dojo/i18n!../nls/jsapi",

  "dojo/text!./BasemapToggle/templates/BasemapToggle.html"
], function (
  esriBasemaps, Basemap,
  Widget,
  _TemplatedMixin, a11yclick,
  domClass, domConstruct, on,
  i18n,
  dijitTemplate
) {

  var css = {
    root: "esri-basemap-toggle",
    container: "esri-container",
    toggleButton: "esri-toggle",
    interactive: "esri-interactive",
    basemapImage: "esri-basemap-image",
    basemapImageContainer: "esri-basemap-container",
    basemapImageBG: "esri-basemap-bg",
    basemapTitle: "esri-basemap-title"
  };

  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/BasemapToggle
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   * @param {string} srcNodeRef - Reference or id of the HTML element in which this widget renders.
   */
  var BasemapToggle = Widget.createSubclass([_TemplatedMixin],
    /** @lends module:esri/widgets/BasemapToggle.prototype */
    {

      declaredClass: "esri.widgets.BasemapToggle",

      templateString: dijitTemplate,

      //--------------------------------------------------------------------------
      //
      //  Lifecycle
      //
      //--------------------------------------------------------------------------

      constructor: function () {
        this._i18n = i18n.widgets.basemapToggle;
      },

      postCreate: function () {
        this.inherited(arguments);
        this.own(on(this._toggleNode, a11yclick, this.toggle.bind(this)));
      },

      startup: function () {
        this.inherited(arguments);
        this.set("loaded", true);
        this.emit("load");
      },

      destroy: function () {
        if (this._mapReady) {
          this._mapReady.cancel();
        }
        this.map = null;
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
      //  map
      //----------------------------------
    
      /**
       * Map object containing the basemap this widget interacts with.
       *
       * @instance
       * @type {module:esri/Map}
       */
      map: null,

      _setMapAttr: function (newVal) {
        this._set("map", newVal);
        if (this._basemapWatch) {
          this._basemapWatch.remove();
        }
        if (this._mapReady) {
          this._mapReady.cancel();
        }
        if (this.map) {
          this._mapReady = this.map.then(function () {
            this._basemapChange();
            this._basemapWatch = this.map.watch("basemap", this._basemapChange.bind(this));
            this.own(this._basemapWatch);
          }.bind(this));
        }
      },

      //----------------------------------
      //  basemap
      //----------------------------------
    
      /**
       * The secondary basemap to toggle to.
       *
       * **Known Values:** All of the basemaps listed in {@link module:esri/Map#basemap Map.basemap}.
       *
       * @instance
       * @type {string}
       * @default
       */
      basemap: "hybrid",

      _setBasemapAttr: function (basemap) {
        if (typeof basemap === "string") {
          basemap = Basemap.fromJSON(esriBasemaps[basemap]);
        }
        if (this.basemap && this.basemap.id !== basemap.id) {
          this._set("basemap", basemap);
        }
      },

      //----------------------------------
      //  defaultBasemap
      //----------------------------------
    
      defaultBasemap: "topo",

      //----------------------------------
      //  basemaps
      //----------------------------------
    
      /**
       * Object containing the labels and URLs for the image of each basemap.
       *
       * ```
       * {
       *   "streets":{
       *     "title":"Streets",
       *     "thumbnailUrl":"http://js.arcgis.com/4.0beta1/esri/images/basemap/streets.jpg"
       *   },
       *   "satellite":{
       *     "title":"Satellite",
       *     "thumbnailUrl":"http://js.arcgis.com/4.0beta1/esri/images/basemap/satellite.jpg"
       *   },
       *   ...
       * }
       * ```
       *
       * @instance
       * @type {string}
       * @default
       */
      basemaps: esriBasemaps,

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      /**
       * Toggles to the next basemap.
       */
      toggle: function () {
        var bm = this.map.basemap,
          currentBasemap,
          basemap,
          toggleEvt;
        if (bm) {
          this.set("defaultBasemap", bm);
        }
        currentBasemap = this.get("defaultBasemap");
        basemap = this.get("basemap");
        toggleEvt = {
          previousBasemap: currentBasemap,
          currentBasemap: basemap
        };
        if (currentBasemap !== basemap) {
          this.map.basemap = basemap;
          this.set("basemap", currentBasemap);
          this._basemapChange();
          this.emit("toggle", toggleEvt);
        }
      },

      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      _getBasemapInfo: function (basemap) {
        if (!basemap) {
          this.basemap = "hybrid";
        }
        var basemaps = this.get("basemaps"),
          basemapId = typeof basemap === "string" ? basemap : basemap.id;
        if (basemaps && basemaps.hasOwnProperty(basemapId)) {
          return basemaps[basemapId];
        }
      },

      _updateImage: function () {
        var info = this._getBasemapInfo(this.get("basemap")),
          html = "";
        if (info) {
          html += "<div class=\"" + this.css.basemapImageContainer + "\">";
          html += "<div class=\"" + this.css.basemapImage + "\"><div class=\"" + this.css.basemapImageBG + "\" style=\"background-image:url(" + info.thumbnailUrl + ")\" title=\"" + info.title + "\"></div></div>";
          html += "<div title=\"" + info.title + "\" class=\"" + this.css.basemapTitle + "\">" + info.title + "</div>";
          html += "<div>";
          domConstruct.empty(this._toggleNode);
          domConstruct.place(html, this._toggleNode, "only");
        }
      },

      _basemapChange: function () {
        var bm = this.map.basemap,
          currentBasemap,
          basemap;
        if (bm) {
          this.set("defaultBasemap", bm);
        }
        currentBasemap = this.get("defaultBasemap");
        basemap = this.get("basemap");
        this._updateImage();
        domClass.remove(this._toggleNode, currentBasemap);
        domClass.add(this._toggleNode, basemap);
      }

    });

  return BasemapToggle;
});
