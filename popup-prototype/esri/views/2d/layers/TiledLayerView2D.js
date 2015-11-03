/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../../core/declare",

  "dojo/on",
  "dojo/has",

  "../../../core/Collection",
  
  "../ResourceLoader",
  "../TileInfoView",
  "../Tile",

  "../math/vec2",

  "../collections/ReferenceMap",
  "../collections/Set",

  "../engine/Container",
  "../engine/Bitmap",

  "./LayerView2D",
  "./TileQueue"
],
function(
  declare,
  on, has,
  Collection,
  ResourceLoader, TileInfoView, Tile,
  vec2,
  ReferenceMap, Set,
  Container, Bitmap,
  LayerView2D, TileQueue
) {

  var mobileProfile = has("esri-mobile");

  var TiledLayerView2D = declare(LayerView2D, {
    declaredClass: "esri.views.2d.layers.TiledLayerView2D",


    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    constructor: function(properties) {
      this.container = new TileContainer();

      this._viewHdl = on.pausable(this, "view-change", function() {
        this.needUpdate();
      }.bind(this));

      this._viewWtch = this.watch("suspended, view.stationary", function() {
        if (!this.suspended && (!mobileProfile || (mobileProfile && this.view.stationary))) {
          this.needUpdate();
          this._viewHdl.resume();
        }
        else {
          this._viewHdl.pause();
        }
      }.bind(this));
    },

    initialize: function() {
      this.then(this.setup.bind(this));
    },

    destroy: function() {
      this._viewWtch.remove();
      this._viewWtch = null;
      this._viewHdl.remove();
      this._viewHdl = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    // tiles collection
    _tCol: null,

    // resampled tiles collection
    _rtCol: null,

    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------

    setup: function() {
      var layer = this.layer;
      this.tileInfoView = new TileInfoView({
        tileInfo: layer.tileInfo,
        fullExtent: layer.fullExtent
      });

      this._rtCol = this._tCol = new TileSet();

      if (layer.tileMap) {
        this._rtCol = new TileMapTilesCollection({
          tileInfoView: this.tileInfoView,
          tileMap: layer.tileMap,
          tiles: this._tCol
        });
      }

      this._loadingCol = new TileLoader({
        loader: this.createLoader(),
        tileInfoView: this.tileInfoView,
        layer: this.layer,
        tiles: this._rtCol,
        view: this.view
      });

      this.container.set({
        tileInfoView: this.tileInfoView,
        tiles: this._loadingCol,
        state: this.view.state
      });
    },

    update: function() {
      if (this.suspended) {
        return;
      }

      var tiv = this.tileInfoView,
          state = this.view.state,
          spans = tiv.getTileSpans(state);

      this._tCol.tileSpans = spans;
    },

    createLoader: function() {
      return new ResourceLoader({
        queue: new TileQueue({
          tileInfo: this.layer.tileInfo,
          state: this.view.state
        })
      });
    }
    
  });



  //--------------------------------------------------------------------------
  //
  //  TileContainer
  //
  //--------------------------------------------------------------------------

  var TileContainer = declare([Container], {

    declaredClass: "TileContainer",

    constructor: function() {
      this.levels = {};
    },

    // collection listener
    _hdl: null,

    _tilesSetter: function(value, oldValue) {
      var handler = this._hdl;
      if (oldValue === value) {
        return oldValue;
      }
      if (handler) {
        this.clear();
        handler.remove();
        handler = null;
      }
      if (value) {
        handler = value.on("change", this._colChange.bind(this));
        this._tilesAdded(value.getAll());
      }
      this._hld = handler;
      return value;
    },

    _tilesAdded: function(tiles) {
      var  i, n;
      for (i = 0, n = tiles.length; i < n; i++) {
        var tile = tiles[i].tile,
            data = tiles[i].data,
            z = tile.coords[2],
            level  = this.levels[z],
            coords = this.tileInfoView.getTileOrigin(vec2.create(), tile.coords);

        if (!level) {
          this.levels[z] = level = new Container();
          level.coords = this.state.center;
          level.resolution = tile.lodInfo.resolution;
          this.addChild(level);
        }

        tile.bitmap = new Bitmap({
          coords: coords,
          source: data
        });
        level.addChild(tile.bitmap);
      }
    },

    _tilesRemoved: function(tiles) {
      var  i, n, tile, level;
      for (i = 0, n = tiles.length; i < n; i++) {
        tile   = tiles[i].tile;
        level  = this.levels[tile.coords[2]];

        if (level && tile.bitmap) {
          level.removeChild(tile.bitmap);
          if (level.numChildren === 0) {
            this.removeChild(level);
            delete this.levels[tile.level];
          }
        }
      }
    },

    _colChange: function(event) {
      if (event.added.length > 0) {
        this._tilesAdded(event.added);
      }
      if (event.removed.length > 0) {
        this._tilesRemoved(event.removed);
      }
    }
  });


  //--------------------------------------------------------------------------
  //
  //  TileSet
  //
  //--------------------------------------------------------------------------

  var TileSet = declare([Set], {
    declaredClass: "TileSet",

    _tileSpansSetter: function(value) {
      if (!value || value.length === 0) {
        this.clear();
        return value;
      }
      var keys = this.keys(),
          newKeys = {},
          newTiles = [], oldTiles = [],
          span, lodInfo, tileId,
          i, j, x, y, z, w, m, n;

      for (i = 0, n = value.length; i < n; i++) {
        span = value[i];
        lodInfo = span.lodInfo,
        y = span.row;
        z = lodInfo.z;
        for (j = span.colFrom, m = span.colTo; j <= m; j++) {
          w = lodInfo.getWorldForX(j);
          x = lodInfo.normalizeX(j);
          tileId = Tile.getId(x, y, z, w);
          if (this.contains(tileId)) {
            newKeys[tileId] = this.getItem(tileId);
          } else {
            newKeys[tileId] = new Tile([x, y, z, w], lodInfo);
            newTiles.push(newKeys[tileId]);
          }
        }
      }
      for (i = 0, n = keys.length; i < n; i++) {
        if (!newKeys[keys[i]]) {
          oldTiles.push(keys[i]);
        }
      }
      this.addItems(newTiles);
      this.removeItems(oldTiles);
      return value;
    }
  });
  

  //--------------------------------------------------------------------------
  //
  //  TileMapTilesCollection
  //
  //--------------------------------------------------------------------------

  var TileMapTilesCollection = declare([ReferenceMap], {
    declaredClass: "TileMapTilesCollection",

    constructor: function() {
      this._loading = new Set();
      this._tileMapCallback = this._tileMapCallback.bind(this);
    },

    // collection listener
    _hdl: null,

    _tilesSetter: function(value, oldValue) {
      var handler = this._hdl;
      if (oldValue === value) {
        return oldValue;
      }
      if (handler) {
        this.clear();
        handler.remove();
        handler = null;
      }
      if (value) {
        handler = value.on("change", this._colChange.bind(this));
        this._tilesAdded(value.getAll());
      }
      this._hld = handler;
      return value;
    },

    _tileMapCallback: function(tile, requested) {
      if (this._loading.contains(requested)) {
        this._loading.removeItem(requested);
        if (tile === requested) {
          this.addItem(tile.id, tile);
        }
        else {
          tile = new Tile([tile.col,tile.row,tile.level, 0], this.tileInfoView.getInfoForZoom(tile.level));
          tile.world = requested.world;
          this.addItem(tile.id, tile);
        }
      }
    },

    _tilesAdded: function(tiles) {
      var  i, n, tile;
      for (i = 0, n = tiles.length; i < n; i++) {
        tile = tiles[i];
        if (!this._loading.contains(tile) && !this.contains(tile)) {
          this._loading.addItem(tile);
          this.tileMap.getTile(tile, this._tileMapCallback);
        }
      }
    },

    _tilesRemoved: function(tiles) {
      this._loading.removeItems(tiles);
      this.removeItems(tiles);
    },

    _colChange: function(event) {
      if (event.added.length > 0) {
        this._tilesAdded(event.added);
      }
      if (event.removed.length > 0) {
        this._tilesRemoved(event.removed);
      }
    }
  });


  //--------------------------------------------------------------------------
  //
  //  TileLoader
  //
  //--------------------------------------------------------------------------

  var TileLoader = declare([Collection], {
    declaredClass: "TileLoader",
    constructor: function() {
      this._tileLoadHandler = this._tileLoadHandler.bind(this);
      this._tileErrorHandler = this._tileErrorHandler.bind(this);
      this._loadingList = [];
      this._removingList = [];
    },

    destroy: function() {
      this._viewHdl.remove();
      this._viewHdl = null;
    },

    initialize: function() {
      this._viewHdl = this.view.watch("stationary", function(newValue) {
        if (newValue && !this._loadingList.length && (!this.tiles._loading || !this.tiles._loading.length)) {
          var toRemove = this._removingList.map(function(tile) {
            return this.find(function(item) {
              return tile === item.tile;
            });
          }.bind(this));
          this.removeItems(toRemove);
          this._removingList.length = 0;
        }
      }.bind(this));
    },

    // collection listener
    _hdl: null,

    _tilesSetter: function(value, oldValue) {
      var handler = this._hdl;
      if (oldValue === value) {
        return oldValue;
      }
      if (handler) {
        this.clear();
        handler.remove();
        handler = null;
      }
      if (value) {
        this._tilesAdded(value.getAll());
        handler = value.on("change", this._colChange.bind(this));
      }
      this._hld = handler;
      return value;
    },

    _tilesAdded: function(tiles) {
      var i, n, tile;
      for (i = 0, n = tiles.length; i < n; i++) {
        tile = tiles[i];
        this._loadingList.push(tile);
        this.loader.load({
          id: tile.id,
          url: this.layer.getTileUrl(tile.level, tile.row, tile.col),
          tile: tile,
          loadCallback: this._tileLoadHandler,
          errorCallback: this._tileErrorHandler
        });
      }
    },

    _tilesRemoved: function(tiles) {
      var i, n, j, m, tile, loading = this._loadingList;
      for (i = 0, n = tiles.length; i < n; i++) {
        tile = tiles[i];
        if (!tile.bitmap) {
          for (j = 0, m = loading.length; j < m; j++) {
            if (loading[j] === tile) {
              loading.splice(j, 1);
              break;
            }
          }
          this.loader.cancel(tile.id);
          this._removeIntersectingTiles(tile);
        }
        else {
          this._removingList.push(tile);
        }
      }
    },

    _colChange: function(event) {
      if (event.added.length > 0) {
        this._tilesAdded(event.added);
      }
      if (event.removed.length > 0) {
        this._tilesRemoved(event.removed);
      }
    },

    _tileLoadHandler: function(event) {
      var tile = event.request.tile,
          data = event.data,
          loading = this._loadingList, 
          i, n;

      this.addItem({
        tile: tile,
        data: data
      });

      for (i = 0, n = loading.length; i < n; i++) {
        if (loading[i] === tile) {
          loading.splice(i, 1);
          break;
        }
      }

      if (this.view.stationary && !loading.length && (!this.tiles._loading || !this.tiles._loading.length)) {
        var toRemove = this._removingList.map(function(tile) {
            return this.find(function(item) {
              return tile === item.tile;
            });
          }.bind(this));
        this.removeItems(toRemove);
        this._removingList.length = 0;
      }
      else {
        this._removeIntersectingTiles(tile);
      }
    },

    _removeIntersectingTiles: function(tile) {
      var loading = this._loadingList,
          removing = this._removingList,
          toRemove,
          i, j,
          keep = false;
      for (i = removing.length - 1; i >= 0; i--) {
        toRemove = removing[i];
        if (tile.intersects(toRemove)) {
          for (j = loading.length - 1; j >= 0; j--) {
            if (toRemove.intersects(loading[j])) {
              keep = true;
            }
          }
          if (!keep) {
            removing.splice(i, 1);
            this.removeItemAt(this.findIndex(function(item) {
              return item.tile === toRemove;
            }));
          }
        }
      }
    },

    _tileErrorHandler: function _tileErrorHandler(request) {
      // this.removeItem(request.tile);
    }
  });



  return TiledLayerView2D;

});
