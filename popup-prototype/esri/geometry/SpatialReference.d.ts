import JSONSupport = require("../core/JSONSupport");

import { SpatialReference as SpatialReferenceJSON } from "./portal/jsonTypes";

declare class SpatialReference extends JSONSupport {
  wkid: number;
  latestWkid: number | void;

  clone(): SpatialReference;

  toJSON(): SpatialReferenceJSON;

  static WGS84: SpatialReference;
  static WebMercator: SpatialReference;
}

export = SpatialReference;
