/// <amd-dependency path="../../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../../core/tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "../../core/tsSupport/extendsHelper", "../../core/tsSupport/decorateHelper", "../../core/accessorSupport/typescript", "./LayerCreator", "../../layers/WebTiledLayer"], function (require, exports, __extends, __decorate, typescript_1, LayerCreator, WebTiledLayer) {
    var WebTiledLayerCreator = (function (_super) {
        __extends(WebTiledLayerCreator, _super);
        function WebTiledLayerCreator() {
            _super.apply(this, arguments);
        }
        //--------------------------------------------------------------------------
        //
        //  Protected methods
        //
        //--------------------------------------------------------------------------
        WebTiledLayerCreator.prototype.layerProperties = function (layer) {
            return this.inherited(arguments).then(function (properties) {
                if (layer.urlTemplate !== undefined) {
                    properties.urlTemplate = layer.urlTemplate;
                }
                else if (layer.templateUrl !== undefined) {
                    properties.urlTemplate = layer.templateUrl;
                }
                return properties;
            });
        };
        __decorate([
            typescript_1.shared("esri.portal.creators.WebTiledLayerCreator")
        ], WebTiledLayerCreator.prototype, "declaredClass");
        __decorate([
            typescript_1.shared(WebTiledLayer)
        ], WebTiledLayerCreator.prototype, "type");
        __decorate([
            typescript_1.shared(false)
        ], WebTiledLayerCreator.prototype, "requiresUrl");
        WebTiledLayerCreator = __decorate([
            typescript_1.subclass()
        ], WebTiledLayerCreator);
        return WebTiledLayerCreator;
    })(LayerCreator);
    return WebTiledLayerCreator;
});
