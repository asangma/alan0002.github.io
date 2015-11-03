/**
 * An array of rings where each ring is an array of points. The first and last points of a ring must be the same.
 *
 * @module esri/geometry/Polygon
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 */
define(
[

  "dojo/_base/array",
  "dojo/_base/lang",

  "../core/declare",
  "../core/lang",

  "./SpatialReference",
  "./Geometry",
  "./Point",
  "./Extent",

  "./support/coordsUtils",
  "./support/mathUtils",
  "./support/webMercatorUtils"
],
function(
  array, lang,
  declare, esriLang,
  SpatialReference, Geometry, Point, Extent,
  coordsUtils, mathUtils, webMercatorUtils
) {

  var comparator = function comparator(f) {
    return function(a, b) {
      return a == null ? b : (b == null ? a : f(a, b));
    };
  };

  var min = comparator(Math.min);
  var max = comparator(Math.max);

  var number = "number";
  
  /**
   * @extends module:esri/geometry/Geometry
   * @constructor module:esri/geometry/Polygon
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Polygon = declare(Geometry,
  /** @lends module:esri/geometry/Polygon.prototype */
  {
    declaredClass: "esri.geometry.Polygon",

    classMetadata: {
      computed: {
        cache: ["hasM", "hasZ", "rings"],
        extent: ["cache"],
        centroid: ["cache"],
        isSelfIntersecting: ["cache"]
      }
    },
    
    /**
     * For Polygon, the type is always `polygon`.
     *
     * @type {string}
     * @readonly
     */   
    type: "polygon",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(kwArgs) {
      return {
        rings: []
      };
    },

    normalizeCtorArgs: function(obj, spatialReference) {
      var rings = null;
      var hasZ = undefined;
      var hasM = undefined;
      var point = null;

      // pick the initial values
      if (obj && !Array.isArray(obj)) {
        rings = obj.rings ? obj.rings : null;

        if (!spatialReference) {
          if (obj.spatialReference) {
            spatialReference = obj.spatialReference;
          } else if (!obj.rings) {
            spatialReference = obj;
          }
        }

        hasZ = obj.hasZ;
        hasM = obj.hasM;
      }
      else {
        rings = obj;
      }

      rings = rings || [];
      spatialReference = spatialReference || SpatialReference.WGS84;

      // transforms number[][] to number[][][]
      if (rings.length && rings[0] && rings[0][0] != null && typeof rings[0][0] == number) {
        rings = [rings];
      }

      // get the 1st point
      point = rings[0] && rings[0][0];

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
        rings: rings,
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

    _ring: 0,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  centroid
    //----------------------------------

    /**
     * The centroid of the polygon. For a polygon with multiple rings, 
     * it represents the centroid of the largest ring.
     *
     * @name centroid
     * @instance
     * @type {module:esri/geometry/Point}
     */
    _centroidGetter: function(cached) {
      var cen = coordsUtils.centroid([], this.rings, this.hasZ);
      
      if (isNaN(cen[0]) || isNaN(cen[1]) || (this.hasZ && isNaN(cen[2]))) {
        return null;
      }

      cached = cached || new Point();
      cached.x = cen[0];
      cached.y = cen[1];
      cached.spatialReference = this.spatialReference;
      if (this.hasZ) {
        cached.z = cen[2];
      }

      return cached;
    },

    //----------------------------------
    //  extent
    //----------------------------------

    _extentGetter: function(cached) {  
      var rings = this.rings,
          pal = rings.length;

      if (!pal || !rings[0].length) {
        return null;
      }

      var ring, point, x, y, z, m, xmax, ymax, zmax, mmax, pa, pt, ptl,
          xmin = (xmax = rings[0][0][0]),
          ymin = (ymax = rings[0][0][1]),
          zmin, mmin,
          sr = this.spatialReference, 
          parts = [], rxmin, rxmax, rymin, rymax, rzmin, rzmax, rmmin, rmmax,
          hasZ = this.hasZ,
          hasM = this.hasM,
          midx = hasZ ? 3 : 2;
          
      for (pa=0; pa<pal; pa++) {
        ring = rings[pa];
        rxmin = (rxmax = ring[0] && ring[0][0]);
        rymin = (rymax = ring[0] && ring[0][1]);
        ptl = ring.length;

        rzmin = rzmax = undefined;
        rmmin = rmmax = undefined;
        
        for (pt=0; pt < ptl; pt++) {
          point = ring[pt];
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

            mmin = min(zmin, m);
            mmax = max(zmax, m);

            rmmin = min(rzmin, m);
            rmmax = max(rzmax, m);
          }
        }

        parts.push(new Extent({
          xmin: rxmin,
          ymin: rymin,
          zmin: rzmin,
          mmin: rmmin,
          xmax: rxmax,
          ymax: rymax,
          zmax: rzmax,
          mmax: rmmax,
          spatialReference: sr
        }));
      }

      var extent = cached || new Extent();
      extent.xmin = xmin;
      extent.ymin = ymin;
      extent.xmax = xmax;
      extent.ymax = ymax;
      extent.spatialReference = sr;

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
    //  isSelfIntersecting
    //----------------------------------

    /**
     * Checks to see if polygon rings cross each other and indicates if the polygon is 
     * self-intersecting, which means the ring of the polygon crosses itself. 
     *
     * @name isSelfIntersecting
     * @instance
     * @type {boolean}
     */
    _isSelfIntersectingGetter: function () {
      var rings = this.rings; 
      
      var ringCount = rings.length,
          ring, i, j, k, m,
          line1, line2, intersectResult,
          vertexCount, compareLineCount;
      
      for (k = 0; k < ringCount; k++) {
        ring = rings[k];
        //check if rings cross each other
        for (i = 0; i < ring.length - 1; i++) {
          line1 = [
            [ring[i][0], ring[i][1]],
            [ring[i + 1][0], ring[i + 1][1]]
          ];
          for (j = k + 1; j < ringCount; j++){
            for (m = 0; m < rings[j].length - 1; m++){
              line2 = [
                [rings[j][m][0], rings[j][m][1]],
                [rings[j][m + 1][0], rings[j][m + 1][1]]
              ];
              intersectResult = mathUtils._getLineIntersection2(line1, line2);
              if (intersectResult) {
                //in case the intersecting point is the start/end point of the compared lines
                if(!((intersectResult[0] === line1[0][0] && intersectResult[1] === line1[0][1]) ||
                   (intersectResult[0] === line2[0][0] && intersectResult[1] === line2[0][1]) ||
                   (intersectResult[0] === line1[1][0] && intersectResult[1] === line1[1][1]) ||
                   (intersectResult[0] === line2[1][0] && intersectResult[1] === line2[1][1]))){
                  return true;
                }
              }            
            }
          }
        }
        //check if the ring self intersecting
        vertexCount = ring.length;
        if (vertexCount <= 4) {
          // the ring is a triangle
          continue;
        }
        for (i = 0; i < vertexCount - 3; i++) {
          compareLineCount = vertexCount - 1;
          if (i === 0) {
            compareLineCount = vertexCount - 2;
          }
          line1 = [
            [ring[i][0], ring[i][1]],
            [ring[i + 1][0], ring[i + 1][1]]
          ];
          for (j = i + 2; j < compareLineCount; j++) {
            line2 = [
              [ring[j][0], ring[j][1]],
              [ring[j + 1][0], ring[j + 1][1]]
            ];
            intersectResult = mathUtils._getLineIntersection2(line1, line2);
            if (intersectResult) {
              //in case the intersecting point is the start/end point of the compared lines
              if(!((intersectResult[0] === line1[0][0] && intersectResult[1] === line1[0][1]) ||
                 (intersectResult[0] === line2[0][0] && intersectResult[1] === line2[0][1]) ||
                 (intersectResult[0] === line1[1][0] && intersectResult[1] === line1[1][1]) ||
                 (intersectResult[0] === line2[1][0] && intersectResult[1] === line2[1][1]))){
                return true;
              }
            }
          }
        }
      }
      return false;
    },

    //----------------------------------
    //  rings
    //----------------------------------

    /**
     * An array of rings. Each ring is made up of at least one path containing three or more points.
     *
     * @name rings
     * @instance
     * @type {number[][][]}
     */
    rings: null,


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Adds a ring to the Polygon. The ring can be one of the following: an array of numbers or an array of points. 
     * When added the index of the ring is incremented by one.
     * 
     * @param   {module:esri/geometry/Point[] | number[][]} ring - A polygon ring. The first and last coordinates/points
     *                                                           in the ring must be the same. This can either be defined as an array of 
     *                                                           Point geometries or an array of XY coordinates.
     *                                                           
     * @return {module:esri/geometry/Polygon} Returns the polygon with the new ring included.
     */
    addRing: function(/*esri.geometry.Point[]|[0:x, 1:y, 2:z, 3:m][]*/ points) {
      if (!points) {
        return;
      }
      this.clearCache();

      var rings = this.rings;
      var index = rings.length;

      if (Array.isArray(points[0])) {
        rings[index] = points.concat();
      }
      else {
        var ring = [];
        rings[index] = ring;
        // support for Point instances
        for (var i = 0, n = points.length; i < n; i++) {
          ring[i] = points[i].toArray();
        }
      }
      return this;
    },

    /**
     * @inheritdoc
     */
    clone: function() {
      var cloned = new Polygon();
      cloned.spatialReference = this.spatialReference;
      cloned.rings = lang.clone(this.rings);
      cloned.hasZ = this.hasZ;
      cloned.hasM = this.hasM;
      return cloned;
    },
    
    /**
     * Checks on the client if the input point is inside the polygon. A point on the polygon line is considered inside.
     * 
     * @param   {module:esri/geometry/Point} point - The point to test whether it is contained within the testing polygon.
     *                                             
     * @return {boolean} Returns `true` if the point is located inside the polygon.
     */
    contains: function(point) {
      if (!point) {
        return false;
      }
      if (webMercatorUtils.canProject(point, this.spatialReference)) {
        point = webMercatorUtils.project(point, this.spatialReference);
      }
      return coordsUtils.contains(this.rings, coordsUtils.fromGeom(point));
    },

    /**
     * Checks if a Polygon ring is clockwise.
     * 
     * @param   {module:esri/geometry/Point[] | number[][]} ring - A polygon ring. The first and last coordinates/points
     *                                                           in the ring must be the same. This can either be defined as an array of 
     *                                                           Point geometries or an array of XY coordinates.
     * @return {boolean} Returns `true` if the ring is clockwise and `false` for counterclockwise.
     */
    isClockwise: function(/*[[0:x, 1:y, 2:z, 3:m]], ring/path*/ arr) {
      //summary: Returns true if Polygon ring is clockwise.
      // arr: esri.geometry.Point[]: Points array representing polygon path
      // returns: Boolean: True if ring is clockwise
      var areaY = 0, areaZ = 0, areaM = 0, i, il = arr.length,
          p1, p2, midx,
          hasZ = this.hasZ,
          hasM = this.hasM;

      for (i = 0; i < il; i++) {
        p1 = arr[i];
        p2 = arr[(i + 1) % il];

        if (Array.isArray(p1)) {
          areaY += p1[0] * p2[1] - p2[0] * p1[1];
          midx = 2;

          if (p1.length > 2 && p2.length > 2 && hasZ) {
            areaZ += p1[0] * p2[2] - p2[0] * p1[2];
            midx = 3;
          }

          if (p1.length > midx && p2.length > midx && hasM) {
            areaM += p1[0] * p2[midx] - p2[0] * p1[midx];
          }
        } else {
          areaY += p1.x * p2.y - p2.x * p1.y;

          if (p1.hasZ && p2.hasZ) {
            areaZ += p1.x * p2.z - p2.x * p1.z;
          }

          if (p1.hasM && p2.hasM) {
            areaM += p1.x * p2.m - p2.x * p1.m;
          }
        }
      }
      
      return areaY <= 0 && areaZ <= 0 && areaM <= 0;
    },

    /**
     * Returns a point specified by a ring and point in the path.
     * 
     * @param {number} ringIndex - The index of the ring containing the desired point.
     * @param {number} pointIndex - The index of the desired point within the ring.                           
     *                                                           
     * @return {module:esri/geometry/Point} Returns the point at the specified ring index and point index.
     */  
    getPoint: function(ringIndex, pointIndex) {
      //summary: 
      if (this._validateInputs(ringIndex, pointIndex)) {
        var arr = this.rings[ringIndex][pointIndex];

        var hasZ = this.hasZ;
        var hasM = this.hasM;

        if (hasZ && !hasM) {
          return new Point(arr[0], arr[1], arr[2], undefined, this.spatialReference);
        } else if (hasM && hasZ) {
          return new Point(arr[0], arr[1], undefined, arr[2], this.spatialReference);
        } else if (hasZ && hasM) {
          return new Point(arr[0], arr[1], arr[2], arr[3], this.spatialReference);
        } else {
          return new Point(arr[0], arr[1], this.spatialReference);
        }
        
        /*var point = this.rings[ringIndex][pointIndex];
        point = new esri.geometry.Point(point[0], point[1], this.spatialReference);
        point.set("spatialReference", this.spatialReference);
        return point;*/
      }
    },

    /**
     * Inserts a new point into the polygon.
     * 
     * @param {number} ringIndex - The index of the ring in which to insert the point.
     * @param {number} pointIndex - The index of the point to insert within the ring.  
     * @param {module:esri/geometry/Point} point - The point geometry to insert.                     
     *                                                           
     * @return {module:esri/geometry/Polygon} Returns the updated polygon.
     */   
    insertPoint: function(ringIndex, pointIndex, /*esri.geometry.Point|[0:x, 1:y, 2:z, 3:m]*/ point) {
      // Note: its the caller's responsibility to make sure the ring is 
      // properly closed i.e. first and the last point should be the same
      
      if (
        this._validateInputs(ringIndex) &&
        esriLang.isDefined(pointIndex) && (pointIndex >= 0 && pointIndex <= this.rings[ringIndex].length)
      ) {
        this.clearCache();
        this.rings[ringIndex].splice(pointIndex, 0, point);
        return this;
      }
    },
    
    /**
     * Removes a point from the polygon at the given `pointIndex` within the ring identified by `ringIndex`.
     * 
     * @param {number} ringIndex - The index of the ring containing the point to remove. 
     * @param {number} pointIndex - The index of the point to remove within the ring.
     *                                                           
     * @return {module:esri/geometry/Point[]} Returns the geometry of the removed point.
     */  
    removePoint: function(ringIndex, pointIndex) {
      if (this._validateInputs(ringIndex, pointIndex)) {
        this.clearCache();
        return new Point(this.rings[ringIndex].splice(pointIndex, 1)[0], this.spatialReference);
      }
    },

    /**
     * Removes a ring from the Polygon. The index specifies which ring to remove.
     * 
     * @param {number} index - The index of the ring to remove.                  
     *                                                           
     * @return {module:esri/geometry/Point[]} Returns array of points representing the removed ring.
     */  
    removeRing: function(index) {
      if (this._validateInputs(index, null)) {
        this.clearCache();
        var arr = this.rings.splice(index, 1)[0],
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
     * Updates a point in the polygon.
     * 
     * @param {number} ringIndex - The index of the ring containing the point to update.
     * @param {number} pointIndex - The index of the point to update within the ring.  
     * @param {module:esri/geometry/Point} point - The new point geometry.                     
     *                                                           
     * @return {module:esri/geometry/Polygon} Returns the updated polygon.
     */  
    setPoint: function(ringIndex, pointIndex, /*esri.geometry.Point|[0:x, 1:y, 2:z, 3:m]*/ point) {
      if (this._validateInputs(ringIndex, pointIndex)) {
        this.clearCache();
        if (!Array.isArray(point)) {
          point = point.toArray();
        }
        this.rings[ringIndex][pointIndex] = point;
        return this;
      }
    },

    toJSON: function() {
      var sr = this.spatialReference;
      var ret = {
        rings: this.rings,
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

    _insertPoints: function(/*esri.geometry.Point[]*/ points, /*int*/ index) {
      //summary: insert points into ring at specified ring index
      // points: esri.geometry.Point[]: Points to insert into path
      // index: int: Index to insert points in path
      this.clearCache();
      this._ring = index;
      if (!this.rings[this._ring]) {
        this.rings[this._ring] = [];
      }
      array.forEach(points, this._addPoint, this);
    },

    _validateInputs: function(ringIndex, pointIndex) {
      if ((ringIndex !== null && ringIndex !== undefined) && (ringIndex < 0 || ringIndex >= this.rings.length)) {
        return false;
      }
      if ((pointIndex !== null && ringIndex !== undefined) && (pointIndex < 0 || pointIndex >= this.rings[ringIndex].length)) {
        return false;
      }
      return true;
    }
  });
  
  Polygon.createEllipse = function(params) {
    var dx = params.center.x,
        dy = params.center.y,
        dz = params.center.z,
        dm = params.center.m,
        a = params.longAxis,
        b = params.shortAxis,
        numberOfPoints = params.numberOfPoints,
        map = params.map,
        pt, i, cosZeta, sinZeta,
        ring = [],
        angle = (2 * Math.PI) / numberOfPoints;

    for (i = 0; i < numberOfPoints; i++) {
      cosZeta = Math.cos(i*angle);
      sinZeta = Math.sin(i*angle);

      pt = map.toMap({
        x: a * cosZeta + dx,
        y: b * sinZeta + dy
      });

      if (dz != null && !pt.hasZ) {
        pt.z = dz;
      }

      if (dm != null && !pt.hasM) {
        pt.m = dm;
      }

      ring.push(pt);
    }

    ring.push(ring[0]);
    
    return new Polygon({
      rings: [ring],
      spatialReference: map.spatialReference
    });
  };
  
  Polygon.createCircle = function(params) {
    var ellipseParams = {
      center: params.center,
      longAxis: params.r,
      shortAxis: params.r,
      numberOfPoints: params.numberOfPoints,
      map: params.map
    };        

    return Polygon.createEllipse(ellipseParams);
  };

  Polygon.fromExtent = function(extent) {
    var extents = extent.normalize(),
        sr = extent.spatialReference,
        hasZ = false,
        hasM = false;

    array.map(extents, function(extent) {
      if (extent.hasZ) {
        hasZ = true;
      }

      if (extent.hasM) {
        hasM = true;
      }
    });

    var pl = {
      "rings": array.map(extents, function(extent) {
        var ret = [
          [ extent.xmin, extent.ymin ],
          [ extent.xmin, extent.ymax ],
          [ extent.xmax, extent.ymax ],
          [ extent.xmax, extent.ymin ],
          [ extent.xmin, extent.ymin ]
        ];

        if (hasZ && extent.hasZ) {
          var z = (extent.zmax - extent.zmin) / 2;

          for (var i = 0; i < ret.length; i++) {
            ret[i].push(z);
          }
        }

        if (hasM && extent.hasM) {
          var m = (extent.mmax - extent.mmin) / 2;

          for (i = 0; i < ret.length; i++) {
            ret[i].push(m);
          } 
        }

        return ret;
      }),

      "spatialReference": sr ? sr.toJSON() : null
    };

    if (hasZ) {
      pl.hasZ = true;
    }

    if (hasM) {
      pl.hasM = true;
    }

    return new Polygon(pl);
  };

  return Polygon;  
});
