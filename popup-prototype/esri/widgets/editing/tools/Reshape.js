define(
[
  "../../../core/declare",
  "dojo/_base/lang", 
  "dojo/_base/array", 
  "dojo/_base/connect", 

  "dojo/has", 

  "../../../layers/FeatureLayer",
  "../../../tasks/support/Query",
  "../../../toolbars/draw",
  "./ToggleToolBase",

  "../../../kernel"
], function(
  declare, lang, array, connect,
  has,
  FeatureLayer, Query, Draw, ToggleToolBase,
  esriKernel
) {
  var ReshapeTool = declare([ ToggleToolBase ], {
    declaredClass: "esri.widgets.editing.tools.Reshape",

    id: "btnFeatureReshape",
    _enabledIcon: "toolbarIcon reshapeIcon",
    _disabledIcon: "toolbarIcon reshapeIcon",
    _drawType: Draw.POLYLINE,
    _enabled: true,
    _label: "NLS_reshapeLbl",
    
    /************
     * Overrides
     ************/
    activate: function() {
      connect.disconnect(this._rConnect);
      this._rConnect = connect.connect(this._toolbar, "onDrawEnd", this, "_onDrawEnd");
      this.inherited(arguments);
    },
    
    deactivate: function() {
      this.inherited(arguments);
      connect.disconnect(this._rConnect);
      delete this._rConnect;
    },
    
    _onDrawEnd: function(geometry) {
      var layers = this._settings.layers;
      var query = new Query();
      query.geometry = geometry;
      var reshapeLayers = this._reshapeLayers = array.filter(layers, function(layer) { return (layer.geometryType === "esriGeometryPolygon" || "esriGeometryPolyline"); });
      this._settings.editor._selectionHelper.selectFeatures(reshapeLayers, query, FeatureLayer.SELECTION_NEW, lang.hitch(this, "_reshape", query));
    },
    
    _reshape : function(query, selectionSet){
      var edits = [];
      var features = selectionSet;
      if (features.length !== 1){ return; }
     
      this._settings.geometryService.reshape(features[0].geometry, query.geometry, lang.hitch(this, function(geometry) {
        var updates = [features[0].setGeometry(geometry)];
        this.onApplyEdits([{layer: features[0].getLayer(), updates: updates}], lang.hitch(this, function() {
          this._settings.editor._selectionHelper.clearSelection(false);
          this.onFinished();
        }));
      }));
    }
  });

  

  return ReshapeTool;
});
