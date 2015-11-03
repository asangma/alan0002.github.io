define([
    "../../core/declare",
    "./BaseWidget",
    "dojo/_base/lang",
    "dojo/on",
    "require",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/query",
    "dojo/i18n!../../nls/jsapi",
    "./dom"

], function (declare, BaseWidget, lang, on, require, domConstruct, domAttr, domClass, query, nls, dom) {
    nls = nls.geoenrichment.dijit.Tapestry;

    var Tapestry = declare("esri.widgets.geoenrichment.Tapestry", [BaseWidget], {
        currentTop: 0,

        updateUIExpanded: function () {
            this.inherited(arguments);
            if (this.currentTop === 0) {
                this.updateListUIExpanded();
            }
            else {
                this.updateViewUIExpanded();
            }
        },

        updateUICollapsed: function () {
            this.inherited(arguments);
            if (this.currentTop === 0) {
                this.updateListUICollapsed();
            }
            else {
                this.updateViewUICollapsed();
            }
        },

        createUI: function (builder) {
            builder.contentClass.push("Tapestry");
            this.inherited(arguments);
        },

        createUIExpanded: function (builder) {
            this.inherited(arguments);
            if (this.currentTop === 0) {
                this.createListUIExpanded(builder);
            }
            else {
                this.createViewUIExpanded(builder);
            }
        },

        createUICollapsed: function (builder) {
            this.inherited(arguments);
            if (this.currentTop === 0) {
                this.createListUICollapsed(builder);
            }
            else {
                this.createViewUICollapsed(builder);
            }
        },

        updateListUIExpanded: function () {
            for (var top = 1; top < 4; top++) {
                var rowIndex = (top - 1) * 5;

                if (this.noValue(top)) {
                    bindEmptyTapestryRows(this.table, top, rowIndex, 5);
                    domClass.remove("arr" + top, "Tapestry_RightArrowCell");
                    return;
                }

                domClass.add("arr" + top, "Tapestry_RightArrowCell");

                var tr = this.table.rows[rowIndex++];
                tr.cells[0].innerHTML = this.formatByName(0, field.get(field.Percentage, top));
                var nameCell = tr.cells[1];
                nameCell.innerHTML = this.getValueByName(0, field.get(field.Name, top));

                tr = this.table.rows[rowIndex++];
                var valueCell = tr.cells[0];
                valueCell.innerHTML = "(" + this.formatByName(0, field.get(field.Value, top)) + " " + nls.hhLabel + ")";

                tr = this.table.rows[rowIndex++];
                tr.cells[1].innerHTML = nls.hhTypeLabel;
                tr.cells[2].innerHTML = this.getValueByName(0, field.get(field.Type, top));

                tr = this.table.rows[rowIndex++];
                tr.cells[1].innerHTML = nls.medianAgeLabel;
                tr.cells[2].innerHTML = this.getValueByName(0, field.get(field.Age, top));

                tr = this.table.rows[rowIndex++];
                tr.cells[1].innerHTML = nls.incomeLabel;
                tr.cells[2].innerHTML = this.getValueByName(0, field.get(field.Income, top));
            }
        },

        updateListUICollapsed: function () {
            for (var top = 1; top < 4; top++) {
                var rowIndex = (top - 1) * 2;

                if (this.noValue(top)) {
                    bindEmptyTapestryRows(this.table, top, rowIndex, 2, true);
                    domClass.remove("arr" + top, "Tapestry_RightArrowCell");
                    return;
                }

                domClass.add("arr" + top, "Tapestry_RightArrowCell");

                var tr = this.table.rows[rowIndex++];
                tr.cells[0].children[0].innerHTML = this.formatByName(0, field.get(field.Percentage, top));
                tr.cells[1].innerHTML = this.getValueByName(0, field.get(field.Name, top));
                tr = this.table.rows[rowIndex++];
                tr.cells[0].innerHTML = "(" + this.formatByName(0, field.get(field.Value, top)) + " " + nls.hhLabel + ")";
            }
        },

        updateViewUIExpanded: function () {
            if (this.noValue(this.currentTop)) {
                query("td:not([\".Tapestry_LeftArrowCell\"])", this.table).forEach(function (cell) {
                    domConstruct.empty(cell);
                });
                return;
            }

            var tr = this.table.rows[0];
            tr.cells[1].innerHTML = this.getValueByName(0, field.get(field.Name, this.currentTop));

            tr = this.table.rows[1];
            var id = this.formatByName(0, field.get(field.Code, this.currentTop));
            if (id.length == 1) {
                id = "0" + id;
            }
            viewCell.bindTopIcon(tr.cells[1], id);

            for (var i = 0; i < 6; i++) {
                tr = this.table.rows[i + 2];
                tr.cells[1].innerHTML = viewCell.labels[i];
                tr.cells[2].innerHTML = this.getValueByName(0, field.get(viewCell.values[i], this.currentTop));
            }
        },

        updateViewUICollapsed: function () {
            if (this.noValue(this.currentTop)) {
                query("td", this.table).forEach(function (cell) {
                    if (cell.className != "LeftArrow") {
                        domConstruct.empty(cell);
                    }
                });
                return;
            }

            var tbl = this.table.rows[0].cells[0].children[0];
            var tblTr = tbl.rows[0];
            tblTr.cells[1].innerHTML = this.getValueByName(0, field.get(field.Name, this.currentTop));

            for (var i = 0; i < 6; i++) {
                var tr = this.table.rows[i + 1];
                tr.cells[0].innerHTML = viewCell.labels[i];
                tr.cells[1].innerHTML = this.getValueByName(0, field.get(viewCell.values[i], this.currentTop));
            }
        },

        createListUIExpanded: function (builder) {
            if (this.table && this.table.innerHTML) {
                domConstruct.destroy(this.table);
            }

            this.table = builder.addContent("table", {
                "class": "Tapestry_Table",
                "cellpadding": "0",
                "cellspacing": "0"
            });

            dom.createCols(this.table, [null, null, 1, null]);

            for (var i = 1; i < 4; i++) {
                var tr = this.table.insertRow(-1);
                var cell = tr.insertCell(-1);
                domAttr.set(cell, "class", "Tapestry_PrcCell Tapestry_Top" + tops[i]);
                domAttr.set(cell, "rowspan", "2");

                cell = tr.insertCell(-1);
                domAttr.set(cell, "class", "Tapestry_HeaderCell Tapestry_Top" + tops[i] + " Tapestry_LeftCell topName");
                domAttr.set(cell, "colspan", "3");

                tr = this.table.insertRow(-1);
                cell = tr.insertCell(-1);
                domAttr.set(cell, "class", "Tapestry_ValueCell Tapestry_Top" + tops[i] + " Tapestry_LeftCell");
                domAttr.set(cell, "colspan", "3");

                this.addTextRows(i);
            }
        },

        addTextRows: function (top) {
            for (var i = 0; i < 3; i++) {
                var tr = this.table.insertRow(-1);
                tr.insertCell(-1);

                domAttr.set(tr.insertCell(-1), "class", "Tapestry_AttrCell");

                domAttr.set(tr.insertCell(-1), "class", "Tapestry_TextCell");


                if (i === 0) {
                    var cell = tr.insertCell(-1);
                    domAttr.set(cell, "rowspan", "3");
                    addRightArrow(cell, top, this);
                }
            }
        },

        updateMode: function (top) {
            this.currentTop = top;
            this.destroy(true);
            this.update();
        },

        createListUICollapsed: function (builder) {
            if (this.table && this.table.innerHTML) {
                domConstruct.destroy(this.table);
            }

            this.table = builder.addContent("table", {
                "class": "Tapestry_Table",
                "cellpadding": "0",
                "cellspacing": "0"
            });
            dom.createCols(this.table, [null, 1, null]);

            for (var i = 1; i < 4; i++) {
                var tr = this.table.insertRow(-1);
                var cell = tr.insertCell(-1);
                domAttr.set(cell, "class", "Tapestry_ListCell Tapestry_Top" + tops[i] + " Tapestry_PrcCell");
                domAttr.set(cell, "rowspan", "2");
                domConstruct.create("div", null, cell);

                domAttr.set(tr.insertCell(-1), "class", "Tapestry_HeaderCell Tapestry_ListCell Tapestry_Top" + tops[i] + " Tapestry_LeftCell");

                cell = tr.insertCell(-1);
                domAttr.set(cell, "rowspan", "2");
                domAttr.set(cell, "class", "Tapestry_ListCell");
                addRightArrow(cell, i, this);

                domAttr.set(this.table.insertRow(-1).insertCell(-1), "class", "Tapestry_HeaderCell Tapestry_Top" + tops[i] + " Tapestry_LeftCell");
            }
        },

        createViewUIExpanded: function (builder) {
            if (this.table && this.table.innerHTML) {
                domConstruct.destroy(this.table);
            }

            this.table = builder.addContent("table", {
                "class": "Tapestry_Table",
                "cellpadding": "1",
                "cellspacing": "0"
            });

            dom.createCols(this.table, [null, null, 1]);

            var tr = this.table.insertRow(0);
            var cell = tr.insertCell(-1);
            domAttr.set(cell, "class", "Tapestry_LeftArrowCell");

            on(cell, "click", lang.hitch(this, this.updateMode, 0));

            var td = tr.insertCell(-1);
            domAttr.set(td, "class", "Tapestry_HeaderCell Tapestry_Top" + tops[this.currentTop] + "");
            domAttr.set(td, "colspan", "2");

            tr = this.table.insertRow(-1);
            tr.insertCell(-1);

            cell = tr.insertCell(-1);
            domAttr.set(cell, "colspan", "2");

            for (var i = 0; i < 6; i++) {
                tr = this.table.insertRow(-1);

                domAttr.set(tr.insertCell(-1), "class", i === 0 ? "Tapestry_AttrCell Tapestry_TopCell" : "Tapestry_AttrCell");
                domAttr.set(tr.insertCell(-1), "class", i === 0 ? "Tapestry_AttrCell Tapestry_TopCell" : "Tapestry_AttrCell");
                domAttr.set(tr.insertCell(-1), "class", i === 0 ? "Tapestry_TextCell Tapestry_TopCell" : "Tapestry_TextCell");
            }
        },

        createViewUICollapsed: function (builder) {
            if (this.table && this.table.innerHTML) {
                domConstruct.destroy(this.table);
            }

            this.table = builder.addContent("table", {
                "class": "Tapestry_Table",
                "cellpadding": "1",
                "cellspacing": "0"
            });

            dom.createCols(this.table, [null, 1]);

            var tr = this.table.insertRow(0);

            var cell = tr.insertCell(-1);
            domAttr.set(cell, "colspan", "2");
            domAttr.set(cell, "class", "LeftArrow");

            var tblRow = domConstruct.create("table", null, cell).insertRow(0);
            domAttr.set(tblRow.insertCell(-1), "class", "Tapestry_LeftArrowCell");

            on(this.table.rows[0].cells[0].children[0].rows[0].cells[0], "click", lang.hitch(this, this.updateMode, 0));

            domAttr.set(tblRow.insertCell(-1), "class", "Tapestry_HeaderCell Tapestry_Top" + tops[this.currentTop]);

            for (var i = 0; i < 6; i++) {
                tr = this.table.insertRow(-1);

                domAttr.set(tr.insertCell(-1), "class", i === 0 ? "Tapestry_AttrCell Tapestry_TopCell" : "Tapestry_AttrCell Tapestry_ViewCell");
                domAttr.set(tr.insertCell(-1), "class", i === 0 ? "Tapestry_TextCell Tapestry_TopCell" : "Tapestry_TextCell Tapestry_ViewCell");
            }
        },

        noValue: function (top) {
            var v = Number(this.getValueByName(0, field.get(field.Value, top)));
            return (!v || v <= 0);
        }
    });

    var field = {
        Code: "CODE",
        Name: "NAME",
        Value: "VALUE",
        Percentage: "PRC",
        Type: "TYPE",
        Age: "AGE",
        Income: "INCOME",
        Employment: "EMP",
        Education: "EDU",
        Residental: "RSD",
        Race: "RACE",

        get: function (name, top) {
            return "TOP" + top + name;
        }
    };

    var addRightArrow = function (cell, top, context) {
        domConstruct.create("div", {
            "class": "Tapestry_RightArrowCell",
            "id": "arr" + top
        }, cell);

        on(cell, "click", lang.hitch(context, context.updateMode, top));
    };

    var tops = { 1: "One", 2: "Two", 3: "Three" };

    var bindEmptyTapestryRows = function (table, top, start, rowsCount, appendDiv) {
        for (var r = start; r < start + rowsCount; r++) {
            query("td", table.rows[r]).forEach(function (cell) {
                if (query("#arr" + top, cell).length === 0) {
                    domConstruct.empty(cell);
                }
                if (appendDiv && cell.className.indexOf("Tapestry_PrcCell") > -1) {
                    domConstruct.create("div", null, cell);
                }
            });
        }
    };

    var viewCell = {
        labels: [nls.hhTypeLabel, nls.medianAgeLabel, nls.incomeLabel, nls.employmentLabel, nls.educationLabel, nls.residentialLabel],
        values: [field.Type, field.Age, field.Income, field.Employment, field.Education, field.Residental],

        bindTopIcon: function (cell, id) {
            domConstruct.empty(cell);

            var img = require.toUrl("./images/tapestry" + id + ".png");
            domConstruct.create("div", {
                "class": "Tapestry_ViewImage",
                "style": "background-image:url('" + img + "')"
            }, cell);
        }
    };

    return Tapestry;
});