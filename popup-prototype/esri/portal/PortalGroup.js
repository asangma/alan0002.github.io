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
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/accessorSupport/typescript", "../core/errors", "../core/JSONSupport", "./Portal", "./PortalQueryParams"], function (require, exports, __extends, __decorate, typescript_1, errors, JSONSupport, Portal, PortalQueryParams) {
    var PortalGroup = (function (_super) {
        __extends(PortalGroup, _super);
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
        function PortalGroup(properties) {
            _super.call(this);
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
            this.access = null;
            //----------------------------------
            //  created
            //----------------------------------
            /**
             * The date the group was created.
             *
             * @type {Date}
             */
            this.created = null;
            //----------------------------------
            //  description
            //----------------------------------
            /**
             * A detailed description of the group.
             *
             * @type {string}
             */
            this.description = null;
            //----------------------------------
            //  id
            //----------------------------------
            /**
             * The unique id for the group.
             *
             * @type {string}
             */
            this.id = null;
            //----------------------------------
            //  isInvitationOnly
            //----------------------------------
            /**
             * If set to `true`, then users will not be able to apply to join the group.
             *
             * @type {boolean}
             */
            this.isInvitationOnly = null;
            //----------------------------------
            //  modified
            //----------------------------------
            /**
             * The date the group was last modified.
             *
             * @type {Date}
             */
            this.modified = null;
            //----------------------------------
            //  owner
            //----------------------------------
            /**
             * The username of the group's owner.
             *
             * @type {string}
             */
            this.owner = null;
            //----------------------------------
            //  portal
            //----------------------------------
            /**
             * The portal associated with the group.
             *
             * @type {module:esri/portal/Portal}
             */
            this.portal = null;
            //----------------------------------
            //  snippet
            //----------------------------------
            /**
             * A short summary that describes the group.
             *
             * @type {string}
             */
            this.snippet = null;
            //----------------------------------
            //  tags
            //----------------------------------
            /**
             * User defined tags that describe the group.
             *
             * @type {string[]}
             */
            this.tags = null;
            //----------------------------------
            //  title
            //----------------------------------
            /**
             * The title of the group. This is the name that is displayed to users. It is also
             * used to refer to the group. Every group must have a title and it must be unique.
             *
             * @type {string}
             */
            this.title = null;
            //----------------------------------
            //  url
            //----------------------------------
            /**
             * The url to the group.
             *
             * @readonly
             * @type {string}
             */
            this.url = null;
        }
        PortalGroup.prototype._urlGetter = function () {
            var restUrl = this.get("portal.restUrl");
            return restUrl ? restUrl + "/community/groups/" + this.id : null;
        };
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
        PortalGroup.prototype.fetchMembers = function () {
            return this.portal._request(this.url + "/users");
        };
        /**
         * @ignore
         * @return {{}}
         */
        PortalGroup.prototype.toJSON = function () {
            throw errors.Internal.notYetImplemented();
        };
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
        PortalGroup.prototype.queryItems = function (queryParams) {
            queryParams = queryParams ? queryParams.clone() : new PortalQueryParams();
            queryParams.query = "group:" + this.id + (queryParams.query ? (" " + queryParams.query) : "");
            return this.portal.queryItems(queryParams);
        };
        __decorate([
            typescript_1.shared("esri.portal.PortalGroup")
        ], PortalGroup.prototype, "declaredClass");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "access");
        __decorate([
            typescript_1.property({ type: Date })
        ], PortalGroup.prototype, "created");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "description");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "id");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "isInvitationOnly");
        __decorate([
            typescript_1.property({ type: Date })
        ], PortalGroup.prototype, "modified");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "owner");
        __decorate([
            typescript_1.property({ type: Portal })
        ], PortalGroup.prototype, "portal");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "snippet");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "tags");
        __decorate([
            typescript_1.property()
        ], PortalGroup.prototype, "title");
        __decorate([
            typescript_1.property({ dependsOn: ["portal.restUrl"], readOnly: true })
        ], PortalGroup.prototype, "url");
        PortalGroup = __decorate([
            typescript_1.subclass()
        ], PortalGroup);
        return PortalGroup;
    })(JSONSupport);
    return PortalGroup;
});
