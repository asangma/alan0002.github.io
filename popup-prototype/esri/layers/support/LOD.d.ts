
import JSONSupport = require("../../core/JSONSupport");

declare class LOD extends JSONSupport {
  level: number;
  levelValue: string;
  resolution: number;
  scale: number;

  toJSON(): any;
}

export = LOD;
