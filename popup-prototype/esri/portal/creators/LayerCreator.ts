/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, property, shared } from "../../core/accessorSupport/typescript";

import {
  OperationalLayer,
  OperationalLayerOverrides
} from "../jsonTypes";

import {
  LayerCreatorParams,
  LayerProperties,
  PropertyFilter
} from "./interfaces";

import lang = require("dojo/_base/lang");
import when = require("dojo/when");
import has = require("dojo/has");
import Accessor = require("../../core/Accessor");
import Portal = require("../Portal");
import Layer = require("../../layers/Layer");
import Error = require("../../core/Error");
import errors = require("../../core/errors");
import promiseUtils = require("../../core/promiseUtils");
import PopupTemplate = require("../../PopupTemplate");
import PortalItem = require("../PortalItem");
import LabelClass = require("../../layers/support/LabelClass");
import rendererJSONUtils = require("../../renderers/support/jsonUtils");
import urlUtils = require("../../core/urlUtils");
import Renderer = require("../../renderers/Renderer");
import layerTemplates = require("../../renderers/support/layerTemplates");

interface OperationalLayerOverridesWithId extends OperationalLayerOverrides {
  id: number;
}

interface LayerItemData {
  layers: OperationalLayerOverridesWithId[];
}

const isDebug: boolean = has("dojo-debug-messages");

@subclass()
class LayerCreator<T extends Layer> extends Accessor {
  @shared("esri.portal.creators.LayerCreator")
  declaredClass: string;

  @shared(null)
  type: typeof Layer;

  @shared(true)
  requiresUrl: boolean;

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(params: LayerCreatorParams) {
    super();
  }

  initialize() {
    let sublayerMatch = this.layer.url && this.layer.url.match(/\/(\d+)$/);

    if (sublayerMatch) {
      this.sublayerIndex = parseInt(sublayerMatch[1], 10);
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  protected sublayerIndex: number;

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  layer
  //----------------------------------

  @property()
  layer: OperationalLayer;

  //----------------------------------
  //  portal
  //----------------------------------

  @property()
  portal: Portal;

  //----------------------------------
  //  propertyFilter
  //----------------------------------

  @property()
  propertyFilter: PropertyFilter;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  create(): IPromise<T, Error> {
    if (!this.layer.url && this.requiresUrl) {
      return promiseUtils.reject(errors.Layer.urlMissing());
    }

    // Creates the concrete layer instance from an operational layer definition
    let createLayer = (layer: OperationalLayer): IPromise<T, Error> => {
      let Ctor = this.type;

      return this.layerProperties(layer).then((properties: LayerProperties) => {
        return promiseUtils.resolve(new Ctor(properties));
      });
    };

    // Obtain a layer definition including portal overrides, then create it
    return this._layerWithPortalOverrides()
      .then(createLayer);
  }

  //--------------------------------------------------------------------------
  //
  //  Protected Methods
  //
  //--------------------------------------------------------------------------

  protected layerProperties(layer: OperationalLayer): IPromise<LayerProperties, Error> {
    let ret: LayerProperties = {
      title: layer.title || ""
    };

    if (layer.url !== undefined) {
      ret.url = urlUtils.normalize(layer.url);
    }

    let take = <T>(v: T) => v;
    let clone = lang.clone;
    let boolify = <T>(v: T) => !!v;

    let copyProperties = <T1, T2>(dest: T1, source: T2, fields: HashMap<any>) => {
      for (let field in fields) {
        let value = source[field];

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

    let layerDefinition = layer.layerDefinition;

    if (layerDefinition !== undefined) {
      copyProperties(ret, layerDefinition, {
        minScale: take,
        maxScale: take,
        elevationInfo: clone,
        definitionExpression: take
      });

      let drawingInfo = layer.layerDefinition.drawingInfo;

      if (drawingInfo !== undefined) {
        let labelingInfo = drawingInfo.labelingInfo;

        if (labelingInfo !== undefined && Array.isArray(labelingInfo) && labelingInfo.length > 0) {
          ret.labelingInfo = labelingInfo.map((info) => new LabelClass(clone(info)));
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
      .then((renderer: Renderer) => {
        if (renderer) {
          ret.renderer = renderer;
        }

        if (this.propertyFilter) {
          let newprops = this.propertyFilter(layer, ret);

          if (newprops !== undefined) {
            ret = <LayerProperties> newprops;
          }
        }

        return ret;
      })
      .otherwise((err: Error) => {
        // Don't fail the whole layer if the renderer is invalid.
        // TODO:
        //   1. Try to fallback to a simple renderer with default symbology
        //   2. A way to propagate a "warning" in the API
        isDebug && console.warn("Failed to create renderer:", err.toString ? err.toString() : err);
        return ret;
      });
  }

  protected createRenderer(layer: OperationalLayer, properties: LayerProperties): IPromise<Renderer, Error> {
    if (!layer.layerDefinition || !layer.layerDefinition.drawingInfo || !layer.layerDefinition.drawingInfo.renderer) {
      return promiseUtils.resolve(null);
    }

    let renderer = layer.layerDefinition.drawingInfo.renderer;

    if (layerTemplates.hasContentByReference(renderer)) {
      return layerTemplates.createRenderer(renderer, this.portal)
        .then((renderer) => {
          properties.showLegend = false;
          return renderer;
        }).otherwise((err: Error) => {
          // TODO: propagate a "warning" in the API
          isDebug && console.warn("Failed to create by reference renderer:", err.toString ? err.toString() : err);
          return rendererJSONUtils.fromJSON(renderer);
        });
    } else {
      return promiseUtils.resolve(rendererJSONUtils.fromJSON(renderer));
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  // TODO: delegate to layer's load method
  private _loadPortalOverrides(): IPromise<OperationalLayerOverrides, Error> {
    if (!this.layer.itemId || !this.portal || this.sublayerIndex === undefined) {
      return when({});
    }

    let extractSubLayerInfo = (data: LayerItemData): OperationalLayerOverrides => {
      if (!data || !data.layers || !Array.isArray(data.layers)) {
        return {};
      }

      // Match sublayer id from url to the first layer with the same id
      for (let layer of data.layers) {
        if (layer.id === this.sublayerIndex) {
          let ret = lang.mixin({id: null}, layer);
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
      .then((item) => item.fetchData<LayerItemData>())
      .then(extractSubLayerInfo);
  }

  private _layerWithPortalOverrides(): IPromise<OperationalLayerOverrides, Error> {
    return this._loadPortalOverrides()
      .then((overrides) => lang.mixin(overrides, this.layer));
  }
}

export = LayerCreator;
