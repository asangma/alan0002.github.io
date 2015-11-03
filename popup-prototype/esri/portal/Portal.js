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
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/accessorSupport/typescript", "../core/errors", "../config", "../identity/IdentityManager", "../request", "../core/JSONSupport", "../core/Loadable", "./PortalQueryResult", "../core/promiseUtils", "../core/requireUtils", "dojo/promise/all", "dojo/_base/kernel", "dojo/_base/lang"], function (require, exports, __extends, __decorate, typescript_1, errors, esriConfig, esriId, esriRequest, JSONSupport, Loadable, PortalQueryResult, promiseUtils, requireUtils, all, dojoNS, lang) {
    var BasemapClass; // lazy loaded
    function getPortalBase() {
        return JSONSupport;
    }
    // TODO
    // Handle cancelLoad
    var Portal = (function (_super) {
        __extends(Portal, _super);
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
        function Portal(value) {
            _super.call(this);
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
            this.allSSL = null;
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
            this.authMode = null;
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
            this.canSearchPublic = null;
            //----------------------------------
            //  canSharePublic
            //----------------------------------
            /**
             * When `true`, members of the organization can share resources outside the organization.
             *
             * @type {boolean}
             */
            this.canSharePublic = null;
            //----------------------------------
            //  defaultBasemap
            //----------------------------------
            /**
             * The default basemap the portal displays in the map viewer.
             *
             * @type {module:esri/Basemap}
             */
            this.defaultBasemap = null;
            //----------------------------------
            //  extraQuery
            //----------------------------------
            /**
             * @ignore
             * @readonly
             * @type {string}
             */
            this.extraQuery = null;
            //----------------------------------
            //  httpPort
            //----------------------------------
            /**
             * The port used by the portal for HTTP communication.
             *
             * @type {number}
             */
            this.httpPort = null;
            //----------------------------------
            //  httpsPort
            //----------------------------------
            /**
             * The port used by the portal for HTTPS communication.
             *
             * @type {number}
             */
            this.httpsPort = null;
            //----------------------------------
            //  id
            //----------------------------------
            /**
             * The id of the organization that owns this portal. If `null` then this is the
             * default portal for anonymous and non-organizational users.
             *
             * @type {string}
             */
            this.id = null;
            //----------------------------------
            //  isPortal
            //----------------------------------
            /**
             * Indicates if the portal is on premises.
             *
             * @type {boolean}
             */
            this.isPortal = null;
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
            this.portalHostname = null;
            //----------------------------------
            //  restUrl
            //----------------------------------
            /**
             * The REST url for the portal.
             *
             * @readonly
             * @type {string}
             */
            this.restUrl = null;
            //----------------------------------
            //  stylesGroupQuery
            //----------------------------------
            /**
             * @ignore
             * @type {string}
             */
            this.stylesGroupQuery = null;
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
            this.url = null;
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
            this.
            //@property({ type: null })
            user = null;
        }
        Portal.prototype.normalizeCtorArgs = function (value) {
            if (typeof value === "string") {
                return { url: value };
            }
            return value;
        };
        Portal.prototype.getDefaults = function (params) {
            return lang.mixin(this.inherited(arguments), {
                url: esriConfig.portalUrl
            });
        };
        Portal.prototype._defaultBasemapReader = function (value) {
            return value ? BasemapClass.fromJSON(value) : null;
        };
        Portal.prototype._extraQueryGetter = function () {
            return (this.id && !this.canSearchPublic)
                ? " AND orgid:" + this.id
                : null;
        };
        Portal.prototype._restUrlGetter = function () {
            var url = this.url;
            if (url) {
                var idx = url.indexOf("/sharing");
                if (idx > 0) {
                    url = url.substring(0, idx);
                }
                else {
                    url = this.url.replace(/\/+$/, "");
                }
                url += "/sharing/rest";
            }
            return url;
        };
        //--------------------------------------------------------------------------
        //
        //  Overridden Methods
        //
        //--------------------------------------------------------------------------
        Portal.prototype.load = function () {
            var _this = this;
            var promise = promiseUtils.resolve().then(function () {
                return _this.authMode === Portal.AUTH_MODE_IMMEDIATE
                    ? esriId.getCredential(_this.restUrl)
                    : null;
            }).then(function () {
                return requireUtils.whenOne(require, "../Basemap");
            }).then(function (BasemapMod) {
                BasemapClass = BasemapMod;
            }).then(function () {
                return _this._fetchSelf();
            }).then(function (self) {
                _this.read(self);
            });
            this.addResolvingPromise(promise);
            return this;
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        /**
         * @ignore
         * @returns {{}}
         */
        Portal.prototype.toJSON = function () {
            throw errors.Internal.notYetImplemented();
        };
        /**
         * Returns a cached default Portal instance.
         *
         * @return {module:esri/portal/Portal}
         */
        Portal.getDefault = function () {
            if (!Portal._default) {
                Portal._default = new Portal();
            }
            return Portal._default;
        };
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
        Portal.prototype.queryGroups = function (queryParams) {
            return this._queryPortal("/community/groups", queryParams, "PortalGroup");
        };
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
        Portal.prototype.queryItems = function (queryParams) {
            return this._queryPortal("/search", queryParams, "PortalItem");
        };
        //--------------------------------------------------------------------------
        //
        //  Private Methods
        //
        //--------------------------------------------------------------------------
        Portal.prototype._fetchSelf = function () {
            var selfUrl = this.restUrl + "/portals/self?culture=" + dojoNS.locale;
            return this._request(selfUrl);
        };
        Portal.prototype._queryPortal = function (path, queryParams, resultClassModule) {
            var _this = this;
            var doRequest = function (ResultClass) {
                return _this._request(_this.restUrl + path, queryParams.toQueryParams(_this)).then(function (result) {
                    var nextQueryParams = queryParams.clone();
                    nextQueryParams.start = result.nextStart;
                    return new PortalQueryResult({
                        nextQueryParams: nextQueryParams,
                        queryParams: queryParams,
                        total: result.total,
                        results: Portal._resultsToTypedArray(ResultClass, { portal: _this }, result)
                    });
                }).then(function (result) {
                    return all(result.results).always(function () { return result; });
                });
            };
            if (resultClassModule) {
                return requireUtils.whenOne(require, "./" + resultClassModule).then(function (ResultClass) {
                    return doRequest(ResultClass);
                });
            }
            else {
                return doRequest();
            }
        };
        Portal.prototype._normalizeSSL = function (url) {
            // This seems to be required on every request since some portals do not require ssl, but a request to the
            // currentProtocol may or may not be accessed over ssl.
            var currentProtocol = window.location.protocol; // TODO: remove use of window
            if (!this.isPortal) {
                return (this.allSSL || currentProtocol.indexOf("https:") !== -1) ? url.replace("http:", "https:") : url;
            }
            else {
                // Is onPremise Portal could be using different ports
                var onPremiseUrl = Portal._getLocation(url);
                // Only adjust ports for urls to the portal over non-standard ports ie not 80 or 443
                if (this.portalHostname.toLowerCase().indexOf(onPremiseUrl.hostname.toLowerCase()) > -1 &&
                    (onPremiseUrl.port && (onPremiseUrl.port !== "80" && onPremiseUrl.port !== "443"))) {
                    var pathName = onPremiseUrl.pathname;
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
        };
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
        Portal.prototype._request = function (url, params) {
            var form;
            var handleAs;
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
            var content = lang.mixin({ f: "json" }, params);
            var options = {
                disableIdentityLookup: this.authMode === Portal.AUTH_MODE_ANONYMOUS
            };
            return esriRequest({
                callbackParamName: "callback",
                content: content,
                form: form,
                handleAs: handleAs,
                timeout: 0,
                url: this._normalizeSSL(url.url || url) // TODO: remove use of url.url
            }, options);
        };
        Portal._getLocation = function (href) {
            var parser = document.createElement("a"); // TODO: remove use of document
            parser.href = href;
            return {
                protocol: parser.protocol,
                hostname: parser.hostname,
                port: parser.port,
                pathname: parser.pathname,
                search: parser.search,
                hash: parser.hash,
                host: parser.host // => "example.com:3000"
            };
        };
        Portal._resultsToTypedArray = function (Type, mixin, results) {
            var ret;
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
                    ret = ret.map(function (result) {
                        var instance = lang.mixin(Type ? Type.fromJSON(result) : result, mixin);
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
        };
        //--------------------------------------------------------------------------
        //
        //  Constants
        //
        //--------------------------------------------------------------------------
        Portal.AUTH_MODE_ANONYMOUS = "anonymous";
        Portal.AUTH_MODE_AUTO = "auto";
        Portal.AUTH_MODE_IMMEDIATE = "immediate";
        __decorate([
            typescript_1.shared("esri.portal.Portal")
        ], Portal.prototype, "declaredClass");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "allSSL");
        __decorate([
            typescript_1.property({ value: Portal.AUTH_MODE_AUTO })
        ], Portal.prototype, "authMode");
        __decorate([
            typescript_1.property({ value: true })
        ], Portal.prototype, "canSearchPublic");
        __decorate([
            typescript_1.property({ value: true })
        ], Portal.prototype, "canSharePublic");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "defaultBasemap");
        __decorate([
            typescript_1.property({ dependsOn: ["id", "canSearchPublic"], readOnly: true })
        ], Portal.prototype, "extraQuery");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "httpPort");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "httpsPort");
        __decorate([
            typescript_1.property({ value: null })
        ], Portal.prototype, "id");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "isPortal");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "portalHostname");
        __decorate([
            typescript_1.property({ dependsOn: ["url"], readOnly: true })
        ], Portal.prototype, "restUrl");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "stylesGroupQuery");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "url");
        __decorate([
            typescript_1.property()
        ], Portal.prototype, "user");
        Portal = __decorate([
            typescript_1.subclass([Loadable])
        ], Portal);
        return Portal;
    })(getPortalBase());
    return Portal;
});
