/**
 * Symbols are used to display points, lines, polygons, and text on layers.
 * Symbol is the base symbol class and has no constructor. To create new symbols, use the following instead: 
 * 
 * * **Points:** {@link module:esri/symbols/SimpleMarkerSymbol SimpleMarkerSymbol}, 
 * {@link module:esri/symbols/PictureMarkerSymbol PictureMarkerSymbol}
 * * **Lines:** {@link module:esri/symbols/SimpleLineSymbol SimpleLineSymbol}
 * * **Polygons:** {@link module:esri/symbols/SimpleFillSymbol SimpleFillSymbol},
 * {@link module:esri/symbols/PictureFillSymbol PictureFillSymbol}
 * * **Text:** {@link module:esri/symbols/TextSymbol TextSymbol}
 * 
 * @module esri/symbols/Symbol
 * @noconstructor
 * @since 4.0
 * @see module:esri/symbols/SimpleMarkerSymbol
 * @see module:esri/symbols/SimpleLineSymbol
 * @see module:esri/symbols/SimpleFillSymbol
 * @see module:esri/symbols/PictureFillSymbol
 */
define(
[
  "../core/lang",
  "../Color",

  "../core/JSONSupport"
],
function(
  esriLang, Color,
  JSONSupport
) {

  var ID = 0;
  function generateID() {
    return "sym" + ID++;
  }

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/symbols/Symbol
   */
  var Symbol = JSONSupport.createSubclass(
  /** @lends module:esri/symbols/Symbol.prototype */
  {
    declaredClass: "esri.symbols.Symbol",
    
    classMetadata: {
      properties: {
        color: {
          type: Color
        }
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this.id = generateID();
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    symbolLayers: null,

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * The type of symbol.
     * 
     * **Possible values:** simplemarkersymbol | picturemarkersymbol | simplelinesymbol |
     * simplefillsymbol | picturefillsymbol | textsymbol |
     * shieldlabelsymbol | PointSymbol3D | LineSymbol3D | PolygonSymbol3D | MeshSymbol3D | LabelSymbol3D
     *
     * @type {string}
     * @readonly
     */
    type: null,

    _typeReader: function(value, source) {
      if (value && value.indexOf("esri") === 0) {
        return {
          "esriSMS": "simplemarkersymbol",
          "esriPMS": "picturemarkersymbol",
          "esriSLS": "simplelinesymbol",
          "esriCLS": "cartographiclinesymbol",
          "esriSFS": "simplefillsymbol",
          "esriPFS": "picturefillsymbol",
          "esriTS":  "textsymbol",
          "esriSHD": "shieldlabelsymbol"
        }[value];
      }
      return value;
    },

    //----------------------------------
    //  color
    //----------------------------------

    /**
     * Color of the symbol. Can be a named string; hex string; array of rgb or rgba values; an
     * object with `r`, `g`, `b`, and `a` properties; or a {@link module:esri/Color Color} object.
     *
     * @type {module:esri/Color}
     *
     * @default black
     */
    color: new Color([ 0, 0, 0, 1 ]),

    _colorReader: function(value) {
      if (value && esriLang.isDefined(value[0])) {
        return [ value[0], value[1], value[2], value[3] / 255 ];
      }
    },
    

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    addLayer: function(layer) {
      if (this.symbolLayers === null) {
        this.symbolLayers = [ layer ];
      }
      else {
        this.symbolLayers.push(layer);
      }
    },

    removeLayer: function(layer) {
      if (this.symbolLayers !== null) {
        var layerIdx = this.symbolLayers.indexOf(layer);
        if (layerIdx > -1) {
          this.symbolLayers.splice(layerIdx, 1);
        }
      }
    },
  
    /**
     * Converts object to its ArcGIS Server JSON representation.
     *
     * @return {Object} JSON representation of the object.
     * @private                  
     */
    toJSON: function() {
      return { color: Color.toJSON(this.color) };
    }

  });

  return Symbol;
});
