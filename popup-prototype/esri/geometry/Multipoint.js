/**
 * An ordered collection of points.
 * 
 * @module esri/geometry/Multipoint
 * @since 4.0
 * @see module:esri/geometry/Point
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",

  "./SpatialReference",
  "./Geometry",
  "./Point",
  "./Extent",

  "./support/zmUtils"
],
function(
  declare, lang,
  SpatialReference, Geometry, Point, Extent,
  zmUtils
) {
  
  /**
  * @extends module:esri/geometry/Geometry
  * @constructor module:esri/geometry/Multipoint
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */      
  var Multipoint = declare(Geometry, 
  /** @lends module:esri/geometry/Multipoint.prototype */                           
  {
    declaredClass: "esri.geometry.Multipoint",

    classMetadata: {
      computed: {
        cache: ["points", "hasZ", "hasM"],
        extent: ["cache"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(props) {
      return {
        points: []
      };
    },

    normalizeCtorArgs: function(obj, spatialReference) {
      var points = null;
      var hasZ = undefined;
      var hasM = undefined;
      var point = null;

      if (obj && !Array.isArray(obj)) {
        points = obj.points ? obj.points : null;
        spatialReference = spatialReference || (points ? obj.spatialReference : obj);
        hasZ = obj.hasZ;
        hasM = obj.hasM;
      }
      else {
        points = obj;
      }

      points = points || [];
      spatialReference = spatialReference || SpatialReference.WGS84;

      point = points[0];

      if (point) {
        if (hasZ === undefined && hasM === undefined) {
          hasZ = point.length > 2;
          hasM = false;
        }
        else if (hasZ === undefined) {
          hasZ = point.length > 3;
        }
        else if (hasM === undefined) {
          hasM = point.length > 3;
        }
      }

      return {
        points: points,
        spatialReference: spatialReference,
        hasZ: hasZ,
        hasM: hasM
      };
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * For Multipoint, the type is always `multipoint`.
     *
     * @type {string}
     * @readonly
     */  
    type: "multipoint",

    //----------------------------------
    //  extent
    //----------------------------------

    _extentGetter: function(cached) {
      if (!this.points.length) {
        return null;
      }

      function undefinedMinMax(f) {
        return function(a, b) {
          return a == null ? b : (b == null ? a : f(a, b));
        };
      }

      var extent = cached || new Extent();

      var points = this.points,
          hasZ = this.hasZ,
          hasM = this.hasM,

          point = points[0],
          min = undefinedMinMax(Math.min),
          max = undefinedMinMax(Math.max),
          xmin = (xmax = point[0]),
          ymin = (ymax = point[1]),
          zmin, mmin, xmax, ymax, zmax, mmax,
          x, y, z, m, i, n,
          midx = hasZ ? 3 : 2;

      for (i = 0, n = points.length; i < n; i++) {
        point = points[i];
        x = point[0];
        y = point[1];
        xmin = min(xmin, x);
        ymin = min(ymin, y);
        xmax = max(xmax, x);
        ymax = max(ymax, y);

        if (hasZ && point.length > 2) {
          z = point[2];
          zmin = min(zmin, z);
          zmax = max(zmax, z);
        }

        if (hasM && point.length > midx) {
          m = point[midx];
          mmin = min(mmin, m);
          mmax = max(mmax, m);
        }
      }

      extent.xmin = xmin;
      extent.ymin = ymin;
      extent.xmax = xmax;
      extent.ymax = ymax;
      extent.spatialReference = this.spatialReference;

      if (hasZ) {
        extent.zmin = zmin;
        extent.zmax = zmax;
      }
      else {
        extent.zmin = null;
        extent.zmax = null;
      }

      if (hasM) {
        extent.mmin = mmin;
        extent.mmax = mmax;
      }
      else {
        extent.mmin = null;
        extent.mmax = null;
      }

      return extent;
    },
    
    //----------------------------------
    //  points
    //----------------------------------

    /**
     * An array of points.
     *
     * @name points
     * @instance
     * @type {number[][]}
     */
    points: null,
    

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Adds a point to the Multipoint.
     * 
     * @param {module:esri/geometry/Point | number[]} point - The point to add to the multipoint. The point can either be a {@link module:esri/geometry/Point Point} or
     *                                            an array of numbers representing XY coordinates.
     *                                            
     * @return {module:esri/geometry/Multipoint} Returns the updated Multipoint.                                            
     */
    addPoint: function(/*Array[x,y,z]|esri.geometry.Point*/ point) {
      this.clearCache();
      zmUtils.updateSupportFromPoint(this, point);
      if (Array.isArray(point)) {
        this.points.push(point);
      }
      else {
        this.points.push(point.toArray());
      }
      return this;
    },

    /**
     * @inheritdoc
     */
    clone: function() {
      var mpt = {
        points: lang.clone(this.points),
        spatialReference: this.spatialReference
      };

      if (this.hasZ) {
        mpt.hasZ = true;
      }

      if (this.hasM) {
        mpt.hasM = true;
      }

      return new Multipoint(mpt);
    },

    /**
     * Returns the point at the specified index.
     * 
     * @param {number} index - The index of the point in the [points](#points) property.
     *
     * @return {module:esri/geometry/Point} The point at the specified index.
     */
    getPoint: function(index) {
      if (this._validateInputs(index)) {
        var point = this.points[index],
            z, m, midx = 2;

        if (this.hasZ) {
          z = point[2];
          midx = 3;
        }

        if (this.hasM) {
          m = point[midx];
        }

        return new Point({
          x: point[0],
          y: point[1],
          z: z,
          m: m,
          spatialReference: this.spatialReference
        });
      }
    },

    /**
     * Removes a point from the Multipoint. The index specifies which point to remove.
     * 
     * @param {number} index - The index of the point to remove.
     *                       
     * @return {module:esri/geometry/Point} Returns the removed point.                       
     */
    removePoint: function(index) {
      if (this._validateInputs(index)) {
        this.clearCache();
        return new Point(this.points.splice(index, 1)[0], this.spatialReference);
      }
    },

    /**
     * Updates the point at the specified index. 
     * 
     * @param {number} index - The index of the point in the [points](#points) property.
     * @param {module:esri/geometry/Point} point - Point geometry that specifies the new location.                       
     *                       
     * @return {module:esri/geometry/Multipoint} Returns the updated Multipoint.                       
     */
    setPoint: function(index, point) {
      if (this._validateInputs(index)) {
        this.clearCache();

        zmUtils.updateSupportFromPoint(point);
        this.points[index] = point.toArray();

        return this;
      }
    },

    toJSON: function() {
      var sr = this.spatialReference;
      var ret = {
        points: lang.clone(this.points),
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

    _pointsToArrays: function(obj) {
      for (var i = 0; i < obj.points.length; i++) {
        var point = obj.points[i];
        zmUtils.updateSupportFromPoint(obj, point, true);

        if (!Array.isArray(point)) {
          if (!obj.spatialReference) {
            obj.spatialReference = point.spatialReference;
          }
          obj.points[i] = point.toArray();
        }
      }
      return obj;
    },
    
    _validateInputs: function(index) {
      return index != null && index >= 0 && index < this.points.length;
    }

  });

  return Multipoint;  
});
