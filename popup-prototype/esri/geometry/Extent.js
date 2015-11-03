/**
 * The minimum and maximum X and Y coordinates of a bounding box. Extent is used
 * to describe the visible portion of a {@link module:esri/views/MapView MapView}. 
 * When working in a {@link module:esri/views/SceneView SceneView}, {@link module:esri/Camera Camera}
 * is used to define the visible part of the map within the view.
 *
 * @module esri/geometry/Extent
 * @since 4.0
 * @see [Sample - Add FeatureLayer to your Map](../sample-code/2d/feature-layer/)
 * @see module:esri/views/MapView
 * @see module:esri/Camera
 */
define(
[
  "../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",
  "dojo/_base/kernel",
  "../core/lang",
  "./SpatialReference",
  "./Geometry",
  "./Point",
  "./support/webMercatorUtils",
  "./support/mathUtils"
],
function(
  declare, array, lang, kernel, esriLang,
  SpatialReference, Geometry, Point, webMercatorUtils, mathUtils
) {

  /**
   * @extends module:esri/geometry/Geometry
   * @constructor module:esri/geometry/Extent
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor. 
   */
  var Extent = declare(Geometry,
  /** @lends module:esri/geometry/Extent.prototype */
  {
    
    declaredClass: "esri.geometry.Extent",

    classMetadata: {
      computed: {
        cache: ["xmin", "ymin", "zmin", "mmin", "xmax", "ymax", "zmax", "mmax"],
        center: ["cache"],
        extent: ["cache"],
        hasM: ["mmin", "mmax"],
        hasZ: ["zmin", "zmax"],
        height: ["ymin", "ymax"],
        width: ["xmin", "xmax"]
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(/*Number|Object*/ xmin, /*Number*/ ymin, /*Number*/ xmax, /*Number*/ ymax, /*SpatialReference*/ spatialReference) {
      if (this.isSR(xmin)) {
        return {
          spatialReference: xmin,
          xmin: 0,
          ymin: 0,
          xmax: 0,
          ymax: 0
        };
      } else if (lang.isObject(xmin)) {
        xmin.spatialReference = xmin.spatialReference || SpatialReference.WGS84;
        return xmin;
      } else {
        return {
          xmin: xmin,
          ymin: ymin,
          xmax: xmax,
          ymax: ymax,
          spatialReference: spatialReference || SpatialReference.WGS84
        };
      }
    },

    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  center
    //----------------------------------

    /**
    * The center point of the extent in map units.
    * 
    * @name center
    * @instance
    * @type {module:esri/geometry/Point}
    */
    _centerGetter: function(cached) {
      if (!cached) {
        cached = new Point({
          spatialReference: this.spatialReference
        });
      }

      cached.x = (this.xmin + this.xmax) * 0.5;
      cached.y = (this.ymin + this.ymax) * 0.5;

      if (this.hasZ) {
        cached.z = (this.zmin + this.zmax) * 0.5;
      }
      if (this.hasM) {
        cached.m = (this.mmin + this.mmax) * 0.5;
      }

      return cached;
    },

    //----------------------------------
    //  extent
    //----------------------------------
    
    _extentGetter: function() {
      return this.clone();
    },

    //----------------------------------
    //  hasM
    //----------------------------------

    _hasMGetter: function() {
      return this.mmin != null && this.mmax != null;
    },
    
    //----------------------------------
    //  hasZ
    //----------------------------------

    _hasZGetter: function() {
      return this.zmin != null && this.zmax != null;
    },
    
    //----------------------------------
    //  height
    //----------------------------------

    /**
    * The height of the extent in pixels (the distance between [ymin](#ymin) and [ymax](#ymax)).
    * 
    * @name height
    * @instance
    * @type {boolean}
    */  
    _heightGetter: function() {
      return Math.abs(this.ymax - this.ymin);
    },
      
    //----------------------------------
    //  spatialReference
    //----------------------------------

    /**
     * @inheritdoc
     * @name spatialReference
     * @instance
     */    
    
    //----------------------------------
    //  type
    //----------------------------------

    /**
     * For Extent, the type is always `extent`.
     *
     * @type {string}
     * @readonly
     */
    type: "extent",

    //----------------------------------
    //  width
    //----------------------------------

    /**
    * The width of the extent in pixels (the distance between [xmin](#xmin) and [xmax](#xmax)).
    * 
    * @name width
    * @instance
    * @type {boolean}
    */  
    _widthGetter: function() {
      return Math.abs(this.xmax - this.xmin);
    },

    //----------------------------------
    //  xmin
    //----------------------------------

    /**
     * The top-left X-coordinate of an extent envelope.
     *
     * @type {number}
     * @default 0
     */
    xmin: 0,

    //----------------------------------
    //  ymin
    //----------------------------------

    /**
     * The bottom-left Y-coordinate of an extent envelope.
     *
     * @type {number}
     * @default 0
     */
    ymin: 0,

    //----------------------------------
    //  mmin
    //----------------------------------

    /**
     * The minimum possible `m` value of an extent envelope.
     * 
     * @type {number}
     * @default undefined
     */
    mmin: undefined,

    //----------------------------------
    //  zmin
    //----------------------------------

    /**
     * The minimum possible `z`, or elevation, value of an extent envelope.
     *
     * @type {number}
     * @default undefined
     */
    zmin: undefined,

    //----------------------------------
    //  xmax
    //----------------------------------

    /**
     * The bottom-right X-coordinate of an extent envelope.
     *
     * @type {number}
     * @default 0
     */
    xmax: 0,

    //----------------------------------
    //  ymax
    //----------------------------------

    /**
     * The top-right Y-coordinate of an extent envelope.
     *
     * @type {number}
     * @default 0
     */
    ymax: 0,

    //----------------------------------
    //  mmax
    //----------------------------------

    /**
     * The maximum possible `m` value in an extent envelope.
     *
     * @type {number}
     * @default undefined
     */
    mmax: undefined,

    //----------------------------------
    //  zmax
    //----------------------------------

    /**
     * The maximum possible `z`, or elevation, value in an extent envelope.
     *
     * @type {number}
     * @default undefined
     */
    zmax: undefined,

    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    /**
     * Centers the extent to the specified {@link module:esri/geometry/Point Point}.
     * A new extent is returned with the same width and height centered at the argument point.
     *
     * @param {module:esri/geometry/Point} point - The point to center the extent.
     *
     * @return {module:esri/geometry/Extent} The new extent with `point` as the [center](#center).
     */
    centerAt: function(point) {
      // TODO: yann6817: centerAt should accept x, y, z and [ x, y, z]
      var center = this.center;

      if (point.z != null && this.hasZ) {
        return this.offset(point.x - center.x, point.y - center.y, point.z - center.z);
      }
      else {
        return this.offset(point.x - center.x, point.y - center.y);
      }
    },

    /**
     * @inheritdoc
     */
    clone: function() {
      var cloned = new Extent();

      cloned.xmin = this.xmin;
      cloned.ymin = this.ymin;
      cloned.xmax = this.xmax;
      cloned.ymax = this.ymax;
      cloned.spatialReference = this.spatialReference;

      if (this.zmin != null) {
        cloned.zmin = this.zmin;
        cloned.zmax = this.zmax;
      }
      if (this.mmin != null) {
        cloned.mmin = this.mmin;
        cloned.mmax = this.mmax;
      }

      return cloned;
    },

    /**
     * Checks if the input geometry is contained within the extent.
     *
     * @param {(module:esri/geometry/Point | module:esri/geometry/Extent)} geometry - Input geometry to test if it is contained within the extent.
     *                                                                              
     * @return {boolean} Returns `true` if the input geometry is contained within the extent.
     */
    contains: function(/*Point | Extent*/ geometry) {
      //summary: Returns true if argument point contained within this Extent
      // returns: boolean: true if contained, else false
      if (!geometry) {
        return false;
      }

      var type = geometry.type;
      
      if (type === "point") {
        var thisSR = this.spatialReference, 
            geomSR = geometry.spatialReference,
            projected, x = geometry.x, y = geometry.y, z = geometry.z;
        
        // Need projection?
        if (thisSR && geomSR && !thisSR.equals(geomSR) && thisSR._canProject(geomSR)) {
          projected = thisSR.isWebMercator() ?
                        Point.lngLatToXY(x, y) :
                        Point.xyToLngLat(x, y, true);
  
          x = projected[0];
          y = projected[1];
        }
        
        if (x >= this.xmin && x <= this.xmax && 
            y >= this.ymin && y <= this.ymax) {
          if (z != null && this.hasZ) {
            return z >= this.zmin && z <= this.zmax;
          }

          return true;
        }

        return false;
      }
      else if (type === "extent") {
        return this._containsExtent(geometry);
      }

      return false;
    },

    /**
     * Indicates if the input extent is equal to the testing extent.
     *
     * @param {module:esri/geometry/Extent} extent - Input extent.
     *                                                                              
     * @return {boolean} Returns `true` if the input extent is equal to the extent that calls `equals()`.
     */  
    equals: function(extent) {
      if (!extent) {
        return false;
      }

      var sr = this.spatialReference;

      if (!sr.equals(extent.spatialReference)) {
        if (webMercatorUtils.canProject(extent.spatialReference, sr)) {
          extent = webMercatorUtils.project(extent, sr);
        }
        else {
          return false;
        }
      }

      return (
        this.xmin === extent.xmin &&
        this.ymin === extent.ymin &&
        this.zmin === extent.zmin &&
        this.mmin === extent.mmin &&
        this.xmax === extent.xmax &&
        this.ymax === extent.ymax &&
        this.zmax === extent.zmax &&
        this.mmax === extent.mmax
      );
    },

    /**
     * Expands the extent by the given factor. For example, a value of 1.5 will expand the extent to be 50 percent larger
     * than the original extent.
     *
     * @param {number} factor - The multiplier value.
     *                                                                              
     * @return {module:esri/geometry/Extent} Returns the expanded extent.
     */
    expand: function(factor) {
      //summary: Expands the Extent object by argument factor. If 0 > factor < 1,
      //         the Extent shrinks. If factor > 1, the Extent expands.
      // factor: Number: Factor to expand the Extent by
      
      var deltaf = (1 - factor) * 0.5,
          deltaw = this.width * deltaf,
          deltah = this.height * deltaf,
          clone = this.clone();
          
      clone.xmin += deltaw;
      clone.ymin += deltah;
      clone.xmax -= deltaw;
      clone.ymax -= deltah;

      if (this.hasZ) {
        var deltad = (this.zmax - this.zmin) * deltaf;

        clone.zmin += deltad;
        clone.zmax -= deltad;
      }

      if (this.hasM) {
        var deltam = (this.mmax - this.mmin) * deltaf;

        clone.mmin += deltam;
        clone.mmax -= deltam;
      }
      
      return clone;
    },

    /**
     * If the input geometry is an Extent, tests to validate if the input extent intersects the
     * testing Extent and returns the intersection extent if both Extents intersect. If the input geometry
     * is of another geometry type (e.g. {@link module:esri/geometry/Point Point}, {@link module:esri/geometry/Polyline Polyline},
     * {@link module:esri/geometry/Polygon Polygon}, or {@link module:esri/geometry/Multipoint Multipoint}), 
     * A Boolean value is returned.
     *
     * @param {module:esri/geometry/Geometry} geometry - The geometry used to test the intersection. 
     *                                                                              
     * @return {module:esri/geometry/Extent | boolean} Returns `true`, if the input geometry is not an Extent and intersects the Extent.
     *                                                 Returns the intersection of the Extents if the input geometry is an Extent and it
     *                                                 intersects the given Extent.
     */
    intersects: function(/*Point | Multipoint | Extent | Polygon | Polyline*/ geometry) {
      if (!geometry) {
        return false;
      }
      var type = geometry.type,
          thisSR = this.spatialReference,
          geomSR = geometry.spatialReference;

      if (thisSR && geomSR && !thisSR.equals(geomSR) && thisSR._canProject(geomSR)) {
        geometry = thisSR.isWebMercator() ?
            webMercatorUtils.geographicToWebMercator(geometry) :
            webMercatorUtils.webMercatorToGeographic(geometry, true);
      }

      switch (type) {
        case "point":
          return this.contains(geometry);
        case "multipoint":
          return this._intersectsMultipoint(geometry);
        case "extent":
          return this._intersectsExtent(geometry);
        case "polygon":
          return this._intersectsPolygon(geometry);
        case "polyline":
          return this._intersectsPolyline(geometry);
      }
    },

    /**
     * Returns an array with either one Extent that's been shifted to within +/- 180 or two Extents 
     * if the original extent intersects the International Dateline.
     * 
     * @return {module:esri/geometry/Extent[]} The normalized Extent(s).
     */
    normalize: function() {
      var result = this._normalize(false, true);
      if (!Array.isArray(result)) {
        result = [result];
      }
      return result; // returns an Extent[]
    },

    /**
     * Returns a new Extent with X and Y offsets. Units are in map units.
     * 
     * @param {number} dx - The offset distance in map units for the X-coordinate.
     * @param {number} dy - The offset distance in map units for the Y-coordinate.
     * @param {number} dz - The offset distance in map units for the Z-coordinate.
     * 
     * @return {module:esri/geometry/Extent} The offset Extent.
     */
    offset: function(dx, dy, dz) {
      // TODO: yann6817: centerAt should accept point and [ dx, dy, dz]
      var clone = this.clone();
      
      clone.xmin += dx;
      clone.ymin += dy;
      clone.xmax += dx;
      clone.ymax += dy;

      if (dz != null) {
        clone.zmin += dz;
        clone.zmax += dz;
      }

      return clone;
    },
    
    /**
     * Returns an extent in a spatial reference with a custom shifted central meridian 
     * if the extent intersects the International Dateline.
     * 
     * @return {module:esri/geometry/Extent} The shifted Extent.
     */
    shiftCentralMeridian: function() {
      return this._normalize(true); // returns an Extent
    },

    toJSON: function() {
      var sr = this.spatialReference;
      
      var ret = { 
        xmin: this.xmin, 
        ymin: this.ymin, 

        xmax: this.xmax, 
        ymax: this.ymax,

        spatialReference: sr && sr.toJSON()
      };

      if (this.hasZ) {
        ret.zmin = this.zmin;
        ret.zmax = this.zmax;
      }

      if (this.hasM) {
        ret.mmax = this.mmax;
        ret.mmin = this.mmin;
      }

      return ret;
    },

    /**
     * Expands the original extent to include the extent of the input Extent.
     * 
     * @param {module:esri/geometry/Extent} extent - The input extent to union.
     * 
     * @return {module:esri/geometry/Extent} The union of the input Extent with the original Extent.
     */
    union: function(extent) {
      var union = {
        xmin: Math.min(this.xmin, extent.xmin), 
        ymin: Math.min(this.ymin, extent.ymin), 
        xmax: Math.max(this.xmax, extent.xmax), 
        ymax: Math.max(this.ymax, extent.ymax), 
        spatialReference: this.spatialReference
      };

      function undefinedMinMax(f, a, b) {
        return a == null ? b : (b == null ? a : f(a, b));
      }

      if (this.hasZ || extent.hasZ) {
        union.zmin = undefinedMinMax(Math.min, this.zmin, extent.zmin);
        union.zmax = undefinedMinMax(Math.max, this.zmax, extent.zmax);
      }

      if (this.hasM || extent.hasM) {
        union.mmin = undefinedMinMax(Math.min, this.mmin, extent.mmin);
        union.mmax = undefinedMinMax(Math.max, this.mmax, extent.mmax);
      }
      
      return new Extent(union);
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _containsExtent: function(extent) {
      var xmin = extent.xmin, ymin = extent.ymin, zmin = extent.zmin,
          xmax = extent.xmax, ymax = extent.ymax, zmax = extent.zmax,

          sr = extent.spatialReference;

      if (zmin != null && this.hasZ) {
        // TODO yann6817 refactor, contains accepting x,y,z,sr
        return (
          this.contains(new Point(xmin, ymin, zmin, sr)) && 
          this.contains(new Point(xmin, ymax, zmin, sr)) && 
          this.contains(new Point(xmax, ymax, zmin, sr)) && 
          this.contains(new Point(xmax, ymin, zmin, sr)) &&

          this.contains(new Point(xmin, ymin, zmax, sr)) && 
          this.contains(new Point(xmin, ymax, zmax, sr)) && 
          this.contains(new Point(xmax, ymax, zmax, sr)) && 
          this.contains(new Point(xmax, ymin, zmax, sr))
        );
      } else {
        return (
          this.contains(new Point(xmin, ymin, sr)) && 
          this.contains(new Point(xmin, ymax, sr)) && 
          this.contains(new Point(xmax, ymax, sr)) && 
          this.contains(new Point(xmax, ymin, sr))
        );
      }
    },

    _intersectsMultipoint: function(multipoint) {
      var len = multipoint.points.length, i;
      for (i = 0; i < len; i++) {
        if (this.contains(multipoint.getPoint(i))) {
          return true;
        }
      }
      return false;
    },

    _intersectsExtent: function(extent) {
      var xmin, ymin, zmin, width, height, depth, emptyIntersection = false;
      var hasZ = this.hasZ && extent.hasZ;

      // check on horizontal overlap
      if (this.xmin <= extent.xmin) {
        xmin = extent.xmin;
        if (this.xmax < xmin) {
          emptyIntersection = true;
        }
        else {
          width = Math.min(this.xmax, extent.xmax) - xmin;
        }
      }
      else {
        xmin = this.xmin;
        if (extent.xmax < xmin) {
          emptyIntersection = true;
        }
        else {
          width = Math.min(this.xmax, extent.xmax) - xmin;
        }
      }

      // check on vertical overlap
      if (this.ymin <= extent.ymin) {
        ymin = extent.ymin;
        if (this.ymax < ymin) {
          emptyIntersection = true;
        }
        else {
          height = Math.min(this.ymax, extent.ymax) - ymin;
        }
      }
      else {
        ymin = this.ymin;
        if (extent.ymax < ymin) {
          emptyIntersection = true;
        }
        else {
          height = Math.min(this.ymax, extent.ymax) - ymin;
        }
      }

      // check on Z overlap
      if (hasZ) {
        if (this.zmin <= extent.zmin) {
          zmin = extent.zmin;
          
          if (this.zmax < zmin) {
            emptyIntersection = true;
          }
          else {
            depth = Math.min(this.zmax, extent.zmax) - zmin;
          }
        }
        else {
          zmin = this.zmin;
          
          if (extent.zmax < zmin) {
            emptyIntersection = true;
          }
          else {
            depth = Math.min(this.zmax, extent.zmax) - zmin;
          }
        }
      }

      if (emptyIntersection) {
        return null;
      }

      extent = {
        xmin: xmin,
        ymin: ymin,
        xmax: xmin + width,
        ymax: ymin + height,
        spatialReference: this.spatialReference
      };

      if (hasZ) {
        extent.zmin = zmin;
        extent.zmax = zmin + depth;
      }

      // TODO yann6817 - M support

      extent = new Extent(extent);
    },
    
    _intersectsPolygon: function(polygon) {
      // Convert this extent into line segments
      var topLeft =  [ this.xmin, this.ymax ], topRight = [ this.xmax, this.ymax ],
          bottomLeft = [ this.xmin, this.ymin ], bottomRight = [ this.xmax, this.ymin ],
          corners = [ topLeft, topRight, bottomLeft, bottomRight ],
          extentLines = [
            [ bottomLeft,  topLeft ],
            [ topLeft,     topRight ],
            [ topRight,    bottomRight ],
            [ bottomRight, bottomLeft ]
          ],
          i, j, rings = polygon.rings, ringsLength = rings.length, ring, len,
          point = new Point(0, 0, this.spatialReference);

      // Check if the polygon contains any of the points
      // defining the extent
      len = corners.length;
      for (i = 0; i < len; i++) {
        point.x = corners[i][0];
        point.y = corners[i][1];
        if (polygon.contains(point)) {
          return true;
        }
      }
      
      point.spatialReference = polygon.spatialReference;
      
      // Check if any line segment of the extent and polygon intersect
      // each other
      var pi, pj;
      for(i = 0; i < ringsLength; i++) {
        ring = rings[i];
        len = ring.length;
        
        // Ideally we don't expect a ring to be empty.
        // However we have seen this in the wild
        if (!len) {
          continue;
        }
        
        pi = ring[0];
        
        // check if the first point in this ring
        // is within this extent
        point.x = pi[0];
        point.y = pi[1];
        
        if (this.contains(point)) {
          return true;
        }

        for(j = 1; j < len; j++) {
          pj = ring[j];
          point.x = pj[0];
          point.y = pj[1];
          if (this.contains(point) || this._intersectsLine([pi, pj], extentLines)) {
            return true;
          }
          pi = pj;
        }
      }
      
      return false;
    },
    
    _intersectsPolyline: function(polyline) {
      // Convert this extent into line segments 
      var extentLines = [
        [ [ this.xmin, this.ymin ], [ this.xmin, this.ymax ] ],
        [ [ this.xmin, this.ymax ], [ this.xmax, this.ymax ] ],
        [ [ this.xmax, this.ymax ], [ this.xmax, this.ymin ] ],
        [ [ this.xmax, this.ymin ], [ this.xmin, this.ymin ] ]
      ];
      
      // Check if any line segment of the extent and polyline intersect
      // each other
      var i, j, paths = polyline.paths, pathsLength = paths.length, path, len; 
      var pi, pj, point = new Point(0, 0, polyline.spatialReference);
      
      for(i = 0; i < pathsLength; i++) {
        path = paths[i];
        len = path.length;
        
        // Ideally we don't expect a path to be empty.
        // However we have seen this in the wild
        if (!len) {
          continue;
        }
        
        pi = path[0];
        
        // check if the first point in this path
        // is within this extent
        point.x = pi[0];
        point.y = pi[1];
        if (this.contains(point)) {
          return true;
        }
        
        for(j = 1; j < len; j++) {
          pj = path[j];
          point.x = pj[0];
          point.y = pj[1];
          if (this.contains(point) || this._intersectsLine([pi, pj], extentLines)) {
            return true;
          }
          pi = pj;
        }
      }

      return false;
    },
    
    // Returns "true" if the given line intersects this extent
    _intersectsLine: function(/*[[x1, y1], [x2, y2]]*/ line, extentLines) {
      var check = mathUtils._getLineIntersection2, i, len = extentLines.length;
      
      for (i = 0; i < len; i++ ) {
        if (check(line, extentLines[i])) {
          return true;
        }
      }
      
      return false;
    },

    _shiftCM: function(info) {
      // Shift the central meridian if necessary and adjust the
      // extent accordingly

      var shifted = this.cache._shifted;
      if (!shifted) {
        var newExtent = this.clone(), 
            sr = newExtent.spatialReference;
        
        info = info || sr._getInfo();
        if (info) {
          var newMeridian = this._getCM(info);
          
          if (newMeridian) {
            // Adjust extent
            var meridianInDeg = sr.isWebMercator() ? webMercatorUtils.webMercatorToGeographic(newMeridian) : newMeridian;
            newExtent.xmin -= newMeridian.x;
            newExtent.xmax -= newMeridian.x;
            
            // GCS seems to have a problem with CM > 720
            if (!sr.isWebMercator()) {
              meridianInDeg.x = this._normalizeX(meridianInDeg.x, info).x;
            }
  
            // Set central meridian via WKT
            //newExtent.spatialReference.wkt = info.wkTemplate.replace(/\[\"Central_Meridian\",[^\]]+\]/, "\[\"Central_Meridian\"," + meridianInDeg.x + "\]");
            newExtent.spatialReference =
              new SpatialReference(
                esriLang.substitute(
                  {
                    Central_Meridian: meridianInDeg.x 
                  }, 
                  sr.wkid === 4326 ? info.altTemplate : info.wkTemplate
                )
              )
            ;
          }
        }

        shifted = newExtent;
        this.cache._shifted = shifted;
      }
      
      return shifted;
    },
    
    _getCM: function(info) {
      // Returns a new central meridian if the extent
      // intersects beyond +/- 180 span
      
      var newMeridian, minus180 = info.valid[0], plus180 = info.valid[1],
          xmin = this.xmin, xmax = this.xmax;
      
      //if ( this.getWidth() <= (2 * plus180) ) {
        var isMinValid = (xmin >= minus180 && xmin <= plus180),
            isMaxValid = (xmax >= minus180 && xmax <= plus180);
            
        // TODO
        // We can normalize xmin and xmax before doing
        // this comparison coz we don't have to shift CM
        // for an extent which when normalized does not
        // cross 180
            
        if (!(isMinValid && isMaxValid)) {
          newMeridian = this.center;
        }
      //}
      
      //console.log("_getCM: ", newMeridian && newMeridian.x);
      
      return newMeridian;
    },
    
    _normalize: function(shift, sameType, info) {
      // Returns normalized extent or a polygon with two rings
      // TODO
      // Add test cases
      
      var newExtent = this.clone(), 
          sr = newExtent.spatialReference;
      
      if (sr) {
        info = info || sr._getInfo();
        if (info) {
          
          var extents = array.map(this._getParts(info), function(part) {
            return part.extent;
          });    
          
          if (extents.length > 2) {
            if (shift) {
              return this._shiftCM(info);
            }
            else {
              // _getParts returns more than 2 extents for graphics pipeline.
              // We don't need them here. In this case, it is the entire world
              return newExtent.set({
                xmin: info.valid[0],
                xmax: info.valid[1],
                spatialReference: sr
              });
            }
          }
          else if (extents.length === 2) {
            // Let's convert the extent to polygon only
            // when necessary
            if (shift) {
              return this._shiftCM(info);
            }
            else {
              if (sameType) {
                return extents;
              }

              var hasZ = true, hasM = true;

              array.map(extents, function(extent) {
                if (!extent.hasZ) {
                  hasZ = false;
                }

                if (!extent.hasM) {
                  hasM = false;
                }
              });

              return /*new Polygon(*/{
                "rings": array.map(extents, function(extent) {
                  var ret = [ 
                    [ extent.xmin, extent.ymin ], [ extent.xmin, extent.ymax ], 
                    [ extent.xmax, extent.ymax ], [ extent.xmax, extent.ymin ],
                    [ extent.xmin, extent.ymin ] 
                  ];
                  
                  if (hasZ) {
                    var z = (extent.zmax - extent.zmin) / 2;

                    for (var i = 0; i < ret.length; i++) {
                      ret[i].push(z);
                    }
                  }

                  if (hasM) {
                    var m = (extent.mmax - extent.mmin) / 2;

                    for (i = 0; i < ret.length; i++) {
                      ret[i].push(m);
                    }
                  }

                  return ret;
                }),
                "hasZ": hasZ,
                "hasM": hasM,
                "spatialReference": sr
              }; //);
            }
          }
          else {
            return extents[0] || newExtent;
          }
        }
      }

      return newExtent;
    },
    
    _getParts: function(info) {
      // Split this extent into one or more valid
      // extents (parts) if necessary. Also return 
      // the world frames that these parts intersect

      var parts = this.cache._parts;
      if (!parts) {
        parts = [];

        var xmin = this.xmin, xmax = this.xmax, 
            ymin = this.ymin, ymax = this.ymax, sr = this.spatialReference,
            linearWidth = this.width, linearXmin = xmin, linearXmax = xmax,
            minFrame = 0, maxFrame = 0, nrml, minus180, plus180, nexus;
        
        info = info || sr._getInfo();
        minus180 = info.valid[0];
        plus180 = info.valid[1];
  
        nrml = this._normalizeX(xmin, info);
        xmin = nrml.x;
        minFrame = nrml.frameId;
        
        nrml = this._normalizeX(xmax, info);
        xmax = nrml.x;
        maxFrame = nrml.frameId;
        
        nexus = (xmin === xmax && linearWidth > 0);
        
        if (linearWidth > (2 * plus180)) { // really wide extent!
          var E1 = new Extent(linearXmin < linearXmax ? xmin : xmax, ymin, plus180, ymax, sr),
              E2 = new Extent(minus180, ymin, linearXmin < linearXmax ? xmax : xmin, ymax, sr),
              E3 = new Extent(0, ymin, plus180, ymax, sr),
              E4 = new Extent(minus180, ymin, 0, ymax, sr),
              k, framesE3 = [], framesE4 = [];
              
          if (E1.contains(E3)) {
            framesE3.push(minFrame);
          }
          if (E1.contains(E4)) {
            framesE4.push(minFrame);
          }
          if (E2.contains(E3)) {
            framesE3.push(maxFrame);
          }
          if (E2.contains(E4)) {
            framesE4.push(maxFrame);
          }
          
          for (k = minFrame + 1; k < maxFrame; k++) {
            framesE3.push(k);
            framesE4.push(k);
          }
          
          parts.push(
            { extent: E1, frameIds: [ minFrame ] }, 
            { extent: E2, frameIds: [ maxFrame ] }, 
            { extent: E3, frameIds: framesE3 }, 
            { extent: E4, frameIds: framesE4 }
          );
        }
        else if ((xmin > xmax) || nexus) { // extent crosses dateline (partly invalid)
          parts.push(
            {
              extent: new Extent(xmin, ymin, plus180, ymax, sr),
              frameIds: [ minFrame ]
            }, 
            {
              extent: new Extent(minus180, ymin, xmax, ymax, sr),
              frameIds: [ maxFrame ]
            }
          );
        }
        else { // a valid extent
          parts.push({
            extent: new Extent(xmin, ymin, xmax, ymax, sr),
            frameIds: [ minFrame ]
          });
        }
       
        this.cache._parts = parts;
      }

      var hasZ = this.hasZ;
      var hasM = this.hasM;

      if (hasZ || hasM) {
        var props = {};

        if (hasZ) {
          props.zmin = this.zmin;
          props.zmax = this.zmax;
        }

        if (hasM) {
          props.mmin = this.mmin;
          props.mmax = this.mmax;
        }

        for (var i = 0; i < parts.length; i++) {
          parts[i].extent.set(props);
        }
      }
      
      return parts;
    },
    
    _normalizeX: function(x, info) {
      // Shifts "x" to within +/- 180 span
      // Calculates the world frame where "x" lies (Point::normalize does not do this)
      
      // TODO
      // Move these tests as proper unit tests
      
      /*// Test cases:
      var info, res;
      info = esri.SpatialReference.prototype._info["4326"];
      res = esri.geometry.Extent.prototype._normalizeX(-200, info);
      console.log(res.x === 160, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(-528, info);
      console.log(res.x === -168, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(-1676, info);
      console.log(res.x === 124, res.frameId === -5);
      res = esri.geometry.Extent.prototype._normalizeX(-181, info);
      console.log(res.x === 179, res.frameId === -1);
      res = esri.geometry.Extent.prototype._normalizeX(250, info);
      console.log(res.x === -110, res.frameId === 1);
      res = esri.geometry.Extent.prototype._normalizeX(896, info);
      console.log(res.x === 176, res.frameId === 2);
      res = esri.geometry.Extent.prototype._normalizeX(181, info);
      console.log(res.x === -179, res.frameId === 1);
      res = esri.geometry.Extent.prototype._normalizeX(2346, info);
      console.log(res.x === -174, res.frameId === 7);*/
      
      var frameId = 0, minus180 = info.valid[0], plus180 = info.valid[1], world = 2 * plus180, ratio;
      
      if (x > plus180) {
        ratio = Math.ceil(Math.abs(x - plus180) / world);
        x -= (ratio * world);
        frameId = ratio;
      }
      else if (x < minus180) {
        ratio = Math.ceil(Math.abs(x - minus180) / world);
        x += (ratio * world);
        frameId = -ratio;
      }

      return { x: x, frameId: frameId };
    },

    //--------------------------------------------------------------------------
    //
    //  Legacy
    //
    //--------------------------------------------------------------------------

    getWidth: function() {
      kernel.deprecated(this.declaredClass + ".getWidth", "Use .width instead", "4.0");
      return this.width;
    },

    getHeight: function() {
      kernel.deprecated(this.declaredClass + ".getHeight", "Use .height instead", "4.0");
      return this.height;
    },

    getCenter: function() {
      kernel.deprecated(this.declaredClass + ".getCenter", "Use .center instead", "4.0");
      return this.center;
    },

    update: function(xmin, ymin, xmax, ymax, sr) {
      kernel.deprecated(this.declaredClass + ".update", "Use .set instead", "4.0");

      this.set({
        xmin: xmin,
        ymin: ymin,
        xmax: xmax,
        ymax: ymax,
        spatialReference: sr
      });
    }

  });
  
  return Extent;  
});
