/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");

import SceneLayer = require("../../layers/SceneLayer");

@subclass()
class SceneServiceLayerCreator extends LayerCreator<SceneLayer> {
  @shared("esri.portal.creators.SceneServiceLayerCreator")
  declaredClass: string;

  @shared(SceneLayer)
  type: typeof SceneLayer;
}

export = SceneServiceLayerCreator;
