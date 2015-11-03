/**
 * The query parameters used for a {@link module:esri/portal/Portal} query operation.
 *
 * @module esri/portal/PortalQueryParams
 * @since 4.0
 * @see {@link module:esri/portal/Portal#queryGroups Portal.queryGroups()}
 * @see {@link module:esri/portal/Portal#queryItems Portal.queryItems()}
 * @see {@link module:esri/portal/PortalGroup#queryItems PortalGroup.queryItems()}
 */
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/accessorSupport/typescript", "../core/Accessor", "../geometry/Extent", "../geometry/support/webMercatorUtils", "../geometry/SpatialReference", "dojo/_base/lang"], function (require, exports, __extends, __decorate, typescript_1, Accessor, Extent, webMercatorUtils_1, SpatialReference, lang) {
    var PortalQueryParams = (function (_super) {
        __extends(PortalQueryParams, _super);
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
        function PortalQueryParams(properties) {
            _super.call(this);
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
            this.disableExtraQuery = null;
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
            this.extent = null;
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
            this.num = null;
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
            this.query = null;
            //----------------------------------
            //  sortField
            //----------------------------------
            /**
             * A comma separated list of fields to sort by.
             *
             * **Known Values:** title | created | type | owner | avgRating | numRatings | numComments | numViews
             * @type {string}
             */
            this.sortField = null;
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
            this.sortOrder = null;
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
            this.start = null;
        }
        PortalQueryParams.prototype._sortOrderSetter = function (value, oldValue) {
            if (value === "asc" || value === "desc") {
                return value;
            }
            return oldValue;
        };
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
        PortalQueryParams.prototype.clone = function () {
            return new PortalQueryParams({
                disableExtraQuery: this.disableExtraQuery,
                extent: this.extent ? this.extent.clone() : null,
                num: this.num,
                query: this.query,
                sortField: this.sortField,
                sortOrder: this.sortOrder,
                start: this.start
            });
        };
        PortalQueryParams.prototype.toQueryParams = function (portal, defaultValues) {
            var bbox;
            if (this.extent) {
                var extent = webMercatorUtils_1.project(this.extent, SpatialReference.WGS84);
                if (extent) {
                    bbox = extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax;
                }
            }
            var q = this.query;
            if (!this.disableExtraQuery && portal.extraQuery) {
                q = "(" + q + ")" + portal.extraQuery;
            }
            return lang.mixin(defaultValues, {
                bbox: bbox,
                q: q,
                num: this.num,
                sortField: this.sortField,
                sortOrder: this.sortOrder,
                start: this.start
            });
        };
        __decorate([
            typescript_1.shared("esri.portal.PortalQueryParams")
        ], PortalQueryParams.prototype, "declaredClass");
        __decorate([
            typescript_1.property({ value: false })
        ], PortalQueryParams.prototype, "disableExtraQuery");
        __decorate([
            typescript_1.property({ type: Extent })
        ], PortalQueryParams.prototype, "extent");
        __decorate([
            typescript_1.property({ value: 10 })
        ], PortalQueryParams.prototype, "num");
        __decorate([
            typescript_1.property()
        ], PortalQueryParams.prototype, "query");
        __decorate([
            typescript_1.property()
        ], PortalQueryParams.prototype, "sortField");
        __decorate([
            typescript_1.property({ value: "asc" })
        ], PortalQueryParams.prototype, "sortOrder");
        __decorate([
            typescript_1.property({ value: 1 })
        ], PortalQueryParams.prototype, "start");
        PortalQueryParams = __decorate([
            typescript_1.subclass()
        ], PortalQueryParams);
        return PortalQueryParams;
    })(Accessor);
    return PortalQueryParams;
});
