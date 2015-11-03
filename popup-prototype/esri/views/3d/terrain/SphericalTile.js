/* jshint bitwise: false, forin: false */
define([
  "./TileBase",
  "./TileGeometryFactory",
  "./TerrainConst",
  "../support/ObjectPool",
  "../support/mathUtils",
  "../support/earthUtils",
  "../lib/glMatrix"
], function(TileBase, TileGeometryFactory, TerrainConst, ObjectPool, mathUtils, earthUtils, glMatrix) {
  // imports from global namespace (to pacify JSHint)
  var vec3d = glMatrix.vec3d;
  var EARTH_RADIUS = earthUtils.earthRadius;

  // temporary variables
  var dist = vec3d.create();

  var latLonToSphericalEngineCoords = function(lat, lon, altitude, dest) {
    var radius = EARTH_RADIUS + altitude,
      cosLat = Math.cos(lat);
    dest[0] = Math.cos(lon) * cosLat * radius;
    dest[1] = Math.sin(lon) * cosLat * radius;
    dest[2] = Math.sin(lat) * radius;
  };

  var SphericalTile = function(lij, parentTile, parentSurface) {
    TileBase.call(this);

    this.tileUp = vec3d.create();
    this.obb = new Array(8);

    for (var n = 0; n < 8; n++) {
      this.obb[n] = vec3d.create();
    }

    if (lij !== undefined) {
      this.init(lij, parentTile, parentSurface);
    }
  };

  SphericalTile.prototype = new TileBase();
  SphericalTile.prototype.constructor = SphericalTile;

  SphericalTile.prototype.init = function(lij, parentTile, parentSurface) {
    TileBase.prototype.init.call(this, lij, parentTile, parentSurface);

    var level = lij[0], i = lij[1], j = lij[2];
    parentSurface.tilingScheme.getExtent(level, i, j, this.extent, this.extentWGS84Rad);

    var lon0 = this.extentWGS84Rad[0];
    var lat0 = this.extentWGS84Rad[1];
    var lon1 = this.extentWGS84Rad[2];
    var lat1 = this.extentWGS84Rad[3];

    var midLat = mathUtils.lerp(lat0, lat1, 0.5);
    var midLon = mathUtils.lerp(lon0, lon1, 0.5);
    var minAbsLat = (level === 0) ? 0 : Math.min(Math.abs(lat0), Math.abs(lat1));

    this.edgeLen = (lon1 - lon0) * Math.cos(minAbsLat) * EARTH_RADIUS;

    latLonToSphericalEngineCoords(midLat, midLon, 0, this.centerAtSeaLevel);

    vec3d.set(this.centerAtSeaLevel, this.tileUp);
    vec3d.normalize(this.tileUp);

    this.updateRadiusAndCenter();
    this._updateOBB();
  };

  SphericalTile.prototype.isVisible = function(planes, eye) {
    if (!this.intersectsClippingArea) {
      return false;
    }

    var level = this.lij[0];
    if (level > 9) {
      // OBB-frustum intersection
      // This code checks every corner of the BB against every plane of the frustum.
      // Should this become a bottleneck, there are faster algorithms out there.
      var obb = this.obb;
      for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 8; j++) {
          if (planes[i][0] * obb[j][0] + planes[i][1] * obb[j][1] + planes[i][2] * obb[j][2]  + planes[i][3] < 0) { break; }
        }
        if ( j === 8) {
          return false;
        }
      }
    } else {
      var radius = this.radius,
        tileCenter = this.center;
      if (planes[0][0] * tileCenter[0] + planes[0][1] * tileCenter[1] + planes[0][2] * tileCenter[2] + planes[0][3] > radius) { return false; }
      if (planes[1][0] * tileCenter[0] + planes[1][1] * tileCenter[1] + planes[1][2] * tileCenter[2] + planes[1][3] > radius) { return false; }
      if (planes[2][0] * tileCenter[0] + planes[2][1] * tileCenter[1] + planes[2][2] * tileCenter[2] + planes[2][3] > radius) { return false; }
      if (planes[3][0] * tileCenter[0] + planes[3][1] * tileCenter[1] + planes[3][2] * tileCenter[2] + planes[3][3] > radius) { return false; }
      if (planes[4][0] * tileCenter[0] + planes[4][1] * tileCenter[1] + planes[4][2] * tileCenter[2] + planes[4][3] > radius) { return false; }
      if (planes[5][0] * tileCenter[0] + planes[5][1] * tileCenter[1] + planes[5][2] * tileCenter[2] + planes[5][3] > radius) { return false; }
    }

    return true;
  };

  SphericalTile.prototype.updateElevationBounds = function() {
    TileBase.prototype.updateElevationBounds.call(this);
    this._updateOBB();
  };

  SphericalTile.prototype.updateRadiusAndCenter = function() {
    TileBase.prototype.updateRadiusAndCenter.call(this);

    var pole = this._isPole(this.lij[1], this.lij[0]);
    if (pole > 0) {
      vec3d.set3(0, 0, 0, dist);

      if(pole === 2) {
        vec3d.set3(this.center[0], this.center[1], this.center[2]-EARTH_RADIUS, dist);
      } else if(pole === 1) {
        vec3d.set3(this.center[0], this.center[1], this.center[2]+EARTH_RADIUS, dist);
      }

      this.radius = Math.max(this.radius, Math.sqrt(dist[0]*dist[0] + dist[1]*dist[1] + dist[2]*dist[2]));
    }
  };

  SphericalTile.prototype._numSubdivisionsAtLevel = [128, 64, 32, 16, 16, 8, 8, 4];

  SphericalTile.prototype.createGeometry = function(state, localOrigin, wireframe) {
    // Factors that determine the number of subdivisions in a tile:
    // - resolution of terrain elevation
    // - "roundness" of earth when zoomed out
    // - map reprojection fidelity (webmerc -> globe) when zoomed out

    var pole = this._isPole(this.lij[1], this.lij[0]);

    state.needsUpdate = false;

    return TileGeometryFactory.createSphericalGlobeTile(state.numVertsPerRow,
                                                        this.extent,
                                                        this.extentWGS84Rad,
                                                        state.samplerData,
                                                        localOrigin,
                                                        pole,
                                                        wireframe);
  };

  SphericalTile.prototype._updateOBB = function() {
    var ext = this.extentWGS84Rad;
    var obb = this.obb;

    var i = 0;
    for (i = 0; i < 2; i++) {
      var elev = this.elevationBounds[i];
      var offs = i*4;
      latLonToSphericalEngineCoords(ext[1], ext[0], elev, obb[offs++]);
      latLonToSphericalEngineCoords(ext[3], ext[0], elev, obb[offs++]);
      latLonToSphericalEngineCoords(ext[3], ext[2], elev, obb[offs++]);
      latLonToSphericalEngineCoords(ext[1], ext[2], elev, obb[offs++]);
    }

    var pole = this._isPole(this.lij[1], this.lij[0]);
    if(pole === 2) {
      vec3d.set3(0, 0, EARTH_RADIUS, obb[1]);
      vec3d.set3(0, 0, EARTH_RADIUS, obb[2]);
      vec3d.set3(0, 0, EARTH_RADIUS, obb[5]);
      vec3d.set3(0, 0, EARTH_RADIUS, obb[6]);
    } else if(pole === 1) {
      vec3d.set3(0, 0, -EARTH_RADIUS, obb[1]);
      vec3d.set3(0, 0, -EARTH_RADIUS, obb[2]);
      vec3d.set3(0, 0, -EARTH_RADIUS, obb[5]);
      vec3d.set3(0, 0, -EARTH_RADIUS, obb[6]);
    }
  };

  SphericalTile.prototype._isPole = function(row, level) {
    var pole = 0;
    if (row === (1 << level) - 1) {
      // tile borders south pole
      pole += 1;
    }
    if (row === 0) {
      // tile borders north pole
      pole += 2;
    }
    return pole;
  };

  SphericalTile.prototype.elevationStartsAtLevel = TerrainConst.Spherical.ELEVATION_STARTS_AT_LEVEL;

  ObjectPool.on(SphericalTile, 400);
  return SphericalTile;
});
