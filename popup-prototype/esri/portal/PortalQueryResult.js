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
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/accessorSupport/typescript", "../core/Accessor"], function (require, exports, __extends, __decorate, typescript_1, Accessor) {
    var PortalQueryResult = (function (_super) {
        __extends(PortalQueryResult, _super);
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
        function PortalQueryResult(properties) {
            _super.call(this);
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
            this.nextQueryParams = null;
            //----------------------------------
            //  queryParams
            //----------------------------------
            /**
             * The query parameters for the first set of results.
             *
             * @type {module:esri/portal/PortalQueryParams}
             */
            this.queryParams = null;
            //----------------------------------
            //  results
            //----------------------------------
            /**
             * An array of result item objects.
             *
             * @type {Object[]}
             */
            this.results = null;
            //----------------------------------
            //  total
            //----------------------------------
            /**
             * The total number of results. The maximum number of results is limited to 1000.
             *
             * @type {number}
             */
            this.total = null;
        }
        __decorate([
            typescript_1.shared("esri.portal.PortalQueryResult")
        ], PortalQueryResult.prototype, "declaredClass");
        __decorate([
            typescript_1.property()
        ], PortalQueryResult.prototype, "nextQueryParams");
        __decorate([
            typescript_1.property()
        ], PortalQueryResult.prototype, "queryParams");
        __decorate([
            typescript_1.property()
        ], PortalQueryResult.prototype, "results");
        __decorate([
            typescript_1.property()
        ], PortalQueryResult.prototype, "total");
        PortalQueryResult = __decorate([
            typescript_1.subclass()
        ], PortalQueryResult);
        return PortalQueryResult;
    })(Accessor);
    return PortalQueryResult;
});
