/**
 * The SceneLayer displays [multipatch](http://support.esri.com/en/knowledgebase/GISDictionary/term/multipatch) 
 * geometries published to a [Scene Service](http://server.arcgis.com/en/server/latest/publish-services/windows/scene-services.htm) and may
 * only be viewed in a {@link module:esri/views/SceneView SceneView}. Scene Services can hold large volumes of
 * 3D multipatch features in a format that is suitable for web streaming. SceneLayer loads these features progressively,
 * starting from coarse representations and refining to higher detail as necessary for close-up views.
 *
 * Scene Services can be published from ArcGIS Pro to an on-premise ArcGIS Portal. 
 * See [ArcGIS Pro](http://pro.arcgis.com/en/pro-app/help/sharing/overview/share-a-web-scene.htm) and 
 * [Portal documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Scene_Service/02r3000002n1000000/)
 * for more details.
 *
 * The Scene Service is identified by the URL of the ArcGIS Server REST resource:
 *
 * ```js
 * sceneLayer = new SceneLayer({
 *   url: "http://scene.arcgis.com/arcgis/rest/services/Hosted/Building_Hamburg/SceneServer/layers/0";
 * });
 * ```
 *
 * A {@link module:esri/symbols/MeshSymbol3D MeshSymbol3D} together with a
 * {@link module:esri/symbols/FillSymbol3DLayer FillSymbol3DLayer} can be used to symbolize features in the scene
 * layer:
 * ```js
 * var symbol = new MeshSymbol3D(
 *   new FillSymbol3DLayer({
 *     material: { color: "red" }
 *   })
 * );
 * sceneLayer.renderer = new SimpleRenderer(symbol);
 * ```
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 *
 * @module esri/layers/SceneLayer
 * @since 4.0
 * @see [Sample - SceneLayer](../sample-code/3d/scene-layer/)
 * @see [Sample - Environment](../sample-code/3d/environment-3d/)
 * @see module:esri/layers/FeatureLayer
 * @see module:esri/views/SceneView
 * @see module:esri/renderers/SimpleRenderer
 * @see module:esri/Map
 */
define([
  "require",

  "../core/declare",
  "dojo/_base/lang",

  "dojo/Deferred",

  "dojo/io-query",

  "../core/JSONSupport",
  "../core/urlUtils",

  "../request",

  "../geometry/Extent",
  "../geometry/SpatialReference",

  "./GraphicsLayer",

  "./support/LabelClass",
  "./support/Field",

  "../renderers/support/jsonUtils",
  "../widgets/PopupLegacy/PopupTemplate"
],
function(
  require,
  declare, lang,
  Deferred,
  ioq,
  JSONSupport, urlUtils,
  esriRequest,
  Extent, SpatialReference,
  GraphicsLayer,
  LabelClass,
  Field,
  rndJsonUtils,
  PopupTemplate
) {

  /**
   * @extends module:esri/layers/GraphicsLayer
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/layers/SceneLayer
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */    
  var SceneLayer = declare([GraphicsLayer, JSONSupport], 
  /** @lends module:esri/layers/SceneLayer.prototype */                         
  {
    declaredClass: "esri.layers.SceneLayer",

    classMetadata: {
      reader: {
        add: [
          "copyright",
          "initialExtent",
          "fullExtent",

          "geometryType",

          // drawingInfo.* is separated into these properties
          "renderer",
          "labelingInfo",

          "cachedDrawingInfo",

          "spatialReference",
          "objectIdField",
          "popupTemplate"
        ],
        exclude: [
          "id",
          "version",
          "name",
          "href",
          "ZFactor",
          "alias",
          "description",
          "copyrightText",
          "popupInfo"
        ]
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(url, options) {
      var args = url;
      if (typeof url === "string") {
        args = lang.mixin({}, {
          url: url
        }, options);
      }

      // note from Yann: what is the purpose of _addTrailingSlash?
      //                 how is it changed? in which case?
      if (this._addTrailingSlash) {
        if (args.url.charAt(args.url.length - 1) !== "/") {
          args.url += "/";
        }
      }
      
      return args;
    },
    
    load: function() {
      this.addResolvingPromise(this._fetchService());
    },


    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------
    
    // yann6817: remove
    _canUseXhr: null,

    // yann6817: remove
    _addTrailingSlash: false,

    // yann6817: remove
    _alreadyIssuedWarnings: {},

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  copyright
    //----------------------------------
      
    /**
     * The copyright text as defined by the scene service.
     *
     * @type {string}
     */
    copyright: null,  
    
    _copyrightReader: function(value, source) {
      return source.copyrightText;
    },

    //----------------------------------
    //  fields
    //----------------------------------

    /**
     * An array of fields accessible in the layer.
     * 
     * @type {module:esri/layers/support/Field[]}
     */
    fields: null,

    _fieldsReader: function(value) {
      return value.map(function(field) {
        return new Field(field);
      });
    },

    //----------------------------------
    //  fullExtent
    //----------------------------------

    /**
     * @inheritdoc
     */  
    fullExtent: null,

    _fullExtentReader: function(value, source) {
      var store = source.store;
      var crs = store.indexCRS || store.geographicCRS;
      var wkid = crs && parseInt(crs.substring(crs.lastIndexOf("/") + 1, crs.length), 10);

      return new Extent(
        store.extent[0],
        store.extent[1],
        store.extent[2],
        store.extent[3],
        new SpatialReference(wkid)
      );
    },

    //----------------------------------
    //  elevationInfo
    //----------------------------------

    /**
     * Specifies how features are placed on the vertical axis (z). This property only has an effect 
     * in a {@link module:esri/views/SceneView SceneView}.
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
     * @private
     */
    elevationInfo: null,

    //----------------------------------
    //  geometryType
    //----------------------------------

    /**
     * https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/1912
     * @private
     */
    geometryType: null,

    _geometryTypeReader: function(value, source) {
      var store = source.store;
      var profile = store && store.profile;
      var geometryType;

      // TODO:
      // could be simplified: this.geometryType = profileToRest[profile] || "esriGeometryMesh"
      switch (profile) {
        case "features-points":
          geometryType = "esriGeometryPoint";
          break;
        case "features-lines":
          geometryType = "esriGeometryPolyline";
          break;
        case "features-polygons":
          geometryType = "esriGeometryPolygon";
          break;
        default:
          geometryType = "esriGeometryMesh";
          break;
      }

      return geometryType;
    },

    //----------------------------------
    //  initialExtent
    //----------------------------------

    /**
     * @inheritdoc
     */
    initialExtent: null,

    _initialExtentReader: function(value, source) {
      return this._fullExtentReader(value, source);
    },

    //----------------------------------
    //  labelingInfo
    //----------------------------------

    /**
     * @private
     */
    _labelingInfoReader: function(value, source) {
      value = source.drawingInfo && source.drawingInfo.labelingInfo;

      if (value) {
        var reFieldName = /\[([^\[\]]+)\]/ig, // field in label expression
            expr, self = this,
            replacer = function(match, fieldName) {
              // Return the field name as defined in layer.fields
              var field = self.getField(fieldName, source.fields);
              return "[" + ((field && field.name) || fieldName) + "]";
            };

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
    //  renderer
    //----------------------------------

    _rendererReader: function(value, source) {
      value = source.drawingInfo && source.drawingInfo.renderer;
      if (value) {
        value = rndJsonUtils.fromJSON(value);
      }
      return value;
    },

    //----------------------------------
    //  cachedDrawingInfo
    //----------------------------------

    _cachedDrawingInfoReader: function(value, source) {
      value = source.cachedDrawingInfo;
      if (value == null || typeof value !== "object") {
        value = {};
      }
      if (value.color == null) {
        value.color = false;
      }
      return value;
    },

    //----------------------------------
    //  spatialReference
    //----------------------------------

    _spatialReferenceReader: function(value, source) {
      if (source.spatialReference != null) {
        return new SpatialReference(source.spatialReference)
      } else {
        return this._fullExtentReader(undefined, source).spatialReference;
      }
    },
      
    /**
    * The URL of the REST endpoint of the layer. The URL may either point to a
    * resource on ArcGIS for Server, Portal for ArcGIS, or ArcGIS Online.
    * 
    * @name url
    * @instance
    * @type {string}
    * @example
    * //Layer from Scene Service on ArcGIS Server
    * var sceneLayer = new SceneLayer({
    *   url: "http://scene.arcgis.com/arcgis/rest/services/Hosted/Building_Hamburg/SceneServer/layers/0";
    * });
    */

    //----------------------------------
    //  popupTemplate
    //----------------------------------
    // TODO: this is temporary only until we figure out how to read popup info from scene server in the new style

    _popupTemplateReader: function(dummy, serviceInfo) {
      return serviceInfo.popupInfo ? new PopupTemplate(serviceInfo.popupInfo) : undefined;
    },

    //----------------------------------
    //  objectIdField
    //----------------------------------
    // TODO: copied from FeatureLayer, need to remove code duplication

    _objectIdFieldReader: function(value, source) {
      // Find OID field from "fields" if it is not explicitly defined.
      if (!value && source.fields) {
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
    //  viewModulePaths
    //----------------------------------
    
    /**
     * @private
     */
    viewModulePaths: {
      "3d": "../views/3d/layers/SceneLayerView3DFactory"
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------
    
    createGraphicsController: function(parameters) {
      var dfd = new Deferred(), 
      modulePath = "./graphics/controllers/I3SOnDemandController";
      
      parameters.layer = this;
      parameters.addUrlTokenFunction = this._addUrlToken.bind(this);
      parameters.warningEvent = this.warningEvent.bind(this);
      
      require(
        [modulePath], 
        function(ControllerClass) {
          var controller = new ControllerClass(parameters);

          controller.then(
            function() {
              this.emit("graphics-controller-create", {
                graphicsController: controller
              });
              dfd.resolve(controller);
            }.bind(this), 
            function(err) {
              dfd.reject(err);
            }
          );
        }.bind(this)
      );
      
      return dfd.promise;
    },
    
    getField: function(fieldname) {
      if (!this._companionFeatureLayer) {
        return undefined;
      }
      return this._companionFeatureLayer.getField(fieldname);
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------
    
    
    warningEvent: function(msg, severity) {
      // yann6817: _alreadyIssuedWarnings is global.
      // a message can't be issued multiple times
      // why?
      if (this._alreadyIssuedWarnings[msg] != null) {
        return;
      }
      this._alreadyIssuedWarnings[msg] = true;
      this.emit("i3s-load-log", {type: severity === 1 ? "fatal" : "warning",msg: msg});

      // yann6817: check if has("dojo-debug-messages"). we don't want to show this.
      console.warn("i3s-load-log warningEvent severity " + severity, " message " + msg);
    },
    
    // 
    _addUrlToken: function(url) {
      var query = lang.mixin({}, this.parsedUrl.query, {
        token: this.token
      });
      query = ioq.objectToQuery(query);
      url += (query ? ("?" + query) : "");

      if (this._canUseXhr == null) {
        //cache this once
        this._canUseXhr = urlUtils.canUseXhr(url);
      }
      
      // yann6817: remove condition
      if (!this._canUseXhr) {
        return urlUtils.addProxy(url);
      }
      return url;
    },
    
    _fetchService: function() {
      return esriRequest({
        url: this._addUrlToken(this.parsedUrl.path),
        handleAs: "json"
      }).then(function(response) {
        // Update URL scheme if the response was obtained via HTTPS
        // See esri/request for context regarding "response._ssl"
        if (response._ssl) {
          delete response._ssl;
          this.url = this.url.replace(/^http:/i, "https:");
        }

        // yann6817: is then the layer rejected ?
        var store = response.store;
        if (store.indexCRS == null && store.geographicCRS == null) {
          this.warningEvent("Input data invalid: layer.layerInfo.indexCRS is undefined.", 1);
        }
        
        this.read(response);

        // create the companion FeatureLayer if needed. 
        var profile = lang.getObject("store.profile", false, response);
        if (["meshpyramids", "features-points"].indexOf(profile) > -1) {

          var companionLayerCouldNotBeLoaded =  function(e){
            console.warn("Companion FeatureLayer could not be loaded. Popups will not work for this SceneLayer: " + this.title);
            flDfd.resolve(this);
          }.bind(this);

          var createCompanionFeatureLayer = function(url, dfd){
            require(["./FeatureLayer"], function(FeatureLayer) {

              this._companionFeatureLayer = new FeatureLayer(url);
              this._companionFeatureLayer.load().then(function(r) {
                if (!this.fields || this.fields.length === 0) {
                  this.fields = r.fields;
                }
                flDfd.resolve(this);
              }.bind(this),companionLayerCouldNotBeLoaded);
            }.bind(this));
          }.bind(this);

           // Load the FL
          var flDfd = new Deferred();

          // Format the FeatureLayer URL
          var flUrl = this.url.replace("/SceneServer/", "/FeatureServer/");
          var lIdx = flUrl.indexOf("/layers/");
          var sceneLayerId;
          if (lIdx >= 0) {
            sceneLayerId = parseInt(flUrl.substr(lIdx + 8));
            flUrl = flUrl.substr(0, lIdx) + "/" +sceneLayerId;
          }

          var featureServerRootUrl = flUrl.replace(/\/[\d]*\/?$/, "");
          
          // @javi5947
          // Added this to support Pro-published group FeatureServers - in this case the 
          // layer ids are not 0,1,2.. but instead 1,2,3... -> we need to query the Feature 
          // Server for the right layer id before we use it as a companion feature layer
          // See https://devtopia.esri.com/Zurich-R-D-Center/arcgis-js-api-canvas3d-issues/issues/382

          esriRequest({
              url: this._addUrlToken(featureServerRootUrl),
              "content": {
                "f": "json"
              },
              handleAs: "json"
            }).then(
              function(response) {
                // user order instead of assuming same indices 
                var newFlUrl = featureServerRootUrl + "/" + response.layers[sceneLayerId].id;
                createCompanionFeatureLayer(newFlUrl, flDfd);
              }, 
              companionLayerCouldNotBeLoaded);

          // SceneLayer will resolve after the FeatureLayer is loaded
          return flDfd.promise;
        }else{
          // this is ok -- we don't need a companion feature layer for the other profiles
        }
      }.bind(this));
    }

  });
  
  return SceneLayer;

});
