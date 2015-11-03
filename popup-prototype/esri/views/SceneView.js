/**
 * A SceneView displays a 3D view of a {@link module:esri/Map Map} instance. An instance of SceneView 
 * must be created to render a {@link module:esri/Map Map} (along with its operational and base layers)
 * in 3D. To render a map and its layers in 2D, see the documentation for {@link module:esri/views/MapView MapView}. 
 * For a general overview of views, see {@link module:esri/views/View View}.
 *
 * For a map to be visible to the user in the DOM, a SceneView must be created and reference a minimum of two objects: 
 * a [Map instance](#map) and a [DOM element](#container). Each is set in the [map](#map) and [container](#container) properties respectively.
 *
 * ```js
 * //create a SceneView instance (for 3D viewing)
 * var view = new SceneView({
 *   map: myMap,  //references a Map instance
 *   container: "viewDiv"  //references the ID of a DOM element
 * });
 * ```
 *
 * In addition to being responsible for the rendering of the {@link module:esri/Map Map} and its elements, the SceneView handles the interaction 
 * between the user and the map. For example, the traditional map scale isn't set on the {@link module:esri/Map Map}; it's set on the SceneView.
 *
 * ```
 * view.scale = 24000; //sets a 1:24,0000 scale on the view
 * ```
 *
 * Similar to {@link module:esri/views/MapView MapView}, you can set the [center](#center) and [zoom](#zoom) properties to easily define the 
 * inital extent of the map.
 *
 * ```
 * //Set the center and zoom level on the view
 * var view = new SceneView({
 *   map: myMap,
 *   container: "viewDiv" 
 *   center: [-112, 38], //sets the center point of the view at a specified lon/lat
 *   zoom: 13 //sets the zoom LOD to 13
 * });
 * ```
 *
 * Unlike {@link module:esri/views/MapView MapView}, the SceneView does not have an 
 * {@link module:esri/views/MapView#extent extent} property that allows you to define the visible portion of the map. 
 * The nature of 3D viewing includes oblique views, z-values, and rotation, all of which add additional complexity 
 * to defining what is visible in the view. Instead of extent, SceneView has a [camera](#camera) that allows you 
 * to define variables, such as position, height, heading, and tilt. See the documentation of 
 * {@link module:esri/Camera Camera} for more details.
 * 
 * An instance of SceneView is also a [Promise](../guide/working-with-promises/#classes-as-promises). Call the `.then()` 
 * method on the SceneView to execute processes that may only run after the {@link module:esri/Map#loaded map has loaded}.
 *
 * ```js
 * //create a SceneView instance (for 3D viewing)
 * var view = new SceneView({
 *   map: myMap,  //references a Map instance
 *   container: "viewDiv"  //references the ID of a DOM element
 * });
 *
 * view.then(function(){
 *  //All the resources in the SceneView and the map have loaded. Now execute additional processes
 * }, function(error){
 *  //Use the errback function to handle when the view doesn't load properly
 *  console.log("The view's resources failed to load: ", error);
 * });
 * ```
 *
 * To learn more about Promises, see [this article in the Guide](../guide/working-with-promises/). For 
 * live examples of `view.then()`, see the [2D overview map in SceneView](../sample-code/3d/2d-overview-map/) 
 * and [Toggle elevation layer](../sample-code/3d/toggle-basemap-elevation/) samples.
 *
 * Because the View handles user interaction, events such as [click](#event:click) are handled on the SceneView. 
 * [Animations](#animateTo) are also possible with the [AnimateTo()](#animateTo) method, which allows you to animate
 * the SceneView from one extent to another.
 *
 * The default SceneView navigation includes mouse interaction as described in the table below.
 *
 * Mouse action | SceneView behavior
 * ------|------------
 * Drag | Pan
 * Double-click | Zoom in with scene re-centered and ortho-northed
 * Scroll forward | Zoom in at the cursor
 * Scroll backward | Zoom out at the center of the current view
 * Right-click+Drag | 3D-rotate
 *
 * @module esri/views/SceneView
 * @since 4.0
 * @see [Sample - Basic map (3D)](../sample-code/3d/basic3d/)
 * @see [Sample - SceneLayer](../sample-code/3d/scene-layer/)
 * @see [Sample - Easy navigation](../sample-code/3d/easy-navigate-3d/)
 * @see [Sample - Elevation Info](../sample-code/3d/elevationinfo-3d/)
 * @see [Sample - Toggle basemap elevation](../sample-code/3d/toggle-basemap-elevation/)
 * @see [Sample - Environment](../sample-code/3d/environment-3d/)
 * @see [Sample - Detect WebGL support](../sample-code/3d/webgl-support-3d/)
 * @see module:esri/views/MapView
 * @see module:esri/Map
 */

/**
 * Fires after clicking on the view.
 *
 * @event module:esri/views/SceneView#click
 * @property {module:esri/geometry/Point} mapPoint - The point location of the click on the view in the spatial
 * reference of the map.
 * @property {module:esri/geometry/ScreenPoint} screenPoint - The screen location of the click in pixels.
 * @property {module:esri/Graphic} graphic - A graphic if the location of the click intersects a graphic in the
 * map, or `null` if no graphic exists at the clicked location.
 * 
 * @example
 * view.on("click", function(evt){
 *   //evt is the event object returned after the event fires
 *   
 *   //prints the map coordinates of the clicked location
 *   console.log(evt.mapPoint);
 *   //prints the screen coordinates of the clicked location
 *   console.log(evt.screenPoint);
 *   //the graphic object if a feature is clicked in the view
 *   console.log(evt.graphic);
 * });
 */

define([
  "../core/declare", "dojo/_base/lang", "dojo/_base/kernel", "dojo/dom", "dojo/Deferred",

  "./View",
  "./ViewAnimation",

  "../geometry/SpatialReference",
  "../geometry/support/webMercatorUtils",
  "../Camera",
  "../geometry/Point",
  "../geometry/Extent",
  "../geometry/ScreenPoint",
  "../Viewpoint",

  "../core/Scheduler",
  "../core/sniff",
  "../core/watchUtils",

  "../webscene/Environment",

  "./3d/environment/SceneViewEnvironment",
  "./3d/environment/SceneViewEnvironmentManager",
  "./3d/constraints/SceneViewConstraints",

  "./3d/lib/glMatrix",

  "./3d/support/cameraUtils",
  "./3d/support/viewpointUtils",
  "./3d/support/eventUtils",
  "./3d/support/projectionUtils",

  "./3d/webgl-engine/Stage",
  "./3d/webgl-engine/lib/Selector",
  "./3d/support/RenderCoordsHelper",
  "./3d/support/MapCoordsHelper",
  "./3d/support/ResourceController",
  "./3d/terrain/TerrainSurface",
  "./3d/layers/graphics/LabelManager",

  "./3d/navigation/spherical/NavigationSpherical",
  "./3d/navigation/planar/NavigationPlanar",
  "./3d/navigation/EventController",

  "./3d/support/Frustum",
  "./3d/webgl-engine/lib/es6-shim"
], function(declare, lang, kernel, dom, Deferred,
            View, ViewAnimation,
            SpatialReference, webMercatorUtils, Camera,
            Point, Extent, ScreenPoint, Viewpoint,
            Scheduler, has, watchUtils,
            Environment,
            SceneViewEnvironment, SceneViewEnvironmentManager, SceneViewConstraints,
            glMatrix,
            cameraUtils, viewpointUtils, eventUtils, projectionUtils,
            Stage, Selector, RenderCoordsHelper, MapCoordsHelper, ResourceController, TerrainSurface, LabelManager,
            NavigationSpherical, NavigationPlanar,
            EventController,
            Frustum, es6_shim_) {

  var vec3d = glMatrix.vec3d;

  var tmpVec3 = vec3d.create();

  var tmpPoint = new Point(0, 0, 0);
  var tmpCamera = new Camera(new Point(0, 0, 0));

  var tmpHeadingTilt = {
    heading: 0,
    tilt: 0
  };

  function getInitialProp(name, f) {
    return function() {
      if (!this.ready || this._destroying) {
        return this._initialProps && this._initialProps[name];
      }

      return f.apply(this, arguments);
    };
  }

  function setInitialProp(name, f) {
    return function(value) {
      if (!this.ready || this._destroying) {
        this._initialProps[name] = value;
      } else {
        return f.apply(this, arguments);
      }
    };
  }

  /**
   * @extends module:esri/views/View
   * @constructor module:esri/views/SceneView
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  var SceneView = declare(View,
  /** @lends module:esri/views/SceneView.prototype */
  {
    declaredClass: "esri.views.SceneView",

    classMetadata: {
      properties: {
        spatialReference: {
          readOnly: true,
          dependsOn: ["map.spatialReference"],
          getter: function() {
            return this.map && this.map.spatialReference;
          }
        },
        camera: {
          copy: function(val, from) {
            val.position.x = from.position.x;
            val.position.y = from.position.y;
            val.position.z = from.position.z;
            val.position.spatialReference = from.position.spatialReference;

            val.heading = from.heading;
            val.tilt = from.tilt;
          },
          type: Camera
        },

        center: {
          copy: function(val, from) {
            if (!val) {
              return from.clone();
            }

            val.x = from.x;
            val.y = from.y;
            val.z = from.z;
            val.spatialReference = from.spatialReference;

            return val;
          },
          type: Point
        },

        extent: {
          copy: function(val, from) {
            val.xmin = from.xmin;
            val.ymin = from.ymin;
            val.zmin = from.zmin;

            val.xmax = from.xmax;
            val.ymax = from.ymax;
            val.zmax = from.zmax;

            val.spatialReference = from.spatialReference;
          },
          type: Extent
        },

        viewpoint: {
          copy: function(val, from) {
            val.rotation = from.rotation;
            val.scale = from.scale;
            val.targetGeometry = from.targetGeometry;
            val.camera = from.camera;
          },

          type: Viewpoint
        },

        viewingMode: {
          value: "global",
          dependsOn: ["map.viewingMode"],

          getter: function() {
            return this._viewingMode || this.get("map.viewingMode") || "global";
          },

          setter: function(v) {
            var allowedValues = ["local", "global"];

            if (allowedValues.indexOf(v) !== -1 && this._viewingMode !== v) {
              this._viewingMode = v;

              if (!this.get("map.viewingMode")) {
                if (this.ready) {
                  this._initGlobe(this.globeMode);
                }
              }
            }

            return this.viewingMode;
          }
        },

        globeMode: {
          dependsOn: ["viewingMode"]
        },

        fullExtent: {
          dependsOn: ["basemapTerrain.extent"],
          readOnly: true
        },

        clippingArea: {
          type: Extent,
          dependsOn: ["map.clippingArea", "map.clippingEnabled"],
          readOnly: true,

          getter: function() {
            var clip = this.get("map.clippingEnabled");
            var clippingArea = this.get("map.clippingArea");

            if (!clip || !clippingArea) {
              this._clippingArea = null;
              return null;
            }

            if (!(clippingArea instanceof Extent)) {
              console.error("Only clippingArea geometries of type Extent are supported");
              return this._clippingArea;
            }

            if (!webMercatorUtils.canProject(clippingArea.spatialReference, this.spatialReference)) {
              console.error("Setting clippingArea with incompatible SpatialReference.");
              return this._clippingArea;
            } else {
              clippingArea = webMercatorUtils.project(clippingArea, this.spatialReference);
            }

            // Do not change if equal to old clippingArea
            if (this._clippingArea && clippingArea && this._clippingArea.equals(clippingArea)) {
              return this._clippingArea;
            }

            this._clippingArea = clippingArea;
            return clippingArea;
          }
        },

        basemapTerrain: {
          readOnly: true
        },

        canvas: {
          readOnly: true
        },

        environment: {
          setter: function(environment) {
            if (environment !== this._defaults.environment) {
              this._externallySet.environment = true;
            }

            if (!environment) {
              return new SceneViewEnvironment();
            }

            if (environment instanceof SceneViewEnvironment) {
              return environment;
            } else if (environment instanceof Environment) {
              this.environment.lighting = environment.lighting;
            } else if (!environment.declaredClass) {
              return new SceneViewEnvironment(environment);
            } else {
              return environment;
            }

            return this.environment;
          }
        },

        constraints: {
          type: SceneViewConstraints
        },

        animation: {
          type: ViewAnimation
        },

        navigation: {
          readOnly: true
        }
      },
      computed: {
        scale: ["camera"],
        zoom: ["camera"],
        center: ["camera"],
        viewpoint: ["camera"],
        extent: ["camera"],
        rotation: ["camera"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------
    getDefaults: function(obj) {
      var ret = lang.mixin(this.inherited(arguments), {
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      });

      if (!ret.constraints && !obj.constraints) {
        this._defaults.constraints = new SceneViewConstraints();
        ret.constraints = this._defaults.constraints;
      }

      if (!ret.environment && !obj.environment) {
        this._defaults.environment = new SceneViewEnvironment();
        ret.environment = this._defaults.environment;
      }

      return ret;
    },

    constructor: function() {
      window.svid = (window.svid || 0) + 1;

      this.id = window.svid;
      watchUtils.when(this, "ready", this._viewReadyHandler.bind(this));

      this._initialProps = {};
      this._canvas = null;
      this._basemapTerrain = null;

      this._viewingMode = null;
      this._initCoordinateSystem();

      this._frustum = new Frustum();

      this.animation = null;
      this._animationStateWatcher = null;
      this._animationDelayId = null;

      this._constraints = null;
      this._clippingArea = null;

      this._navigation = null;
      this.navigationController = null;
      this.navigationControls = EventController.PAN;

      this._defaults = {};
      this._externallySet = {};

      this.resourceController = new ResourceController(this);
      this.labelManager = new LabelManager(this);

      this._updateDrawingOrderHandle = this.layerViewsFlat.on("change", this._updateDrawingOrder.bind(this));
      this._updateDrawingOrder();

      this._layerViewsUpdatingHandles = {};
      this._evaluateUpdating = this._evaluateUpdating.bind(this);

      this._updateUpdatingMonitorsHandle = this.layerViewsFlat.on("change", this._updateUpdatingMonitors.bind(this));

      this._navigationHandles = eventUtils.on(this, {
        navigation: {
          currentViewChanged: this._navigationCurrentViewChanged,
          targetViewChanged: {
            handler: this._navigationTargetViewChanged,
            pausable: true
          },
          currentViewReachedTarget: this._navigationCurrentViewReachedTarget,
          animationStarted: {
            handler: this._navigationAnimationStarted,
            pausable: true
          }
        }
      }, this);

      this._navigationHandles.push(this.watch("navigation.interacting", this._navigationInteractingChanged.bind(this)));

      this._mapSpatialReferenceHandle = this.watch("map.spatialReference", this._mapSpatialReferenceChanged.bind(this));
    },

    initialize: function() {
      if (!has("esri-webgl")) {
        this._viewInitializePromise.reject(new Error("WebGL is required but not supported"));
      } else {
        this._viewInitializePromise.resolve();
      }

      this.environmentManager = new SceneViewEnvironmentManager({
        view: this
      });

      watchUtils.whenNot(this, "ready", this._viewUnreadyHandler.bind(this));
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * The dimension of the view. For SceneView, this value is always `3d`.
     *
     * @type {string}
     * @readonly
     */
    type: "3d",

    updatingPercentage: 0,

    /**
     * The viewing mode, allowed values are ["global", "local"].
     *
     * @type {string}
     * @default "global"
     */
    viewingMode: "global",

    /**
     * Specifies various properties of the environment
     * visualization in the view.
     *
     * @type {module:esri/core/Accessor}
     *
     * @property {module:esri/core/Accessor} lighting Lighting conditions of the scene.
     * @property {Date} lighting.date The current date and time of the simulated sun. 
     * <br><br><b>Default Value: </b>new Date("March 15, 2015 12:00:00")
     * @property {boolean} lighting.directShadows Indicates whether or not to show shadows cast by the sun.
     * <br><br><b>Default Value: </b>false
     * @property {boolean} lighting.ambientOcclusion Indicates whether or not to show ambient occlusion shading.
     * <br><br><b>Default Value: </b>false
     * @property {string} atmosphere Indicates which type of atmosphere visualization is enabled.
     * `view.environment.atmosphere = "default";` ![scene-atmosphere](../assets/img/apiref/views/scene-atmosphere.png)<br>
     * `view.environment.atmosphere = "realistic";` 
     * ![scene-atmosphere](../assets/img/apiref/views/scene-atmosphere-realistic.png)<br>
     * `view.environment.atmosphere = "none";` ![scene-no-atmosphere](../assets/img/apiref/views/scene-no-atmosphere.png)<br>
     * <br><b>Default Value: </b>default
     * @property {string} stars Indicates which type of stars visualization is enabled.
     * `view.environment.stars = "default";`<br>
     * `view.environment.stars = "none";`<br>
     * <br><b>Default Value: </b>default
     */
    environment: null,

    /**
     * Specifies constraints to that may be applied to the view. See the object specification table below for details.
     *
     * @type {module:esri/core/Accessor}
     *
     * @property {module:esri/core/Accessor} tilt Specifies a constraint on the amount of allowed tilting of the view.
     * @property {number} tilt.max Specifies the maximum amount of tilt (in degrees)
     *                             allowed in the view and may range from 0.5 to
     *                             179.5 degrees.
     * @property {string} tilt.mode Specifies the mode of the constraint. There are two possible values:
     *                               `auto` or `manual`. In `auto` mode,
     *                              the maximum tilt value is automatically determined
     *                              based on the altitude of the view camera. In
     *                              `manual` mode, the maximum tilt value is a
     *                              user defined, constant value. **Note:** The mode
     *                              automatically changes to `manual` whenever
     *                              the `max` property is set. 
     *                              <br><br><b>Default:</b> auto
     *
     * @property {module:esri/core/Accessor} altitude Specifies a constraint on the minimum and maximum allowed camera altitude.<br>
     * @property {number} altitude.min The minimum allowed camera altitude (in meters).
     *                        <br><br><b>Default:</b> -∞
     * @property {number} altitude.max The maximum allowed camera altitude (in meters).
     *                        <br><br><b>Default:</b> EARTH_RADIUS * 4
     * @property {module:esri/core/Accessor} clipDistance Specifies the near and far webgl clip distances.<br>
     * @property {number} clipDistance.near The near clip distance.
     * @property {number} clipDistance.far  The far clip distance.
     * @property {string} clipDistance.mode Specifies the mode of the constraint which is
     *                                      either `auto` or `manual`. In `auto` mode,
     *                                      the near and far clip distance values are
     *                                      automatically determined. In `manual` mode,
     *                                      the near and far clip distance values are user
     *                                      defined, constant values. Note that the mode
     *                                      automatically changes to `manual` whenever
     *                                      the `near` or `far` property is set.
     *                                      <br><br><b>Default:</b> auto
     */
    constraints: null,

    /**
     * Represents an ongoing view animation initialized by [animateTo()](#animateTo).
     * You may {@link module:esri/core/Accessor#watch watch} this property to be notified of the animation's state.
     *
     * @type {module:esri/views/ViewAnimation}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     * 
     * @example
     * view.watch("animation", function(response){
     *   if(response && response.state === "running"){
     *     console.log("Animation in progress");
     *   }
     *   else{
     *    console.log("No animation");
     *   }
     * });
     */
    animation: null,

    /**
     * The observation point from which the visible portion (or perspective) of the SceneView is determined. 
     * Contains properties including the elevation, tilt, and heading (in degrees) of the current view.
     * Setting the camera immediately changes the current view. For animating the
     * view, see {@link module:esri/views/SceneView#animateTo animateTo()}.
     *
     * The returned {@link module:esri/Camera Camera} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/Camera#clone Camera.clone()}.
     *
     * @type {module:esri/Camera}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     * 
     * @example
     * var myCam = view.camera;
     * //prints the Point location (x, y, z) of the camera
     * console.log(myCam.position);
     * //prints the heading of the view
     * console.log(myCam.heading);
     */
    camera: null,

    /**
     * Represents the current view as a {@link module:esri/Viewpoint Viewpoint}
     * or point of observation on the view. In SceneViews, [camera](#camera) 
     * should be used in favor of viewpoint for watching or changing the point of view.
     * Setting the viewpoint immediately changes the current view. For animating
     * the view, see {@link module:esri/views/SceneView#animateTo animateTo()}.
     *
     * The returned {@link module:esri/Viewpoint Viewpoint} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/Viewpoint#clone Viewpoint.clone()}.
     *
     * @type {module:esri/Viewpoint}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     */
    viewpoint: null,

    /**
     * The extent represents the visible portion of a {@link module:esri/Map map} within the view as an instance of {@link module:esri/geometry/Extent Extent}.
     * Setting the extent immediately changes the view without animation. To animate
     * the view, see {@link module:esri/views/MapView#animateTo animateTo()}.
     * 
     * Rather than using extent to change the visible portion of the {@link module:esri/Map map} in a SceneView, you should use [camera](#camera) since it easily allows you to define the heading, elevation and tilt of the observation point from which the view's perspective is created.
     *
     * The returned {@link module:esri/geometry/Extent Extent} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/geometry/Extent#clone Extent.clone()}.
     *
     * @type {module:esri/geometry/Extent}
     * @see {@link module:esri/views/SceneView#camera camera}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     */
    extent: null,

    /**
     * Represents an optional clipping area of a {@link module:esri/Map map} as an instance of {@link module:esri/geometry/Extent Extent}.
     * If defined, only data within the area will be displayed.
     * 
     * The returned {@link module:esri/geometry/Extent Extent} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/geometry/Extent#clone Extent.clone()}.
     *
     * @type {module:esri/geometry/Extent}
     * @private
     */
    clippingArea: null,

    /**
     * Represents the map scale at the center of the view.
     * Setting the scale immediately changes the current view. For animating
     * the view, see [animateTo()](#animateTo).
     *
     * @type {number}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     * 
     * @example
     * view.scale = 24000;  //sets the map scale in the view's center to 1:24,000
     */
    scale: 0,

    //----------------------------------
    //  ui
    //----------------------------------

    /**
    * Exposes the default widgets available in the view and allows you to toggle them on
    * and off. See object specification table and example snippets below for more details.
    *
    * @name ui
    * @instance
    * @type {Object}
    *
    * @property {string[]} components - An array of strings representing the default
    * widgets visible when a SceneView is created. By default, the array looks like the following:
    * `view.ui.components = ["logo", "attribution", "compass", "zoom"]`
    *
    * @example
    * //Toggles off all default widgets
    * view.ui.components = [];
    * @example
    * //Toggles on only the logo
    * view.ui.components = ["logo"];
    * @example
    * //Toggles on all default widgets
    * view.ui.components = ["logo", "attribution", "compass", "zoom"];
    */

    /**
     * Represents the level of detail (LOD) at the center of the view.
     * Setting the zoom immediately changes the current view. For animating
     * the view, see [animateTo()](#animateTo).
     * 
     * Setting this property in conjunction with [center](#center) is a convenient way
     * to set the initial extent of the view.
     *
     * @type {number}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     * 
     * @example
     * view.zoom = 3;  //sets the LOD to 3 (small map scale)
     * view.zoom = 18; //sets the LOD to 18 (large map scale)
     * 
     * @example
     * //Set the zoom level and center in the constructor
     * var view = new SceneView({
     *   zoom: 10,
     *   center: [-120, 34],
     *   map: map
     * });
     */
    zoom: 0,

    /**
     * Represents the view's center point. This may be an instance of {@link module:esri/geometry/Point Point} or a latitude/longitude pair.
     * Setting the center immediately changes the current view. For animating
     * the view, see {@link module:esri/views/SceneView#animateTo animateTo()}.
     *
     * The returned {@link module:esri/geometry/Point Point} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/geometry/Point#clone Point.clone()}.
     *
     * @type {module:esri/geometry/Point}
     * @see {@link module:esri/views/SceneView#animateTo animateTo()}
     * 
     * @example 
     * //Sets the initial center point of the view to lat/long coordinates
     * var view = new SceneView({
     *   center: [-112, 38]
     * })
     * 
     * @example 
     * //Updates the view's center point to a pre-determined Point object
     * var pt = new Point({
     *   x: 12804.24,
     *   y: -1894032.09,
     *   z: 12000
     *   spatialReference: 2027
     * });
     * view.center = pt;
     */
    center: null,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Converts the given screen point to map coordinates.
     * @param   {number} x The screen X-coordinate.
     * @param   {number} y The screen Y-coordinate.
     * @param   {module:esri/geometry/Point=} mapPoint - Point object that will store the result.
     * @return {module:esri/geometry/Point} The map point corresponding to the given screen coordinates.
     */
    toMap: function(x, y, retval) {
      if (!this.ready) {
        return null;
      }

      var point = this._normalizePoint(x, y, undefined, tmpPoint);

      var screenPoint = [point.x, this.height - point.y];
      var minResult = this._stage._pick(screenPoint).getMinResult();

      return this._computeMapPointFromIntersectionResult(minResult, retval);
    },

    /**
     * Converts the given map point to screen coordinates.
     * @param   {number} x The map X-coordinate.
     * @param   {number} y The map Y-coordinate.
     * @param   {module:esri/geometry/ScreenPoint=} screenPoint - ScreenPoint object that will
     *                                                          store the result.
     * @return {module:esri/geometry/ScreenPoint} The screen point corresponding to the given
     *                                            map point.
     */
    toScreen: function(x, y, z, retval) {
      if (!this.ready) {
        return null;
      }

      var mapPoint = this._normalizePoint(x, y, z, tmpPoint);

      projectionUtils.pointToVector(mapPoint, tmpVec3, this.renderSpatialReference);

      return this.engineToScreen(tmpVec3, retval);
    },

     /**
     * pixelSizeAt ... TBD
     * @private
     */
    pixelSizeAt: function(x, y, z) {
      if (!this.ready) {
        return null;
      }

      if (x.declaredClass === "esri.geometry.ScreenPoint") {
        var minResult = this._stage._pick([x.x, this.height - x.y]).getMinResult();

        if (!minResult.getIntersectionPoint(tmpVec3)) {
          return 0;
        }
      } else {
        var mapPoint = this._normalizePoint(x, y, z, tmpPoint);
        projectionUtils.pointToVector(mapPoint, tmpVec3, this.renderSpatialReference);
      }

      // here tmpVec3 contains the picked point in engine coordinates

      var camera = this.navigation.currentCamera;
      return camera.computePixelSizeAt(tmpVec3);
    },

    /**
     * Searches for displayed features that intersect the specified screen coordinates.
     *
     * @param {number} x - The screen X-coordinate.
     * @param {number} y - The screen Y-coordinate.
     *
     * @return {Promise} When resolved, returns an object with the specification below.
     * **Note:** The `graphic` property won't exist if the hitTest coordinates do not intersect a graphic.
     *
     * ```
     * {
     *   mapPoint: <Point>,
     *   graphic: <Graphic>
     * }
     * ```
     */
    hitTest: function (x, y) {
      if (!this.ready) {
        return null;
      }

      var screenPoint = this._normalizePoint(x, y, undefined, tmpPoint);

      var dfd = new Deferred();
      screenPoint = [screenPoint.x, this.height - screenPoint.y];
      var minResult = this._stage._pick(screenPoint, null, null, true).getMinResult();
      var mapPoint = this._computeMapPointFromIntersectionResult(minResult);
      var graphicPromise;
      if (minResult.object != null) {
        graphicPromise = this._getGraphicFromStageObject(minResult.object, minResult.triangleNr);
      }
      if (graphicPromise) {
        graphicPromise.then(function(graphic){
            dfd.resolve({
              mapPoint: mapPoint,
              graphic: graphic
            });
          },
          function() {
            dfd.resolve({
              mapPoint: mapPoint,
              graphic: null
            });
          }
        );
      }
      else {
        dfd.resolve({
          mapPoint: mapPoint,
          graphic: null
        });
      }
      return dfd.promise;
    },

    /**
     * Animates the view to a given target. The target parameter can be one of the following:
     * * `[longitude, latitude]` pair of coordinates,
     * * {@link module:esri/geometry/Geometry Geometry} (or array of {@link module:esri/geometry/Geometry Geometry[]}),
     * * {@link module:esri/Graphic Graphic} (or array of {@link module:esri/Graphic Graphic[]}),
     * * {@link module:esri/Viewpoint Viewpoint},
     * * {@link module:esri/Camera Camera}
     * * Object with a combination of `target`, `center`, `scale`, `position`, `heading` and `tilt`
     *   properties (with `target` being any of the types listed above). `center`
     *   is provided as a convenience to animate the [SceneView.center](#center)
     *   and is equivalent to specifying the `target` with the center {@link module:esri/geometry/Point Point}.
     *
     * The returned
     * {@link module:esri/views/ViewAnimation ViewAnimation} is owned by the view and can be
     * obtained using [SceneView.animation](#animation).
     * @param {  Number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint
     *         | module:esri/Camera
     *         | Object
     * } target - The target location/viewpoint to animate to. When using an object for `target`, use the properties
     * in the table below.
     * @param {( Number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint
     *         | module:esri/Camera)} target.target - The target of the animation.
     * @param {module:esri/geometry/Point=} target.center - The [SceneView.center](#center) to animate to.
     * @param {number=} target.scale - The [SceneView.scale](#scale) to animate to.
     * @param {number=} target.zoom - The [SceneView.zoom](#zoom) to animate to.
     * @param {number=} target.heading - The {@link module:esri/Camera#heading Camera.heading} to animate to.
     * @param {number=} target.tilt - The {@link module:esri/Camera#position Camera.tilt} to animate to.
     * @param {number=} target.position - The {@link module:esri/Camera#position Camera.position} to animate to.
     * @param {Object} options - Animation options. See properties below for object specifications.
     * @param {number} options.delay - The number of milliseconds to delay before beginning
     *                               the animation.
     * @return {module:esri/views/ViewAnimation} The animation to be performed.
     *                                           
     * @example
     * //animates to a location defined by a Camera object
     * var cam = new Camera({
     *   position: new Point({
     *     x: -100.23,
     *     y: 65,
     *     z: 10000  //in meters
     *     spatialReference: 4326
     *   }),
     *   heading: 180,  //facing due south
     *   tilt: 45  //bird's eye view
     * });            
     * view.animateTo(cam);
     * 
     * @example
     * var opts = {
     *   delay: 5000  //delays the animation for 5 seconds
     * };
     * 
     * //Animates to point at LOD 15 with 5-second delay
     * view.animateTo({
     *   target: pt,
     *   zoom: 15
     * }, opts);
     * 
     * @example
     * //Animates to same point using center, zoom, tilt, and heading
     * view.animateTo({
     *   center: [-126, 49],
     *   zoom: 13,
     *   tilt: 75,
     *   heading: 105
     * });
     */
    animateTo: function(target, options) {
      if (!this.ready) {
        return;
      }

      options = options || {};

      var viewpoint = this.createViewpoint(target, options);

      if (!viewpoint) {
        return new Deferred().reject(new Error("Failed to convert target to viewpoint")).promise;
      }

      var camera = viewpointUtils.toCamera(this, viewpoint);

      if (!camera) {
        return new Deferred().reject(new Error("Failed to convert viewpoint to camera")).promise;
      }

      if (this._animationDelayId) {
        clearTimeout(this._animationDelayId);
        this._animationDelayId = 0;
      }

      if (!this.animation || this.animation.state !== "running") {
        this.animation = new ViewAnimation({
          target: viewpoint
        });
      } else {
        this.animation.target = viewpoint;
      }

      var animation = this.animation;

      var startAnimation = (function() {
        this._navigationHandles.byId("navigation.targetViewChanged").pause();
        this._navigationHandles.byId("navigation.animationStarted").pause();

        this._setCamera(camera, { animate: true });

        if (animation.state === ViewAnimation.State.STOPPED) {
          animation.state = ViewAnimation.State.FINISHED;
        }

        this._navigationHandles.byId("navigation.targetViewChanged").resume();
        this._navigationHandles.byId("navigation.animationStarted").resume();

        if (this.animation) {
          this._hidePopupWindow();
        }
      }).bind(this);

      if (options.delay) {
        this._animationDelayId = setTimeout((function() {
          this._animationDelayId = 0;
          startAnimation();
        }).bind(this), options.delay);
      } else {
        startAnimation();
      }

      return animation;
    },

     /**
     * Creates a point of view for a feature or set of features that can be used for
     * navigation or stored as a bookmark for later use.  The target parameter can be a:
     * * `[longitude, latitude]` pair of coordinates,
     * * {@link module:esri/geometry/Geometry Geometry} (or array of {@link module:esri/geometry/Geometry Geometry[]}),
     * * {@link module:esri/Graphic Graphic} (or array of {@link module:esri/Graphic Graphic[]}),
     * * {@link module:esri/Viewpoint Viewpoint},
     * * {@link module:esri/Camera Camera}
     * * Object with a combination of `target`, `center`, `scale`, `position`, `heading` and `tilt`
     *   properties (with `target` being any of the types listed above). `center`
     *   is provided as a convenience to animate the [SceneView.center](#center)
     *   and is equivalent to specifying the `target` with the center {@link module:esri/geometry/Point Point}.
     *
     * @param {  Number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint
     *         | module:esri/Camera
     *         | Object
     * } target - The target location/viewpoint to animate to. When using an object for `target`, use the properties
     * in the table below.
     * @param {( Number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint
     *         | module:esri/Camera)} target.target - The target of the animation.
     * @param {module:esri/geometry/Point=} target.center - The [SceneView.center](#center) to animate to.
     * @param {number=} target.scale - The [SceneView.scale](#scale) to animate to.
     * @param {number=} target.zoom - The [SceneView.zoom](#zoom) to animate to.
     * @param {number=} target.heading - The {@link module:esri/Camera#heading Camera.heading} to animate to.
     * @param {number=} target.tilt - The {@link module:esri/Camera#position Camera.tilt} to animate to.
     * @param {number=} target.position - The {@link module:esri/Camera#position Camera.position} to animate to.
     *
     * @return {module:esri/Viewpoint} A point representing a view of the target.
     *                                 
     * @example
     * //creates a Viewpoint to act like a bookmark
     * var bookmarkPoint = view.createViewpoint(view.camera);
     * 
     * @example
     * //animates to a previously created viewpoint when button is clicked
     * btn.on("click", function(){
     *   view.animateTo(bookmarkPoint);
     * });                                 
     */
    createViewpoint: function(target, options) {
      return viewpointUtils.create(this, target, options);
    },

    takeScreenshot: function(options) {
      options = lang.mixin({
        format: "png",
        quality: 100
      }, options || {});

      var ret = new Deferred();
      var width, height;

      if (!options.includePadding) {
        width = this.width - this.padding.left - this.padding.right;
        height = this.height - this.padding.top - this.padding.bottom;
      }

      var ratio = width / height;

      if (options.width !== undefined && options.height === undefined) {
        options.height = Math.floor(options.width / ratio);
      }
      else if (options.height !== undefined && options.width === undefined) {
        options.width = Math.floor(ratio * options.height);
      }

      if (!options.area && !options.includePadding) {
        options.area = {
          x: this.padding.left,
          y: this.padding.top,
          width: width,
          height: height
        };
      }

      this._stage.requestScreenCapture(options, function(capture) {
        ret.resolve(capture);
      });

      return ret.promise;
    },

    //--------------------------------------------------------------------------
    //
    //  Internal methods
    //
    //--------------------------------------------------------------------------
    engineToScreen: function(enginePoint, retval) {
      var coords = vec3d.create();
      this._stage.getCamera().projectPoint(enginePoint, coords);

      var x = coords[0];
      var y = this.height - coords[1];
      var z = coords[2];

      if (!retval) {
        return new ScreenPoint({
          x: x,
          y: y,
          z: z
        });
      } else {
        retval.x = x;
        retval.y = y;
        retval.z = z;

        return retval;
      }
    },

    destroy: function() {
      this._destroying = true;

      if (this._animationDelayId) {
        clearTimeout(this._animationDelayId);
      }

      this.environmentManager.destroy();

      // Destroy LayerViewsOwner first, before destroying the stage
      this.destroyLayerViews();
      this.factory.destroy();

      this._disposeSurface();

      this.labelManager.destroy();
      this.labelManager = null;

      this.resourceController.destroy();
      this.resourceController = null;

      this._updateUpdatingMonitorsHandle.remove();
      this._updateUpdatingMonitorsHandle = null;

      this._navigationHandles.remove();
      this._navigationHandles = null;

      this._mapSpatialReferenceHandle.remove();
      this._mapSpatialReferenceHandle = null;
    },

    has: function(parameter) {
      return this._stage.has(parameter);
    },

    flushDisplayModifications: function() {
      this._stage.processDirty();
    },

    getFrustum: function() {
      if (this._frustum.dirty) {
        this._frustum.update(this.navigation.currentCamera);
      }

      return this._frustum;
    },

    getDrawingOrder: function(layerId) {
      return this.layerViewsFlat.findIndex(function(layerView) {
        return layerView.layer && layerView.layer.id === layerId;
      });
    },


    //--------------------------------------------------------------------------
    //
    //  Internal members, not doc'd
    //
    //--------------------------------------------------------------------------

    renderSpatialReference: null,

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _trackCanvasSize: function() {
      this.on("resize", function(evt) {
        if (this.canvas) {
          // Make sure to have a non-scaled canvas just before rendering. Here
          // we manipulate the viewport of the stage camera directly just to
          // make sure we render non-distorted when doing continous resizing
          this.canvas.width = evt.width;
          this.canvas.height = evt.height;

          // Sneakily set the viewport here, without notifying anyone
          var cam = this._stage.getCamera();

          cam.width = evt.width;
          cam.height = evt.height;

          this._stage.setCamera(cam);

          if (this.navigation) {
            this.navigation.windowSize = [evt.width, evt.height];
          }
        }
      }.bind(this));

      // Set initial window size
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    },

    _computeMapPointFromIntersectionResult: function(selectionResult, retval) {
      if (selectionResult.getIntersectionPoint(tmpVec3)) {
        var sr = this.map.spatialReference || SpatialReference.WGS84;
        if (!projectionUtils.vectorToVector(tmpVec3, this.renderSpatialReference, tmpVec3, sr)) {
          sr = SpatialReference.WGS84;
          projectionUtils.vectorToVector(tmpVec3, this.renderSpatialReference, tmpVec3, sr);
        }

        if (!retval) {
          retval = new Point(tmpVec3, sr);
        } else {
          retval.x = tmpVec3[0];
          retval.y = tmpVec3[1];
          retval.z = tmpVec3[2];

          retval.spatialReference = sr;
        }

        if (selectionResult.intersector === "terrain" && this.basemapTerrain) {
          var altitudeSampler = this.basemapTerrain.getElevation(retval);

          if (altitudeSampler !== null) {
            retval.z = altitudeSampler;
          }
        }

        return retval;
      }

      return null;
    },

    _onGeometryPicked: function(object, point, minResult) {
      var eventPayload = {};

      eventPayload.screenPoint = {
        x : point[0],
        y : point[1]
      };

      var mapPoint = this._computeMapPointFromIntersectionResult(minResult);
      if (mapPoint) {
        eventPayload.mapPoint = mapPoint;
      }

      if (object!=null) {
        var graphicPromise = this._getGraphicFromStageObject(object, minResult.triangleNr);
        if (graphicPromise) {
          graphicPromise.then(function(graphic){
              eventPayload.graphic = graphic;
              this.emit("tap", eventPayload);
              this.emit("click", eventPayload);
            }.bind(this),
            function(err) {
              this.emit("tap", eventPayload);
              this.emit("click", eventPayload);
            }.bind(this)
          );
        }
      }
      else {
        this.emit("tap", eventPayload);
        this.emit("click", eventPayload);
      }
    },

    _getGraphicFromStageObject: function(stageObject, triangleNr) {
      var metaData = stageObject.getMetadata();
      if (metaData!=null && metaData.layerId!=null) {
        var layer = this.map.getLayer(metaData.layerId);
        if (layer) {
          var layerView = this.getLayerView(layer);
          if (layerView && layerView.getGraphicsFromStageObject != null && !layerView.suspended) {
            return layerView.getGraphicsFromStageObject(stageObject, triangleNr);
          }
        }
      }
      return null;
    },

    _initBasemapTerrain: function(manifold) {
      this._disposeBasemapTerrain();

      this._basemapTerrain = new TerrainSurface(this, manifold);
      this.notifyChange("basemapTerrain");

      this.navigation.elevationProvider = this._basemapTerrain;
    },

    _initGlobe: function(manifold) {
      this._initCoordinateSystem();
      this._initNavigation(manifold);

      if (this.onViewExtentUpdatedHandle) {
        this.onViewExtentUpdatedHandle.remove();
        this.onViewExtentUpdatedHandle = null;
      }

      this._stage.setViewParams({
        backgroundColor: [0.0, 0.0, 0.0, 0.0],

        // 0 means disabling the default nearFar computation
        maxFarNearRatio: 0,
        frustumCullingEnabled: false
      });

      this._initBasemapTerrain(manifold);

      this._navigationCurrentViewChanged({
        camera: this.navigation.currentCamera
      });
    },

    _initCoordinateSystem: function() {
      if (this.map && this.map.spatialReference) {
        var mapSR = this.map.spatialReference;

        var oldMapUnitsInMeters = this.mapCoordsHelper ? this.mapCoordsHelper.mapUnitInMeters : 1;

        if (!this.mapCoordsHelper || !this.mapCoordsHelper.spatialReference.equals(mapSR)) {
          this.mapCoordsHelper = new MapCoordsHelper(mapSR);

          if (this._stage) {
            this._stage.setIntersectTolerance(Selector.DEFAULT_TOLERANCE / this.mapCoordsHelper.mapUnitInMeters);
          }

          // Automatically rescale constraints
          if (this._constraints) {
            var rescale = oldMapUnitsInMeters / this.mapCoordsHelper.mapUnitInMeters;
            this._constraints.scale(rescale);
          }
        }

        var spherical = (this.globeMode === "spherical");
        var renderSR = spherical ? projectionUtils.SphericalRenderSpatialReference : mapSR;

        if (renderSR !== this.renderSpatialReference) {
          this.renderSpatialReference = renderSR;
          var RenderCoordsHelperClass = spherical ? RenderCoordsHelper.Spherical : RenderCoordsHelper.Planar;
          this.renderCoordsHelper = new RenderCoordsHelperClass(renderSR);
        }
      }
      else {
        this.mapCoordsHelper = null;
        this.renderCoordsHelper = null;
        this.renderSpatialReference = null;
      }
    },

    // temp code until popupmanager is updated with Hydra support
    _hidePopupWindow: function() {
      if (this.popup && this.popup.visible && !this.popup.docked) {
        this.popup.set("visible", false);
      }
    },

    _navigationInteractingChanged: function(interacting) {
      interacting = !!interacting;

      if (interacting !== this.interacting) {
        if (interacting) {
          this._hidePopupWindow();
        }

        this.interacting = interacting;
      }
    },

    _paddingEqualsArray: function(padding) {
      var mepadding = this.padding;

      if (!mepadding) {
        return true;
      }

      return mepadding.top === padding[0] &&
             mepadding.right === padding[1] &&
             mepadding.bottom === padding[2] &&
             mepadding.left === padding[3];
    },

    _navigationCurrentViewChanged: function(ev) {
      this._frustum.dirty = true;

      var camera = ev.camera;
      var padding = camera.padding;

      if (!this._paddingEqualsArray(padding)) {
        var oldValue = this._padding;
        var newValue = {
          top: padding[0],
          right: padding[1],
          bottom: padding[2],
          left: padding[3]
        };

        if (this.ready) {
          // Avoid calling back into the navigation by not using the setter
          this._padding = newValue;

          this.notifyChange("padding", oldValue, newValue);
        } else {
          this.padding = newValue;
        }
      }

      this._stage.setCamera(camera);
      this.notifyChange("camera");
    },

    _navigationAnimationStarted: function(ev) {
      var target = viewpointUtils.create(this, this.navigation.targetCamera);

      if (!this.animation) {
        this.animation = new ViewAnimation({
          target: target
        });
      } else {
        this.animation.target = target;
      }
    },

    _navigationTargetViewChanged: function(ev) {
      if (!this.animation) {
        return;
      }

      var camera = ev.camera;

      var mapSR = this.map.spatialReference || SpatialReference.WGS84;

      var newCamera = cameraUtils.internalToExternal(this, camera);

      var newTarget = new Viewpoint({
        camera: newCamera,
        targetGeometry: projectionUtils.vectorToPoint(camera.center, mapSR, this.renderSpatialReference),
        scale: cameraUtils.computeScale(this, camera),
        rotation: viewpointUtils.headingToRotation(newCamera.heading)
      });

      this.animation.target = newTarget;
    },

    _navigationCurrentViewReachedTarget: function(ev) {
      if (!this.animation) {
        return;
      }

      // Ignore finished animations if we have a new animation planned with a
      // delay.
      if (ev.finishedAnimation && this._animationDelayId) {
        return;
      }

      if (this._animationDelayId) {
        clearTimeout(this._animationDelayId);
        this._animationDelayId = 0;
      }

      if (this._animationStateWatcher) {
        this._animationStateWatcher.remove();
        this._animationStateWatcher = null;
      }

      var animation = this.animation;

      this.animation = null;

      if (ev.finishedAnimation) {
        animation.finish();
      } else {
        animation.stop();
      }

      this.notifyChange("animation");
    },

    _setCamera: function(camera, options) {
      var icamera = cameraUtils.externalToInternal(this, camera);

      if (icamera) {
        this.navigation.setCamera(icamera, options);
        this._externallySet.camera = true;
      }

      this._hidePopupWindow();
    },

    _evaluateUpdating: function() {
      var updatingPercentage = 0;
      var updatingN = 0;
      var updating = false;

      this.layerViewsFlat.forEach(function(lv) {
        if (lv.updating) {
          updating = true;

          var percentage = lv.updatingPercentage;

          if (percentage != null) {
            ++updatingN;
            updatingPercentage += percentage;
          }
        }
      });

      if (updating !== this.updating) {
        this.updating = updating;
      }

      if (updatingN !== 0) {
        updatingPercentage /= updatingN;
      } else {
        if (updating) {
          updatingPercentage = 100;
        } else {
          updatingPercentage = 0;
        }
      }

      if (this.updatingPercentage !== updatingPercentage) {
        this.updatingPercentage = updatingPercentage;
      }
    },

    _updateUpdatingMonitors: function(changeset) {
      for (var i = 0; i < changeset.removed.length; i++) {
        var lv = changeset.removed[i];

        var handle = this._layerViewsUpdatingHandles[lv.id];

        if (handle) {
          delete this._layerViewsUpdatingHandles[lv.id];
          handle.remove();
        }
      }

      for (i = 0; i < changeset.added.length; i++) {
        lv = changeset.added[i];

        // FIXME: this should be needed, but due to asyncness it might happen
        // that a destroyed layer view is still in the flat layer view list
        if (lv.layer) {
          handle = lv.watch(["updating", "updatingPercentage"], this._evaluateUpdating);
          this._layerViewsUpdatingHandles[lv.id] = handle;
        }
      }

      this._evaluateUpdating();
    },

    _mapSpatialReferenceChanged: function(newValue) {
      if (this.basemapTerrain && this.basemapTerrain.spatialReference && newValue && !this.basemapTerrain.spatialReference.equals(newValue)) {
        // Reset the tiling scheme
        this.basemapTerrain.tilingScheme = null;

        // Once the new fullExtent is calculated, reset the viewpoint to view
        // the full extent
        delete this._externallySet.camera;

        watchUtils.once(this, "fullExtent", function() {
          this._setInitialView(this.fullExtent);
        }.bind(this));
      }

      this._initCoordinateSystem();
    },

    _setInitialView: function(target) {
      if (!this._externallySet.camera) {
        if (target instanceof Viewpoint) {
          this.viewpoint = target;
        } else if (target instanceof Camera) {
          this.camera = target;
        } else {
          var headingTilt = this._getDesiredHeadingTilt();

          this.viewpoint = this.createViewpoint({
            target: target,
            heading: headingTilt.heading,
            tilt: headingTilt.tilt
          });
        }
      }
    },

    _pickRay: function() {
      if (this._stage) {
        return this._stage.pickRay.apply(this._stage, arguments);
      }

      return null;
    },

    _pickRayWithBeginPoint: function() {
      if (this._stage) {
        return this._stage.pickRayWithBeginPoint.apply(this._stage, arguments);
      }

      return null;
    },

    _removeHandles: function(props) {
      for (var i = 0; i < props.length; i++) {
        var handle = props[i];

        if (this[handle]) {
          this[handle].remove();
          this[handle] = null;
        }
      }
    },

    _setCanvas: function(value) {
      if (value !== this._canvas) {
        var oldValue = this._canvas;
        this._canvas = value;

        this.notifyChange("canvas", oldValue, value);
      }
    },

    _disposeSurface: function() {
      this._removeHandles([
        "_stageFrameTask",
        "_updateDrawingOrderHandle",
        "onViewExtentUpdateHandle"
      ]);

      this._disposeBasemapTerrain();
      this._setNavigation(null);

      if (this.environmentManager) {
        this.environmentManager.disposeRendering();
      }

      if (this._stage) {
        this._stage.dispose();
        this._stage = null;
      }

      this._setCanvas(null);
    },

    _disposeBasemapTerrain: function() {
      if (this._basemapTerrain) {
        this._basemapTerrain.destroy();
        this._basemapTerrain = null;
      }
    },

    _disposeNavigation: function() {
      if (this._navigation) {
        this._navigation.destroy();

        this._navigation.elevationProvider = null;
        this._navigation = null;
      }

      if (this.navigationController) {
        this.navigationControls = this.navigationController.getControls();
        this.navigationController.destroy();
        this.navigationController = null;
      }
    },

    _setNavigation: function(navigation) {
      if (this._navigation !== navigation) {
        this._disposeNavigation();
        this._navigation = navigation;

        // Set initial window size
        if (navigation) {
          navigation.windowSize = [this.width, this.height];
          navigation.userConstraints = this.constraints;
        }

        this.notifyChange("navigation");
        this._accessorProps.dispatch();
      }
    },

    _initNavigation: function(manifold) {
      manifold = manifold || this.globeMode;

      var params = {
        view: this
      };

      if (manifold === "spherical") {
        this._setNavigation(new NavigationSpherical(params));
      } else {
        this._setNavigation(new NavigationPlanar(params));
      }

      this.navigationController = new EventController(this, this.navigationControls);
    },

    _initSurface: function() {
      var stageOptions = {};

      if (this.antialias != null) {
        stageOptions.antialias = this.antialias;
      }

      this._stage = new Stage(dom.byId(this.surface), stageOptions);
      this._stage.selectionState = false;
      this._stage.onGeometryPicked = this._onGeometryPicked.bind(this);

      if (this.mapCoordsHelper) {
        this._stage.setIntersectTolerance(Selector.DEFAULT_TOLERANCE / this.mapCoordsHelper.mapUnitInMeters);
      }

      this._setCanvas(this._stage.getCanvas());
      this._stageFrameTask = Scheduler.addFrameTask(this._stage.getFrameTask());

      this._trackCanvasSize();
      this._initGlobe(this.globeMode);
    },

    _normalizePoint: function(x, y, z, retval) {
      retval.spatialReference = undefined;

      if (typeof x === "object") {
        if (Array.isArray(x)) {
          retval.x = x[0];
          retval.y = x[1];
          retval.z = x[2];
        }
        else {
          retval.x = x.x;
          retval.y = x.y;
          retval.z = x.z;

          if (x.spatialReference) {
            retval.spatialReference = x.spatialReference;
          }
        }
      }
      else {
        retval.x = x;
        retval.y = y;
        retval.z = z;
      }

      if (!retval.spatialReference) {
        retval.spatialReference = this.map.spatialReference || SpatialReference.WGS84;
      }

      return retval;
    },

    _viewReadyHandler: function(isReady, wasReady) {
      if (wasReady) {
        return;
      }

      this._initSurface();

      for (var k in this._initialProps) {
        if (this._initialProps.hasOwnProperty(k)) {
          this.set(k, this._initialProps[k]);
        }
      }

      var initialViewpoint = this.get("map.initialState.viewpoint") || this.map.initialExtent;

      if (initialViewpoint) {
        this._setInitialView(initialViewpoint);
      }

      if (!this._externallySet.environment) {
        var initialEnvironment = this.get("map.initialState.environment");

        if (initialEnvironment) {
          this.environment = initialEnvironment;
        }
      }

      this._initialProps = {};
    },

    _viewUnreadyHandler: function(isReady, wasReady) {
      if (!wasReady) {
        return;
      }
      
      this._disposeSurface();
    },

    _getDesiredHeadingTilt: function() {
      if (!this._externallySet.camera) {
        tmpHeadingTilt.heading = 0;
        tmpHeadingTilt.tilt = 0.5;
      } else {
        var camera = this.camera;

        tmpHeadingTilt.heading = camera.heading;
        tmpHeadingTilt.tilt = camera.tilt;
      }

      return tmpHeadingTilt;
    },

    //--------------------------------------------------------------------------
    //
    //  Setters/getters
    //
    //--------------------------------------------------------------------------

    _cameraSetter: setInitialProp("camera", function(camera) {
      this._setCamera(camera, { animate: false });
    }),

    _cameraGetter: getInitialProp("camera", function(cached) {
      return cameraUtils.internalToExternal(this, this.navigation.currentCamera, cached);
    }),

    _externalExtent: function() {
      if (this._cachedExtentDirty) {
        cameraUtils.toExtent(this, null, null, this._cachedExtent, tmpCamera);
        this._cachedExtentDirty = false;
      }

      return this._cachedExtent;
    },

    _extentGetter: getInitialProp("extent", function(cached) {
      return cameraUtils.toExtent(this, null, null, cached, tmpCamera);
    }),

    _extentSetter: setInitialProp("extent", function(extent) {
      var newCamera = cameraUtils.fromExtent(this, extent, this._getDesiredHeadingTilt(), tmpCamera);

      if (newCamera) {
        this.camera = newCamera;
      }
    }),

    _scaleGetter: getInitialProp("scale", function() {
      return cameraUtils.computeScale(this);
    }),

    _scaleSetter: setInitialProp("scale", function(scale) {
      var headingTilt = this._getDesiredHeadingTilt();

      var centerPos = this.navigation.currentCamera.center;
      var lonLat = vec3d.create();
      projectionUtils.vectorToVector(centerPos, this.renderSpatialReference, lonLat, SpatialReference.WGS84);

      var distance = cameraUtils.scaleToDistance(this, scale, lonLat[1]);

      var ret = cameraUtils.eyeHeadingTiltForCenterPointAtDistance(this,
                                                                   headingTilt.heading,
                                                                   headingTilt.tilt,
                                                                   centerPos,
                                                                   distance);

      this._externallySet.camera = true;

      this.navigation.setCameraFromEyeCenterAndUp(ret.eye, ret.center, ret.up, { animate: false });
      this._hidePopupWindow();
    }),

    _zoomGetter: getInitialProp("zoom", function() {
      return cameraUtils.scaleToZoom(this, this.scale);
    }),

    _zoomSetter: setInitialProp("zoom", function(zoom) {
      this.scale = cameraUtils.zoomToScale(this, zoom);
    }),

    _centerGetter: getInitialProp("center", function() {
      var camera = this.navigation.currentCamera;

      var mapSR = this.map.spatialReference || SpatialReference.WGS84;

      return projectionUtils.vectorToPoint(camera.center, mapSR, this.renderSpatialReference);
    }),

    _centerSetter: setInitialProp("center", function(center) {
      var headingTilt = this._getDesiredHeadingTilt();

      var ret = cameraUtils.eyeHeadingTiltForCenterPointAtDistance(this,
                                                                   headingTilt.heading,
                                                                   headingTilt.tilt,
                                                                   center,
                                                                   this.navigation.currentCamera.distance);

      this._externallySet.camera = true;

      this.navigation.setCameraFromEyeCenterAndUp(ret.eye, ret.center, ret.up, { animate: false });
      this._hidePopupWindow();
    }),

    _viewpointGetter: getInitialProp("viewpoint", function() {
      return this.createViewpoint(this.camera);
    }),

    _viewpointSetter: setInitialProp("viewpoint", function(viewpoint) {
      var camera = viewpointUtils.toCamera(this, viewpoint);

      if (camera) {
        this._setCamera(camera, { animate: false });
      }
    }),

    _rotationGetter: getInitialProp("rotation", function() {
      return viewpointUtils.headingToRotation(this.camera.heading);
    }),

    _rotationSetter: setInitialProp("rotation", function(rotation) {
      var camera = this.navigation.currentCamera;

      var distance = camera.distance;
      var heading = viewpointUtils.rotationToHeading(rotation);

      var headingTilt = this._getDesiredHeadingTilt();

      var ret = cameraUtils.eyeHeadingTiltForCenterPointAtDistance(this,
                                                                   heading,
                                                                   headingTilt.tilt,
                                                                   camera.center,
                                                                   distance,
                                                                   { noReset: true });

      this._externallySet.camera = true;

      this.navigation.setCameraFromEyeCenterAndUp(ret.eye, ret.center, ret.up, { animate: false });
      this._hidePopupWindow();
    }),

    _fullExtentGetter: function() {
      if (this._basemapTerrain && this._basemapTerrain.spatialReference) {
        var horizontalExtent = this._basemapTerrain.extent;

        var maxDim = Math.max(horizontalExtent[2] - horizontalExtent[0],
          horizontalExtent[3] - horizontalExtent[1]);

        return new Extent({
          xmin: horizontalExtent[0],
          ymin: horizontalExtent[1],
          zmin: -maxDim * 4,
          xmax: horizontalExtent[2],
          ymax: horizontalExtent[3],
          zmax: maxDim * 4,
          spatialReference: this._basemapTerrain.spatialReference
        });
      }
      else {
        var spatialReference = (this.map && this.map.spatialReference) ? this.map.spatialReference :
          SpatialReference.WebMercator;
        return new Extent({ spatialReference: spatialReference });
      }
    },

    _globeModeSetter: function(mode) {
      kernel.deprecated(this.declaredClass+"::globeMode is deprecated. Use viewingMode instead.", "", "4.0");
      this.viewingMode = { planar: "local", spherical: "global" }[mode];
    },

    _globeModeGetter: function() {
      kernel.deprecated(this.declaredClass+"::globeMode is deprecated. Use viewingMode instead.", "", "4.0");

      // ToDo: Remove globeMode from view, in the meanwhile translate
      return  { local: "planar", global: "spherical" }[this.viewingMode];
    },

    _screenCenterGetter: function() {
      var padding = this.padding;

      return new ScreenPoint((this.size[0] - (padding.left + padding.right)) / 2 + padding.left,
                             (this.size[1] - (padding.top + padding.bottom)) / 2 + padding.top);
    },

    _updateDrawingOrder: function() {
      var maxIndex = this.layerViewsFlat.length - 1;
      this.layerViewsFlat.forEach(function(layerView, i) {
        layerView.drawingOrder = maxIndex - i;
      }, this);
    },

    _paddingGetter: getInitialProp("padding", function() {
      return this._padding;
    }),

    _paddingSetter: setInitialProp("padding", function(padding) {
      this._padding = {
        top: (padding && padding.top) || 0,
        right: (padding && padding.right) || 0,
        bottom: (padding && padding.bottom) || 0,
        left: (padding && padding.left) || 0
      };

      if (this.navigation) {
        this.navigation.padding = this._padding;
      }
    }),

    _constraintsGetter: getInitialProp("constraints", function() {
      return this._constraints;
    }),

    _constraintsSetter: setInitialProp("constraints", function(constraints) {
      this._constraints = constraints;

      if (this._constraints === this._defaults.constraints) {
        this._defaults.constraints = null;
        this._constraints.scale(1 / this.mapCoordsHelper.mapUnitInMeters);
      }

      this.navigation.userConstraints = constraints;
    }),

    _animationSetter: function(animation) {
      if (!this.ready) {
        return;
      }

      if (this._animationStateWatcher) {
        this._animationStateWatcher.remove();
        this._animationStateWatcher = null;
      }

      this._animation = animation;

      if (animation) {
        animation.then(function() {
          if (this._animation !== animation) {
            return;
          }

          var isDelayed = !!this._animationDelayId;

          if (isDelayed) {
            clearTimeout(this._animationDelayId);
            this._animationDelayId = 0;
          }

          var curTarget = animation.target;

          // User cancelled
          this.animation = null;

          if (animation.state === ViewAnimation.State.FINISHED) {
            if (isDelayed) {
              this.viewpoint = curTarget;
            }
            else {
              this.navigation.setCurrentToTarget();
            }
          } else {
            this.navigation.setCamera(this.navigation.currentCamera, { animate: false });
          }
        }.bind(this));
      }
    },

    _animationGetter: function() {
      return this._animation;
    },

    _canvasGetter: function() {
      return this._canvas;
    },

    _basemapTerrainGetter: function() {
      return this._basemapTerrain;
    },

    _navigationGetter: function() {
      return this._navigation;
    }
  });

  return SceneView;
});
