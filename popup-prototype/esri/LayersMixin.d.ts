
import Layer = require("./layers/Layer");
import Collection = require("./core/Collection");

declare abstract class LayersMixin {
  layers: Collection<Layer>;

  add(layer: Layer, index?: number): LayersMixin;
  remove(layer: Layer | Layer[]): LayersMixin;
  removeAll(): LayersMixin;
}

export = LayersMixin;
