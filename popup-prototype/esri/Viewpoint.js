/**
 * Describes a point of view for a 2D or 3D view. In a 2D view, the viewpoint is
 * determined using a center point and scale value. In a 3D view, it is determined
 * using a {@link module:esri/Camera camera} position. The Viewpoint can be 
 * bookmarked for later use, or used for navigation purposes.
 *
 * @module esri/Viewpoint
 * @since 4.0
 * @see module:esri/views/MapView
 * @see {@link module:esri/views/SceneView#createViewpoint SceneView.createViewpoint()}
 * @see module:esri/Camera
 */
define(
[
  "./core/JSONSupport",

  "./Camera",
  "./core/lang",
  
  "./geometry/support/jsonUtils"
],
function(
  JSONSupport,
  Camera, esriLang,
  jsonUtils
) {

  //--------------------------------------------------------------------------
  //
  //  Viewpoint
  //
  //    Describes what the view 2D/3D should be.
  //    It holds data to express 2 types of views:
  //      - extent, eg: looking at a building
  //      - (2D)center+resolution  (3D)camera position
  //
  //--------------------------------------------------------------------------

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/Viewpoint
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Viewpoint = JSONSupport.createSubclass(
  /** @lends module:esri/Viewpoint.prototype */
  {
    declaredClass: "esri.Viewpoint",

    classMetadata: {
      properties: {
        camera: {
          type: Camera
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    // rotation
    //    honored in 2D. should also be set by 3D clients.

    /**
     * The rotation in degrees between 0 and 360.
     *
     * @type {number}
     */
    rotation: 0,

    _rotationSetter: function(value) {
      value = value % 360;
      if (value < 0) {
        value = value + 360;
      }
      return value;
    },

    // scale
    //    honored in 2D if targetGeometry is a Point, representing the map center.
    //    allows to have lookats that keep the cartographic representation (center+scale)

    /**
     * The scale of the viewpoint.
     *
     * @type {number}
     */
    scale: 0,

    //----------------------------------
    //  targetGeometry
    //----------------------------------

    // 2D:
    //    if extent/polyline/polygon, the extent is set on the map.
    //    if point, the point is set as the map.center and the scale property is applied
    //
    // 3D:
    //    if extent/polyline/polygon, and extent has z values, frame it.
    //    else use the camera, and eventually the targetGeometry is the lookat point
    //    if no camera, apply 2D rules.

    /**
     * The target geometry framed by the viewpoint.
     *
     * @type {module:esri/geometry/Geometry}
     */
    targetGeometry: null,

    _targetGeometryReader: function(value) {
      return jsonUtils.fromJSON(value);
    },

    //----------------------------------
    //  camera
    //----------------------------------

    /**
     * The viewpoint camera (3D only).
     *
     * @type {module:esri/Camera}
     */
    camera: null,

    _cameraReader: function(value) {
      return Camera.fromJSON(value);
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      var json = {
        scale: this.scale,
        rotation: this.rotation,
        targetGeometry: this.targetGeometry ? this.targetGeometry.toJSON() : undefined,
        camera: this.camera ? this.camera.toJSON() : undefined
      };

      if(json.camera){
        // TODO: re-add fov when we have a final fov calculation decision
        delete json.camera.fov;
      }

      return esriLang.fixJson(json);
    },

    /**
     * Create a copy of the viewpoint.
     *
     * @returns {module:esri/Viewpoint} a new {@link module:esri/Viewpoint Viewpoint}.
     */
    clone: function() {
      return new Viewpoint({
        rotation: this.rotation,
        scale: this.scale,
        targetGeometry: this.targetGeometry ? this.targetGeometry.clone() : null,
        camera: this.camera ? this.camera.clone() : null
      });
    }
  });

  return Viewpoint;

});
