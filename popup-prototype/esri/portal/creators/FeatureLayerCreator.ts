/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");

import FeatureLayer = require("../../layers/FeatureLayer");

@subclass()
class FeatureLayerCreator extends LayerCreator<FeatureLayer> {
  @shared("esri.portal.creators.FeatureLayerCreator")
  declaredClass: string;

  @shared(FeatureLayer)
  type: typeof FeatureLayer;
}

export = FeatureLayerCreator;
