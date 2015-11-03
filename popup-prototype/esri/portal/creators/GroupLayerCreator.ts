/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared } from "../../core/accessorSupport/typescript";

import LayerCreator = require("./LayerCreator");

import GroupLayer = require("../../layers/GroupLayer");
import Error = require("../../core/Error");
import promiseUtils = require("../../core/promiseUtils");

import { LayerProperties } from "./interfaces";

interface Properties extends LayerProperties {
  visibilityMode?: string;
}

@subclass()
class GroupLayerCreator extends LayerCreator<GroupLayer> {
  @shared("esri.portal.creators.GroupLayerCreator")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  create(): IPromise<GroupLayer, Error> {
    return this.layerProperties(this.layer).then((layerProperties: Properties) => {
      if (this.layer.visibilityMode !== undefined) {
        layerProperties.visibilityMode = this.layer.visibilityMode;
      }

      return promiseUtils.resolve(new GroupLayer(layerProperties));
    });
  }
}

export = GroupLayerCreator;
