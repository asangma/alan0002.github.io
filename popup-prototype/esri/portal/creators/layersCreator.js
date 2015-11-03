define(["require", "exports", "../../core/errors", "../../layers/Layer", "../../core/promiseUtils", "../../core/requireUtils", "dojo/_base/lang", "dojo/has"], function (require, exports, errors, Layer, promiseUtils, requireUtils, lang, has) {
    function createLayerWithCreator(layer, layerCreatorModule, params) {
        return requireUtils.whenOne(require, "./" + layerCreatorModule)
            .then(function (Creator) { return (new Creator(lang.mixin(params, { layer: layer }))).create(); });
    }
    var isDebug = has("dojo-debug-messages");
    function createLayer(layer, params) {
        var layerCreatorModule = null;
        switch (layer.layerType) {
            case "ArcGISFeatureLayer":
                layerCreatorModule = "FeatureLayerCreator";
                break;
            case "ArcGISMapServiceLayer":
                layerCreatorModule = "MapServiceLayerCreator";
                break;
            case "ArcGISSceneServiceLayer":
                layerCreatorModule = "SceneServiceLayerCreator";
                break;
            case "ArcGISTiledMapServiceLayer":
                layerCreatorModule = "TiledMapServiceLayerCreator";
                break;
            case "ArcGISTiledImageServiceLayer":
                layerCreatorModule = "TiledImageServiceLayerCreator";
                break;
            case "ArcGISTiledElevationServiceLayer":
                layerCreatorModule = "TiledElevationServiceLayerCreator";
                break;
            case "GroupLayer":
                layerCreatorModule = "GroupLayerCreator";
                break;
            default:
                return promiseUtils.reject(errors.Portal.unsupportedLayerType(layer.layerType));
        }
        return createLayerWithCreator(layer, layerCreatorModule, params);
    }
    exports.createLayer = createLayer;
    function createBasemapLayer(layer, params) {
        var layerCreatorModule;
        var layerType = layer.layerType;
        if (!layerType && params && params.defaultLayerType) {
            layerType = params.defaultLayerType;
        }
        switch (layerType) {
            case "ArcGISTiledMapServiceLayer":
                layerCreatorModule = "TiledMapServiceLayerCreator";
                break;
            case "ArcGISTiledImageServiceLayer":
                layerCreatorModule = "TiledImageServiceLayerCreator";
                break;
            case "ArcGISTiledElevationServiceLayer":
                layerCreatorModule = "TiledElevationServiceLayerCreator";
                break;
            case "OpenStreetMap":
                layerCreatorModule = "OpenStreetMapCreator";
                break;
            case "WebTiledLayer":
                layerCreatorModule = "WebTiledLayerCreator";
                break;
            case "VectorTiledLayer":
                layerCreatorModule = "VectorTiledLayerCreator";
                break;
            case "DefaultTiledLayer":
                layerCreatorModule = "TiledServiceLayerCreator";
                break;
            default:
                return promiseUtils.reject(errors.Portal.unsupportedLayerType(layerType));
        }
        return createLayerWithCreator(layer, layerCreatorModule, params);
    }
    exports.createBasemapLayer = createBasemapLayer;
    function processLayer(container, params, promise) {
        if (!params || !params.filter) {
            return promise;
        }
        return promise.then(function (layer) {
            var retlayer = params.filter(layer);
            if (retlayer === undefined) {
                return promiseUtils.resolve(layer);
            }
            else if (retlayer instanceof Layer) {
                return promiseUtils.resolve(retlayer);
            }
            else {
                return retlayer;
            }
        });
    }
    exports.processLayer = processLayer;
    function populateLayers(container, layers, creator, params) {
        if (!layers) {
            return [];
        }
        // Load in the operational layers
        var loadingLayers = [];
        var parents = [];
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var loadingLayer = creator(layer, params);
            loadingLayers.push(loadingLayer);
            parents.push(null);
            // Load all the sub layers of group layers
            if (layer.layerType === "GroupLayer") {
                var oplayer = layer;
                if (oplayer.layers && Array.isArray(oplayer.layers) && oplayer.layers.length > 0) {
                    var groupedLayers = oplayer.layers.map(function (groupedLayer) { return createLayer(groupedLayer, params); });
                    loadingLayers.push.apply(loadingLayers, groupedLayers);
                    for (var i_1 = 0; i_1 < groupedLayers.length; i_1++) {
                        parents.push(loadingLayer);
                    }
                }
            }
        }
        var idToIndexMap = {};
        var processLayers = loadingLayers.map(function (promise, index) {
            // This callback is called for each layer create promise. Here we process
            // the future layer and if it was created successfully and not filtered out
            // by the application specified layer filter, then we add it to the webscene.
            var addOrdered = function (collection, layer) {
                idToIndexMap[layer.id] = index;
                // Find first index of our mapped layer ids at which to insert our layer
                // to preserve the order. I.e. first layer that we added
                // (part of idToIndexMap) which index is larger than the current added
                // layer index
                var insertIndex = collection.findIndex(function (item) {
                    if (!item.id) {
                        return false;
                    }
                    var mappedIndex = idToIndexMap[item.id];
                    if (mappedIndex === undefined) {
                        return false;
                    }
                    return (index < mappedIndex);
                });
                if (insertIndex < 0) {
                    insertIndex = undefined;
                }
                collection.addItem(layer, insertIndex);
            };
            var retval = processLayer(container, params, promise).then(function (layer) {
                if (parents[index] === null) {
                    addOrdered(container, layer);
                }
                else {
                    return parents[index].then(function (parent) {
                        addOrdered(parent.layers, layer);
                        return promiseUtils.resolve(layer);
                    });
                }
                return promiseUtils.resolve(layer);
            });
            if (isDebug) {
                retval = retval.otherwise(function (err) {
                    console.error(err.toString ? err.toString() : err);
                    return promiseUtils.reject(err);
                });
            }
            return retval;
        });
        return processLayers;
    }
    exports.populateLayers = populateLayers;
    function populateOperationalLayers(container, layers, params) {
        return populateLayers(container, layers, createLayer, params);
    }
    exports.populateOperationalLayers = populateOperationalLayers;
    function populateBasemapLayers(container, layers, params) {
        return populateLayers(container, layers, createBasemapLayer, params);
    }
    exports.populateBasemapLayers = populateBasemapLayers;
});
