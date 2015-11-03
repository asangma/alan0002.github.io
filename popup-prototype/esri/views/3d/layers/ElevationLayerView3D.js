/* jshint bitwise: false */
define([
    "../../../core/declare",
    "./TiledLayerView3D"
  ],
  function (declare, TiledLayerView3D) {

    var ElevationLayerView3D = declare(TiledLayerView3D, {
      declaredClass: "esri.views.3d.layers.ElevationLayerView3D",
      isTransparent: function() {
        return true;
      }
    });

    return ElevationLayerView3D;
  }
);
