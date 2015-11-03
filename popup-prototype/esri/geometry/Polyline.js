/**
 * An array of paths where each path is an array of points.
 * 
 * @module esri/geometry/Polyline
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 */
define(
[
  "../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",
  "../core/lang",
  "./SpatialReference",
  "./Geometry",
  "./Point",
  "./Extent",
  "./support/zmUtils"
],
function(declare, array, lang, esriLang, SpatialReference, Geometry, Point, Extent, zmUtils) {

  var defaultPolyline = {
    paths: null
  };
  
  var number = "number";

  /**
  * @extends module:esri/geometry/Geometry
  * @constructor module:esri/geometry/Polyline
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */       
  var Polyline = declare(Geometry, 
  /** @lends module:esri/geometry/Polyline.prototype */                      
  {
    declaredClass: "esri.geometry.Polyline",

    classMetadata: {
      computed: {
        cache: ["hasM", "hasZ", "paths"],
        extent: ["cache"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(kwArgs) {
      return {
        paths: []
      };
    },

    normalizeCtorArgs: function(obj, spatialReference) {
      var paths = null;
      var hasZ = undefined;
      var hasM = undefined;
      var point = null;

      // pick the initial values
      if (obj && !Array.isArray(obj)) {
        paths = obj.paths ? obj.paths : null;

        if (!spatialReference) {
          if (obj.spatialReference) {
            spatialReference = obj.spatialReference;
          } else if (!obj.paths) {
            spatialReference = obj;
          }
        }

        hasZ = obj.hasZ;
        hasM = obj.hasM;
      }
      else {
        paths = obj;
      }

      paths = paths || [];
      spatialReference = spatialReference || SpatialReference.WGS84;

      // transforms number[][] to number[][][]
      if (paths.length && paths[0] && paths[0][0] != null && typeof paths[0][0] == number) {
        paths = [paths];
      }

      // get the 1st point
      point = paths[0] && paths[0][0];

      // get the values for hasM and hasZ based on the 1st point
      if (point) {
        if (hasZ === undefined && hasM === undefined) {
          hasZ = point.length > 2;
          hasM = false;
        }
        else if (hasZ === undefined) {
          hasZ = !hasM && point.length > 3;
        }
        else if (hasM === undefined) {
          hasM = !hasZ && point.length > 3;
        }
      }

      return {
        paths: paths,
        spatialReference: spatialReference,
        hasZ: hasZ,
        hasM: hasM
      };
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _extent: null,
    _path: 0,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  extent
    //----------------------------------

    _extentGetter: function() {
      var paths = this.paths, pal = paths.length;
      if (!pal || !paths[0].length) {
        return null;
      }

      function undefinedMinMax(f) {
        return function(a, b) {
          return a === undefined ? b : (b === undefined ? a : f(a, b));
        };
      }

      var path, point, x, y, z, m, xmax, ymax, zmax, mmax, pa, pt, ptl,
          xmin = (xmax = paths[0][0][0]),
          ymin = (ymax = paths[0][0][1]),
          zmin, mmin,
          min = undefinedMinMax(Math.min),
          max = undefinedMinMax(Math.max),
          sr = this.spatialReference,
          parts = [], rxmin, rxmax, rymin, rymax, rzmin, rzmax, rmmin, rmmax,
          hasZ = this.hasZ,
          hasM = this.hasM,
          midx = hasZ ? 3 : 2;

      for (pa=0; pa<pal; pa++) {
        path = paths[pa];
        rxmin = (rxmax = path[0] && path[0][0]);
        rymin = (rymax = path[0] && path[0][1]);
        ptl = path.length;

        rzmin = rzmax = undefined;
        rmmin = rmmax = undefined;

        for (pt=0; pt < ptl; pt++) {
          point = path[pt];

          x = point[0];
          y = point[1];

          xmin = min(xmin, x);
          ymin = min(ymin, y);
          xmax = max(xmax, x);
          ymax = max(ymax, y);
          
          rxmin = min(rxmin, x);
          rymin = min(rymin, y);
          rxmax = max(rxmax, x);
          rymax = max(rymax, y);

          if (hasZ && point.length > 2) {
            z = point[2];

            zmin = min(zmin, z);
            zmax = max(zmax, z);

            rzmin = min(rzmin, z);
            rzmax = max(rzmax, z);
          }

          if (hasM && point.length > midx) {
            m = point[midx];

            mmin = min(mmin, z);
            mmax = max(mmax, z);

            rmmin = min(rmmin, m);
            rmmax = max(rmmax, m); 
          }
        }

        parts.push(new Extent({ xmin: rxmin, ymin: rymin, zmin: rzmin, mmin: rmmin, xmax: rxmax, ymax: rymax, zmax: rzmax, mmax: rmmax, spatialReference:(sr ? sr.clone() : null) }));
      }

      var extent = new Extent({
        xmin: xmin,
        ymin: ymin,
        xmax: xmax,
        ymax: ymax,
        spatialReference: sr ? sr.toJSON() : null
      });

      if (hasZ) {
        extent.zmin = zmin;
        extent.zmax = zmax;
      }

      if (hasM) {
        extent.mmin = mmin;
        extent.mmax = mmax;
      }
      
      // todo remove private prop.
      extent._partwise = parts.length > 1 ? parts : null;

      return extent;
    },

    //----------------------------------
    //  paths
    //----------------------------------

    /**
     * An array of paths that make up the polyline. Each path is an array of XY coordinate pairs in map units.
     * 
     * @name paths
     * @instance
     * @type {number[][][]}
     */
    paths: null,

    //----------------------------------
    //  type
    //----------------------------------
    
    /**
     * For Polyline, the type is always `polyline`.
     *
     * @type {string}
     * @readonly
     */   
    type: "polyline",

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    /**
     * Adds a path, or line segment, to the polyline. When added, the index of the path is incremented by one.
     * 
     * @param   {module:esri/geometry/Point[]} points - An array of points from which to construct the path.
     * @return {module:esri/geometry/Polyline} Returns the polyline with the newly added path added to the geometry.
     */
    addPath: function(/*esri.geometry.Point[] or json.paths[i]*/ points) {
      //summary: Add path to polyline
      // points: esri.geometry.Point[] or json.paths[i]: Points on path or a path in json format
      this.clearCache();
      this._path = this.paths.length;
      this.paths[this._path] = [];

      array.forEach(points, this._addPoint, this);

      return this;
    },


    /**
     * @inheritdoc
     */
    clone: function() {
      var cloned = new Polyline();
      cloned.spatialReference = this.spatialReference;
      cloned.paths = lang.clone(this.paths);
      cloned.hasZ = this.hasZ;
      cloned.hasM = this.hasM;
      return cloned;
    },

    /**
     * Returns a point specified by a path and point in the path.
     * 
     * @param {number} pathIndex - The index of a path in the polyline.
     * @param {number} pointIndex - The index of a point in a path.
     *                            
     * @return {module:esri/geometry/Point} Returns the point along the Polyline located in the given path and point indeces.
     */  
    getPoint: function(pathIndex, pointIndex) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        var arr = this.paths[pathIndex][pointIndex];

        var hasZ = this.hasZ;
        var hasM = this.hasM;

        if (hasZ && hasM) {
          return new Point(arr[0], arr[1], arr[2], arr[3], this.spatialReference);
        } else if (hasZ) {
          return new Point(arr[0], arr[1], arr[2], undefined, this.spatialReference);
        } else if (hasM) {
          return new Point(arr[0], arr[1], undefined, arr[2], this.spatialReference);
        } else {
          return new Point(arr[0], arr[1], this.spatialReference);
        }
      }
    },

    /**
     * Inserts a new point into a polyline.
     * 
     * @param {number} pathIndex - The index of the path in which to insert a point.
     * @param {number} pointIndex - The index of the inserted point in the path.
     * @param {module:esri/geometry/Point} point - Point geometry to insert into the path.                    
     *                            
     * @return {module:esri/geometry/Polyline} Returns the updated polyline.
     */  
    insertPoint: function(pathIndex, pointIndex, /*esri.geometry.Point|[0:x, 1:y, 2:z, 3:m]*/ point) {
      if (
        this._validateInputs(pathIndex) && 
        esriLang.isDefined(pointIndex) && (pointIndex >= 0 && pointIndex <= this.paths[pathIndex].length) 
      ) {
        this.clearCache();

        zmUtils.updateSupportFromPoint(this, point);

        if (!Array.isArray(point)) {
          point = point.toArray();
        }

        this.paths[pathIndex].splice(pointIndex, 0, point);
        return this;
      }
    },

    /**
     * Removes a path from the Polyline. The index specifies which path to remove.
     * 
     * @param {number} index - The index of the path to remove from the polyline.                 
     *                            
     * @return {module:esri/geometry/Point[]} Returns an array of points representing the removed path.
     */  
    removePath: function(index) {
      if (this._validateInputs(index, null)) {
        this.clearCache();
        var arr = this.paths.splice(index, 1)[0],
            i, il = arr.length,
            //point = esri.geometry.Point,
            sr = this.spatialReference;
        for (i = 0; i < il; i++) {
          arr[i] = new Point(arr[i], sr);
        }
        return arr;
      }
    },

    /**
     * Removes a point from the polyline at the given `pointIndex` within the path identified by the given `pathIndex`.
     * 
     * @param {number} pathIndex - The index of the path containing the point to be removed. 
     * @param {number} pointIndex - The index of the point to be removed within the path.                         
     *                            
     * @return {module:esri/geometry/Point} Returns the removed point.
     */  
    removePoint: function(pathIndex, pointIndex) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        this.clearCache();
        return new Point(this.paths[pathIndex].splice(pointIndex, 1)[0], this.spatialReference);
      }
    },

    /**
     * Updates a point in a polyline.
     * 
     * @param {number} pathIndex - The index of the path that contains the point to be updated.
     * @param {number} pointIndex - The index of the point to be updated in the path.
     * @param {module:esri/geometry/Point} point - Point geometry to update in the path.                    
     *                            
     * @return {module:esri/geometry/Polyline} Returns the updated polyline.
     */  
    setPoint: function(pathIndex, pointIndex, /*esri.geometry.Point|[0:x, 1:y, 2:z, 3:m]*/ point) {
      if (this._validateInputs(pathIndex, pointIndex)) {
        this.clearCache();

        zmUtils.updateSupportFromPoint(this, point);

        if (!Array.isArray(point)) {
          point = point.toArray();
        }

        this.paths[pathIndex][pointIndex] = point;
        return this;
      }
    },

    toJSON: function() {
      var sr = this.spatialReference;
      var ret = {
        paths: this.paths,
        spatialReference: sr && sr.toJSON()
      };
      if (this.hasZ) {
        ret.hasZ = true;
      }
      if (this.hasM) {
        ret.hasM = true;
      }
      return ret;
    },
    

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _initPathPointsToArray: function(obj) {
      // Convert paths of points to paths of arrays
      for (var i = 0; i < obj.paths.length; i++) {
        obj.paths[i] = array.map(obj.paths[i], function(point) {
          zmUtils.updateSupportFromPoint(obj, point, true);

          if (!Array.isArray(point)) {
            if (!obj.spatialReference) {
              obj.spatialReference = point.spatialReference;
            }

            point = point.toArray();
          }

          return point;
        });
      }

      return obj;
    },

    _addPoint: function(/*esri.geometry.Point|[0:x, 1:y, 2:z, 3:m]*/ point) {
      // point: esri.geometry.Point: Add point to path
      if (Array.isArray(point)) {
        this.paths[this._path].push(point);
      }
      else {
        this.paths[this._path].push(point.toArray());
      }

      zmUtils.updateSupportFromPoint(this, point);
    },

    _insertPoints: function(/*esri.geometry.Point[]|[0:x, 1:y, 2:z, 3:m][]*/ points, /*int*/ index) {
      //summary: insert points into path at specified path index
      // points: esri.geometry.Point[]: Points to insert into path
      // index: int: Index to insert points in path
      this.clearCache();
      this._path = index;

      if (!this.paths[this._path]) {
        this.paths[this._path] = [];
      }

      array.forEach(points, this._addPoint, this);
    },

    _validateInputs: function(pathIndex, pointIndex) {
      if ((pathIndex !== null && pathIndex !== undefined) && (pathIndex < 0 || pathIndex >= this.paths.length)) {
        return false;
      }

      if ((pointIndex !== null && pathIndex !== undefined) && (pointIndex < 0 || pointIndex >= this.paths[pathIndex].length)) {
        return false;
      }

      return true;
    }

  });

  return Polyline;  
});
