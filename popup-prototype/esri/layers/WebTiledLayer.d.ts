
import Layer = require("./Layer");
import TileInfo = require("./support/TileInfo");

declare class WebTiledLayer extends Layer {
  tileInfo: TileInfo;
}

export = WebTiledLayer;
