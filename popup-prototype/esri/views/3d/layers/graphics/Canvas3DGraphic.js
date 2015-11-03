define(["../../../../core/declare",
  "./ElevationInfo",
  "../../webgl-engine/Stage"
], function(declare, ElevationInfo, Stage) {
    var Canvas3DGraphic = declare(null, {
      constructor: function(canvas3DSymbol, stageObject, uniqueGeometries, uniqueMaterials, uniqueTextures,
                            elevationAligner, elevationInfo, visibilityMode) {
        this.canvas3DSymbol = canvas3DSymbol;
        this.uniqueMaterials = uniqueMaterials;
        this.uniqueGeometries = uniqueGeometries;
        this.uniqueTextures = uniqueTextures;
        this.stageObject = stageObject;
        this.elevationAligner = elevationAligner;
        this.elevationInfo = new Canvas3DGraphicElevationInfo(elevationInfo);
        this.stage = null;
        this.stageLayer = null;
        this._shown = false;
        this._visibilityFlags = {};
        this.visibilityMode = (visibilityMode != null) ? visibilityMode : Canvas3DGraphic.VisibilityModes.HIDE_FACERANGE;
      },

      initialize: function(stageLayer, stage) {
        this.stageLayer = stageLayer;
        this.stage = stage;

        var i;
        if (this.uniqueMaterials) {
          for (i = 0; i < this.uniqueMaterials.length; i++) {
            stage.add(Stage.ModelContentType.MATERIAL, this.uniqueMaterials[i]);
          }
        }
        if (this.uniqueGeometries) {
          for (i = 0; i < this.uniqueGeometries.length; i++) {
            stage.add(Stage.ModelContentType.GEOMETRY, this.uniqueGeometries[i]);
          }
        }
        if (this.uniqueTextures) {
          for (i = 0; i < this.uniqueTextures.length; i++) {
            stage.add(Stage.ModelContentType.TEXTURE, this.uniqueTextures[i]);
          }
        }
        stage.add(Stage.ModelContentType.OBJECT, this.stageObject);
      },

      isDraped: function() {
        return false;
      },

      areVisibilityFlagsSet: function(flagToTest, flagToIgnore) {
        var isSet = true;
        var flags = Object.keys(this._visibilityFlags);
        for (var i=0; i<flags.length; i++) {
          var flag = flags[i];
          if (flag===flagToIgnore) {
            continue;
          }
          if (flag===flagToTest) {
            return this._visibilityFlags[flag];
          }
          isSet = isSet && this._visibilityFlags[flag];
        }
        return isSet;
      },
      setVisibilityFlag: function(flag, value) {
        this._visibilityFlags[flag] = value;
        return this._calcAndSetVisibility();
      },
      _calcAndSetVisibility: function() {

        if (this.stage==null) {
          return;
        }

        var shownNew = this.areVisibilityFlagsSet();

        if (this._shown != shownNew) {

          this._shown = shownNew;
          if (this._shown) {
            if (!this.stageLayer.hasObject(this.stageObject)) {
              this.stageLayer.addObject(this.stageObject);
            } else {
              this.stageObject.unhideAllFaceRange();
            }
          }
          else {
            if (this.visibilityMode === Canvas3DGraphic.VisibilityModes.HIDE_FACERANGE) {
              this.stageObject.hideAllFaceRanges();
            }
            else {
              this.stageLayer.removeObject(this.stageObject);
            }
          }
          return true;
        }
        return false;
      },

      destroy: function() {
        if (this.stageLayer) {
          var i,
            stage = this.stage;
          if (this.uniqueMaterials) {
            for (i = 0; i < this.uniqueMaterials.length; i++) {
              stage.remove(Stage.ModelContentType.MATERIAL, this.uniqueMaterials[i].getId());
            }
          }
          if (this.uniqueGeometries) {
            for (i = 0; i < this.uniqueGeometries.length; i++) {
              stage.remove(Stage.ModelContentType.GEOMETRY, this.uniqueGeometries[i].getId());
            }
          }
          if (this.uniqueTextures) {
            for (i = 0; i < this.uniqueTextures.length; i++) {
              stage.remove(Stage.ModelContentType.TEXTURE, this.uniqueTextures[i].getId());
            }
          }
        }
        stage.remove(Stage.ModelContentType.OBJECT, this.stageObject.getId());
        if (this.stageLayer.hasObject(this.stageObject)) {
          this.stageLayer.removeObject(this.stageObject);          
        }
        this._shown = false;

        this.stageLayer = null;
        this.stage = null;
      },

      mustAlignToTerrain: function() {
        return this.elevationInfo.mode !== ElevationInfo.MODES.ABSOLUTE_HEIGHT;
      },

      alignWithElevation: function(elevationProvider, renderCoordsHelper, mapCoordsHelper) {
        if (this.elevationAligner) {
          this.elevationAligner(this, elevationProvider, renderCoordsHelper, mapCoordsHelper);
        }
      },

      setDrawOrder: function() {
      },

      getBSRadius: function() {
        return this.stageObject.getBSRadiusApproxScaled();
      },

      getCenterObjectSpace: function() {
        return this.stageObject.getCenter(true);
      },

      getBoundingBoxObjectSpace: function() {
        return this.stageObject.getBBMin(true).concat(this.stageObject.getBBMax(true));
      },

      getScreenSize: function() {
        // this method should be overwritten by symbol layers if the symbol layer has a constant screen size
        throw new Error("Not implemented for this symbol layer/graphic type");
      }
    });

    Canvas3DGraphic.VisibilityModes = {
      REMOVE_OBJECT: 0,
      HIDE_FACERANGE: 1
    };

    var Canvas3DGraphicElevationInfo = function(src) {
      ElevationInfo.call(this, src);
      this.centerPointInElevationSR = null;
    };
    Canvas3DGraphicElevationInfo.prototype = new ElevationInfo();
    Canvas3DGraphicElevationInfo.prototype.constructor = Canvas3DGraphicElevationInfo;

    return Canvas3DGraphic;
  });
