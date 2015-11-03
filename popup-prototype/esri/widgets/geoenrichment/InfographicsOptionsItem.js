define([], function () {
    return function (type, variables) {
        this.type = type;
        this.variables = variables;

        this.title = null;
        this.index = null;
        this.isVisible = true;
    };
});