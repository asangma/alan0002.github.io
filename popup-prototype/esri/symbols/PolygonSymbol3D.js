/**
 * PolygonSymbol3D is used as a container for symbol layers to draw graphics or features with polygon geometry. The
 * symbol layers of PolygonSymbol3D should be one of the following types:
 * 
 * * {@link module:esri/symbols/FillSymbol3DLayer FillSymbol3DLayer}
 * * {@link module:esri/symbols/LineSymbol3DLayer LineSymbol3DLayer}
 * * {@link module:esri/symbols/IconSymbol3DLayer IconSymbol3DLayer}
 * * {@link module:esri/symbols/ObjectSymbol3DLayer ObjectSymbol3DLayer}
 * * {@link module:esri/symbols/TextSymbol3DLayer TextSymbol3DLayer}
 * * {@link module:esri/symbols/ExtrudeSymbol3DLayer ExtrudeSymbol3DLayer}
 * * {@link module:esri/symbols/TextSymbol3DLayer TextSymbol3DLayer}
 *
 * Without any symbol layers, a PolygonSymbol3D does not draw anything. To visualize polygon features, add at least one
 * symbol layer to the PolygonSymbol3D. Example:
 * ```
 * var symbol = new PolygonSymbol3D(
 *   new FillSymbol3DLayer({
 *     material: { color: "red" }
 *   })
 * );
 *```
 * 
 * @module esri/symbols/PolygonSymbol3D
 * @since 4.0
 * @see [Sample - Extrude polygon](../sample-code/3d/polygon-extrusion-3d/)
 * @see module:esri/symbols/PointSymbol3D
 * @see module:esri/symbols/LineSymbol3D
 */

define([
  "../core/declare",
  "./Symbol3D"
], function(declare, Symbol3D) {

  /**
   * @extends module:esri/symbols/Symbol3D
   * @constructor module:esri/symbols/PolygonSymbol3D
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PolygonSymbol3D = declare(Symbol3D,
  /** @lends module:esri/symbols/PolygonSymbol3D.prototype */
  {
    declaredClass: "esri.symbol.PolygonSymbol3D",

    /**
     * For PolygonSymbol3D, the type is always `PolygonSymbol3D`.
     *
     * @type {string}
     * @readOnly
     */
    type: "PolygonSymbol3D",
    _allowedLayerTypes: ["Extrude", "Fill", "Line", "Icon", "Object", "Label"]
  });

  PolygonSymbol3D.fromJSON = function(json) {
    var result = new PolygonSymbol3D();
    result.read(json);
    return result;
  };

  return PolygonSymbol3D;
});
