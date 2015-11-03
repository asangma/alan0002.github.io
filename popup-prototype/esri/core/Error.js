/// <amd-dependency path="./tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="./tsSupport/decorateHelper" name="__decorate" />
define(["require", "exports", "./tsSupport/extendsHelper", "./tsSupport/decorateHelper", "./typescript", "dojo/string"], function (require, exports, __extends, __decorate, typescript_1, dojoString) {
    var Error = (function () {
        function Error(name, message, details) {
        }
        Error.prototype.dojoConstructor = function (name, message, details) {
            this.name = name;
            this.message = (message && dojoString.substitute(message, details, function (s) {
                return s == null ? "" : s;
            })) || "";
            this.details = details;
        };
        Error.prototype.toString = function () {
            return "[" + this.name + "]: " + this.message;
        };
        Error = __decorate([
            typescript_1.subclass()
        ], Error);
        return Error;
    })();
    return Error;
});
