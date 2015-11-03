/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");

import ArcGISDynamicLayer = require("../../layers/ArcGISDynamicLayer");

@subclass()
class MapServiceLayerCreator extends LayerCreator<ArcGISDynamicLayer> {
  @shared("esri.portal.creators.MapServiceLayerCreator")
  declaredClass: string;

  @shared(ArcGISDynamicLayer)
  type: typeof ArcGISDynamicLayer;
}

export = MapServiceLayerCreator;
