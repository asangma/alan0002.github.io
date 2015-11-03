/**
 * Represents a geometry service resource exposed by the ArcGIS REST API. It is used to 
 * perform various operations on geometries such as project, simplify, buffer, and relationships. 
 * 
 * It is recommended that you create a geometry service for use within your applications. View the 
 * [Geometry Services](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000qs000000) 
 * help topic in the Server Resource Center for details on creating and publishing a geometry service. Esri hosts 
 * a geometry service on [sampleserver6](http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer) 
 * to support samples published in the Resource Center. You are welcome to use this service for development and testing purposes. 
 * Esri also hosts a geometry service on [tasks.arcgisonline.com](http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer); 
 * this service can be used for production applications. However, we do not guarantee that the service will be available 24/7.
 * 
 * Many of the functions in GeometryService are available for use client-side using {@link module:esri/geometry/geometryEngine GeometryEngine}.
 * See {@link module:esri/geometry/geometryEngine GeometryEngine} for more details.
 * 
 * @since 4.0
 * @module esri/tasks/GeometryService
 * @see {@link module:esri/geometry/geometryEngine GeometryEngine}
 */
define(
[
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "./Task",
  
  "../geometry/Extent",
  "../geometry/support/jsonUtils",
  "../geometry/Multipoint",
  "../geometry/Polyline",
  "../geometry/Polygon"
],
function(
  array, declare, lang, esriRequest,
  Task,
  Extent, jsonUtils, Multipoint, Polyline, Polygon
) {

/**
 * @extends module:esri/tasks/Task
 * @constructor module:esri/tasks/GeometryService
 * @param {Object} properties - See the [properties](#properties) for a list of all the properties
 *                              that may be passed into the constructor.
 */
var GeometryService = declare(Task, 
/** @lends module:esri/tasks/GeometryService.prototype */
{
    declaredClass: "esri.tasks.GeometryService",

    /**
    * The ArcGIS Server REST service URL of a GeometryService. Esri hosts 
    * a geometry service on [sampleserver6](http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer) 
    * for development and testing purposes. Esri also hosts a geometry service on 
    * [tasks.arcgisonline.com](http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer) 
    * that can be used for production applications.
    * 
    * @name url
    * @instance
    * @type {string}
    */
    
    _encodeGeometries: function(geometries) {
      var gs = [], i, il = geometries.length;
      
      for (i = 0; i < il; i++) {
        gs.push(geometries[i].toJSON());
      }
      
      return { geometryType: jsonUtils.getJsonType(geometries[0]), geometries: gs };      
    },

    _decodeGeometries: function(response, geometryType, sr) {
      var Geometry = jsonUtils.getGeometryType(geometryType),          
          geometries = response.geometries,
          fs = [],
          srJson = { spatialReference: sr.toJSON() },
          mixin = lang.mixin;

      array.forEach(geometries, function(g, i) {
        fs[i] = new Geometry(mixin(g, srJson));
      });

      return fs;
    },
    
    _toProjectGeometry: function(geometry) {
      var sr = geometry.spatialReference.toJSON();
      if (geometry instanceof Extent) {
        return new Polygon({ rings:[[[geometry.xmin, geometry.ymin], [geometry.xmin, geometry.ymax], [geometry.xmax, geometry.ymax], [geometry.xmax, geometry.ymin], [geometry.xmin, geometry.ymin]]], spatialReference:sr });
      }
      else {
        return new Polyline({ paths:[[].concat(geometry.points)], spatialReference:sr });
      }
    },
    
    _fromProjectedGeometry: function(geometry, geometryType, outSR) {
      if (geometryType === "esriGeometryEnvelope") {
        var ring = geometry.rings[0];
        return new Extent(ring[0][0], ring[0][1], ring[2][0], ring[2][1], outSR);
      }
      else {
        return new Multipoint({ points:geometry.paths[0], spatialReference: outSR.toJSON() });
      }
    },

    /**
    * Projects a set of geometries to a new spatial reference.
    *
    * @param {module:esri/tasks/support/ProjectParameters} params - The input projection parameters.
    *
    * @example
    * require([
    *   "esri/tasks/GeometryService",
    *   "esri/tasks/support/ProjectParameters", ...
    *   ], function(GeometryService, ProjectParameters, ... ) {
    *     var gvsc = new GeometryService( ... );
    *     var params = new ProjectParameters();
    *     params.geometries = [point];
    *     params.outSR = outSR;
    *     params.transformation = transformation;
    *     gsvc.project(params).then( ... );
    *     ...
    * });
    *
    * @return {Promise} When resolved, returns an array of projected {@link module:esri/geometry/Geometry geometries}.
    */
    project: function(/*esri.geometry.Geometry[]*/ geometries, /*esri.SpatialReference*/ outSR) {
      //summary: Project argument graphic feature geometries to argument out spatial reference
      // geometries: esri.geometry.Geometry[]: geometries to be projected
      // outSR: Number: Spatial reference well known ID to project geometries to
      
      //10.1 adds 2 new params, transformation and transformForward
      //new signature is function(/*object*/ params)
      //the old signature still works
      var params = lang.mixin({}, this.parsedUrl.query, {f: "json"}),
          geometry;
      if (!geometries.geometries) {
        geometry = geometries[0];
        params = lang.mixin(params,
                   {
                     outSR: outSR.wkid || JSON.stringify(outSR.toJSON()),
                     inSR: geometry.spatialReference.wkid || JSON.stringify(geometry.spatialReference.toJSON()),
                     geometries: JSON.stringify(this._encodeGeometries(geometries))
                   });
      }
      else {
        outSR = geometries.outSR;
        geometry = geometries.geometries[0];
        params = lang.mixin(params, geometries.toJSON());
      }

      var geometryType = jsonUtils.getJsonType(geometry);
      var decodeGeometries = this._decodeGeometries;

      return esriRequest({
        url: this.parsedUrl.path + "/project",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          return decodeGeometries(response, geometryType, outSR);
        });
    },

    /**
    * Alters the given geometries to make their definitions topologically legal with respect to their geometry type. 
    *
    * @param {module:esri/geometry/Geometry[]} geometries - The geometries to simplify.
    *
    * @see {@link module:esri/geometry/geometryEngine#simplify geometryEngine.simplify()}
    * @see {@link module:esri/geometry/geometryEngineAsync#simplify geometryEngineAsync.simplify()}
    *
    * @example
    * geometryService.simplify([polygonGraphic.geometry]).then( ... );
    *
    * @return {Promise} When resolved, returns an array of the simplified {@link module:esri/geometry/Geometry geometries}.
    */
    simplify: function(/*esri.geometry.Geometry[]*/ geometries) {
      //summary: Simplify argument graphic feature geometries
      // geometries: esri.geometry.Geometry[]: geometries to be simplified
      var outSR = geometries[0].spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:outSR.wkid ? outSR.wkid : JSON.stringify(outSR.toJSON()),
                                geometries: JSON.stringify(this._encodeGeometries(geometries))
                              }
                              ),
          geometryType = jsonUtils.getJsonType(geometries[0]),
          decodeGeometries = this._decodeGeometries;

      return esriRequest({
        url: this.parsedUrl.path + "/simplify",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          return decodeGeometries(response, geometryType, outSR);
        });
    },


    /**
    * The convexHull operation is performed on a geometry service resource. It returns the convex hull 
    * of the input geometry. The input geometry can be a point, multipoint, polyline or polygon. The 
    * hull is typically a polygon but can also be a polyline or point in degenerate cases.
    *
    * @param {module:esri/geometry/Geometry[]} geometries - The geometries whose convex hull is to be created.
    *
    * @see {@link module:esri/geometry/geometryEngine#convexHull geometryEngine.convexHull()}
    * @see {@link module:esri/geometry/geometryEngineAsync#convexHull geometryEngineAsync.convexHull()}
    * 
    * @returns {Promise} When resolved, returns a {@link module:esri/geometry/Geometry Geometry} representing the convex hull of the input.
    */
    convexHull: function(/*esri.geometry.Geometry[]*/ geometries) {
      //summary: Create a convex hull from input graphic feature geometries
      // geometries: esri.geometry.Geometry[]: geometries to be used to compute covex hull
      var outSR = geometries[0].spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                geometries: JSON.stringify(this._encodeGeometries(geometries))
                              }
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/convexHull",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          return jsonUtils.fromJSON(response.geometry).set("spatialReference", outSR);
        });
    },

    /**
    * The union operation is performed on a geometry service resource. This operation constructs the set-theoretic
    * union of the geometries in the input array. All inputs must be of the same type. 
    *
    * @param {module:esri/geometry/Geometry[]} geometries - An array of the geometries to be unioned.
    *
    * @see {@link module:esri/geometry/geometryEngine#union geometryEngine.union()}
    * @see {@link module:esri/geometry/geometryEngineAsync#union geometryEngineAsync.union()}
    *
    * @return {Promise} When resolved, returns a {@link module:esri/geometry/Geometry Geometry} representing the union of the input freatures.
    */
    union: function(/*esri.geometry.Geometry[]*/ geometries) {
      //summary: Constructs the set theoretic union from input geometries
      // geometries: esri.geometry.Geometry[]: geometries to be unioned
      var outSR = geometries[0].spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                geometries: JSON.stringify(this._encodeGeometries(geometries))
                              }
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/union",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          return jsonUtils.fromJSON(response.geometry).set("spatialReference", outSR);
        });
    },

    /**
    * The Auto Complete operation is performed on a geometry service resource. The AutoComplete operation 
    * simplifies the process of constructing new polygons that are adjacent to other polygons. It constructs 
    * polygons that fill in the gaps between existing polygons and a set of polylines.
    *
    * @param {module:esri/geometry/Polygon[]}  polygons  - The array of polygons that will provide boundaries for new polygons.
    * @param {module:esri/geometry/Polyline[]} polylines - An array of polylines that will provide the remaining boundaries for new polygons.
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Polygon Polygon} geometries containing polygons with the 
    *                   gaps filled with a set of polylines.
    */
    autoComplete: function(/*esri.geometry.Geometry[]*/ polygons, /*esri.geometry.Geometry[]*/ polylines) {
      //summary: Creates new polygons based on input polygons and input polylines
      // polygons: esri.geometry.Geometry[]: polygon features that have boundaries that are to be used when constructing new polygon
      // polylines: esri.geometry.Geometry[]: polyline features that should be used when constructing new polygons
      var outSR = polygons[0].spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                polygons: JSON.stringify(this._encodeGeometries(polygons).geometries),
                                polylines: JSON.stringify(this._encodeGeometries(polylines).geometries)
                              }
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/autoComplete",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geometry) {
            return new Polygon({
              spatialReference: outSR,
              rings: geometry.rings
            });
          });
        });
    },

    /**
     * The reshape operation is performed on a geometry service resource. It reshapes a {@link module:esri/geometry/Polyline Polyline} or a part 
     * of a {@link module:esri/geometry/Polygon Polygon} using a reshaping line.
     * 
     * @param   {module:esri/geometry/Geometry} targetGeometry - The Polyline or Polygon to be reshaped.
     * @param   {module:esri/geometry/Geometry} reshaper - The single-part polyline that performs the reshaping.
     *                                                   
     * @return {Promise} When resolved, returns the {@link module:esri/geometry/Geometry Geometry} defining the reshaped input feature.
     */
    reshape: function(/*esri.geometry.Geometry*/ geometry, /*esri.geometry.Geometry*/ reshaper) {
      //summary: reshape input geometry (polyline/polygon) with input reshaper polyline
      // geometry: esri.Graphic: target graphic (polyline or polygon) feature to be reshaped
      // reshaper: esri.Graphic: polyline that does the reshaping
      var outSR = geometry.spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                target: JSON.stringify({ geometryType:jsonUtils.getJsonType(geometry), geometry:geometry.toJSON() }),
                                reshaper: JSON.stringify(reshaper.toJSON())
                              }
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/reshape",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          return jsonUtils.fromJSON(response.geometry).set("spatialReference", outSR);
        });
    },

    /**
    * The cut operation is performed on a geometry service resource. This operation splits the 
    * input polyline or polygon where it crosses a cutting polyline.
    *
    * @param {module:esri/geometry/Geometry[]} geometries - The polylines or polygons to be cut.
    * @param {module:esri/geometry/Polyline} cutter - The polyline that will be used to divide 
    * the target into pieces where it crosses the target.
    * 
    * @see {@link module:esri/geometry/geometryEngine#cut geometryEngine.cut()}
    * @see {@link module:esri/geometry/geometryEngineAsync#cut geometryEngineAsync.cut()}
    * 
    * @return {Promise} When resolved, returns an object with the following specification:
    *
    * ```
    * {
    *   cutIndexes: <Number[]>,
    *   geometries: <Geometry[]>
    * }
    * ```
    */
    cut: function(/*esri.geometry.Geometry[] */ geometries, /*esri.Graphic*/ cutter) {
      //summary: cut input geometry (polyline/polygon) with input cutter polyline
      // geometries: esri.geometry.Geometry: geometry (polyline or polygon) feature to be cut
      // cutter: esri.geometry.Geometry: polyline that will be used to divide the target geometry into pieces
      var outSR = geometries[0].spatialReference;
      var geoms = array.map(geometries, function(geometry) {
        return geometry.toJSON();
      });
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                target: JSON.stringify({ geometryType:jsonUtils.getJsonType(geometries[0]), geometries:geoms }),
                                cutter: JSON.stringify(cutter.toJSON())
                              }
                              );

     return esriRequest({
        url: this.parsedUrl.path + "/cut",
        content: params,
        callbackParamName: "callback"
      })
       .then(function(response) {
         var geometries = response.geometries || [];

         return {
           cutIndexes: response.cutIndexes,

           geometries: geometries.map(function(geometry) {
             return jsonUtils.fromJSON(geometry).set("spatialReference", outSR);
           })
         };
       });
    },

    /**
    * The intersect operation is performed on a geometry service resource. This operation constructs 
    * the set-theoretic intersection between an array of geometries and another geometry.
    *
    * @param {module:esri/geometry/Geometry[]} geometries - An array of points, multipoints, polylines, or polygons.
    * @param {module:esri/geometry/Geometry} intersector - A single geometry of any type, of dimension equal to or greater
    * than the dimension of the items in `geometries`.
    *
    * @see {@link module:esri/geometry/geometryEngine#intersect geometryEngine.intersect()}
    * @see {@link module:esri/geometry/geometryEngineAsync#intersect geometryEngineAsync.intersect()}
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Geometry geometries} defining the intersection of the input features.
    */
    intersect: function(/*esri.geometry.Geometry[]*/ geometries, /*esri.geometry.Geometry*/ geometry) {
      //summary: constructs set-theoretic intersection between array of features and another feature
      // geometries: esri.geometry.Geometry[]: geometries to test against
      // geometry: esri.Graphic: feature of any geometry type that has a dimension of equal or greater value to features
      var outSR = geometries[0].spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                geometries: JSON.stringify(this._encodeGeometries(geometries)),
                                geometry: JSON.stringify({geometryType:jsonUtils.getJsonType(geometry), geometry:geometry.toJSON()})
                              }
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/intersect",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geom) {
            return jsonUtils.fromJSON(geom).set("spatialReference", outSR);
          });
        });
    },

    /**
    * The difference operation is performed on a geometry service resource. This operation 
    * constructs the set-theoretic difference between an array of geometries and another geometry.
    *
    * @param {module:esri/geometry/Geometry[]} geometries - An array of points, multipoints, polylines or polygons.
    * @param {module:esri/geometry/Geometry} geometry - A single geometry of any type, with a dimension 
    * equal to or greater than the items in geometries.
    * 
    * @see {@link module:esri/geometry/geometryEngine#difference geometryEngine.difference()}
    * @see {@link module:esri/geometry/geometryEngineAsync#difference geometryEngineAsync.difference()}
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Geometry geometries} defining the difference of the input features.
    */
    difference: function(/*esri.geometry.Geometry[]*/ geometries, /*esri.geometry.Geometry*/ geometry) {
      //summary: Creates new geometry based on the set-theoretic difference between the geometry inputs
      // geometries: esri.geometry.Geometry[]: Input geometries
      // geometry: esri.geometry.Geometry: Geometry whose dimension is equal to or greater than geometries dimension
      var outSR = geometries[0].spatialReference;
      var params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:JSON.stringify(outSR.toJSON()),
                                geometries: JSON.stringify(this._encodeGeometries(geometries)),
                                geometry: JSON.stringify({ geometryType:jsonUtils.getJsonType(geometry), geometry:geometry.toJSON() })
                              }
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/difference",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geom) {
            return jsonUtils.fromJSON(geom).set("spatialReference", outSR);
          });
        });
    },

    /**
    * Creates buffer polygons at a specified distance around the given geometries.
    *
    * @param {module:esri/tasks/support/BufferParameters} bufferParameters - Specifies the input geometries, 
    * buffer distances, and other options.
    *
    * @see {@link module:esri/geometry/geometryEngine#buffer geometryEngine.buffer()}
    * @see {@link module:esri/geometry/geometryEngineAsync#buffer geometryEngineAsync.buffer()}
    * @see {@link module:esri/geometry/geometryEngine#geodesicBuffer geometryEngine.geodesicBuffer()}
    * @see {@link module:esri/geometry/geometryEngineAsync#geodesicBuffer geometryEngineAsync.geodesicBuffer()}
    *
    * @return {Promise} Returns an array of {@link module:esri/geometry/Polygon Polygon} geometries representing the buffered areas of the input.
    */
    buffer: function(/*esri.tasks.BufferParameters*/ params) {
      //summary: Buffer graphic feature geometries specified in the argument params
      // params: esri.tasks.BufferParameters: Parameters to pass to server to buffer
      // callback: Function to be called once task completes
      
      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              ),
          sr = params.outSpatialReference || params.geometries[0].spatialReference;

      return esriRequest({
        url: this.parsedUrl.path + "/buffer",
        content: _params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geometry) {
            return new Polygon({
              spatialReference: sr,
              rings: geometry.rings
            });
          });
        });
    },
    
    /**
    * Computes the area and length for the input {@link module:esri/geometry/Polygon polygons}.
    *
    * @param {module:esri/tasks/support/AreasAndLengthsParameters} areasAndLengthsParameters - Specify the input polygons and optionally the linear and area units.
    *
    * @return {Promise} When resolved, returns an object with the following specification:
    *                   
    * ```
    * {
    *   areas: <Number[]>,
    *   lengths: <Number[]>                   
    * }
    * ```
    */
    areasAndLengths: function(/*esri.tasks.AreasAndLengthsParameters*/ params) {
      //summary:  geometries specified in the argument params
      // params: esri.tasks.AreaAndLengthsParameters: Parameters to pass to server
       var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/areasAndLengths",
        content: _params,
        callbackParamName: "callback"
      });
    },
    
    /**
    * Gets the lengths for a {@link module:esri/geometry/Geometry Geometry} when the geometry type is {@link module:esri/geometry/Polyline Polyline}
    *
    * @param {module:esri/tasks/support/LengthsParameters} params - Specify the polylines and optionally the length unit and the geodesic length option.
    *
    * @return {Promise} When resolved, returns an object containing a `lengths` property, which is an array of numbers, each representing the length of an input line.
    * See object specification below:
    * ```
    * {
    *   lengths: <Number[]>
    * }
    * ```
    */
    lengths: function(/*esri.tasks.LengthsParameters*/ params) {
      //summary:  geometries specified in the argument params
      // params: esri.tasks.LengthsParameters: Parameters to pass to server
      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/lengths",
        content: _params,
        callbackParamName: "callback"
      });
    },
    
    /**
    * Calculates an interior point for each polygon specified. These interior points can be used by clients for labeling the polygons.
    *
    * @param {module:esri/geometry/Polygon[]} polygons - The polygon graphics to process.
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Point Point} geometries defining the interior points of the input
    * polygons that may be used for labeling.
    */
    labelPoints: function(/*esri.geometry.Polygons[]*/ polygons) {
      var geoms = array.map(polygons, function(geom){
        return geom.toJSON();
      });
      var sr = polygons[0].spatialReference,
          params = lang.mixin({},
                              this.parsedUrl.query,
                              {
                                f:"json",
                                sr:sr.wkid ? sr.wkid : JSON.stringify(sr.toJSON()),
                                polygons: JSON.stringify(geoms)
                              }
                             );

      return esriRequest({
        url: this.parsedUrl.path + "/labelPoints",
        content: params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geoms = response.labelPoints || [];

          return geoms.map(function(geom) {
            return jsonUtils.fromJSON(geom).set("spatialReference", sr);
          });
        });
    },

    /**
    * Computes the set of pairs of geometries from the input geometry arrays that belong to the specified relation. 
    * Both arrays are assumed to be in the same spatial reference. The relations are evaluated in 2D. Z-coordinates
    * are not used. Geometry types cannot be mixed within an array. 
    *
    * @param {module:esri/tasks/support/RelationParameters} params - The set of parameters required to perform the comparison.
    *
    * @see {@link module:esri/geometry/geometryEngine#relate geometryEngine.relate()}
    * @see {@link module:esri/geometry/geometryEngineAsync#relate geometryEngineAsync.relate()}
    *
    * @example
    * require([
    *   "esri/tasks/GeometryService", "esri/tasks/RelationParameters", ... 
    *   ], function(GeometryService, RelationParameters, ... ) {
    *     var geometryService = new GeometryService( ... );
    *
    *     var relationParams = new RelationParameters();
    *     relationParams.geometries1 = geometries[0];
    *     relationParams.geometries2 = geometries[1];
    *     relationParams.relation = "esriGeometryRelationWithin";
    *
    *     geometryService.relation(relationParams).then( ... );
    *     ...
    * });
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Polygon Polygon} geometries that meet the relation.
    */
    relation: function(/*esri.tasks.RelationParameters*/ params) {
          var _params = lang.mixin(  {},
                                    this.parsedUrl.query,
                                    { f:"json" },
                                    params.toJSON()
                                  );

      return esriRequest({
        url: this.parsedUrl.path + "/relation",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleRelationResponse);
    },

    /**
    * Trims or extends the input polylines using the user specified guide polyline. When trimming features, 
    * the portion to the left of the cutting line is preserved in the output and the rest is discarded. If the 
    * input polyline is not cut or extended then an empty polyline is added to the output array.
    *
    * @param {module:esri/tasks/support/TrimExtendParameters} - Input parameters for the `trimExtend` operation.
    *
    * @return {Promise} When resolved, returns an array of the trimmmed or extended {@link module:esri/geometry/Geometry geometries}.
    */
    trimExtend: function(/*esri.tasks.TrimExtendParameters*/ params) {
      //summary: This operation trims / extends each polyline specified in the input array, using the user specified guide polylines.
      //When trimming features, the part to the left of the oriented cutting line is preserved in the output and the other part is discarded. 
      //An empty polyline is added to the output array if the corresponding input polyline is neither cut nor extended. 
      // params.polylines: esri.geometry.Polyline[]: array of polylines to trim extend to
      // params.trimExtendTo: esri.geometry.Polyline: A polyline which is used as a guide for trimming / extending input polylines.
      // params.extendHow:  esri.tasks.TrimExtendParameters.

      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              ),
          outSR = params.sr;

      return esriRequest({
        url: this.parsedUrl.path + "/trimExtend",
        content: _params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geometry) {
            return new Polyline({
              spatialReference: outSR,
              paths: geometry.paths
            });
          });
        });
    },

    /**
    * The densify operation is performed on a geometry service resource. This operation densifies
    * geometries by plotting points between existing vertices. 
    *
    * @param {module:esri/tasks/support/DensifyParameters} densifyParameters - The DensifyParameters objects
    * contains `geometries`, `geodesic`, `lengthUnit`, and `maxSegmentLength` properties.
    *
    * @see {@link module:esri/geometry/geometryEngine#densify geometryEngine.densify()}
    * @see {@link module:esri/geometry/geometryEngineAsync#densify geometryEngineAsync.densify()}
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Geometry geometries} defining the denisfied input features.
    */
    densify: function(/*esri.tasks.DensifyParameters*/ params) {

      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              ),
          outSR = params.geometries[0].spatialReference;

      return esriRequest({
        url: this.parsedUrl.path + "/densify",
        content: _params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geometry) {
            return jsonUtils.fromJSON(geometry).set("spatialReference", outSR);
          });
        });
    },

    /**
    * Generalizes the input geometries using the Douglas-Peucker algorithm.
    *
    * @param {module:esri/tasks/support/GeneralizeParameters} params - An array of geometries to generalize
    * and a maximum deviation. Optionally set the deviation units.
    *
    * @see {@link module:esri/geometry/geometryEngine#generalize geometryEngine.generalize()}
    * @see {@link module:esri/geometry/geometryEngineAsync#generalize geometryEngineAsync.generalize()}
    * 
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Geometry geometries} defining the generalized geometries of the input.
    */
    generalize: function(/*esri.tasks.GeneralizeParameters*/ params) {

      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              ),
          outSR = params.geometries[0].spatialReference;

      return esriRequest({
        url: this.parsedUrl.path + "/generalize",
        content: _params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geometry) {
            return jsonUtils.fromJSON(geometry).set("spatialReference", outSR);
          });
        });
    },

    /**
    * Constructs the offset of the input geometries. If the offsetDistance is positive the constructed 
    * offset will be on the right side of the geometry. Left side offsets are constructed with negative values. 
    *
    * @param {module:esri/tasks/support/OffsetParameters} params - Set the geometries to offset, distance, and units.
    *
    * @see {@link module:esri/geometry/geometryEngine#offset geometryEngine.offset()}
    * @see {@link module:esri/geometry/geometryEngineAsync#offset geometryEngineAsync.offset()}
    *
    * @return {Promise} When resolved, returns an array of {@link module:esri/geometry/Geometry geometries} offset at the specified distance from the input.
    */
    offset: function(/*esri.tasks.OffsetParameters*/ params) {

      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              ),
          outSR = params.geometries[0].spatialReference;

      return esriRequest({
        url: this.parsedUrl.path + "/offset",
        content: _params,
        callbackParamName: "callback"
      })
        .then(function(response) {
          var geometries = response.geometries || [];

          return geometries.map(function(geometry) {
            return jsonUtils.fromJSON(geometry).set("spatialReference", outSR);
          });
        });
    },

    /**
    * Measures the planar or geodesic distance between geometries.
    *
    * @param {module:esri/tasks/support/DistanceParameters} params - Sets the input geometries to measure, 
    * distance units, and other parameters.
    *
    * @see {@link module:esri/geometry/geometryEngine#distance geometryEngine.distance()}
    * @see {@link module:esri/geometry/geometryEngineAsync#distance geometryEngineAsync.distance()}
    *
    * @returns {Promise} When resolved, returns a number representing the distance between the input geometries.
    */
    distance: function(/*esri.tasks.DistanceParameters*/ params) {

      var _params = lang.mixin( {},
                                this.parsedUrl.query,
                                { f:"json" },
                                params.toJSON()
                              );

      return esriRequest({
        url: this.parsedUrl.path + "/distance",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleDistanceResponse);
    },

    /**
    * Converts an array of XY-coordinates into well-known strings based on the conversion type and spatial 
    * reference supplied by the user. Only available with ArcGIS Server 10.3 or above.
    *
    * @param {Object} params - See the object specifications table below for the structure of the `params` object.
    * @param {(module:esri/geometry/SpatialReference | string)} params.sr - The spatial reference (or WKID of the spatial reference) 
    * of the XY-coordinates to be converted.
    * @param {number[][]} params.coordinates - An array of XY-coordinates (in JSON format) to be converted.
    * @param {string} params.conversionType - The conversion type of the input strings.
    *                                       
    * **Possible values:** MGRS | USNG | UTM | GeoRef | GARS | DMS | DDM | DD
    * @param {string=} params.conversionMode - Conversion options for MGRS and UTM conversion types. See
    * the [ArcGIS REST API documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r30000026w000000)
    * for valid coversion modes and their descriptions.
    * @param {number=} params.numOfDigits - The number of digits to output for each of the numerical portions in the string.
    * The default value depends of `conversionType`. See the [ArcGIS REST API documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r30000026z000000) for default values.
    * @param {boolean=} params.rounding - If `true`, then numeric portions of the string are rounded to the nearest whole magnitude
    * as specified by `numOfDigits`. Otherwise, numeric portions of the string are truncated. The rounding parameter applies 
    * only to conversion types `MGRS`, `USNG` and `GeoRef`. The default value is `true`.
    * @param {boolean=} params.addSpaces - If `true`, then spaces are added between components of the string. The 
    * `addSpaces` parameter applies only to conversion types `MGRS`, `USNG` and `UTM`. The default value for `MGRS` is `false`
    * , while the default value for both `USNG` and `UTM` is `true`.
    *
    * @example
    * require(["esri/tasks/GeometryService", ...], 
    *   function(GeometryService, ...){
    *     var gvsc = new GeometryService( ... );
    *     var params = {};
    *     params.sr = "4326";
    *     params.coordinates = [ [180,0] , [-117,34] , [0,52] ];
    *     params.conversionType = "MRGS";
    *     params.conversionMode = "mgrsNewWith180InZone01";
    *     params.numOfDigits = 8;
    *
    *     gvsc.toGeoCoordinateString(params).then(function(response){
    *       //when resolved, these strings are stored in response object
    *       //response.strings[0] = "01N AA 66021443 00000000"
    *       //response.strings[1] = "11S NT 00000000 62155978"
    *       //response.strings[2] = "31U BT 94071081 65288255"
    *     });
    * });
    * @return {Promise} When resolved, returns an array of well-known strings.
    */
    toGeoCoordinateString: function(/*simple object*/ params){
      //REST DOC as of 3.10 Update
      //http://rags2k8411r2:6080/arcgis/sdk/rest/index.html#/To_GeoCoordinateString/02ss000000pm000000/
      var json = {};
      if (!lang.isObject(params.sr)) {
        json.sr = params.sr; //this is a number
      }
      else {
        json.sr = params.sr.wkid || JSON.stringify(params.sr.toJSON());
      }
      
      json.coordinates = JSON.stringify(params.coordinates);
      
      // MGRS is the default so leaving conversionType out does not cause a request failure
      json.conversionType = params.conversionType || "MGRS";
      json.conversionMode = params.conversionMode;
      json.numOfDigits = params.numOfDigits;
      json.rounding = params.rounding;
      json.addSpaces = params.addSpaces;

      var _params = lang.mixin({}, this.parsedUrl.query, { f:"json" }, json);

      return esriRequest({
        url: this.parsedUrl.path + "/toGeoCoordinateString",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleToGeoCoordinateResponse);
    },
    
    /**
    * Converts an array of well-known strings into xy-coordinates based on the conversion type and spatial 
    * reference supplied by the user. Only available with ArcGIS Server 10.3 or above.
    *
    * @param {Object} params - See the object specifications table below for the structure of the  `params`  object.
    * @param {string[]} params.strings - An array of formatted strings as specified by `conversionType`. 
    * Example: `["01N AA 66021 00000" , "11S NT 00000 62155" , "31U BT 94071 65288"]`
    * @param {(module:esri/geometry/SpatialReference | string)} params.sr - The spatial reference or well-known ID to 
    * convert the input string coordinates to.
    * @param {string} params.conversionType - The converstion type of the input strings. The default value is `MRGS`.
    *                                       
    * **Possible Values:** MRGS | USNG | UTM | GeoRef | GARS | DMS | DDM | DD
    * @param {string=} params.conversionMode - Conversion options for MGRS, UTM and GARS conversion types. See
    * the [ArcGIS REST API documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r30000026z000000)
    * for valid values and their descriptions.
    *
    * @return {Promise} When resolved, returns an array of XY-coordinate pairs.
    */
    fromGeoCoordinateString: function(/*esri.tasks.FromGeoCoordinateParameters*/ params){
      var json = {};
      if (!lang.isObject(params.sr)) {
        json.sr = params.sr; //this is a number;
      }
      else {
        json.sr = params.sr.wkid || JSON.stringify(params.sr.toJSON());
      }
      json.strings = JSON.stringify(params.strings);
      
      // MGRS is the default so leaving conversionType out does not cause a request failure
      json.conversionType = params.conversionType || "MGRS";
      json.conversionMode = params.conversionMode;

      var _params = lang.mixin({}, this.parsedUrl.query, { f:"json" }, json);

      return esriRequest({
        url: this.parsedUrl.path + "/fromGeoCoordinateString",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleFromGeoCoordinateResponse);
    },

  _handleRelationResponse: function(response) {
    return response.relations;
  },

  _handleDistanceResponse: function(response) {
    return response && response.distance;
  },

  _handleToGeoCoordinateResponse: function(response) {
    return response.strings;
  },

  _handleFromGeoCoordinateResponse: function(response) {
    return response.coordinates;
  }

});

lang.mixin(GeometryService, {
  UNIT_METER: 9001, 
  UNIT_GERMAN_METER: 9031, 
  UNIT_FOOT: 9002, 
  UNIT_SURVEY_FOOT: 9003, 
  UNIT_CLARKE_FOOT: 9005, 
  UNIT_FATHOM: 9014, 
  UNIT_NAUTICAL_MILE: 9030,
  UNIT_SURVEY_CHAIN: 9033, 
  UNIT_SURVEY_LINK: 9034, 
  UNIT_SURVEY_MILE: 9035, 
  UNIT_KILOMETER: 9036, 
  UNIT_CLARKE_YARD: 9037, 
  UNIT_CLARKE_CHAIN: 9038,
  UNIT_CLARKE_LINK: 9039, 
  UNIT_SEARS_YARD: 9040, 
  UNIT_SEARS_FOOT: 9041, 
  UNIT_SEARS_CHAIN: 9042, 
  UNIT_SEARS_LINK: 9043, 
  UNIT_BENOIT_1895A_YARD: 9050,
  UNIT_BENOIT_1895A_FOOT: 9051, 
  UNIT_BENOIT_1895A_CHAIN: 9052, 
  UNIT_BENOIT_1895A_LINK: 9053, 
  UNIT_BENOIT_1895B_YARD: 9060, 
  UNIT_BENOIT_1895B_FOOT: 9061,
  UNIT_BENOIT_1895B_CHAIN: 9062, 
  UNIT_BENOIT_1895B_LINK: 9063, 
  UNIT_INDIAN_FOOT: 9080, 
  UNIT_INDIAN_1937_FOOT: 9081, 
  UNIT_INDIAN_1962_FOOT: 9082,
  UNIT_INDIAN_1975_FOOT: 9083, 
  UNIT_INDIAN_YARD: 9084, 
  UNIT_INDIAN_1937_YARD: 9085, 
  UNIT_INDIAN_1962_YARD: 9086, 
  UNIT_INDIAN_1975_YARD: 9087,
  UNIT_FOOT_1865: 9070, 
  UNIT_RADIAN: 9101, 
  UNIT_DEGREE: 9102, 
  UNIT_ARCMINUTE: 9103, 
  UNIT_ARCSECOND: 9104, 
  UNIT_GRAD: 9105, 
  UNIT_GON: 9106, 
  UNIT_MICRORADIAN: 9109,
  UNIT_ARCMINUTE_CENTESIMAL: 9112, 
  UNIT_ARCSECOND_CENTESIMAL: 9113, 
  UNIT_MIL6400: 9114, 
  UNIT_BRITISH_1936_FOOT: 9095, 
  UNIT_GOLDCOAST_FOOT: 9094,
  UNIT_INTERNATIONAL_CHAIN: 109003, 
  UNIT_INTERNATIONAL_LINK: 109004, 
  UNIT_INTERNATIONAL_YARD: 109001, 
  UNIT_STATUTE_MILE: 9093, 
  UNIT_SURVEY_YARD: 109002,
  UNIT_50KILOMETER_LENGTH: 109030, 
  UNIT_150KILOMETER_LENGTH: 109031, 
  UNIT_DECIMETER: 109005, 
  UNIT_CENTIMETER: 109006, 
  UNIT_MILLIMETER: 109007,
  UNIT_INTERNATIONAL_INCH: 109008, 
  UNIT_US_SURVEY_INCH: 109009, 
  UNIT_INTERNATIONAL_ROD: 109010, 
  UNIT_US_SURVEY_ROD: 109011, 
  UNIT_US_NAUTICAL_MILE: 109012, 
  UNIT_UK_NAUTICAL_MILE: 109013,
  UNIT_SQUARE_INCHES: "esriSquareInches",
  UNIT_SQUARE_FEET: "esriSquareFeet",
  UNIT_SQUARE_YARDS: "esriSquareYards",
  UNIT_ACRES: "esriAcres",
  UNIT_SQUARE_MILES: "esriSquareMiles",
  UNIT_SQUARE_MILLIMETERS: "esriSquareMillimeters",
  UNIT_SQUARE_CENTIMETERS: "esriSquareCentimeters",
  UNIT_SQUARE_DECIMETERS: "esriSquareDecimeters",
  UNIT_SQUARE_METERS: "esriSquareMeters",
  UNIT_ARES: "esriAres",
  UNIT_HECTARES: "esriHectares",
  UNIT_SQUARE_KILOMETERS: "esriSquareKilometers"
});

return GeometryService;
});
