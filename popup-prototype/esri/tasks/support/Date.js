/**
 * Date object used in geoprocessing.
 * 
 * @module esri/tasks/support/Date
 * @since 4.0
 * @see module:esri/tasks/Geoprocessor
 */
define(
[
  "../../core/declare",
  "dojo/date/locale",

  "../../core/JSONSupport"
],
function(
  declare, localeDate,
  JSONSupport
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/Date
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */       
  var GPDate = declare(JSONSupport, 
  /** @lends module:esri/tasks/support/Date.prototype */                     
  {

    declaredClass: "esri.tasks.Date",
  
    /**
    * Date value returned from server.
    * 
    * @type {Date}
    */  
    date: new Date(),

    /**
    * The format of the date used in the date property. 
    * 
    * @type {string}
    * @default
    * @example 
    * var today = new Date();
    * today.format = "EEE MMM dd HH:mm:ss zzz yyyy"; 
    * //Prints the date in this format: "Wed Oct 07 2015 14:11:52 GMT-0700 (PDT)"
    * console.log(today.date);
    */  
    format: "EEE MMM dd HH:mm:ss zzz yyyy",

    _dateReader: function(value, source) {
      return localeDate.parse(value, {
        selector: "date",
        datePattern: source.format || this.format
      });
    },

    toJSON: function() {
      return {
        date: localeDate.format(this.date, {
          selector: "date",
          datePattern: this.format
        }),
        format: this.format
      };
    }

  });

  return GPDate;
});
