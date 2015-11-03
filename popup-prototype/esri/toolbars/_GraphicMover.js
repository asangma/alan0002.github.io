define(
[
  "../core/declare",
  "dojo/_base/connect",
  "dojo/dom-style",

  "dojox/gfx/Moveable",
  "dojox/gfx/Mover",
  "dojox/gfx/matrix",
  
  "../geometry/support/webMercatorUtils",
  "../geometry/ScreenPoint",
  "../geometry/Point"
], function(
  declare, connect, domStyle, Moveable, Mover, matrix,
  webMercatorUtils, ScreenPoint, Point
) {
  var GM = declare(null, {
    declaredClass: "esri.toolbars._GraphicMover",
    constructor: function(graphic, map, toolbar, tempPt) {
      this.graphic = graphic;
      this.map = map;
      this.toolbar = toolbar;
      this.tempPt = tempPt;
      
      this._enableGraphicMover();
      this._moved = false;
    },
    
    refresh: function(force) {
      var shape = this.graphic.getDojoShape();
      
      if (shape && (force || !shape._hostGraphic)) { // just clipped-in?
        //console.log("_GraphicMover - refresh");
        this._disableGraphicMover();
        this._enableGraphicMover();
      }
    },
    
    destroy: function() {
      this._disableGraphicMover();
    },
    
    hasMoved: function() {
      return this._moved;
    },
    
    /***************************
     * Events
     * 
     * Handled for Edit toolbar
     *   onGraphicMoveStart (graphic)
     *   onGraphicFirstMove (graphic)
     *   onGraphicMove (graphic, transform)
     *   onGraphicMoveStop (graphic, transform)
     *   onGraphicClick (graphic, info)
     ***************************/
    
    /*******************
     * Internal Methods
     *******************/
    
    _enableGraphicMover: function() {
      var graphic = this.graphic,
          dojoShape = graphic.getDojoShape();
      
      if (dojoShape) {
        dojoShape._hostGraphic = graphic;
        this._moveable = new Moveable(dojoShape, { mover: GM.Mover });
        this._moveStartHandle = connect.connect(this._moveable, "onMoveStart", this, this._moveStartHandler);
        this._firstMoveHandle = connect.connect(this._moveable, "onFirstMove", this, this._firstMoveHandler);
        this._movingHandle = connect.connect(this._moveable, "onMoving", this, this._movingHandler);
        this._moveStopHandle = connect.connect(this._moveable, "onMoveStop", this, this._moveStopHandler);
        
        var node = dojoShape.getEventSource();
        if (node) {
          domStyle.set(node, "cursor", this.toolbar._cursors.move);
        }
      }
    },
    
    _disableGraphicMover: function() {
      var moveable = this._moveable;
      if (moveable) {
        connect.disconnect(this._moveStartHandle);
        connect.disconnect(this._firstMoveHandle);
        connect.disconnect(this._movingHandle);
        connect.disconnect(this._moveStopHandle);
        
        var shape = moveable.shape;
        if (shape) {
          shape._hostGraphic = null;
        
          var node = shape.getEventSource();
          if (node) {
            domStyle.set(node, "cursor", null);
          }
        }
        
        moveable.destroy();
      }
      this._moveable = null;
    },
    
    _moveStartHandler: function() {
      var graphic = this.graphic,
          map = this.map;
      
      this._startTx = graphic.getDojoShape().getTransform();
      
      if (this.graphic.geometry.type === "point") {
        if (map.snappingManager) {
          map.snappingManager._setUpSnapping();
        }
      }
      //console.log(dojo.toJson(this._startTx));
      this.toolbar.onGraphicMoveStart(graphic);
    },
    
    _firstMoveHandler: function() {
      //this.constructor.onFirstMove(this);
      this.toolbar._beginOperation("MOVE");
      this.toolbar.onGraphicFirstMove(this.graphic);
    },
    
    _movingHandler: function(mover) {
      var transform = mover.shape.getTransform();
      if (this.tempPt) {
        this.tempPt.getDojoShape().setTransform(transform);
      }
      this.toolbar.onGraphicMove(this.graphic, transform);
    },
    
    _moveStopHandler: function(mover) {
      //console.log("_moveStopHandler");
      var graphic = /*evt.graphic*/ /*this._moveable.shape._hostGraphic*/ this.graphic,
          toolbar = this.toolbar,
          map = this.map,
          mx = matrix,
          geometry = toolbar._geo ? 
                      webMercatorUtils.geographicToWebMercator(graphic.geometry) : 
                      graphic.geometry,
          type = geometry.type,
          dojoShape = graphic.getDojoShape(),
          tx = dojoShape.getTransform();
      //console.log(JSON.stringify(tx));
      
      //if (!tx || !tx.dx && !tx.dy) {
      if ( JSON.stringify(tx) !==  JSON.stringify(this._startTx) ) {
        this._moved = true;
        
        switch(type) {
          case "point":
            //var newMapPt = map.toMap(map.toScreen(firstPt).offset(tx.dx, tx.dy));          
            var pointMatrix = [ tx, mx.invert(this._startTx) ],
                snappingPoint;
            
            if (map.snappingManager) {
              snappingPoint = map.snappingManager._snappingPoint;
            }
            
            geometry = snappingPoint || 
                       map.toMap(mx.multiplyPoint(pointMatrix, map.toScreen(geometry, /*doNotRound*/ true)));
            
            if(map.snappingManager) {
              map.snappingManager._killOffSnapping();
            }
            break;
          case "polyline":
            geometry = this._updatePolyGeometry(geometry, geometry.paths, tx);
            break;
          case "polygon":
            geometry = this._updatePolyGeometry(geometry, geometry.rings, tx);
            break;
        }
        
        dojoShape.setTransform(null);
        
        graphic.setGeometry(
          toolbar._geo ?
            webMercatorUtils.webMercatorToGeographic(geometry, true) : 
            geometry
        );
        
        if (this.tempPt) {
          this.tempPt.setGeometry(new Point(graphic.geometry.toJSON()));
        }
      }
      else {
        this._moved = false;
      }
      
      //this.constructor.onMoveStop(this);
      toolbar._endOperation("MOVE");
      toolbar.onGraphicMoveStop(graphic, tx);
      
      if (!this._moved) {
        var e = mover.__e,
            mapPosition = this.map.position,
            pt = new ScreenPoint(e.pageX - mapPosition.x, e.pageY - mapPosition.y);
        
        toolbar.onGraphicClick(graphic, { screenPoint: pt, mapPoint: this.map.toMap(pt) });
      }
    },
    
    _updatePolyGeometry: function(geometry, /*rings or paths*/ segments, transform) {
      var map = this.map,
          firstPt = geometry.getPoint(0, 0),
          newMapPt = map.toMap(map.toScreen(firstPt).offset(transform.dx, transform.dy)),
          d_mapX = newMapPt.x - firstPt.x,
          d_mapY = newMapPt.y - firstPt.y,
          i, j, seg, point;
    
      //var rings = geometry.rings;
      for (i = 0; i < segments.length; i++) {
        seg = segments[i];
        
        for (j = 0; j < seg.length; j++) {
          point = geometry.getPoint(i, j);
          geometry.setPoint(i, j, point.offset(d_mapX, d_mapY));
        }
      }
      return geometry;
    }
  });

  // ALERT
  // We extend the gfx mover here so that we can record
  // the last event and extract the screen point out of it
  // for the onGraphicClick event
  // Need a keep an eye on the constructor signature for
  // dojox.gfx.Mover at every dojo release
  GM.Mover = declare(Mover, {
    declaredClass: "esri.toolbars._Mover",
    constructor: function(shape, e, host) {
      this.__e = e;
    }
  });

  

  return GM;
});
