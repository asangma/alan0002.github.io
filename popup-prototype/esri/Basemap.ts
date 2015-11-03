/**
 * Basemap is used for creating custom basemaps. These basemaps may be created from tiled
 * services you publish to your own server or from tiled services published by
 * third parties.
 *
 * @module esri/Basemap
 * @since 4.0
 * @see module:esri/widgets/BasemapToggle
 * @see module:esri/Map
 */

/// <amd-dependency path="./core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="./core/tsSupport/decorateHelper" name="__decorate" />

import {
  subclass,
  property,
  shared,
  ClassMetaData
} from "./core/accessorSupport/typescript";

import Evented = require("./core/Evented");
import Loadable = require("./core/Loadable");
import JSONSupport = require("./core/JSONSupport");
import errors = require("./core/errors");
import Collection = require("./core/Collection");
import promiseUtils = require("./core/promiseUtils");

import PortalItem = require("./portal/PortalItem");

import Layer = require("./layers/Layer");
import WebTiledLayer = require("./layers/WebTiledLayer");
import ArcGISTiledLayer = require("./layers/ArcGISTiledLayer");
import ArcGISElevationLayer = require("./layers/ArcGISElevationLayer");

import SpatialReference = require("./geometry/SpatialReference");
import Extent = require("./geometry/Extent");
import TileInfo = require("./layers/support/TileInfo");
import requireUtils = require("./core/requireUtils");

import layersCreator = require("./portal/creators/layersCreator");
type layersCreatorT = typeof layersCreator;

import {
  LayerCreatorParams
} from "./portal/creators/interfaces";

import {
  Basemap as BasemapJSON
} from "./portal/jsonTypes";

let idCounter = 0;

type TiledBasemapLayer = ArcGISTiledLayer | WebTiledLayer;

interface BasemapBase extends JSONSupport, Evented, Loadable<Basemap> { }

interface BasemapBaseConstructor {
  new (): BasemapBase;
}

function getBasemapBase(): BasemapBaseConstructor {
  return <any> JSONSupport;
}

@subclass([Evented, Loadable])
class Basemap extends getBasemapBase() {

  @shared("esri.Basemap")
  declaredClass: string;

  @shared({
    reader: {
      exclude: [
        "baseMapLayers",
        "elevationLayers"
      ]
    }
  })
  classMetadata: ClassMetaData;

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/Loadable
   * @mixes module:esri/core/Promise
   * @mixes module:esri/core/Evented
   * @constructor
   * @alias module:esri/Basemap
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  constructor({}) {
    super();
  }

  getDefaults() {
    return {
      id: Date.now().toString(16) + "-basemap-" + (idCounter++),
      baseLayers: new Collection<Layer>(),
      referenceLayers: new Collection<Layer>(),
      elevationLayers: new Collection<Layer>()
    };
  }

  initialize() {
    if (this.resourceInfo) {
      this.read(this.resourceInfo);
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  baseLayers
  //----------------------------------

  /**
   * A collection of tiled layers that make up the basemap's features.
   *
   * @type {module:esri/core/Collection}
   */
  @property({ setter: Collection.referenceSetter })
  baseLayers: Collection<Layer> = null;

  //----------------------------------
  //  elevationLayers
  //----------------------------------

  /**
   * A collection of {@link module:esri/layers/ArcGISElevationLayer elevation layers}
   * that are used to render terrain and topography in {@link module:esri/views/SceneView SceneViews}.
   *
   * @type {module:esri/core/Collection}
   */
  @property({ setter: Collection.referenceSetter })
  elevationLayers: Collection<Layer> = null;

  //----------------------------------
  //  id
  //----------------------------------

  /**
   * The identifier used to refer to the basemap when referencing it elsewhere, such as
   * inside the {@link module:esri/widgets/BasemapToggle#basemaps basemaps} property of the
   * {@link module:esri/widgets/BasemapToggle BasemapToggle} widget.
   *
   * @type {string}
   *
   * @example
   * var customBasemap = new Basemap({
   *   baseLayers: [layers],
   *   title: "Custom Basemap",
   *   id: "myBasemap"
   * });
   *
   * var bt = new BasemapToggle({
   *   map: map,
   *   basemap: customBasemap,
   *   basemaps: {
   *     "myBasemap": {
   *       "title": "Custom Basemap",
   *       "thumbnailUrl": "http://.../customImg.jpg"
   *     }
   *   }
   * });
   */
  @property()
  id: string = null;

  //----------------------------------
  //  initialExtent
  //----------------------------------

  /**
   * The initial extent of the basemap.
   *
   * @type {module:esri/geometry/Extent}
   */
  @property({ value: null })
  initialExtent: Extent = null;
        
  //----------------------------------
  //  loaded
  //----------------------------------

  /**
   * Indicates whether the basemap instance has loaded. When `true`,
   * all the properties of the object can be accessed.
   *
   * @name loaded
   * @instance
   * @type {boolean}
   * @default false
   * @readonly
   */    

  //----------------------------------
  //  portalItem
  //----------------------------------

  /**
   * The portal item.
   *
   * @type {module:esri/portal/PortalItem}
   */
  @property({
    type: PortalItem
  })
  portalItem: PortalItem = null;

  //----------------------------------
  //  referenceLayers
  //----------------------------------

  /**
   * A collection of tiled reference layers for displaying labels.
   *
   * @type {module:esri/core/Collection}
   */
  @property({ setter: Collection.referenceSetter })
  referenceLayers: Collection<Layer> = null;

  //----------------------------------
  //  resourceInfo
  //----------------------------------

  /**
   * @ignore
   * @type {Object}
   */
  @property()
  resourceInfo: BasemapJSON = null;

  //----------------------------------
  //  spatialReference
  //----------------------------------

  /**
   * The spatial reference of the basemap.
   *
   * @type {module:esri/geometry/SpatialReference}
   */
  @property()
  spatialReference: SpatialReference = null;

  //----------------------------------
  //  tileInfo
  //----------------------------------

  @property()
  tileInfo: TileInfo = null;

  //----------------------------------
  //  title
  //----------------------------------

  /**
   * The title of the basemap.
   *
   * @type {string}
   */
  @property({ value: "" })
  title: string = null;

  //----------------------------------
  //  visible
  //----------------------------------

  /**
   * Indicates if the basemap is visible.
   *
   * @type {boolean}
   * @default true
   */
  @property({ value: true })
  visible: boolean = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  load(): Basemap {
    this.addResolvingPromise(
      this._loadFromSource()
        .then(() => this._loadFirstLayer())
        .then((layer: Layer) => this._loadFinished(layer))
    );

    return this;
  }

  /**
   * Clone this object.
   *
   * @return {module:esri/webscene/Basemap} a new {@link module:esri/webscene/Basemap} instance.
   */
  clone(): Basemap {
    let nb = new Basemap({
      id: this.id,
      title: this.title,
      visible: this.visible,
      resourceInfo: this.resourceInfo,
      portalItem: this.portalItem,
      initialExtent: this.initialExtent ? this.initialExtent.clone() : null,
      spatialReference: this.spatialReference ? this.spatialReference.clone() : null,
      tileInfo: this.tileInfo ? this.tileInfo.clone() : null,
      baseLayers: this.baseLayers.clone(),
      referenceLayers: this.referenceLayers.clone(),
      elevationLayers: this.elevationLayers.clone()
    });

    return nb;
  }

  toJSON(): BasemapJSON {
    throw errors.Internal.notYetImplemented();
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private _loadFromSource(): IPromise<void, Error> {
    let resourceInfo = this.resourceInfo;
    let portalItem = this.portalItem;

    if (resourceInfo) {
      return this._loadFromJSON(resourceInfo);
    }
    else if (portalItem) {
      return this._loadFromItem(portalItem);
    }

    return promiseUtils.resolve(null);
  }

  private _loadFromJSON(json: BasemapJSON): IPromise<void, Error> {
    let portal = this.portalItem && this.portalItem.portal;
    let ret = requireUtils.whenOne(require, "./portal/creators/layersCreator").then((layersCreator: layersCreatorT) => {
      let allLayers: IPromise<Layer, Error>[] = [];

      if (json.baseMapLayers && Array.isArray(json.baseMapLayers)) {
        let params: LayerCreatorParams = {
          defaultLayerType: "DefaultTiledLayer",
          portal: portal
        };

        let baseLayersCreated = layersCreator.populateBasemapLayers(this.baseLayers,
          json.baseMapLayers.filter((layer) => !layer.isReference),
          params);

        allLayers.push(...baseLayersCreated);

        let referenceLayersCreated = layersCreator.populateBasemapLayers(this.referenceLayers,
          json.baseMapLayers.filter((layer) => layer.isReference),
          params);

        allLayers.push(...referenceLayersCreated);
      }

      if (json.elevationLayers && Array.isArray(json.elevationLayers)) {
        let params: LayerCreatorParams = {
          defaultLayerType: "ArcGISTiledElevationServiceLayer",
          portal: portal
        };

        let elevationLayersCreated = layersCreator.populateBasemapLayers(this.elevationLayers,
          json.elevationLayers,
          params);
        allLayers.push(...elevationLayersCreated);
      }

      return promiseUtils.eachAlways(allLayers);
    });

    return <IPromise<void, Error>> (<any> ret);
  }

  private _loadFromItem(portalItem: any): IPromise<void, Error> {
    return portalItem.load()
      .then((item: PortalItem) => item.fetchData())
      .then((json: any) => {
        this.resourceInfo = json.baseMap;
        this.read(this.resourceInfo);

        return this._loadFromJSON(this.resourceInfo);
      });
  }

  private _loadFirstLayer(): Layer {
    let baseLayers = this.baseLayers;
    let elevationLayers = this.elevationLayers;

    if (baseLayers.length > 0) {
      return baseLayers.getItemAt(0).load();
    }
    else if (elevationLayers.length > 0) {
      return elevationLayers.getItemAt(0).load();
    }

    throw errors.Load.nothingToLoad();
  }

  private _loadFinished(layer: Layer) {
    this.initialExtent = layer.initialExtent.clone();
    this.spatialReference = layer.initialExtent.spatialReference.clone();

    let tiledLayer = <TiledBasemapLayer> layer;
    this.tileInfo = tiledLayer.tileInfo && tiledLayer.tileInfo.clone();
  }

  //--------------------------------------------------------------------------
  //
  //  Static Public Methods
  //
  //--------------------------------------------------------------------------

  static fromJSON(json?: BasemapJSON): Basemap {
    if (!json) {
      return null;
    }

    return new Basemap({
      resourceInfo: json
    });
  }

  static defaultElevationLayer = new ArcGISElevationLayer({
    id: "globalElevation",
    url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
  });
}

export = Basemap;
