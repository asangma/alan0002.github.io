/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/VectorTiledLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, VectorTiledLayer) {
    var VectorTiledLayerCreator = (function (_super) {
        __extends(VectorTiledLayerCreator, _super);
        function VectorTiledLayerCreator() {
            _super.apply(this, arguments);
        }
        //--------------------------------------------------------------------------
        //
        //  Protected Methods
        //
        //--------------------------------------------------------------------------
        VectorTiledLayerCreator.prototype.layerProperties = function (layer) {
            return this.inherited(arguments).then(function (properties) {
                if (layer.styleUrl !== undefined) {
                    properties.styleUrl = layer.styleUrl;
                }
                if (layer.styles !== undefined) {
                    properties.styles = layer.styles;
                }
                return properties;
            });
        };
        __decorate([
            typescript_1.shared("esri.portal.creators.VectorTiledLayerCreator")
        ], VectorTiledLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(VectorTiledLayer)
        ], VectorTiledLayerCreator.prototype, "type");
        VectorTiledLayerCreator = __decorate([
            typescript_1.subclass()
        ], VectorTiledLayerCreator);
        return VectorTiledLayerCreator;
    })(LayerCreator);
    return VectorTiledLayerCreator;
});
