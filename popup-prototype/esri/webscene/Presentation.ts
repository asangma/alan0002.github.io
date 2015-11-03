/**
 * A presentation contains a {@link module:esri/core/Collection} of
 * {@link module:esri/webscene/Slide slides} that allows users to quickly
 * navigate to predefined settings of a {@link module:esri/views/SceneView}.
 *
 * @module esri/webscene/Presentation
 * @since 4.0
 * @see module:esri/webscene/Slide
 * @see [Sample - WebScene slides](../sample-code/webscene-slides/index.html)
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import JSONSupport = require("../core/JSONSupport");
import Collection = require("../core/Collection");

import {
  subclass,
  property,
  shared
} from "../core/accessorSupport/typescript";

import Slide = require("./Slide");

import {
  Presentation as PresentationJSON,
  Slide as SlideJSON
} from "./portal/jsonTypes";

@subclass()
class Presentation extends JSONSupport {
  @shared("esri.webscene.Presentation")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  /**
   * @extends module:esri/core/Accessor
   * @constructor
   * @alias module:esri/webscene/Presentation
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  constructor(obj?: any) {
    super(obj);
  }

  getDefaults(): Object {
    return {
      slides: []
    };
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  slides
  //----------------------------------

  /**
   * A collection of {@link module:esri/webscene/Slide slides} that bookmark
   * {@link module:esri/Viewpoint viewpoints}, visible layers, and other settings
   * previously defined in a {@link module:esri/WebScene}.
   *
   * @see {@link module:esri/webscene/Slide}
   * @type {module:esri/core/Collection}
   * @see [Sample - WebScene slides](../sample-code/webscene-slides/index.html)
   */
  @property({
    reader: (value: SlideJSON[]) => {
      return value.map((item) => Slide.fromJSON(item));
    },
    setter: Collection.referenceSetter
  })
  slides: Collection<Slide> = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Creates a clone of this object.
   *
   * @return {module:esri/webscene/Presentation} A clone of the instance calling this method.
   */
  clone(): Presentation {
    return new Presentation({
      slides: this.slides.map((slide) => slide.clone())
    });
  }

  toJSON(): PresentationJSON {
    return {
      slides: this.slides.map((slide) => slide.toJSON()).getAll()
    };
  }

  static fromJSON: (json: PresentationJSON) => Presentation;

  static sanitizeJSON(json: any): PresentationJSON {
    let slides: SlideJSON[];

    if (json.slides !== undefined && Array.isArray(json.slides)) {
      slides = json.slides.map((slide: SlideJSON) => Slide.sanitizeJSON(slide));
    } else {
      slides = [];
    }

    return {
      slides: slides
    };
  }
}

export = Presentation;
