/**
 * Defines the layout template options used by the {@link module:esri/tasks/PrintTask|PrintTask}
 * and {@link module:esri/widgets/Print|Print} widget to generate the print page.
 *
 * @module esri/tasks/support/PrintTemplate
 * @since 4.0
 */
define([
  "../../core/declare",

  "../../core/Accessor"
], function(
  declare,
  Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/PrintTemplate
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PrintTemplate = declare(Accessor,
  /** @lends module:esri/tasks/support/PrintTemplate.prototype */
  {

    declaredClass: "esri.tasks.PrintTemplate",

    /**
    * The text that appears on the Print Widget's print button.
    * @type {string}
    */  
    label: null,

    /**
    * Define the map width, height and dpi. Required when `layout = 'MAP_ONLY'`. This is an object with the following structure:
    * 
    * @property {number} width - Map width. Default value is 800.
    * @property {number} height - Map height. Default value is 1100.
    * @property {number} dpi - Resolution in dots per inch. Default is 96.
    * 
    * @type {Object}
    */
    exportOptions: {
      width: 800,
      height: 1100,
      dpi: 96
    },

    /**
    * Defines the layout elements. It's an object with the following properties: 
    * 
    * @property {string} titleText - The text used for the map title if the specified layout contains a title text element.
    * @property {string} authorText - The text used for the author if the specified layout contains an author text element.
    * @property {string} copyrightText - The text used for the copyright if the specified layout contains an copyright text element.
    * @property {string} scalebarUnit - The units used for the scalebar. **Valid values:** 
    * `'Miles' | 'Kilometers' | 'Meters' | 'Feet'.` **Default** is `'Miles'`.
    * @property {module:esri/tasks/support/LegendLayer[]} legendLayers - An array of LegendLayer containing the id's of the layers that 
    * will be included in the legend. If `legendLayers` is not specified, all operational layers will be present in the legend. To specify
    * that no layers will be included in the legend set `legendLayer = []`.
    * @property {Object[]} customTextElements - Updated the text for a TextElement, that is not DynamicText, on the page layout. 
    * Values must be strings.
    * 
    * @type {Object}
    */  
    layoutOptions: null,

    /**
    * The print output format.
    * 
    * **Known values:** `pdf | png32 | png8 | jpg | gif | eps | svg | svgz`
    * 
    * @type {string}
    */  
    format: "PNG32",

    /**
    * The layout used for the print output. The print service provides the following out-of-the-box templates:
    * * MAP_ONLY
    * * A3 Landscape
    * * A3 Portrait
    * * A4 Landscape
    * * A4 Portrait
    * * Letter ANSI A Landscape
    * * Letter ANSI A Portrait
    * * Tabloid ANSI B Landscape
    * * Tabloid ANSI B Portrait
    * 
    * The server administrator can add additional templates to the print service.
    * @type {string}
    */  
    layout: "MAP_ONLY",

    /**
    * The optional map scale of the printed map. Only applies when `preserveScale = true`. If `outScale` is less than 1, then 
    * the printed map will use the scale of the input map.
    * @type {number}
    * @default 0
    */  
    outScale: 0,

    /**
    * Define whether the printed map should preserve map scale or map extent. If `true`, the printed map will use the `outScale` 
    * property or default to the scale of the input map. If `false`, the printed map will use the same extent as the input map and 
    * thus scale might change.
    * @type {boolean}
    * @default
    */  
    preserveScale: true,

    /**
    * When `false`, attribution is not displayed on the printout. When `true`, it will honor the `showAttribution` property of the map object. 
    * @type {boolean}
    */  
    showAttribution: null,

    /**
    * When `true`, labels will be shown on the layout. 
    * @type {boolean}
    * @default
    */  
    showLabels: true
  });

  return PrintTemplate;
});
