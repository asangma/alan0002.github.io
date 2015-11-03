/**
 * A geoprocessing data object containing a data source.
 * 
 * @module esri/tasks/support/DataFile
 * @since 4.0
 * @see module:esri/tasks/Geoprocessor
 * 
 * @example
 * require([
 *  "esri/tasks/Geoprocessor", "esri/tasks/support/DataFile", ... 
 * ], function(Geoprocessor, DataFile, ... ) {
 * var gp = new Geoprocessor( ... );
 *  function requestSucceeded(result) {
 *    var itemID = result.item.itemID;
 *    var dataFile = new DataFile();
 *    dataFile.itemID = itemID;
 *    var params = {
 *      "Input_File": dataFile
 *    };
 *    gp.execute(params).then(function(gpResult){
 *      ...
 *    });
 *  }
 * });
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
   * @constructor module:esri/tasks/support/DataFile
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */      
  var DataFile = declare(JSONSupport, 
  /** @lends module:esri/tasks/support/DataFile.prototype */                       
  {

    declaredClass: "esri.tasks.DataFile",

    classMetadata: {
      reader: {
        add: [
          "itemId"
        ],
        exclude: [
          "itemID"
        ]
      }
    },

    /**
    * The ID of the uploaded file returned as a result of the upload operation. 
    * For ArcGIS Server 10.1 and greater services that support uploads, this class 
    * can be used to specify an uploaded item as input by specifying the ItemID.
    * 
    * @type {string}
    */   
    itemId: null,

    _itemIdReader: function(value, source) {
      return source.itemId;
    },

    /**
    * URL to the location of the data file.
    * 
    * @type {string}
    */   
    url: null,

    toJSON: function() {
      var json = {};
      if (this.url) {
        json.url = this.url;
      }
      if (this.itemId) {
        json.itemID = this.itemId;
      }
      return json;
    }

  });

  return DataFile;
});
