define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "dojo/io-query",
  
  "../../request",
  "../../core/urlUtils",

  "../../core/Accessor"
],
function(
  declare, lang, array,
  ioq,
  esriRequest, urlUtils,
  Accessor
) {

var getTileId = function getTileMapId(level, row, col) {
  return [level, row, col].join("/");
};
var getTileMapId = function getTileMapId(level, row, col, width, height) {
  return [level, row, col, width, height].join("/");
};

var Tile = function Tile(level, row, col) {
  this.id = getTileId(level, row, col);
  this.level = level;
  this.row = row;
  this.col = col;
};

var TileMapData = function TileMapData(level, row, col, width, height) {
  this.id = getTileMapId(level, row, col, width, height);
  this.level = level;
  this.row = row;
  this.col = col;
  this.width = width;
  this.height = height;

  this.data = null;
  this.dataValue = null;
  this.valid = null;
  this.location = null;

  this.promise = null;
};

TileMapData.prototype = {
  
  setData: function(json) {
    var data = json ? json.data : null,
        dataValue = null,
        i, len;

    lang.mixin(this, json || {});

    if (data && data.length > 0) {
      len = data.length;
      if (len === 1) {
        dataValue = data[0];
      } else {
        dataValue = data[0];
        for(i = 1; i < len; i++) {
          if(data[i] !== dataValue) {
            dataValue = null;
            break;
          }
        }
      }
    }
    if (dataValue !== null) {
      this.data = null;
      this.dataValue = dataValue;
    }
    return this;
  },

  /**
   * @return 1 if the tile is present is the tileMap, 0 if not.
   */
  isTileAvailable: function(row, col) {
    var location = this.location,
        data = this.data,
        dataValue = this.dataValue,
        left, top, index;
    if (!this.valid) {
      index = 0;
    }
    else if (dataValue !== null) {
      index = dataValue;
    }
    else {
      left = location.left;
      top = location.top;
      index = (row - top) * location.width + (col - left);
      index = index < data.length ? data[index] : 0;
    }
    return !!index;
  }
};

var TileMap = declare(Accessor, {
  declaredClass: "esri.layers.support.TileMap",

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------
  
  /**
   * @param layer a TileMapServiceLayer
   */
  constructor: function() {
    // TODO 4.0 this should be a LRU cache .
    this._tileMapCache = {};
  },


  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  // The number of info in col and row
  // should be 2^N with N < 128
  width: 8,
  height: 8,

  
  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  getTileMap: function(level, row, col, width, height) {
    var tileMap = level.level != null ? level : new TileMapData(level, row, col, width, height),
        promise = esriRequest({
          url: this._getTileMapUrl(tileMap.level, tileMap.row, tileMap.col, tileMap.width, tileMap.height),
          handleAs: "json",
          callbackParamName: "callback",
          timeout: 3000,
          failOk: true
        }).then(function(response) {
          // TODO 4.0 remove this when switched to dojo/request/xhr
          delete response._ssl;
          return tileMap.setData(response);
        });
    tileMap.promise = promise;
    return promise;
  },
  
  /**
   * @param level    level of the tile to resample
   * @param row      row of the tile to resample
   * @param col      col of the tile to resample
   * @param callback a function taking 2 tile objects: fn(tile, requested)
   *                   each tile as the following properties: id, level, row, col
   */
  getTile: function(level, row, col, callback) {
    var resamplingBudget = this._getResamplingBudget(),
        tile = null;

    if (level && level.level != null) {
      tile = level;
      callback = row;
    } 
    else {
      tile = new Tile(level, row, col);
    }
        
    if (resamplingBudget > 0) {
      var request = {
        tile: tile,
        requestedTile: tile,
        callback: callback,
        resamplingBudget: resamplingBudget
      };
      this._process(request);
    } else {
      callback.call(this, tile, tile);
    }
  },
  
  /**
   * Helper function to figure out if getTile has to be called.
   * @return -1 if there is no information about that tile - getTile() has to be called.
   *          0 there is no data for that tile - getTile() can be skipped.
   *          1 there is data for that tile - getTile() has to be called.
   */
  statusOf: function(level, row, col) {
    var resamplingBudget = this._getResamplingBudget(),
        tile = new Tile(level, row, col),
        tileMap;
    if (resamplingBudget === 0) {
      return 1;
    }
    while (resamplingBudget >= 0) {
      tileMap = this._tileToTileMap(tile);
      if (!this._tileMapCache[tileMap.id]) {
        return -1;
      }
      
      tileMap = this._tileMapCache[tileMap.id];
      if (!tileMap.promise.isFulfilled()) {
        return -1;
      }
      if (tileMap.isTileAvailable(tile.row, tile.col)) {
        return 1;
      }
      
      tile = this._parentTile(tile);
      // level 0
      if (!tile) {
        return 0;
      }
      resamplingBudget--;
    }
    return 0;
  },
  
  
  //--------------------------------------------------------------------------
  //
  //  Methods
  //
  //--------------------------------------------------------------------------
  
  /**
   * Process a tile request
   *   - get the tileMap for the tile
   *   - resolve if the tile is in the bundle
   *   - else request for the parent tile if the resampling budget isn't reached
   * @return a promise
   * @private
   */
  _process: function(request) {
    var tile = request.tile,
        tm = this._tileToTileMap(request.tile);
    
    // console.log("[TileMap] _process - level:", tile.level, ", row:", tile.row, ", col:", tile.col);
    this._getTileMap(tm).then(
      function(tileMap) {
        var tile = request.tile;
        var parentTile = this._parentTile(tile);
        if (tileMap.isTileAvailable(tile.row, tile.col)) {
          request.callback.call(this, tile, request.requestedTile);
        }
        else if (request.resamplingBudget > 0 && parentTile) {
          request.resamplingBudget--;
          request.tile = parentTile;
          this._process(request);
        }
        else {
          request.callback.call(this, request.requestedTile, request.requestedTile);
        }
      }.bind(this),
      function() {
        request.callback.call(this, request.requestedTile, request.requestedTile);
      }.bind(this)
    );
  },
  
  /**
   * Get a tileMap
   * @return a promise
   * @private
   */
  _getTileMap: function(tileMap) {
    var promise;
    if (this._tileMapCache[tileMap.id]) {
      tileMap = this._tileMapCache[tileMap.id];
      promise = tileMap.promise;
    } else {
      this._tileMapCache[tileMap.id] = tileMap;
      promise = this.getTileMap(tileMap);
    }
    return promise;
  },
  
  /**
   * Calculate the relative tile at the level above.
   * @return a tile object with level, row, and col properties
   * @private
   */
  _parentTile: function(tile) {
    var tileInfo = this.layer.tileInfo,
        lods = tileInfo.lods,
        tileLod, tileLodIndex,
        parentLod, parent = null;
    
    // get the tile lod
    array.some(lods, function(lod, index) {
      if (tile.level === lod.level) {
        tileLod = lod;
        tileLodIndex = index;
        return true;
      }
      return false;
    });
    
    // return the parent tile only if there is a LOD above.
    if (tileLodIndex > 0) {
      parentLod = lods[tileLodIndex - 1];
      parent = new Tile(
        parentLod.level,
        // Floating point joy.
        // At low resolution a decimal is so quickly dropped.
        Math.floor((tile.row * tileLod.resolution) / parentLod.resolution + 0.01),
        Math.floor((tile.col * tileLod.resolution) / parentLod.resolution + 0.01)
      );
    }
    
    return parent;
  },
  
  /**
   * Calculate the tileMap for a tile
   * @return a tileMap object with uid, level, row, and col properties
   * @private
   */
  _tileToTileMap: function(tile) {
    var row = Math.floor(tile.row / this.width) * this.width,
        col = Math.floor(tile.col / this.height) *  this.height;
    return new TileMapData(tile.level, row, col, this.width, this.height);
  },
  
  _getTileMapUrl: function(level, row, col, width, height) {
    var layer     = this.layer,
        ts        = layer.tileServers,
        parsedUrl = layer.parsedUrl,
        token     = layer.token,
        query     = parsedUrl.query,
        url = [
          (ts && ts.length ? ts[row % ts.length] : parsedUrl.path),
          "tilemap",
          level, 
          row, 
          col,
          width,
          height
        ].join("/");
    
    if (query) {
      url += ("?" + ioq.objectToQuery(query));
    }
    
    if (token && (!query || !query.token)) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "token=" + token;
    }
    
    // TODO 4.0
    // url = layer.addTimestampToURL(url);

    return urlUtils.addProxy(url);
  },
  
  _getResamplingBudget: function() {
    var layer = this.layer,
        budget = 0;
    if (layer.resampling) {
      budget = layer.resamplingTolerance;
      // undefined - null
      if (budget === null || budget === undefined) {
        budget = layer.tileInfo.lods.length;
      }
    }
    return budget;
  }
  
});

TileMap.TileMapData = TileMapData;

return TileMap;
});
