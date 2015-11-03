/**
 * @classdesc
 * Various utilities and convenience functions for promise based dynamic
 * requiring of modules.
 *
 * @module esri/core/requireUtils
 * @since 4.0
 */

import Deferred = require("dojo/Deferred");

/**
 * Dynamically requires a number of modules and returns a promise which
 * resolves when all modules have been loaded.
 *
 * @memberof module:esri/core/requireUtils#
 *
 * @param {require} moduleRequire - The "require" from the module which is used
 *                                  to load the modules.
 * @param {string[]} moduleNames - The names of the modules to load.
 *
 * @return {Promise} A promise which resolves with an array containing the loaded modules.
 */
export function when(moduleRequire: typeof require, moduleNames: string[]): IPromise<any[], void> {
  let dfd = new Deferred<any[], void>();

  moduleRequire(moduleNames, (...args: any[]) => {
    dfd.resolve(args);
  });

  return dfd.promise;
}

/**
 * Dynamically requires a single module returns a promise which
 * resolves when that module has loaded. This is a convenience shorthand for
 * calling {@link module:esri/core/requireUtils#when} with a single module
 * name.
 *
 * @memberof module:esri/core/requireUtils#
 *
 * @param {require} moduleRequire - The "require" from the module which is used
 *                                  to load the modules.
 * @param {string} moduleName - The name of the modules to load.
 *
 * @return {Promise} A promise which resolves with the loaded module.
 */
export function whenOne<T>(moduleRequire: typeof require, moduleName: string): IPromise<T, void> {
  return when(moduleRequire, [moduleName]).then(([mod]: T[]) => mod);
}
