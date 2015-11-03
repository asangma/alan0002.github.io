/**
 * LineSymbol3DLayer is used to draw linear features as flat, 2D lines in a {@link module:esri/views/SceneView}.
 * To draw lines in a 3D tube-like manner, use {@link module:esri/symbols/PathSymbol3DLayer}.
 *
 * A LineSymbol3DLayer cannot be used directly as a symbol. It needs to be part of a
 * {@link module:esri/symbols/LineSymbol3D}:
 * ```
 * var symbol = new LineSymbol3D(
 *   new LineSymbol3DLayer({
 *     size: 3,
 *     material: { color: "red" }
 *   })
 * );
 *```
 * @module esri/symbols/LineSymbol3DLayer
 * @since 4.0
 * @see module:esri/symbols/LineSymbol3D
 * @see module:esri/symbols/PathSymbol3DLayer
 */
define([
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "../core/screenUtils",
  "./Symbol3DLayer"
], function(declare, lang, esriLang, screenUtils, Symbol3DLayer) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/LineSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var LineSymbol3DLayer = declare(Symbol3DLayer,
  /** @lends module:esri/symbols/LineSymbol3DLayer.prototype */
  {
    /**
     * For LineSymbol3DLayer, the type is always `Line`.
     *
     * @type {string}
     * @readOnly
     */
    type: "Line",

    /**
     * The width of the line in pixels.
     * 
     * @type {number}
     */
    size: 0,

    _sizeReader: screenUtils.pt2px,

    /**
     * The material used for visualization of the line.
     *
     * @type {Object}
     * @property {module:esri/Color} color - Color of the line. Can be assigned a named string, hex string, array of rgb
     *   or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object.
     */
    material: null,

    toJSON: function() {
      var json = {
        size: (this.size != null) ? screenUtils.px2pt(this.size) : undefined
      };
      lang.mixin(json, this.inherited(arguments));
      return esriLang.fixJson(json, true);
    }
  });

  return LineSymbol3DLayer;
});