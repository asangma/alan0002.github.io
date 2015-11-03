define(
[
  "../../core/declare",
  "dojo/_base/lang", 

  "dojo/has", 

  "../../kernel",
  "../../geometry/support/jsonUtils",
  "../../core/OperationBase"
], function(
  declare, lang,
  has,
  esriKernel, jsonUtils, OperationBase
) {
  var Cut = declare(OperationBase, {
    declaredClass: "esri.widgets.editing.Cut",

    type: "edit",
    label: "Cut Features",
    constructor: function ( /*featureLayer, addedGraphics, preUpdatedGraphics, postUpdatedGraphics*/ params) {
      var i;
      params = params || {};
      if (!params.featureLayer) {
        console.error("In constructor of 'esri.widgets.editing.Cut', featureLayer not provided");
        return;
      }
      this._featureLayer = params.featureLayer;

      if (!params.addedGraphics) {
        console.error("In constructor of 'esri.widgets.editing.Cut', addedGraphics for cut not provided");
        return;
      }
      this._addedGraphics = params.addedGraphics;

      if (!params.preUpdatedGraphics) {
        console.error("In constructor of 'esri.widgets.editing.Cut', preUpdatedGraphics not provided");
        return;
      }
      this._preUpdatedGraphicsGeometries = [];
      this._preUpdatedGraphicsAttributes = [];
      for (i = 0; i < params.preUpdatedGraphics.length; i++) {
        this._preUpdatedGraphicsGeometries.push(params.preUpdatedGraphics[i].geometry.toJSON());
        this._preUpdatedGraphicsAttributes.push(params.preUpdatedGraphics[i].attributes);
      }

      if (!params.postUpdatedGraphics) {
        console.error("In constructor of 'esri.widgets.editing.Cut', postUpdatedGraphics not provided");
        return;
      }
      //this._postUpdatedGraphics refer to the actual graphics which have been updated
      //undo/redo should be done to the referred graphics
      this._postUpdatedGraphics = params.postUpdatedGraphics;
      this._postUpdatedGraphicsGeometries = [];
      this._postUpdatedGraphicsAttributes = [];
      for (i = 0; i < params.postUpdatedGraphics.length; i++) {
        this._postUpdatedGraphicsGeometries.push(params.postUpdatedGraphics[i].geometry.toJSON());
        this._postUpdatedGraphicsAttributes.push(lang.clone(params.postUpdatedGraphics[i].attributes));
      }
    },

    performUndo: function () {
      var i;
      for (i = 0; i < this._postUpdatedGraphics.length; i++) {
        this._postUpdatedGraphics[i].setGeometry(jsonUtils.fromJSON(this._preUpdatedGraphicsGeometries[i]));
        this._postUpdatedGraphics[i].setAttributes(this._preUpdatedGraphicsAttributes[i]);
      }
      this._featureLayer.applyEdits(null, this._postUpdatedGraphics, this._addedGraphics);
    },

    performRedo: function () {
      var i;
      for (i = 0; i < this._postUpdatedGraphics.length; i++) {
        this._postUpdatedGraphics[i].setGeometry(jsonUtils.fromJSON(this._postUpdatedGraphicsGeometries[i]));
        this._postUpdatedGraphics[i].setAttributes(this._postUpdatedGraphicsAttributes[i]);
      }
      this._featureLayer.applyEdits(this._addedGraphics, this._postUpdatedGraphics, null);
    }
  });

  

  return Cut;
});
