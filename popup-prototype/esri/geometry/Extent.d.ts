import Geometry = require("./Geometry");
import SpatialReference = require("./SpatialReference");

import { Extent as ExtentJSON } from "../portal/jsonTypes";

declare class Extent extends Geometry {
  xmin: number;
  ymin: number;
  zmin: number;
  xmax: number;
  ymax: number;
  zmax: number;

  constructor(spatialReference: SpatialReference);
  constructor(xmin: number, ymin: number, xmax: number, ymax: number, spatialReference?: SpatialReference);
  constructor(params?: Object);

  toJSON(): ExtentJSON;
  clone(): Extent;
}

export = Extent;
