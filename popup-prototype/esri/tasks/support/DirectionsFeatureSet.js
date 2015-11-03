/**
 * A {@link module:esri/tasks/support/FeatureSet} that has properties specific to 
 * routing. The [features](#features) property contains the turn by turn directions text and  
 * geometry of the route. The attributes for each feature provide information associated with 
 * the corresponding route segment. The following attributes are returned: 
 * 
 * * text - The direction text
 * * length - The length of the route segment
 * * time - The time to travel along the route segment
 * * ETA - The estimated time of arrival at the route segment in the local time
 * * maneuverType - The type of maneuver that the direction represents
 *
 * @module esri/tasks/support/DirectionsFeatureSet
 * @noconstructor
 * @since 4.0
 * @see module:esri/tasks/RouteTask
 * @see {@link module:esri/tasks/support/RouteResult#directions RouteResult.directions}
 */
define(
[
  "../../geometry/Extent",
  "../../geometry/Polyline",

  "./FeatureSet",

  "dojo/_base/array"
],
function(
  Extent, Polyline,
  FeatureSet,
  array
) {

  /**
   * @extends module:esri/tasks/support/FeatureSet
   * @constructor module:esri/tasks/support/DirectionsFeatureSet
   */
  var DirFeatureSet = FeatureSet.createSubclass(
  /** @lends module:esri/tasks/support/DirectionsFeatureSet.prototype */
  {

      declaredClass: "esri.tasks.DirectionsFeatureSet",

      classMetadata: {
        computed: {
          mergedGeometry: ["features", "extent.spatialReference"],
          strings: "features"
        },
        reader: {
          add: [
            "extent",
            "totalDriveTime",
            "totalLength",
            "totalTime"
          ],
          exclude: [
            "envelope",
            "summary"
          ]
        }
      },

      //--------------------------------------------------------------------------
      //
      //  Public Properties
      //
      //--------------------------------------------------------------------------

      //----------------------------------
      //  geometryType
      //----------------------------------

      /**
      * The geometry type of the FeatureSet. This value is always `esriGeometryPolyline`.
      * 
      * @type {string}
      */
      geometryType: "esriGeometryPolyline",

      //----------------------------------
      //  extent
      //----------------------------------

      /**
      * The extent of the route.
      * 
      * @type {module:esri/geometry/Extent}
      */
      extent: null,

      _extentReader: function(value, source) {
        return Extent.fromJSON(source.summary.envelope);
      },

      //----------------------------------
      //  features
      //----------------------------------

      /**
      * An array of graphics containing the directions.
      * 
      * @name features
      * @instance
      * @type {module:esri/Graphic[]}
      */
      
      _featuresReader: function(value, source) {
        value.forEach(this._decompressFeatureGeometry, this);
        return this.inherited(arguments);
      },

      //----------------------------------
      //  mergedGeometry
      //----------------------------------

      /**
      * A single polyline representing the route.
      * 
      * @type {module:esri/geometry/Polyline}
      */
      mergedGeometry: null,

      _mergedGeometryGetter: function() {
        if (!this.features) {
          return null;
        }

        var geometries = array.map(this.features, function(feature) {
              return feature.geometry;
            }),
            sr         = this.get("extent.spatialReference");

        return this._mergePolylinesToSinglePath(geometries, sr);
      },

      //----------------------------------
      //  routeId
      //----------------------------------

      /**
      * The ID of the route returned from the server.
      * 
      * @type {string}
      */
      routeId: null,

      //----------------------------------
      //  routeName
      //----------------------------------

      /**
      * Name specified in {@link module:esri/tasks/support/RouteParameters#stops RouteParameters.stops}.
      * 
      * @type {string}
      */
      routeName: null,

      //----------------------------------
      //  strings
      //----------------------------------

      /**
      * Lists additional information about the directions depending on the value of 
      * {@link module:esri/tasks/support/RouteParameters#directionsOutputType RouteParameters.directionsOutputType}.
      * 
      * @type {Object[]}
      */
      strings: null,

      _stringsGetter: function() {
        return array.map(this.features, function(f) {
          return f.strings;
        });
      },

      //----------------------------------
      //  totalDriveTime
      //----------------------------------

      /**
      * Actual drive time calculated for the route.
      * 
      * @type {number}
      */
      totalDriveTime: null,

      _totalDriveTimeReader: function(value, source) {
        return source.summary.totalDriveTime;
      },


      //----------------------------------
      //  totalLength
      //----------------------------------

      /**
      * The length of the route as specified in the units set in 
      * {@link module:esri/tasks/support/RouteParameters#directionsLengthUnits RouteParameters.directionsLengthUnits}.
      * 
      * @type {number}
      * @see {@link module:esri/tasks/support/RouteParameters#directionsLengthUnits RouteParameters.directionsLengthUnits}
      */
      totalLength: null,

      _totalLengthReader: function(value, source) {
        return source.summary.totalLength;
      },

      //----------------------------------
      //  totalTime
      //----------------------------------

      /**
      * The total time calculated for the route as specified in the units set in
      * {@link module:esri/tasks/support/RouteParameters#directionsTimeAttribute RouteParameters.directionsTimeAttribute}.
      * 
      * @type {number}
      * @see {@link module:esri/tasks/support/RouteParameters#directionsTimeAttribute RouteParameters.directionsTimeAttribute}
      */
      totalTime: null,

      _totalTimeReader: function(value, source) {
        return source.summary.totalTime;
      },

      //--------------------------------------------------------------------------
      //
      //  Private Methods
      //
      //--------------------------------------------------------------------------

      _decompressFeatureGeometry: function(json) {
        json.geometry = this._decompressGeometry(json.compressedGeometry);
        delete json.compressedGeometry;
      },

      _decompressGeometry: function(/*String*/ str) {
        var xDiffPrev = 0,
            yDiffPrev = 0,
            points    = [],
            x, y,
            strings,
            coefficient;

        // Split the string into an array on the + and - characters
        /*
         Example:
         input: "+1m91-6fl6e+202gc+3d+2k"
         output: ["+1m91","-6fl6e","+202gc","+0","+0"]
         */
        strings = str.match(/((\+|\-)[^\+\-]+)/g);

        if (!strings) {
          strings = [];
        }

        // The first value is the coefficient in base 32
        coefficient = parseInt(strings[0], 32);

        for (var j = 1; j < strings.length; j += 2) {
          // j is the offset for the x value
          // Convert the value from base 32 and add the previous x value
          x = (parseInt(strings[j], 32) + xDiffPrev);
          xDiffPrev = x;

          // j+1 is the offset for the y value
          // Convert the value from base 32 and add the previous y value
          y = (parseInt(strings[j + 1], 32) + yDiffPrev);
          yDiffPrev = y;

          points.push([x / coefficient, y / coefficient]);
        }

        return { paths: [points] };
      },

      _mergePolylinesToSinglePath: function(polylines, sr) {
        //merge all paths into 1 single path
        var points = [];
        array.forEach(polylines, function(polyline) {
          array.forEach(polyline.paths, function(path) {
            points = points.concat(path);
          });
        });

        //remove all duplicate points
        var path = [],
            prevPt = [0, 0];
        array.forEach(points, function(point) {
          if (point[0] !== prevPt[0] || point[1] !== prevPt[1]) {
            path.push(point);
            prevPt = point;
          }
        });

        return new Polyline({ paths: [path] }, sr);
      }
    }

  );

  return DirFeatureSet;
});
