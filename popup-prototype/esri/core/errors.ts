import Error = require("./Error");

export namespace Internal {
  export const NOT_YET_IMPLEMENTED = "internal:not-yet-implemented";
  export const UNKNOWN = "unknown";

  export function notYetImplemented() {
    return new Error(Internal.NOT_YET_IMPLEMENTED, "Not yet implemented");
  }

  export function unknown(err: any) {
    return new Error(Internal.UNKNOWN, "Unknown internal error", { internalError: err });
  }
}

export namespace JSON {
  export const MISSING_REQUIRED = "json:missing-required";
  export const INVALID_FORMAT = "json:invalid-format";

  export function missingRequired(name: string) {
    return new Error(JSON.MISSING_REQUIRED, "Missing required field '${name}'", { name: name });
  }

  export function invalidFormat(name: string, value: string, reason: string) {
    return new Error(JSON.INVALID_FORMAT, "The format of the '${name}' value (${value}) is invalid: ${reason}", { name: name, value: value, reason: reason });
  }
}

export namespace Portal {
  export const DEFAULT_PORTAL_MISSING = "portal:default-portal-missing";
  export const UNSUPPORTED_ITEM_TYPE = "portal:unsupported-item-type";
  export const UNSUPPORTED_LAYER_TYPE = "portal:unsupported-layer-type";

  export function unsupportedLayerType(type: string) {
    return new Error(Portal.UNSUPPORTED_LAYER_TYPE, "Unsupported layer type '${type}'", { type: type });
  }

  export function unsupportedItemType(type: string) {
    return new Error(Portal.UNSUPPORTED_ITEM_TYPE, "Unsupported item type '${type}'", { type: type });
  }
}

export namespace Load {
  export const ALREADY_REJECTED = "load:already-rejected";
  export const ALREADY_LOADING = "load:already-loading";
  export const NOTHING_TO_LOAD = "load:nothing-to-load";
  export const CANCELLED = "load:cancelled";

  export function alreadyRejected() {
    return new Error(Load.ALREADY_REJECTED, "Already rejected");
  }

  export function alreadyLoading() {
    return new Error(Load.ALREADY_LOADING, "Already loading");
  }

  export function nothingToLoad() {
    return new Error(Load.NOTHING_TO_LOAD, "Nothing to load");
  }

  export function cancelled() {
    return new Error(Load.CANCELLED, "Cancelled");
  }
}

export namespace Geometry {
  export const UNSUPPORTED_TYPE = "geometry:unsupported-type";

  export function unsupportedType(type: string) {
    return new Error(Geometry.UNSUPPORTED_TYPE, "Unsupported geometry type '${type}'", { type: type });
  }
}

export namespace Layer {
  export const NOT_IMPLEMENTED = "layer:not-implemented";
  export const URL_MISSING = "layer:url-missing";

  export function notImplemented(type: string) {
    return new Error(Layer.NOT_IMPLEMENTED, "Support for the layer type '${type}' is not yet implemented", { type: type });
  }

  export function urlMissing() {
    return new Error(Layer.URL_MISSING, "Required service url is missing");
  }
}

export namespace FeatureLayer {
  export const UNSUPPORTED_SOURCE_TYPE = "feature-layer:unsupported-type";

  export function unsupportedSourceType(type: string) {
    return new Error(FeatureLayer.UNSUPPORTED_SOURCE_TYPE, "Unsupported feature layer source type '${type}'", { type: type });
  }
}

export namespace WebScene {
  export const UNSUPPORTED_VERSION = "webscene:unsupported-version";
  export const NO_RENDERER = "webscene:no-renderer";
  export const UNSUPPORTED_RENDERER = "webscene:unsupported-renderer";

  export function unsupportedVersion(version: string, reason: string) {
    return new Error(WebScene.UNSUPPORTED_VERSION, "The version '${version}' is not supported: ${reason}", { version: version, reason: reason });
  }

  export function noRenderer() {
    return new Error(WebScene.NO_RENDERER, "Services without a renderer are not supported");
  }

  export function unsupportedRenderer(type: string) {
    return new Error(WebScene.UNSUPPORTED_RENDERER, "Renderer type '${type}' is not supported", { type: type });
  }
}
