/**
 * IconSymbol3DLayer is used to symbolize points using an image or a simple 2D shape (e.g., a circle).
 *
 * An IconSymbol3DLayer cannot be used directly as a symbol. It needs to be part of a
 * {@link module:esri/symbols/PointSymbol3D PointSymbol3D}:
 * ```
 * var symbol = new PointSymbol3D(
 *   new IconSymbol3DLayer({
 *     size: 8,
 *     resource: { primitive: "circle" },
 *     material: { color: "red" }
 *   })
 * );
 *```
 *
 * @module esri/symbols/IconSymbol3DLayer
 * @since 4.0
 * @see [Sample - 3D symbols for points](../sample-code/3d/points-3d/)
 * @see module:esri/symbols/PointSymbol3D
 * @see module:esri/symbols/ObjectSymbol3DLayer
 */

define([
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang",
  "../core/screenUtils",
  "./Symbol3DLayer",
  "../core/JSONSupport",
  "../Color"  
], function(declare, lang, esriLang, screenUtils, Symbol3DLayer, JSONSupport, Color) {

  // Outline: internal class, used only by Symbol3DLayer
  var Outline = JSONSupport.createSubclass({
    classMetadata: {
      properties: {
        color: {
          type: Color
        }
      },
      reader: {
        exclude: ["transparency"]
      }
    },

    color: undefined,

    toJSON: function() {
      return {
        color: this.color ? [this.color.r, this.color.g, this.color.b] : undefined,
        transparency: this.color ? 100*(1 - this.color.a) : undefined,
        size: (this.size != null) ? screenUtils.px2pt(this.size) : undefined
      };
    },

    _colorReader: function(value, source) {
      var opacity = source.transparency != null ? 1 - 0.01*source.transparency : 1;
      if (value && esriLang.isDefined(value[0])) {
        return [ value[0], value[1], value[2], opacity ];
      }      
    },

    _sizeReader : screenUtils.pt2px

  });

  /**
   * @extends module:esri/symbols/Symbol3DLayer
   * @constructor module:esri/symbols/IconSymbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var IconSymbol3DLayer = declare(Symbol3DLayer,
  /** @lends module:esri/symbols/IconSymbol3DLayer.prototype */
  {
    classMetadata: {
      properties: {
        outline: {
          type: Outline
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * For IconSymbol3DLayer, the type is always `Icon`.
     *
     * @type {string}
     * @readOnly
     */
    type: "Icon",

    //----------------------------------
    //  material
    //----------------------------------

    /**
     * The material used for visualization of the point.
     *
     * @type {Object}
     * @property {module:esri/Color} color - Fill color of the icon. Can be assigned a named string, hex string, array of rgb
     *   or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object. 
     *   If the icon uses an
     *   image as resource, each pixel of the image will be multiplied by this color.
     */
    material: undefined,

    //----------------------------------
    //  resource
    //----------------------------------
    /**
     * The shape (`primitive`) or image URL (`href`) used to visualize the points. If both
     * properties are present, `href` takes precedence and `primitive` is ignored.
     *
     * @type {Object}
     * @property {string} primitive - Use a built-in shape. See table below for list of possible values.
     * 
     * Value | Description
     * ------|------------  
     * circle | ![s3d-icon-circle](../assets/img/apiref/symbols/symbols3d-icon-circle.png)
     * square |  ![s3d-icon-square](../assets/img/apiref/symbols/symbols3d-icon-square.png)
     * cross | ![s3d-icon-cross](../assets/img/apiref/symbols/symbols3d-icon-cross.png)
     * x | ![s3d-icon-x](../assets/img/apiref/symbols/symbols3d-icon-x.png)
     * kite | ![s3d-icon-kite](../assets/img/apiref/symbols/symbols3d-icon-kite.png)
     * 
     * @property {string} href      - URL of the image.
     */
    resource: undefined,

    //----------------------------------
    //  size
    //----------------------------------

    /**
     * Size of the icon in pixels.
     *
     * @type {number}
     */
    size: undefined,

    _sizeReader: screenUtils.pt2px,

    //----------------------------------
    //  anchor
    //----------------------------------

    /**
     * The positioning of the icon relative to the point geometry. 
     * 
     * **Possible values:** center | left | right | top |
     * bottom | topLeft | topRight | bottomLeft | bottomRight
     *
     * @type {string}
     */
    anchor: undefined,

    //----------------------------------
    //  outline
    //----------------------------------

    /**
     * The outline of the icon primitive.
     *
     * @type {Object}
     * @property {module:esri/Color} color - Color of the outline. Can be assigned a named string, hex string, array of rgb
     *   or rgba values, an object with `r`, `g`, `b`, and `a` properties, or a {@link module:esri/Color Color} object.
     * @property {number} size Width of the outline in pixels.
     */

    outline: undefined,

    _outlineReader: function(value) {
      return Outline.fromJSON(value);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var json = {
        resource: lang.clone(this.resource),
        size: (this.size != null) ? screenUtils.px2pt(this.size) : undefined,
        anchor: this.anchor,
        outline: this.outline ? this.outline.toJSON() : undefined
      };
      lang.mixin(json, this.inherited(arguments));
      return esriLang.fixJson(json, true);
    }
  });

  return IconSymbol3DLayer;
});
