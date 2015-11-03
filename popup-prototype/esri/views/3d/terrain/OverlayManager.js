/* jshint forin: false */
define([
  "../../../core/declare", "dojo/on",
  "../support/mathUtils",
  "../support/projectionUtils",
  "../lib/glMatrix",
  "../webgl-engine/Stage",
  "../webgl-engine/lib/Texture",
  "../webgl-engine/lib/Util"
],
function(declare, on,
         mathUtils, projectionUtils, glMatrix,
         Stage, Texture, Util
) {
  // imports from global namespace (to pacify JSHint)
  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var assert = Util.assert;

  // constants
  var OVERLAY_TILE_SIZE = 2048;
  var OVERLAY_MAGNIFICATION_FADE_START = 3.5;
  var OVERLAY_MAGNIFICATION_FADE_END = 10;

  var tmpCanvasGeometry = {
    width: 0,
    height: 0,
    pixelRatio: 0,
    views: null
  };

  var tmpViews1 = [
    {
      viewport: vec4d.create(),
      extent: vec4d.create()
    }
  ];

  var tmpViews2 = [
    tmpViews1[0],
    {
      viewport: vec4d.create(),
      extent: vec4d.create()
    }
  ];

  // temporary variables
  var tmp = vec4d.create();
  var tmpEye = vec3d.create();

  var tmpNewOverlayExtents = [vec4d.create(), vec4d.create()];

  var OverlayManager = declare(null, {
    constructor: function(isSpherical, cyclical, terrainSurface, view) {

      this._view = view;
      this._stage = view._stage;

      this._overlaySR = null;
      this._renderSR = null;
      this._overlaySREqualsRenderSR = true;

      this.terrainSurface = terrainSurface;
      this._renderer = this._stage.getTextureGraphicsRenderer();

      this._connectedLayers = { };

      this._overlays = undefined;
      this._scale = 0;

      this._dirty = false;

      this._isSpherical = isSpherical;
      this._cyclical = cyclical;
    },

    destroy: function() {
      for (var layerId in this._connectedLayers) {
        this.unregisterLayerView(this._connectedLayers[layerId]);
      }
      this._disposeOverlays();
    },

    hasOverlays: function() {
      return !!this._overlays;
    },

    setSpatialReference: function(spatialReference) {
      this._overlaySR = spatialReference;
      if (spatialReference) {
        this._renderSR = this._view.renderSpatialReference;
        this._overlaySREqualsRenderSR = this._overlaySR.equals(this._renderSR);
      }
      else {
        this._disposeOverlays();
      }
    },

    registerLayerView: function(layerView) {
      var layerId = layerView.layer.get("id");
      assert(!this._connectedLayers[layerId], "layer already connected");

      var handle = on(layerView, "draped-data-change", function() {
        this.setOverlayDirty();
      }.bind(this));

      this._connectedLayers[layerId] = {
        eventHandles: [handle],
        layerView: layerView
      };

      if (layerView.setDrapingExtent && this._overlays) {
        for (var ovlIdx = 0; ovlIdx < this._overlays.length; ovlIdx++) {
          layerView.setDrapingExtent(ovlIdx, this._overlays[ovlIdx].extent, this._overlaySR, OVERLAY_TILE_SIZE);
        }
      }
     
      this.setOverlayDirty();
    },

    unregisterLayerView: function(layerView) {
      for (var layerId in this._connectedLayers) {
        var o = this._connectedLayers[layerId];
        if (o.layerView === layerView) {
          if (o.eventHandles) {
            for (var i = 0; i < o.eventHandles; i++) {
              o.eventHandles[i].remove();
            }
          }
          delete this._connectedLayers[layerId];
          this.setOverlayDirty();

          layerView._overlayUpdating = false;
          layerView._evaluateUpdatingState();
        }
      }
    },

    setOverlayDirty: function() {
      if (!this._dirty) {
        this._setOverlayUpdating(true);
        this._dirty = true;
      }
    },

    _setOverlayUpdating: function(updating) {
      for (var layerId in this._connectedLayers) {
        var layerView = this._connectedLayers[layerId].layerView;

        if (!updating || (!layerView.get("suspended") && layerView.hasDraped)) {
          layerView._overlayUpdating = updating;
          layerView._evaluateUpdatingState();
        }
      }
    },

    updateOverlay: function() {
      if (!this._overlaySR) {
        return;
      }

      var newExtents = this._computeOverlayExtents();
      if (newExtents) {
        if (!this._overlays) {
          this._initOverlays();
        }
        for (var ovlIdx = 0; ovlIdx < this._overlays.length; ovlIdx++) {
          if (extentsDiffer(newExtents[ovlIdx], this._overlays[ovlIdx].extent)) {
            vec4d.set(newExtents[ovlIdx], this._overlays[ovlIdx].extent);
            for (var layerId in this._connectedLayers) {
              var layerView = this._connectedLayers[layerId].layerView;
              if (layerView.setDrapingExtent) {
                layerView.setDrapingExtent(ovlIdx, newExtents[ovlIdx], this._overlaySR, OVERLAY_TILE_SIZE);
              }
            }
          }
        }

        this._setOverlayUpdating(false);

        this._drawOverlays();
        this.terrainSurface._updateTileOverlayParams();
        this._dirty = false;
      }
    },

    overlaysNeedUpdate: function() {
      return this._dirty && this._overlaySR;
    },

    updateOpacity: function(eye)
    {
      var opacity = 1;
      if (this._overlays) {
        var od = this._scale;
        var d = this._view.renderCoordsHelper.getAltitude(eye);
        if (d*OVERLAY_MAGNIFICATION_FADE_START < od) {
          opacity = (d - od / OVERLAY_MAGNIFICATION_FADE_END) /
            (od / OVERLAY_MAGNIFICATION_FADE_START - od / OVERLAY_MAGNIFICATION_FADE_END);
          opacity = Math.sqrt(mathUtils.clamp(opacity, 0, 1));
        }
      }
      return opacity;
    },

    setOverlayParamsOfTile: function(tile, params, currentOverlayOpacity) {
      var tileExtent = tile.extent;

      var ovId = -1;
      if (this._rectInsideRect(tileExtent, this._overlays[0].extent)) {
        ovId = 0;
      } else if (this._rectanglesOverlap(tileExtent, this._overlays[1].extent)) {
        ovId = 1;
      }

      if (ovId >= 0) {
        var oe = this._overlays[ovId].extent;
        params.overlayTexScale = (tileExtent[2] - tileExtent[0]) / (oe[2] - oe[0]);

        var exMin = tileExtent[0];

        if (this._cyclical) {
          exMin = this._cyclical.minimalMonotonic(oe[0], exMin);
          var exMax = this._cyclical.minimalMonotonic(oe[0], tileExtent[2]);

          if (exMin > exMax) {
            exMin = exMax - (tileExtent[2] - tileExtent[0]);
          }
        }

        vec2d.set2((exMin - oe[0]) / (oe[2] - oe[0]), (tileExtent[1] - oe[1]) / (oe[3] - oe[1]), params.overlayTexOffset);
        params.overlayTexId = this._overlays[ovId].texture.getId();

        if (currentOverlayOpacity !== undefined) {
          params.overlayOpacity = currentOverlayOpacity;
        }
        else {
          params.overlayOpacity = 1.0;
        }
      } else {
        params.overlayTexId = null;
      }
    },

    overlayPixelSizeInMapUnits: function(position) {
      var extent;
      if (this._overlays) {
        if (this._overlays[0] && this._pointIsInExtent(position, this._overlays[0].extent)) {
          extent = this._overlays[0].extent;
        }
        else if (this._overlays[1]) {
          extent = this._overlays[1].extent;
        }
      }
      return extent ? (extent[2] - extent[0])/OVERLAY_TILE_SIZE : 0;
    },

    _initOverlays: function() {
      this._overlays = new Array(2);
      for (var i = 0; i < 2; i++) {
        var tex = new Texture(null, "overlay", {wrapClamp: true, mipmap: true});
        this._stage.add(Stage.ModelContentType.TEXTURE, tex);
        this._overlays[i] = {texture: tex, extent: vec4d.create()};
      }
    },

    _disposeOverlays: function() {
      if (this._overlays) {
        var stage = this._stage;
        this._overlays.forEach(function(ovl) {
          stage.remove(Stage.ModelContentType.TEXTURE, ovl.texture.getId());
        });
        this._overlays = null;
      }
    },

    _overlayExtentIncTable: [[0, -1, 2, 1], [0, -2, 2, 0], [-1, -2, 1, 0], [-2, -2, 0, 0],
      [-2, -1, 0, 1], [-2, 0, 0, 2], [-1, 0, 1, 2], [0, 0, 2, 2]],
    _computeOverlayExtents: function() {
      var camera = this._view.navigation.currentCamera;
      // compute center of (overlay) interest on the globe
      var ovlCenter = vec3d.create();
//        if (aoe < 20)
//          vec3d.lerp(eyeAndCenter[0], eyeAndCenter[1], aoe/20, ovlCenter);
//        else
      vec3d.set(camera.center, ovlCenter);

      this._scale = this._view.renderCoordsHelper.getAltitude(camera.eye);

      // project center onto terrain
      var ovlCenterTS = projectionUtils.vectorToPoint(ovlCenter, this._renderSR, this.terrainSurface.spatialReference);
      var elev = this.terrainSurface.getElevation(ovlCenterTS);

      if (elev) {
        this._view.renderCoordsHelper.setAltitude(elev, ovlCenter);
      } else {
        this._view.navigation.getCenterIntersectManifold(camera.eye, camera.center, ovlCenter);
      }

      var distToOverlayCenter = vec3d.dist(camera.eye, ovlCenter),
        angleOfElevation = camera.angleOfElevation;

      if (isNaN(angleOfElevation)) {
        return;
      }

      if (!this._overlaySREqualsRenderSR) {
        projectionUtils.vectorToVector(ovlCenter, this._renderSR, ovlCenter, this._overlaySR);
      }

      // compute extent of finest detail overlay in web mercator
      var halfOvlWidth = 0.5 * OVERLAY_TILE_SIZE * camera.perPixelRatio * distToOverlayCenter * 2;
      if (this._isSpherical && this._overlaySR.isWebMercator()) {
         halfOvlWidth /= Math.cos(projectionUtils.webMercator.y2lat(ovlCenter[1]));
         halfOvlWidth = Math.min(halfOvlWidth, Math.abs(this.terrainSurface.tilingScheme.origin[0]));
      }

      var ext1 = tmpNewOverlayExtents[0];
      ext1[0] = ovlCenter[0] - halfOvlWidth;
      ext1[1] = ovlCenter[1] - halfOvlWidth;
      ext1[2] = ovlCenter[0] + halfOvlWidth;
      ext1[3] = ovlCenter[1] + halfOvlWidth;

      // compute outer overlay extent
      var ext2 = tmpNewOverlayExtents[1];
      vec4d.set(ext1, ext2);
      var terrainExtent = this.terrainSurface.extent;
      if (6 * halfOvlWidth > (terrainExtent[3] - terrainExtent[1])) {
        // if the inner overlay is larger than one third of the terrain extent, set the outer overlay to the terrain
        // extent
        vec4d.set(terrainExtent, ext2);
        if (this._isSpherical) {
          // reduce extent height a little to avoid stretching right to the WM definition boundary, which creates
          // issues with the skirt-pole-fill-ins
          ext2[1] *= 0.999;
          ext2[3] *= 0.999;

          // The world elevation service currently reports a slightly offset fullExtent, leading to a slightly too large
          // terrainExtent. Therefore, we clamp values to webMercatorCyclical for now:
          var cyclical = this._cyclical;
          ext2.forEach(function(v, i) { ext2[i] = cyclical.clamp(v); } );
        }
      }
      else if (angleOfElevation > 0.25 * Math.PI) {
        // if the view is close to perpendicular (pointing down), center the outer overlay tile around
        // the inner one and double the size
        ext2[0] -= halfOvlWidth;
        ext2[1] -= halfOvlWidth;
        ext2[2] += halfOvlWidth;
        ext2[3] += halfOvlWidth;
      }
      else {
        // otherwise make the outer tile 3 times as big and place it such that the inner tile ends
        // up in one of the 8 border/corner locations:
        // |-------|
        // |2  3  4|
        // |1     5|
        // |8  7  6|
        // |-------|
        // the location is picked such that the view direction points roughly towards the center of the
        // outer tile. the extent increments are encoded in this._overlayExtentIncTable
        projectionUtils.vectorToVector(camera.eye, this._renderSR, tmpEye, this._overlaySR);
        vec2d.subtract(ovlCenter, tmpEye, tmp);
        var angle = -Math.atan2(tmp[1], tmp[0]) + Math.PI * 0.125;
        if (angle < 0) {
          angle += 2 * Math.PI;
        }
        var sector = Math.floor(angle/(Math.PI * 0.25));

        vec4d.scale(this._overlayExtentIncTable[sector], halfOvlWidth*2, tmp);
        vec4d.add(ext2, tmp, ext2);
      }

      this.opacity = 1;

      return tmpNewOverlayExtents;
    },

    _drawOverlays: function() {
      var referenceWidth = this._overlays[0].extent[2] - this._overlays[0].extent[0];
      var renderer = this._stage.getTextureGraphicsRenderer();

      for (var i = 0; i < this._overlays.length; i++) {
        var ext = this._overlays[i].extent;

        var overSpan  = this._cyclical ? ext[2] > this._cyclical.max : false;
        var underSpan = this._cyclical ? ext[0] < this._cyclical.min : false;

        if (overSpan || underSpan) {
          tmpCanvasGeometry.views = tmpViews2;

          var splitPos;

          if (overSpan) {
            splitPos = this._cyclical.max - ext[0];
          } else {
            splitPos = this._cyclical.min - ext[0];
          }

          var px = Math.round(splitPos / (ext[2] - ext[0]) * OVERLAY_TILE_SIZE);

          var v0 = tmpCanvasGeometry.views[0];

          vec4d.set4(0, 0, px, OVERLAY_TILE_SIZE, v0.viewport);
          vec4d.set4(ext[0], ext[1], this._cyclical.max, ext[3], v0.extent);
          if (!overSpan) {
            v0.extent[0] += this._cyclical.range;
          }

          var v1 = tmpCanvasGeometry.views[1];

          vec4d.set4(px, 0, OVERLAY_TILE_SIZE - px, OVERLAY_TILE_SIZE, v1.viewport);
          vec4d.set4(this._cyclical.min, ext[1], ext[2], ext[3], v1.extent);
          if (overSpan) {
            v1.extent[2] -= this._cyclical.range;
          }

        } else {
          tmpCanvasGeometry.views = tmpViews1;

          vec4d.set(ext, tmpCanvasGeometry.views[0].extent);
          vec4d.set4(0, 0, OVERLAY_TILE_SIZE, OVERLAY_TILE_SIZE, tmpCanvasGeometry.views[0].viewport);
        }

        tmpCanvasGeometry.width = OVERLAY_TILE_SIZE;
        tmpCanvasGeometry.height = OVERLAY_TILE_SIZE;
        tmpCanvasGeometry.pixelRatio = referenceWidth / (ext[2] - ext[0]);

        renderer.draw(this._overlays[i].texture, tmpCanvasGeometry);
      }
    },

    _rectanglesOverlap: function(r1, r2) {
      if (this._cyclical) {
        return (this._cyclical.contains(r2[0], r2[2], r1[0]) ||
          this._cyclical.contains(r2[0], r2[2], r1[2])) &&
          !((r1[1] > r2[3]) || (r1[3] < r2[1]));
      }
      else {
        return !((r1[0] > r2[2]) || (r1[2] < r2[0]) || (r1[1] > r2[3]) || (r1[3] < r2[1]));
      }
    },

    _rectInsideRect: function(r1, r2) {
      if (this._cyclical) {
        return this._cyclical.contains(r2[0], r2[2], r1[0]) &&
          this._cyclical.contains(r2[0], r2[2], r1[2]) &&
          (r1[1] > r2[1]) && (r1[3] < r2[3]);
      }
      else {
        return (r1[0] > r2[0]) && (r1[2] < r2[2]) && (r1[1] > r2[1]) && (r1[3] < r2[3]);
      }
    },

    _pointIsInExtent: function (point, extent) {
      if (this._cyclical) {
        return this._cyclical.contains(extent[0], extent[2], point.x) &&
          (point.y >= extent[1]) &&
          (point.y <= extent[3]);
      }
      else {
        var px = point.x,
          py = point.y;
        return (px > extent[0]) && (px < extent[2]) && (py > extent[1]) && (py < extent[3]);
      }
    }
  });

  var extentsDiffer = function (e1, e2) {
    var delta = 0.00001 * Math.max(e1[2] - e1[0], e1[3] - e1[1], e2[2] - e2[0], e2[3] - e2[1]);
    for (var i = 0; i < 4; i++) {
      if (Math.abs(e2[i] - e1[i]) > delta) {
        return true;
      }
    }
    return false;
  };

  return OverlayManager;
});
