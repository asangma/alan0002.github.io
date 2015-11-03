define(["../../../../core/declare",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Util"
], function(
  declare,
  Stage, Util)
{
  var assert = Util.assert;

  var Canvas3DDrapedGraphic = declare(null, {
    constructor: function(canvas3DSymbol, renderGeometries, uniqueMaterials, uniqueTextures) {
      this.canvas3DSymbol = canvas3DSymbol;
      this.renderGeometries = renderGeometries;
      this.uniqueMaterials = uniqueMaterials;
      this.uniqueTextures = uniqueTextures;
      this.stage = null;

      this._visibilityFlags = {};
      this._shown = false;
    },

    initialize: function(stageLayer, stage) {
      this.stage = stage;

      var i;
      if (this.uniqueMaterials) {
        for (i = 0; i < this.uniqueMaterials.length; i++) {
          stage.add(Stage.ModelContentType.MATERIAL, this.uniqueMaterials[i]);
        }
      }
      if (this.uniqueTextures) {
        for (i = 0; i < this.uniqueTextures.length; i++) {
          stage.add(Stage.ModelContentType.TEXTURE, this.uniqueTextures[i]);
        }
      }
    },

    isDraped: function() {
      return true;
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
      var shownNew = this.areVisibilityFlagsSet();

      if (this._shown != shownNew) {
        this._shown = shownNew;
        assert(this.stage, "Canvas3DDrapedGraphic must be initialized first");
        if (this._shown) {
          this.stage.getTextureGraphicsRenderer().addRenderGeometries(this.renderGeometries);
        }
        else {
          this.stage.getTextureGraphicsRenderer().removeRenderGeometries(this.renderGeometries);
        }
        return true;
      }
      return false;
    },

    destroy: function() {
      if (this.stage) {
        var i,
          stage = this.stage;
        
        if (this._shown) {
          stage.getTextureGraphicsRenderer().removeRenderGeometries(this.renderGeometries);
        }
        this._shown = false;

        if (this.uniqueMaterials) {
          for (i = 0; i < this.uniqueMaterials.length; i++) {
            stage.remove(Stage.ModelContentType.MATERIAL, this.uniqueMaterials[i].getId());
          }
        }
        if (this.uniqueTextures) {
          for (i = 0; i < this.uniqueTextures.length; i++) {
            stage.remove(Stage.ModelContentType.TEXTURE, this.uniqueTextures[i].getId());
          }
        }
        
        this.stage = null;
      }
    },

    mustAlignToTerrain: function() {
      return false;
    },

    alignWithElevation: function() {
    },

    setDrawOrder: function(drawOrder, dirtyMaterials, dirtySymbols) {
      if (this.uniqueMaterials) {
        this.uniqueMaterials.forEach(function(mat) {
          mat.setRenderPriority(drawOrder);
          if (this._shown) {
            dirtyMaterials[mat.getId()] = true;
          }
        }.bind(this));
      }
    },

    getBSRadius: function() {
      var rad = 0;
      this.renderGeometries.forEach(function(rg){rad = Math.max(rad,rg.bsRadius);});
      return rad;
    },

    getCenterObjectSpace: function() {
      return [0,0,0];
    }

  });

  return Canvas3DDrapedGraphic;
});
