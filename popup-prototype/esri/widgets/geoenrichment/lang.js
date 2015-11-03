define([], function () {

    return {

        arraysEqual: function arraysEqual(a, b) {
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            if (a.length != b.length) {
                return false;
            }
            for (var i = 0; i < a.length; i++) {
                if (a[i] != b[i]) {
                    return false;
                }
            }
            return true;
        },

        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        startsWith: function (str, sub) {
            return str.lastIndexOf(sub, 0) === 0;
        },

        endsWith: function (str, sub) {
            var pos = str.length - sub.length;
            if (pos < 0) {
                return false;
            }
            return str.indexOf(sub, pos) === pos;
        },

        isBoolean: function (b) {
            return (typeof b == "boolean") || (b instanceof Boolean);
        }

    };
});