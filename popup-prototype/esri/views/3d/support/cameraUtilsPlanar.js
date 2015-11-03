define(["../../../geometry/Extent", "./mathUtils", "./projectionUtils", "../lib/glMatrix", "./cameraUtilsInternal"],
  function (Extent, mathUtils, projectionUtils, glMatrix, cameraUtilsInternal) {

    var cameraUtilsPlanar = {
      headingTiltToDirectionUp: headingTiltToDirectionUp,
      directionToHeadingTilt: directionToHeadingTilt,
      eyeForCenterWithHeadingTilt: eyeForCenterWithHeadingTilt,
      lookAtTiltToEyeTilt: lookAtTiltToEyeTilt,
      eyeTiltToLookAtTilt: eyeTiltToLookAtTilt,
      toExtent: toExtent
    };

    // Imports
    var vec3d = glMatrix.vec3d,
      mat4d = glMatrix.mat4d;

    // Constants
    var PLANAR_NORTH = vec3d.createFrom(0, 1, 0),
      PLANAR_UP = vec3d.createFrom(0, 0, 1);

    // Temp vars
    var tmpMat4 = mat4d.create();

    function headingTiltToDirectionUp(position, heading, tilt) {
      var dir = vec3d.create(),
        up = vec3d.create();

      mat4d.identity(tmpMat4);
      // WARNING: up-axis dependent code
      mat4d.rotateZ(tmpMat4, -mathUtils.deg2rad(heading));
      mat4d.rotateX(tmpMat4, mathUtils.deg2rad(tilt));
      mat4d.multiplyVec3(tmpMat4, PLANAR_UP, dir);
      vec3d.scale(dir, -1);
      mat4d.multiplyVec3(tmpMat4, PLANAR_NORTH, up);

      return {direction: dir, up: up};
    }

    function directionToHeadingTilt(position, direction, up, ret) {
      return cameraUtilsInternal.directionToHeadingTilt(direction, up, ret, PLANAR_UP, PLANAR_NORTH);
    }

    function eyeForCenterWithHeadingTilt(lookAt, distance, heading, tilt) {
      var dirup = headingTiltToDirectionUp(lookAt, heading, tilt);
      var eye = vec3d.add(vec3d.scale(dirup.direction, -distance, vec3d.create()), lookAt);

      return {
        up: dirup.up,
        eye: eye,
        heading: heading,
        tilt: tilt
      };
    }

    function lookAtTiltToEyeTilt(lookAt, distance, tilt) {
      return mathUtils.rad2deg(tilt);
    }

    function eyeTiltToLookAtTilt(lookAt, distance, tilt) {
      return mathUtils.deg2rad(tilt);
    }

    var tmpMinPos = vec3d.create(),
      tmpMaxPos = vec3d.create();

    function toExtent(view, center, gcdLon, gcdLat, retextent) {
      var renderSR = view.renderSpatialReference,
        mapSR = (view.map && view.map.spatialReference) || center.spatialReference;

      // Question (Joe): do we ever expect center to be in a different SR than mapSR? if not, we can save ourselves
      // the conversions below

      projectionUtils.pointToVector(center, tmpMinPos, renderSR);
      projectionUtils.pointToVector(center, tmpMaxPos, renderSR);

      tmpMinPos[0] -= gcdLon / 2;
      tmpMaxPos[0] += gcdLon / 2;

      tmpMinPos[1] -= gcdLat / 2;
      tmpMaxPos[1] += gcdLat / 2;

      projectionUtils.vectorToVector(tmpMinPos, renderSR, tmpMinPos, mapSR);
      projectionUtils.vectorToVector(tmpMaxPos, renderSR, tmpMaxPos, mapSR);

      if (!retextent) {
        retextent = new Extent(tmpMinPos[0], tmpMinPos[1], tmpMaxPos[0], tmpMaxPos[1], mapSR);
      } else {
        retextent.xmin = tmpMinPos[0];
        retextent.ymin = tmpMinPos[1];
        retextent.xmax = tmpMaxPos[0];
        retextent.ymax = tmpMaxPos[1];
        retextent.spatialReference = mapSR;
      }

      return retextent;
    }

    return cameraUtilsPlanar;
  }
);