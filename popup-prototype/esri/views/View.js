/**
 * A view provides the means of viewing and interacting with the components of a {@link module:esri/Map Map}. 
 * The {@link module:esri/Map Map} is merely a container, storing the geographic information contained in base layers and operational layers. 
 * The View renders the {@link module:esri/Map Map} and its various {@link module:esri/Map#layers layers}, making them visible to the user.
 * 
 * [![MapView-vs-SceneView](../assets/img/apiref/views/map-vs-scene.png)](../sample-code/source-code/3d/views-2d-3d/index.html)
 * 
 * There are two types of views: {@link module:esri/views/MapView MapView} and {@link module:esri/views/SceneView SceneView}. 
 * The MapView renders a Map and its layers in 2D. The SceneView renders these elements in 3D. View is the base class of MapView 
 * and SceneView and has no constructor. To create a view, you must do so by directly creating an instance of either 
 * {@link module:esri/views/MapView MapView} or {@link module:esri/views/SceneView SceneView}.
 *
 * To associate a view with a map, you must set the [map](#map) property to an instance of {@link module:esri/Map Map}.
 * 
 * ```js
 * //load the Map and MapView modules
 * require(["esri/Map", "esri/views/MapView", "dojo/domReady!"], function(Map, MapView) { 
 *   //create a Map instance
 *   var myMap = new Map({
 *     basemap: "streets"
 *   });
 *   //create a MapView instance (for 2D viewing) and reference the map instance
 *   var view = new MapView({
 *     map: myMap,
 *     container: "viewDiv"
 *   });
 * });
 * ```
 *
 * In the snippet above, you'll notice a `container` property set on the view. The [container](#container) 
 * property is the reference to the DOM node that contains the view. This is commonly a `<div>` element. The container 
 * referenced in the example above might look something like:
 *
 * ```js
 * <body>
 *  <div id="viewDiv"></div>
 * </body>
 * ```
 *
 * You can observe the view's relationship to the HTML container in the [Create a 2D map tutorial](../guide/getting-started-2d/) 
 * and any of the available [samples](../sample-code/).
 *
 * Other [properties](#properties) may be set on the view, such as the rotation, scale, popup, and padding. 
 * See {@link module:esri/views/MapView} and {@link module:esri/views/SceneView} for 
 * additional properties specific to creating views in 2D and 3D.
 *
 * A {@link module:esri/Map Map} may have multiple views associated with it, including a combination of MapViews and SceneViews. See the 
 * [Geodesic buffers](../sample-code/3d/ge-geodesicbuffer-3d/) and [2D overview map in SceneView](../sample-code/3d/2d-overview-map/) 
 * samples to learn how a MapView and a SceneView can display the same map in a single application. While multiple views can 
 * reference the same map, a view may not associate itself with more than one Map instance.
 *
 * The View also allows users to interact with components of the map. For example, when a user clicks or touches the location of a
 * feature in a map, they are not touching the feature nor the map; the event is actually handled with the View that references the map and 
 * the {@link module:esri/views/layers/LayerView} that references the layer. Therefore, events such as `click` are not 
 * handled on the Map or the Layer, but rather on the View. See {@link module:esri/views/MapView} and 
 * {@link module:esri/views/SceneView} for addtional details.
 *
 * @module esri/views/View
 * @noconstructor
 * @since 4.0
 * @see module:esri/views/SceneView
 * @see module:esri/views/MapView
 */

/**
 * Fires after each layer in the map has a corresponding {@link module:esri/views/layers/LayerView} created
 * and rendererd in the view.
 *
 * @event module:esri/views/View#layer-view-create
 * @property {module:esri/layers/Layer} layer - The layer in the map for which the `layerView` was created.
 * @property {module:esri/views/layers/LayerView} layerView - The LayerView rendered
 *                                                in the view representing the layer in `layer`.
 *                                                
 * @see {@link module:esri/views/View#getLayerView View.getLayerView()}                                                
 * 
 * @example
 * //This function will fire each time a layer view is created for this
 * //particular view.
 * view.on("layer-view-create", function(evt){
 *   //evt is the event object returned after the event fires
 *   if(evt.layer.id === "myId"){
 *     //The LayerView for the desired layer
 *     evt.layerView;
 *   }
 * });
 */

/**
 * Fires after a {@link module:esri/views/layers/LayerView} is destroyed and no longer renders in the view.
 *
 * @event module:esri/views/View#layer-view-destroy
 * @property {module:esri/layers/Layer} layer - The layer in the map for which the `layerView` was destroyed.
 * @property {module:esri/views/layers/LayerView} layerView - The LayerView that was destroyed in the view.
 */
define(
[
  "dojo/_base/array",
  "dojo/_base/lang",

  "dojo/Deferred",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-class",

  "../core/Accessor",
  "../core/declare",
  "../core/Evented",
  "../core/HandleRegistry",
  "../core/Promise",
  "../core/watchUtils",

  "./CSSTraits",
  "./DOMContainer",
  "./LayerViewsOwner",
  "./LayerViewFactory",
  "./FlatLayerViewsCollection",
  "./BasemapView",
  "./PopupManager",

  "./ui/DefaultUI",
  
  // TODO: TEMPORARY IMPLEMENTATION FOR PORTAL 10.3
  "../widgets/Popup"
],
function(
  array, lang,
  Deferred, dom, domConstruct, domClass,
  Accessor, declare, Evented, HandleRegistry, Promise, watchUtils,
  CSSTraits, DOMContainer, LayerViewsOwner, LayerViewFactory, FlatLayerViewsCollection, BasemapView, PopupManager,
  DefaultUI,

  // TODO: TEMPORARY IMPLEMENTATION FOR PORTAL 10.3
  Popup
) {

  var DEFAULT_COMPONENTS = [
    "logo",
    "attribution",
    "zoom",
    "compass"
  ];

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/Promise
   * @mixes module:esri/views/DOMContainer
   * @constructor module:esri/views/View
   */
  var View = declare([ Accessor, Promise, DOMContainer, Evented, LayerViewsOwner, CSSTraits ],
  /** @lends module:esri/views/View.prototype */
  {

    declaredClass: "esri.views.View",

    classMetadata: {
      properties: {
        ready: {
          readOnly: true
        },
        factory: {},
        basemapView: {},
        ui: {
          type: DefaultUI
        },
        popup: {
          type: Popup
        }
      },
      computed: {
        ready: ["map.loaded", "surface", "size"],
        stationary: ["animation", "interacting"]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function(properties) {
      this._viewInitializePromise = new Deferred();
      this.addResolvingPromise(this._viewInitializePromise.promise);

      this.factory = new LayerViewFactory(this);
      this.basemapView = new BasemapView({
        view: this
      });
      this.layerViewsFlat = new FlatLayerViewsCollection({ view: this });

      this._handles = new HandleRegistry();

      this.watch("suspended,map", function(newValue) {
        if (!this.suspended && this.map && this.map.loadStatus === "not-loaded") {
          this.map.load();
        }
      }.bind(this));
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        padding: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        },
        popup: {},
        ui: {
          components: DEFAULT_COMPONENTS
        }
      });
    },

    initialize: function() {
      var dfd = new Deferred();
      this.addResolvingPromise(dfd.promise);
      this._viewInitializePromise.promise.then(function() {
        var hdl = watchUtils.when(this, "ready", function() {
          hdl.remove();
          hdl = null;
          dfd.resolve();
          dfd = null;
        });
        this.notifyChange("ready");
      }.bind(this));
    },

    destroy: function() {
      this.basemapView.destroy();
      this.factory.destroy();
      this.ui.destroy();
      this.popup.destroy();
      this._handles.destroy();
      this.map = null;
      this.container = null;

      this.emit("destroy");
    },
    
  
    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _handles: null,

  
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
  
    //----------------------------------
    //  activeTool
    //----------------------------------

    activeTool: "navigation",

    //----------------------------------
    //  animation
    //----------------------------------

    /**
     * Represents an ongoing view animation initialized by {@link module:esri/views/MapView#animateTo animateTo()}.
     * You may {@link module:esri/core/Accessor#watch watch} this property to be notified when the view is being animated.
     *
     * @type {module:esri/views/ViewAnimation}
     * @see {@link module:esri/views/MapView#animateTo animateTo()}
     *
     * @type {module:esri/views/ViewAnimation}
     */
    animation: null,

    //----------------------------------
    //  basemapView
    //----------------------------------

    /**
     * @private
     */
    basemapView: null,

    //----------------------------------
    //  container
    //----------------------------------
    
    /**
     * The `id` or node representing the DOM element containing the view. This is typically set in the view's constructor.
     * 
     * @type {string}
     * @example
     * //Sets container to the DOM id
     * var view = new MapView({
     *   container: "viewDiv"  //ID of the HTML element that holds the view
     * });
     * @example
     * //Sets container to the node
     * var viewNode = document.getElementById("viewDiv");
     * var view = new SceneView({
     *   container: viewNode
     * });
     */
    container: null,
    
    _containerSetter: function(value, oldValue) {
      value = dom.byId(value);
      
      if (oldValue === value) {
        return oldValue;
      }
      
      if (oldValue) {
        domClass.remove(oldValue, "esri-view");
        
        this.popupManager.destroy();
        this.popupManager = null;

        // Restore this.container to its original state
        // TODO: maybe more to do here.
        domConstruct.destroy(this.root);
        this.root = null;
      }
      
      if (value) {
        domClass.add(value, "esri-view");

        // Root will host popup and other map widgets
        this.root = domConstruct.create("div", {
          className: "esri-view-root"
        }, value, "first");
        
        // Surface will host layers rendering 
        this.surface = domConstruct.create("div", {
          className: "esri-view-surface"
        }, this.root);
        dom.setSelectable(this.surface, false);

        // initialize the width / height with what is defined on the container style
        this.width = value.style.width;
        this.height = value.style.height;
        if (this.width === "auto") {
          value.style.width = "";
        }
        if (this.height === "auto") {
          value.style.height = "";
        }

        //////////////////////////////////////////////////////////////////
        //
        //        TODO: TEMPORARY IMPLEMENTATION FOR PORTAL 10.3
        //
        //////////////////////////////////////////////////////////////////

        this.popupManager = new PopupManager({
          enabled: true,
          view: this
        });
      
        //////////////////////////////////////////////////////////////////
        //
        //           
        //
        //////////////////////////////////////////////////////////////////
      } else {
        this.surface = null;
      }

      return value;
    },

    //----------------------------------
    //  interacting
    //----------------------------------

    /**
     * Value is `true` if the user is interacting with the view.
     *
     * @type {boolean}
     * @default false
     * @readonly
     */
    interacting: false,

    _interactingSetter: function(value) {
      var surface = this.surface;
      if (surface) {
        surface.setAttribute("data-interacting", value);
      }
      return value;
    },
    
    //----------------------------------
    //  map
    //----------------------------------

    /**
     * An instance of a {@link module:esri/Map Map} object to display in the view. A view may only consume one map at a time. 
     * On the other hand, one {@link module:esri/Map Map} may be viewed by multiple {@link module:esri/views/MapView MapViews} and/or
     * {@link module:esri/views/SceneView SceneViews} simultaneously.
     * 
     * This property is typically set in the constructor of the 
     * {@link module:esri/views/MapView MapView} or
     * {@link module:esri/views/SceneView SceneView}. See the [class description](#)
     * for examples demonstrating the relationship between the map and the view.
     * 
     * @type {module:esri/Map}
     */
    map: null,

    //----------------------------------
    //  padding
    //----------------------------------

    /**
     * Use the padding property to make [view.center](#center), [view.extent](#extent), etc. work off a 
     * subsection of the full view. This is particularly useful when layering UI 
     * elements or semi-transparent content on top of portions of the view. See
     * the [view padding sample](../sample-code/2d/view-padding/) for an example
     * of how this works.
     * 
     * @type {Object}
     *
     * @default {left: 0, top: 0, right: 0, bottom: 0}
     *
     * @property {number} left the left padding (in pixels).
     * @property {number} top the top padding (in pixels).
     * @property {number} right the right padding (in pixels).
     * @property {number} bottom the bottom padding (in pixels).
     * 
     * @see [Sample - View padding](../sample-code/2d/view-padding/)
     */
    padding: null,
  
    //----------------------------------
    //  popup
    //----------------------------------

    /**
     * A Popup object that displays general content or attributes from 
     * {@link module:esri/Map#layers layers} in the [map](#map).
     * 
     * The view has a default instance of {@link module:esri/widgets/Popup} with 
     * predefined styles and a template for defining content. The content in this
     * default instance may be modified directly in the 
     * {@link module:esri/widgets/Popup#content popup's content} or in a layer's 
     * {@link module:esri/PopupTemplate}.
     * 
     * You may create a new {@link module:esri/widgets/Popup} instance and set it to 
     * this property to customize the style, positioning, and content of the popup
     * in favor of using the default popup instance on the view.
     *
     * @name popup
     * @instance           
     * @type {module:esri/widgets/Popup}
     */    
    _popupSetter: function(value, oldValue) {
      if (value === oldValue) {
        return oldValue;
      }

      this._handles.remove("view-popup");

      if (oldValue) {
        oldValue.destroy();
      }

      if (value) {
        value.set("view", this);

        if (!value._started) {
          value.startup();
        }

        this._handles.add([
          watchUtils.init(this, "root", function(root, oldRoot) {
            var popupNode = value.domNode;

            if (dom.isDescendant(popupNode.parentNode, oldRoot)) {
              popupNode.parentNode.removeChild(popupNode);
            }

            if (root && !popupNode.parentNode) {
              value.placeAt(root);
            }
          })
        ], "view-popup");

      }

      return value;
    },
  
    //----------------------------------
    //  ready
    //----------------------------------

    /**
     * Value is `true` when the [map](#map) loads, or when the view has a defined map 
     * and a [container](#container).
     *
     * @name ready
     * @instance
     * @type {boolean}
     * @default false
     * @readonly
     */
      
    _readyGetter: function() {
      return this._viewInitializePromise.isResolved() &&
        this.get("map.loaded") &&
        this.surface != null;
    },

    //----------------------------------
    //  stationary
    //----------------------------------

    /**
     * Value is `true` when the view has no animation and the user is not interacting
     * with the view.
     *
     * @type {boolean}
     * @default
     * @readonly
     */
    stationary: true,
    
    _stationaryGetter: function() {
      return !this.animation && !this.interacting;
    },

    //----------------------------------
    //  surface
    //----------------------------------

    surface: null,
  
    //----------------------------------
    //  type
    //----------------------------------
    
    /**
     * The type of the view is either `2d` (indicating a 
     * {@link module:esri/views/MapView MapView}) or `3d` 
     * (indicating a {@link module:esri/views/SceneView SceneView}).
     * 
     * @type {string}
     * @readonly
     */    
    type: null,

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
    _uiSetter: function(value, oldValue) {
      if (value === oldValue) {
        return oldValue;
      }

      this._handles.remove("ui");

      if (oldValue) {
        oldValue.destroy();
      }

      if (value) {
        value.view = this;

        this._handles.add([
          watchUtils.init(this, "root", function(root) {
            value.container = root ?
                              domConstruct.create("div", null, root) :
                              null;
          })
        ], "ui");
      }

      return value;
    },

    //----------------------------------
    //  updating
    //----------------------------------

    /**
     * If `true`, the view is in the process of updating.
     *
     * @type {boolean}
     * @default false
     * @readonly
     */
    updating: false,

    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * Gets the {@link module:esri/views/layers/LayerView LayerView} of the input
     * layer.
     * @param   {module:esri/layers/Layer} layer - The layer from which to obtain a
     *                                           LayerView.
     * @return {module:esri/views/layers/LayerView} Returns an instance of layer view
     *                                               for the specified input layer.
     */
    getLayerView: function(layer) {
      // Recursively searches all containers (group layer views) including this
      // view and returns the layer view corresponding to the given layer.
      var containers = this._getContainers(this),
          layerView;
      array.some(containers, function(container) {
        layerView = container.layerViews.find(function(lv) {
          return lv.layer === layer;
        });
        return !!layerView;
      });
      return layerView;
    },

    addHandler: function(h){
      if(this.gestureManager){
        this.gestureManager.addHandler(h);
      }
      return this;
    },

    removeHandler: function(h){
      if(this.gestureManager){
        this.gestureManager.removeHandler(h);
      }
      return this;
    },

    /**
     * use clientX, clientY
     * @private
     */
    pageToContent: function(x, y, out) {
      var pad = this.padding;
      out = this.pageToContainer(x, y, out);
      if (pad) {
        out[0] = out[0] - pad.left;
        out[1] = out[1] - pad.top;
      }
      return out;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _getContainers: function(container) {
      // Returns a flattened list of all containers within the given container.
      var containers = [ container ];

      container.layerViews.forEach(function(view) {
        if (view && view.layerViews) { // identify group layer views
          containers = containers.concat(
            this._getContainers(view)
          );
        }
      }, this);

      return containers;
    }

  });

  return View;
});
