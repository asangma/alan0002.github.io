define(
[
  "../../core/declare",

  "./LayerView",
  
  "../LayerViewsOwner"
],
function(
  declare,
  LayerView,
  LayerViewsOwner
) {

var GroupLayerView = declare([LayerView, LayerViewsOwner], {
  declaredClass: "esri.views.layers.GroupLayerView"
});

return GroupLayerView;

});
