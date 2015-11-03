define(
[
    "../../../core/declare",
    "dojo/_base/lang", 
    "dojo/_base/array", 

    "dojo/has", 

    "../../../geometry/support/graphicsUtils",
    "../../../Graphic",
    "../../../toolbars/draw",
    "../Union",
    "./ButtonToolBase",

    "../../../kernel"
], function(
    declare, lang, array,
    has,
    graphicsUtils, Graphic, Draw, Union, ButtonToolBase,
    esriKernel
) {
    var UnionTool = declare([ ButtonToolBase ], {
        declaredClass: "esri.widgets.editing.tools.Union",

        id: "btnFeatureUnion",
        _enabledIcon: "toolbarIcon unionIcon",
        _disabledIcon: "toolbarIcon unionIcon",
        _drawType: Draw.POLYLINE,
        _enabled: true,
        _label : "NLS_unionLbl",
        /*****************
         * Event Listeners
         *****************/
        _onClick: function(evt) {
          this._settings.editor._activeTool = "UNION";
          var layers = this._settings.layers;
          var unionLayers = array.filter(layers, function(item) {
            return (item.geometryType === 'esriGeometryPolygon') && (item.visible && item._isMapAtVisibleScale());
          });
          
          var edits = [];
          var count = 0;
          array.forEach(unionLayers, function(layer, idx) {
            var features = layer.getSelectedFeatures();
            if (features.length >= 2) {
              count++;
              var preUpdates = array.map(features, function(item) {
                return new Graphic(lang.clone(item.toJSON()));
              });
              this._settings.geometryService.union(graphicsUtils.getGeometries(features), lang.hitch(this, function(unionedGeometry) {
                var updates = [features.pop().setGeometry(unionedGeometry)];
                edits.push({layer: layer, updates: updates, deletes: features, preUpdates:preUpdates });
                count--;
                if (count <= 0) {
                  this.onApplyEdits(edits, lang.hitch(this, function() {
                    if (this._settings.undoRedoManager){
                        var undoMgr = this._settings.undoRedoManager;
                        array.forEach(this._edits, lang.hitch(this, function(edit){
                          undoMgr.add(new Union({featureLayer: edit.layer,
                                                                    addedGraphics:edit.deletes,
                                                                    preUpdatedGraphics:edit.preUpdates,
                                                                    postUpdatedGraphics:edit.updates}));
                        }), this);
                    }
                    this._settings.editor._selectionHelper.clearSelection(false);
                    this.onFinished();
                  }));
                }
              }));
            }
          }, this);
        }
    });

    

    return UnionTool;
});
