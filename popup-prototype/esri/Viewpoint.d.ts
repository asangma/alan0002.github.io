
import JSONSupport = require("./core/JSONSupport");
import Camera = require("./Camera");

import { Viewpoint as ViewpointJSON } from "./portal/jsonTypes";

declare class Viewpoint extends JSONSupport {
  camera: Camera;

  toJSON(): ViewpointJSON;
  clone(): Viewpoint;
}

export = Viewpoint;
