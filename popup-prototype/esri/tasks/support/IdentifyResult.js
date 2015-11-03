/**
 * The result from {@link module:esri/tasks/IdentifyTask}. 
 * 
 * @since 4.0
 * @noconstructor
 * @module esri/tasks/support/IdentifyResult
 * @see module:esri/tasks/IdentifyTask
 * @see module:esri/tasks/support/IdentifyParameters
 * @see [Identify - ArcGIS Server REST API](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r300000113000000)
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
   * @constructor module:esri/tasks/support/IdentifyResult
   */
  var IdentifyResult= declare(JSONSupport,
  /** @lends module:esri/tasks/support/IdentifyResult.prototype */
  {

    declaredClass: "esri.tasks.IdentifyResult",

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
    * The name of the layer's primary display field. The value of this property matches 
    * the name of one of the fields of the feature.
    * 
    * @type {string}
    */
    displayFieldName: null,

    /**
    * An identified feature from the map service.
    * 
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
    * Unique ID of the layer that contains the feature.
    * 
    * @type {number}
    */    
    layerId: null,

    /**
    * The layer name that contains the feature.
    * 
    * @type {string}
    */   
    layerName: null

  });

  return IdentifyResult;
});
