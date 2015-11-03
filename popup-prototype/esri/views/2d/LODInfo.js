define(
[
  "./math/vec2",

  "./Tile"
],
function(
  vec2,
  Tile
) {

  //--------------------------------------------------------------------------
  //
  //  LODInfo
  //
  //--------------------------------------------------------------------------

  var LODInfo = function(tileInfo, lod, fullExtent) {
    this.z = lod.level;
    this.scale = lod.scale;
    this.origin = origin;

    var srInfo = tileInfo.spatialReference._getInfo(),
        res = this.resolution = lod.resolution,
        origin = this.origin = vec2.fromValues(tileInfo.origin.x, tileInfo.origin.y),

        // Size of a tile in map units at the LOD's resolution
        norm  = this.norm  = vec2.fromValues(tileInfo.cols * res, tileInfo.rows * res),
        start = this.start = vec2.fromValues(-Infinity, -Infinity),
        end   = this.end   = vec2.fromValues(+Infinity, +Infinity),
        size  = this.size  = vec2.fromValues(+Infinity, +Infinity);

    if (fullExtent) {
      vec2.set(start, Math.max(0, Math.floor((fullExtent.xmin - origin[0]) / norm[0])), Math.max(0, Math.floor((origin[1] - fullExtent.ymax) / norm[1])));
      vec2.set(end, Math.max(0, Math.floor((fullExtent.xmax - origin[0]) / norm[0])), Math.max(0, Math.floor((origin[1] - fullExtent.ymin) / norm[1])));
      vec2.set(size, end[0] - start[0] + 1, end[1] - start[1] + 1);
    }

    // Calculate the SpatialReference boundaries for wrap support
    if (srInfo) {
      this.worldSize  = vec2.set(vec2.create(), Math.ceil(Math.round(2 * srInfo.origin[1] / lod.resolution) / tileInfo.cols), size[1]);
      this.worldStart = vec2.set(vec2.create(), Math.floor((srInfo.origin[0] - origin[0]) / norm[0]), start[1]);
      this.worldEnd = vec2.set(vec2.create(), this.worldSize[0] - this.worldStart[0] - 1, end[1]);
    }
    else {
      this.worldStart = start;
      this.wldEnd     = end;
      this.worldSize  = size;
    }

    this.norm       = norm;
    this.start      = start;
    this.end        = end;
    this.size       = size;
  };

  LODInfo.prototype = {
    // get the col from a world col.
    normalizeX: function(x) {
      var wWidth = this.worldSize[0];
      return x < 0 ? (wWidth - 1) - Math.abs((x + 1) % wWidth) : x % wWidth;
    },

    getXForWorld: function(x, w) {
      return this.worldSize[0] * w + x;
    },

    getWorldForX: function(x) {
      return Math.floor(x / this.worldSize[0]);
    },

    getWorldStartCol: function(world) {
      return world * this.worldSize[0] + this.start[0];
    },

    getWorldEndCol: function(world) {
      return world * this.worldSize[0] + this.start[0] + this.size[0] - 1;
    },

    toGridCol: function(mapX) {
      return (mapX - this.origin[0]) / this.norm[0];
    },

    toGridRow: function(mapY) {
      return (this.origin[1] - mapY) / this.norm[1];
    },

    getTileOrigin: function(out, coords) {
      var origin = this.origin;
      var norm = this.norm;
      return vec2.set(out, origin[0] + this.getXForWorld(coords[0], coords[3]) * norm[0], origin[1] - coords[1] * norm[1]);
    },

    // tile.level > this.lodInfo.level
    getIntersectingTile: function(tile) {
      var resolution = this.resolution,
          tileResolution = tile.lodInfo.resolution,
          w = tile.world;

      if (tile.coords[2] <  this.z) {
        return null;
      }

      var coords = [
        Math.floor((tile.coords[0] * tileResolution) / resolution + 0.01),
        Math.floor((tile.row * tileResolution) / resolution + 0.01),
        this.z,
        0
      ];
      coords[3] = this.getXForWorld(coords[0], w);

      return new Tile(coords, this);
    }
  };

  return LODInfo;

});