/**
 * TextSymbol3DLayer is used to draw text labels on point geometries.
 *
 * @module esri/symbols/TextSymbol3DLayer
 * @since 4.0
 * @see module:esri/symbols/PointSymbol3D
 */

define([
  "../core/declare",
  "dojo/_base/lang",

  "../core/lang",
  "../core/screenUtils",

  "./Symbol3DLayer"
], function(
  declare, lang,
  esriLang, screenUtils,
  Symbol3DLayer
) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/TextSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var TextSymbol3DLayer = declare(Symbol3DLayer,
  /** @lends module:esri/symbols/TextSymbol3DLayer.prototype */
  {
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * For TextSymbol3DLayer, the type is always `Text`.
     *
     * @type {string}
     * @readOnly
     */
    type: "Text",

    //----------------------------------
    //  material
    //----------------------------------

    /**
     * The material used for visualization of the point.
     *
     * @type {Object}
     * @property {module:esri/Color} color - Color of the text. Can be assigned a named string, hex string, array of rgb
     *   or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object.
     */
    material: undefined,

    //----------------------------------
    //  size
    //----------------------------------

    /**
     * Size of the text label in pixels.
     *
     * @type {number}
     */
    size: undefined,

    _sizeReader: screenUtils.pt2px,

    //----------------------------------
    //  text
    //----------------------------------

    /**
     * Text to be displayed.
     *
     * @type {String}
     */
    text: undefined,

    //----------------------------------
    //  font
    //----------------------------------

    /**
     * Font of the text label.
     *
     * @type {Object}
     * @property {string} family - Font family. **Example:** Arial
     * @property {string} weight - Font weight. **Known Values:** normal | bold
     * @property {string} style  - Font style. **Known Values:** normal | italic
     */
    font: undefined,

    toJSON: function() {
      var json = {
        font: this.font ? lang.clone(this.font) : undefined,
        size: (this.size != null) ? screenUtils.px2pt(this.size) : undefined
      };
      lang.mixin(json, this.inherited(arguments));
      return esriLang.fixJson(json, true);
    }
  });

  return TextSymbol3DLayer;
});