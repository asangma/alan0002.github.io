define(["../../../../core/declare"], function(declare) {
  var Canvas3DGraphicSet = declare(null, {
    constructor: function(graphic, canvas3DSymbol, canvas3DGraphics) {
      this.canvas3DSymbol = canvas3DSymbol;
      this.graphic = graphic;
      this._graphics = canvas3DGraphics;
      this._labelGraphics = [];
      this.addedToSpatialIndex = false; // used by GraphicsLayerView3D
    },

    initialize: function(stageLayer, labelStageLayer, stage) {
      var initializeCanvas3DGraphic = function (theStageLayer, canvas3DGraphic) {
        if (canvas3DGraphic) {
          canvas3DGraphic.initialize(theStageLayer, stage);
        }
      };
      this._graphics.forEach(initializeCanvas3DGraphic.bind(this, stageLayer));
      this._labelGraphics.forEach(initializeCanvas3DGraphic.bind(this, labelStageLayer));
    },

    addLabelGraphic: function(labelGraphic) {
      this._labelGraphics.push(labelGraphic);
    },

    isDraped: function() {
      for (var i = 0; i < this._graphics.length; i++) {
        var graphic = this._graphics[i];
        if (graphic && graphic.isDraped()) {
          return true;
        }
      }
      return false;
    },

    areVisibilityFlagsSet: function(flagToTest, flagToIgnore) {
      var r = true;
      for (var i = 0; i < this._graphics.length; i++) {
        var graphic = this._graphics[i];
        if (graphic) {
          r = r && graphic.areVisibilityFlagsSet(flagToTest, flagToIgnore);
        }
      }
      for (i = 0; i < this._labelGraphics.length; i++) {
        graphic = this._labelGraphics[i];
        if (graphic) {
          r =  r && graphic.areVisibilityFlagsSet(flagToTest, flagToIgnore);
        }
      }
      return r;
    },

    setVisibilityFlag: function(flag, value) {
      var change = false;

      var updateCanvas3DGraphic = function(canvas3DGraphic) {
        if (canvas3DGraphic) {
          change = canvas3DGraphic.setVisibilityFlag(flag, value) || change;
        }
      };

      this._graphics.forEach(updateCanvas3DGraphic);
      this._labelGraphics.forEach(updateCanvas3DGraphic);

      return change;
    },

    destroy: function() {
      var destroyCanvas3DGraphic = function(canvas3DGraphic) {
        if (canvas3DGraphic) {
          canvas3DGraphic.destroy();
        }
      };
      this._graphics.forEach(destroyCanvas3DGraphic);
      this._graphics.length = 0;
      this._labelGraphics.forEach(destroyCanvas3DGraphic);
      this._labelGraphics.length = 0;

    },

    getBSRadius: function() {
      var rad = 0;
      var radMax = function(g){
        rad = Math.max(rad, g.getBSRadius());
      };
      this._graphics.forEach(radMax);
      return rad;
    },

    getCenterObjectSpace: function() {
      return this._graphics[0].getCenterObjectSpace();
    },

    mustAlignToTerrain: function() {
      var numGraphics = this._graphics.length;
      for (var i = 0; i < numGraphics; i++) {
        var canvas3DGraphic = this._graphics[i];
        if (canvas3DGraphic && canvas3DGraphic.mustAlignToTerrain()) {
          return true;
        }
      }
      var numLabelGraphics = this._labelGraphics.length;
      for (i = 0; i < numLabelGraphics; i++) {
        canvas3DGraphic = this._labelGraphics[i];
        if (canvas3DGraphic && canvas3DGraphic.mustAlignToTerrain()) {
          return true;
        }
      }
      return false;
    },

    alignWithElevation: function(elevationProvider, renderCoordsHelper, mapCoordsHelper) {
      var numGraphics = this._graphics.length;
      for (var i = 0; i < numGraphics; i++) {
        var graphic = this._graphics[i];
        if (graphic) {
          graphic.alignWithElevation(elevationProvider, renderCoordsHelper, mapCoordsHelper);
        }
      }
      var numLabelGraphics = this._labelGraphics.length;
      for (i = 0; i < numLabelGraphics; i++) {
        graphic = this._labelGraphics[i];
        if (graphic) {
          this._labelGraphics[i].alignWithElevation(elevationProvider, renderCoordsHelper, mapCoordsHelper);
        }
      }
    },

    setDrawOrder: function(layerDrawOrder, dirtyMaterials, dirtySymbols) {
      dirtySymbols[this.canvas3DSymbol.symbol.id] = true;
      var numGraphics = this._graphics.length;
      for (var i = 0; i < numGraphics; i++) {
        var graphic = this._graphics[i];
        if (graphic) {
          var order = layerDrawOrder + (1-(1+i)/numGraphics);
          graphic.setDrawOrder(order, dirtyMaterials, dirtySymbols);
        }
      }
    }
  });

  return Canvas3DGraphicSet;
});
