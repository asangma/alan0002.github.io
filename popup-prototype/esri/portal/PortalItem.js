/**
 * An item (a unit of content) in the Portal. Each item has a unique identifier and a
 * well known url that is independent of the user owning the item. An item may have
 * associated binary or textual data which is available via the item data resource.
 * View the ArcGIS Portal API REST documentation for the
 * [item](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000mt000000)
 * for more details.
 *
 * @module esri/portal/PortalItem
 * @since 4.0
 * @noconstructor
 * @see module:esri/portal/Portal
 * @see [Sample - Load a basic WebScene](../sample-code/webscene-basic/index.html)
 */
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/accessorSupport/typescript", "dojo/Deferred", "../core/errors", "../geometry/Extent", "../core/JSONSupport", "../core/Loadable", "./Portal"], function (require, exports, __extends, __decorate, typescript_1, Deferred, errors, Extent, JSONSupport, Loadable, Portal) {
    function getPortalItemBase() {
        return JSONSupport;
    }
    // TODO
    // Handle cancelLoad
    var PortalItem = (function (_super) {
        __extends(PortalItem, _super);
        //--------------------------------------------------------------------------
        //
        //  Life cycle
        //
        //--------------------------------------------------------------------------
        /**
         * @constructor
         * @alias module:esri/portal/PortalItem
         * @extends module:esri/core/Accessor
         * @mixes module:esri/core/Loadable
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                            that may be passed into the constructor.
         */
        function PortalItem(properties) {
            _super.call(this);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  created
            //----------------------------------
            /**
             * The date the item was created.
             *
             * @type {Date}
             */
            this.created = null;
            //----------------------------------
            //  description
            //----------------------------------
            /**
             * The detailed description of the item.
             *
             * @type {string}
             */
            this.description = null;
            //----------------------------------
            //  extent
            //----------------------------------
            /**
             * The geographic extent, or bounding rectangle, of the item.
             *
             * @type {module:esri/geometry/Extent}
             */
            this.extent = null;
            //----------------------------------
            //  id
            //----------------------------------
            /**
             * The unique id for the item.
             *
             * @type {string}
             */
            this.id = null;
            //----------------------------------
            //  itemUrl
            //----------------------------------
            /**
             * The url to the item.
             *
             * @readonly
             * @type {string}
             */
            this.itemUrl = null;
            //----------------------------------
            //  loaded
            //----------------------------------
            /**
            * Indicates wheather the item's resources have loaded from the portal. When `true`,
            * all the properties of the object can be accessed.
            *
            * @name loaded
            * @instance
            * @type {boolean}
            * @default false
            * @readonly
            */
            //----------------------------------
            //  modified
            //----------------------------------
            /**
             * The date the item was last modified.
             *
             * @type {Date}
             */
            this.modified = null;
            //----------------------------------
            //  name
            //----------------------------------
            /**
             * The name of the item.
             *
             * @type {string}
             */
            this.name = null;
            //----------------------------------
            //  portal
            //----------------------------------
            /**
             * The portal that contains the item.
             *
             * @type {module:esri/portal/Portal}
             */
            this.portal = null;
            //----------------------------------
            //  title
            //----------------------------------
            /**
             * The title for the item. This is the name that is displayed to users and
             * used to refer to the item. Every item must have a title.
             *
             * @type {string}
             */
            this.title = null;
            //----------------------------------
            //  type
            //----------------------------------
            /**
             * The GIS content type of this item.
             *
             * @type {string}
             * @example
             * portalItem.type = "Web Map";
             *
             * @example
             * portalItem.type = "Web Mapping Application";
             */
            this.type = null;
        }
        PortalItem.prototype._itemUrlGetter = function () {
            var restUrl = this.get("portal.restUrl");
            return restUrl ? restUrl + "/content/items/" + this.id : null;
        };
        //--------------------------------------------------------------------------
        //
        //  Overridden Methods
        //
        //--------------------------------------------------------------------------
        PortalItem.prototype.load = function () {
            var _this = this;
            if (!this.portal) {
                this.portal = Portal.getDefault();
            }
            var promise = this.portal.load().then(function () {
                if (_this.resourceInfo) {
                    return _this.resourceInfo;
                }
                else if (_this.id && _this.itemUrl) {
                    return _this.portal._request(_this.itemUrl);
                }
                else {
                    return {};
                }
            }).then(function (json) {
                _this.resourceInfo = json;
                _this.read(json);
            });
            this.addResolvingPromise(promise);
            return this;
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        /*
         * THIS METHOD IS TEMPORARY
         * @ignore
         */
        PortalItem.prototype.create = function (params) {
            var modname = null;
            switch (this.type) {
                case "Web Scene":
                    modname = "WebSceneCreator";
                    break;
            }
            var ret = new Deferred();
            if (!modname) {
                ret.reject(errors.Portal.unsupportedItemType(this.type));
            }
            require(["./creators/" + modname], function (CreatorCtor) {
                var creator = new CreatorCtor(params);
                creator.createFromItem(this).then(ret.resolve, ret.reject, ret.progress);
            }.bind(this));
            return ret.promise;
        };
        /**
         * Requests a PortalItem in the format specified in `handleAs`.
         *
         * @param {string} handleAs - The format of the response. <br><br>
         *   **Known Values:** json | xml | text | blob | arraybuffer | document
         * @return {Promise} - When resolved, returns the requested data.
         */
        PortalItem.prototype.fetchData = function (handleAs) {
            if (handleAs === void 0) { handleAs = "json"; }
            return this.portal._request(this.itemUrl + "/data", { handleAs: handleAs });
        };
        /**
         * @ignore
         * @return {{}}
         */
        PortalItem.prototype.toJSON = function () {
            throw errors.Internal.notYetImplemented();
        };
        /**
         * @ignore
         * @return {PortalItem}
         */
        PortalItem.fromJSON = function (json) {
            if (!json) {
                return null;
            }
            if (json.declaredClass) {
                throw new Error("JSON object is already hydrated");
            }
            return new PortalItem({ "resourceInfo": json });
        };
        __decorate([
            typescript_1.shared("esri.portal.PortalItem")
        ], PortalItem.prototype, "declaredClass");
        __decorate([
            typescript_1.property({ type: Date })
        ], PortalItem.prototype, "created");
        __decorate([
            typescript_1.property()
        ], PortalItem.prototype, "description");
        __decorate([
            typescript_1.property({
                type: Extent,
                reader: function (value) {
                    return (value && value.length) ? new Extent(value[0][0], value[0][1], value[1][0], value[1][1]) : null;
                }
            })
        ], PortalItem.prototype, "extent");
        __decorate([
            typescript_1.property()
        ], PortalItem.prototype, "id");
        __decorate([
            typescript_1.property({ dependsOn: ["portal.restUrl"], readOnly: true })
        ], PortalItem.prototype, "itemUrl");
        __decorate([
            typescript_1.property({ type: Date })
        ], PortalItem.prototype, "modified");
        __decorate([
            typescript_1.property()
        ], PortalItem.prototype, "name");
        __decorate([
            typescript_1.property({ type: Portal })
        ], PortalItem.prototype, "portal");
        __decorate([
            typescript_1.property()
        ], PortalItem.prototype, "resourceInfo");
        __decorate([
            typescript_1.property()
        ], PortalItem.prototype, "title");
        __decorate([
            typescript_1.property()
        ], PortalItem.prototype, "type");
        PortalItem = __decorate([
            typescript_1.subclass([Loadable])
        ], PortalItem);
        return PortalItem;
    })(getPortalItemBase());
    return PortalItem;
});
