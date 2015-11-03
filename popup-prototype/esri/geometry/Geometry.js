/**
 * The base class for geometry objects. 
 * This class has no constructor. To construct geometries see {@link module:esri/geometry/Point Point}, 
 * {@link module:esri/geometry/Polyline Polyline}, or {@link module:esri/geometry/Polygon Polygon}.
 * 
 * @module esri/geometry/Geometry
 * @noconstructor
 * @since 4.0
 * @see module:esri/geometry/Point
 * @see module:esri/geometry/Polyline
 * @see module:esri/geometry/Polygon
 * @see module:esri/Graphic
 */
define(
[
  "dojo/_base/kernel",

  "../core/JSONSupport",

  "./SpatialReference"
],
function(
  kernel,
  JSONSupport,
  SpatialReference
) {

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/geometry/Geometry
   */
  var Geometry = JSONSupport.createSubclass(
  /** @lends module:esri/geometry/Geometry.prototype */
  {
    declaredClass: "esri.geometry.Geometry",

    classMetadata: {
      properties: {
        cache: {
          readOnly: true,
          dependsOn: ["spatialReference"] 
        },
        extent: {
          readOnly: true,
          dependsOn: ["spatialReference"],
          copy: function(a, b) {
            a.xmin = b.xmin;
            a.ymin = b.ymin;
            a.xmax = b.xmax;
            a.ymax = b.ymax;
            a.spatialReference = b.spatialReference;
            if (b.hasM) {
              a.mmin = b.mmin;
              a.mmax = b.mmax;
            }
            if (b.hasZ) {
              a.zmin = b.zmin;
              a.zmax = b.zmax;
            }
          }
        },
        spatialReference: {
          type: SpatialReference
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  cache
    //----------------------------------

    /**
     * The cache is used to store values computed from geometries that need to cleared or recomputed upon mutation. 
     * An example is the extent of a polygon. The default value is `null`.
     * 
     * @type {Object}
     * @readonly
     */
    cache: null,

    _cacheGetter: function() {
      // Each time the cache is invalidated, return a new objects
      return {};
    },

    //----------------------------------
    //  extent
    //----------------------------------

    /**
     * The extent of the geometry. For points, the extent is null.
     *
     * @type {module:esri/geometry/Extent}
     * @readonly
     */
    extent: null,

    //----------------------------------
    //  hasM
    //----------------------------------
    
    /**
     * Indicates if the geometry has M values.
     * 
     * @name hasM
     * @instance
     * @type {boolean}
     */
    hasM: false,

    //----------------------------------
    //  hasZ
    //----------------------------------

    /**
     * Indicates if the geometry has Z (elevation) values.
     * 
     * @name hasZ
     * @instance
     * @type {boolean}
     */  
    hasZ: false,

    //----------------------------------
    //  spatialReference
    //----------------------------------

    /**
     * The spatial reference of the geometry.
     *
     * @type {module:esri/geometry/SpatialReference}
     * @default WGS84 (wkid: 4326)
     */
    spatialReference: SpatialReference.WGS84,

    _spatialReferenceReader: SpatialReference.fromJSON,
    
    //----------------------------------
    //  type
    //----------------------------------

    /**
     * The geometry type.
     * 
     * **Possible Values:** point | multipoint | polyline | polygon | extent
     *
     * @type {string}
     * @readonly
     */
    type: null,


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    isSR: function(value) {
      return value && (value.declaredClass === "esri.SpatialReference" ||
                       value.wkid != null);
    },

    /**
     * Creates a copy of the geometry.
     *
     * @return {module:esri/geometry/Geometry} A new instance of a Geometry object equal to the object used to call `.clone()`.
     */
    clone: function() {
      console.warn(".clone() is not implemented for " + this.declaredClass);
      return null;
    },

    toJSON: function() {
      console.warn(".toJSON() is not implemented for " + this.declaredClass);
      return null;
    },

    clearCache: function() {
      this.notifyChange("cache");
    },

    getCacheValue: function(name) {
      return this.cache[name];
    },

    setCacheValue: function(name, value) {
      this.cache[name] = value;
    },


    //--------------------------------------------------------------------------
    //
    //  Legacy
    //
    //--------------------------------------------------------------------------

    getExtent: function() {
      kernel.deprecated(this.declaredClass + ".getExtent", "Use .extent instead", "4.0");
      return this.extent;
    },

    // DEPRECATED
    setSpatialReference: function(sr) {
      kernel.deprecated(this.declaredClass + ".setSpatialReference", "Use .spatialReference = sr; instead", "4.0");
      this.spatialReference = sr;
    }

  });

  return Geometry;  
});
