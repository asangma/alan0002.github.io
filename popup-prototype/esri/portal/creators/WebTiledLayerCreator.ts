/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");
import WebTiledLayer = require("../../layers/WebTiledLayer");

import { LayerProperties } from "./interfaces";
import { OperationalLayer } from "../jsonTypes";

interface Properties extends LayerProperties {
  urlTemplate?: string;
}

interface WebTiledOperationalLayer extends OperationalLayer {
  urlTemplate?: string;
  templateUrl?: string;
}

@subclass()
class WebTiledLayerCreator extends LayerCreator<WebTiledLayer> {
  @shared("esri.portal.creators.WebTiledLayerCreator")
  declaredClass: string;

  @shared(WebTiledLayer)
  type: typeof WebTiledLayer;

  @shared(false)
  requiresUrl: boolean;

  //--------------------------------------------------------------------------
  //
  //  Protected methods
  //
  //--------------------------------------------------------------------------

  protected layerProperties(layer: WebTiledOperationalLayer): IPromise<LayerProperties, Error> {
    return this.inherited<IPromise<Properties, Error>>(arguments).then((properties: Properties) => {
      if (layer.urlTemplate !== undefined) {
        properties.urlTemplate = layer.urlTemplate;
      } else if (layer.templateUrl !== undefined) {
        properties.urlTemplate = layer.templateUrl;
      }

      return properties;
    });
  }
}

export = WebTiledLayerCreator;
