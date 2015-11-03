define([
  "../../../core/declare",

  "../../../core/Accessor"
], function(
  declare,
  Accessor
) {
  var SceneViewClipDistanceConstraint = declare([Accessor], {
    declaredClass: "esri.views.3d.constraints.SceneViewClipDistanceConstraint",

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._near = 0;
      this._far = 0;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    near: 0,

    far: 0,

    mode: "auto",

    //--------------------------------------------------------------------------
    //
    //  Internal Methods
    //
    //--------------------------------------------------------------------------

    autoUpdate: function(near, far) {
      if (this.mode === "auto") {
        if (this._near !== near) {
          this._near = near;
          this.notifyChange("near");
        }

        if (this._far !== far) {
          this._far = far;
          this.notifyChange("far");
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _nearGetter: function() {
      return this._near;
    },

    _nearSetter: function(value) {
      this.mode = "manual";

      // Make sure near plane is strictly larger than 0
      this._near = Math.max(1e-8, value);

      if (this._near >= this._far) {
        // Make far at least slightly farther than near
        this.far = this._near + 1e-9;
      }
    },

    _farGetter: function() {
      return this._far;
    },

    _farSetter: function(value) {
      this.mode = "manual";

      // Make sure far plane is strictly larger than 0
      this._far = Math.max(1e-8, value);

      if (this._far <= this._near) {
        // Make near at least slightly nearer than far
        this.near = this._far - 1e-9;
      }
    },

    scale: function(scale) {
      this._near *= scale;
      this.notifyChange("near");

      this._far *= scale;
      this.notifyChange("far");
    }
   });

  return SceneViewClipDistanceConstraint;
});
