define(["./mathUtils", "../lib/glMatrix"],
  function (mathUtils, glMatrix) {

    // Imports
    var vec3d = glMatrix.vec3d;

    // Temp variables
    var tmpVec1 = vec3d.create(),
      tmpVec2 = vec3d.create();

    function directionToHeadingTilt(direction, up, ret, tangentPlaneNormal, projectedNorthDir) {
      // project view direction
      var projectedViewDir = tmpVec1;
      vec3d.normalize(direction, projectedViewDir);

      var tmp = Math.abs(vec3d.dot(projectedViewDir, tangentPlaneNormal));
      if (tmp > 0.99) {
        // if view direction is perpendicular to tangent plane, use up vector instead
        tmp = Math.abs(vec3d.dot(up, tangentPlaneNormal));
        if (tmp < 0.99) {
          vec3d.set(up, projectedViewDir);
        }
        else {
          // if up vector is also perpendicular to tangent plane, we're outta luck,
          // don't compute heading
          projectedViewDir = null;
        }
      }

      var heading = 0;
      if (projectedViewDir) {
        vec3d.scale(tangentPlaneNormal, vec3d.dot(tangentPlaneNormal, projectedViewDir), tmpVec2);
        vec3d.subtract(projectedViewDir, tmpVec2);

        var dot = vec3d.dot(projectedViewDir, projectedNorthDir);
        var cos = dot / (vec3d.length(projectedViewDir)*vec3d.length(projectedNorthDir));
        vec3d.cross(projectedViewDir, projectedNorthDir, tmpVec2);
        var sign = (vec3d.dot(tmpVec2, tangentPlaneNormal) > 0) ? 1 : -1;
        heading = sign * mathUtils.rad2deg(mathUtils.acos(cos));
      }

      var tilt = mathUtils.rad2deg(mathUtils.acos(-vec3d.dot(tangentPlaneNormal, direction) / vec3d.length(direction)));

      if (!ret) {
        return { heading: heading, tilt: tilt };
      } else {
        ret.heading = heading;
        ret.tilt = tilt;
        return ret;
      }
    }

    return {
      directionToHeadingTilt: directionToHeadingTilt
    };
  }
);