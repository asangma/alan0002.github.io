define(
[
  "../../../core/declare",
  "../../../core/promiseList",

  "../../../geometry/support/graphicsUtils",

  "../../../Graphic",

  "../../../layers/FeatureLayer",

  "../../../tasks/support/Query",

  "../../../toolbars/draw",

  "../Cut",

  "./ToggleToolBase",

  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/lang"
],
function(
  declare, promiseList,
  graphicsUtils,
  Graphic,
  FeatureLayer,
  Query,
  Draw,
  Cut,
  ToggleToolBase,
  array, connect, lang
) {
    var CutTool = declare([ ToggleToolBase ], {
        declaredClass: "esri.widgets.editing.tools.Cut",

        id            : "btnFeatureCut",
        _enabledIcon  : "toolbarIcon cutIcon",
        _disabledIcon : "toolbarIcon cutIcon", 
        _drawType     : Draw.POLYLINE,
        _enabled      : true,
        _label        : "NLS_cutLbl",
        _cutConnects  : [],

        /************
        * Overrides 
        ************/
        activate : function() {
            this._cutConnects.push(connect.connect(this._toolbar, "onDrawEnd", this, "_onDrawEnd"));
            this.inherited(arguments);
        },

        deactivate : function() {
            this.inherited(arguments);
            array.forEach(this._cutConnects, connect.disconnect);
            this._cutConnects = [];
            this._edits = [];
        },
        
        _onDrawEnd : function(geometry){
            var layers = this._settings.layers;
            var cutLayers = this._cutLayers = array.filter(layers, function(layer) {
                return ((layer.geometryType === "esriGeometryPolygon") || (layer.geometryType === "esriGeometryPolyline") &&
                         layer.visible && layer._isMapAtVisibleScale());
            });

            this._cutConnects = this._cutConnects.concat(array.map(cutLayers, lang.hitch(this, function(layer){
                return connect.connect(layer, "onEditsComplete", lang.hitch(this, function(adds, updates, deletes){
                  if (this._settings.undoRedoManager){
                      var undoMgr = this._settings.undoRedoManager;
                      array.forEach(this._edits, lang.hitch(this, function(edit){
                        undoMgr.add(new Cut({featureLayer: edit.layer,
                                                                addedGraphics:edit.adds,
                                                                preUpdatedGraphics:edit.preUpdates,
                                                                postUpdatedGraphics:edit.updates}));
                      }), this);
                  }
                  this.onFinished();
                }));
            })));
            
            var query = new Query(); 
            query.geometry = geometry;
             array.forEach(cutLayers, function(layer, idx){
                  this._settings.editor._selectionHelper.selectFeatures([layer], query, FeatureLayer.SELECTION_NEW, lang.hitch(this, "_cutFeatures", layer, query));
              }, this);
        },
           
        _cutFeatures : function(layer, query, features){
            if (!features || !features.length){
               return;
            }
      
            this._edits = [];
            var deferreds = [];
            deferreds.push(this._settings.geometryService.cut(graphicsUtils.getGeometries(features), query.geometry, lang.hitch(this, "_cutHandler", layer, features)));
            promiseList(deferreds).then(lang.hitch(this, function() {
                this.onApplyEdits(this._edits); 
            }));
        },
       
        _cutHandler : function(layer, features, cutResult){
            var additions = [];
            var updates   = [];
            var preUpdates = array.map(features, function(item) {
                return new Graphic(lang.clone(item.toJSON()));
            });
            var currentCutIndex;
            var graphic;
            array.forEach(cutResult.cutIndexes, function(cutIndex,i) {
                  if (currentCutIndex!=cutIndex) {
                    //update existing
                    currentCutIndex = cutIndex;
                    updates.push(features[cutIndex].setGeometry(cutResult.geometries[i]));
                  } else {
                   //add new
                    graphic = new Graphic(cutResult.geometries[i],null, lang.mixin({}, features[cutIndex].attributes),null);
                    graphic.attributes[features[0].getLayer().objectIdField] = null;
                    additions.push(graphic);
                  }
            }, this);
           this._edits.push({layer:layer, adds:additions, updates:updates, preUpdates:preUpdates});
       }
    });

    

    return CutTool;
});
