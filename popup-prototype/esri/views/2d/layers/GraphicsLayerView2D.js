/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../../core/declare",

  "dojox/gfx",
  "dojo/dom-style",
  
  "./LayerView2D",

  "../../layers/GraphicsLayerView",
  "../../../geometry/support/webMercatorUtils",

  "../VectorGroup",
  "../Vector"
],
function(
  declare,
  dojoGfx, domStyle,
  LayerView2D,
  GraphicsLayerView,
  webMercatorUtils,
  VectorGroup, Vector
) {

var GraphicsLayerView2D = declare([LayerView2D, GraphicsLayerView], {
  declaredClass: "esri.views.2d.layers.GraphicsLayerView2D",
  
  classMetadata: {
    computed: {
      graphics: ["controller"],
      needsRedraw: ["gfx", "view.stationary"]
    }
  },

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor: function(properties) {
    // the gfx rendering objects for each graphic 
    //   shape, bgShape, etc...
    this._vectors = [];

    var rnd = this.container.render;
    this.container.render = function(context) {
      rnd.call(this.container, context);
      this.render();
    }.bind(this);
    this.container.watch("surface", this._surfaceCreateHandler.bind(this));
    this.watch("needsRedraw,graphics", this.redraw.bind(this));
  },
  
  initialize: function() {
    this.layer.createGraphicsController({
      layerView: this
    }).then(function(controller) {
      this.controller = controller;
    }.bind(this));
  },

  destroy: function() {
    if (this.controller && this.controller.destroy) {
      this.controller.destroy();
    }
    this.controller = null;
  },
  
  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------
  
  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------
  
  //----------------------------------
  //  graphics
  //----------------------------------

  _graphicsGetter: function(oldValue) {
    var graphics = this.controller && this.controller.graphicsCollection;
    if (oldValue === graphics) {
      return oldValue;
    }
    if (oldValue) {
      this._colChgHandle.remove();
      this._colChgHandle = null;
      this.clear();
    }
    if (graphics) {
      this.add(graphics.getAll());
      this._colChgHandle = graphics.on("change", 
        function(event) {
          this.add(event.added);
          this.remove(event.removed);
        }.bind(this)
      );
    }
    return graphics;
  },

  //----------------------------------
  //  needsRedraw
  //----------------------------------

  _needsRedrawGetter: function() {
    return this.group && this.get("view.stationary");
  },
  
  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------

  hitTest: function(x, y) {
    var node = this.container.surface;
    var graphic = null;
    var hit, oldZ;

    if (node) {
      oldZ = node.style.zIndex;
      node.style.zIndex = "10000";
      domStyle.getComputedStyle(node);
      hit = document.elementFromPoint(x, y);
      graphic = (hit && hit.vector && (hit.vector.parent === this.group) && hit.vector.graphic) || null;
      node.style.zIndex = oldZ;
    }

    return graphic;
  },
  
  redraw: function() {
    if (!this.needsRedraw || this.suspended) {
      return;
    }
    var state = this.get("view.state");
    this.gfx.setDimensions(state.width, state.height);
    if (this.view.stationary) {
      if (state.resolution !== this.group.resolution) {
        this.group.set({
          x: state.x,
          y: state.y,
          resolution: state.resolution
        });
        this.group.draw();
        this.render();
      }
    }
  },

  render: function() {
    if (!this.suspended && this.group) {
      var state = this.get("view.state");
      this.gfx.setDimensions(state.width, state.height);
      this.group.applyState(state);
    }
  },
  
  add: function(graphics) {
    if (!graphics || !this.group) {
      return;
    }
    
//     if (window.performance && window.performance.now) {
//       var t0 = window.performance.now();
//     }
//     if (console.profile) {
//       console.profile(this.layer.id + "  draw");
//     }
    //  console.log("adding " + graphics.length + " graphics");
    
    var i, n = graphics.length,
        graphic, renderingInfo,
        toSR = this.view.extent.spatialReference;
        
    // create a context for each added graphic
    for (i = 0; i < n; i++) {
      graphic = graphics[i];
      renderingInfo = this.getRenderingInfo(graphic);
      if (!renderingInfo) {
        continue;
      }
      this._vectors[graphic.id] = new Vector({
        graphic: graphic,
        symbol:  renderingInfo.symbol,
        color:   renderingInfo.color,
        size:    renderingInfo.size,
        projectedGeometry: this._projectGeometry(graphic.geometry, toSR)
      });
      
      this.group.addVector(this._vectors[graphic.id]);
    }

    this.group.draw();
    
//     if (console.profile) {
//       console.profileEnd();
//     }
//     if (window.performance && window.performance.now) {
//       var t1 = window.performance.now();
//       console.log("draw time " + (t1 - t0));
//     }
  },
  
  remove: function(graphics) {
    if (!graphics) {
      return;
    }
    
    // console.log("removing " + graphics.length + " graphics");
    /*if (
      array.indexOf(this._graphicsIds, graphic.id) === -1
    ) {
      this._graphicsIds.push(graphic.id);
      this._graphicsAdding.push(graphic);
      this._graphicsAddingIds.push(graphic.id);
      this.requestUpdate();
    }*/
    
    var i, n = graphics.length,
        graphic, vector;
        
    // create a context for each added graphic
    for (i = 0; i < n; i++) {
      graphic = graphics[i];
      vector = this._vectors[graphic.id];
      this.group.removeVector(vector);
    }
    
    //this._redraw = true;
    //this.requestDraw();
  },
  
  clear: function() {
  },
  
  //--------------------------------------------------------------------------
  //
  //  Private functions
  //
  //--------------------------------------------------------------------------
  
  _projectGeometry: function(geometry, toSR) {
    // Project <geometry> to <toSR>.
    var geomSR = geometry && geometry.spatialReference,
        projected;
    
    if (geomSR && toSR && !geomSR.equals(toSR) && webMercatorUtils.canProject(geomSR, toSR)) {
      projected = toSR.isWebMercator() ?
        webMercatorUtils.geographicToWebMercator(geometry) :
        webMercatorUtils.webMercatorToGeographic(geometry, true);
    }
    
    return projected;
  },
  
  //--------------------------------------------------------------------------
  //
  //  Event Handlers
  //
  //--------------------------------------------------------------------------
  
  _surfaceCreateHandler: function(newValue, oldValue, prop, target) {
    var state = this.get("view.state");
    this.gfx = dojoGfx.createSurface(
      this.container.surface,
      state.width,
      state.height
    );
    
    this.group = new VectorGroup({
      view: this.view,
      x: state.x,
      y: state.y,
      resolution: state.resolution,
      surface: this.gfx.createGroup(),
      layer:   this.layer
    });
    if (this.graphics) {
      this.add(this.graphics.getAll());
    }
    this.render();
  }
  
});

return GraphicsLayerView2D;

});
