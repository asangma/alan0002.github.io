/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/ArcGISTiledLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, ArcGISTiledLayer) {
    var TiledServiceLayerCreator = (function (_super) {
        __extends(TiledServiceLayerCreator, _super);
        function TiledServiceLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.TiledServiceLayerCreator")
        ], TiledServiceLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(ArcGISTiledLayer)
        ], TiledServiceLayerCreator.prototype, "type");
        TiledServiceLayerCreator = __decorate([
            typescript_1.subclass()
        ], TiledServiceLayerCreator);
        return TiledServiceLayerCreator;
    })(LayerCreator);
    return TiledServiceLayerCreator;
});
