 /*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../layers/LayerView",

  "../engine/Container"
],
function(
LayerView,
Container
) {

  var LayerView2D = LayerView.createSubclass({
    declaredClass: "esri.views.2d.layers.LayerView2D",

    classMetadata: {
      properties: {
        suspended: {
          dependsOn: ["view.scale", "layer.minScale", "layer.maxScale"]
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function(properties) {
      this.container = new Container({
        visible: false
      });
      this.watch("suspended", this._suspendedWatcher.bind(this));
      this._opacityWatch = this.watch("layer.opacity", function(value) {
        this.container.opacity = value;
      }.bind(this));
      this._opacityWatch = this.watch("layer.blendMode", function(value) {
        this.container.blendMode = value;
      }.bind(this));
    },

    destroy: function() {
      this._opacityWatch.remove();
      this._opacityWatch = null;
      this.updateNeeded = false;
      this.layer = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  view
    //----------------------------------

    _viewChangeHdl: null,

    _viewSetter: function(value) {
      this.inherited(arguments);
      if (this._viewChangeHdl) {
        this._viewChangeHdl.remove();
        this._viewChangeHdl = null;
      }
      if (value) {
        this._viewChangeHdl = value.state.watch("transform", function() {
          this.emit("view-change");
        }.bind(this));
      }
      return value;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    hitTest: function(x, y) {
      return null;
    },

    needUpdate: function() {
      if (!this.updateNeeded) {
        this.updateNeeded = true;
        if (!this.suspended) {
          this.view.scheduleLayerViewUpdate(this);
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Internal
    //
    //--------------------------------------------------------------------------

    /**
     * Internal function called by the View2D at the time of the update
     * @private
     */
    _commitUpdate: function() {
      if (!this.updateNeeded) {
        return;
      }
      this.updateNeeded = false;
      this.update();
    },

    canResume: function() {
      var result = this.inherited(arguments);

      // check if the layer is visible at view.scale.
      if (result) {
        var scale = this.view.scale;
        var layer = this.layer;
        var minScale = layer.minScale;
        var maxScale = layer.maxScale;
        var minPassed = !minScale;
        var maxPassed = !maxScale;

        if (!minPassed && scale <= minScale) {
          minPassed = true;
        }
        if (!maxPassed && scale >= maxScale) {
          maxPassed = true;
        }
        result = (minPassed && maxPassed);
      }
      
      return result;
    },


    //--------------------------------------------------------------------------
    //
    //  Event handlers
    //
    //--------------------------------------------------------------------------

    _suspendedWatcher: function(suspended) {
      this.container.visible = !suspended;
      if (!suspended && this.updateNeeded) {
        this.view.scheduleLayerViewUpdate(this);
      }
    }

  });

  return LayerView2D;

});
