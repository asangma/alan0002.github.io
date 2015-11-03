/* jshint forin:false */
define([], function() {
  var __GeometryData_id = 0;

  var GeometryData = function GeometryData(faces, vertexAttr) {
    var id = __GeometryData_id++;

    this.getFaces = function() { return faces; };
    this.getVertexAttr = function() { return vertexAttr; };
    this.getId = function() { return id; };

    this.estimateGpuMemoryUsage = function() {
      var b = 0;

      for (var idx in faces) {
        var stride = 3; // position

        if (faces[idx].indices.normal) {
          stride += 3;
        }

        if (faces[idx].indices.uv0) {
          stride += 2;
        }

        if (faces[idx].indices.color) {
          stride++;
        }

        b += faces[idx].indices.position.length * stride*4;
      }

      return b;
    };

  };

  GeometryData.getNewId = function() {
    return __GeometryData_id++;
  };

  GeometryData.AxisOrder = {
    CG: 0,    // easting, altitude, southing
    GIS: 1    // easting, northing, altitude
  };

  return GeometryData;
});
