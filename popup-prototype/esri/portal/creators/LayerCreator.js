/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "dojo/_base/lang", "dojo/when", "dojo/has", "../../core/Accessor", "../../core/errors", "../../core/promiseUtils", "../../PopupTemplate", "../PortalItem", "../../layers/support/LabelClass", "../../renderers/support/jsonUtils", "../../core/urlUtils", "../../renderers/support/layerTemplates"], function (require, exports, __extends, __decorate, typescript_1, lang, when, has, Accessor, errors, promiseUtils, PopupTemplate, PortalItem, LabelClass, rendererJSONUtils, urlUtils, layerTemplates) {
    var isDebug = has("dojo-debug-messages");
    var LayerCreator = (function (_super) {
        __extends(LayerCreator, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        function LayerCreator(params) {
            _super.call(this);
        }
        LayerCreator.prototype.initialize = function () {
            var sublayerMatch = this.layer.url && this.layer.url.match(/\/(\d+)$/);
            if (sublayerMatch) {
                this.sublayerIndex = parseInt(sublayerMatch[1], 10);
            }
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        LayerCreator.prototype.create = function () {
            var _this = this;
            if (!this.layer.url && this.requiresUrl) {
                return promiseUtils.reject(errors.Layer.urlMissing());
            }
            // Creates the concrete layer instance from an operational layer definition
            var createLayer = function (layer) {
                var Ctor = _this.type;
                return _this.layerProperties(layer).then(function (properties) {
                    return promiseUtils.resolve(new Ctor(properties));
                });
            };
            // Obtain a layer definition including portal overrides, then create it
            return this._layerWithPortalOverrides()
                .then(createLayer);
        };
        //--------------------------------------------------------------------------
        //
        //  Protected Methods
        //
        //--------------------------------------------------------------------------
        LayerCreator.prototype.layerProperties = function (layer) {
            var _this = this;
            var ret = {
                title: layer.title || ""
            };
            if (layer.url !== undefined) {
                ret.url = urlUtils.normalize(layer.url);
            }
            var take = function (v) { return v; };
            var clone = lang.clone;
            var boolify = function (v) { return !!v; };
            var copyProperties = function (dest, source, fields) {
                for (var field in fields) {
                    var value = source[field];
                    if (value !== undefined) {
                        dest[field] = fields[field](value);
                    }
                }
                return dest;
            };
            copyProperties(ret, layer, {
                id: take,
                opacity: take,
                showLabels: boolify,
                disablePopup: boolify,
                showLegend: boolify,
                listMode: take
            });
            var layerDefinition = layer.layerDefinition;
            if (layerDefinition !== undefined) {
                copyProperties(ret, layerDefinition, {
                    minScale: take,
                    maxScale: take,
                    elevationInfo: clone,
                    definitionExpression: take
                });
                var drawingInfo = layer.layerDefinition.drawingInfo;
                if (drawingInfo !== undefined) {
                    var labelingInfo = drawingInfo.labelingInfo;
                    if (labelingInfo !== undefined && Array.isArray(labelingInfo) && labelingInfo.length > 0) {
                        ret.labelingInfo = labelingInfo.map(function (info) { return new LabelClass(clone(info)); });
                    }
                }
            }
            if (layer.visibility !== undefined) {
                ret.visible = !!layer.visibility;
            }
            if (layer.popupInfo !== undefined) {
                ret.popupTemplate = new PopupTemplate(lang.mixin({}, layer.popupInfo));
            }
            return this.createRenderer(layer, ret)
                .then(function (renderer) {
                if (renderer) {
                    ret.renderer = renderer;
                }
                if (_this.propertyFilter) {
                    var newprops = _this.propertyFilter(layer, ret);
                    if (newprops !== undefined) {
                        ret = newprops;
                    }
                }
                return ret;
            })
                .otherwise(function (err) {
                // Don't fail the whole layer if the renderer is invalid.
                // TODO:
                //   1. Try to fallback to a simple renderer with default symbology
                //   2. A way to propagate a "warning" in the API
                isDebug && console.warn("Failed to create renderer:", err.toString ? err.toString() : err);
                return ret;
            });
        };
        LayerCreator.prototype.createRenderer = function (layer, properties) {
            if (!layer.layerDefinition || !layer.layerDefinition.drawingInfo || !layer.layerDefinition.drawingInfo.renderer) {
                return promiseUtils.resolve(null);
            }
            var renderer = layer.layerDefinition.drawingInfo.renderer;
            if (layerTemplates.hasContentByReference(renderer)) {
                return layerTemplates.createRenderer(renderer, this.portal)
                    .then(function (renderer) {
                    properties.showLegend = false;
                    return renderer;
                }).otherwise(function (err) {
                    // TODO: propagate a "warning" in the API
                    isDebug && console.warn("Failed to create by reference renderer:", err.toString ? err.toString() : err);
                    return rendererJSONUtils.fromJSON(renderer);
                });
            }
            else {
                return promiseUtils.resolve(rendererJSONUtils.fromJSON(renderer));
            }
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        // TODO: delegate to layer's load method
        LayerCreator.prototype._loadPortalOverrides = function () {
            var _this = this;
            if (!this.layer.itemId || !this.portal || this.sublayerIndex === undefined) {
                return when({});
            }
            var extractSubLayerInfo = function (data) {
                if (!data || !data.layers || !Array.isArray(data.layers)) {
                    return {};
                }
                // Match sublayer id from url to the first layer with the same id
                for (var _i = 0, _a = data.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    if (layer.id === _this.sublayerIndex) {
                        var ret = lang.mixin({ id: null }, layer);
                        delete ret.id;
                        return ret;
                    }
                }
                return {};
            };
            return new PortalItem({
                id: this.layer.itemId,
                portal: this.portal
            }).load()
                .then(function (item) { return item.fetchData(); })
                .then(extractSubLayerInfo);
        };
        LayerCreator.prototype._layerWithPortalOverrides = function () {
            var _this = this;
            return this._loadPortalOverrides()
                .then(function (overrides) { return lang.mixin(overrides, _this.layer); });
        };
        __decorate([
            typescript_1.shared("esri.portal.creators.LayerCreator")
        ], LayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(null)
        ], LayerCreator.prototype, "type");
        __decorate([
            typescript_1.shared(true)
        ], LayerCreator.prototype, "requiresUrl");
        __decorate([
            typescript_1.property()
        ], LayerCreator.prototype, "layer");
        __decorate([
            typescript_1.property()
        ], LayerCreator.prototype, "portal");
        __decorate([
            typescript_1.property()
        ], LayerCreator.prototype, "propertyFilter");
        LayerCreator = __decorate([
            typescript_1.subclass()
        ], LayerCreator);
        return LayerCreator;
    })(Accessor);
    return LayerCreator;
});
