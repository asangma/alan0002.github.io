/**
 * FillSymbol3DLayer draws the surfaces of polygons and meshes with a single color.
 *
 * A FillSymbol3DLayer cannot be used directly as a symbol. It needs to be part of a
 * {@link module:esri/symbols/PolygonSymbol3D PolygonSymbol3D} or {@link module:esri/symbols/MeshSymbol3D MeshSymbol3D}:
 * ```
 * var symbol = new PolygonSymbol3D(
 *   new FillSymbol3DLayer({
 *     material: { color: "red" }
 *   })
 * );
 *```
 *
 * @module esri/symbols/FillSymbol3DLayer
 * @since 4.0
 * @see [Sample - SceneLayer](../sample-code/3d/scene-layer/)
 * @see module:esri/symbols/PolygonSymbol3D
 * @see module:esri/symbols/MeshSymbol3D
 * @see module:esri/symbols/ExtrudeSymbol3DLayer
 */
define([
  "../core/declare",
  "../core/lang",
  "./Symbol3DLayer"
], function(declare, esriLang, Symbol3DLayer) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/FillSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var FillSymbol3DLayer = declare(Symbol3DLayer,
  /** @lends module:esri/symbols/FillSymbol3DLayer.prototype */
  {
    /**
     * For FillSymbol3DLayer, the type is always `Fill`.
     *
     * @type {string}
     * @readOnly
     */
    type: "Fill",

    /**
     * The material used for visualization of the filled geometry.
     *
     * @type {Object}
     * @property {module:esri/Color} color - The color of the fill. Can be assigned a named string, hex string, array of rgb
     * or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object.
     */
    material: null,

    toJSON: function() {
      return esriLang.fixJson(this.inherited(arguments), true);
    }
  });

  return FillSymbol3DLayer;
});
