/**
 * A GraphicsLayer contains one or more client-side {@link module:esri/Graphic Graphics}. Each
 * [graphic](#graphics) in the GraphicsLayer is rendered in a {@link module:esri/views/layers/LayerView} 
 * inside either a {@link module:esri/views/SceneView} or a {@link module:esri/views/MapView}.
 * The [graphics](#graphics) contain discrete vector {@link module:esri/geometry/Geometry geometries} 
 * that represent real-world phenomena.
 * 
 * Unlink {@link module:esri/layers/FeatureLayer} and {@link module:esri/layers/ArcGISDynamicLayer}, 
 * a GraphicsLayer has no schema. Therefore, the
 * graphics that compose a GraphicsLayer may be of more than one geometry type (either 
 * {@link module:esri/geometry/Point points}, {@link module:esri/geometry/Polyline lines}, or
 * {@link module:esri/geometry/Polygon polygons}). Each graphic may also have its own symbol, not tied 
 * to a particular renderer. Graphics may also contain different attributes from one another.
 * 
 * Graphics may be added to an instance of GraphicsLayer in several ways. They may be added via the [add()](#add)
 * method, directly on the [graphics](#graphics) property in the constructor, or after the instance is
 * created. Use {@link module:esri/Map#add Map.add()} to add a GraphicsLayer to a {@link module:esri/Map} instance.
 * 
 * ```js
 * require(["esri/layers/GraphicsLayer", "esri/Graphic"], function(GraphicsLayer, Graphic){
 *   //create graphics
 *   var graphicA = new Graphic();  //graphic with line geometry
 *   var graphicB = new Graphic();  //graphic with point geometry
 *   var graphicC = new Graphic();  //graphic with polygon geometry
 *   var graphicD = new Graphic();
 *   var graphicE = new Graphic();
 *   
 *   //add graphic when GraphicsLayer is constructed
 *   var layer = new GraphicsLayer({
 *     graphics: [graphicA]
 *   });
 *   
 *   //add graphic to graphics collection
 *   layer.graphics.addItem(graphicB);
 *   
 *   //add graphic using add()
 *   layer.add(graphicC);
 *   layer.add([graphicD, graphicE]);
 *   
 *   //add GraphicsLayer to map
 *   map.add(layer);
 * });
 * ```
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 *
 * @module esri/layers/GraphicsLayer
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 * @see module:esri/Graphic
 * @see module:esri/layers/FeatureLayer
 */
define(
[
  "../core/declare", 
  "dojo/_base/lang", 
  "dojo/Deferred", 
  
  "../PopupTemplate",
  
  "../core/Collection", 
  
  "./Layer"
], 
function(
  declare, lang, Deferred,
  PopupTemplate,
  Collection, 
  Layer
) {

  /**
   * @extends module:esri/layers/Layer
   * @constructor module:esri/layers/GraphicsLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  var GraphicsLayer = declare(Layer, 
  /** @lends module:esri/layers/GraphicsLayer.prototype */
  {
    declaredClass: "esri.layers.GraphicsLayer",

    classMetadata: {
      properties: {
        graphics: {
          type: Collection
        },
        popupTemplate: {
          type: PopupTemplate
        }
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    getDefaults: function(kwArgs) {
      var defaults = this.inherited(arguments);
      if (!kwArgs.graphics) {
        defaults = lang.mixin(defaults, {
          graphics: new Collection()
        });
      }
      return defaults;
    },
    
    destroy: function() {
      this.clear();
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  viewModulePaths
    //----------------------------------
    
    /**
    * Path to the 2D or 3D GraphicsLayer view.
    * 
    * @property {string} 2d - Path to the 2D GraphicsLayerView
    * @property {string} 3d - Path to the 3D GraphicsLayerView
    * 
    * @type {Object}
    * @private
    */
    viewModulePaths: {
      "2d": "../views/2d/layers/GraphicsLayerView2D",
      "3d": "../views/3d/layers/GraphicsLayerView3D"
    },

    //----------------------------------
    //  graphics
    //----------------------------------
    
    _gfxHdl: null,

    /**
     * A collection of {@link module:esri/Graphic graphics} in the layer. 
     * Each graphic is a vector representation of the location of a 
     * real-world feature. Each graphic in a single GraphicsLayer may contain either a 
     * {@link module:esri/geometry/Point}, {@link module:esri/geometry/Polyline}, or
     * {@link module:esri/geometry/Polygon} {@link module:esri/Graphic#geometry geometry}. In addition, each 
     * {@link module:esri/Graphic} in the collection
     * may contain its own {@link module:esri/Graphic#attributes attributes},
     * {@link module:esri/symbols/Symbol}, and {@link module:esri/PopupTemplate}.
     * 
     * To add a graphic to the GraphicsLayer use [add()](#add), or 
     * {@link module:esri/core/Collection#addItem GraphicsLayer.graphics.addItem()}.
     *
     * @type {module:esri/core/Collection}
     * 
     * @example
     * //add graphics to GraphicsLayer directly as an array
     * layer.graphics = [graphicA, graphicB];
     * 
     * //add graphics to layer via Collection
     * layer.graphics.addItems([graphicC, graphicD]);
     * 
     * @see module:esri/Graphic
     */
    graphics: null,
    
    _graphicsSetter: function(value, oldValue) {
      // there is no oldValue defined
      // use the value as the graphics collection.
      if (!oldValue) {

        // update all the graphics
        value.forEach(function(g) {
          g.layer = this;
        }, this);

        // listen for further change to the collection
        this._gfxHdl = value.on("change", function(event) {
          var i, g, arr;
          arr = event.added;
          for (i = 0; (g = arr[i]); i++) {
            g.layer = this;
          }
          arr = event.removed;
          for (i = 0; (g = arr[i]); i++) {
            g.layer = null;
          }
        }.bind(this));

        return value;
      }
      
      // keep the old collection, just clear it and add the graphics
      oldValue.clear();
      oldValue.addItems(value);
      
      return oldValue;
    },

    //----------------------------------
    //  popupTemplate
    //----------------------------------
    
    /**
     * The popup template for the layer. When set on the layer, the `popupTemplate`
     * allows users to access attributes and display their values in the 
     * {@link module:esri/views/View#popup view's popup} when a feature is selected 
     * using text and/or charts. See the [PopupTemplate sample](../../sample-code/2d/popup-template/)
     * for an example of how {@link module:esri/PopupTemplate} interacts with a
     * {@link module:esri/layers/FeatureLayer}. Setting a {@link module:esri/PopupTemplate}
     * on this layer type is done in the same way as a FeatureLayer.
     * 
     * @type {module:esri/PopupTemplate}
     */
    popupTemplate: null,

    //----------------------------------
    //  renderer
    //----------------------------------

    /**
     * The renderer assigned to the layer.
     *
     * @type {module:esri/renderers/Renderer}
     */
    renderer: null,

    //----------------------------------
    //  elevationInfo
    //----------------------------------

    /**
     * Specifies how graphics are placed on the vertical axis (z). This property only has an effect 
     * in a {@link module:esri/views/SceneView SceneView}. See the [ElevationInfo sample](../sample-code/3d/elevationinfo-3d/)
     * for an example of how this property may be used.
     *
     * @type {Object}
     * @property {string} mode - Defines how the graphic is placed with respect to the terrain surface.
     * See the table below for a list of possible values.
     *
     * Mode | Description
     * ------|------------
     * onTheGround | Graphics are placed on the terrain surface.
     * relativeToGround | The graphic is placed at a specified height/elevation above the ground. This elevation is determined by adding the value of `offset` to the elevation of the terrian surface.
     * absoluteHeight | Graphics are placed at an absolute height above sea level. This height is determined by the value of `offset` and doesn't take the elevation of the terrain into account.
     *
     * @property {number} offset - An elevation offset in meters, which is added to the vertical position of the graphic.
     * When `mode = "onTheGround"`, this property has no effect.
     *
     */
    elevationInfo: null,
      
    /**
     * override attributionDataUrl doc inherited from Layer
     * @name attributionDataUrl
     * @type {string}
     * @instance
     * @ignore
     */  
      
    /**
     * override url doc inherited from Layer
     * @name url
     * @type {string}
     * @instance
     * @ignore
     */

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * Adds a graphic or an array of graphics to the layer.
     * 
     * @param {module:esri/Graphic | module:esri/Graphic[]} graphics - The graphic(s) to
     *                                                               add to the layer.
     */
    add: function(graphics) {
      // graphics arg can be an array or a single graphic.
      graphics = graphics.hasOwnProperty("length") ? graphics : [graphics];
      this.graphics.addItems(graphics);
    },
    
    /**
     * Clears all the graphics from the layer.
     */
    clear: function() {
      this.graphics.clear();
    },

    createGraphicsController: function(parameters) {
      var dfd = new Deferred();
      var controller = {
        layer: this,
        layerView: parameters.layerView,
        graphicsCollection: this.graphics
      };
      
      this.emit("graphics-controller-create", {
        graphicsController: controller
      });
      
      dfd.resolve(controller);
      return dfd.promise;
    },
    
    /**
     * Removes a graphic or an array of graphics from the layer.
     * 
     * @param {module:esri/Graphic | module:esri/Graphic[]} graphics - The graphic(s) to
     *                                                               remove from the layer.
     */
    remove: function(graphics) {
      // graphics arg can be an array or a single graphic.
      graphics = graphics.hasOwnProperty("length") ? graphics : [graphics];
      this.graphics.removeItems(graphics);
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    
    /**
     * @private
     */
    graphicChanged: function(event) {
      // Event format:
      // {
      //   item: g,
      //   property: "<geometry|symbol|attributes>",
      //   attributeName: "" optional
      //   oldValue: "",
      //   newValue: ""
      // }
      this.emit("graphic-update", event);
    }
  
  });
  
  return GraphicsLayer;
});
