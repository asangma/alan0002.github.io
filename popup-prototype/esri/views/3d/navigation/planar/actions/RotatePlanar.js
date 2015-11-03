/* jshint bitwise:false */
define([
  "./ActionPlanar",
  "../../mixins/RotateMixin"
], function(
  ActionPlanar,
  RotateMixin
) {

  var RotatePlanar = ActionPlanar.createSubclass([RotateMixin], {
    declaredClass: "esri.views.3d.navigation.planar.actions.RotatePlanar"
  });

  return RotatePlanar;
});
