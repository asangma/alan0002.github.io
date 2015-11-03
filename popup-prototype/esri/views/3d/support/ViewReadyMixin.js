define([
  "../../../core/Accessor",
  "../../../core/watchUtils",
  "../../../core/Scheduler",
], function(
  Accessor, watchUtils, Scheduler
) {
  "use strict";

  var ViewReadyMixin = Accessor.createSubclass({
    declaredClass: "esri.views.3d.support.ViewReadyMixin",

    classMetadata: {
      properties: {
        view: {}
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return {
        view: null
      };
    },

    initialize: function() {
      this._viewConnected = false;

      this._watchHandle = watchUtils.init(this, "view.ready", function(ready) {
        if (!ready) {
          this._updateReadyChange(ready);
        } else if (this.view._stage) {
          this._updateReadyChange(ready);
        } else {
          Scheduler.schedule(this._updateReadyChange.bind(this, ready));
        }
      }.bind(this));
    },

    destroy: function() {
      if (this._watchHandle) {
        this._watchHandle.remove();
        this._watchHandle = null;
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    //--------------------------------------------------------------------------

    connectView: function(view) {
    },

    disconnectView: function(view) {
    },

    _updateReadyChange: function(ready) {
      if (ready && !this._viewConnected) {
        this._viewConnected = true;
        this.connectView(this.view);
      } else if (!ready && this._viewConnected) {
        this._viewConnected = false;
        this.disconnectView(this.view);
      }
    }
  });

  return ViewReadyMixin;
});
