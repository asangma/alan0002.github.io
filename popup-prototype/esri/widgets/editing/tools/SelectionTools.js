define(
[
  "dojo/_base/lang", 
  "dojo/has", 
  "../../../layers/FeatureLayer",
  "../../../toolbars/draw",
  "../../../kernel"
], function(
    lang, has, FeatureLayer, Draw, esriKernel
) {
    var SelectionTools = {
      select : {
          id            : "btnNewSelection",
          _enabledIcon  : "toolbarIcon newSelectionIcon",
          _disabledIcon : "toolbarIcon newSelectionIcon",
          _drawType     : Draw.EXTENT,
          _selectMethod : FeatureLayer.SELECTION_NEW,
          _label: "NLS_selectionNewLbl"
      },
      selectadd: {
        id: "btnAddToSelection",
        _enabledIcon: "toolbarIcon addToSelectionIcon",
        _disabledIcon: "toolbarIcon addToSelectionIcon",
        _drawType: Draw.EXTENT,
        _selectMethod: FeatureLayer.SELECTION_ADD,
        _label: "NLS_selectionAddLbl"
      },
      selectremove: {
        id: "btnSubtractFromSelection",
        _enabledIcon: "toolbarIcon removeFromSelectionIcon",
        _disabledIcon: "toolbarIcon removeFromSelectionIcon",
        _drawType: Draw.EXTENT,
        _selectMethod: FeatureLayer.SELECTION_SUBTRACT,
        _label: "NLS_selectionRemoveLbl"
      },
      selectClear: {
         id: "btnClearSelection",
         _enabledIcon: "toolbarIcon clearSelectionIcon",
         _disabledIcon: "toolbarIcon clearSelectionIcon",
         _enabled: false,
         _label: "NLS_selectionClearLbl"
      }
  };

  

  return SelectionTools;
});