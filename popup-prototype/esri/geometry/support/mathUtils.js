define(
[
  "../Point"
],
function(Point) {

  function getLength(pt1, pt2) {
    //summary: Returns the length of this line
    //returns: double: length of line
    var dx = pt2.x - pt1.x,
        dy = pt2.y - pt1.y,
        dz = 0;

    if (pt1.z != null && pt2.z != null) {
      dz = pt1.z - pt2.z;
    }

    return Math.sqrt(dx*dx + dy*dy + dz * dz);
  }

  function _getLength(pt1, pt2) {
    var dx = pt2[0] - pt1[0],
        dy = pt2[1] - pt1[1];

    return Math.sqrt(dx*dx + dy*dy);
  }

  function getPointOnLine(pt0, pt1, fraction) {
    var x, y, z;

    if (pt0 instanceof Point) {
      x = pt0.x + fraction * (pt1.x - pt0.x);
      y = pt0.y + fraction * (pt1.y - pt0.y);

      if (pt0.z != null && pt1.z != null) {
        z = pt0.z + fraction * (pt1.z - pt0.z);
      }
      
      return new Point(x, y, z);
    }
    else {
      x = pt0[0] + fraction * (pt1[0] - pt0[0]);
      y = pt0[1] + fraction * (pt1[1] - pt0[1]);

      if (pt0.length > 2 && pt1.length > 2) {
        return [x, y, pt0[2] + fraction * (pt1[2] - pt0[2])];
      }

      return [x, y];
    }
  }

  function getMidpoint(pt0, pt1) {
    return getPointOnLine(pt0, pt1, 0.5);
  }

  function _equals(n1, n2) {
    return Math.abs(n1 - n2) < 1.0e-8;
  }

  function _getLineIntersection(p0, p1, p2, p3) {
    var INFINITY = 1e10, x, y,

        a0 = _equals(p0[0], p1[0]) ? INFINITY : (p0[1] - p1[1]) / (p0[0] - p1[0]),
        a1 = _equals(p2[0], p3[0]) ? INFINITY : (p2[1] - p3[1]) / (p2[0] - p3[0]),

        b0 = p0[1] - a0 * p0[0],
        b1 = p2[1] - a1 * p2[0];

    // a0 and a1 are line slopes

    // Check if lines are parallel
    if (_equals(a0, a1)) {
      if (!_equals(b0, b1)) {
        return null; // Parallel non-overlapping
      }
      else {
        if (_equals(p0[0], p1[0])) {
          if (Math.min(p0[1], p1[1]) < Math.max(p2[1], p3[1]) || Math.max(p0[1], p1[1]) > Math.min(p2[1], p3[1])) {
            y = (p0[1] + p1[1] + p2[1] + p3[1] - Math.min(p0[1], p1[1], p2[1], p3[1]) - Math.max(p0[1], p1[1], p2[1], p3[1])) / 2.0;
            x = (y - b0) / a0;
          }
          else {
            return null; // Parallel non-overlapping
          }
        }
        else {
          if (Math.min(p0[0], p1[0]) < Math.max(p2[0], p3[0]) || Math.max(p0[0], p1[0]) > Math.min(p2[0], p3[0])) {
            x = (p0[0] + p1[0] + p2[0] + p3[0] - Math.min(p0[0], p1[0], p2[0], p3[0]) - Math.max(p0[0], p1[0], p2[0], p3[0])) / 2.0;
            y = a0 * x + b0;
          }
          else {
            return null;
          }
        }

        return [x, y];
      }
    }

    if (_equals(a0, INFINITY)) {
      x = p0[0];
      y = a1 * x + b1;
    }
    else if (_equals(a1, INFINITY)) {
      x = p2[0];
      y = a0 * x + b0;
    }
    else {
      x = -(b0 - b1) / (a0 - a1); // calculate x
      if (p0[1] === p1[1]) {
        y = p0[1];
      }
      else if (p2[1] === p3[1]) {
        y = p2[1];
      }
      else {
        y = a0 * x + b0; // calculate y
      }
    }

    return [x, y];
  }

  function getLineIntersection(line1start, line1end, line2start, line2end, sr) {
    var pt = _getLineIntersection([line1start.x, line1start.y], [line1end.x, line1end.y], [line2start.x, line2start.y], [line2end.x, line2end.y]);
    if (pt) {
      pt = new Point(pt[0], pt[1], sr);
    }
    return pt;
  }
  
  // Returns "true" if the given lines intersect each other
  function _getLineIntersection2(/*[[x1, y1], [x2, y2]]*/ line1, /*[[x3, y3], [x4, y4]]*/ line2) {
    // Algorithm: http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
    
    // This algorithm determines if the lines intersect
    // between the given points. For intersection points
    // beyond the lengths of the line segments use 
    // "_getLineIntersection3"
    
    var p1 = line1[0], p2 = line1[1],
        p3 = line2[0], p4 = line2[1],
        x1 = p1[0], y1 = p1[1],
        x2 = p2[0], y2 = p2[1],
        x3 = p3[0], y3 = p3[1],
        x4 = p4[0], y4 = p4[1],
        x43 = x4 - x3, x13 = x1 - x3, x21 = x2 - x1,
        y43 = y4 - y3, y13 = y1 - y3, y21 = y2 - y1,
        denom = (y43 * x21) - (x43 * y21),
        ua, ub, px, py;
    
    if (denom === 0) {
      return false; // parallel or coincident
    }
    
    ua = ( (x43 * y13) - (y43 * x13) ) / denom;
    ub = ( (x21 * y13) - (y21 * x13) ) / denom;
    
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      px = x1 + (ua * (x2 - x1));
      py = y1 + (ua * (y2 - y1)); // you're seeing it right. we are using "ua"
      //console.log("Lines intersect at this point - ", px, py);
      return [px,py];
      //return true;
    }
    else {
      return false;
    }
  }
  
  function _pointLineDistance(point, line) {
    // Returns the shortest distance from point to line
    // Algorithm: http://local.wasp.uwa.edu.au/~pbourke/geometry/pointline/
    
    var p1 = line[0], p2 = line[1],
        x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1],
        x3 = point[0], y3 = point[1],
        x21 = x2 - x1, y21 = y2 - y1,
        x31 = x3 - x1, y31 = y3 - y1,
        sqrt = Math.sqrt, pow = Math.pow,
        mag = sqrt(pow(x21, 2) + pow(y21, 2)),
        u = ((x31 * x21) + (y31 * y21)) / (mag * mag),
        x = x1 + u * x21, y = y1 + u * y21;
    
    return sqrt(pow(x3-x, 2) + pow(y3-y, 2));
  }
  
  var mathUtils = {
    getLength: getLength,
    _getLength: _getLength,
    getPointOnLine: getPointOnLine,
    getMidpoint: getMidpoint,
    _equals: _equals,
    _getLineIntersection: _getLineIntersection,
    getLineIntersection: getLineIntersection,
    _getLineIntersection2: _getLineIntersection2,
    _pointLineDistance: _pointLineDistance
  };

  

  return mathUtils;  
});
