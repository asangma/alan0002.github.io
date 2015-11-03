/**
 * The result from {@link module:esri/tasks/FindTask}.
 * 
 * @since 4.0
 * @noconstructor
 * @module esri/tasks/support/FindResult
 * @see module:esri/tasks/FindTask
 * @see module:esri/tasks/support/FindParameters
 */
define(
[
  "../../core/declare",

  "../../Graphic",

  "../../core/JSONSupport"
],
function(
  declare,
  Graphic,
  JSONSupport
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/FindResult
   */
  var FindResult = declare(JSONSupport,
  /** @lends module:esri/tasks/support/FindResult.prototype */
  {

    declaredClass: "esri.tasks.FindResult",

    classMetadata: {
      reader: {
        add: [
          "feature"
        ],
        exclude: [
          "geometry",
          "attributes"
        ]
      }
    },

    /**
    * The name of the layer's primary display field. The value of this property matches the name of one of the fields of the feature.
    * @type {string}
    */
    displayFieldName: null,

    /**
    * The found feature.
    * @type {module:esri/Graphic}
    */
    feature: null,

    _featureReader: function(value, source) {
      var json = {};

      if (source.attributes) {
        json.attributes = source.attributes;
      }

      if (source.geometry) {
        json.geometry = source.geometry;
      }

      return Graphic.fromJSON(json);
    },

    /**
    * The name of the field that contains the search text.
    * @type {string}
    */
    foundFieldName: null,

    /**
    * Unique ID of the layer that contains the feature.
    * @type {number}
    */
    layerId: null,

    /**
    * The layer name that contains the feature.
    * @type {string}
    */  
    layerName: null

  });

  return FindResult;
});
