define([], function () {

    return {

        getCeiling: function (value, excludeOnes) {
            //returns value rounded away from zero to 20, 40, 60, 80, 200, 400, etc.
            if (value === 0) {
                return 0;
            }
            var sign;
            if (value < 0) {
                value = -value;
                sign = -1;
            } else {
                sign = 1;
            }
            var step = 2;
            var deg = Math.pow(10, Math.ceil(Math.log(value) / Math.LN10) - 1);
            var ceil = Math.ceil(value / deg / step) * step * deg;
            if (excludeOnes && Math.log(ceil) / Math.LN10 % 1 === 0) {
                ceil *= step;
            }//exclude 1, 10, 100, etc. from results

            return ceil * sign;
        },

        //
        //We have this utility method instead of a virtual property on BaseWidget class for
        //performance reasons. Usually we need to know this information before widget "require"
        //call returns
        //
        supportsComparison: function (type, expanded) {
            return type == "OneVar" || type != "Tapestry" && expanded;
        }

    };
});