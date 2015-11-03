 /**
   * @classdesc
   * Creates a new color object by passing either a hex, rgba, or named color value. 
   * This class inherits all attributes from **dojo/_base/Color** to provide functions for setting colors.
   * 
   * It is important to note that this class is not required for defining colors in other classes of the API
   * that require a color value.
   * For example, when creating a {@link module:esri/symbols/SimpleFillSymbol#color SimpleFillSymbol},
   * you can define the color of the fill symbol with a Color object created from this class, or you
   * can define it directly on the property with an hex or rgba value. See sample snippet below.
   * 
   * ```
   * //Define symbol color using Color object
   * var sfs = new SimpleFillSymbol({
   *   color: new Color("#FF0000")
   * });
   * 
   * //Define symbol color directly using rgba value
   * var sfs = new SimpleFillSymbol({
   *   color: [0, 255, 123, 0.7]
   * });
   * ```
   *
   * @module esri/Color
   * @since 4.0
   * @see [dojo/_base/Color](http://dojotoolkit.org/reference-guide/1.10/dojo/_base/Color.html#dojo-base-color)
   */
define([
  "./core/declare",
  "dojo/colors"
], function(declare, dojoColor) {

  /////////////////////////////////////
  //
  // Constructor
  //
  /////////////////////////////////////
    
 /**
   * @constructor module:esri/Color
   * @param {string | number[] | Object} color - The color to create. This parameter can be a string
   *                                           representing a named color or a hex value; an array of three
   *                                           or four numbers representing r, g, b, a values; or an object 
   *                                           with r, g, b, a properties. 
   *                                           
   * @example
   * //Creates a green Color object using a named value
   * var color = new Color("green");
   * 
   * //Creates a green Color object using a hex value
   * var color = new Color("00FF00");
   * 
   * //Creates a new Color object using an array of r, g, b values
   * var color = new Color([125, 255, 13]);
   * 
   * //Add a fourth value to the array to add opacity (range between 0 and 1)
   * var color = new Color([125, 255, 13, 0.5]);
   * 
   * //Creates a new Color object using an object
   * var color = new Color({
   *   r: 125,
   *   g: 255,
   *   b: 13,
   *   a: 0.3  //optional
   * }); 
   */
    
  /////////////////////////////////////
  //
  // Properties
  //
  /////////////////////////////////////    
    
  /**
  * The alpha value. This value can be any number between `0` and `1` and represents the opacity of the Color.
  * `0` indicates the color is fully transparent and `1` indicates it is fully opaque.
  *
  * @name a
  * @type {number}
  * @instance
  */
    
  /**
  * The blue value. This value can range between `0` and `255`.
  *
  * @name b
  * @type {number}
  * @instance
  */
    
  /**
  * The green value. This value can range between `0` and `255`.
  *
  * @name g
  * @type {number}
  * @instance
  */
    
  /**
  * The red value. This value can range between `0` and `255`.
  *
  * @name r
  * @type {number}
  * @instance
  */    
    
  /////////////////////////////////////
  //
  // Methods
  //
  /////////////////////////////////////    
    
  /**
   * Creates a Color instance by blending two colors using a weight factor. Optionally accepts
   * a Color object to update and return instead of creating a new object.
   *
   * @param {module:esri/Color} start - The start color.
   * @param {module:esri/Color} end - The end color.
   * @param {number} weight - The weight value is a number from 0 to 1, with 0.5 being a 50/50 blend.
   * @param {module:esri/Color=} obj - A previously allocated Color object to reuse for the result.
   *
   * @method blendColors
   * @memberOf module:esri/Color
   * @return {module:esri/Color} Returns a new Color object.
   * 
   * @example
   * var startColor = new Color("#0000FF");
   * var endColor = new Color("#CA0013");
   * var blendedColor = Color.blendColors(startColor, endColor, 0.5);
   */

  /**
   * Creates a Color instance from a string of the form "rgb()" or "rgba()". Optionally accepts a
   * Color object to update with the parsed value and return instead of creating a new object.
   *
   * @param {string} color - The input color in a string of the form "rgb()" or "rgba()".
   *                       @param {module:esri/Color=} obj - A previously allocated Color object to reuse for the result.
   *
   * @method fromRgb
   * @memberOf module:esri/Color
   * @return {module:esri/Color} Returns a new Color object.
   * 
   * @example
   * var redColor = Color.fromRgb("rgb(202,0,19)");
   */

  /**
   * Creates a Color instance from a hex string with a '#' prefix. Supports 12-bit #rgb shorthand.
   * Optionally accepts a Color object to update with the parsed value and return instead of
   * creating a new object.
   *
   * @param {string} color - The input color in a hex string.
   * @param {module:esri/Color=} obj - A previously allocated Color object to reuse for the result.
   *
   * @method fromHex
   * @memberOf module:esri/Color
   * @return {module:esri/Color} Returns a new Color object.
   * 
   * @example
   * var redColor = Color.fromHex("#CA0013");
   */

  /**
   * Creates a Color instance using a 3 or 4 element array, mapping each element in sequence to
   * the rgb(a) values of the color. Optionally accepts a Color object to update with the color
   * value and return instead of creating a new object.
   *
   * @param {number} a - The input array.
   * @param {module:esri/Color=} obj - A previously allocated Color object to reuse for the result.
   *
   * @method fromArray
   * @memberOf module:esri/Color
   * @return {module:esri/Color} Returns a new Color object.
   * 
   * @example
   * var redColor = Color.fromArray([201, 0, 19]);
   */

  /**
   * Creates a Color instance by parsing a generic string. Accepts hex, rgb, and rgba style color
   * values. Optionally accepts a Color object to update with the parsed value and return instead
   * of creating a new object.
   *
   * @param {string} str - The input value.
   * @param {module:esri/Color=} obj - A previously allocated Color object to reuse for the result.
   *
   * @method fromString
   * @memberOf module:esri/Color
   * @return {module:esri/Color} Returns a new Color object.
   * 
   * @example
   * var redColor = Color.fromString("blue");
   */
    
  /**
   * Takes a named string, hex string, array of rgb or rgba values, an object with r, g, b, and a properties, 
   * or another Color object and sets this color instance to the input value.
   * 
   * @param {string | number[] | Object} color - The new color value. This parameter can be a string
   *                                           representing a named color or a hex value; an array of three
   *                                           or four numbers representing r, g, b, a values; or an object 
   *                                           with r, g, b, a properties. 
   *
   * @method setColor
   * @memberOf module:esri/Color
   * @instance
   * @return {module:esri/Color} Sets the Color instance used to call this method to the new color.
   */
    
  /**
   * Returns a CSS color string in rgba form representing the Color instance.
   * 
   * @param {boolean=} includeAlpha - If `true`, the alpha value will be included in the result.
   *
   * @method toCss
   * @memberOf module:esri/Color
   * @instance
   * @return {string} A CSS color string in rgba form that representats the Color instance used to call this method.
   */
    
  /**
   * Returns a CSS color string in hexadecimal form that represents the Color instance.
   * 
   * @method toHex
   * @memberOf module:esri/Color
   * @instance
   * @return {string} A CSS color string in hexadecimal form that representats the Color instance used to call this method.
   */ 
    
   /**
   * Returns a 3-component array of rgb values that represent the Color instance.
   * 
   * @method toRgb
   * @memberOf module:esri/Color
   * @instance
   * @return {number[]} A 3-component array of rgb values.
   */

   /**
   * Returns a 4-component array of rgba values that represent the Color instance.
   * 
   * @method toRgba
   * @memberOf module:esri/Color
   * @instance
   * @return {number[]} A 4-component array of rgba values.
   */ 
    
   /**
   * Returns a JSON object with all the values from a Color instance.
   * 
   * @param {module:esri/Color} color - A Color object from which to construct a JSON object.
   * 
   * @method toJson
   * @memberOf module:esri/Color
   * @instance
   * @return {Object} A JSON representation of the Color instance.
   */
    
   /**
   * Creates a new Color instance, and initializes it with values from a JSON object.
   * 
   * @param {Object} json - A JSON representation of the instance.
   * 
   * @method fromJSON
   * @memberOf module:esri/Color
   * @return {module:esri/Color} A new Color instance.
   */     

  var Color = declare([dojoColor], {

    declaredClass: "esri.Color",

    toJSON: function() {
      // Alpha in JSON sent to AGS needs to be 0 - 255.
      // If clr.a is already larger than 1, use it, otherwise scale it up to 255.
      return [ this.r, this.g, this.b, (this.a > 1) ? this.a : Math.round(this.a * 255) ];
    }
  });
  
  // TODO remove
  Color.toJSON = function(clr) {
    // Alpha in JSON sent to AGS needs to be 0 - 255.
    // If clr.a is already larger than 1, use it, otherwise scale it up to 255.
    return clr && [ clr.r, clr.g, clr.b, (clr.a > 1) ? clr.a : Math.round(clr.a * 255) ];
  };

  Color.fromJSON = function(clr) {
    // Alpha for dojo color is 0 - 1.
    return clr && new Color([ clr[0], clr[1], clr[2], clr[3] / 255 ]);
  };

  Color.toUnitRGB = function(clr) {
    return [clr.r/255, clr.g/255, clr.b/255];
  };

  // Mixin static functions exposed by dojo.Color
  var i, props = [
    "named",
    "blendColors",
    "fromRgb",
    "fromHex",
    "fromArray",
    "fromString"
  ];
  
  for (i = 0; i < props.length; i++) {
    Color[ props[i] ] = dojoColor[ props[i] ];
  }

  // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#Color_keywords
  Color.named["rebeccapurple"] = [102, 51, 153];
  
  return Color;
});
