/**
 * The results from {@link module:esri/tasks/ImageServiceIdentifyTask}.
 *
 * @module esri/tasks/support/ImageServiceIdentifyResult
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/ImageServiceIdentifyTask
 * @see module:esri/tasks/support/ImageServiceIdentifyParameters
 */
define(
[
  "../../core/declare",

  "../../core/JSONSupport",

  "../../geometry/support/jsonUtils",

  "./FeatureSet"
],
function(
  declare,
  JSONSupport,
  jsonUtils,
  FeatureSet
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/ImageServiceIdentifyResult
   */
  var ImageServiceIdentifyResult = declare(JSONSupport,
  /** @lends module:esri/tasks/support/ImageServiceIdentifyResult.prototype */
  {

    declaredClass: "esri.tasks.ImageServiceIdentifyResult",

    /**
    * The set of visible areas for the identified catalog items. 
    * `CatalogItemVisibilities` are returned only when the image 
    * service source is a mosaic dataset.
    * 
    * @type {number[]}
    */ 
    catalogItemVisibilities: null,

    /**
    * The set of catalog items that overlap the input geometry. Catalog 
    * Items are returned only when the image service source is a mosaic dataset.
    * 
    * @type {module:esri/tasks/support/FeatureSet}
    */   
    catalogItems: null,

    _catalogItemsReader: function(value) {
      return value && FeatureSet.fromJSON(value);
    },
      
    /**
    * The identified location.
    * 
    * @type {module:esri/geometry/Point}
    */   
    location: null,

    _locationReader: function(value) {
      return value && jsonUtils.fromJSON(value);
    },

    /**
    * The identify property name.
    * 
    * @type {string}
    */  
    name: null,
      
    /**
    * The identify property id.
    * 
    * @type {number}
    */   
    objectId: null,

    /**
    * The attributes of the identified object.
    * 
    * @type {Object}
    */  
    properties: null,

    /**
    * The identify property pixel value.
    * 
    * @type {string}
    */  
    value: null

  });

  return ImageServiceIdentifyResult;
});
