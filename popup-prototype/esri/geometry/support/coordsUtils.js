define([
], function(
) {

  // TODO yann6817: use vec2/3
  var getLength = function getLength(pt1, pt2) {
    //summary: Returns the length of this line
    //returns: double: length of line
    var dx = pt2[0] - pt1[0],
        dy = pt2[1] - pt1[1],
        dz = 0;

    if (pt1.length > 1 && pt2.length > 1) {
      dz = pt1[2] - pt2[2];
    }

    return Math.sqrt(dx*dx + dy*dy + dz * dz);
  };

  var getPointOnLine = function getPointOnLine(pt0, pt1, fraction) {
    var x = pt0[0] + fraction * (pt1[0] - pt0[0]);
    var y = pt0[1] + fraction * (pt1[1] - pt0[1]);

    if (pt0.length > 2 && pt1.length > 2) {
      return [x, y, pt0[2] + fraction * (pt1[2] - pt0[2])];
    }
    return [x, y];
  };

  var getMidpoint = function getMidpoint(pt0, pt1) {
    return getPointOnLine(pt0, pt1, 0.5);
  };

  var _contains = function _contains(isInside, points, v) {
    var x = v[0];
    var y = v[1];
    var k = 0;
    var p1x, p2x, p1y, p2y;

    for (var j = 0, m = points.length; j < m; j++) {
      k++;
      if (k === m) {
        k = 0;
      }
      p1x = points[j][0];
      p2x = points[k][0];
      p1y = points[j][1];
      p2y = points[k][1];
      if ((p1y < y && p2y >= y || p2y < y && p1y >= y) && (p1x + (y - p1y) / (p2y - p1y) * (p2x - p1x) < x)) {
        isInside = !isInside;
      }
    }

    return isInside;
  };

  var contains = function contains(rings, v) {
    if (!rings) {
      return false;
    }

    // support for an array of numbers
    if (!Array.isArray(rings[0][0])) {
      return _contains(false, rings, v);
    }

    var isInside = false;
    for (var i = 0, n = rings.length; i < n; i++) {
      isInside = _contains(isInside, rings[i], v);
    }

    return isInside;
  };

  var centroidOfRing = function(out, ring, hasZ) {
    var x = 0;
    var y = 0;
    var z = 0;

    var curr, currX, currY, currZ;
    var next, nextX, nextY, nextZ;
    var cross;
    var area = 0, areaZ = 0;
    
    for (var i = 0, n = ring.length - 1; i < n; i++) {
      curr = ring[i];
      currX = curr[0];
      currY = curr[1];
      currZ = curr[2];

      next = ring[i + 1];
      nextX = next[0];
      nextY = next[1];
      nextZ = next[2];

      cross = currX * nextY - nextX * currY;
      area += cross;
      x += (currX + nextX) * cross;
      y += (currY + nextY) * cross;

      if (hasZ && curr.length > 2 && next.length > 2) {
        cross = currX * nextZ - nextX * currZ;
        z += (currZ + nextZ) * cross;
        areaZ += cross;
      }
    }

    // TODO
    // Let's ignore holes for now and make them clockwise 
    // i.e. negative area
    if (area > 0) {
      area *= -1;
    }
    if (areaZ > 0) {
      areaZ *= -1;
    }

    if (!area) {
      // It is possible that feature generalization produces 
      // flat rings - horizontal or vertical. Exclude them.
      out.length = 0;
    }
    else {
      out[0] = x;
      out[1] = y;
      out[2] = area * 0.5;
      if (hasZ) {
       out[3] = z;
       out[4] = areaZ * 0.5;
      }
      else {
        out.length = 3;
      }
    }
    return out;
  };

  var lineCentroid = function(points, hasZ) {
    // Returns the centroid along the given line, or the first point as 
    // fallback.
    // Ref: http://www.mathalino.com/reviewer/engineering-mechanics/719-closed-straight-lines-centroid-composite-lines
    // Simple test:
    // esri.geometry.Polygon.prototype._getLineCentroid([ [0,12], [0,0], [6,6], [12,0], [12,6], [0,12] ])
    //  should return:
    //    { x: 5.255998060147748, y: 5.407640852753601 }
    var totalLength = 0, totalXAtLen = 0, totalYAtLen = 0, totalZAtLen = 0,
        obj1 = hasZ ? [0, 0, 0] : [0, 0], obj2 = hasZ ? [0, 0, 0] : [0, 0],
        point, next, midPoint, length;

    for (var i = 0, len = points.length; i < len - 1; i++) {
      point = points[i];
      next = points[i + 1];

      if (point && next) {
        obj1[0] = point[0];
        obj1[0] = point[1];

        obj2[0] = next[0];
        obj2[0] = next[1];

        if (hasZ && point.length > 2 && next.length > 2) {
          obj1[2] = point[2];
          obj2[2] = next[2];
        }

        // Length of this segment
        length = getLength(obj1, obj2);

        if (length) {
          // console.log("Length = ", length);
          totalLength += length;

          // Midpoint along this segment
          midPoint = getMidpoint(point, next);
          //console.log("Midpoint = ", midPoint);

          // Summation for final x/y calculation outside the loop.
          totalXAtLen += (length * midPoint[0]);
          totalYAtLen += (length * midPoint[1]);

          if (hasZ && midPoint.length > 2) {
            totalZAtLen += (length * midPoint[2]);
          }
        }
      }
    }

    if (totalLength > 0) {
      // console.log("Total Length = ", totalLength);
      if (hasZ) {
        return [
          totalXAtLen / totalLength,
          totalYAtLen / totalLength,
          totalZAtLen / totalLength
        ];
      }
      return [
        totalXAtLen / totalLength,
        totalYAtLen / totalLength
      ];
    }
    else if (points.length) {
      return points[0];
    }

    return null;
  };

  var centroid = function(out, rings, hasZ) {
    // http://en.wikipedia.org/wiki/Centroid#Centroid_of_polygon
    var bagOfRings = [],
        cen,
        denom;

    for (var i = 0, n = rings.length; i < n; i++) {
      cen = centroidOfRing([], rings[i], hasZ);
      if (cen.length) {
        bagOfRings.push(cen);
      }
    }

    // Ring with larger area ahead of ones with smaller area
    bagOfRings.sort(function(a, b) {
      // Usually b - a, but we have all negative values here and
      // we're interested in largest magnitude (not clockwise
      // or anti-clockwise direction)
      var ret = a[2] - b[2];
      if (ret === 0 && hasZ) {
        ret = a[4] - b[4];
      }
      return ret;
    });

    if (hasZ) {
      out.length = 3;
    }
    else {
      out.length = 2;
    }

    // Due to area check in the loop above, it is possible that 
    // bagOfRings is empty.
    if (bagOfRings.length) {
      denom = 6 * bagOfRings[0][2];
      out[0] = bagOfRings[0][0] / denom;
      out[1] = bagOfRings[0][1] / denom;
      if (hasZ) {
        out[2] = bagOfRings[0][3] / (6 * bagOfRings[0][4]);
      }
    }
    else {
      // Unable to calculate the "centroid of area":
      // Let's try "centroid of the polygon boundary".
      var boundaryCentroid = (rings[0] && rings[0].length) ? lineCentroid(rings[0]) : null;

      if (boundaryCentroid) {
        out[0] = boundaryCentroid[0];
        out[1] = boundaryCentroid[1];
        if (hasZ && boundaryCentroid.length > 2) {
          out[2] = boundaryCentroid[2];
        }
      }
    }

    return out;
  };

  /**
   * @returns `true` if the ring or path is clockwise
   */
  var isClockwise = function isClockwise(points) {
    var area = 0;
    for (var i = 0, j = i + 1, n = points.length; i < n; i++, j = j + 1 % n) {
      area += points[i][0] * points[j][1] - points[j][0] *  points[i][1];
    }
    return (area * 0.5) <= 0;
    
    /*
    // note yann6817: is z/m support needed here?

    var areaY = 0;
    var areaZ = 0;
    var areaM = 0;
    var p1, p2, midx;

    for (var i = 0, n = ringOrPath.length; i < n; i++) {
      p1 = ringOrPath[i];
      p2 = ringOrPath[(i + 1) % n];

      areaY += p1[0] * p2[1] - p2[0] * p1[1];
      midx = 2;

      if (p1.length > 2 && p2.length > 2 && hasZ) {
        areaZ += p1[0] * p2[2] - p2[0] * p1[2];
        midx = 3;
      }

      if (p1.length > midx && p2.length > midx && hasM) {
        areaM += p1[0] * p2[midx] - p2[0] * p1[midx];
      }
    }

    return areaY <= 0 && areaZ <= 0 && areaM <= 0;
    */
  };

  var fromGeom = function fromGeom(geom) {
    if (!geom) {
      return null;
    }
    if (Array.isArray(geom)) {
      return geom;
    }

    var hasZ = geom.hasZ;
    var hasM = geom.hasM;

    if (geom.type === "point") {
      if (hasM && hasZ) {
        return [geom.x, geom.y, geom.z, geom.m];
      }
      else if (hasZ) {
        return [geom.x, geom.y, geom.z];
      }
      else if (hasM) {
        return [geom.x, geom.y, geom.m];
      }
      return [geom.x, geom.y];
    }

    if (geom.type === "polygon") {
      return geom.rings.slice(0);
    }

    if (geom.type === "polyline") {
      return geom.path.slice(0);
    }

    if (geom.type === "multipoint") {
      return geom.points.slice(0);
    }

    if (geom.type === "extent") {
      // TODO optimize
      var extents = geom.normalize();
            
      if (!extents) { 
        return null;
      }

      hasZ = hasM = false;
      extents.map(function(extent) {
        if (extent.hasZ) {
          hasZ = true;
        }
        if (extent.hasM) {
          hasM = true;
        }
      });

      return extents.map(function(extent) {
        var ret = [
          [ extent.xmin, extent.ymin ],
          [ extent.xmin, extent.ymax ],
          [ extent.xmax, extent.ymax ],
          [ extent.xmax, extent.ymin ],
          [ extent.xmin, extent.ymin ]
        ];

        if (hasZ && extent.hasZ) {
          var z = (extent.zmax - extent.zmin) * 0.5;

          for (var i = 0; i < ret.length; i++) {
            ret[i].push(z);
          }
        }

        if (hasM && extent.hasM) {
          var m = (extent.mmax - extent.mmin) * 0.5;

          for (i = 0; i < ret.length; i++) {
            ret[i].push(m);
          } 
        }

        return ret;
      });
    }

    return null;
  };

  return {
    fromGeom: fromGeom,
    contains: contains,
    centroid: centroid, 
    isClockwise: isClockwise
  };

});
