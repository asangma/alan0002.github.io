/* jshint bitwise: false, forin: false */
define([
    "../../../core/declare",
    "../../../core/Accessor",
    "../../../core/arrayUtils",
    "dojo/Evented",
    "dojo/on",

    "../lib/glMatrix",
    "../support/eventUtils",
    "../support/projectionUtils",
    "../support/ResourceController",
    "../support/PromiseLightweight",
    "../../../geometry/support/webMercatorUtils",

    "./TerrainRenderer",
    "./OverlayManager",
    "./TilingScheme",
    "./TileUtils",
    "./TerrainConst",
    "./TileGeometryFactory",

    "./SphericalTile",
    "./PlanarTile",
    "./TilemapOnlyTile",

    "./MapTileAgent",
    "./ElevationTileAgent",

    "../layers/TiledLayerView3D",
    "../layers/ElevationLayerView3D",
    "../support/PreallocArray",
    "../support/ObjectPool",
    "../support/mathUtils",
    "../support/ArrayExtent"
  ],

  function(declare, Accessor, arrayUtils, Evented, on,
       glMatrix, eventUtils, projectionUtils, ResourceController, PromiseLightweight, webMercatorUtils,
       TerrainRenderer, OverlayManager, TilingScheme, TileUtils, TerrainConst, TileGeometryFactory,
       SphericalTile, PlanarTile, TilemapOnlyTile,
       MapTileAgent, ElevationTileAgent,
       TiledLayerView3D, ElevationLayerView3D,
       PreallocArray, ObjectPool, mathUtils, ArrayExtent) {
    
    // imports
    var vec3d = glMatrix.vec3d;
    var vec4d = glMatrix.vec4d;
    var mat4d = glMatrix.mat4d;

    // constants
    var MAX_ROOT_TILES = 64;
    var DEFAULT_MAX_LOD = 19;
    var MAX_NUM_TEXTURE_COMPOSITE_PER_FRAME = 12;

    var TileUpdateTypes = TerrainConst.TileUpdateTypes;

    var tmpVec = vec4d.create();
    var tmpLij = [0, 0, 0];
    var tmpSamplers = new Array(10);

    var tmpElevationChangeTileEvent = {
      spatialReference: null,
      tile: null
    };

    var tmpElevationChangeEvent = {
      spatialReference: null,
      extent: null
    };

    var tmpScaleChangeEvent = {
      extent: null,
      scale: 0
    };

    var GLOBAL_EXTENT = [-Infinity, -Infinity, Infinity, Infinity];

    // helper functions
    var isTiledLayerView = function(layerView) {
      return (layerView instanceof TiledLayerView3D);
    };

    var isElevationLayerView = function(layerView) {
      return (layerView instanceof ElevationLayerView3D);
    };

    var removeHandle = function(handle) {
      handle.remove();
    };

    var terrainWeakAssert = function(condition, msg) {
      if (!condition) {
        console.warn("Terrain: " + msg);
      }
    };

    var DEFAULT_GRID_TEXTURE = "data:image/png;base64,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";

    var TerrainSurface = declare([Accessor, Evented], {
      classMetadata: {
        properties: {
          manifold: {
            readOnly: true,
            value: null
          },
          tilingScheme: {
            value: null
          },
          spatialReference: {
            value: null
          },
          overlayManager: {
            value: null
          },
          wireframe: {
            value: false
          },
          opacity: {
            value: 1
          },
          cullBackFaces: {
            value: false
          },
          renderOrder: {
            value: 1
          },
          skirts: {
            value: true
          },
          frontMostTransparent: {
            value: false
          },
          tileBackground: {
            value: DEFAULT_GRID_TEXTURE
          },
          extent: { }
        }
      },

      defaultTileBackground: DEFAULT_GRID_TEXTURE,

      constructor: function() {
        // _rootTiles is an array of top-level tiles which define the overall shape of the surface (before clipping).
        // Each root tile is the root of a quadtree data structure that is subdivided down to the desired level of
        // detail for the current view. A node is either a PlanarTile or SphericalTile, depending on the globe mode.
        // _rootTiles may be null, which signifies that no terrain exists at the moment.
        this._rootTiles = null;

        this._iteratorPool = new ObjectPool(2, TileUtils.IteratorPreorder);

        this._postorderIterator = new TileUtils.IteratorPostorder();

        // In general, tilemap data is requested in tiling-scheme-aligned squares of TILEMAP_SIZE and stored in the tile
        // that corresponds to the resulting extent (which is TILEMAP_SIZE_EXP levels up from the data level). To avoid
        // having to store multiple sets of tilemap data in the root tile (for all levels < TILEMAP_SIZE_EXP), we store
        // tilemap data for all levels <= TILEMAP_SIZE_EXP in an array of "fake" tiles that only contain tilemap data.
        // There is exactly one such tile for each affected level.
        this._topLevelTilemapOnlyTiles = new Array(TerrainConst.TILEMAP_SIZE_EXP + 1);
        for (i = 0; i < this._topLevelTilemapOnlyTiles.length; i++) {
          this._topLevelTilemapOnlyTiles[i] = new TilemapOnlyTile([i - TerrainConst.TILEMAP_SIZE_EXP, 0, 0]);
        }

        this._tilingScheme = null;
        this._tilingSchemeIsGenerated = false;
        this._clippingExtent = null;
        this.notifyChange("extent");
        this._rootExtent = [0, 0, 0, 0];
        this._dataExtent = null;
        this._worldExtent = null; // only used in spherical case
        this._elevationBounds = [0, 0];

        /***********************
         * Configuration
         ***********************/
        this.loaded = false;

        // Initial maximum LOD setting
        this._maxLod = DEFAULT_MAX_LOD;

        this._frameUpdateLowerPrio = new PreallocArray(500);

        // maxTextureScale defines the maximum desired ratio between a tile's texture resolution and its projected
        // size on screen. it is used to determine if a tile should be split or merged given a specific view. setting
        // it to a higher value causes tiles to be larger, and thus fewer tiles to be displayed, leading to a lower
        // resolution of the map on screen.
        this.maxTextureScale = 1.2;

        this._stage = this._view._stage;

        /***********************
         * State variables
         ***********************/
        this.visible = false;
        this.suspended = false;
        this._pendingUpdates = false;
        this._lvPendingUpdates = false;
        this._updateNextFrame = false;

        // _curOverlayOpacity is used to fade out old overlays when the user zooms in significantly
        this._curOverlayOpacity = 1;

        // the following variables are used to store important values for the decisions of splitting, merging, and
        // visibility (for the current view):
        this._curEyePos = vec3d.create();
        this._curSplitLimits = [0, 0, 0, 0, 0];
        this._curFrustumPlanes = new Array(6);
        this._viewProjectionMatrix = mat4d.identity();
        this._cameraBelowSurface = false;

        for (var i = 0; i < 6; ++i) {
          this._curFrustumPlanes[i] = vec4d.create();
        }

        this.tilemapStats = {
          tilemapRequestsSent: 0,
          tilemapRequestsPending: 0,
          tilemapRequestErrors: 0,
          fullTilemaps: 0,
          emptyTilemaps: 0,
          tilesRequested: 0,
          tileRequestsSent : 0,
          tileRequestErrors: 0,
          tilesNotPresent: 0
        };

        /**************************
         * Layer handling
         *************************/

        this._layerViews = [[], []];
        // the order of layers/layer views may change while downloads are pending, so we also store a map which
        // translates a layer URL to the current layer index
        this._layerIndexByLayerViewId = [{}, {}];

        this._basemapLayerViewHandles = {};
        this._groupLayerViewHandles = {};
        this._layerViewChangesHandle = null;
      },

      normalizeCtorArgs: function(view, manifold) {
        this._view = view;
        this._manifold = manifold;
        if (manifold === "planar") {
          this.TileClass = PlanarTile;
        } else {
          this.TileClass = SphericalTile;
        }
        return {};
      },

      initialize: function() {
        /***********************
         * Service classes
         ***********************/

        // TerrainRenderer takes the data structure generated by TerrainSurface and displays it using WebGL
        this._renderer = new TerrainRenderer(this.manifold);
        this._renderer.loaded = this._setLoaded.bind(this);
        this._renderer.updateTileBackground(this.tileBackground);
        this._renderer.install(this._view._stage);

        var isSpherical = this.manifold === "spherical",
          cyclical = isSpherical ? new mathUtils.Cyclical(-20037508.342788905, 20037508.342788905) : null;
        this.overlayManager = new OverlayManager(isSpherical, cyclical, this, this._view);

// request a StreamDataSupplier, which is in charge of all downloads and potentially caching
        this._streamDataSupplier =
          this._view.resourceController.registerClient(this, ResourceController.ClientType.TERRAIN);

        /***********************
         * Event handling
         ***********************/

        this._idleWorkers = {
          needsUpdate: this._needsIdleUpdate,
          idleFrame: this._idleUpdate
        };
        this._view.resourceController.registerFrameWorker(this._frameUpdate.bind(this));
        this._view.resourceController.registerIdleFrameWorker(this, this._idleWorkers);

        this._viewChangeListenerHandles = [];
        this._viewChangeUpdate = this._viewChangeUpdate.bind(this);
        this._viewChangeListenerHandles.push(this._view.on("resize", this._viewChangeUpdate));
        this._viewChangeListenerHandles.push(eventUtils.on(this._view, "navigation.currentViewChanged", this._viewChangeUpdate));

        this._updateTiledLayers();
        this._layerViewChangesHandle = this._view.layerViewsFlat.on("change", this._handleLayerViewChanges.bind(this));
        this._handleLayerViewChanges({
          added: this._view.layerViewsFlat.getAll(),
          removed: [],
          moved: []
        });
        this._clippingChangedHandle = this._view.watch("clippingArea", this._clippingChanged.bind(this));
        this._clippingChanged();

        /***********************
         * Surface init
         ***********************/

        if (this.manifold === "spherical") {
          var tilingScheme = this.tilingScheme || TilingScheme.WebMercatorAuxiliarySphere;

          // this._worldExtent must be set before this.tilingScheme, so that _updateRootTiles() called from
          // tilingScheme setter can generate the root tile.
          this._worldExtent = [0, 0, 0, 0];
          tilingScheme.getExtent(0, 0, 0, this._worldExtent);

          if (!this.tilingScheme) {
            this.tilingScheme = tilingScheme;
          }

          this.notifyChange("extent");
        }
      },

      destroy: function () {
        this._removeAllTiles();
        for (var layerId in this._basemapLayerViewHandles) {
          this._unregisterTiledLayerView(layerId);
        }
        this._view.resourceController.deregisterFrameWorker(this);
        this._view.resourceController.deregisterIdleFrameWorker(this);
        this._view.resourceController.deregisterClient(this);
        this._viewChangeListenerHandles.forEach(removeHandle);
        for ( var h in this._groupLayerViewHandles){
          this._groupLayerViewHandles[h].forEach(removeHandle);
        }
        this._layerViewChangesHandle.remove();
        this._clippingChangedHandle.remove();
        if (this.overlayManager) {
          this.overlayManager.destroy();
          this.overlayManager = null;
        }
        this._renderer.uninstall(this._stage);
        this._renderer = null;
        this._view = null;
        this._stage = null;
        this._streamDataSupplier = null;
      },

      /**************************
       * Public interface
       **************************/

      setVisibility: function (v) {
        if (v === this.visible) {
          return;
        }
        this.visible = v;
        this._renderer.setVisibility(v);
        this.setUpdatesDisabled(!v);

        if (v) {
          this._viewChangeUpdate();
        }
      },

      isVisible: function() {
        return this.visible && this._rootTiles;
      },

      setUpdatesDisabled: function(disabled) {
        this.suspended = disabled;

        if (!disabled) {
          this._viewChangeUpdate();
        }
      },

      getElevation: function(point) {
        if (!this.tilingScheme || !this._rootTiles) {
          return null;
        }

        var lc = TerrainConst.LayerClass.ELEVATION,
          numLayers = this._rootTiles[0].layerInfo[lc].length;

        if (numLayers === 0) {
          return null;
        }

        if (!projectionUtils.pointToVector(point, tmpVec, this.tilingScheme.spatialReference)) {
          console.error("TerrainSurface.getElevation(): could not project given point to tiling scheme coordinate system");
          return null;
        }

        return this._getElevation(tmpVec);
      },

      _getElevation: function(pos) {
        var lc = TerrainConst.LayerClass.ELEVATION,
          numLayers = this._rootTiles[0].layerInfo[lc].length,
          layerIdx;

        // prepare temp array to hold the highest resolution sampler data for each elevation layer
        if (tmpSamplers.length < numLayers) {
          tmpSamplers.length = numLayers;
        }

        for (var rti = 0; rti < this._rootTiles.length; rti++) {
          var tile = this._rootTiles[rti];

          while (tile) {
            var layersInfo = tile.layerInfo[lc];
            for (layerIdx = 0; layerIdx < numLayers; layerIdx++) {
              if (layersInfo[layerIdx].data) {
                tmpSamplers[layerIdx] = layersInfo[layerIdx].data.samplerData;
              }
            }

            if (!tile.children[0]) {
              break;
            }

            var childIdx = 0;
            if (pos[0] > tile.children[0].extent[2]) {
              childIdx += 1;
            }
            if (pos[1] < tile.children[0].extent[1]) {
              childIdx += 2;
            }
            tile = tile.children[childIdx];
          }
        }

        var result = TileGeometryFactory.elevationSampler(pos[0], pos[1], tmpSamplers);
        for (layerIdx = 0; layerIdx < numLayers; layerIdx++) {
          // clear temp sampler data array
          tmpSamplers[layerIdx] = undefined;
        }

        return result;
      },

      getElevationBounds: function() {
        return this._elevationBounds;
      },

      getScale: function(point) {
        if (this.tilingScheme) {
          if (!projectionUtils.pointToVector(point, tmpVec, this.spatialReference)) {
            console.error("TerrainSurface.getElevation(): could not project given point to tiling scheme coordinate system");
            return null;
          }

          if (this._rootTiles) {
            for (var rti = 0; rti < this._rootTiles.length; rti++) {
              var tile = this._rootTiles[rti];
              if (TileUtils.isPosWithinTile(tile, tmpVec)) {
                while (tile.children[0]) {
                  var childIdx = 0;
                  if (tmpVec[0] > tile.children[0].extent[2]) {
                    childIdx += 1;
                  }
                  if (tmpVec[1] < tile.children[0].extent[1]) {
                    childIdx += 2;
                  }
                  tile = tile.children[childIdx];
                }
                return this.tilingScheme.levels[tile.lij[0]].scale;
              }
            }
          }
        }
        return 1e100;
      },

      /**
       * Query whether a provided extent has visible tiles in a scale range.
       * @param {vec4d} extent the extent to query in WGS84 rad (lon0, lat0, lon1, lat1).
       * @param {number} minScale the minimum allowed scale.
       * @param {number} maxScale the maximum allowed scale.
       * @param {function} callback the callback to call with the result of the query.
       *
       * Query whether there any visible tiles in the provided extent which are
       * within the provided scale range.
       */
      queryVisibleScaleRange: function(extent, minScale, maxScale, callback) {
        this._renderer.queryVisibleScaleRange(extent, minScale, maxScale, callback);
      },

      /*************************************
       * Initialization and state handling
       ************************************/

      _setLoaded: function() {
        if (!this.loaded) {
          this.loaded = true;
          this.emit("load");
        }
      },

      _acquireTile: function(l, i, j, parentTile) {
        var tile = this.TileClass.Pool.acquire();

        tmpLij[0] = l;
        tmpLij[1] = i;
        tmpLij[2] = j;
        
        tile.init(tmpLij, parentTile, this);

        return tile;
      },

      _releaseTile: function(tile) {
        tile.dispose();
        this.TileClass.Pool.release(tile);
      },

      _updateRootTiles: function(added /* optional, only used for error messaging */) {
        var extent = this._worldExtent || this._clippingExtent || this._dataExtent,
          tilingScheme = this.tilingScheme;
        if (extent && tilingScheme) {
          var newRootExtent = tmpVec,
            newRootLij = tilingScheme.rootTilesInExtent(extent, newRootExtent, Infinity);

          if (!this._rootTiles) {
            if (newRootLij.length > MAX_ROOT_TILES) {
              console.warn("Maximum number of root tiles exceeded, only a part of the map will be visible.");
              newRootLij = tilingScheme.rootTilesInExtent(extent, newRootExtent, MAX_ROOT_TILES);
            }

            this._rootTiles = newRootLij.map(function(lij) {
              var newTile = this._acquireTile(0, lij[1], lij[2], null);
              this._loadTile(newTile);
              return newTile;
            }.bind(this));
            this._renderer.setRootTiles(this._rootTiles);
          }
          else {
            if (newRootLij.length > MAX_ROOT_TILES) {
              console.warn("Could not extend surface to encompass all layers because it would have resulted in too many root tiles.");
              if (added) {
                added.forEach(function(layerView) {
                  var layer = layerView.layer;
                  var name = layer.title || layer.id;
                  var err = new Error("Layer may not be visible because it is too far away from other layers: " + name);
                  err.name = "terrainsurface:layer-exceeds-num-root-tiles";
                  err.details = { layerId: layer.id };
                  this.emit("error", err);
                }.bind(this));
              }
              return;
            }

            var curRootLij = this._rootTiles.map(function(tile) { return tile.lij; });
            var diff = arrayUtils.difference(curRootLij, newRootLij, lijEqual);

            if ((diff.removed.length > 0) || (diff.added.length > 0)) {
              var newRootTiles = this._rootTiles.filter(function(tile) {
                var idx = arrayUtils.findIndex(diff.removed, lijEqual.bind(null, tile.lij));
                if (idx > -1) {
                  this._purgeChildTiles(tile);
                  this._purgeTile(tile);
                  return false;
                }
                return true;
              }.bind(this));

              diff.added.forEach(function(lij) {
                var newTile = this._acquireTile(0, lij[1], lij[2], null);
                newRootTiles.push(newTile);
                this._loadTile(newTile);
              }.bind(this));

              this._rootTiles = newRootTiles;
              this._renderer.setRootTiles(this._rootTiles);
            }
          }

          if (!arrayUtils.equals(newRootExtent, this._rootExtent)) {
            this._rootExtent = vec4d.create(newRootExtent);
            if (!this._hasFixedExtent()) {
              this.notifyChange("extent");
            }
          }

          this.setVisibility(true);
          this._viewChangeUpdate();
        }
      },

      /**************************
       * View and frame updates
       **************************/

      _viewChangeUpdate: function() {
        if (!this._stage || this.suspended || !this._tilingScheme || !this.visible) {
          return;
        }
        this._updateViewDependentParameters();
        this._updateOverlayOpacity(this._curEyePos);
        this._updateTiles(this._rootTiles);

        if (this.overlayManager) {
          this.overlayManager.setOverlayDirty();
        }
      },

      _updateTiles: function(rootTiles) {
        var iter = this._iteratorPool.acquire();
        iter.reset(rootTiles);

        var limits = this._curSplitLimits;
        var planes = this._curFrustumPlanes;
        var eye = this._curEyePos;
        var minElev = Infinity;
        var maxElev = -Infinity;

        while (!iter.done) {
          var tile = iter.next();
          tile.updateClippingStatus(this._clippingExtent);
          var tileVisible = tile.updateVisibility(planes, eye);

          var tileShouldBeLoaded = true;

          if (tileVisible) {
            vec3d.set(tile.center, tile.centerProjected);
            tile.centerProjected[3] = 1;

            mat4d.multiplyVec4(this._viewProjectionMatrix, tile.centerProjected, tile.centerProjected);
            tile.screenDepth = tile.centerProjected[2] / tile.centerProjected[3];

            if (tile.renderData) {
              minElev = Math.min(tile.elevationBounds[0], minElev);
              maxElev = Math.max(tile.elevationBounds[1], maxElev);
            }

            var split = tile.shouldSplit(limits, eye);

            if (split === TileUpdateTypes.SPLIT) {
              // remove MERGE update flag if present
              tile.pendingUpdates &= ~TileUpdateTypes.MERGE;

              if (tile.renderData) {
                // leaf node: split
                tileShouldBeLoaded = false;
                tile.pendingUpdates |= TileUpdateTypes.SPLIT; // will be processed in _frameUpdate()

                iter.skip();
              } else {
                // intermediate node: descend
                tileShouldBeLoaded = false;
              }
            } else if (split === TileUpdateTypes.VSPLITMERGE) {
              // This must mean that the tile has been split to its maximum level
              // already, but its virtual tesselation level should be higher if
              // possible.
              tile.updateAgents(TerrainConst.LayerClass.ELEVATION);
              iter.skip();
            } else {
              iter.skip();
            }
          } else {
            iter.skip();
          }

          if (tileShouldBeLoaded && !tile.renderData) {
            // not a leaf node: merge
            tile.pendingUpdates |= TileUpdateTypes.MERGE;  // will be processed in _frameUpdate()

            // remove SPLIT update flag if present
            tile.pendingUpdates &= ~TileUpdateTypes.SPLIT;

            // since we're not descending to the children in this case, we should
            // at least update the children's visibility (they are still rendered until
            // the merge is processed)
            var visIter = this._iteratorPool.acquire();
            visIter.reset(tile);

            while (!visIter.done) {
              var n = visIter.next();
              n.updateVisibility(planes, eye);
            }

            this._iteratorPool.release(visIter);
          }

          if (tile.pendingUpdates !== 0) {
            this._pendingUpdates = true;
          }
        }

        this._iteratorPool.release(iter);

        if (isFinite(minElev) && isFinite(maxElev)) {
          this._elevationBounds[0] = minElev;
          this._elevationBounds[1] = maxElev;
        }
      },

      _viewParamSelector: {projectionMatrix: true, fovX: true, viewport: true},
      
      _updateViewDependentParameters: function() {
        var camera = this._view.navigation.currentCamera;
        var tanFovx2 = Math.tan(camera.fovX * 0.5);
        var tanFovy2 = Math.tan(camera.fovY * 0.5);

        this._curSplitLimits[0] = tanFovx2;
        this._curSplitLimits[1] = 256 / camera.width * this.maxTextureScale;
        this._curSplitLimits[2] = tanFovy2;
        this._curSplitLimits[3] = 256 / camera.height * this.maxTextureScale;
        this._curSplitLimits[4] = this.tilingScheme.getMaxLod();

        camera.computeFrustumPlanes(this._curFrustumPlanes);

        mat4d.multiply(camera.projectionMatrix, camera.viewMatrix, this._viewProjectionMatrix);
        vec3d.set(camera.eye, this._curEyePos);

        if (this._renderer && (this.manifold === "planar")) {
          var mapCamPos = tmpVec;
          if (projectionUtils.vectorToVector(this._curEyePos, this._view.renderSpatialReference,
              mapCamPos, this.spatialReference))
          {
            var surfaceElevation = ArrayExtent.positionInsideExtent(mapCamPos, this.extent) ?
              this._getElevation(mapCamPos) :
              0.5 * (this._elevationBounds[0] + this._elevationBounds[1]);

            var cameraElevation = mapCamPos[2],
              cameraBelowSurface = surfaceElevation > cameraElevation;
            if (this._cameraBelowSurface !== cameraBelowSurface) {
              this._cameraBelowSurface = cameraBelowSurface;
              this._renderer.setDrawSkirts(!cameraBelowSurface);
            }

          }
        }
      },

      _setLayerViewsUpdating: function() {
        for (var i = 0; i < TerrainConst.LayerClass.LAYER_CLASS_COUNT; i++) {
          var layerViews = this._layerViews[i];

          for (var l = 0; l < layerViews.length; l++) {
            var lv = layerViews[l];

            if (!lv.suspended) {
              lv.updating = this._pendingUpdates;
              lv.updatingPercentage = this._pendingUpdates ? 100 : 0;
            }
          }
        }
      },

      _frameUpdateTraversal: function(timeBudget) {
        if (this.suspended) {
          return;
        }

        this._frameUpdateLowerPrio.clear();
        var numTexCompositesStart = this._renderer.numTileTexturesComposited;

        var iter = this._iteratorPool.acquire();
        iter.reset(this._rootTiles);

        var didSomeWork = false;
        var pendingUpdates = false;

        while (!iter.done && (timeBudget.remaining() > 1 || !didSomeWork) &&
            (this._renderer.numTileTexturesComposited - numTexCompositesStart < MAX_NUM_TEXTURE_COMPOSITE_PER_FRAME)) {
          var tile = iter.next();

          if (tile.pendingUpdates & TileUpdateTypes.MERGE) {
            this._mergeTile(tile);
            tile.pendingUpdates &= ~TileUpdateTypes.MERGE;

            didSomeWork = true;

            iter.skip();
          }
          else if (tile.pendingUpdates & TileUpdateTypes.SPLIT) {
            this._splitTile(tile);
            tile.pendingUpdates &= ~TileUpdateTypes.SPLIT;

            didSomeWork = true;

            iter.skip();
          }
          else if (tile.pendingUpdates > 0) {
            // if tile requires other updates, put into list of lower priority operations
            this._frameUpdateLowerPrio.push(tile);
          }

          if (tile.pendingUpdates !== 0) {
            pendingUpdates = true;
          }
        }

        this._pendingUpdates = pendingUpdates || !iter.done;

        this._iteratorPool.release(iter);
        return didSomeWork;
      },

      _updateTileGeometry: function(tile) {
        this._renderer._updateTileGeometry(tile);

        tmpElevationChangeTileEvent.spatialReference = this.spatialReference;
        tmpElevationChangeTileEvent.tile = tile;

        on.emit(this, "elevation-change-tile", tmpElevationChangeTileEvent);
      },

      _updateTileTexture: function(tile) {
        this._renderer.updateTileTexture(tile);
      },

      _frameUpdate: function(timeBudget) {
        if (!this._rootTiles) {
          return;
        }

        var didSomeWork = this._frameUpdateTraversal(timeBudget);

        while ((timeBudget.remaining() > 1 || !didSomeWork) && this._frameUpdateLowerPrio.length > 0) {
          // we still have time/budget to do something, process lower priority operations
          var tile = this._frameUpdateLowerPrio.pop();

          if (tile.pendingUpdates & TileUpdateTypes.DECODE_LERC) {
            this._decodeLERC(tile);
            tile.pendingUpdates &= ~TileUpdateTypes.DECODE_LERC;
            didSomeWork = true;
          }
          else if (tile.pendingUpdates & TileUpdateTypes.UPDATE_GEOMETRY) {
            this._renderer.updateTileGeometryNeedsUpdate(tile);
            this._updateTileGeometry(tile);
            didSomeWork = true;

            tile.pendingUpdates &= ~TileUpdateTypes.UPDATE_GEOMETRY;
          }
          else if (tile.pendingUpdates & TileUpdateTypes.UPDATE_TEXTURE) {
            this._updateTileTexture(tile);
            tile.pendingUpdates &= ~TileUpdateTypes.UPDATE_TEXTURE;
            didSomeWork = true;
          }

          if (tile.pendingUpdates !== 0) {
            this._pendingUpdates = true;
          }
        }

        if (this._frameUpdateLowerPrio.length > 0) {
          this._pendingUpdates = true;
        }

        if (this._streamDataSupplier._loader.hasPendingDownloads()) {
          this._pendingUpdates = true;
        }

        if (this._pendingUpdates !== this._lvPendingUpdates) {
          if (this._pendingUpdates || ++this._updateNextFrame === 20) {
            this._setLayerViewsUpdating();
            this._lvPendingUpdates = this._pendingUpdates;
            this._updateNextFrame = 0;
          }
        }
      },

      _needsIdleUpdate: function() {
        return this.isVisible() && this.overlayManager && this.overlayManager.overlaysNeedUpdate();
      },

      _idleUpdate: function(timeBudget) {
        this.overlayManager.updateOverlay();
        this._updateOverlayOpacity(this._curEyePos);
      },

      _clippingChanged: function() {
        // Skip if tiling scheme is not set yet
        // The tiling scheme setter will call this function later
        if (!this.spatialReference) {
          return;
        }

        // Update clipping area
        var rect = [];
        var clippingExtent = null;
        if (projectionUtils.extentToBoundingRect(this._view.clippingArea, rect, this.spatialReference)) {
          clippingExtent = rect;
        }

        // Skip any work if clipping area didn't really change
        if (arrayUtils.equals(clippingExtent, this._clippingExtent)) {
          return;
        }
        this._clippingExtent = clippingExtent;

        // updateRootTiles does not emit an extent change event for fixed events
        this.notifyChange("extent");
      },

      /*****************************
       * Tile manipulation methods
       ****************************/

       _cancelTilemapRequests: function(tile) {
        for (var layerClass = 0; layerClass < TerrainConst.LayerClass.LAYER_CLASS_COUNT; layerClass++) {
          var layersInfo = tile.layerInfo[layerClass];

          if (!layersInfo) {
            continue;
          }

          for (var i = 0; i < layersInfo.length; i++) {
            var layerInfo = layersInfo[i];

            if (layerInfo.tilemapRequest) {
              layerInfo.tilemapRequest.cancel();
              layerInfo.tilemapRequest = null;
            }
          }
        }
      },

      _removeAllTiles: function() {
        if (this._rootTiles){
          this._rootTiles.forEach(function(rootTile) {
            this._purgeChildTiles(rootTile);
            this._purgeTile(rootTile);
          }.bind(this));
          this._rootTiles = null;
        }

        for (var i = 0; i < this._topLevelTilemapOnlyTiles.length; i++) {
          var tile = this._topLevelTilemapOnlyTiles[i];
          this._cancelTilemapRequests(tile);
        }

        this.setVisibility(false);
      },

      _purgeChildTiles: function(tile) {
        var iter = this._postorderIterator;

        iter.reset(tile);

        while (!iter.done) {
          var child = iter.next();

          for (var i = 0; i < 4; i++) {
            child.children[i] = null;
          }

          if (child !== tile) {
            this._purgeTile(child);
          }
        }
      },

      _purgeTile: function(tile) {
        tile.unload(this._renderer);
        this._cancelTilemapRequests(tile);

        tile.parent = null;
        this._renderer.releaseTileTextures(tile);
        this._releaseTile(tile);
      },

      _splitTile: function(tile) {
        var level = tile.lij[0] + 1,
          i = tile.lij[1] * 2,
          j = tile.lij[2] * 2;
        tile.children[0] = this._createTile(level, i, j, tile);
        tile.children[1] = this._createTile(level, i, j+1, tile);
        tile.children[2] = this._createTile(level, i+1, j, tile);
        tile.children[3] = this._createTile(level, i+1, j+1, tile);
        tile.unload(this._renderer);

        tmpScaleChangeEvent.extent = tile.extent;
        tmpScaleChangeEvent.scale = this.tilingScheme.levels[level].scale;

        on.emit(this, "scale-change", tmpScaleChangeEvent);
      },

      _createTile: function(level, i, j, parentTile) {
        terrainWeakAssert(parentTile, "_createTile sanity check");
        var tile = this._acquireTile(level, i, j, parentTile);

        tile.updateClippingStatus(this._clippingExtent);
        tile.updateVisibility(this._curFrustumPlanes, this._curEyePos);

        if (tile.visible) {
          var split = tile.shouldSplit(this._curSplitLimits, this._curEyePos);

          if (split === TileUpdateTypes.SPLIT) {
            tile.pendingUpdates |= TileUpdateTypes.SPLIT;
            this._pendingUpdates = true;
          }
        }

        this._loadTile(tile);
        return tile;
      },

      _mergeTile: function(tile) {
        terrainWeakAssert(!tile.renderData, "_mergeTile sanity check");
        this._loadTile(tile);
        this._purgeChildTiles(tile);

        tmpScaleChangeEvent.extent = tile.extent;
        tmpScaleChangeEvent.scale = this.tilingScheme.levels[tile.lij[0]].scale;

        on.emit(this, "scale-change", tmpScaleChangeEvent);
      },

      _loadTile: function(tile) {
        tile.load(this._renderer);

        if (this.overlayManager && this.overlayManager.hasOverlays()) {
          this.overlayManager.setOverlayParamsOfTile(tile, tile.renderData, this._curOverlayOpacity);
        }
      },

      /*****************************************************
       * Tile data updates
       ****************************************************/

      _decodeLERC: function(tile) {
        // TODO: only decode as many layers as time budged allows (see _frameUpdate)
        var eleLayerClass = TerrainConst.LayerClass.ELEVATION;
        var layersInfo = tile.layerInfo[eleLayerClass];
        if (!layersInfo) {
          return;
        }
        for (var layerIdx = 0; layerIdx < layersInfo.length; layerIdx++) {
          var layerInfo = layersInfo[layerIdx];
          layerInfo.pendingUpdates &= ~TileUpdateTypes.DECODE_LERC;

          if (layerInfo.rawData) {
            var elevationData = tile.createElevationDataFromLERC(layerInfo.rawData);
            layerInfo.rawData = null;
            if (elevationData) {
              layerInfo.data = elevationData;
              var bounds = [elevationData.bounds[0], elevationData.bounds[1], tile.lij[0]];

              var iter = this._iteratorPool.acquire();
              iter.reset(tile);

              while (!iter.done) {
                iter.next().setLayerElevationBounds(layerIdx, bounds);
              }

              this._iteratorPool.release(iter);

              tile.dataArrived(layerIdx, eleLayerClass, elevationData);
              // -> dataArrived will notify waiting agents
              // -> waiting agents will mark their tile's geometry as dirty, causing it to be recomputed

              this._updateTiles(tile);

              // send out elevation-change events. there are two locations that come into question for this:
              // - this._frameUpdate(), right after "this._renderer.updateTileGeometry(tile);"
              //    - pros: - send out event only if tile geometry has changed (updateTileGeometry() returned true)
              //            - send out event _after_ geometry has been updates
              //    - cons: - sends out a separate event for every leaf tile that upsamples data from ancestor node
              // - here:
              //    - pros: - send out a single event for the entire extent of the new elevation tile, even if several
              //              descendant leaf tiles use this tile for upsampling
              //    - cons: - send out event when elevation data is decoded, not when it is applied to surface
              //            - does not handle the case when basemap is updated (i.e. elevation turned on/off)
              tmpElevationChangeEvent.spatialReference = this.spatialReference;
              tmpElevationChangeEvent.extent = tile.extent;

              on.emit(this, "elevation-change", tmpElevationChangeEvent);
            }
          }
        }
      },

      /*****************************************************
       * Layer/layer view handling
       ****************************************************/

      _handleLayerViewChanges: function(event) {
        var updateTiledLayers = false;

        // Additions
        event.added.forEach(function (layerView) {
          var layer = layerView.layer;
          if (isTiledLayerView(layerView)) {
            this._registerTiledLayer(layer, layerView);
            if (layer.get("loaded")) {
              updateTiledLayers = true;
            }
          }
          else if (layerView.supportsDraping && this.overlayManager) {
            this.overlayManager.registerLayerView(layerView);
          }
        }.bind(this));

        // Removals
        event.removed.forEach(function (layerView) {
          if (isTiledLayerView(layerView)) {
            updateTiledLayers = true;
            this._unregisterTiledLayerView(layerView.id);
          }
          else if (layerView.supportsDraping && this.overlayManager) {
            this.overlayManager.unregisterLayerView(layerView);
          }
        }.bind(this));

        // Moves
        updateTiledLayers = updateTiledLayers || (event.moved.filter(isTiledLayerView).length > 0);

        if (updateTiledLayers) {
          this._updateTiledLayers(event.removed.length >= this.numTotalLayers());
        }

        var newDataExtent = null;
        var setTilingSchemeFromExtent = false;
        if (this._tiledDataExtent) {
          newDataExtent = this._tiledDataExtent.slice();
        }
        else {
          var spatialReference = this._view.map.spatialReference;
          if (spatialReference && (!this.tilingScheme || this._tilingSchemeIsGenerated)) {
            newDataExtent = this._getLayerExtentUnion(spatialReference);
            if (!this._hasFixedExtent()) {
              // set new tiling scheme *after* extent has been set
              setTilingSchemeFromExtent = true;
            }
          }
        }

        if (newDataExtent && !arrayUtils.equals(newDataExtent, this._dataExtent)) {
          this._dataExtent = newDataExtent;

          if (!this._hasFixedExtent() && !setTilingSchemeFromExtent) {
            // if there is no custom extent, tiledDataExtent will determine root extent/tiles
            this._updateRootTiles(event.added);
          }
        }
        else {
          // no need to reset tiling scheme if extent hasn't changed
          setTilingSchemeFromExtent = false;
        }

        if (setTilingSchemeFromExtent) {
          this.tilingScheme = newDataExtent;
        }
      },

      _registerTiledLayer: function(layer, layerView) {
        var eventHandles = [];

        eventHandles.push(layerView.watch("suspended", function() {
          this._updateTiledLayers();
        }.bind(this)));

        eventHandles.push(layerView.layer.watch("opacity", this._updateTileTextures.bind(this)));

        this._basemapLayerViewHandles[layerView.id] = eventHandles;
      },

      _unregisterTiledLayerView: function(layerViewId) {
        var eventHandles = this._basemapLayerViewHandles[layerViewId];
        for (var i = 0; i < eventHandles.length; i++) {
          eventHandles[i].remove();
        }
        delete this._basemapLayerViewHandles[layerViewId];
      },

      _updateTiledLayers: function(canChangeTilingScheme) {
        // Texture layers
        var layerViews = this._view.layerViewsFlat;
        var layerViewsNew = [[], []];
        var LayerClass = TerrainConst.LayerClass;
        var maxLod = null;
        var tiledDataExtentNew = new ArrayExtent(ArrayExtent.NEGATIVE_INFINITY);

        var processLayerView = function(layerView) {
          var layer = layerView.layer;

          // Check if layerView didn't already remove its layer reference
          if (!layer) {
            return;
          }

          if (layerView && !layerView.suspended && isTiledLayerView(layerView)) {
            var fullExtent = layer.fullExtent;
            if (!fullExtent) {
              console.warn("Terrain: Map or elevation layer does not have fullExtent: " + layer.id);
            }
            else {
              if (!this.tilingScheme || canChangeTilingScheme) {
                this.tilingScheme = new TilingScheme(layer.tileInfo);
                canChangeTilingScheme = false;
              }
              else if (!this.tilingScheme.compatibleWith(layer.tileInfo)) {
                console.warn("Terrain: layer " + layer.id + " has incompatible tiling scheme, will not display");
                return;
              }

              tiledDataExtentNew.expand(fullExtent);

              // TODO
              //var tsExtent = this.tilingScheme.rootExtent;
              //var slack = 1.01; // AGOL basemap fullExtent deviates significantly from root tile extent
              //
              //layerView.hasGlobalExtent = (lExtent.xmin*slack <= tsExtent[0]) &&
              //  (lExtent.ymin*slack <= tsExtent[1]) &&
              //  (lExtent.xmax*slack >= tsExtent[2]) &&
              //  (lExtent.ymax*slack >= tsExtent[3]);

              if (isElevationLayerView(layerView)) {
                layerViewsNew[LayerClass.ELEVATION].push(layerView);
              }
              else {
                if (layerView._maxDataLevel !== Infinity && (maxLod === null || layerView._maxDataLevel > maxLod)) {
                  maxLod = layerView._maxDataLevel;
                }

                layerViewsNew[LayerClass.MAP].push(layerView);
              }
            }
          }
        }.bind(this);

        layerViews.forEach(processLayerView, this);

        for (var layerClass = 0; layerClass < LayerClass.LAYER_CLASS_COUNT; layerClass++) {
          var curLayerViewsOld = this._layerViews[layerClass];
          var curLayerViewsNew = layerViewsNew[layerClass];

          // in the map, layers which are added last take the highest order of precedence, i.e. the layers are ordered
          // in ascending order of precedence. for rendering, it's easier to have them in descending order of
          // precedence, so we reverse the order:
          curLayerViewsNew.reverse();

          var layersChanged = curLayerViewsOld.length !== curLayerViewsNew.length;
          var numLayers = curLayerViewsNew.length;
          var new2oldIndexMap = new Array(numLayers);
          var old2newIndexMap = new Array(curLayerViewsOld.length);
          this._layerIndexByLayerViewId[layerClass] = {};
          for (var newIndex = 0; newIndex < numLayers; newIndex++) {
            var layerViewId = curLayerViewsNew[newIndex].id;
            this._layerIndexByLayerViewId[layerClass][layerViewId] = newIndex;
            var oldIndex = curLayerViewsOld.indexOf(curLayerViewsNew[newIndex]);
            new2oldIndexMap[newIndex] = oldIndex;
            if (newIndex !== oldIndex) {
              layersChanged = true;
            }
            if (oldIndex > -1) {
              old2newIndexMap[oldIndex] = newIndex;
            }
          }
          if (layersChanged) {            
            this._layerViews[layerClass] = curLayerViewsNew;

            // update top level tilemap-only tiles first, as the updates of the "real" tiles may already depend them
            this._topLevelTilemapOnlyTiles.forEach(function(tile) {
              tile.modifyLayers(old2newIndexMap, new2oldIndexMap, layerClass);
            });

            if (this._rootTiles) {
              var iter = this._postorderIterator;
              iter.reset(this._rootTiles);

              while (!iter.done) {
                iter.next().modifyLayers(old2newIndexMap, new2oldIndexMap, layerClass);
              }

              // agents like to pry in ancestor tiles' layerInfo. because during modifyLayers(), the layerInfo arrays are
              // not in a consistent state, we cannot restart the agents from within modifyLayers().
              iter.reset(this._rootTiles);

              while (!iter.done) {
                var tile = iter.next();

                tile.restartAgents(layerClass);

                // previously tile.restartAgents() used to call the tile.updateElevationBounds(), this has been pulled
                // out here so that we can make sure to properly recalculate elevation independent of agents. Also we
                // need to make sure we recompute elevation for all tiles, since the bounds influence tile splitting/merging,
                // navigation and visibility. 
                if(layerClass === LayerClass.ELEVATION) {
                  tile.updateElevationBounds();
                }
              }

              this._updateTiles(this._rootTiles);
            }

            if (layerClass === LayerClass.ELEVATION) {
              // send out elevation-change for entire globe. see comment in this._decodeLERC() for detailed explanation.
              tmpElevationChangeEvent.spatialReference = this.tilingScheme.spatialReference;
              tmpElevationChangeEvent.extent = GLOBAL_EXTENT;

              on.emit(this, "elevation-change", tmpElevationChangeEvent);
            }
          }
        }

        if (maxLod === null) {
          maxLod = DEFAULT_MAX_LOD;
        }

        if (this._maxLod < maxLod) {
          this._maxLod = maxLod;

          if (this.tilingScheme) {
            this.tilingScheme.ensureMaxLod(maxLod);
          }

          this._viewChangeUpdate();
        }

        if (tiledDataExtentNew.isFinite()) {
          this._tiledDataExtent = tiledDataExtentNew.extent;
        }
        else {
          this._tiledDataExtent = null;
        }
      },

      _getLayerExtentUnion: function(spatialReference) {
        var layerViews = this._view.layerViewsFlat;
        var union = new ArrayExtent(ArrayExtent.NEGATIVE_INFINITY);
        layerViews.forEach(function(layerView) {
          var layer = layerView.layer;
          var extent = layer.fullExtent;

          if (!extent.spatialReference.equals(spatialReference)) {
            extent = webMercatorUtils.canProject(extent.spatialReference, spatialReference) ?
              webMercatorUtils.project(extent, spatialReference) :
              null;
          }

          if (extent) {
            union.expand(extent);
          }
        });
        return union.isFinite() ? union.extent : null;
      },

      layerViewByIndex: function(layerIdx, layerClass) {
        return this._layerViews[layerClass][layerIdx];
      },

      agentTypeByLayerIndex: function(layerIdx, layerClass) {
        return (layerClass === TerrainConst.LayerClass.ELEVATION) ? ElevationTileAgent : MapTileAgent;
      },

      numLayers: function(layerClass) {
        return this._layerViews[layerClass].length;
      },

      numTotalLayers: function() {
        return this._layerViews.reduce(function(a, b) { return a+b; }, 0);
      },

      /*****************************************************
       * Tile data handling
       ****************************************************/

      _updateTileTextures: function() {
        var iter = this._iteratorPool.acquire();
        iter.reset(this._rootTiles);

        while (!iter.done) {
          iter.next().updateTexture();
        }

        this._iteratorPool.release(iter);
      },

      requestTileData: function(tile, layerIdx, layerClass) {
        // public interfaces takes tilemap availability into account
        this.tilemapStats.tilesRequested++;
        var layerView = this.layerViewByIndex(layerIdx, layerClass);
        if (layerView.layer.tileMap) {
          var tilemapTile = this.getTilemapTile(tile);
          var layerInfo = tilemapTile.layerInfo[layerClass][layerIdx];
          if (layerInfo.tilemapData) {
            if (!tilemapTile.tileDataAvailable(tile, layerIdx, layerClass)) {
              this.tilemapStats.tilesNotPresent++;
              this._dispatchDataEvent(tile, "dataMissing", layerClass, layerView, { notInTilemap: true});
              var promise = new PromiseLightweight.Promise();
              promise.reject();
              return promise; // bail out with a rejected promise
            }
          }
          else {
            var dfd = new PromiseLightweight.Promise();

            // actualTileRequestPromise is used in this.cancelRequest to cancel an actual tile request after
            // the tilemap request has returned (and caused a tile request to be issued). tilemap requests themselves
            // are not cancelled at the moment.
            dfd.actualTileRequestPromise = null;

            if (!layerInfo.tilemapRequest) {
              layerInfo.tilemapRequest = this.requestTilemapData(tilemapTile, layerIdx, layerClass, layerView);
            }

            layerInfo.tilemapRequest.then(function() {
              layerInfo.tilemapRequest = null;

              if (dfd.isCancelled()) {
                return;
              }

              // update layerIdx in case map layers have been added/removed/reordered in the meantime
              var layerIdx = this._layerIndexByLayerViewId[layerClass][layerView.id];

              if (layerIdx != null) {
                // tilemap data is now present, check if requested tile is available in cache
                if (tilemapTile.tileDataAvailable(tile, layerIdx, layerClass)) {
                  dfd.actualTileRequestPromise = this._requestTileData(tile, layerIdx, layerClass, layerView);
                  dfd.actualTileRequestPromise.then(function() {
                    dfd.resolve();
                  });
                }
                else {
                  this.tilemapStats.tilesNotPresent++;
                  this._dispatchDataEvent(tile, "dataMissing", layerClass, layerView, { notInTilemap: true});
                  dfd.reject();
                }
              }
            }.bind(this));

            return dfd;
          }

        }
        
        return this._requestTileData(tile, layerIdx, layerClass, layerView);
      },

      _requestTileData: function(tile, layerIdx, layerClass, layerView) {
        // private interface directly requests the data
        this.tilemapStats.tileRequestsSent++;
        var url = layerView.getTileUrl(tile.lij[0], tile.lij[1], tile.lij[2]);
        var requestPromise;
        var that = this;
        if (layerClass === TerrainConst.LayerClass.ELEVATION) {
          requestPromise = this._streamDataSupplier.request(url, "binary");
          requestPromise.then(
            function(url, data/*, docType, metadata*/) {
              var newLayerIdx = that._layerIndexByLayerViewId[layerClass][layerView.id];
              if (newLayerIdx != null) {
                var layerInfo = tile.layerInfo[layerClass][newLayerIdx];
                data.url = url;
                layerInfo.rawData = data;

                tile.pendingUpdates |= TileUpdateTypes.DECODE_LERC;
                layerInfo.pendingUpdates |= TileUpdateTypes.DECODE_LERC;

                that._pendingUpdates = true;
                // LERC data will be decoded in frame update queue
              }
              else {
                console.warn("TerrainSurface: received data from unknown layer %d %s", layerClass, tile.lij.toString());
              }
            },
            function(error) {
              that.tilemapStats.tileRequestErrors++;
              that._dispatchDataEvent(tile, "dataMissing", layerClass, layerView, error);
            }
          );
        } else {
          requestPromise = this._streamDataSupplier.request(url, "image");
          requestPromise.then(
            function(url, data/*, docType, metadata*/) {
              that._dispatchDataEvent(tile, "dataArrived", layerClass, layerView, data);
            },
            function(error) {
              that.tilemapStats.tileRequestErrors++;
              that._dispatchDataEvent(tile, "dataMissing", layerClass, layerView, error);
            }
          );
        }

        return requestPromise;
      },

      requestTilemapData: function(tile, layerIdx, layerClass, layerView) {
        var requestPromise;

        var dfd = new PromiseLightweight.Promise(function() {
          requestPromise.cancel();
        });

        var level = tile.lij[0] + TerrainConst.TILEMAP_SIZE_EXP;
        var row = tile.lij[1] << TerrainConst.TILEMAP_SIZE_EXP;
        var col = tile.lij[2] << TerrainConst.TILEMAP_SIZE_EXP;

        this.tilemapStats.tilemapRequestsSent++;
        this.tilemapStats.tilemapRequestsPending++;

        var that = this;
        var size = 1 << Math.min(TerrainConst.TILEMAP_SIZE_EXP, level);
        
        requestPromise = layerView.layer.tileMap.getTileMap(level, row, col, size, size);

        requestPromise.then(
          function(data) {
            that.tilemapStats.tilemapRequestsPending--;

            var location = data.location;

            if ((data.valid !== true) || !location || (location.top !== row) || (location.left !== col) ||
                (location.width !== size) || (location.height !== size)) {
              console.warn("Unexpected tilemap response for %s/%d/%d/%d/%d/%d", layerView.id, level, row,
                col, size, size);
              handleTilemapError();
            }
            else {
              // update layerIdx in case map layers have been added/removed/reordered in the meantime
              layerIdx = this._layerIndexByLayerViewId[layerClass][layerView.id];

              if (layerIdx != null) {
                tile.layerInfo[layerClass][layerIdx].tilemapData = data;
              }

              dfd.resolve();
            }
          }.bind(this),

          function() {
            handleTilemapError();
          }
        );

        var handleTilemapError = function() {
          // tilemap request failed; we're going to assume that all tiles are available, and thereby we risk
          // displaying blank tiles
          that.tilemapStats.tilemapRequestErrors++;
//          var dummyTilemap = new TileMap.TileMapData(level, row, col, size, size);
//          dummyTilemap.dataValue = 1;
//          tile.layerInfo[layerClass][layerIdx].tilemapData = dummyTilemap;
          dfd.resolve();
        };

        return dfd;
      },

      getTilemapTile: function(targetTile) {
        var level = targetTile.lij[0];
        if (level > TerrainConst.TILEMAP_SIZE_EXP) {
          return TileUtils.getTileNLevelsUp(targetTile, TerrainConst.TILEMAP_SIZE_EXP);
        }
        else {
          return this._topLevelTilemapOnlyTiles[level];
        }
      },

      _dispatchDataEvent: function(tile, event, layerClass, layerView, dataOrError) {
        var newLayerIdx = this._layerIndexByLayerViewId[layerClass][layerView.id];
        if (newLayerIdx != null) {
          tile[event](newLayerIdx, layerClass, dataOrError);
        }
        else {
          console.warn("TerrainSurface: received data from unknown layer");
        }
      },

      cancelRequest: function(requestPromise) {
        // the presence of actualTileRequestPromise signals that
        // - requestPromise is a promise that was created in requestTileData() because tilemap data for the requested
        //   tile was not yet available and thus the tile could not immediately be requested
        // - if actualTileRequestPromise !== null, it is the promise returned by StreamDataSupplier once the
        //   tilemap data became available and the actual tile data was requested
        var actualTileRequestPromise = requestPromise.actualTileRequestPromise;
        if (actualTileRequestPromise !== undefined) {
          if (actualTileRequestPromise !== null) {
            this._streamDataSupplier.cancelRequest(actualTileRequestPromise);
          }

          requestPromise.cancel();
        }
        else {
          this._streamDataSupplier.cancelRequest(requestPromise);
        }
      },

      /***********
       * Overlay
       ***********/

      _updateTileOverlayParams: function() {
        if (this._rootTiles) {
          var iter = this._iteratorPool.acquire();
          iter.reset(this._rootTiles);

          while (!iter.done) {
            var tile = iter.next();

            if (tile.renderData && this.overlayManager) {
              this.overlayManager.setOverlayParamsOfTile(tile, tile.renderData, this._curOverlayOpacity);
            }
          }

          this._iteratorPool.release(iter);
          this._renderer.setNeedsRender();
        }
      },

      _updateOverlayOpacity: function(eye)
      {
        if (this.overlayManager) {
          var opacity = this.overlayManager.updateOpacity(eye);

          if (!isNaN(opacity)) {
            if ((opacity !== this._curOverlayOpacity) && this._rootTiles) {
              var iter = this._iteratorPool.acquire();
              iter.reset(this._rootTiles);

              while (!iter.done) {
                var tile = iter.next();

                if (tile.renderData && tile.renderData.overlayTexId) {
                  tile.renderData.overlayOpacity = opacity;
                }
              }

              this._iteratorPool.release(iter);
            }

            this._curOverlayOpacity = opacity;
            this._renderer.setNeedsRender();
          }
        }
      },

      /**************************
       * Debugging and profiling
       **************************/

      getStats: function() {
        var numNodes = 0;
        var numLeaves = 0;
        var numVisible = 0;

        var iter = this._iteratorPool.acquire();
        iter.reset(this._rootTiles);

        while (!iter.done) {
          var tile = iter.next();

          numNodes++;
          
          if (tile.renderData) {
            numLeaves++;
            
            if (tile.visible) {
              numVisible++;
            }
          }
        }

        this._iteratorPool.release(iter);

        return {
          numNodes: numNodes,
          numLeaves: numLeaves,
          numVisible: numVisible
        };
      },

      getTile: function(name) {
        var lij = name.split("/").map(JSON.parse);
        if (lij[0] === 0) {
          this._rootTiles.forEach(function(rootTile) {
            if ((rootTile.lij[1] === lij[1]) && (rootTile.lij[2] === lij[2])) {
              return rootTile;
            }
          });
          return null;
        }

        var rootCol = lij[1] >> lij[0],
          rootRow = lij[2] >> lij[0],
          tile;
        this._rootTiles.some(function(rootTile) {
          if ((rootTile.lij[1] === rootCol) && (rootTile.lij[2] === rootRow)) {
            tile = rootTile;
            return true;
          }
          return false;
        });

        if (tile) {
          var mask = 1 << (lij[0] - 1);
          while (tile.lij[0] < lij[0]) {
            var childIdx = (lij[1] & mask) ? 2 : 0;
            if ((lij[2] & mask) > 0) {
              childIdx ++;
            }
            if (!tile.children[childIdx]) {
              console.log("Tile " + name + " doesn't exist, smallest ancestor is " + TileUtils.tile2str(tile));
              return null;
            }
            tile = tile.children[childIdx];
            mask >>= 1;
          }
          terrainWeakAssert((tile.lij[0] === lij[0]) && (tile.lij[1] === lij[1]) && (tile.lij[2] === lij[2]), "not the right tile?");
          return tile;
        }

        return null;
      },

      setBorders: function(enabled) {
        this._renderer.setBorders(enabled);
      },

      setDisableRendering: function(disabled) {
        this._renderer.setDisableRendering(disabled);
      },

      /**************************
       * Properties
       **************************/

      _tilingSchemeSetter: function(value) {
        var dataExtent;
        if (Array.isArray(value)) {
          // automatically generate a tiling scheme from given extent
          dataExtent = value;
          value = TilingScheme.fromExtent(dataExtent, this._view.map.spatialReference,
            this._view.mapCoordsHelper.mapUnitInMeters);
          this._tilingSchemeIsGenerated = true;
        }
        else {
          this._tilingSchemeIsGenerated = false;
        }

        if (value && this._tilingScheme && this._tilingScheme.compatibleWith(value)) {
          return;
        }

        if (this._tilingScheme) {
          // dispose of old surface

          this._removeAllTiles();
          this._layerViews.forEach(function(layerViews) {
            layerViews.length = 0;
          });
          this._tiledDataExtent = null;
          if (!this._tilingSchemeIsGenerated) {
            this._dataExtent = null;
          }
          this._tilingScheme = null;
          this.spatialReference = null;
          this._maxLod = DEFAULT_MAX_LOD;
          this.overlayManager.setSpatialReference(null);
        }

        if (value) {
          value.ensureMaxLod(this._maxLod);
          this._tilingScheme = value;
          this.spatialReference = value.spatialReference;
          this._clippingChanged();
          this._updateRootTiles();
          this.overlayManager.setSpatialReference(this.spatialReference);
        }
      },

      _tilingSchemeGetter: function() {
        return this._tilingScheme;
      },

      _manifoldGetter: function() {
        return this._manifold;
      },

      _extentGetter: function() {
        return this._clippingExtent || this._rootExtent;
      },

      _hasFixedExtent: function() {
        return !!(this._clippingExtent || this._worldExtent);
      },

      _wireframeSetter: function(value) {
        this._renderer.setWireframe(value);
        return value;
      },

      _opacitySetter: function(value) {
        this._renderer.setOpacity(value);
        return value;
      },

      _skirtsSetter: function(value) {
        this._renderer.setDrawSkirts(!!value);
        return value;
      },

      _cullBackFacesSetter: function(value) {
        this._renderer.setCullBackFaces(value);
        return value;
      },

      _renderOrderSetter: function(value) {
        this._renderer.setRenderOrder(value);
        return value;
      },

      _frontMostTransparentSetter: function(value) {
        this._renderer.setFrontMostTransparent(!!value);
        return value;
      },

      _tileBackgroundSetter: function(value) {
        if (value !== this.tileBackground) {
          this._renderer.updateTileBackground(value);
        }

        return value;
      }
    });

    TerrainSurface.checkUnsupported = function(tileInfo, extent) {
      var err = TilingScheme.checkUnsupported(tileInfo);
      if (err) {
        return err;
      }

      if (extent) {
        return TerrainSurface._checkNumRootTiles(tileInfo, extent);
      }
      else {
        return null;
      }
    };

    TerrainSurface._checkNumRootTiles = function(tileInfo, extent) {
      var lods = tileInfo.lods;
      var level0Resolution = lods[0].resolution * Math.pow(2, lods[0].level);
      var tileSize = [level0Resolution*tileInfo.rows, level0Resolution*tileInfo.cols];
      var origin = [tileInfo.origin.x, tileInfo.origin.y];

      extent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];

      TilingScheme.computeRowColExtent(extent, tileSize, origin, tmpVec);

      if ((tmpVec[2] - tmpVec[0]) * (tmpVec[3] - tmpVec[1]) > MAX_ROOT_TILES) {
        // Compute suggested scale such that a single level 0 tile will contain the entire extent

        var level0Scale = lods[0].scale * Math.pow(2, lods[0].level);
        var suggestedResolution = Math.max((extent[3] - extent[1]) / tileInfo.rows,
          (extent[2] - extent[0]) / tileInfo.cols);
        var suggestedScale = suggestedResolution * level0Scale / level0Resolution;

        // round up to next nice number
        var digits = Math.floor(Math.log(suggestedScale)/Math.log(10));
        suggestedScale = Math.ceil(suggestedScale / Math.pow(10, digits)) * Math.pow(10, digits);

        var err = new Error("Scale of level 0 of the tiling scheme (1:" + Math.floor(level0Scale).toLocaleString() +
          ") is too large for the layer's extent. Suggested scale: 1:" + suggestedScale.toLocaleString() + ".");
        err.name = "terrainsurface:num-root-tiles";
        return err;
      }

      return null;
    };

    function lijEqual(a, b) {
      return (a[0] === b[0]) && (a[1] === b[1]) && (a[2] === b[2]);
    }

    return TerrainSurface;
  }
);
