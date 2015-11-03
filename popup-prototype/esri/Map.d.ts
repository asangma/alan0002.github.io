
import Basemap = require("./Basemap");

import Accessor = require("./core/Accessor");
import Evented = require("./core/Evented");
import Loadable = require("./core/Loadable");
import LayersMixin = require("./LayersMixin");


interface RejectError {
  error: Error;
  errors: Error[];
}

interface MapBase extends Accessor, Evented, Loadable<Map>, LayersMixin {}

interface MapBaseConstructor {
  new (): MapBase;
}

declare function getMapBaseConstructor(): MapBaseConstructor;

declare class Map extends getMapBaseConstructor() {
  constructor(obj?: any);
  basemap: Basemap;
}

export = Map;
