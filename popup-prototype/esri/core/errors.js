define(["require", "exports", "./Error"], function (require, exports, Error) {
    var Internal;
    (function (Internal) {
        Internal.NOT_YET_IMPLEMENTED = "internal:not-yet-implemented";
        Internal.UNKNOWN = "unknown";
        function notYetImplemented() {
            return new Error(Internal.NOT_YET_IMPLEMENTED, "Not yet implemented");
        }
        Internal.notYetImplemented = notYetImplemented;
        function unknown(err) {
            return new Error(Internal.UNKNOWN, "Unknown internal error", { internalError: err });
        }
        Internal.unknown = unknown;
    })(Internal = exports.Internal || (exports.Internal = {}));
    var JSON;
    (function (JSON) {
        JSON.MISSING_REQUIRED = "json:missing-required";
        JSON.INVALID_FORMAT = "json:invalid-format";
        function missingRequired(name) {
            return new Error(JSON.MISSING_REQUIRED, "Missing required field '${name}'", { name: name });
        }
        JSON.missingRequired = missingRequired;
        function invalidFormat(name, value, reason) {
            return new Error(JSON.INVALID_FORMAT, "The format of the '${name}' value (${value}) is invalid: ${reason}", { name: name, value: value, reason: reason });
        }
        JSON.invalidFormat = invalidFormat;
    })(JSON = exports.JSON || (exports.JSON = {}));
    var Portal;
    (function (Portal) {
        Portal.DEFAULT_PORTAL_MISSING = "portal:default-portal-missing";
        Portal.UNSUPPORTED_ITEM_TYPE = "portal:unsupported-item-type";
        Portal.UNSUPPORTED_LAYER_TYPE = "portal:unsupported-layer-type";
        function unsupportedLayerType(type) {
            return new Error(Portal.UNSUPPORTED_LAYER_TYPE, "Unsupported layer type '${type}'", { type: type });
        }
        Portal.unsupportedLayerType = unsupportedLayerType;
        function unsupportedItemType(type) {
            return new Error(Portal.UNSUPPORTED_ITEM_TYPE, "Unsupported item type '${type}'", { type: type });
        }
        Portal.unsupportedItemType = unsupportedItemType;
    })(Portal = exports.Portal || (exports.Portal = {}));
    var Load;
    (function (Load) {
        Load.ALREADY_REJECTED = "load:already-rejected";
        Load.ALREADY_LOADING = "load:already-loading";
        Load.NOTHING_TO_LOAD = "load:nothing-to-load";
        Load.CANCELLED = "load:cancelled";
        function alreadyRejected() {
            return new Error(Load.ALREADY_REJECTED, "Already rejected");
        }
        Load.alreadyRejected = alreadyRejected;
        function alreadyLoading() {
            return new Error(Load.ALREADY_LOADING, "Already loading");
        }
        Load.alreadyLoading = alreadyLoading;
        function nothingToLoad() {
            return new Error(Load.NOTHING_TO_LOAD, "Nothing to load");
        }
        Load.nothingToLoad = nothingToLoad;
        function cancelled() {
            return new Error(Load.CANCELLED, "Cancelled");
        }
        Load.cancelled = cancelled;
    })(Load = exports.Load || (exports.Load = {}));
    var Geometry;
    (function (Geometry) {
        Geometry.UNSUPPORTED_TYPE = "geometry:unsupported-type";
        function unsupportedType(type) {
            return new Error(Geometry.UNSUPPORTED_TYPE, "Unsupported geometry type '${type}'", { type: type });
        }
        Geometry.unsupportedType = unsupportedType;
    })(Geometry = exports.Geometry || (exports.Geometry = {}));
    var Layer;
    (function (Layer) {
        Layer.NOT_IMPLEMENTED = "layer:not-implemented";
        Layer.URL_MISSING = "layer:url-missing";
        function notImplemented(type) {
            return new Error(Layer.NOT_IMPLEMENTED, "Support for the layer type '${type}' is not yet implemented", { type: type });
        }
        Layer.notImplemented = notImplemented;
        function urlMissing() {
            return new Error(Layer.URL_MISSING, "Required service url is missing");
        }
        Layer.urlMissing = urlMissing;
    })(Layer = exports.Layer || (exports.Layer = {}));
    var FeatureLayer;
    (function (FeatureLayer) {
        FeatureLayer.UNSUPPORTED_SOURCE_TYPE = "feature-layer:unsupported-type";
        function unsupportedSourceType(type) {
            return new Error(FeatureLayer.UNSUPPORTED_SOURCE_TYPE, "Unsupported feature layer source type '${type}'", { type: type });
        }
        FeatureLayer.unsupportedSourceType = unsupportedSourceType;
    })(FeatureLayer = exports.FeatureLayer || (exports.FeatureLayer = {}));
    var WebScene;
    (function (WebScene) {
        WebScene.UNSUPPORTED_VERSION = "webscene:unsupported-version";
        WebScene.NO_RENDERER = "webscene:no-renderer";
        WebScene.UNSUPPORTED_RENDERER = "webscene:unsupported-renderer";
        function unsupportedVersion(version, reason) {
            return new Error(WebScene.UNSUPPORTED_VERSION, "The version '${version}' is not supported: ${reason}", { version: version, reason: reason });
        }
        WebScene.unsupportedVersion = unsupportedVersion;
        function noRenderer() {
            return new Error(WebScene.NO_RENDERER, "Services without a renderer are not supported");
        }
        WebScene.noRenderer = noRenderer;
        function unsupportedRenderer(type) {
            return new Error(WebScene.UNSUPPORTED_RENDERER, "Renderer type '${type}' is not supported", { type: type });
        }
        WebScene.unsupportedRenderer = unsupportedRenderer;
    })(WebScene = exports.WebScene || (exports.WebScene = {}));
});
