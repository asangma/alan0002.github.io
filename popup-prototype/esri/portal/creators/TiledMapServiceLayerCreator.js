/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./TiledServiceLayerCreator"], function (require, exports, __extends, __decorate, typescript_1, TiledServiceLayerCreator) {
    var TiledMapServiceLayerCreator = (function (_super) {
        __extends(TiledMapServiceLayerCreator, _super);
        function TiledMapServiceLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.TiledServiceLayerCreator")
        ], TiledMapServiceLayerCreator.prototype, "declaredClass");
        TiledMapServiceLayerCreator = __decorate([
            typescript_1.subclass()
        ], TiledMapServiceLayerCreator);
        return TiledMapServiceLayerCreator;
    })(TiledServiceLayerCreator);
    return TiledMapServiceLayerCreator;
});
