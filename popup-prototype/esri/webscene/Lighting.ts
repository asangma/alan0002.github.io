/**
 * The lighting object is part of the {@link module:esri/webscene/Environment}
 * and contains information relating to how a {@link module:esri/views/SceneView}
 * is lit.
 *
 * @module esri/webscene/Lighting
 * @since 4.0
 * @see module:esri/webscene/Environment
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import JSONSupport = require("../core/JSONSupport");

import {
  subclass,
  shared,
  property,
  ClassMetaData
} from "../core/accessorSupport/typescript";

const DATE_TIME_DEFAULT = 1426420800000;

import { Lighting as LightingJSON } from "./portal/jsonTypes";

@subclass()
class Lighting extends JSONSupport {
  @shared("esri.webscene.Lighting")
  declaredClass: string;

  @shared({
    reader: {
      exclude: ["datetime"],
      add: ["date"]
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
   * @mixes module:esri/core/Promise
   * @mixes module:esri/core/Evented
   * @constructor
   * @alias module:esri/webscene/Lighting
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  constructor(obj?: any) {
    super(obj);
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  date
  //----------------------------------

  /**
   * The time and date for which the sun position and light direction is computed.
   *
   * @type {Date}
   * @default null
   */
  @property({
    type: Date,
    value: null,
    reader: (value: number, source: LightingJSON) => {
      return (source.datetime != null && new Date(source.datetime)) || null;
    }
  })
  date: Date = null;

  //----------------------------------
  //  directShadows
  //----------------------------------

  /**
   * Indicates whether direct shadows are enabled.
   *
   * @type {boolean}
   * @default false
   */
  @property({
    value: false
  })
  directShadows: boolean = null;

  //----------------------------------
  //  ambientOcclusion
  //----------------------------------

  /**
   * Indicates whether ambient occlusion is enabled. Ambient occlusion imitates the inter-reflection
   * of light between surfaces, providing a more realistic feel to the scene.
   * It enhances the perceptibility of edges on 3D objects.
   *
   * @type {boolean}
   * @default false
   */

  @property({
    value: false
  })
  ambientOcclusion: boolean = null;

  //----------------------------------
  //  displayUTCOffset
  //----------------------------------

  /**
   * The UTC timezone offset in hours that should be displayed in the UI to represent
   * the date. This value does not have an impact on the actual lighting of the scene.
   *
   * @type {number}
   * @default null
   */
  @property({
    value: null
  })
  displayUTCOffset: number = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Clones this object.
   *
   * @return {module:esri/webscene/Lighting} Creates a new clone of the instance calling this method.
   */
  clone(): Lighting {
    return new Lighting({
      date: this.date != null ? new Date(this.date.getTime()) : null,
      directShadows: !!this.directShadows,
      ambientOcclusion: !!this.ambientOcclusion,
      displayUTCOffset: this.displayUTCOffset != null ? this.displayUTCOffset : null
    });
  }

  toJSON(): LightingJSON {
    let json: LightingJSON = {};

    let datetime = this.date.getTime();

    if (datetime !== DATE_TIME_DEFAULT) {
      json.datetime = datetime;
    }

    if (this.directShadows) {
      json.directShadows = true;
    }

    if (this.ambientOcclusion) {
      json.ambientOcclusion = true;
    }

    if (this.displayUTCOffset != null) {
      json.displayUTCOffset = this.displayUTCOffset;
    }

    return json;
  }

  static fromJSON: (json: LightingJSON) => Lighting;

  static sanitizeJSON(json: any): LightingJSON {
    let ret: LightingJSON = {
      datetime: json.datetime
    };

    if (json.directShadows !== undefined) {
      ret.directShadows = !!json.directShadows;
    }

    if (json.ambientOcclusion !== undefined) {
      ret.ambientOcclusion = !!json.ambientOcclusion;
    }

    if (json.displayUTCOffset !== undefined) {
      ret.displayUTCOffset = json.displayUTCOffset;
    }

    return ret;
  }
}

export = Lighting;
