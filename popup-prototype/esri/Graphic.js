/**
 * A Graphic can contain geometry, a symbol, and attributes. A Graphic is
 * displayed in the {@link module:esri/layers/GraphicsLayer GraphicsLayer}. 
 * The GraphicsLayer allows you to listen for events on Graphics.
 *
 * @module esri/Graphic
 * @since 4.0
 * @see [Sample - Add graphics (2D)](../sample-code/2d/add-graphics/)
 * @see [Sample - Add graphics (3D)](../sample-code/3d/add-graphics/)
 * @see module:esri/layers/GraphicsLayer
 * @see module:esri/geometry/Geometry
 */
define(
[
  "dojo/_base/lang",
  
  "./core/JSONSupport",
  
  "./core/lang",
  "./PopupTemplate",
  
  "./geometry/support/jsonUtils",
  "./symbols/support/jsonUtils"
],
function(
  lang,
  JSONSupport,
  esriLang, PopupTemplate, 
  geomJsonUtils, symJsonUtils
) {
  
  var idCounter = 0;

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/Graphic
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Graphic = JSONSupport.createSubclass(
  /** @lends module:esri/Graphic.prototype */
  {
    declaredClass: "esri.Graphic",
    
    classMetadata: {
      properties: {
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

    constructor: function Graphic(kwArgs) {
      this.id = idCounter++;
    },

    normalizeCtorArgs: function(geometry, symbol, attributes, popupTemplate) {
      if (geometry && !geometry.declaredClass) {
        return geometry;
      }
      else {
        return {
          geometry:      geometry,
          symbol:        symbol,
          attributes:    attributes,
          popupTemplate: popupTemplate
        };
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    //----------------------------------
    //  attributes
    //----------------------------------

    /**
    * Name-value pairs of fields and field values associated with the graphic.
    * 
    * @type {Object}
    * @example
    * var graphic = new Graphic();
    * graphic.attributes = {
    *   "name": "Spruce",
    *   "family": "Pinaceae",
    *   "count": 126
    * };
    */
    attributes: null,

    _attributesSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._notifyLayer("attributes", oldValue, value);
      return value;
    },

    //----------------------------------
    //  geometry
    //----------------------------------

    /**
    * The geometry that defines the graphic's location.
    * 
    * @type {module:esri/geometry/Geometry}
    */  
    geometry: null,

    _geometrySetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._notifyLayer("geometry", oldValue, value);
      return value;
    },

    _geometryReader: function(value) {
      return geomJsonUtils.fromJSON(value);
    },

    //----------------------------------
    //  popupTemplate
    //----------------------------------

    /**
    * The template for displaying content in a {@link module:esri/widgets/Popup}
    * when the graphic is selected. The {@link module:esri/PopupTemplate} may be used to access
    * a graphic's [attributes](#attributes) and display their values in the view's 
    * default popup. See the documentation for {@link module:esri/PopupTemplate} for details on 
    * how to display attribute values in the popup.
    * 
    * @type {module:esri/PopupTemplate}
    */
    popupTemplate: null,

    //----------------------------------
    //  symbol
    //----------------------------------

    /**
    * The symbol for the graphic.
    * 
    * @type {module:esri/symbols/Symbol}
    */  
    symbol: null,

    _symbolSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._notifyLayer("symbol", oldValue, value);
      return value;
    },

    _symbolReader: function(value) {
      return symJsonUtils.fromJSON(value);
    },

    //----------------------------------
    //  visible
    //----------------------------------

    /**
    * Inidcates the visibility of the graphic.
    * 
    * @type {boolean}
    * @default
    */
    visible: true,

    _visibleSetter: function(value, oldValue) {
      if (oldValue === value) { return oldValue; }
      this._notifyLayer("visible", oldValue, value);
      return value;
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Returns the value of the specified attribute.
     * 
     * @param {string} name - The name of the attribute.
     *                      
     * @return {*} Returns the value of the attribute specified by `name`.
     */
    getAttribute: function(name) {
      return this.attributes && this.attributes[name];
    },

    /**
     * Sets a new value to the specified attribute.
     * 
     * @param {string} name - The name of the attribute to set.
     * @param {*} newValue - The new value to set on the named attribute.
     */
    setAttribute: function(name, newValue) {
      var attributes,
          oldValue = this.getAttribute(name);
      if (!this.attributes) {
        attributes = {};
        attributes[name] = newValue;
        this.attributes = attributes;
      }
      else {
        this.attributes[name] = newValue;
        this._notifyLayer("attributes", oldValue, newValue, name);
      }
    },

    /**
     * Returns the graphic's popup template.
     * 
     * @return {module:esri/PopupTemplate} Returns the popup template of the graphic.                                          
     */
    getEffectivePopupTemplate: function() {
      return this.popupTemplate || (this.layer && this.layer.popupTemplate);
    },

    toJSON: function() {
      return {
        geometry:     this.geometry && this.geometry.toJSON(),
        symbol:       this.symbol && this.symbol.toJSON(),
        attributes:   lang.mixin({}, this.attributes),
        popupTemplate: this.popupTemplate && this.popupTemplate.toJSON()
      };
    },

    /**
     * Creates a copy of the graphic object.
     * 
     * @return {module:esri/Graphic} Returns a copy of the graphic.
     */
    clone: function() {
      return new Graphic({
        attributes: lang.clone(this.attributes),
        geometry: this.geometry && this.geometry.clone() || null,
        popupTemplate: this.popupTemplate && this.popupTemplate.clone(),
        symbol: this.symbol && this.symbol.clone() || null,
        visible: this.visible
      });
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _notifyLayer: function(property, oldValue, newValue, attributeName) {
      var event;

      if (!this.layer) {
        return;
      }

      event = {
        graphic: this,
        property: property,
        oldValue: oldValue,
        newValue: newValue
      };

      if (attributeName) {
        event.attributeName = attributeName;
      }

      this.layer.graphicChanged(event);
    }
    
  });

  return Graphic;
});
