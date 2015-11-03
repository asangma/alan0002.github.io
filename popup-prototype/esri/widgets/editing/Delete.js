define(
[
  "../../core/declare",
  "dojo/_base/lang", 

  "dojo/has", 

  "../../kernel",
  "../../core/OperationBase",
  "./Add"
], function(
  declare, lang,
  has,
  esriKernel, OperationBase, Add
) {
  var Delete = declare(OperationBase, {
    declaredClass: "esri.widgets.editing.Delete",
    
    //Delete is the opposite of Add
    type: "edit",
    label: "Delete Features",
    constructor: function ( /*featureLayer, deletedGraphics*/ params) {
      params = params || {};
      this._add = new Add({
        featureLayer: params.featureLayer,
        addedGraphics: params.deletedGraphics
      });
    },

    performUndo: function () {
      this._add.performRedo();
    },

    performRedo: function () {
      this._add.performUndo();
    }
  });

  

  return Delete;
});
