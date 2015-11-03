/**
 * PointSymbol3D is used as a container for symbol layers to draw graphics or features with point geometry. The
 * symbol layers of PointSymbol3D have to be one of the following types:
 *
 * * {@link module:esri/symbols/IconSymbol3DLayer IconSymbol3DLayer}
 * * {@link module:esri/symbols/ObjectSymbol3DLayer ObjectSymbol3DLayer}
 * * {@link module:esri/symbols/TextSymbol3DLayer TextSymbol3DLayer}
 *
 * Without any symbol layers, a PointSymbol3D does not draw anything. To visualize point features, add at least one
 * symbol layer to the PointSymbol3D. Example:
 * ```
 * var symbol = new PointSymbol3D({
 *   symbolLayers: [new ObjectSymbol3DLayer({
 *     width: 5     //width of object in meters
 *     height: 10,  //height of object in meters
 *     depth: 15,   //depth in meters
 *     resource: { primitive: "cube" },
 *     material: { color: "red" }
 *   })]
 * });
 *```
 * 
 * @module esri/symbols/PointSymbol3D
 * @since 4.0
 * @see [Sample - 3D symbols for points](../sample-code/3d/points-3d/)
 * @see module:esri/symbols/LineSymbol3D
 * @see module:esri/symbols/PolygonSymbol3D
 */

define([
  "../core/declare",
  "./Symbol3D"
], function(declare, Symbol3D) {

  /**
   * @extends module:esri/symbols/Symbol3D
   * @constructor module:esri/symbols/PointSymbol3D
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var PointSymbol3D = declare(Symbol3D,
  /** @lends module:esri/symbols/PointSymbol3D.prototype */
  {
    declaredClass: "esri.symbol.PointSymbol3D",

    /**
     * For PointSymbol3D, the type is always `PointSymbol3D`.
     *
     * @type {string}
     * @readOnly
     */
    type: "PointSymbol3D",
    _allowedLayerTypes: ["Icon", "Object", "Text"]
  });

  return PointSymbol3D;
});