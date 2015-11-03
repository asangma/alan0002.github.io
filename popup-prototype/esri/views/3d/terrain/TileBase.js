/* jshint bitwise:false */
define([
  "../support/mathUtils",
  "../../../layers/support/LercCodec",
  "./TileUtils",
  "./TerrainConst",
  "./TileGeometryFactory",
  "./UpsampleInfo",
  "../lib/glMatrix",
  "../webgl-engine/lib/Util",
  "../../../core/arrayUtils"
], function(mathUtils, LercCodec, TileUtils, TerrainConst, TileGeometryFactory, UpsampleInfo, glMatrix, Util, arrayUtils) {
  // imports from global namespace (to pacify JSHint)
  var vec3d = glMatrix.vec3d;
  var vec2d = glMatrix.vec2d;
  var vec4d = glMatrix.vec4d;

  var assert = Util.assert;

  // temporary variables:
  var eyeToCenter = vec3d.create();
  var tmp = vec4d.create();

  // constants
  var LOD_VERTICAL_STOP_FACTOR = 0.15;
  var ZERO_VEC = vec3d.create();

  var AGENT_DONE = {};
  
  var LAYERCLASS_COUNT = TerrainConst.LayerClass.LAYER_CLASS_COUNT;
  var LAYERCLASS_MAP = TerrainConst.LayerClass.MAP;
  var LAYERCLASS_ELEVATION = TerrainConst.LayerClass.ELEVATION;

  var TileUpdateTypes = TerrainConst.TileUpdateTypes;

  var Tile = function(lij, parentTile, parentSurface) {
    this.lij = [0, 0, 0];

    this.extent = vec4d.create();
    this.extentWGS84Rad = vec4d.create();
    this.centerAtSeaLevel = vec3d.create();
    this.center = vec3d.create();
    this.tileUp = ZERO_VEC;
    this.elevationBounds = vec2d.create();
    this.children = [null, null, null, null];
    this.centerProjected = vec4d.create();
    this.layerInfo = new Array(LAYERCLASS_COUNT);
    this.isWithinClippingArea = true;
    this.intersectsClippingArea = true;
    this.clippingArea = null;
  };

  Tile.prototype.init = function(lij, parentTile, parentSurface) {
    this.lij[0] = lij[0];
    this.lij[1] = lij[1];
    this.lij[2] = lij[2];

    vec4d.set4(0, 0, 0, 0, this.extent);
    vec4d.set4(0, 0, 0, 0, this.extentWGS84Rad);

    this.isWithinClippingArea = true;
    this.intersectsClippingArea = true;
    this.clippingArea = null;

    this.edgeLen = 0;
    this.radius = 0;

    // The vlevel of a tile is an estimated virtual LOD which the tile should
    // have (based on size on screen) if it was not limited by the maximum LOD
    // supported by maximum map scale. The virtual level is used to render
    // higher LOD elevation data (if available) by further tesselating the
    // tile without creating new tiles
    this.vlevel = lij ? lij[0] : 0;

    if (parentTile && parentTile.elevationBounds) {
      vec2d.set(parentTile.elevationBounds, this.elevationBounds);
    }
    else {
      vec2d.set2(0, 0, this.elevationBounds);
    }

    this.parent = parentTile;

    for (var i = 0; i < 4; i++) {
      this.children[i] = null;
    }

    this.pendingUpdates = 0;

    this.renderData = null;
    this.screenDepth = 0;
    this.renderOrder = 0;
    this.visible = false;

    this.parentSurface = parentSurface;

    for (var layerClass = 0; layerClass < LAYERCLASS_COUNT; layerClass++) {
      if (parentSurface) {
        var numLayers = parentSurface.numLayers(layerClass);
        var layerInfo;

        if (!this.layerInfo[layerClass]) {
          layerInfo = new Array(numLayers);
          this.layerInfo[layerClass] = layerInfo;
        } else {
          layerInfo = this.layerInfo[layerClass];
          layerInfo.length = numLayers;
        }

        for (var layerIdx = 0; layerIdx < numLayers; layerIdx++) {
          layerInfo[layerIdx] = _makeEmptyLayerInfo(layerClass, layerInfo[layerIdx]);

          if (parentTile && layerClass == LAYERCLASS_ELEVATION) {
            layerInfo[layerIdx].elevationBounds = parentTile.layerInfo[layerClass][layerIdx].elevationBounds;
          }
        }
      } else {
        this.layerInfo[layerClass] = null;
      }
    }
  };

  Tile.prototype.dispose = function() {
    for (var layerClass = 0; layerClass < LAYERCLASS_COUNT; layerClass++) {
      var layerInfos = this.layerInfo[layerClass];

      for (var layerIdx = 0; layerIdx < layerInfos.length; layerIdx++) {
        var layerInfo = layerInfos[layerIdx];

        if (layerInfo.upsampleFromTile) {
          UpsampleInfo.Pool.release(layerInfo.upsampleFromTile);
          layerInfo.upsampleFromTile = null;
        }
      }
    }
  };

  Tile.prototype.shouldSplit = function(limits, eye) {
    var level = this.lij[0];
    if (level < 1) {
      return TileUpdateTypes.SPLIT;
    }

    vec3d.subtract(this.center, eye, eyeToCenter);

    var dist = vec3d.length(eyeToCenter);
    var screenLen = this.edgeLen / (limits[0] * dist * 2.0);

    if (screenLen < limits[1]) {
      if (this.vlevel !== this.lij[0]) {
        this.vlevel = this.lij[0];
        return TileUpdateTypes.VSPLITMERGE;
      }

      return TileUpdateTypes.NONE;
    }

    if (level >= limits[4]) {
      // Check if we should do a vsplit for higher elevation LOD, this is a very
      // crude approximation.
      var vlevel = level + Math.ceil(-Math.log2(limits[1] / screenLen));

      if (vlevel !== this.vlevel) {
        this.vlevel = vlevel;
        return TileUpdateTypes.VSPLITMERGE;
      }

      return TileUpdateTypes.NONE;
    }

    if (level > 10) {
      // distance from eye to radius defined by tile on its approximating plane
      // according to http://www.geometrictools.com/Documentation/DistancePoint3Circle3.pdf
      // P = eye, C = tileCenter, N = tileCenterNormal
      vec3d.scale(this.tileUp, vec3d.dot(this.tileUp, eyeToCenter), tmp); // tmp = N*(C-P)*N
      vec3d.subtract(tmp, eyeToCenter); // tmp = N*(C-P)*N - (C-P)
      if (vec3d.length2(tmp) > this.radius*this.radius) {
        // closest point is outside of radius
        vec3d.scale(tmp, this.radius/vec3d.length(tmp)); // tmp = r * N*(C-P)*N-(C-P) / |N*(C-P)*N-(C-P)|
        vec3d.add(tmp, this.centerAtSeaLevel); // tmp = C + r * N*(C-P)*N-(C-P) / |N*(C-P)*N-(C-P)|  (Equation (1))
        // now tmp is the closest point
        vec3d.subtract(eye, tmp, tmp);
        var foreshortening = vec3d.dot(tmp, this.tileUp) / vec3d.length(tmp);
        if (foreshortening*screenLen < LOD_VERTICAL_STOP_FACTOR*limits[1]) {
          return TileUpdateTypes.NONE;
        }
      }
    }
    return TileUpdateTypes.SPLIT;
  };

  Tile.prototype.createElevationDataFromLERC = function(lercData) {
    var result;
    try {
      var elevationData = LercCodec.decode(lercData, {noDataValue: TerrainConst.ELEVATION_NODATA_VALUE });
      var width = elevationData.width;
      var safeWidth = (width-1)*0.99999999;
      var pixels = elevationData.pixelData;
      var dx = (width-1)/(this.extent[2] - this.extent[0]);
      var dy = (width-1)/(this.extent[3] - this.extent[1]);
      var x0 = this.extent[0];
      var y1 = this.extent[3];

      // Some LERC tiles that have all 0 values incorrectly report maxValue as -MAX_FLOAT. Avoid issues
      // by fixing to 0.
      var maxValue = (elevationData.maxValue > -3e+38) ? elevationData.maxValue : 0;

      result = {
        bounds: [elevationData.minValue, maxValue],
        samplerData: {
          dx: dx,
          dy: dy,
          x0: x0,
          y1: y1,
          width: width,
          pixels: pixels,
          safeWidth: safeWidth
        }
      };
    }
    catch (e) {
      console.warn("Error decoding %s: %s", lercData.url, e.message);
    }
    return result;
  };

  Tile.prototype.getWGS84Extent = function() {
    return this.extentWGS84Rad.map(mathUtils.rad2deg);
  };

  Tile.prototype.load = function(terrainRenderer) {
    // create agent and start agents (suspended if tile not visible)
    for (var layerClass = 0; layerClass < LAYERCLASS_COUNT; layerClass++) {
      if (this.layerInfo[layerClass]) {
        this._createOrUpdateAgents(0, layerClass);
      }
    }

    terrainRenderer.loadTile(this);
  };

  Tile.prototype.unload = function(terrainRenderer) {
    if (this.renderData) {
      terrainRenderer.unloadTile(this);
    }

    // stop all agents
    for (var layerClass = 0; layerClass < LAYERCLASS_COUNT; layerClass++) {
      var layersInfo = this.layerInfo[layerClass];
      for (var i = 0; i < layersInfo.length; i++) {
        var layerInfo = layersInfo[i];
        if (layerInfo.loadingAgent && (layerInfo.loadingAgent !== AGENT_DONE)) {
          layerInfo.loadingAgent.dispose();

          var AgentType = this.parentSurface.agentTypeByLayerIndex(i, layerClass);
          AgentType.Pool.release(layerInfo.loadingAgent);

          layerInfo.loadingAgent = null;
        }

        layerInfo.pendingUpdates = 0;
      }
    }

    // remove any update flags that are related to display
    this.pendingUpdates &= ~TerrainConst.TileUpdateTypes.UPDATE_GEOMETRY;
    this.pendingUpdates &= ~TerrainConst.TileUpdateTypes.UPDATE_TEXTURE;
  };
  
  Tile.prototype.updateClippingStatus = function(clippingArea) {
    if (!arrayUtils.equals(clippingArea, this.clippingArea)) {
      if (clippingArea) {
        this.intersectsClippingArea = this._intersectsExtent(clippingArea);
        this.isWithinClippingArea = this._isWithinExtent(clippingArea);
      }
      else {
        this.intersectsClippingArea = true;
        this.isWithinClippingArea = true;
      }
      this.clippingArea = clippingArea;
      if (this.renderData) {
        this.updateGeometry();
      }
    }
  }

  Tile.prototype.updateVisibility = function(frustumPlanes, eyePos, visible) {
    var shouldBeVisible = visible || this.isVisible(frustumPlanes, eyePos) && this.intersectsClippingArea;

    if (shouldBeVisible !== this.visible) {
      this.visible = shouldBeVisible;

      // update agents
      //for (var layerClass = 0; layerClass < LAYERCLASS_COUNT; layerClass++) {
        var layerClass = 0;
        var layersInfo = this.layerInfo[layerClass];
        for (var i = 0; i < layersInfo.length; i++) {
          var layerInfo = layersInfo[i];
          if (layerInfo.loadingAgent && (layerInfo.loadingAgent !== AGENT_DONE)) {
            layerInfo.loadingAgent.setSuspension(!shouldBeVisible);
          }
        }
      //}
    }

    return shouldBeVisible;
  };

  Tile.prototype.getLayerInfo = function(layerIdx, layerClass) {
    return this.layerInfo[layerClass][layerIdx];
  };

  Tile.prototype.hasLayerData = function(layerIdx, layerClass) {
    var layerInfo = this.layerInfo[layerClass][layerIdx];
    return layerInfo && layerInfo.data;
  };

  Tile.prototype.tileDataAvailable = function(tile, layerIdx, layerClass) {
    var tilemapData = this.layerInfo[layerClass][layerIdx].tilemapData;
    if (tilemapData) {
      return (tilemapData.dataValue != null) ? tilemapData.dataValue :
        tilemapData.isTileAvailable(tile.lij[1], tile.lij[2]);
    }
    else {
      // if we don't have a tilemap available, we assume that tile data is available
      return true;
    }
  };

  Tile.prototype.requestLayerData = function(layerIdx, layerClass, agent) {
    if (TerrainConst.TILE_LOADING_DEBUGLOG) {
      console.log("tile %s layer %d/%d requested by tile %s", this.lij.toString(), layerClass, layerIdx, agent.tile.lij.toString());
    }

    var layerInfo = this.layerInfo[layerClass][layerIdx];
    if (layerInfo.waitingAgents.indexOf(agent) > -1) {
      console.warn("agent already requested this piece of map data (tile %s, agent tile %s, layer: %d/%d)", this.lij.toString(), agent.tile.lij.toString(), layerClass, layerIdx);
      return true;
    }
    if (layerInfo.data) {
      console.warn("agent requested existing data (tile %s, agent tile %s, layer: %d/%d)", this.lij.toString(), agent.tile.lij.toString(), layerClass, layerIdx);
      layerInfo.waitingAgents.push(agent);
      setTimeout(agent.dataArrived.bind(agent, this), 0);
      return true;
    }

    layerInfo.waitingAgents.push(agent);

    // request data if not already requested
    if (!layerInfo.requestPromise) {
      var requestPromise = this.parentSurface.requestTileData(this, layerIdx, layerClass);

      var clearRequestPromise = function() {
        if (layerInfo.requestPromise === requestPromise) {
          layerInfo.requestPromise = null;
        }
      };

      layerInfo.requestPromise = requestPromise;
      requestPromise.then(clearRequestPromise, clearRequestPromise);
    }

    if (layerInfo.requestPromise) {
      return true;
    } else {
      return false;
    }
  };

  Tile.prototype.descendants = function(ret) {
    if (!ret) {
      ret = [];
    }

    for (var i = 0; i < 4; i++) {
      var child = this.children[i];

      if (child) {
        child.descendants(ret);
        ret.unshift(this.children[i]);
      }
    }

    return ret;
  };

  Tile.prototype.isLij = function(lij) {
    return this.lij[0] === lij[0] && this.lij[1] === lij[1] && this.lij[2] == lij[2];
  };

  Tile.prototype.findByLij = function(lij) {
    if (this.isLij(lij)) {
      return this;
    }

    for (var i = 0; i < 4; i++) {
      var child = this.children[i];

      if (child) {
        var ret = child.findByLij(lij);

        if (ret) {
          return ret;
        }
      }
    }

    return null;
  };

  Tile.prototype.unrequestLayerData = function(layerIdx, layerClass, agent) {
    if (TerrainConst.TILE_LOADING_DEBUGLOG) {
      console.log("tile %s layer %d/%d canceled by tile %s", this.lij.toString(), layerClass, layerIdx, agent.tile.lij.toString());
    }

    var layerInfo = this.layerInfo[layerClass][layerIdx];
    var waitingAgents = layerInfo.waitingAgents;
    var agentIdx = waitingAgents.indexOf(agent);
    assert(agentIdx > -1, "agent has not requested this piece of map data");
    waitingAgents[agentIdx] = waitingAgents[waitingAgents.length-1];
    waitingAgents.length--;
    if (waitingAgents.length < 1) {
      assert(layerInfo.requestPromise || layerInfo.rawData, "no pending operations on layerInfo that agents were waiting for");

      if (layerInfo.requestPromise) {
        this.parentSurface.cancelRequest(layerInfo.requestPromise);
        layerInfo.requestPromise = null;
      }

      if (layerInfo.rawData) {
        layerInfo.rawData = null;
      }

      if (TerrainConst.TILE_LOADING_DEBUGLOG) {
        console.log("tile %s layer %d/%d request/loading canceled", this.lij.toString(), layerClass, layerIdx);
      }
    }
  };

  Tile.prototype.dataArrived = function(layerIdx, layerClass, data) {
    var layerInfo = this.layerInfo[layerClass][layerIdx];
    layerInfo.data = data;
    for (var i = 0; i < layerInfo.waitingAgents.length; i++) {
      layerInfo.waitingAgents[i].dataArrived(this);
    }
    layerInfo.waitingAgents.length = 0;
  };


  Tile.prototype.dataMissing = function(layerIdx, layerClass, error) {
    if (!error.notInTilemap) {
      console.error("Tile %s layer %d/%d error", this.lij.toString(), layerClass, layerIdx);
    }

    var layerInfo = this.layerInfo[layerClass][layerIdx];
    for (var i = 0; i < layerInfo.waitingAgents.length; i++) {
      layerInfo.waitingAgents[i].dataMissing(this);
    }
    layerInfo.waitingAgents.length = 0;
  };

  Tile.prototype.updateTexture = function(immediate) {
    if(this.renderData) {
      if(immediate) {
        this.parentSurface._renderer.updateTileTexture(this);
      }
      else {
        this.pendingUpdates = this.pendingUpdates | TerrainConst.TileUpdateTypes.UPDATE_TEXTURE;
        this.parentSurface._pendingUpdates = true;
      }
    }
  };

  Tile.prototype.updateElevationBounds = function() {
    vec2d.set2(Number.MAX_VALUE, -Number.MAX_VALUE, this.elevationBounds);
    var layersInfo = this.layerInfo[LAYERCLASS_ELEVATION];
    var boundsFound = false;
    for (var i = 0; i < layersInfo.length; i++) {
      var layerInfo = layersInfo[i];
      if (layerInfo.elevationBounds) {
        var layerView = this.parentSurface.layerViewByIndex(i, LAYERCLASS_ELEVATION);
        if (TileUtils.fallsWithinLayer(this, layerView, false)) {
          this.elevationBounds[0] = Math.min(this.elevationBounds[0], layerInfo.elevationBounds[0]);
          this.elevationBounds[1] = Math.max(this.elevationBounds[1], layerInfo.elevationBounds[1]);
          boundsFound = true;
        }
      }
    }
    if (!boundsFound) {
      vec2d.set2(0, 0, this.elevationBounds);
    }
    this.updateRadiusAndCenter();
  };

  Tile.prototype.updateRadiusAndCenter = function() {
    // This method must be called whenever this.elevationBounds has changed
    var height = this.elevationBounds[1] - this.elevationBounds[0];
    var baseRadius = this.edgeLen * Math.SQRT1_2;
    this.radius = Math.sqrt(baseRadius*baseRadius + height*height);
    var centerElev = this.elevationBounds[0] + 0.5*height;
    vec3d.scale(this.tileUp, centerElev, tmp);
    vec3d.add(this.centerAtSeaLevel, tmp, this.center);
  };

  Tile.prototype.setLayerElevationBounds = function(layerIdx, elevationBounds) {
    var layerInfo = this.layerInfo[LAYERCLASS_ELEVATION][layerIdx];
    if (!layerInfo.elevationBounds || (layerInfo.elevationBounds[2] < elevationBounds[2])) {
      layerInfo.elevationBounds = elevationBounds;
      this.updateElevationBounds();
    }
  };

  Tile.prototype.updateGeometry = function() {
    this.pendingUpdates = this.pendingUpdates | TerrainConst.TileUpdateTypes.UPDATE_GEOMETRY;
    this.parentSurface._pendingUpdates = true;
  };

  Tile.prototype.modifyLayers = function(old2newIndexMap, new2oldIndexMap, layerClass) {
    var newCount = new2oldIndexMap.length;
    var oldLayers = this.layerInfo[layerClass];
    var newLayers = new Array(newCount);

    // remove all agent references and dispose loadingAgent (if it exists)
    for (var i = 0; i < oldLayers.length; i++) {
      var layerInfo = oldLayers[i];

      if (layerInfo.loadingAgent && layerInfo.loadingAgent !== AGENT_DONE) {
        layerInfo.loadingAgent.dispose();

        var AgentType = this.parentSurface.agentTypeByLayerIndex(i, layerClass);
        AgentType.Pool.release(layerInfo.loadingAgent);

        layerInfo.loadingAgent = null;
      }
      layerInfo.waitingAgents.length = 0;
    }

    if(layerClass === LAYERCLASS_MAP) {
      for(var j=0; j<oldLayers.length; j++) {
        if(old2newIndexMap[j] === undefined) {
          var li = oldLayers[j];
          if(li.data instanceof WebGLTexture) {
            this.parentSurface._renderer.releaseTileTexture(li.data);
          }
        }
      }
    }

    // add new layers and reorder existing layers
    for (i = 0; i < newCount; i++) {
      var oldIndex = new2oldIndexMap[i];
      newLayers[i] = (oldIndex > -1) ? oldLayers[oldIndex] : _makeEmptyLayerInfo(layerClass);
    }

    this.layerInfo[layerClass] = newLayers;
  };

  Tile.prototype.restartAgents = function(layerClass) {
    if (this.renderData) {
      this._createOrUpdateAgents(0, layerClass);

      if (layerClass === LAYERCLASS_ELEVATION) {
        //this.updateElevationBounds();
        this.updateGeometry();

        var layerInfos = this.layerInfo[layerClass];

        for (var i = 0; i < layerInfos.length; i++) {
          layerInfos[i].pendingUpdates |= TerrainConst.TileUpdateTypes.UPDATE_GEOMETRY;
        }

        this.parentSurface._pendingUpdates = true;
      }
      else {
        this.updateTexture(true);
      }
    }
  };

  Tile.prototype.updateAgents = function(layerClass) {
    if (this.renderData) {
      // Clear all loading agents that are marked as DONE, so we can restart
      // them
      var layersInfo = this.layerInfo[layerClass];

      for (var i = 0; i < layersInfo.length; i++) {
        var layerInfo = layersInfo[i];

        if (layerInfo.loadingAgent === AGENT_DONE) {
          layerInfo.loadingAgent = null;
        }
      }

      this._createOrUpdateAgents(0, layerClass);
    }
  };

  Tile.prototype.agentDone = function(layerIdx, layerClass) {
    var layersInfo = this.layerInfo[layerClass];
    var layerInfo = layersInfo[layerIdx];
    layerInfo.loadingAgent = AGENT_DONE;

    if (!(layerInfo.data || layerInfo.upsampleFromTile)) {
      // agent did not find any data for display. if this is an opaque layer, fall back to layers of lesser precedence.
      if (layerIdx < layersInfo.length - 1) {
        this._createOrUpdateAgents(layerIdx+1, layerClass);
      }
    }
  };

  Tile.prototype._createOrUpdateAgents = function(startIdx, layerClass) {
    var suspended;

    if (layerClass === LAYERCLASS_ELEVATION) {
      suspended = false;
    } else {
      suspended = !this.visible;
    }

    var layerIdx = startIdx;
    var layersInfo = this.layerInfo[layerClass];
    var isElevation = layerClass === TerrainConst.LayerClass.ELEVATION;

    while (layerIdx < layersInfo.length) {
      var layerInfo = layersInfo[layerIdx];
      var isLoading = false;

      var layerView = this.parentSurface.layerViewByIndex(layerIdx, layerClass);

      if (layerInfo.loadingAgent !== null && layerInfo.loadingAgent !== AGENT_DONE) {
        // We have a current loading agent, so we can just update it as needed
        isLoading = layerInfo.loadingAgent.update();
      }
      else if (layerInfo.loadingAgent !== AGENT_DONE) {
        // if an agent has previously been instantiated and finished for this tile (layerInfo.loadingAgent === AGENT_DONE),
        // we don't need to re-create it. TODO: this is making the assumption that none of the layer properties
        // (extent, url, transparency, etc.) have changed, which is not necessarily the case.

        // check if this tile falls within the extent and min/maxScale of the layer
        if (TileUtils.fallsWithinLayer(this, layerView, false)) {
          var AgentType = this.parentSurface.agentTypeByLayerIndex(layerIdx, layerClass);
          var agent = AgentType.Pool.acquire();

          // perform initial search for an applicable upstream tile and start loading
          isLoading = agent.init(this, layerIdx, layerClass, suspended );

          if (isLoading) {
            layerInfo.loadingAgent = agent;
          }
          else {
            // agent could not be loading for 2 reasons:
            // - desired data was already present
            // - agent found that there is no applicable data for this tile
            AgentType.Pool.release(agent);
            layerInfo.loadingAgent = AGENT_DONE;
          }
        }
      }

      if (isLoading && !layerView.isTransparent()) {
        break;
      }

      layerIdx++;
    }
  };

  Tile.prototype.geometryState = function(state) {
    var vlevelDelta,
      tessLevel,
      numVertsPerRow,
      elevationInfo = this._getElevationInfo(state ? state.samplerData : null),
      level = this.lij[0],
      needsUpdate = false;

    if (elevationInfo.samplerData) {
      vlevelDelta = this.vlevel - level;

      // Compute a desired tesselation level (in powers of 2) from the available
      // elevation level. The max on the vlevel delta ensures we do not tesselate
      // beyond the level that we desire, even if we have higher resolution data
      // available.
      tessLevel = Math.max(level - elevationInfo.maxTileLevel,
        TerrainConst.ELEVATION_DESIRED_RESOLUTION_LEVEL - vlevelDelta);

      numVertsPerRow = mathUtils.clamp((256 >> tessLevel) + 1, 2, 257);
    }
    else {
      numVertsPerRow = (level < 8 ? (this._numSubdivisionsAtLevel[level] + 1) : 2);
    }

    numVertsPerRow = TileGeometryFactory.supportedNumVertsPerRow(numVertsPerRow);

    // Tiles completely outside or inside the clipping area can be generated
    // without clipping. This way, geometry does not get regenerated for tiles
    // not affected by the clipping.
    var clippingArea = this.clippingArea;
    if (!this.intersectsClippingArea || this.isWithinClippingArea) {
      clippingArea = null;
    }

    if (!state) {
      state = {
        numVertsPerRow: numVertsPerRow,
        samplerData: elevationInfo.samplerData,
        needsUpdate: true,
        clippingArea: clippingArea
      };
    } else {
      if (state.numVertsPerRow !== numVertsPerRow) {
        state.numVertsPerRow = numVertsPerRow;
        needsUpdate = true;
      }

      if (elevationInfo.changed) {
        state.samplerData = elevationInfo.samplerData;
        needsUpdate = true;
      }

      if (!arrayUtils.equals(state.clippingArea, clippingArea)) {
        state.clippingArea = clippingArea;
        needsUpdate = true;
      }

      state.needsUpdate = needsUpdate;
    }

    return state;
  };

  Tile.prototype._getElevationInfo = function(compareWithOldSamplerData) {
    var layersInfo = this.layerInfo[LAYERCLASS_ELEVATION],
      numLayers = layersInfo.length,
      samplerData = new Array(numLayers),
      samplerDataIdx = 0,
      maxTileLevel = 0,
      changed = false;

    for (var layerIdx = 0; layerIdx < numLayers; layerIdx++) {
      var layerInfo = layersInfo[layerIdx];
      if (layerInfo.upsampleFromTile) {
        var upsampleTile = layerInfo.upsampleFromTile.tile;
        var data = upsampleTile.layerInfo[LAYERCLASS_ELEVATION][layerIdx].data;
        if (!compareWithOldSamplerData || (compareWithOldSamplerData[samplerDataIdx] !== data.samplerData)) {
          changed = true;
        }
        samplerData[samplerDataIdx++] = data.samplerData;
        maxTileLevel = Math.max(maxTileLevel, upsampleTile.lij[0]);
      }
      else if (layerInfo.data) {
        // just because a tile has data doesn't mean that it fulfills the conditions for the data to be displayed
        // for this layer. e.g., the data might have been loaded for a child tile that fits within the layer's extent,
        // but this tile does not fit the extent and thus the data shouldn't be displayed for this tile.
        var layerView = this.parentSurface.layerViewByIndex(layerIdx, LAYERCLASS_ELEVATION);
        if (TileUtils.fallsWithinLayer(this, layerView, false)) {
          if (!compareWithOldSamplerData || (compareWithOldSamplerData[samplerDataIdx] !== layerInfo.data.samplerData)) {
            changed = true;
          }
          samplerData[samplerDataIdx++] = layerInfo.data.samplerData;
          maxTileLevel = this.lij[0];
        }
      }
    }
    if (compareWithOldSamplerData && (compareWithOldSamplerData.length !== samplerDataIdx)) {
      changed = true;
    }
    if (samplerDataIdx > 0) {
      samplerData.length = samplerDataIdx;
    }
    else {
      samplerData = null;
    }
    return {
      changed: changed,
      samplerData: samplerData,
      maxTileLevel: maxTileLevel
    };
  };
  
  /** Returns true if the tile is fully within the surface extent */
  Tile.prototype._isWithinExtent = function(surfExtent) {
    var tileExtent = this.extent;

    return (tileExtent[0] >= surfExtent[0]) && 
      (surfExtent[2] >= tileExtent[2]) &&
      (tileExtent[1] >= surfExtent[1]) &&
      (surfExtent[3] >= tileExtent[3]);
  }

  /** Returns true if the tile is at least partially within the surface extent */
  Tile.prototype._intersectsExtent = function(surfExtent) {
    var tileExtent = this.extent;

    return (tileExtent[2] >= surfExtent[0]) && 
      (surfExtent[2] >= tileExtent[0]) &&
      (tileExtent[3] >= surfExtent[1]) &&
      (surfExtent[3] >= tileExtent[1]);
  }

  function LayerInfo(layerClass) {
    this.waitingAgents = [];
    this.init(layerClass);
  }

  LayerInfo.prototype.init = function(layerClass) {
    this.waitingAgents.length = 0;

    this.data = null;
    this.tilemapData = null;
    this.tilemapRequest = null;
    this.upsampleFromTile = null;
    this.loadingAgent = null;
    this.requestPromise = null;
    this.rawData = null;
    this.pendingUpdates = 0;

    if (layerClass === LAYERCLASS_ELEVATION) {
      this.elevationBounds = null;
    }
  };

  var _makeEmptyLayerInfo = function(layerClass, result) {
    if (result) {
      result.init(layerClass);
      return result;
    }

    return new LayerInfo(layerClass);
  };

  return Tile;
});
