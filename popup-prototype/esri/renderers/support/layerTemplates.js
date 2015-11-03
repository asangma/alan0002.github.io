define(["require", "exports", "dojo/has", "../Renderer", "../SimpleRenderer", "../UniqueValueRenderer", "../../symbols/support/jsonUtils", "../../core/urlUtils", "../../core/promiseUtils", "../../core/Error", "../../request", "../../portal/PortalQueryParams"], function (require, exports, sniff, Renderer, SimpleRenderer, UniqueValueRenderer, jsonUtils, urlUtils, promiseUtils, Error, request, PortalQueryParams) {
    function hasContentByReference(json) {
        if (!json) {
            return false;
        }
        if (json.styleUrl || json.styleName) {
            return "renderer";
        }
        if (json.symbol && json.symbol.type && json.symbol.type === "styleSymbolReference") {
            return "symbol";
        }
        return false;
    }
    exports.hasContentByReference = hasContentByReference;
    function createRenderer(jsonRenderer, portal) {
        var contentByReference = hasContentByReference(jsonRenderer);
        if (contentByReference === "renderer") {
            return createUniqueValueRendererFromStyleUrl(jsonRenderer, portal);
        }
        else if (contentByReference === "symbol") {
            return createSimpleRendererWithStyleSymbolReference(jsonRenderer, portal);
        }
        else {
            return promiseUtils.resolve(null);
        }
    }
    exports.createRenderer = createRenderer;
    function symbolFromJSON(json) {
        adjustProtocolInSymbolRefs(json);
        // patch symbol resource for IE
        if (sniff("ie") || sniff("trident")) {
            changeSVGRefsToPNG(json);
        }
        return jsonUtils.fromJSON(json);
    }
    function adjustProtocol(url) {
        if (location.protocol === "https:") {
            url = url.replace(/^http:/, "https:");
        }
        else {
            url = url.replace(/^https:/, "http:");
        }
        return url;
    }
    function modifySymbolHref(json, transform) {
        var json3d = json;
        if (!json3d.symbolLayers) {
            return;
        }
        for (var layerIdx = 0; layerIdx < json3d.symbolLayers.length; layerIdx++) {
            var symbolLayer = json3d.symbolLayers[layerIdx];
            if (symbolLayer.resource) {
                var reffed = symbolLayer.resource;
                if (reffed.href) {
                    reffed.href = transform(reffed.href);
                }
            }
        }
    }
    function adjustProtocolInSymbolRefs(json) {
        modifySymbolHref(json, function (url) {
            return adjustProtocol(urlUtils.fixUrl(url));
        });
    }
    function changeSVGRefsToPNG(json) {
        modifySymbolHref(json, function (url) {
            if (endsWith(url, ".svg")) {
                return (url.slice(0, url.length - 4) + ".png").replace("/resource/", "/resource/png/");
            }
            else {
                return url;
            }
        });
    }
    function getStyleFromUrl(styleUrl) {
        return request({
            url: adjustProtocol(styleUrl),
            content: {
                f: "json"
            },
            handleAs: "json"
        });
    }
    function getStyle(styleName, portal) {
        if (!portal) {
            return promiseUtils.reject(new Error("layer-templates:portal-missing", "A portal is required to query styles, but non was provided"));
        }
        if (!portal.stylesGroupQuery) {
            return promiseUtils.reject(new Error("layer-templates:styles-group-query-missing", "The styles group query needs to be configured in the portal to query styles"));
        }
        var q = new PortalQueryParams({
            disableExtraQuery: true,
            query: portal.stylesGroupQuery
        });
        return portal.load()
            .then(function () { return portal.queryGroups(q); })
            .then(function (_a) {
            var groups = _a.results;
            if (!groups || !Array.isArray(groups) || groups.length === 0) {
                throw new Error("layer-templates:styles-missing", "The styles group does not contain any styles");
            }
            var group = groups[0];
            var q = new PortalQueryParams({
                disableExtraQuery: true,
                query: "typekeywords:\"" + styleName + "\""
            });
            return group.queryItems(q);
        })
            .then(function (_a) {
            var items = _a.results;
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error("layer-templates:style-missing", "The style '${styleName}' is not part of the styles group", { styleName: styleName });
            }
            return items[0].load();
        })
            .then(function (item) {
            return item.fetchData();
        });
    }
    function getSymbolSet(style) {
        if (!style.symbolSetUrl) {
            return promiseUtils.reject(new Error("layer-templates:symbol-set-url-missing", "Style does not provide symbol set url", { style: style }));
        }
        return request({
            url: adjustProtocol(style.symbolSetUrl),
            content: {
                f: "json"
            },
            handleAs: "json"
        }).then(function (response) {
            if (response.length === 0 || !response[0].name) {
                throw new Error("layer-templates:symbol-set-missing-data", "Invalid syntax or missing data in symbol set", { style: style });
            }
            var symbolSet = {};
            for (var i = 0; i < response.length; i++) {
                // patch symbol resource for IE
                var symbol = symbolFromJSON(response[i]);
                symbolSet[response[i].name] = symbol;
                if (response[i].name === style.defaultItem) {
                    // set defaultSymbol if matching defaultItem is found
                    symbolSet.defaultSymbol = symbol;
                }
            }
            // in case style.defaultItem is not set, init first item in set as defaultSymbol
            if (!symbolSet.defaultSymbol) {
                symbolSet.defaultSymbol = symbolSet[response[0].name];
            }
            return symbolSet;
        });
    }
    function getSymbol(style, symbolName) {
        for (var i = 0; i < style.items.length; i++) {
            if (style.items[i].name === symbolName) {
                return request({
                    url: adjustProtocol(style.items[i].webRef),
                    content: {
                        f: "json"
                    },
                    handleAs: "json"
                }).then(function (symbol) {
                    return symbolFromJSON(symbol);
                });
            }
        }
        return promiseUtils.reject(new Error("layer-templates:symbol-name-not-found", "The symbol name '${symbolName}' could not be found", { symbolName: symbolName }));
    }
    function patchInfosIntoRenderer(jsonRenderer, renderer) {
        // reuse the core functionality of Renderer parser to get propSymbolInfo and colorInfo
        var genericRenderer = new Renderer(jsonRenderer);
        if (genericRenderer.sizeInfo) {
            renderer.setProportionalSymbolInfo(genericRenderer.sizeInfo);
        }
        if (genericRenderer.colorInfo) {
            renderer.setColorInfo(genericRenderer.colorInfo);
        }
        if (genericRenderer.visualVariables) {
            renderer.setVisualVariables(genericRenderer.visualVariables);
        }
        return renderer;
    }
    function createSimpleRendererWithStyleSymbolReference(jsonRenderer, portal) {
        var styleSymbolReferenceSymbol = jsonRenderer.symbol;
        if (!styleSymbolReferenceSymbol.name) {
            return promiseUtils.reject(new Error("layer-templates:style-symbol-reference-name-missing", "Missing name in style symbol reference"));
        }
        var styleDfd;
        if (styleSymbolReferenceSymbol.styleUrl) {
            styleDfd = getStyleFromUrl(styleSymbolReferenceSymbol.styleUrl);
        }
        else if (styleSymbolReferenceSymbol.styleName) {
            styleDfd = getStyle(styleSymbolReferenceSymbol.styleName, portal);
        }
        else {
            return promiseUtils.reject(new Error("layer-templates:style-url-and-name-missing", "Either styleUrl or styleName is required in layerDefinition"));
        }
        return styleDfd.then(function (style) {
            return getSymbol(style, styleSymbolReferenceSymbol.name);
        }).then(function (symbol) {
            var simpleRenderer = new SimpleRenderer(symbol);
            return patchInfosIntoRenderer(jsonRenderer, simpleRenderer);
        });
    }
    function createUniqueValueRendererFromStyleUrl(jsonRenderer, portal) {
        var styleDfd;
        if (jsonRenderer.styleUrl) {
            styleDfd = getStyleFromUrl(jsonRenderer.styleUrl);
        }
        else if (jsonRenderer.styleName) {
            styleDfd = getStyle(jsonRenderer.styleName, portal);
        }
        else {
            return promiseUtils.reject(new Error("layer-templates:style-symbol-reference-name-missing", "Missing name in style symbol reference"));
        }
        return styleDfd.then(function (style) {
            return getSymbolSet(style);
        }).then(function (symbolSet) {
            var defaultSymbol;
            if (jsonRenderer.defaultSymbol && symbolSet[jsonRenderer.defaultSymbol.name]) {
                defaultSymbol = symbolSet[jsonRenderer.defaultSymbol.name];
            }
            else {
                defaultSymbol = symbolSet.defaultSymbol;
            }
            var renderer = new UniqueValueRenderer(defaultSymbol, jsonRenderer.field1);
            for (var i in symbolSet) {
                if (symbolSet.hasOwnProperty(i)) {
                    renderer.addValue(i, symbolSet[i]);
                }
            }
            return patchInfosIntoRenderer(jsonRenderer, renderer);
        });
    }
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
});
