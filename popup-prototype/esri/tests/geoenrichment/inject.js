var dojoConfig = {
    async: true,
    parseOnLoad: true,
    packagePaths: {}
};

var geServer;

(function(){

    function injectCss(url) {
        document.write('<link rel="stylesheet" type="text/css" href="' + url + '" />');
    }

    injectCss('../../../dijit/themes/claro/claro.css');
    injectCss('../../css/main.css');

    if (window.location.href.indexOf("?") > -1) {
        var str = window.location.href.substr(window.location.href.indexOf("?") + 1).split(/#/);
        var ary = str[0].split(/&/);
        for (var i = 0; i < ary.length; i++) {
            var split = ary[i].split("="),
                    key = split[0],
                    value = split[1]
            switch (key) {
                case "dir":
                    // rtl | null
                    document.getElementsByTagName("html")[0].dir = value;
                    dir = value;

                    if (document.body) {
                        document.body.dir = value;
                    }

                    break;
                case "geServer":
                    geServer = value;
                    break;
                case "locale":
                    dojoConfig.locale = value;
                    break;
            }
        }
    }

    document.write('<script src="../../../dojo/dojo.js"></script>');
})();
