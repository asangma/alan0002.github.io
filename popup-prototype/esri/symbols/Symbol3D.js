/**
 * Symbols of type Symbol3D are used to display 3D points, lines, and polygons on the layer in a
 * {@link module:esri/views/SceneView SceneView}. Symbol3D is a base class and has no constructor.
 * Use the following classes instead:
 * * Points - {@link module:esri/symbols/PointSymbol3D PointSymbol3D}
 * * Lines - {@link module:esri/symbols/LineSymbol3D LineSymbol3D}
 * * Polygons - {@link module:esri/symbols/PolygonSymbol3D PolygonSymbol3D}
 *
 * @module esri/symbols/Symbol3D
 * @noconstructor
 * @since 4.0
 * @see module:esri/symbols/PointSymbol3D
 * @see module:esri/symbols/LineSymbol3D
 * @see module:esri/symbols/PolygonSymbol3D
 * @see module:esri/symbols/MeshSymbol3D
 */

define([
  "../core/declare",
  "dojo/_base/lang",
  "./Symbol",

  "./Symbol3DLayer",
  "./IconSymbol3DLayer",
  "./ObjectSymbol3DLayer",
  "./LineSymbol3DLayer",
  "./PathSymbol3DLayer",
  "./FillSymbol3DLayer",
  "./ExtrudeSymbol3DLayer",
  "./TextSymbol3DLayer"
], function(
  declare, lang, Symbol,
  Symbol3DLayer, IconSymbol3DLayer, ObjectSymbol3DLayer, LineSymbol3DLayer, PathSymbol3DLayer, FillSymbol3DLayer, ExtrudeSymbol3DLayer, TextSymbol3DLayer
) {

  var Symbol3DLayerClasses = {
    "Icon"    : IconSymbol3DLayer,
    "Object"  : ObjectSymbol3DLayer,
    "Line"    : LineSymbol3DLayer,
    "Path"    : PathSymbol3DLayer,
    "Fill"    : FillSymbol3DLayer,
    "Extrude" : ExtrudeSymbol3DLayer,
    "Text"    : TextSymbol3DLayer
  };


  /**
   * @extends module:esri/symbols/Symbol
   * @constructor module:esri/symbols/Symbol3D
   */
  var Symbol3D = declare(Symbol,
  /** @lends module:esri/symbols/Symbol3D.prototype */
  {
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(param) {
      if (param instanceof Symbol3DLayer) {
        return { symbolLayers: [param] };
      }
      else if (lang.isArray(param)) {
        return { symbolLayers: param };
      }
      return param;
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        symbolLayers: []
      });
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
     * The type of 3D symbol.
     * 
     * **Possible values:** PointSymbol3D | LineSymbol3D | PolygonSymbol3D | MeshSymbol3D | LabelSymbol3D
     *
     * @type {string}
     * @readonly
     */
    type: null,

    //----------------------------------
    //  symbolLayers
    //----------------------------------

    /**
     * An array of symbol layers used to visualize any graphic or feature the symbol is applied to.
     *
     * @type {module:esri/symbols/Symbol3DLayer[]}
     */
    symbolLayers: null,

    _symbolLayersReader: function(value) {
      var layers = [];
      for (var i = 0; i < value.length; i++) {
        var jsonLayer = value[i];
        var layerType = jsonLayer.type;
        var LayerClass = Symbol3DLayerClasses[layerType];
        if (!LayerClass) {
          console.warn("Unknown symbol layer: " + layerType);
        } else if (this._allowedLayerTypes.indexOf(layerType) < 0) {
          console.warn("Symbol layer of type '%s' not allowed for symbol of type '%s'", layerType, this.type);
        } else {
          layers.push(LayerClass.fromJSON(jsonLayer));
        }
      }
      return layers;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function(){
       return { 
        type:this.type,
        symbolLayers:this.symbolLayers.map(function(sl){return sl.toJSON();})
       };
    },

    //--------------------------------------------------------------------------
    //
    //  Internals
    //
    //--------------------------------------------------------------------------

    _allowedLayerTypes: []
  });
  
  return Symbol3D;
});
