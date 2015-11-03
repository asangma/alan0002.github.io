/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");

import ArcGISElevationLayer = require("../../layers/ArcGISElevationLayer");

@subclass()
class TiledElevationServiceLayerCreator extends LayerCreator<ArcGISElevationLayer> {
  @shared("esri.portal.creators.TiledImageServiceLayerCreator")
  declaredClass: string;

  @shared(ArcGISElevationLayer)
  type: typeof ArcGISElevationLayer;
}

export = TiledElevationServiceLayerCreator;
