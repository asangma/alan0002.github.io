/**
 * A collection of features returned from ArcGIS Server or used as input to tasks. Each 
 * feature in the FeatureSet may contain geometry, attributes, and symbology. If the FeatureSet
 * does not contain geometry, and only contains attributes, the FeatureSet can be treated as a 
 * table where each feature is a row object. Tasks that return FeatureSet include {@link module:esri/tasks/QueryTask QueryTask}.
 * 
 * @module esri/tasks/support/FeatureSet
 * @since 4.0
 * @see module:esri/tasks/QueryTask
 */
define(
[
  "../../core/JSONSupport",
  "../../core/lang",

  "../../Graphic",

  "../../geometry/SpatialReference",

  "../../geometry/support/graphicsUtils",
  "../../geometry/support/jsonUtils",

  "../../symbols/support/jsonUtils"
],
function(
  JSONSupport, esriLang,
  Graphic,
  SpatialReference,
  graphicsUtils, geomJsonUtils,
  symJsonUtils
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/FeatureSet
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */      
  var FeatureSet = JSONSupport.createSubclass(
  /** @lends module:esri/tasks/support/FeatureSet.prototype */
  {

    declaredClass: "esri.tasks.FeatureSet",

    classMetadata: {
      reader: {
        exclude: [
          "transform"
        ]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  displayFieldName
    //----------------------------------

    /**
    * The name of the layer's primary display field. The value of this property matches the name of one of the fields of
    * the feature. This is only applicable when the FeatureSet is returned from a task. It is ignored when the FeatureSet
    * is used as input to a geoprocessing task.
    *
    * @type {string}
    */
    displayFieldName: null,

    //----------------------------------
    //  exceededTransferLimit
    //----------------------------------

    /**
    * Typically, a layer has a limit on the number of features (i.e., records) returned by the query operation (such as
    * the {@link module:esri/layers/FeatureLayer#maxRecordCount FeatureLayer.maxRecordCount property). If `maxRecordCount`
    * is configured for a layer, `exceededTransferLimit` will be `true` if a query matches more than the `maxRecordCount`
    * features. It will be `false` otherwise. Supported by ArcGIS Server version 10.1 and later.
    *
    * @type {boolean}
    */
    exceededTransferLimit: null,

    //----------------------------------
    //  features
    //----------------------------------

    /**
    * The array of graphics returned from a task.
    *
    * @type {module:esri/Graphic[]}
    */
    features: [],

    _featuresReader: function(value, source) {
      var sr = SpatialReference.fromJSON(source.spatialReference),
          features;

      features = value.map(
        function featureReader(json) {
          var graphic = Graphic.fromJSON(json),
              hasSR   = json.geometry && json.geometry.spatialReference;

          if (graphic.geometry && !hasSR) {
            graphic.geometry.spatialReference = sr;
          }

          return graphic;
        }
      );

      if (source.transform) {
        this._hydrate(source.transform, source.geometryType, features);
      }

      return features;
    },

    //----------------------------------
    //  fieldAliases
    //----------------------------------

    /**
    * Set of name-value pairs for the attribute's field and alias names.
    *
    * @type {Object}
    */
    fieldAliases: null,

    //----------------------------------
    //  geometryType
    //----------------------------------

    /**
    * The geometry type of the FeatureSet.
    *
    * @type {string}
    */
    geometryType: null,

    //----------------------------------
    //  spatialReference
    //----------------------------------

    /**
    * When a FeatureSet is used as input to Geoprocessor, the spatial reference is set to the map's spatial reference by default. 
    * This value can be changed. When a FeatureSet is returned from a task, the value is the result as returned from the server.
    * 
    * @type {module:esri/geometry/SpatialReference}
    */  
    spatialReference: null,

    _spatialReferenceReader: function(value) {
      return SpatialReference.fromJSON(value);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function(normalized) {
      var json = {
        hasZ: this.hasZ,
        hasM: this.hasM
      };

      if (this.displayFieldName) {
        json.displayFieldName = this.displayFieldName;
      }
      // if (this.geometryType) {
      //   json.geometryType = this.geometryType;
      // }
      if (this.fields) {
        json.fields = this.fields;
      }

      if (this.spatialReference) {
        json.spatialReference = this.spatialReference.toJSON();
      }
      else if (this.features[0] && this.features[0].geometry) {
        json.spatialReference = this.features[0].geometry.spatialReference.toJSON();
      }

      // var fjson, gjson, jfeatures = (json.features = []), features = this.features;
      // for (var i=0, il=features.length; i<il; i++) {
      //   fjson = features[i].toJSON();
      //   gjson = {};
      //   if (fjson.geometry) {
      //     gjson.geometry = fjson.geometry;
      //   }
      //   if (fjson.attributes) {
      //     gjson.attributes = fjson.attributes;
      //   }
      //   jfeatures.push(gjson);
      // }

      if (this.features[0]) {
        // TODO
        // What if the first feature did not have a geometry?
        // FIX THIS!
        if (this.features[0].geometry) {
          json.geometryType = geomJsonUtils.getJsonType(this.features[0].geometry);
        }
        json.features = graphicsUtils._encodeGraphics(this.features, normalized);
      }

      json.exceededTransferLimit = this.exceededTransferLimit;

      json.transform = this.transform;

      // coordinates are hydrated in FeatureSet.constructor
      // So transform is always null in 3.x
      // TODO 4.0
      // json.transform = lang.clone(this.transform);

      return esriLang.fixJson(json);
    },

    quantize: function(transform) {
     var tx = transform.translate[0], ty = transform.translate[1],
         sx = transform.scale[0], sy = transform.scale[1],

         toScrX = function(x) { return Math.round((x - tx) / sx); },
         toScrY = function(y) { return Math.round((ty - y) / sy); },

         features = this.features,

         pointsQuantizationFn = function(points, toScrX, toScrY) {
           var k, l, pt,
               prevX, prevY, x, y,
               result = [];
           for (k = 0, l = points.length; k < l; k++) {
             pt = points[k];
             if (k > 0) {
               x = toScrX(pt[0]);
               y = toScrY(pt[1]);
               if (x !== prevX || y !== prevY) {
                 result.push([x - prevX, y - prevY]);
                 prevX = x;
                 prevY = y;
               }
             }
             else {
               prevX = toScrX(pt[0]);
               prevY = toScrY(pt[1]);
               result.push([prevX, prevY]);
             }
           }
           if (result.length > 0) {
             return result;
           }
           return null;
         },

         quantizationFn = (
           function(geomType, toScrX, toScrY) {
             if (geomType === "esriGeometryPoint") {
               return function(geom) {
                 geom.x = toScrX(geom.x);
                 geom.y = toScrY(geom.y);
                 return geom;
               };
             }
             if (geomType === "esriGeometryPolyline" || geomType === "esriGeometryPolygon") {
               return function(geom) {
                 var j, m,
                     rings, ring, newRing, newRings;

                 rings = geom.rings || geom.paths;
                 newRings = [];
                 for (j = 0, m = rings.length; j < m; j++) {
                   ring = rings[j];
                   newRing = pointsQuantizationFn(ring, toScrX, toScrY);
                   if (newRing) {
                     newRings.push(newRing);
                   }
                 }
                 if (newRings.length > 0) {
                   if (geom.rings) {
                     geom.rings = newRings;
                   }
                   else {
                     geom.paths = newRings;
                   }
                   return geom;
                 }
                 return null;
               };
             }
             if (geomType === "esriGeometryMultipoint") {
               // envelopes can be quantized
               return function(geom) {
                 var newPoints;
                 newPoints = pointsQuantizationFn(geom.points, toScrX, toScrY);
                 if (newPoints.length > 0) {
                   geom.points = newPoints;
                   return geom;
                 }
                 return null;
               };
             }
             if (geomType === "esriGeometryEnvelope") {
               // envelopes can be quantized
               return function(geom) {
                 return geom;
               };
             }
           }(this.geometryType, toScrX, toScrY)
         ),

         i, n;

     for (i = 0, n = features.length; i < n; i++) {
       if (!quantizationFn(features[i].geometry)) {
         features.splice(i, 1);
         i--; n--;
       }
     }

     this.transform = transform;
     return this;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Function that transform quantized coordinates to map coordinates
     * @private
     */
    _hydrate: function(transform, geometryType, features) {
      if (!transform) {
        return;
      }

      var i, n;

      var tx = transform.translate[0],
          ty = transform.translate[1],
          sx = transform.scale[0],
          sy = transform.scale[1];

      var toMapX = function(x) { return x  * sx + tx; },
          toMapY = function(y) { return ty - y * sy; },

          hydrationFn = (
            function(geomType, toMapX, toMapY) {
              if (geomType === "esriGeometryPoint") {
                return function(geom) {
                  geom.x = toMapX(geom.x);
                  geom.y = toMapY(geom.y);
                };
              }
              if (geomType === "esriGeometryPolyline" || geomType === "esriGeometryPolygon") {
                return function(geom) {
                  var rings = geom.rings || geom.paths,
                      j, m, k, l,
                      ring, pt,
                      prevX, prevY;
                  for (j = 0, m = rings.length; j < m; j++) {
                    ring = rings[j];
                    for (k = 0, l = ring.length; k < l; k++) {
                      pt = ring[k];
                      if (k > 0) {
                        prevX = prevX + pt[0];
                        prevY = prevY + pt[1];
                      }
                      else {
                        prevX = pt[0];
                        prevY = pt[1];
                      }
                      pt[0] = toMapX(prevX);
                      pt[1] = toMapY(prevY);
                    }
                  }
                };
              }
              if (geomType === "esriGeometryEnvelope") {
                return function(geom) {
                  geom.xmin = toMapX(geom.xmin);
                  geom.ymin = toMapY(geom.ymin);
                  geom.xmax = toMapX(geom.xmax);
                  geom.ymax = toMapY(geom.ymax);
                };
              }
              if (geomType === "esriGeometryMultipoint") {
                return function(geom) {
                  var points = geom.points,
                      k, l, pt,
                      prevX, prevY;
                  for (k = 0, l = points.length; k < l; k++) {
                    pt = points[k];
                    if (k > 0) {
                      prevX = prevX + pt[0];
                      prevY = prevY + pt[1];
                    }
                    else {
                      prevX = pt[0];
                      prevY = pt[1];
                    }
                    pt[0] = toMapX(prevX);
                    pt[1] = toMapY(prevY);
                  }
                };
              }
            }(geometryType, toMapX, toMapY)
          );

      for (i = 0, n = features.length; i < n; i++) {
        if (features[i].geometry) {
          hydrationFn(features[i].geometry);
        }
      }
    }

  });

  return FeatureSet;
});
