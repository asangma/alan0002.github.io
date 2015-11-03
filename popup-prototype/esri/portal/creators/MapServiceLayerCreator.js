/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/ArcGISDynamicLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, ArcGISDynamicLayer) {
    var MapServiceLayerCreator = (function (_super) {
        __extends(MapServiceLayerCreator, _super);
        function MapServiceLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.MapServiceLayerCreator")
        ], MapServiceLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(ArcGISDynamicLayer)
        ], MapServiceLayerCreator.prototype, "type");
        MapServiceLayerCreator = __decorate([
            typescript_1.subclass()
        ], MapServiceLayerCreator);
        return MapServiceLayerCreator;
    })(LayerCreator);
    return MapServiceLayerCreator;
});
