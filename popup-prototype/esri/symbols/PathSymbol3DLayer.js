/**
 * PathSymbol3DLayer is used to draw linear features as three-dimensional tubes.
 *
 * A PathSymbol3DLayer cannot be used directly as a symbol. It needs to be part of a
 * {@link module:esri/symbols/LineSymbol3D LineSymbol3D}:
 * ```
 * var symbol = new LineSymbol3D(
 *   new PathSymbol3DLayer({
 *     size: 20,
 *     material: { color: "red" }
 *   })
 * );
 *```
 *
 * @module esri/symbols/PathSymbol3DLayer
 * @since 4.0
 * @see module:esri/symbols/LineSymbol3D
 * @see module:esri/symbols/LineSymbol3DLayer
 */
define([
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "./Symbol3DLayer"
], function(declare, lang, esriLang, Symbol3DLayer) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/PathSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PathSymbol3DLayer = declare(Symbol3DLayer,
  /** @lends module:esri/symbols/PathSymbol3DLayer.prototype */
  {
    classMetadata: {
      reader: {
        exclude: ["width"],
        add: ["size"]
      }
    },

    /**
     * For PathSymbol3DLayer, the type is always `Path`.
     *
     * @type {string}
     * @readOnly
     */
    type: "Path",

    /**
     * The diameter of the tube in meters.
     * 
     * @type {number}
     */
    size: 0,

    _sizeReader: function(value, source)
    {
      // WSV 3.8 and older used to write "width" instead of "size" into Path symbol layers in web scenes. convert
      // to "size" if that's the case.
      return value || source.width || 0;
    },


    /**
     * The material used to draw the tube.
     *
     * @type {Object}
     * @property {module:esri/Color} color - Color of the tube. Can be assigned a named string, hex string, array of rgb
     *   or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object.
     */
    material: null,

    toJSON: function() {
      var json = {
        size: this.size
      };
      lang.mixin(json, this.inherited(arguments));
      return esriLang.fixJson(json, true);
    }
  });

  return PathSymbol3DLayer;
});