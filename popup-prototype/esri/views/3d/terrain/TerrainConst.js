/* jshint bitwise:false */
define([], function() {

  var TerrainConst = {
    LayerClass: {
      MAP: 0,
      ELEVATION: 1,
      LAYER_CLASS_COUNT: 2
    },
    TileUpdateTypes: {
      NONE:            0,

      SPLIT:           1 << 0,
      VSPLITMERGE:     1 << 1,
      MERGE:           1 << 2,
      DECODE_LERC:     1 << 3,
      UPDATE_GEOMETRY: 1 << 4,
      UPDATE_TEXTURE:  1 << 5
    },

    TILE_LOADING_DEBUGLOG: false,

    ELEVATION_NODATA_VALUE: 3.40282347e+38 / 10, // this value is chosen such that we can sum up a couple of
    // nodata-values during sampling and get a value that's still smaller than Infinity, to avoid any potential
    // problems an optimizer could have with Infinity

    // the following two constants are given in the exponent of 2^x,
    // i.e. ELEVATION_DESIRED_RESOLUTION = 2^ELEVATION_DESIRED_RESOLUTION_LEVEL
    ELEVATION_DESIRED_RESOLUTION_LEVEL: 4,

    TILEMAP_SIZE_EXP: 5, // TILEMAP_SIZE is computed below based on this value: TILEMAP_SIZE = 2 ^ TILEMAP_SIZE_EXP,

    // Mode specific constants
    Spherical: {
      // At which level elevation data starts to actually load and display
      ELEVATION_STARTS_AT_LEVEL: 8
    },

    Planar: {
      // At which level elevation data starts to actually load and display
      ELEVATION_STARTS_AT_LEVEL: 0
    }
  };

  TerrainConst.TILEMAP_SIZE = 1 << TerrainConst.TILEMAP_SIZE_EXP;

  return TerrainConst;
});
