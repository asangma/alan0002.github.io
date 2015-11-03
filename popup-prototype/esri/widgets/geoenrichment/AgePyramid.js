define([
    "../../core/declare",
    "require",
    "dojo/_base/lang",
    "./BaseSelectComparison",
    "dojo/dom-construct",
    "dojo/number",
    "dojo/dom-class",
    "./utils",
    "./theme",
    "dojox/charting/Chart",
    "dojox/charting/axis2d/Default",
    "dojox/charting/plot2d/Bars",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/Highlight",
    "dojox/charting/SimpleTheme",
    "dojo/i18n!../../nls/jsapi"

], function (declare, require, lang, BaseSelectComparison, domConstruct, number, domClass, utils, currentTheme, Chart, Default, Bars, Lines, Tooltip, Highlight, SimpleTheme, nls) {
    nls = nls.geoenrichment.dijit.AgePyramid;

    var LINES = "lines";
    var BARS = "bars";

    var AgePyramid = declare("esri.widgets.geoenrichment.AgePyramid", [BaseSelectComparison], {

        chart: null,
        _currentTheme: null,
        _themeChangeHandle: null,

        updateUI: function () {
            this.inherited(arguments);
            if (!this._themeChangeHandle) {
                this._themeChangeHandle = currentTheme.on("change", lang.hitch(this, this._onThemeChange));
            }
            if (this._currentTheme) {
                this._doUpdateUI();
            }
            else {
                currentTheme.load("AgePyramid").then(lang.hitch(this, this._onThemeLoad));
            }
        },

        _onThemeChange: function () {
            this._currentTheme = null;
            this._destroyChart();
            this.updateUI();
        },

        _onThemeLoad: function (themeJson) {
            this._currentTheme = themeJson;
            this._currentTheme.theme = new SimpleTheme(themeJson.theme);
            this._doUpdateUI();
        },

        _doUpdateUI: function () {
            this.ensureChart();
            var allIndices = this.getDataFields();
            this.maleIndices = [];
            this.femaleIndices = [];
            var count = allIndices.length / 2;
            var max = Number.NEGATIVE_INFINITY;
            var min = Number.POSITIVE_INFINITY;
            var maxText, minText;
            var maxIsMale = true;
            var minIsMale = true;
            for (var i = 0; i < allIndices.length; i++) {
                var isMale = i < count;
                if (isMale) {
                    this.maleIndices.push(allIndices[i]);
                } else {
                    this.femaleIndices.push(allIndices[i]);
                }
                var value = this.getValueByIndex(0, allIndices[i]);
                if (value > max) {
                    max = value;
                    maxText = this.getFieldByIndex(allIndices[i]).alias;
                    maxIsMale = isMale;
                } else if (value < min) {
                    min = value;
                    minText = this.getFieldByIndex(allIndices[i]).alias;
                    minIsMale = isMale;
                }
            }

            var maxMale = this.setSeriesData(this.chart.getSeries("male_bars"), 0, this.maleIndices, -1);
            var maxFemale = this.setSeriesData(this.chart.getSeries("female_bars"), 0, this.femaleIndices, 1);
            var maxCompMale, maxCompFemale;
            if (this.expanded) {
                var compRow = this._getComparisonRow();
                maxCompMale = this.setSeriesData(this.chart.getSeries("male_lines"), compRow, this.maleIndices, -1);
                maxCompFemale = this.setSeriesData(this.chart.getSeries("female_lines"), compRow, this.femaleIndices, 1);
            }
            else {
                this.chart.getSeries("male_lines").update([]);
                this.chart.getSeries("female_lines").update([]);
                maxCompMale = Number.NEGATIVE_INFINITY;
                maxCompFemale = Number.NEGATIVE_INFINITY;
            }
            this.extreme = utils.getCeiling(Math.max(maxMale, maxFemale, maxCompMale, maxCompFemale), true);
            this.chart.removeAxis("y");
            this.chart.addAxis("y", {
                type: Default,
                min: -this.extreme,
                max: this.extreme,
                minorTicks: false,
                labelFunc: lang.hitch(this, this.getAxisLabel)
            });

            this.chart.render();

            if (this.expanded) {
                if (maxIsMale) {
                    domClass.replace(this.max, "AgePyramid_TextMale", "AgePyramid_TextFemale");
                } else {
                    domClass.replace(this.max, "AgePyramid_TextFemale", "AgePyramid_TextMale");
                }
                if (minIsMale) {
                    domClass.replace(this.min, "AgePyramid_TextMale", "AgePyramid_TextFemale");
                } else {
                    domClass.replace(this.min, "AgePyramid_TextFemale", "AgePyramid_TextMale");
                }
                this.max.innerHTML = maxText;
                this.min.innerHTML = minText;
            }
        },

        getAxisLabel: function (text, value, precision) {
            value = Math.abs(value);
            if (value != this.extreme) {
                return number.format(value, { places: 0 });
            } else {
                return number.format(value / 100, { places: 0, type: "percent" });
            }
        },

        resize: function () {
            this.inherited(arguments);
            if (this.chart) {
                this.chart.resize();
            }
        },

        ensureChart: function () {
            if (this.chart) {
                return;
            }
            var theme = this._currentTheme;
            var chart = this.chart = new Chart(this.chartDiv);
            chart.setTheme(theme.theme);
            chart.addPlot(LINES, {
                type: Lines,
                markers: true
            });
            chart.addPlot(BARS, {
                type: Bars,
                gap: this.expanded ? 1.5 : 1
            });
            chart.addSeries("male_bars", [], lang.mixin({
                plot: BARS
            }, theme.male));
            chart.addSeries("female_bars", [], lang.mixin({
                plot: BARS
            }, theme.female));
            chart.addSeries("male_lines", [], lang.mixin({
                plot: LINES
            }, theme.line));
            chart.addSeries("female_lines", [], lang.mixin({
                plot: LINES
            }, theme.line));
            var p = {
                text: lang.hitch(this, this.getTooltip)
            };
            /* jshint -W031 */
            new Tooltip(chart, BARS, p);
            new Tooltip(chart, LINES, p);
            new Highlight(chart, BARS, {
                duration: 1
            });
            new Highlight(chart, LINES, {
                duration: 1, highlight: theme.highlight
            });
            /* jshint +W031 */
        },

        getTooltip: function (a) {
            var theme = this._currentTheme;
            var colIndex;
            var rowIndex;
            switch (a.run.name) {
                case "male_bars":
                    colIndex = this.maleIndices[a.index];
                    rowIndex = 0;
                    break;
                case "female_bars":
                    colIndex = this.femaleIndices[a.index];
                    rowIndex = 0;
                    break;
                case "male_lines":
                    colIndex = this.maleIndices[a.index];
                    rowIndex = this._getComparisonRow();
                    break;
                case "female_lines":
                    colIndex = this.femaleIndices[a.index];
                    rowIndex = this._getComparisonRow();
                    break;
                default:
                    return "";
            }
            var name = this.getFeatureTitle(rowIndex);
            var alias = this.getFieldByIndex(colIndex).alias;
            var count = number.format(this.getValueByIndex(rowIndex, colIndex), { places: 0 });
            var pct = a.plot.name === LINES ? a.x : a.y;
            var pctStr = number.format(Math.abs(pct) / 100, { places: 1, type: "percent" });
            return "<div class='AgePyramid_Tooltip_Content'><span style='font:" + theme.font + "; color:" + theme.color + ";'><b>" + name + "</b > <br / > " + alias + "<br/>" + count + " (" + pctStr + ")</span></div>";
        },

        setSeriesData: function (series, rowIndex, colIndices, multiplier) {
            var values = [];
            var total = 0;
            var i, value;
            for (i = 0; i < colIndices.length; i++) {
                value = this.getValueByIndex(rowIndex, colIndices[i]);
                values.push(value);
                total += value;
            }
            var max = Number.NEGATIVE_INFINITY;
            for (i = 0; i < colIndices.length; i++) {
                value = values[i] / total * 100;
                values[i] = value * multiplier;
                if (value > max) {
                    max = value;
                }
            }
            if (series.plot === LINES) {
                for (i = 0; i < values.length; i++) {
                    values[i] = {
                        x: values[i],
                        y: i + 1
                    };
                }
            }
            series.update(values);
            return max;
        },

        createUI: function (builder) {
            this.inherited(arguments);
            builder.contentClass.push("AgePyramid_ContentPane");
            this.chartDiv = builder.addContent("div", {
                "class": "AgePyramid_Chart"
            });
        },

        createUIExpanded: function (builder) {
            this.inherited(arguments);
            var minMaxDiv = builder.addContent("div", {
                "class": "AgePyramid_MinMax"
            });
            domConstruct.create("div", { innerHTML: nls.maxLabel }, minMaxDiv);
            this.max = domConstruct.create("div", {
                "class": "AgePyramid_Text"
            }, minMaxDiv);
            domConstruct.create("div", {
                "class": "AgePyramid_MinLabel",
                innerHTML: nls.minLabel
            },
            minMaxDiv);
            this.min = domConstruct.create("div", {
                "class": "AgePyramid_Text"
            }, minMaxDiv);
            var compDiv = builder.addContent("div", {
                "class": "AgePyramid_Comparison"
            });
            domConstruct.create("div", {
                "class": "AgePyramid_ComparisonLabel",
                innerHTML: nls.compLabel
            }, compDiv);
            this._createComboBox(compDiv);
        },

        createUICollapsed: function (builder) {
            this.inherited(arguments);
            domConstruct.create("div", {
                "class": "MenLabel",
                innerHTML: nls.menLabel
            }, this.chartDiv);

            domConstruct.create("div", {
                "class": "WomenLabel",
                innerHTML: nls.womenLabel
            }, this.chartDiv);
        },

        destroy: function () {
            this._destroyChart();
            if (this._themeChangeHandle) {
                this._themeChangeHandle.remove();
                this._themeChangeHandle = null;
            }
            this.inherited(arguments);
        },

        _destroyChart: function () {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        }

    });

    return AgePyramid;
});
