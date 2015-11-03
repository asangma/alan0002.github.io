/**
 * The visible extent of a 3D view. The Camera has [tilt](#tilt), [position](#position), and [heading](#heading)
 * properties to define the extent of the view.
 *
 * @module esri/Camera
 * @since 4.0
 * @see [Sample - Easy navigation](../sample-code/3d/easy-navigate-3d/)
 */
define([
  "dojo/_base/lang",

  "./core/JSONSupport",
  "./core/lang",
  
  "./geometry/Point",
  "./views/3d/support/mathUtils"
],
function(
  lang,
  JSONSupport, esriLang,
  Point, mathUtils
) {
  
  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/Camera
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Camera = JSONSupport.createSubclass(
  /** @lends module:esri/Camera.prototype */
  {
    declaredClass: "esri.Camera",

    classMetadata: {
      // properties: {
      //   position: {
      //     type: Point
      //   }
      // },
      reader: {
        exclude: ["fov"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(obj) {
      if (!obj.position) {
        return {
          position: new Point([0, 0, 0])
        };
      }
    },

    normalizeCtorArgs: function(position, heading, tilt, fov) {
      var ret = {
      };

      if (lang.isObject(position) && esriLang.isDefined(position)) {
        if (esriLang.isDefined(position.position) ||
            esriLang.isDefined(position.tilt) ||
            esriLang.isDefined(position.heading) ||
            esriLang.isDefined(position.fov)) {

          if (esriLang.isDefined(position.position)) {
            ret.position = new Point(position.position);
          }
          if (esriLang.isDefined(position.heading)) {
            ret.heading = position.heading;
          }
          if (esriLang.isDefined(position.tilt)) {
            ret.tilt = position.tilt;
          }
          if (esriLang.isDefined(position.fov)) {
            ret.fov = position.fov;
          }
        }
        else if (esriLang.isDefined(position) && (esriLang.isDefined(position.x) || Array.isArray(position))) {
          ret.position = new Point(position);
        }
      }

      if (esriLang.isDefined(heading)) {
        ret.heading = heading;
      }

      if (esriLang.isDefined(tilt)) {
        ret.tilt = tilt;
      }

      if (esriLang.isDefined(fov)) {
        ret.fov = fov;
      }

      return ret;
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  position
    //----------------------------------

    /**
     * The position of the camera defined by a map point.
     *
     * @type {module:esri/geometry/Point}
     */
    position: null,

    _positionReader: function(value, source) {
      return Point.fromJSON(value);
    },

    //----------------------------------
    //  heading
    //----------------------------------

    /**
     * The heading of the camera in degrees. Heading
     * is zero when north is the top of the screen. It increases as the view rotates
     * counter-clockwise. The angles are always normalized between 0 and 360 degrees.
     *
     * @type {number}
     * @default 0
     */
    heading: 0,

    _headingSetter: function(heading) {
      return mathUtils.cyclicalDeg.normalize(heading);
    },

    //----------------------------------
    //  tilt
    //----------------------------------

    /**
     * The tilt of the camera in degrees with respect to the surface as projected
     * down from the camera position. Tilt is zero when looking straight down
     * at the surface and 90 degrees when the camera is looking parallel to
     * the surface.
     *
     * @type {number}
     * @default 0
     */
    tilt: 0,

    _tiltSetter: function(tilt) {
      // ensure that tilt is within [-180, 180] by clamping
      return Math.min(180, Math.max(-180, tilt));
    },

    //----------------------------------
    //  fov
    //----------------------------------

    /**
     * The field of view of the camera in degrees.
     *
     * @type {number}
     * @default
     */
    fov: 55,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    equals: function(camera) {
      if (!camera) {
        return false;
      }

      return (
        this.tilt === camera.tilt &&
        this.heading === camera.heading &&
        this.fov === camera.fov &&
        this.position.equals(camera.position)
      );
    },

    /**
     * Creates a copy of the camera.
     *
     * @return {module:esri/Camera} A new instance of {@link module:esri/Camera Camera}.
     */
    clone: function() {
      return new Camera({
        position: this.position.clone(),
        heading: this.heading,
        tilt: this.tilt,
        fov: this.fov
      });
    },

    toJSON: function() {
      var camera = {
        position: this.position.toJSON(),
        heading: this.heading,
        tilt:  this.tilt
      };
      return esriLang.fixJson(camera);
    }
  });

  return Camera;
});
