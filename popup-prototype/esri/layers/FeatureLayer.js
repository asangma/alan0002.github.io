/**
 * A FeatureLayer is a single layer in either a 
 * [Map Service](http://server.arcgis.com/en/server/latest/publish-services/windows/what-is-a-map-service.htm) 
 * or a [Feature Service](http://server.arcgis.com/en/server/latest/publish-services/windows/what-is-a-feature-service-.htm).
 * It is composed of discrete features, each of which has a {@link module:esri/geometry/Geometry} 
 * that allows it to be rendered on the {@link module:esri/views/View view} as a 
 * {@link module:esri/Graphic graphic} with spatial context. Features also contain data 
 * {@link module:esri/Graphic#attributes attributes} that provide additional information about 
 * the real-world feature it represents; attributes may be viewed in {@link module:esri/widgets/Popup popup} windows 
 * and used for {@link module:esri/renderers/Renderer rendering} the layer.
 * 
 * Features within a FeatureLayer are rendered as {@link esri/Graphic graphics} inside a 
 * {@link module:esri/views/layers/LayerView}. Therefore the graphics visible in a view are accessed 
 * via the LayerView, not the FeatureLayer. For more information regarding how to create a LayerView 
 * for a particular layer, see {@link module:esri/views/View#getLayerView View.getLayerView()}.
 * 
 * FeatureLayers may be {@link module:esri/tasks/QueryTask queried}, {@link module:esri/geometry/geometryEngine analyzed}, 
 * and {@link module:esri/renderers/Renderer rendered} to visualize data in a spatial context. 
 * In this version of the API, geometries and attributes of features in a FeatureLayer cannot be added, deleted, or edited.
 * Editing will be supported in a future release.
 * 
 * To create a FeatureLayer, you must set the URL to the REST endpoint of a layer in either a Feature Service
 * or a Map Service. For a layer to be visible in a view, it must be added to the {@link module:esri/Map} 
 * referenced by the view. See {@link module:esri/Map#add Map.add()} for information about adding layers to a map.
 * 
 * ```js
 * require(["esri/layers/FeatureLayer"], function(FeatureLayer){
 *   //A valid URL is required for creating a FeatureLayer
 *   var fl = new FeatureLayer({
 *     url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3"
 *   });
 *   map.add(fl);  //layer is added to map
 * });
 * ```
 * 
 * For layers created from services published to ArcGIS for Server prior to version 10.3, the number 
 * of features returned and displayed on the map is limited to the number in `MaxRecordCount` as defined 
 * in the Services Directory of the Map Service or Feature Service. For layers created from hosted 
 * feature services published to ArcGIS Online or ArcGIS for Server 10.3 or later, there is no limit 
 * to the number of features displayed on the map.
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 *
 * @module esri/layers/FeatureLayer
 * @since 4.0
 * @see [Sample - Add FeatureLayer to your Map](../sample-code/2d/feature-layer/)
 * @see [Sample - 3D symbols for points](../sample-code/3d/points-3d/)
 * @see module:esri/Map
 */
define(
[
  "require",

  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "dojo/Deferred",
  
  "../core/JSONSupport",

  "../core/sniff",
  "../geometry/Extent",
  "../geometry/SpatialReference",
  "../core/Collection",

  "../symbols/SimpleMarkerSymbol",
  "../symbols/SimpleLineSymbol",
  "../symbols/SimpleFillSymbol",
  "../symbols/support/jsonUtils",

  "../renderers/SimpleRenderer",
  "../renderers/UniqueValueRenderer",
  "../renderers/support/jsonUtils",

  "./GraphicsLayer",
  "./support/Field",
  "./support/FeatureType",
  "./support/FeatureTemplate",
  "./support/TimeInfo",
  "./support/LabelClass"
],
function(
  require, declare, lang, array,
  Deferred,
  JSONSupport,
  has, Extent, SpatialReference, Collection,
  SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, symJsonUtils,
  SimpleRenderer, UniqueValueRenderer, rndJsonUtils,
  GraphicsLayer, Field, FeatureType, FeatureTemplate, TimeInfo, LabelClass
  ) {

  // TODO
  // Forced identity

  /**
   * @extends module:esri/layers/Layer
   * @constructor module:esri/layers/FeatureLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  var FeatureLayer = declare([GraphicsLayer, JSONSupport],
  /** @lends module:esri/layers/FeatureLayer.prototype */
  {

    declaredClass: "esri.layers.FeatureLayer",

    classMetadata: {
      computed: {
        allRenderers:   ["loaded", "renderer", "fields"],
        capabilities:   ["editable"],
        outFields:      ["requiredFields"],
        requiredFields: ["allRenderers"],
        supportsAdvancedQueries: ["hasMemorySource"]
      },
      reader: {
        exclude: [
          "id",
          "copyrightText",
          "definitionExpression",
          "currentVersion",
          "extent",
          "drawingInfo"
        ],

        add: [
          "isTable",
          "layerId",
          "copyright",
          "defaultDefinitionExpression",
          "version",
          "initialExtent",
          "fullExtent",
          "spatialReference",
          "objectIdField",

          // drawingInfo.* is separated into these properties
          "renderer",
          "labelingInfo",
          "opacity",

          "editable",
          "trackIdField"
        ]
      }
    },


    /*************************************
     * Properties shared by all instances
     *************************************/

    // Properties of a renderer used to specify attribute fields.
    _rndProps: [
      "attributeField",
      "attributeField2",
      "attributeField3",
      "rotationInfo.field",
      "proportionalSymbolInfo.field",
      "proportionalSymbolInfo.normalizationField",
      "colorInfo.field",
      "colorInfo.normalizationField"
    ],

    // Properties of a visual variable used to specify attribute fields.
    _visVariableProps: [ "field", "normalizationField" ],

    // Matches online hosted feature servers
    // Ex:
    // http://services.arcgis.com
    // http://servicesdev.arcgis.com
    // http://servicesqa.arcgis.com
    // ...and their https schemes
    // reOnlineFS: /https?:\/\/services.*\.arcgis\.com/i,

    controllerModulePaths: {
      "0": "./graphics/controllers/SnapshotController",

      "1": {
        "2d": "./graphics/controllers/OnDemandController",
        "3d": "./graphics/controllers/OnDemandController"
      },

      "2": "./graphics/controllers/SelectionController",
      "6": "./graphics/controllers/AutoController"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(url, options) {
      // FeatureLayer by URL
      if (typeof url === "string") {
        return lang.mixin({}, {
          url: url
        }, options);
      }
      // FeatureLayer by reference
      else if (url && url.layerDefinition) {
        return lang.mixin({}, {
          collectionLayer: url
        }, options);
      }
      return url;
    },

    getDefaults: function(properties) {
      var defaults = this.inherited(arguments),
          collectionLayer = properties.collectionLayer;
      
      return lang.mixin(defaults || {}, {
        mode: collectionLayer
                ? FeatureLayer.MODE_SNAPSHOT
                : FeatureLayer.MODE_SNAPSHOT, // "auto" for final
        hasMemorySource: !!collectionLayer
      });
    },

    load: function() {
      var sourcePromise = this.createGraphicsSource();
      sourcePromise.then(lang.hitch(this, this._initLayerProperties));
      this.addResolvingPromise(sourcePromise);
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  allowGeometryUpdates
    //----------------------------------    

    _allowGeometryUpdatesReader: function(value) {
      // Older servers that don't define this property implicitly support
      // editing feature geometry
      return (value == null) ? true : value;
    },

    //----------------------------------
    //  allRenderers
    //----------------------------------    

    // dependsOn: renderer, fields, loaded
    _allRenderersGetter: function() {
      return this._getAllRenderers(this.renderer);
    },

    //----------------------------------
    //  capabilities
    //----------------------------------
    
    _capabilitiesGetter: function(oldValue) {
      // Update "capabilities" to reflect "editable"
      var editable = this.editable,
          capabilities = lang.trim(oldValue || ""),
          updated = array.map(capabilities && capabilities.split(","), lang.trim),
          current = array.map(capabilities && capabilities.toLowerCase().split(","), lang.trim),
          found = current.indexOf("editing"),
          itemized = {
            "Create": array.indexOf(current, "create"),
            "Update": array.indexOf(current, "update"),
            "Delete": array.indexOf(current, "delete")
          };

      if (editable && found === -1) {
        updated.push("Editing");

        // Push Create, Update and Delete
        /*for (cap in specifics) {
          if (specifics[cap] === -1) {
            outCaps.push(cap);
          }
        }*/
      }
      else if (!editable && found > -1) {
        var obsolete = [ found ], capName, i;

        // Remove Create, Update and Delete
        for (capName in itemized) {
          if (itemized[capName] > -1) {
            obsolete.push(itemized[capName]);
          }
        }

        obsolete.sort();

        for (i = obsolete.length - 1; i >= 0; i--) {
          updated.splice(obsolete[i], 1);
        }
      }

      return updated.join(",");
    },

    //----------------------------------
    //  copyright
    //----------------------------------
      
    /**
     * The copyright text as defined by the map service.
     *
     * @type {string}
     */
    copyright: null,  
    
    _copyrightReader: function(value, source) {
      // TODO, reader is defined in ArcGISMapService
      // We expose "copyrightText" as "copyright" in the SDK.
      return source.copyrightText;
    },
      
    /**
     * The where clause used to perform server-side filtering of features. Only the features that match the definition 
     * expression are displayed in the {@link module:esri/views/View}. A definition expression limits the features available for display and queries by 
     * applying constraints to the layer's attribute fields. Setting a definition expression is useful when the dataset 
     * is large and you don't want to bring all features to the client for analysis. This method is typically called before 
     * adding the layer to the map. If the method is called after the layer is added to the map the layer will refresh 
     * itself to reflect the new definition expression.
     * 
     * The definition expression is combined with the layer's default definition expression which results in a further restriction of the layer.
     * 
     * @type {string}
     * @name definitionExpression
     * @instance
     * 
     * @example
     * //set definition expression in constructor to only display trees with scientific name Ulmus pumila
     * var layer = new FeatureLayer({
     *   url: "http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0"
     *   definitionExpression: "Sci_Name = 'Ulmus pumila'";
     * });
     * @example
     * //set the definition expression directly on layer instance to only display trees taller than 50ft
     * layer.definitionExpression: "HEIGHT > 50";
     */  

    //----------------------------------
    //  defaultDefinitionExpression
    //----------------------------------  

    _defaultDefinitionExpressionReader: function(value, source) {
      return source.definitionExpression;
    },

    //----------------------------------
    //  defaultDefinitionExpression
    //----------------------------------

    _defaultSymbolReader: function(value) {
      return value && symJsonUtils.fromJSON(value);
    },

    //----------------------------------
    //  editable
    //----------------------------------
    
    _editable: false,

    _editableReader: function(value, source) {
      if (source.capabilities) {
        value = (source.capabilities.toLowerCase().indexOf("editing") !== -1);
      }
      else if (!this.hasMemorySource) {
        value = (this.parsedUrl.path.search(/\/FeatureServer\//i) !== -1);
      }
      return !!value;
    },
    
    _editableGetter: function() {
      return (this._editable || this.userIsAdmin);
    },
    
    _editableSetter: function(value) {
      this._editable = value;
    },
      
    //----------------------------------
    //  elevationInfo
    //----------------------------------

    /**
     * Specifies how graphics are placed on the vertical axis (z). This property may only be used 
     * in a {@link module:esri/views/SceneView SceneView}. See the [ElevationInfo sample](../sample-code/3d/elevationinfo-3d/)
     * for an example of how this property may be used.
     * 
     * @name elevationInfo
     * @instance
     *
     * @type {Object}
     * @property {string} mode - Defines how the graphic is placed with respect to the terrain surface.
     * See the table below for a list of possible values.
     *
     * Mode | Description
     * ------|------------
     * onTheGround | Graphics are draped on the terrain surface. This is the default value for features with {@link module:esri/geometry/Polyline} or {@link module:esri/geometry/Polygon} geometries and features with {@link module:esri/geometry/Point} geometries renderered with {@link module:esri/symbols/ObjectSymbol3DLayer ObjectSymbol3DLayers}.
     * relativeToGround | The graphic is placed at a specified height/elevation above the ground. This elevation is determined by adding the value of `offset` to the elevation of the terrian surface. This is the default value for {@link module:esri/geometry/Point Point} geometries rendered with {@link module:esri/symbols/IconSymbol3DLayer IconSymbol3DLayers}.
     * absoluteHeight | Graphics are placed at an absolute height above sea level. This height is determined by the value of `offset` and doesn't take the elevation of the terrain into account. This is the default value of features with any geometry type where [hasZ](#hasZ) is `true`.
     *
     * @property {number} offset - An elevation offset in meters, which is added to the vertical position of the graphic.
     * When `mode = "onTheGround"`, this property has no effect.
     *
     */ 

    //----------------------------------
    //  fields
    //----------------------------------
      
    /**
     * An array of fields in the layer. Each field represents an attribute
     * that may contain a value for each feature in the layer. For example, 
     * a field named `POP_2015`, stores information about total population as a 
     * numeric value for each feature; this value represents the total number 
     * of people living within the geographic bounds of the feature.
     * 
     * @name fields
     * @instance
     * 
     * @type {module:esri/layers/support/Field[]}
     */

    _fieldsReader: function(value) {
      return value.map(function(field) {
        return new Field(field);
      });
    },

    //----------------------------------
    //  fullExtent
    //----------------------------------

    /**
     * The full extent of the layer.
     * 
     * @type {module:esri/geometry/Extent}
     * @inheritdoc
     */
    fullExtent: null,  
      
    _fullExtentReader: function(value, source) {
      return source.extent && Extent.fromJSON(source.extent);
    },

    //----------------------------------
    //  generalizeForScale
    //----------------------------------

    /**
     * Features will be generalized to the specified scale so they are
     * optimal for viewing at the given scale.
     * 
     * Corresponds to `maxAllowableOffset` of 1 meter
     * 
     * @type {number}
     * @default
     * @private
     */  
    generalizeForScale: 4000,

    //----------------------------------
    //  hasAttachments
    //----------------------------------

    /**
     * Value is `true` if attachments are enabled on the feature layer.
     * 
     * @type {boolean}
     * @default false
     */    
    hasAttachments: false,

    _hasAttachmentsReader: function(value) {
      return !this.hasMemorySource && !!value;
    },

    //----------------------------------
    //  hasM
    //----------------------------------

    /**
     * Indicates if the features in the layer have M values.
     * 
     * @type {boolean}
     * @default false
     * @readonly
     */ 
    hasM: false,

    //----------------------------------
    //  hasMemorySource
    //----------------------------------
    
    /**
     * Indicates if the layer has memory source.
     * 
     * @type {boolean}
     * @default false
     * @private
     * @readonly
     */  
    hasMemorySource: false,

    //----------------------------------
    //  hasZ
    //----------------------------------
    
    /**
     * Indicates if the features in the layer have Z values. See
     * [elevationInfo](#elevationInfo) for details regarding placement and
     * rendering of graphics with z-values in 3D {@link module:esri/views/SceneView SceneViews}.
     * 
     * @type {boolean}
     * @default false
     * @readonly
     */ 
    hasZ: false,    

    //----------------------------------
    //  initialExtent
    //----------------------------------

    _initialExtentReader: function(value, source) {
      return source.extent && Extent.fromJSON(source.extent);
    },

    //----------------------------------
    //  isTable
    //----------------------------------

    _isTableReader: function(value, source) {
      return (source.type === "Table");
    },

    //----------------------------------
    //  labelingInfo
    //----------------------------------

    _labelingInfoReader: function(value, source) {
      value = source.drawingInfo && source.drawingInfo.labelingInfo;

      if (value) {
        var reFieldName = /\[([^\[\]]+)\]/ig, // field in label expression
            expr,
            replacer = function(match, fieldName) {
              // Return the field name as defined in layer.fields
              var field = this.getField(fieldName, source.fields);
              return "[" + ((field && field.name) || fieldName) + "]";
            }.bind(this);

        value = value.map(function(labelClass) {
          labelClass = new LabelClass(labelClass);

          // Fix case difference in field names specified in the label expression
          expr = labelClass.labelExpression;
          if (expr) {
            labelClass.labelExpression = expr.replace(reFieldName, replacer);
          }

          return labelClass;
        });
      }

      return value;
    },

    //----------------------------------
    //  latticeTiling
    //----------------------------------
    
    /**
     * Indicates if lattice tiling is supported in the layer.
     * 
     * @type {boolean}
     * @default false
     * @private
     * @readonly
     */ 
    latticeTiling:   false,

    _latticeTilingReader: function(value, source) {
      // Disable lattice tiling for point and multipoint layers
      return !(
        (source.geometryType === "esriGeometryPoint") ||
        (source.geometryType === "esriGeometryMultipoint")
      );
    },

    //----------------------------------
    //  layerId
    //----------------------------------

    _layerIdReader: function(value, source) {
      return source.id;
    },

    //----------------------------------
    //  maxPointCountForAuto
    //----------------------------------

    // When in "auto" mode, layer will switch from on-demand mode to snapshot
    // mode if the number of features in the layer does not exceed the limits
    // set below or maxRecordCount - whichever is lower.
    // These limits are chosen to balance the following factors:
    // 1. Server load
    // 2. Network latency (response size)
    // 3. Feature generalization
    // 4. Client load/performance
    /**
     * @private
     */ 
    maxPointCountForAuto: 4000,

    //----------------------------------
    //  maxRecordCountForAuto
    //----------------------------------

    /**
     * @private
     */ 
    maxRecordCountForAuto: 2000,

    //----------------------------------
    //  maxVertexCountForAuto
    //----------------------------------

    /**
     * @private
     */ 
    maxVertexCountForAuto: 250000,

    //----------------------------------
    //  minScale
    //----------------------------------

    _minScaleReader: function(value, source) {
      return source.effectiveMinScale || value;
    },

    //----------------------------------
    //  maxScale
    //----------------------------------

    _maxScaleReader: function(value, source) {
      return source.effectiveMaxScale || value;
    },

    //----------------------------------
    //  objectIdField
    //----------------------------------    

    _objectIdFieldReader: function(value, source) {
      // Find OID field from "fields" if it is not explicitly defined.
      if (!value) {
        source.fields.some(function(field) {
          if (field.type === "esriFieldTypeOID") {
            value = field.name;
          }
          return !!value;
        });
      }
      return value;
    },

    //----------------------------------
    //  opacity
    //----------------------------------

    _opacityReader: function(value, source) {
      var transparency = (source.drawingInfo && source.drawingInfo.transparency)
                          || 0;
      return 1 - transparency / 100;
    },

    //----------------------------------
    //  outFields
    //----------------------------------
      
    /**
     * An array field names from the service to include in the FeatureLayer. If not specified, 
     * the layer will only return the `OBJECTID` field. To fetch the values from all fields in
     * the layer, use `["*"]`. This is particularly useful when editing features.
     * 
     * @name outFields
     * @instance
     * @type {string[]}
     *             
     * @example
     * //Includes all fields from the service in the layer
     * fl.outFields = ["*"];
     * 
     * @example
     * //Includes only the specified fields from the service in the layer
     * fl.outFields = ["NAME", "POP_2010", "FIPS", "AREA"];
     */  

    _outFields: null,

    _outFieldsGetter: function() {
      var outFields = this._outFields,
          required = this.requiredFields;

      if (outFields) {
        if (outFields.indexOf("*") === -1) {
          // If user defined outFields does not have "*", then make sure it
          // has all the required fields.
          required.forEach(function(field) {
            if (outFields.indexOf(field) === -1) {
              outFields.push(field);
            }
          });
        }
      }
      else {
        outFields = required;
      }

      if (this.loaded) {
        // Remove fields that are not defined in this.fields
        outFields = outFields.filter(function(field) {
          return (field === "*" || !!this.getField(field));
        }, this);

        // Use field names with proper case i.e. as defined in this.fields
        outFields = outFields.map(function(field) {
          return (field === "*") ? field : this.getField(field).name;
        }, this);
      }

      return outFields;
    },

    _outFieldsSetter: function(value) {
      this._outFields = value; // getter will be called
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
     * {@link module:esri/layers/FeatureLayer}.
     * 
     * @name popupTemplate
     * @instance
     * @type {module:esri/PopupTemplate}
     */

    //----------------------------------
    //  renderer
    //----------------------------------
      
    /**
    * The renderer assigned to the layer. The renderer allows you to define the
    * technique for visualizing the features in the layer.
    * 
    * @name renderer
    * @instance
    * @type {module:esri/renderers/Renderer}
    */
  
    _rendererSetter: function(renderer) {
      var allRenderers = this._getAllRenderers(renderer);

      // Fix name attribute fields defined in the renderer - so that their
      // casing (lower/upper) is sync with the field names defined in the 
      // layer's schema.
      this._fixRendererFields(allRenderers);
    
      return renderer;
    },

    _rendererReader: function(renderer, source) {
      var symbol;

      renderer = source.drawingInfo && source.drawingInfo.renderer;

      if (renderer) {
        renderer = rndJsonUtils.fromJSON(renderer);

        // Class breaks renderer defined by the service should exhibit
        // maxInclusive behavior.
        if (renderer.addBreak) {
          renderer.setMaxInclusive(true);
        }
      }
      else if (source.defaultSymbol) {
        symbol = symJsonUtils.fromJSON(source.defaultSymbol);

        if (source.types && source.types.length) {
          renderer = new UniqueValueRenderer(symbol, source.typeIdField);

          array.forEach(source.types, function(type) {
            renderer.addValue(type.id, symJsonUtils.fromJSON(type.symbol));
          });
        }
        else {
          renderer = new SimpleRenderer(symbol);
        }
      }
      else if (source.type !== "Table") {
        switch(source.geometryType) {
          case "esriGeometryPoint":
          case "esriGeometryMultipoint":
            symbol = new SimpleMarkerSymbol();
            break;

          case "esriGeometryPolyline":
            symbol = new SimpleLineSymbol();
            break;

          case "esriGeometryPolygon":
            symbol = new SimpleFillSymbol();
            break;
        }

        renderer = symbol && new SimpleRenderer(symbol);
      }

      return renderer;
    },

    //----------------------------------
    //  requiredFields
    //----------------------------------

    _requiredFieldsGetter: function() {
      var timeInfo = this.timeInfo,
          required = [
            this.objectIdField,
            this.typeIdField,
            this.editFieldsInfo && this.editFieldsInfo.creatorField,
            timeInfo && timeInfo.startTimeField,
            timeInfo && timeInfo.endTimeField,
            this.trackIdField
          ],
          props = this._rndProps;

      // Find fields used by the renderer.
      array.forEach(this.allRenderers, function(rnd) {
        array.forEach(props, function(prop) {
          required.push(
            lang.getObject(prop, false, rnd)
          );
        });

        // Find fields used by visual variables.
        if (rnd.visualVariables) {
          rnd.visualVariables.forEach(function(variable) {
            this._visVariableProps.forEach(function(property) {
              required.push(variable[property]);
            });
          }, this);
        }
      }, this);

      required = required.concat(this.dataAttributes);

      // Remove undefined, functions and duplicate values
      return required.filter(function(field, index, arr) {
        return !!field
                && (arr.indexOf(field) === index)
                && (typeof field !== "function");
      });
    },

    //----------------------------------
    //  returnM
    //----------------------------------
    
    /**
     * When `true`, indicates that M values will be returned.
     * 
     * @type {boolean}
     * @default false
     */ 
    returnM: false,

    //----------------------------------
    //  returnZ
    //----------------------------------
    
    /**
     * When `true`, indicates that Z values will be returned.
     * 
     * @type {boolean}
     * @default false
     */ 
    returnZ: false,

    //----------------------------------
    //  spatialReference
    //----------------------------------

    _spatialReferenceReader: function(value, source) {
      value = source.extent && source.extent.spatialReference;
      return value && SpatialReference.fromJSON(value);
    },

    //----------------------------------
    //  supportsAdvancedQueries
    //----------------------------------
    
    _supportsAdvancedQueries: false,

    _supportsAdvancedQueriesGetter: function() {
      return this.hasMemorySource ? false : this._supportsAdvancedQueries;
    },

    _supportsAdvancedQueriesSetter: function(value) {
      this._supportsAdvancedQueries = value;
    },

    //----------------------------------
    //  templates
    //----------------------------------    

    _templatesReader: function(value, source) {
      var editInfo = source.editFieldsInfo,
          creator = editInfo && editInfo.creatorField,
          editor = editInfo && editInfo.editorField;

      value = value && value.map(function(template) {
        return new FeatureTemplate(template);
      });

      this._fixTemplates(value, creator);
      this._fixTemplates(value, editor);

      return value;
    },

    //----------------------------------
    //  timeInfo
    //----------------------------------    

    _timeInfoReader: function(value) {
      value = value && new TimeInfo(value);
      value.trackIdField = this.trackIdField || value.trackIdField;
      return value;
    },

    //----------------------------------
    //  trackIdField
    //----------------------------------    

    _trackIdFieldReader: function(value, source) {
      return source.timeInfo && source.timeInfo.trackIdField;
    },

    //----------------------------------
    //  typeIdField
    //----------------------------------

    _typeIdFieldReader: function(value, source) {
      // "typeIdField" is known to have field name in different case compared
      // to its definition in "fields"
      if (value) {
        var info = this.getField(value, source.fields);
        if (info) {
          value = info.name;
        }
      }
      return value;
    },

    //----------------------------------
    //  types
    //----------------------------------

    _typesReader: function(value, source) {
      var editInfo = source.editFieldsInfo,
          creator = editInfo && editInfo.creatorField,
          editor = editInfo && editInfo.editorField;

      return value && value.map(function(type) {
        type = new FeatureType(type);

        this._fixTemplates(type.templates, creator);
        this._fixTemplates(type.templates, editor);

        return type;
      }, this);
    },

    //----------------------------------
    //  userIsAdmin
    //----------------------------------
    
    /**
     * When `true`, indicates the user has admininstrative privileges.
     * 
     * @type {boolean}
     * @default false
     * @private
     */ 
    userIsAdmin:     false,

    //----------------------------------
    //  version
    //----------------------------------

    _versionReader: function(value, source) {
      // REST API added currentVersion property to some resources at 10 SP1
      // However, we expose "currentVersion" as "version" in the SDK
      value = source.currentVersion;

      // Let's compute version number for servers that don't advertise it.
      if (!value) {
        if (
          source.hasOwnProperty("capabilities") ||
          source.hasOwnProperty("drawingInfo") ||
          source.hasOwnProperty("hasAttachments") ||
          source.hasOwnProperty("htmlPopupType") ||
          source.hasOwnProperty("relationships") ||
          source.hasOwnProperty("timeInfo") ||
          source.hasOwnProperty("typeIdField") ||
          source.hasOwnProperty("types")
        ) {
          value = 10;
        }
        else {
          value = 9.3; // or it could be 9.3.1
        }
      }

      return value;
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    createGraphicsSource: function() {
      var dfd = new Deferred(),
          moduleName = this.collectionLayer ? "MemorySource" : "FeatureLayerSource";

      require(
        [ "./graphics/sources/" + moduleName ],

        lang.hitch(this, function(SourceClass) {
          var source = new SourceClass({
            layer: this
          });

          source.then(
            lang.hitch(this, function() {
              this.emit("graphics-source-create", {
                graphicsSource: source
              });

              dfd.resolve(source);
            }),

            function(err) {
              dfd.reject(err);
            }
          );
        })
      );

      return dfd.promise;
    },

    createGraphicsController: function(parameters) {
      var dfd = new Deferred(),
          modulePath = this.controllerModulePaths[this.mode],
          layerView  = parameters.layerView,
          collection = new Collection(),
          controllerProps = lang.mixin(parameters.options || {}, {
            layer: this,
            layerView: layerView,
            graphicsCollection: collection
          });

      // We may have separate controllers for 2d and 3d views
      if (typeof modulePath === "object") {
        modulePath = modulePath[layerView.view.type];
      }
      
      if (modulePath) {
        // Import and instantiate the controller of the desired type
        require(
          [ modulePath ],

          lang.hitch(this, function(ControllerClass) {
            var controller = new ControllerClass(controllerProps);

            controller.then(
              lang.hitch(this, function() {
                //this.set("graphicsController", controller);

                this.emit("graphics-controller-create", {
                  graphicsController: controller
                });

                dfd.resolve(controller);
              }),

              function(err) {
                dfd.reject(err);
              }
            );
          })
        );
      }
      else {
        dfd.reject(
          new Error("Module path not found for controller type: \"" + this.mode + "\"")
        );
      }

      return dfd.promise;
    },

    getField: function(fieldName, fields) {
      var field;

      fields = fields || this.fields;

      if (fields) {
        fieldName = fieldName.toLowerCase();

        array.some(fields, function(info) {
          if (info && info.name.toLowerCase() === fieldName) {
            field = info;
          }

          return !!field;
        });
      }

      return field;
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _initLayerProperties: function(graphicsSource) {
      this.graphicsSource = graphicsSource;

      // Read/set definition from source
      var layerDefinition = graphicsSource.layerDefinition;
      // Update URL scheme if the response was obtained via HTTPS
      // See esri/request for context regarding "response._ssl"
      if (layerDefinition._ssl) {
        delete layerDefinition._ssl;
        this.url = this.url.replace(/^http:/i, "https:");
      }
      this.read(layerDefinition);

      this._verifyFields();
      this._fixSymbolUrls();

      this.useQueryTimestamp = (has("ie") || has("safari"))
        && this.editable
        && this.version < 10.02;

      this.watch("token", function() {
        this._fixSymbolUrls();
      }.bind(this));
    },

    _fixSymbolUrls: function() {
      // Translate relative image refs defined in PMS/PFS to absolute paths.
      // See - http://nil/rest-docs/msimage.html

      var renderer = this.renderer;

      if (!this.hasMemorySource) {
        var baseUrl = this.parsedUrl.path + "/images/",
            token = this.token,

            // Symbols used by the renderer
            symbols = [
              // Simple renderer
              renderer.symbol,

              // Unique value and class breaks renderers
              renderer.defaultSymbol
            ];

        // Unique value and class breaks renderers
        array.forEach(renderer.infos, function(info) {
          symbols.push(info.symbol);
        });

        // Fix symbols that have url
        array.forEach(symbols, function(symbol) {
          var url = symbol && symbol.url;

          if (url) {
            // Set absolute image url
            if ( (url.search(/https?\:/) === -1) && (url.indexOf("data:") === -1) ) {
              symbol.url = baseUrl + url;
            }

            // Append token if any
            if (token && symbol.url.search(/https?\:/) !== -1 && symbol.url.indexOf("?token=") === -1) {
              symbol.url += ("?token=" + token);
            }
          }
        });
      }
    },
  
    _getAllRenderers: function(renderer) {
      // Returns individual renderer instances used by this layer - including
      // the given top-level renderer.
      var renderers = [];
    
      if (renderer) {
        var topLevel = [
          renderer,
          renderer.trackRenderer,
          renderer.observationRenderer,
          renderer.latestObservationRenderer
        ];
      
        // If top-level renderers are composite renderers, then read
        // their child renderers from rendererInfos if available.
        topLevel.forEach(function(rnd) {
          if (rnd) {
            renderers.push(rnd);
          
            if (rnd.rendererInfos) {
              rnd.rendererInfos.forEach(function(info) {
                if (info.renderer) {
                  renderers.push(info.renderer);
                }
              });
            }
          }
        });
      }
    
      return renderers;
    },
  
    _fixRendererFields: function(renderers) {
      // Fixes casing of field names used by the given renderers to match
      // layer.fields schema.
      var fields = this.fields;
    
      if (!(renderers && fields)) {
        return;
      }
    
      renderers.forEach(function(rnd) {
      
        this._fixFieldName(this._rndProps, rnd);
      
        array.forEach(rnd.visualVariables, function(variable) {
          this._fixFieldName(this._visVariableProps, variable);
        }, this);
      
      }, this);
    },

    _fixFieldName: function(properties, object) {
      // Fixes casing of field names specified in "properties" of the "object" -
      // to match layer.fields.
      array.forEach(properties, function(prop) {

        var fieldName = lang.getObject(prop, false, object),
            info = fieldName
              && typeof fieldName !== "function"
              && this.getField(fieldName);

        if (info) {
          lang.setObject(prop, info.name, object);
        }

      }, this);
    },

    _verifyFields: function() {
      var url = (this.parsedUrl && this.parsedUrl.path) || "undefined";

      if (!this.objectIdField) {
        console.log(
          "FeatureLayer: 'objectIdField' property is not defined (url: " + url + ")"
        );
      }

      if (
        !this.isTable && !this.hasMemorySource && url.search(/\/FeatureServer\//i) === -1 &&

        !array.some(this.fields, function(field) {
          return field.type === "esriFieldTypeGeometry";
        })
      ) {
        console.log(
          "FeatureLayer: unable to find field of type 'esriFieldTypeGeometry' in the layer 'fields' list. "
            + "If you are using a map service layer, features will not have geometry (url: "
            + url
            + ")"
        );
      }

      /*var requiredFields = inFields || this._getOutFields();

      array.forEach(requiredFields, function(field) {
        if (field !== "*" && !this.getField(field)) {
          console.log("FeatureLayer: unable to find '${field}' field in the layer 'fields' list (url: ${url})");
        }
      }, this);*/
    },

    // Fix 10.1 server bug where prototypes contain null values for
    // creator and editor fields. null values have special meaning as
    // userIds and hence should not be returned with prototypes
    // Server CR 222052 (Prototype feature should not return the read-only fields)
    // for this issue is scheduled to be fixed in 10.1 SP1
    _fixTemplates: function(templates, fieldName) {
      array.forEach(templates, function(template) {
        var attr = template.prototype && template.prototype.attributes;

        if (attr && fieldName) {
          delete attr[fieldName];
        }
      });
    }

  });

  /*****************
   * Static Members
   *****************/

  lang.mixin(FeatureLayer, {
    MODE_SNAPSHOT:  0,
    MODE_ONDEMAND:  1,
    MODE_SELECTION: 2,

    SELECTION_NEW:      3,
    SELECTION_ADD:      4,
    SELECTION_SUBTRACT: 5,

    // In auto mode, layer is initialized with on-demand mode. But it may
    // switch to a different mode before load event is fired - depending on
    // various factors.
    MODE_AUTO: 6,

    POPUP_URL:       "esriServerHTMLPopupTypeAsURL",
    POPUP_NONE:      "esriServerHTMLPopupTypeNone",
    POPUP_HTML_TEXT: "esriServerHTMLPopupTypeAsHTMLText"
  });

  

  return FeatureLayer;
});
