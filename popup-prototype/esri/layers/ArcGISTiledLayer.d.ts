
import Layer = require("./Layer");
import TileInfo = require("./support/TileInfo");

declare class ArcGISTiledLayer extends Layer {
  constructor(url?: string | any, options?: any);

  tileInfo: TileInfo;
}

export = ArcGISTiledLayer;
