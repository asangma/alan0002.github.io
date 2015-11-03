/**
 * Represents an address and its location.
 * 
 * @module esri/tasks/support/AddressCandidate
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/Locator
 */
define(
[
  "../../core/declare",

  "../../core/JSONSupport",

  "../../geometry/Point"
],
function(
  declare,
  JSONSupport,
  Point
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/AddressCandidate
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var AddressCandidate = declare(JSONSupport, 
  /** @lends module:esri/tasks/support/AddressCandidate.prototype */                               
  {

      declaredClass: "esri.tasks.AddressCandidate",

      /**
      * Address of the candidate. It contains one property for each of the address fields defined by 
      * a geocode service. Each address field describes some part of the address information for the candidate.
      * 
      * @type {Object}
      */ 
      address: null,

      /**
      * Name value pairs of field name and field value as defined in `outFields` 
      * in {@link module:esri/tasks/Locator#addressToLocations Locator.addressToLocations()}.
      * 
      * @type {Object}
      */
      attributes: null,

      /**
      * X and Y coordinate of the candidate.
      * 
      * @type {Object}
      */
      location: null,

      _locationReader: function(value) {
        return value && Point.fromJSON(value);
      },

      /**
      * Numeric score between `0` and `100` for geocode candidates. A candidate with a score 
      * of `100` means a perfect match, and `0` means no match.
      * 
      * @type {number}
      */
      score: null

    }
  );

  return AddressCandidate;
});
