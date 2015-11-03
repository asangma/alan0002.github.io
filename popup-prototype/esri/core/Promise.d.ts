import Error = require("./Error");

declare class Promise<T> {
  // Copied from dojo IPromise, removed cancel functionality
  always<U, F>(callback?: (valueOrError: T | Error) => IPromise<U, F> | U | void): IPromise<U, Error | F>;

  isFulfilled(): boolean;
  isRejected(): boolean;
  isResolved(): boolean;

  otherwise<U, F>(errback?: (reason: Error) => IPromise<U, F> | U | void): IPromise<U, Error | F>;
  then<U, F>(callback?: (value: T) => IPromise<U, F> | U | void, errback?: (reason: Error) => IPromise<U, F> | U | void, progback?: (update: any) => IPromise<U, F> | U | void): IPromise<U, Error | F>;

  protected addResolvingPromise<U, F>(promise: IPromise<U, F>): void;
}

export = Promise;
