define(
[
  "require",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/array",
  "dojo/_base/Color",
  "dojo/dom-construct",
  "dojo/dom-style",
  
  "../core/lang", 
  "../core/sniff",
  
  "./_toolbar",
  "./_Box",
  "./_GraphicMover",
  "./_VertexEditor",
  "./TextEditor",

  "../symbols/SimpleMarkerSymbol",
  "../symbols/SimpleLineSymbol",
  "../symbols/TextSymbol",
  "../Graphic"
], function(
  require, declare, lang, connect, array, Color, domConstruct, domStyle,
  esriLang, esriSniff, 
  Toolbar, Box, GraphicMover, VertexEditor, TextEditor,
  SimpleMarkerSymbol, SimpleLineSymbol, TextSymbol, Graphic
) {
  // TODO
  // [haitham] vertex move stop is fired when right-clicking on a vertex
  // [DONE] arguments for onVertexClick etc for interpolated vertices
  // [DONE] support multiple rings and paths
  // DEL after clicking a vertex can delete the vertex
  // ESC while moving a vertex or ghost vertex should cancel the current move
  // optimize vertex movers by not creating moveable until mouseover
  // add a point to multipoint
  // context sensitive cursors
  // undo/redo methods
  // [DONE] Double click event for GL
  // [GL?] moving a graphic in MOVE mode, fires graphic click at the end of move (http://pponnusamy.esri.com:9090/jsapi/mapapps/prototypes/editing/test-click-to-change.html)
  //   - this problem is tough to solve when using moveable
  // [DONE] remove vertices
  // [DONE] vertex selection/unselection or just click?
  // [DONE] context menu for vertices
  var EDT = declare(Toolbar, {
    declaredClass: "esri.toolbars.Edit",
    constructor: function(/*esri.Map*/ map, /*Object?*/ options) {
      //console.log("edit toolbar constructor");
      this._map = map;
      this._tool = 0;

      //this._scratchGL = new esri.layers.GraphicsLayer();
      //map.addLayer(this._scratchGL);
      if (this._map.loaded) {
        this._scratchGL = map.graphics;
      }
      else {
        var loadHandle = connect.connect(this._map, "onLoad", this, function() {
          connect.disconnect(loadHandle);
          loadHandle = null;
          this._scratchGL = this._map.graphics;
        });      
      }
      // default options
      var touch = esriSniff("esri-touch") || esriSniff("esri-pointer");
      
      this._defaultOptions = lang.mixin({
        vertexSymbol: new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 
          touch ? 20 : 12, 
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0.5]), 1), 
          new Color([128, 128, 128])
        ),
        ghostVertexSymbol: new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 
          touch ? 18 : 10, 
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0.5]), 1), 
          new Color([255, 255, 255, 0.75])
        ),
        ghostLineSymbol: new SimpleLineSymbol(SimpleLineSymbol.STYLE_DOT, new Color([128, 128, 128]), 2),
        allowDeleteVertices: true,
        allowAddVertices: true,
        
        rotateHandleOffset: touch ? 24 : 16,
        boxLineSymbol: new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([64, 64, 64]), 1),
        boxHandleSymbol: new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_SQUARE, 
          touch ? 16 : 9, 
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0.5]), 1), 
          new Color([255, 255, 255, 0.75])
        ),
        textAnchorSymbol: new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10, null, new Color([255,0,0]))
      }, options || {});    
    },
    
    /*****************
     * Public Methods
     *****************/
    
    activate: function(/*Number*/ tool, /*esri.Graphic*/ graphic, /*Object?*/ options) {
      //console.log("Activate");
      this.deactivate();
      
      this._graphic = graphic;
      this._options = lang.mixin(lang.mixin({}, this._defaultOptions), options || {});

      var MOVE = EDT.MOVE,
          EDIT = EDT.EDIT_VERTICES,
          SCALE = EDT.SCALE,
          ROTATE = EDT.ROTATE,
          TEXT = EDT.EDIT_TEXT,
          move = false, edit = false, box = false, text = false,
          map = this._map,
          mapSR = map.spatialReference,
          geomSR = graphic.geometry.spatialReference;

      this._geo = !!(
        mapSR && geomSR && 
        !mapSR.equals(geomSR) && 
        mapSR.isWebMercator() &&
        geomSR.wkid === 4326
      );
      
      this._isTextPoint = this._prepareTextSymbolEditing(graphic, tool);
      
      if ((tool & MOVE) === MOVE) {
        move = this._enableMove(graphic);
      }
      
      var scale = ((tool & SCALE) === SCALE), rotate = ((tool & ROTATE) === ROTATE);
      if (scale || rotate) {
        box = this._enableBoxEditing(graphic, scale, rotate);
      }
      
      if ((tool & EDIT) === EDIT) {
        edit = this._enableVertexEditing(graphic);
      }
      
      if ((tool & TEXT) === TEXT) {
        text = this._enableTextEditing(graphic);
      }
      
  //    if (move || edit) {
  //      if (move && edit) {
  //        this._setupMultitoolMode();
  //      }
  //    }
      
      if (!(move || edit || box)) {
        throw new Error("[esri.toolbars.Edit::activate] Unable to activate the tool. Check if the tool is valid for the given geometry type." );
      }
      
      this._tool = tool;

      // post processing
      if (this._tool) {
        // we need to redraw the graphics that were previously clipped out
        // and now getting into the view
        this._mapPanEndHandle = connect.connect(map, "onPanEnd", this, this._mapPanEndHandler);
        this._mapExtChgHandle = connect.connect(map, "onExtentChange", this, this._mapExtentChangeHandler);

        this.onActivate(this._tool, graphic);
      }
      if (map.snappingManager && (move || edit)) {
        map.snappingManager._startSelectionLayerQuery();
      }
    },
    
    deactivate: function() {
      //console.log("De-activate");
      this._isTextPoint = null;
      var tool = this._tool, graphic = this._graphic;
      if (!tool) {
        return;
      }

      var modified = !!this._modified;
      
      this._clear();
      
      //this._setTool(0);
      connect.disconnect(this._mapPanEndHandle);
      connect.disconnect(this._mapExtChgHandle);
      
      this._mapPanEndHandle = this._mapExtChgHandle = null;
      //dojo.disconnect(this._gFMHandle);
      //dojo.disconnect(this._gMSHandle);
      
      this._graphic = this._geo = null;
      
      this.onDeactivate(tool, graphic, {
        isModified: modified
      });
      
      if (this._map.snappingManager) {
        this._map.snappingManager._stopSelectionLayerQuery();
      }
    },
    
    refresh: function() {
      this._refreshMoveables(/*force*/ true); 
    },
    
    getCurrentState: function() {
      return {
        tool: this._tool,
        graphic: this._graphic,
        isModified: !!this._modified
      };
    },
    
    /*********
     * Events
     *********/
    
    onActivate: function(tool, graphic) {},
    onDeactivate: function(tool, graphic, info) {},
    
    // delegated to _GraphicMover
    onGraphicMoveStart: function(graphic) {},
    onGraphicFirstMove: function(graphic) { this._modified = true; },
    onGraphicMove: function(graphic, transform) {},
    onGraphicMoveStop: function(graphic, transform) {},
    onGraphicClick: function(graphic, info) {},
    
    // delegated to _vertexMover
    onVertexMoveStart: function(graphic, vertexInfo) {},
    onVertexFirstMove: function(graphic, vertexInfo) { this._modified = true; },
    onVertexMove: function(graphic, vertexInfo, transform) {},
    onVertexMoveStop: function(graphic, vertexInfo, transform) {},
    onVertexAdd: function(graphic, vertexInfo) { this._modified = true; },
    onVertexClick: function(graphic, vertexInfo) {},
    
    // delegated to _vertexEditor
    onVertexMouseOver: function(graphic, vertexInfo) {},
    onVertexMouseOut: function(graphic, vertexInfo) {},
    onVertexDelete: function(graphic, vertexInfo) { this._modified = true; },
    
    // delegated to _textEditor
    onTextEditStart: function(graphic, textBox) {},
    onTextEditEnd: function(graphic) {},
    
    // delegated to _Box
    onScaleStart: function(graphic) {},
    onScaleFirstMove: function(graphic) { this._modified = true; },
    onScale: function(graphic, info) {},
    onScaleStop: function(graphic, info) {},
    onRotateStart: function(graphic) {},
    onRotateFirstMove: function(graphic) { this._modified = true; },
    onRotate: function(graphic, info) {},
    onRotateStop: function(graphic, info) {},

    _eventMap: {
      activate: ["tool", "graphic"],
      deactivate: ["tool", "graphic", "info"],
      
      // delegated to _GraphicMover
      "graphic-move-start": ["graphic"],
      "graphic-first-move": ["graphic"],
      "graphic-move": ["graphic", "transform"],
      "graphic-move-stop": ["graphic", "transform"],
      "graphic-click": ["graphic", "info"],
      
      // delegated to _vertexmover
      "vertex-move-start": ["graphic", "vertexinfo"],
      "vertex-first-move": ["graphic", "vertexinfo"],
      "vertex-move": ["graphic", "vertexinfo", "transform"],
      "vertex-move-stop": ["graphic", "vertexinfo", "transform"],
      "vertex-add": ["graphic", "vertexinfo"],
      "vertex-click": ["graphic", "vertexinfo"],
      
      // delegated to _vertexeditor
      "vertex-mouse-over": ["graphic", "vertexinfo"],
      "vertex-mouse-out": ["graphic", "vertexinfo"],
      "vertex-delete": ["graphic", "vertexinfo"],
      
      // delegated to _box
      "scale-start": ["graphic"],
      "scale-first-move": ["graphic"],
      scale: ["graphic", "info"],
      "scale-stop": ["graphic", "info"],
      "rotate-start": ["graphic"],
      "rotate-first-move": ["graphic"],
      rotate: ["graphic", "info"],
      "rotate-stop": ["graphic", "info"]
    },
    
    /*******************
     * Internal Methods
     *******************/
    _prepareTextSymbolEditing: function(graphic, tool) {
      if ((graphic.geometry.type === "point" || graphic.geometry.type === "multipoint")) {
        var layer = graphic.getLayer(),
            renderer = layer.renderer,
            symbol = graphic.symbol || layer._getSymbol(graphic);
  
        // See also: esri.widgets.editing.Editor._isTextSymbolPoint
        // TODO
        // Find a better way to make this easy.
        if (
          !symbol &&
      
          // If this is one of the new unclassed renderers, pick the 
          // symbol from the one class break available in the renderer.
          // If there were a defaultSymbol, _getSymbol would have already 
          // returned it.
          renderer.hasVisualVariables() &&
          renderer.addBreak &&
          renderer.infos &&
          renderer.infos.length === 1
        ) {
          symbol = renderer.infos[0].symbol || renderer.defaultSymbol;
    
          // This renderer can optionally have a defaultSymbol also, but we 
          // should not use it here.
        }

        if (symbol && symbol.type === "textsymbol") {
          if (((tool & EDT.SCALE) === EDT.SCALE)
               || ((tool & EDT.ROTATE) === EDT.ROTATE)
               || ((tool & EDT.EDIT_TEXT) === EDT.EDIT_TEXT)) {
            graphic.setSymbol(new TextSymbol(symbol.toJSON()));

            var self = this;
            if (!this._textSymbolEditor) {
              if (this._options && this._options.textSymbolEditor) {
                this._textSymbolEditor = this._options.textSymbolEditor;
                this._textSymbolEditor.on("symbol-change", function(){
                  if (self._boxEditor) {
                    self._boxEditor.refresh();
                  }
                });
              }
              else {
                var holder;
                if (this._options.textSymbolEditorHolder) {
                  holder = domConstruct.create('div', null, this._options.textSymbolEditorHolder);
                }
                else {
                  holder = domConstruct.create('div', null, this._map.root);
                }
                require(["../widgets/SymbolEditor"], function(SymbolEditor){
                  self._textSymbolEditor = new SymbolEditor({'graphic': graphic}, holder);
                  var parentNodId = self._textSymbolEditor.domNode.parentNode.id;
                  domStyle.set(self._textSymbolEditor.domNode, {
                    'position': parentNodId ==='map_root' ? 'absolute' : 'relative',
                    'left': parentNodId ==='map_root' ? self._map.width/2 - 100 + 'px' : '5px',
                    'top': '20px',
                    'z-index': 50
                  });
                  self._textSymbolEditor.startup();
                  self._textSymbolEditor.createForm(graphic);
                  self._textSymbolEditor.show();
                  self._textSymbolEditor.on("symbol-change", function(){
                    if (self._boxEditor) {
                      self._boxEditor.refresh();
                    }
                  });
                });                
              }
            }
            else {
              this._textSymbolEditor.createForm(graphic);
              this._textSymbolEditor.show();
            }
          }
          if (((tool & EDT.MOVE) === EDT.MOVE)
               || ((tool & EDT.ROTATE) === EDT.ROTATE)
               || ((tool & EDT.SCALE) === EDT.SCALE)) {
            this._textAnchor = new Graphic(graphic.geometry, this._options.textAnchorSymbol);
            this._scratchGL.add(this._textAnchor);
          }
          
          return true;
        }
      }

      return false;
    },
    
    _enableMove: function(graphic) {
      //console.log("_enableMove");
      var map = this._map, type = graphic.geometry.type;
      
      switch(type) {
        case "point":
        case "polyline":
        case "polygon":
          this._graphicMover = new GraphicMover(graphic, map, this, this._textAnchor);
          return true;
        case "multipoint": // would a user want to move a multipoint graphic as a whole?
          break;
      }
      return false;
    },
    
    _enableVertexEditing: function(graphic) {
      //console.log("_enableVertexEditing");
      var map = this._map, type = graphic.geometry.type;
      
      switch(type) {
        case "point":
          break;
        case "multipoint":
        case "polyline":
        case "polygon":
          this._vertexEditor = VertexEditor.create(graphic, map, this);
          return true;
      }
      return false;
    },
    
    _enableBoxEditing: function(graphic, scale, rotate) {
      //console.log("_enableBoxEditing");
      var map = this._map, type = graphic.geometry.type;
      
      if (type === "polyline" || type === "polygon" || this._isTextPoint) {
        this._boxEditor = new Box(
          graphic, map, this, scale, rotate,
          this._options.uniformScaling,
          this._isTextPoint
        );
        return true;
      }
      return false;
    },
    
    _enableTextEditing: function(graphic) {
      if (this._isTextPoint) {        
        this._textEditor = new TextEditor(graphic, this._map, this);
        connect.connect(this._textEditor, "onEditStart", lang.hitch(this, function(){
          if (this._textAnchor) {
            this._textAnchor.getLayer().remove(this._textAnchor);
            this._textAnchor = null;
          }
          //disable scaling and rotation
          this._disableMove();
          this._disableBoxEditing();
        }));
        return true;
      }
      
      return false;
    },
    
    _disableMove: function() {
      //console.log("_disableMove");
      var graphicMover = this._graphicMover;
      if (graphicMover) {
        graphicMover.destroy();
        this._graphicMover = null;
      }
    },
    
    _disableVertexEditing: function() {
      //console.log("_disableVertexEditing");
      var vertexEditor = this._vertexEditor;
      if (vertexEditor) {
        vertexEditor.destroy();
        this._vertexEditor = null;
      }
    },
    
    _disableBoxEditing: function() {
      //console.log("_disableBoxEditing");
      var box = this._boxEditor;
      if (box) {
        box.destroy();
        this._boxEditor = null;
      }
    },
    
    _disableTextEditing: function() {    
      if (this._textEditor) {
        this._textEditor.destroy();
        this._textEditor = null;
      }
    },

    _disableSymbolEditing: function() {
      if (this._textSymbolEditor) {
        this._textSymbolEditor.hide();
        //this._textSymbolEditor = null;
      }
    },
    
    _clear: function() {
      this._disableMove();
      this._disableVertexEditing();
      this._disableBoxEditing();
      this._disableTextEditing();
      this._disableSymbolEditing();
      if (this._textAnchor) {
        this._textAnchor.getLayer().remove(this._textAnchor);
        this._textAnchor = null;
      }
      this._tool = 0;
      this._modified = false;
    },
    
    _mapPanEndHandler: function() {
      //console.log("_mapPanEndHandler");
      this._refreshMoveables();
    },
    
    _mapExtentChangeHandler: function(e, d, levelChange) {
      if (levelChange) {
        //console.log("_mapExtentChangeHandler");
        this._refreshMoveables();    
      }
    },

    _refreshMoveables: function(force) {
      //console.log("_refreshMoveables");
      /*var graphicMover = this._graphicMover;
      if (graphicMover) {
        graphicMover.refresh(force);
      }

      var vertexEditor = this._vertexEditor;
      if (vertexEditor) {
        vertexEditor.refresh(force);
      }*/
      
      var tools = array.filter([
        this._graphicMover, this._vertexEditor, 
        this._boxEditor 
      ], esriLang.isDefined);
      
      array.forEach(tools, function(mov) {
        mov.refresh(force);
      });
    },
    
    // _beginOperation and _endOperation will be called by
    // the tools to indicate that the user is currently
    // interacting with the said tool. Used to suspend or
    // resume other tools. We could have gone the formal
    // route of tools firing events and the Edit module
    // would react but that's probably too much considering
    // this is an internal aspect.
    _beginOperation: function(toolName) {
      array.forEach(this._getAffectedTools(toolName), function(tool) {
        tool.suspend();
      });
    },
    
    _endOperation: function(toolName) {
      array.forEach(this._getAffectedTools(toolName), function(tool) {
        tool.resume();
      });
    },
    
    _getAffectedTools: function(toolName) {
      var tools = [];
      
      switch(toolName) {
        case "MOVE":
          tools = [ this._vertexEditor, this._boxEditor ];
          break;
        case "VERTICES":
          tools = [ this._boxEditor ];
          break;
        case "BOX":
          tools = [ this._vertexEditor ];
          break;
      }
      
      tools = array.filter(tools, esriLang.isDefined);
      return tools;
    }
    /*,
    
    _setupMultitoolMode: function() {
      dojo.disconnect(this._gFMHandle);
      dojo.disconnect(this._gMSHandle);
      this._gFMHandle = dojo.connect(esri.toolbars._GraphicMover, "onFirstMove", this, this._gFirstMoveHandler);
      this._gMSHandle = dojo.connect(esri.toolbars._GraphicMover, "onMoveStop", this, this._gMoveStopHandler);
    },
    
    _gFirstMoveHandler: function() {
      //console.log("FM");
      var vertexEditor = this._vertexEditor;
      if (vertexEditor) {
        vertexEditor.suspend();
      }
    },
    
    _gMoveStopHandler: function() {
      //console.log("MSTOP");
      var vertexEditor = this._vertexEditor;
      if (vertexEditor) {
        vertexEditor.resume();
      }
    }*/
  });

  lang.mixin(EDT, {
    MOVE: 1,
    EDIT_VERTICES: 2,
    SCALE: 4,
    ROTATE: 8,
    EDIT_TEXT: 16
  });

  

  return EDT;
});
