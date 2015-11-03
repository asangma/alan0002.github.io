/**
 * Renders the environment settings for the 
 * {@link module:esri/views/SceneView SceneView}.
 * 
 * @module esri/views/3d/SceneViewEnvironment
 * @since 4.0
 */
define([
  "../../../webscene/Environment",
  "../../../webscene/Lighting",
  "./SceneViewLighting",
], function(
  Environment, Lighting,
  SceneViewLighting
) {

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/views/3d/SceneViewEnvironment
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */  
  var SceneViewEnvironment = Environment.createSubclass(
  /** @lends module:esri/views/3d/SceneViewEnvironment.prototype */                                   
  {
    declaredClass: "esri.views.3d.environment.SceneViewEnvironment",

    classMetadata: {
      properties: {
        atmosphere: {
          value: "default",

          setter: function(value) {
            var validValues = ["none", "default", "realistic"];

            if (validValues.indexOf(value) !== -1) {
              return value;
            } else {
              return this.atmosphere;
            }
          }
        },

        stars: {
          value: "default",

          setter: function(value) {
            var validValues = ["none", "default"];

            if (validValues.indexOf(value) !== -1) {
              return value;
            } else {
              return this.stars;
            }
          }
        },

        lighting: {
          setter: function(lighting) {
            if (!lighting) {
              if (!this.lighting) {
                return new SceneViewLighting();
              }

              return this.lighting;
            }

            if (!this.lighting) {
              if (lighting instanceof SceneViewLighting) {
                return lighting;
              } else if (lighting instanceof Lighting) {
                var props = {
                  directShadows: lighting.directShadows,
                  ambientOcclusion: lighting.ambientOcclusion
                };

                if (lighting.date != null) {
                  props.date = lighting.date;
                }

                if (lighting.displayUTCOffset != null) {
                  props.displayUTCOffset = lighting.displayUTCOffset;
                }

                return new SceneViewLighting(props);
              } else {
                return new SceneViewLighting(lighting);
              }
            }

            if (lighting.date != null) {
              this.lighting.date = lighting.date;
            }

            if (lighting.displayUTCOffset != null) {
              this.lighting.displayUTCOffset = lighting.displayUTCOffset;
            }

            this.lighting.directShadows = lighting.directShadows;
            this.lighting.ambientOcclusion = lighting.ambientOcclusion;

            return this.lighting;
          }
        }
      },

      reader: {
        exclude: ["atmosphere", "stars"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  atmosphere
    //----------------------------------

    atmosphere: "default",

    //----------------------------------
    //  stars
    //----------------------------------

    stars: "default",

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    clone: function() {
      return new SceneViewEnvironment({
        lighting: this.lighting.clone(),
        atmosphere: this.atmosphere,
        stars: this.stars
      });
    }
  });

  return SceneViewEnvironment;
});
