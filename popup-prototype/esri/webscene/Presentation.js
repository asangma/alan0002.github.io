/**
 * A presentation contains a {@link module:esri/core/Collection} of
 * {@link module:esri/webscene/Slide slides} that allows users to quickly
 * navigate to predefined settings of a {@link module:esri/views/SceneView}.
 *
 * @module esri/webscene/Presentation
 * @since 4.0
 * @see module:esri/webscene/Slide
 * @see [Sample - WebScene slides](../sample-code/webscene-slides/index.html)
 */
define(["require", "exports", "../core/tsSupport/extendsHelper", "../core/tsSupport/decorateHelper", "../core/JSONSupport", "../core/Collection", "../core/accessorSupport/typescript", "./Slide"], function (require, exports, __extends, __decorate, JSONSupport, Collection, typescript_1, Slide) {
    var Presentation = (function (_super) {
        __extends(Presentation, _super);
        //--------------------------------------------------------------------------
        //
        //  Lifecycle
        //
        //--------------------------------------------------------------------------
        /**
         * @extends module:esri/core/Accessor
         * @constructor
         * @alias module:esri/webscene/Presentation
         * @param {Object} properties - See the [properties](#properties) for a list of all the properties
         *                              that may be passed into the constructor.
         */
        function Presentation(obj) {
            _super.call(this, obj);
            //--------------------------------------------------------------------------
            //
            //  Properties
            //
            //--------------------------------------------------------------------------
            //----------------------------------
            //  slides
            //----------------------------------
            /**
             * A collection of {@link module:esri/webscene/Slide slides} that bookmark
             * {@link module:esri/Viewpoint viewpoints}, visible layers, and other settings
             * previously defined in a {@link module:esri/WebScene}.
             *
             * @see {@link module:esri/webscene/Slide}
             * @type {module:esri/core/Collection}
             * @see [Sample - WebScene slides](../sample-code/webscene-slides/index.html)
             */
            this.slides = null;
        }
        Presentation.prototype.getDefaults = function () {
            return {
                slides: []
            };
        };
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        /**
         * Creates a clone of this object.
         *
         * @return {module:esri/webscene/Presentation} A clone of the instance calling this method.
         */
        Presentation.prototype.clone = function () {
            return new Presentation({
                slides: this.slides.map(function (slide) { return slide.clone(); })
            });
        };
        Presentation.prototype.toJSON = function () {
            return {
                slides: this.slides.map(function (slide) { return slide.toJSON(); }).getAll()
            };
        };
        Presentation.sanitizeJSON = function (json) {
            var slides;
            if (json.slides !== undefined && Array.isArray(json.slides)) {
                slides = json.slides.map(function (slide) { return Slide.sanitizeJSON(slide); });
            }
            else {
                slides = [];
            }
            return {
                slides: slides
            };
        };
        __decorate([
            typescript_1.shared("esri.webscene.Presentation")
        ], Presentation.prototype, "declaredClass");
        __decorate([
            typescript_1.property({
                reader: function (value) {
                    return value.map(function (item) { return Slide.fromJSON(item); });
                },
                setter: Collection.referenceSetter
            })
        ], Presentation.prototype, "slides");
        Presentation = __decorate([
            typescript_1.subclass()
        ], Presentation);
        return Presentation;
    })(JSONSupport);
    return Presentation;
});
