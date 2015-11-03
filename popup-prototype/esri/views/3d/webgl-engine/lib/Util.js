/* jshint bitwise:false, forin:false */
define([
  "./gl-matrix"
  ], function (glMatrix) {

  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var mat4d = glMatrix.mat4d;

  var tmpInvProjViewMat = mat4d.create();

  var tmpCube = [
    vec4d.createFrom(-1.0, -1.0, -1.0, 1.0), 
    vec4d.createFrom( 1.0, -1.0, -1.0, 1.0), 
    vec4d.createFrom( 1.0,  1.0, -1.0, 1.0), 
    vec4d.createFrom(-1.0,  1.0, -1.0, 1.0), 
    vec4d.createFrom(-1.0, -1.0,  1.0, 1.0), 
    vec4d.createFrom( 1.0, -1.0,  1.0, 1.0), 
    vec4d.createFrom( 1.0,  1.0,  1.0, 1.0), 
    vec4d.createFrom(-1.0,  1.0,  1.0, 1.0)
  ];

  var tmpVec4 = vec4d.create();
  var tmpFrustum = new Array(8);

  for (var i = 0; i < 8; ++i) {
    tmpFrustum[i] = vec3d.create();
  }

  var tmpD0 = vec3d.create();
  var tmpD1 = vec3d.create();
  var tmpPos = vec3d.create();

  var tmpP13 = vec3d.create();
  var tmpP43 = vec3d.create();
  var tmpP21 = vec3d.create();
  var tmpPa  = vec3d.create();
  var tmpPb  = vec3d.create();

  var tmpN = vec3d.create();
  var tmpT = vec3d.create();
  var tmpUv = vec3d.create();
  var tmpV = vec3d.create();
  var tmpU = vec3d.create();
  var tmpP = vec3d.create();

  function AssertException(message) {
    this.message = message;
  }

  AssertException.prototype.toString = function() {
    return "AssertException: " + this.message;
  };

  var Util = {
    EARTH_RADIUS: 6378137,
    METER2FEET: 3.28084,
    ECCENTRICITY_SQUARED: 0.006694379990141399742371834884, //First eccentricity squared

    AssertException: AssertException,

    VertexAttrConstants: {
        POSITION: "position",
        NORMAL: "normal",
        UV0: "uv0",
        AUXPOS1: "auxpos1",
        AUXPOS2: "auxpos2",
        COLOR: "color",
        SIZE: "size",
        REGION: "region"
    },

    assert: function(exp, message) {
      if (!exp) {
        var d = new Error("dummy");

        if (d.stack) {
          console.log(d.stack);
        }

        throw new AssertException(message);
      }
    },

    verify: function(exp, message) {
      if (!exp) {
        console.log("Verify failed: " + message);
        console.log(new Error("dummy").stack);
      }
    },

    createQuadVertexUvBuffer: function(MatrixType) {
      MatrixType = MatrixType || Float32Array;

      var vert = new MatrixType(20);

      vert[0] = -1.0;
      vert[1] = -1.0;
      vert[2] = 0.0;
      vert[3] = 0.0;
      vert[4] = 0.0; 

      vert[5] = 1.0;
      vert[6] = -1.0;
      vert[7] = 0.0;
      vert[8] = 1.0;
      vert[9] = 0.0; 

      vert[10] = -1.0;
      vert[11] = 1.0;
      vert[12] = 0.0;
      vert[13] = 0.0;
      vert[14] = 1.0; 
      
      vert[15] = 1.0;
      vert[16] = 1.0;
      vert[17] = 0.0;
      vert[18] = 1.0;
      vert[19] = 1.0;
      
      return vert;
    },
 
    isPowerOfTwo: function(x) {
      return (x & (x - 1)) === 0;
    },
 
    lerp: function(number0, number1, w) {
      return number0 + (number1 - number0) * w; 
    },

    clamp: function(number, from, to) {
      if (number < from) {
        return from;
      }

      if (number > to) {
        return to;
      }

      return number;
    },

    fallbackIfUndefined: function(value, fallback) {
      return value === undefined ? fallback : value;
    },

    hex2rgb: function(hex) {
      hex = Math.floor(hex);

      var r = (hex >> 16 & 255) / 255;
      var g = (hex >> 8 & 255) / 255;
      var b = (hex & 255) / 255;

      return [r, g, b];
    },

    rgb2hex: function(rgb) {
      var r = Util.clamp(Math.round(rgb[0] * 255), 0, 255);
      var g = Util.clamp(Math.round(rgb[1] * 255), 0, 255);
      var b = Util.clamp(Math.round(rgb[2] * 255), 0, 255);

      return "0x" + ((r << 16) + (g << 8) + b).toString(16);
    },

    dec2hex: function(number) {
      var hex = number.toString(16);
      return "00000000".substr(0, 8 - hex.length) + hex; 
    },

    deg2rad: function(deg) {
      return deg / 180.0 * Math.PI;
    },

    rad2deg: function(rad) {
      return rad * 180.0 / Math.PI;
    },

    azimuthElevationAngle2Direction: function(azimuthAngle, elevationAngle) {
      var a = 1.5 * Math.PI - azimuthAngle;
      var e = 0.5 * Math.PI - elevationAngle;
      
      var x = Math.cos(a) * Math.sin(e);
      var y = Math.cos(e);
      var z = Math.sin(a) * Math.sin(e);
      
      return [x, y, z];  
    },

    rayPlane: function(p, d, plane, result) {
      var dot = vec3d.dot(plane, d);

      if (dot === 0.0) {
        return false; // parallel
      }
      
      var t = -(vec3d.dot(plane, p) + plane[3]) / dot;    // t < .0: back

      vec3d.add(p, vec3d.scale(d, t, result), result);

      return true;
    },

    raySphereClosestPositive: function(p, d, radius, outResult) {
      var a = vec3d.dot(d, d);
      var b = 2 * vec3d.dot(d, p);
      var c = vec3d.dot(p, p) - radius * radius;
      
      var disc = b * b - 4 * a * c;
      
      if (disc < 0) {
        return false;
      }
      
      var discSqrt = Math.sqrt(disc);
      var t0 = (-b - discSqrt) / (2 * a);
      var t1 = (-b + discSqrt) / (2 * a);
      
      // return the smallest positive t
      if ((t0 < 0) || (t1 < t0) && (t1 > 0)) {
        t0 = t1;
      }

      if (t0 > 0) {
        vec3d.add(p, vec3d.scale(d, t0, outResult), outResult);
        return true;
      } else {
        return false;
      }
    },

    /*
     * 3D ray-triangle intersection. (Fast, minimum storage ray-triangle
     * intersection. Tomas Moeller and Ben Trumbore. Journal of Graphics Tools,
     * 2(1):21--28, 1997.) Checks whether a ray intersects a triangle, calculates
     * point of intersection (POI) and returns distance to ray-origin and
     * barycentric coordinates of the POI.
     */ 

    rayTriangle3D: function(o, d, v0, v1, v2, i0, i1, i2, destTUV) {
      var EPS5 = 0.00001;
      
      if (!destTUV) {
        destTUV = vec3d.create();
      }

      var e1x = v1[i1]   - v0[i0];
      var e1y = v1[i1 + 1] - v0[i0 + 1];
      var e1z = v1[i1 + 2] - v0[i0 + 2];

      var e2x = v2[i2]   - v0[i0];
      var e2y = v2[i2 + 1] - v0[i0 + 1];
      var e2z = v2[i2 + 2] - v0[i0 + 2];

      // p = d x e2
      var px = d[1] * e2z - e2y * d[2];
      var py = d[2] * e2x - e2z * d[0];
      var pz = d[0] * e2y - e2x * d[1];

      var a = e1x * px + e1y * py + e1z * pz;

      if (a > -EPS5 && a < EPS5) {
        return false;
      }

      var f = 1.0 / a;
      var sx = o[0] - v0[i0];
      var sy = o[1] - v0[i0 + 1];
      var sz = o[2] - v0[i0 + 2];

      destTUV[1] = f * (sx * px + sy * py + sz * pz);

      if (destTUV[1] < 0.0 || destTUV[1] > 1.0) {
        return false;  
      }

      // q = s x e1;
      var qx = sy * e1z - e1y * sz;
      var qy = sz * e1x - e1z * sx;
      var qz = sx * e1y - e1x * sy;

      destTUV[2] = f * (d[0] * qx + d[1] * qy + d[2] * qz);

      if (destTUV[2] < 0.0 || destTUV[1] + destTUV[2] > 1.0) {
        return false;  
      }
      
      destTUV[0] = f * (e2x * qx + e2y * qy + e2z * qz);
      return true;
    },

    // ripped from http://www.scratchapixel.com/lessons/3d-basic-lessons/lesson-7-intersecting-simple-shapes/ray-box-intersection/
    rayBoxTest: function(o, d, bmin, bmax) {
      var tmp;

      var tmin = (bmin[0] - o[0]) / d[0];
      var tmax = (bmax[0] - o[0]) / d[0];

      if (tmin > tmax) {
        tmp = tmin;
        tmin = tmax;
        tmax = tmp;
      }

      var tymin = (bmin[1] - o[1]) / d[1];
      var tymax = (bmax[1] - o[1]) / d[1];

      if (tymin > tymax) {
        tmp = tymin;
        tymin = tymax;
        tymax = tmp;
      }
      
      if ((tmin > tymax) || (tymin > tmax)) {
        return false;
      }

      if (tymin > tmin) {
        tmin = tymin;
      }

      if (tymax < tmax) {
        tmax = tymax;
      }

      var tzmin = (bmin[2] - o[2]) / d[2];
      var tzmax = (bmax[2] - o[2]) / d[2];

      if (tzmin > tzmax) {
        tmp = tzmin;
        tzmin = tzmax;
        tzmax = tmp;
      }
      
      if ((tmin > tzmax) || (tzmin > tmax)) {
        return false;
      }

      if (tzmax < tmax) {
        tmax = tzmax;
      }

      if (tmax < 0) {
        return false;
      }

      return true;
    },

    rayRay2D: function(p1, p2, p3, p4, y, result) {
      if (!result) {
        result = vec2d.create();
      }

      var denom = (p4[y] - p3[y]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[y] - p1[y]);
      var nom1 = (p4[0] - p3[0]) * (p1[y] - p3[y]) - (p4[y] - p3[y]) * (p1[0] - p3[0]);

      if (denom === 0.0) {
        return false;
      }

      var ua = nom1 / denom;

      result[0] = p1[0] + ua * (p2[0] - p1[0]);
      result[1] = p1[y] + ua * (p2[y] - p1[y]);

      return true;
    },

    matrix2frustum: function(view, proj, result) {
      mat4d.multiply(proj, view, tmpInvProjViewMat);
      mat4d.inverse(tmpInvProjViewMat);
      
      for (var i = 0; i < 8; ++i) {
        mat4d.multiplyVec4(tmpInvProjViewMat, tmpCube[i], tmpVec4);
        vec3d.set3(tmpVec4[0] / tmpVec4[3], tmpVec4[1] / tmpVec4[3], tmpVec4[2] / tmpVec4[3], result[i]);
      }
    },

    matrix2frustumPlanes: function(view, proj, points, result) {
      if (result === undefined) {
        result = points;
        points = tmpFrustum;
      }

      Util.matrix2frustum(view, proj, points);

      Util.point2plane(points[4], points[0], points[3], result[0]);  // left
      Util.point2plane(points[1], points[5], points[6], result[1]);  // right
      Util.point2plane(points[4], points[5], points[1], result[2]);  // bottom
      Util.point2plane(points[3], points[2], points[6], result[3]);  // top
      Util.point2plane(points[0], points[1], points[2], result[4]);  // near
      Util.point2plane(points[5], points[4], points[7], result[5]);  // far
    },

    point2plane: function(p0, p1, p2, result) {
      vec3d.subtract(p0, p1, tmpD0);
      vec3d.subtract(p2, p1, tmpD1);
      vec3d.cross(tmpD1, tmpD0, result);
      vec3d.normalize(result);
      result[3] = -vec3d.dot(result, p0);  
    },

    project: function(src, view, proj, viewport, dst) {
      if (!dst) {
        dst = src;
      }

      tmpVec4[0] = src[0]; tmpVec4[1] = src[1]; tmpVec4[2] = src[2]; tmpVec4[3] = 1;
      mat4d.multiplyVec4(view, tmpVec4);

      if (dst.length > 2) {
        dst[2] = -tmpVec4[2];
      }

      mat4d.multiplyVec4(proj, tmpVec4);

      Util.assert(tmpVec4[3] !== 0);
      dst[0] = tmpVec4[0] / tmpVec4[3]; dst[1] = tmpVec4[1] / tmpVec4[3]; dst[2] = tmpVec4[2] / tmpVec4[3];
      dst[0] = (dst[0]*0.5 + 0.5) * viewport[2] + viewport[0];
      dst[1] = (dst[1]*0.5 + 0.5) * viewport[3] + viewport[1];
    },

    geodeticToGeocentricLatidude: function(geodeticLat) {
        // source http://en.wikipedia.org/wiki/Latitude#Geodetic_and_geocentric_latitudes
        return Math.atan((1.0 - Util.ECCENTRICITY_SQUARED) * Math.tan(geodeticLat));
    },

    latLon2positionWGS84Ellipsoid: function(lat, lon, alt, result) {
      // source: http://en.wikipedia.org/wiki/Geodetic_system#From_geodetic_to_ECEF
      // lat = geodetic latitude (radians)
      // lon = longitude (radians)
      // alt = height above WGS84 ellipsoid (m)

      var a = 6378137; // semi major axis a

      var N = a / Math.sqrt(1 - Util.ECCENTRICITY_SQUARED * Math.pow(Math.sin(lat), 2));

      // swapped coord order to match our engine coords
      var cosLat = Math.cos(lat);
      result[0]  = (N + alt) * Math.cos(lon) * cosLat;
      result[1]  = (N * (1 - Util.ECCENTRICITY_SQUARED) + alt) * Math.sin(lat);
      result[2]  = -(N + alt) * Math.sin(lon) * cosLat;
    },

    pos2latLon: function(pos, result) {
      var radius = vec3d.length(pos);
      
      result[0] = Math.asin(Util.clamp(pos[1] / radius, -1, 1));
      var cosLat = Math.cos(result[0]);
      result[1] = ((pos[2] < 0) ? 1 : -1) * Math.acos(Util.clamp(pos[0] / (cosLat * radius), -1, 1));
      result[0] = Util.rad2deg(result[0]);
      result[1] = Util.rad2deg(result[1]);
      result[2] = radius;
      // TODO: unify rad/deg of pos2latLon and latLon2Position
    },

    pos2latLonWGS84Ellipsoid: function(pos, result) {

      //NOT YET VERIFIED!!
      //source http://www.mathworks.ch/matlabcentral/fileexchange/7941-convert-cartesian-ecef-coordinates-to-lat-lon-alt/content/ecef2lla.m
      // WGS84 ellipsoid constants:

      var a = 6378137; // semi major axis a
      var x = pos[0];
      var y = -pos[2];
      var z = pos[1];

      // calculations:
      var  b   = Math.sqrt(Math.pow(a, 2) * (1 - Util.ECCENTRICITY_SQUARED));
      var ep  = Math.sqrt((Math.pow(a, 2) - Math.pow(b, 2)) / Math.pow(b, 2));
      var p   = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      var th  = Math.atan2(a * z, b * p);
      var lon = Math.atan2(y, x);
      var lat = Math.atan2((z + Math.pow(ep, 2) * b * Math.pow(Math.sin(th), 3)),(p - Util.ECCENTRICITY_SQUARED * a * Math.pow(Math.cos(th), 3)));

      var N   = a / Math.sqrt(1 - Util.ECCENTRICITY_SQUARED * Math.pow(Math.sin(lat), 2));
      var alt = p / Math.cos(lat) - N + Util.EARTH_RADIUS;

      result[0] = lat;
      result[1] = lon;
      result[2] = alt;

      // return lon in range [0,2*pi)
      //var lon = lon%6.283185307179586476925286766559;
    },

    computeGlobeTransformation: function(latLon, height, result) {
      var lat = Util.deg2rad(latLon[0]);
      var lon = Util.deg2rad(latLon[1]);

      Util.latLon2position(lat, lon, tmpPos, height);

      mat4d.translate(result, tmpPos);
      mat4d.rotateY(result, Math.PI * 0.5 + lon);
      mat4d.rotateX(result, Math.PI * 0.5 - lat);

      return result;
    },

    readUInt16: function(uint8arr, startByte) {
      var b0 = uint8arr[startByte];
      var b1 = uint8arr[startByte + 1];
      
      return b0 + (b1 << 8);
    },

    readUInt32: function(uint8arr, startByte) {
      var b0 = uint8arr[startByte];
      var b1 = uint8arr[startByte + 1];
      var b2 = uint8arr[startByte + 2];
      var b3 = uint8arr[startByte + 3];
      
      return b0 + (b1 << 8) + (b2 << 16) + (b3 << 24);
    },

    setIfDefined: function(name, src, dst) {
      if (src[name] !== undefined) {
        dst[name] = src[name];  
      }
    },

    array2object: function(array, keyFunction) {
      var result = {};
      var i, length;
      
      if (keyFunction !== undefined) {
        for (i = 0, length = array.length; i < length; ++i) {
          result[keyFunction(array[i])] = array[i];
        }
      }
      else {
        for (i = 0, length = array.length; i < length; ++i) {
          result[array[i]] = array[i];
        }
      }
      
      return result;
    },

    object2array: function(object) {
      var result = [];

      for (var name in object) {
        result.push(object[name]);
      }

      return result;
    },

    mergeObjects: function(object0, object1, result) {
      if (result === undefined) {
        result = {};
      }

      var name;
       
      if (result !== object0) {
        for (name in object0) {
          result[name] = object0[name];
        }
      }
       
      if (result !== object1) {
        for (name in object1) {
          result[name] = object1[name];
        }
      }
       
      return result; 
    },

    subtractObjects: function(object0, object1) {
      var result = {};

      for (var name in object0) {
        if (object1[name] === undefined) {
          result[name] = object0[name];
        }
      }

      return result;
    },

    intersectObjects: function(object0, object1) {
      var result = {};
      
      for (var name in object0) {
        if (object1[name] !== undefined) {
          result[name] = object0[name];
        }
      }
      
      return result;
    },

    getFirstObjectKey: function(object) {
      for (var name in object) {
       return name;
      }
    },

    getFirstObjectValue: function(object) {
      return object[Util.getFirstObjectKey(object)];
    },

    objectEmpty: function(object) {
      // jshint ignore:start
      for (var name in object) {
        return false;
      }
      // jshint ignore:end

      return true;
    },

    arraysEqual: function(arr0, arr1) {
      if (arr0.length !== arr1.length) {
        return false;
      }

      for (var i = 0, length = arr0.length; i < length; ++i) {
        if (arr0[i] !== arr1[i]) {
          return false;
        }
      }

      return true;
    },

    byteBuffer2base64image: function(buffer, width, height, type, args) {
      var width4 = width * 4;
      
      Util.assert(buffer.length === width4 * height, "buffer length must match image resolution");
      
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      var ctx = canvas.getContext("2d");
      var imgData = ctx.getImageData(0, 0, width, height);
      var data = imgData.data;  
      
      for (var i = 0; i < height; ++i) {
        var dst = i * width4;
        var src = (height - 1 - i) * width4;

        for (var j = 0; j < width4; ++j) {
          data[dst++] = buffer[src++];
        }
      }

      ctx.putImageData(imgData, 0, 0);  
      
      return canvas.toDataURL(type, args);
    },

    FPSCounterDebugString: undefined,

    FPSCounter: function() {
      var lastTimeFPS = Util.performance.now();
      var numFrames = 0;
      
      var listeners = [];
      
      this.step = function(time) {
        ++numFrames;    

        if (time - lastTimeFPS > 1000) {
          for ( var i = 0; i < listeners.length; ++i) {
            listeners[i](numFrames, Util.FPSCounterDebugString);      
          }

          lastTimeFPS = time;
          numFrames = 0;  
        }
      };

      this.addListener = function(listener) {
        Util.assert(listeners.indexOf(listener) === -1);
        listeners.push(listener);
      };
      
      this.removeListener = function(listener) {
        var index = listeners.indexOf(listener);
        Util.assert(index !== -1);
        listeners.splice(index, 1);
      };
    },

    cround: function(value) {
      return Math.round(value * 100) / 100;
    },

    logWithBase: function(value, base) {
      return Math.log(value) / Math.log(base);
    },

    setMatrixTranslation: function(matrix, translation) {
      matrix[12] = translation[0];
      matrix[13] = translation[1];
      matrix[14] = translation[2];
    },

    setMatrixTranslation3: function(matrix, x, y, z) {
      matrix[12] = x;
      matrix[13] = y;
      matrix[14] = z;
    },

    getMatrixTranslation: function(matrix, dest) {
      dest = dest || vec3d.create();
      
      dest[0] = matrix[12];
      dest[1] = matrix[13];
      dest[2] = matrix[14];
      
      return dest;
    },

    createTranslationMatrix: function(matrix, translation) {
      matrix = mat4d.identity(matrix);
      Util.setMatrixTranslation(matrix, translation);
      
      return matrix;
    },

    fovx2fovy: function(fovx, width, height) {
      return 2.0 * Math.atan(height * Math.tan(fovx * 0.5) / width);
    },

    fovy2fovx: function(fovy, width, height) {
      return 2.0 * Math.atan(width * Math.tan(fovy * 0.5) / height);
    },

    fovx2fovd: function(fovx, width, height) {
      return 2.0 * Math.atan(Math.sqrt(width * width + height * height) * Math.tan(fovx * 0.5) / width);
    },

    fovy2fovd: function(fovy, width, height) {
      return 2.0 * Math.atan(Math.sqrt(width * width + height * height) * Math.tan(fovy * 0.5) / height);
    },

    fovd2fovx: function(fovd, width, height) {
      return 2.0 * Math.atan(width * Math.tan(fovd * 0.5) / Math.sqrt(width * width + height * height));
    },

    fovd2fovy: function(fovd, width, height) {
      return 2.0 * Math.atan(height * Math.tan(fovd * 0.5) / Math.sqrt(width * width + height * height));
    },

    nextHighestPowerOfTwo: function(x) {
      --x;
      
      for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
      }
      
      return x + 1;
    },

    resampleHermite: function (srcData, sw, sh, dstData, dw, dh, flip) {
      var ratio_w = sw / dw;
      var ratio_h = sh / dh;
      var ratio_w_half = Math.ceil(ratio_w / 2);
      var ratio_h_half = Math.ceil(ratio_h / 2);

      for (var j = 0; j < dh; j++) {
        for (var i = 0; i < dw; i++) {
          var x2 = (i + (flip ? dh-j-1 : j) * dw) * 4;
          var weight = 0;
          var weights = 0;
          var weights_alpha = 0;
          var gx_r = 0;
          var gx_g = 0;
          var gx_b = 0;
          var gx_a = 0;

          var center_y = (j + 0.5) * ratio_h;

          for (var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++) {
            var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
            var center_x = (i + 0.5) * ratio_w;
            var w0 = dy * dy; //pre-calc part of w

            for (var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++) {
              var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
              var w = Math.sqrt(w0 + dx * dx);

              if (w >= -1 && w <= 1) {
                //hermite filter
                weight = 2 * w * w * w - 3 * w * w + 1;

                if (weight > 0) {
                  dx = 4 * (xx + yy * sw);

                  //alpha
                  gx_a += weight * srcData[dx + 3];
                  weights_alpha += weight;

                  //colors
                  if (srcData[dx + 3] < 255) {
                    weight = weight * srcData[dx + 3] / 250;
                  }

                  gx_r += weight * srcData[dx];
                  gx_g += weight * srcData[dx + 1];
                  gx_b += weight * srcData[dx + 2];
                  weights += weight;
                }
              }
            }
          }
          
          dstData[x2] = gx_r / weights;
          dstData[x2 + 1] = gx_g / weights;
          dstData[x2 + 2] = gx_b / weights;
          dstData[x2 + 3] = gx_a / weights_alpha;
        }
      }
    },

    //Shortest line between two lines in 3D
    //From http://paulbourke.net/geometry/pointlineplane/
    linelineDistance3D: function(p1, p2, p3, p4) {
      var EPS = 0.0001;
      var mua, mub;
      var d1343, d4321, d1321, d4343, d2121;
      var numer, denom;

      var p13 = tmpP13;
      var p43 = tmpP43;

      p13[0] = p1[0] - p3[0];
      p13[1] = p1[1] - p3[1];
      p13[2] = p1[2] - p3[2];

      p43[0] = p4[0] - p3[0];
      p43[1] = p4[1] - p3[1];
      p43[2] = p4[2] - p3[2];

      if (Math.abs(p43.x) < EPS && Math.abs(p43.y) < EPS && Math.abs(p43.z) < EPS) {
        return [false];
      }

      var p21 = tmpP21;

      p21[0] = p2[0] - p1[0];
      p21[1] = p2[1] - p1[1];
      p21[2] = p2[2] - p1[2];

      if (Math.abs(p21.x) < EPS && Math.abs(p21.y) < EPS && Math.abs(p21.z) < EPS) {
        return [false];
      }

      d1343 = p13[0] * p43[0] + p13[1] * p43[1] + p13[2] * p43[2];
      d4321 = p43[0] * p21[0] + p43[1] * p21[1] + p43[2] * p21[2];
      d1321 = p13[0] * p21[0] + p13[1] * p21[1] + p13[2] * p21[2];
      d4343 = p43[0] * p43[0] + p43[1] * p43[1] + p43[2] * p43[2];
      d2121 = p21[0] * p21[0] + p21[1] * p21[1] + p21[2] * p21[2];

      denom = d2121 * d4343 - d4321 * d4321;

      if (Math.abs(denom) < EPS) {
        return [false];
      }

      numer = d1343 * d4321 - d1321 * d4343;

      mua = numer / denom;
      mub = (d1343 + d4321 * mua) / d4343;

      var pa = tmpPa;
      var pb = tmpPb;

      pa[0] = p1[0] + mua * p21[0];
      pa[1] = p1[1] + mua * p21[1];
      pa[2] = p1[2] + mua * p21[2];
      
      pb[0] = p3[0] + mub * p43[0];
      pb[1] = p3[1] + mub * p43[1];
      pb[2] = p3[2] + mub * p43[2];

      var dist = vec3d.dist(pa, pb);

      return [true, dist, pa, pb];
    },

    projectVectorVector2D: function (p1, p2, p3) {
      var v = tmpV;
      var u = tmpU;
      var p = tmpP;
      var uv = tmpUv;
      var n = tmpN;
      var t = tmpT;

      v[0] = p2[0]-p1[0];
      v[1] = p2[1]-p1[1];
      v[2] = 0;

      u[0] = p3[0]-p1[0];
      u[1] = p3[1]-p1[1];
      u[2] = 0;

      p[0] = p3[0];
      p[1] = p3[1];
      p[2] = 0;

      var udotv = vec3d.dot(u, v);
      var lenv = vec3d.length(v);
      
      var f = lenv * lenv;
      var k = (udotv / f);

      uv[0] = (v[0]) * k;
      uv[1] = (v[1]) * k;

      n[0] = p1[0] + uv[0];
      n[1] = p1[1] + uv[1];

      vec3d.subtract(p, n, t);
      var dist = vec3d.length(t);

      var lu = vec3d.length(u);
      var lv = vec3d.length(v);
      var luv = vec3d.length(uv);

      if(luv > lu || luv > lv) {
        dist = Number.MAX_VALUE;
      }

      return dist;        
    }
  };

  Util.performance = window.performance || {};

  Util.performance.now = Util.performance.now     ||
                         Util.performance.mozNow  ||
                         Util.performance.msNow   ||
                         Util.performance.oNow    ||
                         Util.performance.webkitNow ||
                         function() { return new Date().getTime(); };

  return Util;
});