/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/GroupLayer", "../../core/promiseUtils"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, GroupLayer, promiseUtils) {
    var GroupLayerCreator = (function (_super) {
        __extends(GroupLayerCreator, _super);
        function GroupLayerCreator() {
            _super.apply(this, arguments);
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        GroupLayerCreator.prototype.create = function () {
            var _this = this;
            return this.layerProperties(this.layer).then(function (layerProperties) {
                if (_this.layer.visibilityMode !== undefined) {
                    layerProperties.visibilityMode = _this.layer.visibilityMode;
                }
                return promiseUtils.resolve(new GroupLayer(layerProperties));
            });
        };
        __decorate([
            typescript_1.shared("esri.portal.creators.GroupLayerCreator")
        ], GroupLayerCreator.prototype, "declaredClass");
        GroupLayerCreator = __decorate([
            typescript_1.subclass()
        ], GroupLayerCreator);
        return GroupLayerCreator;
    })(LayerCreator);
    return GroupLayerCreator;
});
