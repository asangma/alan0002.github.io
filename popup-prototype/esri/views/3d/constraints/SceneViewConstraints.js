/**
 * Contains metadata settings for the 
 * {@link module:esri/views/SceneView SceneView}.
 * 
 * @module esri/views/3d/SceneViewConstraints
 * @since 4.0
 */
define([
  "../../../core/declare",
  "../../../core/Accessor",

  "./SceneViewAltitudeConstraint",
  "./SceneViewClipDistanceConstraint",
  "./SceneViewTiltConstraint",
  "./SceneViewCollisionConstraint"
], function(
  declare, Accessor,
  SceneViewAltitudeConstraint, SceneViewClipDistanceConstraint, SceneViewTiltConstraint, SceneViewCollisionConstraint
) {
  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/views/3d/SceneViewConstraints
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */    
  var SceneViewConstraints = declare([Accessor], 
  /** @lends module:esri/views/3d/SceneViewConstraints.prototype */                                    
  {
    declaredClass: "esri.views.3d.constraints.SceneViewConstraints",

    classMetadata: {
      properties: {
        tilt: {
          type: SceneViewTiltConstraint
        },

        altitude: {
          type: SceneViewAltitudeConstraint
        },

        clipDistance: {
          type: SceneViewClipDistanceConstraint
        },

        collision: {
          type: SceneViewCollisionConstraint
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(obj) {
      var ret = {};

      if (!obj.tilt) {
        ret.tilt = {};
      }

      if (!obj.altitude) {
        ret.altitude = {};
      }

      if (!obj.clipDistance) {
        ret.clipDistance = {};
      }

      if (!obj.collision) {
        ret.collision = {};
      }

      return ret;
    },

    scale: function(scale) {
      this.tilt.scale(scale);
      this.altitude.scale(scale);
      this.clipDistance.scale(scale);
    }
  });

  return SceneViewConstraints;
});
