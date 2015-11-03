/**
 * 3D symbol layers are used to define the visualization of {@link module:esri/geometry/Point points}, {@link module:esri/geometry/Polyline lines}, 
 * {@link module:esri/geometry/Polygon polygons}, and {@link module:esri/symbols/MeshSymbol3D meshes} on the {@link module:esri/layers/GraphicsLayer GraphicsLayer},
 * {@link module:esri/layers/FeatureLayer FeatureLayer}, or {@link module:esri/layers/SceneLayer SceneLayer} in a 
 * {@link module:esri/views/SceneView SceneView}. They are added to instances of 
 * {@link module:esri/symbols/Symbol3D Symbol3D} subclasses (e.g. to {@link module:esri/symbols/PointSymbol3D PointSymbol3D}
 * for points). Symbol3DLayer is a base class and has no constructor. See the subclasses of Symbol3DLayer below for constructing 3D symbol layers.
 * 
 * @module esri/symbols/Symbol3DLayer
 * @noconstructor
 * @since 4.0
 * @see module:esri/symbols/ExtrudeSymbol3DLayer
 * @see module:esri/symbols/FillSymbol3DLayer
 * @see module:esri/symbols/IconSymbol3DLayer
 * @see module:esri/symbols/LineSymbol3DLayer
 * @see module:esri/symbols/ObjectSymbol3DLayer
 * @see module:esri/symbols/PathSymbol3DLayer
 * @see module:esri/symbols/TextSymbol3DLayer
 */
define([
    "dojo/_base/lang",
    "../core/lang",
    "../core/JSONSupport",
    "../Color"
  ],
  function(lang, esriLang, JSONSupport, Color) {


  // Material: internal class, used only by Symbol3DLayer
  var Material = JSONSupport.createSubclass({
    classMetadata: {
      properties: {
        color: {
          type: Color
        }
      },
      reader: {
        exclude: ["transparency"]
      }
    },

    color: undefined,

    toJSON: function() {
      return {
        color: this.color ? [this.color.r, this.color.g, this.color.b] : undefined,
        transparency: this.color ? 100*(1 - this.color.a) : undefined
      };
    },

    _colorReader: function(value, source) {
      var opacity = source.transparency != null ? 1 - 0.01*source.transparency : 1;
      if (value && esriLang.isDefined(value[0])) {
        return [ value[0], value[1], value[2], opacity ];
      }
    }
  });

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/symbols/Symbol3DLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Symbol3DLayer = JSONSupport.createSubclass(
  /** @lends module:esri/symbols/Symbol3DLayer.prototype */
  {
    classMetadata: {
      properties: {
        material: {
          type: Material
        },
        enable: {}
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  enable
    //----------------------------------

    /**
     * Indicates whether the symbol layer is enabled. A disabled symbol layer will not result in any visualization.
     *
     * @type {boolean}
     * @default true
     */
    enable: true,

    //----------------------------------
    //  type
    //----------------------------------

    /**
     * The type of 3D symbol layer. See the table below for a list of possible values.
     * 
     * Value | Description
     * ------|------------
     * Icon | ![s3d-icon](../assets/img/apiref/symbols/symbols3d-icon-circle.png)
     * Object | ![s3d-object](../assets/img/apiref/symbols/symbols3d-object-sphere.png)
     * Line | ![s3d-path](../assets/img/apiref/symbols/symbols3d-line-line.png)
     * Path | ![s3d-path](../assets/img/apiref/symbols/symbols3d-path-tube.png)
     * Fill | ![s3d-fill](../assets/img/apiref/symbols/symbols3d-fill-solid.png)
     * Extrusion | ![s3d-extrusion](../assets/img/apiref/symbols/symbols3d-extrude-solid.png)
     * Text | ![s3d-text](../assets/img/apiref/symbols/symbols3d-label-text.png)
     *
     * @type {string}
     * @readOnly
     */
    type: null,

    //----------------------------------
    //  material
    //----------------------------------

    /**
     * The material used for visualization of the geometry. For `material` properties, see the documentation
     * of the individual symbol layer classes.
     *
     * @type {Object}
     */
    material: undefined,

    _materialReader: function(value) {
      var result = new Material();
      result.read(value);
      return result;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    toJSON: function() {
      return {
        type: this.type,
        enable: this.enable,
        material: this.material ? this.material.toJSON() : undefined,
        elevationInfo: this.elevationInfo ? lang.clone(this.elevationInfo) : undefined
      };
    }
  });

  return Symbol3DLayer;
});
