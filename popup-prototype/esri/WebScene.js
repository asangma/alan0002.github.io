/**
 * Loads a [WebScene](http://server.arcgis.com/en/portal/latest/use/make-your-first-scene.htm)
 * from [ArcGIS Online](https://www.arcgis.com/home/) or
 * [Portal for ArcGIS](http://server.arcgis.com/en/portal/) into a {@link module:esri/views/SceneView}.
 *
 * To load a WebScene into a SceneView, you must reference the ID of the scene in
 * the [portalItem](#portalItem) property of this class.
 *
 * ```js
 * var scene = new WebScene({
 *   portalItem: new PortalItem({
 *     id: "affa021c51944b5694132b2d61fe1057"  //ID of the WebScene on arcgis.com
 *   })
 * });
 * ```
 *
 * Then you must reference the WebScene instance in the `map` property of a {@link module:esri/views/SceneView}.
 *
 * ```js
 * var view = new SceneView({
 *   map: scene,  //the WebScene instance created above
 *   container: "viewDiv"
 * });
 * ```
 *
 * @module esri/WebScene
 * @since 4.0
 * @see [Sample - Load a basic WebScene](../sample-code/webscene-basic/index.html)
 * @see {@link module:esri/portal/PortalItem}
 */
define(["require", "exports", "./core/tsSupport/extendsHelper", "./core/tsSupport/decorateHelper", "./Map", "./core/errors", "./core/requireUtils", "./core/promiseUtils", "./core/JSONSupport", "./Basemap", "./geometry/support/jsonUtils", "./geometry/support/castUtils", "./geometry/SpatialReference", "./core/accessorSupport/typescript", "./webscene/Presentation", "./webscene/InitialState", "./portal/PortalItem", "dojo/_base/lang", "./request"], function (require, exports, __extends, __decorate, Map, errors, requireUtils, promiseUtils, JSONSupport, Basemap, geomJsonUtils, geomCastUtils, SpatialReference, typescript_1, Presentation, InitialState, PortalItem, lang, request) {
    function getWebSceneBase() {
        return Map;
    }
    var WEBSCENE_VERSION = {
        major: 1,
        minor: 2
    };
    var WEBSCENE_VERSION_STRING = WEBSCENE_VERSION.major + "." + WEBSCENE_VERSION.minor;
    var WebScene = (function (_super) {
        __extends(WebScene, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        /**
         * @extends module:esri/Map
         * @constructor
         * @alias module:esri/WebScene
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                              that may be passed into the constructor.
         */
        function WebScene(obj) {
            _super.call(this);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  basemap
            //----------------------------------
            this.basemap = null;
            //----------------------------------
            //  clippingArea
            //----------------------------------
            /**
             * *This property only applies to local scenes.*
             * Represents an optional clipping area used to define an area outside of
             * which content is clipped and will not be displayed. Set the
             * [clippingEnabled](#clippingEnabled) property to enable clipping by the specified
             * [clippingArea](#clippingArea).
             *
             * @type {module:esri/geometry/Extent}
             * @see [clippingEnabled](#clippingEnabled)
             */
            this.clippingArea = null;
            //----------------------------------
            //  clippingEnabled
            //----------------------------------
            /**
             * *This property only applies to local scenes.*
             * Determines whether clipping using the [clippingArea](#clippingArea) is
             * enabled.
             *
             * @type {boolean}
             * @see [clippingArea](#clippingArea)
             * @default false
             */
            this.clippingEnabled = null;
            //----------------------------------
            //  version
            //----------------------------------
            /**
             * The WebScene version.
             *
             * @readOnly
             * @type {string}
             */
            this.version = null;
            //----------------------------------
            //  authoringApp
            //----------------------------------
            /**
             * The name of the application that authored the WebScene.
             *
             * @type {string}
             */
            this.authoringApp = null;
            //----------------------------------
            //  authoringAppVersion
            //----------------------------------
            /**
             * The version of the application that authored the WebScene.
             *
             * @type {string}
             */
            this.authoringAppVersion = null;
            //----------------------------------
            //  presentation
            //----------------------------------
            /**
             * Provides a {@link module:esri/core/Collection} of slides
             * that act as bookmarks for saving predefined {@link module:esri/Viewpoint viewpoints}
             * and visible layers.
             *
             * @type {module:esri/webscene/Presentation}
             * @see {module:esri/webscene/Slide}
             */
            this.presentation = null;
            //----------------------------------
            //  initialState
            //----------------------------------
            /**
             * The initial state of the WebScene.
             *
             * @type {module:esri/webscene/InitialState}
             */
            this.initialState = null;
            //----------------------------------
            //  viewingMode
            //----------------------------------
            /**
             * The viewing mode of the scene. Global scenes allow the user to
             * navigate the globe. Local scenes allow for navigation and feature
             * display in a particular "localized" area.
             *
             * **Known Values:** global | local
             *
             * @type {string}
             * @default global
             * @see [clippingArea](#clippingArea)
             */
            this.viewingMode = null;
            //----------------------------------
            //  portalItem
            //----------------------------------
            /**
             * The portal item from which the WebScene is loaded.
             *
             * @type {module:esri/portal/PortalItem}
             */
            this.portalItem = null;
            //----------------------------------
            //  resourceInfo
            //----------------------------------
            /**
             * @ignore
             * @type {string | Object}
             */
            this.resourceInfo = null;
            //----------------------------------
            //  url
            //----------------------------------
            /**
             * @ignore
             * @type {string}
             */
            this.url = null;
        }
        WebScene.prototype.initialize = function () {
            if (this.resourceInfo) {
                this.read(this._validateJSON(this.resourceInfo));
            }
        };
        WebScene.prototype.getDefaults = function () {
            return lang.mixin(this.inherited(arguments), {
                presentation: new Presentation(),
                initialState: new InitialState()
            });
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        WebScene.prototype.load = function () {
            this.addResolvingPromise(this._loadFromSource());
            return this;
        };
        WebScene.prototype.toJSON = function () {
            var ret = {
                version: this.version,
                baseMap: this.basemap.toJSON(),
                operationalLayers: this.layers.map(function (layer) { return layer.toJSON(); }).getAll(),
                presentation: this.presentation.toJSON(),
                initialState: this.initialState.toJSON()
            };
            if (this.authoringApp != null) {
                ret.authoringApp = this.authoringApp;
            }
            if (this.authoringAppVersion != null) {
                ret.authoringAppVersion = this.authoringAppVersion;
            }
            if (this.clippingArea != null) {
                ret.clippingArea = {
                    geometry: this.clippingArea.toJSON(),
                    clip: !!this.clippingEnabled
                };
            }
            return ret;
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        WebScene.prototype._loadFromSource = function () {
            if (this.resourceInfo) {
                return this._loadFromJSON(this.resourceInfo);
            }
            else if (this.portalItem && this.portalItem.id) {
                return this._loadFromItem(this.portalItem);
            }
            else if (this.url) {
                return this._loadFromURL(this.url);
            }
            else {
                return promiseUtils.resolve(null);
            }
        };
        WebScene.prototype._readAndLoadFromJSON = function (json) {
            var validated = this._validateJSON(json);
            this.read(validated);
            return this._loadFromJSON(validated);
        };
        WebScene.prototype._loadFromJSON = function (json) {
            var _this = this;
            var layerParams = LayerLoader.layerCreatorParams();
            if (this.portalItem) {
                layerParams.portal = this.portalItem.portal;
            }
            return requireUtils.whenOne(require, "./portal/creators/layersCreator").then(function (layersCreator) {
                var ret = promiseUtils.eachAlways(layersCreator.populateOperationalLayers(_this.layers, json.operationalLayers, layerParams));
                return ret;
            });
        };
        WebScene.prototype._loadFromItem = function (portalItem) {
            var _this = this;
            return portalItem.load()
                .then(function (item) { return item.fetchData(); })
                .then(function (json) { return _this._readAndLoadFromJSON(json); });
        };
        WebScene.prototype._loadFromURL = function (url) {
            var _this = this;
            return fetchWebSceneData(url).then(function (json) { return _this._readAndLoadFromJSON(json); });
        };
        WebScene.prototype._validateVersion = function (version) {
            var _a = version.split("."), major = _a[0], minor = _a[1];
            var nre = /^\s*\d+\s*$/;
            if (!major || !major.match || !major.match(nre)) {
                throw errors.JSON.invalidFormat("version", version, "Expected major version to be a number");
            }
            if (!minor || !minor.match || !minor.match(nre)) {
                throw errors.JSON.invalidFormat("version", version, "Expected minor version to be a number");
            }
            var majorNum = parseInt(major, 10), minorNum = parseInt(minor, 10);
            if (majorNum !== WebScene.Version.major) {
                throw errors.WebScene.unsupportedVersion(version, "required major webscene version is '" + WebScene.Version.major + "'");
            }
            // Sanitized version
            return majorNum + "." + minorNum;
        };
        WebScene.prototype._validateJSON = function (json) {
            var spec = this._sanitizeJSON(json);
            spec.version = this._validateVersion(spec.version);
            return spec;
        };
        WebScene.prototype._sanitizeJSON = function (json) {
            return {
                version: json.version || "0.0",
                baseMap: json.baseMap,
                operationalLayers: json.operationalLayers,
                authoringApp: json.authoringApp || "",
                authoringAppVersion: json.authoringAppVersion || "",
                viewingMode: json.viewingMode || "",
                presentation: (json.presentation && Presentation.sanitizeJSON(json.presentation)) || {},
                initialState: json.initialState && InitialState.sanitizeJSON(json.initialState),
                spatialReference: json.spatialReference,
                clippingArea: json.clippingArea
            };
        };
        //--------------------------------------------------------------------------
        //
        //  Static Methods
        //
        //--------------------------------------------------------------------------
        WebScene.fromJSON = function (json) {
            return new WebScene({
                resourceInfo: json
            });
        };
        WebScene.fromURL = function (url) {
            return fetchWebSceneData(url).then(function (resourceInfo) {
                return promiseUtils.resolve(new WebScene({
                    resourceInfo: resourceInfo,
                    url: url
                }));
            });
        };
        WebScene.Version = WEBSCENE_VERSION;
        __decorate([
            typescript_1.shared("esri.WebScene")
        ], WebScene.prototype, "declaredClass");
        __decorate([
            typescript_1.shared({
                reader: {
                    exclude: ["baseMap", "operationalLayers"],
                    add: ["basemap", "clippingEnabled"]
                }
            })
        ], WebScene.prototype, "classMetadata");
        __decorate([
            typescript_1.property({
                reader: function (value, source) {
                    if (!source.baseMap ||
                        (source.baseMap.baseMapLayers.length === 0 &&
                            source.baseMap.elevationLayers.length === 0)) {
                        return null;
                    }
                    return Basemap.fromJSON(source.baseMap);
                }
            })
        ], WebScene.prototype, "basemap");
        __decorate([
            typescript_1.property({
                reader: function (value) {
                    if (value && value.geometry) {
                        return geomJsonUtils.fromJSON(value.geometry);
                    }
                    return null;
                },
                setter: function (value) { return geomCastUtils.cast(value); }
            })
        ], WebScene.prototype, "clippingArea");
        __decorate([
            typescript_1.property({
                value: false,
                reader: function (value, source) {
                    if (source && source.clippingArea) {
                        return !!source.clippingArea.clip;
                    }
                }
            })
        ], WebScene.prototype, "clippingEnabled");
        __decorate([
            typescript_1.property({ value: WEBSCENE_VERSION_STRING })
        ], WebScene.prototype, "version");
        __decorate([
            typescript_1.property()
        ], WebScene.prototype, "authoringApp");
        __decorate([
            typescript_1.property()
        ], WebScene.prototype, "authoringAppVersion");
        __decorate([
            typescript_1.property({ type: Presentation })
        ], WebScene.prototype, "presentation");
        __decorate([
            typescript_1.property({ type: InitialState })
        ], WebScene.prototype, "initialState");
        __decorate([
            typescript_1.property({ type: SpatialReference })
        ], WebScene.prototype, "spatialReference");
        __decorate([
            typescript_1.property({
                value: "global",
                setter: function (value) {
                    if (value !== "local" && value !== "global") {
                        return;
                    }
                    return value;
                }
            })
        ], WebScene.prototype, "viewingMode");
        __decorate([
            typescript_1.property({ type: PortalItem })
        ], WebScene.prototype, "portalItem");
        __decorate([
            typescript_1.property()
        ], WebScene.prototype, "resourceInfo");
        __decorate([
            typescript_1.property()
        ], WebScene.prototype, "url");
        WebScene = __decorate([
            typescript_1.subclass([JSONSupport])
        ], WebScene);
        return WebScene;
    })(getWebSceneBase());
    function fetchWebSceneData(url) {
        return request({
            url: url,
            handleAs: "json",
            content: {
                f: "json"
            },
            callbackParamName: "callback"
        });
    }
    var LayerLoader = (function () {
        function LayerLoader() {
        }
        LayerLoader.propertyFilter = function (layer, properties) {
            var ret = properties;
            switch (layer.layerType) {
                case "ArcGISFeatureLayer":
                    ret = LayerLoader._featureLayerPropertyFilter(layer, properties);
                    break;
            }
            return ret;
        };
        LayerLoader.layerCreatorParams = function () {
            return {
                propertyFilter: LayerLoader.propertyFilter
            };
        };
        LayerLoader._featureLayerPropertyFilter = function (layer, properties) {
            var MODE_SNAPSHOT = 0;
            properties.mode = MODE_SNAPSHOT;
            properties.returnZ = true;
            properties.outFields = ["*"];
            return properties;
        };
        return LayerLoader;
    })();
    return WebScene;
});
