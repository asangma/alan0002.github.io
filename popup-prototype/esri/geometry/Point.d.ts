
import Geometry = require("./Geometry");
import SpatialReference = require("./SpatialReference");

import { Point as PointJSON } from "./portal/jsonTypes";

declare class Point extends Geometry {
  x: number;
  y: number;
  z: number | void;
  spatialReference: SpatialReference;

  toJSON(): PointJSON;
  clone(): Point;
}

export = Point;
