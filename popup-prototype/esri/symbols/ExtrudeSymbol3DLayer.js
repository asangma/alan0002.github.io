/**
 * ExtrudeSymbol3DLayer draws polygon geometries as solid 3D objects by extruding the surface along the vertical (z)
 * axis.
 *
 * An ExtrudeSymbol3DLayer cannot be used directly as a symbol. It needs to be part of a
 * {@link module:esri/symbols/PolygonSymbol3D PolygonSymbol3D}:
 * ```
 * var symbol = new PolygonSymbol3D(
 *   new ExtrudeSymbol3DLayer({
 *     size: 100,
 *     material: { color: "red" }
 *   })
 * );
 *```
 *
 * @module esri/symbols/ExtrudeSymbol3DLayer
 * @since 4.0
 * @see [Sample - Extrude polygon](../sample-code/3d/polygon-extrusion-3d/)
 * @see module:esri/symbols/PolygonSymbol3D
 * @see module:esri/symbols/FillSymbol3DLayer
 */

define([
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "./Symbol3DLayer"
], function(declare, lang, esriLang, Symbol3DLayer) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/ExtrudeSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ExtrudeSymbol3DLayer = declare(Symbol3DLayer, 
  /** @lends module:esri/symbols/ExtrudeSymbol3DLayer.prototype */
  {
    /**
     * For ExtrudeSymbol3DLayer, the type is always `Extrude`.
     *
     * @type {string}
     * @readOnly
     */    
    type: "Extrude",

    /**
     * The height of the extrusion in meters. Negative values will extrude the polygon surface downward towards
     * the ground.
     * 
     * @type {number}
     */
    size: 0,    

    /**
     * The material used for visualization of the extruded geometry.
     *
     * @type {Object}
     * @property {module:esri/Color} color - The color of the extruded geometry. Can be assigned a named string, hex string, array of rgb
     * or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object.
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

  return ExtrudeSymbol3DLayer;
});
