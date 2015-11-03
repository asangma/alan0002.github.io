define(
[
  "../../core/declare",
  "dojo/_base/lang", 

  "dojo/has", 

  "../../kernel",
  "../../core/OperationBase"
], function(
  declare, lang,
  has,
  esriKernel, OperationBase
) {
  var Add = declare(OperationBase, {
    declaredClass: "esri.widgets.editing.Add",

    type: "edit",
    label: "Add Features",
    constructor: function ( /*featureLayer, addedGraphics*/ params) {
      params = params || {};
      if (!params.featureLayer) {
        console.error("In constructor of 'esri.widgets.editing.Add', featureLayer is not provided");
        return;
      }
      this._featureLayer = params.featureLayer;

      if (!params.addedGraphics) {
        console.error("In constructor of 'esri.widgets.editing.Add', no graphics provided");
        return;
      }
      this._addedGraphics = params.addedGraphics;
    },

    performUndo: function () {
      this._featureLayer.applyEdits(null, null, this._addedGraphics);
    },

    performRedo: function () {
      this._featureLayer.applyEdits(this._addedGraphics, null, null);
    }
  });

  

  return Add;
});
