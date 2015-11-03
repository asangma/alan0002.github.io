define(["../../../geometry/SpatialReference",
    "../../../geometry/Extent",
    "../../../geometry/support/webMercatorUtils",

    "./mathUtils",
    "./earthUtils",
    "../lib/glMatrix",
    "./cameraUtilsInternal"],
  function (SpatialReference, Extent, webMercatorUtils,
    mathUtils, earthUtils, glMatrix, cameraUtilsInternal) {

    var cameraUtilsSpherical = {
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
    var UP_DIR = vec3d.createFrom(0, 0, 1),
      FALLBACK_UP_DIR = vec3d.normalize(vec3d.createFrom(1, 1, 1));
    var longitudeCyclical = new mathUtils.Cyclical(-180, 180);

    // Temp vars
    var tmpMat4 = mat4d.create(),
      tmpVec1 = vec3d.create(),
      tmpVec2 = vec3d.create();

    function headingTiltToDirectionUp(position, heading, tilt) {
      var dir = vec3d.create(),
        up = vec3d.create();

      vec3d.cross(position, UP_DIR, tmpVec1);
      if (vec3d.dot(tmpVec1, tmpVec1) === 0) {
        // position is collinear with UP_DIR
        vec3d.cross(position, FALLBACK_UP_DIR, tmpVec1);
      }

      mat4d.identity(tmpMat4);
      mat4d.rotate(tmpMat4, -mathUtils.deg2rad(heading), position);
      mat4d.rotate(tmpMat4, -mathUtils.deg2rad(tilt), tmpVec1);

      vec3d.cross(tmpVec1, position, up);
      vec3d.normalize(up);
      mat4d.multiplyVec3(tmpMat4, up);

      vec3d.normalize(position, dir);
      mat4d.multiplyVec3(tmpMat4, vec3d.negate(dir));

      return {direction: dir, up: up};
    }

    function directionToHeadingTilt(position, direction, up, ret) {
      var tangentPlaneNormal = tmpVec1,
        projectedNorthDir = tmpVec2;
      vec3d.normalize(position, tangentPlaneNormal);
      vec3d.cross(tangentPlaneNormal, UP_DIR, tmpVec2);
      if (vec3d.dot(tmpVec2, tmpVec2) === 0) {
        // position is collinear with UP_DIR
        vec3d.cross(tangentPlaneNormal, FALLBACK_UP_DIR, tmpVec2);
      }
      vec3d.cross(tmpVec2, tangentPlaneNormal, projectedNorthDir);

      return cameraUtilsInternal.directionToHeadingTilt(direction, up, ret, tangentPlaneNormal, projectedNorthDir);
    }

    function eyeForCenterWithHeadingTilt(lookAt, distance, heading, tilt) {
      /* Computes a camera center for a given distance from lookAt, heading
       * and tilt. This solves the following equation:
       *
       * F(p) = p + N * (R(heading, p) * R(tilt, p x [0, 1, 0]) * -p) - P == 0       [1]
       *
       * for the camera position 'p' with:
       *   N: the distance from the camera eye to the lookAt
       *   heading: the resulting camera heading
       *   tilt: the resulting camera tilt
       *   P: the camera lookAt
       *   R: a 3d axis-angle rotation function (normalizes axis)
       */
      var ret = {
        eye: vec3d.create(),
        tilt: tilt,
        heading: heading
      };

      var P = tmpVec1;
      // convert from ENU to y-up/z-west (the following code is designed for the latter)
      P[0] = lookAt[0];
      P[1] = lookAt[2];
      P[2] = -lookAt[1];

      var N = distance;

      var headingRad = mathUtils.deg2rad(heading);
      var tiltRad = mathUtils.deg2rad(tilt);

      // Common subexpressions
      var sh = Math.sin(headingRad);
      var ch = Math.cos(headingRad);

      var st = Math.sin(tiltRad);
      var ct = Math.cos(tiltRad);

      var LP = vec3d.length(P);
      var L;

      if (Math.abs(tiltRad) < 1e-8) {
        L = N + LP;
      } else {
        var LPst = LP / st;
        var eyePAng = mathUtils.asin(N / LPst);
        var eyePPAng = Math.PI - tiltRad - eyePAng;

        L = LPst * Math.sin(eyePPAng);
      }

      var st2 = st * st;
      var ch2 = ch * ch;
      var sh2 = sh * sh;

      var N2 = N * N;

      var stN = st * N;
      var ctN = ct * N;

      var chNst = ch * stN;

      var LmctN = L - ctN;
      var LmctN2 = LmctN * LmctN;

      var N2st2 = N2 * st2;
      var ch2N2st2 = ch2 * N2st2;
      var sh2N2st2 = sh2 * N2st2;

      // Calculate ret.eye[1] first
      var p2B = P[1] * LmctN;
      var p2A2 = ch2N2st2 * (ch2N2st2 + LmctN2 - P[1] * P[1]);

      if (p2A2 < 0) {
        vec3d.scale(P, L / LP, ret.eye);
        ret.tilt = 0;

        return ret;
      }

      var p2A = Math.sqrt(p2A2);
      var p2d = ch2N2st2 + LmctN2;
      var p2N;

      // Separate cases depending on the heading angle
      if (ch > 0) {
        p2N = -p2A + p2B;
      } else {
        p2N = p2A + p2B;
      }

      // Catch ill-conditioned case where p2d ~= 0 and return directly.
      if (Math.abs(p2d) < 1e-8) {
        if (LP < 1e-8) {
          ret.eye[0] = 0;
          ret.eye[1] = 0;
          ret.eye[2] = N;
        }
        else {
          vec3d.scale(P, L / LP, ret.eye);
        }

        ret.tilt = 0;

        euwToEnu(ret.eye);
        return completeWithUp(ret, lookAt);
      } else {
        ret.eye[1] = p2N / p2d;
      }

      // Common subexpressions based on p2
      var p22 = ret.eye[1] * ret.eye[1];
      var chNp2st = chNst * ret.eye[1];
      var _1mp22 = 1 - p22;
      var s1mp22 = Math.sqrt(_1mp22);

      // Calculate the common denominator to calculate p1 and p3
      var denom = ch2N2st2 * p22 + sh2N2st2 - 2 * chNp2st * s1mp22 * LmctN + _1mp22 * LmctN2;

      // TODO: check under which conditions this might happen
      if (Math.abs(denom) < 1e-8) {
        vec3d.scale(P, L / LP, ret.eye);
        ret.tilt = 0;

        euwToEnu(ret.eye);
        return completeWithUp(ret, lookAt);
      }

      // Calculate p1 and p3
      ret.eye[0] = (_1mp22 * (L * P[0] - ctN * P[0]) - stN * s1mp22 * (P[0] * ret.eye[1] * ch + P[2] * sh)) / denom;
      ret.eye[2] = (_1mp22 * (L * P[2] - ctN * P[2]) - stN * s1mp22 * (P[2] * ret.eye[1] * ch - P[0] * sh)) / denom;

      vec3d.scale(ret.eye, L);

      euwToEnu(ret.eye);
      return completeWithUp(ret, lookAt);
    }

    function euwToEnu(vec) {
      var t = vec[1];
      vec[1] = -vec[2];
      vec[2] = t;
    }

    function completeWithUp(ret, position) {
      var dirup = headingTiltToDirectionUp(position, ret.heading, ret.tilt);
      ret.up = dirup.up;

      return ret;
    }

    function lookAtTiltToEyeTilt(lookAt, distance, tilt) {
      var lookAtLength = vec3d.length(lookAt);
      var eyeLength = Math.sqrt(distance * distance + lookAtLength * lookAtLength - 2 * distance * lookAtLength * Math.cos(Math.PI - tilt));
      var lt = mathUtils.asin(distance / (eyeLength / Math.sin(tilt)));

      return mathUtils.rad2deg(tilt - lt);
    }

    function eyeTiltToLookAtTilt(lookAt, distance, tilt) {
      var tiltRad = mathUtils.deg2rad(tilt);
      var lookAtLength = vec3d.length(lookAt);
      var lt = mathUtils.asin(distance / (lookAtLength / Math.sin(tiltRad)));

      return lt + tiltRad;
    }

    function toExtent(view, center, gcdLon, gcdLat, retextent) {
      var minLon, maxLon, minLat, maxLat;
      var cLatDeg = center.latitude;

      // Compute longitude bounds
      var cLonDeg = center.longitude;
      var dHalfLon = earthUtils.getLonDeltaForDistance(cLonDeg, cLatDeg, gcdLon) / 2;

      // Note: we keep minLon/maxLon in degrees
      minLon = cLonDeg - dHalfLon;
      maxLon = cLonDeg + dHalfLon;

      // Compute latitude bounds
      var cLat = mathUtils.deg2rad(cLatDeg);

      var r = earthUtils.earthRadius;
      var b = (1 + Math.sin(cLat)) / (1 - Math.sin(cLat));
      var bp1 = b + 1;
      var tanao4 = Math.tan((gcdLat / r) / 2);
      var bp1tanao4 = bp1 * tanao4;
      var bp1tanao42 = bp1tanao4 * bp1tanao4;

      minLat = 1.5 * Math.PI - 2 * Math.atan(0.5 * (bp1tanao4 + Math.sqrt(4 * b + bp1tanao42)));
      maxLat = minLat + (gcdLat / r);

      var normUnaliasLat = function(lat) {
        var hpi = Math.PI / 2;
        lat = mathUtils.cyclical2PI.normalize(lat, -hpi);

        if (lat > hpi) {
          lat = Math.PI - lat;
        }

        return lat;
      };

      // Normalize in -0.5pi:1.5pi, then unalias to -0.5pi:0.5pi
      minLat = normUnaliasLat(minLat);
      maxLat = normUnaliasLat(maxLat);

      if (maxLat < minLat) {
        var tmp = maxLat;
        maxLat = minLat;
        minLat = tmp;
      }

      // Clip latitude between -90 and 90
      minLat = Math.max(mathUtils.rad2deg(minLat), -90);
      maxLat = Math.min(mathUtils.rad2deg(maxLat), 90);

      // Ensure monotonicity
      maxLon = longitudeCyclical.monotonic(minLon, maxLon);

      // Make sure the longitude does not span more than 180 degrees
      if (maxLon - minLon > 180) {
        var hd = ((maxLon - minLon) - 180) / 2;
        minLon += hd;
        maxLon -= hd;
      }

      if (!retextent) {
        // Finally, create appropriate extent and convert it to webmercator if needed
        retextent = new Extent(minLon, minLat, maxLon, maxLat, SpatialReference.WGS84);
      } else {
        retextent.xmin = minLon;
        retextent.ymin = minLat;
        retextent.xmax = maxLon;
        retextent.ymax = maxLat;
        retextent.spatialReference = SpatialReference.WGS84;
      }

      if (view.map.spatialReference && view.map.spatialReference.isWebMercator()) {
        webMercatorUtils.geographicToWebMercator(retextent, false, retextent);
      }

      return retextent;
    }

    return cameraUtilsSpherical;
  }
);