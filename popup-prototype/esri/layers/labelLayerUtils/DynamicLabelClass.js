define(
[
 "../../core/declare",
 "../GraphicsLayer",
 "../../geometry/Extent",
 "../../geometry/Polygon"],
function(declare, GraphicsLayer, Extent, Polygon) {

  var dlLayer = declare(GraphicsLayer, {

  declaredClass: "esri.layers.labelLayerUtils.DynamicLabelClass",
      
  constructor: function() {
    this._preparedLabels = [];
    this._placedLabels = [];
    this._extent = null;
    this._xmin = 0;
    this._xmax = 0;
    this._ymin = 0;
    this._ymax = 0;
    this._x0 = 0;
    this._y0 = 0;
    this._x1 = 0;
    this._y1 = 0;
    this._scale = 1.0;
  },
  
  setMap: function(map, labelLayer) {
    this._labelLayer = labelLayer;
    this._xmin = map.extent.xmin;
    this._xmax = map.extent.xmax;
    this._ymin = map.extent.ymin;
    this._ymax = map.extent.ymax;
    this._scale = (this._xmax - this._xmin) / map.width;
  },
  
  _process: function(preparedLabels) {
    this._preparedLabels = preparedLabels;
    this._placedLabels = [];
    var ke;
    var howManyLabels;
    for (ke = this._preparedLabels.length - 1; ke >= 0; ke--) {
      var lb = this._preparedLabels[ke];
      // get new parameters
      var labelBufferRatio = 0;
      var bestSize = Math.min(lb.labelWidth, lb.labelHeight);
      var halfTextWidth = lb.labelWidth + labelBufferRatio * bestSize;
      var halfTextHeight = lb.labelHeight + labelBufferRatio * bestSize;
      var options = lb.options;
      //
      var lineLabelPlacement = (options && options.lineLabelPlacement !== undefined) ? options.lineLabelPlacement : "PlaceAtCenter"; // PlaceAtStart PlaceAtCenter(default) PlaceAtEnd
      var lineLabelPosition = (options && options.lineLabelPosition !== undefined) ? options.lineLabelPosition : "Above"; // Above(default) Below OnLine
      //
      var pointPrioritiesValue = (options && options.pointPriorities !== undefined) ? options.pointPriorities : "AboveRight"; // default
      var pointPriorities = [2,2,1,3,0,2,3,3,2]; // default
      if(pointPrioritiesValue == "AboveLeft") {
        pointPriorities = [1,2,2,2,0,3,2,3,3];
      } else if(pointPrioritiesValue == "AboveCenter") {
        pointPriorities = [2,1,2,2,0,2,3,3,3];
      } else if(pointPrioritiesValue == "AboveRight") {
        pointPriorities = [2,2,1,3,0,2,3,3,2];
      } else if(pointPrioritiesValue == "CenterLeft") {
        pointPriorities = [2,2,3,1,0,3,2,2,3];
      } else if(pointPrioritiesValue == "CenterCenter") {
        pointPriorities = [0,0,0,0,1,0,0,0,0];
      } else if(pointPrioritiesValue == "CenterRight") {
        pointPriorities = [3,2,2,3,0,1,3,2,2];
      } else if(pointPrioritiesValue == "BelowLeft") {
        pointPriorities = [2,3,3,2,0,3,1,2,2];
      } else if(pointPrioritiesValue == "BelowCenter") {
        pointPriorities = [3,3,3,2,0,2,2,1,2];
      } else if(pointPrioritiesValue == "BelowRight") {
        pointPriorities = [3,3,2,3,0,2,2,2,1];
      }
      //
      // labelRotation
      var labelRotationValue = (options && options.labelRotation !== undefined) ? options.labelRotation : true; // default
      var angle = lb.angle * (Math.PI / 180); // degree -> radians
      //gr = rad * (180 / Math.PI);
      //rad = gr * (Math.PI / 180); 
      //
      // for polygon
      howManyLabels = (options && options.howManyLabels !== undefined)? options.howManyLabels : "OneLabel"; // default
      //
      
      if (lb.geometry.type == "point") {
        this._generatePointPositions(lb, lb.geometry.x, lb.geometry.y, lb.text, angle, halfTextWidth, halfTextHeight, lb.symbolWidth, lb.symbolHeight, pointPriorities);
      } else if (lb.geometry.type == "multipoint") {
        var bmp = lb.geometry;
        var t;
        for (t = 0; t < bmp.points.length; t++) {
          this._generatePointPositions(lb, bmp.points[t][0], bmp.points[t][1], lb.text, angle, halfTextWidth, halfTextHeight, lb.symbolWidth, lb.symbolHeight, pointPriorities);
        }
      }
      else if (lb.geometry.type == "polyline") {
        this._generateLinePositions(lb, lb.geometry, lb.text, halfTextWidth, halfTextHeight, 2 * lb.symbolHeight + halfTextHeight, lineLabelPlacement, lineLabelPosition, labelRotationValue);
      } else if (lb.geometry.type == "polygon") {
        this._generatePolygonPositions(lb, howManyLabels, lb.geometry, lb.text, angle, halfTextWidth, halfTextHeight);
      }
      // else // ignore unknown feature type
    }
    return this._placedLabels;
  },

  /**
   * predefined:
   * 
   * AboveLeft      [1,2,2,2,0,3,2,3,3]
   * AboveCenter    [2,1,2,2,0,2,3,3,3]
   * AboveRight     [2,2,1,3,0,2,3,3,2] (default)
   * CenterLeft     [2,2,3,1,0,3,2,2,3]
   * CenterCenter   [0,0,0,0,1,0,0,0,0]
   * CenterRight    [3,2,2,3,0,1,3,2,2]
   * BelowLeft      [2,3,3,2,0,3,1,2,2]
   * BelowCenter    [3,3,3,2,0,2,2,1,2]
   * BelowRight     [3,3,2,3,0,2,2,2,1]
   * 
   * 0 - blocked, 1 - highest, 2 - medium, 3 - lowest priority
   * 
   *  order in pointPriorities array 
   *  1 -> 2 -> 3
   *  4 -> 5 -> 6
   *  7 -> 8 -> 9
   * 
   * AboveLeft [1,2,2,2,0,3,2,3,3]
   *  1  2  2
   *  2  0  3
   *  2  3  3
   * 
   * AboveCenter [2,1,2,2,0,2,3,3,3]
   *  2  1  2
   *  2  0  2
   *  3  3  3
   * 
   * AboveRight [2,2,1,3,0,2,3,3,2] (default)
   *  2  2  1
   *  3  0  2
   *  3  3  2
   *  
   * CenterLeft [2,2,3,1,0,3,2,2,3]
   *  2  2  3
   *  1  0  3
   *  2  2  3
   * 
   * CenterCenter [0,0,0,0,1,0,0,0,0]
   *  0  0  0
   *  0  1  0
   *  0  0  0
   * 
   * CenterRight [3,2,2,3,0,1,3,2,2]
   *  3  2  2
   *  3  0  1
   *  3  2  2
   * 
   * BelowLeft [2,3,3,2,0,3,1,2,2]
   *  2  3  3
   *  2  0  3
   *  1  2  2
   * 
   * BelowCenter [3,3,3,2,0,2,2,1,2]
   *  3  3  3
   *  2  0  2
   *  2  1  2
   * 
   * BelowRight [3,3,2,3,0,2,2,2,1]
   *  3  3  2
   *  3  0  2
   *  2  2  1
   * 
   * @private
   */
  _generatePointPositions: function(label, x, y, text, angle, halfTextWidth, halfTextHeight, halfSymbolWidth, halfSymbolHeight, pointPriorities) {
    var dX = (halfSymbolWidth + halfTextWidth) * this._scale;
    var dY = (halfSymbolHeight + halfTextHeight) * this._scale;
    var i, k;
    for (i = 1; i <= 3; i++) { // priority(1-3)
      for (k = 1; k <= 9; k++) { // position(1-9)
        if (pointPriorities[k-1] == i) {
          switch (k) {
          case 1: // AboveLeft
            if (this._findPlace(label, text, x - dX, y + dY, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 2: // AboveCenter
            if (this._findPlace(label, text, x, y + dY, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 3: // AboveRight
            if (this._findPlace(label, text, x + dX, y + dY, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 4: // Centerleft
            if (this._findPlace(label, text, x - dX, y, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 5: // CenterCenter
            if (this._findPlace(label, text, x, y, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 6: // CenterRight
            if (this._findPlace(label, text, x + dX, y, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 7: // BelowLeft
            if (this._findPlace(label, text, x - dX, y - dY, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 8: // BelowCenter
            if (this._findPlace(label, text, x, y - dY, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          case 9: // BelowRight
            if (this._findPlace(label, text, x + dX, y - dY, angle, halfTextWidth, halfTextHeight)) {
              return;
            }
            break;
          default:
            break;
          }
        }
      }
    }
  },

  _generateLinePositions: function(label, fg, text, halfWidth, halfHeight, shift, pos, place, labelRotationValue) {
    var quadroHalfWidth = (halfWidth * this._scale) * (halfWidth * this._scale);
    var k, i, j;
    for (k = 0; k < fg.paths.length; k++) {
      var path = fg.paths[k];
      var len = path.length;
      // PlaceAtCenter // default
      var l = Math.floor((len - 1) / 2);
      var d = (((len - 1) % 2) !== 0) ? +1 : -1;
      // PlaceAtStart
      if (pos == "PlaceAtStart") {
        l = 0;
        d = 1;
      }
      // PlaceAtEnd
      if (pos == "PlaceAtEnd") {
        l = len - 2;
        d = -1;
      }
      while (l >= 0 && l < (len - 1)) {
        for (i = l; i < len; i++) {
          var xa = path[l][0];
          var ya = path[l][1];
          var dx = path[i][0] - xa;
          var dy = path[i][1] - ya;
          if ((dx * dx + dy * dy) > quadroHalfWidth) {
            var ang = Math.atan2(dy, dx);
            while (ang > (Math.PI / 2)) {
              ang -= Math.PI;
            }
            while (ang < -(Math.PI / 2)) {
              ang += Math.PI;
            }
            var sin = Math.sin(ang);
            var cos = Math.cos(ang);
            
            // OnLine
            var shsin = 0;
            var shcos = 0;
            if(place == "Above") {
              shsin = shift * sin * this._scale;
              shcos = shift * cos * this._scale;
            }
            if(place == "Below") {
              shsin = - shift * sin * this._scale;
              shcos = - shift * cos * this._scale;
            }
            
            if (i - l == 1) {
              // one segment only
              if (this._clipLine(xa, ya, path[i][0], path[i][1])) {
                var dxx = this._x1 - this._x0;
                var dyy = this._y1 - this._y0;
                if ((dxx * dxx + dyy * dyy) > quadroHalfWidth) {
                  var segmentAngle = Math.atan2(dyy, dxx);
                  var approachedSize = halfWidth/2+halfHeight*2; // how far step back from begin/end
                  var xShift = approachedSize * this._scale * Math.cos(segmentAngle);
                  var yShift = approachedSize * this._scale * Math.sin(segmentAngle);
                  var xp;
                  var yp;
                  if (pos == "PlaceAtStart") {
                    xp = this._x0 + xShift;
                    yp = this._y0 + yShift;
                  } else if (pos == "PlaceAtEnd") {
                    xp = this._x1 - xShift;
                    yp = this._y1 - yShift;
                  } else { // PlaceAtCenter
                    xp = (this._x0 + dxx / 2);
                    yp = (this._y0 + dyy / 2);
                  }
                  // PlaceAtCenter
                  if (this._findPlace(label, text, xp - shsin, yp + shcos, (labelRotationValue) ? -segmentAngle : 0, halfWidth, halfHeight)) {
                    return;
                  }
                }
              }
            }
            else {
              // group segment
              var maxD = 0;
              for (j = l; j <= i; j++) {
                maxD = Math.max(maxD, Math.abs((path[j][1] - ya) * cos - (path[j][0] - xa) * sin));
              }
              if (maxD < halfHeight) {
                if (this._findPlace(label, text, (xa + dx / 2) - shsin, (ya + dy / 2) + shcos, (labelRotationValue) ? -ang : 0, halfWidth, halfHeight)) {
                  return;
                }
              }
            }
            break;
          }
        }
        l += d;
        // for PlaceAtCenter: search from center to the begin or to the end depends on +d or -d
      }
    }
  },

  _generatePolygonPositions: function(label, howManyLabels, fg, text, angle, halfTextWidth, halfTextHeight) {
    var i, centroid;

    if (howManyLabels == "ManyLabels") {
      for (i = 0; i < fg.rings.length; i++) { // labeling every ring
        var ring = fg.rings[i];
        if(!Polygon.prototype.isClockwise(ring)) { // ignore holes
          continue;
        }
        centroid = this._findCentroid(ring, this._xmin, this._ymin, this._xmax, this._ymax);
        this._findPlace(label, text, centroid[0], centroid[1], angle, halfTextWidth, halfTextHeight);
      }
    } else { // OneLabel by default
      centroid = this._findCentroidForFeature(fg, this._xmin, this._ymin, this._xmax, this._ymax);
      var yc = centroid[1];
      var y = 0;
      for (i = 0; i < 10; i++) {
        y += halfTextHeight / 4;
        // upper rows
        centroid = this._findCentroidForFeature(fg, this._xmin, yc + (y - halfTextHeight / 4), this._xmax, yc + (y + halfTextHeight / 4));
        if (this._findPlace(label, text, centroid[0], centroid[1], angle, halfTextWidth, halfTextHeight)) {
          return;
        }
        // lower rows
        centroid = this._findCentroidForFeature(fg, this._xmin, yc - (y + halfTextHeight / 4), this._xmax, yc - (y - halfTextHeight / 4));
        if (this._findPlace(label, text, centroid[0], centroid[1], angle, halfTextWidth, halfTextHeight)) {
          return;
        }
      }
    }
  },

  _findCentroid: function(p, xmin, ymin, xmax, ymax) { // PointCollection
    var len = p.length;
    var centroid = [0,0];
    var area = 0;
    var xC = p[0][0];
    var yC = p[0][1];
    if (xC > xmax) {
      xC = xmax;
    }
    if (xC < xmin) {
      xC = xmin;
    }
    if (yC > ymax) {
      yC = ymax;
    }
    if (yC < ymin) {
      yC = ymin;
    }
    for (var i = 1; i < len - 1; i++) {
      var xA = p[i][0];
      var yA = p[i][1];
      var xB = p[i + 1][0];
      var yB = p[i + 1][1];
      if (xA > xmax) {
        xA = xmax;
      }
      if (xA < xmin) {
        xA = xmin;
      }
      if (yA > ymax) {
        yA = ymax;
      }
      if (yA < ymin) {
        yA = ymin;
      }
      if (xB > xmax) {
        xB = xmax;
      }
      if (xB < xmin) {
        xB = xmin;
      }
      if (yB > ymax) {
        yB = ymax;
      }
      if (yB < ymin) {
        yB = ymin;
      }
      var z = (xA - xC) * (yB - yC) - (xB - xC) * (yA - yC);
      centroid[0] += z * (xC + xA + xB);
      centroid[1] += z * (yC + yA + yB);
      area += z;
    }
    centroid[0] /= 3.0 * area;
    centroid[1] /= 3.0 * area;

    // centroid not found return NaN centroid
    if( isNaN(centroid[0]) || isNaN(centroid[1]) ) {
      return centroid;
    }
    
    // correct centroid
    var buffer = [];
    this._fillBuffer(p, buffer, centroid); // fill buffer
    centroid[0] = this._sortBuffer(buffer, centroid[0], xmin, xmax); // correct y
    return centroid;
  },

  _findCentroidForFeature: function(bp, xmin, ymin, xmax, ymax) { // Polygon
    var i;
    var area = 0;
    var centroid = [0,0];
    var maxlen = 0;
    for (var j = 0; j < bp.rings.length; j++) {
      var ring = bp.rings[j];
      var len = ring.length;
      maxlen += len;
      var xC = ring[0][0];
      var yC = ring[0][1];
      if (xC > xmax) {
        xC = xmax;
      }
      if (xC < xmin) {
        xC = xmin;
      }
      if (yC > ymax) {
        yC = ymax;
      }
      if (yC < ymin) {
        yC = ymin;
      }
      for (i = 1; i < len - 1; i++) {
        var xA = ring[i][0];
        var yA = ring[i][1];
        var xB = ring[i + 1][0];
        var yB = ring[i + 1][1];
        if (xA > xmax) {
          xA = xmax;
        }
        if (xA < xmin) {
          xA = xmin;
        }
        if (yA > ymax) {
          yA = ymax;
        }
        if (yA < ymin) {
          yA = ymin;
        }
        if (xB > xmax) {
          xB = xmax;
        }
        if (xB < xmin) {
          xB = xmin;
        }
        if (yB > ymax) {
          yB = ymax;
        }
        if (yB < ymin) {
          yB = ymin;
        }
        var z = (xA - xC) * (yB - yC) - (xB - xC) * (yA - yC);
        centroid[0] += z * (xC + xA + xB);
        centroid[1] += z * (yC + yA + yB);
        area += z;
      }
    }
    centroid[0] /= 3.0 * area;
    centroid[1] /= 3.0 * area;
    
    // centroid not found return NaN centroid
    if( isNaN(centroid[0]) || isNaN(centroid[1]) ) {
      return centroid;
    }
    
    // correct centroid
    var buffer = [];
    for (i = 0; i < bp.rings.length; i++) { // fill buffer
      this._fillBuffer(bp.rings[i], buffer, centroid);      
    }
    centroid[0] = this._sortBuffer(buffer, centroid[0], xmin, xmax); // correct y
    return centroid;
  },
  
  _fillBuffer: function(p, buffer, centroid) {
    var np = p.length - 1;
    var OldDir = (p[0][1] >= p[np][1]) ? 1 : -1;
    for (var i = 0; i <= np; i++) {
      var ind1 = i;
      var ind2 = i + 1;
      if (i == np) {
        ind2 = 0;
      }
      var x1 = p[ind1][0];
      var y1 = p[ind1][1];
      var x2 = p[ind2][0];
      var y2 = p[ind2][1];
      var dir = (y2 >= y1) ? 1 : -1;
      if ((y1 <= centroid[1] && centroid[1] <= y2) || (y2 <= centroid[1] && centroid[1] <= y1)) {
        if (centroid[1] != y1 && centroid[1] != y2) { // 1) intersect in some point
          buffer.push((centroid[1] - y1) * (x2 - x1) / (y2 - y1) + x1);
          OldDir = dir;
          continue;
        }
        if (centroid[1] == y1 && centroid[1] != y2) { // 2) intersect with start point ONLY
          if (OldDir != dir) {
            buffer.push(x1);
          }
          OldDir = dir;
          continue;
        }
        if (centroid[1] != y1 && centroid[1] == y2) { // 3) intersect with end point ONLY
          buffer.push(x2);
          OldDir = dir;
          continue;
        }
        if (centroid[1] == y1 && centroid[1] == y2) { // 4) horizontal line
          if (OldDir == 1) {
            buffer.push(x1);
          }
          buffer.push(x2);
          OldDir = dir;
          continue;
        }
      }
    }
  },
  
  _sortBuffer: function(buffer, x, xmin, xmax) {
    var cnt = buffer.length;
    buffer.sort();
    // select the best place
    if (cnt > 0) {
      var dlt = 0;
      var index = 0;
      for (var i = 0; i < cnt - 1; i += 2) {
        var d = Math.abs(buffer[i + 1] - buffer[i]);
        if (buffer[i] <= xmin && buffer[i + 1] <= xmin) {
          continue;
        }
        if (buffer[i] >= xmax && buffer[i + 1] >= xmax) {
          continue;
        }
        if (d > dlt) {
          dlt = d;
          index = i;
        }
      }
      var xA = buffer[index];
      var xB = buffer[index + 1];
      if (xA > xmax) {
        xA = xmax;
      }
      if (xA < xmin) {
        xA = xmin;
      }
      if (xB > xmax) {xB = xmax;
      
      }
      if (xB < xmin) {
        xB = xmin;
      }
      x = (xA + xB) / 2;
    }
    return x;
  },
  
  /**
   * @param angle1 in degree
   * @private
   */
  _findPlace: function(layer, text, x1, y1, angle1, halfWidth1, halfHeight1) {
    if( isNaN(x1) || isNaN(y1) ) { //  wrong values
      return false;
    }
//    if( x1 < this._xmin || x1 > this._xmax || y1 < this._ymin || y1 > this._ymax ) { // label center is out of screen
//      return false;
//    }
    /*
    // take screen size 20% more 
    var x5prc = 0.20 * (this._xmax - this._xmin);
    var y5prc = 0.20 * (this._ymax - this._ymin);
    var xmin5prc = this._xmin - x5prc;
    var ymin5prc = this._ymin - y5prc;
    var xmax5prc = this._xmax + x5prc;
    var ymax5prc = this._ymax + y5prc;
    if( x1 < xmin5prc || x1 > xmax5prc || y1 < ymin5prc || y1 > ymax5prc ) { // label center is out of screen
      return false;
    }
    */
    /*
    // check property 'allowCrossScreen'
    var allowCrossScreen = true;// TODO support this key // (options && options["allowCrossScreen"] !== undefined) ? options["allowCrossScreen"] : true; // default
    if(!allowCrossScreen) {
      if( x1 - halfWidth1 * this._scale < this._xmin ) { // left of screen, even partially
        return false;
      }
      if( x1 + halfWidth1 * this._scale > this._xmax ) { // right of screen, even partially
        return false;
      }
      if( y1 - halfHeight1 * this._scale < this._ymin ) { // below of screen, even partially
        return false;
      }
      if( y1 + halfHeight1 * this._scale > this._ymax ) { // above of screen, even partially
        return false;
      }
    }
    */
    for (var i = 0; i < this._placedLabels.length; i++) {
      var angle2 = this._placedLabels[i].angle;
      var x2 = this._placedLabels[i].x;
      var y2 = this._placedLabels[i].y;
      var halfWidth2 = this._placedLabels[i].width * this._scale;
      var halfHeight2 = this._placedLabels[i].height * this._scale;
      var dx = x2 - x1;
      var dy = y2 - y1;
      if (angle1 === 0 && angle2 === 0) { // fast
        if(this._findPlace2(-halfWidth1 * this._scale, -halfHeight1 * this._scale, halfWidth1 * this._scale, halfHeight1 * this._scale,
                          dx - halfWidth2, dy - halfHeight2, dx + halfWidth2, dy + halfHeight2)) {
          return false;
        }
      } else { // slow
        var r1 = new Extent(-halfWidth1 * this._scale, -halfHeight1 * this._scale, halfWidth1 * this._scale, halfHeight1 * this._scale, null);
        // new coordinate
        var sin1 = 0;
        var cos1 = 1;
        if (angle1 !== 0) {
          sin1 = Math.sin(angle1);
          cos1 = Math.cos(angle1);
        }
        var xNew = dx * cos1 - dy * sin1;
        var yNew = dx * sin1 + dy * cos1;
        // new angle
        var angleNew = angle2 - angle1;
        var sinNew = Math.sin(angleNew);
        var cosNew = Math.cos(angleNew);
        var dxA = (-halfWidth2) * cosNew - (-halfHeight2) * sinNew;
        var dyA = (-halfWidth2) * sinNew + (-halfHeight2) * cosNew;
        var dxB = (+halfWidth2) * cosNew - (-halfHeight2) * sinNew;
        var dyB = (+halfWidth2) * sinNew + (-halfHeight2) * cosNew;
        var xA = xNew + dxA;
        var yA = yNew - dyA;
        var xB = xNew + dxB;
        var yB = yNew - dyB;
        var xC = xNew - dxA;
        var yC = yNew + dyA;
        var xD = xNew - dxB;
        var yD = yNew + dyB;
        //
        var polygon = new Polygon();
        polygon.addRing([[xA,yA],[xB,yB],[xC,yC],[xD,yD],[xA,yA]]);
        if (r1.intersects(polygon)) {
          return false;
        }
      }
    }
    // correction text angle to be between -90 and +90
    while (angle1 > (Math.PI / 2)) {
      angle1 -= Math.PI;
    }
    while (angle1 < -(Math.PI / 2)) {
      angle1 += Math.PI;
    }
    var placedLabel = {};
    placedLabel.layer = layer;
    placedLabel.text = text;
    placedLabel.angle = angle1;
    placedLabel.x = x1;
    placedLabel.y = y1;
    placedLabel.width = halfWidth1;
    placedLabel.height = halfHeight1;
    this._placedLabels.push(placedLabel);
    return true;
  },
  
  _findPlace2: function(xminA, yminA, xmaxA, ymaxA, xminB, yminB, xmaxB, ymaxB) {
    if( ((xminA >= xminB && xminA <= xmaxB) || (xmaxA >= xminB && xmaxA <= xmaxB) || (xminA <= xminB && xmaxA >= xmaxB)) &&
        ((yminA >= yminB && yminA <= ymaxB) || (ymaxA >= yminB && ymaxA <= ymaxB) || (yminA <= yminB && ymaxA >= ymaxB))
      ) {
      return true;
    }
    return false;
  },
  
  _clipLine: function(x1, y1, x2, y2) {
    var c1 = this._code(x1, y1);
    var c2 = this._code(x2, y2);
    //
    while ((c1 !== 0) || (c2 !== 0)) {
      if ((c1 & c2) !== 0) {
        return false;
      }
      var dx = x2 - x1;
      var dy = y2 - y1;
      if (c1 !== 0) {
        if (x1 < this._xmin) {
          y1 += dy * (this._xmin - x1) / dx;
          x1 = this._xmin;
        } else
          if (x1 > this._xmax) {
            y1 += dy * (this._xmax - x1) / dx;
            x1 = this._xmax;
          } else
            if (y1 < this._ymin) {
              x1 += dx * (this._ymin - y1) / dy;
              y1 = this._ymin;
            } else
              if (y1 > this._ymax) {
                x1 += dx * (this._ymax - y1) / dy;
                y1 = this._ymax;
              }
        c1 = this._code(x1, y1);
      } else {
        if (x2 < this._xmin) {
          y2 += dy * (this._xmin - x2) / dx;
          x2 = this._xmin;
        } else
          if (x2 > this._xmax) {
            y2 += dy * (this._xmax - x2) / dx;
            x2 = this._xmax;
          } else
            if (y2 < this._ymin) {
              x2 += dx * (this._ymin - y2) / dy;
              y2 = this._ymin;
            } else
              if (y2 > this._ymax) {
                x2 += dx * (this._ymax - y2) / dy;
                y2 = this._ymax;
              }
        c2 = this._code(x2, y2);
      }
    }
    this._x0 = x1;
    this._y0 = y1;
    this._x1 = x2;
    this._y1 = y2;
    return true;
  },

  _code: function(x, y) {
    var r = 0;
    if(x < this._xmin) { r = r + 8; } // 1000
    if(x > this._xmax) { r = r + 4; } // 0100
    if(y < this._ymin) { r = r + 2; } // 0010
    if(y > this._ymax) { r = r + 1; } // 0001
    return r;
  }
  
  });

  
  
  return dlLayer;  

});

