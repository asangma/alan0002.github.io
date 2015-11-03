define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/string",
    "./_Wizard",
    "./InfographicsOptions",
    "./InfographicsMainPage",
    "./DataBrowser",
    "./lang",
    "dojo/i18n!../../nls/jsapi"

], function (declare, lang, string, _Wizard, InfographicsOptions, InfographicsMainPage, DataBrowser, esriLang, nls) {
    nls = nls.geoenrichment.dijit.WizardButtons;

    var MAIN = "m";
    var DATA_BROWSER = "db";

    function isOneVarItem(report) {
        if (report.type != "OneVar") {
            return false;
        }
        if (report.variables.length != 1) {
            return false;
        }
        return true;
    }

    var InfographicsConfig = declare("esri.widgets.geoenrichment.InfographicsConfig", [_Wizard], {
        
        options: null,

        constructor: function () {
            this.pages[MAIN] = new InfographicsMainPage({
                onAddVariables: lang.hitch(this, this._addVariables),
                onOK: lang.hitch(this, this._onOK),
                onCancel: lang.hitch(this, this._onCancel)
            });
        },

        startup: function () {
            this.inherited(arguments);

            if (!this.options) {
                this.set("options", new InfographicsOptions());
            }

            this.loadPage(MAIN);
        },

        _setOptionsAttr: function (options) {
            this._set("options", options);
            this.pages[MAIN].set("options", options);
        },

        _getCountryIDAttr: function () {
            return this.pages[MAIN].get("countryID");
        },
        _setCountryIDAttr: function (countryID) {
            this.pages[MAIN].set("countryID", countryID);
        },

        _addVariables: function () {
            var self = this;
            var countryID = this.get("countryID");
            var dataBrowser = this.pages[DATA_BROWSER];
            if (!dataBrowser) {
                dataBrowser = new DataBrowser({
                    countryID: countryID,
                    countryBox: false,
                    multiSelect: true,
                    title: this.pages[MAIN].nls.mainTitle
                });
                dataBrowser.on("back", lang.hitch(this, this.loadPage, MAIN));
                dataBrowser.on("cancel", lang.hitch(this, this._onCancel));
                dataBrowser.on("ok", lang.hitch(this, this._applyVariables));
                this.pages[DATA_BROWSER] = dataBrowser;
            }
            else {
                dataBrowser.set("countryID", countryID);
            }

            var selection = [];
            
            this.options.getItems(countryID).then(function (items) {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (!isOneVarItem(item)) {
                        continue;
                    }
                    selection.push(item.variables[0]);
                }
                dataBrowser.set("selection", selection);

                self.loadPage(DATA_BROWSER);
            });
        },

        _applyVariables: function () {
            var self = this;
            var countryID = this.pages[MAIN].get("countryID");
            var dataCollections = this.pages[DATA_BROWSER].dataCollections[countryID];
            
            var dataCollectionByID = null;
            function getDataCollectionByID(id) {
                if (!dataCollectionByID) {
                    for (var i = 0; i < dataCollections.length; i++) {
                        dataCollectionByID[dataCollections[i].id] = dataCollections[i];
                    }
                }
                return dataCollectionByID[id];
            }

            var toAdd = {};
            var selection = this.pages[DATA_BROWSER].get("selection");
            for (var i = 0; i < selection.length; i++) {
                var fullName = selection[i];
                if (esriLang.endsWith(fullName, ".*")) {
                    var dataCollectionID = fullName.split(".")[0];
                    var dataCollection = getDataCollectionByID(dataCollectionByID);
                    var variables = dataCollection.variables;
                    for (var j = 0; j < variables.length; j++) {
                        toAdd[dataCollectionID + "." + variables[j].id] = true;
                    }
                }
                else {
                    toAdd[fullName] = true;
                }
            }

            this.options.getItems(countryID).then(function (items) {
                var i, item;
                for (i = items.length - 1; i >= 0; i--) {
                    item = items[i];
                    if (!isOneVarItem(item)) {
                        continue;
                    }
                    var name = item.variables[0];
                    if (toAdd[name]) {
                        toAdd[name] = false; //already there
                    }
                    else {
                        items.splice(i, 1); //was unchecked by user
                    }
                }
                for (i = 0; i < dataCollections.length; i++) {
                    var variables = dataCollections[i].variables;
                    for (var j = 0; j < variables.length; j++) {
                        var fullName = dataCollections[i].id + "." + variables[j].id;
                        if (toAdd[fullName]) {
                            item = new InfographicsOptions.Item("OneVar", [fullName]);
                            item.title = variables[j].alias;
                            items.push(item);
                        }
                    }
                }

                self.loadPage(MAIN);
                self.pages[MAIN].set("options", self.options);
            });
        },

        _onOK: function () {
            this.emit("ok");
        },

        _onCancel: function () {
            this.emit("cancel");
        }

    });

    return InfographicsConfig;

});