/**
 * MeshSymbol3D is used as a container for {@link module:esri/symbols/FillSymbol3DLayer FillSymbol3DLayer} on
 * mesh scene layers.
 *
 * Without any symbol layers, a MeshSymbol3D does not have any effect. To change the fill color of a mesh scene layer,
 * add a FillSymbol3DLayer to the symbol. Example:
 * ```
 * var symbol = new MeshSymbol3D(
 *   new FillSymbol3DLayer({
 *     material: { color: "red" }
 *   })
 * );
 * sceneLayer.renderer = new SimpleRenderer(symbol);
 *```
 * 
 * @module esri/symbols/MeshSymbol3D
 * @since 4.0
 * @see [Sample - SceneLayer](../sample-code/3d/scene-layer/)
 * @see module:esri/symbols/PointSymbol3D
 * @see module:esri/symbols/LineSymbol3D
 * @see module:esri/symbols/PolygonSymbol3D
 */

define([
  "../core/declare",
  "./Symbol3D"
], function(declare, Symbol3D) {

  /**
   * @extends module:esri/symbols/Symbol3D
   * @constructor module:esri/symbols/MeshSymbol3D
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var MeshSymbol3D = declare(Symbol3D,
  /** @lends module:esri/symbols/MeshSymbol3D.prototype */
  {
    declaredClass: "esri.symbol.MeshSymbol3D",

    /**
     * For MeshSymbol3D, the type is always `MeshSymbol3D`.
     *
     * @type {string}
     * @readOnly
     */
    type: "MeshSymbol3D",
    _allowedLayerTypes: ["Fill"]
  });

  MeshSymbol3D.fromJSON = function(json) {
    var result = new MeshSymbol3D();
    result.read(json);
    return result;
  };

  return MeshSymbol3D;
});
