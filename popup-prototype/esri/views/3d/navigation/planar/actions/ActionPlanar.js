define([
  "../../Action",
  "../../../lib/glMatrix"
], function(
  Action,
  glMatrix
) {

  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;

  var ActionPlanar = Action.createSubclass({
    declaredClass: "esri.views.3d.navigation.planar.actions.ActionPlanar",

    constructor: function() {
      this._plane = vec4d.create();
    },

    updatePlane: function(pos, normal) {
      vec4d.set4(normal[0], normal[1], normal[2],
                 -vec3d.dot(normal, pos), this._plane);
    }
  });

  return ActionPlanar;
});
