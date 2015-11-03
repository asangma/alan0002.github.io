/* jshint bitwise:false */
define(["./TileAgentBase", "./TerrainConst", "./UpsampleInfo", "../support/ObjectPool"],
  function(TileAgentBase, TerrainConst, UpsampleInfo, ObjectPool) {

  var ElevationTileAgent = function() {
    TileAgentBase.apply(this, arguments);
  };

  ElevationTileAgent.prototype = new TileAgentBase();
  ElevationTileAgent.prototype.constructor = ElevationTileAgent;

  ElevationTileAgent.prototype.dataArrived = function(dataTile) {
    if (dataTile !== this.tile) {
      this._setUpsamplingTile(dataTile);
    } else {
      this.updateGeometry();
    }

    this._dataRequested = null;
    this._requestNext();
  };

  ElevationTileAgent.prototype.updateGeometry = function() {
    this._tileLayerInfo.pendingUpdates |= TerrainConst.TileUpdateTypes.UPDATE_GEOMETRY;
    this.tile.updateGeometry();
  };

  ElevationTileAgent.prototype._findAncestorWithData = function() {
    if (this.tile.lij[0] < this.tile.elevationStartsAtLevel) {
      return null;
    }

    var layerClass = this.layerClass;
    var layerIdx = this.layerIdx;
    var tileIter = this.tile;
    var tileLevel = tileIter.vlevel;
    var resultTile;

    while (tileIter) {
      if (tileIter.layerInfo[layerClass][layerIdx].data) {
        resultTile = tileIter;

        if (tileLevel - tileIter.lij[0] >= TerrainConst.ELEVATION_DESIRED_RESOLUTION_LEVEL) {        
          break;
        }
      }
      tileIter = tileIter.parent;
    }

    if (resultTile) {
      var info = UpsampleInfo.Pool.acquire();

      // offset and scale are not needed for elevation data, as the elevation samplers take world coordinates as input
      info.init(resultTile, 0, 0, 1);

      return info;
    }

    return null;
  };

  ElevationTileAgent.prototype._findNextDownload = function() {
    var nextTileToRequest;
    var layerIdx = this.layerIdx,
      layerClass = this.layerClass,
      layerView = this.tile.parentSurface.layerViewByIndex(layerIdx, layerClass),
      minDataLevel = layerView._minDataLevel,
      maxDataLevel = layerView._maxDataLevel,
      desiredLevelDelta = TerrainConst.ELEVATION_DESIRED_RESOLUTION_LEVEL - (this.tile.vlevel - this.tile.lij[0]);

    if (this._tileLayerInfo.data || (this.tile.lij[0] < Math.max(minDataLevel, this.tile.elevationStartsAtLevel))) {
      nextTileToRequest = null;
    }
    else {
      // otherwise, find the highest (lowest level) ancestor that still fits into the extent and fulfills the elevation
      // resolution requirements
      var tileIter = this.tile;
      var tileLevel = tileIter.lij[0];
      var levelDiff = 0;
      var curUpsamplingTileLevel = this._tileLayerInfo.upsampleFromTile ?
        this._tileLayerInfo.upsampleFromTile.tile.lij[0] : -1;

      // keep (potential) tilemap data at hand during traversal
      var surface = this.tile.parentSurface;
      var tilemapTile = surface.getTilemapTile(tileIter);
      var tilemapStats = surface.tilemapStats;
      var skippedDueToTilemap = false;

      while (tileIter && (tileIter.lij[0] >= minDataLevel)) {
        if (tileIter.layerInfo[this.layerClass][this.layerIdx].data && (tileLevel - tileIter.lij[0] >= desiredLevelDelta)) {
          if (tileIter.lij[0] > curUpsamplingTileLevel) {
            this._setUpsamplingTile(tileIter);
          }
          break;
        }

        if (tilemapTile && !tilemapTile.tileDataAvailable(tileIter, layerIdx, layerClass)) {
          skippedDueToTilemap = true;
          nextTileToRequest = null;
        }
        else if (tileIter.lij[0] <= maxDataLevel) {
          nextTileToRequest = tileIter;
        }
        
        tileIter = tileIter.parent;
        tilemapTile = tilemapTile ? tilemapTile.parent : null; // note: this does not take into account the surface's _topLevelTilemapOnlyTiles.
                                                               // those tilemaps are still respected by TerrainSurface.requestTileData in case
                                                               // we should end up requesting an affected tile.
        levelDiff++;
      }

      // only request data from tiles with a level difference of less than ELEVATION_DESIRED_RESOLUTION_LEVEL if
      // there are no coarser tiles available for this layer
      if (nextTileToRequest &&
        (tileLevel - nextTileToRequest.lij[0] < desiredLevelDelta) &&
        this._tileLayerInfo.upsampleFromTile)
      {
        nextTileToRequest = null;
      }
      if (!nextTileToRequest && skippedDueToTilemap) {
        tilemapStats.tilesNotPresent++;
      }
    }
    return nextTileToRequest;
  };

  ElevationTileAgent.prototype._setUpsamplingTile = function(upsampleFromTile) {
    if (this._tileLayerInfo.upsampleFromTile) {
      UpsampleInfo.Pool.release(this._tileLayerInfo.upsampleFromTile);
    }

    var info = UpsampleInfo.Pool.acquire();

    // offset and scale are not needed for elevation data, as the elevation samplers take world coordinates as input
    info.init(upsampleFromTile, 0, 0, 1);
    this._tileLayerInfo.upsampleFromTile = info;
    this.tile.updateElevationBounds();
    this.updateGeometry();
  };

  ObjectPool.on(ElevationTileAgent, 400);
  return ElevationTileAgent;
});
