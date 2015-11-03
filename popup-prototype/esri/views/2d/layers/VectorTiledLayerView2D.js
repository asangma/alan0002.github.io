define(
[
  "require",
  "dojo/_base/lang",

  "../../../kernel",
  "../../../core/declare",
  "../../../core/Scheduler",

  "./LayerView2D"
],
function(
  require, lang,
  kernel, declare, Scheduler,
  LayerView2D
) {

var VectorTiledLayerView2D = declare(LayerView2D, {
  declaredClass: "esri.views.2d.layers.VectorTiledLayerView2D",

  //--------------------------------------------------------------------------
  //
  //  Constructor
  //
  //--------------------------------------------------------------------------

  constructor: function(properties) {
    this.update = this.update.bind(this);

    // Ensures VT views update display at the same time as Non-VT views
    // during pan - without lag.
    this._viewHdl = this.watch("view.viewpoint", this.update);

    // Ensures VT views update display at the same time as Non-VT views
    // during zoom/animation - without lag.
    this._updateTask = Scheduler.addFrameTask({ update: this.update });

    this.container.watch("surface", function(newValue) {
      require(["./vector-tile"], function(vectorTile) {
        vectorTile.identityManager = kernel.id;
        var layer = this.layer,
          serviceStyle = layer.serviceStyle;

        if (serviceStyle) {
          var view = this.view,
              state = view.state;

          this.gl = new vectorTile.Renderer({
            container: newValue,
            style: serviceStyle,
            center: [state.longitude, state.latitude],
            zoom: this.getZoom(state.resolution),
            bearing: -state.rotation
          });
          this.gl.getCanvas().style["transform-origin"] = "center";
          this.gl.getCanvas().style.transform = "rotate(-"+state.rotation+"deg)";
          this.gl.setSize(state.width, state.height);

          //apply styles already set on layer before adding it to map
          var existingStyles = layer.styles || [];
          this._applyStyles(existingStyles);
        }
      }.bind(this));

    }.bind(this));
  },

  getDefaults: function() {
    return lang.mixin(this.inherited(arguments), {
      styles: []
    });
  },

  initialize: function(properties) {
    this.layer.watch("styles", function(newValue){
      //apply new styles
      newValue = newValue || [];
      this._applyStyles(newValue);
    }.bind(this));

    this.layer.watch("serviceStyle", function(newValue) {
      var source,
        sources = newValue.sources;

      if (sources.esri && this.layer.currentVersion) {
        source = this._makeSource(this.layer);
        sources.esri = lang.mixin(sources.esri, source);
        delete sources.esri.url;
      }

      if (this.gl) {
        this.gl.setStyle(newValue);
      }
    }.bind(this));
  },

  destroy: function() {
    this._updateTask.remove();
    this._updateTask = null;
    this.gl.remove();
    this.gl = null;
    this._viewHdl.remove();
    this._viewHdl = null;
  },


  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------

  update: function() {
    if (!this.gl) {
      return;
    }

    var view = this.view,
        state = view.state;

    if (this._version === state.version) {
      return;
    }

    this._version = state.version;
    this.gl.setSize(state.width, state.height);
    this.gl.jumpTo({
      center: [state.longitude, state.latitude],
      zoom: this.getZoom(state.resolution),
      bearing: -state.rotation
    });
    this.gl.getCanvas().style.transform = "rotate(-"+state.rotation+"deg)";
  },

  getZoom: function(resolution) {
    var tileInfo = this.layer.tileInfo,
        lods = tileInfo.lods,
        l1 = null, l2 = null,
        zoom = 0, n = lods.length - 1;

    for (zoom; zoom < n; zoom++) {
      l1 = lods[zoom];
      l2 = lods[zoom+1];
      if (l1.resolution <= resolution) {
        return zoom;
      }
      if (l2.resolution === resolution) {
        return zoom+1;
      }
      if (l1.resolution > resolution && l2.resolution < resolution) {
        zoom = zoom + 1 - (resolution - l2.resolution) / (l1.resolution - l2.resolution);

        // convert the zoom to fit in mapbox-gl, from linear to log.
        zoom = Math.ceil(zoom) - Math.log(Math.abs((Math.ceil(zoom) - zoom)+1)) / Math.LN2;
        if ((zoom - Math.floor(zoom) > 0.995) || (zoom - Math.floor(zoom) < 0.005)) {
          zoom = Math.round(zoom);
        }

        return zoom;
      }
    }
  },

  //--------------------------------------------------------------------------
  //
  //  Private methods
  //
  //--------------------------------------------------------------------------

  /**
   * Adds and removes styles from the mapbox vt-engine's style.
   * @param {string[]} newValue
   * @private
   */
  _applyStyles: function(newValue){
    var styles = this.styles,
      glstyle = this.gl,
      i, n,
      classname,
      newStyles = [];

    //loop through current values and remove if not in new values
    for(i = 0, n = styles.length; i < n; i++){
      classname = styles[i];
      if(newValue.indexOf(classname) === -1){
        glstyle.removeClass(classname);
      }
      else{
        newStyles.push(classname);
      }
    }

    //loop through new values and add if not in current values
    for(i = 0, n = newValue.length; i < n; i++){
      classname = newValue[i];
      if(newStyles.indexOf(classname) === -1){
        glstyle.addClass(classname);
        newStyles.push(classname);
      }
    }
    this.styles = newStyles;
  }
});

return VectorTiledLayerView2D;

});
