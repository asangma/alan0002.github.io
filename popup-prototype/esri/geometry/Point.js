/**
 * A location defined by X and Y coordinates.
 *
 * @module esri/geometry/Point
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 * @see module:esri/geometry/Multipoint
 * @see module:esri/geometry/ScreenPoint
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/kernel",

  "./SpatialReference",
  "./Geometry"
],
function(
  declare, lang, kernel,
  SpatialReference, Geometry
) {

  var earthRadius = 6378137, // in meters
      PI =          3.14159265358979323846264338327950288,
      degPerRad =   57.295779513082320,
      radPerDeg =   0.017453292519943;

  var tmpLngLat = [0, 0];

  // latitude-longitude (4326) to web-mercator conversion (102100)
  function radToDeg(rad) {
    return rad * degPerRad;
  }

  function degToRad(deg) {
    return deg * radPerDeg;
  }

  function lngLatToXY(lng, lat, isLinear, retval) {
    if (lat > 89.99999) {
      lat = 89.99999;
    }
    else if (lat < -89.99999) {
      lat = -89.99999;
    }
    
    var lat_rad = degToRad(lat);

    if (!retval) {
      retval = [0, 0];
    }

    retval[0] =  degToRad(lng) * earthRadius;
    retval[1] = earthRadius/2.0 * Math.log( 
      (1.0 + Math.sin(lat_rad)) / 
      (1.0 - Math.sin(lat_rad)) 
    );
  
    return retval;
  }
  
  function xyToLngLat(x, y, isLinear, retval) {
    var lng_deg = radToDeg(x / earthRadius);

    if (!retval) {
      retval = [0, 0];
    }
    
    retval[0] = isLinear ?  lng_deg : lng_deg - (Math.floor((lng_deg + 180) / 360) * 360);
    retval[1] = radToDeg( (PI / 2) - (2 * Math.atan(Math.exp(-1.0 * y / earthRadius))));

    return retval;
  }

  /**
   * @extends module:esri/geometry/Geometry
   * @constructor module:esri/geometry/Point
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.                      
   */
  var Point = declare(Geometry,
  /** @lends module:esri/geometry/Point.prototype */
  {
    declaredClass: "esri.geometry.Point",

    classMetadata: {
      computed: {
        cache: ["x", "y", "z", "m"],
        hasM: ["m"],
        hasZ: ["z"],
        longitude: ["x"],
        latitude: ["y"]
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    
    // Supported constructor signatures:
    // 1.  new Point(<x>, <y>, <z>, <m>, <SpatialReference>)
    // 2.  new Point(<Object>)
    //       - as in ArcGIS Server REST API
    // 3.  new Point({ <latitude>, <longitude>, <altitude> })
    // 4.  new Point([ <x>, <y>, <z>, <m> ], <SpatialReference>)

    normalizeCtorArgs: function(x, y, z, m, spatialReference) {
      var pt;

      // Signature 4
      if (Array.isArray(x)) {
        pt = x;
        spatialReference = y;
        x = pt[0];
        y = pt[1];
        z = pt[2];
        m = pt[3];
      }
      else if (lang.isObject(x)) {
        pt = x;
        x = pt.x != null ? pt.x : pt.longitude;
        y = pt.y != null ? pt.y : pt.latitude;
        z = pt.z != null ? pt.z : pt.altitude;
        m = pt.m;
        spatialReference = pt.spatialReference;

        if (spatialReference && spatialReference.declaredClass !== "esri.SpatialReference") {
          spatialReference = new SpatialReference(spatialReference);
        }

        if (!pt.declaredClass && spatialReference && spatialReference.isWebMercator() && pt.longitude != null && pt.latitude != null) {
          var lonLat = lngLatToXY(pt.longitude, pt.latitude, false, tmpLngLat);
          x = lonLat[0];
          y = lonLat[1];
        }
      } // Signature 1
      else {
        if (this.isSR(z)) {
          spatialReference = z;
          z = null;
        }
        else if (this.isSR(m)) {
          spatialReference = m;
          m = null;
        }
      }
      

      var kwArgs = {
        x: x,
        y: y
      };

      if (spatialReference != null) {
        kwArgs.spatialReference = spatialReference;
      }

      if (z != null) {
        kwArgs.z = z;
      }
      if (m != null) {
        kwArgs.m = m;
      }

      return kwArgs;
    },

    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  latitude
    //----------------------------------

    /**
     * The latitude of the point if the spatial reference 
     * is Web Mercator (wkid: 3857) or WGS84 (wkid: 4326).
     * 
     * @name latitude
     * @instance
     * @type {number}
     */

    _latitudeGetter: function() {
      var sr = this.spatialReference;
      
      if (sr) {
        if (sr.isWebMercator()) {
          return xyToLngLat(this.x, this.y, false, tmpLngLat)[1];
        }
        else if (sr.wkid === 4326) {
          return this.y;
        }
      }

      return null;
    },

    _latitudeSetter: function(latitude) {
      var sr = this.spatialReference;

      if (sr) {
        if (sr.isWebMercator()) {
          this.y = lngLatToXY(this.x, latitude, false, tmpLngLat)[1];
        }
        else if (sr.wkid === 4326) {
          this.y = latitude;
        }
      }
    },

    //----------------------------------
    //  longitude
    //----------------------------------

    /**
     * The longitude of the point if the spatial reference 
     * is Web Mercator (wkid: 3857) or WGS84 (wkid: 4326).
     * 
     * @name longitude
     * @instance
     * @type {number}
     */

    _longitudeGetter: function() {
      var sr = this.spatialReference;
      
      if (sr) {
        if (sr.isWebMercator()) {
          return xyToLngLat(this.x, this.y, false, tmpLngLat)[0];
        }
        else if (sr.wkid === 4326) {
          return this.x;
        }
      }
      
      return null;
    },

    _longitudeSetter: function(longitude) {
      var sr = this.spatialReference;
      
      if (sr) {
        if (sr.isWebMercator()) {
          this.x = lngLatToXY(longitude, this.y, false, tmpLngLat)[0];
        }
        else if (sr.wkid === 4326) {
          this.x = longitude;
        }
      }
    },

    //----------------------------------
    //  hasM
    //----------------------------------
    
    _hasMGetter: function() {
      return this.m !== undefined;
    },
    _hasMSetter: function(value, oldValue) {
      if (value !== oldValue) {
        this.m = value ? 0 : undefined;
        return value;
      }
      return oldValue;
    },

    //----------------------------------
    //  hasZ
    //----------------------------------

    _hasZGetter: function() {
      return this.z !== undefined;
    },
    _hasZSetter: function(value, oldValue) {
      if (value !== oldValue) {
        this.z = value ? 0 : undefined;
        return value;
      }
      return oldValue;
    },

    //----------------------------------
    //  x
    //----------------------------------

    /**
     * The x-coordinate (easting) of the point in map units.
     *
     * @type {number}
     * @default 0
     */
    x: 0,

    //----------------------------------
    //  y
    //----------------------------------

    /**
     * The y-coordinate (northing) of the point in map units.
     *
     * @type {number}
     * @default 0
     */
    y: 0,

    //----------------------------------
    //  z
    //----------------------------------

    /**
     * The z-coordinate (or elevation) of the point in map units.
     *
     * @type {number}
     */
    z: undefined,

    //----------------------------------
    //  m
    //----------------------------------

    /**
     * The m-coordinate of the point in map units.
     *
     * @type {number}
     */
    m: undefined,
    
    //----------------------------------
    //  type
    //----------------------------------
    
    /**
     * For Point, the type is always `point`.
     *
     * @type {string}
     * @readonly
     */  
    type: "point",

    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    

    clone: function() {
      // create the new instance and then assign the values
      // to avoid calling normalizeCtorArgs
      var pt = new Point();
      pt.x = this.x;
      pt.y = this.y;
      pt.z = this.z;
      pt.m = this.m;
      pt.spatialReference = this.spatialReference;
      return pt;
    },

    /**
     * Copies all values from another Point instance.
     *
     * @param {module:esri/geometry/Point} other - The point to copy from.
     */
    copy: function(other) {
      Point.copy(other, this);
      return this;
    },

    /**
     * Determines if the input point is equal to the point calling the function.
     * 
     * @param {module:esri/geometry/Point} point - The input point to test.
     *                                           
     * @return {boolean} Returns `true` if the X, Y, Z coordinates of the input point 
     *                   along with its spatial reference and M value are exactly equal to those of the point calling `equals()`.                                        
     */
    equals: function(point) {
      if (!point) {
        return false;
      }

      var thisX = this.x,
          thisY = this.y,
          thisZ = this.z,
          thisM = this.m,
          thisSR = this.spatialReference,
          x = point.x,
          y = point.y,
          z = point.z,
          m = point.m,
          sr = point.spatialReference;

      if (!thisSR.equals(sr)) {
        if (thisSR.isWebMercator() && sr.wkid === 4326) {
          var xy = lngLatToXY(x, y);
          x = xy[0];
          y = xy[1];
          sr = thisSR;
        }
        else if (thisSR.wkid === 4326 && sr.isWebMercator()) {
          var lonLat = xyToLngLat(x, y);
          x = lonLat[0];
          y = lonLat[1];
          sr = thisSR;
        }
        else {
          return false;
        }
      }

      return thisX === x
        &&  thisY === y
        &&  thisZ === z
        &&  thisM === m
        &&  thisSR.wkid === sr.wkid;
    },

    /**
     * Returns a new Point with X and Y offsets. Units are map units.
     *
     * @param {number} x - The offset distance in map units from the x-coordinate.
     * @param {number} y - The offset distance in map units from the y-coordinate.
     * @param {number=} z - The offset distance in map units from the y-coordinate.
     *
     * @return {module:esri/geometry/Point} Returns a point offset and the specified distances from the original point.
     */
    offset: function(x, y, z) {
      var clone = this.clone();
      clone.x += x;
      clone.y += y;
      if (z != null && clone.hasZ) {
        clone.z += z;
      }
      return clone;
    },

    /**
     * Shifts the x coordinate to within +/- 180 span.
     * Units are map units.
     *
     * @return {module:esri/geometry/Point} Returns a point with a normalized x-value.
     */
    normalize: function() {
      // Shifts "x" to within +/- 180
      
      // TODO
      // Move these tests as proper unit tests
      
      /*// Test cases:
      var res, sr = new SpatialReference({ wkid: 4326 });
      res = Point.prototype.normalize.call({ x: -200, spatialReference: sr });
      console.log(res.x === 160);
      res = Point.prototype.normalize.call({ x: -528, spatialReference: sr });
      console.log(res.x === -168);
      res = Point.prototype.normalize.call({ x: -1676, spatialReference: sr });
      console.log(res.x === 124);
      res = Point.prototype.normalize.call({ x: -181, spatialReference: sr });
      console.log(res.x === 179);
      res = Point.prototype.normalize.call({ x: 250, spatialReference: sr });
      console.log(res.x === -110);
      res = Point.prototype.normalize.call({ x: 896, spatialReference: sr });
      console.log(res.x === 176);
      res = Point.prototype.normalize.call({ x: 181, spatialReference: sr });
      console.log(res.x === -179);
      res = Point.prototype.normalize.call({ x: 2346, spatialReference: sr });
      console.log(res.x === -174);*/
      
      var x = this.x, sr = this.spatialReference;
      
      if (sr) {
        var info = sr._getInfo();
        if (info) {
          var minus180 = info.valid[0], plus180 = info.valid[1], world = 2 * plus180, ratio;
  
          if (x > plus180) {
            ratio = Math.ceil(Math.abs(x - plus180) / world);
            x -= (ratio * world);
          }
          else if (x < minus180) {
            ratio = Math.ceil(Math.abs(x - minus180) / world);
            x += (ratio * world);
          }
        }
      }

      var ret = this.clone();
      ret.x = x;

      return ret;
    },

    /**
     * Computes the Euclidean distance between this Point and a given Point. Points must have the same spatial reference.
     *
     * @param {module:esri/geometry/Point} other - The point to compute the distance to.
     *
     * @return {number} Returns the Euclidean distance between this Point and the other Point.
     */
    distance: function(other) {
      return Point.distance(this, other);
    },

    toArray: function() {
      var hasZ = this.hasZ,
          hasM = this.hasM;
      if (hasZ && hasM) {
        return [this.x, this.y, this.z, this.m];
      }
      else if (hasZ) {
        return [this.x, this.y, this.z];
      }
      else if (hasM) {
        return [this.x, this.y, this.m];
      }
      else {
        return [this.x, this.y];
      }
    },

    toJSON: function() {
      var sr = this.spatialReference;

      var ret ={
        x: this.x,
        y: this.y,
        spatialReference: sr && sr.toJSON()
      };
      if (this.hasZ) {
        ret.z = this.z;
      }
      if (this.hasM) {
        ret.m = this.m;
      }
      
      return ret;
    },
    
    //--------------------------------------------------------------------------
    //
    //  Legacy
    //
    //--------------------------------------------------------------------------

    // DEPRECATED
    setX: function(x) {
      kernel.deprecated(this.declaredClass + ".setX", "Use .x = value instead", "4.0");
      this.x = x;
      return this;
    },

    // DEPRECATED
    setY: function(y) {
      kernel.deprecated(this.declaredClass + ".setY", "Use .y = value instead", "4.0");
      this.y = y;
      return this;
    },

    setLongitude: function(longitude) {
      kernel.deprecated(this.declaredClass + ".setLongitude", "Use .longitude = value; instead", "4.0");
      this.longitude = longitude;
      return this;
    },
    
    setLatitude: function(latitude) {
      kernel.deprecated(this.declaredClass + ".setLatitude", "Use .latitude = value; instead", "4.0");
      this.latitude = latitude;
      return this;
    },
   
    getLongitude: function() {
      kernel.deprecated(this.declaredClass + ".getLongitude", "Use .longitude instead", "4.0");
      return this.longitude;
    },
    
    getLatitude: function() {
      kernel.deprecated(this.declaredClass + ".getLatitude", "Use .latitude instead", "4.0");
      return this.latitude;
    },
    
    update: function(x, y, z) {
      kernel.deprecated(this.declaredClass + ".update", "Use .x/y/z = value instead", "4.0");
      var set = {x: x, y: y};
      if (z != null) {
        set.z = z;
      }
      return this.set(set);
    }

  });
  
  Point.lngLatToXY = lngLatToXY;
  Point.xyToLngLat = xyToLngLat;

  /**
   * @private
   */
  Point.copy = function(src, dest) {
    dest.x = src.x;
    dest.y = src.y;
    dest.z = src.z;
    dest.m = src.m;
    dest.spatialReference = Object.isFrozen(src.spatialReference) ? src.spatialReference : src.spatialReference.clone();
  };

  /**
   * @private
   */
  Point.distance = function(a, b) {
    var dx = a.x - b.x,
      dy = a.y - b.y,
      dz = (a.hasZ && b.hasZ) ? (a.z - b.z) : 0;

    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  };

  return Point;  
});
