/**
 * Loads a [WebScene](http://server.arcgis.com/en/portal/latest/use/make-your-first-scene.htm)
 * from [ArcGIS Online](https://www.arcgis.com/home/) or
 * [Portal for ArcGIS](http://server.arcgis.com/en/portal/) into a {@link module:esri/views/SceneView}.
 *
 * To load a WebScene into a SceneView, you must reference the ID of the scene in
 * the [portalItem](#portalItem) property of this class.
 *
 * ```js
 * var scene = new WebScene({
 *   portalItem: new PortalItem({
 *     id: "affa021c51944b5694132b2d61fe1057"  //ID of the WebScene on arcgis.com
 *   })
 * });
 * ```
 *
 * Then you must reference the WebScene instance in the `map` property of a {@link module:esri/views/SceneView}.
 *
 * ```js
 * var view = new SceneView({
 *   map: scene,  //the WebScene instance created above
 *   container: "viewDiv"
 * });
 * ```
 *
 * @module esri/WebScene
 * @since 4.0
 * @see [Sample - Load a basic WebScene](../sample-code/webscene-basic/index.html)
 * @see {@link module:esri/portal/PortalItem}
 */

/// <amd-dependency path="./core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="./core/tsSupport/decorateHelper" name="__decorate" />

import Map = require("./Map");

import Error = require("./core/Error");
import errors = require("./core/errors");
import requireUtils = require("./core/requireUtils");
import promiseUtils = require("./core/promiseUtils");
import JSONSupport = require("./core/JSONSupport");
import Basemap = require("./Basemap");

import geomJsonUtils = require("./geometry/support/jsonUtils");
import geomCastUtils = require("./geometry/support/castUtils");
import Geometry = require("./geometry/Geometry");
import SpatialReference = require("./geometry/SpatialReference");

import layersCreator = require("./portal/creators/layersCreator");
type layersCreatorT = typeof layersCreator;

import {
  subclass,
  property,
  shared,
  ClassMetaData
} from "./core/accessorSupport/typescript";

import Presentation = require("./webscene/Presentation");
import InitialState = require("./webscene/InitialState");

import PortalItem = require("./portal/PortalItem");

import lang = require("dojo/_base/lang");

import request = require("./request");

import {
  WebScene as WebSceneJSON,
  Basemap as BasemapJSON,
  ClippingArea as ClippingAreaJSON,
  OperationalLayer
} from "./portal/jsonTypes";

import {
  LayerCreatorParams,
  LayerProperties
} from "./portal/creators/interfaces";

interface WebSceneBase extends Map, JSONSupport { }

interface WebSceneBaseConstructor {
  new (): WebSceneBase;
}

function getWebSceneBase(): WebSceneBaseConstructor {
  return <any> Map;
}

const WEBSCENE_VERSION = {
  major: 1,
  minor: 2
};

const WEBSCENE_VERSION_STRING = WEBSCENE_VERSION.major + "." + WEBSCENE_VERSION.minor;

@subclass([JSONSupport])
class WebScene extends getWebSceneBase() {
  @shared("esri.WebScene")
  declaredClass: string;

  @shared({
    reader: {
      exclude: ["baseMap", "operationalLayers"],
      add: ["basemap", "clippingEnabled"]
    }
  })
  classMetadata: ClassMetaData;

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  /**
   * @extends module:esri/Map
   * @constructor
   * @alias module:esri/WebScene
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  constructor(obj?: any) {
    super();
  }

  initialize() {
    if (this.resourceInfo) {
      this.read(this._validateJSON(this.resourceInfo));
    }
  }

  getDefaults() {
    return lang.mixin(this.inherited(arguments), {
      presentation: new Presentation(),
      initialState: new InitialState()
    });
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  basemap
  //----------------------------------

  @property({
    reader: (value: any, source: { baseMap?: BasemapJSON }) => {
      if (!source.baseMap ||
          (source.baseMap.baseMapLayers.length === 0 &&
           source.baseMap.elevationLayers.length === 0)) {
        return null;
      }

      return Basemap.fromJSON(source.baseMap);
    }
  })
  basemap: Basemap = null;

  //----------------------------------
  //  clippingArea
  //----------------------------------

  /**
   * *This property only applies to local scenes.*
   * Represents an optional clipping area used to define an area outside of
   * which content is clipped and will not be displayed. Set the
   * [clippingEnabled](#clippingEnabled) property to enable clipping by the specified
   * [clippingArea](#clippingArea).
   *
   * @type {module:esri/geometry/Extent}
   * @see [clippingEnabled](#clippingEnabled)
   */
  @property({
    reader: (value: ClippingAreaJSON) => {
      if (value && value.geometry) {
        return geomJsonUtils.fromJSON(value.geometry);
      }

      return null;
    },

    setter: (value: any) => geomCastUtils.cast(value)
  })
  clippingArea: Geometry = null;

  //----------------------------------
  //  clippingEnabled
  //----------------------------------

  /**
   * *This property only applies to local scenes.*
   * Determines whether clipping using the [clippingArea](#clippingArea) is
   * enabled.
   *
   * @type {boolean}
   * @see [clippingArea](#clippingArea)
   * @default false
   */
  @property({
    value: false,
    reader: (value: any, source: any) => {
      if (source && source.clippingArea) {
        return !!source.clippingArea.clip;
      }
    }
  })
  clippingEnabled: boolean = null;

  //----------------------------------
  //  version
  //----------------------------------

  /**
   * The WebScene version.
   *
   * @readOnly
   * @type {string}
   */
  @property({ value: WEBSCENE_VERSION_STRING })
  version: string = null;

  //----------------------------------
  //  authoringApp
  //----------------------------------

  /**
   * The name of the application that authored the WebScene.
   *
   * @type {string}
   */
  @property()
  authoringApp: string = null;

  //----------------------------------
  //  authoringAppVersion
  //----------------------------------

  /**
   * The version of the application that authored the WebScene.
   *
   * @type {string}
   */
  @property()
  authoringAppVersion: string = null;

  //----------------------------------
  //  presentation
  //----------------------------------

  /**
   * Provides a {@link module:esri/core/Collection} of slides
   * that act as bookmarks for saving predefined {@link module:esri/Viewpoint viewpoints}
   * and visible layers.
   *
   * @type {module:esri/webscene/Presentation}
   * @see {module:esri/webscene/Slide}
   */
  @property({ type: Presentation })
  presentation: Presentation = null;

  //----------------------------------
  //  initialState
  //----------------------------------

  /**
   * The initial state of the WebScene.
   *
   * @type {module:esri/webscene/InitialState}
   */
  @property({ type: InitialState })
  initialState: InitialState = null;

  //----------------------------------
  //  spatialReference
  //----------------------------------

  @property({ type: SpatialReference })
  spatialReference: SpatialReference;

  //----------------------------------
  //  viewingMode
  //----------------------------------

  /**
   * The viewing mode of the scene. Global scenes allow the user to
   * navigate the globe. Local scenes allow for navigation and feature
   * display in a particular "localized" area.
   *
   * **Known Values:** global | local
   *
   * @type {string}
   * @default global
   * @see [clippingArea](#clippingArea)
   */
  @property({
    value: "global",
    setter: (value: string) => {
      if (value !== "local" && value !== "global") {
        return;
      }
      return value;
    }
  })
  viewingMode: string = null;

  //----------------------------------
  //  portalItem
  //----------------------------------

  /**
   * The portal item from which the WebScene is loaded.
   *
   * @type {module:esri/portal/PortalItem}
   */
  @property({ type: PortalItem })
  portalItem: PortalItem = null;

  //----------------------------------
  //  resourceInfo
  //----------------------------------

  /**
   * @ignore
   * @type {string | Object}
   */
  @property()
  resourceInfo: WebSceneJSON = null;

  //----------------------------------
  //  url
  //----------------------------------

  /**
   * @ignore
   * @type {string}
   */
  @property()
  url: string = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  load(): WebScene {
    this.addResolvingPromise(this._loadFromSource());
    return this;
  }

  toJSON(): WebSceneJSON {
    let ret: WebSceneJSON = {
      version: this.version,
      baseMap: this.basemap.toJSON(),
      operationalLayers: this.layers.map((layer) => layer.toJSON()).getAll(),
      presentation: this.presentation.toJSON(),
      initialState: this.initialState.toJSON()
    };

    if (this.authoringApp != null) {
      ret.authoringApp = this.authoringApp;
    }

    if (this.authoringAppVersion != null) {
      ret.authoringAppVersion = this.authoringAppVersion;
    }

    if (this.clippingArea != null) {
      ret.clippingArea = {
        geometry: <any> this.clippingArea.toJSON(),
        clip: !!this.clippingEnabled
      };
    }

    return ret;
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private _loadFromSource(): IPromise<void, Error> {
    if (this.resourceInfo) {
      return this._loadFromJSON(this.resourceInfo);
    } else if (this.portalItem && this.portalItem.id) {
      return this._loadFromItem(this.portalItem);
    } else if (this.url) {
      return this._loadFromURL(this.url);
    } else {
      return promiseUtils.resolve(null);
    }
  }

  private _readAndLoadFromJSON(json: any): IPromise<void, Error> {
    let validated = this._validateJSON(json);
    this.read(validated);
    return this._loadFromJSON(validated);
  }

  private _loadFromJSON(json: WebSceneJSON): IPromise<void, Error> {
    let layerParams = LayerLoader.layerCreatorParams();

    if (this.portalItem) {
      layerParams.portal = this.portalItem.portal;
    }

    return requireUtils.whenOne(require, "./portal/creators/layersCreator").then((layersCreator: layersCreatorT) => {
      let ret = promiseUtils.eachAlways(layersCreator.populateOperationalLayers(this.layers, json.operationalLayers, layerParams));
      return <IPromise<void, Error>> (<any> ret);
    });
  }

  private _loadFromItem(portalItem: PortalItem): IPromise<void, Error> {
    return portalItem.load()
      .then((item: any) => item.fetchData())
      .then((json: any) => this._readAndLoadFromJSON(json));
  }

  private _loadFromURL(url: string): IPromise<void, Error> {
    return fetchWebSceneData(url).then((json: any) => this._readAndLoadFromJSON(json));
  }

  private _validateVersion(version: string): string {
    let [major, minor] = version.split(".");
    let nre = /^\s*\d+\s*$/;

    if (!major || !major.match || !major.match(nre)) {
      throw errors.JSON.invalidFormat("version", version, "Expected major version to be a number");
    }

    if (!minor || !minor.match || !minor.match(nre)) {
      throw errors.JSON.invalidFormat("version", version, "Expected minor version to be a number");
    }

    let majorNum = parseInt(major, 10),
      minorNum = parseInt(minor, 10);

    if (majorNum !== WebScene.Version.major) {
      throw errors.WebScene.unsupportedVersion(version, "required major webscene version is '" + WebScene.Version.major + "'");
    }

    // Sanitized version
    return majorNum + "." + minorNum;
  }

  private _validateJSON(json: any): WebSceneJSON {
    let spec = this._sanitizeJSON(json);

    spec.version = this._validateVersion(spec.version);

    return spec;
  }

  private _sanitizeJSON(json: any): WebSceneJSON {
    return {
      version: json.version || "0.0",
      baseMap: json.baseMap,
      operationalLayers: json.operationalLayers,

      authoringApp: json.authoringApp || "",
      authoringAppVersion: json.authoringAppVersion || "",

      viewingMode: json.viewingMode || "",
      presentation: (json.presentation && Presentation.sanitizeJSON(json.presentation)) || {},
      initialState: json.initialState && InitialState.sanitizeJSON(json.initialState),

      spatialReference: json.spatialReference,

      clippingArea: json.clippingArea
    };
  }

  //--------------------------------------------------------------------------
  //
  //  Static Methods
  //
  //--------------------------------------------------------------------------

  static fromJSON(json: any): WebScene {
    return new WebScene({
      resourceInfo: json
    });
  }

  static fromURL(url: string): IPromise<WebScene, Error> {
    return fetchWebSceneData(url).then(function(resourceInfo: any) {
      return promiseUtils.resolve(new WebScene({
        resourceInfo: resourceInfo,
        url: url
      }));
    });
  }

  static Version: { major: number, minor: number } = WEBSCENE_VERSION;
}

function fetchWebSceneData(url: string) {
  return request({
    url: url,
    handleAs: "json",
    content: {
      f: "json"
    },
    callbackParamName: "callback"
  });
}

class LayerLoader {
  public static propertyFilter(layer: OperationalLayer, properties: LayerProperties): LayerProperties | void {
    let ret = properties;

    switch (layer.layerType) {
      case "ArcGISFeatureLayer":
        ret = LayerLoader._featureLayerPropertyFilter(layer, properties);
        break;
    }

    return ret;
  }

  public static layerCreatorParams(): LayerCreatorParams {
    return {
      propertyFilter: LayerLoader.propertyFilter
    };
  }

  private static _featureLayerPropertyFilter(layer: OperationalLayer, properties: FeatureLayerProperties): FeatureLayerProperties {
    const MODE_SNAPSHOT = 0;

    properties.mode = MODE_SNAPSHOT;
    properties.returnZ = true;
    properties.outFields = ["*"];

    return properties;
  }
}

interface FeatureLayerProperties extends LayerProperties {
  mode?: number;
  returnZ?: boolean;
  outFields?: string[];
}

export = WebScene;
