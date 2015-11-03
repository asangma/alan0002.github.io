/**
 * A MapView displays a 2D view of a {@link module:esri/Map Map} instance. An instance of MapView must be created to render 
 * a {@link module:esri/Map Map} (along with its operational and base layers) in 2D. To render a map and its layers in 3D, 
 * see the documentation for {@link module:esri/views/SceneView SceneView}. For a general 
 * overview of views, see {@link module:esri/views/View View}.
 *
 * For a map to be visible to the user in the DOM, a MapView must be created and reference a minimum of 
 * two objects: a [Map instance](#map) and a [DOM element](#container). Each is set in the [map](#map) and 
 * [container](#container) properties respectively.
 *
 * ```js
 * //create a MapView instance (for 2D viewing)
 * var view = new MapView({
 *   map: myMap,  //references a Map instance
 *   container: "viewDiv"  //references the ID of a DOM element
 * });
 * ```
 *
 * In addition to being responsible for the rendering of the {@link module:esri/Map Map} and its 
 * elements, the MapView handles the interaction between the user and the map. For example, the traditional 
 * map scale isn't set on the {@link module:esri/Map Map}; it's set on the MapView.
 *
 * ```js
 * view.scale = 24000; //sets a 1:24,0000 scale on the view
 * ```
 *
 * You can set the inital extent (or visible portion of the map) by using either a combination of 
 * [center](#center) and [zoom](#zoom), or by setting the [extent](#extent) property.
 *
 * ```
 * //Set the center and zoom level on the view
 * var view = new MapView({
 *   center: [-112, 38], //sets the center point of the view at a specified lon/lat
 *   zoom: 13 //sets the zoom LOD to 13
 * });
 *
 * //Set the extent on the view
 * view.extent = new Extent({
 *   xmin: -9177882.740387835,
 *   ymin: 4246761.27629837,
 *   xmax: -9176720.658692285,
 *   ymax: 4247967.548150893,
 *   spatialReference: 102100
 * });
 * ```
 *
 * An instance of MapView is also a [Promise](../guide/working-with-promises/#classes-as-promises). 
 * Call the `.then()` method on the MapView instance to execute processes that may only run after 
 * the {@link module:esri/Map#loaded map has loaded}.
 *
 * ```js
 * //create a MapView instance (for 2D viewing)
 * var view = new MapView({
 *   map: myMap,  //references a Map instance
 *   container: "viewDiv"  //references the ID of a DOM element
 * });
 *
 * view.then(function(){
 *  //All the resources in the MapView and the map have loaded. Now execute additional processes
 * }, function(error){
 *  //Use the errback function to handle when the view doesn't load properly
 *  console.log("The view's resources failed to load: ", error);
 * });
 * ```
 *
 * To learn more about Promises, see [this article in the Guide](../guide/working-with-promises/). 
 * For live examples of `view.then()`, see the [2D overview map in SceneView](../sample-code/3d/2d-overview-map/) 
 * and [Toggle elevation layer](../sample-code/3d/toggle-basemap-elevation/) samples.
 *
 * Because the View handles user interaction, events such as [click](#event:click) are handled on the MapView. 
 * [Animations](#animateTo) are also possible with the [AnimateTo()](#animateTo) method, which allows you to animate
 * the MapView from one extent to another.
 *
 * The default MapView navigation includes mouse interaction as described in the table below.
 *
 * Mouse action | MapView behavior
 * ------|------------
 * Drag | Pan
 * Double-click | Zoom in at the cursor
 * Shift+Double-click | Zoom out at the cursor
 * Scroll forward | Zoom in at the cursor
 * Scroll backward | Zoom out at the cursor
 * Right-click+Drag | 2D-rotate
 *
 * @module esri/views/MapView
 * 
 * @since 4.0
 * @see [Sample - Basic map 2D](../sample-code/2d/basic2d/)
 * @see [Sample - View padding](../sample-code/2d/view-padding/)
 * @see [Sample - Geodesic Buffers (2D & 3D)](../sample-code/3d/ge-geodesicbuffer-3d/)
 * @see module:esri/views/SceneView
 * @see module:esri/Map
 * @see module:esri/views/ViewAnimation
 */

/**
 * Fires after clicking on the view.
 *
 * @event module:esri/views/MapView#click
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

define(
[
  "../core/declare",
  "dojo/_base/lang",

  "dojo/promise/all",
  
  "../core/Collection",
  "../core/Scheduler",

  "../geometry/Point",
  "../geometry/Extent",
  "../geometry/ScreenPoint",

  "./View",
  "./ViewAnimation",

  "./inputs/GestureManager",
  
  "./2d/AnimationManager",
  "./2d/PaddedViewState",
  "./2d/viewpointUtils",
  "./2d/MapViewConstraints",

  "./2d/handlers/Navigation",
  
  "./2d/engine/Stage"

],
function(
  declare, lang,
  all,
  Collection, Scheduler,
  Point, Extent, ScreenPoint,
  View, ViewAnimation,
  GestureManager,
  AnimationManager, ViewState, vpUtils, MapViewConstraints,
  Navigation,
  Stage
) {
  
  /**
   * @extends module:esri/views/View
   * @constructor module:esri/views/MapView
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var MapView = declare([View],
  /** @lends module:esri/views/MapView.prototype */
  {
    declaredClass: "esri.views.MapView",

    classMetadata: {
      properties: {
        constraints: {
          dependsOn: ["ready", "tileInfo"]
        },
        center: {
          type: Point,
          copy: function(a, b) {
            a.x = b.x;
            a.y = b.y;
            a.spatialReference = b.spatialReference;
          }
        },
        extent: {
          type: Extent,
          copy: function(a, b) {
            a.xmin = b.xmin;
            a.ymin = b.ymin;
            a.xmax = b.xmax;
            a.ymax = b.ymax;
            a.spatialReference = b.spatialReference;
          }
        },
        state: {},
        viewpoint: {
          copy: vpUtils.copy
        }
      },
      computed: {
        center:    ["content.center"],
        extent:    ["content.extent"],
        rotation:  ["content.rotation"],
        scale:     ["content.scale"],
        zoom:      ["content.scale"],
        viewpoint: ["content.viewpoint"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {      
      // stores user defined view properties
      // while the view is not resolved
      this._proxyProps = {
        // viewpoint
        // center
        // rotation
        // scale
        // extent
      };

      this._pendingUpdates = new Collection();
      this._updateTask = Scheduler.addFrameTask({
        update: function() {
          this._pendingUpdates.drain(function(layerView) {
            layerView._commitUpdate();
          });
          if (!this._pendingUpdates.length) {
            this._updateTask.pause();
          }
        }.bind(this)
      });
      this._updateTask.pause();

      this._handles.add([
        this.on("resize", this._resizeHandler.bind(this)),
        this.layerViewsFlat.on("change", this._viewsChangeHander.bind(this)),
        this.watch("ready", this._readyWatcher.bind(this)),
        this.watch("constraints", this._constraintsWatcher.bind(this))
      ]);
      
      this._viewInitializePromise.resolve();
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        constraints: {
          minScale: 0,
          maxScale: 0,
          minZoom: -1,
          maxZoom: -1
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        ui: {
          components: [
            "logo",
            "attribution",
            "zoom"
          ]
        }
      });
    },

    destroy: function() {
      // TODO: this.gestureManager.destroy();
      // TODO: this.set("surface", null);
      // TODO YCA: remove all the views (removeElement)
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _pendingUpdates: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    className: "esriMapView",

    //----------------------------------
    //  resizeAlign
    //----------------------------------

    /**
     * Defines which anchor stays still while resizing the browser window. The default, `center`, ensures the view's center point remains constantly visible as the window size changes. The other options allow  the respective portion of the view to remain visible when the window's size is changed.
     * 
     * **Possible values:** center | left | right | top | bottom | top-left | top-right | bottom-left | bottom-right
     * 
     * @type {string}
     * @default
     */
    resizeAlign: "center",

    //----------------------------------
    //  animation
    //----------------------------------

    /**
     * Represents an ongoing view animation initialized by [animateTo()](#animateTo).
     * You may {@link module:esri/core/Accessor#watch watch} this property to be notified of the animation's state.
     *
     * @type {module:esri/views/ViewAnimation}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
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

    _animationSetter: function(value, oldValue) {
      if (oldValue) {
        oldValue.stop();
      }
      // Subscribe to the new animation.
      if (value && !value.isFulfilled()) {
        value.then(
          function() {
            this.animation = null;
          }.bind(this),
          function() {
            this.animation = null;
          }.bind(this),
          function(update) {
            this.state.viewpoint = update;
          }.bind(this)
        );
        return value;
      }
      return null;
    },

    //----------------------------------
    //  center
    //----------------------------------

    /**
     * Represents the view's center point. This may be an instance of {@link module:esri/geometry/Point Point} or a latitude/longitude pair.
     * Setting the center immediately changes the current view. For animating
     * the view, see {@link module:esri/views/MapView#animateTo animateTo()}.
     *
     * The returned {@link module:esri/geometry/Point Point} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/geometry/Point#clone Point.clone()}.
     *
     * @type {module:esri/geometry/Point}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
     * 
     * @example 
     * //Sets the initial center point of the view to lat/long coordinates
     * var view = new MapView({
     *   center: [-112, 38]
     * });
     * 
     * @example 
     * //Updates the view's center point to a pre-determined Point object
     * var pt = new Point({
     *   x: 12804.24,
     *   y: -1894032.09,
     *   spatialReference: 2027
     * });
     * view.center = pt;
     */
    center: null,
    
    _centerGetter: function(cached) {
      if (this._proxyProps) {
        return this._proxyProps.center;
      }
      
      if (!cached) {
        cached = new Point();
      }

      var cen = this.content.center;
      var sr = this.content.spatialReference;
      cached.x = cen[0];
      cached.y = cen[1];
      cached.spatialReference = sr;
      return cached;
    },

    _centerSetter: function(value) {
      if (value == null) {
        return;
      }
      if (this._proxyProps) {
        this._proxyProps.center = value;
        return;
      }
      var vp = this.viewpoint;
      vpUtils.centerAt(vp, vp, value);
      this.viewpoint = vp;
    },

    //----------------------------------
    //  constraints
    //----------------------------------

    /**
     * Specifies constraints to [scale](#scale) and [zoom](#zoom) that may be applied to the view. See object specification below.
     * 
     * @name constraints
     * @instance
     * 
     * @type {Object}
     * 
     * @property {boolean} snapToZoom - When `true`, the view snaps to the next LOD when zooming in or out.
     *                                  When `false`, the zoom is continuous. Default is `true`.
     * @property {number} minScale - The minimum scale the user is allowed to zoom to within the view.
     * @property {number} maxScale - The maxiumum scale the user is allowed to zoom to within the view.
     * @property {number} minZoom - The minimum zoom level the user is allowed to zoom to within the view.
     * @property {number} maxZoom - The maximum zoom level the user is allowed to zoom to within the view.
     */
    _constraintsSetter: function(value) {
      var consts = lang.mixin({
        minScale: 0,
        maxScale: 0,
        minZoom: -1,
        maxZoom: -1,
        snapToZoom: true
      }, value);

      if (!this.ready || !this.tileInfo) {
        return consts;
      }

      return new MapViewConstraints(lang.mixin(consts, { tileInfo: this.tileInfo }));
    },

    //----------------------------------
    //  extent
    //----------------------------------

    /**
     * The extent represents the visible portion of a {@link module:esri/Map map} within the view as an instance of {@link module:esri/geometry/Extent Extent}.
     * Setting the extent immediately changes the view without animation. To animate
     * the view, see {@link module:esri/views/MapView#animateTo animateTo()}.
     *
     * The returned {@link module:esri/geometry/Extent Extent} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/geometry/Extent#clone Extent.clone()}.
     *
     * @type {module:esri/geometry/Extent}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
     * 
     * @example
     * var ext = new Extent({
     *   xmin: -13056650, 
     *   ymin: 6077558, 
     *   xmax: -13055709, 
     *   ymax: 6077938, 
     *   spatialReference: new SpatialReference({wkid:3857})
     * });
     * view.extent = ext;  //updates the view without animation
     */
    extent: null,

    _extentGetter: function(cached) {
      if (this._proxyProps) {
        return this._proxyProps.extent;
      }
      
      if (!cached) {
        cached = new Extent();
      }

      var ext = this.content.extent;
      cached.xmin = ext.xmin;
      cached.ymin = ext.ymin;
      cached.xmax = ext.xmax;
      cached.ymax = ext.ymax;
      cached.spatialReference = ext.spatialReference;
      return cached;
    },

    _extentSetter: function(value) {
      if (value == null) {
        return;
      }
      if (this._proxyProps) {
        this._proxyProps.extent = value;
        return;
      }
      var vp = this.viewpoint;
      vpUtils.setExtent(vp, vp, value, this.size, {
        tileInfo: this.tileInfo,
        snapToZoom: this.constraints.snapToZoom
      });
      this.viewpoint = vp;
    },

    //----------------------------------
    //  padding
    //----------------------------------

    _paddingGetter: function() {
      return this._proxyProps ?
        this._proxyProps.padding :
        this.state.padding;
    },

    _paddingSetter: function(value) {
      value = lang.mixin({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }, value);
      if (this._proxyProps) {
        this._proxyProps.padding = value;
        return value;
      }
      this.state.padding = value;
      return this.state.padding;
    },

    //----------------------------------
    //  rotation
    //----------------------------------

    /**
     * The rotation of the view in degrees. The view may be rotated either by directly setting
     * the rotation or by using the following mouse events: `Right-click + Drag`.
     * 
     * @type {number}
     * @default 0
     * @example
     * //Rotates the view 90 degrees from north; the top of the view points due west
     * view.rotation = 90;
     * @example
     * //Rotates the view 180 degrees from north; the top of the view points due south
     * view.rotation = 180;
     * @example
     * //Rotates the view 270 degrees from north; the top of the view points due east
     * view.rotation = 270;
     * @example
     * //sets the top of the view to point due north
     * view.rotation = 0; //360 or multiple of 360 (e.g. 720) works here as well.
     */
    rotation: 0,

    _rotationGetter: function() {
      return this._proxyProps ?
        this._proxyProps.rotation :
        this.content.rotation;
    },

    _rotationSetter: function(value) {
      if (value == null) {
        return;
      }
      if (this._proxyProps) {
        this._proxyProps.rotation = value;
        return;
      }
      var vp = this.viewpoint;
      vpUtils.rotateTo(vp, vp, value);
      this.viewpoint = vp;
    },

    //----------------------------------
    //  scale
    //----------------------------------

    /**
     * Represents the map scale at the center of the view.
     * Setting the scale immediately changes the view. For animating
     * the view, see {@link module:esri/views/MapView#animateTo animateTo()}.
     *
     * @type {number}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
     * 
     * @example
     * view.scale = 24000;  //sets the map scale in the view's center to 1:24,000
     */
    scale: 0,
     
    _scaleGetter: function() {
      return this._proxyProps ?
        this._proxyProps.scale :
        this.content.scale;
    },

    _scaleSetter: function(value) {
      if (value == null) {
        return;
      }
      if (this._proxyProps) {
        this._proxyProps.scale = value;
        return;
      }
      var vp = this.viewpoint;
      vpUtils.scaleTo(vp, vp, value);
      this.viewpoint = vp;
    },

    //----------------------------------
    //  surface
    //----------------------------------

    _surfaceSetter: function(value, oldValue) {
      if (oldValue === value) {
        return oldValue;
      }
      if (value) {
        this.stage = new Stage({
          container: value,
          scheduler: Scheduler.instance
        });
        this.gestureManager = new GestureManager({
          view: this,
          surface: value,
          inputOptions: {
            mouseModifiers: true
          }
        });
        var navigation = new Navigation({
          view: this
        });
        this.addHandler(navigation);
      } else {
        this.stage.destroy();
        this.gestureManager.destroy();
        this.gestureManager = null;
      }
      return value;
    },

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * The dimension of the view. For MapView, this value is always `2d`.
     *
     * @type {string}
     * @readonly
     */
    type: "2d",
      
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
    * widgets visible when a MapView is created. By default, the array looks like the following:
    * `view.ui.components = ["logo", "attribution", "zoom"]`
    *
    * @example
    * //Toggles off all default widgets
    * view.ui.components = [];
    * @example
    * //Toggles on only the logo
    * view.ui.components = ["logo"];
    * @example
    * //Toggles on all default widgets
    * view.ui.components = ["logo", "attribution", "zoom"];
    */

    //----------------------------------
    //  viewpoint
    //----------------------------------

    /**
     * Represents the current view as a {@link module:esri/Viewpoint Viewpoint} or point of observation on the view.
     * Setting the viewpoint immediately changes the current view. For animating
     * the view, see {@link module:esri/views/MapView#animateTo animateTo()}.
     *
     * The returned {@link module:esri/Viewpoint Viewpoint} object is an internal
     * reference which may be modified internally. To persist the returned
     * object, create a copy using {@link module:esri/Viewpoint#clone Viewpoint.clone()}.
     *
     * @type {module:esri/Viewpoint}
     * @see {@link module:esri/views/MapView#createViewpoint createViewpoint()}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
     */
    viewpoint: null,

    _viewpointGetter: function(oldValue) {
      var vp = this._proxyProps ?
        this._proxyProps.viewpoint :
        this.content.viewpoint;
      if (!vp) {
        return vp;
      }
      if (!oldValue) {
        return vp.clone();
      }
      return vpUtils.copy(oldValue, vp);
    },

    _viewpointSetter: function(value) {
      if (value == null) {
        return;
      }
      if (this._proxyProps) {
        this._proxyProps.viewpoint = value;
        return;
      }
      this.constraints.constrain(value, this.content.viewpoint, this);
      this.state.viewpoint = value;
    },

    //----------------------------------
    //  zoom
    //----------------------------------

    /**
     * Represents the level of detail (LOD) at the center of the view.
     * Setting the zoom immediately changes the current view. For animating
     * the view, see {@link module:esri/views/MapView#animateTo animateTo()}.
     * 
     * Setting this property in conjunction with [center](#center) is a convenient way
     * to set the initial extent of the view.
     *
     * @type {number}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
     * 
     * @example
     * view.zoom = 3;  //sets the LOD to 3 (small map scale)
     * view.zoom = 18; //sets the LOD to 18 (large map scale)
     * 
     * @example
     * //Set the zoom level and center in the constructor
     * var view = new MapView({
     *   zoom: 10,
     *   center: [-120, 34],
     *   map: map
     * });
     */
    zoom: -1,
     
    _zoomGetter: function() {
      if (this._proxyProps) {
        return this._proxyProps.zoom;
      }
      if (this.tileInfo) {
        return this.tileInfo.scaleToZoom(this.scale);
      }
      return -1;
    },

    _zoomSetter: function(value) {
      if (value == null) {
        return;
      }
      if (this._proxyProps) {
        this._proxyProps.zoom = value;
        return value;
      }
      var vp = this.viewpoint;
      vpUtils.scaleTo(vp, vp, this.tileInfo.zoomToScale(value));
      this.viewpoint = vp;
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Animates the view to a given target. The target parameter can be one of the following:
     * * `[longitude, latitude]` pair of coordinates,
     * * {@link module:esri/geometry/Geometry Geometry} (or array of {@link module:esri/geometry/Geometry Geometry[]}),
     * * {@link module:esri/Graphic Graphic} (or array of {@link module:esri/Graphic Graphic[]}),
     * * {@link module:esri/Viewpoint Viewpoint},
     * * Object with a combination of `target`, `center` and `scale`
     *   properties (with `target` being any of the types listed above). `center`
     *   is provided as a convenience to animate the [MapView.center](#center)
     *   and is equivalent to specifying the `target` with the center {@link module:esri/geometry/Point Point}.
     *
     * The returned 
     * {@link module:esri/views/ViewAnimation ViewAnimation} is owned by the view and can be
     * obtained using [MapView.animation](#animation).
     * @param {( number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint
     *         | Object
     * )} target - The target location/viewpoint to animate to. When using an object for `target`, use the properties
     * in the table below.
     * @param {( number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint)} target.target - The target of the animation.
     * @param {module:esri/geometry/Point=} target.center - The [MapView.center](#center) to animate to.
     * @param {number=} target.scale - The [MapView.scale](#scale) to animate to.
     * @param {number=} target.zoom - The [MapView.zoom](#zoom) to animate to.
     * @param {Object} options - Animation options. See properties below for object specifications.
     * @param {number} options.duration - The duration of the animation in milliseconds.
     * @param {string|function} options.easing - The easing function used for the animation. The default value is `ease`. <br /> **Possible values:** linear | ease | ease-in | ease-out | ease-in-out 
     * @return {module:esri/views/ViewAnimation} The animation to be performed.
     *                                           
     * @example
     * var pt = new Point({
     *   latitude: 49,
     *   longitude: -126
     * });
     * 
     * //animates to the given point
     * view.animateTo(pt);
     * 
     * @example
     * var opts = {
     *   duration: 5000  //duration of animation will be 5 seconds
     * };
     * 
     * //Animates to point at LOD 15 with custom duration
     * view.animateTo({
     *   target: pt,
     *   zoom: 15
     * }, opts);
     * 
     * @example
     * //Animates to same point using center and zoom
     * view.animateTo({
     *   center: [-126, 49],
     *   zoom: 15
     * });
     */
    animateTo: function(target, options) {
      var viewpoint = this.createViewpoint(target);
      var animation = null;

      if (!this.ready || !this.animationManager) {
        this.viewpoint = viewpoint;
        animation = new ViewAnimation({
          target: viewpoint
        });
        animation.finish();
        return animation;
      }

      this.constraints.constrain(viewpoint, this.viewpoint, this);

      animation = this.animation = this.animationManager
        .animateTo(viewpoint, this.viewpoint, options);

      return animation;
    },

    /** 
     * Creates a point of view for a feature or set of features that can be used for 
     * navigation or stored as a bookmark for later use.  The target parameter can be a:
     * * `[longitude, latitude]` pair of coordinates,
     * * {@link module:esri/geometry/Geometry Geometry} (or array of {@link module:esri/geometry/Geometry Geometry[]}),
     * * {@link module:esri/Graphic Graphic} (or array of {@link module:esri/Graphic Graphic[]}),
     * * {@link module:esri/Viewpoint Viewpoint},
     * * Object with a combination of `target`, `center` and `scale` properties (with `target` being any of the types listed above). `center`
     *   is provided as a convenience to animate the [MapView.center](#center)
     *   and is equivalent to specifying the `target` with the center {@link module:esri/geometry/Point Point}.
     *
     * @param {( Number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint
     *         | Object
     * )} target - The target location/viewpoint to animate to. When using an object for `target`, use the properties
     * in the table below.
     * @param {( Number[]
     *         | module:esri/geometry/Geometry
     *         | module:esri/geometry/Geometry[]
     *         | module:esri/Graphic
     *         | module:esri/Graphic[]
     *         | module:esri/Viewpoint)} target.target - The target of the animation.
     * @param {module:esri/geometry/Point=} target.center - The [MapView.center](#center) to animate to.
     * @param {number=} target.scale - The [MapView.scale](#scale) to animate to.
     * @param {number=} target.zoom - The [MapView.zoom](#zoom) to animate to.
     * 
     * @return {module:esri/Viewpoint} A point representing a view of the target.
     *                                 
     * @example
     * //get the view's center point and scale
     * var viewCenter = view.center;
     * var viewScale = view.scale;
     * 
     * //creates a Viewpoint to act like a bookmark
     * var bookmarkPoint = view.createViewpoint({
     *   center: viewCenter,
     *   scale: viewScale
     * });
     * 
     * @example
     * //animates to a previously created viewpoint when button is clicked
     * btn.on("click", function(){
     *   view.animateTo(bookmarkPoint);
     * });
     */
    createViewpoint: function(target, options) {
      var content = this.content;
      var size = content ? content.size : this.size;
      var currentViewpoint = content ? content.viewpoint : this.viewpoint;
      var sr = this.map ? this.map.spatialReference : null;
      var snapToZoom = this.constraints.snapToZoom;
      
      return vpUtils.create(target,
        lang.mixin(
          {},
          options,
          {
            spatialReference: sr,
            size: size,
            currentViewpoint: currentViewpoint,
            tileInfo: this.tileInfo,
            snapToZoom: snapToZoom
          }
        )
      );
    },

    /**
     * Searches for displayed features that intersect the specified screen coordinates.
     * 
     * @param {number} x - The screen X-coordinate.
     * @param {number} y - The screen Y-coordinate.
     *                   
     * @return {Promise} When resolved, returns a {@link module:esri/geometry/Point Point} 
     *                   and, if a graphic was found, also a 
     *                   {@link module:esri/Graphic graphic}.
     */
    hitTest: function (x, y) {
      if (!this.ready) {
        return null;
      }
      var mapPoint = this.toMap(x, y);
      return all(
        this.layerViewsFlat.map(function(lv) {
          return lv.hitTest(x, y);
        }).getAll()
      ).then(
        function(results) {
          var graphic = null;
          results.some(function(result) {
            if (result) {
              graphic = result;
            }
            return graphic;
          });
          return {
            mapPoint: mapPoint,
            graphic: graphic
          };
        }
      );
    },

    /**
     * Converts the given screen point to map coordinates.
     *
     * @param   {number} x The screen X-coordinate.
     * @param   {number} y The screen Y-coordinate.
     * @param   {module:esri/geometry/Point=} mapPoint - Point object that will store the result.
     * @return {module:esri/geometry/Point} The map point corresponding to the given screen point.
     */
    toMap: function(x, y, mapPoint) {
      if (!this.ready) {
        return null;
      }
      if (x && x.x != null) {
        mapPoint = y;
        y = x.y;
        x = x.x;
      }

      var out = [0, 0];

      this.state.toMap(out, [x, y]);

      mapPoint = mapPoint || new Point();
      mapPoint.x = out[0];
      mapPoint.y = out[1];
      mapPoint.spatialReference = this.map.spatialReference;

      return mapPoint;
    },

    /**
     * Converts the given map point to screen coordinates.
     *
     * @param   {number} x The map X-coordinate.
     * @param   {number} y The map Y-coordinate.
     * @param   {module:esri/geometry/ScreenPoint=} screenPoint - ScreenPoint object that will 
     *                                                          store the result.
     * @return {module:esri/geometry/ScreenPoint} The screen point corresponding to the given 
     *                                            map point.
     */
    toScreen: function(x, y, screenPoint) {
      if (!this.ready) {
        return null;
      }
      if (x && x.x != null) {
        screenPoint = y;
        y = x.y;
        x = x.x;
      }
      screenPoint = screenPoint || new ScreenPoint();
      var coords = [x, y];
      this.state.toScreen(coords, coords);
      screenPoint.x = coords[0];
      screenPoint.y = coords[1];
      return screenPoint;
    },

    /**
     * @private
     */
    pixelSizeAt: function(x, y) {
      if (!this.ready) {
        return NaN;
      }
      if (x && x.x != null) {
        y = x.y;
        x = x.x;
      }
      return this.state.pixelSizeAt([x, y]);
    },

    /**
     * @private
     */
    scheduleLayerViewUpdate: function(view) {
      this._pendingUpdates.addItem(view);
      if (this.ready) {
        this._updateTask.resume();
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Handlers
    //
    //--------------------------------------------------------------------------

    _readyWatcher: function(newValue, oldValue){
      if (!newValue) {
        this._proxyProps = {
          viewpoint: this.viewpoint,
          padding: this.padding
        };
        return;
      }

      var options = this._proxyProps;
      var map = this.map;
      var tileInfo = map.basemap ? map.basemap.tileInfo : map.layers.getItemAt(0).tileInfo;

      // compute the viewpoint
      var viewpoint = vpUtils.create(
        options,
        {
          spatialReference: map.spatialReference,
          size: this.size,
          tileInfo: tileInfo,
          extent: map.initialExtent
        }
      );

      // create the state
      var state = new ViewState({
        padding: options.padding,
        size: this.size,
        viewpoint: viewpoint
      });

      this._proxyProps = null;
      if (tileInfo) {
        this.tileInfo = tileInfo;
      }
      this.constraints = this.constraints;
      this.animationManager = new AnimationManager();
      this.state = state;
      this.content = state.content;

      // start up the stage
      this.stage.state = state;
      this.stage.run();

      if (this._pendingUpdates.length) {
        this._updateTask.resume();
      }
    },

    _constraintsWatcher: function(newValue) {
      if (this.ready) {
        this.viewpoint = newValue.constrain(this.viewpoint, null, this);
      }
    },

    _viewsChangeHander: function(event) {
      var views = this.layerViewsFlat,
          added = event.added,
          removed = event.removed,
          moved = event.moved,
          i, n;
      for (i = 0, n = removed.length; i < n; i++) {
        this.stage.removeChild(removed[i].container);
      }
      for (i = 0, n = added.length; i < n; i++) {
        this.stage.addChildAt(added[i].container, views.indexOf(added[i]));
      }
      for (i = 0, n = moved.length; i < n; i++) {
        this.stage.setChildIndex(moved[i].container, views.indexOf(moved[i]));
      }
    },

    _resizeHandler: function(event) {
      var state = this.state;
      if (!state) {
        return;
      }

      var vp = this.content.viewpoint;
      var oldContentSize = this.content.size.concat();
      
      state.size = [event.width, event.height];
      vpUtils.resize(vp, vp, oldContentSize, this.content.size, this.resizeAlign);

      vp = this.constraints.constrain(vp, null, this);
      
      // Apply the transform immediately
      // this.viewpoint = vp;
      this.state.viewpoint = vp;
    }


  });

return MapView;

});
