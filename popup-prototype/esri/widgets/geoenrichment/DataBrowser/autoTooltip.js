define([
    "dojo/on",
    "dojo/query",
    "dijit/Tooltip"
], function (
    on,
    query,
    Tooltip
    ) {

    
    var node = null;

    return function (root) {
        on(root, ".TrimWithEllipses:mouseover", function () {
            if (this === node) {
                return;
            }
            if (this.offsetWidth < this.scrollWidth) {
                node = this;
                Tooltip.show(node.textContent, node, ["above", "below"]);
                on.once(node, "mouseleave, mousedown, touchstart", function () {
                    Tooltip.hide(node);
                    node = null;
                });
            }
        });
    };

});
