/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./TiledServiceLayerCreator"], function (require, exports, __extends, __decorate, typescript_1, TiledServiceLayerCreator) {
    var TiledImageServiceLayerCreator = (function (_super) {
        __extends(TiledImageServiceLayerCreator, _super);
        function TiledImageServiceLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.TiledImageServiceLayerCreator")
        ], TiledImageServiceLayerCreator.prototype, "declaredClass");
        TiledImageServiceLayerCreator = __decorate([
            typescript_1.subclass()
        ], TiledImageServiceLayerCreator);
        return TiledImageServiceLayerCreator;
    })(TiledServiceLayerCreator);
    return TiledImageServiceLayerCreator;
});
