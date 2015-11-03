/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/OpenStreetMapLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, OpenStreetMapLayer) {
    var OpenStreetMapCreator = (function (_super) {
        __extends(OpenStreetMapCreator, _super);
        function OpenStreetMapCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.OpenStreetMapCreator")
        ], OpenStreetMapCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(OpenStreetMapLayer)
        ], OpenStreetMapCreator.prototype, "type");
        __decorate([
            typescript_1.shared(false)
        ], OpenStreetMapCreator.prototype, "requiresUrl");
        OpenStreetMapCreator = __decorate([
            typescript_1.subclass()
        ], OpenStreetMapCreator);
        return OpenStreetMapCreator;
    })(LayerCreator);
    return OpenStreetMapCreator;
});
