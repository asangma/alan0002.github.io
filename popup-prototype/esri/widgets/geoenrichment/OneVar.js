define([
    "../../core/declare",
    "./BaseWidget",
    "./dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/string",
    "./lang",
    "dojo/i18n!../../nls/jsapi",
    "./utils",
    "./formatVariable"

], function (declare, BaseWidget, dom, domClass, domConstruct, domAttr, query, string, esriLang, nls, utils, formatVariable) {
    nls = nls.geoenrichment.dijit.OneVar;

    var OneVar = declare("esri.widgets.geoenrichment.OneVar", [BaseWidget], {

        constructor: function () {
            this._state = {
                sortBy: 1,
                sortDesc: true
            };
        },

        _calculate: function () {
            var indexes = this.getDataFields();
            var firstCol = this.getFieldByIndex(indexes[0]);

            this.primary.innerHTML = this.formatByIndex(0, indexes[0]) + " ";

            return { firstCol: firstCol };
        },

        updateUIExpanded: function () {
            this.inherited(arguments);
            var vars = this._calculate();
            var displayCol = vars.firstCol;
            var siteRow = null;
            var i;
            if (displayCol) {
                var rows = [];
                var rowCount = this.data.features.length;
                for (i = 0; i < rowCount; i++) {
                    var dataRow = [];
                    if (!siteRow) {
                        siteRow = dataRow;
                    }
                    dataRow.push(this.getFeatureTitle(i));
                    dataRow.push(this.getValueByName(i, displayCol.name));
                    rows.push(dataRow);
                }
                this.site.innerHTML = nls.subtitleSite2;

                this._sortRows(rows);
                var value = this.getValueByName(0, displayCol.name);
                var isNum = esriLang.isNumber(value);
                if (isNum) {
                    var compareTo = this.getValueByName(rowCount - 1, displayCol.name);
                    var compSite = this.getFeatureTitle(rowCount - 1);
                    var dif = 1 - compareTo / value;
                    if (Math.abs(dif) < 0.005) {
                        dif = 0;
                    }
                    var format;
                    if (dif < 0) {
                        format = nls.lessThan;
                    }
                    else if (dif > 0) {
                        format = nls.moreThan;
                    }
                    else {
                        format = nls.same;
                    }
                    this.comp.innerHTML = string.substitute(format, { site: compSite });
                }
                else {
                    this.comp.innerHTML = "";
                }
                var table = this.table;
                var needRows = rows.length + 1;

                while (table.rows.length > 1) {
                    table.deleteRow(-1);
                }

                var row = table.rows[0];
                if (isNum) {
                    while (row.cells.length < 4) {
                        row.insertCell(-1);
                    }
                }
                else {
                    while (row.cells.length > 2) {
                        domConstruct.destroy(row.cells[row.cells.length - 1]);
                    }
                }

                for (i = 1; i < needRows; i++) {
                    var tr = table.insertRow(-1);

                    if (i % 2 === 0 && i > 0) {
                        tr.className = "AlternatingRow";
                    }

                    domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_TextColumn");
                    domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ValueColumn");

                    if (isNum) {
                        var chartCell = domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ChartColumn");
                        domAttr.set(chartCell, "colspan", "2");
                    }
                }

                var norm = Number.NEGATIVE_INFINITY;
                if (isNum) {
                    for (i = 0; i < rows.length; i++) {
                        if (rows[i][1] > norm) {
                            norm = rows[i][1];
                        }
                    }
                    norm = utils.getCeiling(norm);
                    table.rows[0].cells[2].innerHTML = formatVariable(displayCol, 0);
                    table.rows[0].cells[3].innerHTML = formatVariable(displayCol, norm);
                }

                for (i = 0; i < rows.length; i++) {
                    row = table.rows[i + 1];
                    row.cells[0].innerHTML = rows[i][0];
                    row.cells[1].innerHTML = formatVariable(displayCol, rows[i][1]);
                    if (isNum) {
                        var barClass;
                        if (rows[i] === siteRow) {
                            domClass.remove(row, "OneVarMultiComparison_Row");
                            domClass.add(row, "OneVarMultiComparison_CurrentRow");
                            barClass = "OneVarMultiComparison_Expanded_CurrentBar";
                        } else {
                            domClass.remove(row, "OneVarMultiComparison_CurrentRow");
                            domClass.add(row, "OneVarMultiComparison_Row");
                            barClass = "OneVarMultiComparison_Expanded_Bar";
                        }
                        var width = dom.pct(rows[i][1] / norm);
                        row.cells[2].innerHTML = "<div class='" + barClass + "' style='width:" + width + "' />";

                        domAttr.set(row.cells[0], "style", "width:50%");
                        domAttr.set(row.cells[1], "style", "width:20%");
                    }
                    else {
                        domAttr.set(row.cells[0], "style", "width:50%");
                        domAttr.set(row.cells[1], "style", "width:50%");
                    }
                }
            }
        },

        updateUICollapsed: function () {
            this.inherited(arguments);
            var vars = this._calculate();
            var displayCol = vars.firstCol;
            var siteRow = null;
            var i;
            if (displayCol) {
                var rows = [];
                var rowCount = this.data.features.length;
                for (i = 0; i < rowCount; i++) {
                    var dataRow = [];
                    if (!siteRow) {
                        siteRow = dataRow;
                    }
                    dataRow.push(this.getFeatureTitle(i));
                    dataRow.push(this.getValueByName(i, displayCol.name));
                    rows.push(dataRow);
                }

                this._sortRows(rows);
                var value = this.getValueByName(0, displayCol.name);
                var table = this.table;
                var needRows = rows.length + 1;
                for (i = table.rows.length; i < needRows; i++) {
                    var tr = table.insertRow(-1);
                    if (i % 2 === 0) {
                        tr.className = "AlternatingRow";
                    }
                    domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_TextColumn");
                    domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ValueColumn");
                }
                while (table.rows.length > needRows) {
                    table.deleteRow(-1);
                }

                var isNum = esriLang.isNumber(value);
                var columns = query("col", this.table);

                if (!isNum) {
                    domAttr.set(columns[0], "style", "width:50%");
                    domAttr.set(columns[1], "style", "width:50%");
                }
                else {
                    domAttr.set(columns[0], "style", "width:70%");
                    domAttr.set(columns[1], "style", "width:30%");
                }

                for (i = 0; i < rows.length; i++) {
                    var row = table.rows[i + 1];
                    row.cells[0].innerHTML = rows[i][0];
                    row.cells[1].innerHTML = formatVariable(displayCol, rows[i][1]);

                    if (rows[i] === siteRow) {
                        domClass.remove(row, "OneVarMultiComparison_Row");
                        domClass.add(row, "OneVarMultiComparison_CurrentRow");
                    } else {
                        domClass.remove(row, "OneVarMultiComparison_CurrentRow");
                        domClass.add(row, "OneVarMultiComparison_Row");
                    }
                }
            }
        },

        createUIExpanded: function (builder) {
            this.inherited(arguments);

            var valueDiv = builder.addHeader("div", {
                "class": "OneVarMultiComparison_Value"
            });

            var tbl = domConstruct.create("table", {
                "cellpadding": "0",
                "cellspacing": "0"
            }, valueDiv);
            var tr = tbl.insertRow(0);
            var cell = tr.insertCell(-1);

            this.site = domConstruct.create("span", {
                "class": "OneVarMultiComparison_Expanded_Value_Site"
            }, cell);

            tr = tbl.insertRow(-1);
            cell = tr.insertCell(-1);

            this.primary = domConstruct.create("span", {
                "class": "OneVarMultiComparison_Expanded_Value_Primary"
            }, cell);

            this.comp = domConstruct.create("span", {
                "class": "OneVarMultiComparison_Comparison"
            }, cell);

            this.table = builder.addContent("table", {
                "class": "OneVarMultiComparison_Table"
            });
            dom.createCols(this.table, [0.5, 0.2, 0.15, 0.15]);
            tr = this.table.insertRow(-1);
            this._appendSortHeader(tr, nls.areaCol, 0, {
                "class": "OneVarMultiComparison_TextColumnHeader"
            });
            this._appendSortHeader(tr, nls.valueCol, 1, {
                "class": "OneVarMultiComparison_ValueColumnHeader"
            });
            domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ChartColumnHeader_Lower");
            domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ChartColumnHeader_Upper");
            if (this.autoHeight) {
                builder.contentClass.push("OneVarMultiComparison_Expanded_ContentPane");
            }

            builder.addFooter("div");
        },

        createUICollapsed: function (builder) {
            this.inherited(arguments);

            var valueDiv = builder.addHeader("div", {
                "class": "OneVarMultiComparison_Value"
            });

            var tbl = domConstruct.create("table", {
                "cellpadding": "0",
                "cellspacing": "0"
            }, valueDiv);

            var tr = tbl.insertRow(0);
            var cell = tr.insertCell(-1);

            this.site = domConstruct.create("span", {
                "class": "OneVarMultiComparison_Expanded_Value_Site"
            }, cell);

            tr = tbl.insertRow(-1);
            cell = tr.insertCell(-1);

            this.primary = domConstruct.create("span", {
                "class": "OneVarMultiComparison_Expanded_Value_Primary"
            }, cell);

            this.table = builder.addContent("table", {
                "class": "OneVarMultiComparison_Table"
            });
            dom.createCols(this.table, [0.7, 0.3]);

            tr = this.table.insertRow(-1);
            this._appendSortHeader(tr, nls.areaCol, 0, {
                "class": "OneVarMultiComparison_TextColumnHeader"
            });
            this._appendSortHeader(tr, nls.valueCol, 1, {
                "class": "OneVarMultiComparison_ValueColumnHeader"
            });
            domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ChartColumnHeader_Lower");
            domAttr.set(tr.insertCell(-1), "class", "OneVarMultiComparison_ChartColumnHeader_Upper");
            if (this.autoHeight) {
                builder.contentClass.push("OneVarMultiComparison_Expanded_ContentPane");
            }

            builder.addFooter("div");
        }

    });

    return OneVar;
});
