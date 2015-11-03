define(
[
  "../../core/declare",
  "dojo/_base/lang", 

  "dojo/has", 

  "../../kernel",
  "../../core/OperationBase",
  "./Cut"
], function(
  declare, lang,
  has,
  esriKernel, OperationBase, Cut
) {
  var Union = declare(OperationBase, {
    declaredClass: "esri.widgets.editing.Union",

    type: "edit",
    label: "Union Features",
    // Union is the same as Cut. the only difference is that Cut has exactly opposite way when doing undo/redo  
    constructor: function ( /*featureLayer, deletedGraphics, preUpdatedGraphics, postUpdatedGraphics*/ params) {
      params = params || {};
      this._cut = new Cut({
        featureLayer: params.featureLayer,
        addedGraphics: params.deletedGraphics,
        preUpdatedGraphics: params.preUpdatedGraphics,
        postUpdatedGraphics: params.postUpdatedGraphics
      });
    },

    performUndo: function () {
      this._cut.performRedo();
    },

    performRedo: function () {
      this._cut.performUndo();
    }

  });

  

  return Union;
});
