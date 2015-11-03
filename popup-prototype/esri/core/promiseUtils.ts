/**
 * @classdesc
 * Various utilities and convenience functions for working with promises.
 *
 * @module esri/core/promiseUtils
 * @since 4.0
 */

import Deferred = require("dojo/Deferred");
import Error = require("./Error");

/**
 * Convenience utility to wait for a number of promises to either resolve or
 * reject. The resulting promise resolves with the provided array of promises
 * which are each fulfilled (either resolved or rejected).
 *
 * @memberof module:esri/core/promiseUtils#
 *
 * @param {Promise[]} promises - the promises to wait for.
 *
 * @return {Promise} A promise which resolves with the provided promises, now
 *                   each fulfilled.
 */
export function eachAlways<T, E>(promises: IPromise<T, E>[]): IPromise<IPromise<T, E>[], Error> {
  let dfd = new Deferred<IPromise<T, E>[], Error>();
  let n = promises.length;

  if (n === 0) {
    dfd.resolve(promises);
  }

  for (let promise of promises) {
    promise.always(() => {
      --n;

      if (n === 0) {
        dfd.resolve(promises);
      }
    });
  }

  return dfd.promise;
}

/**
 * Convenience utility to create a promise that has been rejected with a
 * provided error value.
 *
 * @memberof module:esri/core/promiseUtils#
 *
 * @param {Object=} error - The error to reject the resulting promise with.
 *
 * @return {Promise} A promise which is rejected with the provided error.
 */
export function reject<T, E>(error?: E): IPromise<T, E> {
  let dfd = new Deferred<T, E>();
  dfd.reject(error);

  return dfd.promise;
}

/**
 * Convenience utility to create a promise which has been resolved with a
 * provided value.
 *
 * @memberof module:esri/core/promiseUtils#
 *
 * @param {*=} value - The value to resolve the resulting promise with.
 *
 * @return {Promise} A promise which is resolved with the provided value.
 */
export function resolve<T, E>(value?: T): IPromise<T, E> {
  let dfd = new Deferred<T, E>();
  dfd.resolve(value);

  return dfd.promise;
}
