/**
 * @classdesc
 * Converts Web Mercator coordinates to geographic coordinates and vice versa.
 * 
 * @module esri/geometry/support/webMercatorUtils
 * @since 4.0
 * @see [Sample - Geodesic Buffer](../sample-code/2d/ge-geodesicbuffer-2d/)
 */
define(
[
  "dojo/_base/array",
  "../SpatialReference",
  "../Point"
],
function(array, SpatialReference, Point) {
  var tmpRetval1 = [0, 0];
  var tmpRetval2 = [0, 0];

  function convert(geom, func, sr, isLinear, retGeom) {
    if (geom.type === "point") {
      var pt = func(geom.x, geom.y, isLinear, tmpRetval1);

      if (retGeom) {
        retGeom.x = pt[0];
        retGeom.y = pt[1];
        retGeom.spatialReference = sr;

        return retGeom;
      } else {
        return new geom.constructor(pt[0], pt[1], sr);
      }
    }
    else if (geom.type === "extent") {
      var min = func(geom.xmin, geom.ymin, isLinear, tmpRetval1),
          max = func(geom.xmax, geom.ymax, isLinear, tmpRetval2);

      if (retGeom) {
         retGeom.xmin = min[0];
         retGeom.ymin = min[1];

         retGeom.xmax = max[0];
         retGeom.ymax = max[1];

         retGeom.spatialReference = sr;

         return retGeom;
      } else {
        return new geom.constructor(min[0], min[1], max[0], max[1], sr);
      }
    }
    else if (geom.type === "polyline" || geom.type === "polygon") {
      var isPline = (geom.type === "polyline"),
          iRings = isPline ? geom.paths : geom.rings,
          oRings = [], oRing;

      array.forEach(iRings, function(iRing) {
        oRings.push(oRing = []);
        array.forEach(iRing, function(iPt) {
          oRing.push(func(iPt[0], iPt[1], isLinear));
        });
      });
      
      if (isPline) {
        if (retGeom) {
          retGeom.paths = oRings;
          retGeom.spatialReference = sr;
          return retGeom;
        } else {
          return new geom.constructor({ paths:oRings, spatialReference:sr });
        }
      }
      else {
        if (retGeom) {
          retGeom.rings = oRings;
          retGeom.spatialReference = sr;
          return retGeom;
        } else {
          return new geom.constructor({ rings:oRings, spatialReference:sr });
        }
      }
    }
    else if (geom.type === "multipoint") {
      var oPts = [];
      array.forEach(geom.points, function(iPt) {
        oPts.push(func(iPt[0], iPt[1], isLinear));
      });

      if (retGeom) {
        retGeom.points = oPts;
        retGeom.spatialReference = sr;
        return retGeom;
      } else {
        return new geom.constructor({ points:oPts, spatialReference:sr });
      }
    }
    
    // TODO
    // When circle geometries are converted, we are not retaining their center
    // and radius. This is because we're treating circles like polygons.
    // Need to fix this and add special block and logic to handle circles.
    // Or, find a different solution: clone the input geometry first, then 
    // convert their coordinates and modify them inline. 
  }

  function canProject(source /*Geometry|SpatialReference*/, target /*SpatialReference*/) {
    var inSR  = source && (source.wkid != null ? source : source.spatialReference),
        outSR = target && (target.wkid != null ? target : target.spatialReference);
    if (!inSR || !outSR) {
      return false;
    }
    if (outSR.equals(inSR)) {
      return true;
    }
    return outSR._canProject(inSR);
  }

  function project(geometry, spatialReference) {
    var inSR = geometry && geometry.spatialReference,
        outSR = spatialReference && (spatialReference.wkid != null ? spatialReference : spatialReference.spatialReference);

    if (inSR && outSR) {
      // if inSR.equals(outSR) we return the geometry
      if (!inSR.equals(outSR)) {
        
        // project if we can
        if (canProject(inSR, outSR)) {
          if (outSR.isWebMercator()) {
            geometry = convert(geometry, Point.lngLatToXY, SpatialReference.WebMercator);
          }
          else if (outSR.wkid === 4326) {
            geometry = convert(geometry, Point.xyToLngLat, SpatialReference.WGS84);
          }
        }
        
        // else return null
        else {
          geometry = null;
        }
      }
      else {
        geometry = geometry.clone();
      }
    }
    else {
      geometry = null;
    }
    
    return geometry;
  }
  
  /** @alias module:esri/geometry/support/webMercatorUtils */  
  var mercUtils = {
    
    /**
    * Returns `true` if the `source` spatial reference can be projected to the `target` spatial reference with the [project()](#project) function, or 
    * if the `source` and `target` are the same {@link module:esri/geometry/SpatialReference SpatialReference}.
    * @param   {module:esri/geometry/SpatialReference | Object} source - The input {@link module:esri/geometry/SpatialReference SpatialReference} or an object with 
    *                                                                  `spatialReference` property such as {@link module:esri/geometry/Geometry Geometry} 
    *                                                                  or {@link module:esri/Map Map}.
    * @param   {module:esri/geometry/SpatialReference | Object} target - The target {@link module:esri/geometry/SpatialReference SpatialReference} or an object with 
    *                                                                  `spatialReference` property such as {@link module:esri/geometry/Geometry Geometry} 
    *                                                                  or {@link module:esri/Map Map}.
    * @return {boolean} Returns `true` if `source` can be projected to `target`.
    * 
    * @method canProject
    * @instance
    * @see [project()](#project)                   
    */
    canProject: canProject,
    
    /**
    * Projects the geometry clientside (if possible). You should test the input geometry in [canProject()](#canProject) prior to using this function.
    * If the result of [canProject()](#canProject) is `true`, then proceed to project. If [canProject()](#canProject) returns `false`, then 
    * `project()` won't return useful results. Use {@link module:esri/tasks/GeometryService#project GeometryService.project()} instead.
    * 
    * @param {module:esri/geometry/Geometry} geometry - The input geometry.
    * @param {module:esri/geometry/SpatialReference | Object} spatialReference - The target {@link module:esri/geometry/SpatialReference SpatialReference} or an object with 
    *                                                                  `spatialReference` property such as {@link module:esri/geometry/Geometry Geometry} 
    *                                                                  or {@link module:esri/Map Map}.
    * @return {module:esri/geometry/Geometry} Returns the projected geometry if the projection is successful.
    * 
    * @method project
    * @instance
    * @see {@link module:esri/tasks/GeometryService#project GeometryService.project()}
    * @see module:esri/tasks/support/ProjectParameters
    */  
    project: project,
    
    /**
     * Translates the given latitude and longitude (decimal degree) values to Web Mercator XY values.
     * 
     * @param {number} long - The longitude value to convert.
     * @param {number} lat - The latitude value to convert.                      
     *                                                   
     * @return  {number[]} Returns the converted values in an array.
     *
     * @method lngLatToXY
     * @instance
     */  
    lngLatToXY: Point.lngLatToXY,
    
    /**
     * Translates the given Web Mercator coordinates to Longitude and Latitude values (decimal degrees). 
     * By default the returned longitude is normalized so that it is within -180 and +180.
     * 
     * @param {number} x - The X coordinate value to convert.
     * @param {number} y - The Y coordinate value to convert.                      
     *                                                   
     * @return  {number[]} Returns the converted values in an array.
     *
     * @method xyToLngLat
     * @instance
     */  
    xyToLngLat: Point.xyToLngLat,
    
    /**
     * Converts a geometry from geographic units (wkid: 4326) to Web Mercator units (wkid: 3857).
     * 
     * @param   {module:esri/geometry/Geometry} geometry - The input geometry to convert.
     *                                                   
     * @return  {module:esri/geometry/Geometry} Returns the converted geometry in Web Mercator units.
     *
     * @method geographicToWebMercator
     * @instance
     */
    geographicToWebMercator: function(geom, isLinear, retGeom) {
      if (!retGeom) {
        return convert(geom, Point.lngLatToXY, SpatialReference.WebMercator, isLinear);
      } else {
        return convert(geom, Point.lngLatToXY, SpatialReference.WebMercator, isLinear, retGeom);
      }
    },
    
    /**
     * Converts a geometry from Web Mercator units (wkid: 3857) to geographic units (wkid: 4326).
     * 
     * @param   {module:esri/geometry/Geometry} geometry - The input geometry to convert.
     *                                                   
     * @return  {module:esri/geometry/Geometry} Returns the converted geometry in geographic units.
     *
     * @method webMercatorToGeographic
     * @instance
     */  
    webMercatorToGeographic: function(geom, isLinear, retGeom) {
      if (!retGeom) {
        return convert(geom, Point.xyToLngLat, SpatialReference.WGS84, isLinear);
      } else {
        return convert(geom, Point.xyToLngLat, SpatialReference.WGS84, isLinear, retGeom);
      }
    }
  };

  

  return mercUtils;  
});
