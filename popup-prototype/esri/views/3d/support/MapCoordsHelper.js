define([
  "dojo/Evented",
  "dojo/Deferred",
  
  "../../../core/declare",

  "../../../config",

  "../../../tasks/support/ProjectParameters",
  
  "../../../geometry/SpatialReference",
  "../../../geometry/Point",
  "../../../geometry/support/scaleUtils"
], function (
  Evented, Deferred,
  declare,
  esriConfig,
  ProjectParameters,
  SpatialReference, Point, scaleUtils
) {
  var MapCoordsHelper = declare(Evented, {
    mapUnitInMeters: 1,
    spatialReference: null,

    constructor: function(spatialRef, geometryService) {
      this.spatialReference = spatialRef;
      this.mapUnitInMeters = scaleUtils.getUnitValueForSR(this.spatialReference);
      this.geometryService = geometryService || esriConfig.geometryService;
    },

    /**
     * Uses GeometryService to convert from map coordinates to geographic coordinates (WGS84).
     *
     * @param   {special} Positions to convert. Can be either a vector (Number[]), an array of vectors, a Point, or
     *                    an array of Points.
     * @return {Deferred} The result of the conversion, either as an array of vectors or as a single vector.
     */
    toGeographic: function(points) {
      var dfd = new Deferred(),
        wasArray = true,
        spatialRef = this.spatialReference;

      if (!this.geometryService) {
        dfd.reject("Must specify geometryService in esri/config");
        return dfd;
      }

      if (!Array.isArray(points[0]) || (typeof points[0] === "number")) {
        points = [points];
        wasArray = false;
      }

      points.forEach(function(point, i) {
        if (!(point instanceof Point)) {
          points[i] = new Point(point, spatialRef);
        }
      });

      var params = new ProjectParameters({
        geometries: points,
        outSR: SpatialReference.WGS84
      });

      this.geometryService.project(params).then(
        function(result) {
          try {
            result = result.map(function(geometry) {
              return [geometry.x, geometry.y];
            });
            dfd.resolve(wasArray ? result : result[0]);
          }
          catch (e) {
            dfd.reject(e);
          }
        },
        function(e) {
          dfd.reject(e);
        }
      );
      return dfd.promise;
    },

    canProject: function() {
      return !!this.geometryService;
    }
  });

  return MapCoordsHelper;
});
