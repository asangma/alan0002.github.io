define([
    "../../core/declare",
    "dojo/number",
    "./lang"

], function (declare, number, esriLang) {

    var ReportData = declare("esri.widgets.geoenrichment.ReportData", null, {

        title: null,

        _cols: null,
        _rows: null,
        _indexes: null,

        constructor: function () {
            this._cols = [];
            this._rows = [];
        },

        addCol: function (col) {
            this._indexes = null;
            this._cols.push(col);
        },

        getColCount: function () {
            return this._cols.length;
        },

        getCol: function (index) {
            return this._cols[index];
        },

        addRow: function (values) {
            this._rows.push(values);
        },

        getRow: function (index) {
            return this._rows[index];
        },

        getRowCount: function () {
            return this._rows.length;
        },

        findField: function (name) {
            if (!this._indexes) {
                this._indexes = {
                };
                var length = this._cols.length;
                for (var i = 0; i < length; i++) {
                    this._indexes[this._cols[i].name] = i;
                }
            }
            return this._indexes[name];
        },

        getValue: function (rowIndex, field) {
            if (esriLang.isNumber(field)) {
                return this._rows[rowIndex][field];
            } else {
                return this._rows[rowIndex][this.findField(field)];
            }
        },

        formatValue: function (rowIndex, field) {
            var colIndex = esriLang.isNumber(field) ? field : this.findField(field);
            return this.getCol(colIndex).format(this._rows[rowIndex][colIndex]);
        },

        clearRows: function (startAt) {
            if (!esriLang.isNumber(startAt)) {
                this._rows = [];
            }
            else {
                this._rows.splice(startAt, this._rows.length - startAt);
            }
        },

        clearCols: function () {
            this.clearRows();
            this._cols = [];
            this._indexes = null;
        }

    });

    var Column = declare(null, {

        name: null,
        alias: null,
        fullName: null,

        constructor: function (json) {
            this.name = json.name;
            this.alias = json.alias || json.name;
            this.fullName = json.fullName || null;
        }

    });

    var NumericColumn = declare([Column], {

        decimals: 0,

        constructor: function (json) {
            this.decimals = json.decimals || 0;
        },

        format: function (value) {
            return number.format(value, { places: this.decimals });
        }

    });
    ReportData.NumericColumn = NumericColumn;

    var PercentColumn = declare([NumericColumn], {

        format: function (value) {
            return number.format(value / 100, { places: this.decimals, type: "percent" });
        }

    });
    ReportData.PercentColumn = PercentColumn;

    var CurrencyColumn = declare([NumericColumn], {

        constructor: function (json) {
            this.symbol = json.symbol || "$";
        },

        format: function (value) {
            return number.format(value, { places: this.decimals, type: "currency", symbol: this.symbol });
        }

    });
    ReportData.CurrencyColumn = CurrencyColumn;

    var StringColumn = declare([Column], {

        format: function (value) {
            return value;
        }

    });
    ReportData.StringColumn = StringColumn;

    return ReportData;
});