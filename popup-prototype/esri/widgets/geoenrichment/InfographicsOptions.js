define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/string",
    "../../tasks/geoenrichment/studyAreaOptionsFromJson",
    "../../tasks/geoenrichment/GeoenrichmentTask",
    "./lang",
    "./config",
    "./InfographicsOptionsItem"

], function(
    declare,
    lang,
    Deferred,
    string,
    studyAreaOptionsFromJson,
    GeoenrichmentTask,
    esriLang,
    config,
    InfographicsOptionsItem
) {

    var InfographicsOptions = declare("esri.widgets.geoenrichment.InfographicsOptions", null, {

        _items: null,
        _loaded: null,

        studyAreaOptions: null,
        theme: "common", //either "common" or "light"

        constructor: function (json) {
            this._loaded = {};

            this.studyAreaOptions = studyAreaOptionsFromJson(json && (json.buffer || json.studyAreaOptions));

            this._items = {};
            if (json) {
                copy(json.reports || json.items, this._items);

                if (json.theme) {
                    this.theme = json.theme;
                }
            }
        },

        toJson: function () {

            var items = {};
            copy(this._items, items);

            return {
                studyAreaOptions: this.studyAreaOptions.toJson(),
                items: items,
                theme: this.theme
            };
        },

        getItems: function (countryID) {
            var deferred = new Deferred();

            if (this._loaded[countryID]) {
                deferred.resolve(this._items[countryID]);
            }
            else {
                var task = new GeoenrichmentTask(config.server);
                task.token = config.token;
                task.getDataCollections(countryID, null, ["id", "alias"]).then(
                    lang.hitch(this, this._mergeItems, countryID, deferred),
                    function (error) { deferred.reject(error); });
            }

            return deferred.promise;
        },

        _mergeItems: function (countryID, deferred, dataCollections) {

            try {
                //
                //1. Construct items array from server using <infographics> tag in data collections
                //
                var i, item;
                var serverReports = [];
                for (i = 0; i < dataCollections.length; i++) {
                    var infoStr = dataCollections[i].metadata.infographics;
                    if (!infoStr) {
                        continue;
                    }
                    var info = JSON.parse(infoStr);
                    for (var id in info) {
                        if (info.hasOwnProperty(id)) {
                            var report = new InfographicsOptionsItem(id, [dataCollections[i].id + ".*"]);
                            for (var prop in info[id]) {
                                if (info[id].hasOwnProperty(prop)) {
                                    report[prop] = info[id][prop];
                                }
                            }
                            item = find(serverReports, report);
                            if (item) {
                                serverReports[item.index] = report;
                            }
                            else {
                                serverReports.push(report);
                            }
                        }
                    }
                }

                //
                //2. Merge reports from server into this._items
                //
                var allVariables;
                var dcById;
                function buildIndex() {
                    allVariables = {};
                    dcById = {};
                    for (var i = 0; i < dataCollections.length; i++) {
                        dcById[dataCollections[i].id] = dataCollections[i];
                        for (var j = 0; j < dataCollections[i].variables.length; j++) {
                            allVariables[dataCollections[i].id + "." + dataCollections[i].variables[j].id] = dataCollections[i].variables[j];
                        }
                    }
                }
                function getVariable(fullName) {
                    if (!allVariables) {
                        buildIndex();
                    }
                    return allVariables[fullName];
                }
                var thisReports = this._items[countryID];
                if (!thisReports) {
                    thisReports = [];
                    thisReports.push(new InfographicsOptionsItem("OneVar", ["KeyGlobalFacts.AVGHHSZ"]));
                    this._items[countryID] = thisReports;
                }
                for (i = thisReports.length - 1; i >= 0; i--) {
                    item = find(serverReports, thisReports[i]);
                    if (!item) {
                        if (thisReports[i].type == "OneVar" && thisReports[i].variables.length == 1) {
                            var fullName = thisReports[i].variables[0];
                            var variable = getVariable(fullName);
                            if (variable) {
                                thisReports[i].title = variable.alias;
                                continue;
                            }
                        }

                        thisReports.splice(i, 1);
                        i--;
                    }
                    else {
                        save(thisReports[i], item.report);
                        thisReports[i] = item.report;
                        serverReports.splice(item.index, 1);
                    }
                }
                for (i = 0; i < serverReports.length; i++) {
                    thisReports.push(serverReports[i]);
                }
                thisReports.sort(compare);

                this._loaded[countryID] = true;
                deferred.resolve(thisReports);
            }
            catch (error) {
                deferred.reject(error);
            }
        }

    });

    function compare(report1, report2) {
        var key1 = parseFloat(report1.index);
        var key2 = parseFloat(report2.index);
        if (isNaN(key1) && isNaN(key2)) {
            return 0;
        }
        if (isNaN(key1)) {
            return 1;
        }
        if (isNaN(key2)) {
            return -1;
        }
        return key1 - key2;
    }

    function find(reports, report) {
        for (var i = 0; i < reports.length; i++) {
            var found = reports[i];
            if (found.type == report.type && esriLang.arraysEqual(found.variables, report.variables)) {
                return {
                    report: found,
                    index: i
                };
            }
        }
        return null;
    }

    function copy(source, target) {
        if (!source) {
            return;
        }
        for (var countryID in source) {
            if (source.hasOwnProperty(countryID)) {
                target[countryID] = [];
                for (var i = 0; i < source[countryID].length; i++) {
                    var sourceReport = source[countryID][i];
                    var targetReport = {};
                    save(sourceReport, targetReport);
                    target[countryID].push(targetReport);
                }
            }
        }
    }

    function save(source, target) {
        //
        //This function copies serializable properties and ensures backwards compatibility
        //

        target.type = source.type || (source.report == "OneVarMultiComparison" ? "OneVar" : source.report);
        if (source.dataCollection) {
            if (source.vars) {
                target.variables = [];
                for (var i = 0; i < source.vars.length; i++) {
                    target.variables.push(source.dataCollection + "." + source.vars[i]);
                }
            }
            else {
                target.variables = [source.dataCollection + ".*"];
            }
        }
        else {
            target.variables = source.variables;
        }
        if (esriLang.isBoolean(source.isVisible)) {
            target.isVisible = source.isVisible;
        } else if (esriLang.isBoolean(source.checked)) {
            target.isVisible = source.checked;
        }
    }

    InfographicsOptions.Item = InfographicsOptionsItem;

    return InfographicsOptions;
});
