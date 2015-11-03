/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../core/Accessor",
  
  "../../geometry/Polyline"
],
function(
  Accessor,
  Polyline
) {
  
var shortestDistanceToSegment = function(p, p1, p2) {
  var slope, intercept, result;
  if (p1[0] === p2[0]) {
    result = Math.abs(p[0] - p1[0]);
  } else {
    slope = (p2[1]-p1[1]) / (p2[0]-p1[0]);
    intercept = p1[1] - slope * p1[0];
    result = Math.abs(slope * p[0] - p[1] + intercept) / Math.sqrt(slope * slope + 1);
  }
  return result;
};
  
var douglasPeucker = function(path, resolution) {
  // Find the point with the maximum distance
  var end        = path.length,
      firstPoint = path[0],
      lastPoint  = path[end - 1],
      dmax = 0, index = 0,
      i, d;

  for (i = 1; i < end - 1; i++) {
    d = shortestDistanceToSegment(path[i], firstPoint, lastPoint);
    if ( d > dmax ) {
        index = i;
        dmax = d;
    }
  }
  
  var result;

  // If max distance is greater than resolution, recursively simplify
  if ( dmax > resolution ) {
    // Recursive call
    var recResults1 = douglasPeucker(path.slice(0, index + 1), resolution);
    var recResults2 = douglasPeucker(path.slice(index), resolution);

    // Build the result list
    result = recResults1.concat(recResults2);
  } else {
    result = [firstPoint, lastPoint];
  }
  // Return the result
  return result;
};

var Projector = Accessor.createSubclass({
  
  _transformSetter: function(value) {
    this._transformers = [];
    return value;
  },
  
  toScreenPoint: function(inPoint, offset, outPoint) {
    var transformer = this.getTransformer(offset);
    if (!outPoint) {
      outPoint = {
        x: 0,
        y: 0
      };
    }
    transformer.transformPoint(inPoint.x, inPoint.y, function(x, y) {
      outPoint.x = x;
      outPoint.y = y;
    });
    return outPoint;
  },
  
  toScreenPath: function(geometry, offset) {
    var input = geometry instanceof Polyline ? geometry.paths : geometry.rings,
        transformer = this.getTransformer(offset),
        paths = [], i, n;
    
    var join = function(x, y) {
      paths.push(x + "," + y);
    };
    
    if (input) {
      for (i = 0, n = input.length; i < n; i++) {
        paths.push("M");
        transformer.forEach(douglasPeucker(input[i], this.resolution), join);
      }
    }
    
    return paths;
  },
  
  getTransformer: function(offset) {
    if (!this._transformers[offset]) {
      var t  = this.transform,
          a  = t[0],
          b  = t[1],
          c  = t[2],
          d  = t[3],
          tx = t[4] + offset,
          ty = t[5],
          hasRotation = b !== 0 && c !== 0,
          i, n,
          r = Math.round;
      this._transformers[offset] = {
        transformPoint: (function() {
          if (hasRotation) {
            return function(x, y, callback) {
              callback(
                r(a * x + c * y + tx),
                r(b * x + d * y + ty)
              );
            };
          }
          return function(x, y, callback) {
            callback(
              r(a * x + tx),
              r(d * y + ty)
            );
          };
        }()),
        forEach: function(input, callback) {
          for (i = 0, n = input.length; i < n; i++) {
            this.transformPoint(input[i][0], input[i][1], callback);
          }
        }
      };
    }
    return this._transformers[offset];
  }
});

return Projector;
  
/**
 * Polymorphic function to project geometries.
 * Possible calls:
 *   x, y,        [x,y]?,       round?, projectorFunc?
 *   [x,y],       [x,y]?,       round?, projectorFunc?
 *   [(x,y)*],    [[(x,y)*]*]?, round?, projectorFunc?
 *   Point,       [x,y]?,       round?, projectorFunc?
 *   Polygon,     [[(x,y)*]*]?, round?, projectorFunc?
 *   Polyline,    [[(x,y)*]*]?, round?, projectorFunc?
 *   Extent,      [(x,y)*4]?,   round?, projectorFunc?
 *   [[(x,y)*]*], [[(x,y)*]*]?, round?, projectorFunc?
 */

});