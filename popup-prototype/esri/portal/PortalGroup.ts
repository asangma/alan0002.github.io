/**
 * The group resource represents a group within the {@link module:esri/portal/Portal}. A group resource represents 
 * a group (e.g., "San Bernardino Fires"). The visibility of the group to other users 
 * is deteremined by the [access](#access) property. If the group is private, no one 
 * except the administrators and the members of the group will be able to see it. If the 
 * group is shared with an organization, then all members of the organization will be able 
 * to find the group. View the ArcGIS Portal API REST documentation for the 
 * [Group](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Group/02r30000006m000000/) 
 * for more details.
 *
 * @module esri/portal/PortalGroup
 * @since 4.0
 * @noconstructor
 * @see module:esri/portal/Portal
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, property, shared } from "../core/accessorSupport/typescript";
import errors = require("../core/errors");
import JSONSupport = require("../core/JSONSupport");
import Portal = require("./Portal");
import PortalItem = require("./PortalItem");
import PortalQueryParams = require("./PortalQueryParams");
import PortalQueryResult = require("./PortalQueryResult");

interface Members {
  admins: string[];
  owner: string;
  users: string[];
}

@subclass()
class PortalGroup extends JSONSupport {

  @shared("esri.portal.PortalGroup")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Life cycle
  //
  //--------------------------------------------------------------------------

  /**
   * @constructor
   * @alias module:esri/portal/PortalGroup
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
  //  access
  //----------------------------------

  /**
   * The access privileges on the group which determines who can see and access the group. 
   *
   * **Known Values:** private | org | public
   *
   * @type {string}
   */
  @property()
  access: string = null;

  //----------------------------------
  //  created
  //----------------------------------

  /**
   * The date the group was created.
   *
   * @type {Date}
   */
  @property({ type: Date })
  created: Date = null;

  //----------------------------------
  //  description
  //----------------------------------

  /**
   * A detailed description of the group.
   *
   * @type {string}
   */
  @property()
  description: string = null;

  //----------------------------------
  //  id
  //----------------------------------

  /**
   * The unique id for the group.
   *
   * @type {string}
   */
  @property()
  id: string = null;

  //----------------------------------
  //  isInvitationOnly
  //----------------------------------

  /**
   * If set to `true`, then users will not be able to apply to join the group.
   *
   * @type {boolean}
   */
  @property()
  isInvitationOnly: boolean = null;

  //----------------------------------
  //  modified
  //----------------------------------

  /**
   * The date the group was last modified.
   *
   * @type {Date}
   */
  @property({ type: Date })
  modified: Date = null;

  //----------------------------------
  //  owner
  //----------------------------------

  /**
   * The username of the group's owner.
   *
   * @type {string}
   */
  @property()
  owner: string = null;

  //----------------------------------
  //  portal
  //----------------------------------

  /**
   * The portal associated with the group.
   *
   * @type {module:esri/portal/Portal}
   */
  @property({ type: Portal })
  portal: Portal = null;

  //----------------------------------
  //  snippet
  //----------------------------------

  /**
   * A short summary that describes the group.
   *
   * @type {string}
   */
  @property()
  snippet: string = null;

  //----------------------------------
  //  tags
  //----------------------------------

  /**
   * User defined tags that describe the group.
   *
   * @type {string[]}
   */
  @property()
  tags: string[] = null;

  //----------------------------------
  //  title
  //----------------------------------

  /**
   * The title of the group. This is the name that is displayed to users. It is also 
   * used to refer to the group. Every group must have a title and it must be unique.
   *
   * @type {string}
   */
  @property()
  title: string = null;

  //----------------------------------
  //  url
  //----------------------------------

  /**
   * The url to the group.
   *
   * @readonly
   * @type {string}
   */
  @property({ dependsOn: ["portal.restUrl"], readOnly: true })
  url: string = null;

  protected _urlGetter(): string {
    const restUrl = this.get("portal.restUrl");
    return restUrl ? restUrl + "/community/groups/" + this.id : null;
  }

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Fetches the current members of the group. This method is only available to members or 
   * administrators of the group. View the ArcGIS Portal API REST documentation 
   * for the [Group Users](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Group_Users/02r30000006p000000/) 
   * for more details.
   *
   * @return {Promise} Resolves to an object with the following properties:
   * Property | Type | Description
   * ---------|------|------------
   * admins | String[] | An array containing the user names for each administrator of the group.
   * owner | String | The user name of the owner of the group.
   * users | String[] | An array containing the user names for each user in the group.
   */
  fetchMembers(): IPromise<Members, any> {
    return this.portal._request(this.url + "/users");
  }

  /**
   * @ignore
   * @return {{}}
   */
  toJSON(): Object {
    throw errors.Internal.notYetImplemented();
  }

  static fromJSON: (json: Object) => PortalGroup;

  /**
   * Executes a query against the group to return an array of {@link module:esri/portal/PortalItem} objects 
   * that match the input query.
   *
   * @param {module:esri/portal/PortalQueryParams} queryParams - The input query parameters
   *  defined in {@link module:esri/portal/PortalQueryParams}.
   *
   * @return {Promise} When resolved, resolves to an instance of {@link module:esri/portal/PortalQueryResult}
   * which contains a `results` array of {@link module:esri/portal/PortalItem} objects representing
   * all the items that match the input query.
   */
  queryItems(queryParams?: PortalQueryParams): IPromise<PortalQueryResult<PortalItem>, any> {
    queryParams = queryParams ? queryParams.clone() : new PortalQueryParams();
    queryParams.query = "group:" + this.id + (queryParams.query ? (" " + queryParams.query) : "");
    return this.portal.queryItems(queryParams);
  }
}

export = PortalGroup;
