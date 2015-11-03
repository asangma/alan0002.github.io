/**
 * Represents the result object returned from a portal query.
 *
 * @module esri/portal/PortalQueryResult
 * @since 4.0
 * @noconstructor
 * @see {@link module:esri/portal/Portal#queryGroups Portal.queryGroups()}
 * @see {@link module:esri/portal/Portal#queryItems Portal.queryItems()}
 * @see {@link module:esri/portal/PortalGroup#queryItems PortalGroup.queryItems()}
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, property, shared } from "../core/accessorSupport/typescript";
import Accessor = require("../core/Accessor");
import PortalQueryParams = require("./PortalQueryParams");

@subclass()
class PortalQueryResult<T> extends Accessor {

  @shared("esri.portal.PortalQueryResult")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Life cycle
  //
  //--------------------------------------------------------------------------

  /**
   * @constructor
   * @alias module:esri/portal/PortalQueryResult
   * @extends module:esri/core/Accessor
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  constructor(properties?: Object) {
    super();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  nextQueryParams
  //----------------------------------

  /**
   * The query parameters for the next set of results.
   *
   * @type {module:esri/portal/PortalQueryParams}
   */
  @property()
  nextQueryParams: PortalQueryParams = null;

  //----------------------------------
  //  queryParams
  //----------------------------------

  /**
   * The query parameters for the first set of results.
   * 
   * @type {module:esri/portal/PortalQueryParams}
   */
  @property()
  queryParams: PortalQueryParams = null;

  //----------------------------------
  //  results
  //----------------------------------

  /**
   * An array of result item objects.
   * 
   * @type {Object[]}
   */
  @property()
  results: Array<T> = null;

  //----------------------------------
  //  total
  //----------------------------------

  /**
   * The total number of results. The maximum number of results is limited to 1000.
   * 
   * @type {number}
   */
  @property()
  total: number = null;
}

export = PortalQueryResult;
