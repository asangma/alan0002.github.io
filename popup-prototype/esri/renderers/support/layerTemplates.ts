import sniff = require("dojo/has");

import Renderer = require("../Renderer");
import SimpleRenderer = require("../SimpleRenderer");
import UniqueValueRenderer = require("../UniqueValueRenderer");

import Symbol = require("../../symbols/Symbol");
import jsonUtils = require("../../symbols/support/jsonUtils");

import urlUtils = require("../../core/urlUtils");
import promiseUtils = require("../../core/promiseUtils");
import Error = require("../../core/Error");

import request = require("../../request");

import Portal = require("../../portal/Portal");
import PortalItem = require("../../portal/PortalItem");
import PortalQueryParams = require("../../portal/PortalQueryParams");

import {
  Symbol3D as Symbol3DJSON,
  Symbol as SymbolJSON,
  ObjectSymbolLayer as ObjectSymbolLayerJSON,
  Renderer as RendererJSON,
  SimpleRenderer as SimpleRendererJSON,
  UniqueValueRenderer as UniqueValueRendererJSON
} from "../../portal/jsonTypes";

interface ByReferenceSymbolJSON {
  type: string;
  name: string;
  styleName?: string;
  styleUrl?: string;
}

interface ByReferenceSimpleRendererJSON extends SimpleRendererJSON {
  styleName?: string;
  styleUrl?: string;
  symbol: ByReferenceSymbolJSON;
}

interface ByReferenceUniqueValueRendererJSON extends UniqueValueRendererJSON {
  styleName?: string;
  styleUrl?: string;
  defaultSymbol: ByReferenceSymbolJSON;
}

type ByReferenceRendererJSON = ByReferenceSimpleRendererJSON | ByReferenceUniqueValueRendererJSON;
type ByReferenceRenderer = SimpleRenderer | UniqueValueRenderer;

export function hasContentByReference(json: any): string | boolean {
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

export function createRenderer(jsonRenderer: RendererJSON, portal: Portal): IPromise<Renderer, Error> {
  let contentByReference = hasContentByReference(jsonRenderer);

  if (contentByReference === "renderer") {
    return createUniqueValueRendererFromStyleUrl(<ByReferenceUniqueValueRendererJSON> jsonRenderer, portal);
  } else if (contentByReference === "symbol") {
    return createSimpleRendererWithStyleSymbolReference(<ByReferenceSimpleRendererJSON> jsonRenderer, portal);
  } else {
    return promiseUtils.resolve(null);
  }
}

function symbolFromJSON(json: any): Symbol {
  adjustProtocolInSymbolRefs(json);

  // patch symbol resource for IE
  if (sniff("ie") || sniff("trident")) {
    changeSVGRefsToPNG(json);
  }

  return jsonUtils.fromJSON(json);
}

function adjustProtocol(url: string): string {
  if (location.protocol === "https:") {
    url = url.replace(/^http:/, "https:");
  } else {
    url = url.replace(/^https:/, "http:");
  }

  return url;
}

function modifySymbolHref(json: SymbolJSON, transform: (url: string) => string): void {
  let json3d = <Symbol3DJSON> json;

  if (!json3d.symbolLayers) {
    return;
  }

  for (let layerIdx = 0; layerIdx < json3d.symbolLayers.length; layerIdx++) {
    let symbolLayer = <ObjectSymbolLayerJSON> json3d.symbolLayers[layerIdx];

    if (symbolLayer.resource) {
      let reffed = <{ href: string }> symbolLayer.resource;

      if (reffed.href) {
        reffed.href = transform(reffed.href);
      }
    }
  }
}

function adjustProtocolInSymbolRefs(json: SymbolJSON): void {
  modifySymbolHref(json, (url: string) => {
    return adjustProtocol(urlUtils.fixUrl(url));
  });
}

function changeSVGRefsToPNG(json: SymbolJSON) {
  modifySymbolHref(json, (url: string) => {
    if (endsWith(url, ".svg")) {
      return (url.slice(0, url.length - 4) + ".png").replace("/resource/", "/resource/png/");
    } else {
      return url;
    }
  });
}


function getStyleFromUrl(styleUrl: string): IPromise<any, any> {
  return request({
    url: adjustProtocol(styleUrl),

    content: {
      f: "json"
    },

    handleAs: "json"
  });
}

function getStyle(styleName: string, portal?: Portal) {
  if (!portal) {
    return promiseUtils.reject(new Error("layer-templates:portal-missing", "A portal is required to query styles, but non was provided"));
  }

  if (!portal.stylesGroupQuery) {
    return promiseUtils.reject(new Error("layer-templates:styles-group-query-missing", "The styles group query needs to be configured in the portal to query styles"));
  }

  let q = new PortalQueryParams({
    disableExtraQuery: true,
    query: portal.stylesGroupQuery
  });

  return portal.load()
    .then(() => portal.queryGroups(q))
    .then(function({ results: groups }) {
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        throw new Error("layer-templates:styles-missing", "The styles group does not contain any styles");
      }

      let group = groups[0];

      let q = new PortalQueryParams({
        disableExtraQuery: true,
        query: `typekeywords:"${styleName}"`
      });

      return group.queryItems(q);
    })
    .then(({ results: items }) => {
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("layer-templates:style-missing", "The style '${styleName}' is not part of the styles group", { styleName: styleName });
      }

      return items[0].load();
    })
    .then((item: PortalItem) => {
      return item.fetchData();
    });
}

function getSymbolSet(style: any): IPromise<any, any> {
  if (!style.symbolSetUrl) {
    return promiseUtils.reject(new Error("layer-templates:symbol-set-url-missing", "Style does not provide symbol set url", { style: style }));
  }

  return request({
    url: adjustProtocol(style.symbolSetUrl),

    content: {
      f: "json"
    },

    handleAs: "json"
  }).then(function(response) {
    if (response.length === 0 || !response[0].name) {
      throw new Error("layer-templates:symbol-set-missing-data", "Invalid syntax or missing data in symbol set", { style: style });
    }

    let symbolSet: any = {};

    for (let i = 0; i < response.length; i++) {
      // patch symbol resource for IE

      let symbol = symbolFromJSON(response[i]);
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

function getSymbol(style: any, symbolName?: string): IPromise<Symbol, any> {
  for (let i = 0; i < style.items.length; i++) {
    if (style.items[i].name === symbolName) {
      return request({
        url: adjustProtocol(style.items[i].webRef),

        content: {
          f: "json"
        },

        handleAs: "json"
      }).then(function(symbol) {
        return symbolFromJSON(symbol);
      });
    }
  }

  return promiseUtils.reject(new Error("layer-templates:symbol-name-not-found", "The symbol name '${symbolName}' could not be found", { symbolName: symbolName }));
}

function patchInfosIntoRenderer(jsonRenderer: ByReferenceRendererJSON, renderer: ByReferenceRenderer) {
  // reuse the core functionality of Renderer parser to get propSymbolInfo and colorInfo
  let genericRenderer = new Renderer(jsonRenderer);

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

function createSimpleRendererWithStyleSymbolReference(jsonRenderer: ByReferenceSimpleRendererJSON, portal: Portal): IPromise<Renderer, Error> {
  let styleSymbolReferenceSymbol = jsonRenderer.symbol;

  if (!styleSymbolReferenceSymbol.name) {
    return promiseUtils.reject(new Error("layer-templates:style-symbol-reference-name-missing", "Missing name in style symbol reference"));
  }

  let styleDfd: IPromise<any, any>;

  if (styleSymbolReferenceSymbol.styleUrl) {
    styleDfd = getStyleFromUrl(styleSymbolReferenceSymbol.styleUrl);
  } else if (styleSymbolReferenceSymbol.styleName) {
    styleDfd = getStyle(styleSymbolReferenceSymbol.styleName, portal);
  } else {
    return promiseUtils.reject(new Error("layer-templates:style-url-and-name-missing", "Either styleUrl or styleName is required in layerDefinition"));
  }

  return styleDfd.then((style) => {
    return getSymbol(style, styleSymbolReferenceSymbol.name);
  }).then((symbol) => {
    let simpleRenderer = new SimpleRenderer(symbol);
    return patchInfosIntoRenderer(jsonRenderer, simpleRenderer);
  });
}

function createUniqueValueRendererFromStyleUrl(jsonRenderer: ByReferenceUniqueValueRendererJSON, portal: Portal): IPromise<Renderer, Error> {
  let styleDfd: IPromise<any, any>;

  if (jsonRenderer.styleUrl) {
    styleDfd = getStyleFromUrl(jsonRenderer.styleUrl);
  } else if (jsonRenderer.styleName) {
    styleDfd = getStyle(jsonRenderer.styleName, portal);
  } else {
    return promiseUtils.reject(new Error("layer-templates:style-symbol-reference-name-missing", "Missing name in style symbol reference"));
  }

  return styleDfd.then(function(style) {
    return getSymbolSet(style);
  }).then(function(symbolSet) {
    let defaultSymbol: Symbol;

    if (jsonRenderer.defaultSymbol && symbolSet[jsonRenderer.defaultSymbol.name]) {
      defaultSymbol = symbolSet[jsonRenderer.defaultSymbol.name];
    } else {
      defaultSymbol = symbolSet.defaultSymbol;
    }

    let renderer = new UniqueValueRenderer(defaultSymbol, jsonRenderer.field1);

    for (let i in symbolSet) {
      if (symbolSet.hasOwnProperty(i)) {
        renderer.addValue(i, symbolSet[i]);
      }
    }

    return patchInfosIntoRenderer(jsonRenderer, renderer);
  });
}

function endsWith(str: string, suffix: string) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
