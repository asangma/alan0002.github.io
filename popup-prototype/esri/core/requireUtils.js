/**
 * @classdesc
 * Various utilities and convenience functions for promise based dynamic
 * requiring of modules.
 *
 * @module esri/core/requireUtils
 * @since 4.0
 */
define(["require", "exports", "dojo/Deferred"], function (require, exports, Deferred) {
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
    function when(moduleRequire, moduleNames) {
        var dfd = new Deferred();
        moduleRequire(moduleNames, function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            dfd.resolve(args);
        });
        return dfd.promise;
    }
    exports.when = when;
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
    function whenOne(moduleRequire, moduleName) {
        return when(moduleRequire, [moduleName]).then(function (_a) {
            var mod = _a[0];
            return mod;
        });
    }
    exports.whenOne = whenOne;
});
