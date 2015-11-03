define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/Color",
  "dojo/has",
  
  "./_toolbar",
  "../core/undoManager",
  "../core/OperationBase",

  "../geometry/Extent",
  "../geometry/Rect",

  "../symbols/SimpleLineSymbol",
  "../symbols/SimpleFillSymbol",
  "../Graphic"
], function(
  declare, lang, connect, Color, has,
  Toolbar, UndoManager, OperationBase,
  Extent, Rect,
  SimpleLineSymbol, SimpleFillSymbol, Graphic
) {
  var NAV = declare(Toolbar, {
    declaredClass: "esri.toolbars.Navigation",
    _eventMap: {
      "extent-history-change": true
    },
    constructor: function(/*esri.Map*/ map) {
      this.zoomSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2), new Color([0,0,0,0.25]));
      connect.connect(map, "onUnload", this, "_cleanUp");
      this.map = map;
      this._undoManager = new UndoManager({maxOperations:-1});
      this._normalizeRect = lang.hitch(this, this._normalizeRect);
      this._onMouseDownHandler = lang.hitch(this, this._onMouseDownHandler);
      this._onMouseUpHandler = lang.hitch(this, this._onMouseUpHandler);
      this._onMouseDragHandler = lang.hitch(this, this._onMouseDragHandler);
      
      this._swipeCheck = has("esri-pointer");
      
      this._onExtentChangeHandler_connect = connect.connect(map, "onExtentChange", this, "_extentChangeHandler");
      this._onMapLoad_connect = connect.connect(map, "onLoad", this, "_mapLoadHandler");
      if (map.loaded && map.extent) {        
        this._currentExtent = map.extent;
      }
    },
    
    _mapLoadHandler: function(){
      this._currentExtent = this.map.extent;
    },

    _navType: null,
    _start: null,
    _graphic: null,
    _prevExtent: false,
    _currentExtent: null,
    _preExtent: null,
    
    _cleanUp: function(map) {
      connect.disconnect(this._onExtentChangeHandler_connect);
      connect.disconnect(this._onMapLoad_connect);
    },

    activate: function(navType) {
      var map = this.map;
      if (! this._graphic) {
        this._deactivateMapTools(true, false, false, true);
//        var ext = map.extent;
//        this._graphic = map.graphics.add(new esri.Graphic(new esri.geometry.Rect(ext.xmin, ext.ymax, 1, 1, map.spatialReference), this.zoomSymbol), true);
//        this._graphic.hide();
        this._graphic = new Graphic(null, this.zoomSymbol);
      }

      switch (navType) {
        case NAV.ZOOM_IN:
        case NAV.ZOOM_OUT:
          this._deactivate();
          if(this._swipeCheck){
            this._onMouseDownHandler_connect = connect.connect(map, "onSwipeStart", this, "_onMouseDownHandler");
            this._onMouseDragHandler_connect = connect.connect(map, "onSwipeMove", this, "_onMouseDragHandler");
            this._onMouseUpHandler_connect = connect.connect(map, "onSwipeEnd", this, "_onMouseUpHandler");
          }else{
            this._onMouseDownHandler_connect = connect.connect(map, "onMouseDown", this, "_onMouseDownHandler");
            this._onMouseDragHandler_connect = connect.connect(map, "onMouseDrag", this, "_onMouseDragHandler");
            this._onMouseUpHandler_connect = connect.connect(map, "onMouseUp", this, "_onMouseUpHandler");
          }
          this._navType = navType;
          break;
//        case esri.toolbars.Navigation.ZOOM_FULL_EXTENT:
//          map.setExtent(map.getLayer(map.layerIds[0]).initialExtent);
//          break;
        case NAV.PAN:
          this._deactivate();
          map.enablePan();
          this._navType = navType;
          break;
//        case esri.toolbars.Navigation.ZOOM_PREV_EXTENT:
//          this._prevExtent = true;
//          break;
//        case esri.toolbars.Navigation.ZOOM_NEXT_EXTENT:
//          this._nextExtent = true;
//          break;
      }
    },
    
    _extentChangeHandler: function(extent) {
      if (this._prevExtent || this._nextExtent) {
        this._currentExtent = extent;
      }
      else {
        this._preExtent = this._currentExtent;
        this._currentExtent = extent;
        if (this._preExtent && this._currentExtent) {
          var extentChangeOperation = new NAV.MapExtent({map: this.map, preExtent: this._preExtent, currentExtent: this._currentExtent});
          this._undoManager.add(extentChangeOperation);
        }
      }
      this._prevExtent = this._nextExtent = false;
      this.onExtentHistoryChange();
    },

    _deactivate: function() {
      var _nav = this._navType;
      if (_nav === NAV.PAN) {
        this.map.disablePan();
      }
      else if (_nav === NAV.ZOOM_IN || _nav === NAV.ZOOM_OUT) {
        connect.disconnect(this._onMouseDownHandler_connect);
        connect.disconnect(this._onMouseDragHandler_connect);
        connect.disconnect(this._onMouseUpHandler_connect);
      }
    },

    _normalizeRect: function(start, end, spatialReference) {
      var sx = start.x,
          sy = start.y,
          ex = end.x,
          ey = end.y,
          width = Math.abs(sx - ex),
          height = Math.abs(sy - ey);
      return { x:Math.min(sx, ex), y:Math.max(sy, ey), width:width, height:height, spatialReference:spatialReference };
    },

    _onMouseDownHandler: function(evt) {
      this._start = evt.mapPoint;
      
//      var map = this.map,
//          start = (this._start = evt.mapPoint),
//          _g = this._graphic;
//      _g.setGeometry(dojo.mixin(_g.geometry, this._normalizeRect(this._start, evt.mapPoint, this.map.spatialReference)));
//      this._graphic.show();
    },

    _onMouseDragHandler: function(evt) {
//      var _g = this._graphic;
//      _g.setGeometry(dojo.mixin(_g.geometry, this._normalizeRect(this._start, evt.mapPoint, this.map.spatialReference)));

      var graphic = this._graphic, graphicsLayer = this.map.graphics;
      graphicsLayer.remove(graphic, true);
      graphic.setGeometry(new Rect(this._normalizeRect(this._start, evt.mapPoint, this.map.spatialReference)));
      graphicsLayer.add(graphic, true);
    },

    _onMouseUpHandler: function(evt) {
      var map = this.map,
          rect = this._normalizeRect(this._start, evt.mapPoint, map.spatialReference);
//      this._graphic.hide();

      map.graphics.remove(this._graphic, true);

      if (rect.width === 0 && rect.height === 0) {
        return;
      }

      if (this._navType === NAV.ZOOM_IN) {
        map.setExtent(new Rect(rect).getExtent());
      }
      else {
        var tl = map.toScreen(rect),
            tr = map.toScreen({x: rect.x + rect.width, y: rect.y, spatialReference:map.spatialReference}),

            mapWidth = map.extent.getWidth(),
            newWidth = (mapWidth * map.width) / Math.abs(tr.x - tl.x),
            deltaW = (newWidth - mapWidth) / 2,
  
            ext = map.extent;
        map.setExtent(new Extent(ext.xmin - deltaW,
                                              ext.ymin - deltaW,
                                              ext.xmax + deltaW,
                                              ext.ymax + deltaW,
                                              ext.spatialReference));
      }
    },

    deactivate: function() {
      this._deactivate();
      
      if (this._graphic) {
        this.map.graphics.remove(this._graphic, true);
      }
      this._navType = this._start = this._graphic = null;
      this._activateMapTools(true, false, false, true);
    },
    
    setZoomSymbol: function(zoomSymbol) {
      this.zoomSymbol = zoomSymbol;
    },

    isFirstExtent: function() {
      return !this._undoManager.canUndo;
    },

    isLastExtent: function() {
      return !this._undoManager.canRedo;
    },
    
    zoomToFullExtent: function() {
      var map = this.map;
      map.setExtent(map.getLayer(map.layerIds[0]).initialExtent);
    },
    
    zoomToPrevExtent: function() {
      if (!this._undoManager.canUndo) {
        return;
      }      
      this._prevExtent = true;
      this._undoManager.undo();
    },
    
    zoomToNextExtent: function() {
      if (!this._undoManager.canRedo) {
        return;
      }      
      this._nextExtent = true;
      this._undoManager.redo();
    },
    
    onExtentHistoryChange: function() {
      //event fired on extent history change
      //boolean: false if last extent in extent history
    }
  });

  lang.mixin(NAV, {
    ZOOM_IN: "zoomin", ZOOM_OUT: "zoomout", PAN: "pan"
    //ZOOM_FULL_EXTENT: "zoomfullextent", ZOOM_PREV_EXTENT: "zoomprevextent", ZOOM_NEXT_EXTENT: "zoomnextextent"
  });

  NAV.MapExtent = declare(OperationBase, {
    declaredClass: "esri.toolbars.MapExtent",
    label: "extent changes",
    constructor: function (params) {
      this.map = params.map;
      this.preExtent = params.preExtent;
      this.currentExtent = params.currentExtent;
    },
    
    performRedo: function () {
      this.map.setExtent(this.currentExtent);
    },
    
    performUndo: function () {
      this.map.setExtent(this.preExtent);
    }
  });

  

  return NAV;
});
