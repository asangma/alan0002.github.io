/* jshint bitwise:false */
define(["./UpsampleInfo"], function(UpsampleInfo) {
  var MAX_UPSAMPLING_LEVELS = 6;

  var abstractError = new Error("Abstract method called on TileAgentBase");

  var TileAgentBase = function() {
    // not doing anything in constructor to allow for object pooling
  };

  TileAgentBase.prototype.init = function(tile, layerIdx, layerClass, suspended) {
    this.tile = tile;
    this.layerIdx = layerIdx;
    this.layerClass = layerClass;
    this._tileLayerInfo = tile.getLayerInfo(layerIdx, layerClass);
    this._dataRequested = null;
    this.suspended = suspended;

    if (tile.data) {
      return;
    }

    var data = this._findAncestorWithData();

    if (data) {
      this._setUpsamplingTile(data.tile);
      UpsampleInfo.Pool.release(data);
    } else {
      if (this._tileLayerInfo.upsampleFromTile) {
        UpsampleInfo.Pool.release(this._tileLayerInfo.upsampleFromTile);
      }

      this._tileLayerInfo.upsampleFromTile = null;
    }

    return this._requestNext(true); // _requestNext() returns true if it has started a request, false otherwise
  };

  TileAgentBase.prototype.dispose = function() {
    if (this._dataRequested) {
      this._dataRequested.unrequestLayerData(this.layerIdx, this.layerClass, this);
      this._dataRequested = null;
    }

    this.tile = null;
    this._tileLayerInfo = null;
  };

  TileAgentBase.prototype.setSuspension = function(suspended) {
    if (suspended !== this.suspended) {
      this.suspended = suspended;
      if (suspended) {
        // suspend
        if (this._dataRequested) {
          this._dataRequested.unrequestLayerData(this.layerIdx, this.layerClass, this);
          this._dataRequested = null;
        }
      }
      else {
        // unsuspend
        if (!this._tileLayerInfo.data) {
          this.update();
        }
      }
    }
  };

  TileAgentBase.prototype.update = function() {
    var data = this._findAncestorWithData();

    if (data && this._tileLayerInfo.upsampleFromTile && data.tile !== this._tileLayerInfo.upsampleFromTile.tile) {
      this._setUpsamplingTile(data.tile);
    } else if (data) {
      UpsampleInfo.Pool.release(data);
    }

    return this._requestNext();
  };

  TileAgentBase.prototype.dataArrived = function(tile) {
    throw abstractError;
  };

  TileAgentBase.prototype.dataMissing = function(tile) {
    this._dataRequested = null;
    this._agentDone();
  };

  TileAgentBase.prototype._agentDone = function() {
    this.tile.agentDone(this.layerIdx, this.layerClass);
    this.dispose();
  };

  TileAgentBase.prototype._requestNext = function(isInit) {
    if (this.suspended) {
      // if the agent starts suspended, we simply assume that there will be data to download once
      // the agent gets un-suspended
      return true;
    }
    else {
      var requestOnTile = this._findNextDownload();

      if (this._dataRequested) {
        if (requestOnTile === this._dataRequested) {
          return true;
        }

        this._dataRequested.unrequestLayerData(this.layerIdx, this.layerClass, this);
        this._dataRequested = null;
      }

      if (requestOnTile) {
        var requested = requestOnTile.requestLayerData(this.layerIdx, this.layerClass, this);

        if (requested) {
          this._dataRequested = requestOnTile;
        }
      }
      else if (!isInit) {
        this._agentDone();
      }

      return !!this._dataRequested;
    }
  };


  // the basic implementation of _findAncestorWithData traverses the ancestry up to MAX_UPSAMPLING_LEVELS up and
  // returns the first match it finds. the method can be overridden to implement different behavior
  TileAgentBase.prototype._findAncestorWithData = function() {
    return findAncestorWithDataRec(this.tile, this.layerIdx, this.layerClass, 1, 0, 0, 0);
  };
  var findAncestorWithDataRec = function(tileRec, layerIdx, layerClass, scale, offsetX, offsetY, levelsUp) {
    if (!tileRec.parent || levelsUp > MAX_UPSAMPLING_LEVELS) {
      return null;
    }

    // compute scaling and offset that maps the original tile into the current tile's parent
    scale *= 0.5;
    offsetX *= 0.5;
    offsetY *= 0.5;
    if (tileRec.lij[2] & 1) {
      offsetX += 0.5; // row is odd -> increase x offset
    }
    if ((tileRec.lij[1] & 1) === 0) {
      offsetY += 0.5; // column is event -> increase y offset (y axis is flipped)
    }

    if (tileRec.parent.hasLayerData(layerIdx, layerClass)) {
      var info = UpsampleInfo.Pool.acquire();
      info.init(tileRec.parent, offsetX, offsetY, scale);

      return info;
    }
    else {
      // recurse
      return findAncestorWithDataRec(tileRec.parent, layerIdx, layerClass, scale, offsetX, offsetY, levelsUp+1);
    }
  };

  TileAgentBase.prototype._findNextDownload = function() {
    throw abstractError;
  };

  return TileAgentBase;
});