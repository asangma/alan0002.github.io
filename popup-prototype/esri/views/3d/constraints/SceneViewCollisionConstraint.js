define([
  "../../../core/declare",

  "../../../core/Accessor"
], function(
  declare,
  Accessor
) {

  var SceneViewCollisionConstraint = declare([Accessor], {
    declaredClass: "esri.views.3d.constraints.SceneViewCollisionConstraint",

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    enabled: true,

  });

  return SceneViewCollisionConstraint;
});
