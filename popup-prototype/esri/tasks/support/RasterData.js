/**
 * A geoprocessing data object containing a raster data source.
 *
 * @module esri/tasks/support/RasterData
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
   * @constructor module:esri/tasks/support/RasterData
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var RasterData = declare(JSONSupport,
  /** @lends module:esri/tasks/support/RasterData.prototype */
  {

    declaredClass: "esri.tasks.RasterData",

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
    * Specifies the format of the raster data, such as "jpg", "tif", etc.
    * @type {string}
    */
    format: null,

    /**
    * The ID of the uploaded file returned as a result of the upload operation. For ArcGIS Server 10.1 and greater,
    * this class can be used to specify an uploaded item as input by specifying the ItemID.
    * @type {string}
    */  
    itemId: null,

    _itemIdReader: function(value, source) {
      return source.itemId;
    },

    /**
    * URL to the location of the raster data file.
    * @type {string}
    */  
    url: null,

    toJSON: function() {
      var json = {};
      if (this.url) {
        json.url = this.url;
      }
      if (this.format) {
        json.format = this.format;
      }
      if (this.itemId) {
        json.itemID = this.itemId;
      }
      return json;
    }

  });

  return RasterData;
});
