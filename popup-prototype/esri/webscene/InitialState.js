/**
 * Represents the initial viewing state of the {@link module:esri/WebScene}
 * when displayed in a {@link module:esri/views/SceneView}. It contains the
 * initial [viewpoint](#viewpoint) as well as the initial [environment](#environment) settings.
 *
 * @module esri/webscene/InitialState
 * @since 4.0
 */
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../Viewpoint", "../core/JSONSupport", "../core/accessorSupport/typescript", "./Environment"], function (require, exports, __extends, __decorate, Viewpoint, JSONSupport, typescript_1, Environment) {
    var InitialState = (function (_super) {
        __extends(InitialState, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        /**
         * @extends module:esri/core/Accessor
         * @mixes module:esri/core/Promise
         * @mixes module:esri/core/Evented
         * @constructor
         * @alias module:esri/webscene/InitialState
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                              that may be passed into the constructor.
         */
        function InitialState(obj) {
            _super.call(this, obj);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  viewpoint
            //----------------------------------
            /**
             * The initial viewpoint of the {@link module:esri/WebScene}.
             *
             * @type {module:esri/Viewpoint}
             */
            this.viewpoint = null;
            //----------------------------------
            //  environment
            //----------------------------------
            /**
             * The initial environment settings of the {@link module:esri/WebScene}.
             *
             * @type {module:esri/webscene/Environment}
             */
            this.environment = null;
        }
        InitialState.prototype.getDefaults = function () {
            return {
                environment: {}
            };
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Clones this object.
         *
         * @return {module:esri/webscene/InitialState} Creates a clone of the instance that called this method.
         */
        InitialState.prototype.clone = function () {
            return new InitialState({
                viewpoint: this.viewpoint ? this.viewpoint.clone() : null,
                environment: this.environment.clone()
            });
        };
        InitialState.prototype.toJSON = function () {
            var ret = {
                environment: this.environment.toJSON()
            };
            if (this.viewpoint) {
                ret.viewpoint = this.viewpoint.toJSON();
            }
            return ret;
        };
        InitialState.sanitizeJSON = function (json) {
            var ret = {};
            if (json.environment !== undefined) {
                ret.environment = Environment.sanitizeJSON(json.environment);
            }
            if (json.viewpoint !== undefined) {
                ret.viewpoint = json.viewpoint;
            }
            return ret;
        };
        __decorate([
            typescript_1.shared("esri.webscene.InitialState")
        ], InitialState.prototype, "declaredClass");
        __decorate([
            typescript_1.property({
                value: null,
                type: Viewpoint
            })
        ], InitialState.prototype, "viewpoint");
        __decorate([
            typescript_1.property({ type: Environment })
        ], InitialState.prototype, "environment");
        InitialState = __decorate([
            typescript_1.subclass()
        ], InitialState);
        return InitialState;
    })(JSONSupport);
    return InitialState;
});
