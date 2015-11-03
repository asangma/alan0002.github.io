/**
 * Represents the initial viewing state of the {@link module:esri/WebScene}
 * when displayed in a {@link module:esri/views/SceneView}. It contains the
 * initial [viewpoint](#viewpoint) as well as the initial [environment](#environment) settings.
 *
 * @module esri/webscene/InitialState
 * @since 4.0
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import Viewpoint = require("../Viewpoint");
import JSONSupport = require("../core/JSONSupport");

import {
  subclass,
  shared,
  property
} from "../core/accessorSupport/typescript";

import Environment = require("./Environment");

import { InitialState as InitialStateJSON } from "./portal/jsonTypes";

@subclass()
class InitialState extends JSONSupport {
  @shared("esri.webscene.InitialState")
  declaredClass: string;

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
   * @alias module:esri/webscene/InitialState
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  constructor(obj?: any) {
    super(obj);
  }

  getDefaults(): Object {
    return {
      environment: {}
    };
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  viewpoint
  //----------------------------------

  /**
   * The initial viewpoint of the {@link module:esri/WebScene}.
   *
   * @type {module:esri/Viewpoint}
   */
  @property({
    value: null,
    type: Viewpoint
  })
  viewpoint: Viewpoint = null;

  //----------------------------------
  //  environment
  //----------------------------------

  /**
   * The initial environment settings of the {@link module:esri/WebScene}.
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
   * Clones this object.
   *
   * @return {module:esri/webscene/InitialState} Creates a clone of the instance that called this method.
   */
  clone(): InitialState {
    return new InitialState({
      viewpoint: this.viewpoint ? this.viewpoint.clone() : null,
      environment: this.environment.clone()
    });
  }

  toJSON(): InitialStateJSON {
    let ret: InitialStateJSON = {
      environment: this.environment.toJSON()
    };

    if (this.viewpoint) {
      ret.viewpoint = this.viewpoint.toJSON();
    }

    return ret;
  }

  static fromJSON: (json: InitialStateJSON) => InitialState;

  static sanitizeJSON(json: any): InitialStateJSON {
    let ret: InitialStateJSON = {
    };

    if (json.environment !== undefined) {
      ret.environment = Environment.sanitizeJSON(json.environment);
    }

    if (json.viewpoint !== undefined) {
      ret.viewpoint = json.viewpoint;
    }

    return ret;
  }
}

export = InitialState;
