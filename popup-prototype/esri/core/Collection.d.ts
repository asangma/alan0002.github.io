import Accessor = require("./Accessor");
import Evented = require("./Evented");

interface CollectionBase extends Accessor, Evented {}

interface CollectionBaseConstructor<T> {
  new (item?: T[] | Collection<T>): CollectionBase;
}

declare function getCollectionBase<T>(): CollectionBaseConstructor<T>;

declare class Collection<T> extends getCollectionBase<T>() {
  length: number;

  constructor(item?: T[]| Collection<T>);
  addItem(item: T, index?: number): void;
  addItems(item: T[] | Collection<T>): void;
  clear(): boolean;
  clone(): Collection<T>;
  drain(cb: (item: T) => void, thisArg?: Object): void;
  filter(cb: (item: T) => boolean, thisArg?: Object): Collection<T>;
  find(cb: (item: T) => boolean, thisArg?: Object): T;
  findIndex(cb: (item: T) => boolean, thisArg?: Object): number;
  forEach(cb: (item: T, index?: number, array?: T[]) => void, thisArg?: Object): void;
  getAll(): T[];
  getItemAt(index: number): T;
  indexOf(item: T): number;
  map<TRet>(cb: (item: T) => TRet, thisArg?: Object): Collection<TRet>;
  moveItem(item: T, index: number): void;
  reduce(cb: (a: T, b: T) => T, initialValue: T): T;
  reduceRight(cb: (a: T, b: T) => T, initialValue: T): T;
  removeItem(item: T): Collection<T>;
  removeItemAt(index: number): Collection<T>;
  removeItems(items: (T[]| Collection<T>)): T[];
  some(cb: (item: T) => boolean, thisArg?: Object): boolean;

  static referenceSetter<T>(value?: T[]| Collection<T>, cached?: T[]| Collection<T>): Collection<T>;
}

export = Collection;
