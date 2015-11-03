/**
 * The Portal class is part of the [ArcGIS Portal API](http://server.arcgis.com/en/portal/) 
 * which provides a way to build applications that work with content from [ArcGIS Online](http://www.arcgis.com/home/) or 
 * an [ArcGIS Portal API](http://server.arcgis.com/en/portal/). [ArcGIS Portal API](http://server.arcgis.com/en/portal/) 
 * is software from Esri that customers can deploy either on premises or in the cloud. 
 * [ArcGIS Online](http://www.arcgis.com/home/) is Esri's Software as a Service offering that 
 * represents GIS as a Service and is implemented using the same technology as ArcGIS Portal. 
 *
 * The Portal API allows application developers to work with users, groups and content hosted 
 * within ArcGIS Online or within an ArcGIS Portal. The API allows developers to build web, 
 * mobile, and desktop applications that support sharing and collaboration using web maps. 
 * Organizational developers can also use the API to build custom applications for their users. 
 *
 * The Portal class provides a view of the portal as seen by the current user, anonymous or logged in. 
 * Includes information such as the name, logo, featured items and supported protocols 
 * (http vs https) for this portal. If the user is not logged in, this call will return the default 
 * view of the portal. If the user is logged in, the view of the portal returned will be 
 * specific to the organization that the user belongs to. The default view of the portal is 
 * dependent on the culture of the user which is obtained from the users profile.
 *
 * @module esri/portal/Portal
 * @since 4.0
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared, property } from "../core/accessorSupport/typescript";
import errors = require("../core/errors");
import esriConfig = require("../config");
import esriId = require("../identity/IdentityManager");
import esriRequest = require("../request");
import JSONSupport = require("../core/JSONSupport");
import Loadable = require("../core/Loadable");
import PortalQueryResult = require("./PortalQueryResult");
import promiseUtils = require("../core/promiseUtils");
import requireUtils = require("../core/requireUtils");

import all = require("dojo/promise/all");
import dojoNS = require("dojo/_base/kernel");
import lang = require("dojo/_base/lang");

// only used for typing
import Basemap = require("../Basemap");
import PortalGroup = require("./PortalGroup");
import PortalItem = require("./PortalItem");
import PortalQueryParams = require("./PortalQueryParams");

type BasemapT = typeof Basemap;
let BasemapClass: BasemapT; // lazy loaded

interface PortalBase extends JSONSupport, Loadable<Portal> {
}
interface PortalBaseConstructor {
  new (): PortalBase;
}
function getPortalBase(): PortalBaseConstructor {
  return <any> JSONSupport;
}

// TODO
// Handle cancelLoad

@subclass([Loadable])
class Portal extends getPortalBase() {

  @shared("esri.portal.Portal")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Constants
  //
  //--------------------------------------------------------------------------

  static AUTH_MODE_ANONYMOUS = "anonymous";
  static AUTH_MODE_AUTO = "auto";
  static AUTH_MODE_IMMEDIATE = "immediate";

  //--------------------------------------------------------------------------
  //
  //  Life cycle
  //
  //--------------------------------------------------------------------------

  /**
   * @constructor
   * @alias module:esri/portal/Portal
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/Loadable
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  constructor(value?: string | Object) {
    super();
  }

  protected normalizeCtorArgs(value?: any): Object {
    if (typeof value === "string") {
      return { url: value };
    }
    return value;
  }

  protected getDefaults(params?: Object): Object {
    return lang.mixin(this.inherited(arguments), {
      url: esriConfig.portalUrl
    });
  }

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  private static _default: Portal;

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  allSSL
  //----------------------------------

  /**
   * When `true`, access to the organization's Portal resources must occur over SSL.
   *
   * @type {boolean}
   */
  @property()
  allSSL: boolean = null;

  //----------------------------------
  //  authMode
  //----------------------------------

  /**
   * The authentication mode for handling authentication when the user attempts to 
   * access a secure resource.
   *
   * Possible Value | Description
   * ---------------|------------
   * anonymous | An error will be returned when a secure resource is requested.
   * auto | The user will be signed in when a secure resource is requested.
   * immediate | The user will be signed in when the Portal is loaded.
   *
   * @type {string}
   * @default auto
   */
  @property({ value: Portal.AUTH_MODE_AUTO })
  authMode: string = null;

  //----------------------------------
  //  canSearchPublic
  //----------------------------------

  /**
   * When `true`, the organization's public items, groups and users are included in search queries. 
   * When `false`, no public items outside of the organization are included. However, 
   * public items which are part of the organization are included.
   *
   * @type {boolean}
   */
  @property({ value: true })
  canSearchPublic: boolean = null;

  //----------------------------------
  //  canSharePublic
  //----------------------------------

  /**
   * When `true`, members of the organization can share resources outside the organization.
   *
   * @type {boolean}
   */
  @property({ value: true })
  canSharePublic: boolean = null;

  //----------------------------------
  //  defaultBasemap
  //----------------------------------

  /**
   * The default basemap the portal displays in the map viewer. 
   * 
   * @type {module:esri/Basemap}
   */
  @property()
  defaultBasemap: Basemap = null;

  protected _defaultBasemapReader(value: any): Basemap {
    return value ? BasemapClass.fromJSON(value) : null;
  }

  //----------------------------------
  //  extraQuery
  //----------------------------------

  /**
   * @ignore
   * @readonly
   * @type {string}
   */
  @property({ dependsOn: ["id", "canSearchPublic"], readOnly: true })
  extraQuery: string = null;

  protected _extraQueryGetter(): string {
    return (this.id && !this.canSearchPublic)
        ? " AND orgid:" + this.id
        : null;
  }

  //----------------------------------
  //  httpPort
  //----------------------------------

  /**
   * The port used by the portal for HTTP communication.
   *
   * @type {number}
   */
  @property()
  httpPort: number = null;

  //----------------------------------
  //  httpsPort
  //----------------------------------

  /**
   * The port used by the portal for HTTPS communication.
   * 
   * @type {number}
   */
  @property()
  httpsPort: number = null;

  //----------------------------------
  //  id
  //----------------------------------

  /**
   * The id of the organization that owns this portal. If `null` then this is the 
   * default portal for anonymous and non-organizational users.
   *
   * @type {string}
   */
  @property({ value: null })
  id: string = null;

  //----------------------------------
  //  isPortal
  //----------------------------------

  /**
   * Indicates if the portal is on premises.
   * 
   * @type {boolean}
   */
  @property()
  isPortal: boolean = null;
    
  //----------------------------------
  //  loaded
  //----------------------------------
      
  /**
  * Indicates wheather the portal's resources have loaded. When `true`,
  * all the properties of the object can be accessed.
  *
  * @name loaded
  * @instance
  * @type {boolean}
  * @default false
  * @readonly             
  */     

  //----------------------------------
  //  portalHostname
  //----------------------------------

  /**
   * The portal host's URL.
   *
   * @type {string}
   */
  @property()
  portalHostname: string = null;

  //----------------------------------
  //  restUrl
  //----------------------------------

  /**
   * The REST url for the portal.
   *
   * @readonly
   * @type {string}
   */
  @property({ dependsOn: ["url"], readOnly: true })
  restUrl: string = null;

  protected _restUrlGetter(): string {
    let url = this.url;
    if (url) {
      const idx = url.indexOf("/sharing");
      if (idx > 0) {
        url = url.substring(0, idx);
      }
      else {
        url = this.url.replace(/\/+$/, "");
      }
      url += "/sharing/rest";
    }
    return url;
  }

  //----------------------------------
  //  stylesGroupQuery
  //----------------------------------

  /**
   * @ignore
   * @type {string}
   */
  @property()
  stylesGroupQuery: string = null;

  //----------------------------------
  //  url
  //----------------------------------

  /**
   * The URL to the portal instance. Setting the location of the portal instance via 
   * {@link module:esri/config#portalUrl esriConfig.portalUrl} 
   * should be used in favor of setting it directly on this property.
   * 
   * When using an on premise portal, the syntax should look something like 
   * the following (replace `{HOSTNAME}` with the 
   * hostname of the server hosting your on premise portal instance): 
   * 
   * `https://{HOSTNAME}.esri.com/arcgis`
   * 
   * @type {string}
   * 
   * @default {@link module:esri/config#portalUrl esriConfig.portalUrl}
   */
  @property()
  url: string = null;

  //----------------------------------
  //  user
  //----------------------------------

  /**
   * Information for the accessing user is returned only when a token is 
   * passed in. Group information is not given.
   * 
   * @type {PortalUser}
   * @ignore
   */
  @property()
  //@property({ type: null })
  user: any = null;

  //--------------------------------------------------------------------------
  //
  //  Overridden Methods
  //
  //--------------------------------------------------------------------------

  load(): Portal {
    const promise = promiseUtils.resolve().then(() => {
      return this.authMode === Portal.AUTH_MODE_IMMEDIATE
          ? esriId.getCredential(this.restUrl)
          : null;
    }).then(() => {
      return requireUtils.whenOne<BasemapT>(require, "../Basemap");
    }).then((BasemapMod) => {
      BasemapClass = BasemapMod;
    }).then(() => {
      return this._fetchSelf();
    }).then((self) => {
      this.read(self);
    });
    this.addResolvingPromise(promise);
    return this;
  }

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * @ignore
   * @returns {{}}
   */
  toJSON(): Object {
    throw errors.Internal.notYetImplemented();
  }

  static fromJSON: (json: Object) => Portal;

  /**
   * Returns a cached default Portal instance.
   *
   * @return {module:esri/portal/Portal}
   */
  static getDefault(): Portal {
    if (!Portal._default) {
      Portal._default = new Portal();
    }
    return Portal._default;
  }

  /**
   * Executes a query against the Portal to return an array of 
   * {@link module:esri/portal/PortalGroup} objects that match the input query.
   *
   * @param {module:esri/portal/PortalQueryParams} queryParams - The input query parameters
   *  defined in {@link module:esri/portal/PortalQueryParams}.
   *
   * @return {Promise} When resolved, resolves to an instance of {@link module:esri/portal/PortalQueryResult}
   * which contains a `results` array of {@link module:esri/portal/PortalGroup} objects representing
   * all the groups that match the input query.
   *
   * @see module:esri/portal/PortalQueryResult
   */
  queryGroups(queryParams: PortalQueryParams): IPromise<PortalQueryResult<PortalGroup>, any> {
    return this._queryPortal("/community/groups", queryParams, "PortalGroup");
  }

  /**
   * Executes a query against the Portal to return an array of {@link module:esri/portal/PortalItem} 
   * objects that match the input query.
   * 
   * @param {module:esri/portal/PortalQueryParams} queryParams - The input query parameters
   *  defined in {@link module:esri/portal/PortalQueryParams}.
   *
   * @return {Promise} When resolved, resolves to an instance of {@link module:esri/portal/PortalQueryResult}
   * which contains a `results` array of {@link module:esri/portal/PortalItem} objects representing
   * all the items that match the input query.
   *
   * @see module:esri/portal/PortalQueryResult
   */
  queryItems(queryParams: PortalQueryParams): IPromise<PortalQueryResult<PortalItem>, any> {
    return this._queryPortal("/search", queryParams, "PortalItem");
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  protected _fetchSelf(): IPromise<any, any> {
    const selfUrl = this.restUrl + "/portals/self?culture=" + dojoNS.locale;
    return this._request(selfUrl);
  }

  protected _queryPortal(path: string, queryParams: PortalQueryParams, resultClassModule?: string): IPromise<PortalQueryResult<any>, any> {
    const doRequest = (ResultClass?: any) => {
      return this._request(this.restUrl + path, queryParams.toQueryParams(this)).then((result: any) => {
        const nextQueryParams = queryParams.clone();
        nextQueryParams.start = result.nextStart;
        return new PortalQueryResult({
          nextQueryParams,
          queryParams,
          total: result.total,
          results: Portal._resultsToTypedArray(ResultClass, { portal: this }, result)
        });
      }).then(function (result) {
        return all(result.results).always(() => result);
      });
    };

    if (resultClassModule) {
      return requireUtils.whenOne(require, "./" + resultClassModule).then((ResultClass: any) => {
        return doRequest(ResultClass);
      });
    }
    else {
      return doRequest();
    }
  }

  protected _normalizeSSL(url: string): string {
    // This seems to be required on every request since some portals do not require ssl, but a request to the
    // currentProtocol may or may not be accessed over ssl.

    const currentProtocol = window.location.protocol; // TODO: remove use of window
    if (!this.isPortal) {
      return (this.allSSL || currentProtocol.indexOf("https:") !== -1) ? url.replace("http:", "https:") : url;
    }
    else {
      // Is onPremise Portal could be using different ports
      const onPremiseUrl = Portal._getLocation(url);
      // Only adjust ports for urls to the portal over non-standard ports ie not 80 or 443
      if (this.portalHostname.toLowerCase().indexOf(onPremiseUrl.hostname.toLowerCase()) > -1 &&
          (onPremiseUrl.port && (onPremiseUrl.port !== "80" && onPremiseUrl.port !== "443"))) {
        let pathName = onPremiseUrl.pathname;
        if (pathName.indexOf("/") !== 0) {
          pathName = "/" + pathName; //https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/938
        }
        if (this.allSSL || currentProtocol.indexOf("https:") > -1) {
          return "https://" + onPremiseUrl.hostname +
              ((this.httpsPort && this.httpsPort !== 443) ? (":" + this.httpsPort) : "") +
              pathName + onPremiseUrl.search;
        }
        else {
          return "http://" + onPremiseUrl.hostname +
              ((this.httpPort && this.httpPort !== 80) ? (":" + this.httpPort) : "") +
              pathName + onPremiseUrl.search;
        }
      }
      else {
        return (this.allSSL || currentProtocol.indexOf("https:") !== -1) ? url.replace("http:", "https:") : url;
      }
    }
  }

  //normalizeUrl(url: string) {
  //  const token = this.esriPortal.currentToken;
  //  return url.indexOf("null") !== -1 ? null : this.useSSL(window.location.protocol, (token ? url + (url.indexOf("?") !== -1 ? "&" : "?") + ("token=" + token) : url));
  //}

  //requestToTypedArray(url: string, params: any, options: any, type: any, parent: any) {
  //  //return portalResult(this.request(url, params, options).then(lang.partial(PortalUtil.resultsToTypedArray, type, parent))); TODO
  //}

  /**
   * esriRequest wrapper
   * @param url
   * @param params TODO: type this
   * @returns {IPromise<any, any>}
   * @private
   */
  _request(url: any, params?: any): IPromise<any, any> {
    let form: any;
    let handleAs: string;

    if (params) {
      if (params.portal) {
        delete params.portal;
      }

      if (params.form) {
        form = params.form;
        delete params.form;
      }

      if (params.handleAs) {
        handleAs = params.handleAs;
        delete params.handleAs;
      }
    }

    let content = lang.mixin({ f: "json" }, params);
    let options = {
      disableIdentityLookup: this.authMode === Portal.AUTH_MODE_ANONYMOUS
    };

    return esriRequest({
      callbackParamName: "callback",
      content,
      form,
      handleAs,
      timeout: 0,
      url: this._normalizeSSL(url.url || url) // TODO: remove use of url.url
    }, options);
  }

  private static _getLocation(href: string) {
    const parser = document.createElement("a"); // TODO: remove use of document
    parser.href = href;
    return {
      protocol: parser.protocol, // => "http:"
      hostname: parser.hostname, // => "example.com"
      port: parser.port,     // => "3000"
      pathname: parser.pathname, // => "/pathname/"
      search: parser.search,   // => "?search=test"
      hash: parser.hash,     // => "#hash"
      host: parser.host     // => "example.com:3000"
    };
  }

  private static _resultsToTypedArray(Type: any, mixin: any, results: any): any[] {
    let ret: any[];
    if (results) {
      ret = results.listings ||
          results.notifications ||
          results.userInvitations ||
          results.tags ||
          results.items ||
          results.groups ||
          results.comments ||
          results.provisions ||
          results.results ||
          results;
      if (Type || mixin) {
        ret = ret.map((result: any) => {
          const instance = lang.mixin(Type ? Type.fromJSON(result) : result, mixin);
          if (typeof instance.load === "function") {
            instance.load();
          }
          return instance;
        });
      }
    }
    else {
      ret = [];
    }
    return ret;
  }

  //static clearFieldsFromObject(flds: string[] | Object, obj: Object) {
  //  if (flds instanceof Array) {
  //    const l = flds.length;
  //    for (let i = 0; i < l; i++) {
  //      delete obj[flds[i]];
  //    }
  //  }
  //  else {
  //    for (let fld in flds) {
  //      if (flds.hasOwnProperty(fld)) {
  //        delete obj[fld];
  //      }
  //    }
  //  }
  //  return obj;
  //}
}

export = Portal;
