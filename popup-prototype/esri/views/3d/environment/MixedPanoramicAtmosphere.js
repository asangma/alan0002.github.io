define([
  "../support/ExternalRenderer",

  "./RealisticAtmosphere",
  "./PanoramicAtmosphere"
],
function(
  ExternalRenderer,
  RealisticAtmosphere, PanoramicAtmosphere
) {

  var MixedPanoramicAtmosphere = ExternalRenderer.createSubclass({
    declaredClass: "esri.views.3d.environment.MixedPanoramicAtmosphere",

    classMetadata: {
      properties: {
        view: {
        },

        needsRender: {
          dependsOn: ["_panoramicAtmosphere.needsRender", "_realisticAtmosphere.needsRender"],

          getter: function() {
            return this._panoramicAtmosphere.needsRender || this._realisticAtmosphere.needsRender;
          }
        },

        needsDepthMap: {
          dependsOn: ["_panoramicAtmosphere.needsDepthMap", "_realisticAtmosphere.needsDepthMap"],

          getter: function() {
            return this._panoramicAtmosphere.needsDepthMap || this._realisticAtmosphere.needsDepthMap;
          }
        },

        slot: {
          value: 0,

          setter: function(v) {
            if (this._panoramicAtmosphere) {
              this._panoramicAtmosphere.slot = v;
            }

            return v;
          }
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    initialize: function() {
      this._panoramicAtmosphere = new PanoramicAtmosphere({
        view: this.view,
        slot: this.slot
      });

      this._realisticAtmosphere = new RealisticAtmosphere({
        view: this.view,
        planar: true
      });

      this.addResolvingPromise(this._panoramicAtmosphere);
      this.addResolvingPromise(this._realisticAtmosphere);
    },

    destroy: function() {
      if (this._panoramicAtmosphere) {
        this._panoramicAtmosphere.destroy();
        this._panoramicAtmosphere = null;
      }

      if (this._realisticAtmosphere) {
        this._realisticAtmosphere.destroy();
        this._realisticAtmosphere = null;
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    initializeRenderContext: function(context) {
      this._panoramicAtmosphere.initializeRenderContext(context);
      this._realisticAtmosphere.initializeRenderContext(context);
    },

    render: function(context) {
      this._panoramicAtmosphere.render(context);
      this._realisticAtmosphere.render(context);

      return this._panoramicAtmosphere.didRender || this._realisticAtmosphere.didRender;
    },

    resetNeedsRender: function() {
      if (this._panoramicAtmosphere.resetNeedsRender) {
        this._panoramicAtmosphere.resetNeedsRender();
      } else if (this._panoramicAtmosphere.didRender) {
        this._panoramicAtmosphere.needsRender = false;
        this._panoramicAtmosphere.didRender = false;
      }

      if (this._realisticAtmosphere.resetNeedsRender) {
        this._realisticAtmosphere.resetNeedsRender();
      } else if (this._realisticAtmosphere.didRender) {
        this._realisticAtmosphere.needsRender = false;
        this._realisticAtmosphere.didRender = false;
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setEnableTestImage: function(state){
      this._realisticAtmosphere._setEnableTestImage(state);
    }
  });

  return MixedPanoramicAtmosphere;

});
