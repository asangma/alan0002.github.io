define([
    "dojo/number"
], function (number) {

    return function (field, value) {

        var decimals = field.decimals || 0;

        switch (field.units) {
            case "pct":
                return number.format(value / 100, { places: decimals, type: "percent" });
            case "currency":
                return number.format(value, { places: decimals, type: "currency", symbol: field.symbol || "$" });
            default:
                if (field.type == "esriFieldTypeDouble") {
                    return number.format(value, { places: decimals });
                }
                else {
                    return value;
                }
        }
    };

});