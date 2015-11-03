/**
 * Represents settings that affect the environment in
 * which the {@link module:esri/WebScene} is displayed (such as lighting). It is part of the
 * {@link module:esri/WebScene#initialState initial state} of the WebScene
 * as well as {@link module:esri/webscene/Presentation#slides slides} in the presentation.
 *
 * @module esri/webscene/Environment
 * @see module:esri/webscene/InitialState
 * @see module:esri/webscene/Slide
 * @since 4.0
 */
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/JSONSupport", "../core/accessorSupport/typescript", "./Lighting"], function (require, exports, __extends, __decorate, JSONSupport, typescript_1, Lighting) {
    var Environment = (function (_super) {
        __extends(Environment, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        /**
         * @extends module:esri/core/Accessor
         * @constructor
         * @alias module:esri/webscene/Environment
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                              that may be passed into the constructor.
         */
        function Environment(obj) {
            _super.call(this, obj);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  lighting
            //----------------------------------
            /**
             * Settings for defining the lighting of the scene.
             *
             * @type {module:esri/webscene/Lighting}
             */
            this.lighting = null;
        }
        Environment.prototype.getDefaults = function () {
            return {
                lighting: {}
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
         * @return {module:esri/webscene/Environment} Creates a clone of the instance calling this method.
         */
        Environment.prototype.clone = function () {
            return new Environment({
                lighting: this.lighting.clone()
            });
        };
        Environment.prototype.toJSON = function () {
            return {
                lighting: this.lighting.toJSON()
            };
        };
        Environment.sanitizeJSON = function (json) {
            return {
                lighting: json.lighting ? Lighting.sanitizeJSON(json.lighting) : (new Lighting()).toJSON()
            };
        };
        __decorate([
            typescript_1.shared("esri.webscene.Environment")
        ], Environment.prototype, "declaredClass");
        __decorate([
            typescript_1.property({ type: Lighting })
        ], Environment.prototype, "lighting");
        Environment = __decorate([
            typescript_1.subclass()
        ], Environment);
        return Environment;
    })(JSONSupport);
    return Environment;
});
