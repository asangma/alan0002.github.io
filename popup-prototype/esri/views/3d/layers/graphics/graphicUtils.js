define([
  "../../../../geometry/SpatialReference",
  "../../../../geometry/Point",
  "../../../../geometry/support/webMercatorUtils"
], function(SpatialReference, Point, webMercatorUtils) {

  var computeCentroid = function(geometry, destSR) {
    if (geometry.type === "extent") {
      return geometry.center;
    }

    var paths = geometry[(geometry.type === "polygon") ? "rings" : "paths"];
    var x = 0;
    var y = 0;
    var z = 0;
    var hasZ = geometry.hasZ;
    var totalNumVertices = 0;
    for (var pathIdx = 0; pathIdx < paths.length; pathIdx++) {
      var path = paths[pathIdx];
      for (var vertIdx = 0; vertIdx < path.length; vertIdx++) {
        x += path[vertIdx][0];
        y += path[vertIdx][1];
        if (hasZ) {
          z += path[vertIdx][2];
        }
      }
      totalNumVertices += path.length;
    }
    x /= totalNumVertices;
    y /= totalNumVertices;
    z /= totalNumVertices;

    var result = new Point({
      x: x,
      y: y,
      z: hasZ ? z : undefined,
      spatialReference: geometry.spatialReference
    });

    if (destSR) {
      convertToSR(result, destSR);
    }

    return result;
  };

  var convertToSR = function(geometry, destSR) {
    var srcSR = geometry.spatialReference;
    if (!srcSR.equals(destSR)) {
      if (srcSR.isWebMercator() && (destSR.wkid === SpatialReference.WGS84.wkid)) {
        webMercatorUtils.webMercatorToGeographic(geometry, false, geometry);
      }
      else if (destSR.isWebMercator() && (srcSR.wkid === SpatialReference.WGS84.wkid)) {
        webMercatorUtils.geographicToWebMercator(geometry, false, geometry);
      }
    }
  };

  return {
    computeCentroid: computeCentroid,
    convertToSR: convertToSR
  };
});
