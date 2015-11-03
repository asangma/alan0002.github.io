/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/ArcGISElevationLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, ArcGISElevationLayer) {
    var TiledElevationServiceLayerCreator = (function (_super) {
        __extends(TiledElevationServiceLayerCreator, _super);
        function TiledElevationServiceLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.TiledImageServiceLayerCreator")
        ], TiledElevationServiceLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(ArcGISElevationLayer)
        ], TiledElevationServiceLayerCreator.prototype, "type");
        TiledElevationServiceLayerCreator = __decorate([
            typescript_1.subclass()
        ], TiledElevationServiceLayerCreator);
        return TiledElevationServiceLayerCreator;
    })(LayerCreator);
    return TiledElevationServiceLayerCreator;
});
