define(["../../../geometry/SpatialReference", "../../../geometry/Point",
    "./mathUtils", "./earthUtils", "../lib/glMatrix",
    "../webgl-engine/lib/BufferVectorMath",
    "../webgl-engine/lib/proj4"],
  function (SpatialReference, Point,
            mathUtils, earthUtils, glMatrix,
            BufferVectorMath, proj4) {

    // Imports
    var vec3d = glMatrix.vec3d,
      mat4d = glMatrix.mat4d,
      bufferVec3 = BufferVectorMath.Vec3Compact;

    // Temp variables
    var outerTmpVec = vec3d.create(),
      innerTmpVec1 = vec3d.create(),
      innerTmpVec2 = vec3d.create();

    var deg2rad = mathUtils.deg2rad(1);
    var rad2deg = mathUtils.rad2deg(1);

    /*jshint multistr: true, quotmark: false */
    var SphericalRenderSpatialReference = new SpatialReference({ wkt: '\
      GEOCCS["Spherical geocentric",\
        DATUM["Not specified",\
          SPHEROID["Sphere",'+earthUtils.earthRadius+',0]],\
        PRIMEM["Greenwich",0.0,\
          AUTHORITY["EPSG","8901"]],\
        UNIT["m",1.0],\
        AXIS["Geocentric X",OTHER],\
        AXIS["Geocentric Y",EAST],\
        AXIS["Geocentric Z",NORTH]\
      ]\
    '});
    /*jshint multistr: false, quotmark: true */

    var projectionUtils = {
      SphericalRenderSpatialReference: SphericalRenderSpatialReference,

      vectorToVector: function(srcVector, srcSR, destVector, destSR) {
        if (srcVector.length === 2) {
          outerTmpVec[0] = srcVector[0];
          outerTmpVec[1] = srcVector[1];
          outerTmpVec[2] = 0;
          srcVector = outerTmpVec;
        }
        else if (srcVector === destVector) {
          // bufferToBuffer does not necessarily support in-situ projection
          vec3d.set(srcVector, outerTmpVec);
          srcVector = outerTmpVec;
        }
        return this.bufferToBuffer(srcVector, srcSR, 0, destVector, destSR, 0, 1);
      },

      pointToVector: function(srcPoint, destVector, destSR) {
        outerTmpVec[0] = srcPoint.x;
        outerTmpVec[1] = srcPoint.y;
        outerTmpVec[2] = srcPoint.z || 0;
        return this.bufferToBuffer(outerTmpVec, srcPoint.spatialReference, 0, destVector, destSR, 0, 1);
      },

      vectorToPoint: function(srcVector, srcSR, destPointOrSR, destSR) {
        var destPoint;
        if (destPointOrSR.declaredClass === "esri.SpatialReference") {
          destSR = destPointOrSR;
          destPoint = new Point({ spatialReference: destSR });
        }
        else {
          destPoint = destPointOrSR;
          destSR = destSR || destPoint.spatialReference;
        }
        if (this.bufferToBuffer(srcVector, srcSR, 0, outerTmpVec, destSR, 0, 1)) {
          destPoint.x = outerTmpVec[0];
          destPoint.y = outerTmpVec[1];
          destPoint.z = outerTmpVec[2];
          destPoint.spatialReference = destSR;
          return destPoint;
        }
        return null;
      },

      xyzToVector: function(x, y, z, srcSR, destVector, destSR) {
        outerTmpVec[0] = x;
        outerTmpVec[1] = y;
        outerTmpVec[2] = z;
        return this.bufferToBuffer(outerTmpVec, srcSR, 0, destVector, destSR, 0, 1);
      },

      bufferToBuffer: function(srcBuffer, srcSR, srcStart, destBuffer, destSR, destStart, count) {
        count = count || 1;

        var srcSRID = classifySpatialRef(srcSR),
          destSRID = classifySpatialRef(destSR),
          srcEndIndex = srcStart + 3*count,
          si, di;

        if (srcSRID === destSRID && (srcSRID !== SR_KEYS.UNKNOWN || srcSR.equals(destSR))) {
          for (si = srcStart, di = destStart; si < srcEndIndex; si++, di++) {
            destBuffer[di] = srcBuffer[si];
          }
        }
        else if ((srcSRID > SR_KEYS.UNKNOWN) && (destSRID > SR_KEYS.UNKNOWN)) {
          var srcToWGS84;
          if (destSRID !== SR_KEYS.WGS84) {
            var wgs84ToDest = fromWGS84Table[destSRID];
            if (srcSRID !== SR_KEYS.WGS84) {
              // neither src nor dest are WGS84, use WGS84 as intermediate step
              srcToWGS84 = toWGS84Table[srcSRID];
              for (si = srcStart, di = destStart; si < srcEndIndex; si += 3, di += 3) {
                srcToWGS84(srcBuffer, si, innerTmpVec1, 0, srcSR.wkid);
                wgs84ToDest(innerTmpVec1, 0, destBuffer, di);
              }
            }
            else {
              // src is WGS84
              for (si = srcStart, di = destStart; si < srcEndIndex; si += 3, di += 3) {
                wgs84ToDest(srcBuffer, si, destBuffer, di);
              }
            }
          }
          else {
            // dest is WGS84
            srcToWGS84 = toWGS84Table[srcSRID];
            for (si = srcStart, di = destStart; si < srcEndIndex; si += 3, di += 3) {
              srcToWGS84(srcBuffer, si, destBuffer, di, srcSR.wkid);
            }
          }
        }
        else {
          // cannot convert between known and unknown SR
          return false;
        }

        return true;
      },

      convertExtent: function(extent, destSR) {
        if (extent==null) {
          return null;
        }
        var min = [0,0,0];
        var max = [0,0,0];
        var converted = this.xyzToVector(extent.xmin, extent.ymin, extent.zmin||0, extent.spatialReference, min, destSR);
        converted = converted && this.xyzToVector(extent.xmax, extent.ymax, extent.zmax||0, extent.spatialReference, max, destSR);
        if (!converted)
        {
          return null;
        }
        return [min,max];
    },

    computeLinearTransformation: function(srcSR, originVector, destMatrix, destSR) {
        var srcSRID = classifySpatialRef(srcSR),
          destSRID = classifySpatialRef(destSR);

        if (srcSRID === destSRID && (srcSRID !== SR_KEYS.UNKNOWN || srcSR.equals(destSR))) {
          mat4d.identity(destMatrix);
          mat4d.translate(destMatrix, originVector);
          return true;
        }
        else if (destSRID === SR_KEYS.ENGINE_SPHR) {
          var srcToWGS84 = toWGS84Table[srcSRID];
          if (srcToWGS84) {
            srcToWGS84(originVector, 0, innerTmpVec1, 0, srcSR.wkid);
            wgs84ToSphericalEngineCoords(innerTmpVec1, 0, innerTmpVec2, 0);

            // Linear transformation from ENU to ECEF, transpose of that's described here:
            // http://gis.stackexchange.com/a/83155

            var lonRad = deg2rad * innerTmpVec1[0],
              latRad =   deg2rad * innerTmpVec1[1],
              sinLon = Math.sin(lonRad), cosLon = Math.cos(lonRad),
              sinLat = Math.sin(latRad), cosLat = Math.cos(latRad),
              m = destMatrix;

            m[0] = -sinLon; m[4] = -sinLat*cosLon; m[8]  = cosLat*cosLon;  m[12] = innerTmpVec2[0];
            m[1] =  cosLon; m[5] = -sinLat*sinLon; m[9]  = cosLat*sinLon;  m[13] = innerTmpVec2[1];
            m[2] = 0;       m[6] =  cosLat;        m[10] = sinLat;         m[14] = innerTmpVec2[2];
            m[3] = 0;       m[7] = 0;              m[11] = 0;              m[15] = 1;

            return true;
          }
        }
        else if (destSRID === SR_KEYS.WEBMERC) {
          if ((srcSRID === SR_KEYS.WGS84) || (srcSRID === SR_KEYS.UTM) || (srcSRID === SR_KEYS.ENGINE_SPHR)) {
            toWGS84Table[srcSRID](originVector, 0, innerTmpVec1, 0, srcSR.wkid);
            var latitude = deg2rad * innerTmpVec1[1];
            wgs84ToWebMerc(innerTmpVec1, 0, innerTmpVec2, 0);
            mat4d.identity(destMatrix);
            mat4d.translate(destMatrix, innerTmpVec2);

            // apply uniform scaling factor required to go from metric to WM
            var scale = 1/Math.cos(latitude);
            mat4d.scale(destMatrix, [scale, scale, 1]);
            return true;
          }
        }

        return false;
      },

      mbsToMbs: function(srcMbs, srcSR, destMbs, destSR) {
        var srcSRID = classifySpatialRef(srcSR),
            destSRID = classifySpatialRef(destSR);

        if (srcSRID === destSRID && (srcSRID !== SR_KEYS.UNKNOWN || srcSR.equals(destSR))) {
          destMbs[0]=srcMbs[0];
          destMbs[1]=srcMbs[1];
          destMbs[2]=srcMbs[2];
          destMbs[3]=srcMbs[3];
          return true;
        }
        else if (destSRID === SR_KEYS.ENGINE_SPHR) {
          var srcToWGS84 = toWGS84Table[srcSRID];
          if (srcToWGS84) {
            srcToWGS84(srcMbs, 0, innerTmpVec1, 0, srcSR.wkid);
            wgs84ToSphericalEngineCoords(innerTmpVec1, 0, destMbs, 0);

            // radius is assumed to be already in meters. (correct for global wgs84 caches)
            destMbs[3] = srcMbs[3];
            return true;
          }
        }
        else if (destSRID === SR_KEYS.WEBMERC) {
          if ((srcSRID === SR_KEYS.WGS84) || (srcSRID === SR_KEYS.UTM) || (srcSRID === SR_KEYS.ENGINE_SPHR)) {
            toWGS84Table[srcSRID](srcMbs, 0, innerTmpVec1, 0, srcSR.wkid);

            // compute highest latitude for a conservative radius estimation
            var latitude = deg2rad * innerTmpVec1[1];
            latitude = Math.abs(latitude) + Math.asin(srcMbs[3] / (EARTH_RADIUS+srcMbs[2]));

            wgs84ToWebMerc(innerTmpVec1, 0, destMbs, 0);

            if (latitude > Math.PI * 0.9999)
            {
              destMbs[3] = Number.MAX_VALUE;
            }
            else
            {
              var scale = 1/Math.cos(latitude);
              destMbs[3] = scale * srcMbs[3];
            }
            return true;
          }
        }

        return false;
      },

      extentToBoundingBox: function(extent, bb, srDest) {
        if (extent == null) {
          return false;
        }
        var result = true;
        outerTmpVec[0] = extent.xmin != null ? extent.xmin : 0;
        outerTmpVec[1] = extent.ymin != null ? extent.ymin : 0;
        outerTmpVec[2] = extent.zmin != null ? extent.zmin : 0;
        result = result && this.bufferToBuffer(outerTmpVec, extent.spatialReference, 0, bb, srDest, 0, 1);
        outerTmpVec[0] = extent.xmax != null ? extent.xmax : 0;
        outerTmpVec[1] = extent.ymax != null ? extent.ymax : 0;
        outerTmpVec[2] = extent.zmax != null ? extent.zmax : 0;
        result = result && this.bufferToBuffer(outerTmpVec, extent.spatialReference, 0, bb, srDest, 3, 1);
        if (extent.xmin == null) { bb[0] = -Infinity; }
        if (extent.ymin == null) { bb[1] = -Infinity; }
        if (extent.zmin == null) { bb[2] = -Infinity; }
        if (extent.xmax == null) { bb[3] =  Infinity; }
        if (extent.ymax == null) { bb[4] =  Infinity; }
        if (extent.zmax == null) { bb[5] =  Infinity; }
        return result;
      },

      extentToBoundingRect: function(extent, rect, srDest) {
        if (extent == null) {
          return false;
        }
        var result = true;
        outerTmpVec[0] = extent.xmin != null ? extent.xmin : 0;
        outerTmpVec[1] = extent.ymin != null ? extent.ymin : 0;
        outerTmpVec[2] = extent.zmin != null ? extent.zmin : 0;
        result = result && this.bufferToBuffer(outerTmpVec, extent.spatialReference, 0, outerTmpVec, srDest, 0, 1);
        rect[0] = outerTmpVec[0];
        rect[1] = outerTmpVec[1];
        outerTmpVec[0] = extent.xmax != null ? extent.xmax : 0;
        outerTmpVec[1] = extent.ymax != null ? extent.ymax : 0;
        outerTmpVec[2] = extent.zmax != null ? extent.zmax : 0;
        result = result && this.bufferToBuffer(outerTmpVec, extent.spatialReference, 0, outerTmpVec, srDest, 0, 1);
        rect[2] = outerTmpVec[0];
        rect[3] = outerTmpVec[1];
        if (extent.xmin == null) { rect[0] = -Infinity; }
        if (extent.ymin == null) { rect[1] = -Infinity; }
        if (extent.xmax == null) { rect[2] =  Infinity; }
        if (extent.ymax == null) { rect[3] =  Infinity; }
        return result;
      },

      wkidIsUTM: wkidIsUTM,

      utmWkidFromWGS84: function(mbs) {
        var lat = mbs[1];
        var lon = mbs[0];
        var utm = proj4.LLtoUTM(lat, lon);
        if (utm.zoneLetter>="N") {
          var wkid =  32600+utm.zoneNumber;
        }
        else {
          wkid =  32700+utm.zoneNumber;
        }
        return wkid;
      },

      webMercator: {
        x2lon: function(x) {
          // returns longitude in radians!
          return x / EARTH_RADIUS;
        },

        y2lat: function(y) {
          // returns latitude in radians!
          return (Math.PI / 2) - (2 * Math.atan(Math.exp(-1 * y / EARTH_RADIUS)));
        },

        lon2x: function(lonRad) {
          // expects longitude in radians!
          return lonRad * EARTH_RADIUS;
        },

        lat2y: function(latRad) {
          // expects latitude in radians!
          var sinLat = Math.sin(latRad);
          return EARTH_RADIUS / 2 * Math.log((1 + sinLat) / (1 - sinLat));
        }
      }
    };

    var WKID_WGS84 = SpatialReference.WGS84.wkid,
      EARTH_RADIUS = earthUtils.earthRadius;

    var SR_KEYS = {
      UNKNOWN: 0,
      ENGINE_SPHR: 1, // from here on down, we're in known land
      WGS84: 2,
      WEBMERC: 3,
      UTM: 4
    };

    var classifySpatialRef = function(spatialRef) {
      var result;
      if (spatialRef === SphericalRenderSpatialReference) {
        result = SR_KEYS.ENGINE_SPHR;
      }
      else if (spatialRef.wkid === WKID_WGS84) {
        result = SR_KEYS.WGS84;
      }
      else if (spatialRef.isWebMercator()) {
        result = SR_KEYS.WEBMERC;
      }
      else if (wkidIsUTM(spatialRef.wkid)) {
        result = SR_KEYS.UTM;
      }
      else {
        result = SR_KEYS.UNKNOWN;
      }
      return result;
    };

    var copy3 = function (src, srcIndex, dest, destIndex) {
      dest[destIndex++] = src[srcIndex++];
      dest[destIndex++] = src[srcIndex++];
      dest[destIndex]   = src[srcIndex];
    };

    var webMercToWGS84 = function(src, srcIndex, dest, destIndex) {
      // code adapted from esri/geometry/webMercatorUtils
      dest[destIndex++] = rad2deg * (src[srcIndex++] / EARTH_RADIUS);
      dest[destIndex++] = rad2deg * (Math.PI / 2 - (2 * Math.atan(Math.exp(-1.0 * src[srcIndex++] / EARTH_RADIUS))));
      dest[destIndex] = src[srcIndex];
    };

    var wgs84ToWebMerc = function(src, srcIndex, dest, destIndex) {
      // code adapted from esri/geometry/webMercatorUtils
      var almostHalfPI = 0.4999999*Math.PI,
        lat = deg2rad * src[srcIndex + 1];

      lat = mathUtils.clamp(lat, -almostHalfPI, almostHalfPI);

      var sinLat = Math.sin(lat);

      dest[destIndex++] = deg2rad * src[srcIndex] * EARTH_RADIUS;
      dest[destIndex++] = EARTH_RADIUS/2.0 * Math.log( (1.0 + sinLat) / (1.0 - sinLat));
      dest[destIndex] = src[srcIndex + 2];
    };

    var wgs84ToSphericalEngineCoords = function(src, srcIndex, dest, destIndex) {
      var radius = EARTH_RADIUS + src[srcIndex + 2],
        lat = deg2rad * src[srcIndex + 1],
        lon = deg2rad * src[srcIndex],
        cosLat = Math.cos(lat);
      dest[destIndex++] = Math.cos(lon) * cosLat * radius;
      dest[destIndex++] = Math.sin(lon) * cosLat * radius;
      dest[destIndex]   = Math.sin(lat) * radius;
    };

    var sphericalEngineCoordsToWGS84 = function(src, srcIndex, dest, destIndex) {
      var radius = bufferVec3.length(src, srcIndex);
      var latRad = mathUtils.asin(src[srcIndex + 2] / radius),
        cosLat = Math.cos(latRad),
        lonRad = ((src[srcIndex + 1] > 0) ? 1 : -1) * mathUtils.acos(src[srcIndex] / (cosLat * radius));
      dest[destIndex++] = rad2deg * lonRad;
      dest[destIndex++] = rad2deg * latRad;
      dest[destIndex]   = radius - EARTH_RADIUS;
    };

    var wgs84ToUTM = function(src, srcIndex, dest, destIndex) {
      var tmpResult = proj4.LLtoUTM(src[srcIndex + 1], src[srcIndex]);
      dest[destIndex++] = tmpResult.easting;
      dest[destIndex++] = tmpResult.northing;
      dest[destIndex]   = src[srcIndex + 2];
    };

    var utmToWGS84 = function(src, srcIndex, dest, destIndex, wkid) {
      var zoneNumber, zoneLetter;

      if ((wkid >= 32601) && (wkid <= 32660)) {
        zoneNumber = wkid - 32600;
        zoneLetter = "N";
      }
      else {
        zoneNumber = wkid - 32700;
        zoneLetter = "M";
      }

      var ll = proj4.UTMtoLL({
        easting: src[srcIndex++],
        northing: src[srcIndex++],
        zoneLetter:zoneLetter,
        zoneNumber:zoneNumber
      });

      dest[destIndex++] = ll.lon;
      dest[destIndex++] = ll.lat;
      dest[destIndex]   = src[srcIndex];
    };

    function wkidIsUTM(wkid) {
      return ((wkid >= 32601) && (wkid <= 32660)) || ((wkid >= 32701) && (wkid <= 32760));
    }

    var fromWGS84Table = [
      undefined,
      wgs84ToSphericalEngineCoords,
      copy3,
      wgs84ToWebMerc,
      wgs84ToUTM
    ];

    var toWGS84Table = [
      undefined,
      sphericalEngineCoordsToWGS84,
      copy3,
      webMercToWGS84,
      utmToWGS84
    ];

    return projectionUtils;
  }
);