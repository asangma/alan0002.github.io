/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/SceneLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, SceneLayer) {
    var SceneServiceLayerCreator = (function (_super) {
        __extends(SceneServiceLayerCreator, _super);
        function SceneServiceLayerCreator() {
            _super.apply(this, arguments);
        }
        __decorate([
            typescript_1.shared("esri.portal.creators.SceneServiceLayerCreator")
        ], SceneServiceLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(SceneLayer)
        ], SceneServiceLayerCreator.prototype, "type");
        SceneServiceLayerCreator = __decorate([
            typescript_1.subclass()
        ], SceneServiceLayerCreator);
        return SceneServiceLayerCreator;
    })(LayerCreator);
    return SceneServiceLayerCreator;
});
