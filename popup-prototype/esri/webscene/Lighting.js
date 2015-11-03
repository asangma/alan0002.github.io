/**
 * The lighting object is part of the {@link module:esri/webscene/Environment}
 * and contains information relating to how a {@link module:esri/views/SceneView}
 * is lit.
 *
 * @module esri/webscene/Lighting
 * @since 4.0
 * @see module:esri/webscene/Environment
 */
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/JSONSupport", "../core/accessorSupport/typescript"], function (require, exports, __extends, __decorate, JSONSupport, typescript_1) {
    var DATE_TIME_DEFAULT = 1426420800000;
    var Lighting = (function (_super) {
        __extends(Lighting, _super);
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
         * @alias module:esri/webscene/Lighting
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                              that may be passed into the constructor.
         */
        function Lighting(obj) {
            _super.call(this, obj);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  date
            //----------------------------------
            /**
             * The time and date for which the sun position and light direction is computed.
             *
             * @type {Date}
             * @default null
             */
            this.date = null;
            //----------------------------------
            //  directShadows
            //----------------------------------
            /**
             * Indicates whether direct shadows are enabled.
             *
             * @type {boolean}
             * @default false
             */
            this.directShadows = null;
            //----------------------------------
            //  ambientOcclusion
            //----------------------------------
            /**
             * Indicates whether ambient occlusion is enabled. Ambient occlusion imitates the inter-reflection
             * of light between surfaces, providing a more realistic feel to the scene.
             * It enhances the perceptibility of edges on 3D objects.
             *
             * @type {boolean}
             * @default false
             */
            this.ambientOcclusion = null;
            //----------------------------------
            //  displayUTCOffset
            //----------------------------------
            /**
             * The UTC timezone offset in hours that should be displayed in the UI to represent
             * the date. This value does not have an impact on the actual lighting of the scene.
             *
             * @type {number}
             * @default null
             */
            this.displayUTCOffset = null;
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Clones this object.
         *
         * @return {module:esri/webscene/Lighting} Creates a new clone of the instance calling this method.
         */
        Lighting.prototype.clone = function () {
            return new Lighting({
                date: this.date != null ? new Date(this.date.getTime()) : null,
                directShadows: !!this.directShadows,
                ambientOcclusion: !!this.ambientOcclusion,
                displayUTCOffset: this.displayUTCOffset != null ? this.displayUTCOffset : null
            });
        };
        Lighting.prototype.toJSON = function () {
            var json = {};
            var datetime = this.date.getTime();
            if (datetime !== DATE_TIME_DEFAULT) {
                json.datetime = datetime;
            }
            if (this.directShadows) {
                json.directShadows = true;
            }
            if (this.ambientOcclusion) {
                json.ambientOcclusion = true;
            }
            if (this.displayUTCOffset != null) {
                json.displayUTCOffset = this.displayUTCOffset;
            }
            return json;
        };
        Lighting.sanitizeJSON = function (json) {
            var ret = {
                datetime: json.datetime
            };
            if (json.directShadows !== undefined) {
                ret.directShadows = !!json.directShadows;
            }
            if (json.ambientOcclusion !== undefined) {
                ret.ambientOcclusion = !!json.ambientOcclusion;
            }
            if (json.displayUTCOffset !== undefined) {
                ret.displayUTCOffset = json.displayUTCOffset;
            }
            return ret;
        };
        __decorate([
            typescript_1.shared("esri.webscene.Lighting")
        ], Lighting.prototype, "declaredClass");
        __decorate([
            typescript_1.shared({
                reader: {
                    exclude: ["datetime"],
                    add: ["date"]
                }
            })
        ], Lighting.prototype, "classMetadata");
        __decorate([
            typescript_1.property({
                type: Date,
                value: null,
                reader: function (value, source) {
                    return (source.datetime != null && new Date(source.datetime)) || null;
                }
            })
        ], Lighting.prototype, "date");
        __decorate([
            typescript_1.property({
                value: false
            })
        ], Lighting.prototype, "directShadows");
        __decorate([
            typescript_1.property({
                value: false
            })
        ], Lighting.prototype, "ambientOcclusion");
        __decorate([
            typescript_1.property({
                value: null
            })
        ], Lighting.prototype, "displayUTCOffset");
        Lighting = __decorate([
            typescript_1.subclass()
        ], Lighting);
        return Lighting;
    })(JSONSupport);
    return Lighting;
});
