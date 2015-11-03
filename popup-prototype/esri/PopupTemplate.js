/**
 * A PopupTemplate formats and defines the content of a {@link module:esri/widgets/Popup} for
 * a specific {@link module:esri/layers/Layer} or {@link module:esri/Graphic}. A 
 * PopupTemplate allows the user to access feature attributes when a feature in the 
 * view is selected. 
 * 
 * The PopupTemplate contains [title](#title) and [content](#content) properties that act as template strings 
 * used to transform a feature's {@link module:esri/Graphic#attributes attributes} into an HTML representation. The syntax 
 * `{FIELDNAME}` performs the parameter substitution. In addition, a wildcard `{*}` may be used as the template string. 
 * The wildcard prints out all of the attribute's name value pairs. The default behavior on a 
 * {@link module:esri/Graphic} is to show the {@link module:esri/views/View#popup view's Popup} after a 
 * click on the {@link module:esri/Graphic}. A PopupTemplate is required for this default behavior.
 * 
 * PopupTemplate also allows you to format the Number and Date field values and override field aliases with 
 * the [fieldInfos](#fieldInfos) property. [Actions](#actions) may also be added to the template to give users
 * the ability to perform actions related to the feature, such as zooming to it or performing a Query based on 
 * the feature's location or attributes.
 * 
 * [![popupTemplate-example](../assets/img/apiref/widgets/popupTemplate-example.png)](../../sample-code/sandbox/sandbox.html?sample=sample-code/source-code/2d/popup-template/)
 * 
 * In the image above, the initial text **Marriage in NY, Zip Code: 11358** is set in the [title](#title)
 * property of the PopupTemplate where `ZIP` is the name of the field containing zip codes.
 * 
 * ```
 * popupTemplate.title = "Marriage in NY, Zip Code: {ZIP}",
 * ```
 * 
 * The rest of the content is defined in the [content](#content) property where `NEVMARR_CY`, `MARRIED_CY`,
 * and `DIVORCD_CY` are all field names that contain values to be used in the popup.
 * 
 * ```
 * popupTemplate.content = "<p>As of 2015, <b>{MARRIEDRATE}%</b> of the" +
 * " population in this zip code is married.</p>" +
 * "<ul><li>{MARRIED_CY} people are married</li>" +
 * "<li>{NEVMARR_CY} have never married</li>" +
 * "<li>{DIVORCD_CY} are divorced</li><ul>";
 * ```
 * 
 * PopupTemplates may contain custom [actions](#actions) that, when clicked, execute custom code
 * defined by the developer. See the [actions](#actions) property for more details.
 *
 * @module esri/PopupTemplate
 * @since 4.0
 * @see module:esri/widgets/Popup
 * @see {@link module:esri/views/MapView#popup MapView.popup}
 * @see {@link module:esri/views/SceneView#popup SceneView.popup}
 * @see [Sample - Popup template](../sample-code/2d/popup-template/)     
 * @see [Sample - Dock popup](../sample-code/2d/popup-docking/)
 * @see [Sample - Popup actions](../sample-code/2d/popup-actions/)      
 */
define([
  "dojo/_base/lang",
  "dojo/_base/array",
  "./core/JSONSupport"
], function (
  lang, array,
  JSONSupport
) {
  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/PopupTemplate
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PT = JSONSupport.createSubclass(
    /** @lends module:esri/PopupTemplate.prototype */
    {
      declaredClass: "esri.PopupTemplate",

      //--------------------------------------------------------------------------
      //
      //  Properties
      //
      //--------------------------------------------------------------------------

      //----------------------------------
      //  fieldInfos
      //----------------------------------

      /**
       * An array of objects that defines how a field in the dataset participates
       * in a popup. Each object contains properties for a single field in the dataset.
       * See the object specification table below for available options to set on each field.
       * 
       * @type {Object[]}
       * 
       * @property {string} fieldName - The field name as defined by the service.
       * @property {Object} format - An object used with numerical or date fields to provide more detail 
       * about how the value should be displayed in a popup. When formatting Number fields, you must set both
       * the `digitSeparator` and `places` properties for the formatting to take effect.
       * @property {string} format.dateFormat - Used only with Date fields. Specifies how the date should appear in a popup.<br><br>
       * **Known Values:** shortDate | shortDateLE | longDate | dayShortMonthYear | longMonthDayYear | shortDateLongTime | shortDateLELongTime | shortDateShortTime | shortDateLEShortTime | shortDateShortTime24 | shortDateLEShortTime24 | shortDateShortTime24 | shortDateLEShortTime24 | longMonthYear | shortMonthYear | year
       * @property {boolean} format.digitSeparator - Used only with Number fields. A value of `true` inidcates the number 
       * should have a digit (or thousands) separator when the value appears in popups. A value of `false` means 
       * that no separator will be used.
       * @property {number} format.places - Used only with Number fields to specify the number of 
       * supported decimal places that should appear in popups. Any places beyond this value are rounded.
       * @property {boolean} isEditable - Specifes whether the field is editable (only applicable for feature service data).
       * @property {string} label - The field alias to display in place of the `fieldName` in the popup.
       * @property {string} stringFieldOption - For editable popups, defines the text box format. <br><br> **Known Values:** richtext | textarea | textbox
       * @property {string} tooltip - Defines a tooltip for editable popup fields.
       * @property {boolean} visible - Defines whether the field is visible in the popup.
       *                           
       * @example
       * var popupTemplate = new PopupTemplate({
       *   fieldInfos: [{
       *     fieldName: "ELEV_ft",
       *     label: "Elevation (feet)",
       *     format: {
       *       places: 0,
       *       digitSeperator: true
       *     }
       *   }, {
       *     fieldName: "PROMINENCE_ft",
       *     label: "Prominence (feet)",
       *     format: {
       *       places: 0,
       *       digitSeperator: true
       *     }
       *   }, {
       *     fieldName: "ISOLATION_mi",
       *     label: "Isolation (miles)",
       *     format: {
       *       places: 0,
       *       digitSeperator: true
       *     }
       *   }]
       *  });
       */
      fieldInfos: [],

      _fieldInfosSetter: function (value) {
        // Store field info in a dictionary for later use
        var flabels = (this._fieldLabels = {}),
          fmaps = (this._fieldsMap = {});
        if (value) {
          array.forEach(value, function (fieldInfo) {
            // Use lower case fieldName as key for the dictionaries.
            var fieldName = fieldInfo.fieldName.toLowerCase();
            flabels[fieldName] = fieldInfo.label;
            fmaps[fieldName] = fieldInfo;
          });
        }
        return value;
      },

      //----------------------------------
      //  mediaInfos
      //----------------------------------

      /**
       * Defines an image or a chart to be displayed in a popup.
       * 
       * @type {Object[]}
       * 
       * @property {string} caption - A caption describing the media. This can contain 
       * a field name enclosed in `{}`, such as `{IMAGECAPTION}`.
       * @property {string} title - A title to display above the media. This can contain 
       * a field name enclosed in `{}`, such as `{IMAGETITLE}`.
       * @property {string} type - Defines the type of media. 
       * <br><br>**Known Values:** image | barchart | columnchart | linechart | piechart
       * @property {Object} value - Information defining how images should be retrieved or how charts are constructed.
       * @property {string[]} value.fields - An array of field names representing variables to display in the chart.
       * @property {string} value.linkURL - URL to be launched in a browser when a user clicks an image.
       * @property {string} value.normalizeField - The name of the field used to normalize all values in `fields`.
       * @property {string} value.sourceURL - The URL to an image.
       * @property {string} value.tooltipField - The tooltip for a chart specified from another field.
       *                          
       * @ignore                          
       */
      mediaInfos: [],

      //----------------------------------
      //  title
      //----------------------------------

      /**
       * The template for defining how to format the title used in a popup. This can contain 
       * a field name enclosed in `{}`, such as `{FIELDNAME}`. This property does not support
       * the use of HTML tags for formatting.
       * 
       * @type {string}
       * @example 
       * //In a service where a field named COUNTY_NAME contains the name of a county, the title 
       * //of the popup when the user clicks a feature representing Los Angeles County will say:
       * //"Population in Los Angeles County"
       * popupTemplate.title = "Population in {COUNTY_NAME} County";
       */
      title: "",

      //----------------------------------
      //  content
      //----------------------------------

      /**
       * The template for defining how to format the content used in a popup. This provides 
       * the developer the ability to easily format and customize the Popup's contents. This may contain 
       * a field name enclosed in `{}`, such as `{FIELDNAME}`. Popup content may also leverage HTML tags
       * such as `<b></b>`, `<p></p>`, and `<table></table>` for formatting the look and feel of the content.
       * 
       * @type {string}
       * @example 
       * //In a service where a field named COUNTY_NAME contains the name of a county, 
       * //and a field named POP_2010 contains population values for each county in 2010, the content 
       * //of the popup when the user clicks a feature representing Los Angeles County will say:
       * //"In 2010 the population of Los Angeles County was 9,826,000."
       * popupTemplate.content = "In 2010 the population of {COUNTY_NAME} County was {POP_2010}.";
       */
      content: "",

      //----------------------------------
      //  actions
      //----------------------------------

      /**
       * Defines actions or functions that may be executed by clicking the icon
       * or image symbolizing them in the {@link module:esri/widgets/Popup}. By default, every 
       * {@link module:esri/widgets/Popup} has a `zoom-to` action styled with a magnifying glass icon 
       * ![popupTemplate-zoom-action](../assets/img/apiref/widgets/popupTemplate-zoom-action.png). 
       * When this icon is clicked, the view zooms in four LODs and centers on the selected feature.
       * 
       * PopupTemplates do not have default actions. To override actions on the 
       * {@link module:esri/widgets/Popup} using PopupTemplate see [overwriteActions](#overwriteActions).
       * Actions defined in a PopupTemplate will only appear in the {@link module:esri/widgets/Popup} for
       * features or layers that apply that particular PopupTemplate.
       * 
       * The order of each action in the popup is the same order in which they appear the actions array.
       * 
       * The {@link module:esri/widgets/Popup#event:action-click action-click} event in 
       * {@link module:esri/widgets/Popup} fires each time an action in the popup is clicked. 
       * This event should be used to execute custom code for each action clicked. For example, if you would
       * like to add a `zoom-out` action to the PopupTemplate that zooms the view out several LODs, you would 
       * define the zoom-out code in a separate function. Then you would call the custom `zoom-out` function 
       * in the {@link module:esri/widgets/Popup#event:action-click action-click} event handler. See the sample code 
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
       *                          For example, the default `zoom-to` action in {@link module:esri/widgets/Popup}
       *                          uses the font `esri-icon-zoom-in-magnifying-glass`.
       * @property {string} image - The URL to an image that will be used to represent the action in the 
       *                          popup. This property will be used as a background image for the node. 
       *                          It may be used in conjunction with the `className` property or by itself.
       * @property {string} id - The name of the ID assigned to this action. This is used for
       *                        differentiating actions when listening to the 
       *                        {@link module:esri/widgets/Popup#event:action-click action-click} event.
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
       * //Adds the custom action to the PopupTemplate.
       * popupTemplate.actions.push(zoomOutAction);
       * //Apply this PopupTemplate to a layer (or graphic)
       * layer.popupTemplate = popupTemplate;
       * //This action will only appear in the popup for features in that layer
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
       * //Notice this event is handled on the default popup of the View
       * //NOT on an instance of PopupTemplate
       * view.popup.on("action-click", function(evt){
       *   //If the zoom-out action is clicked, fire the zoomOut() function
       *   if(evt.action.id === "zoom-out"){
       *     zoomOut();
       *   }
       * });
       */
      actions: [],

      //----------------------------------
      //  overwriteActions
      //----------------------------------

      /**
       * Indicates whether actions should replace existing {@link module:esri/widgets/Popup#actions popup actions}.
       * 
       * @type {boolean}
       * @default false
       *                
       * @example 
       * //The actions defined in the Popup will not display when the
       * //PopupTemplate is used. The actions defined in the PopupTemplate will used instead.
       * popupTemplate.overwriteActions = true;
       */
      overwriteActions: false,
      
      //----------------------------------
      //  showAttachments
      //----------------------------------

      /**
      * Indicates whether to provide links to attachments for the selected feature in the popup. This
      * property is only relevant to services and layers that have attachments enabled.
      * 
      * @type {boolean}
      * @default
      * @example
      * //Disables access to any attachments related to the selected feature via the popup
      * popupTemplate.showAttachments = false;
      */
      showAttachments: true,

      //--------------------------------------------------------------------------
      //
      //  Lifecycle
      //
      //--------------------------------------------------------------------------

      constructor: function () {
        this._fieldLabels = {};
        this._fieldsMap = {};
      },

      getDefaults: function () {
        return lang.mixin(this.inherited(arguments), {
          fieldInfos: [],
          mediaInfos: [],
          title: "",
          content: "",
          actions: [],
          overwriteActions: false,
          showAttachments: true
        });
      },

      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------

      /**
      * Converts an instance of this class to its JSON representation in the ArcGIS platform.
      * 
      * @return {Object} The ArcGIS JSON representation of the class instance calling this method.
      */    
      toJSON: function () {
        return {
          fieldInfos: this.fieldInfos ? this.fieldInfos.slice(0) : [],
          mediaInfos: this.mediaInfos ? this.mediaInfos.slice(0) : [],
          title: this.title,
          content: this.content,
          actions: this.actions ? this.actions.slice(0) : [],
          overwriteActions: this.overwriteActions,
          showAttachments: this.showAttachments
        };
      }

    });
  return PT;
});