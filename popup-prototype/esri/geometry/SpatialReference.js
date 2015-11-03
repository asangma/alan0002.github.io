/**
 * The spatial reference of a map, layer, or inputs to and outputs from a task. Each projected 
 * and geographic coordinate system is defined by either a well-known ID (WKID) or a definition 
 * string (WKT). Versions prior to ArcGIS 10 only supported WKID. For a full list of supported
 * spatial reference IDs and their corresponding definition strings, see the links below.
 *
 * @module esri/geometry/SpatialReference
 *
 * @since 4.0
 * @see [Projected Coordinate Systems](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Projected_coordinate_systems/02r3000000vt000000/)
 * @see [Geographic Coordinate Systems](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Geographic_coordinate_systems/02r300000105000000/)
 */
define(
[
  "dojo/_base/lang",

  "../core/JSONSupport"
],
function(
  lang,
  JSONSupport
) {

  var auxSphere = 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]',
      valid = [ -20037508.342788905, 20037508.342788905 ],
      origin = [ -20037508.342787, 20037508.342787 ];
  
  var webMercatorIds = [ 102113, 102100, 3857, 3785 ];
  var wrappableIds = [ 102113, 102100, 3857, 3785, 4326/*, 104903*/ ];

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/geometry/SpatialReference
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var SpatialReference = JSONSupport.createSubclass(
  /** @lends module:esri/geometry/SpatialReference.prototype */
  {    
    declaredClass: "esri.SpatialReference",

    // coordinate system info
    _info: {
      // Projected CS
      
      "102113": {
        wkTemplate: 'PROJCS["WGS_1984_Web_Mercator",GEOGCS["GCS_WGS_1984_Major_Auxiliary_Sphere",DATUM["D_WGS_1984_Major_Auxiliary_Sphere",SPHEROID["WGS_1984_Major_Auxiliary_Sphere",6378137.0,0.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],UNIT["Meter",1.0]]',
        valid: valid,
        origin: origin,
        dx: 0.00001 // Maximum allowed difference between origin[0] and tileInfo.origin.x
      },
      
      "102100": {
        wkTemplate: auxSphere,
        valid: valid,
        origin: origin,
        dx: 0.00001
      },
      
      "3785": {
        wkTemplate: 'PROJCS["WGS_1984_Web_Mercator",GEOGCS["GCS_WGS_1984_Major_Auxiliary_Sphere",DATUM["D_WGS_1984_Major_Auxiliary_Sphere",SPHEROID["WGS_1984_Major_Auxiliary_Sphere",6378137.0,0.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],PARAMETER["Standard_Parallel_1",0.0],UNIT["Meter",1.0]]',
        valid: valid,
        origin: origin,
        dx: 0.00001 // Maximum allowed difference between origin[0] and tileInfo.origin.x
      },
      
      "3857": {
        wkTemplate: auxSphere,
        valid: valid,
        origin: origin,
        dx: 0.00001
      },
      
      "4326": {
        wkTemplate: 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",${Central_Meridian}],UNIT["Degree",0.0174532925199433]]',
        // dynamic layers need this altTemplate
        altTemplate: 'PROJCS["WGS_1984_Plate_Carree",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Plate_Carree"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${Central_Meridian}],UNIT["Degrees",111319.491]]',
        valid: [ -180, 180 ],
        origin: [ -180, 180 ],
        dx: 0.00001
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    normalizeCtorArgs: function(wktOrWkid) {
      var args = {},
          propName;
      if (typeof wktOrWkid === "object") {
        return lang.mixin(args, wktOrWkid);
      }
      propName = typeof wktOrWkid === "string" ? "wkt" : "wkid";
      args[propName] = wktOrWkid;
      return args;
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  wkid
    //----------------------------------

    /**
    * The well-known ID of a spatial reference. See [Projected Coordinate Systems](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Projected_coordinate_systems/02r3000000vt000000/) and 
    * [Geographic Coordinate Systems](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Geographic_coordinate_systems/02r300000105000000/)
    * for the list of supported spatial references.
    * 
    * @type {number}
    */
    wkid: null,

    //----------------------------------
    //  wkt
    //----------------------------------
      
    /**
    * The well-known text that defines a spatial reference. Many browsers have a limit to the length of a GET request 
    * of approximately 2048 characters. When using well-known text to specify the spatial reference you can easily exceed 
    * this limit. In these cases, you will need to setup and use a proxy page.
    * 
    * @type {string}
    */  
    wkt: null,


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Returns a copy of the spatial reference object.
     *
     * @return {module:esri/geometry/SpatialReference} Returns a copy of the spatial reference object.
     */  
    clone: function() {
      if (this === SpatialReference.WGS84) {
        return SpatialReference.WGS84;
      }
      if (this === SpatialReference.WebMercator) {
        return SpatialReference.WebMercator;
      }

      var cloned = new SpatialReference();

      if (this.wkid != null) {
        cloned.wkid = this.wkid;
        if (this.latestWkid != null) {
          cloned.latestWkid = this.latestWkid;
        }
        if (this.vcsWkid != null) {
          cloned.vcsWkid = this.vcsWkid;
        }
        if (this.latestVcsWkid != null) {
          cloned.latestVcsWkid = this.latestVcsWkid;
        }
      }
      else if (this.wkt != null) {
        cloned.wkt = this.wkt;
      }

      return cloned;
    },
    
    // TODO
    // Use vcsWkid in calculation
    /**
     * Checks if the specified spatial reference object has the same wkid or wkt as this spatial 
     * reference object. 
     *
     * @type {module:esri/geometry/SpatialReference} 
     *
     * @return {boolean} Returns `true` if the input spatial reference object has the same wkid or wkt as this spatial reference object. 
     *
     * @example
     * require(["esri/geometry/SpatialReference"], function(SpatialReference) {
     *   var sr1 = new SpatialReference(4326);
     *   var sr2 = new SpatialReference(4326);
     *   console.log(sr1.equals(sr2)); // true
     * });
     */      
    equals: function(inSR) {
      var isEqual = false;
      
      if (inSR) {
        if (this === inSR) {
          isEqual = true;
        }
        if (this.wkid || inSR.wkid) {
          isEqual = (this.wkid === inSR.wkid) || 
                    (this.isWebMercator() && inSR.isWebMercator()) ||
                    (this.wkid === inSR.latestWkid) ||
                    (inSR.wkid === this.latestWkid);
        }
        else if (this.wkt && inSR.wkt) {
          isEqual = (this.wkt.toUpperCase() === inSR.wkt.toUpperCase());
        }
      }
      
      return isEqual;
    },
    
    /**
     * Checks if the wkid of the spatial reference object is one of the following values: `102113`, `102100`, `3857`.
     *
     * @return {boolean} Returns `true` if the wkid of the spatial reference object is one of the following values: `102113`, `102100`, `3857`.
     *
     * @example
     * require(["esri/geometry/SpatialReference"], function(SpatialReference) {
     *   var sr = new SpatialReference(102100);
     *   console.log(sr.isWebMercator()); // true
     * });
     */      
    isWebMercator: function() {
      // true if this spatial reference is web mercator
      return webMercatorIds.indexOf(this.wkid) !== -1;
    },
    
    isWrappable: function() {
      // true if we support wrap around for this spatial reference
      return wrappableIds.indexOf(this.wkid) !== -1;
    },

    toJSON: function() {
      var json = null;
      
      if (this.wkid != null) {
        json = { wkid: this.wkid };

        if (this.latestWkid != null) {
          json.latestWkid = this.latestWkid;
        }
        
        if (this.vcsWkid != null) {
          json.vcsWkid = this.vcsWkid;
        }
        
        if (this.latestVcsWkid != null) {
          json.latestVcsWkid = this.latestVcsWkid;
        }
      }
      else if (this.wkt != null) {
        json = { wkt: this.wkt };
      }
      
      return json;
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    
    _getInfo: function() {
      return this.wkid ? this._info[this.wkid] : null;
    },
    
    _canProject: function(inSR) {
      // Returns true if "this" SR can be projected to inSR (and vice-versa)
      // without using geometry service. false, otherwise.
      
      var compat = false;
      
      if (inSR) {
        compat = (
          (this.isWebMercator() && inSR.wkid === 4326) ||
          (inSR.isWebMercator() && this.wkid === 4326)
        );
      }
      
      return compat;
    }

  });

  SpatialReference.fromJSON = function(json) {
    if (!json) {
      return null;
    }
 
    if (json.wkid) {
      if (json.wkid === 102100) {
        return SpatialReference.WebMercator;
      }
      if (json.wkid === 4326) {
        return SpatialReference.WGS84;
      }
    }
    
    var sr = new SpatialReference();
    sr.read(json);
    return sr;
  };

  SpatialReference.WGS84 = new SpatialReference(4326);
  SpatialReference.WebMercator = new SpatialReference({ wkid: 102100, latestWkid: 3857 });

  if (Object.freeze) {
    Object.freeze(SpatialReference.WGS84);
    Object.freeze(SpatialReference.WebMercator);
  }

  return SpatialReference;
});
