import Geometry = require("../Geometry");
import SpatialReference = require("../SpatialReference");

export function project<T extends Geometry>(geometry: T, target: SpatialReference | { spatialReference: SpatialReference }): T;
