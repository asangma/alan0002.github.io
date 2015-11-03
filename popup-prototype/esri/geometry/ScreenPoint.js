/**
 * ScreenPoint represents a point in terms of pixels relative to the top-left corner of the
 * view.
 *
 * @module esri/geometry/ScreenPoint
 * @since 4.0
 * @see module:esri/geometry/Point
 */
define(
[
  "../core/declare",
  "./Point"
],
function(declare, Point) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/geometry/ScreenPoint
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor. 
   */
  var ScreenPoint = declare(Point,
  /** @lends module:esri/geometry/ScreenPoint.prototype */
  {
    declaredClass: "esri.geometry.ScreenPoint",
    
    verifySR: function() {
      // Do Nothing
    }
    
    /**
    * X-coordinate in pixels relative to the top-left corner of the view.
    *
    * @name x
    * @instance
    * @type {number}
    */
      
    /**
    * Y-coordinate in pixels relative to the top-left corner of the view.
    *
    * @name y
    * @instance
    * @type {number}
    */    
      
  });

  

  return ScreenPoint;  
});
