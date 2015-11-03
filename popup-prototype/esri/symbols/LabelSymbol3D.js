/**
 * LabelSymbol3D is used as a container for {@link module:esri/symbols/TextSymbol3DLayer TextSymbol3DLayer} in label
 * classes.
 * 
 * @module esri/symbols/LabelSymbol3D
 * @since 4.0
 */
define([
  "../core/declare",
  "./Symbol3D"
], function(declare, Symbol3D) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/LabelSymbol3D
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var LabelSymbol3D = declare(Symbol3D,
    /** @lends module:esri/symbols/LabelSymbol3D.prototype */
  {
    declaredClass: "esri.symbol.LabelSymbol3D",

    /**
     * For LabelSymbol3D, the type is always `LabelSymbol3D`.
     *
     * @type {string}
     * @readOnly
     */
    type: "LabelSymbol3D",
    _allowedLayerTypes: ["Text"]
  });

  LabelSymbol3D.fromJSON = function(json) {
    var result = new LabelSymbol3D();
    result.read(json);
    return result;
  };

  return LabelSymbol3D;
});
