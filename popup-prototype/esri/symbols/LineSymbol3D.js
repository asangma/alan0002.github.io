/**
 * LineSymbol3D is used as a container for symbol layers to draw graphics or features with line geometry. The
 * symbol layers of LineSymbol3D should be one of the following types: 
 * 
 * * {@link module:esri/symbols/LineSymbol3DLayer LineSymbol3DLayer}
 * * {@link module:esri/symbols/PathSymbol3DLayer PathSymbol3DLayer}
 * * {@link module:esri/symbols/TextSymbol3DLayer TextSymbol3DLayer}
 *
 * Without any symbol layers, a LineSymbol3D does not draw anything. To visualize linear features, add at least one
 * symbol layer to the LineSymbol3D. Example:
 * ```
 * var symbol = new LineSymbol3D(
 *   new PathSymbol3DLayer({
 *     size: 20,
 *     material: { color: "red" }
 *   })
 * );
 *```
 *
 * @module esri/symbols/LineSymbol3D
 * @since 4.0
 * @see module:esri/symbols/PointSymbol3D
 * @see module:esri/symbols/PolygonSymbol3D
 */

define([
  "../core/declare",
  "./Symbol3D"
], function(declare, Symbol3D) {

  /**
   * @extends module:esri/symbols/Symbol3D
   * @constructor module:esri/symbols/LineSymbol3D
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var LineSymbol3D = declare(Symbol3D,
  /** @lends module:esri/symbols/LineSymbol3D.prototype */
  {
    declaredClass: "esri.symbol.LineSymbol3D",

    /**
     * For LineSymbol3D, the type is always `LineSymbol3D`.
     *
     * @type {string}
     * @readOnly
     */
    type: "LineSymbol3D",
    _allowedLayerTypes: ["Line", "Path", "Label"]
  });

  LineSymbol3D.fromJSON = function(json) {
    var result = new LineSymbol3D();
    result.read(json);
    return result;
  };

  return LineSymbol3D;
});
