define([
  "../support/ExternalRenderer",

  "./MixedPanoramicAtmosphere",
  "./PanoramicAtmosphere",
  "./RealisticAtmosphere",
  "./SimpleAtmosphere",

  "./Stars"
],
function(
  ExternalRenderer,
  MixedPanoramicAtmosphere, PanoramicAtmosphere, RealisticAtmosphere, SimpleAtmosphere,
  Stars
) {

  var EnvironmentRenderer = ExternalRenderer.createSubclass({
    declaredClass: "esri.views.3d.environment.EnvironmentRenderer",

    classMetadata: {
      properties: {
        view: {},

        viewingMode: {
          dependsOn: ["view.viewingMode"],

          getter: function() {
            return this.get("view.viewingMode") || "global";
          }
        },

        atmosphere: {
          dependsOn: ["view.environment.atmosphere"],

          getter: function() {
            return this.get("view.environment.atmosphere") || "none";
          }
        },

        stars: {
          dependsOn: ["view.environment.stars"],

          getter: function() {
            return this.get("view.environment.stars") || "none";
          }
        },

        transparent: {
          dependsOn: ["view.basemapTerrain.opacity", "view.basemapTerrain.wireframe"],

          getter: function() {
            var terrain = this.get("view.basemapTerrain");
            return terrain && terrain._renderer.isTransparent();
          }
        },

        needsDepthMap: {
          dependsOn: ["_stars.needsDepthMap", "_atmosphere.needsDepthMap"],

          getter: function() {
            return (this._atmosphere && this._atmosphere.needsDepthMap) ||
                   (this._stars && this._stars.needsDepthMap);
          }
        },

        needsRender: {
          dependsOn: ["_stars.needsRender", "_atmosphere.needsRender"],

          getter: function() {
            return !!(this._needsRender ||
                     (this._atmosphere && this._atmosphere.needsRender) ||
                     (this._stars && this._stars.needsRender));
          }
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function () {
      this._STANDARD_SLOT = 0;

      // haze or transparency
      this._SPECIAL_SLOT = 4;

      this._slots = [this._STANDARD_SLOT, this._SPECIAL_SLOT];

      this._AtmosphereClass = null;
      this._atmosphereReadyPromise = null;

      this._atmosphere = null;
      this._stars = null;

      this._needsRender = true;
      this.notifyChange("needsRender");
    },

    initialize: function() {
      this.view._stage.addExternalRenderer(this._slots, this);
    },

    destroy: function() {
      if (this._atmosphere) {
        this._atmosphere.destroy();
        this._atmosphere = null;
      }

      if (this._stars) {
        this._stars.destroy();
        this._stars = null;
      }

      if (this.view) {
        this.view._stage.removeExternalRenderer(this._slots, this);
        this.view = null;
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    setup: function(context) {
      this.watch("viewingMode,atmosphere,transparent,visible", this._updateAtmosphere.bind(this));
      this._updateAtmosphere();

      this.watch("stars,transparent,visible", this._updateStars.bind(this));
      this._updateStars();

      this.watch("view.basemapTerrain.loaded", function() {
        this._needsRender = true;
        this.notifyChange("needsRender");
      }.bind(this));
    },

    resetNeedsRender: function() {
      if (this._atmosphere) {
        if (this._atmosphere.resetNeedsRender) {
          this._atmosphere.resetNeedsRender();
        } else if (this._atmosphere.didRender) {
          this._atmosphere.needsRender = false;
          this._atmosphere.didRender = false;
        }
      }

      if (this._stars) {
        if (this._stars.resetNeedsRender) {
          this._stars.resetNeedsRender();
        } else if (this._stars.didRender) {
          this._stars.needsRender = false;
          this._stars.didRender = false;
        }
      }

      if (this.didRender) {
        this._needsRender = false;
        this.didRender = false;

        this.notifyChange("needsRender");
      }
    },

    render: function(context) {
      if (!this.get("view.basemapTerrain.loaded") && (this.viewingMode === "global")) {
        return false;
      }

      if (!this._stars && !this._atmosphere) {
        return true;
      }

      if (this._stars) {
        this._stars.render(context);
      }

      if (this._atmosphere) {
        this._atmosphere.render(context);
      }

      return (this._stars && this._stars.didRender) ||
             (this._atmosphere && this._atmosphere.didRender);
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _updateStars: function() {
      var slot = this._getAtmosphereSlot();

      if (this.stars === "default" && !this._stars) {
        this._stars = new Stars({
          view: this.view,
          slot: slot
        });

        this._stars.initializeRenderContext(this.renderContext);
      } else if (this.stars !== "default" && this._stars) {
        this._stars.destroy();
        this._stars = null;
      } else if (this._stars) {
        this._stars.slot = slot;
      }

      this._needsRender = true;
      this.notifyChange("needsRender");
    },

    _updateAtmosphere: function() {
      var slot = this._getAtmosphereSlot();

      if (this._atmosphere) {
        this._atmosphere.slot = slot;
      }

      if (!this._updateAtmosphereClass()) {
        return;
      }

      this._needsRender = true;
      this.notifyChange("needsRender");

      var destroyAtmosphere = function() {
        if (this._atmosphere) {
          this._atmosphere.destroy();
          this._atmosphere = null;
        }
      }.bind(this);

      if (!this._AtmosphereClass) {
        destroyAtmosphere();

        if (this._stars) {
          this._stars.destroy();
          this._stars = null;
        }

        return;
      }

      if (this._atmosphereReadyPromise) {
        this._atmosphereReadyPromise.cancel();
        this._atmosphereReadyPromise = null;
      }

      var atmosphere = new this._AtmosphereClass({
        view: this.view,
        slot: slot
      });

      atmosphere.initializeRenderContext(this.renderContext);

      if (!this._atmosphere) {
        this._atmosphere = atmosphere;
      } else {
        // Don't switch until atmosphere is ready, to avoid flickering
        this._atmosphereReadyPromise = atmosphere.then(function() {
          destroyAtmosphere();

          this._atmosphereReadyPromise = null;
          this._atmosphere = atmosphere;
        }.bind(this));
      }
    },

    _updateAtmosphereClass: function() {
      var current = this._AtmosphereClass;

      if (this.atmosphere === "none") {
        this._AtmosphereClass = null;
      } else if (this.atmosphere === "realistic" && !this.transparent) {
        if (this.viewingMode === "local") {
          this._AtmosphereClass = MixedPanoramicAtmosphere;
        } else {
          this._AtmosphereClass = RealisticAtmosphere;
        }
      } else {
        if (this.viewingMode === "local") {
          this._AtmosphereClass = PanoramicAtmosphere;
        } else {
          this._AtmosphereClass = SimpleAtmosphere;
        }
      }

      return this._AtmosphereClass !== current;
    },

    _getAtmosphereSlot: function() {
      return (this.transparent && (this.viewingMode === "global")) ? this._SPECIAL_SLOT : this._STANDARD_SLOT;
    }
  });

  return EnvironmentRenderer;

});
