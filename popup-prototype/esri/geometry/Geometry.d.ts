import JSONSupport = require("../core/JSONSupport");
import SpatialReference = require("./SpatialReference");

declare class Geometry extends JSONSupport {
  spatialReference: SpatialReference;

  clone(): Geometry;
  toJSON(): Object;
}

export = Geometry;
