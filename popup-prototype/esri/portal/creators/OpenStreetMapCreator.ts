/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");
import OpenStreetMapLayer = require("../../layers/OpenStreetMapLayer");

@subclass()
class OpenStreetMapCreator extends LayerCreator<OpenStreetMapLayer> {
  @shared("esri.portal.creators.OpenStreetMapCreator")
  declaredClass: string;

  @shared(OpenStreetMapLayer)
  type: typeof OpenStreetMapLayer;

  @shared(false)
  requiresUrl: boolean;
}

export = OpenStreetMapCreator;
