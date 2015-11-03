/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define([
],
function() {

  //--------------------------------------------------------------------------
  //
  //  Tile
  //
  //--------------------------------------------------------------------------

  /**
   * coords - [x, y, z, refX]
   */
  var Tile = function(coords, lodInfo) {
    this.coords = coords = coords.concat();
    this.id = Tile.getId(coords);
    this.lodInfo = lodInfo;
  };

  Tile.prototype = {
    clone: function() {
      return new Tile(this.coords, this.lodInfo);
    },
    intersects: function(tile) {
      var coords1 = this.coords,
          coords2 = tile.coords,
          lodInfo = this.lodInfo,
          tileLodInfo = tile.lodInfo;

      if (coords1[2] === coords2[2]) {
        return coords1[3] === coords2[3] && coords1[1] === coords2[1];
      }

      var biggest = coords1[2] < coords2[2] ? coords1 : coords2,
          lodInfo = (biggest === coords1 ? this : tile).lodInfo,
          intersect = lodInfo.getIntersectingTile(biggest === coords1 ? tile : this).coords;

      return biggest[2] === intersect[2] &&
             biggest[1] === intersect[1] &&
             biggest[3] === intersect[3];
    }
  };

  Object.defineProperties(Tile.prototype, {
    level: {
      get: function() {
        return this.coords[2];
      }
    },
    row: {
      get: function() {
        return this.coords[1];
      }
    },
    col: {
      get: function() {
        return this.coords[0];
      }
    },
    world: {
      get: function() {
        return this.coords[3];
      },
      set: function(w) {
        var coords = this.coords;
        coords[3] = w;
        coords[0] = this.lodInfo.getXForWorld(coords[0], w);
        this.id = Tile.getId(coords);
      }
    }
  });

  Tile.getId = function(x, y, z, w) {
    return (
      Array.isArray(x) ? x :
        (w != null ? [x, y, z, w] : [x, y, z])
    ).join("/");
  };

  return Tile;

});
