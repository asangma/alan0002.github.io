define([
    "require",
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/dom-class",
    "dojo/dom-construct",
    "./dom",
    "dojo/Deferred"

], function (require, declare, lang, Evented, domClass, domConstruct, dom, Deferred) {
    var FOLDER = "./themes/";
    var COMMON = "common";

    var _theme = COMMON; //either "common" or "light"

    function merge(o1, o2) {
        for (var p in o2) {
            if (o2.hasOwnProperty(p)) {
                try {
                    o1[p] = o2[p].constructor == Object ? merge(o1[p], o2[p]) : o2[p];
                }
                catch (e) {
                    o1[p] = o2[p];
                }
            }
        }
        return o1;
    }

    function isCommon(theme) {
        return !theme || theme == COMMON;
    }

    var themeObj = new (declare([Evented], {

        set: function (root, theme) {

            this.change(root, _theme, theme);
            _theme = theme;

            this.emit("change");
        },

        get: function () {
            return _theme;
        },

        load: function (resourceId) {

            var deferred = new Deferred();
            var result = null;
            var errorHandle = require.on("error", resolve);

            function resolve() {
                if (errorHandle) {
                    errorHandle.remove();
                }
                deferred.resolve(result);
            }

            require([FOLDER + COMMON + "/" + resourceId],
                function (commonJson) {
                    result = lang.clone(commonJson);
                    if (isCommon(_theme)) {
                        resolve();
                    }
                    else {
                        require([FOLDER + _theme + "/" + resourceId],
                            function (themeJson) {
                                merge(result, themeJson);
                                resolve();
                            });
                    }
                });

            return deferred.promise;
        },

        change: function (node, oldTheme, newTheme) {
            if (!isCommon(oldTheme)) {
                domClass.remove(node, oldTheme);
            }
            if (!isCommon(newTheme)) {
                domClass.add(node, newTheme);
            }
        }
    }))();

    return themeObj;
});
