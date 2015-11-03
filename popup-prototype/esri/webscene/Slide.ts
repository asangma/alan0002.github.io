/**
 * A slide stores a snapshot of several pre-set properties of the
 * {@link module:esri/WebScene}, such as
 * the [basemap](#basemap), [viewpoint](#viewpoint) and [visible layers](#visibleLayers).
 *
 * @todo Slides can be [created](#createFrom), [updated](#updateFrom)
 * and [applied](#applyTo) to a {@link module:esri/views/SceneView}.
 *
 * @module esri/webscene/Slide
 * @since 4.0
 * @see module:esri/webscene/Presentation
 * @see [Sample - WebScene slides](../sample-code/webscene-slides/index.html)
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import JSONSupport = require("../core/JSONSupport");
import Viewpoint = require("../Viewpoint");
import Basemap = require("../Basemap");
import Collection = require("../core/Collection");
import Camera = require("../Camera");

import GroupLayer = require("../layers/GroupLayer");
import Layer = require("../layers/Layer");
import Environment = require("./Environment");
import Ligthing = require("./Lighting");

import lang = require("dojo/_base/lang");

import glMatrix = require("../views/3d/lib/glMatrix");
import SceneView = require("../views/SceneView");
import ViewAnimation = require("../views/ViewAnimation");

import {
  subclass,
  shared,
  property,
  ClassMetaData
} from "../core/accessorSupport/typescript";

import {
  Slide as SlideJSON,
  VisibleLayer as VisibleLayerJSON
} from "./portal/jsonTypes";

import {
  Screenshot,
  ScreenshotOptions
} from "./views/3d/interfaces";

let idCounter = 0;

interface VisibleLayer {
  id: string;
}

@subclass()
class Slide extends JSONSupport {
  @shared("esri.webscene.Slide")
  declaredClass: string;

  @shared({
    reader: {
      exclude: ["baseMap"],
      add: ["basemap"]
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
   * @constructor
   * @alias module:esri/webscene/Slide
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  constructor(obj?: any) {
    super(obj);
  }

  getDefaults(): Object {
    return {
      id: Date.now().toString(16) + "-slide-" + (idCounter++),
      thumbnail: { url: "" },
      title: { text: "" },
      description: { text: "" },
      viewpoint: new Viewpoint(),
      environment: new Environment(),
      visibleLayers: []
    };
  }

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  // The current animation trigerred by applyTo.
  private _currentAnimation: ViewAnimation = null;

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  id
  //----------------------------------

  /**
   * The unique id of a slide within the
   * {@link module:esri/webscene/Presentation#slides slides property} of a
   * {@link module:esri/webscene/Presentation}.
   *
   * @type {string}
   */
  @property({ value: "" })
  id: string = null;

  //----------------------------------
  //  title
  //----------------------------------

  /**
   * The title of the slide.
   *
   * @property {string} text - The title.
   *
   * @type {Object}
   */
  @property({
    reader: (value) => ({ text: value.text })
  })
  title: { text: string } = null;

  //----------------------------------
  //  description
  //----------------------------------

  /**
   * The description of the slide.
   *
   * @property {string} text - The description.
   *
   * @type {Object}
   */
  @property({
    reader: (value: { text: string }) => ({ text: value.text })
  })
  description: { text: string } = null;

  //----------------------------------
  //  thumbnail
  //----------------------------------

  /**
   * A data URI encoded thumbnail.
   *
   * @property {string} url - The URI pointing to the thumbnail image representing
   * the slide.
   *
   * @type {Object}
   */
  @property({
    reader: (value: { url: string }) => ({ url: value.url })
  })
  thumbnail: { url: string } = null;

  //----------------------------------
  //  viewpoint
  //----------------------------------

  /**
   * The viewpoint of the slide. This acts like a bookmark, saving a predefined
   * location or point of view from which to view the scene.
   *
   * @type {module:esri/Viewpoint}
   */
  @property({ type: Viewpoint })
  viewpoint: Viewpoint = null;

  //----------------------------------
  //  basemap
  //----------------------------------

  /**
   * The basemap of the scene. Only the {@link module:esri/Basemap#baseLayers base}
   * and {@link module:esri/Basemap#referenceLayers reference} layers of the basemap
   * are stored in a slide. The {@link module:esri/Basemap#elevationLayers elevation}
   * layers are always stored in the WebScene's {@link module:esri/WebScene#basemap basemap}.
   *
   * @type {module:esri/Basemap}
   */
  @property({
    reader: (value: string, source: SlideJSON) => {
      if (!source.baseMap || source.baseMap.baseMapLayers.length === 0) {
        return null;
      }

      // Make sure the basemap in a slide does not have any elevation layers
      let basemapJson = lang.clone(source.baseMap);
      basemapJson.elevationLayers = [];

      return Basemap.fromJSON(basemapJson);
    }
  })
  basemap: Basemap = null;

  //----------------------------------
  //  visibleLayers
  //----------------------------------

  /**
   * The visible layers of the scene. This is a collection of
   * objects that stores references (by ID) to the
   * {@link module:esri/WebScene#layers layers} that are set as `visible` when a
   * slide is applied to a {@link module:esri/views/SceneView}. The specification
   * for each object in the collection is outlined in the table below.
   *
   * @property {string} id - The ID of a {@link module:esri/layers/Layer#id layer}
   * in the {@link module:esri/WebScene#layers} that is made `visible` to the
   * {@link module:esri/views/SceneView} when the slide's properties are applied to the view.
   *
   * @type {module:esri/core/Collection}
   */
  @property({
    reader: (value: VisibleLayerJSON[]) => value.map((item: VisibleLayerJSON) => ({ id: item.id })),
    setter: Collection.referenceSetter
  })
  visibleLayers: Collection<VisibleLayer> = null;

  //----------------------------------
  //  environment
  //----------------------------------

  /**
   * Represents settings that affect the environment in which the WebScene is displayed (such as lighting).
   *
   * @type {module:esri/webscene/Environment}
   */
  @property({ type: Environment })
  environment: Environment = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Clones this object. Note that the basemap instance is cloned, but the
   * layers within the basemap are copied.
   *
   * @return {module:esri/webscene/Slide} A new {@link module:esri/webscene/Slide} instance.
   */
  clone(): Slide {
    return new Slide({
      id: this.id,
      title: {
        text: (this.title && this.title.text) || ""
      },
      description: {
        text: (this.description && this.description.text) || ""
      },
      thumbnail: {
        url: (this.thumbnail && this.thumbnail.url) || ""
      },
      viewpoint: (this.viewpoint && this.viewpoint.clone()) || null,
      basemap: (this.basemap && this.basemap.clone()) || null,
      visibleLayers: copyVisibleLayers(this.visibleLayers),
      environment: (this.environment && this.environment.clone()) || null
    });
  }

  toJSON(): SlideJSON {
    let ret: SlideJSON = {
      id: this.id,
      title: {
        text: this.title.text || ""
      },
      thumbnail: {
        url: this.thumbnail.url || ""
      },
      viewpoint: this.viewpoint.toJSON(),
      baseMap: this.basemap.toJSON(),
      visibleLayers: copyVisibleLayers(this.visibleLayers).getAll(),
      environment: this.environment.toJSON()
    };

    if (this.description != null && this.description.text) {
      ret.description = {
        text: this.description.text
      };
    }

    return ret;
  }

  static fromJSON: (json: SlideJSON) => Slide;

  static sanitizeJSON(json: any): SlideJSON {
    let visibleLayers: VisibleLayerJSON[];

    if (json.visibleLayers !== undefined && Array.isArray(json.visibleLayers)) {
      visibleLayers = copyVisibleLayers(json.visibleLayers);
    } else {
      visibleLayers = [];
    }

    let ret: SlideJSON = {
      id: json.id || "",
      title: json.title || { text: "" },
      thumbnail: json.thumbnail || { url: "" },
      viewpoint: json.viewpoint,
      baseMap: json.baseMap,
      visibleLayers: visibleLayers
    };

    if (json.description !== undefined) {
      ret.description = json.description;
    }

    if (json.environment !== undefined) {
      ret.environment = Environment.sanitizeJSON(json.environment);
    }

    return ret;
  }

  /**
   * Updates a slide from a {@link module:esri/webscene/Presentation#slides WebScene's slides}. The
   * updates made to the scene are stored on the client and do not persist via the
   * WebScene item in the portal. The option to apply these updates to the WebScene portal
   * item will be implemented in a future release.
   *
   * @param {module:esri/views/SceneView} view - The SceneView from which the slide should update.
   * @param {Object=} options - Update options. See properties below for object specifications.
   * @param {Object} options.screenshot - Screenshot options to use. See properties below for object specifications.
   * @param {String} options.screenshot.format - The image format. Default is `jpeg`.
   * @param {Number} options.screenshot.quality - The image quality (due to compression). Default is `80`.
   * @param {Number} options.screenshot.width - The image width. Default is `112`.
   * @param {Number} options.screenshot.height - The image height. Default is `61`.
   *
   * @return {Promise} When resolved, returns the updated slide.
   */
  public updateFrom(view: SceneView, options: { screenshot: ScreenshotOptions }): IPromise<Slide, void> {
    options = lang.mixin({
      screenshot: lang.mixin({
        format: "jpeg",
        quality: 80,
        width: 112,
        height: 61
      }, options && options.screenshot)
    }, options);

    this.visibleLayers.clear();
    this.visibleLayers = view.map.layers
      .filter((layer: Layer) => layer.visible)
      .map((layer: Layer) => ({ id: layer.id }));

    this.viewpoint = view.viewpoint.clone();
    this.environment.lighting = Ligthing.prototype.clone.apply(view.environment.lighting);
    this.basemap = view.map.basemap.clone();
    this.basemap.elevationLayers.clear();

    return view.takeScreenshot(options.screenshot).then(function(capture: Screenshot) {
      this.thumbnail.url = capture.dataURL;
      return this;
    }.bind(this));

  }

  /**
   * Applies a slide's settings to a {@link module:esri/views/SceneView}.
   *
   * @param {module:esri/views/SceneView} view - The SceneView the slide should be applied to.
   * @param {Object=} options - Animation options. See properties below for object specifications.
   * @param {boolean} options.animate - Indicates whether to animate the slide transition. Default is `true`.
   *
   * @example
   * //Applies the slide's settings to the view, but does
   * //not use animation when updating the viewpoint
   * slide.applyTo(view, {
   *   animate: false
   * });
   */
  public applyTo(view: SceneView, options: { animate: boolean }): void {
    options = lang.mixin({ animate: true }, options);

    let camera = this.viewpoint.camera;
    camera.fov = view.camera.fov;

    function getTime(date: Date): number[] {
      let millisecondsEpoch = date.getTime();
      let secondsToday = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
      return ([millisecondsEpoch, secondsToday]);
    }

    function setTime(date: Date, millisecondsEpoch: number, secondsToday: number): Date {
      date.setTime(millisecondsEpoch);

      date.setUTCHours(secondsToday / 3600);
      date.setUTCMinutes((secondsToday % 3600) / 60);
      date.setUTCSeconds((secondsToday % 3600) % 60);

      return date;
    }

    if (options.animate && this.get("environment.lighting.date")) {
      let vec3d = glMatrix.vec3d;

      let dateStart = new Date(view.environment.lighting.date.toString());
      let [timeStart, todStart] = getTime(dateStart);
      let [timeEnd, todEnd] = getTime(this.environment.lighting.date);

      let rcoords = view.renderCoordsHelper;

      let positionStart = [0, 0, 0];
      rcoords.toRenderCoords(view.camera.position, positionStart);

      let positionEnd = [0, 0, 0];
      rcoords.toRenderCoords(camera.position, positionEnd);

      let positionCur = [0, 0, 0];

      let date = new Date();

      let handle = view.watch("camera", function(camera: Camera) {
        rcoords.toRenderCoords(camera.position, positionCur);

        let dStart = vec3d.dist2(positionStart, positionCur);
        let dEnd = vec3d.dist2(positionEnd, positionCur);
        let f = 0;

        if (dStart + dEnd !== 0) {
          f = dStart / (dStart + dEnd);
        }

        let time = timeStart + (timeEnd - timeStart) * f;
        let tod = todStart + (todEnd - todStart) * f;

        view.environment.lighting.date = setTime(date, time, tod);
      });

      if (this._currentAnimation) {
        this._currentAnimation.stop();
        this._currentAnimation = null;
      }

      view.environmentManager.autoAdjustTimezone = false;

      // Set all the lighting properties that are not being interpolated at the
      // start
      view.environment.lighting = this.environment.lighting.clone();
      view.environment.lighting.date = dateStart;

      view.animateTo(camera).then(function(animation: ViewAnimation) {
        handle.remove();

        // Avoid resetting to true if a new animation has already started
        if (this._currentAnimation === animation) {
          view.environmentManager.autoAdjustTimezone = true;
        }

        // Make sure to snap to the final lighting state
        if (animation.state === "finished") {
          view.environment.lighting = this.environment.lighting.clone();
        }

        this._currentAnimation = animation;
      }.bind(this));
    }
    else if (options.animate) {
      view.animateTo(camera);
    }
    else {
      view.viewpoint = this.viewpoint;
    }

    //apply layer visibilities
    function applyLayerVisibility(visibleLayerIds: Collection<string>, layers: Collection<Layer>) {
      layers.forEach(function(layer) {
        if (layer instanceof GroupLayer) {
          applyLayerVisibility(visibleLayerIds, layer.layers);
        }

        if (visibleLayerIds.indexOf(layer.id) !== -1) {
          layer.visible = true;
        } else {
          layer.visible = false;
        }
      });
    }

    if (this.visibleLayers) {
      let visibleLayerIds = this.visibleLayers.map((visibleLayer: VisibleLayer) => visibleLayer.id);
      applyLayerVisibility(visibleLayerIds, view.map.layers);
    }

    // apply basemap
    if (this.basemap) {
      let basemap = this.basemap.clone();

      // Preserve elevation layers
      basemap.elevationLayers.clear();
      basemap.elevationLayers.addItems(view.get("map.basemap.elevationLayers"));

      view.map.basemap = basemap;
    }
  }

  /**
   * Creates a slide from a {@link module:esri/views/SceneView}. The
   * new slides are stored on the client and may be added to the
   * slides in the {@link module:esri/WebScene#presentation WebScene's presentation}.
   * They do not persist via the
   * WebScene item in the portal. The option to apply new slides to the WebScene portal
   * item will be implemented in a future release.
   *
   * @param {module:esri/views/SceneView} view - The SceneView from which the slide should be created.
   * @param {Object=} options - Creation options. See properties below for object specifications.
   * @param {Object} options.screenshot - Screenshot options to use. See properties below for object specifications.
   * @param {String} options.screenshot.format - The image format. Default is `jpeg`.
   * @param {Number} options.screenshot.quality - The image quality (due to compression). Default is `80`.
   * @param {Number} options.screenshot.width - The image width. Default is `112`.
   * @param {Number} options.screenshot.height - The image height. Default is `61`.
   *
   * @return {Promise} When resolved, returns the created slide.
   */
  static createFrom(view: SceneView, options: { screenshot: ScreenshotOptions }): IPromise<Slide, void> {
    let slide = new Slide();
    return slide.updateFrom(view, options);
  }
}

interface MappableVisibleLayers {
  map<T>(cb: (item: VisibleLayer) => VisibleLayer): T;
}

function copyVisibleLayers<T extends MappableVisibleLayers>(layers: T): T {
  return layers.map<T>((item) => ({ id: item.id }));
}


export = Slide;
