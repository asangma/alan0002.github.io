/* jshint bitwise:false */
define(["./TerrainConst", "./TileBase"], function(TerrainConst, TileBase) {

  // This class serves as a container for the tilemaps on the top levels (0..TerrainConst.TILEMAP_SIZE_EXP). It is
  // not to be used in the normal tile tree data structure

  var TilemapOnlyTile = function(lij) {
    this.lij = lij;
    this.layerInfo = new Array(TerrainConst.LayerClass.LAYER_CLASS_COUNT);
  };

  TilemapOnlyTile.prototype.tileDataAvailable = TileBase.prototype.tileDataAvailable;

  TilemapOnlyTile.prototype.modifyLayers = function(old2newIndexMap, new2oldIndexMap, layerClass) {
    var newCount = new2oldIndexMap.length;
    var oldLayers = this.layerInfo[layerClass];
    var newLayers = new Array(newCount);

    // add new layers and reorder existing layers
    for (var i = 0; i < newCount; i++) {
      var oldIndex = new2oldIndexMap[i];
      newLayers[i] = (oldIndex > -1) ? oldLayers[oldIndex] : _makeEmptyLayerInfo(layerClass);
    }
    this.layerInfo[layerClass] = newLayers;
  };

  var _makeEmptyLayerInfo = function() {
    return {
      tilemapData: null,
      tilemapRequest: null,
      pendingUpdates: 0
    };
  };

  return TilemapOnlyTile;
});