define([
    "../../core/declare",
    "./BaseSelectComparison",
    "./dom",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "./lang",
    "dojo/i18n!../../nls/jsapi",
    "dojo/dom-class",
    "dojo/query",
    "dojo/string",
    "dojo/number",
    "./formatVariable"

], function (declare, BaseSelectComparison, dom, domConstruct, domAttr, esriLang, nls, domClass, query, string, number, formatVariable) {
    nls = nls.geoenrichment.dijit.RelatedVariables;

    var RelatedVariables = declare("esri.widgets.geoenrichment.RelatedVariables", [BaseSelectComparison], {

        _calculate: function () {
            var highCol, lowCol;
            var highValue = Number.NEGATIVE_INFINITY;
            var lowValue = Number.POSITIVE_INFINITY;
            var maxDif = Number.NEGATIVE_INFINITY;
            var minDif = Number.POSITIVE_INFINITY;
            var maxPct = Number.NEGATIVE_INFINITY;
            var minPct = Number.POSITIVE_INFINITY;
            var rows = [];
            var indexes = this.getDataFields();
            for (var i = 0; i < indexes.length; i++) {
                var field = this.getFieldByIndex(indexes[i]);
                var value = this.getValueByName(0, field.name);
                var dif;
                if (this._state.selectedComparison >= 0) {
                    dif = number.round(value - this.getValueByName(this._getComparisonRow(), field.name), field.decimals || 0);
                } else {
                    dif = Number.NaN;
                }
                if (dif > maxDif) {
                    maxDif = dif;
                }
                if (dif < minDif) {
                    minDif = dif;
                }
                var row = [];
                row.push(i);
                row.push(field.alias);
                row.push(value);
                row.push(dif);
                rows.push(row);
                if (value > highValue) {
                    highValue = value;
                    highCol = indexes[i];
                }
                if (value < lowValue) {
                    lowValue = value;
                    lowCol = indexes[i];
                }

                if (value > maxPct) {
                    maxPct = value;
                }
                if (value < minPct) {
                    minPct = value;
                }
            }
            this._sortRows(rows);

            return {
                rows: rows,
                indexes: indexes,
                minDif: minDif,
                maxDif: maxDif,
                minPct: minPct,
                maxPct: maxPct,
                highCol: highCol,
                lowCol: lowCol,
                lowValue: lowValue,
                highValue: highValue
            };
        },

        updateUIExpanded: function () {
            this.inherited(arguments);
            var vars = this._calculate();
            var norm = Math.max(Math.abs(vars.minDif), Math.abs(vars.maxDif));
            var tr;
            var headerRows = 1;
            var i;
            for (i = this.table.rows.length; i < vars.indexes.length + headerRows; i++) {
                tr = this.table.insertRow(-1);
                if (i > 0 && i % 2 === 0) {
                    tr.className = "AlternatingRow";
                }
                domAttr.set(tr.insertCell(-1), "class", "RelatedVariables_TextColumn");
                domAttr.set(tr.insertCell(-1), "class", "RelatedVariables_ValueColumn");
                tr.insertCell(-1);
                var td;

                td = tr.insertCell(-1);
                domAttr.set(td, "class", "RelatedVariables_ChartNegative");
                domAttr.set(td, "style", "padding: 0;");

                td = tr.insertCell(-1);
                domAttr.set(td, "class", "RelatedVariables_ChartPositive");
                domAttr.set(td, "style", "padding: 0;");
            }
            while (this.table.rows.length > vars.indexes.length + headerRows) {
                this.table.deleteRow(-1);
            }

            var width, field;
            for (i = 0; i < vars.rows.length; i++) {
                field = this.getFieldByIndex(vars.indexes[vars.rows[i][0]]);
                tr = this.table.rows[i + headerRows];
                tr.cells[0].innerHTML = vars.rows[i][1];
                tr.cells[1].innerHTML = formatVariable(field, vars.rows[i][2]);
                var dif = vars.rows[i][3];
                if (esriLang.isNumber(dif)) {
                    var difStr;
                    if (dif > 0) {
                        difStr = "+" + formatVariable(field, dif);
                    }
                    else if (dif < 0) {
                        difStr = "-" + formatVariable(field, -dif);
                    }
                    else {
                        difStr = "0";
                    }
                    tr.cells[2].innerHTML = difStr;
                    tr.cells[2].className = "RelatedVariables_DifferenceColumn";
                    if (dif > 0) {
                        domClass.add(tr.cells[2], "RelatedVariables_DifferenceColumn_Positive");
                        width = dom.pct(dif / norm);
                        tr.cells[3].innerHTML = "";
                        tr.cells[4].innerHTML = "<div class='RelatedVariables_PositiveBar' style='width:" + width + "' />";
                    } else if (dif < 0) {
                        domClass.add(tr.cells[2], "RelatedVariables_DifferenceColumn_Negative");
                        width = dom.pct(-dif / norm);
                        tr.cells[3].innerHTML = "<div class='RelatedVariables_NegativeBar' style='width:" + width + "' />";
                        tr.cells[4].innerHTML = "";
                    }
                    else {
                        tr.cells[3].innerHTML = "";
                        tr.cells[4].innerHTML = "";
                    }
                } else {
                    tr.cells[2].innerHTML = "";
                    tr.cells[3].innerHTML = "";
                    tr.cells[4].innerHTML = "";
                }
            }

            field = this.getFieldByIndex(vars.highCol);
            this.highLabel.innerHTML = string.substitute(nls.highLabel2, { alias: field.alias }) + " (" + formatVariable(field, vars.highValue) + ")";

            field = this.getFieldByIndex(vars.lowCol);
            this.lowLabel.innerHTML = string.substitute(nls.lowLabel2, { alias: field.alias }) + " (" + formatVariable(field, vars.lowValue) + ")";
        },

        updateUICollapsed: function () {
            this.inherited(arguments);
            var vars = this._calculate();
            var tr;
            var headerRows = 1;
            var i;
            for (i = this.table.rows.length; i < vars.indexes.length + headerRows; i++) {
                tr = this.table.insertRow(-1);
                if (i > 0 && i % 2 === 0) {
                    tr.className = "AlternatingRow";
                }
                domAttr.set(tr.insertCell(-1), "class", "RelatedVariables_TextColumn");
                domAttr.set(tr.insertCell(-1), "class", "RelatedVariables_ValueColumn");
            }
            while (this.table.rows.length > vars.indexes.length + headerRows) {
                this.table.deleteRow(-1);
            }

            for (i = 0; i < vars.rows.length; i++) {
                var field = this.getFieldByIndex(vars.indexes[vars.rows[i][0]]);
                tr = this.table.rows[i + headerRows];
                tr.cells[0].innerHTML = vars.rows[i][1];
                tr.cells[1].innerHTML = formatVariable(field, vars.rows[i][2]);

                domClass.remove(tr.cells[1], "MaxPct");
                domClass.remove(tr.cells[1], "MinPct");

                if (vars.rows[i][2] == vars.maxPct) {
                    domClass.add(tr.cells[1], "MaxPct");
                }

                if (vars.rows[i][2] == vars.minPct) {
                    domClass.add(tr.cells[1], "MinPct");
                }
            }
        },

        createUIExpanded: function (builder) {
            this.inherited(arguments);
            var labelsDiv = builder.addHeader("div", { "class": "RelatedVariables_Labels" });
            this.highLabel = domConstruct.create("div", { "class": "RelatedVariables_HighLabel" }, labelsDiv);
            this.lowLabel = domConstruct.create("div", { "class": "RelatedVariables_LowLabel" }, labelsDiv);
            this.table = builder.addContent("table", {
                "class": "RelatedVariables_Table",
                "cellpadding": "2",
                "cellspacing": "0"
            });
            dom.createCols(this.table, [0.35, 0.15, 0.15, 0.175, 0.175]);
            var tr = this.table.insertRow(0);
            this._appendSortHeader(tr, nls.indicatorCol, 0, {
                "class": "RelatedVariables_ColumnHeader"
            });
            this._appendSortHeader(tr, nls.valueCol, 2, {
                "class": "RelatedVariables_ColumnHeader"
            });
            this._appendSortHeader(tr, nls.difCol, 3, {
                "class": "RelatedVariables_ColumnHeader",
                "colspan": "3"
            });
            var rightDiv = builder.addFooter("div", {
                "class": "RelatedVariables_ComparisonDiv"
            });
            domConstruct.create("div", {
                "class": "RelatedVariables_ComparisonLabel",
                innerHTML: nls.chartLabel
            }, rightDiv);
            this._createComboBox(rightDiv);
        },

        createUICollapsed: function (builder) {
            this.inherited(arguments);
            this.table = builder.addContent("table", {
                "class": "RelatedVariables_Table",
                "cellpadding": "2",
                "cellspacing": "0"
            });
            dom.createCols(this.table, [0.7, 0.3]);

            var tr = this.table.insertRow(0);
            this._appendSortHeader(tr, nls.indicatorCol, 0, {
                "class": "RelatedVariables_ColumnHeader"
            });
            this._appendSortHeader(tr, nls.valueCol, 2, {
                "class": "RelatedVariables_ColumnHeader"
            });
        }

    });

    return RelatedVariables;

});
