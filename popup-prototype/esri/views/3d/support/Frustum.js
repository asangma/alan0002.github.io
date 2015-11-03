define([
  "../../../core/declare",
  "../lib/glMatrix",
  "../support/earthUtils",
  "../webgl-engine/lib/Util"
], function(declare, glMatrix, earthUtils, Util) {
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;

  var Frustum = declare([], {
    constructor: function() {
      this.planes = new Array(6);
      this.points = new Array(8);
      this.lines = new Array(12);
      this.origin = vec3d.create();
      this.direction = vec3d.create();

      this.dirty = false;
      this._altitude = null;

      for (var i = 0; i < 6; i++) {
        this.planes[i] = vec4d.create();
      }

      for (i = 0; i < 8; i++) {
        this.points[i] = vec3d.create();
      }

      for (i = 0; i < 12; i++) {
        this.lines[i] = {
          origin: null,
          direction: vec3d.create(),
          endpoint: null
        };
      }
    },

    _makeLine: function (line, p0, p1) {
      line.origin = p0;
      line.endpoint = p1;
      vec3d.direction(p1, p0, line.direction);
    },

    update: function(camera) {
      if (!this.dirty) {
        return;
      }

      Util.matrix2frustumPlanes(camera.viewMatrix, camera.projectionMatrix, this.points, this.planes);

      // Construct lines from near to far plane
      for (var i = 0; i < 4; i++) {
        var ni = i;
        var fi = i + 4;

        // Near to far plane
        this._makeLine(this.lines[i], this.points[ni], this.points[fi]);

        // Near plane
        this._makeLine(this.lines[i + 4], this.points[ni], i === 3 ? this.points[0] : this.points[ni + 1]);

        // Far plane
        this._makeLine(this.lines[i + 8], this.points[fi], i === 3 ? this.points[4] : this.points[fi + 1]);
      }

      vec3d.set(camera.eye, this.origin);
      camera.computeDirection(this.direction);

      this._altitude = null;
      this.dirty = false;
    },

    altitude: function() {
      if (this._altitude != null) {
        return this._altitude;
      }

      this._altitude = vec3d.length(this.origin) - earthUtils.earthRadius;
      return this._altitude;
    }
  });

  return Frustum;
});
