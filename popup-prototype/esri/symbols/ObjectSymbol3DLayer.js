/**
 * ObjectSymbol3DLayer is used to symbolize points as 3D shapes.
 *
 * An ObjectSymbol3DLayer cannot be used directly as a symbol. It needs to be part of a
 * {@link module:esri/symbols/PointSymbol3D PointSymbol3D}:
 * ```
 * var symbol = new PointSymbol3D(
 *   new ObjectSymbol3DLayer({
 *     width: 5
 *     height: 20,
 *     resource: { primitive: "cylinder" },
 *     material: { color: "red" }
 *   })
 * );
 *```
 *
 * @module esri/symbols/ObjectSymbol3DLayer
 * @since 4.0
 * @see [Sample - 3D symbols for points](../sample-code/3d/points-3d/)
 * @see module:esri/symbols/PointSymbol3D
 * @see module:esri/symbols/IconSymbol3DLayer
 */

define([
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "./Symbol3DLayer"
], function(declare, lang, esriLang, Symbol3DLayer) {

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/ObjectSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ObjectSymbol3DLayer = declare(Symbol3DLayer,
  /** @lends module:esri/symbols/ObjectSymbol3DLayer.prototype */
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
     * For ObjectSymbol3DLayer, the type is always `Object`.
     *
     * @type {string}
     * @readOnly
     */
    type: "Object",

    //----------------------------------
    //  material
    //----------------------------------

    /**
     * The material used for visualization of the object.
     *
     * @type {Object}
     * @property {module:esri/Color} color - Color of the object. Can be assigned a named string, hex string, array of rgb
     *   or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object. If the object
     *   has textures, the textures will be multiplied with the color.
     */
    material: undefined,

    //----------------------------------
    //  resource
    //----------------------------------
    /**
     * The primitive shape (`primitive`) or external 3D model (`href`) used to visualize the
     * points. If both properties are present, `primitive` takes precedence and `href` is ignored.
     *
     * @type {Object}
     * @property {string} primitive - Use a built-in shape. See table below for possible values.
     * 
     * Value | Description
     * ------|------------
     * sphere | ![s3d-object-sphere](../assets/img/apiref/symbols/symbols3d-object-sphere.png)
     * cylinder | ![s3d-object-cylinder](../assets/img/apiref/symbols/symbols3d-object-cylinder.png)
     * cube | ![s3d-object-cube](../assets/img/apiref/symbols/symbols3d-object-cube.png)
     * cone | ![s3d-object-cone](../assets/img/apiref/symbols/symbols3d-object-cone.png)
     * diamond | ![s3d-object-diamond](../assets/img/apiref/symbols/symbols3d-object-diamond.png)
     * tetrahedron | ![s3d-object-tetrahedron](../assets/img/apiref/symbols/symbols3d-object-tetrahedron.png)
     * 
     * @property {string} href      - The URL linking to the 3D model to be used.
     */
    resource: undefined,

    //----------------------------------
    //  width
    //----------------------------------

    /**
     * Width of the object in meters. If `undefined`, the width will be calculated to maintain the original 
     * proportions of the object.
     *
     * @type {number}
     *
     */
    width: undefined,

    //----------------------------------
    //  height
    //----------------------------------

    /**
     * Height of the object in meters. If `undefined`, the height will be calculated to maintain the original 
     * proportions of the object.
     *
     * @type {number}
     */
    height: undefined,

    //----------------------------------
    //  depth
    //----------------------------------

    /**
     * Depth of the object in meters. If undefined, the depth will be calculated to maintain the original 
     * proportions of the object.
     *
     * @type {number}
     */
    depth: undefined,

    //----------------------------------
    //  anchor
    //----------------------------------

    /**
     * The positioning of the object relative to the point geometry. `origin` is only valid when an `href` resource is 
     * specified and will use the pivot point defined by the 3D model.
     *
     * **Possible Values:** center | bottom | origin
     * 
     * @type {string}
     */
    anchor: undefined,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var json = {
        width: this.width,
        height: this.height,
        depth: this.depth,
        anchor: this.anchor,
        resource: lang.clone(this.resource)
      };
      lang.mixin(json, this.inherited(arguments));
      return esriLang.fixJson(json, true);
    }
  });

  return ObjectSymbol3DLayer;
});