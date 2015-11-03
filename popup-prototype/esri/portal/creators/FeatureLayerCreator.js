/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/FeatureLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, FeatureLayer) {
    var FeatureLayerCreator = (function (_super) {
        __extends(FeatureLayerCreator, _super);
        function FeatureLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.FeatureLayerCreator")
        ], FeatureLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(FeatureLayer)
        ], FeatureLayerCreator.prototype, "type");
        FeatureLayerCreator = __decorate([
            typescript_1.subclass()
        ], FeatureLayerCreator);
        return FeatureLayerCreator;
    })(LayerCreator);
    return FeatureLayerCreator;
});
