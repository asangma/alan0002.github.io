
import JSONSupport = require("./core/JSONSupport");
import Point = require("./geometry/Point");

import { Camera as CameraJSON } from "./portal/jsonTypes";

declare class Camera extends JSONSupport {
  position: Point;
  fov: number;
  heading: number;
  tilt: number;

  toJSON(): CameraJSON;
  clone(): Camera;
}

export = Camera;
