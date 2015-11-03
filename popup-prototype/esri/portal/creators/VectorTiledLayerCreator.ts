/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");
import VectorTiledLayer = require("../../layers/VectorTiledLayer");

import { LayerProperties } from "./interfaces";
import { OperationalLayer } from "../jsonTypes";

interface Properties extends LayerProperties {
  styleUrl?: string;
  styles: string[];
}

interface OperationalVectorTiledLayer extends OperationalLayer {
  styleUrl?: string;
  styles: string[];
}

@subclass()
class VectorTiledLayerCreator extends LayerCreator<VectorTiledLayer> {
  @shared("esri.portal.creators.VectorTiledLayerCreator")
  declaredClass: string;

  @shared(VectorTiledLayer)
  type: typeof VectorTiledLayer;

  //--------------------------------------------------------------------------
  //
  //  Protected Methods
  //
  //--------------------------------------------------------------------------

  protected layerProperties(layer: OperationalVectorTiledLayer): IPromise<LayerProperties, Error> {
    return this.inherited<IPromise<LayerProperties, Error>>(arguments).then((properties: Properties) => {
      if (layer.styleUrl !== undefined) {
        properties.styleUrl = layer.styleUrl;
      }

      if (layer.styles !== undefined) {
        properties.styles = layer.styles;
      }

      return properties;
    });
  }
}

export = VectorTiledLayerCreator;
