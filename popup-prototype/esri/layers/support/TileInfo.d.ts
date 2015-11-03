
import JSONSupport = require("../../core/JSONSupport");

import SpatialReference = require("../../geometry/SpatialReference");
import Point = require("../../geometry/Point");
import LOD = require("./LOD");

import { TileInfo as TileInfoJSON } from "./portal/jsonTypes";

declare class TileInfo extends JSONSupport {
  spatialReference: SpatialReference;
  origin: Point;

  lods: LOD[];
  minScale: number;
  maxScale: number;
  scales: number[];

  dpi: number;
  format: string;

  rows: number;
  cols: number;

  zoomToScale(zoom: number): number;
  scaleToZoom(scale: number): number;
  snapScale(scale: number, maxZoomDistance?: number): number;

  clone(): TileInfo;
  toJSON(): TileInfoJSON;
}

export = TileInfo;
