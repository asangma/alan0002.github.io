/* jshint bitwise:false */
define(["./TileAgentBase", "./TileUtils", "./UpsampleInfo", "../support/ObjectPool"],
  function(TileAgentBase, TileUtils, UpsampleInfo, ObjectPool) {

  var LOAD_LEVELS_UP = 4;

  var MapTileAgent = function() {
    TileAgentBase.apply(this, arguments);
  };

  MapTileAgent.prototype = new TileAgentBase();
  MapTileAgent.prototype.constructor = MapTileAgent;

  MapTileAgent.prototype.dataArrived = function(dataTile) {
    if (dataTile !== this.tile) {
      this._setUpsamplingTile(dataTile);
    } else {
      // layerInfo.data has been updated by caller, ensure that texture is updated
      this.tile.updateTexture();
    }

    this._dataRequested = null;

    if (dataTile !== this.tile) {
      this._requestNext();
    }
  };

  MapTileAgent.prototype._findNextDownload = function() {
    var nextTileToRequest;
    var layerIdx = this.layerIdx,
      layerClass = this.layerClass,
      layerView = this.tile.parentSurface.layerViewByIndex(layerIdx, layerClass),
      minDataLevel = layerView._minDataLevel,
      maxDataLevel = layerView._maxDataLevel;
    if (this._tileLayerInfo.data || (minDataLevel > this.tile.lij[0])) {
      nextTileToRequest = null;
    }
    else {
      // otherwise, find the highest (lowest level) ancestor that still fits into the layer
      var levelsUp = 0;

      var tileIter = this.tile;

      // keep (potential) tilemap data at hand during traversal
      var surface = this.tile.parentSurface;
      var tilemapTile = surface.getTilemapTile(tileIter);
      var tilemapStats = surface.tilemapStats;
      var skippedDueToTilemap = false;

      while (tileIter &&
             (levelsUp <= LOAD_LEVELS_UP) &&
             TileUtils.fallsWithinLayer(tileIter, layerView, false) &&
             (tileIter.lij[0] >= minDataLevel)) {
        if (tileIter.layerInfo[layerClass][layerIdx].data) {
          this._setUpsamplingTile(tileIter);
          break;
        }
        if (tilemapTile && !tilemapTile.tileDataAvailable(tileIter, layerIdx, layerClass)) {
          skippedDueToTilemap = true;
        }
        else if (tileIter.lij[0] <= maxDataLevel) {
          nextTileToRequest = tileIter;
        }

        tileIter = tileIter.parent;
        tilemapTile = tilemapTile ? tilemapTile.parent : null; // note: this does not take into account the surface's _topLevelTilemapOnlyTiles.
                                                               // those tilemaps are still respected by TerrainSurface.requestTileData in case
                                                               // we should end up requesting an affected tile.
        levelsUp++;
      }
      if (!nextTileToRequest && skippedDueToTilemap) {
        tilemapStats.tilesNotPresent++;
      }
    }
    return nextTileToRequest;
  };

  MapTileAgent.prototype._setUpsamplingTile = function(upsampleFromTile) {
    if (this._tileLayerInfo.upsampleFromTile &&
        this._tileLayerInfo.upsampleFromTile.tile === upsampleFromTile) {
      return;
    }

    if (this._tileLayerInfo.upsampleFromTile) {
      UpsampleInfo.Pool.release(this._tileLayerInfo.upsampleFromTile);
    }

    this._tileLayerInfo.upsampleFromTile = TileUtils.computeUpsampleInfoForAncestor(this.tile, upsampleFromTile);
    this.tile.updateTexture();
  };

  ObjectPool.on(MapTileAgent, 400);
  return MapTileAgent;
});
