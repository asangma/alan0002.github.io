/**
 * A data object containing a linear distance.
 *
 * @module esri/tasks/support/LinearUnit
 * @since 4.0
 */
define(
[
  "../../core/declare",

  "../../core/JSONSupport"
],
function(
  declare,
  JSONSupport
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/LinearUnit
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var LinearUnit= declare(JSONSupport,
  /** @lends module:esri/tasks/support/LinearUnit.prototype */
  {

    declaredClass: "esri.tasks.LinearUnit",
    
    /**
    * Specifies the value of the linear distance.
    * @type {number}
    * @default 0
    */
    distance: 0,

    /**
    * Specifies the unit type of the linear distance, such as "esriMeters", "esriMiles", "esriKilometers", etc.
    * @type {string}
    */  
    units: null,

    toJSON: function() {
      var json = {};
      if (this.distance) {
        json.distance = this.distance;
      }
      if (this.units) {
        json.units = this.units;
      }
      return json;
    }

  });

  return LinearUnit;
});
