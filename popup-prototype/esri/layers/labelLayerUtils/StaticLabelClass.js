define(
[
 "../../core/declare",
 "../GraphicsLayer",
 "../../geometry/Extent",
 "../../geometry/Point",
 "../../geometry/Polygon"
],
function(declare, GraphicsLayer, Extent, Point, Polygon) {
  
  var dlLayer = declare(GraphicsLayer, {

  declaredClass: "esri.layers.labelLayerUtils.StaticLabel",
      
  constructor: function() {
    this._preparedLabels = [];
    this._placedLabels = [];
    this._extent = null;
    this._xmin = 0;
    this._xmax = 0;
    this._ymin = 0;
    this._ymax = 0;
    this._scale = 1.0;
    this._LINE_STEP_CONST = 1.5;  // step between two labels for line geometry(magic number) 0.75 -> 1.5
    this._POLYGON_X_STEP_CONST = 1.0;
    this._POLYGON_Y_STEP_CONST = 0.75;
  },

  setMap: function(map, labelLayer) {
    this._labelLayer = labelLayer;
    this._map = map;
    this._xmin = map.extent.xmin;
    this._xmax = map.extent.xmax;
    this._ymin = map.extent.ymin;
    this._ymax = map.extent.ymax;
    this._scale = (this._xmax - this._xmin) / map.width;
  },

  _process: function(preparedLabels) {
    var ke;
    var lb;
    var i;
    var labelRotationValue;
    var angle;
    var howManyLabels;
    var halfTextWidth;
    var halfTextHeight;
    var options;
    var lineLabelPlacement;
    var lineLabelPosition;
    //
    this._preparedLabels = preparedLabels;
    this._placedLabels = [];
    //
    for (ke = this._preparedLabels.length - 1; ke >= 0; ke--) {
      lb = this._preparedLabels[ke];
      // get new parameters
      halfTextWidth = lb.labelWidth;
      halfTextHeight = lb.labelHeight;
      options = lb.options;
      //
      lineLabelPlacement = (options && options.lineLabelPlacement) ? options.lineLabelPlacement : "PlaceAtCenter"; // PlaceAtStart PlaceAtCenter(default) PlaceAtEnd
      lineLabelPosition = (options && options.lineLabelPosition) ? options.lineLabelPosition : "Above"; // Above(default) Below OnLine
      //
      
      // labelRotation
      labelRotationValue = (options && options.labelRotation) ? options.labelRotation : true; // default
      angle = lb.angle * (Math.PI / 180); // degree -> radians
      //gr = rad * (180 / Math.PI);
      //rad = gr * (Math.PI / 180); 
      //
      // for polygon
      howManyLabels = (options && options.howManyLabels)? options.howManyLabels : "OneLabel"; // default
      //
      
      // calc labelCoordinates
      var labelCoordinates = [];        
    
      if (lb.geometry.type === "point") {
        this._generatePointPositions(lb.geometry.x, lb.geometry.y, lb.text, angle, halfTextWidth, halfTextHeight, lb.symbolWidth, lb.symbolHeight, options, labelCoordinates);
      } else if (lb.geometry.type === "multipoint") {
        for (i = 0; i < lb.geometry.points.length; i++) {
          this._generatePointPositions(lb.geometry.points[i][0], lb.geometry.points[i][1], lb.text, angle, halfTextWidth, halfTextHeight, lb.symbolWidth, lb.symbolHeight, options, labelCoordinates);
        }
      } else if (lb.geometry.type === "polyline") {
        if (lineLabelPlacement === "PlaceAtStart") {
          this._generateLinePositionsPlaceAtStart(lb.geometry, true, lb.text, halfTextWidth, halfTextHeight, 2 * lb.symbolHeight + halfTextHeight, lineLabelPlacement, lineLabelPosition, labelRotationValue, labelCoordinates);
        } else if(lineLabelPlacement === "PlaceAtEnd") {
          this._generateLinePositionsPlaceAtEnd(lb.geometry, true, lb.text, halfTextWidth, halfTextHeight, 2 * lb.symbolHeight + halfTextHeight, lineLabelPlacement, lineLabelPosition, labelRotationValue, labelCoordinates);
        } else { // PlaceAtCenter
          var labelCollection = [];
          var fExt = lb.geometry.getExtent();
          var mExt = this._map.extent;
          if(fExt.getWidth() < halfTextWidth * this._scale && fExt.getHeight() < halfTextWidth * this._scale) {
            continue; // feature is smaller than text - no labeling
          } else if(0.5 * fExt.getWidth() < mExt.getWidth() && 0.5 * fExt.getHeight() < mExt.getHeight()) {
            // feature is within half screen
            var step = 1/10 * Math.min(this._map.width, this._map.height) * this._scale; // generate approx 10 labels
            this._generateLinePositionsPlaceAtCenter(lb.geometry, false, step, lb.text, halfTextWidth, halfTextHeight, 2 * lb.symbolHeight + halfTextHeight, lineLabelPlacement, lineLabelPosition, labelRotationValue, labelCollection);
          } else {
            // feature is NOT within half screen
            var step1 = this._LINE_STEP_CONST * Math.min(this._map.width, this._map.height) * this._scale; // generate the only one label
            this._generateLinePositionsPlaceAtCenter(lb.geometry, true, step1, lb.text, halfTextWidth, halfTextHeight, 2 * lb.symbolHeight + halfTextHeight, lineLabelPlacement, lineLabelPosition, labelRotationValue, labelCollection);
          }
          // select the best label
          this._postSorting(fExt, labelCollection, labelCoordinates);
        }
      } else if (lb.geometry.type === "polygon") {
        for (i = 0; i < lb.geometry.rings.length; i++) {
          var ring = lb.geometry.rings[i];
          if(!Polygon.prototype.isClockwise(ring)) { // ignore holes
            continue;
          }
          var rEx = this._calcRingExtent(ring);
          if((rEx.xmax - rEx.xmin) < 4 * halfTextWidth * this._scale && (rEx.ymax - rEx.ymin) < 4 * halfTextHeight * this._scale) {
            continue; // feature is smaller than text - no labeling
          }
          this._generatePolygonPositionsForManyLabels(ring, lb.geometry.spatialReference, lb.text, angle, halfTextWidth, halfTextHeight, labelCoordinates);
        }
      }
      
      // find places for each position in labelCoordinates[]
      for(i = 0; i < labelCoordinates.length; i++) {
        var xxx = labelCoordinates[i].x;
        var yyy = labelCoordinates[i].y;
        if(labelCoordinates[i].angle !== undefined) {
          angle = labelCoordinates[i].angle;
        }
        var found = this._findPlace(lb, lb.text, xxx, yyy, angle, halfTextWidth, halfTextHeight);
        if(howManyLabels === "OneLabel" && found && this._labelLayer._isWithinScreenArea(new Point(xxx, yyy, lb.geometry.spatialReference))) {
          break; // if we only need one label and it is placed and visible on screen
        }
      }
      
    } // ke
    return this._placedLabels;
  },

  _generatePointPositions: function(fgx, fgy, text, angle, halfTextWidth, halfTextHeight, halfSymbolWidth, halfSymbolHeight, options, labelCoordinates) {
    var x, y, dX, dY;
    var pointPriorities;

    pointPriorities = (options && options.pointPriorities) ? options.pointPriorities : "AboveRight";
    dX = (halfSymbolWidth + halfTextWidth) * this._scale;
    dY = (halfSymbolHeight + halfTextHeight) * this._scale;
    
    switch (pointPriorities.toLowerCase()) {
    case "aboveleft":
      x = fgx - dX;
      y = fgy + dY;
      break;
    case "abovecenter":
      x = fgx;
      y = fgy + dY;
      break;
    case "aboveright":
      x = fgx + dX;
      y = fgy + dY;
      break;
    case "centerleft":
      x = fgx - dX;
      y = fgy;
      break;
    case "centercenter":
      x = fgx;
      y = fgy;
      break;
    case "centerright":
      x = fgx + dX;
      y = fgy;
      break;
    case "belowleft":
      x = fgx - dX;
      y = fgy - dY;
      break;
    case "belowcenter":
      x = fgx;
      y = fgy - dY;
      break;
    case "belowright":
      x = fgx + dX;
      y = fgy - dY;
      break;
    default:
      return; // can't place label
    }
    labelCoordinates.push({"x" : x, "y" : y});
    //this._findPlace(label, text, x, y, angle, halfTextWidth, halfTextHeight);
  },
  
  _generateLinePositionsPlaceAtStart: function(fg, isWithinScreenArea, text, halfWidth, halfHeight, shift, pos, place, labelRotationValue, labelCoordinates) {
    var initialStep = halfWidth * this._scale; // for the very first label step should be a halfWidth of text string
    var step = this._LINE_STEP_CONST * Math.min(this._map.width, this._map.height) * this._scale;
    var k, r, xa, ya, xb, yb, dx, dy, segmentLength;
    for (k = 0; k < fg.paths.length; k++) {
      var path = fg.paths[k];
      // GO FROM START TO END
      var localStep = initialStep;
      var currentLength = 0;
      for (r = 0; r < path.length - 1; r++) {
        xa = path[r][0];
        ya = path[r][1];
        xb = path[r+1][0];
        yb = path[r+1][1];
        dx = xb - xa;
        dy = yb - ya;
        segmentLength = Math.sqrt(dx * dx + dy * dy);
        if(currentLength + segmentLength > localStep) {
          currentLength = this._generatePositionsOnLine(fg.spatialReference, isWithinScreenArea, localStep, step, currentLength, xa, ya, xb, yb, text, halfWidth, halfHeight, shift, place, labelRotationValue, labelCoordinates);
          localStep = step; // after first label is placed(or even attempted to place) switch to regular step
        } else {
          currentLength += segmentLength;
        }
      } // for
    }
  },

  _generateLinePositionsPlaceAtEnd: function(fg, isWithinScreenArea, text, halfWidth, halfHeight, shift, pos, place, labelRotationValue, labelCoordinates) {
    var initialStep = halfWidth * this._scale; // for the very first label step should be a halfWidth of text string
    var step = this._LINE_STEP_CONST * Math.min(this._map.width, this._map.height) * this._scale;
    var k, r, xa, ya, xb, yb, dx, dy, segmentLength;
    for (k = 0; k < fg.paths.length; k++) {
      var path = fg.paths[k];
      // GO FROM END TO START
      var localStep = initialStep;
      var currentLength = 0;
      for (r = path.length - 2; r >= 0; r--) {
        xa = path[r+1][0];
        ya = path[r+1][1];
        xb = path[r][0];
        yb = path[r][1];
        dx = xb - xa;
        dy = yb - ya;
        segmentLength = Math.sqrt(dx * dx + dy * dy);
        if(currentLength + segmentLength > localStep) {
          currentLength = this._generatePositionsOnLine(fg.spatialReference, isWithinScreenArea, localStep, step, currentLength, xa, ya, xb, yb, text, halfWidth, halfHeight, shift, place, labelRotationValue, labelCoordinates);
          localStep = step; // after first label is placed(or even attempted to place) switch to regular step
        } else {
          currentLength += segmentLength;
        }
      } // for
    }
  },
  
  _generateLinePositionsPlaceAtCenter: function(fg, isWithinScreenArea, step, text, halfWidth, halfHeight, shift, pos, place, labelRotationValue, labelCoordinates) {
    var k, i, r, xa, ya, xb, yb, dx, dy;
    for (k = 0; k < fg.paths.length; k++) {
      var path = fg.paths[k];
      //
      // pass around wrong data
      if(path.length < 2) {
        continue;
      }
      //
      // CALC FULL LENGTH
      var fullLength = 0;
      for (i = 0; i < path.length - 1; i++) {
        xa = path[i][0];
        ya = path[i][1];
        xb = path[i+1][0];
        yb = path[i+1][1];
        dx = xb - xa;
        dy = yb - ya;
        fullLength += Math.sqrt(dx * dx + dy * dy);
      }
      //
      // FIND CENTRAL SEGMENT
      var currentLength = 0;
      for (i = 0; i < path.length - 1; i++) {
        xa = path[i][0];
        ya = path[i][1];
        xb = path[i+1][0];
        yb = path[i+1][1];
        dx = xb - xa;
        dy = yb - ya;
        var segmentLength = Math.sqrt(dx * dx + dy * dy);
        if(currentLength + segmentLength > fullLength/2.0) {
          break; // i point to central segment
        }
        currentLength += segmentLength;
      }
      //
      // if last point in path
      if(i == path.length - 1) {
        i--;
      }
      //
      // GET CENTER X/Y
      xa = path[i][0]; // i still point to central segment
      ya = path[i][1];
      xb = path[i+1][0];
      yb = path[i+1][1];
      dx = xb - xa;
      dy = yb - ya;
      var segmentLengthToCenter = fullLength/2.0 - currentLength;
      var alfa = Math.atan2(dy, dx); // last dx/dy strill valid
      var xc = xa + segmentLengthToCenter * Math.cos(alfa);
      var yc = ya + segmentLengthToCenter * Math.sin(alfa);
      // PUT LABEL AT CENTER
      var rslt = this._angleAndShifts(xa, ya, xb, yb, shift, place, labelRotationValue); // find angle and x/y shifts
      labelCoordinates.push({"x" : xc + rslt.shiftX, "y" : yc + rslt.shiftY, "angle": rslt.angle});
      //this._findPlace(layer, text, xc + rslt.shiftX, yc + rslt.shiftY, rslt.angle, halfWidth, halfHeight);
      //
      var xCenter = xc;
      var yCenter = yc;
      //
      // GO FROM CENTER TO END
      currentLength = 0;
      for (r = i; r < path.length - 1; r++) {
        if(r == i) { // first line (where center is)
          xa = xCenter;
          ya = yCenter;
        } else {
          xa = path[r][0];
          ya = path[r][1];
        }
        xb = path[r+1][0];
        yb = path[r+1][1];
        dx = xb - xa;
        dy = yb - ya;
        segmentLength = Math.sqrt(dx * dx + dy * dy);
        if(currentLength + segmentLength > step) {
          currentLength = this._generatePositionsOnLine(fg.spatialReference, isWithinScreenArea, step, step, currentLength, xa, ya, xb, yb, text, halfWidth, halfHeight, shift, place, labelRotationValue, labelCoordinates);
        } else {
          currentLength += segmentLength;
        }
      } // for
      //
      // GO FROM CENTER TO START
      currentLength = 0;
      for (r = i; r >= 0; r--) {
        if(r == i) { // first line (where center is)
          xa = xCenter;
          ya = yCenter;
        } else {
          xa = path[r+1][0];
          ya = path[r+1][1];
        }
        xb = path[r][0];
        yb = path[r][1];
        dx = xb - xa;
        dy = yb - ya;
        segmentLength = Math.sqrt(dx * dx + dy * dy);
        if(currentLength + segmentLength > step) {
          currentLength = this._generatePositionsOnLine(fg.spatialReference, isWithinScreenArea, step, step, currentLength, xa, ya, xb, yb, text, halfWidth, halfHeight, shift, place, labelRotationValue, labelCoordinates);
        } else {
          currentLength += segmentLength;
        }
      } // for
      //
    }
  },

  // return currentLength from the begining of next line(from point b)
  _generatePositionsOnLine: function(spatialReference, isWithinScreenArea, initialStep, step, currentLength, xa, ya, xb, yb, text, halfWidth, halfHeight, shift, place, labelRotationValue, labelCoordinates) {
    var dx = xb - xa;
    var dy = yb - ya;
    var alfa = Math.atan2(dy, dx);
    var xs = xa;
    var ys = ya;
    var xsOld = xs;
    var ysOld = ys;
    var localStep = initialStep;
    do {
      var microStep = localStep - currentLength;
      xs += microStep * Math.cos(alfa);
      ys += microStep * Math.sin(alfa);
      if(this._belongs(xs, ys, xa, ya, xb, yb)) {
        var rslt = this._angleAndShifts(xa, ya, xb, yb, shift, place, labelRotationValue); // find angle and x/y shifts
        var x = xs + rslt.shiftX;
        var y = ys + rslt.shiftY;
        if(isWithinScreenArea) {
          if(this._labelLayer._isWithinScreenArea(new Extent(x, y, x, y, spatialReference))) {
            labelCoordinates.push({"x" : x, "y" : y, "angle": rslt.angle});
          }
        } else {
          labelCoordinates.push({"x" : x, "y" : y, "angle": rslt.angle});
        }
        xsOld = xs;
        ysOld = ys;
        currentLength = 0;
        localStep = step;
      } else {
        var dxx = xb - xsOld; 
        var dyy = yb - ysOld;
        return Math.sqrt(dxx * dxx + dyy * dyy); // return tail
      }
    } while(true);
    
  }, 
  
  /**
   * it selects the one label from collection
   * it takes the label which is close to center of extent
   * @private
   */
  _postSorting: function(extent, inLabels, outLabels) {
    if(extent && inLabels.length > 0) {
      var xC = 0.5 * (extent.xmin + extent.xmax);
      var yC = 0.5 * (extent.ymin + extent.ymax);
      var bestIndex = 0;
      var bestX = inLabels[0].x;
      var bestY = inLabels[0].y;
      var bestDistance = Math.sqrt((bestX-xC) * (bestX-xC) + (bestY-yC) * (bestY-yC));
      var bestAngle = inLabels[0].angle;
      for(var i = 0; i < inLabels.length; i++) {
        var x = inLabels[i].x;
        var y = inLabels[i].y;
        var distance = Math.sqrt((x-xC) * (x-xC) + (y-yC) * (y-yC));
        if(distance < bestDistance) {
          bestIndex = i;
          bestX = x;
          bestY = y;
          bestDistance = distance;
          bestAngle = inLabels[i].angle;
        }
      }
      outLabels.push({x : bestX, y: bestY, angle: bestAngle});
    }
  },
  
  // point on line
 _belongs: function(xn, yn, xa, ya, xb, yb) {
   if(xb == xa && yb == ya) { // degradate to point
     return false;
   }
   // x
   if(xb > xa) { // x positive direction
     if(xn > xb || xn < xa) {
       return false;
     }
   } else { // x negative direction
     if(xn < xb || xn > xa) {
       return false;
     }
   }
   // y
   if(yb > ya) { // y positive direction
     if(yn > yb || yn < ya) {
       return false;
     }
   } else { // y negative direction
     if(yn < yb || yn > ya) {
       return false;
     }
   }
   return true;
   /*
   if( (xb >= xa && xa <= xn && xn <= xb) && (yb >= ya && ya <= yn && yn <= yb) ||
       (xa >= xb && xb <= xn && xn <= xa) && (ya >= yb && yb <= yn && yn <= ya) ) {
    return true;
  } else {
    return false;
  }
  */
 },
 
_angleAndShifts: function(xa, ya, xb, yb, shift, place, labelRotationValue) {
  // angle
  var dx = xb - xa;
  var dy = yb - ya;
  var ang = Math.atan2(dy, dx);
  while (ang > (Math.PI / 2)) {
    ang -= Math.PI;
  }
  while (ang < -(Math.PI / 2)) {
    ang += Math.PI;
  }
  var sin = Math.sin(ang);
  var cos = Math.cos(ang);
  // shifting
    var shsin = 0; // OnLine
    var shcos = 0;
    if(place == "Above") {
      shsin = shift * sin * this._scale;
      shcos = shift * cos * this._scale;
    }
    if(place == "Below") {
      shsin = - shift * sin * this._scale;
      shcos = - shift * cos * this._scale;
    }
    var result = [];
    result.angle = (labelRotationValue) ? -ang : 0;
    result.shiftX = - shsin;
    result.shiftY = shcos;
    return result;
},

/*
  _generatePolygonPositionsForOneLabel: function(fg, spatialReference, text, angle, halfTextWidth, halfTextHeight, labelCoordinates) {
      var stepX, stepY;
      var fgExt = fg.getExtent();
      // place many labels for this feature
      if(0.75 * (fgExt.xmax - fgExt.xmin) > this._map.width * this._scale ||
         0.75 * (fgExt.ymax - fgExt.ymin) > this._map.height * this._scale) { // switch to this algorithm when 0.75
        var centroid = this._findCentroidForFeature(fg);
        if(this._map.width * this._scale < fgExt.xmax - fgExt.xmin) {
          stepX = this._POLYGON_X_STEP_CONST * this._map.width * this._scale; // use screen size for getting stepX/Y
        } else {
          stepX = this._POLYGON_X_STEP_CONST * (fgExt.xmax - fgExt.xmin); // use extent for getting stepX/Y
        }
        if(this._map.height * this._scale < fgExt.ymax - fgExt.ymin ) {
          stepY = this._POLYGON_Y_STEP_CONST * this._map.height * this._scale; // use screen size for getting stepX/Y
        } else {
          stepY = this._POLYGON_Y_STEP_CONST * (fgExt.ymax - fgExt.ymin); // use extent for getting stepX/Y
        }
        var xBegin = centroid[0] - Math.round((centroid[0] - fgExt.xmin) / stepX) * stepX;
        var yBegin = centroid[1] - Math.round((centroid[1] - fgExt.ymin) / stepY) * stepY;
        var odd, x, y;
        odd = true;
        for(y = yBegin; y < fgExt.ymax; y += stepY ) { // yBegin + stepY/2
          odd = !odd;
          if(y < this._ymin || y > this._ymax) { // y out of screen
            continue;
          }
          var startAt = (odd) ? 0 : stepX/2;
          for(x = xBegin + startAt; x < fgExt.xmax; x += stepX ) {
            if(!this._labelLayer._isWithinScreenArea(new Extent(x, y, x, y, spatialReference))) {
              continue;
            }      
            if(!this._isPointWithinPolygon(text, fg, x, y)) {
              continue;
            }
            labelCoordinates.push({"x" : x, "y" : y});
          }
        }
      } else { // place one label for this feature
        centroid = this._findCentroidForFeature(fg);
        if(!this._labelLayer._isWithinScreenArea(new Extent(centroid[0], centroid[1], centroid[0], centroid[1], spatialReference))) {
          return;
        }
        //if(!this._isPointWithinRing(text, fg, centroid[0], centroid[1])) {
        //  return;
        //}
        labelCoordinates.push({"x" : centroid[0], "y" : centroid[1]});
      }
  },
  */
  
  _generatePolygonPositionsForManyLabels: function(fg, spatialReference, text, angle, halfTextWidth, halfTextHeight, labelCoordinates) {
    var stepX, stepY;
    var fgExt = this._calcRingExtent(fg);
    // place many labels for this feature
    if(0.75 * (fgExt.xmax - fgExt.xmin) > this._map.width * this._scale ||
       0.75 * (fgExt.ymax - fgExt.ymin) > this._map.height * this._scale) { // switch to this algorithm when 0.75
      var centroid = this._findCentroidForRing(fg);
      if(this._map.width * this._scale < fgExt.xmax - fgExt.xmin) {
        stepX = this._POLYGON_X_STEP_CONST * this._map.width * this._scale; // use screen size for getting stepX/Y
      } else {
        stepX = this._POLYGON_X_STEP_CONST * (fgExt.xmax - fgExt.xmin); // use extent for getting stepX/Y
      }
      if(this._map.height * this._scale < fgExt.ymax - fgExt.ymin ) {
        stepY = this._POLYGON_Y_STEP_CONST * this._map.height * this._scale; // use screen size for getting stepX/Y
      } else {
        stepY = this._POLYGON_Y_STEP_CONST * (fgExt.ymax - fgExt.ymin); // use extent for getting stepX/Y
      }
      var xBegin = centroid[0] - Math.round((centroid[0] - fgExt.xmin) / stepX) * stepX;
      var yBegin = centroid[1] - Math.round((centroid[1] - fgExt.ymin) / stepY) * stepY;
      var odd, x, y;
      odd = true;
      for(y = yBegin; y < fgExt.ymax; y += stepY ) { // yBegin + stepY/2
        odd = !odd;
        if(y < this._ymin || y > this._ymax) { // y out of screen
          continue;
        }
        var startAt = (odd) ? 0 : stepX/2;
        for(x = xBegin + startAt; x < fgExt.xmax; x += stepX ) {
          if(!this._labelLayer._isWithinScreenArea(new Extent(x, y, x, y, spatialReference))) {
            continue;
          }      
          if(!this._isPointWithinRing(text, fg, x, y)) {
            continue;
          }
          labelCoordinates.push({"x" : x, "y" : y});
        }
      }
    } else { // place one label for this feature
      centroid = this._findCentroidForRing(fg);
      // make N attemps shifting by: up down 2up 2down 3up 3down etc
      for(var d = 0; d < 10; d++) {
        var dd = ((d % 2) ? -1 : +1) * Math.floor(d/2); // generate 0, 1, -1, 2, -2, 3, -3, 4, -4
        var yShift = dd * halfTextHeight * this._scale;
        var xPosition = centroid[0];
        var yPosition = centroid[1] + yShift;
        // out of screen
        if(!this._labelLayer._isWithinScreenArea(new Extent(xPosition, yPosition, xPosition, yPosition, spatialReference))) {
          continue;
        }
        // out of ring
        if(!this._isPointWithinRing(text, fg, xPosition, yPosition)) {
          continue;
        }
        labelCoordinates.push({"x" : xPosition, "y" : yPosition});
        return; // found positon
      }
    }
  },
  
  _calcRingExtent: function(ring) {
    var i, extent;
    extent = new Extent(); // 'undefined' by default
    for(i = 0; i < ring.length - 1; i++) {
      var x = ring[i][0];
      var y = ring[i][1];
      if(extent.xmin === undefined || x < extent.xmin) {
        extent.xmin = x;
      }
      if(extent.ymin === undefined || y < extent.ymin) {
        extent.ymin = y;
      }
      if(extent.xmax === undefined || x > extent.xmax) {
        extent.xmax = x;
      }
      if(extent.ymax === undefined || y > extent.ymax) {
        extent.ymax = y;
      }
    }
    return extent;
  },
  
  // assume the polygon always closed
  _isPointWithinPolygon: function(text, bp, x, y) {
    var i;
    for (i = 0; i < bp.rings.length; i++) {
      var ring = bp.rings[i];
      if(this._isPointWithinRing(text, ring, x, y)) {
        return true;
      }
    }
    return false;
  },
  
  _isPointWithinRing: function(text, ring, x, y) {
    var i, xA, yA, xB, yB;
    var buffer = [];
    var len = ring.length;
    for (i = 0; i < len-1; i++) {
      xA = ring[i][0];
      yA = ring[i][1];
      xB = ring[i + 1][0];
      yB = ring[i + 1][1];
      if(xA == xB && yA == yB) { // exclude duplicated points
        continue;
      }
      // intersect with horizontal line at x
      if(yA == yB) {
        if(y == yA) {
          buffer.push(xA);
        } else {
          continue;
        }
      }
      if(xA == xB) { // vertical
        if(yA < yB && (y >= yA && y < yB)) { // to up
          buffer.push(xA);
        }
        if(yA > yB && (y <= yA && y > yB)) { // to down
          buffer.push(xA);
        }
      } else { // horizontal and skew
        var xN = (xB-xA)/(yB-yA) * (y-yA) + xA; // good for close-horizontal
        if(xA < xB && xN >= xA && xN < xB) { // upper semisphere
          buffer.push(xN);
        }
        if(xA > xB && xN <= xA && xN > xB) { // lower semisphere 
          buffer.push(xN);
        }
      }
    }
    // anylize buffer
    buffer.sort(function(a, b){ return a - b; });
    for (i = 0; i < buffer.length-1; i++) {
      xA = buffer[i];
      xB = buffer[i + 1];
      if(x >= xA && x < xB) {
        if(i % 2) {
          return false;
        } else {
          return true;
        }
      }
    }
    return false;
  },
  
  _findCentroidForRing: function(p) { // PointCollection
    var len = p.length;
    var centroid = [0,0];
    var area = 0;
    var xC = p[0][0];
    var yC = p[0][1];
    for (var i = 1; i < len - 1; i++) {
      var xA = p[i][0];
      var yA = p[i][1];
      var xB = p[i + 1][0];
      var yB = p[i + 1][1];
      var z = (xA - xC) * (yB - yC) - (xB - xC) * (yA - yC);
      centroid[0] += z * (xC + xA + xB);
      centroid[1] += z * (yC + yA + yB);
      area += z;
    }
    centroid[0] /= 3.0 * area;
    centroid[1] /= 3.0 * area;
    return centroid;
  },

  _findCentroidForFeature: function(bp) { // Polygon
    var area = 0;
    var centroid = [0,0];
    var maxlen = 0;
    for (var j = 0; j < bp.rings.length; j++) {
      var ring = bp.rings[j];
      var len = ring.length;
      maxlen += len;
      var xC = ring[0][0];
      var yC = ring[0][1];
      for (var i = 1; i < len - 1; i++) {
        var xA = ring[i][0];
        var yA = ring[i][1];
        var xB = ring[i + 1][0];
        var yB = ring[i + 1][1];
        var z = (xA - xC) * (yB - yC) - (xB - xC) * (yA - yC);
        centroid[0] += z * (xC + xA + xB);
        centroid[1] += z * (yC + yA + yB);
        area += z;
      }
    }
    centroid[0] /= 3.0 * area;
    centroid[1] /= 3.0 * area;
    return centroid;
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
    // take screen size 20% more 
//    var x5prc = 0.20 * (this._xmax - this._xmin);
//    var y5prc = 0.20 * (this._ymax - this._ymin);
//    var xmin5prc = this._xmin - x5prc;
//    var ymin5prc = this._ymin - y5prc;
//    var xmax5prc = this._xmax + x5prc;
//    var ymax5prc = this._ymax + y5prc;
//    if( x1 < xmin5prc || x1 > xmax5prc || y1 < ymin5prc || y1 > ymax5prc ) { // label center is out of screen
//      return false;
//    }
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
  }

  //
  //
  //////////////////////////////////////////////////////////////////////////////////////
  
  
  });

//  lang.mixin(dlLayer, dllEnums);
  
  
  
  return dlLayer;  

});

