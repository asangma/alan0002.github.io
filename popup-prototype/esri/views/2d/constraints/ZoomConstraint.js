define(
[
  "../../../core/declare",

  "../../../core/Accessor"
],
function(
  declare,
  Accessor
) {

  var ZoomConstraint = declare([Accessor], {

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(kwArgs) {
      if (!kwArgs.tileInfo || !kwArgs.tileInfo.lods.length) {
        return {
          valid: false
        };
      }

      var tileInfo = kwArgs.tileInfo,
          lods = tileInfo.lods,
          minZoom = kwArgs.minZoom || -1,
          maxZoom = kwArgs.maxZoom || -1,
          minScale = kwArgs.minScale || 0,
          maxScale = kwArgs.maxScale || 0,
          snapToZoom = kwArgs.snapToZoom != null ? kwArgs.snapToZoom : true,
          minScaleZoom = -1, maxScaleZoom = -1,
          gotMin = false, gotMax = false,
          i;

      for (i = 0; i < lods.length; i++) {
        if (!gotMin && minScale > 0 && minScale >= lods[i].scale) {
          minScaleZoom = lods[i].level;
          gotMin = true;
        }
        if (!gotMax && maxScale > 0 && maxScale >= lods[i].scale) {
          maxScaleZoom = (i > 0) ? lods[i-1].level : -1;
          gotMax = true;
        }
      }

      if (minZoom === -1) {
        minZoom = (minScale === 0) ? lods[0].level : minScaleZoom;
      }

      if (maxZoom === -1) {
        maxZoom = (maxScale === 0) ? lods[lods.length - 1].level : maxScaleZoom;
      }

      return {
        valid: true,
        tileInfo: tileInfo,
        lods: lods,
        minZoom: minZoom,
        maxZoom: maxZoom,
        snapToZoom: snapToZoom
      };
    },

    initialize: function initialize() {
      var lods = this.lods,
          minZoom = this.minZoom,
          maxZoom = this.maxZoom;

      if (!this.valid) {
        return;
      }

      this._lodByZoom = {};
      this._lodByScale = {};
      this.zooms = [];
      this.scales = [];

      lods = lods.map(function(lod) {
        return lod.clone();
      });

      // - filter inside min/maxScale
      lods = lods.filter(function(lod) {
        return lod.level >= minZoom && lod.level <= maxZoom;
      });

      // - sort DESC by scale
      lods.sort(function(a, b) {
        return b.scale - a.scale;
      });

      lods.forEach(function(lod, index) {
        this._lodByZoom[lod.level] = lod;
        this._lodByScale[lod.scale] = lod;
        this.zooms[index] = lod.level;
        this.scales[index] = lod.scale;
      },this);

      this.lods = lods;
      this.minZoom = this.zooms[0];
      this.maxZoom = this.zooms[this.zooms.length - 1];
      this.minScale = this._lodByZoom[this.minZoom].scale;
      this.maxScale = this._lodByZoom[this.maxZoom].scale;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    snapToZoom: true,
    

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    constrain: function(target, current, view) {
      if (!this.valid || target.scale === (current && current.scale)) {
        return target;
      }

      var minScale = this.minScale,
          maxScale = this.maxScale,
          tGeom = target.targetGeometry,
          cGeom;

      if (target.scale >= maxScale &&
          target.scale <= minScale) {
        // no constraining
        if (this.snapToZoom && !view.interacting) {
          target.scale = this.getClosestScale(target.scale);
        }
        return target;
      }

      // clamp the scale
      if (target.scale > minScale || target.scale < maxScale) {
        var tScale = target.scale > minScale ? minScale : maxScale;
        if (current) {
          // interpolate the correct values of the center
          var rScale = (tScale - current.scale) / (target.scale - current.scale);
          cGeom = current.targetGeometry;
          tGeom.x = cGeom.x + (tGeom.x - cGeom.x) * rScale;
          tGeom.y = cGeom.y + (tGeom.y - cGeom.y) * rScale;
        }
        target.scale = tScale;
      }

      if (this.snap) {
        target.scale = this.getClosestScale(target.scale);
      }

      return target;
    },

    getZoomForScale: function(scale) {
      var lods = this.lods,
          l1 = null, l2 = null,
          i = 0, n = lods.length - 1;

      for (i; i < n; i++) {
        l1 = lods[i];
        l2 = lods[i+1];
        if (l1.scale <= scale) {
          return l1.level;
        }
        if (l2.scale === scale) {
          return l2.level;
        }
        if (l1.scale > scale && l2.scale < scale) {
          return l2.level - (scale - l2.scale) / (l1.scale - l2.scale);
        }
      }
    },

    getScaleForZoom: function(zoom) {
      var lods = this.lods,
          l1 = null, l2 = null,
          i = 0, n = lods.length - 1;

      for (i; i < n; i++) {
        l1 = lods[i];
        l2 = lods[i+1];
        if (l1.level <= zoom) {
          return l1.scale;
        }
        if (l2.level === zoom) {
          return l2.scale;
        }
        if (l1.level > zoom && l2.level < zoom) {
          return l2.scale - (zoom - l2.level) / (l1.level - l2.level);
        }
      }
    },

    getClosestScale: function (scale) {
      var scales = this.scales;
      if (this._lodByScale[scale]) {
        return this._lodByScale[scale].scale;
      }
      else {
        scale = scales.reduce(
          function(prev, curr, idx, array) {
            return Math.abs(curr - scale) <= Math.abs(prev - scale) ? curr : prev;
          },
          scales[0]
        );
        return this._lodByScale[scale].scale;
      }
    },

    clone: function() {
      return new ZoomConstraint({
        lods: this.lods,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom
      });
    },

    _getBounds: function(lods, minZoom, maxZoom) {
      var lods = this.lods,
          minZoom = this.minZoom,
          maxZoom = this.maxZoom;

      if (!this.valid) {
        return;
      }

      this._lodByZoom = {};
      this._lodByScale = {};
      this.zooms = [];
      this.scales = [];

      lods = lods.map(function(lod) {
        return lod.clone();
      });

      // - filter inside min/maxScale
      lods = lods.filter(function(lod) {
        return lod.level >= minZoom && lod.level <= maxZoom;
      });

      // - sort DESC by scale
      lods.sort(function(a, b) {
        return b.scale - a.scale;
      });

      lods.forEach(function(lod, index) {
        this._lodByZoom[lod.level] = lod;
        this._lodByScale[lod.scale] = lod;
        this.zooms[index] = lod.level;
        this.scales[index] = lod.scale;
      },this);

      return {
        lods: lods,
        minZoom: this.zooms[0],
        maxZoom: this.zooms[this.zooms.length - 1],
        minScale: this._lodByZoom[this.minZoom].scale,
        maxScale: this._lodByZoom[this.maxZoom].scale
      };
    }

  });

  return ZoomConstraint;

});
