define([
    "require",
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/Deferred",
    "./_WizardPage",
    "dojo/i18n!../../nls/jsapi",
    "dojo/text!./templates/InfographicsMainPage.html",
    "../../tasks/geoenrichment/GeoenrichmentTask",
    "./config",
    "./_Invoke",
    "./CheckList",
    "./theme",
    "./DataBrowser/autoTooltip",

    "dijit/layout/ContentPane",
    "dijit/form/Select",
    "./BufferOptions"

], function (require, declare, lang, on, domConstruct, domClass, Deferred, _WizardPage, nls, template, GeoenrichmentTask, config, _Invoke, CheckList, theme, autoTooltip) {
    nls = nls.geoenrichment.dijit.InfographicsMainPage;

    var LOADING = "_";

    var TiledList = declare([CheckList], {

        renderRow: function (dataItem, options) {

            var item = dataItem.item;
            var itemRoot = domConstruct.create("div", { "class": "InfographicsMainPage_Item" }, this.itemsDiv);
            domConstruct.create("div", { "class": "dijit dijitInline dijitCheckBox InfographicsMainPage_ItemCheck" }, itemRoot);
            var label = domConstruct.create("div", { "class": "InfographicsMainPage_ItemLabel TrimWithEllipses", innerHTML: item.title }, itemRoot);
            domConstruct.create("div", {
                "class": "InfographicsMainPage_ItemImage InfographicsMainPage_ItemImage_" + item.type
            }, label);
            return itemRoot;
        }
    });

    var InfographicsMainPage = declare("esri.widgets.geoenrichment.InfographicsMainPage", [_WizardPage, _Invoke], {
        templateString: template,
        nls: nls,

        options: null,
        countryID: "US",

        _varList: null,

        _eventMap: {
            "add-variables": true,
            "ok": true,
            "cancel": true
        },

        constructor: function () {
            this._task = new GeoenrichmentTask(config.server);
            this._task.token = config.token;
        },

        buildRendering: function () {
            this.inherited(arguments);

            var onSelect = lang.hitch(this, this.invoke, "_onSelect");
            var list = this._varList = new TiledList({}, this.varListNode);
            list.on("dgrid-select", onSelect);
            list.on("dgrid-deselect", onSelect);

            autoTooltip(this.varListNode);
        },

        startup: function () {
            this.inherited(arguments);

            this.countrySelect.addOption({ value: LOADING, label: nls.loading });
            this.countrySelect.set("disabled", true);
            this.resize();

            this.showProgress(this._task.getAvailableCountries(), "_onCountriesResponse");
        },

        _onCountriesResponse: function (countries) {
            this.countrySelect.set("disabled", false);
            var options = [];
            for (var i = 0; i < countries.length; i++) {
                var id = countries[i].id;
                var country = countries[i].name;
                options.push({ label: country, value: id });
            }
            this.countrySelect.set("options", options);
            this.countrySelect.set("value", this.countryID);
        },

        _setOptionsAttr: function (options) {
            this._set("options", options);
            this.themeSelect.set("value", options.theme);
            this.bufferOptions.set("buffer", options.studyAreaOptions);
            this._renderItems();
        },

        _onCountryChanged: function () {
            this.countryID = this.countrySelect.get("value");
            this._renderItems();
        },

        _onThemeChange: function (select, evt) {
            var oldTheme = this.options.theme;
            var newTheme = this.themeSelect.get("value");
            theme.change(this.varListNode, oldTheme, newTheme);
            this.options.theme = newTheme;
        },

        _renderItems: function () {
            var country = this.countrySelect.get("value");
            if (!country || country == LOADING) {
                return;
            }
            this.showProgress(this.options.getItems(country), "_onGetItems");
        },

        _onGetItems: function (items) {
            var dataItems = [];
            var selected = [];
            var i;
            for (i = 0; i < items.length; i++) {
                var item = items[i];
                var id = i.toString();
                dataItems.push({
                    id: id,
                    item: item
                });
                if (item.isVisible) {
                    selected.push(id);
                }
            }
            this._varList.set("items", dataItems);
            this._varList.clearSelection();
            for (i = 0; i < selected.length; i++) {
                this._varList.select(selected[i]);
            }
            this.addMoreNode.style.display = "";
            this.resize();
        },

        _onSelect: function () {
            var anyChecked = false;
            var selection = this._varList.get("selection");
            for (var id in selection) {
                if (selection[id]) {
                    anyChecked = true;
                    break;
                }
            }
            this.okButton.disabled = !anyChecked;
        },

        _onBufferChange: function () {
            this.options.studyAreaOptions = this.bufferOptions.get("buffer");
        },

        _onAddVariables: function () {
            this.onAddVariables();
        },
        onAddVariables: function () { },

        _onOK: function () {
            var list = this._varList;
            var dataItems = list.get("store").data;
            for (var i = 0; i < dataItems.length; i++) {
                dataItems[i].item.isVisible = list.isSelected(dataItems[i]);
            }
            this.onOK();
        },
        onOK: function () { },

        _onCancel: function () {
            this.onCancel();
        },
        onCancel: function () { }

    });

    return InfographicsMainPage;

});