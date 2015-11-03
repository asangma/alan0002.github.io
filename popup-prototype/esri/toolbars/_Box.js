define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/dom-style",

  "dojox/gfx/Moveable",
  "dojox/gfx/matrix",
  
  "../core/lang", 
  "../geometry/Point",
  "../geometry/Polyline",
  "../geometry/support/webMercatorUtils",
  "../geometry/support/jsonUtils",
  "../Graphic"
], function(

// Reading related to SVG non-scaling-stroke:
// http://stackoverflow.com/questions/3127973/svg-polyline-and-path-scaling-issue
// http://www.w3.org/TR/SVGTiny12/painting.html#NonScalingStroke
// http://stackoverflow.com/questions/1039714/svg-problems
// https://bugs.webkit.org/show_bug.cgi?id=31438
// https://bugzilla.mozilla.org/show_bug.cgi?id=528332
// http://code.google.com/p/svg-edit/wiki/BrowserBugs

  declare, lang, array, connect, domStyle,
  Moveable, matrix,
  esriLang, Point, Polyline, webMercatorUtils, jsonUtils, Graphic
) {
  var BOX = declare(null, {
    declaredClass: "esri.toolbars._Box",
    constructor: function(graphic, map, toolbar, scale, rotate, uniformScaling, isTextPoint) {
      this._graphic = graphic;
      this._map = map;
      this._toolbar = toolbar;
      this._scale = scale;
      this._rotate = rotate;
      this._defaultEventArgs = {};
      this._scaleEvent = "Scale";
      this._rotateEvent = "Rotate";
      this._uniformScaling = uniformScaling;
      
      // symbols
      var options = toolbar._options;
      this._markerSymbol = options.boxHandleSymbol; // new esri.symbol.SimpleMarkerSymbol();
      this._lineSymbol = options.boxLineSymbol; // new esri.symbol.SimpleLineSymbol();
      
      this._moveStartHandler = lang.hitch(this, this._moveStartHandler);
      this._firstMoveHandler = lang.hitch(this, this._firstMoveHandler);
      this._moveStopHandler = lang.hitch(this, this._moveStopHandler);
      this._moveHandler = lang.hitch(this, this._moveHandler);
      
      // if the graphic is a point or multipoint, many logic needs to change accordingly.
      this._isTextPoint = isTextPoint;
      this._init();
    },
    
    destroy: function() {
      this._cleanUp();
      this._graphic = this._map = this._toolbar = this._markerSymbol = this._lineSymbol = null;
    },
    
    refresh: function() {
      this._draw();
    },
    
    suspend: function() {
      array.forEach(this._getAllGraphics(), function(g) {
        g.hide();
      });
    },
    
    resume: function() {
      array.forEach(this._getAllGraphics(), function(g) {
        g.show();
      });

      this._draw();
    },
    
    /***************************
     * Events
     * 
     * Handled for Edit toolbar
     *   onScaleStart (graphic)
     *   onScaleFirstMove (graphic)
     *   onScale (graphic, info)
     *   onScaleStop (graphic, info)
     *   onRotateStart (graphic)
     *   onRotateFirstMove (graphic)
     *   onRotate (graphic, info)
     *   onRotateStop (graphic, info)
     ***************************/
    
    /*******************
     * Internal Methods
     *******************/
    
    _init: function() {
      this._draw();
    },
    
    _cleanUp: function() {
      if (this._connects) {
        // array.forEach(this._connects, connect.disconnect, dojo);
        array.forEach(this._connects, connect.disconnect);
      }

      var gLayer = this._toolbar._scratchGL;
      if (this._anchors) {
        array.forEach(this._anchors, function(info) {
          gLayer.remove(info.graphic);
          var mov = info.moveable;
          if (mov) {
            mov.destroy();
          }
        });
      }
      
      if (this._box) {
        gLayer.remove(this._box);
      }
      
      this._box = this._anchors = this._connects = null;
    },
    
    _draw: function() {
      if (!this._graphic.getDojoShape()) {
        this._cleanUp();
        return;
      }
      
      var map = this._map, gLayer = this._toolbar._scratchGL;
      var points = this._getBoxCoords();

      // Box
      var polyline = new Polyline(map.spatialReference);
      var path = lang.clone(array.filter(points, function(pt, index) {
        // remove rotor and midpoints
        return (index !== 8  && index % 2 === 0);
      }));
      if (path[0]) {
        path.push([ path[0][0], path[0][1] ]);
      }
      polyline.addPath(path);
      
      if (this._rotate) {
        polyline.addPath([points[1], points[8]]);
      }
      
      if (this._box) {
        // Update box
        this._box.setGeometry(polyline);
      }
      else {
        // Create box
        this._box = new Graphic(polyline, this._lineSymbol);
        gLayer.add(this._box);
      }
      
      // Anchors
      if (this._anchors) {
        // Update existing anchors
        array.forEach(this._anchors, function(info, index) {
          if (!this._scale) {
            index = 8;
          }
          
          // update geometry
          var point = new Point(points[index], map.spatialReference);
          info.graphic.setGeometry(point);
          
          // refresh moveable
          var mov = info.moveable, shape = info.graphic.getDojoShape();
          if (shape) {
            if (!mov) {
              info.moveable = this._getMoveable(info.graphic, index);
            }
            else if (shape !== mov.shape) {
              mov.destroy();
              info.moveable = this._getMoveable(info.graphic, index);
            }
          }
        }, this); // loop
      }
      else {
        // Create anchors
        this._anchors = [];
        this._connects = [];
        
        array.forEach(points, function(point, index) {
          if (!this._scale && index < 8) {
            return;
          }
          
          point = new Point(point, map.spatialReference);
          var anchor = new Graphic(point, this._markerSymbol);
          
          if (this._isTextPoint && index%2 === 1) {
            anchor.hide();
          }
          gLayer.add(anchor);
    
          this._anchors.push({ graphic: anchor, moveable: this._getMoveable(anchor, index) });
        }, this); // loop
      }
    },
    
    _getBoxCoords: function(returnScreen) {
      var map = this._map,
          bbox, points = [],
          pt, next, midpt;

      if (this._isTextPoint) {
        var textDomNode = this._graphic.getNode(),
            textDomRec = textDomNode.getBoundingClientRect(),
            mapRec = map.__container.getBoundingClientRect();
            
        bbox = [
          { x: textDomRec.left - mapRec.left, y: textDomRec.top - mapRec.top },
          { x: textDomRec.right - mapRec.left, y: textDomRec.top - mapRec.top },
          { x: textDomRec.right - mapRec.left, y: textDomRec.bottom - mapRec.top },
          { x: textDomRec.left - mapRec.left, y: textDomRec.bottom - mapRec.top }
        ];
      }
      else {
        var graphic = this._graphic;
        bbox = this._getTransformedBoundingBox(graphic);
      }
      
      array.forEach(bbox, function(coord, index, arr) {
        pt = coord;
        
        // midpoint
        next = arr[index + 1];
        if (!next) {
          next = arr[0];
        }
        midpt = { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 };

        if (!returnScreen) {
          pt = map.toMap(pt);
          midpt = map.toMap(midpt);
        }

        points.push([ pt.x, pt.y ]);
        points.push([ midpt.x, midpt.y ]);
      });

      if (this._rotate) {
        var rotorPoint = lang.clone(points[1]);
        rotorPoint = returnScreen ? 
                      { x: rotorPoint[0], y: rotorPoint[1] } : 
                      map.toScreen({ x: rotorPoint[0], y: rotorPoint[1], spatialReference: map.spatialReference });
                      
        rotorPoint.y -= this._toolbar._options.rotateHandleOffset;
        
        if (!returnScreen) {
          rotorPoint = map.toMap(rotorPoint);
        }
        
        points.push([ rotorPoint.x, rotorPoint.y ]);
      }
      
      return points;
    },
    
    _getTransformedBoundingBox: function(graphic) {
      // When map wrapping is enabled, Shape::getTransformedBoundingBox
      // will not help. Let's do it at geometry level for all browsers
      
      //if (dojo.isIE) {
        // Normally we dont need this routine, but we've overridden
        // GFX path in VML using esri.gfx.Path impl. This prevents
        // GFX from having the necessary data to compute transformed
        // bounding box
        var map = this._map,
            extent = graphic.geometry.getExtent(),
            geomSR = graphic.geometry.spatialReference,
            topLeft = new Point(extent.xmin, extent.ymax, geomSR),
            bottomRight = new Point(extent.xmax, extent.ymin, geomSR);
        
        topLeft = map.toScreen(topLeft);
        bottomRight = map.toScreen(bottomRight);
        
        return [
          { x: topLeft.x, y: topLeft.y },
          { x: bottomRight.x, y: topLeft.y },
          { x: bottomRight.x, y: bottomRight.y },
          { x: topLeft.x, y: bottomRight.y }
        ];
      /*}
      else {
        return graphic.getDojoShape().getTransformedBoundingBox();
      }*/
    },
    
    _getAllGraphics: function() {
      var graphics = [ this._box ];
      
      if (this._anchors) {
        array.forEach(this._anchors, function(anchor) {
          graphics.push(anchor.graphic);
        });
      }
      
      graphics = array.filter(graphics, esriLang.isDefined);
      return graphics;
    },
    
    _getMoveable: function(anchor, index) {
      var shape = anchor.getDojoShape();
      if (!shape) {
        return;
      }
      
      var moveable = new Moveable(shape);
      moveable._index = index;
      // 0 - TL, 2 - TR, 4 - BR, 6 - BL
      // 1 - (TL+TR)/2, 3 - (TR+BR)/2, 5 - (BR+BL)/2, 7 - (BL+TR)/2
      // 8 - RotateHandle
      
      this._connects.push(connect.connect(moveable, "onMoveStart", this._moveStartHandler));
      this._connects.push(connect.connect(moveable, "onFirstMove", this._firstMoveHandler));
      this._connects.push(connect.connect(moveable, "onMoveStop", this._moveStopHandler));
      
      // We dont want to move the anchor itself.
      // See: dojox.gfx.Moveable::onMove method
      // So, override Moveable's onMove impl
      moveable.onMove = this._moveHandler;
      
      var node = shape.getEventSource();
      if (node) {
        domStyle.set(node, "cursor", this._toolbar._cursors["box" + index]);
      }
      
      return moveable;
    },
    
    _moveStartHandler: function(mover) {
      this._toolbar["on" + (mover.host._index === 8 ? this._rotateEvent : this._scaleEvent) + "Start"](this._graphic);
    },
    
    _firstMoveHandler: function(mover) {
      //console.log("START: ", mover);
      var index = mover.host._index, wrapOffset = (this._wrapOffset = mover.host.shape._wrapOffsets[0] || 0),
          surfaceTx = this._graphic.getLayer()._div.getTransform(), mx = matrix,
          moverCoord, anchorCoord, boxCenter,
          coords = array.map(this._getBoxCoords(true), function(arr) {
            return { x: arr[0] + wrapOffset, y: arr[1] };
          });
      if (this._isTextPoint) {
        boxCenter = this._map.toScreen(this._graphic.geometry);
      }
      else {
        boxCenter = { x: coords[1].x, y: coords[3].y };
      }
      this._centerCoord = mx.multiplyPoint(mx.invert(surfaceTx), boxCenter);

      if (index === 8) {
        // Rotate
        moverCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[1]);
        if (this._isTextPoint) {
          //when the anchor point is from a geometry, such as the case isTextPoint,
          //the point has been normalized, it needs to "denormalize" here.
          this._centerCoord = this._deNormalizePoint(this._centerCoord, moverCoord);
        }
        this._startLine = [ this._centerCoord, moverCoord ];
        this._moveLine = lang.clone(this._startLine);
      }
      else {
        // Scale
        moverCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[index]);
        anchorCoord = mx.multiplyPoint(mx.invert(surfaceTx), coords[(index + 4) % 8]);
        if (this._isTextPoint) {
          //when the anchor point is from a geometry, such as the case isTextPoint,
          //the point has been normalized, it needs to "denormalize" here.
          this._centerCoord = this._deNormalizePoint(this._centerCoord, moverCoord);
        }
        this._firstMoverToAnchor = Math.sqrt((moverCoord.x-this._centerCoord.x)*(moverCoord.x-this._centerCoord.x) + (moverCoord.y-this._centerCoord.y)*(moverCoord.y-this._centerCoord.y));
        this._startBox = anchorCoord;
        this._startBox.width = (coords[4].x - coords[0].x);
        this._startBox.height = (coords[4].y - coords[0].y);
        this._moveBox = lang.clone(this._startBox);
        
        this._xfactor = moverCoord.x > anchorCoord.x ? 1 : -1;
        this._yfactor = moverCoord.y > anchorCoord.y ? 1 : -1;
        if (index === 1 || index === 5) {
          this._xfactor = 0;
        }
        else if (index === 3 || index === 7) {
          this._yfactor = 0;
        }
      }
      
      this._toolbar._beginOperation("BOX");
      this._toolbar["on" + (index === 8 ? this._rotateEvent : this._scaleEvent) + "FirstMove"](this._graphic);
    },
    
    _moveHandler: function(mover, shift) {
      var index = mover.host._index, args = this._defaultEventArgs,
          start, move, tx, pt, angle, xscale, yscale, anchor, movingPtX, movingPtY, moverToAnchor;
      
      args.angle = 0;
      args.scaleX = 1;
      args.scaleY = 1;
      
      if (index === 8) {
        // Rotate
        start = this._startLine;
        move = this._moveLine;
        pt = move[1];
        pt.x += shift.dx;
        pt.y += shift.dy;
        angle = this._getAngle(start, move);
        
        if (this._isTextPoint) {
          angle += this._graphic.symbol.angle;
        }
        tx = matrix.rotategAt(angle, start[0]);
        this._graphic.getDojoShape().setTransform(tx);

        args.transform = tx;
        args.angle = angle;
        args.around = start[0];
      }
      else {
        // Scale
        start = this._startBox;
        move = this._moveBox;
        move.width += (shift.dx * this._xfactor);
        move.height += (shift.dy * this._yfactor);
        if (this._uniformScaling || this._isTextPoint) {
          movingPtX = move.x + this._xfactor*move.width;
          movingPtY = move.y + this._yfactor*move.height;
          moverToAnchor = Math.sqrt((movingPtX-this._centerCoord.x)*(movingPtX-this._centerCoord.x) + (movingPtY-this._centerCoord.y)*(movingPtY-this._centerCoord.y));        
          this._scaleRatio = xscale = yscale = moverToAnchor/this._firstMoverToAnchor;
          anchor = this._centerCoord;
        }
        else {
          xscale = move.width / start.width;
          yscale = move.height / start.height;
          anchor = {x: start.x, y: start.y};
        }
        // Avoid NaNs or Infinitys for scale factors
        if (isNaN(xscale) || xscale === Infinity || xscale === -Infinity) {
          xscale = 1;
        }
        if (isNaN(yscale) || yscale === Infinity || yscale === -Infinity) {
          yscale = 1;
        }
        
        tx = matrix.scaleAt(xscale, yscale, anchor);
        if (this._isTextPoint) {
          //rotation has not been persisteed. 
          //this is a fix
          var rotateTx = matrix.rotategAt(this._graphic.symbol.angle, anchor);
          this._graphic.getDojoShape().setTransform([rotateTx, tx]);
        }
        else {
          this._graphic.getDojoShape().setTransform(tx);
        }

        args.transform = tx;
        args.scaleX = xscale;
        args.scaleY = yscale;
        args.around = anchor;
      }
      
      this._toolbar["on" + (index === 8 ? this._rotateEvent : this._scaleEvent)](this._graphic, args);
    },
    
    _moveStopHandler: function(mover) {
      //console.log("END");
      var graphic = this._graphic,
          toolbar = this._toolbar,
          geometry = toolbar._geo ? 
                      webMercatorUtils.geographicToWebMercator(graphic.geometry) : 
                      graphic.geometry,
          geomSR = geometry.spatialReference,
          shape = graphic.getDojoShape(), transform = shape.getTransform(),
          surfaceTx = graphic.getLayer()._div.getTransform(),
          updatedTextSymbol;
      
      if (this._isTextPoint) {
        updatedTextSymbol = this._graphic.symbol;
        if (mover.host._index === 8) {
          updatedTextSymbol.angle += this._getAngle(this._startLine, this._moveLine);
        }
        else {
          //this is a scaling
          updatedTextSymbol.font.setSize(
            //font.size is always a number, representing in "px"
            Math.round((updatedTextSymbol.font.size * this._scaleRatio)*100)/100
          );
        }
        
        //apply rotation/scaling permanent.
        this._graphic.setSymbol(updatedTextSymbol);
      }
      else {
        geometry = geometry.toJSON();
      
        // update geometry
        this._updateSegments(geometry.paths || geometry.rings, transform, surfaceTx, geomSR);
        shape.setTransform(null);
      
        geometry = jsonUtils.fromJSON(geometry);
      
        graphic.setGeometry(
          toolbar._geo ?
            webMercatorUtils.webMercatorToGeographic(geometry, true) : 
            geometry
        );
      }
      // redraw box
      this._draw();
      
      // reset state
      this._startBox = this._moveBox = this._xfactor = this._yfactor = null;
      this._startLine = this._moveLine = null;
      
      toolbar._endOperation("BOX");
      this._defaultEventArgs.transform = transform;
      toolbar["on" + (mover.host._index === 8 ? this._rotateEvent : this._scaleEvent) + "Stop"](this._graphic, this._defaultEventArgs);
    },
    
    _updateSegments: function(segments, transform, surfaceTx, geomSR) {
      var mx = matrix, map = this._map, wrapOffset = this._wrapOffset || 0;
      
      array.forEach(segments, function(segment) {
        array.forEach(segment, function(point) {
          this._updatePoint(point, geomSR, wrapOffset, mx, map, surfaceTx, transform);
        }, this);
      }, this);
    },
    
    _updatePoint: function(point, geomSR, wrapOffset, mx, map, surfaceTx, transform) {
      var screenPt = map.toScreen({ x: point[0], y: point[1], spatialReference: geomSR }, /*doNotRound*/ true);
      screenPt.x += wrapOffset;
      // This is same as multiplying in this sequence:
      // 1. multiply with mx.invert(surfaceTx)
      // 2. multiply with transform
      // 3. multiply with surfaceTx
      screenPt = mx.multiplyPoint([surfaceTx, transform, mx.invert(surfaceTx)], screenPt);
      screenPt.x -= wrapOffset;
      
      var mapPt = map.toMap(screenPt);
      // Update in-place
      point[0] = mapPt.x;
      point[1] = mapPt.y;
    },
    
    _getAngle: function(line1, line2) {
      /*// points
      var p1 = line1[0], p2 = line1[1];
      var p3 = line2[0], p4 = line2[1];
      
      // 2D corrdinates
      var x1 = p1.x, y1 = p1.y;
      var x2 = p2.x, y2 = p2.y;
      var x3 = p3.x, y3 = p3.y;
      var x4 = p4.x, y4 = p4.y;

      // Deltas
      var dx1 = x2 - x1, dy1 = y2 - y1;
      var dx2 = x4 - x3, dy2 = y4 - y3;
      
      var dot = (dx1 * dx2) + (dy1 * dy2);
      var l2 = (dx1 * dx1 + dy1 * dy1) * (dx2 * dx2 + dy2 * dy2);
      
      var angle = Math.acos(dot / Math.sqrt(l2)) * 180 / Math.PI;
      //console.log(angle);
      return angle;*/
     
      /*var m1 = this.slope(line1[0], line1[1]);
      var m2 = this.slope(line2[0], line2[1]);
      var angle = Math.atan((m1 - m2) / (1 - (m1 * m2))) * 180 / Math.PI;
      console.log(angle);
      return angle;*/
     
      var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x) * 180 / Math.PI,
          angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x) * 180 / Math.PI;
      return angle2 - angle1;
    },
    
    _deNormalizePoint: function(screenPt, refPt){
      var mapFrame = this._map._getFrameWidth();
      if (mapFrame === -1) {
        //This is not a wraparound180 map
        return screenPt;
      }
      var deNormalizedPt = {x: screenPt.x, y: screenPt.y};

      while (Math.abs(deNormalizedPt.x - refPt.x) >= mapFrame) {
        if (deNormalizedPt.x < refPt.x) {
          deNormalizedPt.x += mapFrame;
        }
        else {
          deNormalizedPt.x -= mapFrame;
        }
      }
          
      var shortest = Math.abs(deNormalizedPt.x - refPt.x);
      if (Math.abs(deNormalizedPt.x - refPt.x + mapFrame) < shortest) {
        deNormalizedPt.x += mapFrame;
      }
      else if (Math.abs(deNormalizedPt.x - refPt.x - mapFrame) < shortest) {
        deNormalizedPt.x -= mapFrame;
      }
      
      return deNormalizedPt;
    }
  });

  

  return BOX;
});
