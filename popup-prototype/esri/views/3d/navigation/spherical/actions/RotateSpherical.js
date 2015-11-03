/* jshint bitwise:false */
define([
  "./ActionSpherical",
  "../../mixins/RotateMixin"
], function(
  ActionSpherical,
  RotateMixin
) {

  var RotateSpherical = ActionSpherical.createSubclass([RotateMixin], {
    declaredClass: "esri.views.3d.navigation.spherical.actions.RotateSpherical"
  });

  return RotateSpherical;
});
