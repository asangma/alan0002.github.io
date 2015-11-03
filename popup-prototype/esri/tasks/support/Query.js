/**
 * **Requirements:** ArcGIS Online hosted feature service(s) or ArcGIS Server service(s) 10.1 or greater.
 * 
 * Query is used to define parameters to filter a layer's features, either by its attributes or its geometry. Once
 * a Query object is created, you can set its properties to conform to the filtering requirements of the application.
 * Once a Query object is created and its properties are set, it is then ready to be passed into an executable function 
 * in {@link module:esri/tasks/QueryTask|QueryTask} (e.g. `QueryTask.execute(Query)`). The returned result 
 * is often a {@link module:esri/tasks/support/FeatureSet FeatureSet}.
 * 
 * For example, you may want to view features in your map based on attribute values specified by the user (e.g. User inputs
 * a state name to zoom to the state). To do this,
 * create a query object and use the `where` property to query an attribute using SQL:
 * ```
 * require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function(QueryTask, Query){
 *   var queryStatesTask  = new QueryTask({
 *     url: "..."  //URL of a feature layer representing U.S. states
 *   }); 
 *   var query = new Query();
 *   query.where = "STATE_NAME = 'California'";
 *   queryStatesTask.execute(query).then(function(result){
 *     //Do something with the resulting FeatureSet (zoom to it, highlight features, get other attributes, etc)
 *    });
 * });
 * ```
 * Quering by geometry/location is also possible with Query. Instead of using `where`, use `geometry`. For example, 
 * let's say you want to build an application that highlights all the cities in a Feature Layer that are within 100 miles of
 * a click on the view. You would set the `geometry` to the view click and the distance to `100`:
 * ```
 * require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function(QueryTask, Query){
 *   var queryCitiesTask = new QueryTask({
 *     url: "..."  //URL of a feature layer representing U.S. cities
 *   });
 *   var query = new Query();
 *   query.geometry = mapPoint; //mapPoint obtained from view-click event.
 *   query.distance = 100;
 *   query.units = "miles";
 *   query.spatialRelationship = "esriSpatialRelIntersects"; //All features that intersect 100mi buffer
 *   queryCitiesTask.execute(query).then(function(result){
 *     //returns all U.S. cities as a FeatureSet within 100 miles of view-click
 *   });
 * });
 * ```
 * @since 4.0
 * @module esri/tasks/support/Query
 * @see module:esri/tasks/QueryTask
 */
define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "../../core/Accessor",
  "../../geometry/support/jsonUtils",
  "./SpatialRelationship"
], function(
  declare, lang, array, Accessor, jsonUtils, SpatialRelationship
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/tasks/support/Query
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Query = declare(Accessor,
  /** @lends module:esri/tasks/support/Query.prototype */
  {

    declaredClass: "esri.tasks.Query",

    /**
    * The spatial relationship to be applied to the input geometry while performing the query. 
    * The valid values are listed in the table below:
    * 
    * Value | Description
    * ------|-------------
    * esriSpatialRelIntersects | Part of a feature from feature class 1 intersects a feature from feature class 2.
    * esriSpatialRelContains | Part or all of a feature from feature class 1 is contained within a feature from feature class 2.
    * esriSpatialRelCrosses | The feature from feature class 1 crosses a feature from feature class 2.
    * esriSpatialRelEnvelopeIntersects | The envelope of feature class 1 intersects with the envelope of feature class 2.
    * esriSpatialRelIndexIntersects | The envelope of the query feature class intersects the index entry for the target feature class.
    * esriSpatialRelOverlaps | Features from feature class 1 overlap features in feature class 2.
    * esriSpatialRelTouches | The feature from feature class 1 touches the border of a feature from feature class 2.
    * esriSpatialRelWithin | The feature from feature class 1 is completely enclosed by the feature from feature class 2.
    * esriSpatialRelRelation | Allows specification of any relationship defined using the [Shape Comparison Language](http://resources.esri.com/help/9.3/arcgisengine/dotnet/concepts_start.htm#40de6491-9b2d-440d-848b-2609efcd46b1.htm).
    * 
    * @type {string}
    * @example
    * require([
    *   "esri/tasks/support/query", ... 
    * ], function(Query, ... ) {
    *   var query = new Query();
    *   query.spatialRelationship = "esriSpatialRelContains";
    *   ...
    * });
    *
    * @default esriSpatialRelIntersects
    */  
    spatialRelationship: SpatialRelationship.SPATIAL_REL_INTERSECTS,

    /**
    * Shorthand for a where clause using "like". The field used is the display field defined in the map document. 
    * You can determine what the display field is for a layer in the Services Directory.
    * @type {string}
    * @example
    * query.text = stateName;
    */   
    text: null,

    /**
    * A where clause for the query. Any legal SQL where clause operating on the fields in the layer is allowed.
    * Be sure to have the correct sequence of single and double quotes when writing the where clause in JavaScript. 
    * @type {string}
    * @example
    * query.where = "NAME = '" + stateName + "'";
    * @example
    * query.where = "POP04 > " + population;
    */  
    where: "",

    /**
    * The geometry to apply to the spatial filter. The spatial relationship as specified by `spatialRelationship`
    * is applied to this geometry while performing the query. The valid geometry types are 
    * {@link module:esri/geometry/Extent Extent}, {@link module:esri/geometry/Point Point}, 
    * {@link module:esri/geometry/Multipoint Multipoint}, {@link module:esri/geometry/Polyline Polyline}, or 
    * {@link module:esri/geometry/Polygon Polygon}. 
    * @type {module:esri/geometry/Geometry}
    */
    geometry: null,
      
    /**
    * Specify the number of decimal places for the geometries returned by the query operation.
    * @type {number}
    */
    geometryPrecision: null,  

    /**
    * One or more field names that will be used to group the statistics. This is only valid when 
    * `outStatistics` has been defined. Requires ArcGIS Server service version 10.1 or greater.
    * @type {string[]}
    */
    groupByFieldsForStatistics: null,

    /**
    * A comma delimited list of ObjectIds for the features in the layer/table being queried.
    * @type {number[]}
    */
    objectIds: null,

    /**
    * If `true`, each feature in the {@link module:esri/tasks/support/FeatuerSet FeatureSet} includes the geometry. 
    * Set to `false` (default) if you do not plan to include highlighted features on a map since the geometry takes 
    * up a significant portion of the response.
    * @type {boolean}
    * @default false
    */
    returnGeometry: false,

    /**
    * If `true` then the query returns distinct values based on the fields specified in `outFields`. This
    * parameter applies only if `supportsAdvancedQueries` property of the layer is `true`. *Requires ArcGIS Server 
    * 10.1 Service Pack 1 or later.*
    * @type {boolean}
    * @default false
    */
    returnDistinctValues: false,
      
    /**
    * The maximum allowable offset used for generalizing geometries returned by the query operation. 
    * The offset is in the units of `spatialReference`. If `spatialReference` is not defined the 
    * spatial reference of the map is used.
    * @type {number}
    */
    maxAllowableOffset: null,
      
    /**
    * Parameter to support querying feature services whose data source is a multipatch feature class.
    * @type {string}
    * @example
    * var queryTask = new QueryTask( ... );
    * var query = new Query();
    * query.objectIds = [22];
    * query.multipatchOption = "xyFootprint";
    * query.outFields = ["*"];
    * query.returnGeometry = true;
    * queryTask.execute(query);
    */  
    multipatchOption: null,
      
    /**
    * Number of features to retrieve. Should be used in conjunction with `query.start`. Use this to 
    * implement paging and retrieve "pages" of results when querying. If not provided, but an instance 
    * of Query has a start property, `num` defaults to 10. Valid only for 
    * [hosted features services](http://doc.arcgis.com/en/arcgis-online/share-maps/hosted-web-layers.htm) 
    * on [arcgis.com](http://arcgis.com). **Optional.** 
    * @type {number}
    */
    num: null,
     
    /**
    * Zero-based index indicating where to begin retrieving features. Should be used in conjunction with `query.num`. 
    * Use this to implement paging and retrieve "pages" of results when querying. Features are sorted ascending by
    * object ID by default. *Valid only for [hosted features services](http://doc.arcgis.com/en/arcgis-online/share-maps/hosted-web-layers.htm) on [arcgis.com](http://arcgis.com).* **Optional**.
    * @type {number}
    */  
    start: null,

    /**
    * One or more field names that will be used to order the query results. Specfiy `ASC` (ascending) or `DESC` 
    * (descending) after the field name to control the order. The default order is `ASC`. `orderByFields` is only 
    * supported on dynamic layers and tables where `supportsAdvancedQueries = true`. *Requires ArcGIS Server 
    * service version 10.1 or greater.*
    * @type {string[]}
    * @example
    * query.orderByFields = ["STATE_NAME DESC"];
    */  
    orderByFields: null,

    /**
    * The spatial reference for the returned geometry. If not specified, the geometry is returned in the spatial 
    * reference of the map. 
    * 
    * @type {module:esri/geometry/SpatialReference}
    */ 
    outSpatialReference: null,

    /**
    * Attribute fields to include in the FeatureSet. Fields must exist in the map layer. You must list actual 
    * field names rather than the alias names. You are, however, able to use the alias names when you display 
    * the results. You can set field alias names in the map document. 
    *
    * When specifying the output fields, you should limit the fields to only those you expect to use in the 
    * query or the results. The fewer fields you include, the faster the response will be. 
    *
    * Each query must have access to the Shape and ObjectId fields for a layer. However, your list of fields does 
    * not need to include these two fields.
    * @type {string[]}
    * @example
    * query.outFields = ["NAME", "STATE_ABBR", "POP04"];
    */
    outFields: null,

    /**
    * The definitions for one or more field-based statistics to be calculated. `outStatistics` is only supported 
    * on layers/tables where `supportsStatistics = true`. If `outStatistics` is specified the only other query parameters 
    * that will be used are `groupByFieldsForStatistics`, `orderByFields`, `text`, `timeExtent` and `where`.
    * *Requires ArcGIS Server service version 10.1 or greater.*
    * @type {module:esri/tasks/support/StatisticDefinition[]}
    * @example
    * require([
    *   "esri/tasks/query", "esri/tasks/StatisticDefinition", ... 
    * ], function(Query, StatisticDefinition, ... ) {
    *   var query = new Query();
    *   var statisticDefinition = new StatisticDefinition();
    *   statisticDefinition.statisticType = "sum";
    *   statisticDefinition.onStatisticField = "POP2000";
    *   statisticDefinition.outStatisticFieldName = "TotalPop";
    *
    *   query.outStatistics = [statisticDefinition];
    *   ...
    * });
    */ 
    outStatistics: null,

    /**
    * Specify a time extent for the query. 
    * @type {module:esri/TimeExtent}
    * @private
    * @example
    * require([
    *  "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/tasks/support/Query", ... 
    * ], function(FeatureLayer, TimeExtent, Query, ... ) {
    *   var layer = new FeatureLayer( ... );
    *   var timeExtent = new TimeExtent( ... );
    *   var timeQuery = new Query();
    *   timeQuery.timeExtent = timeExtent;
    *   layer.queryFeatures(timeQuery).then(function(featureSet) { ... });
    *   ...
    * });
    */
    timeExtent: null,

    /**
    * The 'Shape Comparison Language' string to evaluate. The string describes the spatial relationship to be
    * tested when the spatial relationship is `esriSpatialRelRelation`. The 
    * [Shape Comparison Language](http://resources.arcgis.com/en/help/main/10.2/index.html#/Spatial_relationship_functions/006z0000001z000000/) 
    * EDN topic has additional details.
    * @type {string}
    * @example
    * var query = new Query();
    * query.relationParam = "FFFTTT***";
    */
    relationParam: null,

    /**
    * Specify the pixel level to be identified on the X and Y axis. Defaults to the base resolution of the 
    * dataset if not specified. Applicable only to Image Service layers.
    * @type {module:esri/symbols/Symbol}
    */
    pixelSize: null,
    // Advanced capabilities implemented in the Azure-based
    // feature service implementation in March 2014 release of arcgis.com.
    // To be implemented in 10.3 (summer 2014) for ArcObjects based fs/ms
    // and Amazon hosted fs.

    /**
    * Distance to buffer input geometry. Query results will include features within the distance 
    * specified of `query.geometry`. Valid only for [hosted features services](http://doc.arcgis.com/en/arcgis-online/share-maps/hosted-web-layers.htm) on [arcgis.com](http://arcgis.com). **Optional**
    * @type {number}
    */
    distance: null,

    /**
    * Distance unit. Valid only for [hosted features services](http://doc.arcgis.com/en/arcgis-online/share-maps/hosted-web-layers.htm) on [arcgis.com](http://arcgis.com). **Optional**
    *
    * **Known values:** feet | miles | nautical-miles | us-nautical-miles | meters | kilometers
    * @type {string}
    * @default meters
    */
    units: null,

    resultOffset: null,

    resultRecordCount: null,

    // issue #941:
    // Object with the following properties
    //  - mode
    //  - tolerence
    //  - extent
    //  - originPosition
      
    /**
    * Used to project the geometry onto a virtual grid, likely representing pixels on the screen. See
    * the {@link module:esri/tasks/support/Query~QuantizationParams QuantizationParams Object specifications} for 
    * more details on this object. *Only works with ArcGIS Online hosted services.* 
    * 
    * @property {module:esri/geometry/Extent} extent - An extent defining the quantization grid bounds. Its 
    * {@link module:esri/geometry/SpatialReference SpatialReference} matches the input geometry spatial reference if one is 
    * specified for the query. Otherwise, the extent will be in the layer's spatial reference.
    * @property {string} mode - Geometry coordinates are optimized for viewing and displaying of data.
    * **Known values:** view
    * @property {string} originPosition - The integer's coordinates will be returned 
    * relative to the origin position defined by this property value. Default is `upperLeft`.
    * **Known values:** upperLeft | lowerLeft
    * @property {number} tolerance - The size of one pixel in the units of outSpatialReference. This number is used to convert coordinates
    * to integers by building a grid with a resolution matching the tolerance. Each coordinate is then snapped to one pixel on the grid.
    * Consecutive coordinates snapped to the same pixel are removed for reducing the overall response size. The untis of tolerance will match 
    * the units of outSpatialReference. If outSpatialReference is not specified, then tolerance is assumed to be in the units of the spatial
    * reference of the layer. If tolerance is not specified, the maxAllowableOffset is used. If tolerance and maxAllowableOffset are not
    * specified, a grid of 10,000 * 10,000 grid is used by default.
    * 
    * @type {Object}
    * 
    * @example
    * var query = new Query();
    * query.quantizationParameters = {
    *   mode: "view",
    *   originPosition: "upperLeft",
    *   tolerance: 4820,
    *   extent: layer.fullExtent
    * };
    */
    quantizationParameters: null,

    _units: {
      "meters": "esriSRUnit_Meter",
      "kilometers": "esriSRUnit_Kilometer",
      "feet": "esriSRUnit_Foot",
      "miles": "esriSRUnit_StatuteMile",
      "nautical-miles": "esriSRUnit_NauticalMile",
      "us-nautical-miles": "esriSRUnit_USNauticalMile"
    },

    toJson: function(normalized) {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON(normalized);
    },

    toJSON: function(normalized) {
      var json = {
            text: this.text,
            where: this.where,
            returnGeometry: this.returnGeometry,
            spatialRel: this.spatialRelationship,
            maxAllowableOffset: this.maxAllowableOffset,
            geometryPrecision: this.geometryPrecision,
            returnZ: this.returnZ,
            returnM: this.returnM
          },
          g = normalized && normalized.geometry || this.geometry,
          ids = this.objectIds,
          outFields = this.outFields,
          outSR = this.outSpatialReference,
          groupByFieldsForStatistics = this.groupByFieldsForStatistics,
          orderByFields = this.orderByFields,
          outStatistics = this.outStatistics,
          distance = this.distance;

      if (g) {
        json.geometry = g;
        json.geometryType = jsonUtils.getJsonType(g);
        json.inSR = g.spatialReference.wkid || JSON.stringify(g.spatialReference.toJSON());
      }

      if (ids) {
        json.objectIds = ids.join(",");
      }

      if (outFields) {
        json.outFields = outFields.join(",");
      }

      if (this.returnDistinctValues) {
        json.returnDistinctValues = true;
      }

      if (groupByFieldsForStatistics) {
        json.groupByFieldsForStatistics = groupByFieldsForStatistics.join(",");
      }

      if (orderByFields) {
        json.orderByFields = orderByFields.join(",");
      }

      if (outStatistics) {
        var outStatisticsJson = [];
        array.forEach(outStatistics, function(item) {
          outStatisticsJson.push(item.toJSON());
        });
        json.outStatistics = JSON.stringify(outStatisticsJson);
      }

      if (outSR) {
        json.outSR = outSR.wkid || JSON.stringify(outSR.toJSON());
      }
      else if (g) {
        json.outSR = g.spatialReference.wkid || JSON.stringify(g.spatialReference.toJSON());
      }

      var timeExtent = this.timeExtent;
      json.time = timeExtent ? timeExtent.toJSON().join(",") : null;

      var relationParam = this.relationParam;
      if (relationParam && this.spatialRelationship === Query.SPATIAL_REL_RELATION) {
        json.relationParam = relationParam;
      }

      if (distance) {
        json.distance = this.distance;
        if (this.hasOwnProperty("units")) {
          json.units = this._units[this.units] || this._units.meters;
        }
        else {
          console.warn("esri/tasks/query::no distance unit provided, defaulting to meters");
          json.units = this._units.meters;
        }
      }

      // Paging. Default to ten results.
      // Where clause and outFields are required.
      if (this.hasOwnProperty("start")) {
        json.resultOffset = this.start;
        json.resultRecordCount = 10;

        // requires a where clause
        if (json.where === "") {
          json.where = "1=1";
        }
      }

      if (this.hasOwnProperty("num")) {
        json.resultRecordCount = this.num;
      }

      // NOTE supported only by ImageServices
      json.pixelSize = this.pixelSize ? JSON.stringify(this.pixelSize.toJSON()) : null;

      json.multipatchOption = this.multipatchOption;

      //issue #941
      if (this.quantizationParameters) {
        json.quantizationParameters = JSON.stringify(this.quantizationParameters);
      }

      // NOTE
      // Used by feature layer to set a timestamp under
      // certain conditions. See FeatureLayer.js for details
      json._ts = this._ts;

      return json;
    }

  });

  lang.mixin(Query, SpatialRelationship);

  return Query;
});
