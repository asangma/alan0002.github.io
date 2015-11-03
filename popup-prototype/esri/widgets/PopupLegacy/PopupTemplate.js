/**
 * A PopupTemplate contains a [title](#title) and [content](#content) template string used to transform 
 * {@link module:esri/Graphic#attributes Graphic.attributes} into an HTML representation. The Dojo syntax 
 * `${}` performs the parameter substitution. In addition, a wildcard `${*}` can be used as the template string. 
 * The wildcard prints out all of the attribute's name value pairs. The default behavior on a 
 * {@link module:esri/Graphic Graphic} is to show the {@link module:esri/views/View#popup view's Popup} after a 
 * click on the {@link module:esri/Graphic Graphic}. A PopupTemplate is required for this default behavior.
 *
 * @module module:esri/widgets/PopupLegacy/PopupTemplate
 * @since 4.0
 * @see module:esri/widgets/Popup
 * @see {@link module:esri/views/MapView#popup MapView.popup}
 * @see {@link module:esri/views/SceneView#popup SceneView.popup}
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang", 
  "dojo/has", 
  "dojo/dom-construct",

  "../../kernel",
  "./InfoTemplate",
  "./PopupInfo",
  "./PopupRenderer"
], function(
  declare, lang, has, domConstruct,
  esriKernel, InfoTemplate, PopupInfo, PopupRenderer
) {
      
  /**
   * @constructor module:esri/widgets/PopupLegacy/PopupTemplate
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PT = declare([ InfoTemplate, PopupInfo ], 
  /** @lends module:esri/widgets/PopupLegacy/PopupTemplate.prototype */                 
  {
    declaredClass: "esri.widgets.PopupTemplate",

    "-chains-": {
      // Incompatible constructor arguments. So let's cut-off
      // the inheritance chain. Note also that sub-classes have
      // to explicitly call the ctor of this class like this:
      // this.inherited(arguments);
      constructor: "manual"
    },

    //chartTheme: "dojox.charting.themes.PlotKit.blue",
    chartTheme: null,
    
    constructor: function(json, options) {
      // Spec for "json":
      // http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.2#Popups
      // options:
      //  utcOffset (See: http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.7spec)
      //  chartTheme

      lang.mixin(this, options);
      this.initialize(json, options);
    },
      
    /**
    * The template defining how to format the title used in a {@link module:esri/widgets/Popup Popup}. 
    * You can format the title by specifying either a string value or a function. See the [description](#description) 
    * property for more details. In most cases, the title is specified as either a simple string or a function
    * that returns a simple string.
    * 
    * @name title
    * @instance
    * @type {string | function}
    */
      
    /**
    * The template defining how to format the content used in a {@link module:esri/widgets/Popup Popup}. 
    * This can be defined using either a string or a function, providing the developer with the ability to easily
    * format and customize the {@link module:esri/widgets/Popup Popup} content.
    * 
    * When the description contains a chart, use a 
    * [Dojo CSS theme](http://dojotoolkit.org/reference-guide/1.10/dijit/themes.html), such as Claro or Tundra,
    * to provide a better user experience.
    * 
    * @name description
    * @instance
    * @type {string | function}
    */    
    
    /**
     * Returns the [title](#title) of the input graphic's PopupTemplate.
     * 
     * @param   {module:esri/Graphic} graphic - The input graphic from which to obtain the Popup title.
     *                                        
     * @return {string} The title of the graphic's PopupTemplate.
     */
    getTitle: function(graphic) {
      var retVal; 
      
      if (this.info) {
        // TODO
        // We cannot use asynchronous getComponents in getTitle at the moment.
        // Callers such as Popup widget aren't ready for it yet.
        retVal = this.titleHasRelatedFields ? "" : this._getPopupValues(graphic, true).title;
      }
      
      return retVal || "";
    },
    
    /**
     * Returns the [content](#content) of the input graphic's PopupTemplate.
     * 
     * @param   {module:esri/Graphic} graphic - The input graphic from which to obtain the Popup content.
     *                                        
     * @return {string} The content of the graphic's PopupTemplate.
     */  
    getContent: function(graphic) {
      return this.info 
        ? new PopupRenderer({
          template: this,
          graphic: graphic,
          chartTheme: this.chartTheme
        }, domConstruct.create("div")).domNode 
        : "";
    }
  });

  

  return PT;
});
