/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define([
    "esri/core/declare",
    "esri/core/watchUtils",
    "esri/core/HandleRegistry",

    "./LayerView2D",

    "../engine/Bitmap"
],

function(
  declare, watchUtils, HandleRegistry,
  LayerView2D,
  Bitmap) {

  var removeHandle = function(handle) {
    handle.remove();
  };

  var ImageLayerView2D = declare(LayerView2D, {
    declaredClass: "esri.views.2d.layers.ImageLayerView2D",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._canvas = this._context = null;

      // handle layer property changes
      this._hdls = new HandleRegistry();
      this._hdls.add([
        watchUtils.watch(this, "view.state.version,view.stationary,suspended", this.redraw.bind(this))
      ]);
    },

    initialize: function() {
      this._createCanvas();
    },

    destroy: function() {
      this.clear();

      this.container.removeAll();
      if (this._canvas) {
        this._canvas = this._context = null;
      }

      this._hdls.remove();
      this._hdls.destroy();
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------



    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------

    redraw: function() {
      if (!this.view.stationary || this.suspended) { return; }

      var state = this.view.state;
      var ext = state.extent;

      // cancel the current request if any.
      if (this._imagePromise) {
        this._imagePromise.cancel();
        this._imagePromise = null;
      }

      this._imagePromise = this.layer.fetchImage(
        {
          extent: state.extent,
          width: state.width,
          height: state.height
        }
      )
      .then(
        function() {
          // Use the pixeldata from the layer as this one has gone thru the pixel filter
          var pixelData = this.layer.pixelData;
          this._imagePromise = null;

          // can we draw?
          if (!this.view.stationary || this.suspended) { return; }

          this._drawPixelData(pixelData);

          var bmp = new Bitmap({
            coords: [ext.center.x, ext.center.y],
            resolution: ext.width / state.width,
            size: [state.width * 0.5, state.height * 0.5],
            source: this._canvas,
            rotation: 0
          });

          this.container.removeAll();
          this.container.addChild(bmp);

        }.bind(this),
        function() {
          this._imagePromise = null;
          // TODO error handling
        }.bind(this)
      );
    },

    clear: function() {
      var state = this.get("view.state");
      if (this._context && this.layer.drawType === "2d") {
        this._context.clearRect(0, 0, state.width, state.height);
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _drawPixelData: function(pixelData) {
      var state = this.get("view.state");
      var ctx = this._context;

      if (!ctx || !pixelData || !pixelData.pixelBlock) {
        this.clear();
        return;
      }

      this._canvas.setAttribute("style", "left: 0px; top: 0px; width: state.width + 'px'; state.height + 'px';");
      this._canvas.style["transform-origin"] = "left top";

      var pixelBlock = pixelData.pixelBlock;
      var imageData = ctx.createImageData(pixelBlock.width, pixelBlock.height);
      imageData.data.set(pixelBlock.getAsRGBA());
      ctx.putImageData(imageData, 0, 0);
    },

    //--------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    //--------------------------------------------------------------------------

    _createCanvas: function() {
      var state = this.get("view.state");
      var canvas = this._canvas = document.createElement("canvas");
      canvas.setAttribute("id", "rasterCanvas2d");
      canvas.setAttribute("width", state.width + "px");
      canvas.setAttribute("height", state.height + "px");
      canvas.setAttribute("style", "position: absolute; left: 0px; top: 0px;");

      this._context = canvas.getContext(this.layer.drawType);
      if (!this._context) {
        throw new Error("Unable to create the context. This browser might not support <canvas> elements.");
      }
    }

  });

  return ImageLayerView2D;
});
