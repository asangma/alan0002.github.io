/**
 * Represents settings that affect the environment in
 * which the {@link module:esri/WebScene} is displayed (such as lighting). It is part of the
 * {@link module:esri/WebScene#initialState initial state} of the WebScene
 * as well as {@link module:esri/webscene/Presentation#slides slides} in the presentation.
 *
 * @module esri/webscene/Environment
 * @see module:esri/webscene/InitialState
 * @see module:esri/webscene/Slide
 * @since 4.0
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import JSONSupport = require("../core/JSONSupport");

import {
  subclass,
  shared,
  property
} from "../core/accessorSupport/typescript";

import Lighting = require("./Lighting");

import { Environment as EnvironmentJSON } from "./portal/jsonTypes";

@subclass()
class Environment extends JSONSupport {
  @shared("esri.webscene.Environment")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  /**
   * @extends module:esri/core/Accessor
   * @constructor
   * @alias module:esri/webscene/Environment
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
   constructor(obj?: any) {
     super(obj);
   }

   getDefaults(): Object {
     return {
       lighting: {}
     };
   }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  lighting
  //----------------------------------

  /**
   * Settings for defining the lighting of the scene.
   *
   * @type {module:esri/webscene/Lighting}
   */
  @property({ type: Lighting })
  lighting: Lighting = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Clones this object.
   *
   * @return {module:esri/webscene/Environment} Creates a clone of the instance calling this method.
   */
  clone(): Environment {
    return new Environment({
      lighting: this.lighting.clone()
    });
  }

  toJSON(): EnvironmentJSON {
    return {
      lighting: this.lighting.toJSON()
    };
  }

  static fromJSON: (json: EnvironmentJSON) => Environment;

  static sanitizeJSON(json: any): EnvironmentJSON {
    return {
      lighting: json.lighting ? Lighting.sanitizeJSON(json.lighting) : (new Lighting()).toJSON()
    };
  }
}

export = Environment;
