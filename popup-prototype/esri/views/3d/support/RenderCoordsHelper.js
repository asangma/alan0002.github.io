define(["./earthUtils", "./projectionUtils", "../lib/glMatrix", "../webgl-engine/lib/BufferVectorMath"],
  function(earthUtils,  projectionUtils, glMatrix, BufferVectorMath) {

    // Imports
    var vec3d = glMatrix.vec3,
      bufferVec3 = BufferVectorMath.Vec3Compact;

    // Constants
    var EARTH_RADIUS = earthUtils.earthRadius,
      PLANAR_UP = [0, 0, 1]; // WARNING: up-axis dependent code

    var RenderCoordsHelper = function(spatialRef) {
      this.spatialRef = spatialRef;
    };

    // overloads:
    // toRenderCoords(srcVector, srcSR, destVector)
    // toRenderCoords(srcPoint, destVector)
    RenderCoordsHelper.prototype.toRenderCoords = function(src, srcSR, dest) {
      if (src.declaredClass === "esri.geometry.Point") {
        dest = srcSR;
        return projectionUtils.pointToVector(src, dest, this.spatialRef);
      }
      else {
        return projectionUtils.vectorToVector(src, srcSR, dest, this.spatialRef);
      }
    };

    // overloads:
    // fromRenderCoords(srcVector, destVector, destSR)
    // fromRenderCoords(srcVector, destPoint)           // uses SR from destPoint, overwrites coordinates
    // fromRenderCoords(srcVector, destPoint, destSR)   // overwrites destPoint completely
    // fromRenderCoords(srcVector, destSR)              // returns a new point
    RenderCoordsHelper.prototype.fromRenderCoords = function(src, dest, destSR) {
      if ((dest.declaredClass === "esri.geometry.Point")
        || (dest.declaredClass === "esri.SpatialReference")) {
        return projectionUtils.vectorToPoint(src, this.spatialRef, dest, destSR);
      }
      else {
        return projectionUtils.vectorToVector(src, this.spatialRef, dest, destSR);
      }
    };


    var SphericalRenderCoordsHelper = function(spatialRef) {
      spatialRef = spatialRef || projectionUtils.SphericalRenderSpatialReference;
      RenderCoordsHelper.call(this, spatialRef);
    };
    SphericalRenderCoordsHelper.prototype = new RenderCoordsHelper();


    SphericalRenderCoordsHelper.prototype.getAltitude = function(position, index) {
      var len = bufferVec3.length(position, index || 0);
      return len - EARTH_RADIUS;
    };

    SphericalRenderCoordsHelper.prototype.setAltitude = function(altitude, position, index) {
      index = index || 0;
      var factor = (altitude+EARTH_RADIUS)/bufferVec3.length(position, index);
      bufferVec3.scale(position, index, factor);
    };

    SphericalRenderCoordsHelper.prototype.setAltitudeOfTransformation = function(altitude, trafo) {
      this.setAltitude(altitude, trafo, 12);
    };

    SphericalRenderCoordsHelper.prototype.worldUpAtPosition = function(position, result) {
      vec3d.normalize(position, result);
    };


    var PlanarRenderCoordsHelper = function(spatialRef) {
      RenderCoordsHelper.call(this, spatialRef);
      this.worldUp = PLANAR_UP;
    };
    PlanarRenderCoordsHelper.prototype = new RenderCoordsHelper();

    PlanarRenderCoordsHelper.prototype.getAltitude = function(position, index) {
      return index ? position[index + 2] : position[2];
    };

    PlanarRenderCoordsHelper.prototype.setAltitude = function(altitude, position, index) {
      if (index) {
        position[index + 2] = altitude;
      } else {
        position[2] = altitude;
      }
    };

    PlanarRenderCoordsHelper.prototype.setAltitudeOfTransformation = function(altitude, trafo) {
      this.setAltitude(altitude, trafo, 12);
    };

    PlanarRenderCoordsHelper.prototype.worldUpAtPosition = function(position, result) {
      vec3d.set(PLANAR_UP, result);
    };

    PlanarRenderCoordsHelper.worldUp = PLANAR_UP;

    RenderCoordsHelper.Spherical = SphericalRenderCoordsHelper;
    RenderCoordsHelper.Planar = PlanarRenderCoordsHelper;

    return RenderCoordsHelper;
  }
);
