define(["dojo/_base/config", "dojo/i18n"], function (dojoConfig, i18n) {

    //
    //Temporary fix to allow using esri/nls/jsapi in non-English locales without crashing entire app if one string is missing in other locale
    //

    return {

        load: function (id, require, load) {

            var fixRecursively = function(english, current) {
                for (var i in english) {
                    if (typeof current[i] === "object") {
                        fixRecursively(english[i], current[i]);
                    }
                    else if (current[i] === undefined) {
                        current[i] = english[i];
                    }
                }
            };

            if (dojoConfig.locale) {
                i18n.load("esri/nls/en/jsapi", require, function (english) {
                    i18n.load("esri/nls/" + dojoConfig.locale + "/jsapi", require, function (current) {
                        fixRecursively(english, current);
                        load();
                    });
                });
            }
            else {
                load();
            }
        }
    };
});