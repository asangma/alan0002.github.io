define([
    "dojo/dom-construct",
    "dijit/registry"
], function (domConstruct, registry) {

    return {

        text: function (parent, text) {
            parent.appendChild(document.createTextNode(text));
        },

        clear: function (elem) {
            if (!elem) {
                return;
            }
            var dijits = registry.findWidgets(elem);
            if (dijits) {
                for (var i = 0; i < dijits.length; i++) {
                    dijits[i].destroy();
                }
            }

            elem.innerHTML = "";
        },

        pct: function (num) {
            return (num * 100).toFixed(2) + "%";
        },

        head: function () {
            return document.getElementsByTagName("head")[0];
        },

        createCols: function (table, widths) {
            var colgroup = domConstruct.create("colgroup", null, table);
            for (var i = 0; i < widths.length; i++) {
                var col = domConstruct.create("col", null, colgroup);
                if (widths[i]) {
                    col.style.width = this.pct(widths[i]);
                }
            }
        }
    };
});
