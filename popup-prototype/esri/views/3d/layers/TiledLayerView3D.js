define([
    "../../../core/declare",

    "../../layers/LayerView",
    "../terrain/TilingScheme",

    "./support/LayerViewUpdatingPercentage"
  ], function (
    declare,
    LayerView, TilingScheme,
    LayerViewUpdatingPercentage) {

    return declare([LayerView, LayerViewUpdatingPercentage], {
      declaredClass: "esri.views.3d.layers.TiledLayerView3D",

      // Keeps track of number of pending updates
      _numUpdating: 0,
      _maxNumUpdating: 0,

      initialize: function() {
        this._minDataLevel = 0;
        this._maxDataLevel = Infinity;

        this.addResolvingPromise(
          this.layer.then(function() {
            var err = TilingScheme.checkUnsupported(this.layer.tileInfo);
            if (err) {
              throw err;
            }

            this._minDataLevel = Infinity;
            this._maxDataLevel = 0;
            this.layer.tileInfo.lods.forEach(function(lod) {
              this._minDataLevel = Math.min(lod.level, this._minDataLevel);
              this._maxDataLevel = Math.max(lod.level, this._maxDataLevel);
            }.bind(this));
          }.bind(this))
        );
      },

      getTileUrl: function (level, row, col) {
        return this.layer.getTileUrl(level, row, col);
      },

      isTransparent: function () {
        return this.layer.tileInfo && this.layer.tileInfo.format !== "JPEG";
      }
    });
  }
);
