/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import TiledServiceLayerCreator = require("./TiledServiceLayerCreator");

@subclass()
class TiledImageServiceLayerCreator extends TiledServiceLayerCreator {
  @shared("esri.portal.creators.TiledImageServiceLayerCreator")
  declaredClass: string;
}

export = TiledImageServiceLayerCreator;
