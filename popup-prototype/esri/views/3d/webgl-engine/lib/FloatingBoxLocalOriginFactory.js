define(["./gl-matrix"], function(glMatrix) {
  // This class

  var vec3d = glMatrix.vec3d;

  var originPrefix = "fb_";
  var tmpVec = vec3d.create();

  var FloatingBoxLocalOriginFactory = function(boxSize, maxNumOrigins /* optional*/) {
    var origins = [];

    this.getOrigin = function(position) {
      var numOrigins = origins.length;
      var closestOrigin,
        insideClosestOrigin = false,
        closestOriginDist = Number.MAX_VALUE;
      for (var i = 0; i < numOrigins; i++) {
        var origin = origins[i];
        var originPos = origin.vec3;
        vec3d.subtract(position, originPos, tmpVec);
        tmpVec[0] = Math.abs(tmpVec[0]);
        tmpVec[1] = Math.abs(tmpVec[1]);
        tmpVec[2] = Math.abs(tmpVec[2]);
        var dist = tmpVec[0] + tmpVec[1] + tmpVec[2];
        // the boxes around the origins may overlap, so we should always check all origins for the closest one
        if (dist < closestOriginDist) {
          closestOrigin = origin;
          closestOriginDist = dist;
          insideClosestOrigin = (tmpVec[0] < boxSize) && (tmpVec[1] < boxSize) && (tmpVec[2] < boxSize);
        }
      }

      if (!insideClosestOrigin && (!closestOrigin || (maxNumOrigins == null) || (origins.length < maxNumOrigins))) {
        // create new origin. do not place origin exactly at input position, as some shaders (e.g. HUDMaterial) discard
        // vertices which are exactly at [0, 0, 0]
        var offset = FloatingBoxLocalOriginFactory.OFFSET;
        closestOrigin = {
          // this object is formatted according to Model.getOrigin()
          vec3: [position[0] + offset, position[1] + offset, position[2] + offset],
          id: originPrefix + origins.length
        };
        origins.push(closestOrigin);
        //console.log("origin created: %d (%d %d %d)", origins.length, position[0], position[1], position[2]);
      }
      return closestOrigin;
    };
  };

  FloatingBoxLocalOriginFactory.OFFSET = 1.11;

  return FloatingBoxLocalOriginFactory;
});
