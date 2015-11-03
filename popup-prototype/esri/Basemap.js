/**
 * Basemap is used for creating custom basemaps. These basemaps may be created from tiled
 * services you publish to your own server or from tiled services published by
 * third parties.
 *
 * @module esri/Basemap
 * @since 4.0
 * @see module:esri/widgets/BasemapToggle
 * @see module:esri/Map
 */
define(["require", "exports", "./core/tsSupport/extendsHelper", "./core/tsSupport/decorateHelper", "./core/accessorSupport/typescript", "./core/Evented", "./core/Loadable", "./core/JSONSupport", "./core/errors", "./core/Collection", "./core/promiseUtils", "./portal/PortalItem", "./layers/ArcGISElevationLayer", "./core/requireUtils"], function (require, exports, __extends, __decorate, typescript_1, Evented, Loadable, JSONSupport, errors, Collection, promiseUtils, PortalItem, ArcGISElevationLayer, requireUtils) {
    var idCounter = 0;
    function getBasemapBase() {
        return JSONSupport;
    }
    var Basemap = (function (_super) {
        __extends(Basemap, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        /**
         * @extends module:esri/core/Accessor
         * @mixes module:esri/core/Loadable
         * @mixes module:esri/core/Promise
         * @mixes module:esri/core/Evented
         * @constructor
         * @alias module:esri/Basemap
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                              that may be passed into the constructor.
         */
        function Basemap(_a) {
            _super.call(this);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  baseLayers
            //----------------------------------
            /**
             * A collection of tiled layers that make up the basemap's features.
             *
             * @type {module:esri/core/Collection}
             */
            this.baseLayers = null;
            //----------------------------------
            //  elevationLayers
            //----------------------------------
            /**
             * A collection of {@link module:esri/layers/ArcGISElevationLayer elevation layers}
             * that are used to render terrain and topography in {@link module:esri/views/SceneView SceneViews}.
             *
             * @type {module:esri/core/Collection}
             */
            this.elevationLayers = null;
            //----------------------------------
            //  id
            //----------------------------------
            /**
             * The identifier used to refer to the basemap when referencing it elsewhere, such as
             * inside the {@link module:esri/widgets/BasemapToggle#basemaps basemaps} property of the
             * {@link module:esri/widgets/BasemapToggle BasemapToggle} widget.
             *
             * @type {string}
             *
             * @example
             * var customBasemap = new Basemap({
             *   baseLayers: [layers],
             *   title: "Custom Basemap",
             *   id: "myBasemap"
             * });
             *
             * var bt = new BasemapToggle({
             *   map: map,
             *   basemap: customBasemap,
             *   basemaps: {
             *     "myBasemap": {
             *       "title": "Custom Basemap",
             *       "thumbnailUrl": "http://.../customImg.jpg"
             *     }
             *   }
             * });
             */
            this.id = null;
            //----------------------------------
            //  initialExtent
            //----------------------------------
            /**
             * The initial extent of the basemap.
             *
             * @type {module:esri/geometry/Extent}
             */
            this.initialExtent = null;
            //----------------------------------
            //  loaded
            //----------------------------------
            /**
             * Indicates whether the basemap instance has loaded. When `true`,
             * all the properties of the object can be accessed.
             *
             * @name loaded
             * @instance
             * @type {boolean}
             * @default false
             * @readonly
             */
            //----------------------------------
            //  portalItem
            //----------------------------------
            /**
             * The portal item.
             *
             * @type {module:esri/portal/PortalItem}
             */
            this.portalItem = null;
            //----------------------------------
            //  referenceLayers
            //----------------------------------
            /**
             * A collection of tiled reference layers for displaying labels.
             *
             * @type {module:esri/core/Collection}
             */
            this.referenceLayers = null;
            //----------------------------------
            //  resourceInfo
            //----------------------------------
            /**
             * @ignore
             * @type {Object}
             */
            this.resourceInfo = null;
            //----------------------------------
            //  spatialReference
            //----------------------------------
            /**
             * The spatial reference of the basemap.
             *
             * @type {module:esri/geometry/SpatialReference}
             */
            this.spatialReference = null;
            //----------------------------------
            //  tileInfo
            //----------------------------------
            this.tileInfo = null;
            //----------------------------------
            //  title
            //----------------------------------
            /**
             * The title of the basemap.
             *
             * @type {string}
             */
            this.title = null;
            //----------------------------------
            //  visible
            //----------------------------------
            /**
             * Indicates if the basemap is visible.
             *
             * @type {boolean}
             * @default true
             */
            this.visible = null;
        }
        Basemap.prototype.getDefaults = function () {
            return {
                id: Date.now().toString(16) + "-basemap-" + (idCounter++),
                baseLayers: new Collection(),
                referenceLayers: new Collection(),
                elevationLayers: new Collection()
            };
        };
        Basemap.prototype.initialize = function () {
            if (this.resourceInfo) {
                this.read(this.resourceInfo);
            }
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        Basemap.prototype.load = function () {
            var _this = this;
            this.addResolvingPromise(this._loadFromSource()
                .then(function () { return _this._loadFirstLayer(); })
                .then(function (layer) { return _this._loadFinished(layer); }));
            return this;
        };
        /**
         * Clone this object.
         *
         * @return {module:esri/webscene/Basemap} a new {@link module:esri/webscene/Basemap} instance.
         */
        Basemap.prototype.clone = function () {
            var nb = new Basemap({
                id: this.id,
                title: this.title,
                visible: this.visible,
                resourceInfo: this.resourceInfo,
                portalItem: this.portalItem,
                initialExtent: this.initialExtent ? this.initialExtent.clone() : null,
                spatialReference: this.spatialReference ? this.spatialReference.clone() : null,
                tileInfo: this.tileInfo ? this.tileInfo.clone() : null,
                baseLayers: this.baseLayers.clone(),
                referenceLayers: this.referenceLayers.clone(),
                elevationLayers: this.elevationLayers.clone()
            });
            return nb;
        };
        Basemap.prototype.toJSON = function () {
            throw errors.Internal.notYetImplemented();
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Basemap.prototype._loadFromSource = function () {
            var resourceInfo = this.resourceInfo;
            var portalItem = this.portalItem;
            if (resourceInfo) {
                return this._loadFromJSON(resourceInfo);
            }
            else if (portalItem) {
                return this._loadFromItem(portalItem);
            }
            return promiseUtils.resolve(null);
        };
        Basemap.prototype._loadFromJSON = function (json) {
            var _this = this;
            var portal = this.portalItem && this.portalItem.portal;
            var ret = requireUtils.whenOne(require, "./portal/creators/layersCreator").then(function (layersCreator) {
                var allLayers = [];
                if (json.baseMapLayers && Array.isArray(json.baseMapLayers)) {
                    var params = {
                        defaultLayerType: "DefaultTiledLayer",
                        portal: portal
                    };
                    var baseLayersCreated = layersCreator.populateBasemapLayers(_this.baseLayers, json.baseMapLayers.filter(function (layer) { return !layer.isReference; }), params);
                    allLayers.push.apply(allLayers, baseLayersCreated);
                    var referenceLayersCreated = layersCreator.populateBasemapLayers(_this.referenceLayers, json.baseMapLayers.filter(function (layer) { return layer.isReference; }), params);
                    allLayers.push.apply(allLayers, referenceLayersCreated);
                }
                if (json.elevationLayers && Array.isArray(json.elevationLayers)) {
                    var params = {
                        defaultLayerType: "ArcGISTiledElevationServiceLayer",
                        portal: portal
                    };
                    var elevationLayersCreated = layersCreator.populateBasemapLayers(_this.elevationLayers, json.elevationLayers, params);
                    allLayers.push.apply(allLayers, elevationLayersCreated);
                }
                return promiseUtils.eachAlways(allLayers);
            });
            return ret;
        };
        Basemap.prototype._loadFromItem = function (portalItem) {
            var _this = this;
            return portalItem.load()
                .then(function (item) { return item.fetchData(); })
                .then(function (json) {
                _this.resourceInfo = json.baseMap;
                _this.read(_this.resourceInfo);
                return _this._loadFromJSON(_this.resourceInfo);
            });
        };
        Basemap.prototype._loadFirstLayer = function () {
            var baseLayers = this.baseLayers;
            var elevationLayers = this.elevationLayers;
            if (baseLayers.length > 0) {
                return baseLayers.getItemAt(0).load();
            }
            else if (elevationLayers.length > 0) {
                return elevationLayers.getItemAt(0).load();
            }
            throw errors.Load.nothingToLoad();
        };
        Basemap.prototype._loadFinished = function (layer) {
            this.initialExtent = layer.initialExtent.clone();
            this.spatialReference = layer.initialExtent.spatialReference.clone();
            var tiledLayer = layer;
            this.tileInfo = tiledLayer.tileInfo && tiledLayer.tileInfo.clone();
        };
        //--------------------------------------------------------------------------
        //
        //  Static Public Methods
        //
        //--------------------------------------------------------------------------
        Basemap.fromJSON = function (json) {
            if (!json) {
                return null;
            }
            return new Basemap({
                resourceInfo: json
            });
        };
        Basemap.defaultElevationLayer = new ArcGISElevationLayer({
            id: "globalElevation",
            url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
        });
        __decorate([
            typescript_1.shared("esri.Basemap")
        ], Basemap.prototype, "declaredClass");
        __decorate([
            typescript_1.shared({
                reader: {
                    exclude: [
                        "baseMapLayers",
                        "elevationLayers"
                    ]
                }
            })
        ], Basemap.prototype, "classMetadata");
        __decorate([
            typescript_1.property({ setter: Collection.referenceSetter })
        ], Basemap.prototype, "baseLayers");
        __decorate([
            typescript_1.property({ setter: Collection.referenceSetter })
        ], Basemap.prototype, "elevationLayers");
        __decorate([
            typescript_1.property()
        ], Basemap.prototype, "id");
        __decorate([
            typescript_1.property({ value: null })
        ], Basemap.prototype, "initialExtent");
        __decorate([
            typescript_1.property({
                type: PortalItem
            })
        ], Basemap.prototype, "portalItem");
        __decorate([
            typescript_1.property({ setter: Collection.referenceSetter })
        ], Basemap.prototype, "referenceLayers");
        __decorate([
            typescript_1.property()
        ], Basemap.prototype, "resourceInfo");
        __decorate([
            typescript_1.property()
        ], Basemap.prototype, "spatialReference");
        __decorate([
            typescript_1.property()
        ], Basemap.prototype, "tileInfo");
        __decorate([
            typescript_1.property({ value: "" })
        ], Basemap.prototype, "title");
        __decorate([
            typescript_1.property({ value: true })
        ], Basemap.prototype, "visible");
        Basemap = __decorate([
            typescript_1.subclass([Evented, Loadable])
        ], Basemap);
        return Basemap;
    })(getBasemapBase());
    return Basemap;
});
