// jshint bitwise:false
define([
  "./IdGen",
  "./Util",
  "./gl-matrix"
], function (IdGen, Util, glMatrix){
  var vec3d = glMatrix.vec3d;

  var __Geometry_idGen = new IdGen();

  var BoundingInfo = function BoundingInfo(primitiveIndices, numIndexPerPrimitive, indices, position, faceRange) {
    Util.assert(primitiveIndices.length >= 1);
    Util.assert(indices.length % numIndexPerPrimitive === 0);
    Util.assert(indices.length >= primitiveIndices.length * numIndexPerPrimitive);
    Util.assert(position.size === 3 || position.size === 4);

    var data = position.data;
    var size = position.size;

    var start = 0;
    var end = primitiveIndices.length;

    if (faceRange!=null) {
      start = faceRange[0];
      end = faceRange[1]+1;
    }

    var idx0 = size * indices[numIndexPerPrimitive * primitiveIndices[start]];

    var bbMin = vec3d.createFrom(data[idx0], data[idx0 + 1], data[idx0 + 2]);
    var bbMax = vec3d.create(bbMin);

    var i, j;

    for (i = start; i < end; ++i) {
      var idx00 = numIndexPerPrimitive * primitiveIndices[i];

      for (j = 0; j < numIndexPerPrimitive; ++j) {
        idx0 = size * indices[idx00 + j];

        for (var k = 0; k < 3; ++k) {
          var value = data[idx0 + k];

          if (value < bbMin[k]) {
            bbMin[k] = value;
          }
          else if (value > bbMax[k]) {
            bbMax[k] = value;
          }
        }
      }
    }

    var center = vec3d.create();
    vec3d.lerp(bbMin, bbMax, 0.5, center);

    var bsRadius = 0.0;

    for (i = start; i < end; ++i) {
      idx00 = numIndexPerPrimitive * primitiveIndices[i];

      for (j = 0; j < numIndexPerPrimitive; ++j) {
        idx0 = size * indices[idx00 + j];

        var dx = data[idx0] - center[0];
        var dy = data[idx0 + 1] - center[1];
        var dz = data[idx0 + 2] - center[2];

        var radius2 = dx * dx + dy * dy + dz * dz;

        if (radius2 > bsRadius) {
          bsRadius = radius2;
        }
      }
    }
    bsRadius = Math.sqrt(bsRadius);

    var children;

    this.getCenter = function() {
      return center;
    };

    this.getBSRadius = function() {
      return bsRadius;
    };

    this.getBBMin = function() {
      return bbMin;
    };

    this.getBBMax = function() {
      return bbMax;
    };

    this.getPrimitiveIndices = function() {
      return primitiveIndices;
    };

    this.getIndices = function() {
      return indices;
    };

    this.getPosition = function() {
      return position;
    };

    this.getChildren = function() {
      if (children === undefined) {
        children = "no_children";

        if (vec3d.dist2(bbMin, bbMax) > 1.0) {
          var bbMiddle = vec3d.lerp(bbMin, bbMax, 0.5, vec3d.create());

          var length = primitiveIndices.length;
          var idx2child = new Uint8Array(length);

          var counts = new Array(8);
          var i;

          for (i = 0; i < 8; ++i) {
            counts[i] = 0;
          }


          for (i = 0; i < length; ++i) {
            var child = 0;

            var idx0 = numIndexPerPrimitive * primitiveIndices[i];

            var data = position.data;

            var idx = size * indices[idx0];
            var minX = data[idx];
            var minY = data[idx + 1];
            var minZ = data[idx + 2];

            for (var j = 1; j < numIndexPerPrimitive; ++j) {
              idx = size * indices[idx0 + j];
              var dx = data[idx];
              var dy = data[idx + 1];
              var dz = data[idx + 2];

              if (dx < minX) {
                minX = dx;
              }

              if (dy < minY) {
                minY = dy;
              }

              if (dz < minZ) {
                minZ = dz;
              }
            }

            if (minX < bbMiddle[0]) {
              child |= 1;
            }

            if (minY < bbMiddle[1]) {
              child |= 2;
            }

            if (minZ < bbMiddle[2]) {
              child |= 4;
            }

            idx2child[i] = child;
            ++counts[child];
          }

          var numNonEmptyChildren = 0;

          for (i = 0; i < 8; ++i) {
            if (counts[i] > 0) {
              ++numNonEmptyChildren;
            }
          }

          if (numNonEmptyChildren < 2) {
            return;
          }

          var childPrimitiveIndices = new Array(8);

          for (i = 0; i < 8; ++i) {
            childPrimitiveIndices[i] = counts[i] > 0 ? new Uint32Array(counts[i]) : undefined;
          }

          for (i = 0; i < 8; ++i) {
            counts[i] = 0;
          }

          for (i = 0; i < length; ++i) {
            child = idx2child[i];
            childPrimitiveIndices[child][counts[child]++] = primitiveIndices[i];
          }

          children = new Array(8);

          for (i = 0; i < 8; ++i) {
            if (childPrimitiveIndices[i] !== undefined ) {
              children[i] = new BoundingInfo(childPrimitiveIndices[i], numIndexPerPrimitive, indices, position);
            }
          }
        }
      }

      if (children === "no_children") {
        return undefined;
      }

      return children;
    };
  };

  var Geometry = function Geometry(data, idHint, boundingInfo) {
    var id = __Geometry_idGen.gen(idHint);
    
    this.getId = function() {
      return id;
    };
    
    this.metadata = undefined;
    this.singleUse = false;

    // triangles always.

    Util.assert(data.getFaces().length >= 1);

    boundingInfo = boundingInfo || [];

    this.getData = function() {
      return data;
    };

    this.getNumGroups = function() {
      return data.getFaces().length;
    };

    this.calculateBoundingInfo = function(group, faceRange) {
      var faces = data.getFaces()[group];

      var numIndexPerPrimitive = faces.type === "triangle" ? 3 : 1;
      var indices = faces.indices[faces.positionKey];

      var i;

      // FIX EXPORTER BEGIN
      if (indices.length === 0) {
        indices = new Uint32Array(numIndexPerPrimitive);

        for (i = 0; i < numIndexPerPrimitive; ++i) {
          indices[i] = i;
        }
      }
      // FIX EXPORTER END

      var numIndices = indices.length;
      Util.assert(numIndices % numIndexPerPrimitive === 0);

      var lll = numIndices / numIndexPerPrimitive;
      var primitiveIndices = new Uint32Array(lll);

      for (i = 0; i < lll; ++i) { // TODO, use one static count-up array
        primitiveIndices[i] = i;
      }

      return new BoundingInfo(primitiveIndices, numIndexPerPrimitive, indices, data.getVertexAttr()[faces.positionKey], faceRange);

    };

    this.getBoundingInfo = function(group) {
      var info = boundingInfo[group];
    
      if (info === undefined) {
        info = this.calculateBoundingInfo(group);
        boundingInfo[group] = info;
      }
      return info;
    };

    this.invalidateBoundingInfo = function() {
      boundingInfo = [];
    };
  };

  return Geometry;
});