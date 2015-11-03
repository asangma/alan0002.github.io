/* jshint bitwise: false */
define([
  "./UpsampleInfo",
  "../support/PreallocArray"
], function(UpsampleInfo, PreallocArray) {
  var WEBMERC_EXTENT = 2*6378137*Math.PI;

  function IteratorPreorder(initialSize) {
    this.q = new PreallocArray(initialSize || 100);
    this._last = null;
    this.done = true;
  }

  IteratorPreorder.prototype.reset = function(tiles) {
    this.q.clear();

    if (tiles) {
      this.q.pushEither(tiles);
    }

    this._last = null;
    this.done = (this.q.length === 0);
  };

  IteratorPreorder.prototype.skip = function() {
    this._last = null;

    if (this.q.length === 0) {
      this.done = true;
    }
  };

  IteratorPreorder.prototype.next = function() {
    if (this.done) {
      return null;
    }

    if (this._last !== null) {
      var children = this._last.children;

      if (children[0]) {
        for (var c = 4; c >= 0; c--) {
          var child = children[c];

          if (child) {
            this.q.push(child);
          }
        }
      }

      this._last = null;
    }

    this._last = this.q.pop();

    if (this.q.length === 0 && !this._last.children[0]) {
      this.done = true;
    }

    return this._last;
  };

  function IteratorPostorder(initialSize) {
    this.q = new PreallocArray(initialSize || 100);
    this.done = true;
  }

  IteratorPostorder.prototype.reset = function(tiles) {
    this.q.clear();
    this.q.pushEither(tiles);

    var i = 0;

    // Prefill right now since we need children first.
    while (i < this.q.length) {
      var n = this.q.data[i++];

      for (var c = 0; c < 4; c++) {
        var child = n.children[c];

        if (child) {
          this.q.push(child);
        }
      }
    }

    this.done = (this.q.length === 0);
  };

  IteratorPostorder.prototype.next = function() {
    var ret = this.q.pop();
    this.done = (this.q.length === 0);

    return ret;
  };

  var TileUtils = {
    li2lat: function(l, i) {
      var y = -Math.PI + Math.PI * 2.0 * i / (1 << l);

      return 2.0 * Math.atan(Math.exp(y)) - Math.PI * 0.5;
    },

    lj2lon: function(l, j) {
      return -Math.PI + Math.PI * 2.0 * j / (1 << l);
    },

    lij2webMerc: function(l, i, j) {
      return [-0.5*WEBMERC_EXTENT + WEBMERC_EXTENT*j/(1 << l),
        -0.5*WEBMERC_EXTENT + WEBMERC_EXTENT*i/(1 << l)];
    },

    lij2str: function(l, i, j) {
      return l + "/" + i + "/" + j;
    },

    tile2str: function(tile) {
      return tile.lij[0] + "/" + tile.lij[1] + "/" + tile.lij[2];
    },

    latLon2WebMercator: function(lat, lon, result) {
      // code adapted from esri/geometry/webMercatorUtils
      if (lat > 1.570796) {
        lat = 1.570796;
      }
      else if (lat < -1.570796) {
        lat = -1.570796;
      }

      result[0] = lon * 6378137;
      result[1] = 6378137/2.0 *
        Math.log( (1.0 + Math.sin(lat)) / (1.0 - Math.sin(lat)));
    },

    traverseTilesPreorder: function(tiles, visitorFunc, that, passDownArgument) {
      if (Array.isArray(tiles)) {
        for (var i = 0; i < tiles.length; i++) {
          TileUtils._traverseTilesPreorder(tiles[i], visitorFunc, that, passDownArgument);
        }
      }
      else {
        TileUtils._traverseTilesPreorder(tiles, visitorFunc, that, passDownArgument);
      }
    },

    _traverseTilesPreorder: function(tile, visitorFunc, that, passDownArgument) {
      passDownArgument = visitorFunc.call(that, tile, passDownArgument);

      for (var i = 0; i < 4; i++) {
        var subTile = tile.children[i];

        if (subTile) {
          TileUtils.traverseTilesPreorder(subTile, visitorFunc, that, passDownArgument);
        }
      }
    },

    traverseTilesPostorder: function(tiles, visitorFunc, that) {
      if (Array.isArray(tiles)) {
        for (var i = 0; i < tiles.length; i++) {
          TileUtils._traverseTilesPostorder(tiles[i], visitorFunc, that);
        }
      }
      else {
        TileUtils._traverseTilesPostorder(tiles, visitorFunc, that);
      }
    },

    _traverseTilesPostorder: function(tile, visitorFunc, that) {
      for (var i = 0; i < 4; i++) {
        var subTile = tile.children[i];

        if (subTile) {
          TileUtils.traverseTilesPostorder(subTile, visitorFunc, that);
        }
      }

      visitorFunc.call(that, tile);
    },

    IteratorPreorder: IteratorPreorder,
    IteratorPostorder: IteratorPostorder,

    fallsWithinLayer: function(tile, layerView, fitEntirely) {
      var layer = layerView.layer;
      if (!layerView.hasGlobalExtent) {
        var layerExtent = layer.fullExtent,
          tileExtent = tile.extent;

        if (fitEntirely) {
          if ((tileExtent[0] < layerExtent.xmin) ||
              (tileExtent[1] < layerExtent.ymin) ||
              (tileExtent[2] > layerExtent.xmax) ||
              (tileExtent[3] > layerExtent.ymax)) {
            return false;
          }
        } else {
          if ((layerExtent.xmin > tileExtent[2]) ||
              (layerExtent.ymin > tileExtent[3]) ||
              (layerExtent.xmax < tileExtent[0]) ||
              (layerExtent.ymax < tileExtent[1])) {
            return false;
          }
        }
      }
      var tileScale = tile.parentSurface.tilingScheme.levels[tile.lij[0]].scale;
      if ((layer.minScale > 0) && (tileScale > layer.minScale*1.00000001)) {
        return false;
      }
      return tileScale >= layer.maxScale * 0.99999999;
    },

    isPosWithinTile: function(tile, pos) {
      var e = tile.extent;
      return (pos[0] >= e[0]) && ((pos[1] >= e[1])) && (pos[0] <= e[2]) && (pos[1] <= e[3]);
    },

    getTileNLevelsUp: function(tile, N) {
      while (N > 0) {
        tile = tile.parent;
        N--;
      }
      return tile;
    },

    nextTileInAncestry: function(tile, ancestorTile) {
      var levelsUp = tile.lij[0] - ancestorTile.lij[0] - 1;
      var i = tile.lij[1] >> levelsUp;
      var j = tile.lij[2] >> levelsUp;
      var childIdx = 0;
      if (i & 1) {
        childIdx += 2;
      }
      if (j & 1) {
        childIdx += 1;
      }
      return ancestorTile.children[childIdx];
    },

    computeUpsampleInfoForAncestor: function(tile, ancestorTile) {
      // compute scaling and offset that maps the tile into ancestorTile"s extent

      var scale = 1;
      var offsetX = 0;
      var offsetY = 0;

      while (tile !== ancestorTile) {
        scale *= 0.5;
        offsetX *= 0.5;
        offsetY *= 0.5;
        if (tile.lij[2] & 1) {
          offsetX += 0.5; // row is odd -> increase x offset
        }
        if ((tile.lij[1] & 1) === 0) {
          offsetY += 0.5; // column is event -> increase y offset (y axis is flipped)
        }
        tile = tile.parent;
        if (tile == null) {
          throw new Error("tile was not a descendant of ancestorTile");
        }
      }

      var info = UpsampleInfo.Pool.acquire();
      info.init(ancestorTile, offsetX, offsetY, scale);

      return info;
    }
  };

  return TileUtils;
});