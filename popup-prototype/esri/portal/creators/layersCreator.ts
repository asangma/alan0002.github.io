import Error = require("../../core/Error");
import errors = require("../../core/errors");

import Layer = require("../../layers/Layer");
import Collection = require("../../core/Collection");
import promiseUtils = require("../../core/promiseUtils");
import requireUtils = require("../../core/requireUtils");
import LayerCreator = require("./LayerCreator");
import GroupLayer = require("../../layers/GroupLayer");

import lang = require("dojo/_base/lang");
import has = require("dojo/has");

import {
  BasemapLayer,
  OperationalLayer
} from "../jsonTypes";

import {
  LayerCreatorParams
} from "./interfaces";

type PopulateResult = IPromise<Layer, Error>[];

function createLayerWithCreator(layer: OperationalLayer, layerCreatorModule: string, params?: LayerCreatorParams): IPromise<Layer, Error> {
  return requireUtils.whenOne<typeof LayerCreator>(require, "./" + layerCreatorModule)
    .then((Creator) => (new Creator(lang.mixin(params, { layer: layer }))).create());
}

const isDebug: boolean = has("dojo-debug-messages");

export function createLayer(layer: OperationalLayer, params?: LayerCreatorParams): IPromise<Layer, Error> {
  let layerCreatorModule: string = null;

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
     return promiseUtils.reject<Layer, Error>(errors.Portal.unsupportedLayerType(layer.layerType));
  }

  return createLayerWithCreator(layer, layerCreatorModule, params);
}

export function createBasemapLayer(layer: BasemapLayer, params?: LayerCreatorParams): IPromise<Layer, Error> {
  let layerCreatorModule: string;

  let layerType = layer.layerType;

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
    return promiseUtils.reject<Layer, Error>(errors.Portal.unsupportedLayerType(layerType));
  }

  return createLayerWithCreator(layer, layerCreatorModule, params);
}

export function processLayer(container: Collection<Layer>, params: LayerCreatorParams, promise: IPromise<Layer, Error>): IPromise<Layer, Error> {
  if (!params || !params.filter) {
    return promise;
  }

  return promise.then((layer) => {
    let retlayer = params.filter(layer);

    if (retlayer === undefined) {
      return promiseUtils.resolve(layer);
    } else if (retlayer instanceof Layer) {
      return promiseUtils.resolve(<Layer> retlayer);
    } else {
      return retlayer;
    }
  });
}

export function populateLayers<T extends OperationalLayer | BasemapLayer>(container: Collection<Layer>, layers: T[], creator: (layer: T, params?: LayerCreatorParams) => IPromise<Layer, Error>, params?: LayerCreatorParams): PopulateResult {
  if (!layers) {
    return [];
  }

  // Load in the operational layers
  let loadingLayers: IPromise<Layer, Error>[] = [];
  let parents: IPromise<Layer, Error>[] = [];

  for (let i = 0; i < layers.length; i++) {
    let layer = layers[i];
    let loadingLayer = creator(layer, params);

    loadingLayers.push(loadingLayer);
    parents.push(null);

    // Load all the sub layers of group layers
    if (layer.layerType === "GroupLayer") {
      let oplayer = <OperationalLayer> layer;

      if (oplayer.layers && Array.isArray(oplayer.layers) && oplayer.layers.length > 0) {
        let groupedLayers = oplayer.layers.map((groupedLayer) => createLayer(groupedLayer, params));

        loadingLayers.push(...groupedLayers);

        for (let i = 0; i < groupedLayers.length; i++) {
          parents.push(loadingLayer);
        }
      }
    }
  }

  let idToIndexMap = {};

  let processLayers = loadingLayers.map((promise, index) => {
    // This callback is called for each layer create promise. Here we process
    // the future layer and if it was created successfully and not filtered out
    // by the application specified layer filter, then we add it to the webscene.

    let addOrdered = (collection: Collection<Layer>, layer: Layer) => {
      idToIndexMap[layer.id] = index;

      // Find first index of our mapped layer ids at which to insert our layer
      // to preserve the order. I.e. first layer that we added
      // (part of idToIndexMap) which index is larger than the current added
      // layer index
      let insertIndex = collection.findIndex((item) => {
        if (!item.id) {
          return false;
        }

        let mappedIndex = idToIndexMap[item.id];

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

    let retval = processLayer(container, params, promise).then((layer) => {
      if (parents[index] === null) {
        addOrdered(container, layer);
      } else {
        return parents[index].then((parent) => {
          addOrdered((<GroupLayer> parent).layers, layer);
          return promiseUtils.resolve(layer);
        });
      }

      return promiseUtils.resolve(layer);
    });

    if (isDebug) {
      retval = retval.otherwise((err) => {
        console.error(err.toString ? err.toString() : err);
        return promiseUtils.reject(err);
      });
    }

    return retval;
  });

  return processLayers;
}

export function populateOperationalLayers(container: Collection<Layer>, layers: OperationalLayer[], params?: LayerCreatorParams): PopulateResult {
  return populateLayers(container, layers, createLayer, params);
}

export function populateBasemapLayers(container: Collection<Layer>, layers: BasemapLayer[], params?: LayerCreatorParams): PopulateResult {
  return populateLayers(container, layers, createBasemapLayer, params);
}
