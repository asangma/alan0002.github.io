/**
 * @classdesc
 * Various utilities and convenience functions for working with promises.
 *
 * @module esri/core/promiseUtils
 * @since 4.0
 */
define(["require", "exports", "dojo/Deferred"], function (require, exports, Deferred) {
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
    function eachAlways(promises) {
        var dfd = new Deferred();
        var n = promises.length;
        if (n === 0) {
            dfd.resolve(promises);
        }
        for (var _i = 0; _i < promises.length; _i++) {
            var promise = promises[_i];
            promise.always(function () {
                --n;
                if (n === 0) {
                    dfd.resolve(promises);
                }
            });
        }
        return dfd.promise;
    }
    exports.eachAlways = eachAlways;
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
    function reject(error) {
        var dfd = new Deferred();
        dfd.reject(error);
        return dfd.promise;
    }
    exports.reject = reject;
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
    function resolve(value) {
        var dfd = new Deferred();
        dfd.resolve(value);
        return dfd.promise;
    }
    exports.resolve = resolve;
});
