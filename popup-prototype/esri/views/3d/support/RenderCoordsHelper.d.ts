import Point = require("../../../geometry/Point");
import SpatialReference = require("../../../geometry/SpatialReference");

declare class RenderCoordsHelper {
  toRenderCoords(srcPoint: Point, destVector: number[]): Point;
  toRenderCoords(srcVector: number[], srcSR: SpatialReference, destVector: number[]): Point;
}

export = RenderCoordsHelper;
