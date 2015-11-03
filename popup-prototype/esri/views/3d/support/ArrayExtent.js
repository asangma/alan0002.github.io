define([], function() {

  // Currently supports 2D only. Order of elements: [xmin, ymin, xmax, ymax]

  var ArrayExtent = function(extent) {
    extent = extent || ArrayExtent.ZERO;
    this.extent = extent.slice();
  };

  ArrayExtent.prototype = {
    expand: function(geometry) {
      var declaredClass = geometry.declaredClass;
      var e = this.extent;
      if (declaredClass === "esri.geometry.Extent") {
        e[0] = Math.min(e[0], geometry.xmin);
        e[1] = Math.min(e[1], geometry.ymin);
        e[2] = Math.max(e[2], geometry.xmax);
        e[3] = Math.max(e[3], geometry.ymax);
      }
      else if (declaredClass === "esri.geometry.Point") {
        e[0] = Math.min(e[0], geometry.x);
        e[1] = Math.min(e[1], geometry.y);
        e[2] = Math.max(e[2], geometry.x);
        e[3] = Math.max(e[3], geometry.y);
      }
      else if (geometry.length === 4) {
        e[0] = Math.min(e[0], geometry[0]);
        e[1] = Math.min(e[1], geometry[1]);
        e[2] = Math.max(e[2], geometry[2]);
        e[3] = Math.max(e[3], geometry[3]);
      }
    },

    isFinite: function() {
      return this.extent.every(isFinite);
    },

    width: function() {
      return this.extent[2] - this.extent[0];
    },

    height: function() {
      return this.extent[3] - this.extent[1];
    }
  };

  ArrayExtent.positionInsideExtent = function(position, extent) {
    return (position[0] >= extent[0]) && (position[1] >= extent[1]) &&
      (position[0] <= extent[2]) && (position[1] <= extent[3]);
  };

  ArrayExtent.NEGATIVE_INFINITY = [Infinity, Infinity, -Infinity, -Infinity];
  ArrayExtent.ZERO = [0, 0, 0, 0];

  return ArrayExtent;
});