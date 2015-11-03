
import Layer = require("./Layer");
import LayersMixin = require("../LayersMixin");

interface GroupLayerBase extends Layer, LayersMixin {}

interface GroupLayerBaseConstructor {
  new (options?: {}): GroupLayerBase;
}

declare function getGroupLayerBaseConstructor(): GroupLayerBaseConstructor;

declare class GroupLayer extends getGroupLayerBaseConstructor() {
  constructor(options?: any);
}

export = GroupLayer;
