// jshint bitwise:false

define([
  "../webgl-engine/lib/Geometry",
  "../webgl-engine/lib/GeometryData",
  "../lib/glMatrix",
  "../support/earthUtils",
  "../support/mathUtils",
  "./TerrainConst"
],
  function(Geometry, GeometryData, glMatrix, earthUtils, mathUtils, TerrainConst) {
    var EARTH_RADIUS = earthUtils.earthRadius;
    var vec3d = glMatrix.vec3d;
    var lerp = mathUtils.lerp;

    var supportsUintIndices = false;

    function minMax(x, y, z, bbMin, bbMax) {
      /* jshint curly: false */
      if (x < bbMin[0]) bbMin[0] = x;
      if (x > bbMax[0]) bbMax[0] = x;
      if (y < bbMin[1]) bbMin[1] = y;
      if (y > bbMax[1]) bbMax[1] = y;
      if (z < bbMin[2]) bbMin[2] = z;
      if (z > bbMax[2]) bbMax[2] = z;
      /* jshint curly: true */
    }

    var FastBoundingInfo = function() {
      var center = vec3d.create();
      var bbMin = vec3d.create();
      var bbMax = vec3d.create();
      var bsRadius, positionData, indices;

      this.init = function(positionData_, indices_) {
        positionData = positionData_;
        indices = indices_;

        vec3d.subtract(bbMax, bbMin, center);
        bsRadius = 0.5*vec3d.length(center);
        vec3d.lerp(bbMin, bbMax, 0.5, center);
      };

      this.getCenter =   function() { return center; };
      this.getBSRadius = function() { return bsRadius; };
      this.getBBMin =    function() { return bbMin; };
      this.getBBMax =    function() { return bbMax; };
      this.getPosition = function() { return positionData; };
      this.getIndices =  function() { return indices; };
      this.getPrimitiveIndices = function() { return undefined; };
      this.getChildren = function() { return undefined; };
    };

    var patchSkirtForPole = function(sgn, segmentsX, vertexAttr, skirtIndex) {
      var zpos = sgn*EARTH_RADIUS;
      for (var x = 0; x <= segmentsX; x++) {
        vertexAttr[5*skirtIndex] = 0;
        vertexAttr[5*skirtIndex+1] = 0;
        vertexAttr[5*skirtIndex+2] = zpos;
        skirtIndex++;
      }
    };

    var MAX_POOLED_GEOMETRY_OBJECTS = 50;
    var MAX_POOLED_VERTEX_ARRAYS = 50;
    var GeometryObjectPool = function() {
      var geometryPool = new Array(MAX_POOLED_GEOMETRY_OBJECTS);
      var geometryPoolPtr = 0;
      var vertexArrayPool = {};
      this.get = function(vertexDataSize) {
        var vaPoolEntry = vertexArrayPool[vertexDataSize];
        if (!vaPoolEntry) {
          vaPoolEntry = { ptr: 0, data: new Array(MAX_POOLED_VERTEX_ARRAYS) };
          vertexArrayPool[vertexDataSize] = vaPoolEntry;
        }

        var vertexArray;
        if (vaPoolEntry.ptr > 0) {
          stats.vertexArrayHits++;
          vertexArray = vaPoolEntry.data[--vaPoolEntry.ptr];
          vaPoolEntry.data[vaPoolEntry.ptr] = null;
        }
        else {
          stats.vertexArrayMisses++;
          vertexArray = new Float32Array(vertexDataSize);
        }

        if (geometryPoolPtr > 0) {
          stats.geometryHits++;
          var geometry = geometryPool[--geometryPoolPtr];
          geometryPool[geometryPoolPtr] = null;
          geometry.getData().getVertexAttr().terrain.data = vertexArray;
          return geometry;
        }
        else {
          stats.geometryMisses++;
          var indices2 = { "terrain": null };
          var vertexAttr2 = {};
          vertexAttr2.terrain = { "size" : 5, "data" : vertexArray };

          var faces = [ { "type" : "triangle", "indices" : indices2, "positionKey" : "terrain" } ];

          var boundingInfo = new FastBoundingInfo();
          return new Geometry(new GeometryData(faces, vertexAttr2), "tile", [boundingInfo]);
        }
      };

      this.put = function(obj) {
        var geometryData = obj.getData();
        var geometryDataVertexAttr = geometryData.getVertexAttr();
        var vertexArray = geometryDataVertexAttr.terrain.data;
        var vaPoolEntry = vertexArrayPool[vertexArray.length];
        if (vaPoolEntry.ptr < MAX_POOLED_VERTEX_ARRAYS) {
          vaPoolEntry.data[vaPoolEntry.ptr++] = vertexArray;
        }
        geometryDataVertexAttr.terrain.data = null;
        geometryData.getFaces()[0].indices.terrain = null;
        if (geometryPoolPtr < MAX_POOLED_GEOMETRY_OBJECTS) {
          geometryPool[geometryPoolPtr++] = obj;
        }
      };

      // debug stuffz
      // usage: require(["esri/views/3d/terrain/TileGeometryFactory"], function(TileGeometryFactory) { window.tileGeometryPool = TileGeometryFactory._geometryObjectPool; });
      var stats = {
        geometryHits: 0,
        geometryMisses: 0,
        vertexArrayHits: 0,
        vertexArrayMisses: 0
      };
      this.stats = stats;
      this._pools = {
        geometry: geometryPool,
        vertexArray: vertexArrayPool
      };
    };

    var geometryObjectPool = new GeometryObjectPool();

    var indicesRepo = [];

    var MAX_SEGMENTS = 256;
    var sinLonLUT = new Array(MAX_SEGMENTS+1);
    var cosLonLUT = new Array(MAX_SEGMENTS+1);
    var uLUT = new Array(MAX_SEGMENTS+1);
    var xWMLUT = new Array(MAX_SEGMENTS+1);

    function elevationSampler(x, y, samplerData) {
      for (var i = 0; i < samplerData.length; i++) {
        var data = samplerData[i];
        if (data) {
          var safeWidth = data.safeWidth,
            width = data.width,
            pixels = data.pixels;

          // reverse y: elevation tiles are stored north to south, lat goes south to north
          var yy = mathUtils.clamp(data.dy * (data.y1 - y), 0, safeWidth);
          var xx = mathUtils.clamp(data.dx * (x - data.x0), 0, safeWidth);

          var yFl = Math.floor(yy);
          var xFl = Math.floor(xx);

          var i1 = yFl * width + xFl;
          var i2 = i1 + width;

          var z1a = pixels[i1];
          var z2a = pixels[i2];

          var z1b = pixels[i1 + 1];
          var z2b = pixels[i2 + 1];

          // if any of the four neighbor values are ELEVATION_NODATA_VALUE, we want to fall back to the next
          // sampler/layer. since some of the values may be negative, we need to do the comparison w/ some tolerance.
          if (z1a + z2a + z1b + z2b < 0.5*TerrainConst.ELEVATION_NODATA_VALUE) {
            yy -= yFl;
            xx -= xFl;

            var z1 = z1a + (z1b - z1a) * xx;
            var z2 = z2a + (z2b - z2a) * xx;

            return z1 + (z2 - z1) * yy;
          }
        }
      }
      return null;
    }

    // jshint bitwise:false
    var maxUint16Indices = 1 << 16;

    function setSupportsUintIndices(value) {
      supportsUintIndices = value;
    }

    function supportedNumVertsPerRow(numVertsPerRow) {
      if (!supportsUintIndices) {
        var nIndices = numVertsPerRow * numVertsPerRow + 4 * (numVertsPerRow - 1);

        if (nIndices > maxUint16Indices) {
          numVertsPerRow = 1 << Math.floor(Math.log2(0.5 * (-4 + Math.sqrt(16 + 4 * (4 + maxUint16Indices)))));
        }
      }

      return numVertsPerRow;
    }

    var createSphericalGlobeTile = function createSphericalGlobeTile(numVertsPerRow, extentWM, extentWGS84, samplerData, origin, pole, wireframe, retgeom) {
      var radius = EARTH_RADIUS;
      var lon0 = extentWGS84[0];
      var lat0 = extentWGS84[1];
      var lon1 = extentWGS84[2];
      var lat1 = extentWGS84[3];

      var skirtRadiusFactor = Math.max(0.9, 1 - 0.5*(lon1-lon0));

      numVertsPerRow = supportedNumVertsPerRow(numVertsPerRow);

      var segmentsX = numVertsPerRow-1;
      var segmentsY = numVertsPerRow-1;

      var numV = numVertsPerRow*numVertsPerRow;
      var skirtNumV = 2*segmentsX + 2*segmentsY;

      var geometry = geometryObjectPool.get((numV + skirtNumV)*5);
      var vertexAttr = geometry.getData().getVertexAttr().terrain.data;

      var widthWM = extentWM[2] - extentWM[0],
        heightWM = extentWM[3] - extentWM[1];
      var x, y;
      var vertexPtr = 0;
      var width = lon1 - lon0;

      var xorigin = origin[0];
      var yorigin = origin[1];
      var zorigin = origin[2];

      var bbInfo = geometry.getBoundingInfo(0);
      var bbMin = bbInfo.getBBMin();
      var bbMax = bbInfo.getBBMax();

      vec3d.set3(10000000, 10000000, 10000000, bbMin);
      vec3d.set3(-10000000, -10000000, -10000000, bbMax);

      for (x = 0; x <= segmentsX; x++) {
        var u = x / segmentsX;
        var lon_ = lon0 + u * width;

        xWM = extentWM[0] + u * widthWM;

        sinLonLUT[x] = Math.sin(lon_);
        cosLonLUT[x] = Math.cos(lon_);
        uLUT[x] = u;
        xWMLUT[x] = xWM;
      }

      for ( y = 0; y <= segmentsY; y ++ ) {
        var lat = lerp(lat0, lat1, y / segmentsY);
        var cosLat = Math.cos(lat);
        var sinLat = Math.sin(lat);

        var yWM = EARTH_RADIUS / 2.0 * Math.log((1.0 + sinLat) /
                                                (1.0 - sinLat));

        var v = (yWM - extentWM[1])/heightWM;

        for ( x = 0; x <= segmentsX; x ++ ) {
          u = uLUT[x];
          var xWM = xWMLUT[x];
          var sinLon = sinLonLUT[x];
          var cosLon = cosLonLUT[x];

          var rad = radius;

          if (samplerData) {
            rad += elevationSampler(xWM, yWM, samplerData) || 0;
          }

          var xpos = cosLon * cosLat * rad;
          var ypos = sinLon * cosLat * rad;
          var zpos = sinLat * rad;

          var xposo = xpos - xorigin;
          var yposo = ypos - yorigin;
          var zposo = zpos - zorigin;

          minMax(xposo, yposo, zposo, bbMin, bbMax);

          var i = 5 * vertexPtr;

          vertexAttr[i+0] = xposo;
          vertexAttr[i+1] = yposo;
          vertexAttr[i+2] = zposo;
          vertexAttr[i+3] = u;
          vertexAttr[i+4] = v;

          var skirtIndex = -1;
          if (y === 0) { skirtIndex = numV + x;}
          if (x === segmentsX) { skirtIndex = numV + segmentsX + y;}
          if (y === segmentsY) { skirtIndex = numV + segmentsX + segmentsY + (segmentsX - x);}
          if ((x === 0) && (y > 0)) { skirtIndex = numV + segmentsX*2 + segmentsY + (segmentsY - y); }

          if (skirtIndex > -1) {
            var skxpos = xpos * skirtRadiusFactor - xorigin;
            var skypos = ypos * skirtRadiusFactor - yorigin;
            var skzpos = zpos * skirtRadiusFactor - zorigin;
            
            // skirt vertices
            minMax(skxpos, skypos, skzpos, bbMin, bbMax);

            i = 5 * skirtIndex;

            vertexAttr[i+0] = skxpos;
            vertexAttr[i+1] = skypos;
            vertexAttr[i+2] = skzpos;
            vertexAttr[i+3] = u;
            vertexAttr[i+4] = v;
          }
          ++vertexPtr;
        }
      }

      var isSouthPole = !!(pole & 1);
      var isNorthPole = !!(pole & 2);

      /* jshint bitwise: false */
      if (isSouthPole) {
        patchSkirtForPole(-1, segmentsX, vertexAttr, numV);
      }

      if (isNorthPole) {
        // north pole
        patchSkirtForPole(1, segmentsX, vertexAttr, numV + segmentsX + segmentsY);
      }

      return initializeGeometry(geometry, numVertsPerRow, pole, wireframe, retgeom);
    };

    var createPlanarGlobeTile = function(numVertsPerRow, extent, samplerData, origin, wireframe, surfaceExtent, retgeom) {
      var startx = extent[0];
      var starty = extent[1];
      var lenx = extent[2] - startx;
      var leny = extent[3] - starty;

      var skirtLength = lenx * 0.1;

      numVertsPerRow = supportedNumVertsPerRow(numVertsPerRow);

      var segmentsX = numVertsPerRow-1;
      var segmentsY = numVertsPerRow-1;

      var numV = numVertsPerRow*numVertsPerRow;
      var skirtNumV = 2*segmentsX + 2*segmentsY;

      var geometry = geometryObjectPool.get((numV + skirtNumV)*5);
      var vertexAttr = geometry.getData().getVertexAttr().terrain.data;

      var x, y;
      var vertexPtr = 0;

      var bbInfo = geometry.getBoundingInfo(0);
      var bbMin = bbInfo.getBBMin();
      var bbMax = bbInfo.getBBMax();

      vec3d.set3(10000000, 10000000, 10000000, bbMin);
      vec3d.set3(-10000000, -10000000, -10000000, bbMax);

      for ( y = 0; y <= segmentsY; y ++ ) {
        var v = y / segmentsY;
        var yy = starty + v*leny;

        // Clip Y coordinate
        // Optimization opportunity: precompute v
        if (surfaceExtent) {
          if (yy < surfaceExtent[1]) {
            yy = surfaceExtent[1];
            v = (yy - starty) / leny;
          } else if (yy > surfaceExtent[3]) {
            yy = surfaceExtent[3];
            v = (yy - starty) / leny;
          }
        }

        for ( x = 0; x <= segmentsX; x ++ ) {
          var u = x / segmentsX;
          var xx = startx + u*lenx;

          // Clip X coordinate
          // Optimization opportunity: precompute u
          if (surfaceExtent) {
            if (xx < surfaceExtent[0]) {
              xx = surfaceExtent[0];
              u = (xx - startx) / lenx;
            } else if (xx > surfaceExtent[2]) {
              xx = surfaceExtent[2];
              u = (xx - startx) / lenx;
            }
          }

          var elev = samplerData ? elevationSampler(xx, yy, samplerData) || 0 : 0;

          // WARNING: up-axis dependent code
          var xpos = xx - origin[0];
          var ypos = yy - origin[1];
          var zpos = elev - origin[2];

          minMax(xpos, ypos, zpos, bbMin, bbMax);

          vertexAttr[5*vertexPtr] = xpos;
          vertexAttr[5*vertexPtr + 1] = ypos;
          vertexAttr[5*vertexPtr + 2] = zpos;
          vertexAttr[5*vertexPtr + 3] = u;
          vertexAttr[5*vertexPtr + 4] = v;

          var skirtIndex = -1;
          if (y === 0) { skirtIndex = numV + x;}
          if (x === segmentsX) { skirtIndex = numV + segmentsX + y;}
          if (y === segmentsY) { skirtIndex = numV + segmentsX + segmentsY + (segmentsX - x);}
          if ((x === 0) && (y > 0)) { skirtIndex = numV + segmentsX*2 + segmentsY + (segmentsY - y);}

          if (skirtIndex > -1) {
            // WARNING: up-axis dependent code
            vertexAttr[5*skirtIndex] = xpos;
            vertexAttr[5*skirtIndex + 1] = ypos;
            vertexAttr[5*skirtIndex + 2] = zpos - skirtLength;
            vertexAttr[5*skirtIndex + 3] = u;
            vertexAttr[5*skirtIndex + 4] = v;
            minMax(xpos, ypos - skirtLength, zpos, bbMin, bbMax);
          }
          ++vertexPtr;
        }
      }

      return initializeGeometry(geometry, numVertsPerRow, 0, wireframe, retgeom);
    };

    var tmpIndices = {
      values: null,
      numSurfaceIndices: 0,
      numSkirtIndices: 0
    };

    var copyIndexInfo = function(dest, source, skipValues) {
      if (!skipValues) {
        dest.values = source.values;
      }

      dest.numSurfaceIndices = source.numSurfaceIndices;
      dest.numSkirtIndices = source.numSkirtIndices;

      return dest;
    };

    var initializeGeometry = function initializeGeometry(geometry, numVertsPerRow, pole, wireframe, retgeom) {
      var indices = makeIndices(numVertsPerRow, pole, wireframe, tmpIndices);
      var geometryData = geometry.getData();
      var geometryDataVertexAttr = geometryData.getVertexAttr();
      geometryData.getFaces()[0].indices.terrain = indices.values;
      geometry.getBoundingInfo(0).init(geometryDataVertexAttr.terrain, indices.values);

      if (!retgeom) {
        retgeom = {};
      }

      retgeom.geometry = geometry;

      // For poles, the skirts are part of the surface geometry
      retgeom.numWithoutSkirtIndices = indices.numSurfaceIndices + (pole ? (((numVertsPerRow - 1) * 6) * (wireframe ? 2 : 1)) : 0);
      retgeom.numVertsPerRow = numVertsPerRow;

      return copyIndexInfo(retgeom, indices, true);
    };

    var makeIndices = function(numVertsPerRow, pole, wireframe, retval) {
      var isNorthPole = (pole & 2);
      var indicesRepoIdx = numVertsPerRow + (wireframe ? 1024 : 0) + (isNorthPole ? 2048 : 0);
      var cached = indicesRepo[indicesRepoIdx];

      if (!retval) {
        retval = {};
      }

      if (cached) {
        copyIndexInfo(retval, cached);
        return retval;
      }

      var segmentsX = numVertsPerRow - 1,
        segmentsY = numVertsPerRow - 1;
      var numV = numVertsPerRow*numVertsPerRow,
        skirtNumV = 2 * segmentsX + 2 * segmentsY,
        numSurfaceIndices = segmentsX * segmentsY * 2 * 3,
        numSkirtIndices = skirtNumV * 6;

      var indices;

      var northPoleSkirtOffset = (2 * segmentsX + segmentsY - 1) * 6;

      if (wireframe) {
        numSurfaceIndices *= 2;
        numSkirtIndices *= 2;
        northPoleSkirtOffset *= 2;
      }

      if (supportsUintIndices && numV + skirtNumV > maxUint16Indices) {
        indices = new Uint32Array(numSurfaceIndices + numSkirtIndices);
      } else {
        indices = new Uint16Array(numSurfaceIndices + numSkirtIndices);
      }

      var vertexPtr = 0, indexPtr = 0, skirtIndexPtr = numSurfaceIndices;
      var i1, i2, i3, i4;

      var skirtOffset = 0;

      for (var y = 0; y <= segmentsY; y ++) {
        if (isNorthPole) {
          if (y === 0) {
            skirtOffset = northPoleSkirtOffset;
          } else if (y === segmentsY) {
            skirtOffset = -northPoleSkirtOffset;
          } else {
            skirtOffset = 0;
          }
        }

        skirtIndexPtr += skirtOffset;

        for (var x = 0; x <= segmentsX; x ++ ) {

          var skirtIndex = -1;
          var nextVertPtr = -1;

          if (y === 0) { skirtIndex = numV + x; if (x !== segmentsX) {nextVertPtr = vertexPtr + 1; }}
          if (x === segmentsX) { skirtIndex = numV + segmentsX + y; if (y < segmentsY) {nextVertPtr = vertexPtr + segmentsX + 1; }}
          if (y === segmentsY) { skirtIndex = numV + segmentsX + segmentsY + (segmentsX - x); if (x > 0) {nextVertPtr = vertexPtr - 1; }}
          if ((x === 0) && (y > 0)) { skirtIndex = numV + segmentsX*2 + segmentsY + (segmentsY - y); nextVertPtr = vertexPtr - (segmentsX + 1); }

          if (skirtIndex > -1) {
            // skirt indices
            var nextSkirtIndex = ((x===0)&&(y===1)) ? numV : skirtIndex + 1;

            if (nextVertPtr > -1) {
              i1 = vertexPtr;
              i2 = skirtIndex;
              i3 = nextSkirtIndex;
              i4 = nextVertPtr;

              if (wireframe) {
                indices[skirtIndexPtr+0] = i1;
                indices[skirtIndexPtr+1] = i2;
                indices[skirtIndexPtr+2] = i2;
                indices[skirtIndexPtr+3] = i3;
                indices[skirtIndexPtr+4] = i3;
                indices[skirtIndexPtr+5] = i1;

                indices[skirtIndexPtr+6] = i3;
                indices[skirtIndexPtr+7] = i4;
                indices[skirtIndexPtr+8] = i4;
                indices[skirtIndexPtr+9] = i1;
                indices[skirtIndexPtr+10] = i1;
                indices[skirtIndexPtr+11] = i3;

                skirtIndexPtr += 12;
              } else {
                indices[skirtIndexPtr+0] = i1;
                indices[skirtIndexPtr+1] = i2;
                indices[skirtIndexPtr+2] = i3;

                indices[skirtIndexPtr+3] = i3;
                indices[skirtIndexPtr+4] = i4;
                indices[skirtIndexPtr+5] = i1;

                skirtIndexPtr += 6;
              }
            }
          }
          ++vertexPtr;

          // non-skirt indices
          if ((x < segmentsX) && (y < segmentsY)) {
            i1 = y*(segmentsX+1) + x;
            i2 = i1 + 1;
            i3 = i2 + (segmentsX+1);
            i4 = i3 - 1;

            if (wireframe) {
              indices[indexPtr+0] = i1;
              indices[indexPtr+1] = i2;
              indices[indexPtr+2] = i2;
              indices[indexPtr+3] = i3;
              indices[indexPtr+4] = i3;
              indices[indexPtr+5] = i1;

              indices[indexPtr+6] = i3;
              indices[indexPtr+7] = i4;
              indices[indexPtr+8] = i4;
              indices[indexPtr+9] = i1;
              indices[indexPtr+10] = i1;
              indices[indexPtr+11] = i3;

              indexPtr += 12;
            } else {
              indices[indexPtr+0] = i1;
              indices[indexPtr+1] = i2;
              indices[indexPtr+2] = i3;

              indices[indexPtr+3] = i3;
              indices[indexPtr+4] = i4;
              indices[indexPtr+5] = i1;

              indexPtr += 6;
            }
          }
        }

        skirtIndexPtr -= skirtOffset;
      }

      retval.values = indices;
      retval.numSurfaceIndices = numSurfaceIndices;
      retval.numSkirtIndices = numSkirtIndices;

      indicesRepo[indicesRepoIdx] = copyIndexInfo({}, retval);
      return retval;
    };

    return {
      createPlanarGlobeTile: createPlanarGlobeTile,
      createSphericalGlobeTile: createSphericalGlobeTile,
      releaseGeometry: geometryObjectPool.put,
      elevationSampler: elevationSampler,
      _geometryObjectPool: geometryObjectPool, // exposed for debug purposes only,

      supportedNumVertsPerRow: supportedNumVertsPerRow,
      setSupportsUintIndices: setSupportsUintIndices
    };
  }
);
