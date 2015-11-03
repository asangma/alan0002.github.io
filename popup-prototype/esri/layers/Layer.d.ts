import JSONSupport = require("../core/JSONSupport");
import Loadable = require("../core/Loadable");
import Extent = require("../geometry/Extent");
import Renderer = require("../renderers/Renderer");

interface LayerBase extends JSONSupport, Loadable<Layer> {}

interface LayerBaseConstructor {
  new (url?: string | {}, options?: {}): LayerBase;
}

declare function getLayerBaseConstructor(): LayerBaseConstructor;

declare class Layer extends getLayerBaseConstructor() {
 declaredClass: string;

  id: string;
  initialExtent: Extent;
  renderer: Renderer;
  url: string;
  visible: boolean;

  constructor(url?: string | any, options?: any);
  toJSON(): any;
}

export = Layer;
