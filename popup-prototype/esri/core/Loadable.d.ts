import Promise = require("./Promise");

declare class Loadable<T> extends Promise<T> {
  loaded: boolean;
  loadError: Object;
  loadStatus: string;

  cancelLoad(): T;

  load(): T;
}

export = Loadable;
