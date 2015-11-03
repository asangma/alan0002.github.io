define(["../../../geometry/SpatialReference", "../support/projectionUtils",  "../support/mathUtils"],
  function(SpatialReference, projectionUtils, mathUtils) {

  var x2lonWM = projectionUtils.webMercator.x2lon,
    y2latWM = projectionUtils.webMercator.y2lat;

  var tmpExtent = [0, 0, 0, 0];

  var TilingScheme = function(tileInfo) {
    var tsError = TilingScheme._checkUnsupported(tileInfo);
    if (tsError) {
      throw tsError;
    }

    this.spatialReference = tileInfo.spatialReference;
    this._isWebMercator = this.spatialReference.isWebMercator();
    this._isWGS84 = this.spatialReference.wkid === SpatialReference.WGS84.wkid; // cache to avoid Accessor performance hit
    this.origin = [tileInfo.origin.x, tileInfo.origin.y];
    this.pixelSize = [tileInfo.cols, tileInfo.rows];

    var minMaxLevel = tileInfo.lods.reduce(
      function(prev, cur, idx) {
        if (cur.level < prev.min) {
          prev.min = cur.level;
          prev.minIndex = idx;
        }
        prev.max = Math.max(prev.max, cur.level);

        return prev;
      },
      { min: Infinity, minIndex: 0, max: -Infinity }
    );

    var minLod = tileInfo.lods[minMaxLevel.minIndex],
      levelFactor = Math.pow(2, minLod.level),
      resolution = minLod.resolution * levelFactor,
      scale = minLod.scale * levelFactor;

    this.levels = new Array(minMaxLevel.max + 1);

    for (var i = 0; i < this.levels.length; i++) {
      this.levels[i] = {
        resolution: resolution,
        scale: scale,
        tileSize: [resolution * tileInfo.cols, resolution * tileInfo.rows]
      };

      resolution /= 2;
      scale /= 2;
    }
  };

  TilingScheme.prototype = {
    getExtent: function(level, row, col, result, resultWGS84Rad) {
      result = result || new Array(4);
      var levelInfo = this.levels[level],
        tileWidth = levelInfo.tileSize[0],
        tileHeight = levelInfo.tileSize[1];

      result[0] = this.origin[0] + col * tileWidth;
      result[2] = result[0] + tileWidth;
      result[3] = this.origin[1] - row * tileHeight;
      result[1] = result[3] - tileHeight;

      if (resultWGS84Rad) {
        if (this._isWebMercator) {
          resultWGS84Rad[0] = x2lonWM(result[0]);
          resultWGS84Rad[1] = y2latWM(result[1]);
          resultWGS84Rad[2] = x2lonWM(result[2]);
          resultWGS84Rad[3] = y2latWM(result[3]);
        }
        else if (this._isWGS84) {
          resultWGS84Rad[0] = mathUtils.deg2rad(result[0]);
          resultWGS84Rad[1] = mathUtils.deg2rad(result[1]);
          resultWGS84Rad[2] = mathUtils.deg2rad(result[2]);
          resultWGS84Rad[3] = mathUtils.deg2rad(result[3]);
        }
      }
    },

    ensureMaxLod: function(maxLod) {
      while (this.levels.length <= maxLod) {
        var prevLevel = this.levels[this.levels.length - 1],
          resolution = prevLevel.resolution / 2;

        this.levels.push({
          resolution: resolution,
          scale: prevLevel.scale / 2,
          tileSize: [resolution * this.pixelSize[0], resolution * this.pixelSize[1]]
        });
      }
    },

    getMaxLod: function() {
      return this.levels.length - 1;
    },

    scaleAtLevel: function(level) {
      return this.levels[0].scale / Math.pow(2, level);
    },

    levelAtScale: function(scale) {
      var level0scale = this.levels[0].scale;

      if (scale >= level0scale) {
        return 0;
      }

      return Math.log(level0scale / scale)*Math.LOG2E;
    },

    compatibleWith: function(tilingScheme) {
      if (!(tilingScheme instanceof TilingScheme)) {
        if (TilingScheme._checkUnsupported(tilingScheme)) {
          return false;
        }
        tilingScheme = new TilingScheme(tilingScheme);
      }

      if (!tilingScheme.spatialReference.equals(this.spatialReference)) {
        return false;
      }

      // test tile size
      if ((tilingScheme.pixelSize[0] !== this.pixelSize[0]) ||
          (tilingScheme.pixelSize[1] !== this.pixelSize[1])) {
        return false;
      }

      var highestCommonLevel = Math.min(this.levels.length, tilingScheme.levels.length) - 1,
        highestCommonLevelResolution = this.levels[highestCommonLevel].resolution,
        floatEqual = mathUtils.floatEqualAbsolute;

      // test origin - max allowable difference is half a pixel a the highest common level
      var epsilon = 0.5 * highestCommonLevelResolution;
      if (!floatEqual(tilingScheme.origin[0], this.origin[0], epsilon) ||
          !floatEqual(tilingScheme.origin[1], this.origin[1], epsilon)) {
        return false;
      }

      // test resolution - max allowable difference is half a pixel in the tile furthest away from the origin (assuming
      // only one root tile at 0/0/0) on the highest common level
      var largestPixelSize = Math.max(this.pixelSize[0], this.pixelSize[1]),
        maxTileCoordinate = Math.pow(2, highestCommonLevel);
      epsilon = 0.5 * highestCommonLevelResolution / maxTileCoordinate / largestPixelSize;
      return floatEqual(highestCommonLevelResolution, tilingScheme.levels[highestCommonLevel].resolution, epsilon);
    },

    rootTilesInExtent: function(extent, rootExtent, maxNumTiles) {
      var tileSize = this.levels[0].tileSize;

      TilingScheme.computeRowColExtent(extent, tileSize, this.origin, tmpExtent);

      var rowStart = tmpExtent[1],
        rowEnd = tmpExtent[3],
        colStart = tmpExtent[0],
        colEnd = tmpExtent[2],
        numTilesX = (colEnd - colStart),
        numTilesY = (rowEnd - rowStart);

      if (numTilesX * numTilesY > maxNumTiles) {
        var maxTilesPerDim = Math.floor(Math.sqrt(maxNumTiles));

        // the following code is a very primitive method to ensure the maxNumTiles count. essentially, we cut out a
        // square from the center of the rootExtent. The resulting number of tiles may be lower than maxNumTiles.

        if (numTilesY > maxTilesPerDim) {
          rowStart = rowStart + Math.floor(0.5*numTilesY) - Math.floor(0.5*maxTilesPerDim);
          rowEnd = rowStart + maxTilesPerDim;
        }
        if (numTilesX > maxTilesPerDim) {
          colStart = colStart + Math.floor(0.5*numTilesX) - Math.floor(0.5*maxTilesPerDim);
          colEnd = colStart + maxTilesPerDim;
        }
      }

      var result = new Array((colEnd - colStart) * (rowEnd - rowStart)),
        i = 0;

      for (var row = rowStart; row < rowEnd; row++) {
        for (var col = colStart; col < colEnd; col++) {
          result[i++] = [0, row, col];
        }
      }

      if (rootExtent) {
        rootExtent[0] = this.origin[0] + colStart * tileSize[0];
        rootExtent[1] = this.origin[1] - rowEnd * tileSize[1];
        rootExtent[2] = this.origin[0] + colEnd * tileSize[0];
        rootExtent[3] = this.origin[1] - rowStart * tileSize[1];
      }

      return result;
    }
  };

  TilingScheme.computeRowColExtent = function(extent, tileSize, origin, result) {
    // some slack is necessary in case the extent is just a tiny bit larger than the fitting root tile.
    // we have that situation with the world elevation service at the moment.
    var slack = 0.001 * ((extent[2] - extent[0]) + (extent[3] - extent[1]));
    result[0] = Math.floor((extent[0] + slack - origin[0]) / tileSize[0]);
    result[2] = Math.ceil((extent[2] - slack - origin[0]) / tileSize[0]);
    result[1] = Math.floor((origin[1] - extent[3] + slack) / tileSize[1]);
    result[3] = Math.ceil((origin[1] - extent[1] - slack) / tileSize[1]);
  };

  TilingScheme.isPowerOfTwo = function(tileInfo) {
    var lods = tileInfo.lods;
    var level0Resolution = lods[0].resolution * Math.pow(2, lods[0].level);

    return !lods.some(function(lod) {
      return !mathUtils.floatEqualRelative(lod.resolution, level0Resolution / Math.pow(2, lod.level));
    });
  };

  TilingScheme.hasGapInLevels = function(tileInfo) {
    var levels = tileInfo.lods.map(function(lod) { return lod.level; });
    levels.sort(function(a, b){ return a - b; });
    for (var i = 1; i < levels.length; i++) {
      if (levels[i] !== levels[0] + i) {
        return true;
      }
    }
    return false;
  };

  TilingScheme.tileSizeIs256 = function(tileInfo) {
    return (tileInfo.rows === 256) && (tileInfo.cols === 256);
  };

  function namedError(name, message) {
    var ret = new Error(message);
    ret.name = name;

    return ret;
  }

  TilingScheme._checkUnsupported = function(tileInfo) {
    // checks if tileInfo is supported by TilingScheme class
    if (tileInfo.lods.length < 1) {
      return namedError("tilingscheme:generic", "Tiling scheme must have at least one level");
    }

    if (!TilingScheme.isPowerOfTwo(tileInfo)) {
      return namedError("tilingscheme:power-of-two", "Tiling scheme must be power of two");
    }

    return null;
  };

  TilingScheme.checkUnsupported = function(tileInfo) {
    // checks if tileInfo is supported by SceneView/TerrainSurface implementation
    // TODO: move these checks into TerrainSurface.checkUnsupported.

    // do the fundamental checks first (for prioritization of error reporting)
    var err = TilingScheme._checkUnsupported(tileInfo);
    if (err) {
      return err;
    }

    if (TilingScheme.hasGapInLevels(tileInfo)) {
      return namedError("tilingscheme:gaps", "Tiling scheme levels must not have gaps between min and max level");
    }

    if (!TilingScheme.tileSizeIs256(tileInfo)) {
      return namedError("tilingscheme:tile-size", "Tiles must be of size 256x256");
    }

    return null;
  };

  TilingScheme.fromExtent = function(extent, spatialReference, mapUnitsInMeters) {
    var width = extent[2] - extent[0],
      height = extent[3] - extent[1],
      size = 1.2 * Math.max(width, height),
      pixels = 256,
      dpi = 96,
      inchToMeter = 0.0254;
    var ts =  new TilingScheme({
      rows: pixels,
      cols: pixels,
      origin: {
        x: extent[0] - 0.5 * (size - width),
        y: extent[3] + 0.5 * (size - height)
      },
      lods: [{
        level: 0,
        resolution: size / pixels,
        scale: 1 / (((pixels / dpi) * inchToMeter) / (size * mapUnitsInMeters))
      }],
      spatialReference: spatialReference
    });
    ts.ensureMaxLod(20);
    return ts;
  };

  TilingScheme.WebMercatorAuxiliarySphere = new TilingScheme({
    rows: 256,
    cols: 256,
    origin: { x: -20037508.342787, y: 20037508.342787 },
    spatialReference: SpatialReference.WebMercator,
    lods: [{
      level: 0,
      resolution: 156543.03392800014,
      scale: 591657527.591555
    }]
  });
  TilingScheme.WebMercatorAuxiliarySphere.ensureMaxLod(21);

  return TilingScheme;
});
