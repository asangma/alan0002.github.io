/**
 * The StatisticDefinition class defines the type of statistics, the field used to calculate the
 * statistics and the resulting output field name. Used to specify an array of statistic
 * definitions for a query's `outStatistics` property. Requires ArcGIS Server service version 10.1
 * or greater.
 *
 * @module esri/tasks/support/StatisticDefinition
 * @since 4.0
 * @see {@link module:esri/tasks/support/Query#outStatistics Query.outStatistics}
 */
define(
[
  "../../core/declare",

  "../../core/Accessor"
],
function(
  declare,
  Accessor
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/StatisticDefinition
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var StatisticDefinition = declare(Accessor,
  /** @lends module:esri/tasks/support/StatisticDefinition.prototype */
  {

    declaredClass: "esri.tasks.StatisticDefinition",
      
    /**
    * Defines the field for which statistics will be calculated.
    * @type {string}
    */
    onStatisticField: null,
      
    /**
    * Specifies the output field name. Output field names can only contain alpha-numeric characters and an underscore. If no output
    * field name is specified, the map server assigns a field name to the returned statistic field.
    * @type {string}
    */  
    outStatisticFieldName: null,
      
    /**
    * Defines the type of statistic.
    * 
    * **Known values:** count | sum | min | max | avg | stddev
    * @type {string}
    */   
    statisticType: null,

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      return {
        statisticType:         this.statisticType, 
        onStatisticField:      this.onStatisticField,
        outStatisticFieldName: this.outStatisticFieldName,
        
        // Properties applicable to type = exceedslimit
        // Supported by Hosted FS at the moment
        maxPointCount: this.maxPointCount,
        maxRecordCount: this.maxRecordCount,
        maxVertexCount: this.maxVertexCount
      };
    }

  });

  return StatisticDefinition;  
});
