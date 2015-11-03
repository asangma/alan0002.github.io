/**
 * The query parameters used for a {@link module:esri/portal/Portal} query operation.
 *
 * @module esri/portal/PortalQueryParams
 * @since 4.0
 * @see {@link module:esri/portal/Portal#queryGroups Portal.queryGroups()}
 * @see {@link module:esri/portal/Portal#queryItems Portal.queryItems()}
 * @see {@link module:esri/portal/PortalGroup#queryItems PortalGroup.queryItems()}
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, property, shared } from "../core/accessorSupport/typescript";
import Accessor = require("../core/Accessor");
import Extent = require("../geometry/Extent");
import Portal = require("./Portal");
import { project } from "../geometry/support/webMercatorUtils";
import SpatialReference = require("../geometry/SpatialReference");

import lang = require("dojo/_base/lang");

@subclass()
class PortalQueryParams extends Accessor {

  @shared("esri.portal.PortalQueryParams")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Life cycle
  //
  //--------------------------------------------------------------------------

  /**
   * @constructor
   * @alias module:esri/portal/PortalQueryParams
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
  //  disableExtraQuery
  //----------------------------------

  /**
   * @ignore
   * @type {boolean}
   */
  @property({ value: false })
  disableExtraQuery: boolean = null;

  //----------------------------------
  //  extent
  //----------------------------------

  /**
   * Only relevant when querying for {@link module:esri/portal/PortalItem PortalItems}. 
   * When specified, restricts the results of the query to the extent defined here.
   *
   * The {@link module:esri/geometry/Extent#spatialReference spatial reference} of the 
   * given extent must be WGS84 (wkid 4326) or Web Mercator (wkid 3857).
   *
   * @type {module:esri/geometry/Extent}
   */
  @property({ type: Extent })
  extent: Extent = null;

  //----------------------------------
  //  num
  //----------------------------------

  /**
   * The maximum number of results to be included in the 
   * {@link module:esri/portal/PortalQueryResult#results result} set response. 
   * The maximum value allowed is `100`. The [start](#start) property combined
   * with the `num` property can be used to paginate the search results.
   *
   * @type {number}
   * @default 10
   */
  @property({ value: 10 })
  num: number = null;

  //----------------------------------
  //  query
  //----------------------------------

  /**
   * The query string used for the search. View the 
   * [ArcGIS REST API Search Reference](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000mn000000) 
   * for details on constructing a valid query.
   *
   * @type {string}
   * @see [ArcGIS REST API Search Reference](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000mn000000)
   */
  @property()
  query: string = null;

  //----------------------------------
  //  sortField
  //----------------------------------

  /**
   * A comma separated list of fields to sort by.
   *
   * **Known Values:** title | created | type | owner | avgRating | numRatings | numComments | numViews
   * @type {string}
   */
  @property()
  sortField: string = null;

  //----------------------------------
  //  sortOrder
  //----------------------------------

  /**
   * The order in which to sort the results.
   *
   * Possible Value | Description
   * ---------------|------------
   * asc | Sort the results in ascending order.
   * desc | Sort the results in descending order.
   *
   * @type {string}
   * @default asc
   */
  @property({ value: "asc" })
  sortOrder: string = null;

  protected _sortOrderSetter(value: string, oldValue: string): string {
    if (value === "asc" || value === "desc") {
      return value;
    }
    return oldValue;
  }

  //----------------------------------
  //  start
  //----------------------------------

  /**
   * The index of the first entry in the result set response. The index is 1-based. 
   * The [start](#start) property, along with the [num](#num) property can be used 
   * to paginate the search results.
   *
   * @type {number}
   * @default 1
   */
  @property({ value: 1 })
  start: number = null;

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Creates a copy of the instance of PortalQueryParams that calls this method.
   *
   * @return {module:esri/portal/PortalQueryParams} A clone of the instance that called this method.
   */
  clone(): PortalQueryParams {
    return new PortalQueryParams({
      disableExtraQuery: this.disableExtraQuery,
      extent: this.extent ? this.extent.clone() : null,
      num: this.num,
      query: this.query,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      start: this.start
    });
  }

  toQueryParams(portal: Portal, defaultValues?: any): any {
    let bbox: string;
    if (this.extent) {
      const extent = project(this.extent, SpatialReference.WGS84);
      if (extent) {
        bbox = `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`;
      }
    }

    let q = this.query;
    if (!this.disableExtraQuery && portal.extraQuery) {
      q = "(" + q + ")" + portal.extraQuery;
    }

    return lang.mixin(defaultValues, {
      bbox,
      q,
      num: this.num,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      start: this.start
    });
  }
}

export = PortalQueryParams;
