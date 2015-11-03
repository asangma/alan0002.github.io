define([
    "../../core/declare",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-construct",
    "dijit/layout/_LayoutWidget"
], function (declare, domClass, domGeom, domConstruct, _LayoutWidget) {

    function measure(elem) {
        elem.style.position = "absolute";
        domClass.add(elem, "GridCell_Measure");
        var height = elem.scrollHeight;
        domClass.remove(elem, "GridCell_Measure");
        return height;
    }

    function arrange(rowHeights, gridHeights, freeHeight) {

        var flexibleRowCount = 0;
        var i;
        for (i = 0; i < rowHeights.length; i++) {
            switch (gridHeights[i]) {
                case Grid.AUTO:
                    freeHeight -= rowHeights[i];
                    break;
                case Grid.STRETCH:
                case Grid.STACK:
                    flexibleRowCount++;
                    break;
            }
        }

        if (flexibleRowCount > 1) {
            throw new Error("Multiple rows with flexible heights are not supported");
        }

        var y = [0];
        for (i = 0; i < rowHeights.length; i++) {
            var height;
            switch (gridHeights[i]) {
                case Grid.AUTO:
                    height = rowHeights[i];
                    break;
                case Grid.STRETCH:
                    height = freeHeight;
                    break;
                case Grid.STACK:
                    height = Math.min(freeHeight, rowHeights[i]);
                    break;
            }
            y.push(y[i] + height);
        }
        return y;
    }

    function position(node, t, h) {
        var u = "px";
        var style = node.style;
        style.top = t + u;
        style.height = h + u;
    }

    var Grid = declare("esri.widgets.geoenrichment.Grid", [_LayoutWidget], {

        _placeholder: null,

        layout: function () {
            var children = this.getChildren();

            var rowHeights = [];
            var i, child, rowIndex;
            for (i = 0; i < this.rows.length; i++) {
                rowHeights.push(0);
            }

            domClass.add(this.domNode, "Grid_Measure");
            var childHeights = [];
            for (i = 0; i < children.length; i++) {
                child = children[i];
                rowIndex = child.row;
                var height = measure(child.domNode);
                childHeights.push(height);
                if (height > rowHeights[rowIndex]) {
                    rowHeights[rowIndex] = height;
                }
            }
            var freeHeight = domGeom.getContentBox(this.domNode).h;
            domClass.remove(this.domNode, "Grid_Measure");

            var y = arrange(rowHeights, this.rows, freeHeight);

            for (i = 0; i < children.length; i++) {
                child = children[i];
                rowIndex = child.row;
                position(child.domNode, y[rowIndex], y[rowIndex + 1] - y[rowIndex]);
            }

            if (!this._placeholder) {
                this._placeholder = domConstruct.create("div", null, this.domNode);
            }
            this._placeholder.style.height = y[y.length - 1] + "px";
        }
    });

    //
    //auto - cell size will be equal to minimum required size to fit the cell contents
    //
    Grid.AUTO = "auto";

    //
    //strecth - cell will stretch to fill up all the available space
    //
    Grid.STRETCH = "stretch";

    //
    //stack - cell size will be equal to minimum required size to fit the cell contents until
    //there is enough space to show the whole grid without scrolling; otherwise the cell will
    //be trimmed (resulting in scrolling or text ellipsis)
    //
    Grid.STACK = "stack";

    return Grid;

});