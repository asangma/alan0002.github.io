define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "dojo/topic",

  "dojo/i18n!../nls/jsapi",
  "dojo/text!./templates/MultidimensionalFilter.html",
  "dojo/text!./templates/NumericDimensionItem.html",
  "dojo/text!./templates/TimeDimensionItem.html",
  "dojo/text!./templates/PagedDateTimeWidget.html",
  "dojo/text!./templates/PagedNumberWidget.html",
  "dojo/store/Memory",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "dijit/form/DateTextBox",
  "dijit/registry",
  "dojo/date/locale",
  "dojo/dom-style",
  "dojo/query",
  "dojo/html",
  "dojo/dom",
  "dijit/form/FilteringSelect",
  "dijit/form/ComboBox",
  "dojox/widget/YearlyCalendar",
  "dojox/widget/MonthlyCalendar",
  "dojox/widget/Calendar3Pane",

  "../layers/support/DimensionalDefinition",
  "../layers/support/MosaicRule",

  "dijit/Tooltip",
  "dijit/form/CheckBox",
  "dijit/form/Button"
], 
  
function(
  declare, lang, array, topic, jsapiBundle, template, numericItemtemplate, timeItemtemplate, pagedDateTimeWidgettemplate, pagedNumberWidgettemplate, Memory, _WidgetBase,
  _TemplatedMixin, _WidgetsInTemplateMixin, DateTextBox, registry, locale, domStyle, query, html, dom, FilteringSelect, ComboBox, YearlyCalendar, MonthlyCalendar, Calendar,
  DimensionalDefinition, MosaicRule
  ) {
        
    var PagedDateTimeWidget = declare("PagedDateTimeWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        pageCount: 100,
        dimension: '',
        start: '',
        _currentIndex: '',
        displayDate: '',
        store: '',
        prefix: '',
        values: '',
        dateValue: '',
        changeTimeVal: '',
        intervalInfo: {},
        templateString: pagedDateTimeWidgettemplate,
        constructor: function (options) {
            declare.safeMixin(this, options);
            this._i18n = jsapiBundle;
        },
        _setValuesAttr: function () {
            if (this.displayDate) {
                this._currentIndex = array.indexOf(this.values,this.displayDate);
            } else {
                this._currentIndex = 0;
            }
            
            this._checkButtons();
            this._populateValues();
        },
        _setDateValueAttr: function (value) {
            if (value) {
                this._currentIndex = array.indexOf(this.values, value);
                if (this._currentIndex != -1) {
                    this.dateValue = value;
                } else {
                    this.dateValue = this._snapToClosest(value);
                    this._currentIndex = array.indexOf(this.values, this.dateValue);
                }
            }
        },
        _checkButtons: function () {
            if (this.values.length == 1) {
                this._setButtonProperties(true, "default", true, "default", true, "default", true, "default");
            } else if (this._currentIndex == 0) {
                this._setButtonProperties(true, "default", true, "default", false, "pointer", false, "pointer");
            } else if (this._currentIndex == this.values.length - 1) {
                this._setButtonProperties(false, "pointer", false, "pointer", true, "default", true, "default");
            } else {
                this._setButtonProperties(false, "pointer", false, "pointer", false, "pointer", false, "pointer");
            }
        },
        _setButtonProperties: function (sbdisabled, sbcursor, pbdisabled, pbcursor, nbdisabled, nbcursor, ebdisabled, ebcursor) {
            this.StartBtn.set("disabled", sbdisabled);
            domStyle.set(this.StartBtn.iconNode, "cursor", sbcursor);
            this.PreviousBtn.set("disabled", pbdisabled);
            domStyle.set(this.PreviousBtn.iconNode, "cursor", pbcursor);
            this.NextBtn.set("disabled", nbdisabled);
            domStyle.set(this.NextBtn.iconNode, "cursor", nbcursor);
            this.EndBtn.set("disabled", ebdisabled);
            domStyle.set(this.EndBtn.iconNode, "cursor", ebcursor);
        },
        _getTimeArray: function () {
            var timeArray = [],
                    index,
                    timeVal,
                    startTime,
                    endTime;

            startTime = parseInt(new Date(this.values[this._currentIndex]).getTime(), 10);
            endTime = parseInt(new Date(this.values[this._currentIndex]).getTime() + 86400000, 10);

            for (index = 0; index < this.values.length; index++) {
                if (this.values[index] >= startTime && this.values[index] < endTime) {
                    timeVal = locale.format(this._getUTCTime(new Date(this.values[index])), {timePattern: "hh:mm a", selector: "time"});
                    timeArray.push({
                        id: this.values[index],
                        label: timeVal
                    });
                } else {
                    if (timeArray.length != 0) {
                        break;
                    }
                }
            }
            return timeArray;
        },
        _updateTimeDropDown: function () {
            var timeArray = [],
                    timeStore;

            timeArray = this._getTimeArray();

            this.timeSelect.reset();
            timeStore = new Memory({
                data: timeArray,
                idProperty: 'id'
            });

            this.timeSelect.set({'store': timeStore,
                'value': this.values[this._currentIndex]});
        },
        _populateValues: function () {
            var timeArray = [],
                    timeStore,
                    timeSelectId,
                    minDate,
                    maxDate,
                    currentDate;

            currentDate = locale.format(this._getUTCTime(new Date(this.values[this._currentIndex])), {datePattern: "yyyy-MM-dd", selector: "date"});

            timeArray = this._getTimeArray();

            minDate = locale.format(this._getUTCTime(new Date(this.values[0])), {datePattern: "yyyy-MM-dd", selector: "date"});
            maxDate = locale.format(this._getUTCTime(new Date(this.values[this.values.length - 1])), {datePattern: "yyyy-MM-dd", selector: "date"});

            this.dateSelect = new DateTextBox({
                value: currentDate,
                id: this.prefix + this.dimension + "Date",
                constraints: {min: minDate, max: maxDate},
                popupClass: Calendar,
                style: "width:95px;",
                "class": "dijitSelect esriMultidimensionalFilterVariableList"
            }, this.DateSelector);
            this.dateSelect.startup();

            this.dateSelect.on("change", lang.hitch(this, this._dateBoxChange));

            timeStore = new Memory({
                data: timeArray,
                idProperty: 'id'
            });

            timeSelectId = this.prefix + this.dimension + "Time";

            this.timeSelect = new FilteringSelect({
                store: timeStore,
                id: timeSelectId,
                value: this.displayDate,
                labelAttr: "label",
                labelType: "text",
                searchAttr: "label",
                style: "width:85px;",
                "class": "dijitSelect esriMultidimensionalFilterVariableList",
                maxHeight: -1
            }, this.TimeSelector);
            this.timeSelect.startup();

            this.timeSelect.on("change", lang.hitch(this, this._timeValueChange));
            this._checkCalendarControlView();
        },
        _checkCalendarControlView: function () {
            var timeVals = [],
                    years = [],
                    yrmonths = [],
                    year,
                    yrmonth,
                    timeVal,
                    i,
                    sampleCount;
            
            if (this.intervalInfo.intervalUnit) {
                if (this.intervalInfo.intervalUnit.toLowerCase() == "years") {
                    this.dateSelect.set("popupClass", YearlyCalendar);
                    domStyle.set(this.timeSelect.domNode, "display", "none");
                } else if (this.intervalInfo.intervalUnit.toLowerCase() == "months") {
                    this.dateSelect.set("popupClass", MonthlyCalendar);
                    domStyle.set(this.timeSelect.domNode, "display", "none");
                } else if (this.intervalInfo.intervalUnit.toLowerCase() == "days") {
                    this.dateSelect.set("popupClass", Calendar);
                    domStyle.set(this.timeSelect.domNode, "display", "none");
                } else {
                    this.dateSelect.set("popupClass", Calendar);
                }
            } else {
                sampleCount = (this.values.length < 12) ? this.values.length : 12;

                for (i = 0; i < sampleCount; i++) {
                    year = locale.format(this._getUTCTime(new Date(this.values[i])), {datePattern: "yyyy", selector: "date"});
                    yrmonth = locale.format(this._getUTCTime(new Date(this.values[i])), {datePattern: "yyyyMM", selector: "date"});
                    timeVal = locale.format(this._getUTCTime(new Date(this.values[i])), {timePattern: "HH:mm", selector: "time"});
                    if (array.indexOf(years,year) == -1) {
                        years.push(year);
                    }
                    if (array.indexOf(yrmonths,yrmonth) == -1) {
                        yrmonths.push(yrmonth);
                    }
                    if (array.indexOf(timeVals,timeVal) == -1) {
                        timeVals.push(timeVal);
                    }
                }

                if (years.length == sampleCount) {
                    this.dateSelect.set("popupClass", YearlyCalendar);
                    domStyle.set(this.timeSelect.domNode, "display", "none");
                } else if (yrmonths.length == sampleCount) {
                    this.dateSelect.set("popupClass", MonthlyCalendar);
                    domStyle.set(this.timeSelect.domNode, "display", "none");
                } else {
                    this.dateSelect.set("popupClass", Calendar);
                    if (timeVals.length == 1) {
                        domStyle.set(this.timeSelect.domNode, "display", "none");
                    }
                }
            }
        },
        _timeValueChange: function (value) {
            if (value) {
                this._currentIndex = array.indexOf(this.values,value);
                this._checkButtons();
            }
        },
        _updateValues: function () {
            var currentDate;

            currentDate = locale.format(this._getUTCTime(new Date(this.values[this._currentIndex])), {datePattern: "yyyy-MM-dd", selector: "date"});

            this.dateSelect.set("_onChangeActive", false);
            this.dateSelect.set("value", currentDate, false);
            this.dateSelect.set("_onChangeActive", true);

            this._updateTimeDropDown();
            this._checkButtons();
        },
        _getUTCTime: function (date) {
            if (date) {
                date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
            }
            return date;
        },
        _onStartBtnClick: function () {
            this._currentIndex = 0;
            this._updateValues();
        },
        _onPreviousBtnClick: function () {
            this._currentIndex--;
            this._updateValues();
        },
        _onNextBtnClick: function () {
            this._currentIndex++;
            this._updateValues();
        },
        _onEndBtnClick: function () {
            this._currentIndex = this.values.length - 1;
            this._updateValues();
        },
        _snapToClosest: function (date) {
            var minDiff,
                    diff,
                    closestValue,
                    index;

            minDiff = Math.abs(date - this.values[0]);
            closestValue = this.values[0];
            for (index = 1; index < this.values.length; index++) {
                diff = Math.abs(date - this.values[index]);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestValue = this.values[index];
                    this._currentIndex = index;
                }
            }

            return closestValue;

        },
        _dateBoxChange: function (value) {
            var timeArray = [],
                    currentValue,
                    currentDate,
                    timeStore;

            if (value) {
                currentValue = (new Date(value).getTime() > 0) ? new Date(value).getTime() : new Date(value).getTime() + 86399999;
                currentDate = this._snapToClosest(parseInt(currentValue, 10));
                this.dateSelect.set("_onChangeActive", false);
                this.dateSelect.set("value", locale.format(this._getUTCTime(new Date(currentDate)), {datePattern: "yyyy-MM-dd", selector: "date"}));
                this.dateSelect.set("_onChangeActive", true);
                if (locale.format(this._getUTCTime(new Date(currentDate)), {datePattern: "yyyy-MM-dd", selector: "date"}) != locale.format(new Date(currentValue), {datePattern: "yyyy-MM-dd", selector: "date"})) {
                    this.dateSelect.focus();
                    this.dateSelect.set("message", this._i18n.widgets.multidimensionalFilter.dateSnapText);
                }
                timeArray = this._getTimeArray();
                this.timeSelect.reset();
                timeStore = new Memory({
                    data: timeArray,
                    idProperty: 'id'
                });

                this.timeSelect.set({'store': timeStore,
                    'value': timeArray[0].id});
                this._checkButtons();
            }
        }
    });
    
    var PagedNumberWidget = declare("PagedNumberWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        pageCount: 100,
        dimension: '',
        start: '',
        displayNum: '',
        store: '',
        prefix: '',
        values: '',
        numValue: '',
        intervalInfo: {},
        templateString: pagedNumberWidgettemplate,
        constructor: function (options) {
            declare.safeMixin(this, options);
            this._i18n = jsapiBundle;
        },
        _setValuesAttr: function () {
            if (this.displayNum || this.displayNum == 0) {
                this._currentIndex = array.indexOf(this.values,this.displayNum);
            } else {
                this._currentIndex = 0;
            }

            this._checkButtons();
            this._populateValues();
        },
        _setNumValueAttr: function (value) {
            if (value || value == 0) {
                this._currentIndex = array.indexOf(this.values,value);
                if (this._currentIndex != -1) {
                    this.numValue = value;
                } else {
                    this.numValue = this._snapToClosest(value);      
                    this._currentIndex = array.indexOf(this.values,this.numValue);
                }
                this._updateValues();
            }
        },
        _checkButtons: function () {
            if (this.values.length == 1) {
                this._setButtonProperties(true, "default", true, "default", true, "default", true, "default");
            } else if (this._currentIndex == 0) {
                this._setButtonProperties(true, "default", true, "default", false, "pointer", false, "pointer");
            } else if (this._currentIndex == this.values.length - 1) {
                this._setButtonProperties(false, "pointer", false, "pointer", true, "default", true, "default");
            } else {
                this._setButtonProperties(false, "pointer", false, "pointer", false, "pointer", false, "pointer");
            }
        },
        _setButtonProperties: function (sbdisabled, sbcursor, pbdisabled, pbcursor, nbdisabled, nbcursor, ebdisabled, ebcursor) {
            this.StartBtn.set("disabled", sbdisabled);
            domStyle.set(this.StartBtn.iconNode, "cursor", sbcursor);
            this.PreviousBtn.set("disabled", pbdisabled);
            domStyle.set(this.PreviousBtn.iconNode, "cursor", pbcursor);
            this.NextBtn.set("disabled", nbdisabled);
            domStyle.set(this.NextBtn.iconNode, "cursor", nbcursor);
            this.EndBtn.set("disabled", ebdisabled);
            domStyle.set(this.EndBtn.iconNode, "cursor", ebcursor);
        },
        _populateValues: function () {
            var selectData = [],
                    index,
                    store;

            for (index in this.values) {
                if (this.values.hasOwnProperty(index)) {
                    selectData.push({
                        id: this.values[index],
                        label: this.values[index]
                    });
                }
            }

            store = new Memory({
                data: selectData,
                idProperty: 'id'
            });

            this.numSelect = new ComboBox({
                store: store,
                id: this.prefix + this.dimension + "Value",
                value: this.displayNum,
                labelAttr: "label",
                labelType: "text",
                searchAttr: "label",
                pageSize: this.pageCount,
                scrollOnFocus: true,
                style: "width:95px;",
                "class": "dijitSelect esriMultidimensionalFilterVariableList",
                maxHeight: -1
            }, this.NumberSelector);
            this.numSelect.startup();

            this.numSelect.on("change", lang.hitch(this, this._numValueChange));
        },
        _snapToClosest: function (value) {
            var minDiff,
                    diff,
                    closestValue,
                    index;

            minDiff = Math.abs(value - this.values[0]);
            closestValue = this.values[0];
            for (index = 1; index < this.values.length; index++) {
                diff = Math.abs(value - this.values[index]);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestValue = this.values[index];
                    this._currentIndex = index;
                }
            }

            return closestValue;
        },
        _numValueChange: function (value) {
            var newVal;

            if (value) {
                newVal = this._snapToClosest(value);
                this.numSelect.set("_onChangeActive", false);
                this.numSelect.set("value", newVal);
                this.numSelect.set("_onChangeActive", true);
                if (value != newVal) {
                    this.numSelect.focus();
                    this.numSelect.set("message", this._i18n.widgets.multidimensionalFilter.numSnapText);
                }
                this._currentIndex = array.indexOf(this.values,newVal);
                this._checkButtons();
            }
        },
        _updateValues: function () {
            this.numSelect.set("value", this.values[this._currentIndex]);
            this._checkButtons();
        },
        _onStartBtnClick: function () {
            this._currentIndex = 0;
            this._updateValues();
        },
        _onPreviousBtnClick: function () {
            this._currentIndex--;
            this._updateValues();
        },
        _onNextBtnClick: function () {
            this._currentIndex++;
            this._updateValues();
        },
        _onEndBtnClick: function () {
            this._currentIndex = this.values.length - 1;
            this._updateValues();
        }
    });
            
    var DateItem = declare('DateItem', [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        dimension: '',
        fromText: '',
        toText: '',
        fromDateValue: '',
        toDateValue: '',
        valueCount: '',
        values: [],
        dimensionAlias: '',
        unit: '',
        dateStore: {},
        disabled: false,
        intervalInfo: {},
        templateString: timeItemtemplate,
        constructor: function (options) {
            declare.safeMixin(this, options);
            this._i18n = jsapiBundle;
            this.fromText = this._i18n.widgets.multidimensionalFilter.fromTimeText;
            this.toText = this._i18n.widgets.multidimensionalFilter.toTimeText;
        },
        _onRangeCheckboxChange: function (value) {
            if (!value) {
                domStyle.set(this[this.dimension + "MaxRow"], "display", "none");
                html.set(dom.byId("min" + this.dimension + "DateText"), this._i18n.widgets.multidimensionalFilter.sliceTimeText);
            } else {
                domStyle.set(this[this.dimension + "MaxRow"], "display", "table-row");
                html.set(dom.byId("min" + this.dimension + "DateText"), this._i18n.widgets.multidimensionalFilter.fromTimeText);
            }
        },
        _onDimensionCheckboxChange: function (value) {
            if (value) {
                if (registry.byId(this.dimension + "RangeCheckbox").get("checked")) {
                    domStyle.set(this[this.dimension + "MaxRow"], "display", "table-row");
                } else {
                    domStyle.set(this[this.dimension + "MaxRow"], "display", "none");
                }
                domStyle.set(this[this.dimension + "MinRow"], "display", "table-row");
                domStyle.set(this[this.dimension + "RangeSpan"], "display", "inline");
            } else {
                domStyle.set(this[this.dimension + "MaxRow"], "display", "none");
                domStyle.set(this[this.dimension + "MinRow"], "display", "none");
                domStyle.set(this[this.dimension + "RangeSpan"], "display", "none");
            }
        },
        _setUnitAttr: function (value) {
            if (value) {
                if (value.indexOf("ISO8601") > -1) {
                    this.unit = value.replace("ISO8601", "UTC");
                }
                html.set(this.dimensionUnit, "(" + this.unit + ")");
                html.set(this.tooltipUnit, "<br/>   <span class='tooltipLeftText'>Unit:</span> " + this.unit);
            }
        },
        _setDisabledAttr: function (value) {
            if (!this.hasRanges) {
                if (value) {
                    registry.byId(this.dimension).set("checked", false);
                    registry.byId(this.dimension).set("disabled", true);
                    domStyle.set(this.dimensionAlias, "color", "#969696");
                    domStyle.set(this.dimensionUnit, "color", "#969696");
                    html.set(this.disabledDimText, "<br/>" + this._i18n.widgets.multidimensionalFilter.disabledTimeDimensionText);
                } else {
                    registry.byId(this.dimension).set("checked", true);
                    registry.byId(this.dimension).set("disabled", false);
                    domStyle.set(this.dimensionAlias, "color", "#000000");
                    domStyle.set(this.dimensionUnit, "color", "#000000");
                    html.set(this.disabledDimText, "");
                }
            }
        },
        _updateTooltip: function () {
            this.fromValue = locale.format(this._getUTCTime(new Date(this.values[0])), {datePattern: "MM/dd/yyyy", timePattern: "hh:mm:ss a"});
            this.toValue = locale.format(this._getUTCTime(new Date(this.values[this.values.length - 1])), {datePattern: "MM/dd/yyyy", timePattern: "hh:mm:ss a"});
            this.valueCount = this.values.length;

            html.set(this.tooltipFromValue, this.fromValue.toString());
            html.set(this.tooltipToValue, this.toValue.toString());
            html.set(this.tooltipValueCount, this.valueCount.toString());
        },
        _createNewValues: function() {
            var newArr = [],
                    index;
            for (index in this.values) {
                if (array.indexOf(newArr, this.values[index][0]) == -1) {
                    newArr.push(this.values[index][0]);
                }
                if (array.indexOf(newArr, this.values[index][1]) == -1) {
                    newArr.push(this.values[index][1]);
                }
            }
            newArr.sort(function(a, b){return a-b;});
            return newArr;
        },
        _setValuesAttr: function (values) {
            var minBox,
                    maxBox;

            if (this.hasRanges) {
                values = this._createNewValues();
                this.values = values;
            }

            this._updateTooltip();

            minBox = new PagedDateTimeWidget({
                values: values,
                id: "min" + this.dimension + "DateTimeBox",
                dimension: this.dimension,
                prefix: "min",
                displayDate: values[0],
                intervalInfo: this.intervalInfo
            }, this.minDateSelector);
            minBox.startup();

            maxBox = new PagedDateTimeWidget({
                values: values,
                id: "max" + this.dimension + "DateTimeBox",
                dimension: this.dimension,
                prefix: "max",
                displayDate: values[values.length - 1],
                intervalInfo: this.intervalInfo
            }, this.maxDateSelector);
            maxBox.startup();

            if (this.hasRanges) {
                registry.byId(this.dimension + "RangeCheckbox").set("checked", "true");
                registry.byId(this.dimension + "RangeCheckbox").set("disabled", "true");
                if (this.disabled) {
                    registry.byId(this.dimension).set("checked", false);
                    registry.byId(this.dimension).set("disabled", true);
                    domStyle.set(this.dimensionAlias, "color", "#969696");
                    domStyle.set(this.dimensionUnit, "color", "#969696");
                    html.set(this.disabledDimText, "<br/>" + this._i18n.widgets.multidimensionalFilter.disabledTimeDimensionText);
                } else {
                    registry.byId(this.dimension).set("checked", true);
                    registry.byId(this.dimension).set("disabled", false);
                    domStyle.set(this.dimensionAlias, "color", "#000000");
                    domStyle.set(this.dimensionUnit, "color", "#000000");
                    html.set(this.disabledDimText, "");
                }
            }
        },
        _getUTCTime: function (date) {
            if (date) {
                date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
            }
            return date;
        }
    });

    var NumericItem = declare('NumericItem', [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        dimension: '',
        fromText: '',
        toText: '',
        valueCount: '',
        values: [],
        dimensionAlias: '',
        unit: '',
        disabled : false,
        intervalInfo: {},
        templateString: numericItemtemplate,
        constructor: function (options) {
            declare.safeMixin(this, options);
            this._i18n = jsapiBundle;
            this.fromText = this._i18n.widgets.multidimensionalFilter.fromNumericText;
            this.toText = this._i18n.widgets.multidimensionalFilter.toNumericText;
        },
        _onRangeCheckboxChange: function (value) {
            if (!value) {
                domStyle.set(this[this.dimension + "MaxRow"], "display", "none");
                html.set(dom.byId("min" + this.dimension + "ValueText"), this._i18n.widgets.multidimensionalFilter.sliceNumberText);
            } else {
                domStyle.set(this[this.dimension + "MaxRow"], "display", "table-row");
                html.set(dom.byId("min" + this.dimension + "ValueText"), this._i18n.widgets.multidimensionalFilter.fromNumericText);
            }
        },
        _onDimensionCheckboxChange: function (value) {
            if (value) {
                if (registry.byId(this.dimension + "RangeCheckbox").get("checked")) {
                    domStyle.set(this[this.dimension + "MaxRow"], "display", "table-row");
                } else {
                    domStyle.set(this[this.dimension + "MaxRow"], "display", "none");
                }
                domStyle.set(this[this.dimension + "MinRow"], "display", "table-row");
                domStyle.set(this[this.dimension + "RangeSpan"], "display", "inline");
            } else {
                domStyle.set(this[this.dimension + "MaxRow"], "display", "none");
                domStyle.set(this[this.dimension + "MinRow"], "display", "none");
                domStyle.set(this[this.dimension + "RangeSpan"], "display", "none");
            }
        },
        _updateTooltip: function () {
            this.fromValue = this.values[0];
            this.toValue = this.values[this.values.length - 1];
            this.valueCount = this.values.length;

            html.set(this.tooltipFromValue, this.fromValue.toString());
            html.set(this.tooltipToValue, this.toValue.toString());
            html.set(this.tooltipValueCount, this.valueCount.toString());
        },
        _setDisabledAttr: function (value) {            
            if (!this.hasRanges) {
                if (value) {
                    registry.byId(this.dimension).set("checked", false);
                    registry.byId(this.dimension).set("disabled", true);
                    domStyle.set(this.dimensionAlias, "color", "#969696");
                    domStyle.set(this.dimensionUnit, "color", "#969696");
                    html.set(this.disabledDimText, "<br/>" + this._i18n.widgets.multidimensionalFilter.disabledNumericDimensionText);
                } else {
                    registry.byId(this.dimension).set("checked", true);
                    registry.byId(this.dimension).set("disabled", false);
                    domStyle.set(this.dimensionAlias, "color", "#000000");
                    domStyle.set(this.dimensionUnit, "color", "#000000");
                    html.set(this.disabledDimText, "");
                }
            }
        },
        _createNewValues: function() {
            var newArr = [],
                    index;
            for (index in this.values) {
                if (array.indexOf(newArr, this.values[index][0]) == -1) {
                    newArr.push(this.values[index][0]);
                }
                if (array.indexOf(newArr, this.values[index][1]) == -1) {
                    newArr.push(this.values[index][1]);
                }
            }
            newArr.sort(function(a, b){return a-b;});
            return newArr;
        },
        _setValuesAttr: function (values) {
            var minBox,
                    maxBox;
            
            if(this.hasRanges) {
                values = this._createNewValues();
                this.values = values;
            }

            this._updateTooltip();

            minBox = new PagedNumberWidget({
                values: values,
                id: "min" + this.dimension + "NumberBox",
                dimension: this.dimension,
                prefix: "min",
                displayNum: values[0],
                intervalInfo: this.intervalInfo
            }, this.minNumberSelector);
            minBox.startup();

            maxBox = new PagedNumberWidget({
                values: values,
                id: "max" + this.dimension + "NumberBox",
                dimension: this.dimension,
                prefix: "max",
                displayNum: values[values.length - 1],
                intervalInfo: this.intervalInfo
            }, this.maxNumberSelector);
            maxBox.startup();
            
            if (this.hasRanges) {
                registry.byId(this.dimension + "RangeCheckbox").set("checked", "true");
                registry.byId(this.dimension + "RangeCheckbox").set("disabled", "true");
                if (this.disabled) {
                    registry.byId(this.dimension).set("checked", false);
                    registry.byId(this.dimension).set("disabled", true);
                    domStyle.set(this.dimensionAlias, "color", "#969696");
                    domStyle.set(this.dimensionUnit, "color", "#969696");
                    html.set(this.disabledDimText, "<br/>" + this._i18n.widgets.multidimensionalFilter.disabledNumericDimensionText);
                } else {
                    registry.byId(this.dimension).set("checked", true);
                    registry.byId(this.dimension).set("disabled", false);
                    domStyle.set(this.dimensionAlias, "color", "#000000");
                    domStyle.set(this.dimensionUnit, "color", "#000000");
                    html.set(this.disabledDimText, "");
                }
            }
        },
        _setUnitAttr: function (value) {
            if (value) {
                if (value.indexOf("esri") > -1) {
                    this.unit = value.replace("esri", "");
                }
                html.set(this.dimensionUnit, "(" + this.unit + ")");
                html.set(this.tooltipUnit, "<br/>   <span class='tooltipLeftText'>Unit:</span> " + this.unit);
            }
        }
    });

    var Widget = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        declaredClass: "esri.widgets.MultidimensionalFilter",
        templateString: template,
        widgetsInTemplate: true,
        layer: null, //layer on which the mosaic rule is set
        map: null, //map object
        hideApplyButton: false,
        _multidimensionalInfo: null,
        _variableStore: null,
        _variableData: [],
        _dimensionStore: null,
        _savedMultidimensionalDefinition: null,
        reset: 0,
        constructor: function (options) {
            declare.safeMixin(this, options);
            this._i18n = jsapiBundle;
        },
        startup: function () {
            this.inherited(arguments);
            topic.subscribe("onMultidimensionalFilterApply", lang.hitch(this, "_onClickApplyMultidimensionalFilter"));
            topic.subscribe("onMultidimensionalFilterReset", lang.hitch(this, "_onClickResetMultidimensionalFilter"));
        },
        postCreate: function () {
            this.variableList.on("change", lang.hitch(this, "_onVariableListChange"));
            if (this.hideApplyButton) {
                domStyle.set(this.applyButton.domNode, "display", "none");
            }
        },
        destroy: function () {
            this.inherited(arguments);
        },
        _setLayerAttr: function (value) {
            if (!value) {
                return;
            }

            this.inherited(arguments);
            this._cachedDimensions = null;
            this._dimensionStore = null;
            this.layer = value;

            var setupDefaults = lang.hitch(this, "_setupDefaults");
            if (this.layer.loaded) {
                this._setupDefaults();
            }
            else {
                this.layer.on("load", setupDefaults);
            }
        },
        _setupDefaults: function () {
            this.layer.getMultidimensionalInfo().then(lang.hitch(this, function (result) {
                this._multidimensionalInfo = result;
                this._setupVariableFilterDefaults();
            }), function (error) {
                return;
            });
            
            this.layer.getDefaultMultidimensionalDefinition().then(lang.hitch(this, function (result) {
                this.defaultMultidimensionalDefinition = result;
            }), function (error) {
                console.log(error);
            });
        },
        _computeDimensionUnion: function (variables) {
            var dimensionUnion = [],
                    i,
                    j,
                    k,
                    dimensions,
                    dimension,
                    match;

            if (!variables) {
                return;
            }

            for (i in variables) {
                if (variables.hasOwnProperty(i)) {
                    dimensions = variables[i].dimensions;
                    for (j in dimensions) {
                        if (dimensions.hasOwnProperty(j)) {
                            dimension = dimensions[j];
                            match = 0;
                            for (k in dimensionUnion) {
                                if (dimensionUnion.hasOwnProperty(k)) {
                                    if (dimension.name == dimensionUnion[k].name) {
                                        match = 1;
                                    }
                                }
                            }
                            if (!match) {
                                dimensionUnion.push(dimension);
                            }
                        }
                    }
                }
            }
            return dimensionUnion;
        },
        _setupVariableFilterDefaults: function () {
            if (!this.layer || !this._multidimensionalInfo) {
                return;
            }

            if (this._multidimensionalInfo.variables) {
                var variables = this._multidimensionalInfo.variables,
                        index,
                        nameText;

                this._variableData = [];
                this._variableData.push({
                    name: this._i18n.widgets.multidimensionalFilter.defaultVariableText,
                    label: "<html><body><section><table><tr><td><b>" + this._i18n.widgets.multidimensionalFilter.defaultVariableText + "</b></td></tr><tr><td><p style='white-space:pre-wrap;width:50ex'><i>No user-defined restriction on Variable.</i></p></td></tr></table></section></body></html",
                    dimensions: this._computeDimensionUnion(variables)
                });

                for (index in variables) {
                    if (variables.hasOwnProperty(index)) {
                        if (variables[index].unit) {
                            nameText = variables[index].name + " (" + variables[index].unit + ")";
                        } else {
                            nameText = variables[index].name;
                        }
                        this._variableData.push({
                            name: variables[index].name,
                            dimensions: variables[index].dimensions,
                            description: variables[index].description,
                            label: "<html><body><section><table><tr><td><b>" + nameText + "</b></td></tr><tr><td><p style='white-space:pre-wrap;width:50ex'><i>" + variables[index].description + "</i></p></td></tr></table></section></body></html>"
                        });
                    }
                }

                this._variableStore = new Memory({
                    data: this._variableData,
                    idProperty: 'name'
                });

                this.variableList.reset();
                this.variableList.set({'store': this._variableStore,
                    'labelAttr': "label",
                    'labelType': "html",
                    'value': this._variableData[0].name
                });

                this._savedMultidimensionalDefinition = null;

                if (this.layer.mosaicRule && this.layer.mosaicRule.multidimensionalDefinition && this.layer.mosaicRule.multidimensionalDefinition.length > 0) {
                    this._savedMultidimensionalDefinition = this.layer.mosaicRule.multidimensionalDefinition;
                    this._setVariableValueDefault();
                }
            } else {
                return;
            }
        },
        _setVariableValueDefault: function () {
            if (this._savedMultidimensionalDefinition[0].variableName) {
                var variableName = (this._savedMultidimensionalDefinition[0].variableName == "") ? this._i18n.widgets.multidimensionalFilter.defaultVariableText : this._savedMultidimensionalDefinition[0].variableName;
                if (this.variableList && this.reset && this.reset == 1) {
                    if (variableName != this.variableList.get("value")) {
                        this.variableList.set('value', variableName);
                    } else {
                        this._onVariableListChange();
                    }
                } else {
                    this.variableList.set('value', variableName);
                }
            }
        },
        _setCachedDimensionProperties: function () {
            var index,
                    j,
                    dimensionName;

            for (index in this._cachedDimensions) {
                if (this._cachedDimensions.hasOwnProperty(index)) {
                    dimensionName = index;
                    if (registry.byId(dimensionName)) {
                        this._cachedDimensions[index].selected = registry.byId(dimensionName).get("checked");
                        this._cachedDimensions[index].isSlice = !registry.byId(dimensionName + "RangeCheckbox").get("checked");
                        if (dimensionName.toLowerCase().indexOf("time") > -1) {
                            this._cachedDimensions[index].values = [Number(registry.byId("min" + dimensionName + "Time").get("value")), Number(registry.byId("max" + dimensionName + "Time").get("value"))];
                        } else {
                            this._cachedDimensions[index].values = [Number(registry.byId("min" + dimensionName + "Value").get("value")), Number(registry.byId("max" + dimensionName + "Value").get("value"))];
                        }
                    }
                }
            }
        },
        _onVariableListChange: function () {
            var selection = this.variableList.get("value"),
                    selectedVariable = this._variableStore.query({name: selection})[0],
                    dimensions = selectedVariable.dimensions,
                    index,
                    variableName;
            
            if(!this._cachedDimensions && this._dimensionStore) {
                this._cachedDimensions = {};
                for (index in this._variableData[0].dimensions) {
                    if (this._variableData[0].dimensions.hasOwnProperty(index)) {
                        this._cachedDimensions[this._variableData[0].dimensions[index].field] = {};
                    }
                }
            }

            if (this._cachedDimensions) {
                this._setCachedDimensionProperties();
            }

            this._dimensionStore = null;
            this._dimensionStore = new Memory({
                data: dimensions,
                idProperty: 'name'
            });

            this._createDimensionWidgets();

            if (this._cachedDimensions) {
                this._displayCachedProperties();
            } else if (this._savedMultidimensionalDefinition && this._savedMultidimensionalDefinition.length > 0) {
                variableName = (this._savedMultidimensionalDefinition[0].variableName == "") ? this._i18n.widgets.multidimensionalFilter.defaultVariableText : this._savedMultidimensionalDefinition[0].variableName;
                if (selection == variableName) {
                    this._setDimensionDefaults();
                }
            }
        },
        _createDimensionWidgets: function () {
            var index,
                    dataField,
                    dateItem,
                    numItem,
                    intervalInfo,
                    disabled,
                    hasRanges;

            this._destroyDimensionWidgets();
            for (index in this._dimensionStore.data) {
                if (this._dimensionStore.data.hasOwnProperty(index)) {
                    dataField = this._dimensionStore.data[index].field;
                    intervalInfo = {
                        hasRegularIntervals : this._dimensionStore.data[index].hasRegularIntervals,
                        interval : this._dimensionStore.data[index].interval,
                        intervalUnit : this._dimensionStore.data[index].intervalUnit
                    };
                    hasRanges = (this._dimensionStore.data[index].hasRanges && this._dimensionStore.data[index].hasRanges == true) ? true : false;
                    if (dataField == "StdTime") {
                        dateItem = new DateItem({
                            dimension: this._dimensionStore.data[index].name,
                            hasRanges: hasRanges,
                            dimensionAlias: this._returnFieldAlias(this._dimensionStore.data[index].name),
                            unit: this._dimensionStore.data[index].unit,
                            disabled: this.layer.useMapTime, 
                            intervalInfo: intervalInfo,
                            values: this._dimensionStore.data[index].values
                        });

                        dateItem.placeAt(this.dimensionFilterGrid);
                    } else if (dataField != "StdTime") {
                        disabled = this._isActiveDimension(this._dimensionStore.data[index].name);
                        numItem = new NumericItem({
                            dimension: this._dimensionStore.data[index].name,
                            hasRanges: hasRanges,
                            dimensionAlias: this._returnFieldAlias(this._dimensionStore.data[index].name),
                            unit: this._dimensionStore.data[index].unit,
                            disabled : disabled,
                            intervalInfo: intervalInfo,                          
                            values: this._dimensionStore.data[index].values
                        });

                        numItem.placeAt(this.dimensionFilterGrid);
                    }
                }
            }
        },
        _getUTCTime: function (date) {
            if (date) {
                date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
            }
            return date;
        },
        _destroyDimensionWidgets: function () {
            var widgets = registry.findWidgets(this.dimensionFilterGrid),
                    widget;

            for (widget in widgets) {
                if (widgets.hasOwnProperty(widget)) {
                    widgets[widget].destroyRecursive();              
                }
            }
        },
        _displayCachedProperties: function () {
            var dimensionStats = this._cachedDimensions,
                    i,
                    match,
                    index,
                    dimensionName,
                    isSlice,
                    values,
                    selected,
                    hasRanges;

            for (i in this._dimensionStore.data) {
                if (this._dimensionStore.data.hasOwnProperty(i)) {
                    match = 0;
                    for (index in dimensionStats) {
                        if (dimensionStats.hasOwnProperty(index)) {
                            if (index == this._dimensionStore.data[i].name && dimensionStats[index].values) {
                                match = 1;
                                dimensionName = index;
                                isSlice = dimensionStats[index].isSlice;
                                values = dimensionStats[index].values;
                                selected = dimensionStats[index].selected;
                                break;
                            }
                        }
                    }
                    if (match) {
                        if (dimensionName.toLowerCase().indexOf("time") > -1 && !this.layer.useMapTime) {
                            this._updateTimeDimensionValues(dimensionName, selected, isSlice, values[0], values[1]);
                        } else if (dimensionName.toLowerCase().indexOf("time") == -1 && !this._isActiveDimension(dimensionName)) {
                            this._updateNumericDimensionValues(dimensionName, selected, isSlice, values[0], values[1]);
                        }
                    } else {
                        dimensionName = this._dimensionStore.data[i].name;
                        hasRanges = (this._dimensionStore.data[i].hasRanges && this._dimensionStore.data[i].hasRanges == true) ? true : false;
                        if ((dimensionName.toLowerCase().indexOf("time") == -1 && !this._isActiveDimension(dimensionName)) || (dimensionName.toLowerCase().indexOf("time") > -1 && !this.layer.useMapTime)) {
                            if (dimensionName.toLowerCase().indexOf("time") > -1) {
                                this._updateTimeDimensionValues(dimensionName, false, !hasRanges, this._dimensionStore.data[i].extent[0], this._dimensionStore.data[i].extent[1]);
                            } else {
                                this._updateNumericDimensionValues(dimensionName, false, !hasRanges, this._dimensionStore.data[i].extent[0], this._dimensionStore.data[i].extent[1]);
                            }
                        }
                    }
                }
            }
        },
        _isActiveDimension: function(dimensionName) {
          return ((this.layer.activeMapDimensions && this.layer.activeMapDimensions.length > 0 && array.indexOf(this.layer.activeMapDimensions,dimensionName) > -1));  
        },
        _setDimensionDefaults: function () {
            var dimensionStats = this._savedMultidimensionalDefinition,
                    snapped = 0,
                    i,
                    match,
                    index,
                    dimensionName,
                    isSlice,
                    valuesRange,
                    dimValues;

            for (i in this._dimensionStore.data) {
                if (this._dimensionStore.data.hasOwnProperty(i)) {
                    match = 0;
                    dimValues = this._dimensionStore.data[i].values;
                    for (index in dimensionStats) {
                        if (dimensionStats.hasOwnProperty(index)) {
                            if (dimensionStats[index].dimensionName == this._dimensionStore.data[i].name) {
                                match = 1;
                                dimensionName = dimensionStats[index].dimensionName;
                                isSlice = dimensionStats[index].isSlice;
                                valuesRange = dimensionStats[index].values;        
                                if ((array.indexOf(dimValues,valuesRange[0]) == -1) || (valuesRange.length == 2 && array.indexOf(dimValues,valuesRange[1]) == -1)) {
                                    snapped = 1;
                                }
                                break;
                            }
                        }
                    }
                    if (match) {
                        if (dimensionName.toLowerCase().indexOf("time") > -1 && !this.layer.useMapTime) {
                            if (isSlice) {
                                this._updateTimeDimensionValues(dimensionName, true, isSlice, valuesRange[0], this._dimensionStore.data[i].extent[1]);
                            } else {
                                this._updateTimeDimensionValues(dimensionName, true, isSlice, valuesRange[0], valuesRange[1]);
                            }
                        } else if (dimensionName.toLowerCase().indexOf("time") == -1 && !this._isActiveDimension(dimensionName)) {
                            if (isSlice) {
                                this._updateNumericDimensionValues(dimensionName, true, isSlice, valuesRange[0], this._dimensionStore.data[i].extent[1]);
                            } else {
                                this._updateNumericDimensionValues(dimensionName, true, isSlice, valuesRange[0], valuesRange[1]);
                            }
                        }
                    } else {
                        dimensionName = this._dimensionStore.data[i].name;
                        if ((dimensionName.toLowerCase().indexOf("time") == -1 && !this._isActiveDimension(dimensionName)) || (dimensionName.toLowerCase().indexOf("time") > -1 && !this.layer.useMapTime)) {
                            if (dimensionName.toLowerCase().indexOf("time") > -1) {
                                this._updateTimeDimensionValues(dimensionName, false, true, this._dimensionStore.data[i].extent[0], this._dimensionStore.data[i].extent[1]);
                            } else {
                                this._updateNumericDimensionValues(dimensionName, false, true, this._dimensionStore.data[i].extent[0], this._dimensionStore.data[i].extent[1]);
                            }
                        }
                    }
                }
            }
            if(snapped) {
                this._onClickApplyMultidimensionalFilter();
            }
            this.reset = 0;
        },
        _updateTimeDimensionValues: function(dimensionName, checked, isSlice, minTimeVal, maxTimeVal) {     
            registry.byId("min" + dimensionName + "DateTimeBox").set("dateValue", minTimeVal);
            registry.byId("max" + dimensionName + "DateTimeBox").set("dateValue", maxTimeVal);
            registry.byId(dimensionName + "RangeCheckbox").set("value", !isSlice);    
            registry.byId(dimensionName).set("checked", checked);
        },
        _updateNumericDimensionValues: function(dimensionName, checked, isSlice, minNumVal, maxNumVal) {     
            registry.byId("min" + dimensionName + "NumberBox").set("numValue", minNumVal);
            registry.byId("max" + dimensionName + "NumberBox").set("numValue", maxNumVal);  
            registry.byId(dimensionName + "RangeCheckbox").set("value", !isSlice);    
            registry.byId(dimensionName).set("checked", checked);
        },
        _returnFieldAlias: function (fieldName) {
            var layerFields = this.layer.fields,
                    index;

            for (index in layerFields) {
                if (layerFields.hasOwnProperty(index)) {
                    if (layerFields[index].name.toLowerCase() == fieldName.toLowerCase()) {
                        return layerFields[index].alias;
                    }
                }
            }
        },
        _onClickApplyMultidimensionalFilter: function () {
            var selectedDimensionCheckboxes = query("input[name=dimensionCheckbox]:checked"),
                    selectedDimensions = [],
                    i,
                    multidimensionalDefinition,
                    variableName,
                    index,
                    dimensionName,
                    mintime,
                    maxtime,
                    values,
                    time,
                    mosaicRule;

            for (i = 0; i < selectedDimensionCheckboxes.length; i++) {
                selectedDimensions.push(selectedDimensionCheckboxes[i].id);
            }
            multidimensionalDefinition = [];
            variableName = (registry.byId("variableList").get("value") == this._i18n.widgets.multidimensionalFilter.defaultVariableText) ? "" : registry.byId("variableList").get("value");

            for (index in selectedDimensions) {
                if (selectedDimensions.hasOwnProperty(index)) {
                    dimensionName = selectedDimensions[index];
                    if (registry.byId(dimensionName + "RangeCheckbox").get("value")) {
                        if (dimensionName.toLowerCase().indexOf("time") > -1) {
                            mintime = registry.byId("min" + dimensionName + "Time").get("value");
                            maxtime = registry.byId("max" + dimensionName + "Time").get("value");
                            values = [Number(mintime), Number(maxtime)];
                        } else {
                            values = [Number(registry.byId("min" + dimensionName + "Value").get("value")), Number(registry.byId("max" + dimensionName + "Value").get("value"))];
                        }
                    } else {
                        if (dimensionName.toLowerCase().indexOf("time") > -1) {
                            time = registry.byId("min" + dimensionName + "Time").get("value");
                            values = [Number(time)];
                        } else {
                            values = [Number(registry.byId("min" + dimensionName + "Value").get("value"))];
                        }
                    }
                    if ((dimensionName.toLowerCase().indexOf("time") == -1 && !this._isActiveDimension(dimensionName)) || (dimensionName.toLowerCase().indexOf("time") > -1 && !this.layer.useMapTime)) {
                        multidimensionalDefinition.push(new DimensionalDefinition({
                            variableName: variableName,
                            dimensionName: dimensionName,
                            isSlice: !registry.byId(dimensionName + "RangeCheckbox").get("value"),
                            values: values
                        }));
                    }
                }
            }

            if (this.layer.mosaicRule) {
                if (this.layer.mosaicRule.multidimensionalDefinition) {
                    for (index in this.layer.mosaicRule.multidimensionalDefinition) {
                        if (this.layer.mosaicRule.multidimensionalDefinition.hasOwnProperty(index)) {
                            dimensionName = this.layer.mosaicRule.multidimensionalDefinition[index].dimensionName;
                            if ((dimensionName.toLowerCase().indexOf("time") == -1 && this._isActiveDimension(dimensionName))) {
                                multidimensionalDefinition.push(this.layer.mosaicRule.multidimensionalDefinition[index]);
                            }
                        }
                    }
                }
            }

            if (this.layer.mosaicRule) {
                mosaicRule = this.layer.mosaicRule;
                mosaicRule.multidimensionalDefinition = multidimensionalDefinition;
            } else if (this.layer.defaultMosaicRule) {
                mosaicRule = this.layer.defaultMosaicRule;
                mosaicRule.multidimensionalDefinition = multidimensionalDefinition;
            } else {
                mosaicRule = new MosaicRule({multidimensionalDefinition: []});
            }
            this.layer.setMosaicRule(mosaicRule);
        },
        _onClickResetMultidimensionalFilter: function () {
            var index,
                    dimensionName,
                    mosaicRule,
                    multidimensionalDefinition = [];
            
            if (this.defaultMultidimensionalDefinition && this.reset == 0) {
                this.reset = 1;
                this._cachedDimensions = null;
                for (index in this.defaultMultidimensionalDefinition) {
                    if (this.defaultMultidimensionalDefinition.hasOwnProperty(index)) {
                        dimensionName = this.defaultMultidimensionalDefinition[index].dimensionName;
                        if ((dimensionName.toLowerCase().indexOf("time") == -1 && !this._isActiveDimension(dimensionName)) || (dimensionName.toLowerCase().indexOf("time") > -1 && !this.layer.useMapTime)) {
                            multidimensionalDefinition.push(this.defaultMultidimensionalDefinition[index]);
                        }
                    }
                }
                if (this.layer.mosaicRule) {
                    if (this.layer.mosaicRule.multidimensionalDefinition) {
                        for (index in this.layer.mosaicRule.multidimensionalDefinition) {
                            if (this.layer.mosaicRule.multidimensionalDefinition.hasOwnProperty(index)) {
                                dimensionName = this.layer.mosaicRule.multidimensionalDefinition[index].dimensionName;
                                if ((dimensionName.toLowerCase().indexOf("time") == -1 && this._isActiveDimension(dimensionName))) {
                                    multidimensionalDefinition.push(this.layer.mosaicRule.multidimensionalDefinition[index]);
                                }
                            }
                        }
                    }
                }
                if(multidimensionalDefinition.length == 0) {
                    multidimensionalDefinition = this.defaultMultidimensionalDefinition;
                }
                
                if (this.layer.mosaicRule) {
                    mosaicRule = this.layer.mosaicRule;
                    mosaicRule.multidimensionalDefinition = multidimensionalDefinition;
                } else if (this.layer.defaultMosaicRule) {
                    mosaicRule = this.layer.defaultMosaicRule;
                    mosaicRule.multidimensionalDefinition = multidimensionalDefinition;
                } else {
                    mosaicRule = new MosaicRule({multidimensionalDefinition: []});
                }

                this.layer.setMosaicRule(mosaicRule);
                this._savedMultidimensionalDefinition = multidimensionalDefinition;
                if (this._savedMultidimensionalDefinition) {
                    this._dimensionStore = null;
                    this._setVariableValueDefault();
                }
            }
        }
    });

  return Widget;
});
