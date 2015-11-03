define(
[
  "../../../geometry/Extent",

  "../../../core/watchUtils",
  "../../../core/HandleRegistry",

  "../engine/Bitmap",
  "../viewpointUtils",

  "./LayerView2D"
],
function(
  Extent,
  watchUtils, HandleRegistry,
  Bitmap, viewpointUtils,
  LayerView2D
) {
  
  var DynamicLayerView2D = LayerView2D.createSubclass({

    declaredClass: "esri.views.2d.layers.DynamicLayerView2D",


    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    constructor: function(properties) {
      this._hdls = new HandleRegistry();
      this._hdls.add([
        watchUtils.watch(this, "view.state.version,view.stationary,suspended,layer.exportImageParameters.version", this._update.bind(this))
      ]);
    },

    destroy: function() {
      this._hdls.destroy();
      this._hdls = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Private methods
    //
    //--------------------------------------------------------------------------

    _update: function() {
      // can we draw?
      if (!this.view.stationary || this.suspended) { return; }
      var view = this.view;
      var state = view.state;
      var layer = this.layer;
      var size = state.size.concat();

      // cancel the current request if any.
      if (this._imagePromise) {
        this._imagePromise.cancel();
        this._imagePromise = null;
      }

      // image rotation support with server >= 10.3
      // for older server, we compute the size of the outter rectangle covering the entire view 
      if (layer.version < 10.3) {
        viewpointUtils.getOuterSize(size, state.viewpoint, size);
      }

      // We cap the size to the maximum supported by the service
      size[0] = Math.min(size[0], layer.maxImageWidth || 2048);
      size[1] = Math.min(size[1], layer.maxImageHeight || 2048);

      this._imagePromise = layer.fetchImage({
        extent: viewpointUtils.getExtent(new Extent(), state.viewpoint, size),
        width:  size[0],
        height: size[1],
        rotation: state.rotation
      });

      this._imagePromise
        .then(
          function(response) {
            var options = response.options;
            var container = this.container;

            this._imagePromise = null;

            // can we draw?
            if (!this.view.stationary || this.suspended) { return; }

            // create a new bitmap with the image as source
            container.removeAllChildren();
            container.addChild(new Bitmap({
              coords: [options.extent.center.x, options.extent.center.y],
              resolution: options.extent.width / options.width,
              size: [ options.width * 0.5, options.height * 0.5],
              source: response.img,
              rotation: -options.rotation
            }));
          }.bind(this),
          function(error) {
            // TODO error relaying
            if (error.dojoType !== "cancel") {
              this.container.removeAllChildren();
              this._imagePromise = null;
            }
          }.bind(this)
        );
    }

  });

  return DynamicLayerView2D;

});
