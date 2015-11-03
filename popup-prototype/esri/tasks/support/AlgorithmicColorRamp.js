/**
 * Create an algorithmic color ramp to define the range of colors used in the renderer generated 
 * by the {@link module:esri/tasks/GenerateRendererTask|GenerateRendererTask}. The algorithmic 
 * color ramp is defined by specifying two colors and the algorithm used to traverse the 
 * intervening color spaces. 
 * 
 * There are three algorithms that can be used to define the color values between the from and to colors: 'cie-lab', 'hsv', and 'lab-lch'. 
 * There is very little difference between these algorithms when the from and the to colors are of the same or very similar hues. However,
 * when the hues for the from and to colors are different (Hue is different by 40 or more on a 0-360 scale), the algorithms produce different
 * results. The 'hsv' algorithim traverses the hue difference in a purely linear fashion, resulting in a bright ramp where all intermediate colors
 * are represented. For instance, a ramp from red to green would include orange, yellow, and yellow-green. The 'cie-lab' and 'lab-lch' produce a
 * more blended result. Thus, a ramp from dark green to orange would not contain a bright yellow, but instead a more brown and green-gold or 
 * green-brown intermediate color. The advantage of the 'cie-lab' algorithm is that the colors of the ramp are visually equidistant, 
 * which can produce a better ramp. 
 * 
 * @since 4.0
 * @module esri/tasks/support/AlgorithmicColorRamp
 */
define(
[
  "../../core/declare",

  "../../Color",
  "./ColorRamp"
],
function(
  declare,
  Color, ColorRamp
) {

  /**
   * @extends module:esri/tasks/support/ColorRamp
   * @constructor module:esri/tasks/support/AlgorithmicColorRamp
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var AlgorithmicColorRamp = declare(ColorRamp,
  /** @lends module:esri/tasks/support/AlgorithmicColorRamp.prototype */
  {

    declaredClass: "esri.tasks.AlgorithmicColorRamp",
    
    /**
    * The algorithm used to generate the colors between the `fromColor` and `toColor`. Each algorithm uses different methods for 
    * generating the intervening colors.
    * 
    * Possible Value | Description
    * ---------------|------------
    * cie-lab | Blends the from and to colors without traversing the intervening hue space.
    * lab-lch | The hue, saturation, value (hsv) algorithm is a linear traverse of colors between pairs: Color 1 H to Color 2 H, Color 1 S to Color 2 S, and Color 1 V to Color 2 V.
    * hsv | The lab-lch algorithm is very similar to the cie-lab but does not seek the shortest path between colors.
    * @type {string}
    */
    algorithm: null,

    /**
    * The first color in the color ramp.
    * 
    * @type {module:esri/Color}
    */  
    fromColor: null,

    _fromColorSetter: function(value) {
      return new Color(value);
    },

    /**
    * The last color in the color ramp.
    * 
    * @type {module:esri/Color}
    */  
    toColor: null,

    _toColorSetter: function(value) {
      return new Color(value);
    },

    /**
    * A string value representing the color ramp type. This value is always `algorithmic`.
    * 
    * @type {string}
    */   
    type: "algorithmic",

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    /**
     * Returns an easily serializable object representation of an algorithmic color ramp.
     * @returns {Object} An object representation of an algorithmic color ramp.
     * @private
     */
    toJSON: function() {
      var algorithm;
      switch (this.algorithm.toLowerCase()) {
      case "cie-lab":
        algorithm = "esriCIELabAlgorithm";
        break;
      case "hsv":
        algorithm = "esriHSVAlgorithm";
        break;
      case "lab-lch":
        algorithm = "esriLabLChAlgorithm";
        break;
      default:
      }
      var json = {type: "algorithmic", algorithm: algorithm};
      /*json.fromColor = [];
      json.fromColor.push(this.fromColor.r);
      json.fromColor.push(this.fromColor.g);
      json.fromColor.push(this.fromColor.b);
      json.fromColor.push(this.fromColor.a);
      json.toColor = [];
      json.toColor.push(this.toColor.r);
      json.toColor.push(this.toColor.g);
      json.toColor.push(this.toColor.b);
      json.toColor.push(this.toColor.a);*/
      json.fromColor = Color.toJSON(this.fromColor);
      json.toColor = Color.toJSON(this.toColor);
      return json;
    }

  });

  return AlgorithmicColorRamp;
});
