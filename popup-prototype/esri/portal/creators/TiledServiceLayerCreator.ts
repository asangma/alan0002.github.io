/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");

import ArcGISTiledLayer = require("../../layers/ArcGISTiledLayer");

@subclass()
class TiledServiceLayerCreator extends LayerCreator<ArcGISTiledLayer> {
  @shared("esri.portal.creators.TiledServiceLayerCreator")
  declaredClass: string;

  @shared(ArcGISTiledLayer)
  type: typeof ArcGISTiledLayer;
}

export = TiledServiceLayerCreator;
