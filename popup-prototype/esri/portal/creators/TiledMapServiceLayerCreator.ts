/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import TiledServiceLayerCreator = require("./TiledServiceLayerCreator");

@subclass()
class TiledMapServiceLayerCreator extends TiledServiceLayerCreator {
  @shared("esri.portal.creators.TiledServiceLayerCreator")
  declaredClass: string;
}

export = TiledMapServiceLayerCreator;
